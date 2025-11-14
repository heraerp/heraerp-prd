// ================================================================================
// HERA APPOINTMENTS LANDING PAGE
// Smart Code: HERA.PAGES.APPOINTMENTS.INDEX.V1
// Main appointments page that redirects to calendar view
// ================================================================================

'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AppointmentsPage() {
  const router = useRouter()

  useEffect(() => {
    // For salon context, redirect to salon-specific appointments
    const pathname = window.location.pathname
    if (pathname.includes('/salon')) {
      router.replace('/salon/appointments')
    } else {
      // Otherwise use the calendar view
      router.replace('/appointments/calendar')
    }
  }, [router])

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 animate-pulse shadow-2xl" />
        </div>
        <p className="text-muted-foreground mt-4 font-medium">Loading appointments...</p>
      </div>
    </div>
  )
}
