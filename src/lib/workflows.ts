import { supabase } from './supabase';
// import { logAuditActivity } from './activityAudit';
import { EntityType } from './activityAudit';

export type TriggerType = 'on_create' | 'on_update' | 'on_status_change' | 'on_field_change' | 'scheduled';
export type ActionType = 'create_task' | 'send_email' | 'update_field' | 'create_note' | 'assign_to' | 'webhook';

export interface Workflow {
    id: string;
    name: string;
    description?: string;
    entity_type: string;
    trigger_type: TriggerType;
    trigger_config: Record<string, unknown>;
    actions: WorkflowAction[];
    enabled: boolean;
}

export interface WorkflowAction {
    type: ActionType;
    config: Record<string, unknown>;
}

// Action Config Interfaces
interface CreateTaskConfig {
    subject?: string;
    description?: string;
    due_date?: string;
    priority?: string;
    assigned_to?: string;
}

interface UpdateFieldConfig {
    field: string;
    value: unknown;
}

interface CreateNoteConfig {
    note_text: string;
}

interface AssignToConfig {
    user_id: string;
}

interface WebhookConfig {
    url: string;
    headers?: Record<string, string>;
}

export interface TriggerData {
    entity_type: string;
    entity_id: string;
    old_values?: Record<string, unknown>;
    new_values?: Record<string, unknown>;
    user_id?: string;
}

/**
 * Create a new workflow
 */
export const createWorkflow = async (
    name: string,
    description: string,
    entityType: string,
    triggerType: TriggerType,
    triggerConfig: Record<string, unknown>,
    actions: WorkflowAction[]
) => {
    const user = await supabase.auth.getUser();

    const { data, error } = await supabase
        .from('workflows')
        .insert([
            {
                name,
                description,
                entity_type: entityType,
                trigger_type: triggerType,
                trigger_config: triggerConfig,
                actions,
                enabled: true,
                created_by: user.data.user?.id,
            },
        ])
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Get all workflows for an entity type
 */
export const getWorkflows = async (entityType?: string) => {
    let query = supabase
        .from('workflows')
        .select('*');

    if (entityType) {
        query = query.eq('entity_type', entityType);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

/**
 * Update workflow
 */
export const updateWorkflow = async (
    workflowId: string,
    updates: Partial<Workflow>
) => {
    const { data, error } = await supabase
        .from('workflows')
        .update(updates)
        .eq('id', workflowId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Enable/Disable workflow
 */
export const toggleWorkflow = async (workflowId: string, enabled: boolean) => {
    return updateWorkflow(workflowId, { enabled });
};

/**
 * Delete workflow
 */
export const deleteWorkflow = async (workflowId: string) => {
    const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', workflowId);

    if (error) throw error;
};

/**
 * Check if trigger conditions are met
 */
export const checkTriggerConditions = (
    workflow: Workflow,
    triggerData: TriggerData
): boolean => {
    const { trigger_type, trigger_config } = workflow;
    const { old_values, new_values } = triggerData;

    switch (trigger_type) {
        case 'on_create':
            return true; // Always trigger on create

        case 'on_update':
            return old_values !== undefined && new_values !== undefined;

        case 'on_status_change': {
            if (!trigger_config?.field || !old_values || !new_values) return false;
            const field = trigger_config.field as string;
            return old_values[field] !== new_values[field];
        }

        case 'on_field_change': {
            if (!trigger_config?.field || !old_values || !new_values) return false;
            const targetField = trigger_config.field as string;
            const oldVal = old_values[targetField];
            const newVal = new_values[targetField];

            // Check if specific value match is required
            if (trigger_config.old_value && trigger_config.new_value) {
                return oldVal === trigger_config.old_value && newVal === trigger_config.new_value;
            }

            return oldVal !== newVal;
        }

        case 'scheduled':
            // For scheduled workflows, this is handled by a cron job
            return false;

        default:
            return false;
    }
};

/**
 * Execute workflow actions
 */
export const executeWorkflowActions = async (
    workflow: Workflow,
    triggerData: TriggerData
): Promise<Record<string, unknown>[]> => {
    const results: Record<string, unknown>[] = [];

    for (const action of workflow.actions) {
        try {
            let result: unknown;

            switch (action.type) {
                case 'create_task':
                    result = await createTaskAction(action.config, triggerData);
                    break;

                case 'send_email':
                    result = await sendEmailAction(action.config);
                    break;

                case 'update_field':
                    result = await updateFieldAction(action.config, triggerData);
                    break;

                case 'create_note':
                    result = await createNoteAction(action.config, triggerData);
                    break;

                case 'assign_to':
                    result = await assignToAction(action.config, triggerData);
                    break;

                case 'webhook':
                    result = await webhookAction(action.config, triggerData);
                    break;

                default:
                    result = { success: false, error: `Unknown action type: ${action.type}` };
            }

            results.push({ action: action.type, ...(result as Record<string, unknown>) });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            results.push({ action: action.type, success: false, error: errorMessage });
        }
    }

    return results;
};

/**
 * Execute workflow
 */
export const executeWorkflow = async (
    workflow: Workflow,
    triggerData: TriggerData
) => {
    const startTime = Date.now();

    try {
        // Check if conditions are met
        if (!checkTriggerConditions(workflow, triggerData)) {
            return { executed: false, reason: 'Conditions not met' };
        }

        // Execute actions
        const actionsExecuted = await executeWorkflowActions(workflow, triggerData);
        const executionTime = Date.now() - startTime;

        // Log execution
        await supabase.from('workflow_executions').insert([
            {
                workflow_id: workflow.id,
                entity_type: triggerData.entity_type,
                entity_id: triggerData.entity_id,
                trigger_data: triggerData,
                actions_executed: actionsExecuted,
                status: 'completed',
                execution_time_ms: executionTime,
            },
        ]);

        return { executed: true, actions: actionsExecuted, executionTime };
    } catch (error: unknown) {
        const executionTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Log failed execution
        await supabase.from('workflow_executions').insert([
            {
                workflow_id: workflow.id,
                entity_type: triggerData.entity_type,
                entity_id: triggerData.entity_id,
                trigger_data: triggerData,
                status: 'failed',
                error_message: errorMessage,
                execution_time_ms: executionTime,
            },
        ]);

        throw error;
    }
};

/**
 * Trigger workflows for an event
 */
export const triggerWorkflows = async (
    entityType: string,
    entityId: string,
    triggerType: TriggerType,
    oldValues?: Record<string, unknown>,
    newValues?: Record<string, unknown>
) => {
    try {
        // Get all enabled workflows for this entity type and trigger type
        const workflows = await getWorkflows(entityType);
        const matchingWorkflows = workflows.filter(w => w.trigger_type === triggerType);

        if (matchingWorkflows.length === 0) return;

        const user = await supabase.auth.getUser();
        const triggerData: TriggerData = {
            entity_type: entityType,
            entity_id: entityId,
            old_values: oldValues,
            new_values: newValues,
            user_id: user.data.user?.id,
        };

        // Execute each matching workflow
        const executions = await Promise.allSettled(
            matchingWorkflows.map(workflow => executeWorkflow(workflow, triggerData))
        );

        return executions;
    } catch (error) {
        console.error('Error triggering workflows:', error);
    }
};

// ============================================
// Action Implementations
// ============================================

async function createTaskAction(config: Record<string, unknown>, triggerData: TriggerData) {
    const conf = config as unknown as CreateTaskConfig;
    const { data, error } = await supabase.from('tasks').insert([
        {
            subject: conf.subject || 'Automated Task',
            description: conf.description,
            due_date: conf.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            priority: conf.priority || 'medium',
            assigned_to: conf.assigned_to || null,
            status: 'Not Started',
            lead_id: triggerData.entity_type === 'lead' ? triggerData.entity_id : null,
        },
    ]).select();

    if (error) throw error;
    return { success: true, task_id: data[0]?.id };
}

async function sendEmailAction(config: Record<string, unknown>) {
    // This would integrate with the email service
    // For now, just log it
    console.log('Send email action:', config);
    return { success: true, email_queued: true };
}

async function updateFieldAction(config: Record<string, unknown>, triggerData: TriggerData) {
    const table = `${triggerData.entity_type}s`;
    const conf = config as unknown as UpdateFieldConfig;

    const { error } = await supabase
        .from(table)
        .update({ [conf.field]: conf.value })
        .eq('id', triggerData.entity_id);

    if (error) throw error;
    return { success: true };
}

async function createNoteAction(config: Record<string, unknown>, triggerData: TriggerData) {
    const { addNote } = await import('./activityAudit');
    const conf = config as unknown as CreateNoteConfig;

    await addNote(
        triggerData.entity_type as EntityType,
        triggerData.entity_id,
        conf.note_text
    );

    return { success: true };
}

async function assignToAction(config: Record<string, unknown>, triggerData: TriggerData) {
    const table = `${triggerData.entity_type}s`;
    const conf = config as unknown as AssignToConfig;

    const { error } = await supabase
        .from(table)
        .update({ assigned_to: conf.user_id })
        .eq('id', triggerData.entity_id);

    if (error) throw error;
    return { success: true, assigned_to: conf.user_id };
}

async function webhookAction(config: Record<string, unknown>, triggerData: TriggerData) {
    try {
        const conf = config as unknown as WebhookConfig;
        const response = await fetch(conf.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(conf.headers || {}),
            },
            body: JSON.stringify(triggerData),
        });

        return { success: response.ok, status: response.status };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Webhook failed: ${errorMessage}`);
    }
}

/**
 * Get workflow execution history
 */
export const getWorkflowExecutionHistory = async (
    workflowId: string,
    limit = 50
) => {
    const { data, error } = await supabase
        .from('workflow_executions')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data || [];
};
