/**
 * POS Transaction Protection Hook
 * 🚨 CRITICAL: Production fix for salon POS session stability
 * 
 * This hook provides methods to protect user sessions during POS transactions,
 * preventing logout during customer checkout and payment processing.
 * 
 * Usage in POS components:
 * ```tsx
 * const { startTransaction, endTransaction, updateActivity } = usePosTransactionProtection()
 * 
 * // At start of checkout
 * startTransaction()
 * 
 * // During transaction steps
 * updateActivity() // Keeps session alive
 * 
 * // When transaction complete
 * endTransaction()
 * ```
 */

import React, { useCallback, useEffect } from 'react'
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'

export function usePosTransactionProtection() {
  const { 
    posTransactionActive, 
    setPosTransactionActive, 
    updatePosActivity 
  } = useSecuredSalonContext()

  /**
   * Start POS transaction protection
   * Prevents logout during customer transactions
   */
  const startTransaction = useCallback(() => {
    console.log('🛡️ POS Transaction Protection: STARTING')
    setPosTransactionActive(true)
    updatePosActivity()
  }, [setPosTransactionActive, updatePosActivity])

  /**
   * End POS transaction protection
   * Allows normal session timeout after transaction complete
   */
  const endTransaction = useCallback(() => {
    console.log('🛡️ POS Transaction Protection: ENDING')
    setPosTransactionActive(false)
    updatePosActivity() // Update final activity timestamp
  }, [setPosTransactionActive, updatePosActivity])

  /**
   * Update last activity timestamp
   * Extends session protection for active POS usage
   */
  const updateActivity = useCallback(() => {
    updatePosActivity()
  }, [updatePosActivity])

  /**
   * Auto-update activity on user interactions
   * Tracks clicks, key presses, and touch events
   */
  useEffect(() => {
    if (!posTransactionActive) return

    const events = ['click', 'keydown', 'touchstart', 'mousemove']
    
    const handleUserActivity = () => {
      updateActivity()
    }

    // Only track activity during active transactions
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity)
      })
    }
  }, [posTransactionActive, updateActivity])

  /**
   * Warn before page unload during transaction
   */
  useEffect(() => {
    if (!posTransactionActive) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = 'Transaction in progress. Are you sure you want to leave?'
      return e.returnValue
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [posTransactionActive])

  return {
    posTransactionActive,
    startTransaction,
    endTransaction,
    updateActivity,
    
    // Helper methods for common POS patterns
    withTransactionProtection: useCallback(<T extends any[]>(
      fn: (...args: T) => Promise<any>
    ) => {
      return async (...args: T) => {
        startTransaction()
        try {
          const result = await fn(...args)
          endTransaction()
          return result
        } catch (error) {
          endTransaction()
          throw error
        }
      }
    }, [startTransaction, endTransaction])
  }
}

/**
 * Higher-order component for POS pages that need transaction protection
 */
export function withPosTransactionProtection<P extends object>(
  Component: React.ComponentType<P>
) {
  return function ProtectedPosComponent(props: P) {
    const { updateActivity } = usePosTransactionProtection()

    // Auto-update activity for POS pages
    useEffect(() => {
      const interval = setInterval(updateActivity, 30000) // Every 30 seconds
      return () => clearInterval(interval)
    }, [updateActivity])

    return <Component {...props} />
  }
}