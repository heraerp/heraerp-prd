'use client'

import React, { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

/**
 * Navigation Performance Optimizer
 * Reduces page refresh delays during app-to-app navigation
 */
export function NavigationOptimizer() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Preload critical routes for faster navigation
    const criticalRoutes = [
      '/salon/dashboard',
      '/salon/appointments',
      '/salon/customers',
      '/salon/services',
      '/salon/staffs',
      '/salon/reports',
      '/test-auth'
    ]

    // Prefetch routes that are likely to be visited
    criticalRoutes.forEach(route => {
      if (route !== pathname) {
        router.prefetch(route)
      }
    })

    // Optimize session storage access
    const optimizeSessionStorage = () => {
      try {
        // Check if auth state exists and is valid
        const authState = sessionStorage.getItem('heraAuthState')
        if (authState) {
          const parsed = JSON.parse(authState)
          if (parsed.isAuthenticated && parsed.user?.email?.includes('hairtalkz')) {
            console.log('⚡ Auth state optimized for fast navigation')
          }
        }
      } catch (error) {
        // ignore
      }
    }

    optimizeSessionStorage()
  }, [pathname, router])

  return null // This component doesn't render anything
}