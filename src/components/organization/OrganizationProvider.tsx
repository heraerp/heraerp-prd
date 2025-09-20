// ================================================================================
// HERA ORGANIZATION PROVIDER
// Smart Code: HERA.ORGANIZATION.PROVIDER.v1
// Global organization context management
// ================================================================================

'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/session'

export interface Organization {
  id: string
  name: string
  slug: string
  subdomain?: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  created_at: string
  subscription_status: 'active' | 'trial' | 'expired' | 'cancelled'
  trial_days_left?: number
  installed_apps: string[]
  settings?: {
    theme?: 'light' | 'dark'
    timezone?: string
    currency?: string
  }
}

interface OrganizationContextType {
  organizations: Organization[]
  currentOrganization: Organization | null
  loading: boolean
  switchOrganization: (orgId: string) => void
  refreshOrganizations: () => Promise<void>
  isAppInstalled: (appId: string) => boolean
}

const OrganizationContext = createContext<OrganizationContextType>({
  organizations: [],
  currentOrganization: null,
  loading: true,
  switchOrganization: () => {},
  refreshOrganizations: async () => {},
  isAppInstalled: () => false,
})

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
}

// Mock data for development
const mockOrganizations: Organization[] = [
  {
    id: 'f0af4ced-9d12-4a55-a649-b484368db249',
    name: 'Hair Talkz Salon',
    slug: 'hairtalkz',
    subdomain: 'hairtalkz',
    role: 'owner',
    created_at: '2024-01-15T00:00:00Z',
    subscription_status: 'trial',
    trial_days_left: 7,
    installed_apps: ['salon', 'finance', 'analytics'],
    settings: {
      theme: 'dark',
      timezone: 'Asia/Dubai',
      currency: 'AED',
    },
  },
  {
    id: 'org-2',
    name: "Mario's Restaurant",
    slug: 'marios',
    subdomain: 'marios',
    role: 'admin',
    created_at: '2024-02-01T00:00:00Z',
    subscription_status: 'active',
    installed_apps: ['restaurant', 'finance', 'analytics', 'inventory'],
    settings: {
      theme: 'light',
      timezone: 'America/New_York',
      currency: 'USD',
    },
  },
  {
    id: 'org-3',
    name: 'TechCorp Industries',
    slug: 'techcorp',
    subdomain: 'techcorp',
    role: 'member',
    created_at: '2024-03-01T00:00:00Z',
    subscription_status: 'active',
    installed_apps: ['manufacturing', 'finance', 'analytics', 'hr', 'inventory'],
    settings: {
      theme: 'dark',
      timezone: 'Europe/London',
      currency: 'GBP',
    },
  },
]

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      loadOrganizations()
    }
  }, [isAuthenticated])

  const loadOrganizations = async () => {
    try {
      setLoading(true)
      
      // In production, this would fetch from API
      // For now, use mock data
      setOrganizations(mockOrganizations)
      
      // Set current org based on subdomain or localStorage
      const savedOrgId = localStorage.getItem('hera-current-org')
      const savedOrg = mockOrganizations.find(org => org.id === savedOrgId)
      
      if (savedOrg) {
        setCurrentOrganization(savedOrg)
      } else if (mockOrganizations.length > 0) {
        // Default to first org
        setCurrentOrganization(mockOrganizations[0])
        localStorage.setItem('hera-current-org', mockOrganizations[0].id)
      }
    } catch (error) {
      console.error('Failed to load organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const switchOrganization = (orgId: string) => {
    const org = organizations.find(o => o.id === orgId)
    if (org) {
      setCurrentOrganization(org)
      localStorage.setItem('hera-current-org', orgId)
      
      // In production, this would switch subdomain
      // For development, we could use path-based routing
      // e.g., /org/hairtalkz/dashboard
      router.push('/dashboard')
    }
  }

  const refreshOrganizations = async () => {
    await loadOrganizations()
  }

  const isAppInstalled = (appId: string) => {
    return currentOrganization?.installed_apps.includes(appId) || false
  }

  const contextValue: OrganizationContextType = {
    organizations,
    currentOrganization,
    loading,
    switchOrganization,
    refreshOrganizations,
    isAppInstalled,
  }

  return (
    <OrganizationContext.Provider value={contextValue}>
      {children}
    </OrganizationContext.Provider>
  )
}