import { useState, useEffect } from 'react'
import { universalApi } from '@/src/lib/universal-api'

interface Loyalty_programData {
  entity: any
  dynamicFields: any[]
  relationships: any[]
  transactions?: any[]
}

export function useLoyalty_program(organizationId?: string) {
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
      const entitiesRes = await universalApi.getEntities('loyalty_program', organizationId)
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
      console.error('Error fetching loyalty_program data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [organizationId])

  // CRUD operations
  const createLoyalty_program = async (data: any) => {
    if (!organizationId) throw new Error('No organization ID')

    const result = await universalApi.createEntity(
      {
        entity_type: 'loyalty_program',
        entity_name: data.name || data.title || data.description,
        entity_code: `LOYALTY_PROGRAM-${Date.now()}`,
        smart_code: 'HERA.SALON.LOYALTY_PROGRAM.v1',
        status: 'active'
      },
      organizationId
    )

    if (!result.success) throw new Error(result.error)

    // Add dynamic fields
    const fieldPromises = []
    if (data.points_ratio) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'points_ratio',
          data.points_ratio,
          'text',
          organizationId
        )
      )
    }
    if (data.tier_benefits) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'tier_benefits',
          data.tier_benefits,
          'text',
          organizationId
        )
      )
    }
    if (data.expiry_days) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'expiry_days',
          data.expiry_days,
          'text',
          organizationId
        )
      )
    }
    if (data.tier_name) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'tier_name',
          data.tier_name,
          'text',
          organizationId
        )
      )
    }
    if (data.minimum_spend) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'minimum_spend',
          data.minimum_spend,
          'text',
          organizationId
        )
      )
    }

    await Promise.all(fieldPromises)
    await fetchData() // Refresh

    return result.data
  }

  const updateLoyalty_program = async (id: string, updates: any) => {
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
    if (updates.points_ratio !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(
          id,
          'points_ratio',
          updates.points_ratio,
          'text',
          organizationId
        )
      )
    }
    if (updates.tier_benefits !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(
          id,
          'tier_benefits',
          updates.tier_benefits,
          'text',
          organizationId
        )
      )
    }
    if (updates.expiry_days !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(id, 'expiry_days', updates.expiry_days, 'text', organizationId)
      )
    }
    if (updates.tier_name !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(id, 'tier_name', updates.tier_name, 'text', organizationId)
      )
    }
    if (updates.minimum_spend !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(
          id,
          'minimum_spend',
          updates.minimum_spend,
          'text',
          organizationId
        )
      )
    }

    await Promise.all(fieldPromises)
    await fetchData() // Refresh
  }

  const deleteLoyalty_program = async (id: string) => {
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
    createLoyalty_program,
    updateLoyalty_program,
    deleteLoyalty_program
  }
}
