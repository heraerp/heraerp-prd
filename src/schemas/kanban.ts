// ============================================================================
// HERA • Salon Appointments Kanban Schema
// ============================================================================

export type KanbanStatus =
  | 'DRAFT'
  | 'BOOKED'
  | 'CHECKED_IN'
  | 'IN_SERVICE'
  | 'TO_PAY'
  | 'REVIEW'
  | 'DONE'
  | 'NO_SHOW'
  | 'CANCELLED'

export const KANBAN_COLUMNS: { key: KanbanStatus; label: string }[] = [
  { key: 'DRAFT', label: 'Draft' },
  { key: 'BOOKED', label: 'Booked' },
  { key: 'CHECKED_IN', label: 'Checked-in' },
  { key: 'IN_SERVICE', label: 'In service' },
  { key: 'TO_PAY', label: 'To pay' },
  { key: 'REVIEW', label: 'Review' },
  { key: 'DONE', label: 'Done' },
  { key: 'NO_SHOW', label: 'No-show' },
  { key: 'CANCELLED', label: 'Cancelled' }
]

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
  metadata?: any
}

// Allowed status transitions matrix
export const ALLOWED_TRANSITIONS: Record<KanbanStatus, KanbanStatus[]> = {
  DRAFT: ['BOOKED', 'CANCELLED'],
  BOOKED: ['CHECKED_IN', 'CANCELLED', 'NO_SHOW'],
  CHECKED_IN: ['IN_SERVICE', 'CANCELLED'],
  IN_SERVICE: ['TO_PAY', 'CANCELLED'], // Allow cancel during service
  TO_PAY: ['REVIEW', 'DONE'],
  REVIEW: ['DONE'],
  DONE: [],
  NO_SHOW: [],
  CANCELLED: []
}

// States that can be cancelled
export const CANCELLABLE_STATES: KanbanStatus[] = ['DRAFT', 'BOOKED', 'CHECKED_IN', 'IN_SERVICE']

// States that can be rescheduled
export const RESCHEDULABLE_STATES: KanbanStatus[] = ['DRAFT', 'BOOKED', 'CHECKED_IN']
