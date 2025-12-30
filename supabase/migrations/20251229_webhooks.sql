-- Create Webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    source TEXT NOT NULL, -- 'generic', 'facebook', 'google'
    secret TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Webhook Events table (Log)
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,
    payload JSONB,
    headers JSONB,
    status TEXT DEFAULT 'received', -- 'received', 'processed', 'failed'
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Policies for Webhooks
CREATE POLICY "Users can view webhooks" ON webhooks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert webhooks" ON webhooks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update webhooks" ON webhooks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete webhooks" ON webhooks FOR DELETE TO authenticated USING (true);

-- Policies for Webhook Events
CREATE POLICY "Users can view events" ON webhook_events FOR SELECT TO authenticated USING (true);
-- Allow anonymous inserts for simulation (In prod, this would be restricted to the Edge Function service role)
CREATE POLICY "Allow public insert for events" ON webhook_events FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow authenticated insert for events" ON webhook_events FOR INSERT TO authenticated WITH CHECK (true);

-- Indexes
CREATE INDEX idx_webhooks_source ON webhooks(source);
CREATE INDEX idx_events_webhook_id ON webhook_events(webhook_id);
CREATE INDEX idx_events_status ON webhook_events(status);
