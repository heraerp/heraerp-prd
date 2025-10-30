// ============================================================================
// HERA • Salon Appointments Kanban Schema
// ============================================================================

export type KanbanStatus =
  | 'DRAFT'
  | 'BOOKED'
  | 'IN_PROGRESS' // ✅ SIMPLIFIED: Combines CHECKED_IN → IN_SERVICE → TO_PAY into one status
  | 'DONE'
  | 'CANCELLED'

export const KANBAN_COLUMNS: { key: KanbanStatus; label: string }[] = [
  { key: 'DRAFT', label: 'Draft' },
  { key: 'BOOKED', label: 'Booked' },
  { key: 'IN_PROGRESS', label: 'In Progress' }, // ✅ Unified status for active service
  { key: 'DONE', label: 'Done' },
  { key: 'CANCELLED', label: 'Cancelled' }
]

export type CancellationReason =
  | 'no_show'
  | 'customer_request'
  | 'staff_unavailable'
  | 'emergency'
  | 'other'

export type KanbanCard = {
  id: string
  organization_id: string
  branch_id: string
  date: string // YYYY-MM-DD (Europe/London)
  status: KanbanStatus
  rank: string // lexo-rank
  start: string // ISO
  end: string // ISO
  customer_name: string
  customer_id?: string
  service_name: string
  service_id?: string
  stylist_name?: string
  stylist_id?: string
  duration?: number
  price?: number
  flags?: { vip?: boolean; new?: boolean; late?: boolean; staff_on_leave?: boolean }
  cancellation_reason?: CancellationReason // Track why appointment was cancelled
  metadata?: any
}

// ✅ SIMPLIFIED: Allowed status transitions matrix
export const ALLOWED_TRANSITIONS: Record<KanbanStatus, KanbanStatus[]> = {
  DRAFT: ['BOOKED', 'CANCELLED'],
  BOOKED: ['IN_PROGRESS', 'CANCELLED'], // ✅ Simplified: Go directly to IN_PROGRESS
  IN_PROGRESS: ['DONE', 'CANCELLED'], // ✅ Simplified: One status for entire service delivery
  DONE: [], // Terminal state
  CANCELLED: [] // Terminal state
}

// States that can be cancelled
export const CANCELLABLE_STATES: KanbanStatus[] = ['DRAFT', 'BOOKED', 'IN_PROGRESS']

// States that can be rescheduled
export const RESCHEDULABLE_STATES: KanbanStatus[] = ['DRAFT', 'BOOKED']
