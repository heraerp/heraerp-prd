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
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { usePosCheckout } from '@/hooks/usePosCheckout'
import { SalonLuxeModal } from '@/components/salon/shared/SalonLuxeModal'
import { SalonLuxeButton } from '@/components/salon/shared/SalonLuxeButton'
import { SalonLuxeInput } from '@/components/salon/shared/SalonLuxeInput'
import { ValidationWarningModal } from './ValidationWarningModal'
import { cn } from '@/lib/utils'

// Salon Luxe Color Palette
const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323',
  emerald: '#0F6F5C',
  red: '#FF6B6B'
}

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
  organizationName?: string
  branchId?: string
  branchName?: string
  onComplete: (saleData: any) => void
}

export function PaymentDialog({
  open,
  onClose,
  ticket,
  totals,
  organizationId,
  organizationName,
  branchId,
  branchName,
  onComplete
}: PaymentDialogProps) {
  const [payments, setPayments] = useState<PaymentMethod[]>([])
  const [activeTab, setActiveTab] = useState<'cash' | 'card' | 'voucher'>('card')
  const [validationWarnings, setValidationWarnings] = useState<string[]>([])
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [validationIssues, setValidationIssues] = useState<Array<{ type: string; message: string; action?: string }>>([])
  const [branchDetails, setBranchDetails] = useState<{ address?: string; phone?: string }>({})

  // ✅ LAYER 2: Use usePosCheckout hook (which uses useUniversalTransaction RPC API v2)
  const { processCheckout, isProcessing, error, clearError } = usePosCheckout()

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

  // Fetch branch address and phone from core_dynamic_data
  useEffect(() => {
    const fetchBranchDetails = async () => {
      if (!branchId || !organizationId) return

      try {
        const { universalApi } = await import('@/lib/universal-api-v2')

        // Fetch dynamic data for the branch entity
        const result = await universalApi.getDynamicData({
          entity_id: branchId,
          organization_id: organizationId
        })

        if (result.success && result.data) {
          const addressField = result.data.find((f: any) => f.field_name === 'address')
          const phoneField = result.data.find((f: any) => f.field_name === 'phone')

          setBranchDetails({
            address: addressField?.field_value_text || undefined,
            phone: phoneField?.field_value_text || undefined
          })
        }
      } catch (err) {
        console.error('[PaymentDialog] Error fetching branch details:', err)
      }
    }

    fetchBranchDetails()
  }, [branchId, organizationId])

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
      return // Don't process if not fully paid
    }

    // ✅ ENTERPRISE-GRADE VALIDATION: Check all required entities
    const issues: Array<{ type: string; message: string; action?: string }> = []

    // 1. Validate branch is selected
    if (!branchId) {
      issues.push({
        type: 'branch',
        message: 'Branch location not selected',
        action: 'Select a branch from the header dropdown'
      })
    }

    // 2. Validate customer is selected
    if (!ticket.customer_id) {
      issues.push({
        type: 'customer',
        message: 'Customer not assigned to sale',
        action: 'Press "/" to search or create a customer'
      })
    }

    // 3. Validate at least one item (service or product)
    if (!ticket.lineItems || ticket.lineItems.length === 0) {
      issues.push({
        type: 'items',
        message: 'No items in cart',
        action: 'Add at least one service or product'
      })
    }

    // 4. Validate all services have staff assigned
    const servicesWithoutStaff = ticket.lineItems?.filter(
      (item: any) => item.entity_type === 'service' && !item.stylist_id && !item.stylist_entity_id
    ) || []

    if (servicesWithoutStaff.length > 0) {
      issues.push({
        type: 'staff',
        message: `${servicesWithoutStaff.length} service(s) missing stylist assignment`,
        action: 'Click on services to assign a stylist'
      })
    }

    // 5. If validation issues exist, show warning modal
    if (issues.length > 0) {
      setValidationIssues(issues)
      setShowValidationModal(true)
      return
    }

    setValidationWarnings([])

    try {
      // Transform ticket data to PosCheckoutData format
      const checkoutData = {
        customer_id: ticket.customer_id,
        appointment_id: ticket.appointment_id,
        branch_id: branchId, // ✅ Include branch for enterprise tracking
        items: ticket.lineItems.map((item: any) => ({
          id: item.id || item.entity_id,
          entity_id: item.entity_id,
          name: item.entity_name || item.name,
          type: item.entity_type === 'service' ? 'service' : 'product',
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount || 0,
          staff_id: item.stylist_entity_id || item.stylist_id || item.performer_entity_id
        })),
        payments: payments.map(payment => ({
          method: payment.type === 'voucher' ? 'bank_transfer' : payment.type, // Map voucher to bank_transfer
          amount: payment.amount,
          reference: payment.reference
        })),
        tax_rate: 0.05, // 5% VAT
        discount_total: totals?.discountAmount || 0,
        tip_total: totals?.tipAmount || 0, // ✅ FIX: Include tips in checkout
        notes: ticket.notes
      }

      console.log('[PaymentDialog] Processing checkout with ENTERPRISE TRACKING:', {
        ...checkoutData,
        calculated_total: (totals?.subtotal || 0) - (totals?.discountAmount || 0) + (totals?.taxAmount || 0) + (totals?.tipAmount || 0),
        enterprise_tracking: {
          branch_id: branchId,
          branch_name: branchName,
          customer_id: ticket.customer_id,
          customer_name: ticket.customer_name,
          appointment_id: ticket.appointment_id,
          staff_assigned: checkoutData.items.filter((i: any) => i.staff_id).length,
          total_items: checkoutData.items.length,
          services: checkoutData.items.filter((i: any) => i.type === 'service').length,
          products: checkoutData.items.filter((i: any) => i.type === 'product').length
        }
      })

      // ✅ Use processCheckout from usePosCheckout hook (RPC API v2)
      const result = await processCheckout(checkoutData)

      console.log('[PaymentDialog] Checkout result:', result)

      // Success - prepare sale data for receipt
      const saleData = {
        transaction_id: result.transaction_id,
        transaction_code: result.transaction_code,
        timestamp: new Date().toISOString(),
        customer_name: ticket.customer_name,
        appointment_id: ticket.appointment_id,
        organization_name: organizationName || 'Hair Talkz Salon', // ✅ Organization name
        branch_id: branchId, // ✅ Store branch ID
        branch_name: branchName || 'Main Branch', // ✅ Store branch name
        ...(branchDetails.address && { branch_address: branchDetails.address }), // ✅ Only include if available
        ...(branchDetails.phone && { branch_phone: branchDetails.phone }), // ✅ Only include if available
        lineItems: ticket.lineItems,
        discounts: ticket.discounts,
        tips: ticket.tips,
        payments,
        totals,
        changeAmount,
        lines: result.lines
      }

      onComplete(saleData)
    } catch (err) {
      console.error('[PaymentDialog] Payment processing error:', err)
      // Error is already set by the hook
    }
  }

  const handleClose = () => {
    if (isProcessing) return
    setPayments([])
    setCashAmount('')
    setCardAmount('')
    setCardReference('')
    setVoucherAmount('')
    setVoucherCode('')
    clearError()
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
        return {
          background: `${COLORS.emerald}20`,
          border: `1px solid ${COLORS.emerald}40`,
          color: COLORS.champagne
        }
      case 'card':
        return {
          background: `${COLORS.gold}20`,
          border: `1px solid ${COLORS.gold}40`,
          color: COLORS.champagne
        }
      case 'voucher':
        return {
          background: `${COLORS.bronze}20`,
          border: `1px solid ${COLORS.bronze}40`,
          color: COLORS.champagne
        }
      default:
        return {
          background: `${COLORS.charcoalLight}80`,
          border: `1px solid ${COLORS.gold}30`,
          color: COLORS.bronze
        }
    }
  }

  return (
    <>
    <SalonLuxeModal
      open={open}
      onClose={handleClose}
      title="Process Payment"
      description={`Total amount: AED ${(totals?.total || 0).toFixed(2)}`}
      icon={<Receipt className="w-6 h-6" />}
      size="lg"
      footer={
        <div className="flex gap-3 w-full">
          <SalonLuxeButton
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
            className="flex-1"
          >
            Cancel
          </SalonLuxeButton>
          <SalonLuxeButton
            variant="primary"
            onClick={processPayment}
            disabled={!isFullyPaid || isProcessing}
            loading={isProcessing}
            icon={<Check className="w-4 h-4" />}
            className="flex-[2]"
          >
            {isProcessing ? 'Processing...' : 'Complete Payment'}
          </SalonLuxeButton>
        </div>
      }
    >
      <div className="space-y-5 py-4">
          {/* Order Summary */}
          <Card
            className="border transition-all duration-500 cursor-pointer group relative overflow-hidden"
            style={{
              backgroundColor: COLORS.charcoalLight,
              borderColor: `${COLORS.gold}20`,
              boxShadow: `0 1px 3px ${COLORS.black}20`,
              backdropFilter: 'blur(12px)',
              transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
            onMouseMove={e => {
              const rect = e.currentTarget.getBoundingClientRect()
              const x = ((e.clientX - rect.left) / rect.width) * 100
              const y = ((e.clientY - rect.top) / rect.height) * 100
              e.currentTarget.style.background = `
                radial-gradient(circle at ${x}% ${y}%,
                  rgba(212,175,55,0.15) 0%,
                  rgba(212,175,55,0.08) 30%,
                  rgba(35,35,35,0.9) 60%,
                  rgba(26,26,26,0.9) 100%
                )
              `
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = `${COLORS.gold}40`
              e.currentTarget.style.boxShadow = `0 8px 24px ${COLORS.gold}25`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = COLORS.charcoalLight
              e.currentTarget.style.borderColor = `${COLORS.gold}20`
              e.currentTarget.style.boxShadow = `0 1px 3px ${COLORS.black}20`
            }}
          >
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm" style={{ color: COLORS.lightText }}>
                  <span>Items ({ticket?.lineItems?.length || 0}):</span>
                  <span className="font-medium" style={{ color: COLORS.champagne }}>
                    AED {(totals?.subtotal || 0).toFixed(2)}
                  </span>
                </div>
                {(totals?.discountAmount || 0) > 0 && (
                  <div className="flex justify-between text-sm" style={{ color: COLORS.emerald }}>
                    <span>Discounts:</span>
                    <span className="font-medium">
                      -AED {(totals?.discountAmount || 0).toFixed(2)}
                    </span>
                  </div>
                )}
                {(totals?.tipAmount || 0) > 0 && (
                  <div className="flex justify-between text-sm" style={{ color: COLORS.gold }}>
                    <span>Gratuity:</span>
                    <span className="font-medium">+AED {(totals?.tipAmount || 0).toFixed(2)}</span>
                  </div>
                )}
                {(totals?.taxAmount || 0) > 0 && (
                  <div className="flex justify-between text-sm" style={{ color: COLORS.lightText }}>
                    <span>Tax (5%):</span>
                    <span className="font-medium" style={{ color: COLORS.champagne }}>
                      AED {(totals?.taxAmount || 0).toFixed(2)}
                    </span>
                  </div>
                )}
                <Separator
                  style={{ backgroundColor: `${COLORS.gold}30`, height: '1px', margin: '0.5rem 0' }}
                />
                <div
                  className="flex justify-between font-bold text-base p-2.5 rounded-lg"
                  style={{
                    background: `${COLORS.gold}15`,
                    border: `1px solid ${COLORS.gold}40`
                  }}
                >
                  <span style={{ color: COLORS.champagne }}>Total Due:</span>
                  <span style={{ color: COLORS.gold }}>AED {(totals?.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <div>
            <h3 className="font-semibold mb-3 text-sm" style={{ color: COLORS.champagne }}>
              Payment Methods
            </h3>
            <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
              <TabsList
                className="grid w-full grid-cols-3 p-1"
                style={{
                  backgroundColor: COLORS.charcoalDark,
                  borderColor: `${COLORS.gold}30`,
                  border: `1px solid ${COLORS.gold}30`
                }}
              >
                <TabsTrigger
                  value="card"
                  className="flex items-center gap-2 transition-all duration-300"
                  style={{
                    color: activeTab === 'card' ? COLORS.charcoal : COLORS.bronze,
                    backgroundColor: activeTab === 'card' ? COLORS.gold : 'transparent',
                    borderRadius: '6px'
                  }}
                >
                  <CreditCard className="w-4 h-4" />
                  Card
                </TabsTrigger>
                <TabsTrigger
                  value="cash"
                  className="flex items-center gap-2 transition-all duration-300"
                  style={{
                    color: activeTab === 'cash' ? COLORS.charcoal : COLORS.bronze,
                    backgroundColor: activeTab === 'cash' ? COLORS.gold : 'transparent',
                    borderRadius: '6px'
                  }}
                >
                  <Banknote className="w-4 h-4" />
                  Cash
                </TabsTrigger>
                <TabsTrigger
                  value="voucher"
                  className="flex items-center gap-2 transition-all duration-300"
                  style={{
                    color: activeTab === 'voucher' ? COLORS.charcoal : COLORS.bronze,
                    backgroundColor: activeTab === 'voucher' ? COLORS.gold : 'transparent',
                    borderRadius: '6px'
                  }}
                >
                  <Gift className="w-4 h-4" />
                  Voucher
                </TabsTrigger>
              </TabsList>

              <TabsContent value="card" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label style={{ color: COLORS.champagne }}>Amount</Label>
                    <SalonLuxeInput
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={cardAmount}
                      onChange={e => setCardAmount(e.target.value)}
                      leftIcon={<CreditCard className="w-4 h-4" />}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label style={{ color: COLORS.champagne }}>Card Type</Label>
                    <select
                      className="w-full h-12 px-4 border rounded-xl text-sm font-medium"
                      value={cardType}
                      onChange={e => setCardType(e.target.value)}
                      style={{
                        background: 'linear-gradient(135deg, rgba(245,230,200,0.08) 0%, rgba(212,175,55,0.05) 50%, rgba(184,134,11,0.03) 100%)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        border: '1px solid rgba(212, 175, 55, 0.25)',
                        color: COLORS.champagne
                      }}
                    >
                      <option value="visa">Visa</option>
                      <option value="mastercard">Mastercard</option>
                      <option value="amex">American Express</option>
                      <option value="discover">Discover</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label style={{ color: COLORS.champagne }}>Reference/Last 4 Digits (optional)</Label>
                  <SalonLuxeInput
                    placeholder="1234"
                    value={cardReference}
                    onChange={e => setCardReference(e.target.value)}
                  />
                </div>
                <SalonLuxeButton
                  variant="primary"
                  onClick={() => addPayment('card')}
                  disabled={!cardAmount || parseFloat(cardAmount) <= 0}
                  icon={<Plus className="w-4 h-4" />}
                  className="w-full"
                >
                  Add Card Payment
                </SalonLuxeButton>
              </TabsContent>

              <TabsContent value="cash" className="space-y-4">
                <div className="space-y-2">
                  <Label style={{ color: COLORS.champagne }}>Cash Amount</Label>
                  <SalonLuxeInput
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={cashAmount}
                    onChange={e => setCashAmount(e.target.value)}
                    leftIcon={<Banknote className="w-4 h-4" />}
                  />
                </div>

                {/* Quick Cash Buttons */}
                <div className="space-y-2">
                  <Label className="text-sm" style={{ color: COLORS.champagne }}>
                    Quick amounts:
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {quickAmounts.map((amount, index) => (
                      <Button
                        key={amount}
                        variant={index === 0 ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => addQuickCash(amount)}
                        className="text-xs transition-all duration-300 hover:scale-105"
                        style={
                          index === 0
                            ? {
                                background: `linear-gradient(135deg, ${COLORS.emerald} 0%, ${COLORS.emerald}DD 100%)`,
                                color: COLORS.champagne,
                                border: `1px solid ${COLORS.emerald}`,
                                boxShadow: `0 2px 12px ${COLORS.emerald}40`
                              }
                            : {
                                background: `${COLORS.charcoalLight}80`,
                                color: COLORS.champagne,
                                borderColor: `${COLORS.gold}40`,
                                boxShadow: `0 1px 4px ${COLORS.black}30`
                              }
                        }
                      >
                        {index === 0 ? 'Exact' : ''} AED{' '}
                        {amount.toFixed(amount % 1 === 0 ? 0 : 2)}
                      </Button>
                    ))}
                  </div>
                </div>

                {changeAmount > 0 && (
                  <Alert>
                    <Calculator className="w-4 h-4" />
                    <AlertDescription>
                      Change due: <strong>AED {changeAmount.toFixed(2)}</strong>
                    </AlertDescription>
                  </Alert>
                )}

                <SalonLuxeButton
                  variant="primary"
                  onClick={() => addPayment('cash')}
                  disabled={!cashAmount || parseFloat(cashAmount) <= 0}
                  icon={<Plus className="w-4 h-4" />}
                  className="w-full"
                >
                  Add Cash Payment
                </SalonLuxeButton>
              </TabsContent>

              <TabsContent value="voucher" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label style={{ color: COLORS.champagne }}>Voucher Amount</Label>
                    <SalonLuxeInput
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={voucherAmount}
                      onChange={e => setVoucherAmount(e.target.value)}
                      leftIcon={<Gift className="w-4 h-4" />}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label style={{ color: COLORS.champagne }}>Voucher Code</Label>
                    <SalonLuxeInput
                      placeholder="VOUCHER123"
                      value={voucherCode}
                      onChange={e => setVoucherCode(e.target.value)}
                    />
                  </div>
                </div>
                <SalonLuxeButton
                  variant="primary"
                  onClick={() => addPayment('voucher')}
                  disabled={!voucherAmount || !voucherCode || parseFloat(voucherAmount) <= 0}
                  icon={<Plus className="w-4 h-4" />}
                  className="w-full"
                >
                  Add Voucher Payment
                </SalonLuxeButton>
              </TabsContent>
            </Tabs>
          </div>

          {/* Added Payments */}
          {payments.length > 0 && (
            <div>
              <h3
                className="font-medium mb-3 flex items-center gap-2"
                style={{ color: COLORS.champagne }}
              >
                <Check className="w-4 h-4" style={{ color: COLORS.gold }} />
                Added Payments
              </h3>
              <div className="space-y-2">
                {payments.map((payment, index) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 border rounded-lg transition-all duration-300 cursor-pointer group relative overflow-hidden"
                    style={{
                      backgroundColor: COLORS.charcoalLight,
                      borderColor: `${COLORS.gold}20`,
                      animation: `fadeIn 0.3s ease-out ${index * 0.05}s backwards`,
                      transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                    onMouseMove={e => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      const x = ((e.clientX - rect.left) / rect.width) * 100
                      const y = ((e.clientY - rect.top) / rect.height) * 100
                      e.currentTarget.style.background = `
                        radial-gradient(circle at ${x}% ${y}%,
                          rgba(212,175,55,0.12) 0%,
                          rgba(212,175,55,0.06) 30%,
                          rgba(35,35,35,0.9) 60%,
                          rgba(26,26,26,0.9) 100%
                        )
                      `
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateX(4px)'
                      e.currentTarget.style.borderColor = `${COLORS.gold}40`
                      e.currentTarget.style.boxShadow = `0 4px 16px ${COLORS.gold}20`
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateX(0)'
                      e.currentTarget.style.background = COLORS.charcoalLight
                      e.currentTarget.style.borderColor = `${COLORS.gold}20`
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {getPaymentIcon(payment.type)}
                      <div>
                        <div className="font-semibold text-sm" style={{ color: COLORS.champagne }}>
                          AED {payment.amount.toFixed(2)}
                        </div>
                        <div className="text-xs" style={{ color: COLORS.bronze }}>
                          {payment.type.charAt(0).toUpperCase() + payment.type.slice(1)}
                          {payment.reference && ` - ${payment.reference}`}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePayment(payment.id)}
                      style={{ color: COLORS.red }}
                      className="hover:opacity-80"
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
            className="p-4 rounded-lg border transition-all duration-500 cursor-pointer relative overflow-hidden"
            style={{
              backgroundColor: COLORS.charcoalLight,
              borderColor: `${COLORS.gold}30`,
              boxShadow: `0 2px 4px ${COLORS.black}20`,
              backdropFilter: 'blur(12px)',
              transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
            onMouseMove={e => {
              const rect = e.currentTarget.getBoundingClientRect()
              const x = ((e.clientX - rect.left) / rect.width) * 100
              const y = ((e.clientY - rect.top) / rect.height) * 100
              e.currentTarget.style.background = `
                radial-gradient(circle at ${x}% ${y}%,
                  rgba(212,175,55,0.20) 0%,
                  rgba(212,175,55,0.12) 25%,
                  rgba(35,35,35,0.9) 50%,
                  rgba(26,26,26,0.9) 100%
                )
              `
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = `${COLORS.gold}50`
              e.currentTarget.style.boxShadow = `0 8px 32px ${COLORS.gold}30`
              e.currentTarget.style.transform = 'scale(1.02)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = COLORS.charcoalLight
              e.currentTarget.style.borderColor = `${COLORS.gold}30`
              e.currentTarget.style.boxShadow = `0 2px 4px ${COLORS.black}20`
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <div className="space-y-2.5">
              <div className="flex justify-between text-base">
                <span className="font-medium" style={{ color: COLORS.champagne }}>
                  Total Due:
                </span>
                <span className="font-bold" style={{ color: COLORS.gold }}>
                  AED {(totals?.total || 0).toFixed(2)}
                </span>
              </div>
              {payments.length > 0 && (
                <>
                  <Separator style={{ backgroundColor: `${COLORS.gold}20`, height: '1px' }} />
                  <div className="flex justify-between text-sm" style={{ color: COLORS.lightText }}>
                    <span>Amount Tendered:</span>
                    <span className="font-semibold" style={{ color: COLORS.champagne }}>
                      AED {paidAmount.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
              {remainingAmount > 0.01 ? (
                <div
                  className="flex justify-between text-base p-2.5 rounded-lg"
                  style={{
                    background: `${COLORS.red}15`,
                    border: `1px solid ${COLORS.red}40`
                  }}
                >
                  <span className="font-medium" style={{ color: COLORS.champagne }}>
                    Balance to Pay:
                  </span>
                  <span className="font-bold" style={{ color: COLORS.red }}>
                    AED {remainingAmount.toFixed(2)}
                  </span>
                </div>
              ) : changeAmount > 0 ? (
                <div
                  className="flex justify-between text-base p-2.5 rounded-lg"
                  style={{
                    background: `${COLORS.emerald}15`,
                    border: `1px solid ${COLORS.emerald}40`
                  }}
                >
                  <span className="font-medium" style={{ color: COLORS.champagne }}>
                    Change Due:
                  </span>
                  <span className="font-bold" style={{ color: COLORS.emerald }}>
                    AED {changeAmount.toFixed(2)}
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

          {/* Add fadeIn keyframe animation */}
          <style jsx>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(-10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </div>
    </SalonLuxeModal>

      {/* Validation Warning Modal */}
      <ValidationWarningModal
        open={showValidationModal}
        onClose={() => {
          setShowValidationModal(false)
          onClose() // Also close payment dialog to allow user to fix issues
        }}
        issues={validationIssues}
      />
    </>
  )
}
