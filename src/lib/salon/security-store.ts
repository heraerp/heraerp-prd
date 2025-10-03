/**
 * Salon Security Store
 * Persistent security context to prevent re-initialization on navigation
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
        isInitialized: state.isInitialized,
        lastInitialized: state.lastInitialized,
        salonRole: state.salonRole,
        organizationId: state.organizationId,
        permissions: state.permissions,
        userId: state.userId,
        user: state.user,
        organization: state.organization
      })
    }
  )
)
