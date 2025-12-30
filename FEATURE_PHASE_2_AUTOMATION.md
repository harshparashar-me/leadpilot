# 🔄 PHASE 2: CORE FEATURES - Workflow Automation, Email Integration, Task Templates

**Duration**: Month 1-2 (4 weeks)  
**Complexity**: High  
**Dependencies**: Phase 1 (Foundation)  
**Priority**: High - Automation drives efficiency

---

## Overview

```
Phase 2 adds automation capabilities:
├─ Workflow Automation (if-then rules)
├─ Email Integration (send/track emails)
└─ Task Templates & Recurring Tasks
```

---

## 2.1 Database Schema

**File**: `supabase/migrations/20260116_workflows_email.sql`

```sql
-- Workflows (automation rules)
CREATE TABLE IF NOT EXISTS workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  description text,
  entity_type varchar(50), -- 'lead', 'contact', 'deal', null = global
  trigger_type varchar(50) NOT NULL, -- 'record_created', 'record_updated', 'status_changed', 'time_based'
  trigger_config jsonb NOT NULL, -- Conditions to match
  actions jsonb NOT NULL, -- Array of actions to perform
  enabled boolean DEFAULT true,
  run_count int DEFAULT 0,
  last_run_at timestamp with time zone,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Workflow execution logs
CREATE TABLE IF NOT EXISTS workflow_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  entity_type varchar(50),
  entity_id uuid,
  status varchar(50) DEFAULT 'success', -- 'success', 'failed', 'skipped'
  error_message text,
  executed_actions jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Email accounts (SMTP config)
CREATE TABLE IF NOT EXISTS email_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  email varchar(255) NOT NULL UNIQUE,
  smtp_server varchar(255) NOT NULL,
  smtp_port int NOT NULL,
  smtp_user varchar(255) NOT NULL,
  smtp_password varchar(500) NOT NULL ENCRYPTED,
  is_default boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Email tracking
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_account_id uuid REFERENCES email_accounts(id),
  to_email varchar(255) NOT NULL,
  entity_type varchar(50),
  entity_id uuid,
  subject varchar(255) NOT NULL,
  body text NOT NULL,
  status varchar(50) DEFAULT 'draft', -- 'draft', 'sent', 'failed', 'bounced'
  opened boolean DEFAULT false,
  opened_at timestamp with time zone,
  clicked boolean DEFAULT false,
  clicked_at timestamp with time zone,
  reply_received boolean DEFAULT false,
  reply_at timestamp with time zone,
  template_id uuid,
  sent_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Email templates
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  subject varchar(255) NOT NULL,
  body text NOT NULL,
  category varchar(50), -- 'welcome', 'followup', 'proposal', etc.
  variables text[], -- {{name}}, {{email}}, etc.
  is_default boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tasks table updates
CREATE TABLE IF NOT EXISTS task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  description text,
  category varchar(50), -- 'followup', 'meeting', 'proposal', etc.
  priority varchar(50) DEFAULT 'medium',
  due_days_offset int DEFAULT 1, -- Days from trigger to due date
  checklist jsonb, -- Array of subtasks
  assigned_to_role varchar(50), -- 'admin', 'manager', 'sales_rep', etc.
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Recurring tasks
CREATE TABLE IF NOT EXISTS recurring_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type varchar(50),
  entity_id uuid,
  base_task_id uuid REFERENCES tasks(id),
  frequency varchar(50) DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly', 'custom'
  interval int DEFAULT 1, -- Every N periods
  day_of_week int, -- For weekly: 0=Sun, 6=Sat
  day_of_month int, -- For monthly
  times_to_repeat int,
  repeat_count int DEFAULT 0,
  next_due_at timestamp with time zone,
  active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX idx_workflows_entity ON workflows(entity_type);
CREATE INDEX idx_workflows_enabled ON workflows(enabled);
CREATE INDEX idx_workflow_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_created ON workflow_executions(created_at);
CREATE INDEX idx_email_logs_entity ON email_logs(entity_type, entity_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_sent ON email_logs(sent_by);
CREATE INDEX idx_email_templates_category ON email_templates(category);
CREATE INDEX idx_recurring_tasks_entity ON recurring_tasks(entity_type, entity_id);
CREATE INDEX idx_recurring_tasks_next_due ON recurring_tasks(next_due_at);
```

---

## 2.2 Workflow Engine

**File**: `src/lib/workflows.ts`

```typescript
import { supabase } from './supabase';
import { logActivity } from './activity';

export interface WorkflowTrigger {
  type: 'record_created' | 'record_updated' | 'status_changed' | 'time_based';
  field?: string;
  operator?: string; // 'equals', 'contains', 'greater_than'
  value?: any;
}

export interface WorkflowAction {
  type: 'create_task' | 'send_email' | 'update_field' | 'assign_to';
  config: any;
}

/**
 * Create workflow
 */
export const createWorkflow = async (
  name: string,
  entityType: string,
  triggerType: WorkflowTrigger,
  actions: WorkflowAction[]
) => {
  const user = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('workflows')
    .insert([
      {
        name,
        entity_type: entityType,
        trigger_type: triggerType.type,
        trigger_config: triggerType,
        actions,
        created_by: user.data.user?.id,
      },
    ])
    .select();

  if (error) throw error;
  return data;
};

/**
 * Execute workflow
 */
export const executeWorkflow = async (
  workflowId: string,
  entityType: string,
  entityId: string,
  entityData?: any
) => {
  const { data: workflow } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', workflowId)
    .single();

  if (!workflow || !workflow.enabled) {
    return { executed: false, reason: 'Workflow not found or disabled' };
  }

  // Check trigger conditions
  const conditionMet = checkTriggerConditions(
    workflow.trigger_config,
    entityData
  );

  if (!conditionMet) {
    await logWorkflowExecution(workflowId, entityType, entityId, 'skipped');
    return { executed: false, reason: 'Trigger conditions not met' };
  }

  // Execute actions
  const executedActions = [];
  let hasError = false;

  for (const action of workflow.actions) {
    try {
      const result = await executeAction(action, entityType, entityId, entityData);
      executedActions.push({ action, result, success: true });
    } catch (error: any) {
      executedActions.push({ action, error: error.message, success: false });
      hasError = true;
    }
  }

  // Log execution
  await logWorkflowExecution(
    workflowId,
    entityType,
    entityId,
    hasError ? 'failed' : 'success',
    executedActions
  );

  // Update run count
  await supabase
    .from('workflows')
    .update({ run_count: workflow.run_count + 1, last_run_at: new Date().toISOString() })
    .eq('id', workflowId);

  return { executed: true, executedActions };
};

/**
 * Check if trigger conditions are met
 */
const checkTriggerConditions = (trigger: any, data: any): boolean => {
  if (!trigger.field) return true;

  const fieldValue = data?.[trigger.field];

  switch (trigger.operator) {
    case 'equals':
      return fieldValue === trigger.value;
    case 'contains':
      return String(fieldValue).includes(trigger.value);
    case 'greater_than':
      return fieldValue > trigger.value;
    case 'less_than':
      return fieldValue < trigger.value;
    case 'is_true':
      return fieldValue === true;
    case 'is_false':
      return fieldValue === false;
    default:
      return true;
  }
};

/**
 * Execute single action
 */
const executeAction = async (
  action: WorkflowAction,
  entityType: string,
  entityId: string,
  entityData?: any
): Promise<any> => {
  switch (action.type) {
    case 'create_task':
      return await createTaskFromWorkflow(action.config, entityType, entityId, entityData);
    case 'send_email':
      return await sendEmailFromWorkflow(action.config, entityType, entityId, entityData);
    case 'update_field':
      return await updateFieldFromWorkflow(action.config, entityType, entityId);
    case 'assign_to':
      return await assignToFromWorkflow(action.config, entityType, entityId);
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
};

/**
 * Create task from workflow
 */
const createTaskFromWorkflow = async (
  config: any,
  entityType: string,
  entityId: string,
  entityData?: any
) => {
  const user = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('tasks')
    .insert([
      {
        title: replaceVariables(config.title, entityData),
        description: replaceVariables(config.description, entityData),
        entity_type: entityType,
        entity_id: entityId,
        priority: config.priority || 'medium',
        assigned_to: config.assigned_to || user.data.user?.id,
        due_date: calculateDueDate(config.due_days_offset),
        created_by: user.data.user?.id,
      },
    ])
    .select();

  if (error) throw error;
  return data;
};

/**
 * Send email from workflow
 */
const sendEmailFromWorkflow = async (
  config: any,
  entityType: string,
  entityId: string,
  entityData?: any
) => {
  const user = await supabase.auth.getUser();

  const emailContent = {
    subject: replaceVariables(config.subject, entityData),
    body: replaceVariables(config.body, entityData),
  };

  const { data, error } = await supabase
    .from('email_logs')
    .insert([
      {
        from_account_id: config.from_account_id,
        to_email: config.to_email || entityData?.email,
        entity_type: entityType,
        entity_id: entityId,
        subject: emailContent.subject,
        body: emailContent.body,
        template_id: config.template_id,
        sent_by: user.data.user?.id,
      },
    ])
    .select();

  if (error) throw error;
  return data;
};

/**
 * Log workflow execution
 */
const logWorkflowExecution = async (
  workflowId: string,
  entityType: string,
  entityId: string,
  status: string,
  executedActions?: any
) => {
  await supabase.from('workflow_executions').insert([
    {
      workflow_id: workflowId,
      entity_type: entityType,
      entity_id: entityId,
      status,
      executed_actions: executedActions,
    },
  ]);
};

/**
 * Replace variables in text
 */
const replaceVariables = (text: string, data?: any): string => {
  if (!data || !text) return text;

  let result = text;
  Object.keys(data).forEach((key) => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(data[key]));
  });
  return result;
};

/**
 * Calculate due date
 */
const calculateDueDate = (daysOffset: number = 1): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
};

/**
 * Get workflows for entity type
 */
export const getWorkflows = async (entityType?: string) => {
  let query = supabase.from('workflows').select('*');

  if (entityType) {
    query = query.or(`entity_type.is.null,entity_type.eq.${entityType}`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * Get workflow executions
 */
export const getWorkflowExecutions = async (workflowId: string, limit = 50) => {
  const { data, error } = await supabase
    .from('workflow_executions')
    .select('*')
    .eq('workflow_id', workflowId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};
```

---

## 2.3 Email Integration Service

**File**: `src/lib/email.ts`

```typescript
import { supabase } from './supabase';

export interface EmailConfig {
  from_account_id: string;
  to_email: string;
  subject: string;
  body: string;
  entity_type?: string;
  entity_id?: string;
  template_id?: string;
}

/**
 * Send email
 */
export const sendEmail = async (config: EmailConfig) => {
  const user = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('email_logs')
    .insert([
      {
        from_account_id: config.from_account_id,
        to_email: config.to_email,
        subject: config.subject,
        body: config.body,
        entity_type: config.entity_type,
        entity_id: config.entity_id,
        template_id: config.template_id,
        sent_by: user.data.user?.id,
        status: 'sent',
        sent_at: new Date().toISOString(),
      },
    ])
    .select();

  if (error) throw error;

  // In production, integrate with actual email service
  // (SendGrid, Mailgun, AWS SES, etc.)

  return data;
};

/**
 * Create email template
 */
export const createEmailTemplate = async (
  name: string,
  subject: string,
  body: string,
  category?: string
) => {
  const user = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('email_templates')
    .insert([
      {
        name,
        subject,
        body,
        category,
        created_by: user.data.user?.id,
      },
    ])
    .select();

  if (error) throw error;
  return data;
};

/**
 * Get email templates
 */
export const getEmailTemplates = async (category?: string) => {
  let query = supabase.from('email_templates').select('*');

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query.order('name', { ascending: true });

  if (error) throw error;
  return data;
};

/**
 * Get email logs
 */
export const getEmailLogs = async (entityType?: string, entityId?: string) => {
  let query = supabase.from('email_logs').select('*');

  if (entityType) {
    query = query.eq('entity_type', entityType);
  }

  if (entityId) {
    query = query.eq('entity_id', entityId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * Track email open
 */
export const trackEmailOpen = async (emailId: string) => {
  const { error } = await supabase
    .from('email_logs')
    .update({
      opened: true,
      opened_at: new Date().toISOString(),
    })
    .eq('id', emailId);

  if (error) throw error;
};

/**
 * Track email click
 */
export const trackEmailClick = async (emailId: string) => {
  const { error } = await supabase
    .from('email_logs')
    .update({
      clicked: true,
      clicked_at: new Date().toISOString(),
    })
    .eq('id', emailId);

  if (error) throw error;
};
```

---

## 2.4 Task Templates & Recurring Tasks

**File**: `src/lib/tasks.ts` (add to existing)

```typescript
/**
 * Create task from template
 */
export const createTaskFromTemplate = async (
  templateId: string,
  entityType: string,
  entityId: string
) => {
  const { data: template } = await supabase
    .from('task_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (!template) throw new Error('Template not found');

  const user = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('tasks')
    .insert([
      {
        title: template.name,
        description: template.description,
        entity_type: entityType,
        entity_id: entityId,
        priority: template.priority,
        assigned_to: template.assigned_to_role ? null : user.data.user?.id,
        due_date: calculateDueDate(template.due_days_offset),
        checklist: template.checklist,
        created_by: user.data.user?.id,
      },
    ])
    .select();

  if (error) throw error;
  return data;
};

/**
 * Create recurring task
 */
export const createRecurringTask = async (
  baseTaskId: string,
  entityType: string,
  entityId: string,
  frequency: 'daily' | 'weekly' | 'monthly',
  timesToRepeat: number
) => {
  const nextDue = calculateNextDue(frequency);

  const { data, error } = await supabase
    .from('recurring_tasks')
    .insert([
      {
        base_task_id: baseTaskId,
        entity_type: entityType,
        entity_id: entityId,
        frequency,
        times_to_repeat: timesToRepeat,
        next_due_at: nextDue,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      },
    ])
    .select();

  if (error) throw error;
  return data;
};

/**
 * Process recurring tasks
 */
export const processRecurringTasks = async () => {
  const now = new Date();

  const { data: recurringTasks } = await supabase
    .from('recurring_tasks')
    .select('*')
    .lte('next_due_at', now.toISOString())
    .eq('active', true);

  if (!recurringTasks) return;

  for (const recurring of recurringTasks) {
    if (recurring.repeat_count >= recurring.times_to_repeat && recurring.times_to_repeat > 0) {
      // Deactivate if completed all repetitions
      await supabase
        .from('recurring_tasks')
        .update({ active: false })
        .eq('id', recurring.id);
      continue;
    }

    // Create new task instance
    const { data: baseTask } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', recurring.base_task_id)
      .single();

    if (baseTask) {
      await supabase.from('tasks').insert([
        {
          ...baseTask,
          id: undefined, // Generate new ID
          due_date: calculateDueDate(baseTask.due_days_offset || 1),
          created_at: now.toISOString(),
        },
      ]);

      // Update recurring task
      const nextDue = calculateNextDue(recurring.frequency, recurring.interval);
      await supabase
        .from('recurring_tasks')
        .update({
          next_due_at: nextDue,
          repeat_count: recurring.repeat_count + 1,
        })
        .eq('id', recurring.id);
    }
  }
};

const calculateNextDue = (frequency: string, interval = 1): string => {
  const date = new Date();

  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + interval);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7 * interval);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + interval);
      break;
  }

  return date.toISOString();
};
```

---

## 2.5 Workflow UI Component

**File**: `src/components/WorkflowBuilder.tsx`

```typescript
import React, { useState } from 'react';
import { createWorkflow } from '../lib/workflows';
import { Plus, Trash2 } from 'lucide-react';

export const WorkflowBuilder: React.FC = () => {
  const [name, setName] = useState('');
  const [entityType, setEntityType] = useState('lead');
  const [trigger, setTrigger] = useState({ type: 'record_created' });
  const [actions, setActions] = useState<any[]>([]);

  const handleAddAction = () => {
    setActions([...actions, { type: 'create_task' }]);
  };

  const handleRemoveAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      await createWorkflow(name, entityType, trigger, actions);
      alert('Workflow created!');
      // Reset form
      setName('');
      setActions([]);
    } catch (err) {
      console.error('Error creating workflow:', err);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium mb-1">Workflow Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      {/* Entity Type */}
      <div>
        <label className="block text-sm font-medium mb-1">Entity Type</label>
        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="lead">Lead</option>
          <option value="contact">Contact</option>
          <option value="deal">Deal</option>
          <option value="task">Task</option>
        </select>
      </div>

      {/* Trigger */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium mb-3">When</h3>
        <select
          value={trigger.type}
          onChange={(e) => setTrigger({ type: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="record_created">Record is created</option>
          <option value="record_updated">Record is updated</option>
          <option value="status_changed">Status changes</option>
          <option value="time_based">Time based</option>
        </select>
      </div>

      {/* Actions */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Then</h3>
          <button
            onClick={handleAddAction}
            className="p-1 hover:bg-green-200 rounded"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2">
          {actions.map((action, index) => (
            <div key={index} className="flex items-center gap-2">
              <select
                value={action.type}
                onChange={(e) => {
                  const newActions = [...actions];
                  newActions[index].type = e.target.value;
                  setActions(newActions);
                }}
                className="flex-1 px-3 py-2 border rounded-lg"
              >
                <option value="create_task">Create task</option>
                <option value="send_email">Send email</option>
                <option value="update_field">Update field</option>
                <option value="assign_to">Assign to</option>
              </select>
              <button
                onClick={() => handleRemoveAction(index)}
                className="p-1 hover:bg-red-200 rounded text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={!name || actions.length === 0}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        Create Workflow
      </button>
    </div>
  );
};

export default WorkflowBuilder;
```

---

## 2.6 Implementation Checklist

- [ ] Create migration: `20260116_workflows_email.sql`
- [ ] Create: `src/lib/workflows.ts`
- [ ] Update: `src/lib/email.ts`
- [ ] Update: `src/lib/tasks.ts`
- [ ] Create: `src/components/WorkflowBuilder.tsx`
- [ ] Create: Email template management UI
- [ ] Create: Workflow execution logs UI
- [ ] Setup: Email service integration (SendGrid/Mailgun)
- [ ] Test: Workflow execution
- [ ] Test: Email sending
- [ ] Test: Recurring tasks
- [ ] Monitor: Workflow performance

---

**Status**: Ready for Implementation  
**Effort**: 4 weeks (1-2 developers)  
**Complexity**: High
