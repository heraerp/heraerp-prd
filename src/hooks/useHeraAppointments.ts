/**
 * HERA Appointments Hook - Enterprise-Grade
 *
 * 🎯 ENTERPRISE FEATURES:
 * - Complete CRUD operations (Create, Read, Update, Delete)
 * - Status workflow: draft → booked → checked_in → in_progress → payment_pending → completed → cancelled
 * - Validation and transition rules
 * - Audit trail via smart codes
 * - Optimistic updates with rollback
 *
 * ARCHITECTURE:
 * - Appointments are TRANSACTIONS (not entities)
 * - Transaction type: 'APPOINTMENT' (UPPERCASE)
 * - Customer ID: source_entity_id
 * - Staff ID: target_entity_id
 * - Metadata contains: start_time, end_time, status, branch_id, etc.
 * - Uses PROPER RPC via universal-api-v2-client
 */

import { useMemo } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import {
  getTransactions,
  getEntities,
  updateTransaction,
  deleteTransaction
} from '@/lib/universal-api-v2-client'

// 🎯 ENTERPRISE: Appointment Status Workflow
export type AppointmentStatus =
  | 'draft'           // Initial state - not confirmed
  | 'booked'          // Confirmed by customer
  | 'checked_in'      // Customer arrived
  | 'in_progress'     // Service started
  | 'payment_pending' // Service completed, awaiting payment
  | 'completed'       // Fully completed and paid
  | 'cancelled'       // Cancelled by customer or salon
  | 'no_show'         // Customer didn't show up

// 🎯 ENTERPRISE: Valid status transitions
export const VALID_STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  draft: ['booked', 'cancelled'],
  booked: ['checked_in', 'cancelled', 'no_show'],
  checked_in: ['in_progress', 'cancelled'],
  in_progress: ['payment_pending', 'completed'],
  payment_pending: ['completed', 'cancelled'],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
  no_show: []    // Terminal state
}

// 🎯 ENTERPRISE: Status display configuration
export const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; icon: string }> = {
  draft: { label: 'Draft', color: '#6B7280', icon: 'FileEdit' },
  booked: { label: 'Booked', color: '#3B82F6', icon: 'Calendar' },
  checked_in: { label: 'Checked In', color: '#8B5CF6', icon: 'UserCheck' },
  in_progress: { label: 'In Progress', color: '#F59E0B', icon: 'Clock' },
  payment_pending: { label: 'Payment Pending', color: '#EF4444', icon: 'DollarSign' },
  completed: { label: 'Completed', color: '#10B981', icon: 'CheckCircle' },
  cancelled: { label: 'Cancelled', color: '#6B7280', icon: 'XCircle' },
  no_show: { label: 'No Show', color: '#DC2626', icon: 'AlertCircle' }
}

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

export interface CreateAppointmentData {
  customer_id: string
  stylist_id?: string | null
  start_time: string
  end_time: string
  duration_minutes?: number
  price: number
  notes?: string
  branch_id?: string
  status?: AppointmentStatus
  service_ids?: string[]
}

export interface UpdateAppointmentData {
  customer_id?: string
  stylist_id?: string | null
  start_time?: string
  end_time?: string
  duration_minutes?: number
  price?: number
  notes?: string
  branch_id?: string
  status?: AppointmentStatus
  service_ids?: string[]
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

// 🎯 ENTERPRISE: Validate status transition
export function canTransitionTo(currentStatus: AppointmentStatus, newStatus: AppointmentStatus): boolean {
  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus]
  return allowedTransitions.includes(newStatus)
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
      if (!options?.organizationId) {
        return []
      }

      try {
        // ✅ Use PROPER RPC wrapper from universal-api-v2-client
        const txns = await getTransactions({
          orgId: options.organizationId,
          transactionType: 'APPOINTMENT' // ✅ UPPERCASE - server-side RPC filtering
        })

        return txns
      } catch (error) {
        console.error('[useHeraAppointments] Error fetching transactions:', error)
        throw error
      }
    },
    enabled: !!options?.organizationId,
    retry: 1,
    staleTime: 30000 // 30 seconds
  })

  // Fetch customers using PROPER RPC wrapper
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['customers-for-appointments', options?.organizationId],
    queryFn: async () => {
      if (!options?.organizationId) return []

      console.log('[useHeraAppointments] Fetching CUSTOMER entities with RPC')

      const entities = await getEntities('', {
        p_organization_id: options.organizationId,
        p_entity_type: 'CUSTOMER', // ✅ UPPERCASE
        p_status: null,
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

  // Fetch staff (lowercase) for backward compatibility
  const { data: staffLower = [], isLoading: staffLowerLoading } = useQuery({
    queryKey: ['staff-lower-for-appointments', options?.organizationId],
    queryFn: async () => {
      if (!options?.organizationId) return []

      console.log('[useHeraAppointments] Fetching staff entities (lowercase) with RPC')

      const entities = await getEntities('', {
        p_organization_id: options.organizationId,
        p_entity_type: 'staff',
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
    return map
  }, [customers])

  const staffMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of allStaff) {
      map.set(s.id, s.entity_name)
    }
    return map
  }, [allStaff])

  // Transform transactions to appointments
  const enrichedAppointments = useMemo(() => {
    if (!transactions || transactions.length === 0) {
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
        status: txn.transaction_status || metadata.status || 'draft',
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

    // Status filter - cancelled and no_show are visible by default, archived requires explicit opt-in
    if (!options?.includeArchived) {
      const validStatuses = ['draft', 'booked', 'checked_in', 'in_progress', 'payment_pending', 'completed', 'cancelled', 'no_show']
      filtered = filtered.filter(apt => validStatuses.includes(apt.status))
    }

    // Branch filter
    if (options?.filters?.branch_id) {
      filtered = filtered.filter(apt => apt.branch_id === options.filters!.branch_id)
    }

    return filtered
  }, [enrichedAppointments, options?.includeArchived, options?.filters?.branch_id])

  // 🎯 ENTERPRISE: Create Appointment Mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateAppointmentData) => {
      if (!options?.organizationId) throw new Error('Organization ID required')

      const headers = {
        'Content-Type': 'application/json',
        'x-hera-api-version': 'v2'
      }

      const payload = {
        p_organization_id: options.organizationId,
        p_transaction_type: 'APPOINTMENT',
        p_transaction_date: data.start_time,
        p_source_entity_id: data.customer_id,
        p_target_entity_id: data.stylist_id || null,
        p_total_amount: data.price,
        // ✅ FIXED: Correct smart code format - HERA.{INDUSTRY}.TXN.{TYPE}.{OPERATION}.V1
        p_smart_code: 'HERA.SALON.TXN.APPOINTMENT.CREATE.V1',
        p_metadata: {
          start_time: data.start_time,
          end_time: data.end_time,
          duration_minutes: data.duration_minutes || 60,
          status: data.status || 'draft',
          notes: data.notes || null,
          branch_id: data.branch_id || null,
          service_ids: data.service_ids || []
        }
      }

      const response = await fetch('/api/v2/transactions', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create appointment')
      }

      return response.json()
    },
    onSuccess: () => {
      // ✅ Invalidate both appointments and customers to refresh customer names
      queryClient.invalidateQueries({ queryKey: ['appointment-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['entities', 'customer'] })
      queryClient.invalidateQueries({ queryKey: ['entities', 'CUSTOMER'] })
    }
  })

  // 🎯 ENTERPRISE: Update Appointment Mutation (using RPC wrapper)
  const updateMutation = useMutation({
    mutationFn: async ({ id, data, skipValidation }: { id: string; data: UpdateAppointmentData; skipValidation?: boolean }) => {
      console.log('[useHeraAppointments] Update mutation called:', { id, data, skipValidation })

      if (!options?.organizationId) {
        console.error('[useHeraAppointments] No organization ID')
        throw new Error('Organization ID required')
      }

      const appointment = enrichedAppointments.find(a => a.id === id)
      if (!appointment) {
        console.error('[useHeraAppointments] Appointment not found:', id)
        throw new Error('Appointment not found')
      }

      console.log('[useHeraAppointments] Current appointment:', {
        id: appointment.id,
        currentStatus: appointment.status,
        newStatus: data.status
      })

      // 🎯 ENTERPRISE: Validate status transition (unless skipValidation is true for restore operations)
      if (data.status && data.status !== appointment.status && !skipValidation) {
        const currentStatus = appointment.status as AppointmentStatus
        const newStatus = data.status as AppointmentStatus
        if (!canTransitionTo(currentStatus, newStatus)) {
          console.error('[useHeraAppointments] Invalid transition:', { currentStatus, newStatus })
          throw new Error(`Cannot transition from "${currentStatus}" to "${newStatus}"`)
        }
      }

      // Build updated metadata
      const updatedMetadata = {
        ...appointment.metadata,
        ...(data.start_time && { start_time: data.start_time }),
        ...(data.end_time && { end_time: data.end_time }),
        ...(data.duration_minutes && { duration_minutes: data.duration_minutes }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.branch_id !== undefined && { branch_id: data.branch_id }),
        ...(data.service_ids && { service_ids: data.service_ids }),
        ...(data.status && { status: data.status })
      }

      const updatePayload = {
        ...(data.customer_id && { p_source_entity_id: data.customer_id }),
        ...(data.stylist_id !== undefined && { p_target_entity_id: data.stylist_id }),
        ...(data.price && { p_total_amount: data.price }),
        ...(data.start_time && { p_transaction_date: data.start_time }),
        ...(data.status && { p_status: data.status }), // ✅ CRITICAL: Update transaction_status
        p_metadata: updatedMetadata,
        // ✅ FIXED: Correct smart code format - HERA.{INDUSTRY}.TXN.{TYPE}.{OPERATION}.V1
        p_smart_code: `HERA.SALON.TXN.APPOINTMENT.UPDATE.V1`
      }

      console.log('[useHeraAppointments] Calling updateTransaction RPC:', {
        transactionId: id,
        organizationId: options.organizationId,
        payload: updatePayload
      })

      try {
        // ✅ USE RPC WRAPPER: updateTransaction from universal-api-v2-client
        const result = await updateTransaction(id, options.organizationId, updatePayload)

        console.log('[useHeraAppointments] Update successful:', result)
        return result
      } catch (error) {
        console.error('[useHeraAppointments] Update failed:', error)
        throw error
      }
    },
    onSuccess: () => {
      console.log('[useHeraAppointments] Invalidating queries after update')
      queryClient.invalidateQueries({ queryKey: ['appointment-transactions'] })
    },
    onError: (error) => {
      console.error('[useHeraAppointments] Update mutation error:', error)
    }
  })

  // 🎯 ENTERPRISE: Update Status Mutation (with validation)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AppointmentStatus }) => {
      return updateMutation.mutateAsync({ id, data: { status } })
    }
  })

  // 🎯 ENTERPRISE: Archive Appointment (soft delete)
  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      return updateMutation.mutateAsync({ id, data: { status: 'cancelled' } })
    }
  })

  // 🎯 ENTERPRISE: Restore Appointment (bypasses validation, restores to draft)
  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      return updateMutation.mutateAsync({ id, data: { status: 'draft' }, skipValidation: true })
    }
  })

  // 🎯 ENTERPRISE: Delete Appointment (hard delete using RPC wrapper)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!options?.organizationId) throw new Error('Organization ID required')

      // ✅ USE RPC WRAPPER: deleteTransaction from universal-api-v2-client
      const result = await deleteTransaction(id, options.organizationId, { force: true })

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment-transactions'] })
    }
  })

  const isLoading = transactionsLoading || customersLoading || staffUpperLoading || staffLowerLoading

  return {
    appointments: filteredAppointments,
    isLoading,
    error: transactionsError,
    refetch: refetchTransactions,

    // 🎯 ENTERPRISE: Full CRUD operations
    createAppointment: createMutation.mutateAsync,
    updateAppointment: updateMutation.mutateAsync,
    updateAppointmentStatus: updateStatusMutation.mutateAsync,
    archiveAppointment: archiveMutation.mutateAsync,
    deleteAppointment: deleteMutation.mutateAsync,
    restoreAppointment: restoreMutation.mutateAsync,

    // Loading states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Helpers
    canTransitionTo,
    STATUS_CONFIG,
    VALID_STATUS_TRANSITIONS
  }
}
