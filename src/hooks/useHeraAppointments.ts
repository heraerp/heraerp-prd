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
 * - Uses UNIVERSAL HOOKS: useUniversalEntity + useUniversalTransaction (RPC API v2)
 *
 * LAYER ARCHITECTURE:
 * - Layer 1: Universal hooks (data layer) - useUniversalEntity, useUniversalTransaction
 * - Layer 2: Domain hook (enrichment) - useHeraAppointments (this file)
 * - Page components use this hook for enriched appointment data
 */

import { useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useUniversalEntityV1 } from './useUniversalEntityV1'
import { useUniversalTransactionV1 } from './useUniversalTransactionV1'

// 🎯 ENTERPRISE: Appointment Status Workflow
export type AppointmentStatus =
  | 'draft' // Initial state - not confirmed
  | 'booked' // Confirmed by customer
  | 'checked_in' // Customer arrived
  | 'in_progress' // Service started
  | 'payment_pending' // Service completed, awaiting payment
  | 'completed' // Fully completed and paid
  | 'cancelled' // Cancelled by customer or salon
  | 'no_show' // Customer didn't show up

// 🎯 ENTERPRISE: Flexible forward flow status transitions
// Allows skipping intermediate steps for operational efficiency
export const VALID_STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  draft: ['booked', 'checked_in', 'in_progress', 'payment_pending', 'completed', 'cancelled'],
  booked: ['checked_in', 'in_progress', 'payment_pending', 'completed', 'cancelled', 'no_show'],
  checked_in: ['in_progress', 'payment_pending', 'completed', 'cancelled', 'no_show'],
  in_progress: ['payment_pending', 'completed', 'cancelled'],
  payment_pending: ['completed', 'cancelled'],
  completed: [], // Terminal state - cannot transition from completed
  cancelled: [], // Terminal state - cannot transition from cancelled
  no_show: [] // Terminal state - cannot transition from no_show
}

// 🎯 ENTERPRISE: Status display configuration
export const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; color: string; icon: string }
> = {
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

// 🎯 ENTERPRISE: Status workflow order (for forward flow validation)
const STATUS_ORDER: AppointmentStatus[] = [
  'draft',
  'booked',
  'checked_in',
  'in_progress',
  'payment_pending',
  'completed'
]

// 🎯 ENTERPRISE: Validate status transition with detailed feedback
export function canTransitionTo(
  currentStatus: AppointmentStatus,
  newStatus: AppointmentStatus
): boolean {
  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus]
  return allowedTransitions.includes(newStatus)
}

// 🎯 ENTERPRISE: Check if transition is a forward move
export function isForwardTransition(
  currentStatus: AppointmentStatus,
  newStatus: AppointmentStatus
): boolean {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus)
  const newIndex = STATUS_ORDER.indexOf(newStatus)

  // Special cases for terminal states
  if (newStatus === 'cancelled' || newStatus === 'no_show') return true
  if (currentIndex === -1 || newIndex === -1) return false

  return newIndex > currentIndex
}

// 🎯 ENTERPRISE: Get transition error message
export function getTransitionErrorMessage(
  currentStatus: AppointmentStatus,
  newStatus: AppointmentStatus
): string {
  // Terminal states
  if (currentStatus === 'completed') {
    return 'Completed appointments cannot be changed. Create a new appointment instead.'
  }
  if (currentStatus === 'cancelled') {
    return 'Cancelled appointments cannot be changed. Please restore first.'
  }
  if (currentStatus === 'no_show') {
    return 'No-show appointments cannot be changed. Please restore first.'
  }

  // Backwards transition
  if (!isForwardTransition(currentStatus, newStatus) && newStatus !== 'cancelled' && newStatus !== 'no_show') {
    return `Cannot move backwards from "${STATUS_CONFIG[currentStatus].label}" to "${STATUS_CONFIG[newStatus].label}"`
  }

  // Invalid transition
  return `Cannot transition from "${STATUS_CONFIG[currentStatus].label}" to "${STATUS_CONFIG[newStatus].label}"`
}

export function useHeraAppointments(options?: UseHeraAppointmentsOptions) {
  const queryClient = useQueryClient()

  // ✅ LAYER 1: Fetch appointment transactions using useUniversalTransactionV1 (RPC API v2 Orchestrator)
  // 🚀 V1 UPGRADE: Single atomic RPC call with built-in guardrails (60% fewer API calls, 97ms avg)
  const {
    transactions,
    isLoading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
    create: createTransaction,
    update: updateTransaction,
    delete: deleteTransaction,
    isCreating: isCreatingTransaction,
    isUpdating: isUpdatingTransaction,
    isDeleting: isDeletingTransaction
  } = useUniversalTransactionV1({
    organizationId: options?.organizationId,
    filters: {
      transaction_type: 'APPOINTMENT', // ✅ UPPERCASE - as required by database
      date_from: options?.filters?.date_from,
      date_to: options?.filters?.date_to,
      transaction_status: options?.filters?.status, // ✅ RENAMED: status → transaction_status (RPC parameter)
      include_lines: true // ✅ V1: Include transaction lines for service details
    }
    // ✅ V1: Removed staleTime, refetchOnWindowFocus, etc. - V1 has optimized defaults
  })

  // ✅ LAYER 1: Fetch customers using useUniversalEntityV1 (RPC API v2 Orchestrator)
  const {
    entities: customers,
    isLoading: customersLoading
  } = useUniversalEntityV1({
    entity_type: 'CUSTOMER', // ✅ V1: Moved to top-level (required parameter)
    organizationId: options?.organizationId,
    filters: {
      include_dynamic: false, // ✅ Performance: Don't need dynamic data for names
      include_relationships: false,
      list_mode: 'HEADERS' // ✅ V1: Fast mode (core fields only)
    }
  })

  // ✅ LAYER 1: Fetch staff using useUniversalEntityV1 (RPC API v2 Orchestrator)
  const {
    entities: staffEntities,
    isLoading: staffLoading
  } = useUniversalEntityV1({
    entity_type: 'STAFF', // ✅ V1: Changed to UPPERCASE (HERA standard)
    organizationId: options?.organizationId,
    filters: {
      include_dynamic: false, // ✅ Performance: Don't need dynamic data for names
      include_relationships: false,
      list_mode: 'HEADERS' // ✅ V1: Fast mode (core fields only)
    }
  })

  // ✅ LAYER 1: Fetch services using useUniversalEntityV1 (RPC API v2 Orchestrator)
  const {
    entities: services,
    isLoading: servicesLoading
  } = useUniversalEntityV1({
    entity_type: 'SERVICE', // ✅ V1: Changed to UPPERCASE (HERA standard)
    organizationId: options?.organizationId,
    filters: {
      include_dynamic: true, // ✅ Need prices from dynamic_fields
      include_relationships: false,
      list_mode: 'FULL' // ✅ V1: Need complete data for prices
    }
  })

  // Use staff entities directly (no merge needed since STYLIST doesn't exist)
  const allStaff = staffEntities

  // Create lookup maps
  const customerMap = useMemo(() => {
    const map = new Map<string, string>()
    console.log('[useHeraAppointments] Building customerMap from', customers.length, 'customers')
    for (const c of customers) {
      map.set(c.id, c.entity_name)
    }
    console.log('[useHeraAppointments] Customer map size:', map.size)
    return map
  }, [customers])

  const staffMap = useMemo(() => {
    const map = new Map<string, string>()
    console.log('[useHeraAppointments] Building staffMap from', allStaff.length, 'staff')
    for (const s of allStaff) {
      map.set(s.id, s.entity_name)
    }
    console.log('[useHeraAppointments] Staff map size:', map.size)
    return map
  }, [staffEntities])

  // Create service lookup map with names and prices
  const serviceMap = useMemo(() => {
    const map = new Map<string, { name: string; price: number }>()
    for (const service of services) {
      const name = service.entity_name || 'Service'

      // Extract price from dynamic_fields array
      let price = 0
      if (Array.isArray(service.dynamic_fields)) {
        const priceField = service.dynamic_fields.find((f: any) => f.field_name === 'price_market')
        price = priceField?.field_value_number || 0
      }

      map.set(service.id, { name, price })
    }
    return map
  }, [services])

  // Transform transactions to appointments
  const enrichedAppointments = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return []
    }

    const enriched = transactions.map((txn: any, index: number) => {
      const metadata = txn.metadata || {}
      const customerName = txn.source_entity_id
        ? customerMap.get(txn.source_entity_id) || 'Unknown Customer'
        : 'Unknown Customer'

      const stylistName = txn.target_entity_id
        ? staffMap.get(txn.target_entity_id) || 'Unassigned'
        : 'Unassigned'

      if (index === 0) {
        console.log('[useHeraAppointments] First appointment enrichment:', {
          source_entity_id: txn.source_entity_id,
          target_entity_id: txn.target_entity_id,
          customerName,
          stylistName,
          customerMapHasId: customerMap.has(txn.source_entity_id),
          staffMapHasId: staffMap.has(txn.target_entity_id)
        })
      }

      // 🎯 ENTERPRISE: Enrich service data from service_ids in metadata
      const serviceIds = metadata.service_ids || []
      const serviceNames: string[] = []
      const servicePrices: number[] = []

      if (Array.isArray(serviceIds)) {
        serviceIds.forEach((serviceId: string) => {
          const serviceData = serviceMap.get(serviceId)
          if (serviceData) {
            serviceNames.push(serviceData.name)
            servicePrices.push(serviceData.price)
          } else {
            serviceNames.push('Service')
            servicePrices.push(0)
          }
        })
      }

      // 🎯 ENTERPRISE: Calculate correct total from service prices (not from database)
      // This fixes incorrect totals from old RPC bug or incomplete data
      const calculatedTotal = servicePrices.reduce((sum, price) => sum + price, 0)

      // Build enriched metadata with service names and prices
      const enrichedMetadata = {
        ...metadata,
        service_ids: serviceIds,
        service_names: serviceNames,
        service_prices: servicePrices
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
        price: calculatedTotal, // ✅ Use calculated total from service prices
        total_amount: calculatedTotal, // ✅ Use calculated total from service prices
        status: txn.transaction_status || metadata.status || 'draft',
        notes: metadata.notes,
        branch_id: metadata.branch_id,
        metadata: enrichedMetadata, // ✅ Use enriched metadata
        created_at: txn.created_at,
        updated_at: txn.updated_at,
        transaction_status: txn.transaction_status
      }

      return appointment
    })

    return enriched
  }, [transactions, customerMap, staffMap, serviceMap])

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    let filtered = enrichedAppointments

    // Status filter - cancelled and no_show are visible by default, archived requires explicit opt-in
    if (!options?.includeArchived) {
      const validStatuses = [
        'draft',
        'booked',
        'checked_in',
        'in_progress',
        'payment_pending',
        'completed',
        'cancelled',
        'no_show'
      ]
      filtered = filtered.filter(apt => validStatuses.includes(apt.status))
    }

    // Branch filter
    if (options?.filters?.branch_id) {
      filtered = filtered.filter(apt => apt.branch_id === options.filters!.branch_id)
    }

    return filtered
  }, [enrichedAppointments, options?.includeArchived, options?.filters?.branch_id])

  // 🎯 ENTERPRISE: Create Appointment - Uses useUniversalTransactionV1.create
  // ✅ V1: RPC returns complete transaction - NO REFETCH NEEDED (follows services/leave pattern)
  const createAppointment = async (data: CreateAppointmentData) => {
    console.log('[useHeraAppointments] Creating appointment:', data)

    if (!options?.organizationId) throw new Error('Organization ID required')

    // ✅ V1 RPC FORMAT: transaction + lines
    const result = await createTransaction({
      transaction_type: 'APPOINTMENT', // ✅ UPPERCASE - as required by database
      smart_code: 'HERA.SALON.TXN.APPOINTMENT.CREATE.v1', // ✅ Matches POS pattern (SALE.CREATE)
      transaction_code: `APT-${Date.now()}`, // ✅ V1: Auto-generate code
      transaction_date: data.start_time,
      source_entity_id: data.customer_id,
      target_entity_id: data.stylist_id || null,
      total_amount: data.price,
      transaction_status: data.status || 'draft', // ✅ V1: status → transaction_status
      metadata: {
        start_time: data.start_time,
        end_time: data.end_time,
        duration_minutes: data.duration_minutes || 60,
        notes: data.notes || null,
        branch_id: data.branch_id || null
      },
      // ✅ V1: Service lines (proper transaction structure)
      lines: (data.service_ids || []).map((serviceId, index) => ({
        line_number: index + 1,
        line_type: 'service',
        entity_id: serviceId,
        description: serviceMap.get(serviceId)?.name || 'Service',
        quantity: 1,
        unit_amount: serviceMap.get(serviceId)?.price || 0,
        line_amount: serviceMap.get(serviceId)?.price || 0,
        smart_code: 'HERA.SALON.SVC.LINE.STANDARD.v1' // ✅ Matches POS service line pattern
      }))
    })

    console.log('[useHeraAppointments] ✅ Appointment created:', result)

    // ✅ V1: Hook automatically updates cache with returned data (optimistic update)
    // ✅ NO invalidateQueries needed - cache already updated by useUniversalTransactionV1
    // (follows services/leave pattern)

    return result
  }

  // 🎯 ENTERPRISE: Update Appointment - Uses useUniversalTransactionV1.update
  // ✅ V1: RPC returns complete updated transaction - NO REFETCH NEEDED (follows services/leave pattern)
  const updateAppointment = async ({
    id,
    data,
    skipValidation
  }: {
    id: string
    data: UpdateAppointmentData
    skipValidation?: boolean
  }) => {
    console.log('[useHeraAppointments] Updating appointment:', { id, data, skipValidation })

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
      ...(data.branch_id !== undefined && { branch_id: data.branch_id })
      // ✅ V1: Removed service_ids from metadata (handled by lines)
    }

    // ✅ V1: Use updateTransaction from useUniversalTransactionV1
    const result = await updateTransaction({
      transaction_id: id,
      // ✅ V1: Removed smart_code from update (not needed for UPDATE action)
      ...(data.customer_id && { source_entity_id: data.customer_id }),
      ...(data.stylist_id !== undefined && { target_entity_id: data.stylist_id }),
      ...(data.price && { total_amount: data.price }),
      ...(data.start_time && { transaction_date: data.start_time }),
      ...(data.status && { transaction_status: data.status }), // ✅ V1: status → transaction_status
      metadata: updatedMetadata
    })

    console.log('[useHeraAppointments] ✅ Appointment updated:', result)

    // ✅ V1: Hook automatically updates cache with returned data (optimistic update)
    // ✅ NO manual refetch needed - cache already updated by useUniversalTransactionV1
    // (follows services/leave pattern)

    return result
  }

  // 🎯 ENTERPRISE: Update Status (with validation)
  const updateAppointmentStatus = async ({ id, status }: { id: string; status: AppointmentStatus }) => {
    return updateAppointment({ id, data: { status } })
  }

  // 🎯 ENTERPRISE: Archive Appointment (soft delete)
  const archiveAppointment = async (id: string) => {
    return updateAppointment({ id, data: { status: 'cancelled' } })
  }

  // 🎯 ENTERPRISE: Restore Appointment (bypasses validation, restores to draft)
  const restoreAppointment = async (id: string) => {
    return updateAppointment({ id, data: { status: 'draft' }, skipValidation: true })
  }

  // 🎯 ENTERPRISE: Delete Appointment - Uses useUniversalTransactionV1.delete
  // ✅ V1: Hook automatically removes from cache - NO REFETCH NEEDED (follows services/leave pattern)
  // 🛡️ BUSINESS RULE: Only empty DRAFT transactions can be deleted. Others must be VOIDED/CANCELLED.
  const deleteAppointmentFunc = async (id: string) => {
    console.log('[useHeraAppointments] Deleting appointment:', id)

    if (!options?.organizationId) throw new Error('Organization ID required')

    // Find the appointment to check its status and lines
    const appointment = enrichedAppointments.find(a => a.id === id)
    if (!appointment) {
      throw new Error('Appointment not found')
    }

    // 🛡️ BUSINESS RULE: Check if appointment can be deleted
    const serviceIds = appointment.metadata?.service_ids || []
    const hasLines = Array.isArray(serviceIds) && serviceIds.length > 0
    const isDraft = appointment.status === 'draft'

    // If appointment has lines or is not draft, use archive (cancel) instead
    if (hasLines || !isDraft) {
      console.log('[useHeraAppointments] Appointment has lines or is not draft, using archive instead')
      return archiveAppointment(id)
    }

    // ✅ V1: Use deleteTransaction from useUniversalTransactionV1 for empty drafts
    const result = await deleteTransaction({
      transaction_id: id,
      hard_delete: true // ✅ V1: force → hard_delete (RPC parameter name)
    })

    console.log('[useHeraAppointments] ✅ Appointment deleted:', result)

    // ✅ V1: Hook automatically removes deleted item from cache (optimistic update)
    // ✅ NO manual refetch needed - cache already updated by useUniversalTransactionV1
    // (follows services/leave pattern)

    return result
  }

  const isLoading =
    transactionsLoading || customersLoading || staffLoading || servicesLoading

  return {
    appointments: filteredAppointments,
    isLoading,
    error: transactionsError,
    refetch: refetchTransactions,

    // 🎯 ENTERPRISE: Full CRUD operations - Using universal hooks
    createAppointment,
    updateAppointment,
    updateAppointmentStatus,
    archiveAppointment,
    deleteAppointment: deleteAppointmentFunc,
    restoreAppointment,

    // Loading states - From useUniversalTransaction
    isCreating: isCreatingTransaction,
    isUpdating: isUpdatingTransaction,
    isDeleting: isDeletingTransaction,

    // Helpers
    canTransitionTo,
    isForwardTransition,
    getTransitionErrorMessage,
    STATUS_CONFIG,
    VALID_STATUS_TRANSITIONS,

    // Optimistically add/update an appointment in all appointment caches
    upsertLocal: (apt: Appointment) => {
      const qk = ['transactions'] // ✅ Updated to match useUniversalTransaction query key
      // Update any matching queries regardless of date filter
      queryClient.setQueriesData({ queryKey: qk, exact: false }, (old: any) => {
        const arr = Array.isArray(old) ? old : old?.transactions
        if (!arr) return old ?? [apt]
        const idx = arr.findIndex((a: Appointment) => a.id === apt.id)
        const next = idx >= 0 ? [...arr.slice(0, idx), apt, ...arr.slice(idx + 1)] : [apt, ...arr]
        // Preserve shape if previous was object
        return Array.isArray(old) ? next : { ...(old || {}), transactions: next }
      })
    }
  }
}
