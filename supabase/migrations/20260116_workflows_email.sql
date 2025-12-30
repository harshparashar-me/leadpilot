-- Phase 2: Automation - Workflows, Email Integration, Task Templates
-- Created: 2025-12-29

-- ============================================
-- 1. Workflows Table
-- ============================================
CREATE TABLE IF NOT EXISTS workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  description text,
  entity_type varchar(50) NOT NULL, -- 'lead', 'contact', 'deal', etc.
  trigger_type varchar(50) NOT NULL, -- 'on_create', 'on_update', 'on_status_change', 'on_field_change', 'scheduled'
  trigger_config jsonb, -- Conditions for trigger (e.g., {"field": "status", "old_value": "new", "new_value": "contacted"})
  actions jsonb NOT NULL, -- Array of actions to execute (e.g., [{"type": "create_task", "config": {...}}])
  enabled boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- 2. Workflow Executions Table (Log)
-- ============================================
CREATE TABLE IF NOT EXISTS workflow_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE,
  entity_type varchar(50) NOT NULL,
  entity_id uuid NOT NULL,
  trigger_data jsonb, -- Data that triggered the workflow
  actions_executed jsonb, -- Results of each action
  status varchar(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  error_message text,
  execution_time_ms integer, -- How long it took to execute
  created_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- 3. Email Accounts Table
-- ============================================
CREATE TABLE IF NOT EXISTS email_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email varchar(255) NOT NULL,
  smtp_host varchar(255) NOT NULL,
  smtp_port integer NOT NULL,
  smtp_username varchar(255) NOT NULL,
  smtp_password text NOT NULL, -- Should be encrypted
  smtp_secure boolean DEFAULT true,
  is_default boolean DEFAULT false,
  status varchar(50) DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- 4. Email Templates Table
-- ============================================
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  subject varchar(500) NOT NULL,
  body_html text NOT NULL,
  body_text text,
  variables jsonb, -- List of supported variables: ["{{name}}", "{{email}}", etc.]
  category varchar(100), -- 'follow_up', 'welcome', 'reminder', etc.
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- 5. Email Logs Table
-- ============================================
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_email varchar(255) NOT NULL,
  to_email varchar(255) NOT NULL,
  cc_emails text[], -- Array of CC emails
  bcc_emails text[], -- Array of BCC emails
  subject varchar(500) NOT NULL,
  body_html text,
  body_text text,
  template_id uuid REFERENCES email_templates(id),
  entity_type varchar(50), -- Associated entity
  entity_id uuid,
  status varchar(50) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'
  sent_at timestamp with time zone,
  opened_at timestamp with time zone,
  clicked_at timestamp with time zone,
  error_message text,
  tracking_id uuid DEFAULT gen_random_uuid(), -- For tracking opens/clicks
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- 6. Task Templates Table
-- ============================================
CREATE TABLE IF NOT EXISTS task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  description text,
  default_priority varchar(50) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  default_due_offset_days integer, -- Days from creation (e.g., 7 = due in 1 week)
  default_assigned_to uuid REFERENCES auth.users(id),
  checklist_items jsonb, -- Array of checklist items
  category varchar(100),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- 7. Recurring Tasks Table
-- ============================================
CREATE TABLE IF NOT EXISTS recurring_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_template_id uuid REFERENCES task_templates(id) ON DELETE CASCADE,
  recurrence_pattern varchar(50) NOT NULL, -- 'daily', 'weekly', 'monthly', 'custom'
  recurrence_config jsonb, -- Config for custom patterns (e.g., {"day_of_week": 1, "day_of_month": 15})
  next_occurrence timestamp with time zone NOT NULL,
  last_created_at timestamp with time zone,
  enabled boolean DEFAULT true,
  assigned_to uuid REFERENCES auth.users(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- 8. Indexes for Performance
-- ============================================

-- Workflows Indexes
CREATE INDEX IF NOT EXISTS idx_workflows_entity_type ON workflows(entity_type);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger_type ON workflows(trigger_type);
CREATE INDEX IF NOT EXISTS idx_workflows_enabled ON workflows(enabled) WHERE enabled = true;

-- Workflow Executions Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_entity ON workflow_executions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_created ON workflow_executions(created_at DESC);

-- Email Accounts Indexes
CREATE INDEX IF NOT EXISTS idx_email_accounts_user ON email_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_email_accounts_default ON email_accounts(is_default) WHERE is_default = true;

-- Email Templates Indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_created_by ON email_templates(created_by);

-- Email Logs Indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_entity ON email_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_tracking ON email_logs(tracking_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);

-- Task Templates Indexes
CREATE INDEX IF NOT EXISTS idx_task_templates_category ON task_templates(category);
CREATE INDEX IF NOT EXISTS idx_task_templates_created_by ON task_templates(created_by);

-- Recurring Tasks Indexes
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_next_occurrence ON recurring_tasks(next_occurrence) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_assigned_to ON recurring_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_enabled ON recurring_tasks(enabled) WHERE enabled = true;

-- ============================================
-- 9. Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_tasks ENABLE ROW LEVEL SECURITY;

-- Workflows Policies
CREATE POLICY "Users can view all workflows"
  ON workflows FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create workflows"
  ON workflows FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own workflows"
  ON workflows FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own workflows"
  ON workflows FOR DELETE
  USING (auth.uid() = created_by);

-- Workflow Executions Policies
CREATE POLICY "Users can view all workflow executions"
  ON workflow_executions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert workflow executions"
  ON workflow_executions FOR INSERT
  WITH CHECK (true); -- Allow system to log executions

-- Email Accounts Policies
CREATE POLICY "Users can view own email accounts"
  ON email_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email accounts"
  ON email_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email accounts"
  ON email_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own email accounts"
  ON email_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Email Templates Policies
CREATE POLICY "Users can view all email templates"
  ON email_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create email templates"
  ON email_templates FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own email templates"
  ON email_templates FOR UPDATE
  USING (auth.uid() = created_by);

-- Email Logs Policies
CREATE POLICY "Users can view all email logs"
  ON email_logs FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert email logs"
  ON email_logs FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Task Templates Policies
CREATE POLICY "Users can view all task templates"
  ON task_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create task templates"
  ON task_templates FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own task templates"
  ON task_templates FOR UPDATE
  USING (auth.uid() = created_by);

-- Recurring Tasks Policies
CREATE POLICY "Users can view all recurring tasks"
  ON recurring_tasks FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create recurring tasks"
  ON recurring_tasks FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own recurring tasks"
  ON recurring_tasks FOR UPDATE
  USING (auth.uid() = created_by);

-- ============================================
-- 10. Triggers
-- ============================================

-- Update timestamp triggers
CREATE TRIGGER update_workflows_timestamp
  BEFORE UPDATE ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_accounts_timestamp
  BEFORE UPDATE ON email_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_timestamp
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_templates_timestamp
  BEFORE UPDATE ON task_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurring_tasks_timestamp
  BEFORE UPDATE ON recurring_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- End of Phase 2 Automation Migration
-- ============================================
