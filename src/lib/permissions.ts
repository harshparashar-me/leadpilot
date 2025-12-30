import { supabase } from './supabase';

export type PermissionAction = 'view' | 'edit' | 'delete' | 'create' | 'export';
export type EntityType = 'lead' | 'contact' | 'deal' | 'task' | 'account' | 'property' | 'site_visit';

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
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('role_id, roles(name, permissions)')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            return { allowed: false, reason: 'User not found' };
        }

        const permissions = (user.roles as any)?.permissions || {};
        const roleName = (user.roles as any)?.name;

        // Admins have all permissions
        if (roleName === 'Admin') {
            return { allowed: true };
        }

        // Check explicit denies (overrides)
        const { data: deny } = await supabase
            .from('permission_overrides')
            .select('*')
            .eq('user_id', userId)
            .eq('entity_type', entityType)
            .eq('entity_id', entityId)
            .eq('permission', action)
            .eq('granted', false)
            .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
            .limit(1)
            .maybeSingle();

        if (deny) {
            return { allowed: false, reason: `Access explicitly denied: ${deny.reason || 'No reason provided'}` };
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
            .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
            .limit(1)
            .maybeSingle();

        if (grant) {
            return { allowed: true };
        }

        // Check role-based permissions
        const permissionKey = `${action}_${entityType}`;
        const allPermissionKey = `${action}_all`;
        const viewAllKey = 'view_all';

        if (
            permissions[permissionKey] === true ||
            permissions[allPermissionKey] === true ||
            (action === 'view' && permissions[viewAllKey] === true)
        ) {
            return { allowed: true };
        }

        // Check if user owns the entity
        const ownerCheck = await getEntityOwner(entityType, entityId);
        if (ownerCheck === userId) {
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
export const getEntityOwner = async (entityType: EntityType, entityId: string): Promise<string | null> => {
    try {
        const table = `${entityType}s`;

        const { data } = await supabase
            .from(table)
            .select('created_by, assigned_to')
            .eq('id', entityId)
            .single();

        return data?.assigned_to || data?.created_by || null;
    } catch (error) {
        console.error('Error getting entity owner:', error);
        return null;
    }
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
    const currentUser = await supabase.auth.getUser();

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
                created_by: currentUser.data.user?.id,
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
    const currentUser = await supabase.auth.getUser();

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
                created_by: currentUser.data.user?.id,
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
        .select('role_id, roles(name, permissions)')
        .eq('id', userId)
        .single();

    const { data: overrides } = await supabase
        .from('permission_overrides')
        .select('*')
        .eq('user_id', userId)
        .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`);

    return {
        role_name: (user?.roles as any)?.name,
        role_permissions: (user?.roles as any)?.permissions || {},
        overrides: overrides || [],
    };
};

/**
 * Bulk check permissions for multiple entities
 */
export const bulkCheckPermissions = async (
    userId: string,
    entityType: EntityType,
    entityIds: string[],
    action: PermissionAction = 'view'
): Promise<Record<string, boolean>> => {
    const results: Record<string, boolean> = {};

    for (const entityId of entityIds) {
        const { allowed } = await checkPermission(userId, entityType, entityId, action);
        results[entityId] = allowed;
    }

    return results;
};
