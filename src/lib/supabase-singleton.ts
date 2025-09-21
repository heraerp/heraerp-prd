import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * HERA Supabase Singleton
 * Enterprise-grade singleton pattern to prevent multiple client instances
 */

// Global singleton storage (persists across module reloads)
const globalForSupabase = global as unknown as { supabase: SupabaseClient | undefined }

// Create client only once
if (!globalForSupabase.supabase) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (url && key && !url.includes('placeholder')) {
    globalForSupabase.supabase = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'hera-supabase-auth',
        flowType: 'implicit'
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
  }
}

export const supabaseSingleton = globalForSupabase.supabase!

// Helper to get singleton
export function getSupabaseSingleton(): SupabaseClient {
  if (!globalForSupabase.supabase) {
    throw new Error('Supabase client not initialized')
  }
  return globalForSupabase.supabase
}
