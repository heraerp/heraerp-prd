'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { HAIRTALKZ_ORG_ID, getSalonOrgId, LUXE_COLORS } from '@/lib/constants/salon'
import { Loader2 } from 'lucide-react'
import { useSalonSession } from '@/hooks/useSalonSession'

interface SalonContextType {
  organizationId: string
  organization: any
  currency: string
  role: string | null
  permissions: string[]
  user: any
  isLoading: boolean
  isAuthenticated: boolean
}

const SalonContext = createContext<SalonContextType | undefined>(undefined)

export function SalonProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  // Maintain session across navigations
  useSalonSession()

  // Check for organization ID from middleware headers or use default
  const [orgId, setOrgId] = useState(HAIRTALKZ_ORG_ID)

  const [context, setContext] = useState<SalonContextType>({
    organizationId: orgId,
    organization: { id: orgId, name: 'HairTalkz' },
    currency: 'AED', // Default until loaded from database
    role: null,
    permissions: [],
    user: null,
    isLoading: true,
    isAuthenticated: false
  })

  useEffect(() => {
    // Get organization ID based on current location
    if (typeof window !== 'undefined') {
      const detectedOrgId = getSalonOrgId(window.location.hostname, window.location.pathname)
      console.log('Detected organization ID:', detectedOrgId)
      setOrgId(detectedOrgId)
    }

    // Refresh session on mount
    const refreshSession = async () => {
      try {
        const {
          data: { session },
          error
        } = await supabase.auth.getSession()
        if (error) {
          console.error('Session refresh error:', error)
        }
        if (session) {
          console.log('Session refreshed:', session.user.email)
        }
      } catch (err) {
        console.error('Failed to refresh session:', err)
      }
    }

    refreshSession()
    loadContext()

    // Listen for auth state changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, {
        hasSession: !!session,
        userEmail: session?.user?.email,
        metadata: session?.user?.user_metadata
      })

      if (event === 'SIGNED_IN' && session) {
        // Reload context when user signs in
        loadContext()
      } else if (event === 'SIGNED_OUT') {
        // Clear context when user signs out
        setContext({
          organizationId: orgId,
          organization: { id: orgId, name: 'HairTalkz' },
          currency: 'AED', // Default currency
          role: null,
          permissions: [],
          user: null,
          isLoading: false,
          isAuthenticated: false
        })

        // Only redirect if not already on auth page
        if (window.location.pathname !== '/salon/auth') {
          router.push('/salon/auth')
        }
      } else if (event === 'TOKEN_REFRESHED') {
        // Token was refreshed, reload context to ensure everything is up to date
        loadContext()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadContext = async () => {
    try {
      // First check if we're on the auth page - don't redirect if we are
      const isAuthPage = window.location.pathname === '/salon/auth'

      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession()

      // If there's a session error, log it but don't immediately redirect
      if (sessionError) {
        console.error('Session error:', sessionError)
      }

      // If no session and not on auth page, try harder to recover
      if (!session?.user && !isAuthPage) {
        // Check localStorage for stored auth data first
        const storedRole = localStorage.getItem('salonRole')
        const storedOrgId = localStorage.getItem('organizationId')

        console.log('No session found, checking recovery options...', {
          hasStoredRole: !!storedRole,
          hasStoredOrgId: !!storedOrgId,
          pathname: window.location.pathname
        })

        // If we have stored auth data, don't immediately redirect - give session time to recover
        if (storedRole && storedOrgId) {
          console.log('Session not found but localStorage has auth data - waiting for recovery...')
          // Set a temporary loading state
          setContext(prev => ({ ...prev, isLoading: true }))

          // Try to refresh the session first
          try {
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
            if (refreshData?.session) {
              console.log('Session recovered via refresh!')
              // Session recovered, reload context
              setTimeout(() => loadContext(), 100)
              return
            }
          } catch (err) {
            console.error('Session refresh failed:', err)
          }

          // Give Supabase one more chance to recover the session
          setTimeout(async () => {
            const {
              data: { session: recoveredSession }
            } = await supabase.auth.getSession()
            if (!recoveredSession?.user) {
              console.log('Session recovery failed, redirecting to auth...')
              // Now redirect if session still not recovered
              router.push('/salon/auth')
            } else {
              console.log('Session recovered after delay!')
              // Session recovered, reload context
              loadContext()
            }
          }, 1500)
          return
        } else {
          console.log('No stored auth data, redirecting to auth...')
          // No stored auth data, redirect immediately
          router.push('/salon/auth')
          return
        }
      }

      // If we're on auth page without a session, just set loading to false
      if (!session?.user && isAuthPage) {
        setContext(prev => ({ ...prev, isLoading: false }))
        return
      }

      // Add a small delay to ensure localStorage is properly set after login
      await new Promise(resolve => setTimeout(resolve, 100))

      const storedRole = localStorage.getItem('salonRole') || session?.user?.user_metadata?.role
      const storedPermissions = JSON.parse(localStorage.getItem('userPermissions') || '[]')

      console.log('Loading context - stored role:', storedRole)
      console.log('Loading context - user metadata:', session?.user?.user_metadata)
      console.log('Loading context - session user:', session?.user?.email)

      // Use the detected org ID
      const finalOrgId = orgId // Already set by getSalonOrgId

      // Fetch organization data from database to get currency
      let organizationData = { id: finalOrgId, name: 'HairTalkz' }
      let currency = 'AED' // Default fallback

      try {
        const { data: orgData, error: orgError } = await supabase
          .from('core_organizations')
          .select('*')
          .eq('id', finalOrgId)
          .single()

        if (!orgError && orgData) {
          organizationData = {
            id: orgData.id,
            name: orgData.organization_name,
            ...orgData
          }
          // Get currency from settings
          currency = orgData.settings?.currency || 'AED'
          console.log('Loaded organization currency:', currency)
        }
      } catch (err) {
        console.error('Error loading organization data:', err)
        // Continue with defaults
      }

      setContext({
        organizationId: finalOrgId,
        organization: organizationData,
        currency,
        role: storedRole,
        permissions: storedPermissions,
        user: session.user,
        isLoading: false,
        isAuthenticated: true
      })
    } catch (error) {
      console.error('Error loading salon context:', error)
      // Only redirect if not already on auth page
      if (window.location.pathname !== '/salon/auth') {
        router.push('/salon/auth')
      } else {
        setContext(prev => ({ ...prev, isLoading: false }))
      }
    }
  }

  if (context.isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: LUXE_COLORS.charcoal }}
      >
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: LUXE_COLORS.gold }} />
      </div>
    )
  }

  return <SalonContext.Provider value={context}>{children}</SalonContext.Provider>
}

export function useSalonContext() {
  const context = useContext(SalonContext)
  if (context === undefined) {
    throw new Error('useSalonContext must be used within a SalonProvider')
  }
  return context
}
