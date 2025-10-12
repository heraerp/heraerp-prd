import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Server-side Supabase client with SSR support for Next 15
export function createServerSupabaseClient(req?: NextRequest) {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase server configuration')
  }

  if (req) {
    // For middleware or API routes with request object
    return createServerClient(supabaseUrl, supabaseServiceKey, {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
      },
    })
  } else {
    // For server components using Next.js cookies()
    const cookieStore = cookies()
    return createServerClient(supabaseUrl, supabaseServiceKey, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
      },
    })
  }
}

// Legacy alias for backwards compatibility
export const createClient = () => createServerSupabaseClient()

// Named export that matches expected import patterns
export { createServerSupabaseClient as createServerClient }