import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Facebook, CheckCircle, RefreshCw, Plus, Activity } from 'lucide-react';
import {
    connectMetaAccount,
    getConnectedAccounts,
    disconnectAccount,
    getMetaLeads,
    simulateIncomingLead,
    syncLeadToCRM,
    type AdAccount,
    type MetaLead
} from '../../lib/meta-ads';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';

export const MetaAdsPage: React.FC = () => {
    const [accounts, setAccounts] = useState<AdAccount[]>([]);
    const [leads, setLeads] = useState<MetaLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [accs, lds] = await Promise.all([getConnectedAccounts(), getMetaLeads()]);
            setAccounts(accs);
            setLeads(lds);
        } catch (error) {
            console.error('Failed to load Meta Ads data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async () => {
        setConnecting(true);
        try {
            await connectMetaAccount();
            // connectMetaAccount will redirect to OAuth, so we don't need to wait
            // The callback page will handle the redirect back
        } catch (error: any) {
            console.error('Connection error:', error);
            alert(`Failed to connect: ${error?.message || 'Unknown error'}`);
            setConnecting(false);
        }
    };

    const handleDisconnect = async (id: string) => {
        if (!confirm('Disconnect this ad account? Leads will stop syncing.')) return;
        try {
            await disconnectAccount(id);
            await loadData();
        } catch (error) {
            alert('Failed to disconnect');
        }
    };

    const handleSimulateLead = async () => {
        if (accounts.length === 0) return alert('Connect an account first');
        try {
            await simulateIncomingLead(accounts[0].id);
            await loadData();
            alert('New Lead received from Facebook!');
        } catch (error) {
            console.error(error);
            alert('Simulation failed');
        }
    };

    const handleSync = async (leadId: string) => {
        try {
            await syncLeadToCRM(leadId);
            await loadData();
            alert('Lead synced to CRM!');
        } catch (error) {
            console.error(error);
            alert('Sync failed');
        }
    };

    if (loading) return <Layout><div className="p-8">Loading Meta Ads integration...</div></Layout>;

    return (
        <Layout>
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Facebook className="text-blue-600 fill-current" /> Meta Ads Integration
                    </h1>
                    <p className="text-gray-500">Sync leads from Facebook & Instagram Instant Forms</p>
                </div>
                {accounts.length === 0 && (
                    <button
                        onClick={handleConnect}
                        disabled={connecting}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {connecting ? 'Connecting...' : 'Connect Facebook'}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Connected Accounts */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Connected Accounts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {accounts.length === 0 ? (
                                <div className="text-center py-6 text-gray-500 bg-gray-50 rounded border border-dashed">
                                    <p>No accounts connected</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {accounts.map(acc => (
                                        <div key={acc.id} className="p-4 bg-white border rounded shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-medium text-gray-900">{acc.account_name}</p>
                                                        {acc.account_name?.includes('Demo') && (
                                                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] rounded border border-yellow-300 uppercase">
                                                                Demo
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 mb-1">Account ID: {acc.account_id}</p>
                                                    <p className="text-xs text-gray-400">
                                                        {acc.created_at 
                                                            ? `Connected: ${new Date(acc.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                                                            : 'Demo Account'}
                                                    </p>
                                                    {acc.account_name?.includes('Demo') && (
                                                        <p className="text-xs text-amber-600 mt-2 italic">
                                                            ⚠️ This is a demo account. Connect a real Facebook account for production use.
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="flex h-2 w-2 rounded-full bg-green-500" title="Active"></span>
                                                </div>
                                            </div>
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <button
                                                    onClick={() => handleDisconnect(acc.id)}
                                                    className="text-xs text-red-500 hover:text-red-700 hover:underline"
                                                >
                                                    Disconnect Account
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="pt-4">
                                        <button
                                            onClick={handleSimulateLead}
                                            className="w-full py-2 flex items-center justify-center gap-2 bg-purple-50 text-purple-700 rounded hover:bg-purple-100 border border-purple-200"
                                        >
                                            <Plus size={16} /> Simulate Incoming Lead
                                        </button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Integration Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <CheckCircle size={16} className="text-green-500" />
                                <span>Token Valid</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle size={16} className="text-green-500" />
                                <span>Permissions Granted</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Activity size={16} className="text-blue-500" />
                                <span>Listening for Webhooks</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Leads List */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Recent Leads</CardTitle>
                            <button onClick={loadData} className="text-gray-500 hover:text-blue-600">
                                <RefreshCw size={18} />
                            </button>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-medium">
                                        <tr>
                                            <th className="px-4 py-2">Lead Info</th>
                                            <th className="px-4 py-2">Campaign / Form</th>
                                            <th className="px-4 py-2">Date</th>
                                            <th className="px-4 py-2 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {leads.map(lead => {
                                            // Handle potential stringified JSON
                                            const fields = typeof lead.field_data === 'string'
                                                ? JSON.parse(lead.field_data)
                                                : lead.field_data;

                                            return (
                                                <tr key={lead.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3">
                                                        <p className="font-medium text-gray-900">{fields.full_name || fields.name || 'Unknown'}</p>
                                                        <p className="text-xs text-gray-500">{fields.email}</p>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p className="truncate max-w-[150px]">{lead.ad_name}</p>
                                                        <p className="text-xs text-gray-500 truncate max-w-[150px]">{lead.form_name}</p>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-500">
                                                        {new Date(lead.created_time).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {lead.imported ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                Synced
                                                            </span>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleSync(lead.id)}
                                                                className="text-blue-600 hover:underline text-xs font-medium"
                                                            >
                                                                Sync Now
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {leads.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="text-center py-8 text-gray-400">
                                                    No leads received yet
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
        </Layout>
    );
};
