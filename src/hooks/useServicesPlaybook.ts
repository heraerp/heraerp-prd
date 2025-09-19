import { useState, useEffect, useCallback, useMemo } from 'react'
import { useDebounce } from 'use-debounce'
import {
  listServices,
  createService,
  updateService,
  archiveService,
  upsertDynamicData,
  getDynamicData
} from '@/lib/playbook/services'
import { ServiceEntity, ServiceWithDynamicData } from '@/schemas/service'
import { toast } from 'sonner'

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
  const [error, setError] = useState<Error | null>(null)

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
      // Fetch services
      const result = await listServices({
        organization_id: organizationId,
        branch_id: branchId,
        q: debouncedQuery,
        status,
        category_id: categoryId,
        sort,
        limit: pageSize,
        offset
      })

      // If no services, set empty and return
      if (!result.items.length) {
        setItems([])
        setTotal(result.total)
        setIsLoading(false)
        return
      }

      // Get entity IDs
      const entityIds = result.items.map(item => item.id)

      // Fetch dynamic data in parallel
      const [priceData, taxData, commissionData] = await Promise.all([
        getDynamicData(entityIds, 'HERA.SALON.SERVICE.PRICE.V1'),
        getDynamicData(entityIds, 'HERA.SALON.SERVICE.TAX.V1'),
        getDynamicData(entityIds, 'HERA.SALON.SERVICE.COMMISSION.V1')
      ]).catch(() => [{}, {}, {}]) // Gracefully handle failures

      // Merge dynamic data with services
      const enrichedItems = result.items.map(item => {
        const price = priceData[item.id]
        const tax = taxData[item.id]
        const commission = commissionData[item.id]

        return {
          ...item,
          price: price?.value,
          currency: price?.currency || 'AED',
          tax_rate: tax?.rate,
          commission_type: commission?.type,
          commission_value: commission?.value
        } as ServiceWithDynamicData
      })

      setItems(enrichedItems)
      setTotal(result.total)
    } catch (err) {
      console.error('Failed to fetch services:', err)
      setError(err as Error)
      toast.error('Failed to load services')
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
      tax_rate?: number
      commission_type?: 'flat' | 'percent'
      commission_value?: number
    }) => {
      if (!organizationId) throw new Error('Organization ID required')

      try {
        // Create service entity
        const service = await createService({
          organization_id: organizationId,
          name: data.name,
          code: data.code,
          duration_mins: data.duration_mins,
          category: data.category,
          metadata: data.metadata
        })

        // Save dynamic data
        const dynamicPromises = []

        if (data.price !== undefined) {
          dynamicPromises.push(
            upsertDynamicData(service.id, 'HERA.SALON.SERVICE.PRICE.V1', {
              value: data.price,
              currency: data.currency || 'AED',
              effective_from: new Date().toISOString()
            })
          )
        }

        if (data.tax_rate !== undefined) {
          dynamicPromises.push(
            upsertDynamicData(service.id, 'HERA.SALON.SERVICE.TAX.V1', {
              rate: data.tax_rate
            })
          )
        }

        if (data.commission_type && data.commission_value !== undefined) {
          dynamicPromises.push(
            upsertDynamicData(service.id, 'HERA.SALON.SERVICE.COMMISSION.V1', {
              type: data.commission_type,
              value: data.commission_value
            })
          )
        }

        await Promise.all(dynamicPromises)

        toast.success('Service created successfully')
        await fetchServices() // Refresh list
        return service
      } catch (error) {
        console.error('Failed to create service:', error)
        toast.error('Failed to create service')
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
        tax_rate?: number
        commission_type?: 'flat' | 'percent'
        commission_value?: number
      }
    ) => {
      try {
        // Update service entity
        const { price, currency, tax_rate, commission_type, commission_value, ...entityData } = data

        if (Object.keys(entityData).length > 0) {
          await updateService(id, entityData)
        }

        // Update dynamic data
        const dynamicPromises = []

        if (price !== undefined) {
          dynamicPromises.push(
            upsertDynamicData(id, 'HERA.SALON.SERVICE.PRICE.V1', {
              value: price,
              currency: currency || 'AED',
              effective_from: new Date().toISOString()
            })
          )
        }

        if (tax_rate !== undefined) {
          dynamicPromises.push(
            upsertDynamicData(id, 'HERA.SALON.SERVICE.TAX.V1', {
              rate: tax_rate
            })
          )
        }

        if (commission_type && commission_value !== undefined) {
          dynamicPromises.push(
            upsertDynamicData(id, 'HERA.SALON.SERVICE.COMMISSION.V1', {
              type: commission_type,
              value: commission_value
            })
          )
        }

        await Promise.all(dynamicPromises)

        toast.success('Service updated successfully')
        await fetchServices() // Refresh list
      } catch (error) {
        console.error('Failed to update service:', error)
        toast.error('Failed to update service')
        throw error
      }
    },
    [fetchServices]
  )

  // Archive/restore helpers
  const archiveMany = useCallback(
    async (ids: string[]) => {
      try {
        await Promise.all(ids.map(id => archiveService(id, true)))
        toast.success(`Archived ${ids.length} service${ids.length === 1 ? '' : 's'}`)
        await fetchServices()
      } catch (error) {
        console.error('Failed to archive services:', error)
        toast.error('Failed to archive services')
        throw error
      }
    },
    [fetchServices]
  )

  const restoreMany = useCallback(
    async (ids: string[]) => {
      try {
        await Promise.all(ids.map(id => archiveService(id, false)))
        toast.success(`Restored ${ids.length} service${ids.length === 1 ? '' : 's'}`)
        await fetchServices()
      } catch (error) {
        console.error('Failed to restore services:', error)
        toast.error('Failed to restore services')
        throw error
      }
    },
    [fetchServices]
  )

  // Export CSV helper
  const exportCSV = useCallback(() => {
    const headers = [
      'Name',
      'Code',
      'Category',
      'Duration (mins)',
      'Price',
      'Tax Rate',
      'Commission',
      'Status'
    ]
    const rows = items.map(item => [
      item.name,
      item.code || '',
      item.category || '',
      item.duration_mins || '',
      item.price || '',
      item.tax_rate ? `${item.tax_rate}%` : '',
      item.commission_value
        ? `${item.commission_value}${item.commission_type === 'percent' ? '%' : ` ${item.currency}`}`
        : '',
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

    toast.success('Services exported to CSV')
  }, [items])

  return {
    items,
    total,
    isLoading,
    error,
    createOne,
    updateOne,
    archiveMany,
    restoreMany,
    exportCSV,
    refetch: fetchServices
  }
}
