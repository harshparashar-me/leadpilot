import { supabase } from './supabase';

export interface Company {
  id: string;
  name: string;
  domain?: string;
  status: 'active' | 'suspended' | 'inactive';
  subscription_tier: 'starter' | 'professional' | 'enterprise';
  subscription_expires_at?: string;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Create a new company
 */
export const createCompany = async (name: string, domain?: string): Promise<Company> => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .insert([
        {
          name,
          domain: domain || null,
          status: 'active',
          subscription_tier: 'starter',
          settings: {}
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating company:', error);
      // Handle unique constraint violation (company name already exists)
      if (error.code === '23505' || error.message.includes('duplicate') || error.message.includes('unique')) {
        // Try to find existing company with similar name
        const { data: existing } = await supabase
          .from('companies')
          .select('*')
          .eq('name', name)
          .maybeSingle();
        
        if (existing) {
          return existing;
        }
        throw new Error('A company with this name already exists. Please use a different name.');
      }
      throw new Error(error.message || 'Failed to create company');
    }

    if (!data) {
      throw new Error('Failed to create company - no data returned');
    }

    return data;
  } catch (err: any) {
    console.error('Exception in createCompany:', err);
    throw err;
  }
};

/**
 * Get company by ID
 */
export const getCompanyById = async (companyId: string): Promise<Company | null> => {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();

  if (error) {
    console.error('Error fetching company:', error);
    return null;
  }

  return data;
};

/**
 * Get company for current user
 */
export const getCurrentUserCompany = async (): Promise<Company | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userData } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!userData?.company_id) return null;

  return getCompanyById(userData.company_id);
};

/**
 * Check if email domain matches company domain
 */
export const findCompanyByEmailDomain = async (email: string): Promise<Company | null> => {
  const domain = email.split('@')[1];
  
  const { data } = await supabase
    .from('companies')
    .select('*')
    .eq('domain', domain)
    .eq('status', 'active')
    .maybeSingle();

  return data || null;
};

/**
 * Get Admin role ID
 * Assumes Admin role already exists (created during setup)
 * If not, returns null and admin can assign role later
 */
export const getAdminRoleId = async (): Promise<string | null> => {
  const { data: adminRole } = await supabase
    .from('roles')
    .select('id')
    .eq('name', 'Admin')
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  return adminRole?.id || null;
};

/**
 * Check if user is the first user in a company (will be admin)
 */
export const isFirstUserInCompany = async (companyId: string): Promise<boolean> => {
  const { count } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId);

  return (count || 0) === 0;
};

