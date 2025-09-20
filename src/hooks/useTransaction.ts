import { useState, useEffect } from 'react'
import { universalApi } from '@/lib/universal-api'

interface TransactionData {
  entity: any
  dynamicFields: any[]
  relationships: any[]
  transactions?: any[]
}

export function useTransaction(organizationId?: string) {
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
      const entitiesRes = await universalApi.getEntities('transaction', organizationId)
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
      console.error('Error fetching transaction data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [organizationId])

  // CRUD operations
  const createTransaction = async (data: any) => {
    if (!organizationId) throw new Error('No organization ID')

    const result = await universalApi.createEntity(
      {
        entity_type: 'transaction',
        entity_name: data.name || data.title || data.description,
        entity_code: `TRANSACTION-${Date.now()}`,
        smart_code: 'HERA.SALON.TRANSACTION.v1',
        status: 'active'
      },
      organizationId
    )

    if (!result.success) throw new Error(result.error)

    // Add dynamic fields
    const fieldPromises = []
    if (data.payment_method) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'payment_method',
          data.payment_method,
          'text',
          organizationId
        )
      )
    }
    if (data.amount) {
      fieldPromises.push(
        universalApi.setDynamicField(result.data.id, 'amount', data.amount, 'text', organizationId)
      )
    }
    if (data.reference_number) {
      fieldPromises.push(
        universalApi.setDynamicField(
          result.data.id,
          'reference_number',
          data.reference_number,
          'text',
          organizationId
        )
      )
    }
    if (data.status) {
      fieldPromises.push(
        universalApi.setDynamicField(result.data.id, 'status', data.status, 'text', organizationId)
      )
    }
    if (data.notes) {
      fieldPromises.push(
        universalApi.setDynamicField(result.data.id, 'notes', data.notes, 'text', organizationId)
      )
    }

    await Promise.all(fieldPromises)
    await fetchData() // Refresh

    return result.data
  }

  const updateTransaction = async (id: string, updates: any) => {
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
    if (updates.payment_method !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(
          id,
          'payment_method',
          updates.payment_method,
          'text',
          organizationId
        )
      )
    }
    if (updates.amount !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(id, 'amount', updates.amount, 'text', organizationId)
      )
    }
    if (updates.reference_number !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(
          id,
          'reference_number',
          updates.reference_number,
          'text',
          organizationId
        )
      )
    }
    if (updates.status !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(id, 'status', updates.status, 'text', organizationId)
      )
    }
    if (updates.notes !== undefined) {
      fieldPromises.push(
        universalApi.setDynamicField(id, 'notes', updates.notes, 'text', organizationId)
      )
    }

    await Promise.all(fieldPromises)
    await fetchData() // Refresh
  }

  const deleteTransaction = async (id: string) => {
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
    createTransaction,
    updateTransaction,
    deleteTransaction
  }
}
