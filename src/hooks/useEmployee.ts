import { useState, useEffect } from 'react'
import { universalApi } from '@/lib/universal-api'

interface EmployeeData {
  entity: any
  dynamicFields: any[]
  relationships: any[]
  transactions?: any[]
}

export function useEmployee(organizationId?: string) {
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
      const entitiesRes = await universalApi.getEntities('employee', organizationId)
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
      console.error('Error fetching employee data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [organizationId])

  // CRUD operations
  const createEmployee = async (data: any) => {
    if (!organizationId) throw new Error('No organization ID')

    const result = await universalApi.createEntity(
      {
        entity_type: 'employee',
        entity_name: data.name,
        entity_code: `EMPLOYEE-${Date.now()}`,
        smart_code: 'HERA.SALON.EMPLOYEE.v1',
        status: 'active'
      },
      organizationId
    )

    if (!result.success) throw new Error(result.error)

    // Add dynamic fields
    const fieldPromises = []
    if (data.email) {
      fieldPromises.push(
        universalApi.setDynamicField(result.data.id, 'email', data.email, 'text', organizationId)
      )
    }
    if (data.phone) {
      fieldPromises.push(
        universalApi.setDynamicField(result.data.id, 'phone', data.phone, 'text', organizationId)
      )
    }
    if (data.role) {
      fieldPromises.push(
        universalApi.setDynamicField(result.data.id, 'role', data.role, 'text', organizationId)
      )
    }
    if (data.specialties) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'specialties',
          data.specialties,
          'text',
          organizationId
        )
      )
    }
    if (data.hourly_rate) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'hourly_rate',
          data.hourly_rate,
          'text',
          organizationId
        )
      )
    }
    if (data.commission_rate) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'commission_rate',
          data.commission_rate,
          'text',
          organizationId
        )
      )
    }

    await Promise.all(fieldPromises)
    await fetchData() // Refresh

    return result.data
  }

  const updateEmployee = async (id: string, updates: any) => {
    // Implementation here
  }

  const deleteEmployee = async (id: string) => {
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
    createEmployee,
    updateEmployee,
    deleteEmployee
  }
}
