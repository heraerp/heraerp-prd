'use client'

import { TaxComplianceDashboard } from '@/components/tax/TaxComplianceDashboard'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function TaxCompliancePage() {
  const { currentOrganization } = useMultiOrgAuth()

  if (!currentOrganization) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>
            Please select an organization to access tax compliance features.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <TaxComplianceDashboard organizationId={currentOrganization.id} />
    </div>
  )
}