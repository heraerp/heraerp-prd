'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

interface CheckInButtonProps {
  appointmentId: string
  currentStatus?: string
  currentStatusCode?: string
  onCheckInComplete?: () => void
  className?: string
}

export function CheckInButton({
  appointmentId,
  currentStatus,
  currentStatusCode,
  onCheckInComplete,
  className
}: CheckInButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { organization, user } = useHERAAuth()
  const { toast } = useToast()

  // Determine if check-in is allowed
  const canCheckIn = currentStatusCode === 'STATUS-APPOINTMENT-SCHEDULED'
  const isCheckedIn = currentStatusCode === 'STATUS-APPOINTMENT-CHECKED_IN'

  const handleCheckIn = async () => {
    if (!organization) {
      toast({
        title: 'Error',
        description: 'No organization selected',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/v1/salon/appointments/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointmentId,
          organizationId: organization.id,
          userId: user?.id
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast({
          title: 'Success',
          description: result.message || 'Client checked in successfully'
        })

        // Trigger refresh or callback
        if (onCheckInComplete) {
          onCheckInComplete()
        }
      } else {
        toast({
          title: 'Check-in failed',
          description: result.error || 'Unable to check in client',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Check-in error:', error)
      toast({
        title: 'Error',
        description: 'Failed to check in client. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Already checked in
  if (isCheckedIn) {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
        Checked In
      </Button>
    )
  }

  // Can't check in (wrong status)
  if (!canCheckIn) {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        <AlertCircle className="w-4 h-4 mr-2" />
        {currentStatus || 'Cannot Check In'}
      </Button>
    )
  }

  // Can check in
  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleCheckIn}
      disabled={isLoading}
      className={className}
    >
      <Clock className="w-4 h-4 mr-2" />
      {isLoading ? 'Checking in...' : 'Check In'}
    </Button>
  )
}
