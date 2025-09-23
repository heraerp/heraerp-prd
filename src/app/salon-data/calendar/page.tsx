'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React from 'react'
import { SalonResourceCalendar } from '@/components/salon/SalonResourceCalendar'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

export default function SalonDataCalendarPage() {
  const { currentOrganization } = useHERAAuth()

  // Sample organization data for demo
  const salonOrganizations = [
    {
      id: 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258',
      organization_code: 'SALON-BR1',
      organization_name: 'Hair Talkz • Park Regis Kris Kin (Karama)'
    },
    {
      id: '0b1b37cd-4096-4718-8cd4-e370f234005b',
      organization_code: 'SALON-BR2',
      organization_name: 'Hair Talkz • Mercure Gold (Al Mina Rd)'
    },
    {
      id: '849b6efe-2bf0-438f-9c70-01835ac2fe15',
      organization_code: 'SALON-GROUP',
      organization_name: 'Salon Group'
    }
  ]

  return (
    <div className="min-h-screen bg-muted dark:bg-background">
      <SalonResourceCalendar
        organizations={salonOrganizations}
        currentOrganizationId={currentOrganization?.id || 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'}
      />
    </div>
  )
}
