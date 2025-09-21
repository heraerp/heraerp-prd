'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import SalonRoleBasedSidebar from '@/components/salon/SalonRoleBasedSidebar'
import SalonLuxeSidebar from '@/components/salon/SalonLuxeSidebar'
import SalonDarkSidebar from '@/components/salon/SalonDarkSidebar'
import { SalonAuthGuard, SalonRoleDisplay } from '@/components/salon/auth/SalonAuthGuard'
import { SalonNavbar } from '@/components/salon/SalonNavbar'

export default function SalonLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Don't show sidebar on public pages
  const isPublicPage = pathname === '/salon' || pathname === '/salon/auth'

  if (isPublicPage) {
    return <>{children}</>
  }

  return (
    <SalonAuthGuard>
      {/* Use narrow Teams-style sidebar */}
      <SalonDarkSidebar />
      {/* Sticky glassmorphism navbar */}
      <SalonNavbar />
      {/* reserve exactly the sidebar width and navbar height */}
      <main
        id="salon-main"
        className="ml-20 pt-16 min-h-[100dvh]"
        style={{
          backgroundColor: '#1A1A1A',
          minHeight: '100vh',
          position: 'relative'
        }}
      >
        {children}
      </main>
    </SalonAuthGuard>
  )
}
