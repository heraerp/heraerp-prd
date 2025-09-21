'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import SalonRoleBasedSidebar from '@/components/salon/SalonRoleBasedSidebar'
import SalonLuxeSidebar from '@/components/salon/SalonLuxeSidebar'
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
      {/* Always use luxe sidebar for consistent styling */}
      <SalonLuxeSidebar />
      {/* reserve exactly the sidebar width */}
      <main 
        id="salon-main" 
        className="ml-64 min-h-[100dvh]"
        style={{ 
          backgroundColor: '#1A1A1A',
          minHeight: '100vh',
          position: 'relative'
        }}
      >
        {/* Role display in top-right corner */}
        <div className="fixed top-4 right-4 z-50">
          <SalonRoleDisplay />
        </div>
        {children}
      </main>
    </SalonAuthGuard>
  )
}
