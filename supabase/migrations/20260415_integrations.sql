-- Integration System - Webhooks, Meta Ads, Google Ads, WhatsApp
-- Created: 2025-12-29

-- ============================================
-- 1. Webhooks Configuration Table
-- ============================================
CREATE TABLE IF NOT EXISTS webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  url varchar(1000) NOT NULL,
  secret_key varchar(255), -- For HMAC verification
  events text[] NOT NULL, -- ['lead.created', 'deal.won', etc.]
  enabled boolean DEFAULT true,
  retry_config jsonb, -- {"max_retries": 3, "backoff": "exponential"}
  headers jsonb, -- Custom headers to send
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- 2. Webhook Deliveries Table (Logs)
-- ============================================
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type varchar(100) NOT NULL,
  payload jsonb NOT NULL,
  response_status integer,
  response_body text,
  error_message text,
  retry_count integer DEFAULT 0,
  delivered_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- 3. Meta Ads Leads Table
-- ============================================
CREATE TABLE IF NOT EXISTS meta_ads_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id varchar(255),
  ad_name varchar(500),
  form_id varchar(255),
  form_name varchar(500),
  field_data jsonb NOT NULL, -- Form field responses
  lead_id uuid, -- Linked CRM lead after import
  imported boolean DEFAULT false,
  imported_at timestamp with time zone,
  created_time varchar(100), -- From Meta
  created_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- 4. Google Ads Leads Table
-- ============================================
CREATE TABLE IF NOT EXISTS google_ads_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id varchar(255),
  campaign_name varchar(500),
  ad_group_id varchar(255),
  form_data jsonb NOT NULL,
  lead_id uuid, -- Linked CRM lead
  imported boolean DEFAULT false,
  imported_at timestamp with time zone,
  gclid varchar(255), -- Google Click ID
  created_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- 5. WhatsApp Conversations Table
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number varchar(20) NOT NULL,
  contact_name varchar(255),
  entity_type varchar(50), -- 'lead', 'contact'
  entity_id uuid,
  last_message_at timestamp with time zone,
  unread_count integer DEFAULT 0,
  status varchar(50) DEFAULT 'active', -- 'active', 'archived', 'blocked'
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- 6. WhatsApp Messages Table
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  message_id varchar(255) UNIQUE, -- WhatsApp message ID
  direction varchar(50) NOT NULL, -- 'inbound', 'outbound'
  message_type varchar(50) DEFAULT 'text', -- 'text', 'image', 'document', 'audio', 'video'
  content text,
  media_url varchar(1000),
  status varchar(50) DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'failed'
  sent_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- 7. Ads Accounts Table (Store credentials)
-- ============================================
CREATE TABLE IF NOT EXISTS ads_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform varchar(50) NOT NULL, -- 'meta', 'google'
  account_id varchar(255) NOT NULL,
  account_name varchar(500),
  access_token text NOT NULL, -- Encrypted
  refresh_token text,
  token_expires_at timestamp with time zone,
  is_active boolean DEFAULT true,
  last_sync_at timestamp with time zone,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(platform, account_id)
);

-- ============================================
-- 8. WhatsApp Templates Table (Message templates)
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL UNIQUE,
  language varchar(10) DEFAULT 'en',
  category varchar(50), -- 'marketing', 'utility', 'authentication'
  template_text text NOT NULL,
  variables jsonb, -- Template variables
  status varchar(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- 9. Indexes for Performance
-- ============================================

-- Webhooks Indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_enabled ON webhooks(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_webhooks_events ON webhooks USING GIN(events);

-- Webhook Deliveries Indexes
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event ON webhook_deliveries(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created ON webhook_deliveries(created_at DESC);

-- Meta Ads Leads Indexes
CREATE INDEX IF NOT EXISTS idx_meta_ads_imported ON meta_ads_leads(imported);
CREATE INDEX IF NOT EXISTS idx_meta_ads_lead_id ON meta_ads_leads(lead_id);
CREATE INDEX IF NOT EXISTS idx_meta_ads_created ON meta_ads_leads(created_at DESC);

-- Google Ads Leads Indexes
CREATE INDEX IF NOT EXISTS idx_google_ads_imported ON google_ads_leads(imported);
CREATE INDEX IF NOT EXISTS idx_google_ads_lead_id ON google_ads_leads(lead_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_gclid ON google_ads_leads(gclid);

-- WhatsApp Conversations Indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_phone ON whatsapp_conversations(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_entity ON whatsapp_conversations(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_status ON whatsapp_conversations(status);

-- WhatsApp Messages Indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_msg_conv ON whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_msg_created ON whatsapp_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_msg_id ON whatsapp_messages(message_id);

-- Ads Accounts Indexes
CREATE INDEX IF NOT EXISTS idx_ads_accounts_platform ON ads_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_ads_accounts_active ON ads_accounts(is_active) WHERE is_active = true;

-- WhatsApp Templates Indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_status ON whatsapp_templates(status);

-- ============================================
-- 10. Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_ads_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_ads_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- Webhooks Policies
CREATE POLICY "Users can view all webhooks"
  ON webhooks FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage webhooks"
  ON webhooks FOR ALL
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Webhook Deliveries Policies
CREATE POLICY "Users can view webhook deliveries"
  ON webhook_deliveries FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert webhook deliveries"
  ON webhook_deliveries FOR INSERT
  WITH CHECK (true);

-- Meta Ads Leads Policies
CREATE POLICY "Users can view Meta ads leads"
  ON meta_ads_leads FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert Meta ads leads"
  ON meta_ads_leads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update Meta ads leads"
  ON meta_ads_leads FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Google Ads Leads Policies (similar to Meta)
CREATE POLICY "Users can view Google ads leads"
  ON google_ads_leads FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert Google ads leads"
  ON google_ads_leads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update Google ads leads"
  ON google_ads_leads FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- WhatsApp Conversations Policies
CREATE POLICY "Users can view all WhatsApp conversations"
  ON whatsapp_conversations FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage WhatsApp conversations"
  ON whatsapp_conversations FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (true);

-- WhatsApp Messages Policies
CREATE POLICY "Users can view WhatsApp messages"
  ON whatsapp_messages FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can send WhatsApp messages"
  ON whatsapp_messages FOR INSERT
  WITH CHECK (auth.uid() = sent_by OR auth.uid() IS NOT NULL);

-- Ads Accounts Policies
CREATE POLICY "Users can view ads accounts"
  ON ads_accounts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage own ads accounts"
  ON ads_accounts FOR ALL
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- WhatsApp Templates Policies
CREATE POLICY "Users can view WhatsApp templates"
  ON whatsapp_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage WhatsApp templates"
  ON whatsapp_templates FOR ALL
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- ============================================
-- 11. Triggers
-- ============================================

CREATE TRIGGER update_webhooks_timestamp
  BEFORE UPDATE ON webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_conversations_timestamp
  BEFORE UPDATE ON whatsapp_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ads_accounts_timestamp
  BEFORE UPDATE ON ads_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_templates_timestamp
  BEFORE UPDATE ON whatsapp_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- End of Integration System Migration
-- ============================================
