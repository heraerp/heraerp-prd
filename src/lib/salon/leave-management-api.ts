/**
 * HERA Leave Management API - Universal Architecture Extension
 * 
 * Uses the Sacred 6-Table architecture:
 * - core_entities: Employees, Calendar Events
 * - core_dynamic_data: Leave policies, balances, calendar settings
 * - core_relationships: Employee->Manager, Leave->Calendar Event
 * - universal_transactions: Leave requests, approvals, adjustments
 * - universal_transaction_lines: Daily leave breakdown with audit trail
 */

import { universalApi } from '@/lib/universal-api'
import { format, eachDayOfInterval, isWeekend, isWithinInterval, differenceInDays, isSameDay } from 'date-fns'

// Smart Code definitions for Leave Management
export const LEAVE_SMART_CODES = {
  // Entity smart codes
  EMPLOYEE: 'HERA.SALON.HR.EMPLOYEE.RECORD.v1',
  CALENDAR_EVENT: 'HERA.SALON.CALENDAR.EVENT.v1',
  
  // Transaction smart codes
  LEAVE_REQUEST: 'HERA.SALON.HR.LEAVE.REQUEST.v1',
  LEAVE_APPROVAL: 'HERA.SALON.HR.LEAVE.APPROVAL.v1',
  LEAVE_CANCELLATION: 'HERA.SALON.HR.LEAVE.CANCELLATION.v1',
  LEAVE_ADJUSTMENT: 'HERA.SALON.HR.LEAVE.ADJUSTMENT.v1',
  
  // Relationship smart codes
  REPORTS_TO: 'HERA.SALON.HR.REPORTS.TO.v1',
  LEAVE_CALENDAR_SYNC: 'HERA.SALON.LEAVE.CALENDAR.SYNC.v1',
  
  // Dynamic field smart codes
  LEAVE_POLICY: 'HERA.SALON.HR.LEAVE.POLICY.v1',
  LEAVE_BALANCE: 'HERA.SALON.HR.LEAVE.BALANCE.v1',
  CALENDAR_SETTINGS: 'HERA.SALON.HR.CALENDAR.SETTINGS.v1'
} as const

export interface LeaveRequest {
  employeeId: string
  leaveType: 'annual' | 'sick' | 'unpaid' | 'maternity' | 'paternity' | 'bereavement'
  startDate: string
  endDate: string
  partialDays?: {
    type: 'full' | 'half' | 'am' | 'pm'
    dates?: Record<string, 'am' | 'pm'> // For specific half-day configurations
  }
  reason: string
  deductFromBalance: boolean
  coverageNotes?: string
}

export interface LeaveBalance {
  employeeId: string
  leaveType: string
  totalAllowance: number
  used: number
  pending: number
  available: number
  carryForward: number
  expiryDate?: string
}

export interface CalendarSyncSettings {
  provider: 'google' | 'outlook' | 'none'
  accountId?: string
  syncEnabled: boolean
  privacyMode: 'full' | 'busy' | 'private'
  colorCoding?: Record<string, string> // Leave type to color mapping
}

export class LeaveManagementApi {
  constructor(private api: typeof universalApi) {}

  /**
   * Create a leave request with automatic line expansion
   */
  async createLeaveRequest(request: LeaveRequest, organizationId: string) {
    // Validate dates and calculate business days
    const businessDays = await this.calculateBusinessDays(
      request.startDate,
      request.endDate,
      request.partialDays,
      organizationId
    )

    // Check for overlapping requests
    const hasOverlap = await this.checkLeaveOverlap(
      request.employeeId,
      request.startDate,
      request.endDate,
      organizationId
    )

    if (hasOverlap) {
      throw new Error('Leave request overlaps with existing leave')
    }

    // Check balance if deductible
    if (request.deductFromBalance) {
      const balance = await this.getEmployeeBalance(
        request.employeeId,
        request.leaveType,
        organizationId
      )
      
      if (balance.available < businessDays) {
        throw new Error(`Insufficient leave balance. Available: ${balance.available}, Requested: ${businessDays}`)
      }
    }

    // Create the leave request transaction
    const transaction = await this.api.createTransaction({
      transaction_type: 'leave_request',
      smart_code: LEAVE_SMART_CODES.LEAVE_REQUEST,
      reference_number: `LEAVE-${Date.now()}`,
      transaction_date: new Date().toISOString(),
      total_amount: businessDays, // Days as amount for reporting
      metadata: {
        from_entity_id: request.employeeId,
        leave_type: request.leaveType,
        start_date: request.startDate,
        end_date: request.endDate,
        partial_days: request.partialDays,
        reason: request.reason,
        deduct_from_balance: request.deductFromBalance,
        coverage_notes: request.coverageNotes,
        approval_status: 'pending'
      }
    }, organizationId)

    // Create transaction lines for each day
    const lines = await this.createLeaveLines(
      transaction.id,
      request.startDate,
      request.endDate,
      request.partialDays,
      request.leaveType,
      organizationId
    )

    return { transaction, lines, businessDays }
  }

  /**
   * Approve a leave request with calendar sync
   */
  async approveLeaveRequest(
    requestId: string,
    approverId: string,
    organizationId: string
  ) {
    // Get the original request
    const request = await this.api.getTransaction(requestId)
    
    if (!request || request.metadata.approval_status !== 'pending') {
      throw new Error('Invalid leave request or already processed')
    }

    // Create approval transaction
    const approval = await this.api.createTransaction({
      transaction_type: 'leave_approval',
      smart_code: LEAVE_SMART_CODES.LEAVE_APPROVAL,
      from_entity_id: approverId,
      to_entity_id: request.from_entity_id,
      reference_entity_id: requestId,
      transaction_date: new Date().toISOString(),
      total_amount: request.total_amount,
      metadata: {
        original_request_id: requestId,
        approved_at: new Date().toISOString()
      },
      organization_id: organizationId
    })

    // Update request status
    await this.api.setDynamicField(
      requestId,
      'approval_status',
      'approved',
      'transaction',
      organizationId
    )

    // Update leave balance if deductible
    if (request.metadata.deduct_from_balance) {
      await this.updateLeaveBalance(
        request.from_entity_id,
        request.metadata.leave_type,
        -request.total_amount, // Negative to deduct
        organizationId
      )
    }

    // Sync to calendar
    const calendarEvent = await this.syncToCalendar(request, organizationId)

    return { approval, calendarEvent }
  }

  /**
   * Cancel an approved leave request
   */
  async cancelLeaveRequest(
    requestId: string,
    cancellerId: string,
    reason: string,
    organizationId: string
  ) {
    const request = await this.api.getTransaction(requestId)
    
    if (!request || request.metadata.approval_status === 'cancelled') {
      throw new Error('Invalid leave request or already cancelled')
    }

    // Create cancellation transaction
    const cancellation = await this.api.createTransaction({
      transaction_type: 'leave_cancellation',
      smart_code: LEAVE_SMART_CODES.LEAVE_CANCELLATION,
      from_entity_id: cancellerId,
      reference_entity_id: requestId,
      transaction_date: new Date().toISOString(),
      total_amount: -request.total_amount, // Negative to reverse
      metadata: {
        original_request_id: requestId,
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString()
      },
      organization_id: organizationId
    })

    // Update request status
    await this.api.setDynamicField(
      requestId,
      'approval_status',
      'cancelled',
      'transaction',
      organizationId
    )

    // Restore balance if it was deducted
    if (request.metadata.deduct_from_balance && request.metadata.approval_status === 'approved') {
      await this.updateLeaveBalance(
        request.from_entity_id,
        request.metadata.leave_type,
        request.total_amount, // Positive to restore
        organizationId
      )
    }

    // Remove from calendar
    await this.removeFromCalendar(requestId, organizationId)

    return cancellation
  }

  /**
   * Get employee leave balance
   */
  async getEmployeeBalance(
    employeeId: string,
    leaveType: string,
    organizationId: string
  ): Promise<LeaveBalance> {
    // Get all transactions affecting this employee's balance
    const transactionsResponse = await this.api.getTransactions(organizationId)
    const allTransactions = transactionsResponse.success ? transactionsResponse.data || [] : []
    
    // Filter for this employee's leave transactions
    const transactions = allTransactions.filter(txn => 
      [LEAVE_SMART_CODES.LEAVE_REQUEST, 
       LEAVE_SMART_CODES.LEAVE_ADJUSTMENT, 
       LEAVE_SMART_CODES.LEAVE_CANCELLATION].includes(txn.smart_code) &&
      txn.from_entity_id === employeeId &&
      txn.metadata?.leave_type === leaveType
    )

    // Get policy settings - for now use defaults
    const policy = {
      annual_allowance_days: 21,
      carry_forward_limit: 5
    }

    const totalAllowance = policy.annual_allowance_days || 21
    const carryForwardLimit = policy.carry_forward_limit || 5

    // Calculate used and pending
    let used = 0
    let pending = 0

    transactions.forEach(txn => {
      if (txn.metadata.approval_status === 'approved' && txn.metadata.deduct_from_balance) {
        if (txn.smart_code === LEAVE_SMART_CODES.LEAVE_REQUEST) {
          used += txn.total_amount
        } else if (txn.smart_code === LEAVE_SMART_CODES.LEAVE_CANCELLATION) {
          used += txn.total_amount // Negative amount
        }
      } else if (txn.metadata.approval_status === 'pending') {
        pending += txn.total_amount
      }
    })

    return {
      employeeId,
      leaveType,
      totalAllowance,
      used,
      pending,
      available: totalAllowance - used - pending,
      carryForward: Math.min(totalAllowance - used, carryForwardLimit),
      expiryDate: new Date(new Date().getFullYear() + 1, 2, 31).toISOString() // March 31 next year
    }
  }

  /**
   * Create manual balance adjustment
   */
  async createBalanceAdjustment(
    employeeId: string,
    leaveType: string,
    adjustmentDays: number,
    reason: string,
    adjusterId: string,
    organizationId: string
  ) {
    const adjustment = await this.api.createTransaction({
      transaction_type: 'leave_adjustment',
      smart_code: LEAVE_SMART_CODES.LEAVE_ADJUSTMENT,
      from_entity_id: employeeId,
      to_entity_id: adjusterId,
      transaction_date: new Date().toISOString(),
      total_amount: adjustmentDays,
      metadata: {
        leave_type: leaveType,
        adjustment_reason: reason,
        adjustment_type: adjustmentDays > 0 ? 'credit' : 'debit',
        created_by: adjusterId
      },
      organization_id: organizationId
    })

    return adjustment
  }

  /**
   * Get team leave overview
   */
  async getTeamLeaveOverview(
    managerId: string,
    startDate: string,
    endDate: string,
    organizationId: string
  ) {
    // Get team members reporting to this manager
    const relationshipsResponse = await this.api.getRelationships(managerId, organizationId)
    const allRelationships = relationshipsResponse.success ? relationshipsResponse.data || [] : []
    
    const teamMembers = allRelationships.filter(rel => 
      rel.relationship_type === LEAVE_SMART_CODES.REPORTS_TO &&
      rel.to_entity_id === managerId
    )

    const teamIds = teamMembers.map(rel => rel.from_entity_id)

    // Get all leave for team members in date range
    const transactionsResponse = await this.api.getTransactions(organizationId)
    const allTransactions = transactionsResponse.success ? transactionsResponse.data || [] : []
    
    const teamLeave = allTransactions.filter(txn => {
      const startDateCheck = txn.metadata?.start_date >= startDate
      const endDateCheck = txn.metadata?.end_date <= endDate
      return (
        txn.smart_code === LEAVE_SMART_CODES.LEAVE_REQUEST &&
        teamIds.includes(txn.from_entity_id) &&
        ['approved', 'pending'].includes(txn.metadata?.approval_status) &&
        startDateCheck && endDateCheck
      )
    })

    return teamLeave
  }

  /**
   * Generate annual leave report
   */
  async generateAnnualLeaveReport(
    organizationId: string,
    fiscalYearStart: string,
    fiscalYearEnd: string,
    options?: {
      groupBy?: 'employee' | 'department' | 'leave_type'
      includeForecasts?: boolean
      format?: 'summary' | 'detailed'
    }
  ) {
    // Get all employees
    const employeesResponse = await this.api.getEntities('employee', organizationId)
    const employees = employeesResponse.success ? employeesResponse.data || [] : []

    // Get all leave transactions for the fiscal year
    const transactionsResponse = await this.api.getTransactions(organizationId)
    const allTransactions = transactionsResponse.success ? transactionsResponse.data || [] : []
    
    // Filter for leave transactions in the fiscal year
    const leaveTransactions = allTransactions.filter(txn => {
      const txnDate = new Date(txn.transaction_date)
      const startDate = new Date(fiscalYearStart)
      const endDate = new Date(fiscalYearEnd)
      
      return (
        [LEAVE_SMART_CODES.LEAVE_REQUEST, 
         LEAVE_SMART_CODES.LEAVE_ADJUSTMENT, 
         LEAVE_SMART_CODES.LEAVE_CANCELLATION].includes(txn.smart_code) &&
        txnDate >= startDate && 
        txnDate <= endDate
      )
    })

    // Build report data
    const reportData = await Promise.all(
      employees.map(async (employee) => {
        const balances = await Promise.all([
          this.getEmployeeBalance(employee.id, 'annual', organizationId),
          this.getEmployeeBalance(employee.id, 'sick', organizationId)
        ])

        return {
          employee,
          balances,
          transactions: leaveTransactions.filter(txn => txn.from_entity_id === employee.id)
        }
      })
    )

    // Apply grouping and formatting based on options
    return this.formatLeaveReport(reportData, options)
  }

  // Private helper methods

  private async calculateBusinessDays(
    startDate: string,
    endDate: string,
    partialDays: LeaveRequest['partialDays'],
    organizationId: string
  ): Promise<number> {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = eachDayOfInterval({ start, end })

    // Get organization holidays
    const holidays = await this.getOrganizationHolidays(organizationId)

    let businessDays = 0
    days.forEach(day => {
      if (!isWeekend(day) && !holidays.some(h => isSameDay(new Date(h), day))) {
        if (partialDays?.type === 'half') {
          businessDays += 0.5
        } else {
          businessDays += 1
        }
      }
    })

    return businessDays
  }

  private async checkLeaveOverlap(
    employeeId: string,
    startDate: string,
    endDate: string,
    organizationId: string
  ): Promise<boolean> {
    const transactionsResponse = await this.api.getTransactions(organizationId)
    const allTransactions = transactionsResponse.success ? transactionsResponse.data || [] : []
    
    const existingLeave = allTransactions.filter(txn => 
      txn.smart_code === LEAVE_SMART_CODES.LEAVE_REQUEST &&
      txn.from_entity_id === employeeId &&
      ['pending', 'approved'].includes(txn.metadata?.approval_status)
    )

    return existingLeave.some(leave => {
      const leaveStart = new Date(leave.metadata.start_date)
      const leaveEnd = new Date(leave.metadata.end_date)
      const requestStart = new Date(startDate)
      const requestEnd = new Date(endDate)

      return (
        isWithinInterval(requestStart, { start: leaveStart, end: leaveEnd }) ||
        isWithinInterval(requestEnd, { start: leaveStart, end: leaveEnd }) ||
        isWithinInterval(leaveStart, { start: requestStart, end: requestEnd })
      )
    })
  }

  private async createLeaveLines(
    transactionId: string,
    startDate: string,
    endDate: string,
    partialDays: LeaveRequest['partialDays'],
    leaveType: string,
    organizationId: string
  ) {
    const days = eachDayOfInterval({
      start: new Date(startDate),
      end: new Date(endDate)
    })

    const lines = await Promise.all(
      days.map(async (day, index) => {
        const isPartial = partialDays?.type === 'half' || 
                         partialDays?.dates?.[format(day, 'yyyy-MM-dd')]

        return this.api.createTransactionLine({
          transaction_id: transactionId,
          line_number: index + 1,
          line_date: format(day, 'yyyy-MM-dd'),
          quantity: isPartial ? 0.5 : 1,
          unit_price: 1, // 1 day
          line_amount: isPartial ? 0.5 : 1,
          metadata: {
            day_type: isPartial ? 'partial' : 'full',
            leave_type: leaveType,
            is_weekend: isWeekend(day),
            deductible: !isWeekend(day)
          },
          organization_id: organizationId
        })
      })
    )

    return lines
  }

  private async updateLeaveBalance(
    employeeId: string,
    leaveType: string,
    adjustment: number,
    organizationId: string
  ) {
    // This would be handled by auto-journal rules in production
    // For now, we'll create a transaction to track the balance change
    await this.api.createTransaction({
      transaction_type: 'leave_balance_adjustment',
      from_entity_id: employeeId,
      transaction_date: new Date().toISOString(),
      total_amount: adjustment,
      metadata: {
        leave_type: leaveType,
        adjustment_type: adjustment > 0 ? 'credit' : 'debit',
        adjustment_reason: 'leave_approval'
      },
      smart_code: 'HERA.SALON.HR.LEAVE.BALANCE.ADJUSTMENT.v1'
    }, organizationId)
  }

  private async syncToCalendar(
    leaveRequest: any,
    organizationId: string
  ) {
    // Get employee calendar settings
    const calendarSettings = await this.api.getDynamicFields(
      leaveRequest.from_entity_id,
      ['calendar_provider', 'calendar_account_id'],
      organizationId
    )

    if (!calendarSettings.calendar_provider || calendarSettings.calendar_provider === 'none') {
      return null
    }

    // Create calendar event entity
    const calendarEvent = await this.api.createEntity({
      entity_type: 'calendar_event',
      entity_name: `Leave: ${leaveRequest.metadata.leave_type}`,
      smart_code: LEAVE_SMART_CODES.CALENDAR_EVENT,
      metadata: {
        provider: calendarSettings.calendar_provider,
        account_id: calendarSettings.calendar_account_id,
        start_date: leaveRequest.metadata.start_date,
        end_date: leaveRequest.metadata.end_date,
        all_day: true,
        title: `${leaveRequest.metadata.leave_type} Leave`,
        privacy: 'busy'
      },
      organization_id: organizationId
    })

    // Create relationship
    await this.api.createRelationship({
      from_entity_id: leaveRequest.id,
      to_entity_id: calendarEvent.id,
      relationship_type: LEAVE_SMART_CODES.LEAVE_CALENDAR_SYNC,
      organization_id: organizationId
    })

    // In production, this would trigger calendar provider sync
    return calendarEvent
  }

  private async removeFromCalendar(
    requestId: string,
    organizationId: string
  ) {
    // Find related calendar events
    const relationshipsResponse = await this.api.getRelationships(requestId, organizationId)
    const allRelationships = relationshipsResponse.success ? relationshipsResponse.data || [] : []
    
    const relationships = allRelationships.filter(rel => 
      rel.from_entity_id === requestId &&
      rel.relationship_type === LEAVE_SMART_CODES.LEAVE_CALENDAR_SYNC
    )

    // Mark calendar events as deleted
    await Promise.all(
      relationships.map(rel =>
        this.api.updateEntity(rel.to_entity_id, { status: 'deleted' }, organizationId)
      )
    )
  }

  private async getOrganizationHolidays(organizationId: string): Promise<string[]> {
    // This would fetch from organization settings
    // For now, return empty array
    return []
  }

  private formatLeaveReport(data: any[], options: any) {
    // Format report based on options
    // This is a simplified version
    return {
      summary: {
        total_employees: data.length,
        total_leave_taken: data.reduce((sum, d) => 
          sum + d.balances.reduce((s: number, b: any) => s + b.used, 0), 0
        ),
        report_period: options?.fiscalYearStart + ' to ' + options?.fiscalYearEnd
      },
      details: data
    }
  }
}

// Export singleton instance
export const leaveManagementApi = new LeaveManagementApi(universalApi)