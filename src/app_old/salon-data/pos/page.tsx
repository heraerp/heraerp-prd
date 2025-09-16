'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
/**
 * HERA ERP - Dubai POS (SoftPOS + Omnichannel)
 * Smart Code: HERA.RETAIL.POS.MODULE.DUBAI.v1
 *
 * Complete Point of Sale system built on HERA's 6-table foundation
 * Multi-tenant, VAT-compliant, offline-capable
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { universalApi } from '@/lib/universal-api'
import { handleError } from '@/lib/salon/error-handler'
import { PaymentWhatsAppActions } from '@/components/salon/whatsapp/PaymentWhatsAppActions'
import type { CartItem, Payment, TransactionData } from '@/types/salon.types'
import {
  CreditCard,
  ShoppingCart,
  Package,
  Barcode,
  Receipt,
  Search,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  Percent,
  Gift,
  Users,
  Clock,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Smartphone,
  Banknote,
  CreditCard as CardIcon,
  Wallet,
  ArrowLeft,
  ArrowRight,
  Home,
  Settings,
  Power,
  FileText,
  TrendingUp,
  User,
  MapPin,
  Globe,
  Hash,
  X,
  Printer,
  Mail,
  Send
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ----------------------------- Types & Interfaces ------------------------------------

interface Product {
  id: string
  entity_type: 'product'
  entity_name: string
  entity_code?: string
  smart_code: string
  barcode?: string
  price: number
  cost?: number
  vat_rate: number
  stock_on_hand?: number
  category_id?: string
  category_name?: string
  min_price?: number
  max_discount_pct?: number
  image_url?: string
}

interface CartItem {
  product: Product
  quantity: number
  unit_price: number
  discount_amount: number
  discount_percent: number
  tax_amount: number
  line_total: number
}

interface Payment {
  method: 'cash' | 'card' | 'softpos' | 'wallet' | 'gift_card'
  amount: number
  reference?: string
  auth_code?: string
}

interface POSConfig {
  rounding_mode: 'none' | 'nearest_5' | 'nearest_10'
  receipt_options: {
    show_tax_details: boolean
    show_item_codes: boolean
    footer_text: string
    header_logo?: string
  }
  tips_enabled: boolean
  split_payment_enabled: boolean
  offline_queue_enabled: boolean
  vat_rate: number
  currency: string
}

interface Register {
  id: string
  entity_name: string
  location_id: string
  location_name: string
  status: 'open' | 'closed'
  current_shift_id?: string
  float_amount?: number
}

interface Customer {
  id: string
  entity_name: string
  entity_code?: string
  smart_code: string
  phone?: string
  email?: string
  loyalty_points?: number
  loyalty_tier?: string
}

// ----------------------------- Mock Data ------------------------------------

const mockProducts: Product[] = [
  {
    id: '1',
    entity_type: 'product',
    entity_name: 'Brazilian Blowout Treatment',
    entity_code: 'SRV-001',
    smart_code: 'HERA.SALON.SERVICE.TREATMENT.KERATIN.v1',
    price: 450,
    cost: 120,
    vat_rate: 5,
    category_id: '1',
    category_name: 'Hair Treatments',
    min_price: 400,
    max_discount_pct: 20
  },
  {
    id: '2',
    entity_type: 'product',
    entity_name: 'Premium Hair Cut & Style',
    entity_code: 'SRV-002',
    smart_code: 'HERA.SALON.SERVICE.CUT.PREMIUM.v1',
    price: 180,
    cost: 45,
    vat_rate: 5,
    category_id: '2',
    category_name: 'Hair Services',
    min_price: 150,
    max_discount_pct: 15
  },
  {
    id: '3',
    entity_type: 'product',
    entity_name: 'Hair Color - Full Head',
    entity_code: 'SRV-003',
    smart_code: 'HERA.SALON.SERVICE.COLOR.FULL.v1',
    price: 320,
    cost: 80,
    vat_rate: 5,
    category_id: '2',
    category_name: 'Hair Services'
  },
  {
    id: '4',
    entity_type: 'product',
    entity_name: 'Luxury Spa Facial',
    entity_code: 'SPA-001',
    smart_code: 'HERA.SALON.SERVICE.FACIAL.LUXURY.v1',
    price: 280,
    cost: 70,
    vat_rate: 5,
    category_id: '3',
    category_name: 'Spa Services'
  },
  {
    id: '5',
    entity_type: 'product',
    entity_name: 'Aloe Vera Shampoo 250ml',
    entity_code: 'PRD-001',
    barcode: '6291234567890',
    smart_code: 'HERA.SALON.PRODUCT.SHAMPOO.ALOE.v1',
    price: 45,
    cost: 15,
    vat_rate: 5,
    stock_on_hand: 24,
    category_id: '4',
    category_name: 'Hair Products'
  },
  {
    id: '6',
    entity_type: 'product',
    entity_name: 'Argan Oil Hair Mask 200ml',
    entity_code: 'PRD-002',
    barcode: '6291234567891',
    smart_code: 'HERA.SALON.PRODUCT.MASK.ARGAN.v1',
    price: 85,
    cost: 25,
    vat_rate: 5,
    stock_on_hand: 12,
    category_id: '4',
    category_name: 'Hair Products'
  },
  {
    id: '7',
    entity_type: 'product',
    entity_name: 'Manicure & Pedicure Combo',
    entity_code: 'SPA-002',
    smart_code: 'HERA.SALON.SERVICE.NAILS.COMBO.v1',
    price: 220,
    cost: 55,
    vat_rate: 5,
    category_id: '5',
    category_name: 'Nail Services'
  },
  {
    id: '8',
    entity_type: 'product',
    entity_name: 'Bridal Makeup Package',
    entity_code: 'MKP-001',
    smart_code: 'HERA.SALON.SERVICE.MAKEUP.BRIDAL.v1',
    price: 850,
    cost: 200,
    vat_rate: 5,
    category_id: '6',
    category_name: 'Makeup Services'
  }
]

const mockCategories = [
  { id: '1', name: 'Hair Treatments', color: '#8B5CF6' },
  { id: '2', name: 'Hair Services', color: '#3B82F6' },
  { id: '3', name: 'Spa Services', color: '#10B981' },
  { id: '4', name: 'Hair Products', color: '#F59E0B' },
  { id: '5', name: 'Nail Services', color: '#EC4899' },
  { id: '6', name: 'Makeup Services', color: '#EF4444' }
]

// ----------------------------- Utility Functions ------------------------------------

const formatCurrency = (amount: number, currency: string = 'AED') => {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

const calculateTax = (amount: number, rate: number) => {
  return amount * (rate / 100)
}

const calculateTotal = (subtotal: number, tax: number, discount: number) => {
  return subtotal + tax - discount
}

// ----------------------------- Main Component ------------------------------------

export default function DubaiPOSSystem() {
  const { currentOrganization, contextLoading } = useMultiOrgAuth()
  const [organizationId, setOrganizationId] = useState<string>('')

  // POS State
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [discountPercent, setDiscountPercent] = useState(0)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [receiptNumber, setReceiptNumber] = useState<string>('')
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false)
  const [lastTransactionData, setLastTransactionData] = useState<any>(null)
  const [customerEmail, setCustomerEmail] = useState<string>('')
  const [customerPhone, setCustomerPhone] = useState<string>('')

  // Register & Config State
  const [currentRegister, setCurrentRegister] = useState<Register>({
    id: 'REG-001',
    entity_name: 'Register 1 - Main',
    location_id: 'LOC-001',
    location_name: 'Hair Talkz - Karama',
    status: 'open',
    float_amount: 500
  })

  const [posConfig] = useState<POSConfig>({
    rounding_mode: 'nearest_5',
    receipt_options: {
      show_tax_details: true,
      show_item_codes: true,
      footer_text: 'Thank you for visiting Hair Talkz!'
    },
    tips_enabled: true,
    split_payment_enabled: true,
    offline_queue_enabled: true,
    vat_rate: 5,
    currency: 'AED'
  })

  // Set organization ID
  useEffect(() => {
    if (currentOrganization?.id) {
      setOrganizationId(currentOrganization.id)
    }
  }, [currentOrganization])

  // ----------------------------- Computed Values ------------------------------------

  const filteredProducts = useMemo(() => {
    return mockProducts.filter(product => {
      const matchesSearch =
        product.entity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.entity_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode?.includes(searchQuery)
      const matchesCategory = !selectedCategory || product.category_id === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory])

  // ----------------------------- Helper Functions ------------------------------------

  const applyRounding = (amount: number, mode: string): number => {
    switch (mode) {
      case 'nearest_5':
        return Math.round(amount * 20) / 20 // Round to nearest 0.05
      case 'nearest_10':
        return Math.round(amount * 10) / 10 // Round to nearest 0.10
      default:
        return amount
    }
  }

  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
    const totalDiscount = cart.reduce((sum, item) => sum + item.discount_amount, 0) + discountAmount
    const totalTax = cart.reduce((sum, item) => sum + item.tax_amount, 0)
    const total = subtotal - totalDiscount + totalTax

    return {
      subtotal,
      discount: totalDiscount,
      tax: totalTax,
      total: applyRounding(total, posConfig.rounding_mode)
    }
  }, [cart, discountAmount, posConfig.rounding_mode])

  const remainingAmount = useMemo(() => {
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
    return Math.max(0, cartTotals.total - totalPaid)
  }, [payments, cartTotals.total])

  const addToCart = (product: Product, quantity: number = 1) => {
    const existingItemIndex = cart.findIndex(item => item.product.id === product.id)

    if (existingItemIndex >= 0) {
      const updatedCart = [...cart]
      updatedCart[existingItemIndex].quantity += quantity
      updateCartItem(existingItemIndex, updatedCart[existingItemIndex])
    } else {
      const taxAmount = calculateTax(product.price * quantity, product.vat_rate)
      const newItem: CartItem = {
        product,
        quantity,
        unit_price: product.price,
        discount_amount: 0,
        discount_percent: 0,
        tax_amount: taxAmount,
        line_total: product.price * quantity + taxAmount
      }
      setCart([...cart, newItem])
    }
  }

  const updateCartItem = (index: number, updates: Partial<CartItem>) => {
    const updatedCart = [...cart]
    const item = { ...updatedCart[index], ...updates }

    // Recalculate line totals
    const lineSubtotal = item.unit_price * item.quantity
    const lineDiscountAmount =
      item.discount_percent > 0
        ? lineSubtotal * (item.discount_percent / 100)
        : item.discount_amount

    item.discount_amount = lineDiscountAmount
    item.tax_amount = calculateTax(lineSubtotal - lineDiscountAmount, item.product.vat_rate)
    item.line_total = lineSubtotal - lineDiscountAmount + item.tax_amount

    updatedCart[index] = item
    setCart(updatedCart)
  }

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  const clearCart = () => {
    setCart([])
    setPayments([])
    setDiscountAmount(0)
    setDiscountPercent(0)
    setSelectedCustomer(null)
  }

  const handlePayment = async (method: Payment['method'], amount: number) => {
    if (amount <= 0) return

    const payment: Payment = {
      method,
      amount: Math.min(amount, remainingAmount),
      reference: method === 'cash' ? undefined : `REF-${Date.now()}`
    }

    if (method === 'card' || method === 'softpos') {
      payment.auth_code = `AUTH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    }

    setPayments([...payments, payment])

    // Check if fully paid
    if (remainingAmount - payment.amount <= 0.01) {
      // Account for floating point
      await completeSale()
    }
  }

  const completeSale = async () => {
    setIsProcessing(true)

    try {
      // Generate receipt number
      const receipt = `R-${Date.now().toString().slice(-6)}`
      setReceiptNumber(receipt)

      // Create sale transaction payload
      const saleTransaction = {
        organization_id: organizationId,
        transaction_type: 'POS_SALE',
        transaction_date: new Date().toISOString(),
        total_amount: cartTotals.total,
        fiscal_year: new Date().getFullYear(),
        fiscal_period: new Date().getMonth() + 1,
        posting_period_code: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
        transaction_currency_code: posConfig.currency,
        smart_code: 'HERA.RETAIL.POS.SALE.RECEIPT.v1',
        business_context: {
          register_id: currentRegister.id,
          customer_id: selectedCustomer?.id,
          location_id: currentRegister.location_id
        },
        metadata: {
          channel: 'in_store',
          receipt_no: receipt,
          staff_id: 'STAFF-001' // Would come from auth context
        }
      }

      // Create transaction lines
      const transactionLines: Array<{
        line_entity_id: string
        transaction_line_type: string
        description: string
        quantity: number
        unit_amount: number
        line_amount: number
        smart_code: string
      }> = []
      let lineNumber = 1

      // Add item lines
      cart.forEach(item => {
        transactionLines.push({
          organization_id: organizationId,
          line_number: lineNumber++,
          line_type: 'ITEM',
          description: item.product.entity_name,
          quantity: item.quantity,
          unit_amount: item.unit_price,
          line_amount: item.unit_price * item.quantity,
          tax_amount: 0, // Tax shown separately
          smart_code: 'HERA.RETAIL.POS.SALE.LINE.ITEM.v1',
          line_data: {
            product_id: item.product.id,
            product_code: item.product.entity_code
          }
        })

        // Add discount line if applicable
        if (item.discount_amount > 0) {
          transactionLines.push({
            organization_id: organizationId,
            line_number: lineNumber++,
            line_type: 'DISCOUNT',
            description: `${item.discount_percent}% Discount`,
            quantity: 1,
            unit_amount: -item.discount_amount,
            line_amount: -item.discount_amount,
            smart_code: 'HERA.RETAIL.POS.SALE.LINE.DISCOUNT.v1',
            line_data: {
              discount_type: 'percentage',
              discount_value: item.discount_percent
            }
          })
        }
      })

      // Add tax line
      if (cartTotals.tax > 0) {
        transactionLines.push({
          organization_id: organizationId,
          line_number: lineNumber++,
          line_type: 'TAX',
          description: `UAE VAT ${posConfig.vat_rate}%`,
          quantity: 1,
          unit_amount: cartTotals.tax,
          line_amount: cartTotals.tax,
          smart_code: 'HERA.TAX.UAE.VAT.LINE.v1',
          line_data: {
            tax_profile_id: 'TAX-UAE-5',
            rate: posConfig.vat_rate / 100
          }
        })
      }

      // Add payment lines
      payments.forEach(payment => {
        transactionLines.push({
          organization_id: organizationId,
          line_number: lineNumber++,
          line_type: 'PAYMENT',
          description: `Payment - ${payment.method.toUpperCase()}`,
          quantity: 1,
          unit_amount: payment.amount,
          line_amount: payment.amount,
          smart_code: `HERA.RETAIL.POS.PAYMENT.${payment.method.toUpperCase()}.v1`,
          line_data: {
            payment_method: payment.method,
            reference: payment.reference,
            auth_code: payment.auth_code
          }
        })
      })

      // Calculate change if cash payment exceeds total
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
      if (totalPaid > cartTotals.total) {
        const change = totalPaid - cartTotals.total
        transactionLines.push({
          organization_id: organizationId,
          line_number: lineNumber++,
          line_type: 'CHANGE',
          description: 'Change',
          quantity: 1,
          unit_amount: -change,
          line_amount: -change,
          smart_code: 'HERA.RETAIL.POS.PAYMENT.CHANGE.v1'
        })
      }

      // Here you would call universalApi to create the transaction
      // await universalApi.createTransaction(saleTransaction, transactionLines)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Store transaction data for receipt
      setLastTransactionData({
        receiptNumber: receipt,
        date: new Date(),
        items: cart,
        payments: payments,
        totals: cartTotals,
        customer: selectedCustomer,
        register: currentRegister
      })

      // Show receipt modal instead of alert
      setShowPaymentModal(false)
      setShowReceiptModal(true)
    } catch (error) {
      handleError(error, 'pos-sale', {
        showToast: true,
        fallbackMessage: 'Sale failed. Please try again.'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // ----------------------------- UI Components ------------------------------------

  const ProductGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {filteredProducts.map(product => (
        <Card
          key={product.id}
          className="cursor-pointer hover:shadow-lg transition-shadow hover:border-purple-500"
          onClick={() => addToCart(product)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-sm !text-gray-100 dark:!text-foreground line-clamp-2">
                {product.entity_name}
              </h4>
              {product.stock_on_hand !== undefined && product.stock_on_hand < 10 && (
                <Badge variant="destructive" className="text-xs">
                  Low Stock
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-muted-foreground mb-2">
              {product.entity_code && (
                <>
                  <Hash className="w-3 h-3" />
                  <span>{product.entity_code}</span>
                </>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(product.price)}
              </span>
              {product.stock_on_hand !== undefined && (
                <span className="text-xs text-muted-foreground">Stock: {product.stock_on_hand}</span>
              )}
            </div>

            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-border">
              <Badge
                variant="outline"
                className="text-xs"
                style={{
                  borderColor: mockCategories.find(c => c.id === product.category_id)?.color + '40',
                  backgroundColor:
                    mockCategories.find(c => c.id === product.category_id)?.color + '10'
                }}
              >
                {product.category_name}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const CartDisplay = () => (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            <span>Current Sale</span>
            {cart.length > 0 && <Badge className="ml-2">{cart.length} items</Badge>}
          </div>
          {cart.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Customer Info */}
        <div className="mb-4 p-3 bg-muted dark:bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Customer</span>
            <Button variant="ghost" size="sm">
              <Users className="w-4 h-4 mr-2" />
              {selectedCustomer ? selectedCustomer.entity_name : 'Walk-in'}
            </Button>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Cart is empty</p>
              <p className="text-sm mt-1">Add items to start a sale</p>
            </div>
          ) : (
            cart.map((item, index) => (
              <div
                key={index}
                className="p-3 bg-background dark:bg-muted border border-border dark:border-border rounded-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h5 className="font-medium text-sm !text-gray-100 dark:!text-foreground">
                      {item.product.entity_name}
                    </h5>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                      {formatCurrency(item.unit_price)} × {item.quantity}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromCart(index)}
                    className="text-red-600 hover:text-red-700 -mt-1 -mr-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateCartItem(index, { quantity: Math.max(1, item.quantity - 1) })
                      }
                      className="h-7 w-7 p-0"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <Input
                      value={item.quantity}
                      onChange={e =>
                        updateCartItem(index, { quantity: parseInt(e.target.value) || 1 })
                      }
                      className="h-7 w-12 text-center px-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCartItem(index, { quantity: item.quantity + 1 })}
                      className="h-7 w-7 p-0"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Discount */}
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="h-7 px-2">
                      <Percent className="w-3 h-3 mr-1" />
                      Disc
                    </Button>
                  </div>

                  {/* Line Total */}
                  <div className="ml-auto text-right">
                    <p className="font-semibold text-sm">{formatCurrency(item.line_total)}</p>
                    {item.discount_amount > 0 && (
                      <p className="text-xs text-red-600">
                        -{formatCurrency(item.discount_amount)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals */}
        {cart.length > 0 && (
          <div className="border-t border-border dark:border-border pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground dark:text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(cartTotals.subtotal)}</span>
            </div>

            {cartTotals.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground dark:text-muted-foreground">Discount</span>
                <span className="font-medium text-red-600">
                  -{formatCurrency(cartTotals.discount)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground dark:text-muted-foreground">VAT ({posConfig.vat_rate}%)</span>
              <span className="font-medium">{formatCurrency(cartTotals.tax)}</span>
            </div>

            <div className="flex justify-between text-lg font-bold pt-2 border-t border-border dark:border-border">
              <span>Total</span>
              <span className="text-purple-600 dark:text-purple-400">
                {formatCurrency(cartTotals.total)}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="outline" disabled={cart.length === 0} className="h-12">
            <Receipt className="w-4 h-4 mr-2" />
            Hold
          </Button>
          <Button
            className="h-12 bg-purple-600 hover:bg-purple-700 text-foreground"
            disabled={cart.length === 0}
            onClick={() => setShowPaymentModal(true)}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Pay {cart.length > 0 && formatCurrency(cartTotals.total)}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const ReceiptModal = () => {
    if (!showReceiptModal || !lastTransactionData) return null

    const printReceipt = () => {
      const receiptWindow = window.open('', 'Receipt', 'width=400,height=600')
      if (!receiptWindow) return

      const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - ${lastTransactionData.receiptNumber}</title>
          <style>
            body { font-family: monospace; padding: 20px; font-size: 12px; }
            h1 { font-size: 18px; text-align: center; }
            h2 { font-size: 14px; text-align: center; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .item { margin: 5px 0; }
            .total { font-weight: bold; font-size: 14px; }
            .center { text-align: center; }
            .right { text-align: right; }
            .flex { display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <h1>HERA SALON</h1>
          <h2>${lastTransactionData.register.location_name}</h2>
          <div class="center">Receipt: ${lastTransactionData.receiptNumber}</div>
          <div class="center">${lastTransactionData.date.toLocaleString()}</div>
          <div class="divider"></div>
          
          ${lastTransactionData.items
            .map(
              (item: CartItem) => `
            <div class="item">
              <div>${item.product.entity_name}</div>
              <div class="flex">
                <span>${item.quantity} x ${formatCurrency(item.unit_price)}</span>
                <span>${formatCurrency(item.line_total)}</span>
              </div>
              ${item.discount_amount > 0 ? `<div class="right">Disc: -${formatCurrency(item.discount_amount)}</div>` : ''}
            </div>
          `
            )
            .join('')}
          
          <div class="divider"></div>
          <div class="flex"><span>Subtotal:</span><span>${formatCurrency(lastTransactionData.totals.subtotal)}</span></div>
          ${lastTransactionData.totals.discount > 0 ? `<div class="flex"><span>Discount:</span><span>-${formatCurrency(lastTransactionData.totals.discount)}</span></div>` : ''}
          <div class="flex"><span>VAT (${posConfig.vat_rate}%):</span><span>${formatCurrency(lastTransactionData.totals.tax)}</span></div>
          <div class="divider"></div>
          <div class="flex total"><span>TOTAL:</span><span>${formatCurrency(lastTransactionData.totals.total)}</span></div>
          <div class="divider"></div>
          
          ${lastTransactionData.payments
            .map(
              (payment: Payment) => `
            <div class="flex"><span>${payment.method.toUpperCase()}:</span><span>${formatCurrency(payment.amount)}</span></div>
          `
            )
            .join('')}
          
          <div class="divider"></div>
          <div class="center">Thank you for your visit!</div>
          <div class="center">VAT REG: 100123456789012</div>
        </body>
        </html>
      `

      receiptWindow.document.write(receiptHTML)
      receiptWindow.document.close()
      receiptWindow.print()
    }

    const sendDigitalReceipt = async (method: 'email' | 'sms') => {
      try {
        // Here you would integrate with actual email/SMS service
        // For now, we'll simulate it
        const recipient = method === 'email' ? customerEmail : customerPhone
        if (!recipient) {
          handleError(
            new Error(`Please enter ${method === 'email' ? 'email address' : 'phone number'}`),
            'pos-receipt',
            { showToast: true }
          )
          return
        }

        // Simulate sending
        handleError(new Error(`Receipt sent via ${method} to ${recipient}`), 'pos-receipt', {
          showToast: true,
          fallbackMessage: `Receipt sent via ${method} to ${recipient}`
        })
      } catch (error) {
        handleError(error, 'pos-receipt', {
          showToast: true,
          fallbackMessage: 'Failed to send receipt. Please try again.'
        })
      }
    }

    const closeAndClearCart = () => {
      setShowReceiptModal(false)
      clearCart()
      setCustomerEmail('')
      setCustomerPhone('')
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
        <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
          <CardHeader className="border-b border-border dark:border-border">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span>Sale Complete!</span>
              </div>
              <Button variant="ghost" size="sm" onClick={closeAndClearCart}>
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            {/* Receipt Summary */}
            <div className="mb-6 p-4 bg-muted dark:bg-muted rounded-lg">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">Receipt Number</p>
                <p className="text-2xl font-bold">{lastTransactionData.receiptNumber}</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground dark:text-muted-foreground">Date:</span>
                  <span>{lastTransactionData.date.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground dark:text-muted-foreground">Items:</span>
                  <span>{lastTransactionData.items.length}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span className="text-purple-600 dark:text-purple-400">
                    {formatCurrency(lastTransactionData.totals.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Receipt Actions */}
            <div className="space-y-4">
              <Button className="w-full" onClick={printReceipt}>
                <Printer className="w-4 h-4 mr-2" />
                Print Receipt
              </Button>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Send Digital Copy</h4>

                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => sendDigitalReceipt('email')}
                    disabled={!customerEmail}
                  >
                    <Mail className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Input
                    type="tel"
                    placeholder="Phone number"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => sendDigitalReceipt('sms')}
                    disabled={!customerPhone}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                {/* WhatsApp Payment Confirmation */}
                {customerPhone && lastTransactionData && (
                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <PaymentWhatsAppActions
                      payment={{
                        id: lastTransactionData.id,
                        amount: lastTransactionData.totals.total,
                        date: lastTransactionData.date.toISOString(),
                        customer_name:
                          lastTransactionData.customer?.entity_name || 'Walk-in Customer',
                        customer_phone: customerPhone,
                        payment_method: lastTransactionData.payments[0]?.method || 'cash',
                        transaction_id: lastTransactionData.receiptNumber,
                        services: lastTransactionData.items
                          .map(item => item.product.entity_name)
                          .join(', '),
                        status: 'paid'
                      }}
                      organizationId={organizationId}
                      onSendConfirmation={() => {
                        console.log('WhatsApp payment confirmation sent')
                      }}
                    />
                  </div>
                )}
              </div>

              <Button className="w-full" variant="outline" onClick={closeAndClearCart}>
                Start New Sale
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const PaymentModal = () => {
    if (!showPaymentModal) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
          <CardHeader className="border-b border-border dark:border-border">
            <CardTitle className="flex items-center justify-between">
              <span>Payment - {formatCurrency(cartTotals.total)}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPaymentModal(false)}
                disabled={isProcessing}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            {/* Amount Due */}
            <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Amount Due</span>
                <span className="text-purple-600 dark:text-purple-400">
                  {formatCurrency(remainingAmount)}
                </span>
              </div>

              {payments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800 space-y-1">
                  <div className="text-sm font-medium mb-2">Payments Made:</div>
                  {payments.map((payment, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-muted-foreground dark:text-muted-foreground">
                        {payment.method.charAt(0).toUpperCase() + payment.method.slice(1)}
                      </span>
                      <span>{formatCurrency(payment.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Methods */}
            <div className="space-y-4">
              <h4 className="font-semibold">Payment Methods</h4>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-24 flex-col"
                  onClick={() => handlePayment('cash', remainingAmount)}
                  disabled={isProcessing || remainingAmount <= 0}
                >
                  <Banknote className="w-8 h-8 mb-2 text-green-600" />
                  <span className="text-sm font-medium">Cash</span>
                  <span className="text-xs text-muted-foreground">Quick payment</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-24 flex-col"
                  onClick={() => handlePayment('card', remainingAmount)}
                  disabled={isProcessing || remainingAmount <= 0}
                >
                  <CardIcon className="w-8 h-8 mb-2 text-primary" />
                  <span className="text-sm font-medium">Card</span>
                  <span className="text-xs text-muted-foreground">Credit/Debit</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-24 flex-col"
                  onClick={() => handlePayment('softpos', remainingAmount)}
                  disabled={isProcessing || remainingAmount <= 0}
                >
                  <Smartphone className="w-8 h-8 mb-2 text-purple-600" />
                  <span className="text-sm font-medium">SoftPOS</span>
                  <span className="text-xs text-muted-foreground">Tap to pay</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-24 flex-col"
                  onClick={() => handlePayment('wallet', remainingAmount)}
                  disabled={isProcessing || remainingAmount <= 0}
                >
                  <Wallet className="w-8 h-8 mb-2 text-orange-600" />
                  <span className="text-sm font-medium">Digital Wallet</span>
                  <span className="text-xs text-muted-foreground">Apple/Google Pay</span>
                </Button>
              </div>

              {/* Custom Amount */}
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Custom amount"
                  className="flex-1"
                  disabled={isProcessing || remainingAmount <= 0}
                />
                <Button variant="outline" disabled={isProcessing || remainingAmount <= 0}>
                  Add Payment
                </Button>
              </div>
            </div>

            {/* Complete Sale Button */}
            {remainingAmount <= 0.01 && (
              <Button
                className="w-full mt-6 h-12 bg-green-600 hover:bg-green-700 text-foreground"
                onClick={completeSale}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Sale
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ----------------------------- Main Render ------------------------------------

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-50/30 dark:from-gray-900 dark:to-gray-900">
      {/* POS Header */}
      <div className="sticky top-0 z-20 bg-background/80 dark:bg-background/80 backdrop-blur-xl border-b border-border dark:border-gray-800 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>

              <div className="hidden md:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  HERA POS - Dubai
                </h1>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  {currentRegister.location_name} • Register: {currentRegister.entity_name}
                </p>
              </div>
            </div>

            {/* Center Section - Time */}
            <div className="hidden lg:flex items-center gap-2 text-muted-foreground dark:text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">
                {new Date().toLocaleString('en-AE', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                  hour12: true
                })}
              </span>
            </div>

            {/* Right Section - Quick Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Receipt className="w-4 h-4 mr-2" />
                Reports
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                X-Report
              </Button>
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                <Power className="w-4 h-4 mr-2" />
                Close Shift
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Products Section */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* Search and Filters */}
          <div className="mb-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, code, or barcode..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Button variant="outline">
                <Barcode className="w-4 h-4 mr-2" />
                Scan
              </Button>
            </div>

            {/* Category Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={selectedCategory === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('')}
                className="h-8"
              >
                All Items
              </Button>
              {mockCategories.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="h-8"
                  style={{
                    backgroundColor: selectedCategory === category.id ? category.color : undefined,
                    borderColor: category.color + '40'
                  }}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <ProductGrid />
        </div>

        {/* Cart Section */}
        <div className="w-96 border-l border-border dark:border-gray-800 p-4">
          <CartDisplay />
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal />

      {/* Receipt Modal */}
      <ReceiptModal />
    </div>
  )
}
