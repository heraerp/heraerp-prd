/**
 * PayrollModal Component
 *
 * Enterprise-grade payroll transaction creation with GL integration.
 * Follows Salon Luxe theme and HERA standards.
 *
 * Features:
 * - Multi-staff salary entry
 * - Automatic tax calculation
 * - Tips payout integration
 * - Real-time GL line preview
 * - Balance validation
 * - Mobile-responsive design
 */

'use client'

import { useState, useCallback, useMemo } from 'react'
import { X, Plus, Trash2, DollarSign, Users, Calendar, AlertCircle, CheckCircle } from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useHeraPayroll, type CreatePayrollInput } from '@/hooks/useHeraPayroll'
import { type PayrollLineItem } from '@/lib/finance/payroll-gl-mapping'
import { SalonLuxeModal } from '@/components/salon/shared/SalonLuxeModal'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'
import { format, startOfMonth, endOfMonth } from 'date-fns'

interface PayrollModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function PayrollModal({ isOpen, onClose, onSuccess }: PayrollModalProps) {
  const { user, organization } = useHERAAuth()
  const { createPayroll, isCreating, calculateTax } = useHeraPayroll({
    organizationId: organization?.id
  })

  // Form state
  const [payPeriodStart, setPayPeriodStart] = useState(() => {
    return format(startOfMonth(new Date()), 'yyyy-MM-dd')
  })
  const [payPeriodEnd, setPayPeriodEnd] = useState(() => {
    return format(endOfMonth(new Date()), 'yyyy-MM-dd')
  })
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'CARD' | 'CHEQUE'>('BANK_TRANSFER')
  const [includesTipsPayout, setIncludesTipsPayout] = useState(false)
  const [notes, setNotes] = useState('')
  const [staffLines, setStaffLines] = useState<Array<{
    id: string
    staff_entity_id: string
    staff_name: string
    gross_amount: number
    tax_rate: number
    is_tips: boolean
  }>>([
    {
      id: crypto.randomUUID(),
      staff_entity_id: '',
      staff_name: '',
      gross_amount: 0,
      tax_rate: 0,
      is_tips: false
    }
  ])

  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  /**
   * Add Staff Line
   */
  const addStaffLine = useCallback(() => {
    setStaffLines(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        staff_entity_id: '',
        staff_name: '',
        gross_amount: 0,
        tax_rate: 0,
        is_tips: false
      }
    ])
  }, [])

  /**
   * Remove Staff Line
   */
  const removeStaffLine = useCallback((id: string) => {
    setStaffLines(prev => prev.filter(line => line.id !== id))
  }, [])

  /**
   * Update Staff Line
   */
  const updateStaffLine = useCallback((id: string, field: string, value: any) => {
    setStaffLines(prev => prev.map(line => {
      if (line.id === id) {
        return { ...line, [field]: value }
      }
      return line
    }))
  }, [])

  /**
   * Calculate Totals
   */
  const totals = useMemo(() => {
    let totalGross = 0
    let totalTax = 0
    let totalNet = 0

    staffLines.forEach(line => {
      const gross = line.gross_amount || 0
      const tax = calculateTax(gross, line.tax_rate)
      const net = gross - tax

      totalGross += gross
      totalTax += tax
      totalNet += net
    })

    return {
      gross: totalGross,
      tax: totalTax,
      net: totalNet
    }
  }, [staffLines, calculateTax])

  /**
   * Validate Form
   */
  const validateForm = useCallback(() => {
    setError(null)

    if (!payPeriodStart || !payPeriodEnd) {
      setError('Pay period dates are required')
      return false
    }

    if (new Date(payPeriodStart) > new Date(payPeriodEnd)) {
      setError('Pay period start date must be before end date')
      return false
    }

    if (staffLines.length === 0) {
      setError('At least one staff member is required')
      return false
    }

    for (const line of staffLines) {
      if (!line.staff_name.trim()) {
        setError('All staff members must have a name')
        return false
      }
      if (line.gross_amount <= 0) {
        setError('All staff members must have a positive gross amount')
        return false
      }
    }

    return true
  }, [payPeriodStart, payPeriodEnd, staffLines])

  /**
   * Handle Submit
   */
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return
    if (!organization?.id || !user?.id) {
      setError('Organization or user not found')
      return
    }

    setError(null)
    setSuccess(false)

    // Convert staff lines to payroll line items
    const payrollLines: PayrollLineItem[] = staffLines.map(line => {
      const grossAmount = line.gross_amount || 0
      const taxAmount = calculateTax(grossAmount, line.tax_rate)
      const netAmount = grossAmount - taxAmount

      return {
        staff_entity_id: line.staff_entity_id || crypto.randomUUID(), // Generate temp ID if not provided
        staff_name: line.staff_name,
        component_type: line.is_tips ? 'TIPS_PAYOUT' : 'BASIC_SALARY',
        gross_amount: grossAmount,
        tax_amount: taxAmount,
        net_amount: netAmount
      }
    })

    const input: CreatePayrollInput = {
      organizationId: organization.id,
      actorUserId: user.entity_id || user.id,
      payPeriodStart: new Date(payPeriodStart).toISOString(),
      payPeriodEnd: new Date(payPeriodEnd).toISOString(),
      paymentMethod,
      payrollLines,
      includesTipsPayout,
      notes
    }

    const result = await createPayroll(input)

    if (result.success) {
      setSuccess(true)
      setTimeout(() => {
        onClose()
        if (onSuccess) onSuccess()
      }, 1500)
    } else {
      setError(result.error || 'Failed to create payroll transaction')
    }
  }, [
    validateForm,
    organization,
    user,
    payPeriodStart,
    payPeriodEnd,
    paymentMethod,
    staffLines,
    includesTipsPayout,
    notes,
    calculateTax,
    createPayroll,
    onClose,
    onSuccess
  ])

  /**
   * GL Lines Preview
   */
  const glLinesPreview = useMemo(() => {
    const lines = []

    // DR: Salaries and Wages
    if (totals.gross > 0) {
      lines.push({
        side: 'DR',
        account: '6300 - Salaries and Wages',
        amount: totals.gross
      })
    }

    // CR: Payment Method
    if (totals.net > 0) {
      const paymentAccounts: Record<string, string> = {
        CASH: '1000 - Cash on Hand',
        BANK_TRANSFER: '1020 - Bank Account',
        CARD: '1030 - Card Payment Processor',
        CHEQUE: '1020 - Bank Account'
      }
      lines.push({
        side: 'CR',
        account: paymentAccounts[paymentMethod],
        amount: totals.net
      })
    }

    // CR: Tax Withholding
    if (totals.tax > 0) {
      lines.push({
        side: 'CR',
        account: '220000 - Tax Payable',
        amount: totals.tax
      })
    }

    return lines
  }, [totals, paymentMethod])

  /**
   * Modal Content
   */
  return (
    <SalonLuxeModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Payroll Transaction"
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Success Message */}
        {success && (
          <div
            className="flex items-center gap-3 p-4 rounded-xl"
            style={{
              backgroundColor: `${SALON_LUXE_COLORS.emerald.base}20`,
              borderLeft: `4px solid ${SALON_LUXE_COLORS.emerald.base}`
            }}
          >
            <CheckCircle className="w-5 h-5" style={{ color: SALON_LUXE_COLORS.emerald.base }} />
            <p style={{ color: SALON_LUXE_COLORS.champagne.base }}>
              Payroll transaction created successfully!
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            className="flex items-center gap-3 p-4 rounded-xl"
            style={{
              backgroundColor: `${SALON_LUXE_COLORS.rose.base}20`,
              borderLeft: `4px solid ${SALON_LUXE_COLORS.rose.base}`
            }}
          >
            <AlertCircle className="w-5 h-5" style={{ color: SALON_LUXE_COLORS.rose.base }} />
            <p style={{ color: SALON_LUXE_COLORS.champagne.base }}>{error}</p>
          </div>
        )}

        {/* Pay Period */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: SALON_LUXE_COLORS.champagne.base }}>
              <Calendar className="w-4 h-4 inline-block mr-2" />
              Pay Period Start
            </label>
            <input
              type="date"
              value={payPeriodStart}
              onChange={(e) => setPayPeriodStart(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
              style={{
                backgroundColor: SALON_LUXE_COLORS.charcoal.light,
                borderColor: SALON_LUXE_COLORS.gold.base,
                color: SALON_LUXE_COLORS.champagne.base
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: SALON_LUXE_COLORS.champagne.base }}>
              <Calendar className="w-4 h-4 inline-block mr-2" />
              Pay Period End
            </label>
            <input
              type="date"
              value={payPeriodEnd}
              onChange={(e) => setPayPeriodEnd(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
              style={{
                backgroundColor: SALON_LUXE_COLORS.charcoal.light,
                borderColor: SALON_LUXE_COLORS.gold.base,
                color: SALON_LUXE_COLORS.champagne.base
              }}
            />
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: SALON_LUXE_COLORS.champagne.base }}>
            <DollarSign className="w-4 h-4 inline-block mr-2" />
            Payment Method
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as any)}
            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
            style={{
              backgroundColor: SALON_LUXE_COLORS.charcoal.light,
              borderColor: SALON_LUXE_COLORS.gold.base,
              color: SALON_LUXE_COLORS.champagne.base
            }}
          >
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CASH">Cash</option>
            <option value="CHEQUE">Cheque</option>
            <option value="CARD">Card</option>
          </select>
        </div>

        {/* Staff Lines */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium" style={{ color: SALON_LUXE_COLORS.champagne.base }}>
              <Users className="w-4 h-4 inline-block mr-2" />
              Staff Payroll ({staffLines.length})
            </label>
            <button
              type="button"
              onClick={addStaffLine}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95"
              style={{
                backgroundColor: `${SALON_LUXE_COLORS.gold.base}20`,
                color: SALON_LUXE_COLORS.gold.base
              }}
            >
              <Plus className="w-4 h-4" />
              Add Staff
            </button>
          </div>

          {/* Staff Lines Table */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {staffLines.map((line, index) => (
              <div
                key={line.id}
                className="p-4 rounded-xl border"
                style={{
                  backgroundColor: SALON_LUXE_COLORS.charcoal.light,
                  borderColor: SALON_LUXE_COLORS.gold.base + '40'
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  {/* Staff Name */}
                  <div className="md:col-span-4">
                    <input
                      type="text"
                      placeholder="Staff Name"
                      value={line.staff_name}
                      onChange={(e) => updateStaffLine(line.id, 'staff_name', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: SALON_LUXE_COLORS.charcoal.base,
                        color: SALON_LUXE_COLORS.champagne.base,
                        borderColor: SALON_LUXE_COLORS.gold.base
                      }}
                    />
                  </div>

                  {/* Gross Amount */}
                  <div className="md:col-span-3">
                    <input
                      type="number"
                      placeholder="Gross Amount"
                      value={line.gross_amount || ''}
                      onChange={(e) => updateStaffLine(line.id, 'gross_amount', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: SALON_LUXE_COLORS.charcoal.base,
                        color: SALON_LUXE_COLORS.champagne.base,
                        borderColor: SALON_LUXE_COLORS.gold.base
                      }}
                    />
                  </div>

                  {/* Tax Rate */}
                  <div className="md:col-span-2">
                    <input
                      type="number"
                      placeholder="Tax %"
                      value={line.tax_rate || ''}
                      onChange={(e) => updateStaffLine(line.id, 'tax_rate', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: SALON_LUXE_COLORS.charcoal.base,
                        color: SALON_LUXE_COLORS.champagne.base,
                        borderColor: SALON_LUXE_COLORS.gold.base
                      }}
                    />
                  </div>

                  {/* Net Amount (calculated) */}
                  <div className="md:col-span-2">
                    <div className="px-3 py-2 rounded-lg text-sm text-right" style={{ color: SALON_LUXE_COLORS.emerald.base }}>
                      AED {((line.gross_amount || 0) - calculateTax(line.gross_amount || 0, line.tax_rate)).toFixed(0)}
                    </div>
                  </div>

                  {/* Remove Button */}
                  <div className="md:col-span-1 flex items-center justify-end">
                    {staffLines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStaffLine(line.id)}
                        className="p-2 rounded-lg transition-all active:scale-95"
                        style={{ color: SALON_LUXE_COLORS.rose.base }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals Summary */}
        <div
          className="p-4 rounded-xl"
          style={{
            backgroundColor: `${SALON_LUXE_COLORS.gold.base}10`,
            borderLeft: `4px solid ${SALON_LUXE_COLORS.gold.base}`
          }}
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs mb-1" style={{ color: SALON_LUXE_COLORS.bronze.base }}>Gross Salary</p>
              <p className="text-lg font-bold" style={{ color: SALON_LUXE_COLORS.champagne.base }}>
                AED {totals.gross.toFixed(0)}
              </p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: SALON_LUXE_COLORS.bronze.base }}>Tax Withholding</p>
              <p className="text-lg font-bold" style={{ color: SALON_LUXE_COLORS.rose.base }}>
                AED {totals.tax.toFixed(0)}
              </p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: SALON_LUXE_COLORS.bronze.base }}>Net Pay</p>
              <p className="text-lg font-bold" style={{ color: SALON_LUXE_COLORS.emerald.base }}>
                AED {totals.net.toFixed(0)}
              </p>
            </div>
          </div>
        </div>

        {/* GL Lines Preview Toggle */}
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="w-full text-sm font-medium py-2 transition-all"
          style={{ color: SALON_LUXE_COLORS.gold.base }}
        >
          {showPreview ? '▼ Hide GL Preview' : '▶ Show GL Preview'}
        </button>

        {/* GL Lines Preview */}
        {showPreview && (
          <div className="space-y-2">
            {glLinesPreview.map((line, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: SALON_LUXE_COLORS.charcoal.light }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="px-2 py-1 rounded text-xs font-bold"
                    style={{
                      backgroundColor: line.side === 'DR' ? SALON_LUXE_COLORS.emerald.base : SALON_LUXE_COLORS.rose.base,
                      color: SALON_LUXE_COLORS.charcoal.base
                    }}
                  >
                    {line.side}
                  </span>
                  <span className="text-sm" style={{ color: SALON_LUXE_COLORS.champagne.base }}>
                    {line.account}
                  </span>
                </div>
                <span className="text-sm font-bold" style={{ color: SALON_LUXE_COLORS.gold.base }}>
                  AED {line.amount.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: SALON_LUXE_COLORS.champagne.base }}>
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
            style={{
              backgroundColor: SALON_LUXE_COLORS.charcoal.light,
              borderColor: SALON_LUXE_COLORS.gold.base,
              color: SALON_LUXE_COLORS.champagne.base
            }}
            placeholder="Additional notes or comments..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isCreating}
            className="flex-1 py-3 rounded-xl font-bold transition-all active:scale-95"
            style={{
              backgroundColor: SALON_LUXE_COLORS.charcoal.light,
              color: SALON_LUXE_COLORS.champagne.base
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isCreating || success}
            className="flex-1 py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50"
            style={{
              backgroundColor: SALON_LUXE_COLORS.gold.base,
              color: SALON_LUXE_COLORS.charcoal.base
            }}
          >
            {isCreating ? 'Creating...' : success ? 'Created!' : 'Create Payroll'}
          </button>
        </div>
      </div>
    </SalonLuxeModal>
  )
}
