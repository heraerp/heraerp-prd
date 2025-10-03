import { useState, useEffect, useCallback } from 'react'

interface SavedView {
  id: string
  name: string
  data: any
  createdAt: string
  organizationId?: string
  userId?: string
}

interface UseSavedViewsReturn {
  savedViews: SavedView[]
  saveView: (name: string, data: any) => Promise<void>
  deleteView: (id: string) => Promise<void>
  loadView: (id: string) => any
  isLoading: boolean
}

export function useSavedViews(
  context: string,
  organizationId?: string,
  userId?: string
): UseSavedViewsReturn {
  const [savedViews, setSavedViews] = useState<SavedView[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const storageKey = `hera_saved_views_${context}_${organizationId || 'default'}`

  // Load saved views from localStorage
  useEffect(() => {
    setIsLoading(true)
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const views = JSON.parse(stored) as SavedView[]
        setSavedViews(views)
      }
    } catch (error) {
      console.error('Failed to load saved views:', error)
    } finally {
      setIsLoading(false)
    }
  }, [storageKey])

  // Save a new view
  const saveView = useCallback(
    async (name: string, data: any) => {
      const newView: SavedView = {
        id: `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        data,
        createdAt: new Date().toISOString(),
        organizationId,
        userId
      }

      const updatedViews = [...savedViews, newView]
      setSavedViews(updatedViews)

      try {
        localStorage.setItem(storageKey, JSON.stringify(updatedViews))
      } catch (error) {
        console.error('Failed to save view:', error)
        // Revert on error
        setSavedViews(savedViews)
        throw error
      }
    },
    [savedViews, storageKey, organizationId, userId]
  )

  // Delete a view
  const deleteView = useCallback(
    async (id: string) => {
      const updatedViews = savedViews.filter(view => view.id !== id)
      setSavedViews(updatedViews)

      try {
        localStorage.setItem(storageKey, JSON.stringify(updatedViews))
      } catch (error) {
        console.error('Failed to delete view:', error)
        // Revert on error
        setSavedViews(savedViews)
        throw error
      }
    },
    [savedViews, storageKey]
  )

  // Load a view's data
  const loadView = useCallback(
    (id: string) => {
      const view = savedViews.find(v => v.id === id)
      return view?.data || null
    },
    [savedViews]
  )

  return {
    savedViews,
    saveView,
    deleteView,
    loadView,
    isLoading
  }
}
