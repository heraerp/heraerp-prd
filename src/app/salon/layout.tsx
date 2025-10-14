'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { QueryClient } from '@tanstack/react-query'
import SalonRoleBasedDarkSidebar from '@/components/salon/SalonRoleBasedDarkSidebar'
import { SecuredSalonProvider } from './SecuredSalonProvider'
import { SalonQueryWrapper } from './SalonQueryWrapper'
import { NavigationProgress } from '@/components/ui/navigation-progress'
import { NavigationProvider } from './navigation-provider'
import { PrefetchLinks } from './prefetch-links'

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
export default function SalonLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Don't show sidebar on public pages
  const isPublicPage = pathname === '/salon' || pathname === '/salon/auth'

  if (isPublicPage) {
    return <>{children}</>
  }

  return (
    <NavigationProvider>
      <SalonQueryWrapper>
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
            <React.Suspense fallback={<div>Loading...</div>}>{children}</React.Suspense>
          </main>
        </SecuredSalonProvider>
      </SalonQueryWrapper>
    </NavigationProvider>
  )
}
