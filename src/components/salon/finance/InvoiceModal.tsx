/**
 * InvoiceModal Component
 *
 * Enterprise-grade invoice creation modal with Salon Luxe theme
 *
 * Features:
 * - Multi-line invoice entry
 * - Customer selection
 * - Automatic GL preview
 * - Mobile-responsive (44px touch targets)
 * - Real-time total calculation
 * - Due date with payment terms
 *
 * HERA Standards:
 * - Salon Luxe color scheme (gold, champagne, charcoal, bronze)
 * - Mobile-first design
 * - Active states (active:scale-95)
 * - UPPERCASE transaction types
 */

'use client'

import { useState, useMemo } from 'react'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'
import { SalonLuxeModal } from '@/components/salon/shared/SalonLuxeModal'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useHeraInvoice, CreateInvoiceInput } from '@/hooks/useHeraInvoice'
import { InvoiceLineItem } from '@/lib/finance/invoice-gl-mapping'
import { Receipt, Plus, Trash2, Eye, EyeOff, Calendar, User } from 'lucide-react'

interface InvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function InvoiceModal({ isOpen, onClose, onSuccess }: InvoiceModalProps) {
  const { user, organization } = useHERAAuth()
  const { createInvoice } = useHeraInvoice({ organizationId: organization?.id })

  // Form state
  const [customerName, setCustomerName] = useState('')
  const [customerEntityId, setCustomerEntityId] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [paymentTerms, setPaymentTerms] = useState('NET 30')
  const [notes, setNotes] = useState('')
  const [showGLPreview, setShowGLPreview] = useState(false)

  // Line items state
  const [lineItems, setLineItems] = useState<Array<{
    id: string
    description: string
    quantity: number
    unit_amount: number
  }>>([
    { id: crypto.randomUUID(), description: '', quantity: 1, unit_amount: 0 }
  ])

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculate totals
  const { subtotal, lineItemsForSubmit } = useMemo(() => {
    let subtotal = 0
    const items: InvoiceLineItem[] = lineItems.map(item => {
      const lineAmount = item.quantity * item.unit_amount
      subtotal += lineAmount
      return {
        description: item.description,
        quantity: item.quantity,
        unit_amount: item.unit_amount,
        line_amount: lineAmount
      }
    })
    return { subtotal, lineItemsForSubmit: items }
  }, [lineItems])

  // Add new line item
  const handleAddLine = () => {
    setLineItems([
      ...lineItems,
      { id: crypto.randomUUID(), description: '', quantity: 1, unit_amount: 0 }
    ])
  }

  // Remove line item
  const handleRemoveLine = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id))
    }
  }

  // Update line item
  const handleUpdateLine = (id: string, field: string, value: any) => {
    setLineItems(
      lineItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    )
  }

  // Validate form
  const isValid = useMemo(() => {
    return (
      customerName.trim() !== '' &&
      subtotal > 0 &&
      lineItems.every(item => item.description.trim() !== '' && item.quantity > 0)
    )
  }, [customerName, subtotal, lineItems])

  // Handle submit
  const handleSubmit = async () => {
    if (!isValid || !user || !organization) return

    setIsSubmitting(true)

    try {
      const input: CreateInvoiceInput = {
        organizationId: organization.id,
        actorUserId: user.entity_id || user.id,
        customerEntityId: customerEntityId || crypto.randomUUID(),  // Create customer entity if needed
        customerName,
        invoiceDate,
        dueDate,
        invoiceLines: lineItemsForSubmit,
        notes,
        paymentTerms
      }

      await createInvoice(input)

      // Success!
      onSuccess?.()
      handleReset()
    } catch (error) {
      console.error('Failed to create invoice:', error)
      alert('Failed to create invoice. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form
  const handleReset = () => {
    setCustomerName('')
    setCustomerEntityId('')
    setInvoiceDate(new Date().toISOString().split('T')[0])
    setDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    setPaymentTerms('NET 30')
    setNotes('')
    setLineItems([
      { id: crypto.randomUUID(), description: '', quantity: 1, unit_amount: 0 }
    ])
    setShowGLPreview(false)
  }

  // GL Preview Lines
  const glPreviewLines = useMemo(() => {
    if (subtotal === 0) return []

    return [
      {
        account: '120000 - Accounts Receivable',
        side: 'DR' as const,
        amount: subtotal
      },
      {
        account: '400000 - Service Revenue',
        side: 'CR' as const,
        amount: subtotal
      }
    ]
  }, [subtotal])

  return (
    <SalonLuxeModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Invoice"
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Header with icon */}
        <div className="flex items-center gap-3 pb-4 border-b border-gold/20">
          <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
            <Receipt className="w-6 h-6 text-gold" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-champagne">New Invoice</h2>
            <p className="text-sm text-bronze">Create customer invoice with automatic GL entries</p>
          </div>
        </div>

        {/* Customer Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-champagne uppercase tracking-wider">
            Customer Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Name */}
            <div>
              <label className="block text-sm font-medium text-bronze mb-2">
                Customer Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-bronze" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  className="w-full min-h-[44px] pl-10 pr-4 bg-charcoal border border-gold/20 rounded-lg text-champagne placeholder-bronze/50 focus:outline-none focus:ring-2 focus:ring-gold/50"
                />
              </div>
            </div>

            {/* Invoice Date */}
            <div>
              <label className="block text-sm font-medium text-bronze mb-2">
                Invoice Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-bronze" />
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full min-h-[44px] pl-10 pr-4 bg-charcoal border border-gold/20 rounded-lg text-champagne focus:outline-none focus:ring-2 focus:ring-gold/50"
                />
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-bronze mb-2">
                Due Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-bronze" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full min-h-[44px] pl-10 pr-4 bg-charcoal border border-gold/20 rounded-lg text-champagne focus:outline-none focus:ring-2 focus:ring-gold/50"
                />
              </div>
            </div>

            {/* Payment Terms */}
            <div>
              <label className="block text-sm font-medium text-bronze mb-2">
                Payment Terms
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full min-h-[44px] px-4 bg-charcoal border border-gold/20 rounded-lg text-champagne focus:outline-none focus:ring-2 focus:ring-gold/50"
              >
                <option value="NET 30">Net 30 Days</option>
                <option value="NET 15">Net 15 Days</option>
                <option value="NET 7">Net 7 Days</option>
                <option value="DUE_ON_RECEIPT">Due on Receipt</option>
              </select>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-champagne uppercase tracking-wider">
              Line Items
            </h3>
            <button
              onClick={handleAddLine}
              className="flex items-center gap-2 px-3 py-2 bg-gold/10 text-gold rounded-lg hover:bg-gold/20 transition-colors active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Line</span>
            </button>
          </div>

          <div className="space-y-3">
            {lineItems.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-charcoal/50 rounded-lg border border-gold/10"
              >
                {/* Description */}
                <div className="md:col-span-5">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleUpdateLine(item.id, 'description', e.target.value)}
                    placeholder="Service/Product description"
                    className="w-full min-h-[44px] px-4 bg-charcoal border border-gold/20 rounded-lg text-champagne placeholder-bronze/50 focus:outline-none focus:ring-2 focus:ring-gold/50"
                  />
                </div>

                {/* Quantity */}
                <div className="md:col-span-2">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleUpdateLine(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    placeholder="Qty"
                    min="0"
                    step="1"
                    className="w-full min-h-[44px] px-4 bg-charcoal border border-gold/20 rounded-lg text-champagne placeholder-bronze/50 focus:outline-none focus:ring-2 focus:ring-gold/50"
                  />
                </div>

                {/* Unit Amount */}
                <div className="md:col-span-2">
                  <input
                    type="number"
                    value={item.unit_amount}
                    onChange={(e) => handleUpdateLine(item.id, 'unit_amount', parseFloat(e.target.value) || 0)}
                    placeholder="Price"
                    min="0"
                    step="0.01"
                    className="w-full min-h-[44px] px-4 bg-charcoal border border-gold/20 rounded-lg text-champagne placeholder-bronze/50 focus:outline-none focus:ring-2 focus:ring-gold/50"
                  />
                </div>

                {/* Line Total */}
                <div className="md:col-span-2 flex items-center justify-between">
                  <span className="text-champagne font-semibold">
                    {(item.quantity * item.unit_amount).toFixed(2)}
                  </span>
                  {lineItems.length > 1 && (
                    <button
                      onClick={() => handleRemoveLine(item.id)}
                      className="min-w-[44px] min-h-[44px] rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-gradient-to-br from-gold/20 to-champagne/10 rounded-xl p-6 border border-gold/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-champagne">Invoice Total</h3>
            <span className="text-3xl font-bold text-gold">
              AED {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-bronze">Line Items:</span>
              <span className="ml-2 text-champagne font-medium">{lineItems.length}</span>
            </div>
            <div>
              <span className="text-bronze">Payment Terms:</span>
              <span className="ml-2 text-champagne font-medium">{paymentTerms}</span>
            </div>
          </div>
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
              ✓ Balanced: DR = CR = {subtotal.toFixed(2)}
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
            placeholder="Add any additional notes..."
            rows={3}
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
            className="flex-1 min-h-[48px] px-6 bg-gradient-to-r from-gold to-champagne text-black rounded-xl font-bold hover:shadow-lg hover:shadow-gold/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {isSubmitting ? 'Creating Invoice...' : 'Create Invoice'}
          </button>
        </div>
      </div>
    </SalonLuxeModal>
  )
}
