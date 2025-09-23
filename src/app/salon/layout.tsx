'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import SalonRoleBasedDarkSidebar from '@/components/salon/SalonRoleBasedDarkSidebar'
import { SalonNavbar } from '@/components/salon/SalonNavbar'
import { SalonProvider } from './SalonProvider'

export default function SalonLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Don't show sidebar on public pages
  const isPublicPage = pathname === '/salon' || pathname === '/salon/auth'

  if (isPublicPage) {
    return <>{children}</>
  }

  return (
    <SalonProvider>
      {/* Use role-based narrow Teams-style sidebar */}
      <SalonRoleBasedDarkSidebar />
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
    </SalonProvider>
  )
}
