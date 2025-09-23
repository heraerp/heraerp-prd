'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { HAIRTALKZ_ORG_ID, getSalonOrgId, LUXE_COLORS } from '@/lib/constants/salon'
import { Loader2 } from 'lucide-react'

interface SalonContextType {
  organizationId: string
  organization: any
  role: string | null
  permissions: string[]
  user: any
  isLoading: boolean
  isAuthenticated: boolean
}

const SalonContext = createContext<SalonContextType | undefined>(undefined)

export function SalonProvider({ children }: { children: React.ReactNode }) {
  // Check for organization ID from middleware headers or use default
  const [orgId, setOrgId] = useState(HAIRTALKZ_ORG_ID)
  
  const [context, setContext] = useState<SalonContextType>({
    organizationId: orgId,
    organization: { id: orgId, name: 'HairTalkz' },
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
        const { data: { session }, error } = await supabase.auth.getSession()
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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
          role: null,
          permissions: [],
          user: null,
          isLoading: false,
          isAuthenticated: false
        })
        
        // Only redirect if not already on auth page
        if (window.location.pathname !== '/salon/auth') {
          window.location.href = '/salon/auth'
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
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      // If there's a session error, log it but don't immediately redirect
      if (sessionError) {
        console.error('Session error:', sessionError)
      }
      
      // If no session and not on auth page, redirect
      if (!session?.user && !isAuthPage) {
        // Check localStorage for stored auth data first
        const storedRole = localStorage.getItem('salonRole')
        const storedOrgId = localStorage.getItem('organizationId')
        
        // If we have stored auth data, don't immediately redirect - give session time to recover
        if (storedRole && storedOrgId) {
          console.log('Session not found but localStorage has auth data - waiting for recovery...')
          // Set a temporary loading state
          setContext(prev => ({ ...prev, isLoading: true }))
          
          // Give Supabase a chance to recover the session
          setTimeout(async () => {
            const { data: { session: recoveredSession } } = await supabase.auth.getSession()
            if (!recoveredSession?.user) {
              // Now redirect if session still not recovered
              window.location.href = '/salon/auth'
            } else {
              // Session recovered, reload context
              loadContext()
            }
          }, 1000)
          return
        } else {
          // No stored auth data, redirect immediately
          window.location.href = '/salon/auth'
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
      
      setContext({
        organizationId: finalOrgId,
        organization: { id: finalOrgId, name: 'HairTalkz' },
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
        window.location.href = '/salon/auth'
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

  return (
    <SalonContext.Provider value={context}>
      {children}
    </SalonContext.Provider>
  )
}

export function useSalonContext() {
  const context = useContext(SalonContext)
  if (context === undefined) {
    throw new Error('useSalonContext must be used within a SalonProvider')
  }
  return context
}