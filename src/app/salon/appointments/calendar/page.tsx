// ================================================================================
// SALON APPOINTMENTS CALENDAR PAGE
// Smart Code: HERA.PAGES.SALON.APPOINTMENTS.CALENDAR.V1
// Beautiful resource calendar view for appointments
// ================================================================================

'use client'

import { SalonResourceCalendar } from '@/components/salon/SalonResourceCalendar'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { Loader2, AlertCircle } from 'lucide-react'

const LUXE_COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  champagne: '#F5E6C8'
}

export default function SalonAppointmentsCalendarPage() {
  const { organizationId, organization, isLoading } = useSecuredSalonContext()

  // Show loading state while JWT authentication is being verified
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: LUXE_COLORS.black }}
      >
        <div
          className="text-center p-8 rounded-xl backdrop-blur-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(15,15,15,0.95) 100%)',
            border: `1px solid ${LUXE_COLORS.gold}20`,
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
          }}
        >
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: LUXE_COLORS.gold }} />
          <h2 className="text-xl font-medium mb-2" style={{ color: LUXE_COLORS.champagne }}>
            Loading Calendar...
          </h2>
          <p className="text-sm" style={{ color: `${LUXE_COLORS.gold}80` }}>
            Verifying organization access...
          </p>
        </div>
      </div>
    )
  }

  // Show error if no organization ID is available from JWT
  if (!organizationId) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: LUXE_COLORS.black }}
      >
        <div
          className="text-center p-8 rounded-xl backdrop-blur-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(15,15,15,0.95) 100%)',
            border: `1px solid ${LUXE_COLORS.gold}20`,
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
          }}
        >
          <AlertCircle className="w-8 h-8 mx-auto mb-4" style={{ color: LUXE_COLORS.gold }} />
          <h2 className="text-xl font-medium mb-2" style={{ color: LUXE_COLORS.champagne }}>
            Authentication Required
          </h2>
          <p className="text-sm" style={{ color: `${LUXE_COLORS.gold}80` }}>
            Please sign in to access the salon calendar.
          </p>
        </div>
      </div>
    )
  }

  // Default salon organizations for the calendar
  const salonOrganizations = [
    {
      id: organizationId,
      organization_code: 'SALON-BR1',
      organization_name: organization?.name || 'Hair Talkz Salon'
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
                           radial-gradient(circle at 40% 40%, #B794F403 0%, transparent 50%)`
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
            canViewAllBranches={false}
          />
        </div>
      </div>
    </div>
  )
}
