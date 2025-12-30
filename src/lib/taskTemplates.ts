import { supabase } from './supabase';

export interface TaskTemplate {
    id: string;
    name: string;
    description?: string;
    default_priority: 'low' | 'medium' | 'high' | 'urgent';
    default_due_offset_days?: number;
    default_assigned_to?: string;
    checklist_items?: string[];
    category?: string;
}

export interface RecurringTask {
    id: string;
    task_template_id: string;
    recurrence_pattern: 'daily' | 'weekly' | 'monthly' | 'custom';
    recurrence_config?: any;
    next_occurrence: string;
    enabled: boolean;
    assigned_to?: string;
}

/**
 * Create task template
 */
export const createTaskTemplate = async (
    name: string,
    description: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
    dueOffsetDays?: number,
    assignedTo?: string,
    checklistItems?: string[],
    category?: string
) => {
    const user = await supabase.auth.getUser();

    const { data, error } = await supabase
        .from('task_templates')
        .insert([
            {
                name,
                description,
                default_priority: priority,
                default_due_offset_days: dueOffsetDays,
                default_assigned_to: assignedTo,
                checklist_items: checklistItems,
                category,
                created_by: user.data.user?.id,
            },
        ])
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Get all task templates
 */
export const getTaskTemplates = async (category?: string) => {
    let query = supabase.from('task_templates').select('*');

    if (category) {
        query = query.eq('category', category);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

/**
 * Get single task template
 */
export const getTaskTemplate = async (templateId: string) => {
    const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .eq('id', templateId)
        .single();

    if (error) throw error;
    return data;
};

/**
 * Update task template
 */
export const updateTaskTemplate = async (
    templateId: string,
    updates: Partial<TaskTemplate>
) => {
    const { data, error } = await supabase
        .from('task_templates')
        .update(updates)
        .eq('id', templateId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Delete task template
 */
export const deleteTaskTemplate = async (templateId: string) => {
    const { error } = await supabase
        .from('task_templates')
        .delete()
        .eq('id', templateId);

    if (error) throw error;
};

/**
 * Create task from template
 */
export const createTaskFromTemplate = async (
    templateId: string,
    overrides?: {
        subject?: string;
        description?: string;
        due_date?: string;
        priority?: string;
        assigned_to?: string;
        lead_id?: string;
        contact_id?: string;
        deal_id?: string;
    }
) => {
    const template = await getTaskTemplate(templateId);

    if (!template) {
        throw new Error('Template not found');
    }

    // Calculate due date based on template offset
    let dueDate = overrides?.due_date;
    if (!dueDate && template.default_due_offset_days) {
        const date = new Date();
        date.setDate(date.getDate() + template.default_due_offset_days);
        dueDate = date.toISOString();
    }

    const { data, error } = await supabase
        .from('tasks')
        .insert([
            {
                subject: overrides?.subject || template.name,
                description: overrides?.description || template.description,
                due_date: dueDate,
                priority: overrides?.priority || template.default_priority,
                assigned_to: overrides?.assigned_to || template.default_assigned_to,
                status: 'Not Started',
                lead_id: overrides?.lead_id,
                contact_id: overrides?.contact_id,
                deal_id: overrides?.deal_id,
            },
        ])
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Create recurring task
 */
export const createRecurringTask = async (
    templateId: string,
    recurrencePattern: 'daily' | 'weekly' | 'monthly' | 'custom',
    recurrenceConfig?: any,
    assignedTo?: string
) => {
    const user = await supabase.auth.getUser();

    // Calculate next occurrence
    const nextOccurrence = calculateNextOccurrence(recurrencePattern, recurrenceConfig);

    const { data, error } = await supabase
        .from('recurring_tasks')
        .insert([
            {
                task_template_id: templateId,
                recurrence_pattern: recurrencePattern,
                recurrence_config: recurrenceConfig,
                next_occurrence: nextOccurrence.toISOString(),
                enabled: true,
                assigned_to: assignedTo,
                created_by: user.data.user?.id,
            },
        ])
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Calculate next occurrence for recurring task
 */
const calculateNextOccurrence = (
    pattern: 'daily' | 'weekly' | 'monthly' | 'custom',
    config?: any
): Date => {
    const now = new Date();

    switch (pattern) {
        case 'daily':
            now.setDate(now.getDate() + 1);
            break;

        case 'weekly':
            now.setDate(now.getDate() + 7);
            break;

        case 'monthly':
            now.setMonth(now.getMonth() + 1);
            break;

        case 'custom':
            if (config?.days) {
                now.setDate(now.getDate() + config.days);
            }
            break;
    }

    return now;
};

/**
 * Process recurring tasks (should be run by cron job)
 */
export const processRecurringTasks = async () => {
    const now = new Date();

    // Get all enabled recurring tasks that are due
    const { data: recurringTasks, error } = await supabase
        .from('recurring_tasks')
        .select('*, task_template:task_templates(*)')
        .eq('enabled', true)
        .lte('next_occurrence', now.toISOString());

    if (error) {
        console.error('Error fetching recurring tasks:', error);
        return;
    }

    for (const recurring of recurringTasks || []) {
        try {
            // Create task from template
            await createTaskFromTemplate(recurring.task_template_id, {
                assigned_to: recurring.assigned_to,
            });

            // Update next occurrence
            const nextOccurrence = calculateNextOccurrence(
                recurring.recurrence_pattern,
                recurring.recurrence_config
            );

            await supabase
                .from('recurring_tasks')
                .update({
                    next_occurrence: nextOccurrence.toISOString(),
                    last_created_at: now.toISOString(),
                })
                .eq('id', recurring.id);

        } catch (error) {
            console.error(`Error processing recurring task ${recurring.id}:`, error);
        }
    }
};

/**
 * Get all recurring tasks
 */
export const getRecurringTasks = async () => {
    const { data, error } = await supabase
        .from('recurring_tasks')
        .select('*, task_template:task_templates(*)')
        .order('next_occurrence', { ascending: true });

    if (error) throw error;
    return data || [];
};

/**
 * Update recurring task
 */
export const updateRecurringTask = async (
    recurringTaskId: string,
    updates: Partial<RecurringTask>
) => {
    const { data, error } = await supabase
        .from('recurring_tasks')
        .update(updates)
        .eq('id', recurringTaskId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Enable/Disable recurring task
 */
export const toggleRecurringTask = async (recurringTaskId: string, enabled: boolean) => {
    return updateRecurringTask(recurringTaskId, { enabled });
};

/**
 * Delete recurring task
 */
export const deleteRecurringTask = async (recurringTaskId: string) => {
    const { error } = await supabase
        .from('recurring_tasks')
        .delete()
        .eq('id', recurringTaskId);

    if (error) throw error;
};
