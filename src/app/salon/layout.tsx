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

// Create a client outside component to prevent recreation on every render
// Optimized for parallel loading and smart caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh
      gcTime: 1000 * 60 * 30, // 30 minutes - keep in cache longer for faster navigation
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Don't refetch when component mounts if data exists
      refetchOnReconnect: false, // Don't refetch on network reconnect
      // Enable parallel queries by default
      networkMode: 'online',
      // Retry with exponential backoff
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
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
            <React.Suspense fallback={<div>Loading...</div>}>
              {children}
            </React.Suspense>
          </main>
        </SecuredSalonProvider>
      </SalonQueryWrapper>
    </NavigationProvider>
  )
}
