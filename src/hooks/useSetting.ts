import { useState, useEffect } from 'react'
import { universalApi } from '@/lib/universal-api'

interface SettingData {
  entity: any
  dynamicFields: any[]
  relationships: any[]
  transactions?: any[]
}

export function useSetting(organizationId?: string) {
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
      const entitiesRes = await universalApi.getEntities('setting', organizationId)
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
      console.error('Error fetching setting data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [organizationId])

  // CRUD operations
  const createSetting = async (data: any) => {
    if (!organizationId) throw new Error('No organization ID')

    const result = await universalApi.createEntity(
      {
        entity_type: 'setting',
        entity_name: data.name || data.title || data.description,
        entity_code: `SETTING-${Date.now()}`,
        smart_code: 'HERA.SALON.SETTING.v1',
        status: 'active'
      },
      organizationId
    )

    if (!result.success) throw new Error(result.error)

    // Add dynamic fields
    const fieldPromises = []
    if (data.setting_key) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'setting_key',
          data.setting_key,
          'text',
          organizationId
        )
      )
    }
    if (data.setting_value) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'setting_value',
          data.setting_value,
          'text',
          organizationId
        )
      )
    }
    if (data.setting_type) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'setting_type',
          data.setting_type,
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
    if (data.updated_by) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'updated_by',
          data.updated_by,
          'text',
          organizationId
        )
      )
    }

    await Promise.all(fieldPromises)
    await fetchData() // Refresh

    return result.data
  }

  const updateSetting = async (id: string, updates: any) => {
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
    if (updates.setting_key !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(id, 'setting_key', updates.setting_key, 'text', organizationId)
      )
    }
    if (updates.setting_value !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(
          id,
          'setting_value',
          updates.setting_value,
          'text',
          organizationId
        )
      )
    }
    if (updates.setting_type !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(
          id,
          'setting_type',
          updates.setting_type,
          'text',
          organizationId
        )
      )
    }
    if (updates.description !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(id, 'description', updates.description, 'text', organizationId)
      )
    }
    if (updates.updated_by !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(id, 'updated_by', updates.updated_by, 'text', organizationId)
      )
    }

    await Promise.all(fieldPromises)
    await fetchData() // Refresh
  }

  const deleteSetting = async (id: string) => {
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
    createSetting,
    updateSetting,
    deleteSetting
  }
}
