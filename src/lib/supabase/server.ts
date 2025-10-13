import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Server-side Supabase client with service role key
export const createServerClient = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase server configuration')
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  })
}

// Alias for backwards compatibility
export const createClient = createServerClient

// Build-safe helper export
export const supabaseServerHelper = {
  createClient: createServerClient,
  createServerClient
}
