-- Safe migration for Meta Ads Integration
-- Ensures tables exist without erroring if they are already present

DO $$ 
BEGIN 

    -- 1. Create ads_accounts table if not exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ads_accounts') THEN
        CREATE TABLE ads_accounts (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            platform varchar(50) NOT NULL, -- 'meta', 'google'
            account_id varchar(255) NOT NULL,
            account_name varchar(500),
            access_token text NOT NULL,
            refresh_token text,
            token_expires_at timestamp with time zone,
            is_active boolean DEFAULT true,
            last_sync_at timestamp with time zone,
            created_by uuid REFERENCES auth.users(id),
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now(),
            UNIQUE(platform, account_id)
        );
        -- RLS
        ALTER TABLE ads_accounts ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view ads accounts" ON ads_accounts FOR SELECT USING (auth.uid() IS NOT NULL);
        CREATE POLICY "Users can manage ads accounts" ON ads_accounts FOR ALL USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
    END IF;

    -- 2. Create meta_ads_leads table if not exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'meta_ads_leads') THEN
        CREATE TABLE meta_ads_leads (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            ad_id varchar(255),
            ad_name varchar(500),
            form_id varchar(255),
            form_name varchar(500),
            field_data jsonb NOT NULL,
            lead_id uuid, -- Linked CRM lead
            imported boolean DEFAULT false,
            imported_at timestamp with time zone,
            created_time varchar(100),
            created_at timestamp with time zone DEFAULT now()
        );
        -- RLS
        ALTER TABLE meta_ads_leads ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view meta leads" ON meta_ads_leads FOR SELECT USING (auth.uid() IS NOT NULL);
        CREATE POLICY "Users can insert meta leads" ON meta_ads_leads FOR INSERT WITH CHECK (true);
    END IF;

END $$;
