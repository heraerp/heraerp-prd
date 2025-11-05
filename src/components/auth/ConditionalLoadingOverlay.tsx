/**
 * Conditional Loading Overlay
 * Routes to appropriate themed loading overlay based on current path
 * - HERA theme for general routes
 * - Salon Luxe theme for /salon routes
 */

'use client'

import { usePathname } from 'next/navigation'
import { GlobalLoadingOverlay } from './GlobalLoadingOverlay'

export function ConditionalLoadingOverlay() {
  const pathname = usePathname()

  // Check if current route is a salon route
  const isSalonRoute = pathname?.startsWith('/salon')

  // For salon routes, don't render anything here
  // The SalonLuxeLoadingOverlay is mounted in /app/salon/layout.tsx
  if (isSalonRoute) {
    return null
  }

  // For all other routes, use HERA theme
  return <GlobalLoadingOverlay />
}
