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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--hera-black)' }}>
      {/* Main content wrapper with charcoal background for depth */}
      <div className="relative" style={{ minHeight: '100vh' }}>
        {/* Subtle gradient overlay for depth - matching dashboard */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 20% 80%, #D4AF3708 0%, transparent 50%),
                           radial-gradient(circle at 80% 20%, #8C785305 0%, transparent 50%),
                           radial-gradient(circle at 40% 40%, #5A2A4003 0%, transparent 50%)`
          }}
        />

        {/* Content container */}
        <div
          className="relative"
          style={{
            backgroundColor: '#1A1A1A',
            minHeight: '100vh',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 0, 0, 0.3)'
          }}
        >
          <SalonResourceCalendar
            organizations={salonOrganizations}
            currentOrganizationId={organization?.id}
            canViewAllBranches={false}
          />
        </div>
      </div>
    </div>
  )
}
