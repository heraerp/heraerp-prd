'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useMultiOrgAuth } from '@/src/components/auth/MultiOrgAuthProvider'
import { getDemoOrganizationInfo } from '@/src/lib/demo-org-resolver'
import { usePathname } from 'next/navigation'

interface FurnitureOrgContextType {
  organizationId: string
  organizationName: string
  orgLoading: boolean
}

const FurnitureOrgContext = createContext<FurnitureOrgContextType | null>(null)

export const FurnitureOrgProvider = React.memo(function FurnitureOrgProvider({
  children
}: {
  children: ReactNode
}) {
  const pathname = usePathname()
  const { currentOrganization, isLoadingOrgs, isAuthenticated } = useMultiOrgAuth()
  const [demoOrg, setDemoOrg] = useState<{ id: string; name: string } | null>(null)

  // Always use the furniture organization when in furniture module
  const FURNITURE_ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249'
  const FURNITURE_ORG_NAME = 'Kerala Furniture Works'

  // For furniture module, always use the furniture org regardless of authentication
  const organizationId = FURNITURE_ORG_ID
  const organizationName = FURNITURE_ORG_NAME
  const orgLoading = false // Since we're using a fixed org, no loading needed

  // Load demo organization if not authenticated
  useEffect(() => {
    async function loadDemoOrg() {
      if (!isAuthenticated && !currentOrganization) {
        const orgInfo = await getDemoOrganizationInfo(pathname)
        if (orgInfo) {
          setDemoOrg({ id: orgInfo.id, name: orgInfo.name })
          console.log('Furniture demo organization loaded:', orgInfo)
        }
      }
    }
    
    loadDemoOrg()
  }, [isAuthenticated, currentOrganization, pathname])

  
    return (
    <FurnitureOrgContext.Provider value={{ organizationId, organizationName, orgLoading }}>
      {children}
    </FurnitureOrgContext.Provider>
  )
})

export function useFurnitureOrg() {
  const context = useContext(FurnitureOrgContext)
  
  if (!context) {
    throw new Error('useFurnitureOrg must be used within FurnitureOrgProvider')
  }
    return context
}

// Loading component for consistent loading state
export function FurnitureOrgLoading() {
  
    return (
    <div className="min-h-screen bg-[var(--color-body)] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-[var(--color-accent-indigo)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[var(--color-text-secondary)]">Loading organization...</p>
        </div>
      </div>
    </div>
  )
}