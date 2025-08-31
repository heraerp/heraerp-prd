'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabaseClient as supabase } from '@/lib/supabase-client'
import { useRouter, usePathname } from 'next/navigation'

// Types for multi-organization authentication
interface Organization {
  id: string
  name: string
  subdomain: string
  type: string
  subscription_plan: string
  role: string
  permissions: string[]
  is_active: boolean
}

interface DualUser {
  id: string
  email: string
  name?: string
  full_name?: string
  auth_user_id: string
}

interface MultiOrgAuthContext {
  // User and session
  user: DualUser | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Organizations
  organizations: Organization[]
  currentOrganization: Organization | null
  isLoadingOrgs: boolean
  
  // Actions
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (email: string, password: string, userData?: any) => Promise<void>
  
  // Organization management
  createOrganization: (data: {
    organization_name: string
    organization_type?: string
    subdomain: string
  }) => Promise<Organization>
  switchOrganization: (orgId: string) => Promise<void>
  refreshOrganizations: () => Promise<void>
  
  // Utilities
  checkSubdomainAvailability: (subdomain: string) => Promise<boolean>
  getOrganizationBySubdomain: (subdomain: string) => Organization | null
}

const MultiOrgAuthContextProvider = createContext<MultiOrgAuthContext | null>(null)

interface MultiOrgAuthProviderProps {
  children: ReactNode
}

export function MultiOrgAuthProvider({ children }: MultiOrgAuthProviderProps) {
  // Core auth state
  const [user, setUser] = useState<DualUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Organization state
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null)
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false)
  
  const router = useRouter()
  const pathname = usePathname()
  
  // Get subdomain from URL (works for both dev and production)
  const getSubdomain = () => {
    if (typeof window === 'undefined') return null
    
    const hostname = window.location.hostname
    const pathname = window.location.pathname
    
    // Development: check for /~subdomain pattern
    if (hostname === 'localhost' && pathname.startsWith('/~')) {
      const match = pathname.match(/^\/~([^\/]+)/)
      return match ? match[1] : null
    }
    
    // Production: check actual subdomain
    const parts = hostname.split('.')
    if (parts.length >= 3 || (parts.length === 2 && !parts[0].includes('localhost'))) {
      return parts[0]
    }
    
    return null
  }

  // Load user organizations
  const loadUserOrganizations = useCallback(async (authUser: User) => {
    if (!authUser) return

    try {
      setIsLoadingOrgs(true)
      
      // Get auth token
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      const authToken = currentSession?.access_token

      if (!authToken) {
        console.warn('No auth token available for loading organizations')
        return
      }

      // Fetch user's organizations
      const response = await fetch('/api/v1/organizations', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success && data.organizations) {
          setOrganizations(data.organizations)
          
          // Set current organization based on subdomain or first org
          const subdomain = getSubdomain()
          if (subdomain) {
            const org = data.organizations.find((o: Organization) => o.subdomain === subdomain)
            if (org) {
              setCurrentOrganization(org)
              // Store in localStorage for persistence
              localStorage.setItem('current-organization-id', org.id)
            }
          } else if (data.organizations.length === 1) {
            // If user has only one org, set it as current
            setCurrentOrganization(data.organizations[0])
            localStorage.setItem('current-organization-id', data.organizations[0].id)
          } else if (data.organizations.length > 1) {
            // Try to restore from localStorage
            const storedOrgId = localStorage.getItem('current-organization-id')
            if (storedOrgId) {
              const storedOrg = data.organizations.find((o: Organization) => o.id === storedOrgId)
              if (storedOrg) {
                setCurrentOrganization(storedOrg)
              }
            }
          } else if (data.organizations.length === 0 && process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID) {
            // No organizations found, use default organization for development
            console.log('No organizations found, using default organization for development')
            const defaultOrg: Organization = {
              id: process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID,
              name: 'Dubai Luxury Salon & Spa',
              subdomain: 'salon',
              type: 'salon',
              subscription_plan: 'professional',
              role: 'admin',
              permissions: ['*'],
              is_active: true
            }
            setOrganizations([defaultOrg])
            setCurrentOrganization(defaultOrg)
            localStorage.setItem('current-organization-id', defaultOrg.id)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load organizations:', error)
    } finally {
      setIsLoadingOrgs(false)
    }
  }, [])

  // Create user entity from auth user
  const createUserFromAuth = (authUser: User): DualUser => {
    return {
      id: authUser.id,
      auth_user_id: authUser.id,
      email: authUser.email || '',
      name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || '',
      full_name: authUser.user_metadata?.full_name || ''
    }
  }

  // Clear all state
  const clearState = (): void => {
    setUser(null)
    setSession(null)
    setOrganizations([])
    setCurrentOrganization(null)
  }

  // Initialize authentication
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession()

        if (initialSession) {
          setSession(initialSession)
          setUser(createUserFromAuth(initialSession.user))
          await loadUserOrganizations(initialSession.user)
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event)
      setSession(newSession)

      if (event === 'SIGNED_IN' && newSession) {
        setUser(createUserFromAuth(newSession.user))
        await loadUserOrganizations(newSession.user)
      } else if (event === 'SIGNED_OUT') {
        clearState()
      } else if (event === 'TOKEN_REFRESHED' && newSession) {
        setUser(createUserFromAuth(newSession.user))
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [loadUserOrganizations])

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

    if (data.session) {
      setSession(data.session)
      setUser(createUserFromAuth(data.session.user))
      await loadUserOrganizations(data.session.user)
    }
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
    clearState()
    router.push('/')
  }

  const register = async (email: string, password: string, userData: any = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    })

    if (error) {
      throw error
    }

    return data
  }

  const createOrganization = async (data: {
    organization_name: string
    organization_type?: string
    subdomain: string
  }): Promise<Organization> => {
    if (!session?.access_token) {
      throw new Error('No authentication token available')
    }

    const response = await fetch('/api/v1/organizations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to create organization')
    }

    // Refresh organizations list
    await refreshOrganizations()

    // Return the new organization
    const newOrg = organizations.find(org => org.id === result.organization.id)
    if (newOrg) {
      return newOrg
    }

    // Fallback to constructing from response
    return {
      id: result.organization.id,
      name: result.organization.name,
      subdomain: result.organization.subdomain,
      type: result.organization.type,
      subscription_plan: 'trial',
      role: 'owner',
      permissions: ['*'],
      is_active: true
    }
  }

  const switchOrganization = async (orgId: string) => {
    const org = organizations.find(o => o.id === orgId)
    if (org) {
      setCurrentOrganization(org)
      
      // In production, redirect to organization subdomain
      if (process.env.NODE_ENV === 'production') {
        window.location.href = `https://${org.subdomain}.heraerp.com`
      } else {
        // In development, use simulated subdomain path
        router.push(`/~${org.subdomain}`)
      }
    }
  }

  const refreshOrganizations = async () => {
    if (session?.user) {
      await loadUserOrganizations(session.user)
    }
  }

  const checkSubdomainAvailability = async (subdomain: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/v1/organizations/check-subdomain?subdomain=${encodeURIComponent(subdomain)}`, {
        method: 'GET'
      })
      
      if (response.ok) {
        const data = await response.json()
        return data.available
      }
      
      return false
    } catch (error) {
      console.error('Error checking subdomain:', error)
      return false
    }
  }

  const getOrganizationBySubdomain = (subdomain: string): Organization | null => {
    return organizations.find(org => org.subdomain === subdomain) || null
  }

  const value: MultiOrgAuthContext = {
    user,
    session,
    isAuthenticated: !!user,
    isLoading,
    organizations,
    currentOrganization,
    isLoadingOrgs,
    login,
    logout,
    register,
    createOrganization,
    switchOrganization,
    refreshOrganizations,
    checkSubdomainAvailability,
    getOrganizationBySubdomain,
  }

  return (
    <MultiOrgAuthContextProvider.Provider value={value}>
      {children}
    </MultiOrgAuthContextProvider.Provider>
  )
}

export const useMultiOrgAuth = () => {
  const context = useContext(MultiOrgAuthContextProvider)
  if (!context) {
    throw new Error('useMultiOrgAuth must be used within a MultiOrgAuthProvider')
  }
  return context
}

// Utility function to get subdomain from request
function getSubdomainFromRequest(): string | null {
  if (typeof window === 'undefined') return null
  
  const hostname = window.location.hostname
  
  // Local development
  if (hostname.includes('localhost')) {
    // Check for simulated subdomain in path
    const pathname = window.location.pathname
    if (pathname.startsWith('/~')) {
      return pathname.split('/')[1].substring(1)
    }
    return null
  }
  
  // Production
  const parts = hostname.split('.')
  if (parts.length >= 3) {
    return parts[0]
  }
  
  return null
}

// Export for compatibility
export default MultiOrgAuthProvider