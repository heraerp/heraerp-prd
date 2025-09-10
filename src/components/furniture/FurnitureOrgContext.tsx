'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { getDemoOrganizationInfo } from '@/lib/demo-org-resolver'
import { usePathname } from 'next/navigation'

interface FurnitureOrgContextType {
  organizationId: string
  organizationName: string
  orgLoading: boolean
}

const FurnitureOrgContext = createContext<FurnitureOrgContextType | null>(null)

export const FurnitureOrgProvider = React.memo(function FurnitureOrgProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { currentOrganization, isLoadingOrgs, isAuthenticated } = useMultiOrgAuth()
  const [demoOrg, setDemoOrg] = useState<{ id: string; name: string } | null>(null)
  
  // Use authenticated org if available, otherwise use demo org, fallback to Kerala Furniture Works (Demo)
  const organizationId = currentOrganization?.id || demoOrg?.id || 'f0af4ced-9d12-4a55-a649-b484368db249'
  const organizationName = currentOrganization?.organization_name || demoOrg?.name || 'Kerala Furniture Works (Demo)'
  const orgLoading = isAuthenticated ? isLoadingOrgs : false

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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading organization...</p>
        </div>
      </div>
    </div>
  )
}