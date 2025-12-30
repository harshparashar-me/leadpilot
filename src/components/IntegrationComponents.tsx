import React, { useState, useEffect } from 'react';
import { getMetaAdsLeads, getWhatsAppConversations, sendWhatsAppMessage } from '../lib/integrationServices';
import { Webhook, Facebook, MessageCircle, Chrome } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Simple Webhooks Manager
export const WebhooksManager: React.FC = () => {
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <Webhook className="h-6 w-6" />
                Webhooks
            </h2>
            <div className="bg-white border rounded-lg p-6">
                <p className="text-sm text-gray-600 mb-4">Configure webhooks to send CRM events to external systems</p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                    Add Webhook
                </button>
            </div>
        </div>
    );
};

// Meta Ads Leads
export const MetaAdsLeads: React.FC = () => {
    const [leads, setLeads] = useState<any[]>([]);

    useEffect(() => {
        loadLeads();
    }, []);

    const loadLeads = async () => {
        const data = await getMetaAdsLeads(false);
        setLeads(data);
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <Facebook className="h-6 w-6 text-blue-600" />
                Meta Ads Leads
            </h2>
            <div className="bg-white border rounded-lg p-4">
                {leads.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No new leads from Meta Ads</p>
                ) : (
                    <div className="space-y-2">
                        {leads.map(lead => (
                            <div key={lead.id} className="border rounded p-3">
                                <p className="font-medium">{lead.field_data?.find((f: any) => f.name === 'full_name')?.values[0] || 'Unknown'}</p>
                                <p className="text-sm text-gray-500">From: {lead.ad_name}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// WhatsApp Chat
export const WhatsAppChat: React.FC = () => {
    const [conversations, setConversations] = useState<any[]>([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadConversations();
    }, []);

    const loadConversations = async () => {
        const data = await getWhatsAppConversations();
        setConversations(data);
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <MessageCircle className="h-6 w-6 text-green-600" />
                WhatsApp Messages
            </h2>
            <div className="bg-white border rounded-lg h-[500px] flex">
                <div className="w-1/3 border-r">
                    <div className="p-4 border-b">
                        <h3 className="font-semibold">Conversations</h3>
                    </div>
                    <div className="overflow-y-auto">
                        {conversations.length === 0 ? (
                            <p className="text-center text-gray-500 py-8 text-sm">No conversations</p>
                        ) : (
                            conversations.map(conv => (
                                <div key={conv.id} className="p-3 border-b hover:bg-gray-50 cursor-pointer">
                                    <p className="font-medium">{conv.contact_name || conv.phone_number}</p>
                                    <p className="text-xs text-gray-500">{conv.phone_number}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                <div className="flex-1 flex flex-col">
                    <div className="flex-1 p-4 overflow-y-auto">
                        <p className="text-center text-gray-500 text-sm">Select a conversation</p>
                    </div>
                    <div className="p-4 border-t">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="w-full border rounded-lg p-2 text-sm"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// All Integrations Dashboard
export const IntegrationsDashboard: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
                <Facebook className="h-10 w-10 text-blue-600 mb-3" />
                <h3 className="font-bold text-lg mb-2">Meta Ads Integration</h3>
                <p className="text-sm text-gray-700 mb-4">Auto-capture leads from Facebook/Instagram ads</p>
                <button 
                    onClick={() => navigate('/integrations/meta-ads')}
                    className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                    Configure
                </button>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
                <MessageCircle className="h-10 w-10 text-green-600 mb-3" />
                <h3 className="font-bold text-lg mb-2">WhatsApp Business</h3>
                <p className="text-sm text-gray-700 mb-4">Chat with leads via WhatsApp</p>
                <button 
                    onClick={() => navigate('/whatsapp')}
                    className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                    Configure
                </button>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-6">
                <Chrome className="h-10 w-10 text-red-600 mb-3" />
                <h3 className="font-bold text-lg mb-2">Google Ads</h3>
                <p className="text-sm text-gray-700 mb-4">Import leads from Google Ads campaigns</p>
                <button 
                    onClick={() => navigate('/integrations/google-ads')}
                    className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                    Configure
                </button>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
                <Webhook className="h-10 w-10 text-purple-600 mb-3" />
                <h3 className="font-bold text-lg mb-2">Webhooks</h3>
                <p className="text-sm text-gray-700 mb-4">Send CRM events to external systems</p>
                <button 
                    onClick={() => navigate('/integrations/webhooks')}
                    className="px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                >
                    Configure
                </button>
            </div>
        </div>
    );
};
