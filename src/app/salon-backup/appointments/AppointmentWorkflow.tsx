'use client'

import { UniversalWorkflowTracker } from '@/components/workflow/UniversalWorkflowTracker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

interface AppointmentWorkflowProps {
  appointmentId: string
  organizationId: string
  userId: string
  onStatusChange?: (newStatus: any) => void
}

export function AppointmentWorkflow({
  appointmentId,
  organizationId,
  userId,
  onStatusChange
}: AppointmentWorkflowProps) {
  const { toast } = useToast()

  const handleStatusChange = (newStatus: any) => {
    toast({
      title: "Appointment Status Updated",
      description: `Status changed to ${newStatus.name}`,
    })
    
    // Refresh parent component if needed
    onStatusChange?.(newStatus)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Appointment Workflow</CardTitle>
      </CardHeader>
      <CardContent>
        <UniversalWorkflowTracker
          transactionId={appointmentId}
          organizationId={organizationId}
          userId={userId}
          onStatusChange={handleStatusChange}
          compact={false}
        />
      </CardContent>
    </Card>
  )
}