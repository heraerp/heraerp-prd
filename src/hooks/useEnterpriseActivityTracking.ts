/**
 * Enterprise Activity Tracking Hook
 * Automatically extends user sessions based on activity to prevent mid-shift logouts
 * Smart Code: HERA.SECURITY.ENTERPRISE.ACTIVITY_TRACKING.v1
 */

'use client'

import { useEffect, useCallback } from 'react'
import { useSalonSecurityStore } from '@/lib/salon/security-store'

interface UseEnterpriseActivityTrackingOptions {
  enabled?: boolean
  throttleMs?: number
  debugMode?: boolean
}

export function useEnterpriseActivityTracking(options: UseEnterpriseActivityTrackingOptions = {}) {
  const {
    enabled = true,
    throttleMs = 5 * 60 * 1000, // 5 minutes throttling by default
    debugMode = process.env.NODE_ENV === 'development'
  } = options

  const securityStore = useSalonSecurityStore()
  const { extendSessionOnActivity, getSessionTimeRemaining } = securityStore

  // Throttled activity handler to prevent excessive session extensions
  const handleActivity = useCallback(() => {
    if (!enabled) return

    // Check if enough time has passed since last extension
    const lastExtensionKey = 'lastActivityExtension'
    const lastExtension = parseInt(sessionStorage.getItem(lastExtensionKey) || '0')
    const now = Date.now()

    if (now - lastExtension > throttleMs) {
      extendSessionOnActivity()
      sessionStorage.setItem(lastExtensionKey, now.toString())

      if (debugMode) {
        const remainingHours = Math.round(getSessionTimeRemaining() / 1000 / 60 / 60)
        console.log(`🏢 Enterprise activity tracked, session extended (${remainingHours}h remaining)`)
      }
    }
  }, [enabled, throttleMs, extendSessionOnActivity, getSessionTimeRemaining, debugMode])

  // Set up activity listeners
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    // ✅ ENTERPRISE: Track meaningful user activities that indicate active work
    const activityEvents = [
      'click',        // User interactions
      'keydown',      // Typing/input
      'scroll',       // Page navigation
      'mousemove',    // Mouse activity (throttled by browser)
      'touchstart'    // Mobile interactions
    ]

    // Throttle mousemove specifically to prevent excessive calls
    let mouseMoveTimer: NodeJS.Timeout | null = null
    const handleMouseMove = () => {
      if (mouseMoveTimer) return
      mouseMoveTimer = setTimeout(() => {
        handleActivity()
        mouseMoveTimer = null
      }, 30000) // Only trigger once per 30 seconds for mouse movement
    }

    // Add event listeners
    activityEvents.forEach(event => {
      if (event === 'mousemove') {
        window.addEventListener(event, handleMouseMove, { passive: true })
      } else {
        window.addEventListener(event, handleActivity, { passive: true })
      }
    })

    // ✅ ENTERPRISE: Track route changes (navigation activity)
    const handleRouteChange = () => {
      if (debugMode) {
        console.log('🏢 Enterprise navigation detected, extending session')
      }
      
      // 🛡️ CRITICAL: Record navigation time to protect against authentication checks
      // This prevents the customer search logout issue
      sessionStorage.setItem('lastNavigationTime', Date.now().toString())
      
      handleActivity()
    }

    // Listen for Next.js route changes
    const originalPushState = window.history.pushState
    const originalReplaceState = window.history.replaceState

    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args)
      handleRouteChange()
    }

    window.history.replaceState = function(...args) {
      originalReplaceState.apply(window.history, args)
      handleRouteChange()
    }

    window.addEventListener('popstate', handleRouteChange)
    
    // 🛡️ CRITICAL: Also track page load navigation (when users click links)
    // This covers cases where SecuredSalonProvider re-runs during page transitions
    const handlePageLoad = () => {
      sessionStorage.setItem('lastNavigationTime', Date.now().toString())
    }
    
    // Track both manual navigation and programmatic navigation
    window.addEventListener('beforeunload', handlePageLoad)
    
    // Track initial page load
    handlePageLoad()

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        if (event === 'mousemove') {
          window.removeEventListener(event, handleMouseMove)
        } else {
          window.removeEventListener(event, handleActivity)
        }
      })

      window.removeEventListener('popstate', handleRouteChange)
      window.removeEventListener('beforeunload', handlePageLoad)
      
      // Restore original history methods
      window.history.pushState = originalPushState
      window.history.replaceState = originalReplaceState

      if (mouseMoveTimer) {
        clearTimeout(mouseMoveTimer)
      }
    }
  }, [enabled, handleActivity, debugMode])

  // ✅ ENTERPRISE: Periodic session health check (every 30 minutes)
  useEffect(() => {
    if (!enabled) return

    const sessionHealthInterval = setInterval(() => {
      const remaining = getSessionTimeRemaining()
      const hoursRemaining = Math.round(remaining / 1000 / 60 / 60)
      
      if (debugMode && hoursRemaining > 0) {
        console.log(`🏢 Enterprise session health: ${hoursRemaining}h remaining`)
      }

      // If session is getting close to expiry (< 2 hours), extend it preemptively
      if (remaining > 0 && remaining < 2 * 60 * 60 * 1000) {
        if (debugMode) {
          console.log('🏢 Preemptive session extension (< 2h remaining)')
        }
        extendSessionOnActivity()
      }
    }, 30 * 60 * 1000) // Every 30 minutes

    return () => clearInterval(sessionHealthInterval)
  }, [enabled, getSessionTimeRemaining, extendSessionOnActivity, debugMode])

  return {
    // Expose session information for UI components
    sessionTimeRemaining: getSessionTimeRemaining(),
    sessionTimeRemainingHours: Math.round(getSessionTimeRemaining() / 1000 / 60 / 60),
    
    // Manual extension function for specific scenarios
    extendSession: handleActivity,
    
    // Session status helpers
    isSessionHealthy: () => getSessionTimeRemaining() > 4 * 60 * 60 * 1000, // > 4 hours
    needsAttention: () => {
      const remaining = getSessionTimeRemaining()
      return remaining > 0 && remaining < 2 * 60 * 60 * 1000 // < 2 hours but not expired
    }
  }
}

// Note: EnterpriseActivityProvider is integrated directly in SecuredSalonProvider
// No separate component needed - the hook is called directly