import React, { useState, useEffect } from 'react';
import { getWorkflows, createWorkflow, deleteWorkflow, toggleWorkflow, type Workflow, type TriggerType, type ActionType, type WorkflowAction } from '../lib/workflows';
import { Play, Pause, Trash2, Plus, Settings, X } from 'lucide-react';

export const WorkflowList: React.FC = () => {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newWorkflow, setNewWorkflow] = useState({
        name: '',
        description: '',
        entityType: 'lead',
        triggerType: 'on_create' as TriggerType,
        triggerConfig: {} as Record<string, unknown>,
        actions: [] as WorkflowAction[]
    });
    const [newAction, setNewAction] = useState({
        type: 'create_task' as ActionType,
        config: {} as Record<string, unknown>
    });

    useEffect(() => {
        fetchWorkflows();
    }, []);

    const fetchWorkflows = async () => {
        try {
            const data = await getWorkflows();
            setWorkflows(data);
        } catch (error) {
            console.error('Error fetching workflows:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (workflowId: string, enabled: boolean) => {
        try {
            await toggleWorkflow(workflowId, !enabled);
            await fetchWorkflows();
        } catch (error) {
            console.error('Error toggling workflow:', error);
        }
    };

    const handleDelete = async (workflowId: string) => {
        if (!confirm('Are you sure you want to delete this workflow?')) return;

        try {
            await deleteWorkflow(workflowId);
            await fetchWorkflows();
        } catch (error) {
            console.error('Error deleting workflow:', error);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newWorkflow.name || newWorkflow.actions.length === 0) {
            alert('Please provide a name and at least one action');
            return;
        }

        try {
            await createWorkflow(
                newWorkflow.name,
                newWorkflow.description,
                newWorkflow.entityType,
                newWorkflow.triggerType,
                newWorkflow.triggerConfig,
                newWorkflow.actions
            );
            setShowCreateModal(false);
            setNewWorkflow({
                name: '',
                description: '',
                entityType: 'lead',
                triggerType: 'on_create',
                triggerConfig: {},
                actions: []
            });
            await fetchWorkflows();
        } catch (error) {
            console.error('Error creating workflow:', error);
            alert('Failed to create workflow');
        }
    };

    const addAction = () => {
        setNewWorkflow({
            ...newWorkflow,
            actions: [...newWorkflow.actions, { ...newAction }]
        });
        setNewAction({ type: 'create_task', config: {} });
    };

    const removeAction = (index: number) => {
        setNewWorkflow({
            ...newWorkflow,
            actions: newWorkflow.actions.filter((_, i) => i !== index)
        });
    };

    if (loading) {
        return <div className="text-center py-8 text-gray-500">Loading workflows...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Workflows</h2>
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Create Workflow
                </button>
            </div>

            {workflows.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                    <Settings className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-600 mb-2">No workflows yet</p>
                    <p className="text-sm text-gray-500">Create your first workflow to automate tasks</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {workflows.map((workflow) => (
                        <div
                            key={workflow.id}
                            className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-semibold text-lg">{workflow.name}</h3>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${workflow.enabled
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {workflow.enabled ? 'Active' : 'Paused'}
                                        </span>
                                    </div>

                                    {workflow.description && (
                                        <p className="text-sm text-gray-600 mb-3">{workflow.description}</p>
                                    )}

                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                                            {workflow.entity_type}
                                        </span>
                                        <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded">
                                            {workflow.trigger_type.replace('_', ' ')}
                                        </span>
                                        <span>{workflow.actions.length} action(s)</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 ml-4">
                                    <button
                                        onClick={() => handleToggle(workflow.id, workflow.enabled)}
                                        className={`p-2 rounded hover:bg-gray-100 ${workflow.enabled ? 'text-green-600' : 'text-gray-400'
                                            }`}
                                        title={workflow.enabled ? 'Pause workflow' : 'Activate workflow'}
                                    >
                                        {workflow.enabled ? (
                                            <Pause className="h-5 w-5" />
                                        ) : (
                                            <Play className="h-5 w-5" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(workflow.id)}
                                        className="p-2 rounded hover:bg-red-50 text-red-600"
                                        title="Delete workflow"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Workflow Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold">Create New Workflow</h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 hover:bg-gray-100 rounded"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Workflow Name *</label>
                                <input
                                    type="text"
                                    value={newWorkflow.name}
                                    onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                    required
                                    placeholder="e.g., Auto-assign new leads"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    value={newWorkflow.description}
                                    onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                    rows={2}
                                    placeholder="Describe what this workflow does"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Entity Type *</label>
                                    <select
                                        value={newWorkflow.entityType}
                                        onChange={(e) => setNewWorkflow({ ...newWorkflow, entityType: e.target.value })}
                                        className="w-full border rounded-lg p-2"
                                        required
                                    >
                                        <option value="lead">Lead</option>
                                        <option value="contact">Contact</option>
                                        <option value="deal">Deal</option>
                                        <option value="account">Account</option>
                                        <option value="task">Task</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Trigger Type *</label>
                                    <select
                                        value={newWorkflow.triggerType}
                                        onChange={(e) => setNewWorkflow({ ...newWorkflow, triggerType: e.target.value as TriggerType })}
                                        className="w-full border rounded-lg p-2"
                                        required
                                    >
                                        <option value="on_create">On Create</option>
                                        <option value="on_update">On Update</option>
                                        <option value="on_status_change">On Status Change</option>
                                        <option value="on_field_change">On Field Change</option>
                                        <option value="scheduled">Scheduled</option>
                                    </select>
                                </div>
                            </div>

                            {/* Actions Section */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Actions *</label>
                                {newWorkflow.actions.length > 0 && (
                                    <div className="space-y-2 mb-3">
                                        {newWorkflow.actions.map((action, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <span className="text-sm font-medium">{action.type.replace('_', ' ')}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAction(index)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="border rounded-lg p-3 space-y-3 bg-gray-50">
                                    <select
                                        value={newAction.type}
                                        onChange={(e) => setNewAction({ ...newAction, type: e.target.value as ActionType })}
                                        className="w-full border rounded-lg p-2 bg-white"
                                    >
                                        <option value="create_task">Create Task</option>
                                        <option value="send_email">Send Email</option>
                                        <option value="update_field">Update Field</option>
                                        <option value="create_note">Create Note</option>
                                        <option value="assign_to">Assign To</option>
                                        <option value="webhook">Webhook</option>
                                    </select>

                                    <button
                                        type="button"
                                        onClick={addAction}
                                        className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium"
                                    >
                                        Add Action
                                    </button>
                                </div>
                                {newWorkflow.actions.length === 0 && (
                                    <p className="text-xs text-gray-500 mt-1">Add at least one action</p>
                                )}
                            </div>

                            <div className="flex gap-2 justify-end pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Create Workflow
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
