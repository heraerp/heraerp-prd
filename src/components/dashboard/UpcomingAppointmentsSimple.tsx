'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface UpcomingAppointmentsSimpleProps {
  organizationId: string
}

export function UpcomingAppointmentsSimple({ organizationId }: UpcomingAppointmentsSimpleProps) {
  console.log('📅 Simple appointments component rendered!', { organizationId })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointments Test</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Organization ID: {organizationId}</p>
        <p>This is a test component</p>
      </CardContent>
    </Card>
  )
}
