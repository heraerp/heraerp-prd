'use client'

// ================================================================================
// HERA UNIVERSAL POS DNA COMPONENT
// Smart Code: HERA.UI.POS.UNIVERSAL.ENGINE.v1
// Reusable across all industries with configuration-based customization
// ================================================================================

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  DollarSign,
  Clock,
  Star,
  Save,
  Receipt,
  CheckCircle,
  Printer,
  Smartphone,
  Banknote,
  Wallet,
  QrCode,
  Gift,
  Split,
  Calculator,
  Zap
} from 'lucide-react'

// ================================================================================
// UNIVERSAL POS INTERFACES
// ================================================================================

export interface POSItem {
  id: number | string
  name: string
  category: string
  price: number
  type: 'service' | 'product'
  description?: string
  duration?: number // For services
  stock?: number // For products
  provider?: string // Service provider (stylist, doctor, etc.)
  brand?: string // Product brand
  unit?: string // Product unit (each, lb, gallon, etc.)
  metadata?: Record<string, any>
}

export interface POSConfiguration {
  businessName: string
  businessType: 'salon' | 'restaurant' | 'retail' | 'healthcare' | 'automotive' | 'general'
  currency: string
  taxRate: number
  receiptHeader: string
  receiptFooter: string
  theme: {
    primaryColor: string
    secondaryColor: string
    accentColor: string
    icon: React.ComponentType<any>
  }
  features: {
    splitPayments: boolean
    printing: boolean
    inventory: boolean
    services: boolean
    appointments: boolean
    loyalty: boolean
  }
  paymentMethods: {
    cash: boolean
    card: boolean
    apple_pay: boolean
    google_pay: boolean
    venmo: boolean
    gift_card: boolean
    store_credit: boolean
    insurance?: boolean // Healthcare
    financing?: boolean // Automotive
  }
  itemCategories: string[]
  serviceProviders?: string[] // For service-based businesses
}

export interface UniversalPOSProps {
  config: POSConfiguration
  items: POSItem[]
  onTransaction?: (transaction: any) => void
  onSave?: (data: any) => void
  demoMode?: boolean
  className?: string
}

// ================================================================================
// UNIVERSAL POS COMPONENT
// ================================================================================

export function UniversalPOS({
  config,
  items,
  onTransaction,
  onSave,
  demoMode = false,
  className = ''
}: UniversalPOSProps) {
  // Core POS State
  const [cart, setCart] = useState<(POSItem & { quantity: number })[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [splitPayment, setSplitPayment] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState([{ method: 'cash', amount: 0 }])

  // Transaction State
  const [hasChanges, setHasChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [lastTransaction, setLastTransaction] = useState(null)
  const [receiptPrinted, setReceiptPrinted] = useState(false)

  // ============================================================================
  // CART MANAGEMENT
  // ============================================================================

  const addToCart = (item: POSItem) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id)
    if (existingItem) {
      setCart(
        cart.map(cartItem =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        )
      )
    } else {
      setCart([...cart, { ...item, quantity: 1 }])
    }
    setHasChanges(true)
  }

  const removeFromCart = (itemId: number | string) => {
    setCart(cart.filter(item => item.id !== itemId))
    setHasChanges(true)
  }

  const updateQuantity = (itemId: number | string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(itemId)
    } else {
      setCart(cart.map(item => (item.id === itemId ? { ...item, quantity: newQuantity } : item)))
    }
    setHasChanges(true)
  }

  // ============================================================================
  // CALCULATION HELPERS
  // ============================================================================

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getTax = () => {
    return getCartTotal() * config.taxRate
  }

  const getFinalTotal = () => {
    return getCartTotal() + getTax()
  }

  const getTotalPaymentAmount = () => {
    return paymentMethods.reduce((sum, p) => sum + p.amount, 0)
  }

  const getRemainingAmount = () => {
    return getFinalTotal() - getTotalPaymentAmount()
  }

  // ============================================================================
  // PAYMENT HELPERS
  // ============================================================================

  const autoFillRemaining = (index: number) => {
    const remaining = getRemainingAmount()
    if (remaining > 0) {
      updatePaymentMethodAmount(index, remaining)
    }
  }

  const autoCompletePayments = () => {
    const remaining = getRemainingAmount()
    if (remaining > 0) {
      const emptyIndex = paymentMethods.findIndex(pm => pm.amount === 0)
      if (emptyIndex >= 0) {
        updatePaymentMethodAmount(emptyIndex, remaining)
      } else {
        setPaymentMethods([...paymentMethods, { method: 'cash', amount: remaining }])
      }
    }
  }

  const addPaymentMethod = () => {
    setPaymentMethods([...paymentMethods, { method: 'card', amount: 0 }])
  }

  const updatePaymentMethodAmount = (index: number, amount: number | string) => {
    const updated = [...paymentMethods]
    updated[index].amount = parseFloat(String(amount)) || 0
    setPaymentMethods(updated)
  }

  const updatePaymentMethodType = (index: number, method: string) => {
    const updated = [...paymentMethods]
    updated[index].method = method
    setPaymentMethods(updated)
  }

  const removePaymentMethod = (index: number) => {
    if (paymentMethods.length > 1) {
      setPaymentMethods(paymentMethods.filter((_, i) => i !== index))
    }
  }

  // ============================================================================
  // TRANSACTION PROCESSING
  // ============================================================================

  const processPayment = () => {
    if (cart.length === 0) return

    const transaction = {
      id: `TXN-${Date.now()}`,
      businessType: config.businessType,
      date: new Date(),
      items: cart,
      subtotal: getCartTotal(),
      tax: getTax(),
      total: getFinalTotal(),
      paymentMethod: splitPayment ? paymentMethods : paymentMethod,
      customer: selectedCustomer,
      receiptNumber: `${config.businessType.toUpperCase()}-${Math.floor(Math.random() * 100000)}`,
      currency: config.currency
    }

    setLastTransaction(transaction)
    onTransaction?.(transaction)

    // Clear cart after successful payment
    setCart([])
    setSelectedCustomer(null)
    setHasChanges(false)
    setSplitPayment(false)
    setPaymentMethods([{ method: 'cash', amount: 0 }])
    setReceiptPrinted(false)

    alert(`${config.businessName}: Payment processed successfully!`)
  }

  const printReceipt = () => {
    if (!lastTransaction) return

    const receiptContent = `
      ${config.receiptHeader}
      ================================
      Receipt #: ${lastTransaction.receiptNumber}
      Date: ${lastTransaction.date.toLocaleString()}
      ================================
      
      ITEMS:
      ${lastTransaction.items
        .map(
          item =>
            `${item.name} x${item.quantity}${item.type === 'service' && item.provider ? ` (${item.provider})` : ''}
         ${config.currency}${(item.price * item.quantity).toFixed(2)}`
        )
        .join('\n')}
      
      --------------------------------
      Subtotal: ${config.currency}${lastTransaction.subtotal.toFixed(2)}
      Tax (${(config.taxRate * 100).toFixed(1)}%): ${config.currency}${lastTransaction.tax.toFixed(2)}
      ================================
      TOTAL: ${config.currency}${lastTransaction.total.toFixed(2)}
      ================================
      
      Payment Method: ${
        Array.isArray(lastTransaction.paymentMethod)
          ? lastTransaction.paymentMethod
              .map(p => `${p.method}: ${config.currency}${p.amount.toFixed(2)}`)
              .join(', ')
          : lastTransaction.paymentMethod
      }
      
      ${config.receiptFooter}
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - ${lastTransaction.receiptNumber}</title>
            <style>
              body { font-family: monospace; padding: 20px; max-width: 400px; margin: 0 auto; }
              pre { font-size: 14px; line-height: 1.4; }
              @media print { body { margin: 0; padding: 10px; } }
            </style>
          </head>
          <body>
            <pre>${receiptContent}</pre>
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `)
      printWindow.document.close()
      setReceiptPrinted(true)
    }
  }

  const handleSaveProgress = () => {
    const data = { cart, customer: selectedCustomer, timestamp: new Date() }
    onSave?.(data)
    setLastSaved(new Date())
    setHasChanges(false)
  }

  // ============================================================================
  // FILTERING AND SEARCH
  // ============================================================================

  const filteredItems = items.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <Banknote className="h-4 w-4" />
      case 'card':
        return <CreditCard className="h-4 w-4" />
      case 'apple_pay':
        return <Smartphone className="h-4 w-4" />
      case 'google_pay':
        return <Wallet className="h-4 w-4" />
      case 'venmo':
        return <QrCode className="h-4 w-4" />
      case 'gift_card':
        return <Gift className="h-4 w-4" />
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

  const getItemIcon = (item: POSItem) => {
    if (config.theme.icon) {
      return <config.theme.icon className="h-6 w-6 text-white drop-shadow-sm" />
    }
    return item.type === 'service' ? (
      <Star className="h-6 w-6 text-white drop-shadow-sm" />
    ) : (
      <ShoppingCart className="h-6 w-6 text-white drop-shadow-sm" />
    )
  }

  // ============================================================================
  // RENDER COMPONENT
  // ============================================================================

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search and Filters */}
      <Card className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Input
                placeholder={`Search ${config.businessType} items...`}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-white/60 backdrop-blur-sm border-white/30 text-slate-800 placeholder:text-slate-500 focus:bg-white/80 transition-all"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48 bg-white/60 backdrop-blur-sm border-white/30 text-slate-800 hover:bg-white/80 transition-all">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent className="hera-select-content">
                <SelectItem value="all" className="hera-select-item">
                  All Categories
                </SelectItem>
                {config.itemCategories.map(category => (
                  <SelectItem key={category} value={category} className="hera-select-item">
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map(item => (
              <Card
                key={item.id}
                className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 group cursor-pointer"
                onClick={() => addToCart(item)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="relative">
                        <div
                          className={`absolute inset-0 ${config.theme.primaryColor}/20 rounded-lg blur-md group-hover:blur-lg transition-all`}
                        ></div>
                        <div
                          className={`h-12 w-12 bg-gradient-to-br ${config.theme.primaryColor}/90 ${config.theme.secondaryColor}/90 rounded-lg flex items-center justify-center shadow-lg relative`}
                        >
                          {getItemIcon(item)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-slate-800">{item.name}</p>
                          <Badge
                            className={
                              item.type === 'service'
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : 'bg-green-100 text-green-800 border-green-200'
                            }
                          >
                            {item.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-2 font-medium">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          {item.type === 'service' ? (
                            <>
                              {item.duration && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {item.duration}min
                                </span>
                              )}
                              {item.provider && (
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3" />
                                  {item.provider}
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              {item.stock !== undefined && (
                                <span className="flex items-center gap-1">
                                  <ShoppingCart className="h-3 w-3" />
                                  Stock: {item.stock}
                                </span>
                              )}
                              {item.brand && <span className="text-slate-600">{item.brand}</span>}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-700">
                        {config.currency}
                        {item.price}
                      </p>
                      <Button size="sm" className={`${config.theme.accentColor} text-white mt-2`}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cart & Checkout */}
        <div className="space-y-6">
          {/* Cart */}
          <Card className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-slate-800">
                <div className={`p-2 ${config.theme.primaryColor}/20 rounded-lg`}>
                  <ShoppingCart
                    className={`h-6 w-6 ${config.theme.primaryColor.replace('bg-', 'text-')}`}
                  />
                </div>
                <span className="text-lg font-semibold">Current Sale ({cart.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 mx-auto text-slate-400 mb-3" />
                    <p className="text-slate-600 font-medium">Cart is empty</p>
                    <p className="text-sm text-slate-500">Add items to start</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-white/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
                        <p className="text-xs text-slate-600">
                          {config.currency}
                          {item.price} each
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={e => {
                            e.stopPropagation()
                            updateQuantity(item.id, item.quantity - 1)
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={e => {
                            e.stopPropagation()
                            updateQuantity(item.id, item.quantity + 1)
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={e => {
                            e.stopPropagation()
                            removeFromCart(item.id)
                          }}
                          className="h-6 w-6 p-0 ml-2"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Subtotal:</span>
                      <span className="font-medium text-slate-800">
                        {config.currency}
                        {getCartTotal().toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">
                        Tax ({(config.taxRate * 100).toFixed(1)}%):
                      </span>
                      <span className="font-medium text-slate-800">
                        {config.currency}
                        {getTax().toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-slate-800">Total:</span>
                      <span className="text-emerald-700">
                        {config.currency}
                        {getFinalTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment Section - Only show if cart has items */}
          {cart.length > 0 && (
            <Card className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-slate-800">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                      <CreditCard className="h-6 w-6 text-emerald-600" />
                    </div>
                    <span className="text-lg font-semibold">Payment</span>
                  </div>
                  {config.features.splitPayments && (
                    <Button
                      size="sm"
                      variant={splitPayment ? 'default' : 'outline'}
                      onClick={() => setSplitPayment(!splitPayment)}
                      className="text-xs"
                    >
                      <Split className="h-3 w-3 mr-1" />
                      Split Payment
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!splitPayment ? (
                  <div>
                    <Label className="text-slate-700 font-medium mb-2 block">Payment Method</Label>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {Object.entries(config.paymentMethods).map(([method, enabled]) =>
                        enabled ? (
                          <Button
                            key={method}
                            variant={paymentMethod === method ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPaymentMethod(method)}
                            className="justify-start"
                          >
                            {getPaymentIcon(method)}
                            <span className="ml-2 capitalize">{method.replace('_', ' ')}</span>
                          </Button>
                        ) : null
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-700 font-medium">Split Payment Methods</Label>
                      {getRemainingAmount() > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={autoCompletePayments}
                          className="text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Auto-Complete
                        </Button>
                      )}
                    </div>
                    {paymentMethods.map((pm, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Select
                          value={pm.method}
                          onValueChange={value => updatePaymentMethodType(index, value)}
                        >
                          <SelectTrigger className="w-32 bg-white/60 backdrop-blur-sm border-white/30">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="hera-select-content">
                            {Object.entries(config.paymentMethods).map(([method, enabled]) =>
                              enabled ? (
                                <SelectItem
                                  key={method}
                                  value={method}
                                  className="hera-select-item"
                                >
                                  <div className="flex items-center gap-2">
                                    {getPaymentIcon(method)}
                                    <span className="capitalize">{method.replace('_', ' ')}</span>
                                  </div>
                                </SelectItem>
                              ) : null
                            )}
                          </SelectContent>
                        </Select>
                        <div className="flex-1 relative">
                          <Input
                            type="number"
                            placeholder="Amount"
                            value={pm.amount || ''}
                            onChange={e => updatePaymentMethodAmount(index, e.target.value)}
                            className="bg-white/60 backdrop-blur-sm border-white/30 pr-10"
                          />
                          {getRemainingAmount() > 0 && pm.amount === 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => autoFillRemaining(index)}
                              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                              title={`Fill remaining ${config.currency}${getRemainingAmount().toFixed(2)}`}
                            >
                              <Calculator className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {paymentMethods.length > 1 && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removePaymentMethod(index)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={addPaymentMethod}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Payment Method
                    </Button>
                    {splitPayment && (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                          <span>Total Entered:</span>
                          <span
                            className={
                              getTotalPaymentAmount() === getFinalTotal()
                                ? 'text-green-600'
                                : 'text-red-600'
                            }
                          >
                            {config.currency}
                            {getTotalPaymentAmount().toFixed(2)} / {config.currency}
                            {getFinalTotal().toFixed(2)}
                          </span>
                        </div>
                        {getRemainingAmount() > 0 ? (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-orange-600 font-medium">Remaining:</span>
                            <span className="text-orange-600 font-bold">
                              {config.currency}
                              {getRemainingAmount().toFixed(2)}
                            </span>
                          </div>
                        ) : getRemainingAmount() < 0 ? (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-red-600 font-medium">Overpaid:</span>
                            <span className="text-red-600 font-bold">
                              {config.currency}
                              {Math.abs(getRemainingAmount()).toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center text-sm">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                            <span className="text-green-600 font-medium">Payment Complete</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={processPayment}
                    disabled={
                      splitPayment && Math.abs(getTotalPaymentAmount() - getFinalTotal()) > 0.01
                    }
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Receipt className="h-5 w-5 mr-2" />
                    {splitPayment
                      ? Math.abs(getTotalPaymentAmount() - getFinalTotal()) > 0.01
                        ? `Remaining: ${config.currency}${getRemainingAmount().toFixed(2)}`
                        : `Process Split Payment (${paymentMethods.length} methods)`
                      : `Process Payment (${config.currency}${getFinalTotal().toFixed(2)})`}
                  </Button>
                  {config.features.printing && lastTransaction && (
                    <Button onClick={printReceipt} variant="outline" className="px-4">
                      <Printer className="h-5 w-5" />
                    </Button>
                  )}
                </div>

                {lastTransaction && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          Last Transaction: #{lastTransaction.receiptNumber}
                        </span>
                      </div>
                      {receiptPrinted && (
                        <Badge className="bg-green-100 text-green-700">Receipt Printed</Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Progress Save for Demo Mode */}
      {demoMode && hasChanges && (
        <div className="fixed bottom-4 right-4">
          <Button
            onClick={handleSaveProgress}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-xl"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Progress
          </Button>
        </div>
      )}
    </div>
  )
}

export default UniversalPOS
