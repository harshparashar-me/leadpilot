import { supabase } from './supabase';

// ============================================
// AI LEAD SCORING SERVICE
// ============================================

export interface LeadFeatures {
    engagement_score: number; // 0-100
    response_time_hours: number;
    email_opens: number;
    email_clicks: number;
    website_visits: number;
    budget: number;
    company_size?: number;
    industry?: string;
}

export const calculateLeadScore = async (leadId: string, features: LeadFeatures): Promise<number> => {
    // Simple scoring algorithm (in production, use ML model)
    let score = 0;

    // Engagement (40%)
    score += features.engagement_score * 0.4;

    // Budget (30%)
    if (features.budget > 100000) score += 30;
    else if (features.budget > 50000) score += 20;
    else if (features.budget > 10000) score += 10;

    // Activity (30%)
    score += Math.min(features.email_opens * 2, 15);
    score += Math.min(features.email_clicks * 3, 15);

    const finalScore = Math.min(Math.round(score), 100);

    // Store AI insight
    await supabase.from('ai_insights').insert([{
        entity_type: 'lead',
        entity_id: leadId,
        insight_type: 'lead_score',
        score: finalScore,
        confidence: 85,
        reasoning: { factors: ['engagement', 'budget', 'activity'] },
        recommendations: generateRecommendations(finalScore),
        model_version: 'v1.0'
    }]);

    return finalScore;
};

const generateRecommendations = (score: number): any[] => {
    if (score >= 80) return [{ action: 'schedule_call', priority: 'high' }];
    if (score >= 60) return [{ action: 'send_proposal', priority: 'medium' }];
    if (score >= 40) return [{ action: 'nurture_campaign', priority: 'low' }];
    return [{ action: 'low_priority_follow_up', priority: 'low' }];
};

export const getAIInsights = async (entityType: string, entityId: string) => {
    const { data, error } = await supabase.from('ai_insights')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('calculated_at', { ascending: false })
        .limit(1);

    if (error) throw error;
    return data?.[0] || null;
};

/**
 * Get all recent AI insights (for dashboard)
 */
export const getAllAIInsights = async (limit: number = 50) => {
    const { data, error } = await supabase.from('ai_insights')
        .select('*')
        .order('calculated_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data || [];
};

/**
 * Get AI insights summary statistics
 */
export const getAIInsightsStats = async () => {
    const { data, error } = await supabase
        .from('ai_insights')
        .select('score, insight_type, entity_type')
        .order('calculated_at', { ascending: false })
        .limit(1000);

    if (error) throw error;

    const insights = data || [];
    const avgScore = insights.length > 0 
        ? insights.reduce((sum, i) => sum + (i.score || 0), 0) / insights.length 
        : 0;
    
    const highValueLeads = insights.filter(i => (i.score || 0) >= 80).length;
    const leadScores = insights.filter(i => i.insight_type === 'lead_score').length;

    return {
        totalInsights: insights.length,
        averageScore: Math.round(avgScore),
        highValueLeads,
        leadScoresCount: leadScores
    };
};

// ============================================
// INTEGRATIONS SERVICE
// ============================================

export const createIntegration = async (name: string, type: string, credentials: any, config?: any) => {
    const user = await supabase.auth.getUser();
    const { data, error } = await supabase.from('integrations').insert([{
        name, type, credentials, config, created_by: user.data.user?.id, status: 'active'
    }]).select().single();

    if (error) throw error;
    return data;
};

export const getIntegrations = async () => {
    const { data, error } = await supabase.from('integrations').select('*').eq('status', 'active');
    if (error) throw error;
    return data || [];
};

export const syncIntegration = async (integrationId: string) => {
    const startTime = Date.now();

    try {
        // Mock sync - in production, call actual API
        const duration = Date.now() - startTime;

        await supabase.from('integration_logs').insert([{
            integration_id: integrationId,
            action: 'sync',
            status: 'success',
            duration_ms: duration
        }]);

        await supabase.from('integrations').update({
            last_sync_at: new Date().toISOString(),
            sync_status: 'success'
        }).eq('id', integrationId);

        return { success: true };
    } catch (error: any) {
        await supabase.from('integration_logs').insert([{
            integration_id: integrationId,
            action: 'sync',
            status: 'failed',
            error_message: error.message
        }]);

        throw error;
    }
};

// ============================================
// CALENDAR SERVICE
// ============================================

export const createCalendarEvent = async (
    title: string,
    startTime: Date,
    endTime: Date,
    description?: string,
    attendees?: string[],
    entityType?: string,
    entityId?: string
) => {
    const user = await supabase.auth.getUser();

    const { data, error } = await supabase.from('calendar_events').insert([{
        title,
        description,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        attendees,
        entity_type: entityType,
        entity_id: entityId,
        created_by: user.data.user?.id
    }]).select().single();

    if (error) throw error;
    return data;
};

export const getCalendarEvents = async (startDate: Date, endDate: Date) => {
    const { data, error } = await supabase.from('calendar_events')
        .select('*')
        .gte('start_time', startDate.toISOString())
        .lte('end_time', endDate.toISOString())
        .order('start_time');

    if (error) throw error;
    return data || [];
};

// ============================================
// SLACK INTEGRATION
// ============================================

export const sendSlackMessage = async (channelId: string, text: string, entityType?: string, entityId?: string) => {
    // In production, call Slack API
    const { data, error } = await supabase.from('slack_messages').insert([{
        channel_id: channelId,
        text,
        entity_type: entityType,
        entity_id: entityId,
        user_id: 'system'
    }]).select().single();

    if (error) throw error;
    return data;
};

export const getSlackMessages = async (entityType: string, entityId: string) => {
    const { data, error } = await supabase.from('slack_messages')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

// ============================================
// MOBILE SYNC SERVICE
// ============================================

export const logMobileSync = async (deviceId: string, deviceType: 'ios' | 'android', entitiesSynced: any) => {
    const user = await supabase.auth.getUser();

    await supabase.from('mobile_sync_logs').insert([{
        user_id: user.data.user?.id,
        device_id: deviceId,
        device_type: deviceType,
        sync_type: 'incremental',
        entities_synced: entitiesSynced,
        sync_status: 'success'
    }]);
};

export const getMobileSyncHistory = async (limit = 10) => {
    const user = await supabase.auth.getUser();

    const { data, error } = await supabase.from('mobile_sync_logs')
        .select('*')
        .eq('user_id', user.data.user?.id)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data || [];
};
