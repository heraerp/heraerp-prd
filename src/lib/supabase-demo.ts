import { SupabaseClient } from '@supabase/supabase-js'
import { getSupabase } from './supabase'

/**
 * Demo-aware Supabase client factory
 * Uses service role for demo sessions to bypass RLS restrictions
 */

interface DemoSession {
  entity_id: string
  organization_id: string
  role: string
  scopes: string[]
  session_type: 'demo'
  expires_at: string
}

// Check if current session is a demo session
function getDemoSession(): DemoSession | null {
  if (typeof window === 'undefined') return null

  try {
    const demoSessionCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('hera-demo-session='))
      ?.split('=')[1]

    if (demoSessionCookie) {
      const session = JSON.parse(decodeURIComponent(demoSessionCookie))

      // Validate session hasn't expired
      if (session.expires_at && new Date(session.expires_at) > new Date()) {
        return session
      }
    }
  } catch (error) {
    console.warn('Invalid demo session cookie:', error)
  }

  return null
}

// Cached demo client to prevent multiple instances
let demoSupabaseClient: SupabaseClient | null = null
let cachedDemoSessionId: string | null = null

// Create demo-aware Supabase client
export function createDemoAwareSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const demoSession = getDemoSession()

  if (demoSession) {
    // Create a unique session ID for caching
    const currentSessionId = `${demoSession.entity_id}-${demoSession.expires_at}`

    // Use cached client if available and session hasn't changed
    if (demoSupabaseClient && cachedDemoSessionId === currentSessionId) {
      return demoSupabaseClient
    }

    // Clear cache if session changed
    if (cachedDemoSessionId !== currentSessionId) {
      demoSupabaseClient = null
      cachedDemoSessionId = currentSessionId
    }

    // Use service role for demo sessions to bypass RLS
    const serviceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

    if (serviceKey) {
      console.log('🧬 Using service role for demo session:', {
        organization_id: demoSession.organization_id,
        entity_id: demoSession.entity_id,
        expires_at: demoSession.expires_at
      })

      // For demo, we'll use the regular client since RLS is now fixed
      // The demo user is authenticated like any other user
      demoSupabaseClient = getSupabase()

      // Update cached session ID
      cachedDemoSessionId = currentSessionId

      return demoSupabaseClient
    }
  }

  // Always use the singleton client
  return getSupabase()
}

// Get demo session info
export function getDemoSessionInfo(): DemoSession | null {
  return getDemoSession()
}

// Check if current session is demo
export function isDemoSession(): boolean {
  return getDemoSession() !== null
}

// Clear demo client cache (useful when session changes)
export function clearDemoClientCache(): void {
  demoSupabaseClient = null
  cachedDemoSessionId = null
  console.log('🧹 Demo Supabase client cache cleared')
}
