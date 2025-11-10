/**
 * HERA Calendar Auto-Refresh Hook
 * Smart Code: HERA.HOOKS.CALENDAR.AUTOREFRESH.v1
 *
 * Automatically refetches calendar data when:
 * 1. Page visibility changes (user returns to tab)
 * 2. Window gains focus (user clicks back to window)
 * 3. Storage events occur (cross-tab communication, e.g., POS payment completion)
 *
 * Ported from Salon Calendar's proven auto-refresh system
 */

import { useEffect } from 'react'

export interface UseCalendarAutoRefreshParams {
  refetchFn?: () => void
  storageKey?: string
  enabled?: boolean
}

export function useCalendarAutoRefresh({
  refetchFn,
  storageKey = 'appointment_status_updated',
  enabled = true
}: UseCalendarAutoRefreshParams = {}) {
  useEffect(() => {
    if (!enabled || !refetchFn) return

    // 🔄 VISIBILITY CHANGE: Refetch when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('📡 [AutoRefresh] Page became visible - refetching appointments...')
        refetchFn()
      }
    }

    // 🔄 FOCUS: Refetch when window gains focus
    const handleFocus = () => {
      console.log('📡 [AutoRefresh] Window focused - refetching appointments...')
      refetchFn()
    }

    // 🔄 STORAGE: Refetch on cross-tab communication
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        console.log('📡 [AutoRefresh] Detected appointment update from POS - refreshing...')

        try {
          const updateData = JSON.parse(e.newValue)
          console.log('📋 Update data:', updateData)

          // Refetch to get latest status
          refetchFn()

          // Clear the flag after processing
          localStorage.removeItem(storageKey)
        } catch (err) {
          console.error('[AutoRefresh] Failed to parse appointment update data:', err)
        }
      }
    }

    // 🔄 POPSTATE: Refetch on browser back/forward
    const handleRouteChange = () => {
      const updateFlag = localStorage.getItem(storageKey)
      if (updateFlag) {
        console.log('📡 [AutoRefresh] Found pending appointment update on route change - refreshing...')
        refetchFn()
        localStorage.removeItem(storageKey)
      }
    }

    // ✅ CHECK ON MOUNT: Look for pending updates
    const checkForUpdates = () => {
      const updateFlag = localStorage.getItem(storageKey)
      if (updateFlag) {
        console.log('✅ [AutoRefresh] Found pending appointment update on mount - refreshing...')
        refetchFn()
        localStorage.removeItem(storageKey)
      }
    }

    // Register event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('popstate', handleRouteChange)

    // Check immediately on mount
    checkForUpdates()

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [refetchFn, storageKey, enabled])
}
