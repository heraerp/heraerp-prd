/**
 * Enterprise Instant Router
 * Smart Code: HERA.PERFORMANCE.INSTANT.ROUTER.v1
 * 
 * Provides SAP-beating instant navigation with optimistic updates
 */

'use client'

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { prefetchService } from '@/lib/performance/PrefetchService'

interface NavigationState {
  isNavigating: boolean
  targetRoute: string | null
  optimisticData: any
  error: string | null
}

interface InstantRouterContext {
  navigate: (route: string, optimisticData?: any) => void
  prefetchOnHover: (route: string) => void
  navigationState: NavigationState
  isInstantNavigation: (route: string) => boolean
}

const InstantRouterContext = createContext<InstantRouterContext | null>(null)

interface InstantRouterProviderProps {
  children: React.ReactNode
}

export function InstantRouterProvider({ children }: InstantRouterProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  
  const [navigationState, setNavigationState] = useState<NavigationState>({
    isNavigating: false,
    targetRoute: null,
    optimisticData: null,
    error: null
  })

  // Routes that support instant navigation
  const instantRoutes = new Set([
    '/retail/pos',
    '/retail/inventory',
    '/retail/customers',
    '/retail/reports',
    '/wholesale',
    '/finance',
    '/crm',
    '/analytics'
  ])

  /**
   * Instant navigation with optimistic updates
   */
  const navigate = useCallback(async (route: string, optimisticData?: any) => {
    // Check if route supports instant navigation
    const isInstant = isInstantNavigation(route)
    
    if (!isInstant) {
      // Fallback to normal navigation
      router.push(route)
      return
    }

    setNavigationState({
      isNavigating: true,
      targetRoute: route,
      optimisticData: optimisticData || null,
      error: null
    })

    try {
      // 1. Start navigation immediately (optimistic)
      const startTime = performance.now()
      
      // 2. Prefetch data if not already cached
      let cachedData = prefetchService.getFromCache(route)
      if (!cachedData || prefetchService.getCacheStats().staleEntries > 0) {
        // Fire-and-forget background prefetch
        prefetchService.prefetchRoute(route, {
          priority: 'high',
          preload: true,
          cache: true,
          staleTime: 5 * 60 * 1000
        })
      }

      // 3. Navigate with minimal delay
      await new Promise(resolve => setTimeout(resolve, 0)) // Yield control
      router.push(route)

      const endTime = performance.now()
      console.log(`⚡ Instant navigation to ${route}: ${Math.round(endTime - startTime)}ms`)

      setNavigationState({
        isNavigating: false,
        targetRoute: null,
        optimisticData: null,
        error: null
      })

    } catch (error) {
      console.error('Navigation error:', error)
      setNavigationState({
        isNavigating: false,
        targetRoute: null,
        optimisticData: null,
        error: error instanceof Error ? error.message : 'Navigation failed'
      })

      // Fallback to normal navigation
      router.push(route)
    }
  }, [router])

  /**
   * Prefetch on hover for ultra-fast subsequent navigation
   */
  const prefetchOnHover = useCallback((route: string) => {
    prefetchService.prefetchRoute(route, {
      priority: 'medium',
      preload: false,
      cache: true,
      staleTime: 2 * 60 * 1000
    })
  }, [])

  /**
   * Check if route supports instant navigation
   */
  const isInstantNavigation = useCallback((route: string): boolean => {
    return Array.from(instantRoutes).some(instantRoute => 
      route.startsWith(instantRoute)
    )
  }, [instantRoutes])

  const value = {
    navigate,
    prefetchOnHover,
    navigationState,
    isInstantNavigation
  }

  return (
    <InstantRouterContext.Provider value={value}>
      {children}
    </InstantRouterContext.Provider>
  )
}

/**
 * Hook to use instant router functionality
 */
export function useInstantRouter() {
  const context = useContext(InstantRouterContext)
  if (!context) {
    throw new Error('useInstantRouter must be used within InstantRouterProvider')
  }
  return context
}

/**
 * Enhanced Link component with instant navigation
 */
interface InstantLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  optimisticData?: any
  prefetch?: boolean
}

export function InstantLink({ 
  href, 
  children, 
  className = '',
  optimisticData,
  prefetch = true 
}: InstantLinkProps) {
  const { navigate, prefetchOnHover, isInstantNavigation } = useInstantRouter()
  const [isPrefetched, setIsPrefetched] = useState(false)

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    navigate(href, optimisticData)
  }, [href, optimisticData, navigate])

  const handleMouseEnter = useCallback(() => {
    if (prefetch && !isPrefetched && isInstantNavigation(href)) {
      prefetchOnHover(href)
      setIsPrefetched(true)
    }
  }, [href, prefetch, isPrefetched, prefetchOnHover, isInstantNavigation])

  return (
    <a
      href={href}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className={`${className} ${isInstantNavigation(href) ? 'instant-link' : ''}`}
      data-prefetch={href}
    >
      {children}
    </a>
  )
}

/**
 * Navigation loading indicator
 */
export function NavigationProgress() {
  const { navigationState } = useInstantRouter()

  if (!navigationState.isNavigating) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-indigo-500 to-blue-500 animate-pulse">
      <div className="h-full bg-white/20 animate-pulse"></div>
    </div>
  )
}

/**
 * Optimistic UI component for showing immediate feedback
 */
interface OptimisticUIProps {
  fallback: React.ReactNode
  children: React.ReactNode
}

export function OptimisticUI({ fallback, children }: OptimisticUIProps) {
  const { navigationState } = useInstantRouter()

  if (navigationState.isNavigating && navigationState.optimisticData) {
    return (
      <div className="animate-in fade-in duration-150">
        {fallback}
      </div>
    )
  }

  return <>{children}</>
}

/**
 * Performance metrics component
 */
export function PerformanceMetrics() {
  const [metrics, setMetrics] = useState<any>(null)
  const [showMetrics, setShowMetrics] = useState(false)

  useEffect(() => {
    if (showMetrics) {
      const stats = prefetchService.getCacheStats()
      const navigationMetrics = performance.getEntriesByType('navigation')[0] as any
      
      setMetrics({
        cache: stats,
        navigation: {
          domContentLoaded: Math.round(navigationMetrics?.domContentLoadedEventEnd - navigationMetrics?.domContentLoadedEventStart || 0),
          loadComplete: Math.round(navigationMetrics?.loadEventEnd - navigationMetrics?.loadEventStart || 0),
          firstPaint: Math.round(performance.getEntriesByType('paint')[0]?.startTime || 0),
          largestContentfulPaint: Math.round(performance.getEntriesByType('largest-contentful-paint')[0]?.startTime || 0)
        }
      })
    }
  }, [showMetrics])

  if (process.env.NODE_ENV !== 'development') return null

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={() => setShowMetrics(!showMetrics)}
        className="bg-black/80 text-white text-xs px-3 py-2 rounded-lg font-mono"
      >
        ⚡ Performance
      </button>

      {showMetrics && metrics && (
        <div className="absolute bottom-12 left-0 bg-black/90 text-white text-xs p-4 rounded-lg font-mono min-w-[300px]">
          <div className="space-y-2">
            <div><strong>Cache Stats:</strong></div>
            <div>• Entries: {metrics.cache.totalEntries}</div>
            <div>• Fresh: {metrics.cache.freshEntries}</div>
            <div>• Stale: {metrics.cache.staleEntries}</div>
            
            <div><strong>Navigation:</strong></div>
            <div>• DOM Ready: {metrics.navigation.domContentLoaded}ms</div>
            <div>• Load Complete: {metrics.navigation.loadComplete}ms</div>
            <div>• First Paint: {metrics.navigation.firstPaint}ms</div>
            <div>• LCP: {metrics.navigation.largestContentfulPaint}ms</div>
          </div>
        </div>
      )}
    </div>
  )
}