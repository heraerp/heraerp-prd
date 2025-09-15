import { createClient } from '@supabase/supabase-js'

// Server-side Supabase configuration - get fresh values at runtime
// IMPORTANT: These MUST be set as environment variables in Railway
const getSupabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const getSupabaseServiceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Create a singleton instance for admin client
let supabaseAdminInstance: ReturnType<typeof createClient> | null = null

// Initialize admin client only when needed
export const getSupabaseAdmin = () => {
  if (!supabaseAdminInstance) {
    const url = getSupabaseUrl()
    const key = getSupabaseServiceKey()

    // Validate configuration
    if (!url || url.includes('placeholder')) {
      console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL is not properly configured!')
      console.error('Current value:', url)
      throw new Error('Supabase URL not configured')
    }

    if (!key || key.includes('placeholder')) {
      console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY is not properly configured!')
      throw new Error('Supabase service key not configured')
    }

    // Create client with actual values
    supabaseAdminInstance = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    })
  }
  return supabaseAdminInstance
}

// Export a proxy that initializes on first use
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop) {
    const client = getSupabaseAdmin()
    return client[prop as keyof typeof client]
  }
})

// Legacy export for compatibility
export const createClient = getSupabaseAdmin

// Helper to create a server client with user context
export function createServerClient(accessToken?: string) {
  if (!accessToken) {
    return getSupabaseAdmin()
  }

  const url = getSupabaseUrl()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (!url || !anonKey) {
    throw new Error('Supabase configuration missing')
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  })
}
