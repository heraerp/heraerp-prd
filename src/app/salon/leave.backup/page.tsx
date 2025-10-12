'use client'

import React, { useState, useEffect } from 'react'
import { LeaveManagementDashboard } from '@/components/salon/leave/LeaveManagementDashboard'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { PageLayout } from '@/components/universal/PageLayout'
import { PageHeader } from '@/components/universal/PageHeader'

export default function SalonLeavePage() {
  const { organization } = useHERAAuth()
  const [localOrgId, setLocalOrgId] = useState<string | null>(null)

  useEffect(() => {
    const storedOrgId = localStorage.getItem('organizationId')
    if (storedOrgId) {
      setLocalOrgId(storedOrgId)
    }
  }, [])

  // Check for Hair Talkz subdomain
  const getEffectiveOrgId = () => {
    if (organization?.id) return organization.id
    if (localOrgId) return localOrgId

    // Check if we're on hairtalkz or heratalkz subdomain
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      if (
        hostname.startsWith('hairtalkz.') ||
        hostname === 'hairtalkz.localhost' ||
        hostname.startsWith('heratalkz.') ||
        hostname === 'heratalkz.localhost'
      ) {
        return '378f24fb-d496-4ff7-8afa-ea34895a0eb8' // Hair Talkz org ID
      }
    }

    return organization?.id || localOrgId
  }

  const organizationId = getEffectiveOrgId()

  return (
    <PageLayout>
      <PageHeader
        title="Leave Management"
        breadcrumbs={[
          { label: 'HERA' },
          { label: 'SALON OS' },
          { label: 'Leave Management', isActive: true }
        ]}
      />
      <LeaveManagementDashboard organizationId={organizationId} />
    </PageLayout>
  )
}
