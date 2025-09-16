import { useState, useEffect } from 'react'
import { universalApi } from '@/src/lib/universal-api'

interface AppointmentData {
  entity: any
  dynamicFields: any[]
  relationships: any[]
  transactions?: any[]
}

export function useAppointment(organizationId?: string) {
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
      const entitiesRes = await universalApi.getEntities('appointment', organizationId)
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
      console.error('Error fetching appointment data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [organizationId])

  // CRUD operations
  const createAppointment = async (data: any) => {
    if (!organizationId) throw new Error('No organization ID')

    const result = await universalApi.createEntity(
      {
        entity_type: 'appointment',
        entity_name: data.name,
        entity_code: `APPOINTMENT-${Date.now()}`,
        smart_code: 'HERA.SALON.APPOINTMENT.v1',
        status: 'active'
      },
      organizationId
    )

    if (!result.success) throw new Error(result.error)

    // Add dynamic fields
    const fieldPromises = []
    if (data.date) {
      fieldPromises.push(
        universalApi.setDynamicField(result.data.id, 'date', data.date, 'text', organizationId)
      )
    }
    if (data.time) {
      fieldPromises.push(
        universalApi.setDynamicField(result.data.id, 'time', data.time, 'text', organizationId)
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
    if (data.notes) {
      fieldPromises.push(
        universalApi.setDynamicField(result.data.id, 'notes', data.notes, 'text', organizationId)
      )
    }
    if (data.status) {
      fieldPromises.push(
        universalApi.setDynamicField(result.data.id, 'status', data.status, 'text', organizationId)
      )
    }

    await Promise.all(fieldPromises)
    await fetchData() // Refresh

    return result.data
  }

  const updateAppointment = async (id: string, updates: any) => {
    // Implementation here
  }

  const deleteAppointment = async (id: string) => {
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
    createAppointment,
    updateAppointment,
    deleteAppointment
  }
}
