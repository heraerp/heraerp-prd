import { createClient } from '@supabase/supabase-js'

// Check if we're in a build environment
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'

// Lazy initialization of Supabase client to handle build-time issues
let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  // During build time, always return null
  if (isBuildTime) {
    return null
  }
  
  // During runtime, return null if environment variables aren't available
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
      console.warn('Supabase environment variables not configured')
    }
    return null
  }

  // Initialize client on first use
  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  }

  return supabaseClient
}