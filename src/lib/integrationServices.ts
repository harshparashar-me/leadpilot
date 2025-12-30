import { supabase } from './supabase';

// ============================================
// WEBHOOKS SERVICE
// ============================================

export const createWebhook = async (name: string, url: string, events: string[], secretKey?: string) => {
    const user = await supabase.auth.getUser();
    const { data, error } = await supabase.from('webhooks').insert([{
        name, url, events, secret_key: secretKey, enabled: true, created_by: user.data.user?.id
    }]).select().single();
    if (error) throw error;
    return data;
};

export const triggerWebhook = async (eventType: string, payload: any) => {
    const { data: webhooks } = await supabase.from('webhooks')
        .select('*')
        .eq('enabled', true)
        .contains('events', [eventType]);

    if (!webhooks || webhooks.length === 0) return;

    for (const webhook of webhooks) {
        try {
            const response = await fetch(webhook.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...webhook.headers },
                body: JSON.stringify({ event: eventType, data: payload })
            });

            await supabase.from('webhook_deliveries').insert([{
                webhook_id: webhook.id,
                event_type: eventType,
                payload,
                response_status: response.status,
                delivered_at: new Date().toISOString()
            }]);
        } catch (error: any) {
            await supabase.from('webhook_deliveries').insert([{
                webhook_id: webhook.id,
                event_type: eventType,
                payload,
                error_message: error.message
            }]);
        }
    }
};

// ============================================
// META ADS SERVICE
// ============================================

export const importMetaAdsLead = async (adLead: any) => {
    // Store raw lead
    const { data, error } = await supabase.from('meta_ads_leads').insert([{
        ad_id: adLead.ad_id,
        ad_name: adLead.ad_name,
        form_id: adLead.form_id,
        field_data: adLead.field_data,
        created_time: adLead.created_time
    }]).select().single();

    if (error) throw error;

    // Auto-create CRM lead
    const leadData = extractLeadFromMetaAds(adLead.field_data);
    const { data: crmLead } = await supabase.from('leads').insert([leadData]).select().single();

    if (crmLead) {
        await supabase.from('meta_ads_leads').update({
            lead_id: crmLead.id,
            imported: true,
            imported_at: new Date().toISOString()
        }).eq('id', data.id);
    }

    return crmLead;
};

const extractLeadFromMetaAds = (fieldData: any[]): any => {
    const fields: any = {};
    fieldData.forEach(f => { fields[f.name] = f.values[0]; });

    return {
        name: fields.full_name || fields.first_name + ' ' + (fields.last_name || ''),
        email: fields.email,
        phone: fields.phone_number,
        lead_source: 'Meta Ads',
        status: 'Contacted'
    };
};

export const getMetaAdsLeads = async (imported = false) => {
    const { data, error } = await supabase.from('meta_ads_leads')
        .select('*')
        .eq('imported', imported)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
};

// ============================================
// GOOGLE ADS SERVICE
// ============================================

export const importGoogleAdsLead = async (formData: any, campaignId: string, gclid: string) => {
    const { data, error } = await supabase.from('google_ads_leads').insert([{
        campaign_id: campaignId,
        form_data: formData,
        gclid
    }]).select().single();

    if (error) throw error;

    // Auto-create CRM lead
    const leadData = extractLeadFromGoogleAds(formData);
    const { data: crmLead } = await supabase.from('leads').insert([leadData]).select().single();

    if (crmLead) {
        await supabase.from('google_ads_leads').update({
            lead_id: crmLead.id,
            imported: true,
            imported_at: new Date().toISOString()
        }).eq('id', data.id);
    }

    return crmLead;
};

const extractLeadFromGoogleAds = (formData: any): any => {
    return {
        name: formData.name || formData.full_name,
        email: formData.email,
        phone: formData.phone || formData.phone_number,
        lead_source: 'Google Ads',
        status: 'Contacted'
    };
};

// ============================================
// WHATSAPP SERVICE
// ============================================

export const sendWhatsAppMessage = async (phoneNumber: string, message: string, entityType?: string, entityId?: string) => {
    // Get or create conversation
    let { data: conversation } = await supabase.from('whatsapp_conversations')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

    if (!conversation) {
        const { data: newConv } = await supabase.from('whatsapp_conversations').insert([{
            phone_number: phoneNumber,
            entity_type: entityType,
            entity_id: entityId,
            last_message_at: new Date().toISOString()
        }]).select().single();
        conversation = newConv;
    }

    const user = await supabase.auth.getUser();

    // Insert message
    const { data, error } = await supabase.from('whatsapp_messages').insert([{
        conversation_id: conversation.id,
        direction: 'outbound',
        content: message,
        sent_by: user.data.user?.id,
        status: 'sent'
    }]).select().single();

    if (error) throw error;

    // TODO: Actually send via WhatsApp Business API

    return data;
};

export const getWhatsAppConversations = async () => {
    const { data, error } = await supabase.from('whatsapp_conversations')
        .select('*')
        .eq('status', 'active')
        .order('last_message_at', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const getWhatsAppMessages = async (conversationId: string) => {
    const { data, error } = await supabase.from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
};

export const createWhatsAppTemplate = async (name: string, templateText: string, category: string) => {
    const user = await supabase.auth.getUser();
    const { data, error } = await supabase.from('whatsapp_templates').insert([{
        name, template_text: templateText, category, created_by: user.data.user?.id
    }]).select().single();
    if (error) throw error;
    return data;
};
