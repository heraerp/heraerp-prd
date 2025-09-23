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
  persistKey?: string
): UseBranchFilterReturn {
  const { currentOrganization  } = useHERAAuth()
  const [branchId, setBranchIdState] = useState<string | undefined>(defaultBranchId)
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load branches on mount or organization change
  useEffect(() => {
    if (currentOrganization?.id) {
      loadBranches()
    }
  }, [currentOrganization?.id])

  // Handle persistence
  useEffect(() => {
    if (persistKey && typeof window !== 'undefined') {
      const stored = localStorage.getItem(`branch-filter-${persistKey}`)
      if (stored && branches.some(b => b.id === stored)) {
        setBranchIdState(stored)
      }
    }
  }, [persistKey, branches])

  const loadBranches = async () => {
    if (!currentOrganization?.id) return

    setLoading(true)
    setError(null)

    try {
      const branchList = await getOrganizationBranches(currentOrganization.id)
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
    setBranchIdState(newBranchId)

    // Persist if enabled
    if (persistKey && typeof window !== 'undefined') {
      if (newBranchId) {
        localStorage.setItem(`branch-filter-${persistKey}`, newBranchId)
      } else {
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
  const { currentOrganization  } = useHERAAuth()
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
