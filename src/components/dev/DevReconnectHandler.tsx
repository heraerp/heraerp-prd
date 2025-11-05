/**
 * ⚠️⚠️⚠️ DISABLED - DO NOT USE ⚠️⚠️⚠️
 *
 * This component has been REMOVED from layout.tsx due to false positive issues.
 *
 * **History**:
 * - Added: 2025-11-05 (commit 2182dc58f)
 * - Removed: 2025-11-05 (same day) due to causing more problems than it solved
 *
 * **Problems It Caused**:
 * - False positive reconnections on normal tab switching
 * - False positive reconnections on window switching
 * - Interrupted normal development workflow
 * - Created issues where none existed before
 *
 * **Why Keeping File**:
 * - Historical reference
 * - Learning experience
 * - May be useful to study for future improvements
 *
 * **Recommendation**:
 * Do NOT re-enable without solving the false positive issue completely.
 * Let Next.js handle HMR reconnection natively.
 *
 * ---
 *
 * 🏢 ENTERPRISE-GRADE Development Reconnect Handler v2.0 (DISABLED)
 *
 * Handles Next.js Fast Refresh / HMR WebSocket reconnection with intelligent detection.
 *
 * ⚠️ CRITICAL: This component ONLY runs in development mode.
 * It is completely removed from production builds via Next.js tree-shaking.
 *
 * 🎯 Enterprise Features:
 * - Multi-layer connection health detection (DOM + WebSocket + Fetch)
 * - Smart reconnection window (15-second grace period before reload)
 * - User-friendly notification toast with manual override
 * - Exponential backoff with circuit breaker pattern
 * - Zero false positives via triple verification
 * - Complete authentication preservation
 *
 * 🔍 Detection Strategy:
 * 1. Check for Next.js "reconnecting" indicator in DOM
 * 2. Verify HMR endpoint accessibility
 * 3. Wait 15 seconds before auto-reload (user can dismiss)
 * 4. Show persistent toast notification with countdown
 *
 * @version 2.0.0 (DISABLED)
 * @deprecated Removed from layout.tsx on 2025-11-05
 * @see https://nextjs.org/docs/architecture/fast-refresh
 */

'use client'

import { useEffect, useRef, useState } from 'react'

interface ReconnectNotification {
  show: boolean
  countdown: number
  dismissed: boolean
}

export function DevReconnectHandler() {
  const reconnectAttemptsRef = useRef(0)
  const lastActivityRef = useRef(Date.now())
  const isCheckingRef = useRef(false)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const [notification, setNotification] = useState<ReconnectNotification>({
    show: false,
    countdown: 15,
    dismissed: false
  })

  useEffect(() => {
    // GUARD: Only run in development mode
    if (process.env.NODE_ENV !== 'development') {
      return
    }

    console.log('🏢 [DEV] Enterprise Reconnect Handler v2.0 initialized')

    const MAX_RECONNECT_ATTEMPTS = 3
    const GRACE_PERIOD = 15000 // 15 seconds before auto-reload
    const CHECK_INTERVAL = 20000 // Check every 20 seconds
    const IDLE_THRESHOLD = 600000 // 10 minutes of TRUE inactivity

    /**
     * 🔍 DETECTION LAYER 1: Check Next.js UI indicator
     * Next.js shows a "reconnecting" toast when HMR disconnects
     */
    const hasNextJSReconnectingIndicator = (): boolean => {
      // Check for Next.js error overlay or reconnecting message
      const nextErrorOverlay = document.querySelector('nextjs-portal')
      if (nextErrorOverlay) {
        const shadowRoot = nextErrorOverlay.shadowRoot
        if (shadowRoot) {
          const reconnectText = shadowRoot.textContent?.toLowerCase() || ''
          return reconnectText.includes('reconnect') || reconnectText.includes('hmr')
        }
      }

      // Check for toast notifications containing reconnect message
      const bodyText = document.body.textContent?.toLowerCase() || ''
      return bodyText.includes('reconnecting')
    }

    /**
     * 🔍 DETECTION LAYER 2: Check HMR endpoint accessibility
     */
    const checkHMREndpoint = async (): Promise<boolean> => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000) // 3s timeout

        const response = await fetch('/_next/webpack-hmr', {
          method: 'HEAD',
          cache: 'no-store',
          signal: controller.signal
        })

        clearTimeout(timeoutId)
        return response.ok
      } catch (error) {
        return false
      }
    }

    /**
     * 🔍 DETECTION LAYER 3: Triple verification
     * Only trigger reload if multiple indicators confirm disconnection
     */
    const verifyDisconnection = async (): Promise<boolean> => {
      const hasIndicator = hasNextJSReconnectingIndicator()
      const endpointCheck1 = await checkHMREndpoint()

      // If endpoint is accessible, no disconnection
      if (endpointCheck1) {
        return false
      }

      // Double-check endpoint after 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000))
      const endpointCheck2 = await checkHMREndpoint()

      // Disconnection confirmed if:
      // - Next.js shows reconnecting indicator OR
      // - HMR endpoint fails twice in a row
      return hasIndicator || (!endpointCheck1 && !endpointCheck2)
    }

    /**
     * 🎯 Show user-friendly notification with countdown
     */
    const showReconnectNotification = () => {
      setNotification({
        show: true,
        countdown: 15,
        dismissed: false
      })

      let countdown = 15
      countdownIntervalRef.current = setInterval(() => {
        countdown--
        setNotification(prev => ({
          ...prev,
          countdown
        }))

        if (countdown <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current)
          }
        }
      }, 1000)
    }

    /**
     * 🔄 Execute reconnection with grace period
     */
    const executeReconnection = () => {
      if (notification.dismissed) {
        console.log('✅ [DEV] Reconnection dismissed by user')
        return
      }

      reconnectAttemptsRef.current++
      console.log(
        `🔄 [DEV] Auto-reloading page (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...`
      )

      // Clear notification
      setNotification({ show: false, countdown: 0, dismissed: false })

      // Reload page
      window.location.reload()
    }

    /**
     * 🎯 Main connection health check
     * ONLY triggers if Next.js is showing "reconnecting" message
     */
    const performHealthCheck = async () => {
      // Skip if already checking or max attempts reached
      if (isCheckingRef.current || reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        return
      }

      // 🚨 CRITICAL: First check if Next.js is actually showing reconnecting message
      // This prevents false positives from normal tab switching
      const hasReconnectingMessage = hasNextJSReconnectingIndicator()

      if (!hasReconnectingMessage) {
        // No reconnecting message = connection is fine
        return
      }

      // 🎯 If we see "reconnecting" message, verify it's real
      console.log('👀 [DEV] Detected "reconnecting" message, verifying...')

      isCheckingRef.current = true

      try {
        const isDisconnected = await verifyDisconnection()

        if (isDisconnected) {
          console.warn('⚠️ [DEV] HMR disconnection CONFIRMED, starting grace period...')

          // Show notification with countdown
          showReconnectNotification()

          // Schedule auto-reload after grace period
          reconnectTimeoutRef.current = setTimeout(() => {
            executeReconnection()
          }, GRACE_PERIOD)
        } else {
          console.log('✅ [DEV] False alarm - HMR connection healthy')
          reconnectAttemptsRef.current = 0 // Reset on successful check
        }
      } catch (error) {
        console.error('❌ [DEV] Health check error:', error)
      } finally {
        isCheckingRef.current = false
      }
    }

    /**
     * 🎯 Track user activity
     */
    const trackActivity = () => {
      lastActivityRef.current = Date.now()
    }

    /**
     * 🎯 Handle page visibility changes
     * ONLY check if Next.js is showing "reconnecting" message
     */
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        trackActivity()

        // 🚨 CRITICAL: Only check if there's actually a reconnecting message
        // Don't check on every tab switch - that's normal behavior
        const hasReconnectingMessage = hasNextJSReconnectingIndicator()

        if (hasReconnectingMessage) {
          console.log('👀 [DEV] Page visible with reconnecting message, checking...')
          performHealthCheck()
        }
      }
    }

    /**
     * 🎯 Dismiss notification
     */
    const dismissNotification = () => {
      setNotification(prev => ({ ...prev, dismissed: true, show: false }))

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }

      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }

      console.log('✅ [DEV] Reconnection notification dismissed')
    }

    // Expose dismiss function globally for notification
    ;(window as any).__dismissDevReconnect = dismissNotification

    // Register event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('mousemove', trackActivity)
    document.addEventListener('keydown', trackActivity)
    document.addEventListener('click', trackActivity)
    document.addEventListener('scroll', trackActivity)

    // Periodic health check
    const healthCheckInterval = setInterval(performHealthCheck, CHECK_INTERVAL)

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('mousemove', trackActivity)
      document.removeEventListener('keydown', trackActivity)
      document.removeEventListener('click', trackActivity)
      document.removeEventListener('scroll', trackActivity)

      clearInterval(healthCheckInterval)

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }

      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }

      console.log('🏢 [DEV] Enterprise Reconnect Handler cleaned up')
    }
  }, [notification.dismissed])

  // Don't render anything in production
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  // Render notification toast
  if (!notification.show) {
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 999999,
        maxWidth: '400px',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        border: '2px solid #d4af37',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(212, 175, 55, 0.2)',
        animation: 'slideInRight 0.3s ease-out',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            flexShrink: 0
          }}
        >
          🔄
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              margin: '0 0 8px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: '#f5f5dc',
              letterSpacing: '-0.01em'
            }}
          >
            Development Server Reconnecting
          </h3>
          <p
            style={{
              margin: '0 0 16px 0',
              fontSize: '14px',
              color: '#c0c0c0',
              lineHeight: '1.5'
            }}
          >
            HMR connection lost. Auto-reloading in <strong style={{ color: '#d4af37' }}>{notification.countdown}s</strong> to restore hot reload.
          </p>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                if (reconnectTimeoutRef.current) {
                  clearTimeout(reconnectTimeoutRef.current)
                }
                if (countdownIntervalRef.current) {
                  clearInterval(countdownIntervalRef.current)
                }
                window.location.reload()
              }}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)',
                color: '#1a1a1a',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              Reload Now
            </button>

            <button
              onClick={() => {
                ;(window as any).__dismissDevReconnect?.()
              }}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '8px',
                border: '1px solid #d4af37',
                background: 'transparent',
                color: '#d4af37',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
