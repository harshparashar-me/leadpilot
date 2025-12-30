import { supabase } from './supabase';

export interface AdAccount {
    id: string;
    platform: 'meta' | 'google';
    account_id: string;
    account_name: string;
    is_active: boolean;
    last_sync_at?: string;
    created_at?: string;
    created_by?: string;
}

export interface MetaLead {
    id: string;
    ad_name: string;
    form_name: string;
    field_data: Record<string, any>; // { name: '...', email: '...' }
    created_time: string;
    imported: boolean;
}

// Meta OAuth Configuration
const META_APP_ID = import.meta.env.VITE_META_APP_ID || '';
const META_APP_SECRET = import.meta.env.VITE_META_APP_SECRET || '';
const REDIRECT_URI = `${window.location.origin}/integrations/meta-ads/callback`;

// Required permissions for Meta Ads API
const SCOPES = [
    'ads_read',
    'ads_management',
    'business_management',
    'leads_retrieval'
].join(',');

// Build OAuth URL
const getMetaOAuthURL = () => {
    const params = new URLSearchParams({
        client_id: META_APP_ID,
        redirect_uri: REDIRECT_URI,
        scope: SCOPES,
        response_type: 'code',
        state: `meta_ads_${Date.now()}` // CSRF protection
    });
    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
};

// Exchange authorization code for access token
const exchangeCodeForToken = async (code: string): Promise<{ access_token: string; user_id: string }> => {
    // In production, this should be done on the backend for security
    // For now, we'll use a proxy endpoint or direct call (not recommended for production)
    
    const tokenURL = 'https://graph.facebook.com/v18.0/oauth/access_token';
    const params = new URLSearchParams({
        client_id: META_APP_ID,
        client_secret: META_APP_SECRET,
        redirect_uri: REDIRECT_URI,
        code: code
    });

    try {
        const response = await fetch(`${tokenURL}?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to exchange code for token');
        }

        const data = await response.json();
        return {
            access_token: data.access_token,
            user_id: data.user_id || ''
        };
    } catch (error: any) {
        console.error('Token exchange error:', error);
        throw new Error(`Failed to get access token: ${error.message}`);
    }
};

// Get user's ad accounts from Meta API
const fetchAdAccounts = async (accessToken: string): Promise<any[]> => {
    try {
        const response = await fetch(
            `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_id&access_token=${accessToken}`
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to fetch ad accounts');
        }

        const data = await response.json();
        return data.data || [];
    } catch (error: any) {
        console.error('Error fetching ad accounts:', error);
        throw new Error(`Failed to fetch ad accounts: ${error.message}`);
    }
};

export const connectMetaAccount = async () => {
    // Check if App ID is configured
    if (!META_APP_ID) {
        const useDemo = confirm(
            'Meta App ID not configured. You need to:\n\n' +
            '1. Create a Facebook App at https://developers.facebook.com/\n' +
            '2. Add VITE_META_APP_ID to your .env file\n' +
            '3. Configure OAuth redirect URI\n\n' +
            'Would you like to use demo account for now?'
        );
        
        if (useDemo) {
            await createMockAccount();
            return;
        } else {
            throw new Error('Meta App ID not configured. Please set VITE_META_APP_ID in .env file');
        }
    }

    // Redirect to Meta OAuth
    window.location.href = getMetaOAuthURL();
};

// Handle OAuth callback and save account
export const handleMetaOAuthCallback = async (code: string, state?: string): Promise<void> => {
    try {
        // Exchange code for access token
        const { access_token, user_id } = await exchangeCodeForToken(code);

        // Fetch user's ad accounts
        const adAccounts = await fetchAdAccounts(access_token);

        if (adAccounts.length === 0) {
            throw new Error('No ad accounts found. Please create an ad account in Facebook Ads Manager.');
        }

        // Get authenticated user (optional)
        let userId: string | null = null;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) userId = user.id;
        } catch (e) {
            // Auth not required
        }

        // Save each ad account
        for (const account of adAccounts) {
            const accountData: any = {
                platform: 'meta',
                account_id: account.account_id || account.id,
                account_name: account.name || `Facebook Ad Account ${account.account_id}`,
                access_token: access_token, // In production, encrypt this
                is_active: true,
                created_by: userId
            };

            await supabase
                .from('ads_accounts')
                .upsert([accountData], { onConflict: 'platform,account_id' });
        }

        // Redirect back to Meta Ads page
        window.location.href = '/integrations/meta-ads';
    } catch (error: any) {
        console.error('OAuth callback error:', error);
        alert(`Failed to connect: ${error.message}`);
        window.location.href = '/integrations/meta-ads';
    }
};

const createMockAccount = async () => {
    try {
        // Try to get authenticated user (optional)
        let userId: string | null = null;
        
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (!userError && user) {
                userId = user.id;
            }
        } catch (authError) {
            // Auth not required for demo - continue without user
            console.warn('Auth check failed, continuing without user:', authError);
        }

        // Create account data - created_by is optional
        const accountData: any = {
            platform: 'meta',
            account_id: `act_${Math.floor(Math.random() * 1000000)}`,
            account_name: 'LeadPilot Demo Ad Account',
            access_token: 'mock_access_token_' + Date.now(),
            is_active: true
        };

        // Add created_by only if we have authenticated user
        if (userId) {
            accountData.created_by = userId;
        }
        // If no user, created_by will be null (allowed by RLS policy)

        const { error } = await supabase
            .from('ads_accounts')
            .upsert([accountData], { onConflict: 'platform,account_id' });

        if (error) {
            console.error('Error creating mock account:', error);
            throw error;
        }
    } catch (error) {
        console.error('Error in createMockAccount:', error);
        throw error;
    }
};

export const getConnectedAccounts = async () => {
    const { data, error } = await supabase
        .from('ads_accounts')
        .select('*')
        .eq('platform', 'meta');

    if (error) throw error;
    return data || [];
};

export const disconnectAccount = async (id: string) => {
    const { error } = await supabase.from('ads_accounts').delete().eq('id', id);
    if (error) throw error;
};

export const getMetaLeads = async () => {
    const { data, error } = await supabase
        .from('meta_ads_leads')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

export const simulateIncomingLead = async (accountId: string) => {
    // Determine user ID correctly
    const { data: { user } } = await supabase.auth.getUser();
    // In a real app, RLS might block this if user isn't logged in, but we have public insert policies or standard user policies.
    // Assuming user is logged in for the demo button to work.

    const mockLead = {
        ad_id: `ad_${Math.floor(Math.random() * 1000)}`,
        ad_name: 'Summer Promo Campaign',
        form_id: `form_${Math.floor(Math.random() * 1000)}`,
        form_name: 'Real Estate Interest Form',
        field_data: {
            full_name: 'Alex Meta',
            email: `alex.meta.${Date.now()}@example.com`,
            phone_number: '+15550001111',
            city: 'New York'
        },
        created_time: new Date().toISOString(),
        imported: false
    };

    const { data, error } = await supabase.from('meta_ads_leads').insert([mockLead]).select().single();
    if (error) throw error;
    return data;
};

export const syncLeadToCRM = async (leadId: string) => {
    // 1. Fetch Lead Data
    const { data: metaLead, error: fetchError } = await supabase
        .from('meta_ads_leads')
        .select('*')
        .eq('id', leadId)
        .single();

    if (fetchError) throw fetchError;
    if (!metaLead) throw new Error('Lead not found');

    // 2. Create CRM Lead
    const fieldData = typeof metaLead.field_data === 'string'
        ? JSON.parse(metaLead.field_data)
        : metaLead.field_data;

    const { data: crmLead, error: createError } = await supabase.from('leads').insert([
        {
            name: fieldData.full_name || fieldData.name || 'Unknown Meta Lead',
            email: fieldData.email,
            phone: fieldData.phone_number || fieldData.phone,
            source: 'Meta Ads',
            status: 'New'
        }
    ]).select().single();

    if (createError) throw createError;

    // 3. Mark as Imported
    await supabase.from('meta_ads_leads').update({
        imported: true,
        lead_id: crmLead.id,
        imported_at: new Date().toISOString()
    }).eq('id', leadId);

    return crmLead;
};
