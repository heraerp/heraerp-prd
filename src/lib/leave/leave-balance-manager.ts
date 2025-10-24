/**
 * ============================================================================
 * ENTERPRISE LEAVE BALANCE MANAGER
 * ============================================================================
 *
 * Manages leave balances stored as dynamic data on STAFF entities.
 *
 * Architecture:
 * - Balances stored in core_dynamic_data (not metadata)
 * - Automatically recalculated on transaction changes
 * - Supports multiple leave types (ANNUAL, SICK, UNPAID)
 * - Indexed for fast queries
 *
 * Dynamic Fields per STAFF entity:
 * - leave_balance_annual (number) - Available days
 * - leave_used_annual (number) - Used days this year
 * - leave_pending_annual (number) - Pending days
 * - leave_carry_over (number) - Carry over from previous year
 * - leave_total_allocation (number) - Entitlement + carry over
 * - leave_last_calculated (date) - Last calculation timestamp
 * - leave_year (number) - Year of this balance
 */

import { apiV2 } from '@/lib/client/fetchV2'

// ============================================================================
// Types
// ============================================================================

export interface LeaveBalanceData {
  staff_id: string
  staff_name: string
  policy_id: string
  entitlement: number
  carry_over: number
  total_allocation: number
  used_days: number
  pending_days: number
  remaining_days: number
  available_days: number
  last_calculated: string
  year: number
}

export interface LeaveTransaction {
  id: string
  staff_id: string
  leave_type: 'ANNUAL' | 'SICK' | 'UNPAID' | 'OTHER'
  start_date: string
  end_date: string
  total_days: number
  current_status: string
}

// ============================================================================
// Dynamic Field Definitions (HERA Standard)
// ============================================================================

export const LEAVE_BALANCE_FIELDS = {
  ANNUAL: {
    balance: {
      name: 'leave_balance_annual',
      type: 'number' as const,
      smart_code: 'HERA.SALON.HR.STAFF.DYN.LEAVE.BALANCE.ANNUAL.V1'
    },
    used: {
      name: 'leave_used_annual',
      type: 'number' as const,
      smart_code: 'HERA.SALON.HR.STAFF.DYN.LEAVE.USED.ANNUAL.V1'
    },
    pending: {
      name: 'leave_pending_annual',
      type: 'number' as const,
      smart_code: 'HERA.SALON.HR.STAFF.DYN.LEAVE.PENDING.ANNUAL.V1'
    },
    carryOver: {
      name: 'leave_carry_over',
      type: 'number' as const,
      smart_code: 'HERA.SALON.HR.STAFF.DYN.LEAVE.CARRYOVER.V1'
    },
    totalAllocation: {
      name: 'leave_total_allocation',
      type: 'number' as const,
      smart_code: 'HERA.SALON.HR.STAFF.DYN.LEAVE.ALLOCATION.V1'
    },
    lastCalculated: {
      name: 'leave_last_calculated',
      type: 'date' as const,
      smart_code: 'HERA.SALON.HR.STAFF.DYN.LEAVE.CALCULATED.V1'
    },
    year: {
      name: 'leave_year',
      type: 'number' as const,
      smart_code: 'HERA.SALON.HR.STAFF.DYN.LEAVE.YEAR.V1'
    }
  }
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Calculate leave balance from transactions
 * This is the source of truth calculation
 */
export function calculateLeaveBalance(
  staffId: string,
  staffName: string,
  transactions: LeaveTransaction[],
  policyEntitlement: number,
  carryOverDays: number,
  year: number = new Date().getFullYear()
): LeaveBalanceData {
  // Filter transactions for this year and staff
  const staffTransactions = transactions.filter(txn => {
    const startDate = new Date(txn.start_date)
    return txn.staff_id === staffId && startDate.getFullYear() === year
  })

  // Calculate used days (approved only)
  const usedDays = staffTransactions
    .filter(txn => txn.current_status === 'APPROVED')
    .reduce((sum, txn) => sum + txn.total_days, 0)

  // Calculate pending days
  const pendingDays = staffTransactions
    .filter(txn =>
      txn.current_status === 'SUBMITTED' ||
      txn.current_status === 'PENDING_APPROVAL'
    )
    .reduce((sum, txn) => sum + txn.total_days, 0)

  // Calculate balances
  const totalAllocation = policyEntitlement + carryOverDays
  const remainingDays = totalAllocation - usedDays
  const availableDays = remainingDays - pendingDays

  return {
    staff_id: staffId,
    staff_name: staffName,
    policy_id: '', // Will be set by caller
    entitlement: policyEntitlement,
    carry_over: carryOverDays,
    total_allocation: totalAllocation,
    used_days: usedDays,
    pending_days: pendingDays,
    remaining_days: remainingDays,
    available_days: availableDays,
    last_calculated: new Date().toISOString(),
    year
  }
}

/**
 * Persist leave balance to dynamic data fields
 * This stores the calculated balance in core_dynamic_data
 *
 * ⚠️ DEPRECATED: This function should be called through the hook's update function
 * Instead, use the updateStaffEntity from useUniversalEntity which calls
 * the Universal API v2 with dynamic field updates
 *
 * This function is kept for backward compatibility but will be removed in future versions
 */
export async function persistLeaveBalance(
  organizationId: string,
  staffEntityId: string,
  balance: LeaveBalanceData
): Promise<void> {
  console.warn('[LeaveBalanceManager] ⚠️ persistLeaveBalance is deprecated - use updateStaffEntity from useUniversalEntity instead')

  // This function is now a no-op - balance persistence should be done through the hook
  // The hook will use Universal API v2 to update entity with dynamic fields atomically
  return
}

/**
 * Read leave balance from dynamic data fields
 * This retrieves the stored balance from core_dynamic_data
 */
export async function readLeaveBalance(
  organizationId: string,
  staffEntityId: string
): Promise<LeaveBalanceData | null> {
  try {
    // Fetch dynamic data for this staff member
    const response = await apiV2.get('dynamic-data', {
      p_organization_id: organizationId,
      p_entity_id: staffEntityId,
      p_limit: 100
    })

    const dynamicData = response.data || []

    // Extract balance fields
    const getField = (fieldName: string, defaultValue: any = 0) => {
      const field = dynamicData.find((f: any) => f.field_name === fieldName)
      if (!field) return defaultValue

      return field.field_value_number ??
             field.field_value_text ??
             field.field_value_date ??
             defaultValue
    }

    // Check if balance exists
    const lastCalculated = getField(LEAVE_BALANCE_FIELDS.ANNUAL.lastCalculated.name, null)
    if (!lastCalculated) {
      return null // No balance stored yet
    }

    return {
      staff_id: staffEntityId,
      staff_name: '', // Will be filled by caller
      policy_id: '', // Will be filled by caller
      entitlement: 0, // Derived from policy
      carry_over: getField(LEAVE_BALANCE_FIELDS.ANNUAL.carryOver.name),
      total_allocation: getField(LEAVE_BALANCE_FIELDS.ANNUAL.totalAllocation.name),
      used_days: getField(LEAVE_BALANCE_FIELDS.ANNUAL.used.name),
      pending_days: getField(LEAVE_BALANCE_FIELDS.ANNUAL.pending.name),
      remaining_days: 0, // Calculated
      available_days: getField(LEAVE_BALANCE_FIELDS.ANNUAL.balance.name),
      last_calculated: lastCalculated,
      year: getField(LEAVE_BALANCE_FIELDS.ANNUAL.year.name, new Date().getFullYear())
    }
  } catch (error) {
    console.error('[LeaveBalanceManager] ❌ Failed to read balance:', error)
    return null
  }
}

/**
 * Recalculate and update balance for a single staff member
 * Call this whenever leave transactions change
 */
export async function refreshStaffBalance(
  organizationId: string,
  staffEntityId: string,
  staffName: string,
  transactions: LeaveTransaction[],
  policyEntitlement: number,
  carryOverDays: number = 0,
  year: number = new Date().getFullYear()
): Promise<LeaveBalanceData> {
  // Calculate balance from transactions
  const balance = calculateLeaveBalance(
    staffEntityId,
    staffName,
    transactions,
    policyEntitlement,
    carryOverDays,
    year
  )

  // Persist to dynamic data
  await persistLeaveBalance(organizationId, staffEntityId, balance)

  return balance
}

/**
 * Bulk recalculate balances for all staff
 * Use for data migration or end-of-year processing
 */
export async function bulkRefreshBalances(
  organizationId: string,
  staff: Array<{ id: string; entity_name: string; policy_id?: string }>,
  transactions: LeaveTransaction[],
  policies: Map<string, { entitlement: number; carry_over_cap: number }>,
  defaultEntitlement: number = 21,
  year: number = new Date().getFullYear()
): Promise<void> {
  const promises = staff.map(async (staffMember) => {
    const policy = staffMember.policy_id
      ? policies.get(staffMember.policy_id)
      : null

    const entitlement = policy?.entitlement || defaultEntitlement
    const carryOverCap = policy?.carry_over_cap || 5

    // Get carry over from existing balance or default to 0
    const existingBalance = await readLeaveBalance(organizationId, staffMember.id)
    const carryOver = existingBalance?.carry_over || 0

    return refreshStaffBalance(
      organizationId,
      staffMember.id,
      staffMember.entity_name,
      transactions,
      entitlement,
      Math.min(carryOver, carryOverCap),
      year
    )
  })

  await Promise.all(promises)
}

/**
 * Check if balance needs refresh (stale data check)
 * Returns true if balance hasn't been updated in the last 24 hours
 */
export function isBalanceStale(balance: LeaveBalanceData | null): boolean {
  if (!balance || !balance.last_calculated) return true

  const lastCalc = new Date(balance.last_calculated)
  const now = new Date()
  const hoursSinceUpdate = (now.getTime() - lastCalc.getTime()) / (1000 * 60 * 60)

  return hoursSinceUpdate > 24 // Stale after 24 hours
}
