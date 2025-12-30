-- Phase 4: Scaling & AI - AI Lead Scoring, Integrations, Mobile Sync
-- Created: 2025-12-29

-- ============================================
-- 1. AI Insights Table (Lead Scoring, Predictions)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type varchar(50) NOT NULL, -- 'lead', 'deal', 'contact'
  entity_id uuid NOT NULL,
  insight_type varchar(100) NOT NULL, -- 'lead_score', 'conversion_probability', 'churn_risk', 'next_best_action'
  score numeric(5,2), -- 0-100 score
  confidence numeric(5,2), -- 0-100 confidence level
  reasoning jsonb, -- Explanation of score factors
  recommendations jsonb, -- Array of recommended actions
  model_version varchar(50),
  calculated_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone, -- When to recalculate
  created_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- 2. AI Training Data (For model improvements)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_training_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type varchar(50) NOT NULL,
  entity_id uuid NOT NULL,
  features jsonb NOT NULL, -- Input features used for prediction
  outcome varchar(100), -- Actual outcome (e.g., 'won', 'lost', 'converted')
  predicted_outcome varchar(100), -- What AI predicted
  accuracy_score numeric(5,2), -- How accurate was the prediction
  feedback_provided boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- 3. Integrations Table (Third-party connections)
-- ============================================
CREATE TABLE IF NOT EXISTS integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL, -- 'slack', 'google_calendar', 'outlook', 'zapier'
  type varchar(100) NOT NULL, -- 'messaging', 'calendar', 'automation'
  status varchar(50) DEFAULT 'active', -- 'active', 'inactive', 'error'
  credentials jsonb NOT NULL, -- Encrypted tokens, API keys
  config jsonb, -- Integration-specific settings
  last_sync_at timestamp with time zone,
  sync_status varchar(50), -- 'success', 'failed', 'pending'
  error_message text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- 4. Integration Logs (Sync history)
-- ============================================
CREATE TABLE IF NOT EXISTS integration_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid REFERENCES integrations(id) ON DELETE CASCADE,
  action varchar(100) NOT NULL, -- 'sync', 'send', 'receive', 'create', 'update'
  entity_type varchar(50),
  entity_id uuid,
  status varchar(50) DEFAULT 'pending', -- 'pending', 'success', 'failed'
  request_data jsonb,
  response_data jsonb,
  error_message text,
  duration_ms integer,
  created_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- 5. Calendar Events Table (Synced from integrations)
-- ============================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid REFERENCES integrations(id) ON DELETE CASCADE,
  external_id varchar(255), -- ID from external calendar
  title varchar(500) NOT NULL,
  description text,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  location varchar(500),
  attendees jsonb, -- Array of email addresses
  entity_type varchar(50), -- Linked CRM entity
  entity_id uuid,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- 6. Slack Messages Table (Logged conversations)
-- ============================================
CREATE TABLE IF NOT EXISTS slack_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid REFERENCES integrations(id) ON DELETE CASCADE,
  channel_id varchar(255),
  message_ts varchar(255), -- Slack timestamp
  user_id varchar(255), -- Slack user ID
  text text NOT NULL,
  entity_type varchar(50), -- If linked to CRM entity
  entity_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- 7. Mobile Sync Log (Track mobile app syncs)
-- ============================================
CREATE TABLE IF NOT EXISTS mobile_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id varchar(255) NOT NULL,
  device_type varchar(50), -- 'ios', 'android'
  app_version varchar(50),
  sync_type varchar(50), -- 'full', 'incremental'
  entities_synced jsonb, -- {"leads": 10, "deals": 5, "contacts": 20}
  sync_status varchar(50) DEFAULT 'success',
  error_message text,
  created_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- 8. Indexes for Performance
-- ============================================

-- AI Insights Indexes
CREATE INDEX IF NOT EXISTS idx_ai_insights_entity ON ai_insights(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_score ON ai_insights(score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_expires ON ai_insights(expires_at) WHERE expires_at IS NOT NULL;

-- AI Training Data Indexes
CREATE INDEX IF NOT EXISTS idx_ai_training_entity ON ai_training_data(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_training_outcome ON ai_training_data(outcome);

-- Integrations Indexes
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(type);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status);
CREATE INDEX IF NOT EXISTS idx_integrations_created_by ON integrations(created_by);

-- Integration Logs Indexes
CREATE INDEX IF NOT EXISTS idx_integration_logs_integration ON integration_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_status ON integration_logs(status);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created ON integration_logs(created_at DESC);

-- Calendar Events Indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_entity ON calendar_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON calendar_events(created_by);

-- Slack Messages Indexes
CREATE INDEX IF NOT EXISTS idx_slack_messages_entity ON slack_messages(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_slack_messages_channel ON slack_messages(channel_id);

-- Mobile Sync Logs Indexes
CREATE INDEX IF NOT EXISTS idx_mobile_sync_user ON mobile_sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_mobile_sync_device ON mobile_sync_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_mobile_sync_created ON mobile_sync_logs(created_at DESC);

-- ============================================
-- 9. Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobile_sync_logs ENABLE ROW LEVEL SECURITY;

-- AI Insights Policies
CREATE POLICY "Users can view all AI insights"
  ON ai_insights FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can manage AI insights"
  ON ai_insights FOR ALL
  USING (true)
  WITH CHECK (true);

-- AI Training Data Policies
CREATE POLICY "Users can view AI training data"
  ON ai_training_data FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can manage AI training data"
  ON ai_training_data FOR ALL
  USING (true)
  WITH CHECK (true);

-- Integrations Policies
CREATE POLICY "Users can view own integrations"
  ON integrations FOR SELECT
  USING (auth.uid() = created_by OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage own integrations"
  ON integrations FOR ALL
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Integration Logs Policies
CREATE POLICY "Users can view integration logs"
  ON integration_logs FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert integration logs"
  ON integration_logs FOR INSERT
  WITH CHECK (true);

-- Calendar Events Policies
CREATE POLICY "Users can view all calendar events"
  ON calendar_events FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage own calendar events"
  ON calendar_events FOR ALL
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Slack Messages Policies
CREATE POLICY "Users can view all Slack messages"
  ON slack_messages FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert Slack messages"
  ON slack_messages FOR INSERT
  WITH CHECK (true);

-- Mobile Sync Logs Policies
CREATE POLICY "Users can view own mobile sync logs"
  ON mobile_sync_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mobile sync logs"
  ON mobile_sync_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 10. Triggers
-- ============================================

CREATE TRIGGER update_integrations_timestamp
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_timestamp
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- End of Phase 4 Scaling & AI Migration
-- ============================================
