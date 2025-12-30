import React, { useState, useEffect } from 'react';
import { getActivityHistory } from '../lib/activityAudit';
import { ChevronDown, ChevronUp, User, Edit, Trash2, Eye, Plus } from 'lucide-react';

interface ActivityFeedProps {
    entityType: 'lead' | 'contact' | 'deal' | 'task' | 'account' | 'property' | 'site_visit';
    entityId: string;
    limit?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
    entityType,
    entityId,
    limit = 20,
}) => {
    const formatDateTime = (value: string | Date) =>
        new Date(value).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
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
                return <Plus className="h-4 w-4 text-green-600" />;
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

    const getActionColor = (action: string) => {
        switch (action) {
            case 'created':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'updated':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'deleted':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'viewed':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getActionLabel = (action: string) => {
        return action.charAt(0).toUpperCase() + action.slice(1);
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-sm text-gray-500">Loading activity...</div>
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <Eye className="h-12 w-12 mb-2 opacity-20" />
                <p className="text-sm">No activity yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {activities.map((activity) => (
                <div
                    key={activity.id}
                    className={`border rounded-lg p-3 hover:shadow-sm transition-shadow ${getActionColor(activity.action)}`}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                            <div className="pt-1">{getActionIcon(activity.action)}</div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-sm">
                                        {activity.user?.name || activity.user?.email || 'Unknown User'}
                                    </span>
                                    <span className="text-xs px-2 py-0.5 rounded-full border font-medium">
                                        {getActionLabel(activity.action)}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {formatDateTime(activity.created_at)}
                                    </span>
                                </div>

                                {activity.notes && (
                                    <p className="text-sm text-gray-700 mt-1">{activity.notes}</p>
                                )}

                                {activity.changes && Object.keys(activity.changes).length > 0 && (
                                    <button
                                        onClick={() => toggleExpand(activity.id)}
                                        className="text-xs text-blue-600 hover:text-blue-800 mt-1 flex items-center gap-1"
                                    >
                                        {expandedId === activity.id ? (
                                            <>
                                                <ChevronUp className="h-3 w-3" />
                                                Hide changes
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className="h-3 w-3" />
                                                Show {Object.keys(activity.changes).length} change(s)
                                            </>
                                        )}
                                    </button>
                                )}

                                {expandedId === activity.id && activity.changes && (
                                    <div className="mt-2 p-2 bg-white rounded border">
                                        <div className="space-y-1">
                                            {Object.entries(activity.changes).map(([key, change]: [string, any]) => (
                                                <div key={key} className="text-xs">
                                                    <span className="font-medium">{key}:</span>
                                                    <span className="text-red-600 line-through ml-2">
                                                        {JSON.stringify(change.old)}
                                                    </span>
                                                    <span className="text-green-600 ml-2">
                                                        → {JSON.stringify(change.new)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
