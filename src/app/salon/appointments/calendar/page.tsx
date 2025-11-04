// ================================================================================
// SALON APPOINTMENTS CALENDAR PAGE
// Smart Code: HERA.PAGES.SALON.APPOINTMENTS.CALENDAR.V1
// Beautiful resource calendar view for appointments
// ================================================================================

'use client'

import { lazy, Suspense } from 'react'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'
import { Loader2, AlertCircle, ArrowLeft, List } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

// ✅ LAZY LOADING: Heavy calendar component
const SalonResourceCalendar = lazy(() =>
  import('@/components/salon/SalonResourceCalendar').then(module => ({
    default: module.SalonResourceCalendar
  }))
)

const LUXE_COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  champagne: '#F5E6C8'
}

export default function SalonAppointmentsCalendarPage() {
  const { organizationId, organization, isLoading } = useSecuredSalonContext()
  const router = useRouter()

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
          <Loader2
            className="w-8 h-8 animate-spin mx-auto mb-4"
            style={{ color: LUXE_COLORS.gold }}
          />
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
    <div style={{ backgroundColor: 'var(--hera-black)' }}>
      {/* Main content wrapper with charcoal background for depth */}
      <div className="relative">
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
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 0, 0, 0.3)'
          }}
        >
          {/* Enterprise Navigation Header */}
          <div
            className="sticky top-0 z-50 border-b backdrop-blur-xl"
            style={{
              backgroundColor: `${LUXE_COLORS.charcoal}F5`,
              borderColor: `${LUXE_COLORS.gold}20`,
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div className="px-6 py-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/salon/appointments')}
                  className="gap-2 transition-all duration-200 hover:scale-105"
                  style={{
                    color: LUXE_COLORS.champagne,
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${LUXE_COLORS.gold}15`
                    e.currentTarget.style.color = LUXE_COLORS.gold
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = LUXE_COLORS.champagne
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Appointments
                </Button>
                <div className="h-6 w-px" style={{ backgroundColor: `${LUXE_COLORS.gold}30` }} />
                <div>
                  <h1 className="text-lg font-semibold" style={{ color: LUXE_COLORS.champagne }}>
                    Calendar View
                  </h1>
                  <p className="text-xs" style={{ color: `${LUXE_COLORS.gold}80` }}>
                    {organization?.name || 'Hair Talkz Salon'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Component */}
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-12">
                <div className="text-center animate-fadeIn">
                  <div
                    className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${LUXE_COLORS.gold}40 0%, #B8860B40 100%)`,
                      boxShadow: `0 8px 32px ${LUXE_COLORS.gold}20`
                    }}
                  >
                    <Loader2 className="h-8 w-8 animate-spin" style={{ color: LUXE_COLORS.gold }} />
                  </div>
                  <p className="mt-4 text-sm" style={{ color: `${LUXE_COLORS.gold}80` }}>
                    Loading calendar view...
                  </p>
                </div>
              </div>
            }
          >
            <SalonResourceCalendar organizations={salonOrganizations} canViewAllBranches={false} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
