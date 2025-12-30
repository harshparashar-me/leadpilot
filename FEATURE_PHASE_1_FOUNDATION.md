# 🏗️ PHASE 1: FOUNDATION - Permission Enforcement, Activity Feed, Related Records

**Duration**: 2 weeks  
**Complexity**: Medium  
**Dependencies**: Users & Roles system (already implemented)  
**Priority**: High - Core security & tracking foundation

---

## Overview

```
Phase 1 builds on the existing Users & Roles system to create:
├─ Permission Enforcement (row-level access control)
├─ Activity Feed (audit trail & notes)
└─ Related Records Sidebar (data relationships)
```

---

## 1.1 Database Schema

**File**: `supabase/migrations/20260102_crm_foundation.sql`

```sql
-- Activity/Audit Log Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type varchar(50) NOT NULL, -- 'lead', 'contact', 'deal', 'task', etc.
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

-- Notes/Comments on Records
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

-- Related Records (links between entities)
CREATE TABLE IF NOT EXISTS record_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type varchar(50) NOT NULL, -- 'lead', 'contact', 'deal'
  source_id uuid NOT NULL,
  target_type varchar(50) NOT NULL,
  target_id uuid NOT NULL,
  relationship_type varchar(50) NOT NULL, -- 'converted_to', 'associated_with', etc.
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(source_type, source_id, target_type, target_id, relationship_type)
);

-- Permission Overrides (for granular control)
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

-- Indexes
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);
CREATE INDEX idx_record_notes_entity ON record_notes(entity_type, entity_id);
CREATE INDEX idx_record_notes_user ON record_notes(user_id);
CREATE INDEX idx_relationships_source ON record_relationships(source_type, source_id);
CREATE INDEX idx_relationships_target ON record_relationships(target_type, target_id);
CREATE INDEX idx_permission_overrides_user ON permission_overrides(user_id);
CREATE INDEX idx_permission_overrides_entity ON permission_overrides(entity_type, entity_id);

-- RLS Policies for Activity Logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activity logs for entities they can access"
  ON activity_logs FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    (
      -- Owner can always view
      user_id = auth.uid() OR
      -- Check entity-level permissions
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid() AND
        u.role_id IN (
          SELECT id FROM roles WHERE permissions ? 'view_all_activity'
        )
      ) OR
      -- Team leads can view team activity
      EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid() AND
        u.role_id IN (
          SELECT id FROM roles WHERE permissions ? 'view_team_activity'
        )
      )
    )
  );

-- RLS Policies for Record Notes
ALTER TABLE record_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notes on records they can access"
  ON record_notes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create notes on records they can edit"
  ON record_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON record_notes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Record Relationships
ALTER TABLE record_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view relationships for accessible records"
  ON record_relationships FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create relationships"
  ON record_relationships FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```

---

## 1.2 Permission Enforcement Service

**File**: `src/lib/permissions.ts`

```typescript
import { supabase } from './supabase';
import { User, Role } from '../types/database';

export type PermissionAction = 'view' | 'edit' | 'delete' | 'create' | 'export';
export type EntityType = 'lead' | 'contact' | 'deal' | 'task' | 'account' | 'property';

export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
}

/**
 * Check if user has permission on entity
 */
export const checkPermission = async (
  userId: string,
  entityType: EntityType,
  entityId: string,
  action: PermissionAction
): Promise<PermissionCheck> => {
  try {
    // Get user role
    const { data: user } = await supabase
      .from('users')
      .select('role_id, roles(permissions)')
      .eq('id', userId)
      .single();

    if (!user) return { allowed: false, reason: 'User not found' };

    const permissions = user.roles?.permissions || [];

    // Check explicit denies (overrides)
    const { data: deny } = await supabase
      .from('permission_overrides')
      .select('*')
      .eq('user_id', userId)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('permission', action)
      .eq('granted', false)
      .gte('expires_at', new Date().toISOString())
      .limit(1)
      .single();

    if (deny) {
      return { allowed: false, reason: `Access explicitly denied: ${deny.reason || ''}` };
    }

    // Check explicit grants (overrides)
    const { data: grant } = await supabase
      .from('permission_overrides')
      .select('*')
      .eq('user_id', userId)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('permission', action)
      .eq('granted', true)
      .lte('expires_at', new Date().toISOString())
      .limit(1)
      .single();

    if (grant) {
      return { allowed: true };
    }

    // Check role-based permissions
    const permissionKey = `${action}_${entityType}`;
    const allPermissionKey = `${action}_all`;

    if (
      permissions.includes(permissionKey) ||
      permissions.includes(allPermissionKey)
    ) {
      return { allowed: true };
    }

    return { allowed: false, reason: `Permission denied: ${action} on ${entityType}` };
  } catch (error: any) {
    console.error('Permission check error:', error);
    return { allowed: false, reason: 'Permission check failed' };
  }
};

/**
 * Get entity owner
 */
export const getEntityOwner = async (entityType: EntityType, entityId: string) => {
  const table = `${entityType}s`;
  
  const { data } = await supabase
    .from(table)
    .select('created_by, assigned_to')
    .eq('id', entityId)
    .single();

  return data?.created_by || data?.assigned_to;
};

/**
 * Grant permission override
 */
export const grantPermissionOverride = async (
  userId: string,
  entityType: EntityType,
  entityId: string,
  action: PermissionAction,
  reason: string,
  expiresAt?: Date
) => {
  const { data, error } = await supabase
    .from('permission_overrides')
    .insert([
      {
        user_id: userId,
        entity_type: entityType,
        entity_id: entityId,
        permission: action,
        granted: true,
        reason,
        expires_at: expiresAt?.toISOString(),
        created_by: (await supabase.auth.getUser()).data.user?.id,
      },
    ])
    .select();

  if (error) throw error;
  return data;
};

/**
 * Revoke permission override
 */
export const revokePermissionOverride = async (
  userId: string,
  entityType: EntityType,
  entityId: string,
  action: PermissionAction
) => {
  const { error } = await supabase
    .from('permission_overrides')
    .delete()
    .eq('user_id', userId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('permission', action)
    .eq('granted', true);

  if (error) throw error;
};

/**
 * Deny permission (override)
 */
export const denyPermissionOverride = async (
  userId: string,
  entityType: EntityType,
  entityId: string,
  action: PermissionAction,
  reason: string
) => {
  const { data, error } = await supabase
    .from('permission_overrides')
    .insert([
      {
        user_id: userId,
        entity_type: entityType,
        entity_id: entityId,
        permission: action,
        granted: false,
        reason,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      },
    ])
    .select();

  if (error) throw error;
  return data;
};

/**
 * Filter entities by user permissions
 */
export const filterByPermissions = async (
  userId: string,
  entities: any[],
  entityType: EntityType,
  action: PermissionAction = 'view'
): Promise<any[]> => {
  const allowed: any[] = [];

  for (const entity of entities) {
    const { allowed: hasPermission } = await checkPermission(
      userId,
      entityType,
      entity.id,
      action
    );

    if (hasPermission) {
      allowed.push(entity);
    }
  }

  return allowed;
};

/**
 * Get permission summary for user
 */
export const getPermissionSummary = async (userId: string) => {
  const { data: user } = await supabase
    .from('users')
    .select('role_id, roles(permissions)')
    .eq('id', userId)
    .single();

  const { data: overrides } = await supabase
    .from('permission_overrides')
    .select('*')
    .eq('user_id', userId)
    .gte('expires_at', new Date().toISOString());

  return {
    role_permissions: user?.roles?.permissions || [],
    overrides: overrides || [],
  };
};
```

---

## 1.3 Activity Logging Service

**File**: `src/lib/activity.ts`

```typescript
import { supabase } from './supabase';

export interface ActivityLogEntry {
  entity_type: string;
  entity_id: string;
  action: 'created' | 'updated' | 'deleted' | 'viewed';
  old_values?: any;
  new_values?: any;
  notes?: string;
}

/**
 * Log activity
 */
export const logActivity = async (
  entityType: string,
  entityId: string,
  action: 'created' | 'updated' | 'deleted' | 'viewed',
  oldValues?: any,
  newValues?: any,
  notes?: string
) => {
  const user = await supabase.auth.getUser();
  
  if (!user.data.user) {
    console.warn('No authenticated user for activity log');
    return;
  }

  // Calculate what changed
  let changes = {};
  if (oldValues && newValues) {
    Object.keys(newValues).forEach((key) => {
      if (oldValues[key] !== newValues[key]) {
        changes = {
          ...changes,
          [key]: { old: oldValues[key], new: newValues[key] },
        };
      }
    });
  }

  const { error } = await supabase.from('activity_logs').insert([
    {
      user_id: user.data.user.id,
      entity_type: entityType,
      entity_id: entityId,
      action,
      old_values: oldValues || null,
      new_values: newValues || null,
      changes: Object.keys(changes).length > 0 ? changes : null,
      ip_address: null, // Could be captured if needed
      user_agent: navigator.userAgent,
      notes: notes || null,
    },
  ]);

  if (error) {
    console.error('Error logging activity:', error);
  }
};

/**
 * Get activity history for entity
 */
export const getActivityHistory = async (
  entityType: string,
  entityId: string,
  limit = 50
) => {
  const { data, error } = await supabase
    .from('activity_logs')
    .select(
      `
      *,
      user:users(id, email, name)
    `
    )
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};

/**
 * Get user activity feed
 */
export const getUserActivityFeed = async (userId: string, limit = 20) => {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};

/**
 * Get team activity feed
 */
export const getTeamActivityFeed = async (limit = 50) => {
  const { data, error } = await supabase
    .from('activity_logs')
    .select(
      `
      *,
      user:users(id, email, name)
    `
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};

/**
 * Add note to record
 */
export const addNote = async (
  entityType: string,
  entityId: string,
  noteText: string,
  pinned = false
) => {
  const user = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('record_notes')
    .insert([
      {
        user_id: user.data.user?.id,
        entity_type: entityType,
        entity_id: entityId,
        note_text: noteText,
        pinned,
      },
    ])
    .select();

  if (error) throw error;
  return data;
};

/**
 * Get notes for record
 */
export const getNotes = async (entityType: string, entityId: string) => {
  const { data, error } = await supabase
    .from('record_notes')
    .select(
      `
      *,
      user:users(id, email, name)
    `
    )
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

/**
 * Delete note
 */
export const deleteNote = async (noteId: string) => {
  const { error } = await supabase
    .from('record_notes')
    .delete()
    .eq('id', noteId);

  if (error) throw error;
};

/**
 * Pin/unpin note
 */
export const toggleNotePin = async (noteId: string, pinned: boolean) => {
  const { error } = await supabase
    .from('record_notes')
    .update({ pinned })
    .eq('id', noteId);

  if (error) throw error;
};
```

---

## 1.4 Related Records Service

**File**: `src/lib/relationships.ts`

```typescript
import { supabase } from './supabase';

export type RelationshipType = 
  | 'converted_to' 
  | 'associated_with' 
  | 'linked_to' 
  | 'parent_of' 
  | 'child_of';

/**
 * Create relationship between records
 */
export const createRelationship = async (
  sourceType: string,
  sourceId: string,
  targetType: string,
  targetId: string,
  relationshipType: RelationshipType
) => {
  const user = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('record_relationships')
    .insert([
      {
        source_type: sourceType,
        source_id: sourceId,
        target_type: targetType,
        target_id: targetId,
        relationship_type: relationshipType,
        created_by: user.data.user?.id,
      },
    ])
    .select();

  if (error) throw error;
  return data;
};

/**
 * Get related records
 */
export const getRelatedRecords = async (
  sourceType: string,
  sourceId: string
) => {
  const { data, error } = await supabase
    .from('record_relationships')
    .select('*')
    .eq('source_type', sourceType)
    .eq('source_id', sourceId);

  if (error) throw error;
  return data;
};

/**
 * Get records related to this one
 */
export const getRelatedToRecords = async (
  targetType: string,
  targetId: string
) => {
  const { data, error } = await supabase
    .from('record_relationships')
    .select('*')
    .eq('target_type', targetType)
    .eq('target_id', targetId);

  if (error) throw error;
  return data;
};

/**
 * Get all relationships for record
 */
export const getAllRelationships = async (
  entityType: string,
  entityId: string
) => {
  const outgoing = await getRelatedRecords(entityType, entityId);
  const incoming = await getRelatedToRecords(entityType, entityId);

  return {
    outgoing,
    incoming,
    all: [...outgoing, ...incoming],
  };
};

/**
 * Delete relationship
 */
export const deleteRelationship = async (
  sourceType: string,
  sourceId: string,
  targetType: string,
  targetId: string,
  relationshipType: RelationshipType
) => {
  const { error } = await supabase
    .from('record_relationships')
    .delete()
    .eq('source_type', sourceType)
    .eq('source_id', sourceId)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .eq('relationship_type', relationshipType);

  if (error) throw error;
};

/**
 * Convert lead to contact
 */
export const convertLeadToContact = async (leadId: string, contactId: string) => {
  return createRelationship('lead', leadId, 'contact', contactId, 'converted_to');
};

/**
 * Link contact to deal
 */
export const linkContactToDeal = async (contactId: string, dealId: string) => {
  return createRelationship('contact', contactId, 'deal', dealId, 'associated_with');
};
```

---

## 1.5 Activity Feed Component

**File**: `src/components/ActivityFeed.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { getActivityHistory, logActivity } from '../lib/activity';
import { format } from 'date-fns';
import { ChevronDown, User, Edit, Trash2, Eye } from 'lucide-react';

interface ActivityFeedProps {
  entityType: string;
  entityId: string;
  limit?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  entityType,
  entityId,
  limit = 20,
}) => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const data = await getActivityHistory(entityType, entityId, limit);
        setActivities(data);
      } catch (err) {
        console.error('Error fetching activities:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [entityType, entityId, limit]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <Edit className="h-4 w-4 text-green-600" />;
      case 'updated':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'deleted':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'viewed':
        return <Eye className="h-4 w-4 text-gray-600" />;
      default:
        return <Edit className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionLabel = (action: string) => {
    return action.charAt(0).toUpperCase() + action.slice(1);
  };

  if (loading) {
    return <div className="text-center py-4 text-gray-500">Loading activity...</div>;
  }

  if (activities.length === 0) {
    return <div className="text-center py-4 text-gray-500">No activity yet</div>;
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className="border rounded-lg p-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="pt-1">{getActionIcon(activity.action)}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {activity.user?.name || activity.user?.email}
                  </span>
                  <span className="text-xs text-gray-500">
                    {getActionLabel(activity.action)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(activity.created_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>
            {activity.changes && Object.keys(activity.changes).length > 0 && (
              <button
                onClick={() =>
                  setExpandedId(expandedId === activity.id ? null : activity.id)
                }
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronDown
                  className={`h-4 w-4 transition ${
                    expandedId === activity.id ? 'rotate-180' : ''
                  }`}
                />
              </button>
            )}
          </div>

          {expandedId === activity.id && activity.changes && (
            <div className="mt-3 pt-3 border-t space-y-2">
              {Object.entries(activity.changes).map(([key, change]: any) => (
                <div key={key} className="text-xs">
                  <span className="font-medium capitalize">{key}:</span>
                  <span className="text-gray-600 ml-2">
                    {change.old} → {change.new}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activity.notes && (
            <div className="mt-2 pt-2 border-t">
              <p className="text-xs text-gray-700">{activity.notes}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ActivityFeed;
```

---

## 1.6 Related Records Sidebar

**File**: `src/components/RelatedRecordsSidebar.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { getAllRelationships } from '../lib/relationships';
import { Link } from 'react-router-dom';
import { X, Plus } from 'lucide-react';

interface RelatedRecordsSidebarProps {
  entityType: string;
  entityId: string;
  onAddRelationship?: () => void;
}

export const RelatedRecordsSidebar: React.FC<RelatedRecordsSidebarProps> = ({
  entityType,
  entityId,
  onAddRelationship,
}) => {
  const [relationships, setRelationships] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelationships = async () => {
      try {
        const data = await getAllRelationships(entityType, entityId);
        setRelationships(data);
      } catch (err) {
        console.error('Error fetching relationships:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRelationships();
  }, [entityType, entityId]);

  if (loading) {
    return <div className="text-gray-500 text-sm">Loading...</div>;
  }

  const hasRelationships =
    (relationships?.outgoing?.length || 0) +
      (relationships?.incoming?.length || 0) >
    0;

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Related Records</h3>
        {onAddRelationship && (
          <button
            onClick={onAddRelationship}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {!hasRelationships ? (
        <p className="text-xs text-gray-500">No related records</p>
      ) : (
        <div className="space-y-4">
          {/* Outgoing relationships */}
          {relationships?.outgoing?.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2">Associated</h4>
              <div className="space-y-1">
                {relationships.outgoing.map((rel: any) => (
                  <Link
                    key={rel.id}
                    to={`/${rel.target_type}/${rel.target_id}`}
                    className="block text-xs text-blue-600 hover:underline truncate"
                  >
                    {rel.target_type}: {rel.target_id.slice(0, 8)}...
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Incoming relationships */}
          {relationships?.incoming?.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2">Related To</h4>
              <div className="space-y-1">
                {relationships.incoming.map((rel: any) => (
                  <Link
                    key={rel.id}
                    to={`/${rel.source_type}/${rel.source_id}`}
                    className="block text-xs text-blue-600 hover:underline truncate"
                  >
                    {rel.source_type}: {rel.source_id.slice(0, 8)}...
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RelatedRecordsSidebar;
```

---

## 1.7 Notes Component

**File**: `src/components/RecordNotes.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { getNotes, addNote, deleteNote, toggleNotePin } from '../lib/activity';
import { Pin, Trash2, Send } from 'lucide-react';
import { format } from 'date-fns';

interface RecordNotesProps {
  entityType: string;
  entityId: string;
}

export const RecordNotes: React.FC<RecordNotesProps> = ({
  entityType,
  entityId,
}) => {
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const data = await getNotes(entityType, entityId);
        setNotes(data);
      } catch (err) {
        console.error('Error fetching notes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [entityType, entityId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      await addNote(entityType, entityId, newNote);
      setNewNote('');
      const updatedNotes = await getNotes(entityType, entityId);
      setNotes(updatedNotes);
    } catch (err) {
      console.error('Error adding note:', err);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      const updatedNotes = await getNotes(entityType, entityId);
      setNotes(updatedNotes);
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  const handleTogglePin = async (noteId: string, pinned: boolean) => {
    try {
      await toggleNotePin(noteId, !pinned);
      const updatedNotes = await getNotes(entityType, entityId);
      setNotes(updatedNotes);
    } catch (err) {
      console.error('Error toggling pin:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Note */}
      <form onSubmit={handleAddNote} className="flex gap-2">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note..."
          rows={3}
          className="flex-1 px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <button
          type="submit"
          disabled={!newNote.trim()}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      {/* Notes List */}
      <div className="space-y-2">
        {notes.map((note) => (
          <div
            key={note.id}
            className={`p-3 rounded-lg border ${
              note.pinned ? 'bg-yellow-50 border-yellow-200' : 'bg-white'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm text-gray-900">{note.note_text}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {note.user?.name} · {format(new Date(note.created_at), 'MMM d, h:mm a')}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleTogglePin(note.id, note.pinned)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Pin
                    className={`h-4 w-4 ${
                      note.pinned ? 'fill-yellow-600 text-yellow-600' : 'text-gray-400'
                    }`}
                  />
                </button>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="p-1 hover:bg-gray-100 rounded text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecordNotes;
```

---

## 1.8 Update Entity Pages

Update existing entity pages (leads, contacts, deals) to include:

**Example: LeadsDrawer.tsx**

```typescript
// Add these imports at top
import ActivityFeed from '../components/ActivityFeed';
import RecordNotes from '../components/RecordNotes';
import RelatedRecordsSidebar from '../components/RelatedRecordsSidebar';

// Add to drawer content (after basic info)
<div className="space-y-6">
  {/* Basic Info */}
  {/* ... existing code ... */}

  {/* Tabs for Activity/Notes */}
  <div className="border-t pt-4">
    <div className="flex gap-4 border-b mb-4">
      <button className="px-4 py-2 border-b-2 border-blue-600">Activity</button>
      <button className="px-4 py-2 text-gray-600">Notes</button>
    </div>
    <ActivityFeed entityType="lead" entityId={lead.id} />
  </div>

  {/* Related Records Sidebar */}
  <RelatedRecordsSidebar entityType="lead" entityId={lead.id} />
</div>
```

---

## 1.9 Implementation Checklist

- [ ] Create migration: `20260102_crm_foundation.sql`
- [ ] Run: `supabase db push`
- [ ] Create: `src/lib/permissions.ts`
- [ ] Create: `src/lib/activity.ts` (update existing)
- [ ] Create: `src/lib/relationships.ts`
- [ ] Create: `src/components/ActivityFeed.tsx`
- [ ] Create: `src/components/RecordNotes.tsx`
- [ ] Create: `src/components/RelatedRecordsSidebar.tsx`
- [ ] Update entity pages (leads, contacts, deals, tasks)
- [ ] Test permission checking
- [ ] Test activity logging
- [ ] Test note creation
- [ ] Test relationships

---

## 1.10 Testing Guide

```bash
# Test permissions
curl -X POST http://localhost:3000/api/check-permission \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id",
    "entityType": "lead",
    "entityId": "lead-id",
    "action": "edit"
  }'

# Test activity logging
const { logActivity } = require('./lib/activity');
await logActivity('lead', leadId, 'updated', oldData, newData);

# Test relationships
const { createRelationship } = require('./lib/relationships');
await createRelationship('lead', leadId, 'contact', contactId, 'converted_to');
```

---

## 1.11 Performance Notes

```
OPTIMIZATION TIPS
├─ Index frequently queried fields
├─ Cache permission checks (5 min TTL)
├─ Batch activity log writes
├─ Use materialized views for reports
└─ Archive old activity logs (>1 year)

SCALING STRATEGY
├─ Partition activity_logs by date
├─ Separate read replica for reports
├─ Archive logs to cold storage
└─ Use batch operations for bulk updates
```

---

**Status**: Ready for Implementation  
**Effort**: 2 weeks (one developer)  
**Complexity**: Medium
