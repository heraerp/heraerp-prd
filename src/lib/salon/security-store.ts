/**
 * Salon Security Store
 * Persistent security context to prevent re-initialization on navigation
 *
 * SECURITY: organizationId is NOT persisted - must always come from JWT
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 🧹 One-time cleanup: Remove stale organization cache from previous version
if (typeof window !== 'undefined') {
  try {
    const staleStore = localStorage.getItem('salon-security-store')
    if (staleStore) {
      const parsed = JSON.parse(staleStore)
      if (parsed?.state?.organizationId || parsed?.state?.organization) {
        console.warn('🧹 Removing stale organization cache from localStorage')
        localStorage.removeItem('salon-security-store')
        localStorage.removeItem('organizationId')
      }
    }
  } catch (e) {
    // Ignore parsing errors
  }
}

interface SalonSecurityState {
  isInitialized: boolean
  lastInitialized: number | null
  salonRole: string | null
  organizationId: string | null
  permissions: string[] | null
  userId: string | null
  user: any | null
  organization: { id: string; name: string } | null
  
  // 🎯 POS Transaction Protection
  posTransactionActive: boolean
  lastPosActivity: number | null

  // Actions
  setInitialized: (data: {
    salonRole: string
    organizationId: string
    permissions: string[]
    userId: string
    user?: any
    organization?: { id: string; name: string }
  }) => void

  clearState: () => void
  
  // 🎯 POS Transaction Protection Methods
  setPosTransactionActive: (active: boolean) => void
  updatePosActivity: () => void

  // ✅ ENTERPRISE: Activity-based session extension
  extendSessionOnActivity: () => void
  getSessionTimeRemaining: () => number

  // Check if we need to re-initialize (with POS protection)
  shouldReinitialize: () => boolean
}

// ✅ ENTERPRISE: Extended TTL for salon business continuity
// CRITICAL: Support full work shifts without authentication interruption
// Smart Code: HERA.SECURITY.AUTH.ENTERPRISE_TTL.v1
const SOFT_TTL = 12 * 60 * 60 * 1000 // 12 hours - full shift coverage
const HARD_TTL = 24 * 60 * 60 * 1000 // 24 hours - multi-shift support
const GRACE_PERIOD = 15 * 60 * 1000  // 15 minutes - extended grace for network issues
const REINIT_INTERVAL = HARD_TTL // Backward compatibility

// 🎯 POS Transaction Protection: Never force logout during active transactions
const POS_TRANSACTION_PROTECTION_TTL = 12 * 60 * 60 * 1000 // 12 hours for POS sessions

// ✅ ENTERPRISE: Environment-aware logging
const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
const logEnterprise = (message: string, ...args: any[]) => {
  if (!isProduction || process.env.NODE_ENV === 'development') {
    console.log(message, ...args)
  }
}

export { SOFT_TTL, HARD_TTL, GRACE_PERIOD, POS_TRANSACTION_PROTECTION_TTL }

export const useSalonSecurityStore = create<SalonSecurityState>()(
  persist(
    (set, get) => ({
      isInitialized: false,
      lastInitialized: null,
      salonRole: null,
      organizationId: null,
      permissions: null,
      userId: null,
      user: null,
      organization: null,
      
      // 🎯 POS Transaction Protection defaults
      posTransactionActive: false,
      lastPosActivity: null,

      setInitialized: data => {
        set({
          isInitialized: true,
          lastInitialized: Date.now(),
          salonRole: data.salonRole,
          organizationId: data.organizationId,
          permissions: data.permissions,
          userId: data.userId,
          user: data.user || null,
          organization: data.organization || null
        })
      },

      clearState: () => {
        set({
          isInitialized: false,
          lastInitialized: null,
          salonRole: null,
          organizationId: null,
          permissions: null,
          userId: null,
          user: null,
          organization: null,
          // Reset POS protection state
          posTransactionActive: false,
          lastPosActivity: null
        })
      },
      
      // 🎯 POS Transaction Protection Methods
      setPosTransactionActive: (active: boolean) => {
        set({ 
          posTransactionActive: active,
          lastPosActivity: active ? Date.now() : get().lastPosActivity
        })
        logEnterprise(`🛡️ POS Transaction Protection: ${active ? 'ACTIVATED' : 'DEACTIVATED'}`)
      },
      
      updatePosActivity: () => {
        set({ lastPosActivity: Date.now() })
      },

      // ✅ ENTERPRISE: Activity-based session extension
      extendSessionOnActivity: () => {
        const now = Date.now()
        const currentState = get()
        
        // Only extend if we have an active session and it's not too fresh (prevent spam)
        if (currentState.lastInitialized && (now - currentState.lastInitialized > 5 * 60 * 1000)) {
          // Extend session by 4 hours on activity
          const ACTIVITY_EXTENSION = 4 * 60 * 60 * 1000
          const newTimestamp = now - (HARD_TTL - ACTIVITY_EXTENSION)
          
          set({ 
            lastInitialized: newTimestamp,
            lastPosActivity: now 
          })
          
          logEnterprise('🏢 Enterprise session extended due to activity (+4 hours)')
        }
      },

      getSessionTimeRemaining: () => {
        const state = get()
        if (!state.lastInitialized) return 0
        
        const timeSinceInit = Date.now() - state.lastInitialized
        const timeRemaining = HARD_TTL - timeSinceInit
        return Math.max(0, timeRemaining)
      },

      shouldReinitialize: () => {
        const state = get()
        if (!state.isInitialized || !state.lastInitialized) return true

        const timeSinceInit = Date.now() - state.lastInitialized
        
        // 🚨 CRITICAL: Never force logout during active POS transactions
        if (state.posTransactionActive) {
          // ✅ ENTERPRISE: Throttled logging to prevent console spam
          // Only log once every 5 minutes during POS transactions
          const lastLogKey = 'lastPosProtectionLog'
          const lastLogTime = parseInt(sessionStorage.getItem(lastLogKey) || '0')
          const now = Date.now()
          
          if (now - lastLogTime > 5 * 60 * 1000) { // 5 minutes
            logEnterprise('🛡️ POS Transaction Protection: Active (throttled logging)')
            sessionStorage.setItem(lastLogKey, now.toString())
          }
          return false
        }
        
        // 🛡️ PRODUCTION FIX: Check for recent POS activity
        if (state.lastPosActivity) {
          const timeSincePosActivity = Date.now() - state.lastPosActivity
          if (timeSincePosActivity < POS_TRANSACTION_PROTECTION_TTL) {
            // ✅ ENTERPRISE: Throttled activity protection logging
            const lastActivityLogKey = 'lastPosActivityLog'
            const lastActivityLogTime = parseInt(sessionStorage.getItem(lastActivityLogKey) || '0')
            const now = Date.now()
            
            if (now - lastActivityLogTime > 15 * 60 * 1000) { // 15 minutes
              logEnterprise(`🛡️ POS Activity Protection: ${Math.round(timeSincePosActivity / 1000 / 60)} min ago (throttled logging)`)
              sessionStorage.setItem(lastActivityLogKey, now.toString())
            }
            return false
          }
        }

        // ✅ ENTERPRISE: Cache shouldReinitialize result to prevent excessive checking
        const cacheKey = 'shouldReinitializeCache'
        const cached = sessionStorage.getItem(cacheKey)
        if (cached) {
          const { result, timestamp } = JSON.parse(cached)
          // Cache result for 10 minutes
          if (Date.now() - timestamp < 10 * 60 * 1000) {
            return result
          }
        }

        // 🛡️ CRITICAL PRODUCTION FIX: Navigation protection
        // Never require reinitialization during recent navigation to prevent customer search logout
        const navigationProtectionKey = 'lastNavigationTime'
        const lastNavTime = parseInt(sessionStorage.getItem(navigationProtectionKey) || '0')
        const timeSinceNav = Date.now() - lastNavTime
        
        if (timeSinceNav < 30 * 1000) { // 30 seconds protection after navigation
          logEnterprise(`🛡️ Navigation protection: Blocking reinitialization for ${Math.round((30 * 1000 - timeSinceNav) / 1000)}s`)
          return false
        }

        // 🎯 ENTERPRISE: Much more forgiving timing - 24 hour sessions
        const shouldReinit = timeSinceInit > HARD_TTL
        
        // Cache the result
        sessionStorage.setItem(cacheKey, JSON.stringify({
          result: shouldReinit,
          timestamp: Date.now()
        }))
        
        if (shouldReinit) {
          const hoursOld = Math.round(timeSinceInit / 1000 / 60 / 60)
          const limitHours = Math.round(HARD_TTL / 1000 / 60 / 60)
          logEnterprise(`⏰ Enterprise session expired after ${hoursOld}h (limit: ${limitHours}h)`)
        }
        
        return shouldReinit
      }
    }),
    {
      name: 'salon-security-store',
      partialize: state => ({
        // ⚠️ SECURITY: Do NOT persist organizationId or organization
        // These must ALWAYS come from JWT validation, never from cache
        isInitialized: state.isInitialized,
        lastInitialized: state.lastInitialized,
        salonRole: state.salonRole,
        // organizationId: NOT PERSISTED - always from JWT
        permissions: state.permissions,
        userId: state.userId,
        user: state.user,
        // 🎯 POS Transaction Protection - persist for session recovery
        posTransactionActive: state.posTransactionActive,
        lastPosActivity: state.lastPosActivity
        // organization: NOT PERSISTED - always from JWT
      })
    }
  )
)

// Listen for global session clear event from HERAAuthProvider
if (typeof window !== 'undefined') {
  window.addEventListener('hera:session:clear', () => {
    console.log('🧹 Salon store: Received session clear event')
    const state = useSalonSecurityStore.getState()
    if (state.clearState) {
      state.clearState()
      console.log('✅ Salon store: State cleared')
    }
  })
}
