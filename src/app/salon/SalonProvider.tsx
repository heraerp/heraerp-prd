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
  }, [])

  const loadContext = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        window.location.href = '/salon/auth'
        return
      }

      const storedRole = localStorage.getItem('salonRole')
      const storedPermissions = JSON.parse(localStorage.getItem('userPermissions') || '[]')
      
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
      window.location.href = '/salon/auth'
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