'use client'

import React from 'react'
import { LeaveManagementDashboard } from '@/components/salon/leave/LeaveManagementDashboard'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { PageLayout } from '@/components/universal/PageLayout'
import { PageHeader } from '@/components/universal/PageHeader'

export default function SalonLeavePage() {
  const { organization } = useHERAAuth()
  const organizationId = organization?.id

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
