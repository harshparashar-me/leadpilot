import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Chrome, Plus, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface GoogleAdsLead {
  id: string;
  campaign_id: string;
  campaign_name?: string;
  form_data?: any;
  gclid?: string;
  lead_id?: string;
  imported: boolean;
  imported_at?: string;
  created_at: string;
}

export const GoogleAdsPage: React.FC = () => {
  const [leads, setLeads] = useState<GoogleAdsLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('google_ads_leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error loading Google Ads leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      // For now, show instructions for OAuth setup
      // In production, this would redirect to Google OAuth flow
      const message = `To connect Google Ads:
      
1. You need to set up OAuth 2.0 credentials in Google Cloud Console
2. Get Client ID and Client Secret
3. Configure redirect URI in Google Console
4. Enter credentials in the form below

For now, you can test with simulated leads.`;
      
      if (confirm(message + '\n\nDo you want to see setup instructions?')) {
        // Show setup instructions modal or redirect to settings
        alert('OAuth setup requires backend configuration. For testing, use "Simulate Lead" button.');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to connect');
    } finally {
      setConnecting(false);
    }
  };

  const handleSyncLead = async (leadId: string) => {
    try {
      // Find the lead
      const lead = leads.find(l => l.id === leadId);
      if (!lead || lead.imported) return;

      // Extract lead data from form_data
      const formData = lead.form_data || {};
      const leadData = {
        name: formData.name || formData.full_name || 'Google Ads Lead',
        email: formData.email || '',
        phone: formData.phone || formData.phone_number || '',
        lead_source: 'Google Ads',
        status: 'Interested',
        created_at: new Date().toISOString()
      };

      // Create lead in CRM
      const { data: crmLead, error: leadError } = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (leadError) throw leadError;

      // Update Google Ads lead as imported
      const { error: updateError } = await supabase
        .from('google_ads_leads')
        .update({
          lead_id: crmLead.id,
          imported: true,
          imported_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (updateError) throw updateError;

      await loadLeads();
      alert('Lead synced to CRM successfully!');
    } catch (error) {
      console.error('Error syncing lead:', error);
      alert('Failed to sync lead');
    }
  };

  const handleSimulateLead = async () => {
    try {
      const mockLead = {
        campaign_id: 'sim-' + Date.now(),
        campaign_name: 'Test Campaign',
        form_data: {
          name: 'Test Lead ' + Date.now(),
          email: `test${Date.now()}@example.com`,
          phone: '+1234567890'
        },
        gclid: 'test-' + Date.now(),
        imported: false
      };

      const { error } = await supabase
        .from('google_ads_leads')
        .insert([mockLead]);

      if (error) throw error;
      await loadLeads();
      alert('Simulated lead created!');
    } catch (error) {
      console.error('Error simulating lead:', error);
      alert('Failed to simulate lead');
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Chrome className="h-7 w-7 text-red-600" />
              Google Ads Integration
            </h1>
            <p className="text-gray-500 mt-1">Import and manage leads from Google Ads campaigns</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSimulateLead}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              <Plus size={16} />
              Simulate Lead
            </button>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm disabled:opacity-50"
            >
              {connecting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Connect Account
                </>
              )}
            </button>
          </div>
        </div>

        {/* Connection Status */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div>
                <p className="font-medium text-gray-900">Not Connected</p>
                <p className="text-sm text-gray-500">Connect your Google Ads account to start importing leads</p>
              </div>
            </div>
          </div>
        </div>

        {/* Leads List */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Leads ({leads.length})</h2>
            <button
              onClick={loadLeads}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw size={18} className="text-gray-600" />
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading leads...</div>
          ) : leads.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Chrome className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No leads found</p>
              <p className="text-sm mt-1">Leads from Google Ads will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {leads.map((lead) => (
                <div key={lead.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-gray-900">
                          {lead.form_data?.name || lead.form_data?.full_name || 'Unknown Lead'}
                        </h3>
                        {lead.imported ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                            <CheckCircle size={12} />
                            Synced
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                            Pending
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        {lead.form_data?.email && (
                          <div>
                            <span className="font-medium">Email:</span> {lead.form_data.email}
                          </div>
                        )}
                        {lead.form_data?.phone && (
                          <div>
                            <span className="font-medium">Phone:</span> {lead.form_data.phone}
                          </div>
                        )}
                        {lead.campaign_name && (
                          <div>
                            <span className="font-medium">Campaign:</span> {lead.campaign_name}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Date:</span>{' '}
                          {new Date(lead.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    {!lead.imported && (
                      <button
                        onClick={() => handleSyncLead(lead.id)}
                        className="ml-4 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Sync to CRM
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

