'use client'

import { useState, useCallback } from 'react'
import { universalApi } from '@/lib/universal-api-v2'

interface CustomerData {
  id: string
  entity_name: string
  entity_code?: string
  smart_code: string
  phone?: string
  email?: string
  address?: string
  date_of_birth?: string
  last_visit?: string
  total_visits?: number
  total_spent?: number
  preferred_stylist_id?: string
  preferred_stylist_name?: string
  notes?: string
  loyalty_points?: number
  vip_tier?: string
  created_at?: string
}

interface CustomerSearchOptions {
  q?: string
  phone?: string
  email?: string
  stylist_id?: string
  vip_tier?: string
  page?: number
  page_size?: number
}

export function useCustomerLookup(organizationId: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<CustomerData[]>([])
  const [lastCustomer, setLastCustomer] = useState<CustomerData | null>(null)

  const loadCustomer = useCallback(
    async (customerId: string): Promise<CustomerData | null> => {
      if (!organizationId || !customerId) return null

      setLoading(true)
      setError(null)

      try {
        // Load customer entity
        const customerResponse = await universalApi.read({
          table: 'core_entities',
          filters: [
            { field: 'organization_id', operator: 'eq', value: organizationId },
            { field: 'entity_type', operator: 'eq', value: 'customer' },
            { field: 'id', operator: 'eq', value: customerId }
          ]
        })

        if (!customerResponse?.data || customerResponse.data.length === 0) {
          setError('Customer not found')
          return null
        }

        const customer = customerResponse.data[0]

        // Load dynamic data for customer
        const dynamicResponse = await universalApi.read({
          table: 'core_dynamic_data',
          filters: [
            { field: 'organization_id', operator: 'eq', value: organizationId },
            { field: 'entity_id', operator: 'eq', value: customer.id }
          ]
        })

        // Parse dynamic data
        const dynamicData = dynamicResponse?.data || []
        const dynamicFields: any = {}
        dynamicData.forEach(field => {
          dynamicFields[field.field_name] =
            field.field_value_text ||
            field.field_value_number ||
            field.field_value_date ||
            field.field_value_boolean
        })

        // Load preferred stylist information if available
        let preferredStylistName = ''
        if (dynamicFields.preferred_stylist_id) {
          const stylistResponse = await universalApi.read({
            table: 'core_entities',
            filters: [
              { field: 'organization_id', operator: 'eq', value: organizationId },
              { field: 'id', operator: 'eq', value: dynamicFields.preferred_stylist_id }
            ]
          })

          if (stylistResponse?.data && stylistResponse.data.length > 0) {
            preferredStylistName = stylistResponse.data[0].entity_name
          }
        }

        const customerData: CustomerData = {
          id: customer.id,
          entity_name: customer.entity_name,
          entity_code: customer.entity_code,
          smart_code: customer.smart_code,
          phone: dynamicFields.phone,
          email: dynamicFields.email,
          address: dynamicFields.address,
          date_of_birth: dynamicFields.date_of_birth,
          last_visit: dynamicFields.last_visit,
          total_visits: dynamicFields.total_visits || 0,
          total_spent: dynamicFields.total_spent || 0,
          preferred_stylist_id: dynamicFields.preferred_stylist_id,
          preferred_stylist_name: preferredStylistName,
          notes: dynamicFields.notes,
          loyalty_points: dynamicFields.loyalty_points || 0,
          vip_tier: dynamicFields.vip_tier || 'regular',
          created_at: customer.created_at
        }

        setLastCustomer(customerData)
        return customerData
      } catch (err) {
        console.error('Error loading customer:', err)
        setError(err instanceof Error ? err.message : 'Failed to load customer')
        return null
      } finally {
        setLoading(false)
      }
    },
    [organizationId]
  )

  const searchCustomers = useCallback(
    async (options: CustomerSearchOptions = {}): Promise<CustomerData[]> => {
      if (!organizationId) return []

      setLoading(true)
      setError(null)

      try {
        const filters = [
          { field: 'organization_id', operator: 'eq', value: organizationId },
          { field: 'entity_type', operator: 'eq', value: 'customer' }
        ]

        // Add search filters
        if (options.q) {
          filters.push({
            field: 'entity_name',
            operator: 'ilike',
            value: `%${options.q}%`
          })
        }

        const customersResponse = await universalApi.read({
          table: 'core_entities',
          filters
        })

        if (!customersResponse?.data) {
          setSearchResults([])
          return []
        }

        // Load dynamic data for all customers
        const customerIds = customersResponse.data.map(c => c.id)
        let dynamicData: any[] = []

        if (customerIds.length > 0) {
          const dynamicResponse = await universalApi.read({
            table: 'core_dynamic_data',
            filters: [
              { field: 'organization_id', operator: 'eq', value: organizationId },
              { field: 'entity_id', operator: 'in', value: customerIds }
            ]
          })
          dynamicData = dynamicResponse?.data || []
        }

        // Merge customer data with dynamic fields
        const customers: CustomerData[] = customersResponse.data
          .map(customer => {
            const customerFields = dynamicData.filter(d => d.entity_id === customer.id)
            const dynamicFields: any = {}
            customerFields.forEach(field => {
              dynamicFields[field.field_name] =
                field.field_value_text ||
                field.field_value_number ||
                field.field_value_date ||
                field.field_value_boolean
            })

            // Apply additional filters on dynamic data
            if (
              options.phone &&
              dynamicFields.phone &&
              !dynamicFields.phone.includes(options.phone)
            ) {
              return null
            }
            if (
              options.email &&
              dynamicFields.email &&
              !dynamicFields.email.toLowerCase().includes(options.email.toLowerCase())
            ) {
              return null
            }
            if (options.vip_tier && dynamicFields.vip_tier !== options.vip_tier) {
              return null
            }

            return {
              id: customer.id,
              entity_name: customer.entity_name,
              entity_code: customer.entity_code,
              smart_code: customer.smart_code,
              phone: dynamicFields.phone,
              email: dynamicFields.email,
              address: dynamicFields.address,
              date_of_birth: dynamicFields.date_of_birth,
              last_visit: dynamicFields.last_visit,
              total_visits: dynamicFields.total_visits || 0,
              total_spent: dynamicFields.total_spent || 0,
              preferred_stylist_id: dynamicFields.preferred_stylist_id,
              notes: dynamicFields.notes,
              loyalty_points: dynamicFields.loyalty_points || 0,
              vip_tier: dynamicFields.vip_tier || 'regular',
              created_at: customer.created_at
            }
          })
          .filter(Boolean) as CustomerData[]

        // Apply pagination
        const pageSize = options.page_size || 20
        const page = options.page || 1
        const startIndex = (page - 1) * pageSize
        const paginatedResults = customers.slice(startIndex, startIndex + pageSize)

        setSearchResults(paginatedResults)
        return paginatedResults
      } catch (err) {
        console.error('Error searching customers:', err)
        setError(err instanceof Error ? err.message : 'Failed to search customers')
        setSearchResults([])
        return []
      } finally {
        setLoading(false)
      }
    },
    [organizationId]
  )

  const quickSearchCustomers = useCallback(
    async (query: string): Promise<CustomerData[]> => {
      if (!query || query.length < 2) return []

      // This is a quick search for autocomplete-style functionality
      const results = await searchCustomers({
        q: query,
        page_size: 10
      })

      // Also search by phone and email
      if (query.includes('@')) {
        const emailResults = await searchCustomers({
          email: query,
          page_size: 5
        })
        results.push(...emailResults)
      }

      if (/^\d/.test(query)) {
        const phoneResults = await searchCustomers({
          phone: query,
          page_size: 5
        })
        results.push(...phoneResults)
      }

      // Remove duplicates
      const uniqueResults = results.filter(
        (customer, index, self) => index === self.findIndex(c => c.id === customer.id)
      )

      return uniqueResults.slice(0, 10) // Limit to 10 results for quick search
    },
    [searchCustomers]
  )

  const getCustomerAppointments = useCallback(
    async (customerId: string, limit: number = 10) => {
      if (!organizationId || !customerId) return []

      try {
        // Search for appointments by customer ID
        // This would need to be implemented based on how appointments link to customers
        const appointmentsResponse = await universalApi.read({
          table: 'core_entities',
          filters: [
            { field: 'organization_id', operator: 'eq', value: organizationId },
            { field: 'entity_type', operator: 'eq', value: 'appointment' }
          ]
        })

        // Filter by customer ID in dynamic data (simplified for now)
        return []
      } catch (err) {
        console.error('Error loading customer appointments:', err)
        return []
      }
    },
    [organizationId]
  )

  const updateCustomerVisit = useCallback(
    async (customerId: string, visitAmount: number) => {
      if (!organizationId || !customerId) return

      try {
        const customer = await loadCustomer(customerId)
        if (!customer) return

        // Update visit statistics
        const newVisitCount = (customer.total_visits || 0) + 1
        const newTotalSpent = (customer.total_spent || 0) + visitAmount

        // This would update the dynamic data fields
        // Implementation would depend on your updateDynamicField API
        console.log('Updating customer visit stats:', {
          customerId,
          visits: newVisitCount,
          totalSpent: newTotalSpent,
          lastVisit: new Date().toISOString()
        })
      } catch (err) {
        console.error('Error updating customer visit:', err)
      }
    },
    [organizationId, loadCustomer]
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const clearResults = useCallback(() => {
    setSearchResults([])
  }, [])

  return {
    loading,
    error,
    searchResults,
    lastCustomer,
    loadCustomer,
    searchCustomers,
    quickSearchCustomers,
    getCustomerAppointments,
    updateCustomerVisit,
    clearError,
    clearResults
  }
}
