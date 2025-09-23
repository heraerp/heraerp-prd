'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { getDemoOrganizationInfo } from '@/lib/demo-org-resolver'
import { usePathname } from 'next/navigation'

interface HairTalkzOrgContextType {
  organizationId: string
  organizationName: string
  orgLoading: boolean
}

const HairTalkzOrgContext = createContext<HairTalkzOrgContextType | null>(null)

export function HairTalkzOrgProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { currentOrganization, isLoadingOrgs, isAuthenticated  } = useHERAAuth()
  const [demoOrg, setDemoOrg] = useState<{ id: string; name: string } | null>(null)

  // Use authenticated org if available, otherwise use demo org, fallback to Hair Talkz (Demo)
  const organizationId =
    currentOrganization?.id || demoOrg?.id || 'a1b2c3d4-hair-talkz-demo-organization'
  const organizationName =
    currentOrganization?.organization_name || demoOrg?.name || 'Hair Talkz Salon (Demo)'
  const orgLoading = isAuthenticated ? isLoadingOrgs : false

  // Load demo organization if not authenticated
  useEffect(() => {
    async function loadDemoOrg() {
      if (!isAuthenticated && !currentOrganization) {
        const orgInfo = await getDemoOrganizationInfo(pathname)
        if (orgInfo) {
          setDemoOrg({ id: orgInfo.id, name: orgInfo.name })
          console.log('Hair Talkz demo organization loaded:', orgInfo)
        }
      }
    }
    loadDemoOrg()
  }, [isAuthenticated, currentOrganization, pathname])

  return (
    <HairTalkzOrgContext.Provider value={{ organizationId, organizationName, orgLoading }}>
      {children}
    </HairTalkzOrgContext.Provider>
  )
}

export function useHairTalkzOrg() {
  const context = useContext(HairTalkzOrgContext)
  if (!context) {
    throw new Error('useHairTalkzOrg must be used within HairTalkzOrgProvider')
  }
  return context
}

// Loading component with Hair Talkz salon branding and new color scheme
export function HairTalkzOrgLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-dusty-rose-50 to-champagne-50 flex items-center justify-center">
      <div className="text-center space-y-6">
        {/* Hair Talkz Salon Logo/Icon */}
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-r from-sage-400 to-dusty-rose-400 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <div className="text-3xl">💇‍♀️</div>
          </div>
          <div className="absolute -inset-2 bg-gradient-to-r from-sage-300 via-dusty-rose-300 to-champagne-300 rounded-full opacity-20 animate-pulse"></div>
        </div>

        {/* Loading Animation */}
        <div className="inline-flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-sage-300 border-t-champagne-500 rounded-full animate-spin"></div>
          <div className="text-sage-700 font-medium">Setting up your salon...</div>
        </div>

        {/* Subtitle */}
        <p className="text-dusty-rose-600 text-sm max-w-sm mx-auto">
          Loading Hair Talkz salon management system with HERA's AI-powered business intelligence
        </p>
      </div>
    </div>
  )
}
