import { supabase } from './supabase';

export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body_html: string;
    body_text?: string;
    variables?: string[];
    category?: string;
}

export interface EmailConfig {
    to: string;
    cc?: string[];
    bcc?: string[];
    subject: string;
    body_html?: string;
    body_text?: string;
    template_id?: string;
    template_variables?: Record<string, string>;
    entity_type?: string;
    entity_id?: string;
}

/**
 * Send email (queues for sending)
 */
export const sendEmail = async (config: EmailConfig) => {
    const user = await supabase.auth.getUser();

    let { subject, body_html, body_text } = config;

    // If using template, render it
    if (config.template_id) {
        const template = await getEmailTemplate(config.template_id);
        if (template) {
            subject = renderTemplate(template.subject, config.template_variables || {});
            body_html = renderTemplate(template.body_html, config.template_variables || {});
            body_text = template.body_text ? renderTemplate(template.body_text, config.template_variables || {}) : undefined;
        }
    }

    // Get user's default email account
    const emailAccount = await getDefaultEmailAccount();
    if (!emailAccount) {
        throw new Error('No email account configured');
    }

    const { data, error } = await supabase
        .from('email_logs')
        .insert([
            {
                from_email: emailAccount.email,
                to_email: config.to,
                cc_emails: config.cc,
                bcc_emails: config.bcc,
                subject,
                body_html,
                body_text,
                template_id: config.template_id,
                entity_type: config.entity_type,
                entity_id: config.entity_id,
                status: 'pending',
                created_by: user.data.user?.id,
            },
        ])
        .select()
        .single();

    if (error) throw error;

    // TODO: Trigger actual email sending via edge function or external service
    // For now, just mark as sent
    await updateEmailStatus(data.id, 'sent');

    return data;
};

/**
 * Render template with variables
 */
const renderTemplate = (template: string, variables: Record<string, string>): string => {
    let rendered = template;

    // Replace all {{variable}} with actual values
    Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        rendered = rendered.replace(regex, value);
    });

    return rendered;
};

/**
 * Create email template
 */
export const createEmailTemplate = async (
    name: string,
    subject: string,
    bodyHtml: string,
    bodyText?: string,
    variables?: string[],
    category?: string
) => {
    const user = await supabase.auth.getUser();

    const { data, error } = await supabase
        .from('email_templates')
        .insert([
            {
                name,
                subject,
                body_html: bodyHtml,
                body_text: bodyText,
                variables,
                category,
                created_by: user.data.user?.id,
            },
        ])
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Get all email templates
 */
export const getEmailTemplates = async (category?: string) => {
    let query = supabase.from('email_templates').select('*');

    if (category) {
        query = query.eq('category', category);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
};

/**
 * Get single email template
 */
export const getEmailTemplate = async (templateId: string) => {
    const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', templateId)
        .single();

    if (error) throw error;
    return data;
};

/**
 * Update email template
 */
export const updateEmailTemplate = async (
    templateId: string,
    updates: Partial<EmailTemplate>
) => {
    const { data, error } = await supabase
        .from('email_templates')
        .update(updates)
        .eq('id', templateId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Delete email template
 */
export const deleteEmailTemplate = async (templateId: string) => {
    const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', templateId);

    if (error) throw error;
};

/**
 * Get email logs/history
 */
export const getEmailHistory = async (
    entityType?: string,
    entityId?: string,
    limit = 50
) => {
    let query = supabase.from('email_logs').select('*');

    if (entityType && entityId) {
        query = query.eq('entity_type', entityType).eq('entity_id', entityId);
    }

    const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data || [];
};

/**
 * Track email open
 */
export const trackEmailOpen = async (trackingId: string) => {
    const { error } = await supabase
        .from('email_logs')
        .update({
            status: 'opened',
            opened_at: new Date().toISOString(),
        })
        .eq('tracking_id', trackingId)
        .is('opened_at', null); // Only update if not already opened

    if (error) console.error('Error tracking email open:', error);
};

/**
 * Track email click
 */
export const trackEmailClick = async (trackingId: string) => {
    const { error } = await supabase
        .from('email_logs')
        .update({
            status: 'clicked',
            clicked_at: new Date().toISOString(),
        })
        .eq('tracking_id', trackingId)
        .is('clicked_at', null); // Only update if not already clicked

    if (error) console.error('Error tracking email click:', error);
};

/**
 * Update email status
 */
export const updateEmailStatus = async (
    emailId: string,
    status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed',
    errorMessage?: string
) => {
    const updates: any = { status };

    if (status === 'sent') {
        updates.sent_at = new Date().toISOString();
    }

    if (errorMessage) {
        updates.error_message = errorMessage;
    }

    const { error } = await supabase
        .from('email_logs')
        .update(updates)
        .eq('id', emailId);

    if (error) throw error;
};

/**
 * Configure email account (SMTP)
 */
export const configureEmailAccount = async (
    email: string,
    smtpHost: string,
    smtpPort: number,
    smtpUsername: string,
    smtpPassword: string,
    smtpSecure = true,
    isDefault = false
) => {
    const user = await supabase.auth.getUser();

    // If setting as default, unset other defaults first
    if (isDefault) {
        await supabase
            .from('email_accounts')
            .update({ is_default: false })
            .eq('user_id', user.data.user?.id);
    }

    const { data, error } = await supabase
        .from('email_accounts')
        .insert([
            {
                user_id: user.data.user?.id,
                email,
                smtp_host: smtpHost,
                smtp_port: smtpPort,
                smtp_username: smtpUsername,
                smtp_password: smtpPassword, // TODO: Encrypt this
                smtp_secure: smtpSecure,
                is_default: isDefault,
                status: 'active',
            },
        ])
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Get user's email accounts
 */
export const getEmailAccounts = async () => {
    const user = await supabase.auth.getUser();

    const { data, error } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('user_id', user.data.user?.id)
        .order('is_default', { ascending: false });

    if (error) throw error;
    return data || [];
};

/**
 * Get default email account
 */
export const getDefaultEmailAccount = async () => {
    const user = await supabase.auth.getUser();

    const { data } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('user_id', user.data.user?.id)
        .eq('is_default', true)
        .single();

    return data;
};

/**
 * Delete email account
 */
export const deleteEmailAccount = async (accountId: string) => {
    const { error } = await supabase
        .from('email_accounts')
        .delete()
        .eq('id', accountId);

    if (error) throw error;
};

/**
 * Send bulk emails
 */
export const sendBulkEmails = async (
    recipients: string[],
    subject: string,
    bodyHtml: string,
    templateId?: string,
    templateVariables?: Record<string, string>
) => {
    const promises = recipients.map(to =>
        sendEmail({
            to,
            subject,
            body_html: bodyHtml,
            template_id: templateId,
            template_variables: templateVariables,
        })
    );

    return Promise.allSettled(promises);
};
