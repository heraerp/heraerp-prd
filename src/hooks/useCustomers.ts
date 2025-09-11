/**
 * Universal Customer Hook
 * Fetches and manages customer data using HERA Universal API
 */

import { useState, useEffect, useCallback } from 'react'
import { universalApi } from '@/lib/universal-api'

export interface CustomerData {
  entity: any
  dynamicFields: Record<string, any>
  transactions: any[]
  relationships: any[]
}

export interface CustomerStats {
  totalCustomers: number
  totalRevenue: number
  avgSpend: number
  vipCount: number
}

export function useCustomers(organizationId?: string) {
  const [customers, setCustomers] = useState<CustomerData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    totalRevenue: 0,
    avgSpend: 0,
    vipCount: 0
  })

  // Fetch all customer data with relationships and transactions
  const fetchCustomers = useCallback(async () => {
    if (!organizationId) {
      setError('No organization ID provided')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // 1. Get all customer entities
      const entitiesRes = await universalApi.getEntities('customer', organizationId)
      
      if (!entitiesRes.success) {
        throw new Error(entitiesRes.error || 'Failed to fetch customers')
      }

      const customerEntities = entitiesRes.data || []
      
      // 2. Fetch complete data for each customer in parallel
      const customersWithData = await Promise.all(
        customerEntities.map(async (entity) => {
          try {
            // Get dynamic fields
            const dynamicRes = await universalApi.getDynamicData(entity.id, organizationId)
            
            // Get all transactions for the organization
            const transRes = await universalApi.read('universal_transactions', undefined, organizationId)
            
            // Filter transactions related to this customer
            const customerTransactions = transRes.data?.filter(t => 
              t.source_entity_id === entity.id || 
              t.target_entity_id === entity.id ||
              (t.metadata as any)?.customer_id === entity.id
            ) || []
            
            // Get relationships (loyalty tier, favorite services)
            const relRes = await universalApi.getRelationships(entity.id, organizationId)
            
            // Build dynamic fields map
            const fieldsMap: Record<string, any> = {}
            if (dynamicRes.success && dynamicRes.data) {
              dynamicRes.data.forEach((field: any) => {
                const value = field.field_value || 
                             field.field_value_text || 
                             field.field_value_number || 
                             field.field_value_date ||
                             field.field_value_boolean
                fieldsMap[field.field_name] = value
              })
            }
            
            return {
              entity,
              dynamicFields: fieldsMap,
              transactions: customerTransactions,
              relationships: relRes.data || []
            }
          } catch (err) {
            console.error(`Error fetching data for customer ${entity.id}:`, err)
            return {
              entity,
              dynamicFields: {},
              transactions: [],
              relationships: []
            }
          }
        })
      )
      
      setCustomers(customersWithData)
      
      // Calculate statistics
      calculateStats(customersWithData)
      
    } catch (err) {
      console.error('Error fetching customers:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch customers')
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  // Calculate customer statistics
  const calculateStats = (customersData: CustomerData[]) => {
    const totalRevenue = customersData.reduce((sum, customer) => {
      const customerRevenue = customer.transactions.reduce((txSum, tx) => 
        txSum + (tx.total_amount || 0), 0
      )
      return sum + customerRevenue
    }, 0)

    const vipCount = customersData.filter(customer => {
      const loyaltyRel = customer.relationships.find(r => 
        r.relationship_type === 'has_status' && 
        (r.metadata as any)?.status_name === 'Platinum'
      )
      return !!loyaltyRel
    }).length

    setStats({
      totalCustomers: customersData.length,
      totalRevenue,
      avgSpend: customersData.length > 0 ? Math.round(totalRevenue / customersData.length) : 0,
      vipCount
    })
  }

  // Create a new customer
  const createCustomer = async (customerData: {
    name: string
    email: string
    phone?: string
    address?: string
    dateOfBirth?: string
    preferences?: string
    notes?: string
  }) => {
    if (!organizationId) {
      throw new Error('No organization ID provided')
    }

    try {
      // 1. Create customer entity
      const entityRes = await universalApi.createEntity({
        entity_type: 'customer',
        entity_name: customerData.name,
        entity_code: `CUST-${Date.now()}`,
        status: 'active',
        smart_code: 'HERA.SALON.CUSTOMER.CREATE.v1'
      }, organizationId)

      if (!entityRes.success) {
        throw new Error(entityRes.error || 'Failed to create customer')
      }

      const customerId = entityRes.data?.id

      // 2. Add dynamic fields in parallel
      const fieldPromises = []

      if (customerData.email) {
        fieldPromises.push(
          universalApi.setDynamicField(customerId, 'email', customerData.email, 'text', organizationId)
        )
      }

      if (customerData.phone) {
        fieldPromises.push(
          universalApi.setDynamicField(customerId, 'phone', customerData.phone, 'text', organizationId)
        )
      }

      if (customerData.address) {
        fieldPromises.push(
          universalApi.setDynamicField(customerId, 'address', customerData.address, 'text', organizationId)
        )
      }

      if (customerData.dateOfBirth) {
        fieldPromises.push(
          universalApi.setDynamicField(customerId, 'date_of_birth', customerData.dateOfBirth, 'date', organizationId)
        )
      }

      if (customerData.preferences) {
        fieldPromises.push(
          universalApi.setDynamicField(customerId, 'preferences', customerData.preferences, 'text', organizationId)
        )
      }

      if (customerData.notes) {
        fieldPromises.push(
          universalApi.setDynamicField(customerId, 'notes', customerData.notes, 'text', organizationId)
        )
      }

      await Promise.all(fieldPromises)

      // 3. Assign default Bronze loyalty tier
      await assignLoyaltyTier(customerId, 'Bronze', organizationId)

      // 4. Refresh customer list
      await fetchCustomers()

      return { success: true, customerId }
    } catch (err) {
      console.error('Error creating customer:', err)
      throw err
    }
  }

  // Update customer data
  const updateCustomer = async (customerId: string, updates: Partial<any>) => {
    if (!organizationId) {
      throw new Error('No organization ID provided')
    }

    try {
      // Update entity name if provided
      if (updates.name) {
        await universalApi.updateEntity(customerId, {
          entity_name: updates.name
        }, organizationId)
      }

      // Update dynamic fields
      const fieldUpdates = []
      const fields = ['email', 'phone', 'address', 'preferences', 'notes']
      
      for (const field of fields) {
        if (updates[field] !== undefined) {
          fieldUpdates.push(
            updateDynamicField(customerId, field, updates[field], organizationId)
          )
        }
      }

      if (updates.dateOfBirth !== undefined) {
        fieldUpdates.push(
          updateDynamicField(customerId, 'date_of_birth', updates.dateOfBirth, organizationId, 'date')
        )
      }

      await Promise.all(fieldUpdates)

      // Refresh data
      await fetchCustomers()

      return { success: true }
    } catch (err) {
      console.error('Error updating customer:', err)
      throw err
    }
  }

  // Delete customer
  const deleteCustomer = async (customerId: string) => {
    if (!organizationId) {
      throw new Error('No organization ID provided')
    }

    try {
      // Delete in order: relationships, dynamic data, then entity
      
      // 1. Get and delete all relationships
      const relRes = await universalApi.getRelationships(customerId, organizationId)
      if (relRes.success && relRes.data) {
        await Promise.all(
          relRes.data.map(rel => 
            universalApi.delete('core_relationships', rel.id, organizationId)
          )
        )
      }

      // 2. Get and delete all dynamic data
      const dynamicRes = await universalApi.getDynamicData(customerId, organizationId)
      if (dynamicRes.success && dynamicRes.data) {
        await Promise.all(
          dynamicRes.data.map(field => 
            universalApi.delete('core_dynamic_data', field.id, organizationId)
          )
        )
      }

      // 3. Delete the entity
      await universalApi.deleteEntity(customerId, organizationId)

      // Refresh data
      await fetchCustomers()

      return { success: true }
    } catch (err) {
      console.error('Error deleting customer:', err)
      throw err
    }
  }

  // Helper: Update or create dynamic field
  const updateDynamicField = async (
    entityId: string, 
    fieldName: string, 
    value: any, 
    orgId: string,
    fieldType: string = 'text'
  ) => {
    // Check if field exists
    const existingFields = await universalApi.getDynamicData(entityId, orgId)
    const existingField = existingFields.data?.find(f => f.field_name === fieldName)

    if (existingField) {
      // Update existing field
      return universalApi.update('core_dynamic_data', existingField.id, {
        field_value: fieldType === 'text' ? value : undefined,
        field_value_text: fieldType === 'text' ? value : undefined,
        field_value_date: fieldType === 'date' ? value : undefined,
        field_value_number: fieldType === 'number' ? value : undefined
      }, orgId)
    } else {
      // Create new field
      return universalApi.setDynamicField(entityId, fieldName, value, fieldType, orgId)
    }
  }

  // Helper: Assign loyalty tier
  const assignLoyaltyTier = async (customerId: string, tier: string, orgId: string) => {
    // First, create or find the loyalty status entity
    const statusEntities = await universalApi.getEntities('workflow_status', orgId)
    let statusEntity = statusEntities.data?.find(e => 
      e.entity_code === `LOYALTY-${tier.toUpperCase()}`
    )

    if (!statusEntity) {
      // Create loyalty status entity
      const statusRes = await universalApi.createEntity({
        entity_type: 'workflow_status',
        entity_name: `${tier} Loyalty Status`,
        entity_code: `LOYALTY-${tier.toUpperCase()}`,
        smart_code: 'HERA.SALON.LOYALTY.STATUS.v1',
        metadata: {
          tier_name: tier,
          color_code: getTierColor(tier)
        }
      }, orgId)
      statusEntity = statusRes.data
    }

    // Create relationship
    return universalApi.createRelationship({
      from_entity_id: customerId,
      to_entity_id: statusEntity.id,
      relationship_type: 'has_status',
      relationship_metadata: {
        status_type: 'loyalty_tier',
        status_name: tier,
        assigned_at: new Date().toISOString()
      }
    }, orgId)
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum': return '#9333ea'
      case 'Gold': return '#eab308'
      case 'Silver': return '#6b7280'
      default: return '#f97316'
    }
  }

  // Initial fetch
  useEffect(() => {
    if (organizationId) {
      fetchCustomers()
    }
  }, [organizationId, fetchCustomers])

  return {
    customers,
    stats,
    loading,
    error,
    refetch: fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer
  }
}