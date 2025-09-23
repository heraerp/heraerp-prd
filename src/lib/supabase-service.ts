/**
 * Supabase Service Role Client
 * Server-side only client with elevated privileges for API routes
 */

import { createClient } from '@supabase/supabase-js'

// Service role configuration (server-side only)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create service role client (bypasses RLS)
export const getSupabaseService = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase service configuration missing')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Helper to execute raw SQL with proper error handling
export async function executeSQL<T = any>(
  sql: string,
  params: any[] = []
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const supabase = getSupabaseService()
    const { data, error } = await supabase.rpc('execute_sql', {
      query: sql,
      params
    })

    if (error) {
      return { data: null, error: new Error(error.message) }
    }

    return { data, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error')
    }
  }
}
