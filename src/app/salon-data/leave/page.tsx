'use client'

import React, { useEffect, useState } from 'react'
import { LeaveManagementDashboard } from '@/components/salon/leave/LeaveManagementDashboard'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import type { Organization } from '@/types/salon.types'

// Default organization ID for salon - matches existing demo data
const DEFAULT_SALON_ORG_ID = '550e8400-e29b-41d4-a716-446655440000'

export default function SalonLeaveManagementPage() {
  const { currentOrganization, contextLoading } = useMultiOrgAuth()
  const [subdomainOrg, setSubdomainOrg] = useState<Organization | null>(null)
  const [loadingSubdomainOrg, setLoadingSubdomainOrg] = useState(true)

  // Check for subdomain and get organization (same as main salon-data page)
  useEffect(() => {
    const checkSubdomain = async () => {
      if (typeof window === 'undefined') return

      const hostname = window.location.hostname
      console.log('Leave page checking subdomain:', hostname)

      // Skip for localhost or if we already have an organization context
      if (hostname === 'localhost' || hostname.includes('localhost:')) {
        setLoadingSubdomainOrg(false)
        return
      }

      // Extract subdomain
      const parts = hostname.split('.')
      if (parts.length >= 3) { // e.g., acme.app.com or acme.vercel.app
        const subdomain = parts[0]
        if (subdomain && subdomain !== 'app' && subdomain !== 'www') {
          try {
            const response = await fetch(`/api/v1/organizations/by-subdomain/${subdomain}`)
            if (response.ok) {
              const orgData = await response.json()
              console.log('Leave page found organization for subdomain:', orgData)
              setSubdomainOrg(orgData)
            } else {
              console.log('Leave page: No organization found for subdomain:', subdomain)
            }
          } catch (error) {
            console.error('Leave page error fetching subdomain org:', error)
          }
        }
      }

      setLoadingSubdomainOrg(false)
    }

    checkSubdomain()
  }, [])

  // Determine which organization to use
  const organizationId = subdomainOrg?.id || currentOrganization?.id || DEFAULT_SALON_ORG_ID

  // Loading state
  if (contextLoading || loadingSubdomainOrg) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Note: We don't need authentication check for demo purposes like the main salon-data page
  return <LeaveManagementDashboard organizationId={organizationId} />
}