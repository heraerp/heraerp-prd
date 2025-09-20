// ================================================================================
// SALON APPOINTMENTS CALENDAR PAGE
// Smart Code: HERA.PAGES.SALON.APPOINTMENTS.CALENDAR.V1
// Beautiful resource calendar view for appointments
// ================================================================================

'use client'

import { SalonResourceCalendar } from '@/components/salon/SalonResourceCalendar'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

export default function SalonAppointmentsCalendarPage() {
  const { organization } = useHERAAuth()
  
  // Default salon organizations for the calendar
  const salonOrganizations = [
    {
      id: organization?.id || 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258',
      organization_code: organization?.code || 'SALON-BR1',
      organization_name: organization?.name || 'Hair Talkz • Park Regis Kris Kin (Karama)'
    }
  ]
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SalonResourceCalendar
        organizations={salonOrganizations}
        currentOrganizationId={organization?.id}
        canViewAllBranches={false}
      />
    </div>
  )
}