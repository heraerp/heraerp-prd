import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Singleton instance
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null

// During build time, we might not have these variables set
// Return a mock client factory that will throw at runtime if used
export const createClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client for build time
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      // Only throw in browser runtime, not during build
      throw new Error('Missing Supabase environment variables')
    }
    // Return null during build time
    return null as any
  }

  // Return singleton instance
  if (supabaseInstance) {
    return supabaseInstance
  }

  supabaseInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })

  return supabaseInstance
}

// Legacy support - alias for createClient
export const getSupabase = createClient

// Direct export for files expecting 'supabase'
export const supabase = createClient()
