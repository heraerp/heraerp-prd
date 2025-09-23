import { useState, useEffect, useCallback } from 'react'
import { Category, CreateCategoryData, UpdateCategoryData } from '@/types/salon-category'
import { getAuthToken } from '@/lib/api/salon'

interface UseCategoriesPlaybookOptions {
  organizationId?: string
  includeArchived?: boolean
}

export function useCategoriesPlaybook({
  organizationId,
  includeArchived = false
}: UseCategoriesPlaybookOptions) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    if (!organizationId) {
      setCategories([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const token = await getAuthToken()
      if (!token) {
        setError('Not authenticated')
        return
      }

      const params = new URLSearchParams({
        status: includeArchived ? 'all' : 'active',
        sort: 'order_asc'
      })

      const response = await fetch(`/api/playbook/salon/categories?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }

      const data = await response.json()
      setCategories(data.items || [])
    } catch (err) {
      console.error('Failed to fetch categories:', err)
      setError(err instanceof Error ? err.message : 'Failed to load categories')
      setCategories([])
    } finally {
      setIsLoading(false)
    }
  }, [organizationId, includeArchived])

  // Create category
  const createCategory = useCallback(async (data: CreateCategoryData) => {
    const token = await getAuthToken()
    if (!token) {
      throw new Error('Not authenticated')
    }

    const response = await fetch('/api/playbook/salon/categories', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create category')
    }

    const newCategory = await response.json()
    
    // Optimistically add to list
    setCategories(prev => [...prev, newCategory])
    
    // Refresh to get accurate counts
    fetchCategories()
    
    return newCategory
  }, [fetchCategories])

  // Update category
  const updateCategory = useCallback(async (id: string, data: UpdateCategoryData) => {
    const token = await getAuthToken()
    if (!token) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`/api/playbook/salon/categories/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update category')
    }

    // Optimistically update
    setCategories(prev => prev.map(cat => 
      cat.id === id 
        ? { 
            ...cat, 
            entity_name: data.name || cat.entity_name,
            entity_code: data.code || cat.entity_code,
            description: data.description !== undefined ? data.description : cat.description,
            color: data.color || cat.color,
            icon: data.icon || cat.icon,
            sort_order: data.sort_order !== undefined ? data.sort_order : cat.sort_order,
            status: data.status || cat.status
          } 
        : cat
    ))

    // Refresh to ensure consistency
    fetchCategories()
  }, [fetchCategories])

  // Delete category
  const deleteCategory = useCallback(async (id: string) => {
    const token = await getAuthToken()
    if (!token) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`/api/playbook/salon/categories/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete category')
    }

    // Remove from list
    setCategories(prev => prev.filter(cat => cat.id !== id))
  }, [])

  // Archive/unarchive category
  const archiveCategory = useCallback(async (id: string, archived: boolean = true) => {
    await updateCategory(id, { status: archived ? 'archived' : 'active' })
  }, [updateCategory])

  // Effect to fetch on mount/changes
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return {
    categories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    archiveCategory,
    refetch: fetchCategories
  }
}