import { createClient } from '@supabase/supabase-js'

// Supabase configuration from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

// Create a singleton instance that can be initialized later
let supabaseInstance: ReturnType<typeof createClient> | null = null

// Initialize Supabase client only when needed
export const getSupabase = () => {
  if (!supabaseInstance) {
    // Only create client if we have valid configuration
    if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder')) {
      supabaseInstance = createClient(
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
      
      // Log configuration status (not the actual values)
      if (typeof window !== 'undefined') {
        console.log('Supabase client configuration:', {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          projectId: supabaseUrl.includes('supabase.co') 
            ? supabaseUrl.split('.')[0].replace('https://', '') 
            : 'unknown'
        })
      }
    } else {
      // Return a placeholder client that throws meaningful errors
      console.warn('Supabase client not configured - using placeholder')
      // Create a minimal client for build time
      supabaseInstance = createClient(
        'https://placeholder.supabase.co',
        'placeholder-anon-key',
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        }
      )
    }
  }
  return supabaseInstance
}

// Export a proxy that initializes on first use
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop) {
    const client = getSupabase()
    return client[prop as keyof typeof client]
  }
})


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