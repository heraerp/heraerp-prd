/**
 * HERA Universal Branch/Organization Filter Hook
 * Smart Code: HERA.HOOKS.CALENDAR.BRANCH.FILTER.v1
 *
 * Provides multi-branch filtering for any business vertical
 * Supports head office consolidated view and per-branch filtering
 *
 * Ported from Salon Calendar's useBranchFilter hook
 */

import { useState, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiV2 } from '@/lib/client/fetchV2'

export interface Branch {
  id: string
  organization_code: string
  organization_name: string
  parent_organization_id?: string
}

export interface UseUniversalBranchFilterParams {
  organizationId: string
  storageKey?: string
  enabled?: boolean
}

export function useUniversalBranchFilter({
  organizationId,
  storageKey = 'universal-calendar-branch',
  enabled = true
}: UseUniversalBranchFilterParams) {
  // ✅ PERSISTENT: Load branch selection from localStorage
  const [branchId, setBranchIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && enabled) {
      return localStorage.getItem(storageKey)
    }
    return null
  })

  // ✅ HERA DATA: Fetch branches/sub-organizations
  const {
    data: branches = [],
    isLoading: loading,
    error
  } = useQuery<Branch[]>({
    queryKey: ['branches', organizationId],
    queryFn: async () => {
      try {
        // Fetch sub-organizations (branches)
        const result = await apiV2.get('organizations', {
          parent_organization_id: organizationId
        })

        return result.data || []
      } catch (err) {
        console.error('[BranchFilter] Failed to fetch branches:', err)
        return []
      }
    },
    enabled: enabled && !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes (formerly cacheTime)
  })

  // ✅ HELPER: Check if organization has multiple branches
  const hasMultipleBranches = branches.length > 1

  // ✅ PERSIST: Set branch ID and save to localStorage
  const setBranchId = useCallback(
    (newBranchId: string | null) => {
      setBranchIdState(newBranchId)

      if (typeof window !== 'undefined' && enabled) {
        if (newBranchId) {
          localStorage.setItem(storageKey, newBranchId)
          console.log('📍 [BranchFilter] Branch selected:', newBranchId)
        } else {
          localStorage.removeItem(storageKey)
          console.log('📍 [BranchFilter] Branch cleared (viewing all)')
        }
      }
    },
    [storageKey, enabled]
  )

  // ✅ AUTO-CLEAR: If selected branch no longer exists, clear selection
  useEffect(() => {
    if (branchId && branches.length > 0) {
      const branchExists = branches.some(b => b.id === branchId)
      if (!branchExists) {
        console.log('⚠️ [BranchFilter] Selected branch no longer exists, clearing selection')
        setBranchId(null)
      }
    }
  }, [branchId, branches, setBranchId])

  return {
    branchId,
    setBranchId,
    branches,
    loading,
    error,
    hasMultipleBranches,

    // Helper methods
    clearBranchFilter: () => setBranchId(null),
    getBranchName: (id: string) => branches.find(b => b.id === id)?.organization_name || 'Unknown Branch'
  }
}
