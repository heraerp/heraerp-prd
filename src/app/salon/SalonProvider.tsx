'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { HAIRTALKZ_ORG_ID } from '@/lib/constants/salon'
import { Loader2 } from 'lucide-react'
import { LUXE_COLORS } from '@/lib/constants/salon'

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
    // Check if we have a specific org ID from subdomain routing
    const checkOrgFromSubdomain = () => {
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname
        
        // Check if running on hairtalkz subdomain (production or localhost)
        if (hostname.startsWith('hairtalkz.') || hostname === 'hairtalkz.localhost') {
          setOrgId('378f24fb-d496-4ff7-8afa-ea34895a0eb8')
        } 
        // Check for localhost development with path-based routing
        else if (window.location.pathname.startsWith('/~hairtalkz')) {
          setOrgId('378f24fb-d496-4ff7-8afa-ea34895a0eb8')
        }
      }
    }
    
    checkOrgFromSubdomain()
    loadContext()
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event)
      
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
        window.location.href = '/salon/auth'
        return
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
      
      // Use the orgId that was set based on subdomain or path
      const finalOrgId = typeof window !== 'undefined' && 
        (window.location.hostname.startsWith('hairtalkz.') || 
         window.location.hostname === 'hairtalkz.localhost' ||
         window.location.pathname.startsWith('/~hairtalkz'))
        ? '378f24fb-d496-4ff7-8afa-ea34895a0eb8' 
        : orgId
      
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