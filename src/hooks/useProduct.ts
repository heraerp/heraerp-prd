import { useState, useEffect } from 'react'
import { universalApi } from '@/lib/universal-api'

interface ProductData {
  entity: any
  dynamicFields: any[]
  relationships: any[]
  transactions?: any[]
}

export function useProduct(organizationId?: string) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  })

  const fetchData = async () => {
    if (!organizationId) return

    try {
      setLoading(true)
      setError(null)

      // 1. Get entities
      const entitiesRes = await universalApi.getEntities('product', organizationId)
      if (!entitiesRes.success) throw new Error(entitiesRes.error)

      const entities = entitiesRes.data || []
      const entityIds = entities.map(e => e.id)

      if (entityIds.length === 0) {
        setItems([])
        setStats({ total: 0, active: 0, inactive: 0 })
        return
      }

      // 2. Get dynamic fields
      const fieldsPromises = entityIds.map(id => universalApi.getDynamicFields(id, organizationId))
      const fieldsResults = await Promise.all(fieldsPromises)

      // 3. Get relationships
      const relPromises = entityIds.map(id => universalApi.getRelationships(id, organizationId))
      const relResults = await Promise.all(relPromises)

      // 4. Transform data
      const transformedItems = entities.map((entity, index) => ({
        entity,
        dynamicFields: fieldsResults[index].data || [],
        relationships: relResults[index].data || []
      }))

      setItems(transformedItems)

      // Calculate stats
      setStats({
        total: entities.length,
        active: entities.filter(e => e.status === 'active').length,
        inactive: entities.filter(e => e.status === 'inactive').length
      })
    } catch (err) {
      console.error('Error fetching product data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [organizationId])

  // CRUD operations
  const createProduct = async (data: any) => {
    if (!organizationId) throw new Error('No organization ID')

    const result = await universalApi.createEntity(
      {
        entity_type: 'product',
        entity_name: data.name || data.title || data.description,
        entity_code: `PRODUCT-${Date.now()}`,
        smart_code: 'HERA.SALON.PRODUCT.v1',
        status: 'active'
      },
      organizationId
    )

    if (!result.success) throw new Error(result.error)

    // Add dynamic fields
    const fieldPromises = []
    if (data.sku) {
      fieldPromises.push(
        universalApi.setDynamicField(result.data.id, 'sku', data.sku, 'text', organizationId)
      )
    }
    if (data.price) {
      fieldPromises.push(
        universalApi.setDynamicField(result.data.id, 'price', data.price, 'text', organizationId)
      )
    }
    if (data.cost) {
      fieldPromises.push(
        universalApi.setDynamicField(result.data.id, 'cost', data.cost, 'text', organizationId)
      )
    }
    if (data.stock_level) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'stock_level',
          data.stock_level,
          'text',
          organizationId
        )
      )
    }
    if (data.reorder_point) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'reorder_point',
          data.reorder_point,
          'text',
          organizationId
        )
      )
    }
    if (data.category) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'category',
          data.category,
          'text',
          organizationId
        )
      )
    }
    if (data.location) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'location',
          data.location,
          'text',
          organizationId
        )
      )
    }

    await Promise.all(fieldPromises)
    await fetchData() // Refresh

    return result.data
  }

  const updateProduct = async (id: string, updates: any) => {
    if (!organizationId) throw new Error('No organization ID')

    // Update entity
    if (updates.name || updates.status) {
      const entityUpdate = await universalApi.updateEntity(
        id,
        {
          entity_name: updates.name,
          status: updates.status
        },
        organizationId
      )

      if (!entityUpdate.success) throw new Error(entityUpdate.error)
    }

    // Update dynamic fields
    const fieldPromises = []
    if (updates.sku !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(id, 'sku', updates.sku, 'text', organizationId)
      )
    }
    if (updates.price !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(id, 'price', updates.price, 'text', organizationId)
      )
    }
    if (updates.cost !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(id, 'cost', updates.cost, 'text', organizationId)
      )
    }
    if (updates.stock_level !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(id, 'stock_level', updates.stock_level, 'text', organizationId)
      )
    }
    if (updates.reorder_point !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(
          id,
          'reorder_point',
          updates.reorder_point,
          'text',
          organizationId
        )
      )
    }
    if (updates.category !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(id, 'category', updates.category, 'text', organizationId)
      )
    }
    if (updates.location !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(id, 'location', updates.location, 'text', organizationId)
      )
    }

    await Promise.all(fieldPromises)
    await fetchData() // Refresh
  }

  const deleteProduct = async (id: string) => {
    if (!organizationId) throw new Error('No organization ID')

    const result = await universalApi.deleteEntity(id, organizationId)
    if (!result.success) throw new Error(result.error)

    await fetchData() // Refresh
  }

  return {
    items,
    loading,
    error,
    stats,
    refetch: fetchData,
    createProduct,
    updateProduct,
    deleteProduct
  }
}
