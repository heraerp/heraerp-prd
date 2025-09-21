'use client'

import { useState, useEffect } from 'react'
import {
  CreditCard,
  Banknote,
  Gift,
  Plus,
  Minus,
  X,
  Check,
  AlertCircle,
  Calculator,
  Receipt
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/luxe-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useSalonPosIntegration } from '@/lib/playbook/salon-pos-integration'
import { cn } from '@/lib/utils'

interface PaymentMethod {
  id: string
  type: 'cash' | 'card' | 'voucher'
  amount: number
  reference?: string
  cardType?: string
  voucherCode?: string
}

interface PaymentDialogProps {
  open: boolean
  onClose: () => void
  ticket: any
  totals: any
  organizationId: string
  onComplete: (saleData: any) => void
}

export function PaymentDialog({
  open,
  onClose,
  ticket,
  totals,
  organizationId,
  onComplete
}: PaymentDialogProps) {
  const [payments, setPayments] = useState<PaymentMethod[]>([])
  const [activeTab, setActiveTab] = useState<'cash' | 'card' | 'voucher'>('card')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationWarnings, setValidationWarnings] = useState<string[]>([])

  const { validatePosTicket, processPosTransaction } = useSalonPosIntegration(organizationId)

  // Cash specific
  const [cashAmount, setCashAmount] = useState('')
  const [changeAmount, setChangeAmount] = useState(0)

  // Card specific
  const [cardAmount, setCardAmount] = useState('')
  const [cardType, setCardType] = useState('visa')
  const [cardReference, setCardReference] = useState('')

  // Voucher specific
  const [voucherAmount, setVoucherAmount] = useState('')
  const [voucherCode, setVoucherCode] = useState('')

  // Quick cash amounts including exact amount
  const exactAmount = totals?.total || 0
  const roundedAmount = Math.ceil(exactAmount / 5) * 5 // Round up to nearest 5
  const quickAmounts = [
    exactAmount, // Exact amount
    roundedAmount, // Rounded amount
    20,
    50,
    100,
    200
  ].filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates

  // Calculate remaining amount to pay
  const paidAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const remainingAmount = Math.max(0, (totals?.total || 0) - paidAmount)
  const isFullyPaid = remainingAmount <= 0.01 // Account for floating point precision

  // Calculate change for cash payments
  useEffect(() => {
    const cashPayments = payments.filter(p => p.type === 'cash')
    const totalCashPaid = cashPayments.reduce((sum, p) => sum + p.amount, 0)
    const currentCashInput = parseFloat(cashAmount) || 0
    const potentialCashTotal = totalCashPaid + currentCashInput

    if (potentialCashTotal > (totals?.total || 0)) {
      setChangeAmount(potentialCashTotal - (totals?.total || 0))
    } else {
      setChangeAmount(0)
    }
  }, [cashAmount, payments, totals?.total])

  const addPayment = (type: 'cash' | 'card' | 'voucher') => {
    let amount = 0
    let reference = ''
    let additionalData = {}

    switch (type) {
      case 'cash':
        amount = parseFloat(cashAmount) || 0
        break
      case 'card':
        amount = parseFloat(cardAmount) || 0
        reference = cardReference
        additionalData = { cardType }
        break
      case 'voucher':
        amount = parseFloat(voucherAmount) || 0
        reference = voucherCode
        additionalData = { voucherCode }
        break
    }

    if (amount <= 0) return

    const newPayment: PaymentMethod = {
      id: `${type}-${Date.now()}`,
      type,
      amount,
      reference,
      ...additionalData
    }

    setPayments(prev => [...prev, newPayment])

    // Clear inputs
    if (type === 'cash') setCashAmount('')
    if (type === 'card') {
      setCardAmount('')
      setCardReference('')
    }
    if (type === 'voucher') {
      setVoucherAmount('')
      setVoucherCode('')
    }
  }

  const removePayment = (paymentId: string) => {
    setPayments(prev => prev.filter(p => p.id !== paymentId))
  }

  const addQuickCash = (amount: number) => {
    setCashAmount(amount.toString())
  }

  const processPayment = async () => {
    if (!isFullyPaid) {
      setError('Payment amount does not match total')
      return
    }

    setProcessing(true)
    setError(null)
    setValidationWarnings([])

    try {
      // First validate the ticket
      const validation = await validatePosTicket(ticket)

      if (!validation.isValid) {
        setError(`Validation failed: ${validation.errors.join(', ')}`)
        setProcessing(false)
        return
      }

      if (validation.warnings.length > 0) {
        setValidationWarnings(validation.warnings)
      }

      // Process the transaction using the integrated service
      const result = await processPosTransaction(ticket, payments, {
        branch_id: '00000000-0000-0000-0000-000000000001', // Default branch UUID
        cashier_id: organizationId || 'system', // Use org ID as cashier for now
        till_id: 'pos-terminal-1' // Should come from POS settings
      })

      if (!result.success) {
        setError(result.error || 'Transaction processing failed')
        return
      }

      // Success - prepare sale data for receipt
      const saleData = {
        transaction_id: result.transaction_id,
        transaction_code: result.transaction_code,
        timestamp: new Date().toISOString(),
        customer_name: ticket.customer_name,
        appointment_id: ticket.appointment_id,
        lineItems: ticket.lineItems,
        discounts: ticket.discounts,
        tips: ticket.tips,
        payments,
        totals,
        changeAmount,
        branch_name: 'Main Salon',
        commission_lines: result.commission_lines
      }

      onComplete(saleData)
    } catch (err) {
      console.error('Payment processing error:', err)
      setError(err instanceof Error ? err.message : 'Payment processing failed')
    } finally {
      setProcessing(false)
    }
  }

  const handleClose = () => {
    if (processing) return
    setPayments([])
    setCashAmount('')
    setCardAmount('')
    setCardReference('')
    setVoucherAmount('')
    setVoucherCode('')
    setError(null)
    onClose()
  }

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return <Banknote className="w-4 h-4" />
      case 'card':
        return <CreditCard className="w-4 h-4" />
      case 'voucher':
        return <Gift className="w-4 h-4" />
      default:
        return <CreditCard className="w-4 h-4" />
    }
  }

  const getPaymentColor = (type: string) => {
    switch (type) {
      case 'cash':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'card':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'voucher':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" style={{ color: '#D4AF37' }} />
            Process Payment - ${(totals?.total || 0).toFixed(2)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <Card
            style={{
              backgroundColor: '#0F0F0F',
              border: '1px solid rgba(212, 175, 55, 0.2)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
            }}
          >
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm" style={{ color: '#E0E0E0' }}>
                  <span>Items ({ticket.lineItems.length}):</span>
                  <span>${(totals?.subtotal || 0).toFixed(2)}</span>
                </div>
                {(totals?.discountAmount || 0) > 0 && (
                  <div className="flex justify-between text-sm" style={{ color: '#0F6F5C' }}>
                    <span>Discounts:</span>
                    <span>-${(totals?.discountAmount || 0).toFixed(2)}</span>
                  </div>
                )}
                {(totals?.tipAmount || 0) > 0 && (
                  <div className="flex justify-between text-sm" style={{ color: '#D4AF37' }}>
                    <span>Tips:</span>
                    <span>+${(totals?.tipAmount || 0).toFixed(2)}</span>
                  </div>
                )}
                {(totals?.taxAmount || 0) > 0 && (
                  <div className="flex justify-between text-sm" style={{ color: '#E0E0E0' }}>
                    <span>Tax (5%):</span>
                    <span>${(totals?.taxAmount || 0).toFixed(2)}</span>
                  </div>
                )}
                <Separator style={{ backgroundColor: 'rgba(212, 175, 55, 0.2)' }} />
                <div className="flex justify-between font-bold text-lg">
                  <span style={{ color: '#F5E6C8' }}>Total Due:</span>
                  <span style={{ color: '#D4AF37' }}>${(totals?.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <div>
            <h3 className="font-medium mb-3 text-slate-900 dark:text-white">Payment Methods</h3>
            <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="card" className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Card
                </TabsTrigger>
                <TabsTrigger value="cash" className="flex items-center gap-2">
                  <Banknote className="w-4 h-4" />
                  Cash
                </TabsTrigger>
                <TabsTrigger value="voucher" className="flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  Voucher
                </TabsTrigger>
              </TabsList>

              <TabsContent value="card" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={cardAmount}
                      onChange={e => setCardAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Card Type</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={cardType}
                      onChange={e => setCardType(e.target.value)}
                    >
                      <option value="visa">Visa</option>
                      <option value="mastercard">Mastercard</option>
                      <option value="amex">American Express</option>
                      <option value="discover">Discover</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label>Reference/Last 4 Digits (optional)</Label>
                  <Input
                    placeholder="1234"
                    value={cardReference}
                    onChange={e => setCardReference(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => addPayment('card')}
                  disabled={!cardAmount || parseFloat(cardAmount) <= 0}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Card Payment
                </Button>
              </TabsContent>

              <TabsContent value="cash" className="space-y-4">
                <div>
                  <Label>Cash Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={cashAmount}
                    onChange={e => setCashAmount(e.target.value)}
                  />
                </div>

                {/* Quick Cash Buttons */}
                <div>
                  <Label className="text-sm text-muted-foreground">Quick amounts:</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {quickAmounts.map((amount, index) => (
                      <Button
                        key={amount}
                        variant={index === 0 ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => addQuickCash(amount)}
                        className={cn(
                          'text-xs',
                          index === 0 &&
                            'bg-green-600 hover:bg-green-700 text-white border-green-600'
                        )}
                      >
                        {index === 0 ? 'Exact' : ''} ${amount.toFixed(amount % 1 === 0 ? 0 : 2)}
                      </Button>
                    ))}
                  </div>
                </div>

                {changeAmount > 0 && (
                  <Alert>
                    <Calculator className="w-4 h-4" />
                    <AlertDescription>
                      Change due: <strong>${changeAmount.toFixed(2)}</strong>
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={() => addPayment('cash')}
                  disabled={!cashAmount || parseFloat(cashAmount) <= 0}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Cash Payment
                </Button>
              </TabsContent>

              <TabsContent value="voucher" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Voucher Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={voucherAmount}
                      onChange={e => setVoucherAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Voucher Code</Label>
                    <Input
                      placeholder="VOUCHER123"
                      value={voucherCode}
                      onChange={e => setVoucherCode(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  onClick={() => addPayment('voucher')}
                  disabled={!voucherAmount || !voucherCode || parseFloat(voucherAmount) <= 0}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Voucher Payment
                </Button>
              </TabsContent>
            </Tabs>
          </div>

          {/* Added Payments */}
          {payments.length > 0 && (
            <div>
              <h3 className="font-medium mb-3">Added Payments</h3>
              <div className="space-y-2">
                {payments.map(payment => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      {getPaymentIcon(payment.type)}
                      <div>
                        <div className="font-medium">${payment.amount.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">
                          {payment.type.charAt(0).toUpperCase() + payment.type.slice(1)}
                          {payment.reference && ` - ${payment.reference}`}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePayment(payment.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Summary */}
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: '#0F0F0F',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              background:
                'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(183, 148, 244, 0.05) 100%)'
            }}
          >
            <div className="space-y-3">
              <div className="flex justify-between text-lg">
                <span className="font-medium" style={{ color: '#F5E6C8' }}>
                  Total Due:
                </span>
                <span className="font-bold" style={{ color: '#D4AF37' }}>
                  ${(totals?.total || 0).toFixed(2)}
                </span>
              </div>
              {payments.length > 0 && (
                <>
                  <Separator style={{ backgroundColor: 'rgba(212, 175, 55, 0.2)' }} />
                  <div className="flex justify-between" style={{ color: '#E0E0E0' }}>
                    <span>Amount Tendered:</span>
                    <span className="font-semibold">${paidAmount.toFixed(2)}</span>
                  </div>
                </>
              )}
              {remainingAmount > 0.01 ? (
                <div className="flex justify-between text-lg">
                  <span className="font-medium" style={{ color: '#F5E6C8' }}>
                    Balance to Pay:
                  </span>
                  <span className="font-bold" style={{ color: '#FF6B6B' }}>
                    ${remainingAmount.toFixed(2)}
                  </span>
                </div>
              ) : changeAmount > 0 ? (
                <div
                  className="flex justify-between text-lg p-2 rounded"
                  style={{
                    backgroundColor: 'rgba(15, 111, 92, 0.2)',
                    border: '1px solid rgba(15, 111, 92, 0.3)'
                  }}
                >
                  <span className="font-medium" style={{ color: '#0F6F5C' }}>
                    Change Due:
                  </span>
                  <span className="font-bold" style={{ color: '#0F6F5C' }}>
                    ${changeAmount.toFixed(2)}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Validation Warnings */}
          {validationWarnings.length > 0 && (
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">Warnings:</div>
                  {validationWarnings.map((warning, index) => (
                    <div key={index} className="text-sm">
                      • {warning}
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={processing}
              style={{
                borderColor: '#8C7853',
                color: '#8C7853',
                backgroundColor: 'transparent'
              }}
              className="hover:opacity-80"
            >
              Cancel
            </Button>
            <Button
              onClick={processPayment}
              disabled={!isFullyPaid || processing}
              className="flex-1"
              style={{
                background: `linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)`,
                color: '#0B0B0B',
                border: 'none'
              }}
            >
              {processing ? (
                <div
                  className="animate-spin rounded-full h-4 w-4 border-b-2 mr-2"
                  style={{ borderColor: '#0B0B0B' }}
                ></div>
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              {processing ? 'Processing...' : 'Complete Payment'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
