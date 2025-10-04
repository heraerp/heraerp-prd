/**
 * Branch Filter Hook
 * Smart Code: HERA.HOOKS.BRANCH.FILTER.V1
 *
 * Provides branch filtering capabilities for UI components:
 * - Branch selection state management
 * - Branch list loading
 * - Persistence options
 */

import { useState, useEffect } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { getOrganizationBranches } from '@/lib/guardrails/branch'

export interface Branch {
  id: string
  name: string
  code?: string
}

export interface UseBranchFilterReturn {
  // State
  branchId: string | undefined
  branches: Branch[]
  loading: boolean
  error: string | null

  // Actions
  setBranchId: (branchId: string | undefined) => void
  refreshBranches: () => Promise<void>

  // Helpers
  selectedBranch: Branch | undefined
  hasMultipleBranches: boolean
}

export function useBranchFilter(
  defaultBranchId?: string,
  persistKey?: string,
  organizationId?: string
): UseBranchFilterReturn {
  const { currentOrganization } = useHERAAuth()
  const effectiveOrgId = organizationId || currentOrganization?.id
  
  // Initialize with persisted value or default to undefined (shows all)
  const [branchId, setBranchIdState] = useState<string | undefined>(() => {
    // Only persist if persistKey is explicitly provided
    if (persistKey && typeof window !== 'undefined') {
      const stored = localStorage.getItem(`branch-filter-${persistKey}`)
      // Only use stored value if it's valid and not 'all'
      if (stored && stored !== 'undefined' && stored !== 'null' && stored !== 'all') {
        return stored
      }
    }
    // Default to undefined (which means 'all') unless defaultBranchId is provided
    return defaultBranchId || undefined
  })
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load branches on mount or organization change
  useEffect(() => {
    if (effectiveOrgId) {
      loadBranches()
    }
  }, [effectiveOrgId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Validate persisted branch ID when branches are loaded
  useEffect(() => {
    if (persistKey && typeof window !== 'undefined' && branches.length > 0 && branchId && branchId !== 'all') {
      // Check if the current branchId is still valid
      if (!branches.some(b => b.id === branchId)) {
        console.log('📍 Stored branch no longer exists, clearing filter:', branchId)
        setBranchIdState(undefined) // Reset to undefined (show all)
        localStorage.removeItem(`branch-filter-${persistKey}`) // Clear persistence
      }
    }
  }, [persistKey, branches, branchId])

  const loadBranches = async () => {
    if (!effectiveOrgId) {
      console.log('useBranchFilter: No organization ID, skipping branch load')
      return
    }

    setLoading(true)
    setError(null)
    console.log('useBranchFilter: Loading branches for org:', effectiveOrgId)

    try {
      const branchList = await getOrganizationBranches(effectiveOrgId)
      console.log('useBranchFilter: Loaded branches:', branchList)
      setBranches(branchList)

      // Auto-select if only one branch
      if (branchList.length === 1 && !branchId) {
        setBranchIdState(branchList[0].id)
      }
    } catch (err) {
      console.error('Error loading branches:', err)
      setError('Failed to load branches')
      setBranches([])
    } finally {
      setLoading(false)
    }
  }

  const setBranchId = (newBranchId: string | undefined) => {
    // Keep undefined as undefined (don't normalize to 'all')
    setBranchIdState(newBranchId)

    // Persist if enabled
    if (persistKey && typeof window !== 'undefined') {
      if (newBranchId && newBranchId !== 'undefined' && newBranchId !== 'all') {
        // Only persist specific branch selections
        localStorage.setItem(`branch-filter-${persistKey}`, newBranchId)
      } else {
        // Clear persistence for 'all' or undefined
        localStorage.removeItem(`branch-filter-${persistKey}`)
      }
    }
  }

  const selectedBranch = branches.find(b => b.id === branchId)
  const hasMultipleBranches = branches.length > 1

  return {
    branchId,
    branches,
    loading,
    error,
    setBranchId,
    refreshBranches: loadBranches,
    selectedBranch,
    hasMultipleBranches
  }
}

/**
 * Hook for branch comparison mode
 * Allows selecting multiple branches for comparison
 */
export function useBranchComparison() {
  const { currentOrganization } = useHERAAuth()
  const [selectedBranches, setSelectedBranches] = useState<Set<string>>(new Set())
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentOrganization?.id) {
      loadBranches()
    }
  }, [currentOrganization?.id])

  const loadBranches = async () => {
    if (!currentOrganization?.id) return

    setLoading(true)
    try {
      const branchList = await getOrganizationBranches(currentOrganization.id)
      setBranches(branchList)

      // Select all by default for comparison
      if (branchList.length > 0) {
        setSelectedBranches(new Set(branchList.map(b => b.id)))
      }
    } catch (err) {
      console.error('Error loading branches:', err)
      setBranches([])
    } finally {
      setLoading(false)
    }
  }

  const toggleBranch = (branchId: string) => {
    setSelectedBranches(prev => {
      const next = new Set(prev)
      if (next.has(branchId)) {
        next.delete(branchId)
      } else {
        next.add(branchId)
      }
      return next
    })
  }

  const selectAll = () => {
    setSelectedBranches(new Set(branches.map(b => b.id)))
  }

  const deselectAll = () => {
    setSelectedBranches(new Set())
  }

  return {
    branches,
    selectedBranches: Array.from(selectedBranches),
    loading,
    toggleBranch,
    selectAll,
    deselectAll,
    isSelected: (branchId: string) => selectedBranches.has(branchId)
  }
}
