import { createClient } from '@supabase/supabase-js'

// Supabase configuration from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Check if we're in demo mode (no real Supabase credentials OR force demo mode)
const isPlaceholder = supabaseUrl.includes('placeholder') || supabaseUrl.includes('your-project-id')
const forceDemo = process.env.NEXT_PUBLIC_FORCE_DEMO_MODE === 'true'  // Only enable if explicitly set to true
const hasSupabaseServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
const isDemoMode = isPlaceholder || forceDemo

// Configuration logging removed for production deployment

// Create Supabase client for client-side usage
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
)

// Export demo mode flag
export const DEMO_MODE = isDemoMode

// Database types for HERA tables
export interface Organization {
  id: string
  organization_name: string
  organization_type: string
  created_at?: string
  updated_at?: string
}

export interface CoreEntity {
  id: string
  organization_id: string
  entity_type: string
  entity_code: string
  entity_name: string
  description?: string
  status: string
  metadata?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export interface UserProfile {
  id: string
  user_id: string
  organization_id: string
  full_name: string
  role: string
  metadata?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}