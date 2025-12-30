# 🎯 PHASE 2: META ADS LEAD CAPTURE

**Duration**: 5-7 days  
**Complexity**: Medium-High  
**Dependencies**: Phase 1 (Webhooks)  
**Prerequisites**: Meta Business Account + App

---

## Overview

```
Meta Lead Form (Facebook/Instagram)
    ↓
Meta Leads API
    ↓
Webhook → LeadPilot
    ↓
Auto-create Lead + Deduplicate
```

---

## 2.1 Meta Ads Database Schema

**File**: `supabase/migrations/20251230_meta_ads_integration.sql`

```sql
-- Meta ads leads table
CREATE TABLE IF NOT EXISTS meta_ads_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_lead_id varchar(255) NOT NULL UNIQUE,
  form_id varchar(255) NOT NULL,
  campaign_id varchar(255),
  campaign_name varchar(255),
  ad_name varchar(255),
  lead_crm_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  first_name varchar(255),
  last_name varchar(255),
  email varchar(255),
  phone varchar(20),
  company varchar(255),
  custom_fields jsonb, -- Store any custom fields from form
  raw_response jsonb, -- Store complete Meta API response
  status varchar(50) DEFAULT 'pending', -- pending, created, duplicate, error
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Meta ads configuration
CREATE TABLE IF NOT EXISTS meta_ads_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id varchar(255) NOT NULL UNIQUE,
  access_token varchar(500) NOT NULL ENCRYPTED,
  business_account_id varchar(255) NOT NULL,
  lead_form_ids text[], -- Array of form IDs to listen to
  status varchar(50) DEFAULT 'active',
  webhook_verified boolean DEFAULT false,
  verified_token varchar(255), -- For webhook verification
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Meta ads campaign mapping
CREATE TABLE IF NOT EXISTS meta_ads_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_campaign_id varchar(255) NOT NULL UNIQUE,
  campaign_name varchar(255) NOT NULL,
  form_id varchar(255),
  lead_source varchar(255) DEFAULT 'meta_ads',
  auto_assign_to varchar(255), -- User ID to assign leads to
  auto_qualify boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX idx_meta_leads_email ON meta_ads_leads(email);
CREATE INDEX idx_meta_leads_crm_id ON meta_ads_leads(lead_crm_id);
CREATE INDEX idx_meta_leads_status ON meta_ads_leads(status);
CREATE INDEX idx_meta_leads_created ON meta_ads_leads(created_at);
CREATE INDEX idx_meta_config_account ON meta_ads_config(account_id);
```

---

## 2.2 Meta Ads Service

**File**: `src/lib/meta-ads.ts`

```typescript
import { supabase } from './supabase';

export interface MetaLeadFormData {
  meta_lead_id: string;
  form_id: string;
  campaign_id?: string;
  campaign_name?: string;
  ad_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  custom_fields?: Record<string, any>;
  raw_response?: Record<string, any>;
}

export interface MetaAdsConfig {
  account_id: string;
  access_token: string;
  business_account_id: string;
  lead_form_ids: string[];
}

/**
 * Store Meta Ads configuration
 */
export const saveMetaAdsConfig = async (config: MetaAdsConfig) => {
  const { data, error } = await supabase
    .from('meta_ads_config')
    .upsert([
      {
        account_id: config.account_id,
        access_token: config.access_token,
        business_account_id: config.business_account_id,
        lead_form_ids: config.lead_form_ids,
      },
    ])
    .select();

  if (error) throw error;
  return data;
};

/**
 * Handle incoming Meta lead webhook
 */
export const handleMetaLead = async (leadData: MetaLeadFormData) => {
  try {
    // Check for duplicates by email
    let existingCRMLead = null;
    if (leadData.email) {
      const { data: existing } = await supabase
        .from('leads')
        .select('id')
        .eq('email', leadData.email)
        .single();

      existingCRMLead = existing;
    }

    // Check if already imported
    const { data: existingMetaLead } = await supabase
      .from('meta_ads_leads')
      .select('id')
      .eq('meta_lead_id', leadData.meta_lead_id)
      .single();

    if (existingMetaLead) {
      return {
        status: 'duplicate',
        message: 'Lead already imported',
        meta_lead_id: leadData.meta_lead_id,
      };
    }

    let leadId = existingCRMLead?.id;

    // Create new lead if doesn't exist
    if (!leadId) {
      const { data: newLead, error: insertError } = await supabase
        .from('leads')
        .insert([
          {
            name: `${leadData.first_name || ''} ${leadData.last_name || ''}`.trim(),
            email: leadData.email,
            phone: leadData.phone,
            company: leadData.company,
            source: 'meta_ads',
            status: 'new',
            notes: `Lead captured from Meta Ads - Campaign: ${leadData.campaign_name || 'Unknown'}`,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;
      leadId = newLead.id;
    }

    // Store Meta lead record
    const { data: metaLead, error: storeError } = await supabase
      .from('meta_ads_leads')
      .insert([
        {
          meta_lead_id: leadData.meta_lead_id,
          form_id: leadData.form_id,
          campaign_id: leadData.campaign_id,
          campaign_name: leadData.campaign_name,
          ad_name: leadData.ad_name,
          lead_crm_id: leadId,
          first_name: leadData.first_name,
          last_name: leadData.last_name,
          email: leadData.email,
          phone: leadData.phone,
          company: leadData.company,
          custom_fields: leadData.custom_fields || {},
          raw_response: leadData.raw_response || {},
          status: existingCRMLead ? 'duplicate' : 'created',
        },
      ])
      .select()
      .single();

    if (storeError) throw storeError;

    return {
      status: 'success',
      message: existingCRMLead ? 'Lead already exists, matched by email' : 'New lead created',
      lead_id: leadId,
      meta_lead: metaLead,
    };
  } catch (error: any) {
    // Log error
    await supabase.from('meta_ads_leads').insert([
      {
        meta_lead_id: leadData.meta_lead_id,
        form_id: leadData.form_id,
        status: 'error',
        error_message: error.message,
        raw_response: leadData.raw_response || {},
      },
    ]);

    throw error;
  }
};

/**
 * Get Meta Ads configuration
 */
export const getMetaAdsConfig = async () => {
  const { data, error } = await supabase
    .from('meta_ads_config')
    .select('*')
    .limit(1)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get Meta leads
 */
export const getMetaLeads = async (limit = 50) => {
  const { data, error } = await supabase
    .from('meta_ads_leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};

/**
 * Get Meta leads statistics
 */
export const getMetaLeadsStats = async () => {
  const { data, error, count } = await supabase
    .from('meta_ads_leads')
    .select('status', { count: 'exact' })
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (error) throw error;

  const stats = {
    total: count || 0,
    created: 0,
    duplicate: 0,
    pending: 0,
    error: 0,
  };

  (data || []).forEach((item: any) => {
    stats[item.status] = (stats[item.status] || 0) + 1;
  });

  return stats;
};

/**
 * Map Meta lead response to our data model
 */
export const parseMetaLeadResponse = (metaResponse: any): MetaLeadFormData => {
  const leads = metaResponse.entry?.[0]?.changes?.[0]?.value?.leadgen_data || {};

  return {
    meta_lead_id: metaResponse.entry?.[0]?.changes?.[0]?.value?.leadgen_id || '',
    form_id: metaResponse.entry?.[0]?.changes?.[0]?.value?.form_id || '',
    campaign_id: metaResponse.entry?.[0]?.changes?.[0]?.value?.campaign_id || '',
    campaign_name: metaResponse.entry?.[0]?.changes?.[0]?.value?.campaign_name || '',
    ad_name: metaResponse.entry?.[0]?.changes?.[0]?.value?.ad_name || '',
    first_name: leads.find((f: any) => f.name === 'first_name')?.value,
    last_name: leads.find((f: any) => f.name === 'last_name')?.value,
    email: leads.find((f: any) => f.name === 'email')?.value,
    phone: leads.find((f: any) => f.name === 'phone_number')?.value,
    company: leads.find((f: any) => f.name === 'company')?.value,
    raw_response: metaResponse,
  };
};
```

---

## 2.3 Meta Ads Setup Component

**File**: `src/modules/integrations/MetaAdsSetup.tsx`

```typescript
import React, { useState } from 'react';
import { AlertCircle, Copy, Check } from 'lucide-react';
import { saveMetaAdsConfig } from '../../lib/meta-ads';

export const MetaAdsSetup: React.FC = () => {
  const [step, setStep] = useState<'setup' | 'config' | 'complete'>('setup');
  const [formData, setFormData] = useState({
    account_id: '',
    access_token: '',
    business_account_id: '',
    form_ids: '',
  });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const webhookURL = `${window.location.origin}/api/webhooks/meta`;

  const handleSave = async () => {
    setLoading(true);
    try {
      await saveMetaAdsConfig({
        account_id: formData.account_id,
        access_token: formData.access_token,
        business_account_id: formData.business_account_id,
        lead_form_ids: formData.form_ids.split(',').map((id) => id.trim()),
      });

      setStep('complete');
    } catch (err) {
      alert('Error saving configuration');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (step === 'setup') {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">Setup Instructions</h3>
            <ol className="text-sm text-blue-800 mt-2 space-y-1">
              <li>1. Go to Meta Business Manager → Apps</li>
              <li>2. Select or create your LeadPilot app</li>
              <li>3. Get your Access Token from Settings → Tokens</li>
              <li>4. Get your Business Account ID</li>
              <li>5. Configure your lead forms to send webhooks</li>
            </ol>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Account ID</label>
            <input
              type="text"
              value={formData.account_id}
              onChange={(e) =>
                setFormData({ ...formData, account_id: e.target.value })
              }
              placeholder="123456789"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Access Token</label>
            <textarea
              value={formData.access_token}
              onChange={(e) =>
                setFormData({ ...formData, access_token: e.target.value })
              }
              placeholder="Paste your access token here"
              rows={4}
              className="w-full px-3 py-2 border rounded-lg font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Business Account ID</label>
            <input
              type="text"
              value={formData.business_account_id}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  business_account_id: e.target.value,
                })
              }
              placeholder="act_123456789"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Lead Form IDs (comma-separated)
            </label>
            <input
              type="text"
              value={formData.form_ids}
              onChange={(e) =>
                setFormData({ ...formData, form_ids: e.target.value })
              }
              placeholder="123456789, 987654321"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <button
            onClick={() => setStep('config')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Next: Configure Webhook
          </button>
        </div>
      </div>
    );
  }

  if (step === 'config') {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900">Configure Meta Webhook</h3>
          <p className="text-sm text-green-800 mt-2">
            In Meta Business Manager, configure your lead forms to send webhooks to:
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-700">Webhook URL</label>
            <div className="flex gap-2 mt-1">
              <code className="flex-1 bg-white border rounded px-3 py-2 text-xs font-mono break-all">
                {webhookURL}
              </code>
              <button
                onClick={() => copyToClipboard(webhookURL)}
                className="px-3 py-2 bg-white border rounded hover:bg-gray-100 flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">
              Verification Token
            </label>
            <input
              type="text"
              placeholder="Your verification token from Meta"
              className="w-full mt-1 px-3 py-2 border rounded-lg text-xs"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
      <Check className="h-12 w-12 text-green-600 mx-auto mb-3" />
      <h3 className="font-semibold text-green-900 mb-1">Setup Complete!</h3>
      <p className="text-sm text-green-800">
        Your Meta Ads integration is now active. Leads will be automatically imported to your CRM.
      </p>
    </div>
  );
};

export default MetaAdsSetup;
```

---

## 2.4 Meta Leads Dashboard

**File**: `src/modules/integrations/MetaAdsLeads.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { getMetaLeads, getMetaLeadsStats } from '../../lib/meta-ads';
import { BarChart, Users } from 'lucide-react';

export const MetaAdsLeads: React.FC = () => {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ total: 0, created: 0, duplicate: 0, error: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [leadsData, statsData] = await Promise.all([
          getMetaLeads(20),
          getMetaLeadsStats(),
        ]);
        setLeads(leadsData);
        setStats(statsData);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Total Leads (7d)</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <BarChart className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div>
            <p className="text-xs text-gray-600">Created</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.created}</p>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div>
            <p className="text-xs text-gray-600">Duplicates</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.duplicate}</p>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div>
            <p className="text-xs text-gray-600">Errors</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.error}</p>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold">Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold">Email</th>
              <th className="px-6 py-3 text-left text-xs font-semibold">Campaign</th>
              <th className="px-6 py-3 text-left text-xs font-semibold">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {leads.map((lead: any) => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  {lead.first_name} {lead.last_name}
                </td>
                <td className="px-6 py-4 text-sm">{lead.email}</td>
                <td className="px-6 py-4 text-sm">{lead.campaign_name}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      lead.status === 'created'
                        ? 'bg-green-100 text-green-800'
                        : lead.status === 'duplicate'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {lead.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  {new Date(lead.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MetaAdsLeads;
```

---

## 2.5 Update Webhook Receiver

**Update**: `supabase/functions/webhook-receiver/index.ts`

```typescript
const handleMetaAdsWebhook = async (payload: any) => {
  try {
    const { handleMetaLead, parseMetaLeadResponse } = await import(
      'https://esm.sh/@supabase/supabase-js@2'
    );

    // Parse Meta's lead response
    const leadData = parseMetaLeadResponse(payload);

    // Handle the lead
    const result = await handleMetaLead(leadData);

    return result;
  } catch (error) {
    console.error('Meta webhook error:', error);
    return { error: 'Failed to process Meta lead' };
  }
};
```

---

## 2.6 Meta Ads Integration Page

**File**: `src/modules/integrations/MetaAdsPage.tsx`

```typescript
import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { MessageSquare, Settings } from 'lucide-react';
import MetaAdsSetup from './MetaAdsSetup';
import MetaAdsLeads from './MetaAdsLeads';

type Tab = 'setup' | 'leads';

export const MetaAdsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('leads');

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meta Ads Integration</h1>
            <p className="text-sm text-gray-600 mt-1">
              Capture leads from Facebook & Instagram ads automatically
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('setup')}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'setup'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600'
            }`}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            Setup
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'leads'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600'
            }`}
          >
            Leads Captured
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg border p-6">
          {activeTab === 'setup' ? <MetaAdsSetup /> : <MetaAdsLeads />}
        </div>
      </div>
    </Layout>
  );
};

export default MetaAdsPage;
```

---

## 2.7 Implementation Checklist

- [ ] Create migration file: `20251230_meta_ads_integration.sql`
- [ ] Run: `supabase db push`
- [ ] Create `src/lib/meta-ads.ts` utility
- [ ] Create `src/modules/integrations/MetaAdsSetup.tsx`
- [ ] Create `src/modules/integrations/MetaAdsLeads.tsx`
- [ ] Create `src/modules/integrations/MetaAdsPage.tsx`
- [ ] Update webhook receiver for Meta handling
- [ ] Add route: `/integrations/meta-ads`
- [ ] Test webhook with Meta sandbox
- [ ] Deploy and verify

---

## 2.8 Testing

```bash
# Test webhook locally
curl -X POST http://localhost:3000/api/webhooks/meta \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: <signature>" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "leadgen_id": "123456",
          "form_id": "789",
          "campaign_id": "campaign123",
          "campaign_name": "Summer Promo",
          "leadgen_data": [
            {"name": "first_name", "value": "John"},
            {"name": "last_name", "value": "Doe"},
            {"name": "email", "value": "john@example.com"},
            {"name": "phone_number", "value": "+1234567890"}
          ]
        }
      }]
    }]
  }'
```

---

## ✅ Phase 2 Complete!

After Phase 2, you'll have:
- ✅ Meta Ads lead form integration
- ✅ Automatic lead creation in CRM
- ✅ Duplicate detection
- ✅ Lead history tracking
- ✅ Admin dashboard for Meta leads

**Next**: Phase 3 - Google Ads Lead Capture

---

**Status**: Ready for implementation  
**Estimated Timeline**: 5-7 days
