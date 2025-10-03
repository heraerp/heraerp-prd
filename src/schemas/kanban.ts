// ============================================================================
// HERA • Salon Appointments Kanban Schema
// ============================================================================

export type KanbanStatus =
  | 'DRAFT'
  | 'BOOKED'
  | 'CHECKED_IN'
  | 'IN_SERVICE'
  | 'TO_PAY'
  | 'DONE'
  | 'CANCELLED'

export const KANBAN_COLUMNS: { key: KanbanStatus; label: string }[] = [
  { key: 'DRAFT', label: 'Draft' },
  { key: 'BOOKED', label: 'Booked' },
  { key: 'CHECKED_IN', label: 'Checked-in' },
  { key: 'IN_SERVICE', label: 'In service' },
  { key: 'TO_PAY', label: 'To pay' },
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
  service_name: string
  stylist_name?: string
  flags?: { vip?: boolean; new?: boolean; late?: boolean }
  cancellation_reason?: CancellationReason // Track why appointment was cancelled
  metadata?: any
}

// Allowed status transitions matrix
export const ALLOWED_TRANSITIONS: Record<KanbanStatus, KanbanStatus[]> = {
  DRAFT: ['BOOKED', 'CANCELLED'],
  BOOKED: ['CHECKED_IN', 'CANCELLED'],
  CHECKED_IN: ['IN_SERVICE', 'CANCELLED'],
  IN_SERVICE: ['TO_PAY', 'CANCELLED'], // Allow cancel during service
  TO_PAY: ['DONE', 'CANCELLED'], // Direct to DONE, removed REVIEW
  DONE: [],
  CANCELLED: []
}

// States that can be cancelled
export const CANCELLABLE_STATES: KanbanStatus[] = ['DRAFT', 'BOOKED', 'CHECKED_IN', 'IN_SERVICE']

// States that can be rescheduled
export const RESCHEDULABLE_STATES: KanbanStatus[] = ['DRAFT', 'BOOKED', 'CHECKED_IN']
