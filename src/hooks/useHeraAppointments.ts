/**
 * HERA Appointments Hook
 *
 * CRITICAL FIX: Appointments are stored as TRANSACTIONS, not entities!
 * - Transaction type: 'APPOINTMENT' (UPPERCASE)
 * - Customer ID: source_entity_id
 * - Staff ID: target_entity_id
 * - Metadata contains: start_time, end_time, status, branch_id, etc.
 * - Uses PROPER RPC via universal-api-v2-client
 */

import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getTransactions, getEntities } from '@/lib/universal-api-v2-client'

export interface Appointment {
  id: string
  entity_name: string // For compatibility
  entity_code?: string // Transaction code
  transaction_code: string
  transaction_date: string
  customer_id: string
  customer_name: string
  stylist_id: string | null
  stylist_name: string
  start_time: string
  end_time: string
  duration_minutes: number
  price: number // total_amount
  total_amount: number
  status: string
  notes: string | null
  branch_id: string | null
  metadata: any
  created_at: string
  updated_at: string
  transaction_status: string
}

export interface UseHeraAppointmentsOptions {
  organizationId?: string
  includeArchived?: boolean
  userRole?: string
  filters?: {
    status?: string
    branch_id?: string
    date_from?: string
    date_to?: string
    include_dynamic?: boolean
    include_relationships?: boolean
    limit?: number
    offset?: number
    search?: string
  }
}

export function useHeraAppointments(options?: UseHeraAppointmentsOptions) {
  const queryClient = useQueryClient()

  // Fetch appointment transactions using PROPER RPC wrapper
  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions
  } = useQuery({
    queryKey: ['appointment-transactions', options?.organizationId, options?.filters],
    queryFn: async () => {
      if (!options?.organizationId) return []

      console.log('[useHeraAppointments] Fetching with getTransactions RPC:', {
        transaction_type: 'APPOINTMENT',
        organizationId: options.organizationId
      })

      // ✅ Use PROPER RPC wrapper from universal-api-v2-client
      // This calls /api/v2/transactions GET which delegates to /api/v2/universal/txn-query
      // Which calls hera_txn_query_v1 RPC with transaction_type filtering
      const txns = await getTransactions({
        orgId: options.organizationId,
        transactionType: 'APPOINTMENT' // ✅ UPPERCASE - server-side RPC filtering
      })

      console.log('[useHeraAppointments] RPC Response:', {
        count: txns.length,
        first: txns[0]
      })

      return txns
    },
    enabled: !!options?.organizationId
  })

  // Fetch customers using PROPER RPC wrapper
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['customers-for-appointments', options?.organizationId],
    queryFn: async () => {
      if (!options?.organizationId) return []

      console.log('[useHeraAppointments] Fetching CUSTOMER entities with RPC')

      // ✅ Use PROPER RPC wrapper from universal-api-v2-client
      // This calls hera_entity_read_v1 RPC with entity_type filtering
      const entities = await getEntities('', {
        p_organization_id: options.organizationId,
        p_entity_type: 'CUSTOMER', // ✅ UPPERCASE
        p_status: null, // Get all statuses
        p_include_dynamic: false,
        p_include_relationships: false
      })

      console.log('[useHeraAppointments] Customers response:', { count: entities.length })

      return entities
    },
    enabled: !!options?.organizationId
  })

  // Fetch staff (UPPERCASE) using PROPER RPC wrapper
  const { data: staffUpper = [], isLoading: staffUpperLoading } = useQuery({
    queryKey: ['staff-upper-for-appointments', options?.organizationId],
    queryFn: async () => {
      if (!options?.organizationId) return []

      console.log('[useHeraAppointments] Fetching STAFF entities with RPC')

      const entities = await getEntities('', {
        p_organization_id: options.organizationId,
        p_entity_type: 'STAFF', // ✅ UPPERCASE
        p_status: null,
        p_include_dynamic: false,
        p_include_relationships: false
      })

      console.log('[useHeraAppointments] Staff (UPPER) response:', { count: entities.length })

      return entities
    },
    enabled: !!options?.organizationId
  })

  // Fetch staff (lowercase) for backward compatibility using PROPER RPC wrapper
  const { data: staffLower = [], isLoading: staffLowerLoading } = useQuery({
    queryKey: ['staff-lower-for-appointments', options?.organizationId],
    queryFn: async () => {
      if (!options?.organizationId) return []

      console.log('[useHeraAppointments] Fetching staff entities (lowercase) with RPC')

      const entities = await getEntities('', {
        p_organization_id: options.organizationId,
        p_entity_type: 'staff', // lowercase for backward compatibility
        p_status: null,
        p_include_dynamic: false,
        p_include_relationships: false
      })

      console.log('[useHeraAppointments] Staff (lower) response:', { count: entities.length })

      return entities
    },
    enabled: !!options?.organizationId
  })

  // Merge staff
  const allStaff = useMemo(() => {
    return [...staffUpper, ...staffLower]
  }, [staffUpper, staffLower])

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
  const enrichedAppointments = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      console.log('[useHeraAppointments] No transactions to enrich')
      return []
    }

    return transactions.map((txn: any) => {
      const metadata = txn.metadata || {}
      const customerName = txn.source_entity_id
        ? (customerMap.get(txn.source_entity_id) || 'Unknown Customer')
        : 'Unknown Customer'

      const stylistName = txn.target_entity_id
        ? (staffMap.get(txn.target_entity_id) || 'Unassigned')
        : 'Unassigned'

      // Debug first appointment
      if (txn === transactions[0]) {
        console.log('[useHeraAppointments] Enriching first appointment:', {
          txnCode: txn.transaction_code,
          source_entity_id: txn.source_entity_id,
          target_entity_id: txn.target_entity_id,
          customerFound: txn.source_entity_id ? customerMap.has(txn.source_entity_id) : false,
          customerName,
          staffFound: txn.target_entity_id ? staffMap.has(txn.target_entity_id) : false,
          stylistName,
          customerMapSize: customerMap.size,
          staffMapSize: staffMap.size,
          allStaffIds: Array.from(staffMap.keys()).slice(0, 5)
        })
      }

      const appointment: Appointment = {
        id: txn.id,
        entity_name: `${customerName} - ${new Date(metadata.start_time || txn.transaction_date).toLocaleDateString()}`,
        entity_code: txn.transaction_code,
        transaction_code: txn.transaction_code,
        transaction_date: txn.transaction_date,
        customer_id: txn.source_entity_id,
        customer_name: customerName,
        stylist_id: txn.target_entity_id,
        stylist_name: stylistName,
        start_time: metadata.start_time || txn.transaction_date,
        end_time: metadata.end_time || txn.transaction_date,
        duration_minutes: metadata.duration_minutes || 0,
        price: txn.total_amount || 0,
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
    let filtered = enrichedAppointments

    // Status filter
    if (!options?.includeArchived) {
      const validStatuses = ['booked', 'checked_in', 'completed', 'active', 'DRAFT', 'pending']
      filtered = filtered.filter(apt => validStatuses.includes(apt.status))
    }

    // Branch filter
    if (options?.filters?.branch_id) {
      filtered = filtered.filter(apt => apt.branch_id === options.filters!.branch_id)
    }

    console.log('[useHeraAppointments] Filtering:', {
      total: enrichedAppointments.length,
      afterFilters: filtered.length,
      includeArchived: options?.includeArchived,
      branchFilter: options?.filters?.branch_id
    })

    return filtered
  }, [enrichedAppointments, options?.includeArchived, options?.filters?.branch_id])

  const isLoading = transactionsLoading || customersLoading || staffUpperLoading || staffLowerLoading

  console.log('[useHeraAppointments] Final summary:', {
    transactions: transactions.length,
    appointments: enrichedAppointments.length,
    filtered: filteredAppointments.length,
    customersLoaded: !customersLoading,
    staffUpperLoaded: !staffUpperLoading,
    staffLowerLoaded: !staffLowerLoading,
    isFullyLoaded: !isLoading
  })

  return {
    appointments: filteredAppointments,
    isLoading,
    error: transactionsError,
    refetch: refetchTransactions,
    // Stub methods for compatibility
    createAppointment: async () => { throw new Error('Not implemented') },
    updateAppointment: async () => { throw new Error('Not implemented') },
    archiveAppointment: async () => { throw new Error('Not implemented') },
    deleteAppointment: async () => { throw new Error('Not implemented') },
    restoreAppointment: async () => { throw new Error('Not implemented') },
    isCreating: false,
    isUpdating: false,
    isDeleting: false
  }
}
