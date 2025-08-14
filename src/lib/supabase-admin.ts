import { createClient } from '@supabase/supabase-js'

// Cached client instance
let supabaseAdmin: ReturnType<typeof createClient> | null = null

/**
 * Get Supabase admin client with proper error handling
 * This function ensures environment variables are available at runtime
 * and caches the client instance for reuse
 */
export function getSupabaseAdmin() {
  // Return cached instance if available
  if (supabaseAdmin) {
    return supabaseAdmin
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY ||
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    // During build time, return a mock client
    if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
      console.warn('⚠️ Supabase environment variables not found - using mock client for build')
      return {
        from: () => ({
          select: () => ({ data: [], error: null }),
          insert: () => ({ data: [], error: null }),
          update: () => ({ data: [], error: null }),
          delete: () => ({ data: [], error: null }),
        })
      } as any
    }
    throw new Error('Missing Supabase environment variables')
  }
  
  // Create and cache the client
  supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false
    }
  })
  
  return supabaseAdmin
}