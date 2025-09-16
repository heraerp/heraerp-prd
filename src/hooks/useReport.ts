import { useState, useEffect } from 'react'
import { universalApi } from '@/src/lib/universal-api'

interface ReportData {
  entity: any
  dynamicFields: any[]
  relationships: any[]
  transactions?: any[]
}

export function useReport(organizationId?: string) {
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
      const entitiesRes = await universalApi.getEntities('report', organizationId)
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
      console.error('Error fetching report data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [organizationId])

  // CRUD operations
  const createReport = async (data: any) => {
    if (!organizationId) throw new Error('No organization ID')

    const result = await universalApi.createEntity(
      {
        entity_type: 'report',
        entity_name: data.name || data.title || data.description,
        entity_code: `REPORT-${Date.now()}`,
        smart_code: 'HERA.SALON.REPORT.v1',
        status: 'active'
      },
      organizationId
    )

    if (!result.success) throw new Error(result.error)

    // Add dynamic fields
    const fieldPromises = []
    if (data.report_type) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'report_type',
          data.report_type,
          'text',
          organizationId
        )
      )
    }
    if (data.frequency) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'frequency',
          data.frequency,
          'text',
          organizationId
        )
      )
    }
    if (data.parameters) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'parameters',
          data.parameters,
          'text',
          organizationId
        )
      )
    }
    if (data.last_run) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'last_run',
          data.last_run,
          'text',
          organizationId
        )
      )
    }
    if (data.recipients) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'recipients',
          data.recipients,
          'text',
          organizationId
        )
      )
    }
    if (data.format) {
      fieldPromises.push(
        universalApi.setDynamicField(result.data.id, 'format', data.format, 'text', organizationId)
      )
    }

    await Promise.all(fieldPromises)
    await fetchData() // Refresh

    return result.data
  }

  const updateReport = async (id: string, updates: any) => {
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
    if (updates.report_type !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(id, 'report_type', updates.report_type, 'text', organizationId)
      )
    }
    if (updates.frequency !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(id, 'frequency', updates.frequency, 'text', organizationId)
      )
    }
    if (updates.parameters !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(id, 'parameters', updates.parameters, 'text', organizationId)
      )
    }
    if (updates.last_run !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(id, 'last_run', updates.last_run, 'text', organizationId)
      )
    }
    if (updates.recipients !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(id, 'recipients', updates.recipients, 'text', organizationId)
      )
    }
    if (updates.format !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(id, 'format', updates.format, 'text', organizationId)
      )
    }

    await Promise.all(fieldPromises)
    await fetchData() // Refresh
  }

  const deleteReport = async (id: string) => {
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
    createReport,
    updateReport,
    deleteReport
  }
}
