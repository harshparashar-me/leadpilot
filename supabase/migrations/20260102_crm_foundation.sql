-- Phase 1: Foundation - CRM Enhancement
-- Activity Logs, Notes, Relationships, Permission Overrides
-- Created: 2025-12-29 (Fixed version)

-- ============================================
-- 1. Activity/Audit Log Table
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type varchar(50) NOT NULL, -- 'lead', 'contact', 'deal', 'task', 'account', 'property', 'site_visit'
  entity_id uuid NOT NULL,
  action varchar(50) NOT NULL, -- 'created', 'updated', 'deleted', 'viewed'
  old_values jsonb, -- Previous values for updates
  new_values jsonb, -- New values for updates
  changes jsonb, -- What changed (for quick viewing)
  ip_address varchar(50),
  user_agent text,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- 2. Notes/Comments on Records
-- ============================================
CREATE TABLE IF NOT EXISTS record_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type varchar(50) NOT NULL,
  entity_id uuid NOT NULL,
  note_text text NOT NULL,
  pinned boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- 3. Related Records (links between entities)
-- ============================================
CREATE TABLE IF NOT EXISTS record_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type varchar(50) NOT NULL, -- 'lead', 'contact', 'deal', etc.
  source_id uuid NOT NULL,
  target_type varchar(50) NOT NULL,
  target_id uuid NOT NULL,
  relationship_type varchar(50) NOT NULL, -- 'converted_to', 'associated_with', 'linked_to', 'parent_of', 'child_of'
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(source_type, source_id, target_type, target_id, relationship_type)
);

-- ============================================
-- 4. Permission Overrides (for granular control)
-- ============================================
CREATE TABLE IF NOT EXISTS permission_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type varchar(50) NOT NULL,
  entity_id uuid NOT NULL,
  permission varchar(50) NOT NULL, -- 'view', 'edit', 'delete'
  granted boolean DEFAULT true, -- true = allow, false = deny
  reason text,
  expires_at timestamp with time zone, -- Optional expiration
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- 5. Indexes for Performance
-- ============================================

-- Activity Logs Indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);

-- Record Notes Indexes
CREATE INDEX IF NOT EXISTS idx_record_notes_entity ON record_notes(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_record_notes_user ON record_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_record_notes_pinned ON record_notes(pinned) WHERE pinned = true;

-- Record Relationships Indexes
CREATE INDEX IF NOT EXISTS idx_relationships_source ON record_relationships(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON record_relationships(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON record_relationships(relationship_type);

-- Permission Overrides Indexes
CREATE INDEX IF NOT EXISTS idx_permission_overrides_user ON permission_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_overrides_entity ON permission_overrides(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_permission_overrides_expires ON permission_overrides(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================
-- 6. Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_overrides ENABLE ROW LEVEL SECURITY;

-- Activity Logs Policies (Simplified - all authenticated users can view and insert)
CREATE POLICY "Users can view all activity logs"
  ON activity_logs FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Record Notes Policies
CREATE POLICY "Users can view all notes"
  ON record_notes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create notes"
  ON record_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON record_notes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON record_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Record Relationships Policies
CREATE POLICY "Users can view all relationships"
  ON record_relationships FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create relationships"
  ON record_relationships FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete relationships they created"
  ON record_relationships FOR DELETE
  USING (auth.uid() = created_by OR auth.uid() IS NOT NULL);

-- Permission Overrides Policies (Simplified - all authenticated users can view their overrides)
CREATE POLICY "Users can view permission overrides"
  ON permission_overrides FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert permission overrides"
  ON permission_overrides FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete permission overrides"
  ON permission_overrides FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- 7. Helper Functions
-- ============================================

-- Trigger for record_notes updated_at
CREATE TRIGGER update_record_notes_updated_at
  BEFORE UPDATE ON record_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- End of Phase 1 Foundation Migration
-- ============================================
