// ============================================================================
// HERA • Salon Kanban Lifecycle Rules - One-Way Flow Guard
// Smart Code: HERA.SALON.KANBAN.LIFECYCLE.RULES.V1
// ✅ Enforces forward-only appointment progression
// ✅ Blocks backward moves with clear feedback
// ✅ Type-safe with TypeScript
// ============================================================================

import { KanbanStatus } from '@/schemas/kanban'

/**
 * ✅ SIMPLIFIED: Ordered pipeline of appointment states.
 * Appointments can only move FORWARD (left-to-right) through this pipeline.
 *
 * DRAFT → BOOKED → IN_PROGRESS → DONE
 *
 * IN_PROGRESS combines the old statuses: CHECKED_IN, IN_SERVICE, and TO_PAY
 * CANCELLED is a terminal state that can be reached from any state.
 */
export const APPOINTMENT_PIPELINE: ReadonlyArray<KanbanStatus> = [
  'DRAFT',
  'BOOKED',
  'IN_PROGRESS', // ✅ Unified status for service delivery (check-in → service → payment)
  'DONE',
  'CANCELLED' // Terminal state - reachable from any state
] as const

/**
 * Get the numeric index of a state in the pipeline.
 * Lower index = earlier in the flow.
 *
 * @param state - The kanban state
 * @returns Index in the pipeline, or -1 if not found
 */
export function getStateIndex(state: KanbanStatus): number {
  return APPOINTMENT_PIPELINE.indexOf(state)
}

/**
 * Check if a state transition is allowed (one-way flow).
 *
 * Rules:
 * - Same column reordering is always allowed
 * - Forward moves (to higher index) are allowed
 * - Backward moves (to lower index) are BLOCKED
 * - Moving to CANCELLED is allowed from any state
 * - Moving FROM CANCELLED is blocked (terminal state)
 * - Moving FROM DONE is blocked (terminal state)
 *
 * @param from - Current state
 * @param to - Target state
 * @returns true if transition is allowed, false otherwise
 */
export function canTransition(from: KanbanStatus, to: KanbanStatus): boolean {
  // Same column reordering is always allowed
  if (from === to) return true

  // Cannot move FROM terminal states (DONE, CANCELLED)
  if (from === 'DONE' || from === 'CANCELLED') {
    return false
  }

  // Can always move TO CANCELLED (emergency cancellation)
  if (to === 'CANCELLED') return true

  const fromIndex = getStateIndex(from)
  const toIndex = getStateIndex(to)

  // Invalid states
  if (fromIndex === -1 || toIndex === -1) return false

  // Only allow forward moves (to higher index)
  return toIndex > fromIndex
}

/**
 * Get a human-readable reason why a transition is blocked.
 *
 * @param from - Current state
 * @param to - Target state
 * @returns User-friendly error message
 */
export function getBlockedReason(from: KanbanStatus, to: KanbanStatus): string {
  if (from === to) return '' // Not blocked

  // Terminal state checks
  if (from === 'DONE') {
    return 'Cannot move appointments that are already completed. Completed appointments are final.'
  }

  if (from === 'CANCELLED') {
    return 'Cannot move cancelled appointments. Please create a new appointment instead.'
  }

  // Backward move check
  const fromIndex = getStateIndex(from)
  const toIndex = getStateIndex(to)

  if (fromIndex !== -1 && toIndex !== -1 && toIndex < fromIndex) {
    return `Cannot move backward from ${formatStateName(from)} to ${formatStateName(to)}. Appointments can only move forward in the workflow.`
  }

  return 'This move is not allowed.'
}

/**
 * Format state name for display.
 *
 * @param state - The kanban state
 * @returns Formatted state name
 */
function formatStateName(state: KanbanStatus): string {
  return state
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

/**
 * Get the next allowed states from the current state.
 *
 * @param current - Current state
 * @returns Array of allowed next states
 */
export function getNextAllowedStates(current: KanbanStatus): KanbanStatus[] {
  // Terminal states have no next states
  if (current === 'DONE' || current === 'CANCELLED') {
    return []
  }

  const currentIndex = getStateIndex(current)
  if (currentIndex === -1) return []

  // Return all states with higher index, plus CANCELLED
  const nextStates = APPOINTMENT_PIPELINE.slice(currentIndex + 1).filter(
    (state) => state !== 'CANCELLED'
  )

  // Always allow cancellation
  return [...nextStates, 'CANCELLED']
}

/**
 * Check if a state is a terminal state (no further moves allowed).
 *
 * @param state - The kanban state
 * @returns true if terminal state
 */
export function isTerminalState(state: KanbanStatus): boolean {
  return state === 'DONE' || state === 'CANCELLED'
}
