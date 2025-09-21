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

  const organizationId = organization?.id || localOrgId

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
