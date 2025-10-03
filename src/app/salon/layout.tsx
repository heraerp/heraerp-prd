'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import SalonRoleBasedDarkSidebar from '@/components/salon/SalonRoleBasedDarkSidebar'
import { SecuredSalonProvider } from './SecuredSalonProvider'
import { Toaster } from '@/components/ui/toaster'
import { NavigationProgress } from '@/components/ui/navigation-progress'
import { NavigationProvider } from './navigation-provider'
import { PrefetchLinks } from './prefetch-links'

export default function SalonLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Don't show sidebar on public pages
  const isPublicPage = pathname === '/salon' || pathname === '/salon/auth'

  if (isPublicPage) {
    return <>{children}</>
  }

  return (
    <NavigationProvider>
      <SecuredSalonProvider>
        {/* Prefetch common routes for better performance */}
        <PrefetchLinks />
        {/* Enterprise navigation progress bar */}
        <NavigationProgress />
        {/* Use role-based narrow Teams-style sidebar */}
        <SalonRoleBasedDarkSidebar />
        {/* reserve exactly the sidebar width */}
        <main
          id="salon-main"
          className="ml-20 min-h-[100dvh]"
          style={{
            backgroundColor: '#1A1A1A',
            minHeight: '100vh',
            position: 'relative'
          }}
        >
          {children}
        </main>
        <Toaster />
      </SecuredSalonProvider>
    </NavigationProvider>
  )
}
