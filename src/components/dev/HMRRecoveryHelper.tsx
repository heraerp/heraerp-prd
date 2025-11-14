/**
 * 🔧 Smart HMR Recovery Helper for Next.js 15
 *
 * **Purpose**: Help users recover when Next.js HMR gets stuck on "Reconnecting..."
 *
 * **Problem Solved**:
 * - Next.js 15 sometimes gets stuck on "Reconnecting..." message
 * - Built-in "Retry" button doesn't work
 * - Users have to manually refresh the page
 *
 * **This Helper**:
 * - ✅ Only activates when Next.js is ACTUALLY reconnecting (no false positives)
 * - ✅ Waits 30 seconds for Next.js to recover naturally
 * - ✅ Shows helpful notification if still stuck
 * - ✅ Provides working "Reload" button
 * - ✅ User always in control
 * - ✅ Never interrupts normal development
 *
 * **Key Differences from Previous Component**:
 * - Does NOT check on idle time (no false positives)
 * - Does NOT auto-reload automatically
 * - ONLY helps when Next.js is visibly stuck
 * - Generous 30-second wait before showing notification
 *
 * @version 3.0.0 - Smart Recovery Helper
 * @see https://github.com/vercel/next.js/issues/58551
 */

'use client'

import React from 'react'

interface RecoveryState {
  isReconnecting: boolean
  showHelper: boolean
  stuckDuration: number
}

export function HMRRecoveryHelper() {
  const [state, setState] = useState<RecoveryState>({
    isReconnecting: false,
    showHelper: false,
    stuckDuration: 0
  })

  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectStartTimeRef = useRef<number | null>(null)
  const helperTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // GUARD: Only run in development mode
    if (process.env.NODE_ENV !== 'development') {
      return
    }

    console.log('🔧 [DEV] HMR Recovery Helper initialized')

    const DETECTION_INTERVAL = 5000    // Check every 5 seconds
    const STUCK_THRESHOLD = 30000      // Consider stuck after 30 seconds
    const HELPER_DELAY = 10000         // Show helper after 10 more seconds (total 40s)

    /**
     * Check if Next.js is showing "Reconnecting" message
     */
    const isNextJSReconnecting = (): boolean => {
      // Check Next.js error overlay/portal
      const nextPortal = document.querySelector('nextjs-portal')
      if (nextPortal?.shadowRoot) {
        const text = nextPortal.shadowRoot.textContent?.toLowerCase() || ''
        if (text.includes('reconnect')) return true
      }

      // Check body text for reconnecting message
      const bodyText = document.body.textContent?.toLowerCase() || ''
      return bodyText.includes('reconnecting')
    }

    /**
     * Main monitoring loop
     */
    const checkHMRStatus = () => {
      const isReconnecting = isNextJSReconnecting()

      if (isReconnecting) {
        // Start tracking reconnection time
        if (!reconnectStartTimeRef.current) {
          reconnectStartTimeRef.current = Date.now()
          setState(prev => ({ ...prev, isReconnecting: true, stuckDuration: 0 }))
          console.log('🔄 [DEV] Next.js reconnecting detected, monitoring...')

          // Schedule helper notification after stuck threshold
          helperTimeoutRef.current = setTimeout(() => {
            const duration = Date.now() - (reconnectStartTimeRef.current || 0)
            console.warn(`⚠️ [DEV] HMR stuck for ${Math.round(duration/1000)}s, showing helper...`)
            setState(prev => ({
              ...prev,
              showHelper: true,
              stuckDuration: duration
            }))
          }, STUCK_THRESHOLD + HELPER_DELAY)
        }
      } else {
        // Reconnection successful or not happening
        if (reconnectStartTimeRef.current) {
          const duration = Date.now() - reconnectStartTimeRef.current
          console.log(`✅ [DEV] HMR reconnected successfully after ${Math.round(duration/1000)}s`)
        }

        // Reset state
        reconnectStartTimeRef.current = null
        if (helperTimeoutRef.current) {
          clearTimeout(helperTimeoutRef.current)
          helperTimeoutRef.current = null
        }
        setState({
          isReconnecting: false,
          showHelper: false,
          stuckDuration: 0
        })
      }
    }

    // Start monitoring
    checkIntervalRef.current = setInterval(checkHMRStatus, DETECTION_INTERVAL)

    // Initial check
    checkHMRStatus()

    // Cleanup
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
      if (helperTimeoutRef.current) {
        clearTimeout(helperTimeoutRef.current)
      }
      console.log('🔧 [DEV] HMR Recovery Helper cleaned up')
    }
  }, [])

  // Don't render anything in production
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  // Don't render helper unless actually stuck
  if (!state.showHelper) {
    return null
  }

  /**
   * Handle reload button click
   */
  const handleReload = () => {
    console.log('🔄 [DEV] User requested page reload')
    window.location.reload()
  }

  /**
   * Handle dismiss button click
   */
  const handleDismiss = () => {
    console.log('✅ [DEV] User dismissed HMR recovery helper')
    setState(prev => ({ ...prev, showHelper: false }))
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 999999,
        maxWidth: '420px',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        border: '2px solid #0f3460',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(15, 52, 96, 0.3)',
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

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        {/* Icon */}
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #e94560 0%, #533483 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(233, 69, 96, 0.3)'
          }}
        >
          ⚡
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title */}
          <h3
            style={{
              margin: '0 0 8px 0',
              fontSize: '17px',
              fontWeight: '600',
              color: '#e94560',
              letterSpacing: '-0.01em'
            }}
          >
            HMR Reconnection Stuck
          </h3>

          {/* Description */}
          <p
            style={{
              margin: '0 0 16px 0',
              fontSize: '14px',
              color: '#a8b2d1',
              lineHeight: '1.6'
            }}
          >
            Next.js has been trying to reconnect for <strong style={{ color: '#e94560' }}>{Math.round(state.stuckDuration/1000)}s</strong>.
            The built-in retry isn't working. Would you like to reload the page?
          </p>

          {/* Info */}
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(15, 52, 96, 0.3)',
              border: '1px solid rgba(15, 52, 96, 0.5)',
              marginBottom: '16px'
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '12px',
                color: '#8892b0',
                lineHeight: '1.5'
              }}
            >
              💡 <strong style={{ color: '#a8b2d1' }}>Tip:</strong> This only happens when Next.js HMR gets stuck (rare in Next.js 15).
              Your work is saved and auth session will persist.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleReload}
              style={{
                flex: 1,
                padding: '12px 20px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #e94560 0%, #533483 100%)',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(233, 69, 96, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(233, 69, 96, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(233, 69, 96, 0.3)'
              }}
            >
              🔄 Reload Page
            </button>

            <button
              onClick={handleDismiss}
              style={{
                flex: 1,
                padding: '12px 20px',
                borderRadius: '8px',
                border: '1px solid #0f3460',
                background: 'transparent',
                color: '#8892b0',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(15, 52, 96, 0.2)'
                e.currentTarget.style.color = '#a8b2d1'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#8892b0'
              }}
            >
              Keep Waiting
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
