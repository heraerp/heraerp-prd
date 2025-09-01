'use client'

import { CostingDashboard } from '@/components/costing/CostingDashboard'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function CostingPage() {
  const { currentOrganization } = useMultiOrgAuth()

  if (!currentOrganization) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>
            Please select an organization to access costing and profitability features.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <CostingDashboard organizationId={currentOrganization.id} />
    </div>
  )
}