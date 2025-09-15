import { useState, useEffect } from 'react'
import { universalApi } from '@/lib/universal-api'

interface ServiceData {
  entity: any
  dynamicFields: any[]
  relationships: any[]
  transactions?: any[]
}

export function useService(organizationId?: string) {
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
      const entitiesRes = await universalApi.getEntities('service', organizationId)
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
      console.error('Error fetching service data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [organizationId])

  // CRUD operations
  const createService = async (data: any) => {
    if (!organizationId) throw new Error('No organization ID')

    const result = await universalApi.createEntity(
      {
        entity_type: 'service',
        entity_name: data.name || data.title || data.description,
        entity_code: `SERVICE-${Date.now()}`,
        smart_code: 'HERA.SALON.SERVICE.v1',
        status: 'active'
      },
      organizationId
    )

    if (!result.success) throw new Error(result.error)

    // Add dynamic fields
    const fieldPromises = []
    if (data.name) {
      fieldPromises.push(
        universalApi.setDynamicField(result.data.id, 'name', data.name, 'text', organizationId)
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
    if (data.price) {
      fieldPromises.push(
        universalApi.setDynamicField(result.data.id, 'price', data.price, 'text', organizationId)
      )
    }
    if (data.duration) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'duration',
          data.duration,
          'text',
          organizationId
        )
      )
    }
    if (data.description) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'description',
          data.description,
          'text',
          organizationId
        )
      )
    }
    if (data.requires_license) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'requires_license',
          data.requires_license,
          'text',
          organizationId
        )
      )
    }

    await Promise.all(fieldPromises)
    await fetchData() // Refresh

    return result.data
  }

  const updateService = async (id: string, updates: any) => {
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
    if (updates.name !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(id, 'name', updates.name, 'text', organizationId)
      )
    }
    if (updates.category !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(id, 'category', updates.category, 'text', organizationId)
      )
    }
    if (updates.price !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(id, 'price', updates.price, 'text', organizationId)
      )
    }
    if (updates.duration !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(id, 'duration', updates.duration, 'text', organizationId)
      )
    }
    if (updates.description !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(id, 'description', updates.description, 'text', organizationId)
      )
    }
    if (updates.requires_license !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(
          id,
          'requires_license',
          updates.requires_license,
          'text',
          organizationId
        )
      )
    }

    await Promise.all(fieldPromises)
    await fetchData() // Refresh
  }

  const deleteService = async (id: string) => {
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
    createService,
    updateService,
    deleteService
  }
}
