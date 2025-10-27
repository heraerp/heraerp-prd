'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { QueryClient } from '@tanstack/react-query'
import EnterpriseSalonSidebar from './EnterpriseSalonSidebar'
import { PremiumBottomNav } from '@/components/salon/mobile/PremiumBottomNav'
import { EnterpriseSecuredSalonProvider } from './EnterpriseSecuredSalonProvider'
import { SalonQueryWrapper } from './SalonQueryWrapper'
import { NavigationProgress } from '@/components/ui/navigation-progress'
import { NavigationProvider } from './navigation-provider'
import { PrefetchLinks } from './prefetch-links'
import { useSecuredSalonContext } from './EnterpriseSecuredSalonProvider'

// Import global salon luxe theme
import '@/styles/salon-luxe.css'

// ✅ ENTERPRISE PERFORMANCE: Optimized QueryClient for instant navigation
// Create a client outside component to prevent recreation on every render
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // ✅ PERFORMANCE: Cache data indefinitely - refetch manually when needed
      gcTime: 1000 * 60 * 60, // 60 minutes - keep in cache for 1 hour
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnMount: false, // ✅ CRITICAL: Don't refetch when component mounts
      refetchOnReconnect: false, // Don't refetch on network reconnect
      networkMode: 'online',
      retry: 0, // ✅ PERFORMANCE: No retries - fail fast
      retryDelay: 0
    }
  }
})
// Inner component to access SecuredSalonProvider context
function SalonLayoutContent({ children }: { children: React.ReactNode }) {
  const { salonRole } = useSecuredSalonContext()

  return (
    <>
      {/* 📱 MOBILE-FIRST: Hide sidebar on mobile, show on desktop */}
      <div className="hidden md:block">
        <EnterpriseSalonSidebar />
      </div>

      {/* Main content area */}
      <main
        id="salon-main"
        className="md:ml-20 min-h-[100dvh]"
        style={{
          backgroundColor: '#1A1A1A',
          minHeight: '100vh',
          position: 'relative'
        }}
      >
        <React.Suspense fallback={<div>Loading...</div>}>{children}</React.Suspense>
      </main>

      {/* 📱 PREMIUM BOTTOM NAVIGATION (mobile only) */}
      <PremiumBottomNav userRole={salonRole?.toLowerCase()} />
    </>
  )
}

export default function SalonLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Don't show sidebar on public pages
  const isPublicPage = pathname === '/salon' || pathname === '/salon/auth' || pathname === '/enterprise/salon' || pathname === '/enterprise/salon/auth' || pathname === '/enterprise/salon/test-page'

  if (isPublicPage) {
    return <>{children}</>
  }

  return (
    <NavigationProvider>
      <SalonQueryWrapper>
        <EnterpriseSecuredSalonProvider>
          {/* Prefetch common routes for better performance */}
          <PrefetchLinks />
          {/* Enterprise navigation progress bar */}
          <NavigationProgress />
          {/* Layout with role-based navigation */}
          <SalonLayoutContent>{children}</SalonLayoutContent>
        </EnterpriseSecuredSalonProvider>
      </SalonQueryWrapper>
    </NavigationProvider>
  )
}
