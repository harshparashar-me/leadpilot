-- Phase 3: Advanced Features - Pipelines, Analytics, Team Communication
-- Created: 2025-12-29

-- ============================================
-- 1. Pipelines Table (Custom Sales Pipelines)
-- ============================================
CREATE TABLE IF NOT EXISTS pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  description text,
  entity_type varchar(50) NOT NULL, -- 'deal', 'lead', etc.
  stages jsonb NOT NULL, -- Array of stage objects: [{"id": "uuid", "name": "Qualification", "order": 1, "color": "#blue"}]
  is_default boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- 2. Deal Stages Table (Track deals in pipeline)
-- ============================================
CREATE TABLE IF NOT EXISTS deal_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL,
  pipeline_id uuid REFERENCES pipelines(id) ON DELETE CASCADE,
  stage_id varchar(100) NOT NULL, -- References stage id in pipeline.stages jsonb
  stage_name varchar(255) NOT NULL,
  entered_at timestamp with time zone DEFAULT now(),
  exited_at timestamp with time zone,
  duration_hours integer, -- Auto-calculated when moved
  created_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- 3. Board Views Table (User preferences for kanban)
-- ============================================
CREATE TABLE IF NOT EXISTS board_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  pipeline_id uuid REFERENCES pipelines(id) ON DELETE CASCADE,
  view_config jsonb, -- Filters, sorting, grouping preferences
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, pipeline_id)
);

-- ============================================
-- 4. Analytics Snapshots Table (Time-series data)
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL,
  metric_type varchar(100) NOT NULL, -- 'revenue', 'deals_won', 'leads_created', etc.
  entity_type varchar(50), -- 'deal', 'lead', 'contact', etc.
  metric_value numeric NOT NULL,
  metadata jsonb, -- Additional context (e.g., user_id, team_id, pipeline_id)
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(snapshot_date, metric_type, entity_type, metadata)
);

-- ============================================
-- 5. Funnel Metrics Table (Conversion tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS funnel_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid REFERENCES pipelines(id) ON DELETE CASCADE,
  from_stage_id varchar(100) NOT NULL,
  to_stage_id varchar(100) NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_moved integer DEFAULT 0,
  conversion_rate numeric(5,2), -- Percentage
  avg_time_hours integer, -- Average time to convert
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- 6. Channels Table (Team Chat Channels)
-- ============================================
CREATE TABLE IF NOT EXISTS channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL UNIQUE,
  description text,
  type varchar(50) DEFAULT 'public', -- 'public', 'private', 'direct_message'
  member_ids uuid[], -- Array of user IDs who are members
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- 7. Messages Table (Chat Messages)
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES channels(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_message_id uuid REFERENCES messages(id) ON DELETE CASCADE, -- For threading
  message_text text NOT NULL,
  message_type varchar(50) DEFAULT 'text', -- 'text', 'file', 'system'
  attachments jsonb, -- File URLs, metadata
  reactions jsonb, -- {"👍": ["user_id1", "user_id2"], "❤️": ["user_id3"]}
  edited_at timestamp with time zone,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- 8. Message Mentions Table (@ mentions and notifications)
-- ============================================
CREATE TABLE IF NOT EXISTS message_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  mentioned_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(message_id, mentioned_user_id)
);

-- ============================================
-- 9. Indexes for Performance
-- ============================================

-- Pipelines Indexes
CREATE INDEX IF NOT EXISTS idx_pipelines_entity_type ON pipelines(entity_type);
CREATE INDEX IF NOT EXISTS idx_pipelines_default ON pipelines(is_default) WHERE is_default = true;

-- Deal Stages Indexes
CREATE INDEX IF NOT EXISTS idx_deal_stages_deal ON deal_stages(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_stages_pipeline ON deal_stages(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_deal_stages_entered ON deal_stages(entered_at DESC);

-- Board Views Indexes
CREATE INDEX IF NOT EXISTS idx_board_views_user ON board_views(user_id);
CREATE INDEX IF NOT EXISTS idx_board_views_pipeline ON board_views(pipeline_id);

-- Analytics Snapshots Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_metric ON analytics_snapshots(metric_type);
CREATE INDEX IF NOT EXISTS idx_analytics_entity ON analytics_snapshots(entity_type);

-- Funnel Metrics Indexes
CREATE INDEX IF NOT EXISTS idx_funnel_pipeline ON funnel_metrics(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_funnel_period ON funnel_metrics(period_start, period_end);

-- Channels Indexes
CREATE INDEX IF NOT EXISTS idx_channels_type ON channels(type);
CREATE INDEX IF NOT EXISTS idx_channels_members ON channels USING GIN(member_ids);

-- Messages Indexes
CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_parent ON messages(parent_message_id) WHERE parent_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_deleted ON messages(deleted_at) WHERE deleted_at IS NULL;

-- Message Mentions Indexes
CREATE INDEX IF NOT EXISTS idx_mentions_user ON message_mentions(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_mentions_unread ON message_mentions(mentioned_user_id, read_at) WHERE read_at IS NULL;

-- ============================================
-- 10. Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_mentions ENABLE ROW LEVEL SECURITY;

-- Pipelines Policies
CREATE POLICY "Users can view all pipelines"
  ON pipelines FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create pipelines"
  ON pipelines FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own pipelines"
  ON pipelines FOR UPDATE
  USING (auth.uid() = created_by);

-- Deal Stages Policies
CREATE POLICY "Users can view all deal stages"
  ON deal_stages FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can manage deal stages"
  ON deal_stages FOR ALL
  USING (true)
  WITH CHECK (true);

-- Board Views Policies
CREATE POLICY "Users can view own board views"
  ON board_views FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own board views"
  ON board_views FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Analytics Snapshots Policies
CREATE POLICY "Users can view all analytics"
  ON analytics_snapshots FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert analytics"
  ON analytics_snapshots FOR INSERT
  WITH CHECK (true);

-- Funnel Metrics Policies
CREATE POLICY "Users can view all funnel metrics"
  ON funnel_metrics FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can manage funnel metrics"
  ON funnel_metrics FOR ALL
  USING (true)
  WITH CHECK (true);

-- Channels Policies
CREATE POLICY "Users can view channels they are members of"
  ON channels FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      type = 'public' OR
      auth.uid() = ANY(member_ids) OR
      auth.uid() = created_by
    )
  );

CREATE POLICY "Users can create channels"
  ON channels FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Channel creators and members can update"
  ON channels FOR UPDATE
  USING (auth.uid() = created_by OR auth.uid() = ANY(member_ids));

-- Messages Policies
CREATE POLICY "Users can view messages in accessible channels"
  ON messages FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM channels
      WHERE channels.id = messages.channel_id
      AND (
        channels.type = 'public' OR
        auth.uid() = ANY(channels.member_ids) OR
        auth.uid() = channels.created_by
      )
    )
  );

CREATE POLICY "Users can send messages to accessible channels"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM channels
      WHERE channels.id = messages.channel_id
      AND (
        channels.type = 'public' OR
        auth.uid() = ANY(channels.member_ids)
      )
    )
  );

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
  ON messages FOR DELETE
  USING (auth.uid() = user_id);

-- Message Mentions Policies
CREATE POLICY "Users can view own mentions"
  ON message_mentions FOR SELECT
  USING (auth.uid() = mentioned_user_id);

CREATE POLICY "System can create mentions"
  ON message_mentions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can mark own mentions as read"
  ON message_mentions FOR UPDATE
  USING (auth.uid() = mentioned_user_id);

-- ============================================
-- 11. Triggers
-- ============================================

-- Update timestamp triggers
CREATE TRIGGER update_pipelines_timestamp
  BEFORE UPDATE ON pipelines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_board_views_timestamp
  BEFORE UPDATE ON board_views
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channels_timestamp
  BEFORE UPDATE ON channels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funnel_metrics_timestamp
  BEFORE UPDATE ON funnel_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 12. Default Data
-- ============================================

-- Create default sales pipeline
INSERT INTO pipelines (id, name, description, entity_type, stages, is_default) VALUES
  (
    gen_random_uuid(),
    'Default Sales Pipeline',
    'Standard sales pipeline for deals',
    'deal',
    '[
      {"id": "qualification", "name": "Qualification", "order": 1, "color": "#3B82F6"},
      {"id": "proposal", "name": "Proposal", "order": 2, "color": "#8B5CF6"},
      {"id": "negotiation", "name": "Negotiation", "order": 3, "color": "#F59E0B"},
      {"id": "closed_won", "name": "Closed Won", "order": 4, "color": "#10B981"},
      {"id": "closed_lost", "name": "Closed Lost", "order": 5, "color": "#EF4444"}
    ]'::jsonb,
    true
  )
ON CONFLICT DO NOTHING;

-- Create default team channels
INSERT INTO channels (name, description, type, created_by) VALUES
  ('general', 'General team discussion', 'public', (SELECT id FROM auth.users LIMIT 1)),
  ('sales', 'Sales team channel', 'public', (SELECT id FROM auth.users LIMIT 1)),
  ('support', 'Customer support discussions', 'public', (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- End of Phase 3 Advanced Features Migration
-- ============================================
