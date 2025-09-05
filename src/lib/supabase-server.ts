import { createClient } from '@supabase/supabase-js'

// Server-side Supabase configuration
// IMPORTANT: These MUST be set as environment variables in Railway
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Validate configuration
if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL is not properly configured!')
  console.error('Current value:', supabaseUrl)
}

// Create Supabase client for server-side usage (bypasses RLS)
export const supabaseAdmin = createClient(
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

// Helper to create a server client with user context
export function createServerClient(accessToken?: string) {
  if (!accessToken) {
    return supabaseAdmin
  }
  
  return createClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
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