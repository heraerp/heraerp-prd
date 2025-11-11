/**
 * HERA v3.0 Authentication Provider
 * Multi-Industry Platform Architecture with Platform Organization Support
 * 
 * Features:
 * - Platform organization user registry
 * - Multi-tenant organization switching
 * - Industry-specific template pack loading
 * - Dynamic branding support
 */

'use client'

import React, { createContext, useContext, useEffect, useRef, useState, useMemo, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  platformOrgManager,
  type PlatformUser,
  type OrganizationMembership 
} from '@/lib/platform/organization-manager'
import { 
  PLATFORM_ORG_ID, 
  isPlatformOrg,
  type IndustryType,
  type MembershipRole 
} from '@/lib/platform/constants'

type HeraStatus = 'idle' | 'resolving' | 'authenticated' | 'select_organization' | 'error'

// Enhanced HERA v3.0 types
interface HERAUserV3 {
  id: string              // Supabase auth UID
  entity_id: string       // USER entity ID in platform org  
  name: string
  email: string
  platform_user: boolean // Always true for v3.0
  created_at: string
}

interface HERAOrganizationV3 {
  id: string              // Tenant organization ID
  entity_id: string       // ORG entity ID  
  name: string
  type: string
  industry: IndustryType
  settings: {
    branding: {
      logo_url?: string
      primary_color: string
      secondary_color: string
      accent_color: string
      font_family: string
      theme: 'light' | 'dark'
      custom_domain?: {
        domain: string
        verified: boolean
      }
    }
    template_pack: {
      pack_id: string
      loaded_at: string
      version: string
    }
    features: Record<string, boolean>
    ai_preferences: {
      enabled: boolean
      default_mode: string
      cost_limit_monthly: number
    }
  }
}

interface HERAAuthContextV3 {
  // Authentication state
  user: HERAUserV3 | null
  organization: HERAOrganizationV3 | null
  isAuthenticated: boolean
  isLoading: boolean
  status: HeraStatus
  
  // Multi-org support
  memberships: OrganizationMembership[]
  availableOrganizations: HERAOrganizationV3[]
  currentMembership: OrganizationMembership | null
  
  // Authorization  
  role: MembershipRole | null
  hasScope: (scope: string) => boolean
  
  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, metadata?: any) => Promise<any>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
  
  // Multi-org actions
  switchOrganization: (orgId: string) => Promise<boolean>
  selectOrganization: (orgId: string) => Promise<void>
  
  // Legacy compatibility helpers
  currentOrganization: HERAOrganizationV3 | null
  organizations: HERAOrganizationV3[]
  contextLoading: boolean
  userEntityId?: string
  organizationId?: string
  scopes: string[]
}

const HERAAuthContextV3 = createContext<HERAAuthContextV3 | undefined>(undefined)

interface HERAAuthProviderV3Props {
  children: ReactNode
  enableMultiOrg?: boolean  // Feature flag for gradual rollout
}

export function HERAAuthProviderV3({ children, enableMultiOrg = true }: HERAAuthProviderV3Props) {
  const router = useRouter()
  const pathname = usePathname()
  const didResolveRef = useRef(false)
  const subRef = useRef<ReturnType<any> | null>(null)
  
  const [ctx, setCtx] = useState<{
    status: HeraStatus
    user: HERAUserV3 | null
    organization: HERAOrganizationV3 | null
    memberships: OrganizationMembership[]
    currentMembership: OrganizationMembership | null
    isAuthenticated: boolean
    isLoading: boolean
    role: MembershipRole | null
  }>({
    status: 'idle',
    user: null,
    organization: null,
    memberships: [],
    currentMembership: null,
    isAuthenticated: false,
    isLoading: true,
    role: null
  })

  // Initialize authentication on mount
  useEffect(() => {
    // Ensure single subscription per mount
    if (subRef.current) return

    ;(async () => {
      try {
        const supabase = createClient()

        subRef.current = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('🔐 HERA v3.0 Auth state change:', event, {
            hasSession: !!session,
            didResolve: didResolveRef.current,
            enableMultiOrg
          })

          // Handle session state changes
          if (didResolveRef.current) {
            if (!session) {
              console.log('🔐 Session disappeared, resetting context')
              didResolveRef.current = false
              setCtx({
                status: 'idle',
                user: null,
                organization: null,
                memberships: [],
                currentMembership: null,
                isAuthenticated: false,
                isLoading: false,
                role: null
              })
              return
            }
            
            // Session exists but context missing - allow re-resolution
            if (session && !ctx.user) {
              console.log('🔄 Session exists but context missing, re-resolving...')
              didResolveRef.current = false
              // Fall through to resolution logic
            } else {
              console.log('✅ Session and context both valid')
              return
            }
          }

          if (!session) {
            setCtx(prev => ({ ...prev, status: 'idle', isLoading: false }))
            return
          }

          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
            if (didResolveRef.current) return
            setCtx(prev => ({ ...prev, status: 'resolving', isLoading: true }))
            
            try {
              await resolveUserAndOrganizations(session)
              didResolveRef.current = true
            } catch (e) {
              console.error('HERA v3.0 resolve error', e)
              setCtx(prev => ({ ...prev, status: 'error', isLoading: false }))
            }
          }
        })
        
      } catch (error) {
        console.error('❌ Failed to set up auth state listener:', error)
      }
    })()

    return () => {
      subRef.current?.data?.subscription?.unsubscribe?.()
      subRef.current = null
    }
  }, [enableMultiOrg])

  /**
   * Resolve user identity and organization memberships
   */
  const resolveUserAndOrganizations = async (session: any) => {
    try {
      const { user: authUser } = session
      
      // Step 1: Try to resolve existing platform user  
      const memberships = await platformOrgManager.getUserMemberships(authUser.id)
      
      let platformUser: PlatformUser
      
      if (memberships.length === 0) {
        // New user - register in platform organization
        console.log('📝 Registering new platform user')
        platformUser = await platformOrgManager.registerPlatformUser(authUser, {
          name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0]
        })
      } else {
        // Existing user - construct platform user from auth
        platformUser = {
          id: authUser.id,
          entity_id: authUser.id, // For existing users, might need lookup
          email: authUser.email || '',
          name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
          created_at: authUser.created_at,
          memberships
        }
      }

      const heraUser: HERAUserV3 = {
        id: platformUser.id,
        entity_id: platformUser.entity_id,
        name: platformUser.name,
        email: platformUser.email,
        platform_user: true,
        created_at: platformUser.created_at
      }

      // Step 2: Handle organization context
      if (enableMultiOrg && memberships.length === 0) {
        // New user with no organizations - need to create first org or join existing
        setCtx({
          status: 'select_organization',
          user: heraUser,
          organization: null,
          memberships: [],
          currentMembership: null,
          isAuthenticated: true,
          isLoading: false,
          role: null
        })
        
        // Redirect to organization setup if not already there
        if (!pathname.includes('/setup') && !pathname.includes('/join')) {
          router.push('/setup/organization')
        }
        return
      }

      if (enableMultiOrg && memberships.length > 1) {
        // Multiple organizations - let user choose (unless URL specifies)
        const urlOrgId = extractOrgFromURL(pathname)
        const targetMembership = urlOrgId 
          ? memberships.find(m => m.organization_id === urlOrgId)
          : memberships[0] // Default to first

        if (!targetMembership) {
          setCtx({
            status: 'select_organization',
            user: heraUser,
            organization: null,
            memberships,
            currentMembership: null,
            isAuthenticated: true,
            isLoading: false,
            role: null
          })
          return
        }

        await setCurrentOrganization(heraUser, targetMembership, memberships)
      } else if (memberships.length === 1) {
        // Single organization - auto-select
        await setCurrentOrganization(heraUser, memberships[0], memberships)
      } else {
        // Fallback to legacy single-org behavior
        await handleLegacySingleOrg(heraUser)
      }

    } catch (error) {
      console.error('Failed to resolve user and organizations:', error)
      throw error
    }
  }

  /**
   * Set current organization context
   */
  const setCurrentOrganization = async (
    user: HERAUserV3, 
    membership: OrganizationMembership,
    allMemberships: OrganizationMembership[]
  ) => {
    const organization: HERAOrganizationV3 = {
      id: membership.organization.id,
      entity_id: membership.organization.entity_id,
      name: membership.organization.name,
      type: membership.organization.type,
      industry: membership.organization.industry,
      settings: membership.organization.settings
    }

    setCtx({
      status: 'authenticated',
      user,
      organization,
      memberships: allMemberships,
      currentMembership: membership,
      isAuthenticated: true,
      isLoading: false,
      role: membership.role
    })

    // Apply dynamic branding
    applyOrganizationBranding(organization)

    console.log('✅ HERA v3.0 organization context set:', {
      orgId: organization.id,
      industry: organization.industry,
      templatePack: organization.settings.template_pack.pack_id
    })
  }

  /**
   * Apply organization branding to the UI
   */
  const applyOrganizationBranding = (org: HERAOrganizationV3) => {
    const { branding } = org.settings
    
    // Apply CSS variables for dynamic theming
    const root = document.documentElement
    root.style.setProperty('--primary-color', branding.primary_color)
    root.style.setProperty('--secondary-color', branding.secondary_color)
    root.style.setProperty('--accent-color', branding.accent_color)
    root.style.setProperty('--font-family', branding.font_family)
    
    // Update page title and favicon
    if (branding.logo_url) {
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
      if (favicon) favicon.href = branding.logo_url
    }
    
    document.title = `${org.name} - HERA`
  }

  /**
   * Handle legacy single-org behavior (fallback)
   */
  const handleLegacySingleOrg = async (user: HERAUserV3) => {
    // Fallback to existing salon org logic
    const { getSafeOrgConfig } = await import('@/lib/salon/safe-org-loader')
    const safeConfig = getSafeOrgConfig()
    
    const organization: HERAOrganizationV3 = {
      id: safeConfig.organizationId,
      entity_id: safeConfig.organizationId,
      name: safeConfig.fallbackName,
      type: 'salon',
      industry: 'salon_beauty' as IndustryType,
      settings: {
        branding: {
          primary_color: '#d946ef',
          secondary_color: '#c026d3',
          accent_color: '#f59e0b',
          font_family: 'Inter',
          theme: 'light'
        },
        template_pack: {
          pack_id: 'salon_beauty_v1',
          loaded_at: new Date().toISOString(),
          version: '1.0.0'
        },
        features: {},
        ai_preferences: {
          enabled: true,
          default_mode: 'assisted',
          cost_limit_monthly: 500
        }
      }
    }

    setCtx({
      status: 'authenticated',
      user,
      organization,
      memberships: [],
      currentMembership: null,
      isAuthenticated: true,
      isLoading: false,
      role: 'owner'
    })
  }

  /**
   * Extract organization ID from URL
   */
  const extractOrgFromURL = (pathname: string): string | null => {
    // Handle patterns like /org/{org-id}/* or subdomain routing
    const orgMatch = pathname.match(/^\/org\/([^\/]+)/)
    return orgMatch ? orgMatch[1] : null
  }

  // Auth actions
  const login = async (email: string, password: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      console.log('✅ Login successful, auth state will update automatically')
    } catch (error) {
      console.error('❌ Login error:', error)
      throw error
    }
  }

  const register = async (email: string, password: string, metadata?: any) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata }
      })

      if (error) throw error
      console.log('✅ Registration successful')
      return data
    } catch (error) {
      console.error('❌ Registration error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      didResolveRef.current = false
      router.push('/auth/login')
    } catch (error) {
      console.error('💥 Logout error:', error)
    }
  }

  const refreshAuth = async () => {
    didResolveRef.current = false
    setCtx(prev => ({ ...prev, isLoading: true }))
  }

  const switchOrganization = async (orgId: string): Promise<boolean> => {
    if (!ctx.user) return false
    
    try {
      const success = await platformOrgManager.switchOrganization(ctx.user.id, orgId)
      if (success) {
        // Find the membership and switch context
        const membership = ctx.memberships.find(m => m.organization_id === orgId)
        if (membership) {
          await setCurrentOrganization(ctx.user, membership, ctx.memberships)
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Failed to switch organization:', error)
      return false
    }
  }

  const selectOrganization = async (orgId: string) => {
    const success = await switchOrganization(orgId)
    if (success) {
      router.push('/dashboard')
    }
  }

  const hasScope = (scope: string): boolean => {
    if (!ctx.currentMembership) return false
    return ctx.currentMembership.role === 'owner' || ctx.currentMembership.role === 'admin'
  }

  // Computed values
  const availableOrganizations: HERAOrganizationV3[] = ctx.memberships.map(m => ({
    id: m.organization.id,
    entity_id: m.organization.entity_id,
    name: m.organization.name,
    type: m.organization.type,
    industry: m.organization.industry,
    settings: m.organization.settings
  }))

  const contextValue: HERAAuthContextV3 = useMemo(() => ({
    ...ctx,
    availableOrganizations,
    login,
    register,
    logout,
    refreshAuth,
    switchOrganization,
    selectOrganization,
    hasScope,
    
    // Legacy compatibility
    currentOrganization: ctx.organization,
    organizations: availableOrganizations,
    contextLoading: ctx.isLoading,
    userEntityId: ctx.user?.entity_id,
    organizationId: ctx.organization?.id,
    scopes: ctx.role ? [ctx.role.toUpperCase()] : []
  }), [ctx, availableOrganizations])

  return (
    <HERAAuthContextV3.Provider value={contextValue}>
      {children}
    </HERAAuthContextV3.Provider>
  )
}

export function useHERAAuthV3() {
  const context = useContext(HERAAuthContextV3)
  if (context === undefined) {
    throw new Error('useHERAAuthV3 must be used within a HERAAuthProviderV3')
  }
  return context
}

// Legacy compatibility exports
export const useHERAAuth = useHERAAuthV3
export const useAuth = useHERAAuthV3
export const useMultiOrgAuth = useHERAAuthV3