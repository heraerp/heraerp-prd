'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import {
  getDemoOrganizationId,
  getDemoOrganizationInfo,
  isDemoRoute
} from '@/lib/demo-org-resolver'

interface DemoOrgContextType {
  organizationId: string | null
  organizationName: string | null
  industry: string | null
  isDemo: boolean
  loading: boolean
}

const DemoOrgContext = createContext<DemoOrgContextType>({
  organizationId: null,
  organizationName: null,
  industry: null,
  isDemo: false,
  loading: true
})

export function useDemoOrg() {
  return useContext(DemoOrgContext)
}

interface DemoOrgProviderProps {
  children: ReactNode
}

export function DemoOrgProvider({ children }: DemoOrgProviderProps) {
  const pathname = usePathname()
  const [orgInfo, setOrgInfo] = useState<DemoOrgContextType>({
    organizationId: null,
    organizationName: null,
    industry: null,
    isDemo: false,
    loading: true
  })

  useEffect(() => {
    async function loadDemoOrg() {
      // Check if this is a demo route
      if (!isDemoRoute(pathname)) {
        setOrgInfo({
          organizationId: null,
          organizationName: null,
          industry: null,
          isDemo: false,
          loading: false
        })
        return
      }

      // Get demo organization info
      const info = await getDemoOrganizationInfo(pathname)

      if (info) {
        setOrgInfo({
          organizationId: info.id,
          organizationName: info.name,
          industry: info.industry,
          isDemo: true,
          loading: false
        })
      } else {
        setOrgInfo({
          organizationId: null,
          organizationName: null,
          industry: null,
          isDemo: true,
          loading: false
        })
      }
    }

    loadDemoOrg()
  }, [pathname])

  return <DemoOrgContext.Provider value={orgInfo}>{children}</DemoOrgContext.Provider>
}
