import React, { useState, useEffect } from 'react';
import { getAllRelationships, getRelatedRecordsWithDetails, deleteRelationship } from '../lib/relationships';
import { Link2, Trash2, ExternalLink } from 'lucide-react';

interface RelatedRecordsSidebarProps {
    entityType: 'lead' | 'contact' | 'deal' | 'task' | 'account' | 'property' | 'site_visit';
    entityId: string;
}

export const RelatedRecordsSidebar: React.FC<RelatedRecordsSidebarProps> = ({
    entityType,
    entityId,
}) => {
    const [relationships, setRelationships] = useState<any>({});
    const [loading, setLoading] = useState(true);

    const fetchRelationships = async () => {
        try {
            const data = await getRelatedRecordsWithDetails(entityType, entityId);
            setRelationships(data);
        } catch (err) {
            console.error('Error fetching relationships:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRelationships();
    }, [entityType, entityId]);

    const handleDeleteRelationship = async (
        targetType: string,
        targetId: string,
        relationshipType: string
    ) => {
        if (!confirm('Are you sure you want to remove this relationship?')) return;

        try {
            await deleteRelationship(
                entityType,
                entityId,
                targetType as any,
                targetId,
                relationshipType as any
            );
            await fetchRelationships();
        } catch (err) {
            console.error('Error deleting relationship:', err);
            alert('Failed to remove relationship');
        }
    };

    const getEntityDisplayName = (entity: any, type: string) => {
        switch (type) {
            case 'lead':
            case 'contact':
                return entity.name || entity.email || 'Unnamed';
            case 'deal':
                return entity.title || entity.name || 'Unnamed Deal';
            case 'property':
                return entity.title || entity.name || 'Unnamed Property';
            case 'site_visit':
                return `Visit on ${entity.visit_date || 'Unknown'}`;
            case 'task':
                return entity.title || 'Unnamed Task';
            case 'account':
                return entity.name || 'Unnamed Account';
            default:
                return 'Unknown';
        }
    };

    const getEntityUrl = (id: string, type: string) => {
        return `/${type}s`; // This would navigate to the appropriate page
    };

    const getRelationshipLabel = (type: string) => {
        switch (type) {
            case 'converted_to':
                return 'Converted To';
            case 'associated_with':
                return 'Associated With';
            case 'linked_to':
                return 'Linked To';
            case 'parent_of':
                return 'Parent Of';
            case 'child_of':
                return 'Child Of';
            default:
                return type;
        }
    };

    const getEntityTypeLabel = (type: string) => {
        return type.charAt(0).toUpperCase() + type.slice(1) + 's';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-sm text-gray-500">Loading relationships...</div>
            </div>
        );
    }

    const hasRelationships = Object.keys(relationships).length > 0;

    if (!hasRelationships) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <Link2 className="h-12 w-12 mb-2 opacity-20" />
                <p className="text-sm">No related records</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {Object.entries(relationships).map(([relType, records]: [string, any[]]) => (
                <div key={relType} className="border rounded-lg p-3">
                    <h4 className="font-medium text-sm mb-3 text-gray-700 flex items-center gap-2">
                        <Link2 className="h-4 w-4" />
                        {getEntityTypeLabel(relType)} ({records.length})
                    </h4>

                    <div className="space-y-2">
                        {records.map((record) => (
                            <div
                                key={record.id}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-900 truncate">
                                            {getEntityDisplayName(record, relType)}
                                        </span>
                                        {record.relationship_type && (
                                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                                                {getRelationshipLabel(record.relationship_type)}
                                            </span>
                                        )}
                                    </div>
                                    {record.email && (
                                        <p className="text-xs text-gray-500 truncate">{record.email}</p>
                                    )}
                                    {record.status && (
                                        <p className="text-xs text-gray-500">Status: {record.status}</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-1 ml-2">
                                    <a
                                        href={getEntityUrl(record.id, relType)}
                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                        title="View record"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            // You can implement navigation or open a drawer here
                                            console.log('Navigate to:', relType, record.id);
                                        }}
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                    <button
                                        onClick={() =>
                                            handleDeleteRelationship(
                                                relType,
                                                record.id,
                                                record.relationship_type
                                            )
                                        }
                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                        title="Remove relationship"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};
