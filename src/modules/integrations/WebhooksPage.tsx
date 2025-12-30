import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Plus, RefreshCw, Copy, Trash2, Activity, Play } from 'lucide-react';
import { getWebhooks, createWebhook, deleteWebhook, getWebhookEvents, processWebhookPayload, type Webhook, type WebhookEvent } from '../../lib/webhooks';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';

export const WebhooksPage: React.FC = () => {
    const [webhooks, setWebhooks] = useState<Webhook[]>([]);
    const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
    const [events, setEvents] = useState<WebhookEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');

    useEffect(() => {
        loadWebhooks();
    }, []);

    useEffect(() => {
        if (selectedWebhook) {
            loadEvents(selectedWebhook.id);
        }
    }, [selectedWebhook]);

    const loadWebhooks = async () => {
        try {
            const data = await getWebhooks();
            setWebhooks(data);
            if (data.length > 0 && !selectedWebhook) {
                setSelectedWebhook(data[0]);
            }
        } catch (error) {
            console.error('Error loading webhooks:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadEvents = async (id: string) => {
        try {
            const data = await getWebhookEvents(id);
            setEvents(data);
        } catch (error) {
            setEvents([]);
        }
    };

    const handleCreate = async () => {
        if (!newName) return;
        try {
            await createWebhook(newName, 'generic');
            setNewName('');
            setIsCreating(false);
            loadWebhooks();
        } catch (error: any) {
            console.error('Error creating webhook:', error);
            alert(`Failed: ${error.message || 'Unknown error'}`);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            await deleteWebhook(id);
            loadWebhooks();
            if (selectedWebhook?.id === id) setSelectedWebhook(null);
        } catch (error) {
            console.error('Error deleting webhook:', error);
        }
    };

    const handleSimulate = async () => {
        if (!selectedWebhook) return;
        const mockPayload = {
            email: `test-${Date.now()}@example.com`,
            name: 'Webhook Lead',
            phone: '555-0123',
            source: 'simulation'
        };

        const result = await processWebhookPayload(selectedWebhook.id, mockPayload);
        alert(result.message || 'Simulation processed');
        loadEvents(selectedWebhook.id);
    };

    if (loading) return <Layout><div className="p-8">Loading webhooks...</div></Layout>;

    return (
        <Layout>
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Webhooks & Integrations</h1>
                    <p className="text-gray-500">Manage inbound data sources</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus size={20} />
                    New Webhook
                </button>
            </div>

            {isCreating && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border flex items-center gap-4">
                    <input
                        type="text"
                        placeholder="Webhook Name"
                        className="flex-1 p-2 border rounded"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                    />
                    <button onClick={handleCreate} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Save</button>
                    <button onClick={() => setIsCreating(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded">Cancel</button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-3">
                    {webhooks.map(wh => (
                        <div
                            key={wh.id}
                            onClick={() => setSelectedWebhook(wh)}
                            className={`p-4 rounded-lg border cursor-pointer transition-colors ${selectedWebhook?.id === wh.id ? 'bg-blue-50 border-blue-200' : 'bg-white hover:bg-gray-50'}`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-medium text-gray-900">{wh.name}</h3>
                                    <span className="text-xs text-gray-500 truncate block max-w-[200px]">
                                        {wh.url?.startsWith('inbound://') ? wh.url.replace('inbound://', '') : wh.url}
                                    </span>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(wh.id); }}
                                    className="text-gray-400 hover:text-red-500"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {webhooks.length === 0 && <p className="text-gray-500 text-center py-8">No webhooks configured</p>}
                </div>

                <div className="md:col-span-2">
                    {selectedWebhook ? (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Configuration</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Endpoint URL</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <code className="flex-1 p-3 bg-gray-100 rounded text-sm font-mono break-all">
                                                https://api.leadpilot.com/hooks/{selectedWebhook.id}
                                            </code>
                                            <button
                                                onClick={() => navigator.clipboard.writeText(`https://api.leadpilot.com/hooks/${selectedWebhook.id}`)}
                                                className="p-2 hover:bg-gray-200 rounded text-gray-600"
                                            >
                                                <Copy size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Secret Key</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <code className="flex-1 p-3 bg-gray-100 rounded text-sm font-mono">
                                                {selectedWebhook.secret_key}
                                            </code>
                                            <button className="p-2 hover:bg-gray-200 rounded text-gray-600">
                                                <RefreshCw size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t">
                                        <button
                                            onClick={handleSimulate}
                                            className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 font-medium"
                                        >
                                            <Play size={18} />
                                            Simulate Test Event
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Recent Events</CardTitle>
                                    <button onClick={() => loadEvents(selectedWebhook!.id)} className="text-sm text-blue-600 hover:underline">
                                        Refresh
                                    </button>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-0">
                                        {events.map(event => (
                                            <div key={event.id} className="grid grid-cols-4 py-3 border-b text-sm items-center hover:bg-gray-50">
                                                <div className="col-span-1">
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100">
                                                        {event.status}
                                                    </span>
                                                </div>
                                                <div className="col-span-2 font-mono text-xs text-gray-600 truncate">
                                                    {JSON.stringify(event.payload)}
                                                </div>
                                                <div className="col-span-1 text-right text-gray-500 text-xs">
                                                    {new Date(event.created_at).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        ))}
                                        {events.length === 0 && <p className="text-center py-8 text-gray-400">No events found</p>}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 border rounded-lg bg-gray-50 p-12">
                            <Activity size={48} className="mb-4 opacity-20" />
                            <p>Select a webhook to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
        </Layout>
    );
};
