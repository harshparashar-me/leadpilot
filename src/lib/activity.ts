import { supabase } from "./supabase";

export type ActivityType =
    | 'CREATED'
    | 'UPDATED'
    | 'STATUS_CHANGE'
    | 'NOTE_ADDED'
    | 'CALL_LOGGED'
    | 'EMAIL_SENT'
    | 'MEETING_SCHEDULED'
    | 'FILE_UPLOADED';

export interface ActivityLog {
    lead_id: string;
    type: ActivityType;
    description: string;
    metadata?: Record<string, any>;
    user_name?: string; // For display
    created_at?: string;
}

/**
 * Logs an activity for a specific lead.
 */
export const logActivity = async (activity: ActivityLog) => {
    try {
        const { error } = await supabase
            .from('lead_activities')
            .insert({
                lead_id: activity.lead_id,
                type: activity.type,
                description: activity.description,
                metadata: activity.metadata || {},
                user_name: activity.user_name || 'System',
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error("Failed to log activity:", error);
        }
    } catch (err) {
        console.error("Exception in logActivity:", err);
    }
};
