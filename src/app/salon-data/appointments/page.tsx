'use client'

// Force dynamic rendering to avoid build issues
export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import dynamicImport from 'next/dynamic'
import { useMultiOrgAuth } from '@/src/components/auth/MultiOrgAuthProvider'
import type { Organization } from '@/src/types/salon.types'

// Dynamically import the AppointmentManagementDashboard to avoid SSR issues
const AppointmentManagementDashboard = dynamicImport(
  () =>
    import('@/components/salon/appointments/AppointmentManagementDashboard').then(
      mod => mod.AppointmentManagementDashboard
    ),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-r from-purple-500 to-blue-600 animate-pulse shadow-lg" />
          </div>
          <p className="text-muted-foreground mt-4 font-medium">Loading appointments...</p>
        </div>
      </div>
    ),
    ssr: false
  }
)

// Default organization ID for salon - Hair Talkz Park Regis
const DEFAULT_SALON_ORG_ID = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'

export default function SalonAppointmentsPage() {
  const { currentOrganization, contextLoading } = useMultiOrgAuth()
  const [subdomainOrg, setSubdomainOrg] = useState<Organization | null>(null)
  const [loadingSubdomainOrg, setLoadingSubdomainOrg] = useState(true)

  // Check for subdomain and get organization (same as other salon-data pages)
  useEffect(() => {
    const checkSubdomain = async () => {
      if (typeof window === 'undefined') return

      const hostname = window.location.hostname
      console.log('Appointments page checking subdomain:', hostname)

      // Skip for localhost or if we already have an organization context
      if (hostname === 'localhost' || hostname.includes('localhost:')) {
        setLoadingSubdomainOrg(false)
        return
      }

      // Extract subdomain
      const parts = hostname.split('.')
      if (parts.length >= 3) {
        // e.g., acme.app.com or acme.vercel.app
        const subdomain = parts[0]
        if (subdomain && subdomain !== 'app' && subdomain !== 'www') {
          try {
            const response = await fetch(`/api/v1/organizations/by-subdomain/${subdomain}`)
            if (response.ok) {
              const orgData = await response.json()
              console.log('Appointments page found organization for subdomain:', orgData)
              setSubdomainOrg(orgData)
            } else {
              console.log('Appointments page: No organization found for subdomain:', subdomain)
            }
          } catch (error) {
            console.error('Appointments page error fetching subdomain org:', error)
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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Render the full appointment management dashboard
  return <AppointmentManagementDashboard organizationId={organizationId} />
}
