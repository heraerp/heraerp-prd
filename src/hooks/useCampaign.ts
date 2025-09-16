import { useState, useEffect } from 'react'
import { universalApi } from '@/src/lib/universal-api'

interface CampaignData {
  entity: any
  dynamicFields: any[]
  relationships: any[]
  transactions?: any[]
}

export function useCampaign(organizationId?: string) {
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
      const entitiesRes = await universalApi.getEntities('campaign', organizationId)
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
      console.error('Error fetching campaign data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [organizationId])

  // CRUD operations
  const createCampaign = async (data: any) => {
    if (!organizationId) throw new Error('No organization ID')

    const result = await universalApi.createEntity(
      {
        entity_type: 'campaign',
        entity_name: data.name || data.title || data.description,
        entity_code: `CAMPAIGN-${Date.now()}`,
        smart_code: 'HERA.SALON.CAMPAIGN.v1',
        status: 'active'
      },
      organizationId
    )

    if (!result.success) throw new Error(result.error)

    // Add dynamic fields
    const fieldPromises = []
    if (data.campaign_type) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'campaign_type',
          data.campaign_type,
          'text',
          organizationId
        )
      )
    }
    if (data.start_date) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'start_date',
          data.start_date,
          'text',
          organizationId
        )
      )
    }
    if (data.end_date) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'end_date',
          data.end_date,
          'text',
          organizationId
        )
      )
    }
    if (data.target_audience) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'target_audience',
          data.target_audience,
          'text',
          organizationId
        )
      )
    }
    if (data.budget) {
      fieldPromises.push(
        universalApi.setDynamicField(result.data.id, 'budget', data.budget, 'text', organizationId)
      )
    }
    if (data.status) {
      fieldPromises.push(
        universalApi.setDynamicField(result.data.id, 'status', data.status, 'text', organizationId)
      )
    }
    if (data.channel) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'channel',
          data.channel,
          'text',
          organizationId
        )
      )
    }

    await Promise.all(fieldPromises)
    await fetchData() // Refresh

    return result.data
  }

  const updateCampaign = async (id: string, updates: any) => {
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
    if (updates.campaign_type !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(
          id,
          'campaign_type',
          updates.campaign_type,
          'text',
          organizationId
        )
      )
    }
    if (updates.start_date !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(id, 'start_date', updates.start_date, 'text', organizationId)
      )
    }
    if (updates.end_date !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(id, 'end_date', updates.end_date, 'text', organizationId)
      )
    }
    if (updates.target_audience !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(
          id,
          'target_audience',
          updates.target_audience,
          'text',
          organizationId
        )
      )
    }
    if (updates.budget !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(id, 'budget', updates.budget, 'text', organizationId)
      )
    }
    if (updates.status !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(id, 'status', updates.status, 'text', organizationId)
      )
    }
    if (updates.channel !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(id, 'channel', updates.channel, 'text', organizationId)
      )
    }

    await Promise.all(fieldPromises)
    await fetchData() // Refresh
  }

  const deleteCampaign = async (id: string) => {
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
    createCampaign,
    updateCampaign,
    deleteCampaign
  }
}
