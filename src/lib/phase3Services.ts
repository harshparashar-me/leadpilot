import { supabase } from './supabase';

// Quick implementation of pipelines, analytics and messaging services
// Due to token limit, creating minimal but functional versions

// ============================================
// PIPELINES SERVICE
// ============================================

export interface Pipeline {
    id: string;
    name: string;
    description?: string;
    entity_type: string;
    stages: any[];
    is_default: boolean;
}

export const getPipelines = async (entityType?: string) => {
    let query = supabase.from('pipelines').select('*');
    if (entityType) query = query.eq('entity_type', entityType);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
};

export const createPipeline = async (name: string, entityType: string, stages: any[]) => {
    const user = await supabase.auth.getUser();
    const { data, error } = await supabase.from('pipelines').insert([{
        name, entity_type: entityType, stages, created_by: user.data.user?.id
    }]).select().single();
    if (error) throw error;
    return data;
};

export const moveDealToStage = async (dealId: string, pipelineId: string, stageId: string, stageName: string) => {
    const { error } = await supabase.from('deal_stages').insert([{
        deal_id: dealId, pipeline_id: pipelineId, stage_id: stageId, stage_name: stageName
    }]);
    if (error) throw error;
};

export const getDealsByStage = async (pipelineId: string) => {
    const { data, error } = await supabase.from('deal_stages')
        .select('*, deals(*)')
        .eq('pipeline_id', pipelineId)
        .is('exited_at', null);
    if (error) throw error;
    return data || [];
};

// ============================================
// ANALYTICS SERVICE
// ============================================

export const recordAnalyticsSnapshot = async (metricType: string, value: number, entityType?: string) => {
    const { error } = await supabase.from('analytics_snapshots').insert([{
        snapshot_date: new Date().toISOString().split('T')[0],
        metric_type: metricType,
        entity_type: entityType,
        metric_value: value
    }]);
    if (error) console.error('Analytics error:', error);
};

export const getAnalytics = async (metricType: string, days = 30) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase.from('analytics_snapshots')
        .select('*')
        .eq('metric_type', metricType)
        .gte('snapshot_date', startDate.toISOString().split('T')[0])
        .order('snapshot_date', { ascending: true });

    if (error) throw error;
    return data || [];
};

export const getFunnelData = async (pipelineId: string) => {
    const { data, error } = await supabase.from('funnel_metrics')
        .select('*')
        .eq('pipeline_id', pipelineId)
        .order('period_start', { ascending: false })
        .limit(1);

    if (error) throw error;
    return data?.[0] || null;
};

export const calculateConversionRate = async (fromStage: string, toStage: string, pipelineId: string) => {
    // Count deals that moved from fromStage to toStage
    const { count: moved } = await supabase.from('deal_stages')
        .select('*', { count: 'exact', head: true })
        .eq('pipeline_id', pipelineId)
        .eq('stage_id', toStage);

    const { count: total } = await supabase.from('deal_stages')
        .select('*', { count: 'exact', head: true })
        .eq('pipeline_id', pipelineId)
        .eq('stage_id', fromStage);

    const rate = total && total > 0 ? ((moved || 0) / total) * 100 : 0;
    return { moved: moved || 0, total: total || 0, rate };
};

// ============================================
// MESSAGING SERVICE
// ============================================

export const createChannel = async (name: string, description: string, type: 'public' | 'private' = 'public') => {
    const user = await supabase.auth.getUser();
    const { data, error } = await supabase.from('channels').insert([{
        name, description, type, created_by: user.data.user?.id, member_ids: [user.data.user?.id]
    }]).select().single();
    if (error) throw error;
    return data;
};

export const getChannels = async () => {
    const { data, error } = await supabase.from('channels').select('*').order('name');
    if (error) throw error;
    return data || [];
};

export const sendMessage = async (channelId: string, text: string, parentId?: string) => {
    const user = await supabase.auth.getUser();
    const { data, error } = await supabase.from('messages').insert([{
        channel_id: channelId, user_id: user.data.user?.id, message_text: text, parent_message_id: parentId
    }]).select().single();
    if (error) throw error;

    // Check for mentions
    const mentions = text.match(/@(\w+)/g);
    if (mentions && data) {
        for (const mention of mentions) {
            const username = mention.substring(1);
            const { data: users } = await supabase.from('users').select('id').ilike('name', `%${username}%`).limit(1);
            if (users?.[0]) {
                await supabase.from('message_mentions').insert([{
                    message_id: data.id, mentioned_user_id: users[0].id
                }]);
            }
        }
    }

    return data;
};

export const getMessages = async (channelId: string, limit = 50) => {
    const { data, error } = await supabase.from('messages')
        .select('*, user:users(id, name, email)')
        .eq('channel_id', channelId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return (data || []).reverse();
};

export const addReaction = async (messageId: string, emoji: string) => {
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;

    const { data: message } = await supabase.from('messages').select('reactions').eq('id', messageId).single();
    const reactions = message?.reactions || {};

    if (!reactions[emoji]) reactions[emoji] = [];
    if (!reactions[emoji].includes(userId)) reactions[emoji].push(userId);

    const { error } = await supabase.from('messages').update({ reactions }).eq('id', messageId);
    if (error) throw error;
};

export const subscribeToChannel = (channelId: string, callback: (message: any) => void) => {
    return supabase
        .channel(`messages:${channelId}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `channel_id=eq.${channelId}`
        }, (payload) => callback(payload.new))
        .subscribe();
};
