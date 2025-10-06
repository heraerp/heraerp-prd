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

  // Check if we need to re-initialize (e.g., after 30 minutes)
  shouldReinitialize: () => boolean
}

const REINIT_INTERVAL = 30 * 60 * 1000 // 30 minutes

export const useSalonSecurityStore = create<SalonSecurityState>()(
  persist(
    (set, get) => ({
      isInitialized: false,
      lastInitialized: null,
      salonRole: null,
      organizationId: null,
      permissions: null,
      userId: null,

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
          organization: null
        })
      },

      shouldReinitialize: () => {
        const state = get()
        if (!state.isInitialized || !state.lastInitialized) return true

        // Re-initialize if more than 30 minutes have passed
        const timeSinceInit = Date.now() - state.lastInitialized
        return timeSinceInit > REINIT_INTERVAL
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
        user: state.user
        // organization: NOT PERSISTED - always from JWT
      })
    }
  )
)
