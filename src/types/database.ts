export interface Lead {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
  source?: string
  assigned_to?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Account {
  id: string
  name: string
  industry?: string
  size?: 'Small' | 'Medium' | 'Large' | 'Enterprise'
  location?: string
  website?: string
  phone?: string
  email?: string
  employees?: number
  revenue?: string
  assigned_to?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  job_title?: string
  department?: string
  account_id?: string
  lead_id?: string
  assigned_to?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  due_date?: string
  assigned_to?: string
  lead_id?: string
  account_id?: string
  contact_id?: string
  created_at: string
  updated_at: string
}

export interface Property {
  id: string
  title: string
  description?: string
  type?: 'Residential' | 'Commercial' | 'Industrial' | 'Land'
  status?: 'available' | 'sold' | 'rented' | 'pending'
  price?: number
  address?: string
  city?: string
  state?: string
  zip_code?: string
  bedrooms?: number
  bathrooms?: number
  square_feet?: number
  lot_size?: number
  year_built?: number
  assigned_to?: string
  created_at: string
  updated_at: string
}

export interface SiteVisit {
  id: string
  property_id?: string
  lead_id?: string
  contact_id?: string
  scheduled_date: string
  duration_minutes?: number
  status?: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  notes?: string
  assigned_to?: string
  created_at: string
  updated_at: string
}

export interface Deal {
  id: string
  title: string
  value?: number
  stage?: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
  probability?: number
  expected_close_date?: string
  lead_id?: string
  account_id?: string
  contact_id?: string
  assigned_to?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface CallLog {
  id: string
  contact_id?: string
  lead_id?: string
  account_id?: string
  phone_number?: string
  call_type?: 'outbound' | 'inbound'
  duration_minutes?: number
  outcome?: 'answered' | 'voicemail' | 'busy' | 'no_answer' | 'callback'
  notes?: string
  assigned_to?: string
  created_at: string
}

export interface Role {
  id: string
  name: string
  description?: string
  permissions?: string[] // Array of permission codes
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  role_id: string
  status: 'active' | 'inactive' | 'suspended'
  last_login?: string
  created_at: string
  updated_at: string
}