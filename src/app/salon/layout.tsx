'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import SalonRoleBasedSidebar from '@/components/salon/SalonRoleBasedSidebar'
import { SalonAuthGuard, SalonRoleDisplay } from '@/components/salon/auth/SalonAuthGuard'

export default function SalonLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Don't show sidebar on public pages
  const isPublicPage = pathname === '/salon' || pathname === '/salon/auth'

  if (isPublicPage) {
    return <>{children}</>
  }

  return (
    <SalonAuthGuard>
      <SalonRoleBasedSidebar />
      {/* reserve exactly the sidebar width */}
      <main id="salon-main" className="ml-20 min-h-[100dvh]">
        {/* Role display in top-right corner */}
        <div className="fixed top-4 right-4 z-50">
          <SalonRoleDisplay />
        </div>
        {children}
      </main>
    </SalonAuthGuard>
  )
}
