import React, { useState, useEffect } from 'react';
import { getTaskTemplates, createTaskTemplate, deleteTaskTemplate, type TaskTemplate } from '../lib/taskTemplates';
import { ClipboardList, Trash2, Plus, Calendar } from 'lucide-react';

export const TaskTemplateManager: React.FC = () => {
    const [templates, setTemplates] = useState<TaskTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        description: '',
        priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
        due_offset_days: 7,
        category: '',
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const data = await getTaskTemplates();
            setTemplates(data);
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createTaskTemplate(
                newTemplate.name,
                newTemplate.description,
                newTemplate.priority,
                newTemplate.due_offset_days,
                undefined,
                undefined,
                newTemplate.category
            );
            setShowCreateModal(false);
            setNewTemplate({
                name: '',
                description: '',
                priority: 'medium',
                due_offset_days: 7,
                category: '',
            });
            await fetchTemplates();
        } catch (error) {
            console.error('Error creating template:', error);
            alert('Failed to create template');
        }
    };

    const handleDelete = async (templateId: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return;

        try {
            await deleteTaskTemplate(templateId);
            await fetchTemplates();
        } catch (error) {
            console.error('Error deleting template:', error);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return 'bg-red-100 text-red-800';
            case 'high':
                return 'bg-orange-100 text-orange-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'low':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return <div className="text-center py-8 text-gray-500">Loading templates...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Task Templates</h2>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    New Template
                </button>
            </div>

            {templates.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                    <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-600 mb-2">No task templates</p>
                    <p className="text-sm text-gray-500">Create templates to standardize tasks</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {templates.map((template) => (
                        <div
                            key={template.id}
                            className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="font-semibold text-lg">{template.name}</h3>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(template.default_priority)}`}>
                                            {template.default_priority}
                                        </span>
                                    </div>

                                    {template.description && (
                                        <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                                    )}

                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        {template.default_due_offset_days && (
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                Due in {template.default_due_offset_days} days
                                            </span>
                                        )}
                                        {template.category && (
                                            <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded">
                                                {template.category}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleDelete(template.id)}
                                    className="p-2 rounded hover:bg-red-50 text-red-600 ml-4"
                                    title="Delete template"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                        <h3 className="text-xl font-bold mb-4">Create Task Template</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input
                                    type="text"
                                    value={newTemplate.name}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    value={newTemplate.description}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Priority</label>
                                    <select
                                        value={newTemplate.priority}
                                        onChange={(e) => setNewTemplate({ ...newTemplate, priority: e.target.value as any })}
                                        className="w-full border rounded-lg p-2"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Due in (days)</label>
                                    <input
                                        type="number"
                                        value={newTemplate.due_offset_days}
                                        onChange={(e) => setNewTemplate({ ...newTemplate, due_offset_days: parseInt(e.target.value) })}
                                        className="w-full border rounded-lg p-2"
                                        min="1"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Category</label>
                                <input
                                    type="text"
                                    value={newTemplate.category}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                    placeholder="e.g., follow_up, onboarding"
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
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
                                    Create Template
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
