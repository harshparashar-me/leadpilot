import React, { useState, useEffect } from 'react';
import { getEmailTemplates, createEmailTemplate, deleteEmailTemplate, type EmailTemplate } from '../lib/email';
import { Mail, Trash2, Edit2, Plus, Eye } from 'lucide-react';

export const EmailTemplates: React.FC = () => {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        subject: '',
        body_html: '',
        category: '',
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const data = await getEmailTemplates();
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
            await createEmailTemplate(
                newTemplate.name,
                newTemplate.subject,
                newTemplate.body_html,
                undefined,
                undefined,
                newTemplate.category
            );
            setShowCreateModal(false);
            setNewTemplate({ name: '', subject: '', body_html: '', category: '' });
            await fetchTemplates();
        } catch (error) {
            console.error('Error creating template:', error);
            alert('Failed to create template');
        }
    };

    const handleDelete = async (templateId: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return;

        try {
            await deleteEmailTemplate(templateId);
            await fetchTemplates();
        } catch (error) {
            console.error('Error deleting template:', error);
        }
    };

    if (loading) {
        return <div className="text-center py-8 text-gray-500">Loading templates...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Email Templates</h2>
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
                    <Mail className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-600 mb-2">No email templates</p>
                    <p className="text-sm text-gray-500">Create templates to send emails faster</p>
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
                                    <h3 className="font-semibold text-lg mb-1">{template.name}</h3>
                                    <p className="text-sm text-gray-600 mb-2">Subject: {template.subject}</p>
                                    {template.category && (
                                        <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                                            {template.category}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 ml-4">
                                    <button
                                        className="p-2 rounded hover:bg-gray-100 text-gray-600"
                                        title="Preview template"
                                    >
                                        <Eye className="h-5 w-5" />
                                    </button>
                                    <button
                                        className="p-2 rounded hover:bg-blue-50 text-blue-600"
                                        title="Edit template"
                                    >
                                        <Edit2 className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(template.id)}
                                        className="p-2 rounded hover:bg-red-50 text-red-600"
                                        title="Delete template"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">Create Email Template</h3>
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
                                <label className="block text-sm font-medium mb-1">Subject</label>
                                <input
                                    type="text"
                                    value={newTemplate.subject}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Category</label>
                                <input
                                    type="text"
                                    value={newTemplate.category}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                                    className="w-full border rounded-lg p-2"
                                    placeholder="e.g., follow_up, welcome"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email Body (HTML)</label>
                                <textarea
                                    value={newTemplate.body_html}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, body_html: e.target.value })}
                                    className="w-full border rounded-lg p-2 font-mono text-sm"
                                    rows={10}
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Use variables like {"{{name}}"}, {"{{email}}"}, {"{{company}}"}
                                </p>
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
