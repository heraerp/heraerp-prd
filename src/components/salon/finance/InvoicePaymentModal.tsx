
import React, { useMemo, useState } from 'react'
/**
 * InvoicePaymentModal Component
 *
 * Enterprise-grade invoice payment recording modal with Salon Luxe theme
 *
 * Features:
 * - Payment amount entry
 * - Payment method selection
 * - Outstanding balance display
 * - Automatic GL preview
 * - Mobile-responsive (44px touch targets)
 *
 * HERA Standards:
 * - Salon Luxe color scheme (gold, champagne, charcoal, bronze)
 * - Mobile-first design
 * - Active states (active:scale-95)
 * - UPPERCASE transaction types
 */

'use client'

import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'
import { SalonLuxeModal } from '@/components/salon/shared/SalonLuxeModal'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useHeraInvoice, RecordInvoicePaymentInput } from '@/hooks/useHeraInvoice'
import { INVOICE_PAYMENT_METHOD_TO_GL, INVOICE_GL_ACCOUNTS } from '@/lib/finance/invoice-gl-mapping'
import { CreditCard, DollarSign, Building2, Receipt, Eye, EyeOff, Calendar, CheckCircle } from 'lucide-react'

interface InvoicePaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  invoice: {
    invoice_id: string
    invoice_number: string
    customer_entity_id: string
    customer_name: string
    total_amount: number
    amount_paid: number
    amount_outstanding: number
  }
}

type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'CHEQUE'

export function InvoicePaymentModal({
  isOpen,
  onClose,
  onSuccess,
  invoice
}: InvoicePaymentModalProps) {
  const { user, organization } = useHERAAuth()
  const { recordPayment } = useHeraInvoice({ organizationId: organization?.id })

  // Form state
  const [paymentAmount, setPaymentAmount] = useState<string>(
    invoice.amount_outstanding.toFixed(2)
  )
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER')
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [notes, setNotes] = useState('')
  const [showGLPreview, setShowGLPreview] = useState(false)

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Parse payment amount
  const parsedPaymentAmount = useMemo(() => {
    return parseFloat(paymentAmount) || 0
  }, [paymentAmount])

  // Validate form
  const isValid = useMemo(() => {
    return (
      parsedPaymentAmount > 0 &&
      parsedPaymentAmount <= invoice.amount_outstanding
    )
  }, [parsedPaymentAmount, invoice.amount_outstanding])

  // Calculate new balance
  const newBalance = invoice.amount_outstanding - parsedPaymentAmount

  // Get payment method icon
  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'CASH':
        return <DollarSign className="w-5 h-5" />
      case 'BANK_TRANSFER':
        return <Building2 className="w-5 h-5" />
      case 'CARD':
        return <CreditCard className="w-5 h-5" />
      case 'CHEQUE':
        return <Receipt className="w-5 h-5" />
    }
  }

  // Get payment method label
  const getPaymentMethodLabel = (method: PaymentMethod) => {
    switch (method) {
      case 'CASH':
        return 'Cash'
      case 'BANK_TRANSFER':
        return 'Bank Transfer'
      case 'CARD':
        return 'Card Payment'
      case 'CHEQUE':
        return 'Cheque'
    }
  }

  // GL Preview Lines
  const glPreviewLines = useMemo(() => {
    if (parsedPaymentAmount === 0) return []

    const cashAccountCode = INVOICE_PAYMENT_METHOD_TO_GL[paymentMethod]
    const cashAccount = INVOICE_GL_ACCOUNTS[cashAccountCode]

    return [
      {
        account: `${cashAccountCode} - ${cashAccount?.name}`,
        side: 'DR' as const,
        amount: parsedPaymentAmount
      },
      {
        account: '120000 - Accounts Receivable',
        side: 'CR' as const,
        amount: parsedPaymentAmount
      }
    ]
  }, [parsedPaymentAmount, paymentMethod])

  // Handle submit
  const handleSubmit = async () => {
    if (!isValid || !user || !organization) return

    setIsSubmitting(true)

    try {
      const input: RecordInvoicePaymentInput = {
        organizationId: organization.id,
        actorUserId: user.entity_id || user.id,
        invoiceTransactionId: invoice.invoice_id,
        invoiceNumber: invoice.invoice_number,
        customerEntityId: invoice.customer_entity_id,
        paymentAmount: parsedPaymentAmount,
        paymentMethod,
        paymentDate,
        notes
      }

      await recordPayment(input)

      // Success!
      onSuccess?.()
      handleReset()
    } catch (error) {
      console.error('Failed to record payment:', error)
      alert('Failed to record payment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form
  const handleReset = () => {
    setPaymentAmount(invoice.amount_outstanding.toFixed(2))
    setPaymentMethod('BANK_TRANSFER')
    setPaymentDate(new Date().toISOString().split('T')[0])
    setNotes('')
    setShowGLPreview(false)
  }

  return (
    <SalonLuxeModal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Payment"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Header with icon */}
        <div className="flex items-center gap-3 pb-4 border-b border-gold/20">
          <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-champagne">Record Payment</h2>
            <p className="text-sm text-bronze">Invoice {invoice.invoice_number}</p>
          </div>
        </div>

        {/* Invoice Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-charcoal/30 rounded-lg border border-gold/10">
          <div>
            <div className="text-xs text-bronze uppercase tracking-wider mb-1">Customer</div>
            <div className="text-sm font-semibold text-champagne">{invoice.customer_name}</div>
          </div>
          <div>
            <div className="text-xs text-bronze uppercase tracking-wider mb-1">Total Amount</div>
            <div className="text-sm font-semibold text-champagne">
              AED {invoice.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div className="text-xs text-bronze uppercase tracking-wider mb-1">Outstanding</div>
            <div className="text-sm font-semibold text-orange-400">
              AED {invoice.amount_outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Payment Amount */}
        <div>
          <label className="block text-sm font-medium text-bronze mb-2">
            Payment Amount (AED) *
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-bronze" />
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              max={invoice.amount_outstanding}
              step="0.01"
              className="w-full min-h-[52px] pl-12 pr-4 bg-charcoal border-2 border-gold/20 rounded-lg text-champagne text-lg font-semibold placeholder-bronze/50 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50"
            />
          </div>
          {parsedPaymentAmount > invoice.amount_outstanding && (
            <p className="text-xs text-red-400 mt-1">
              Payment amount cannot exceed outstanding balance
            </p>
          )}
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-bronze mb-3">
            Payment Method *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(['CASH', 'BANK_TRANSFER', 'CARD', 'CHEQUE'] as PaymentMethod[]).map((method) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`min-h-[60px] flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all active:scale-95 ${
                  paymentMethod === method
                    ? 'border-gold bg-gold/10 text-gold'
                    : 'border-gold/20 bg-charcoal/50 text-bronze hover:border-gold/40 hover:bg-charcoal'
                }`}
              >
                {getPaymentMethodIcon(method)}
                <span className="text-xs font-medium">
                  {getPaymentMethodLabel(method)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Payment Date */}
        <div>
          <label className="block text-sm font-medium text-bronze mb-2">
            Payment Date *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-bronze" />
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full min-h-[44px] pl-10 pr-4 bg-charcoal border border-gold/20 rounded-lg text-champagne focus:outline-none focus:ring-2 focus:ring-gold/50"
            />
          </div>
        </div>

        {/* New Balance Summary */}
        <div className="bg-gradient-to-br from-green-500/20 to-blue-500/10 rounded-xl p-6 border border-green-500/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-champagne">After Payment</h3>
            <span className="text-3xl font-bold text-green-400">
              AED {newBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-bronze">Payment Amount:</span>
              <span className="ml-2 text-champagne font-medium">
                AED {parsedPaymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-bronze">Remaining Balance:</span>
              <span className="ml-2 text-champagne font-medium">
                AED {newBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {newBalance <= 0.01 && (
            <div className="mt-3 flex items-center gap-2 text-green-400 text-sm font-semibold">
              <CheckCircle className="w-4 h-4" />
              <span>Invoice will be marked as PAID</span>
            </div>
          )}
        </div>

        {/* GL Preview Toggle */}
        <button
          onClick={() => setShowGLPreview(!showGLPreview)}
          className="w-full flex items-center justify-between px-4 py-3 bg-charcoal/50 rounded-lg border border-gold/20 hover:bg-charcoal transition-colors active:scale-[0.99]"
        >
          <span className="text-sm font-medium text-champagne">GL Entries Preview</span>
          {showGLPreview ? (
            <EyeOff className="w-4 h-4 text-bronze" />
          ) : (
            <Eye className="w-4 h-4 text-bronze" />
          )}
        </button>

        {/* GL Preview */}
        {showGLPreview && (
          <div className="space-y-2 p-4 bg-charcoal/30 rounded-lg border border-gold/10">
            <div className="text-xs font-semibold text-bronze uppercase tracking-wider mb-3">
              Double-Entry GL Lines
            </div>
            {glPreviewLines.map((line, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 px-3 bg-charcoal/50 rounded"
              >
                <span className="text-sm text-champagne">{line.account}</span>
                <div className="flex items-center gap-4">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      line.side === 'DR' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                    }`}
                  >
                    {line.side}
                  </span>
                  <span className="text-sm font-mono text-champagne w-32 text-right">
                    {line.amount.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-gold/10 text-xs text-bronze">
              ✓ Balanced: DR = CR = {parsedPaymentAmount.toFixed(2)}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-bronze mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any payment notes..."
            rows={2}
            className="w-full px-4 py-3 bg-charcoal border border-gold/20 rounded-lg text-champagne placeholder-bronze/50 focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse md:flex-row gap-3 pt-4 border-t border-gold/20">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 min-h-[48px] px-6 bg-charcoal border border-gold/20 text-champagne rounded-xl font-semibold hover:bg-charcoal/80 transition-colors disabled:opacity-50 active:scale-[0.99]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="flex-1 min-h-[48px] px-6 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-green-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {isSubmitting ? 'Recording Payment...' : 'Record Payment'}
          </button>
        </div>
      </div>
    </SalonLuxeModal>
  )
}
