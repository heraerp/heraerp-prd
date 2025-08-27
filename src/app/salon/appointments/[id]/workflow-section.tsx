'use client'

import { UniversalWorkflowTracker } from '@/components/workflow/UniversalWorkflowTracker'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'

interface WorkflowSectionProps {
  appointmentId: string
  onStatusChange?: () => void
}

export function WorkflowSection({ appointmentId, onStatusChange }: WorkflowSectionProps) {
  const { currentOrganization, user } = useMultiOrgAuth()
  
  if (!currentOrganization || !user) {
    return null
  }
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Appointment Status
        </h3>
        <UniversalWorkflowTracker
          transactionId={appointmentId}
          organizationId={currentOrganization.id}
          userId={user.id}
          onStatusChange={onStatusChange}
          compact={false}
        />
      </div>
    </div>
  )
}