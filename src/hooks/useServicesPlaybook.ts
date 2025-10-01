import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from 'use-debounce'
import {
  createService,
  updateService,
  archiveService,
  deleteService,
  upsertDynamicData
} from '@/lib/playbook/services'
import { ServiceWithDynamicData } from '@/schemas/service'
import { showPlaybookError, showPlaybookSuccess } from '@/lib/playbook/error-toast'
import { fetchSalonServices, getAuthToken } from '@/lib/api/salon'

interface UseServicesPlaybookOptions {
  organizationId?: string
  branchId?: string
  query: string
  status: 'active' | 'archived' | 'all'
  categoryId?: string
  page: number
  pageSize: number
  sort: string
}

export function useServicesPlaybook({
  organizationId,
  branchId,
  query,
  status,
  categoryId,
  page,
  pageSize,
  sort
}: UseServicesPlaybookOptions) {
  const [items, setItems] = useState<ServiceWithDynamicData[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Debounce search query
  const [debouncedQuery] = useDebounce(query, 300)

  // Calculate offset from page
  const offset = (page - 1) * pageSize

  // Fetch services and dynamic data
  const fetchServices = useCallback(async () => {
    if (!organizationId) {
      setItems([])
      setTotal(0)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Get auth token
      const token = await getAuthToken()
      if (!token) {
        setError('Not authenticated')
        setItems([])
        setTotal(0)
        return
      }

      // Map sort parameter to server format
      let serverSort: 'name_asc' | 'name_desc' | 'updated_desc' | 'updated_asc' | undefined
      if (sort) {
        const [field, direction] = sort.split(':')
        if (field === 'name') {
          serverSort = direction === 'asc' ? 'name_asc' : 'name_desc'
        } else if (field === 'updated_at') {
          serverSort = direction === 'asc' ? 'updated_asc' : 'updated_desc'
        }
      }

      // Fetch services from Playbook server with server-side filtering
      const params: Parameters<typeof fetchSalonServices>[0] = {
        token,
        limit: pageSize,
        offset
      }

      // Only add optional params if they have values
      if (debouncedQuery) params.q = debouncedQuery
      if (status !== 'all') params.status = status
      if (categoryId) params.category = categoryId
      if (branchId) params.branchId = branchId
      if (serverSort) params.sort = serverSort

      const { items: rawServices, total_count } = await fetchSalonServices(params)

      console.log('Raw services from API:', rawServices)

      // Server now handles all filtering including branch
      // No client-side filtering needed anymore
      let filteredServices = [...rawServices]

      // Map to ServiceWithDynamicData format expected by UI
      const enrichedItems = filteredServices.map((service): ServiceWithDynamicData => {
        // Extract values from dynamic data (no metadata fallback)
        // Price is now a JSON object from service.base_price
        const priceData = service.price as {
          amount?: number
          currency_code?: string
          tax_inclusive?: boolean
        } | null
        const priceValue = priceData?.amount ?? service.base_fee ?? 0
        const currency = priceData?.currency_code ?? 'AED'

        // Duration is now a direct number from service.duration_minutes
        const duration = service.duration_minutes ?? 0

        // Category is a direct string value
        const category = service.category ?? null

        const result: ServiceWithDynamicData = {
          // Core entity fields
          id: service.id,
          organization_id: organizationId,
          smart_code: service.smartCode, // The salon.ts mapRowToService maps smart_code to smartCode
          name: service.name,
          status: service.status as 'active' | 'archived'
        }

        // Add optional fields only if they have values
        if (service.code) result.code = service.code
        if (duration > 0) result.duration_mins = Number(duration)
        if (category) result.category = category
        if (priceValue > 0) result.price = Number(priceValue)
        if (currency) result.currency = currency
        if (service.created_at) result.created_at = service.created_at
        if (service.updated_at) result.updated_at = service.updated_at

        // Always add metadata
        result.metadata = {
          ...(category ? { category } : {}),
          ...(priceData ? { price: priceValue, currency: currency } : {})
        }

        return result
      })

      console.log('Enriched items:', enrichedItems)

      setItems(enrichedItems)
      setTotal(total_count) // Use server-provided total count
    } catch (err) {
      console.error('Failed to fetch services:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load services'
      setError(errorMessage)
      showPlaybookError(err instanceof Error ? err : errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [organizationId, branchId, debouncedQuery, status, categoryId, sort, pageSize, offset])

  // Refetch when dependencies change
  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  // Create service helper
  const createOne = useCallback(
    async (data: {
      name: string
      code?: string
      duration_mins?: number
      category?: string
      metadata?: any
      price?: number
      currency?: string
    }) => {
      if (!organizationId) throw new Error('Organization ID required')

      try {
        // Create service entity
        const createParams: Parameters<typeof createService>[0] = {
          organization_id: organizationId,
          name: data.name
        }

        if (data.code) createParams.code = data.code
        if (data.duration_mins) createParams.duration_mins = data.duration_mins
        if (data.category) createParams.category = data.category
        if (data.metadata) createParams.metadata = data.metadata

        const serviceResult = await createService(createParams)

        if (!serviceResult.ok) {
          throw new Error(serviceResult.error || 'Failed to create service')
        }

        const service = serviceResult.data

        // Save dynamic data
        const dynamicPromises = []

        if (data.price !== undefined) {
          dynamicPromises.push(
            upsertDynamicData(service.id, 'HERA.SALON.SERVICE.CATALOG.PRICE.V1', {
              amount: data.price,
              currency_code: data.currency || 'AED',
              tax_inclusive: false
            })
          )
        }

        if (data.duration_mins !== undefined) {
          dynamicPromises.push(
            upsertDynamicData(
              service.id,
              'HERA.SALON.SERVICE.CATALOG.DURATION.V1',
              data.duration_mins
            )
          )
        }

        if (data.category) {
          dynamicPromises.push(
            upsertDynamicData(service.id, 'HERA.SALON.SERVICE.CATALOG.CATEGORY.V1', data.category)
          )
        }

        await Promise.all(dynamicPromises)

        // Success handled by parent component
        await fetchServices() // Refresh list
        return service
      } catch (error) {
        console.error('Failed to create service:', error)
        showPlaybookError(error instanceof Error ? error : 'Failed to create service')
        throw error
      }
    },
    [organizationId, fetchServices]
  )

  // Update service helper
  const updateOne = useCallback(
    async (
      id: string,
      data: {
        name?: string
        code?: string
        duration_mins?: number
        category?: string
        metadata?: any
        price?: number
        currency?: string
      }
    ) => {
      try {
        // Update service entity
        const { price, currency, duration_mins, category, ...entityData } = data

        // Update entity fields if there are any
        if (Object.keys(entityData).length > 0) {
          const updateResult = await updateService(id, entityData)
          if (!updateResult.ok) {
            throw new Error(updateResult.error || 'Failed to update service')
          }
        }

        // Update dynamic data
        const dynamicPromises = []

        if (price !== undefined) {
          dynamicPromises.push(
            upsertDynamicData(id, 'HERA.SALON.SERVICE.CATALOG.PRICE.V1', {
              amount: price,
              currency_code: currency || 'AED',
              tax_inclusive: false
            })
          )
        }

        if (duration_mins !== undefined) {
          dynamicPromises.push(
            upsertDynamicData(id, 'HERA.SALON.SERVICE.CATALOG.DURATION.V1', duration_mins)
          )
        }

        if (category !== undefined) {
          dynamicPromises.push(
            upsertDynamicData(id, 'HERA.SALON.SERVICE.CATALOG.CATEGORY.V1', category)
          )
        }

        await Promise.all(dynamicPromises)

        // Success handled by parent component
        await fetchServices() // Refresh list
      } catch (error) {
        console.error('Failed to update service:', error)
        showPlaybookError(error instanceof Error ? error : 'Failed to update service')
        throw error
      }
    },
    [fetchServices]
  )

  // Archive/restore helpers
  const archiveMany = useCallback(
    async (ids: string[]) => {
      try {
        const results = await Promise.all(ids.map(id => archiveService(id, true)))
        const failed = results.filter(r => !r.ok).length

        if (failed > 0) {
          throw new Error(`Failed to archive ${failed} of ${ids.length} services`)
        }

        await fetchServices()
      } catch (error) {
        console.error('Failed to archive services:', error)
        showPlaybookError('Failed to archive services')
        throw error
      }
    },
    [fetchServices]
  )

  const restoreMany = useCallback(
    async (ids: string[]) => {
      try {
        const results = await Promise.all(ids.map(id => archiveService(id, false)))
        const failed = results.filter(r => !r.ok).length

        if (failed > 0) {
          throw new Error(`Failed to restore ${failed} of ${ids.length} services`)
        }

        await fetchServices()
      } catch (error) {
        console.error('Failed to restore services:', error)
        showPlaybookError('Failed to restore services')
        throw error
      }
    },
    [fetchServices]
  )

  // Delete single service
  const deleteOne = useCallback(
    async (id: string) => {
      try {
        const result = await deleteService(id)

        if (!result.ok) {
          throw new Error(result.error || 'Failed to delete service')
        }

        // Success handled by parent component
        await fetchServices() // Refresh list
      } catch (error) {
        console.error('Failed to delete service:', error)
        showPlaybookError(error instanceof Error ? error : 'Failed to delete service')
        throw error
      }
    },
    [fetchServices]
  )

  // Delete multiple services
  const deleteMany = useCallback(
    async (ids: string[]) => {
      try {
        const results = await Promise.all(ids.map(id => deleteService(id)))
        const failed = results.filter(r => !r.ok).length

        if (failed > 0) {
          throw new Error(`Failed to delete ${failed} of ${ids.length} services`)
        }

        await fetchServices()
      } catch (error) {
        console.error('Failed to delete services:', error)
        showPlaybookError('Failed to delete services')
        throw error
      }
    },
    [fetchServices]
  )

  // Export CSV helper
  const exportCSV = useCallback(() => {
    const headers = ['Name', 'Code', 'Category', 'Duration (mins)', 'Price', 'Status']
    const rows = items.map(item => [
      item.name,
      item.code || '',
      item.category || '',
      item.duration_mins || '',
      item.price || '',
      item.status
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `services-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    // Success handled by parent component
  }, [items])

  return {
    items,
    total,
    isLoading,
    error,
    createOne,
    updateOne,
    deleteOne,
    archiveMany,
    restoreMany,
    deleteMany,
    exportCSV,
    refetch: fetchServices
  }
}
