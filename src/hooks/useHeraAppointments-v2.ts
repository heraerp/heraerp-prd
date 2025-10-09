/**
 * HERA Appointments Hook v2
 *
 * CRITICAL FIX: Appointments are stored as TRANSACTIONS, not entities!
 * - Transaction type: 'APPOINTMENT'
 * - Customer ID: source_entity_id
 * - Staff ID: target_entity_id
 * - Metadata contains: start_time, end_time, status, branch_id, etc.
 */

import { useMemo, useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface Appointment {
  id: string
  transaction_code: string
  transaction_date: string
  customer_id: string
  customer_name: string
  stylist_id: string | null
  stylist_name: string
  start_time: string
  end_time: string
  duration_minutes: number
  total_amount: number
  status: string
  notes: string | null
  branch_id: string | null
  metadata: any
  created_at: string
  updated_at: string
  // Transaction fields
  transaction_status: string
}

export interface UseHeraAppointmentsOptions {
  organizationId?: string
  includeArchived?: boolean
  filters?: {
    status?: string
    branch_id?: string
    date_from?: string
    date_to?: string
  }
}

export function useHeraAppointments(options?: UseHeraAppointmentsOptions) {
  const queryClient = useQueryClient()

  // Fetch appointment transactions
  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions
  } = useQuery({
    queryKey: ['appointment-transactions', options?.organizationId, options?.filters],
    queryFn: async () => {
      if (!options?.organizationId) return []

      const params = new URLSearchParams({
        organization_id: options.organizationId,
        transaction_type: 'APPOINTMENT'
      })

      const response = await fetch(`/api/v2/transactions?${params}`, {
        headers: { 'x-hera-api-version': 'v2' }
      })

      if (!response.ok) throw new Error('Failed to fetch appointments')

      const result = await response.json()
      return result.data || []
    },
    enabled: !!options?.organizationId
  })

  // Fetch customers (source entities)
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['customers', options?.organizationId],
    queryFn: async () => {
      if (!options?.organizationId) return []

      const response = await fetch(
        `/api/v2/entities?${new URLSearchParams({
          organization_id: options.organizationId!,
          entity_type: 'CUSTOMER',
          include_dynamic: 'false',
          limit: '1000'
        })}`,
        {
          headers: { 'x-hera-api-version': 'v2' }
        }
      )

      if (!response.ok) return []
      const result = await response.json()
      return result.data || []
    },
    enabled: !!options?.organizationId
  })

  // Fetch staff (target entities) - both uppercase and lowercase
  const { data: staffUpper = [], isLoading: staffUpperLoading } = useQuery({
    queryKey: ['staff-upper', options?.organizationId],
    queryFn: async () => {
      if (!options?.organizationId) return []

      const response = await fetch(
        `/api/v2/entities?${new URLSearchParams({
          organization_id: options.organizationId!,
          entity_type: 'STAFF',
          include_dynamic: 'false',
          limit: '500'
        })}`,
        {
          headers: { 'x-hera-api-version': 'v2' }
        }
      )

      if (!response.ok) return []
      const result = await response.json()
      return result.data || []
    },
    enabled: !!options?.organizationId
  })

  const { data: staffLower = [], isLoading: staffLowerLoading } = useQuery({
    queryKey: ['staff-lower', options?.organizationId],
    queryFn: async () => {
      if (!options?.organizationId) return []

      const response = await fetch(
        `/api/v2/entities?${new URLSearchParams({
          organization_id: options.organizationId!,
          entity_type: 'staff',
          include_dynamic: 'false',
          limit: '500'
        })}`,
        {
          headers: { 'x-hera-api-version': 'v2' }
        }
      )

      if (!response.ok) return []
      const result = await response.json()
      return result.data || []
    },
    enabled: !!options?.organizationId
  })

  // Merge staff
  const allStaff = useMemo(() => {
    return [...staffUpper, ...staffLower]
  }, [staffUpper, staffLower])

  const staffLoading = staffUpperLoading || staffLowerLoading

  // Create lookup maps
  const customerMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of customers) {
      map.set(c.id, c.entity_name)
    }
    console.log('[useHeraAppointments] Customer map:', {
      count: customers.length,
      sample: Array.from(map.entries()).slice(0, 3)
    })
    return map
  }, [customers])

  const staffMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of allStaff) {
      map.set(s.id, s.entity_name)
    }
    console.log('[useHeraAppointments] Staff map:', {
      countUpper: staffUpper.length,
      countLower: staffLower.length,
      total: allStaff.length,
      sample: Array.from(map.entries()).slice(0, 3)
    })
    return map
  }, [allStaff, staffUpper, staffLower])

  // Transform transactions to appointments
  const appointments = useMemo(() => {
    if (!transactions || transactions.length === 0) return []

    return transactions.map((txn: any) => {
      const metadata = txn.metadata || {}
      const customerName = customerMap.get(txn.source_entity_id) || 'Unknown Customer'
      const stylistName = txn.target_entity_id
        ? staffMap.get(txn.target_entity_id) || 'Unassigned'
        : 'Unassigned'

      // Debug first appointment
      if (txn === transactions[0]) {
        console.log('[useHeraAppointments] First appointment:', {
          txnCode: txn.transaction_code,
          source_entity_id: txn.source_entity_id,
          target_entity_id: txn.target_entity_id,
          customerFound: customerMap.has(txn.source_entity_id),
          customerName,
          staffFound: txn.target_entity_id ? staffMap.has(txn.target_entity_id) : false,
          stylistName,
          customerMapSize: customerMap.size,
          staffMapSize: staffMap.size
        })
      }

      const appointment: Appointment = {
        id: txn.id,
        transaction_code: txn.transaction_code,
        transaction_date: txn.transaction_date,
        customer_id: txn.source_entity_id,
        customer_name: customerName,
        stylist_id: txn.target_entity_id,
        stylist_name: stylistName,
        start_time: metadata.start_time || txn.transaction_date,
        end_time: metadata.end_time || txn.transaction_date,
        duration_minutes: metadata.duration_minutes || 0,
        total_amount: txn.total_amount || 0,
        status: metadata.status || txn.transaction_status || 'pending',
        notes: metadata.notes,
        branch_id: metadata.branch_id,
        metadata: metadata,
        created_at: txn.created_at,
        updated_at: txn.updated_at,
        transaction_status: txn.transaction_status
      }

      return appointment
    })
  }, [transactions, customerMap, staffMap])

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    let filtered = appointments

    // Status filter
    if (!options?.includeArchived) {
      const validStatuses = ['booked', 'checked_in', 'completed', 'active', 'DRAFT', 'pending']
      filtered = filtered.filter(apt => validStatuses.includes(apt.status))
    }

    // Branch filter
    if (options?.filters?.branch_id) {
      filtered = filtered.filter(apt => apt.branch_id === options.filters!.branch_id)
    }

    return filtered
  }, [appointments, options?.includeArchived, options?.filters?.branch_id])

  console.log('[useHeraAppointments] Summary:', {
    transactions: transactions.length,
    appointments: appointments.length,
    filtered: filteredAppointments.length,
    customersLoaded: !customersLoading,
    staffLoaded: !staffLoading,
    isFullyLoaded: !transactionsLoading && !customersLoading && !staffLoading
  })

  const isLoading = transactionsLoading || customersLoading || staffLoading

  return {
    appointments: filteredAppointments,
    isLoading,
    error: transactionsError,
    refetch: refetchTransactions,
    isCreating: false,
    isUpdating: false,
    isDeleting: false
  }
}
