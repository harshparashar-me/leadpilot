-- ============================================
-- Multi-Tenant & OTP System Migration
-- ============================================

-- 1. Create Companies Table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  domain varchar(255), -- Company domain for email matching
  status varchar(50) DEFAULT 'active', -- active, suspended, inactive
  subscription_tier varchar(50) DEFAULT 'starter', -- starter, professional, enterprise
  subscription_expires_at timestamp with time zone,
  settings jsonb DEFAULT '{}', -- Company-level settings
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(name)
);

-- 2. Add company_id to users table
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE users ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Create OTP Table for email verification and password reset
CREATE TABLE IF NOT EXISTS email_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL,
  otp varchar(6) NOT NULL,
  purpose varchar(50) NOT NULL, -- 'signup', 'password_reset', 'email_verification'
  expires_at timestamp with time zone NOT NULL,
  used boolean DEFAULT false,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps(email);
CREATE INDEX IF NOT EXISTS idx_email_otps_otp ON email_otps(otp);
CREATE INDEX IF NOT EXISTS idx_email_otps_purpose ON email_otps(purpose);
CREATE INDEX IF NOT EXISTS idx_email_otps_expires ON email_otps(expires_at) WHERE used = false;

-- 5. Update updated_at trigger for companies
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_timestamp
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Cleanup expired OTPs (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM email_otps 
  WHERE expires_at < now() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS Policies for Multi-Tenancy
-- ============================================

-- Enable RLS on companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;

-- Companies: Users can view their own company
CREATE POLICY "Users can view own company"
  ON companies FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Companies: Allow inserts for signup (no auth required initially)
CREATE POLICY "Allow company creation"
  ON companies FOR INSERT
  WITH CHECK (true);

-- Email OTPs: Users can view their own OTPs
CREATE POLICY "Users can view own OTPs"
  ON email_otps FOR SELECT
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR user_id = auth.uid());

-- Email OTPs: System can insert OTPs (no auth required for signup)
CREATE POLICY "Allow OTP creation"
  ON email_otps FOR INSERT
  WITH CHECK (true);

-- Email OTPs: Users can update their own unused OTPs (to mark as used)
CREATE POLICY "Users can update own OTPs"
  ON email_otps FOR UPDATE
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR user_id = auth.uid())
  WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR user_id = auth.uid());

