import { supabase } from './supabase';

export type RelationshipType =
    | 'converted_to'
    | 'associated_with'
    | 'linked_to'
    | 'parent_of'
    | 'child_of';

export type EntityType = 'lead' | 'contact' | 'deal' | 'task' | 'account' | 'property' | 'site_visit';

/**
 * Create relationship between records
 */
export const createRelationship = async (
    sourceType: EntityType,
    sourceId: string,
    targetType: EntityType,
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
 * Get related records (outgoing relationships)
 */
export const getRelatedRecords = async (
    sourceType: EntityType,
    sourceId: string
) => {
    const { data, error } = await supabase
        .from('record_relationships')
        .select('*')
        .eq('source_type', sourceType)
        .eq('source_id', sourceId);

    if (error) throw error;
    return data || [];
};

/**
 * Get records related to this one (incoming relationships)
 */
export const getRelatedToRecords = async (
    targetType: EntityType,
    targetId: string
) => {
    const { data, error } = await supabase
        .from('record_relationships')
        .select('*')
        .eq('target_type', targetType)
        .eq('target_id', targetId);

    if (error) throw error;
    return data || [];
};

/**
 * Get all relationships for record (both directions)
 */
export const getAllRelationships = async (
    entityType: EntityType,
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
    sourceType: EntityType,
    sourceId: string,
    targetType: EntityType,
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

/**
 * Link lead to deal
 */
export const linkLeadToDeal = async (leadId: string, dealId: string) => {
    return createRelationship('lead', leadId, 'deal', dealId, 'associated_with');
};

/**
 * Link deal to property
 */
export const linkDealToProperty = async (dealId: string, propertyId: string) => {
    return createRelationship('deal', dealId, 'property', propertyId, 'associated_with');
};

/**
 * Link property to site visit
 */
export const linkPropertyToSiteVisit = async (propertyId: string, siteVisitId: string) => {
    return createRelationship('property', propertyId, 'site_visit', siteVisitId, 'linked_to');
};

/**
 * Get related records with entity details
 */
export const getRelatedRecordsWithDetails = async (
    sourceType: EntityType,
    sourceId: string
) => {
    const relationships = await getRelatedRecords(sourceType, sourceId);

    // Group by target type
    const grouped: Record<string, any[]> = {};

    for (const rel of relationships) {
        if (!grouped[rel.target_type]) {
            grouped[rel.target_type] = [];
        }

        // Fetch the actual entity data
        try {
            const table = `${rel.target_type}s`;
            const { data } = await supabase
                .from(table)
                .select('*')
                .eq('id', rel.target_id)
                .single();

            if (data) {
                grouped[rel.target_type].push({
                    ...data,
                    relationship_id: rel.id,
                    relationship_type: rel.relationship_type,
                });
            }
        } catch (error) {
            console.error(`Error fetching ${rel.target_type}:`, error);
        }
    }

    return grouped;
};

/**
 * Check if relationship exists
 */
export const relationshipExists = async (
    sourceType: EntityType,
    sourceId: string,
    targetType: EntityType,
    targetId: string,
    relationshipType?: RelationshipType
): Promise<boolean> => {
    let query = supabase
        .from('record_relationships')
        .select('id')
        .eq('source_type', sourceType)
        .eq('source_id', sourceId)
        .eq('target_type', targetType)
        .eq('target_id', targetId);

    if (relationshipType) {
        query = query.eq('relationship_type', relationshipType);
    }

    const { data } = await query.limit(1).maybeSingle();

    return !!data;
};
