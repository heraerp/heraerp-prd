/**
 * HERA Customers Hook
 *
 * Thin wrapper over useUniversalEntity for customer management
 * Provides customer-specific helpers and relationship management
 */

import { useMemo } from 'react'
import { useUniversalEntity } from './useUniversalEntity'
import { CUSTOMER_PRESET } from './entityPresets'
import type { DynamicFieldDef, RelationshipDef } from './useUniversalEntity'

export interface CustomerEntity {
  id: string
  entity_name: string
  entity_code?: string
  smart_code: string
  status: 'active' | 'archived' | 'deleted' // ✅ Added proper status typing
  dynamic_fields?: {
    phone?: { value: string }
    email?: { value: string }
    vip?: { value: boolean }
    notes?: { value: string }
    birthday?: { value: string }
    loyalty_points?: { value: number }
    lifetime_value?: { value: number }
  }
  // Flattened fields for easier access
  phone?: string
  email?: string
  vip?: boolean
  notes?: string
  birthday?: string
  loyalty_points?: number
  lifetime_value?: number
  relationships?: {
    referred_by?: { to_entity: any }
    preferred_stylist?: { to_entity: any }
  }
  created_at: string
  updated_at: string
}

export interface UseHeraCustomersOptions {
  organizationId?: string
  includeArchived?: boolean // ✅ Added includeArchived support
  searchQuery?: string // ✅ Added searchQuery support
  loyaltyFilter?: string
  filters?: {
    include_dynamic?: boolean
    include_relationships?: boolean
    limit?: number
    offset?: number
    status?: string
    search?: string
    branch_id?: string // Add branch filtering
    vip_only?: boolean // Add VIP filtering
  }
}

export function useHeraCustomers(options?: UseHeraCustomersOptions) {
  const {
    entities: customers,
    isLoading,
    error,
    refetch,
    create: baseCreate,
    update: baseUpdate,
    delete: baseDelete,
    archive: baseArchive,
    restore: baseRestore, // ✅ Added restore function
    isCreating,
    isUpdating,
    isDeleting
  } = useUniversalEntity({
    entity_type: 'CUSTOMER',
    organizationId: options?.organizationId, // ✅ Added organizationId
    filters: {
      include_dynamic: true,
      // ⚡ PERFORMANCE: Only fetch relationships when filtering by branch
      // This significantly improves initial page load since relationships require expensive joins
      include_relationships: !!(options?.filters?.branch_id),
      limit: 100,
      // ✅ Only filter by 'active' status when not including archived
      ...(options?.includeArchived ? {} : { status: 'active' }),
      ...options?.filters
    },
    dynamicFields: CUSTOMER_PRESET.dynamicFields as DynamicFieldDef[],
    relationships: CUSTOMER_PRESET.relationships as RelationshipDef[]
  })

  // Filter customers by branch and other criteria
  const filteredCustomers = useMemo(() => {
    if (!customers) return customers as CustomerEntity[]

    let filtered = customers as CustomerEntity[]

    // Filter by search query
    if (options?.searchQuery) {
      const query = options.searchQuery.toLowerCase()
      filtered = filtered.filter(c => {
        const matchesName = c.entity_name?.toLowerCase().includes(query)
        const matchesEmail =
          c.dynamic_fields?.email?.value?.toLowerCase().includes(query) ||
          c.email?.toLowerCase().includes(query)
        const matchesPhone =
          c.dynamic_fields?.phone?.value?.toLowerCase().includes(query) ||
          c.phone?.toLowerCase().includes(query)

        return matchesName || matchesEmail || matchesPhone
      })
    }

    // Filter by loyalty tier
    if (options?.loyaltyFilter) {
      filtered = filtered.filter(c => {
        // Check relationships for loyalty tier
        return true // TODO: Implement loyalty tier filtering via relationships
      })
    }

    // Filter by branch relationship
    if (options?.filters?.branch_id) {
      filtered = filtered.filter(c => {
        // Check if customer has CUSTOMER_OF relationship with the specified branch
        const customerOfRelationships = c.relationships?.customer_of
        if (!customerOfRelationships) return false

        if (Array.isArray(customerOfRelationships)) {
          return customerOfRelationships.some(
            rel => rel.to_entity?.id === options.filters?.branch_id
          )
        } else {
          return customerOfRelationships.to_entity?.id === options.filters?.branch_id
        }
      })
    }

    // Filter by VIP status if requested
    if (options?.filters?.vip_only) {
      filtered = filtered.filter(c => c.dynamic_fields?.vip?.value === true || c.vip === true)
    }

    return filtered
  }, [
    customers,
    options?.searchQuery,
    options?.loyaltyFilter,
    options?.filters?.branch_id,
    options?.filters?.vip_only
  ])

  // Helper to create customer with proper smart codes and relationships
  const createCustomer = async (data: {
    name: string
    phone?: string
    email?: string
    vip?: boolean
    notes?: string
    birthday?: string
    loyalty_points?: number
    lifetime_value?: number
    referred_by_id?: string
    preferred_stylist_id?: string
    branch_id?: string // Add branch support
  }) => {
    // Map provided primitives to dynamic_fields payload using preset definitions
    const dynamic_fields: Record<string, any> = {}
    for (const def of CUSTOMER_PRESET.dynamicFields) {
      const key = def.name as keyof typeof data
      if (key in data && (data as any)[key] !== undefined) {
        dynamic_fields[def.name] = {
          value: (data as any)[key],
          type: def.type,
          smart_code: def.smart_code
        }
      }
    }

    // Relationships map according to preset relationship types
    const relationships: Record<string, string[] | undefined> = {
      ...(data.referred_by_id ? { REFERRED_BY: [data.referred_by_id] } : {}),
      ...(data.preferred_stylist_id ? { PREFERRED_STYLIST: [data.preferred_stylist_id] } : {}),
      // Add branch relationship - use CUSTOMER_OF for customer association with branches
      ...(data.branch_id ? { CUSTOMER_OF: [data.branch_id] } : {})
    }

    return baseCreate({
      entity_type: 'CUSTOMER',
      entity_name: data.name,
      smart_code: 'HERA.SALON.CUSTOMER.ENTITY.CUSTOMER.V1',
      dynamic_fields,
      metadata: { relationships }
    } as any)
  }

  // Helper to update customer
  const updateCustomer = async (
    id: string,
    data: Partial<Parameters<typeof createCustomer>[0]>
  ) => {
    // Build dynamic patch from provided fields
    const dynamic_patch: Record<string, any> = {}
    for (const def of CUSTOMER_PRESET.dynamicFields) {
      const key = def.name as keyof typeof data
      if (key in data && (data as any)[key] !== undefined) {
        dynamic_patch[def.name] = (data as any)[key]
      }
    }

    // Relationships patch
    const relationships_patch: Record<string, string[]> = {}
    if (data.referred_by_id) relationships_patch['REFERRED_BY'] = [data.referred_by_id]
    if (data.preferred_stylist_id)
      relationships_patch['PREFERRED_STYLIST'] = [data.preferred_stylist_id]
    if (data.branch_id) relationships_patch['CUSTOMER_OF'] = [data.branch_id]

    const payload: any = {
      entity_id: id,
      ...(data.name && { entity_name: data.name }),
      ...(Object.keys(dynamic_patch).length ? { dynamic_patch } : {}),
      ...(Object.keys(relationships_patch).length ? { relationships_patch } : {})
    }

    return baseUpdate(payload)
  }

  // Helper to archive customer (soft delete)
  const archiveCustomer = async (id: string) => {
    const customer = (customers as CustomerEntity[])?.find(c => c.id === id)
    if (!customer) throw new Error('Customer not found')

    console.log('[useHeraCustomers] Archiving customer:', { id })

    const result = await baseUpdate({
      entity_id: id,
      entity_name: customer.entity_name,
      status: 'archived'
    })

    // Trigger refetch to update the list
    await refetch()
    return result
  }

  // Helper to restore archived customer
  const restoreCustomer = async (id: string) => {
    const customer = (customers as CustomerEntity[])?.find(c => c.id === id)
    if (!customer) throw new Error('Customer not found')

    console.log('[useHeraCustomers] Restoring customer:', { id })

    const result = await baseUpdate({
      entity_id: id,
      entity_name: customer.entity_name,
      status: 'active'
    })

    // Trigger refetch to update the list
    await refetch()
    return result
  }

  // Helper to delete customer (hard delete with soft delete fallback)
  const deleteCustomer = async (id: string, hardDelete = false) => {
    if (!hardDelete) {
      const result = await archiveCustomer(id)
      return result
    }
    const result = await baseDelete({ entity_id: id, hard_delete: true })
    // Trigger refetch after hard delete
    await refetch()
    return result
  }

  // Helper to update loyalty points
  const updateLoyaltyPoints = async (customerId: string, points: number) => {
    const customer = (customers as CustomerEntity[])?.find(c => c.id === customerId)
    if (customer) {
      return updateCustomer(customerId, {
        loyalty_points: points
      })
    }
    throw new Error('Customer not found')
  }

  // Helper to add loyalty points (relative change)
  const addLoyaltyPoints = async (customerId: string, pointsToAdd: number) => {
    const customer = (customers as CustomerEntity[])?.find(c => c.id === customerId)
    if (customer) {
      const currentPoints = customer.dynamic_fields?.loyalty_points?.value || 0
      return updateCustomer(customerId, {
        loyalty_points: currentPoints + pointsToAdd
      })
    }
    throw new Error('Customer not found')
  }

  // Helper to update lifetime value
  const updateLifetimeValue = async (customerId: string, value: number) => {
    const customer = (customers as CustomerEntity[])?.find(c => c.id === customerId)
    if (customer) {
      return updateCustomer(customerId, {
        lifetime_value: value
      })
    }
    throw new Error('Customer not found')
  }

  // Helper to toggle VIP status
  const toggleVipStatus = async (customerId: string) => {
    const customer = (customers as CustomerEntity[])?.find(c => c.id === customerId)
    if (customer) {
      const currentVipStatus = customer.dynamic_fields?.vip?.value || false
      return updateCustomer(customerId, {
        vip: !currentVipStatus
      })
    }
    throw new Error('Customer not found')
  }

  // Helper to link preferred stylist
  const linkPreferredStylist = async (customerId: string, stylistId: string) => {
    const customer = (customers as CustomerEntity[])?.find(c => c.id === customerId)
    if (customer) {
      return updateCustomer(customerId, {
        preferred_stylist_id: stylistId
      })
    }
    throw new Error('Customer not found')
  }

  // Helper to get customer statistics
  const getCustomerStats = () => {
    const allCustomers = (customers as CustomerEntity[]) || []
    // Check both flattened vip property and dynamic_fields.vip.value
    const vipCount = allCustomers.filter(
      c => c.vip === true || c.dynamic_fields?.vip?.value === true
    ).length
    const totalLoyaltyPoints = allCustomers.reduce(
      (sum, c) => sum + (c.loyalty_points || c.dynamic_fields?.loyalty_points?.value || 0),
      0
    )
    const totalLifetimeValue = allCustomers.reduce(
      (sum, c) => sum + (c.lifetime_value || c.dynamic_fields?.lifetime_value?.value || 0),
      0
    )

    return {
      totalCustomers: allCustomers.length,
      vipCustomers: vipCount,
      regularCustomers: allCustomers.length - vipCount,
      totalLoyaltyPoints,
      averageLoyaltyPoints: allCustomers.length > 0 ? totalLoyaltyPoints / allCustomers.length : 0,
      totalLifetimeValue,
      averageLifetimeValue: allCustomers.length > 0 ? totalLifetimeValue / allCustomers.length : 0
    }
  }

  return {
    customers: filteredCustomers,
    allCustomers: customers as CustomerEntity[], // ✅ Added allCustomers for full list access
    isLoading,
    error,
    refetch,
    createCustomer,
    updateCustomer,
    archiveCustomer,
    restoreCustomer, // ✅ Added restoreCustomer function
    deleteCustomer,
    updateLoyaltyPoints,
    addLoyaltyPoints,
    updateLifetimeValue,
    toggleVipStatus,
    linkPreferredStylist,
    getCustomerStats,
    isCreating,
    isUpdating,
    isDeleting
  }
}
