import { createClient } from '@supabase/supabase-js'

// Supabase configuration - get fresh values at runtime
const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (typeof window !== 'undefined' && !url) {
    console.error('🚨 NEXT_PUBLIC_SUPABASE_URL is missing from client environment')
  }
  return url
}

const getSupabaseAnonKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  if (typeof window !== 'undefined' && !key) {
    console.error('🚨 NEXT_PUBLIC_SUPABASE_ANON_KEY is missing from client environment')
  }
  return key
}

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
        flowType: 'pkce' // Enable proper session recovery
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
    // Enhanced error message for missing configuration
    const errorMessage = `Supabase not configured properly. Missing: ${!url ? 'NEXT_PUBLIC_SUPABASE_URL' : ''} ${!key ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : ''}`
    
    if (typeof window !== 'undefined') {
      console.error('🚨 Supabase configuration error:', {
        hasUrl: !!url,
        hasKey: !!key,
        urlPreview: url ? `${url.substring(0, 20)}...` : 'MISSING',
        keyPreview: key ? `${key.substring(0, 20)}...` : 'MISSING',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      })
    }
    
    // For build time, create a no-op client
    const noop = () => Promise.reject(new Error(errorMessage))
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
