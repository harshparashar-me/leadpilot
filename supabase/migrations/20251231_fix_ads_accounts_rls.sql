-- Fix RLS policies for ads_accounts table
-- Allow authenticated users to insert ads accounts

-- Drop ALL existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can manage own ads accounts" ON ads_accounts;
DROP POLICY IF EXISTS "Users can manage ads accounts" ON ads_accounts;
DROP POLICY IF EXISTS "Users can view ads accounts" ON ads_accounts;
DROP POLICY IF EXISTS "Users can insert ads accounts" ON ads_accounts;
DROP POLICY IF EXISTS "Users can update own ads accounts" ON ads_accounts;
DROP POLICY IF EXISTS "Users can delete own ads accounts" ON ads_accounts;

-- Create more permissive policies
-- Allow authenticated users to insert (for development/demo)
CREATE POLICY "Users can insert ads accounts"
  ON ads_accounts FOR INSERT
  WITH CHECK (true); -- Allow inserts for demo (no auth required)

-- Allow users to view all ads accounts
CREATE POLICY "Users can view ads accounts"
  ON ads_accounts FOR SELECT
  USING (true); -- Allow viewing for demo (no auth required)

-- Allow users to update/delete their own accounts
CREATE POLICY "Users can update own ads accounts"
  ON ads_accounts FOR UPDATE
  USING (auth.uid() = created_by OR created_by IS NULL)
  WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can delete own ads accounts"
  ON ads_accounts FOR DELETE
  USING (auth.uid() = created_by OR created_by IS NULL);

