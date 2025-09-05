import { createClient } from '@supabase/supabase-js'

// Server-side Supabase configuration
// IMPORTANT: These MUST be set as environment variables in Railway
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'

// Create a singleton instance for admin client
let supabaseAdminInstance: ReturnType<typeof createClient> | null = null

// Initialize admin client only when needed
export const getSupabaseAdmin = () => {
  if (!supabaseAdminInstance) {
    // Validate configuration
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL is not properly configured!')
      console.error('Current value:', supabaseUrl)
    }
    
    // Create client even with placeholder for build compatibility
    supabaseAdminInstance = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    )
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

// Helper to create a server client with user context
export function createServerClient(accessToken?: string) {
  if (!accessToken) {
    return getSupabaseAdmin()
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  
  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    }
  )
}