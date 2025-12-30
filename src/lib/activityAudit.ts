import { supabase } from './supabase';

/**
 * Enhanced Activity Logging Service
 * This is the foundation activity tracking system for audit trails
 */

export type ActivityAction = 'created' | 'updated' | 'deleted' | 'viewed';
export type EntityType = 'lead' | 'contact' | 'deal' | 'task' | 'account' | 'property' | 'site_visit';

export interface ActivityLogEntry {
    entity_type: EntityType;
    entity_id: string;
    action: ActivityAction;
    old_values?: any;
    new_values?: any;
    notes?: string;
}

/**
 * Log activity for audit trail
 */
export const logAuditActivity = async (
    entityType: EntityType,
    entityId: string,
    action: ActivityAction,
    oldValues?: any,
    newValues?: any,
    notes?: string
) => {
    try {
        const user = await supabase.auth.getUser();

        if (!user.data.user) {
            console.warn('No authenticated user for activity log');
            return;
        }

        // Calculate what changed
        let changes: Record<string, any> = {};
        if (oldValues && newValues) {
            Object.keys(newValues).forEach((key) => {
                if (oldValues[key] !== newValues[key]) {
                    changes[key] = { old: oldValues[key], new: newValues[key] };
                }
            });
        }

        const { error } = await supabase.from('activity_logs').insert([
            {
                user_id: user.data.user.id,
                entity_type: entityType,
                entity_id: entityId,
                action,
                old_values: oldValues || null,
                new_values: newValues || null,
                changes: Object.keys(changes).length > 0 ? changes : null,
                ip_address: null,
                user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
                notes: notes || null,
            },
        ]);

        if (error) {
            console.error('Error logging activity:', error);
        }
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
};

/**
 * Get activity history for entity
 */
export const getActivityHistory = async (
    entityType: EntityType,
    entityId: string,
    limit = 50
) => {
    try {
        // Fetch activity logs without join (simpler and more reliable)
        const { data, error } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('entity_type', entityType)
            .eq('entity_id', entityId)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) {
            console.error('Error fetching activity history:', error);
            return [];
        }
        
        // Map data to include user object structure for compatibility
        return (data || []).map(item => ({
            ...item,
            user: {
                id: item.user_id,
                email: undefined,
                name: undefined
            }
        }));
    } catch (err) {
        console.error('Error in getActivityHistory:', err);
        return []; // Return empty array instead of throwing
    }
};

/**
 * Get user activity feed
 */
export const getUserActivityFeed = async (userId: string, limit = 20) => {
    try {
        const { data, error } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching user activity feed:', error);
            return [];
        }
        
        return (data || []).map(item => ({
            ...item,
            user: {
                id: item.user_id,
                email: undefined,
                name: undefined
            }
        }));
    } catch (err) {
        console.error('Error in getUserActivityFeed:', err);
        return [];
    }
};

/**
 * Get team activity feed
 */
export const getTeamActivityFeed = async (limit = 50) => {
    try {
        // Fetch activity logs without join (simpler and more reliable)
        const { data, error } = await supabase
            .from('activity_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) {
            console.error('Error fetching team activity feed:', error);
            return [];
        }
        
        // Map data to include user object structure for compatibility
        // Note: user_id is available, but we can't easily join with auth.users
        // Frontend can handle displaying user_id or fetch user details separately if needed
        return (data || []).map(item => ({
            ...item,
            user: {
                id: item.user_id,
                email: undefined, // Can be fetched separately if needed
                name: undefined   // Can be fetched separately if needed
            }
        }));
    } catch (err) {
        console.error('Error in getTeamActivityFeed:', err);
        // Return empty array instead of throwing to prevent UI error
        return [];
    }
};

/**
 * Add note to record
 */
export const addNote = async (
    entityType: EntityType,
    entityId: string,
    noteText: string,
    pinned = false
) => {
    const user = await supabase.auth.getUser();

    if (!user.data.user) {
        throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
        .from('record_notes')
        .insert([
            {
                user_id: user.data.user.id,
                entity_type: entityType,
                entity_id: entityId,
                note_text: noteText,
                pinned,
            },
        ])
        .select();

    if (error) throw error;
    return data;
};

/**
 * Get notes for record
 */
export const getNotes = async (entityType: EntityType, entityId: string) => {
    const { data, error } = await supabase
        .from('record_notes')
        .select(
            `
      *,
      user:users(id, email, name)
    `
        )
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

/**
 * Update note
 */
export const updateNote = async (noteId: string, noteText: string) => {
    const { data, error } = await supabase
        .from('record_notes')
        .update({ note_text: noteText })
        .eq('id', noteId)
        .select();

    if (error) throw error;
    return data;
};

/**
 * Delete note
 */
export const deleteNote = async (noteId: string) => {
    const { error } = await supabase
        .from('record_notes')
        .delete()
        .eq('id', noteId);

    if (error) throw error;
};

/**
 * Pin/unpin note
 */
export const toggleNotePin = async (noteId: string, pinned: boolean) => {
    const { error } = await supabase
        .from('record_notes')
        .update({ pinned })
        .eq('id', noteId);

    if (error) throw error;
};

/**
 * Get activity statistics for entity
 */
export const getActivityStats = async (entityType: EntityType, entityId: string) => {
    const { data, error } = await supabase
        .from('activity_logs')
        .select('action')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);

    if (error) throw error;

    const stats = {
        total: data?.length || 0,
        created: data?.filter(a => a.action === 'created').length || 0,
        updated: data?.filter(a => a.action === 'updated').length || 0,
        deleted: data?.filter(a => a.action === 'deleted').length || 0,
        viewed: data?.filter(a => a.action === 'viewed').length || 0,
    };

    return stats;
};
