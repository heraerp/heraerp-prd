import { createClient } from '@supabase/supabase-js'

// Supabase configuration - get fresh values at runtime
const getSupabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const getSupabaseAnonKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Use global singleton to prevent multiple instances across hot reloads
const globalForSupabase = globalThis as unknown as {
  supabaseInstance?: ReturnType<typeof createClient>
}

// Initialize Supabase client only when needed
export const getSupabase = () => {
  // If already initialized globally, return the instance
  if (globalForSupabase.supabaseInstance) {
    return globalForSupabase.supabaseInstance
  }

  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()

  // Only create client if we have valid configuration
  if (url && key && !url.includes('placeholder')) {
    globalForSupabase.supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'hera-supabase-auth', // Consistent storage key
        flowType: 'implicit' // Disable automatic session recovery
      },
      global: {
        headers: {
          'X-Client-Info': 'hera-erp'
        }
      },
      db: {
        schema: 'public'
      }
    })

    // Log configuration status (not the actual values)
    if (typeof window !== 'undefined') {
      console.log('🔧 Supabase client configuration:', {
        hasUrl: !!url,
        hasKey: !!key,
        projectId: url.includes('supabase.co')
          ? url.split('.')[0].replace('https://', '')
          : 'unknown',
        storageKey: 'hera-supabase-auth',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      })

      // Debug: Check if this is being called multiple times
      console.log('📍 Supabase client created from:', new Error().stack?.split('\n')[2])
    }
  } else {
    // For build time, create a no-op client
    const noop = () => Promise.reject(new Error('Supabase not configured'))
    globalForSupabase.supabaseInstance = {
      from: () => ({ select: noop, insert: noop, update: noop, delete: noop }),
      auth: { getSession: noop, signIn: noop, signOut: noop },
      storage: { from: () => ({ upload: noop, download: noop }) },
      rpc: noop
    } as any
  }

  return globalForSupabase.supabaseInstance
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
