/**
 * useHeraPayroll Hook
 *
 * Manages payroll transactions with complete GL integration.
 * Follows HERA standards: UPPERCASE entity/transaction types, proper smart codes.
 *
 * @module useHeraPayroll
 */

import { useState, useCallback, useMemo } from 'react'
import { useUniversalTransactionV1 } from './useUniversalTransactionV1'
import {
  generatePayrollGLLines,
  generatePayrollSmartCode,
  validatePayrollTransaction,
  calculateTaxWithholding,
  type PayrollLineItem,
  type PayrollComponentType
} from '@/lib/finance/payroll-gl-mapping'
import { apiV2 } from '@/lib/client/fetchV2'
import { startOfMonth, endOfMonth, format } from 'date-fns'

/**
 * Payroll Summary Interface
 */
export interface PayrollSummary {
  // Salary expenses
  total_gross_salary: number
  total_tax_withholding: number
  total_net_salary: number
  total_tips_paid: number

  // Staff breakdown
  staff_count: number
  staff_payroll: Array<{
    staff_entity_id: string
    staff_name: string
    gross_salary: number
    tax_withheld: number
    net_salary: number
    tips_paid: number
  }>

  // Transaction counts
  salary_transaction_count: number
  tips_transaction_count: number

  // Period info
  period_start: string
  period_end: string
}

/**
 * Create Payroll Transaction Input
 */
export interface CreatePayrollInput {
  organizationId: string
  actorUserId: string
  payPeriodStart: string
  payPeriodEnd: string
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'CHEQUE'
  payrollLines: PayrollLineItem[]
  includesTipsPayout?: boolean
  notes?: string
}

/**
 * Hook Options
 */
interface UseHeraPayrollOptions {
  organizationId?: string
  month?: number  // 1-12
  year?: number
}

/**
 * Hook to manage payroll with GL integration
 *
 * @example
 * const { payrollSummary, createPayroll, isLoading } = useHeraPayroll({
 *   organizationId: 'org-uuid',
 *   month: 1,
 *   year: 2025
 * })
 */
export function useHeraPayroll(options: UseHeraPayrollOptions) {
  const { organizationId, month, year } = options
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate date range
  const currentMonth = month || new Date().getMonth() + 1
  const currentYear = year || new Date().getFullYear()
  const selectedMonthDate = new Date(currentYear, currentMonth - 1, 1)

  const periodStart = startOfMonth(selectedMonthDate).toISOString()
  const periodEnd = endOfMonth(selectedMonthDate).toISOString()

  // Fetch PAYROLL transactions (salary expenses)
  const {
    transactions: payrollTransactions,
    isLoading: payrollLoading,
    refetch: refetchPayroll
  } = useUniversalTransactionV1({
    organizationId,
    filters: {
      transaction_type: 'PAYROLL',
      date_from: periodStart,
      date_to: periodEnd,
      include_lines: true,
      limit: 1000
    }
  })

  // Fetch GL_JOURNAL transactions for tips data
  const {
    transactions: glTransactions,
    isLoading: glLoading
  } = useUniversalTransactionV1({
    organizationId,
    filters: {
      transaction_type: 'GL_JOURNAL',
      date_from: periodStart,
      date_to: periodEnd,
      include_lines: true,
      limit: 10000
    }
  })

  /**
   * Calculate Payroll Summary from Transactions
   */
  const payrollSummary = useMemo<PayrollSummary>(() => {
    const summary: PayrollSummary = {
      total_gross_salary: 0,
      total_tax_withholding: 0,
      total_net_salary: 0,
      total_tips_paid: 0,
      staff_count: 0,
      staff_payroll: [],
      salary_transaction_count: 0,
      tips_transaction_count: 0,
      period_start: periodStart,
      period_end: periodEnd
    }

    const staffMap = new Map<string, {
      staff_entity_id: string
      staff_name: string
      gross_salary: number
      tax_withheld: number
      net_salary: number
      tips_paid: number
    }>()

    // Process PAYROLL transactions
    if (payrollTransactions && payrollTransactions.length > 0) {
      payrollTransactions.forEach(transaction => {
        summary.salary_transaction_count++
        const metadata = transaction.metadata || {}
        const lines = transaction.lines || []

        // Extract staff payroll details from metadata
        const staffPayroll = metadata.staff_payroll as Array<{
          staff_entity_id: string
          staff_name: string
          gross_amount: number
          tax_amount?: number
          net_amount: number
        }> || []

        staffPayroll.forEach(staffLine => {
          const staffId = staffLine.staff_entity_id

          if (!staffMap.has(staffId)) {
            staffMap.set(staffId, {
              staff_entity_id: staffId,
              staff_name: staffLine.staff_name,
              gross_salary: 0,
              tax_withheld: 0,
              net_salary: 0,
              tips_paid: 0
            })
          }

          const staffData = staffMap.get(staffId)!
          staffData.gross_salary += staffLine.gross_amount
          staffData.tax_withheld += staffLine.tax_amount || 0
          staffData.net_salary += staffLine.net_amount

          summary.total_gross_salary += staffLine.gross_amount
          summary.total_tax_withholding += staffLine.tax_amount || 0
          summary.total_net_salary += staffLine.net_amount
        })

        // Parse GL lines for validation
        lines.forEach((line: any) => {
          const lineData = line.line_data || {}
          const accountCode = lineData.gl_account_code || lineData.account_code

          // Check for tips payout (DR to 240000)
          if (accountCode === '240000' && lineData.side === 'DR') {
            summary.total_tips_paid += line.line_amount || 0
          }
        })
      })
    }

    // Process GL_JOURNAL transactions for tips collected
    if (glTransactions && glTransactions.length > 0) {
      glTransactions.forEach(transaction => {
        const metadata = transaction.metadata || {}
        const tipsByStaff = metadata.tips_by_staff as Array<{
          staff_id: string
          staff_name: string
          tip_amount: number
        }> || []

        // Note: Tips collected are tracked separately
        // This is different from tips PAID OUT which reduces liability
        if (tipsByStaff.length > 0) {
          summary.tips_transaction_count++
        }
      })
    }

    // Convert staff map to array
    summary.staff_payroll = Array.from(staffMap.values())
    summary.staff_count = summary.staff_payroll.length

    return summary
  }, [payrollTransactions, glTransactions, periodStart, periodEnd])

  /**
   * Create Payroll Transaction
   */
  const createPayroll = useCallback(async (input: CreatePayrollInput) => {
    setIsCreating(true)
    setError(null)

    try {
      // Validate input
      const validation = validatePayrollTransaction(
        input.payrollLines,
        input.paymentMethod
      )

      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
      }

      // Generate GL lines
      const glLines = generatePayrollGLLines(
        input.payrollLines,
        input.paymentMethod,
        input.includesTipsPayout
      )

      // Calculate totals
      const totalGross = input.payrollLines.reduce(
        (sum, line) => sum + line.gross_amount,
        0
      )
      const totalNet = input.payrollLines.reduce(
        (sum, line) => sum + line.net_amount,
        0
      )

      // Determine smart code based on content
      const hasTips = input.includesTipsPayout || input.payrollLines.some(
        line => line.component_type === 'TIPS_PAYOUT'
      )
      const hasSalary = input.payrollLines.some(
        line => line.component_type !== 'TIPS_PAYOUT'
      )

      let componentType: 'SALARY' | 'TIPS' | 'MIXED' = 'SALARY'
      if (hasTips && hasSalary) componentType = 'MIXED'
      else if (hasTips) componentType = 'TIPS'

      const smartCode = generatePayrollSmartCode(componentType)

      // Create transaction via Universal API V2
      const result = await apiV2.post('transactions', {
        transaction_type: 'PAYROLL',  // UPPERCASE
        smart_code: smartCode,
        transaction_date: new Date().toISOString(),
        total_amount: totalGross,
        organization_id: input.organizationId,
        metadata: {
          pay_period_start: input.payPeriodStart,
          pay_period_end: input.payPeriodEnd,
          payment_method: input.paymentMethod,
          staff_count: input.payrollLines.length,
          staff_payroll: input.payrollLines,
          notes: input.notes || '',
          created_via: 'PAYROLL_MODAL'
        },
        lines: glLines
      })

      // Refetch data
      await refetchPayroll()

      return {
        success: true,
        transaction_id: result.data?.id,
        transaction_number: result.data?.transaction_number
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create payroll transaction'
      setError(errorMessage)
      console.error('Payroll creation error:', err)

      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setIsCreating(false)
    }
  }, [refetchPayroll])

  /**
   * Helper: Calculate tax for a gross amount
   */
  const calculateTax = useCallback((grossAmount: number, taxRate: number = 0.0) => {
    return calculateTaxWithholding(grossAmount, taxRate)
  }, [])

  /**
   * Helper: Format payroll period
   */
  const formatPayPeriod = useCallback((start: string, end: string) => {
    return `${format(new Date(start), 'MMM dd')} - ${format(new Date(end), 'MMM dd, yyyy')}`
  }, [])

  return {
    payrollSummary,
    isLoading: payrollLoading || glLoading,
    isCreating,
    error,
    createPayroll,
    calculateTax,
    formatPayPeriod,
    refetch: refetchPayroll
  }
}

/**
 * Helper function to format payroll summary for display
 */
export function formatPayrollSummary(payrollSummary: PayrollSummary) {
  return {
    gross: `AED ${payrollSummary.total_gross_salary.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    tax: `AED ${payrollSummary.total_tax_withholding.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    net: `AED ${payrollSummary.total_net_salary.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    tips: `AED ${payrollSummary.total_tips_paid.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    staff: `${payrollSummary.staff_count} staff members`
  }
}
