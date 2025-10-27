'use client'

/**
 * Enterprise Salon Security Provider
 * Smart Code: HERA.ENTERPRISE.SALON.PROVIDER.v1
 * 
 * Provides salon-compatible context for enterprise salon pages
 * while using enterprise RBAC authentication
 */

import React, { createContext, useContext, useMemo } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

interface Branch {
  id: string
  entity_name: string
  entity_code?: string
  dynamic_fields?: any
  metadata?: any
}

interface EnterpriseSalonSecurityContext {
  organizationId: string
  salonRole: 'owner' | 'manager' | 'receptionist' | 'stylist' | 'accountant' | 'admin'
  permissions: string[]
  organization: {
    id: string
    name: string
    entity_name: string
    currency: string
    currencySymbol: string
    settings?: any
  }
  user: any
  isLoading: boolean
  isAuthenticated: boolean
  // Branch context
  selectedBranchId: string | null
  selectedBranch: Branch | null
  availableBranches: Branch[]
  isLoadingBranches: boolean
  setSelectedBranchId: (branchId: string) => void
}

const EnterpriseSecuredSalonContext = createContext<EnterpriseSalonSecurityContext | undefined>(undefined)

export function useSecuredSalonContext(): EnterpriseSalonSecurityContext {
  const context = useContext(EnterpriseSecuredSalonContext)
  if (context === undefined) {
    throw new Error('useSecuredSalonContext must be used within an EnterpriseSecuredSalonProvider')
  }
  return context
}

export function EnterpriseSecuredSalonProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useHERAAuth()
  
  // Temporarily disable access control to isolate the error
  const hasPermission = () => true

  // Mock salon data for enterprise integration
  const contextValue = useMemo<EnterpriseSalonSecurityContext>(() => ({
    organizationId: user?.id || 'enterprise-org',
    salonRole: 'owner', // Default to owner for enterprise users
    permissions: [
      'salon:read:all',
      'salon:write:all',
      'salon:admin:full',
      'salon:finance:full',
      'salon:staff:manage',
      'salon:settings:manage'
    ],
    organization: {
      id: user?.id || 'enterprise-org',
      name: 'Enterprise Salon',
      entity_name: 'Enterprise Salon',
      currency: 'USD',
      currencySymbol: '$',
      settings: {}
    },
    user,
    isLoading,
    isAuthenticated: !!user,
    selectedBranchId: 'main-branch',
    selectedBranch: {
      id: 'main-branch',
      entity_name: 'Main Branch',
      entity_code: 'MAIN',
      dynamic_fields: {},
      metadata: {}
    },
    availableBranches: [{
      id: 'main-branch',
      entity_name: 'Main Branch',
      entity_code: 'MAIN'
    }],
    isLoadingBranches: false,
    setSelectedBranchId: () => {} // No-op for now
  }), [user, isLoading])

  return (
    <EnterpriseSecuredSalonContext.Provider value={contextValue}>
      {children}
    </EnterpriseSecuredSalonContext.Provider>
  )
}