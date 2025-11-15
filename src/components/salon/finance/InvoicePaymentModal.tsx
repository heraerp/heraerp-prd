'use client'

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

import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'
import { SalonLuxeModal } from '@/components/salon/shared/SalonLuxeModal'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useHeraInvoice, RecordInvoicePaymentInput } from '@/hooks/useHeraInvoice'
import { INVOICE_PAYMENT_METHOD_TO_GL, INVOICE_GL_ACCOUNTS } from '@/lib/finance/invoice-gl-mapping'
import { CreditCard, DollarSign, Building2, Receipt, Eye, EyeOff, Calendar, CheckCircle } from 'lucide-react'

interface InvoicePaymentModalProps {
  invoiceId: string
  isOpen: boolean
  onClose: () => void
  onPaymentRecorded?: () => void
}

export function InvoicePaymentModal({
  invoiceId,
  isOpen,
  onClose,
  onPaymentRecorded
}: InvoicePaymentModalProps) {
  const { user, organization } = useHERAAuth()
  const { 
    invoice, 
    isLoading: invoiceLoading,
    recordPayment,
    isRecordingPayment 
  } = useHeraInvoice(invoiceId)

  // ============================================================================
  // STATE
  // ============================================================================

  const [paymentAmount, setPaymentAmount] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer'>('cash')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [showGLPreview, setShowGLPreview] = useState(false)

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const outstandingBalance = useMemo(() => {
    if (!invoice) return 0
    const totalInvoiced = invoice.invoice_total || 0
    const totalPaid = invoice.total_payments || 0
    return Math.max(0, totalInvoiced - totalPaid)
  }, [invoice])

  const paymentAmountNumber = useMemo(() => {
    const amount = parseFloat(paymentAmount) || 0
    return Math.min(amount, outstandingBalance) // Cannot pay more than outstanding
  }, [paymentAmount, outstandingBalance])

  const newOutstandingBalance = useMemo(() => {
    return Math.max(0, outstandingBalance - paymentAmountNumber)
  }, [outstandingBalance, paymentAmountNumber])

  // GL Preview
  const glEntries = useMemo(() => {
    if (!paymentAmountNumber || !invoice) return []

    const glMapping = INVOICE_PAYMENT_METHOD_TO_GL[paymentMethod]
    
    return [
      {
        account: glMapping.debit_account,
        account_name: INVOICE_GL_ACCOUNTS[glMapping.debit_account],
        debit: paymentAmountNumber,
        credit: 0,
        description: `Payment received for Invoice ${invoice.invoice_number}`
      },
      {
        account: glMapping.credit_account,
        account_name: INVOICE_GL_ACCOUNTS[glMapping.credit_account],
        debit: 0,
        credit: paymentAmountNumber,
        description: `Payment received for Invoice ${invoice.invoice_number}`
      }
    ]
  }, [paymentAmountNumber, paymentMethod, invoice])

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handlePaymentAmountChange = (value: string) => {
    // Only allow valid decimal numbers
    const sanitized = value.replace(/[^0-9.]/g, '')
    if (sanitized.split('.').length <= 2) {
      setPaymentAmount(sanitized)
    }
  }

  const handleRecordPayment = async () => {
    if (!paymentAmountNumber || !user || !organization || !invoice) {
      return
    }

    try {
      const paymentData: RecordInvoicePaymentInput = {
        invoice_id: invoiceId,
        amount: paymentAmountNumber,
        payment_method: paymentMethod,
        payment_notes: paymentNotes.trim() || undefined,
        organization_id: organization.id,
        actor_user_id: user.entity_id || user.id
      }

      await recordPayment(paymentData)
      
      // Success - close modal and notify parent
      onClose()
      onPaymentRecorded?.()
      
      // Reset form
      setPaymentAmount('')
      setPaymentNotes('')
      setShowGLPreview(false)
    } catch (error) {
      console.error('Failed to record payment:', error)
      // Error handling is done in the hook with toast
    }
  }

  const handleClose = () => {
    setPaymentAmount('')
    setPaymentNotes('')
    setShowGLPreview(false)
    onClose()
  }

  // ============================================================================
  // LOADING & ERROR STATES
  // ============================================================================

  if (invoiceLoading) {
    return (
      <SalonLuxeModal isOpen={isOpen} onClose={onClose} size="md">
        <div className="p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gold border-t-transparent" />
          <span className="ml-3 text-champagne">Loading invoice...</span>
        </div>
      </SalonLuxeModal>
    )
  }

  if (!invoice) {
    return (
      <SalonLuxeModal isOpen={isOpen} onClose={onClose} size="md">
        <div className="p-8 text-center">
          <Receipt className="w-16 h-16 mx-auto mb-4" style={{ color: SALON_LUXE_COLORS.bronze }} />
          <h3 className="text-lg font-semibold text-champagne mb-2">Invoice Not Found</h3>
          <p className="text-bronze mb-6">Unable to load invoice details.</p>
          <button
            onClick={onClose}
            className="min-h-[44px] px-6 py-2 rounded-xl font-semibold transition-all duration-200 active:scale-95"
            style={{
              background: SALON_LUXE_COLORS.gold,
              color: SALON_LUXE_COLORS.charcoal
            }}
          >
            Close
          </button>
        </div>
      </SalonLuxeModal>
    )
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <SalonLuxeModal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div 
            className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{ 
              background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.gold}20, ${SALON_LUXE_COLORS.champagne}10)`,
              border: `1px solid ${SALON_LUXE_COLORS.gold}30`
            }}
          >
            <CreditCard className="w-8 h-8" style={{ color: SALON_LUXE_COLORS.gold }} />
          </div>
          <h2 className="text-2xl font-bold text-champagne mb-2">Record Payment</h2>
          <p className="text-bronze">
            Invoice #{invoice.invoice_number} • {invoice.customer_name}
          </p>
        </div>

        {/* Outstanding Balance Card */}
        <div 
          className="p-4 rounded-xl"
          style={{ 
            background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.charcoal}50, ${SALON_LUXE_COLORS.charcoal}30)`,
            border: `1px solid ${SALON_LUXE_COLORS.bronze}30`
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5" style={{ color: SALON_LUXE_COLORS.bronze }} />
              <span className="text-bronze font-medium">Outstanding Balance</span>
            </div>
            <span className="text-2xl font-bold text-champagne">
              AED {outstandingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Payment Form */}
        <div className="space-y-4">
          {/* Payment Amount */}
          <div>
            <label className="block text-sm font-medium text-champagne mb-2">
              Payment Amount (AED)
            </label>
            <div className="relative">
              <DollarSign 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                style={{ color: SALON_LUXE_COLORS.bronze }}
              />
              <input
                type="text"
                value={paymentAmount}
                onChange={(e) => handlePaymentAmountChange(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 rounded-xl font-medium transition-all duration-200 min-h-[44px]"
                style={{
                  background: `${SALON_LUXE_COLORS.charcoal}50`,
                  border: `1px solid ${SALON_LUXE_COLORS.bronze}30`,
                  color: SALON_LUXE_COLORS.champagne
                }}
              />
            </div>
            {paymentAmountNumber > outstandingBalance && (
              <p className="text-sm mt-1" style={{ color: SALON_LUXE_COLORS.ruby }}>
                Amount cannot exceed outstanding balance
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-champagne mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'cash', label: 'Cash', icon: DollarSign },
                { value: 'card', label: 'Card', icon: CreditCard },
                { value: 'bank_transfer', label: 'Bank', icon: Building2 }
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setPaymentMethod(value as any)}
                  className="p-3 rounded-xl text-center transition-all duration-200 active:scale-95 min-h-[44px]"
                  style={{
                    background: paymentMethod === value 
                      ? `${SALON_LUXE_COLORS.gold}30` 
                      : `${SALON_LUXE_COLORS.charcoal}30`,
                    border: `1px solid ${paymentMethod === value 
                      ? SALON_LUXE_COLORS.gold 
                      : SALON_LUXE_COLORS.bronze}30`,
                    color: paymentMethod === value 
                      ? SALON_LUXE_COLORS.gold 
                      : SALON_LUXE_COLORS.bronze
                  }}
                >
                  <Icon className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Notes */}
          <div>
            <label className="block text-sm font-medium text-champagne mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="Add payment notes..."
              rows={3}
              className="w-full p-3 rounded-xl font-medium transition-all duration-200 resize-none"
              style={{
                background: `${SALON_LUXE_COLORS.charcoal}50`,
                border: `1px solid ${SALON_LUXE_COLORS.bronze}30`,
                color: SALON_LUXE_COLORS.champagne
              }}
            />
          </div>

          {/* GL Preview Toggle */}
          <button
            onClick={() => setShowGLPreview(!showGLPreview)}
            className="flex items-center gap-2 text-sm font-medium transition-all duration-200 active:scale-95"
            style={{ color: SALON_LUXE_COLORS.gold }}
          >
            {showGLPreview ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            {showGLPreview ? 'Hide' : 'Show'} GL Preview
          </button>

          {/* GL Preview */}
          {showGLPreview && glEntries.length > 0 && (
            <div 
              className="p-4 rounded-xl space-y-3"
              style={{ 
                background: `${SALON_LUXE_COLORS.charcoal}30`,
                border: `1px solid ${SALON_LUXE_COLORS.bronze}30`
              }}
            >
              <h4 className="text-sm font-semibold text-champagne mb-2">
                General Ledger Entries
              </h4>
              {glEntries.map((entry, index) => (
                <div 
                  key={index}
                  className="flex justify-between items-center p-3 rounded-lg"
                  style={{ background: `${SALON_LUXE_COLORS.charcoal}20` }}
                >
                  <div>
                    <div className="text-sm font-medium text-champagne">
                      {entry.account} - {entry.account_name}
                    </div>
                    <div className="text-xs text-bronze">
                      {entry.description}
                    </div>
                  </div>
                  <div className="text-right">
                    {entry.debit > 0 && (
                      <div className="text-sm font-semibold" style={{ color: SALON_LUXE_COLORS.emerald }}>
                        DR {entry.debit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    )}
                    {entry.credit > 0 && (
                      <div className="text-sm font-semibold" style={{ color: SALON_LUXE_COLORS.ruby }}>
                        CR {entry.credit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* New Balance Preview */}
          {paymentAmountNumber > 0 && (
            <div 
              className="p-4 rounded-xl flex items-center justify-between"
              style={{ 
                background: `linear-gradient(135deg, ${SALON_LUXE_COLORS.emerald}20, ${SALON_LUXE_COLORS.emerald}10)`,
                border: `1px solid ${SALON_LUXE_COLORS.emerald}30`
              }}
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5" style={{ color: SALON_LUXE_COLORS.emerald }} />
                <span className="font-medium text-champagne">New Balance After Payment</span>
              </div>
              <span className="text-xl font-bold text-champagne">
                AED {newOutstandingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleClose}
            disabled={isRecordingPayment}
            className="flex-1 min-h-[44px] px-6 py-3 rounded-xl font-semibold transition-all duration-200 active:scale-95"
            style={{
              background: `${SALON_LUXE_COLORS.charcoal}60`,
              border: `1px solid ${SALON_LUXE_COLORS.bronze}30`,
              color: SALON_LUXE_COLORS.bronze
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleRecordPayment}
            disabled={!paymentAmountNumber || paymentAmountNumber > outstandingBalance || isRecordingPayment}
            className="flex-1 min-h-[44px] px-6 py-3 rounded-xl font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: SALON_LUXE_COLORS.gold,
              color: SALON_LUXE_COLORS.charcoal
            }}
          >
            {isRecordingPayment ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-charcoal border-t-transparent" />
                Recording...
              </div>
            ) : (
              `Record Payment • AED ${paymentAmountNumber.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
            )}
          </button>
        </div>
      </div>
    </SalonLuxeModal>
  )
}