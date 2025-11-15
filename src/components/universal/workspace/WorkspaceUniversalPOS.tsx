'use client'

/**
 * Workspace Universal POS Component
 * Smart Code: HERA.WORKSPACE.COMPONENT.POS.v1
 * 
 * POS-specific integration with Universal Transaction system that automatically
 * configures point-of-sale workflows, payment processing, and receipt generation
 * based on workspace context.
 * 
 * Features:
 * - POS-specific transaction types with real-time processing
 * - Integrated payment split management (cash, card, digital)
 * - Automatic receipt generation and printing
 * - Real-time inventory updates and stock validation
 * - Customer management and loyalty integration
 * - Staff commission and performance tracking
 * - Mobile-first touch interface optimized for tablets
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Calculator,
  CreditCard,
  Banknote,
  Smartphone,
  Receipt,
  User,
  Search,
  Percent,
  Users,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  Star,
  Gift,
  Settings,
  Printer,
  Save,
  RefreshCw,
  Eye,
  Edit3,
  X,
  ArrowRight,
  DollarSign,
  UserPlus,
  Tag,
  Zap,
  TrendingUp
} from 'lucide-react'
import { WorkspaceUniversalTransactions } from './WorkspaceUniversalTransactions'
import { POSReceipt } from '@/components/salon/POSReceipt'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useWorkspaceContext, useWorkspacePermissions } from '@/lib/workspace/workspace-context'
import { cn } from '@/lib/utils'

interface POSLineItem {
  id: string
  product_id: string
  product_name: string
  product_type: 'product' | 'service'
  category: string
  unit_price: number
  quantity: number
  discount_amount: number
  discount_type: 'fixed' | 'percentage'
  line_total: number
  staff_id?: string
  staff_name?: string
  commission_rate?: number
  commission_amount?: number
  stock_available?: number
  requires_staff?: boolean
}

interface POSPaymentSplit {
  id: string
  method: 'cash' | 'card' | 'digital_wallet' | 'gift_card' | 'store_credit'
  amount: number
  reference?: string
  tip_amount?: number
}

interface POSCustomer {
  id: string
  name: string
  phone?: string
  email?: string
  loyalty_points?: number
  total_spent?: number
  visits_count?: number
  preferred_staff?: string
}

interface POSTransaction {
  id: string
  transaction_number: string
  date: string
  customer?: POSCustomer
  items: POSLineItem[]
  subtotal: number
  discount_amount: number
  tax_amount: number
  tip_amount: number
  total_amount: number
  payment_splits: POSPaymentSplit[]
  status: 'draft' | 'pending_payment' | 'paid' | 'completed' | 'voided'
  staff_id: string
  staff_name: string
  branch_id: string
  register_id: string
  notes?: string
  receipt_printed: boolean
}

interface WorkspaceUniversalPOSProps {
  // Configuration
  registerMode?: 'full' | 'express' | 'mobile'
  defaultView?: 'sale' | 'transactions' | 'products'
  
  // Features
  enableQuickSale?: boolean
  enableCustomerLookup?: boolean
  enableStaffCommissions?: boolean
  enableInventoryTracking?: boolean
  enableLoyaltyProgram?: boolean
  
  // Callbacks
  onTransactionComplete?: (transaction: POSTransaction) => Promise<void>
  onReceiptPrint?: (transaction: POSTransaction) => Promise<void>
  onStockUpdate?: (productId: string, quantity: number) => Promise<void>
  
  // UI
  className?: string
}

// Sample data for demonstration
const sampleProducts = [
  {
    id: 'prod_001',
    name: 'Haircut & Styling',
    type: 'service' as const,
    category: 'Hair Services',
    price: 150.00,
    commission_rate: 0.15,
    requires_staff: true,
    duration_minutes: 60
  },
  {
    id: 'prod_002',
    name: 'Hair Color Treatment',
    type: 'service' as const,
    category: 'Color Services',
    price: 300.00,
    commission_rate: 0.20,
    requires_staff: true,
    duration_minutes: 120
  },
  {
    id: 'prod_003',
    name: 'Premium Hair Oil',
    type: 'product' as const,
    category: 'Hair Care',
    price: 75.00,
    stock_available: 25,
    commission_rate: 0.10
  },
  {
    id: 'prod_004',
    name: 'Shampoo & Conditioner Set',
    type: 'product' as const,
    category: 'Hair Care',
    price: 120.00,
    stock_available: 15,
    commission_rate: 0.08
  }
]

const sampleStaff = [
  { id: 'staff_001', name: 'Ahmed Al-Rashid', specialties: ['Hair Cut', 'Styling'] },
  { id: 'staff_002', name: 'Fatima Hassan', specialties: ['Color', 'Treatment'] },
  { id: 'staff_003', name: 'Omar Khalil', specialties: ['Hair Cut', 'Beard'] }
]

export function WorkspaceUniversalPOS({
  registerMode = 'full',
  defaultView = 'sale',
  enableQuickSale = true,
  enableCustomerLookup = true,
  enableStaffCommissions = true,
  enableInventoryTracking = true,
  enableLoyaltyProgram = false,
  onTransactionComplete,
  onReceiptPrint,
  onStockUpdate,
  className = ''
}: WorkspaceUniversalPOSProps) {
  const router = useRouter()
  const workspace = useWorkspaceContext()
  const permissions = useWorkspacePermissions()
  const receiptRef = useRef<HTMLDivElement>(null)
  
  // State
  const [currentView, setCurrentView] = useState(defaultView)
  const [currentTransaction, setCurrentTransaction] = useState<POSTransaction | null>(null)
  const [lineItems, setLineItems] = useState<POSLineItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<POSCustomer | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<string>('')
  const [paymentSplits, setPaymentSplits] = useState<POSPaymentSplit[]>([])
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [discountAmount, setDiscountAmount] = useState(0)
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed')
  const [tipAmount, setTipAmount] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recentTransactions, setRecentTransactions] = useState<POSTransaction[]>([])

  // Calculations
  const subtotal = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + item.line_total, 0)
  }, [lineItems])

  const transactionDiscount = useMemo(() => {
    if (discountType === 'percentage') {
      return (subtotal * discountAmount) / 100
    }
    return discountAmount
  }, [subtotal, discountAmount, discountType])

  const taxAmount = useMemo(() => {
    const taxableAmount = subtotal - transactionDiscount
    return taxableAmount * 0.05 // 5% VAT
  }, [subtotal, transactionDiscount])

  const totalAmount = useMemo(() => {
    return subtotal - transactionDiscount + taxAmount + tipAmount
  }, [subtotal, transactionDiscount, taxAmount, tipAmount])

  const totalPaid = useMemo(() => {
    return paymentSplits.reduce((sum, split) => sum + split.amount + (split.tip_amount || 0), 0)
  }, [paymentSplits])

  const balanceDue = useMemo(() => {
    return totalAmount - totalPaid
  }, [totalAmount, totalPaid])

  // POS Actions
  const addLineItem = useCallback((product: typeof sampleProducts[0]) => {
    const existingItem = lineItems.find(item => item.product_id === product.id)
    
    if (existingItem && product.type === 'product') {
      // Increase quantity for products
      setLineItems(prev => prev.map(item => 
        item.id === existingItem.id 
          ? {
              ...item,
              quantity: item.quantity + 1,
              line_total: (item.quantity + 1) * item.unit_price - item.discount_amount
            }
          : item
      ))
    } else {
      // Add new line item
      const newItem: POSLineItem = {
        id: `line_${Date.now()}`,
        product_id: product.id,
        product_name: product.name,
        product_type: product.type,
        category: product.category,
        unit_price: product.price,
        quantity: 1,
        discount_amount: 0,
        discount_type: 'fixed',
        line_total: product.price,
        staff_id: product.requires_staff ? selectedStaff : undefined,
        staff_name: product.requires_staff ? sampleStaff.find(s => s.id === selectedStaff)?.name : undefined,
        commission_rate: product.commission_rate,
        commission_amount: product.price * (product.commission_rate || 0),
        stock_available: product.stock_available,
        requires_staff: product.requires_staff
      }
      setLineItems(prev => [...prev, newItem])
    }
  }, [lineItems, selectedStaff])

  const updateLineItemQuantity = useCallback((lineId: string, quantity: number) => {
    if (quantity <= 0) {
      setLineItems(prev => prev.filter(item => item.id !== lineId))
      return
    }

    setLineItems(prev => prev.map(item => 
      item.id === lineId 
        ? {
            ...item,
            quantity,
            line_total: quantity * item.unit_price - item.discount_amount,
            commission_amount: (quantity * item.unit_price - item.discount_amount) * (item.commission_rate || 0)
          }
        : item
    ))
  }, [])

  const applyLineDiscount = useCallback((lineId: string, discountAmount: number, discountType: 'fixed' | 'percentage') => {
    setLineItems(prev => prev.map(item => {
      if (item.id !== lineId) return item

      const lineSubtotal = item.quantity * item.unit_price
      const calculatedDiscount = discountType === 'percentage' 
        ? (lineSubtotal * discountAmount) / 100
        : discountAmount

      return {
        ...item,
        discount_amount: calculatedDiscount,
        discount_type: discountType,
        line_total: lineSubtotal - calculatedDiscount,
        commission_amount: (lineSubtotal - calculatedDiscount) * (item.commission_rate || 0)
      }
    }))
  }, [])

  const addPaymentSplit = useCallback((method: POSPaymentSplit['method'], amount: number, tipAmount: number = 0) => {
    const newSplit: POSPaymentSplit = {
      id: `payment_${Date.now()}`,
      method,
      amount,
      tip_amount: tipAmount
    }
    setPaymentSplits(prev => [...prev, newSplit])
  }, [])

  const processTransaction = useCallback(async () => {
    if (balanceDue > 0.01) {
      alert('Payment incomplete. Please add more payment methods.')
      return
    }

    setIsProcessing(true)
    try {
      const transactionNumber = `POS-${Date.now()}`
      
      const transaction: POSTransaction = {
        id: `txn_${Date.now()}`,
        transaction_number: transactionNumber,
        date: new Date().toISOString(),
        customer: selectedCustomer,
        items: lineItems,
        subtotal,
        discount_amount: transactionDiscount,
        tax_amount: taxAmount,
        tip_amount: tipAmount,
        total_amount: totalAmount,
        payment_splits: paymentSplits,
        status: 'completed',
        staff_id: selectedStaff || 'pos_user',
        staff_name: sampleStaff.find(s => s.id === selectedStaff)?.name || 'POS User',
        branch_id: workspace.organization_id,
        register_id: 'register_001',
        receipt_printed: false
      }

      // Save transaction via Universal Transaction system
      if (onTransactionComplete) {
        await onTransactionComplete(transaction)
      }

      // Update inventory for products
      if (enableInventoryTracking && onStockUpdate) {
        for (const item of lineItems) {
          if (item.product_type === 'product') {
            await onStockUpdate(item.product_id, -item.quantity)
          }
        }
      }

      setCurrentTransaction(transaction)
      setRecentTransactions(prev => [transaction, ...prev.slice(0, 9)])
      setShowReceiptModal(true)
      
      // Clear current transaction
      clearTransaction()
      
    } catch (error) {
      console.error('Failed to process transaction:', error)
      alert('Failed to process transaction. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }, [lineItems, selectedCustomer, selectedStaff, subtotal, transactionDiscount, taxAmount, tipAmount, totalAmount, paymentSplits, balanceDue, workspace.organization_id, onTransactionComplete, enableInventoryTracking, onStockUpdate])

  const clearTransaction = useCallback(() => {
    setLineItems([])
    setSelectedCustomer(null)
    setPaymentSplits([])
    setDiscountAmount(0)
    setTipAmount(0)
    setSearchQuery('')
  }, [])

  const printReceipt = useCallback(async () => {
    if (currentTransaction && onReceiptPrint) {
      try {
        await onReceiptPrint(currentTransaction)
        setCurrentTransaction(prev => prev ? { ...prev, receipt_printed: true } : null)
      } catch (error) {
        console.error('Failed to print receipt:', error)
      }
    }
  }, [currentTransaction, onReceiptPrint])

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return sampleProducts
    
    return sampleProducts.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery])

  // Render product grid
  const renderProductGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {filteredProducts.map((product) => (
        <Card 
          key={product.id}
          className="cursor-pointer hover:shadow-lg transition-all duration-200 active:scale-95"
          onClick={() => addLineItem(product)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Badge variant={product.type === 'service' ? 'default' : 'secondary'}>
                {product.type}
              </Badge>
              {product.type === 'product' && product.stock_available !== undefined && (
                <Badge variant={product.stock_available > 10 ? 'outline' : 'destructive'}>
                  {product.stock_available} left
                </Badge>
              )}
            </div>
            <h3 className="font-medium text-sm mb-2">{product.name}</h3>
            <p className="text-xs text-muted-foreground mb-3">{product.category}</p>
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg">AED {product.price.toFixed(2)}</span>
              <Plus className="w-5 h-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  // Render cart
  const renderCart = () => (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Current Order</span>
          {lineItems.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearTransaction}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Customer Selection */}
          <div>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setShowCustomerModal(true)}
            >
              <User className="w-4 h-4 mr-2" />
              {selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}
            </Button>
          </div>

          {/* Staff Selection */}
          {enableStaffCommissions && (
            <div>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Staff Member" />
                </SelectTrigger>
                <SelectContent>
                  {sampleStaff.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Line Items */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {lineItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{item.product_name}</h4>
                  <p className="text-xs text-muted-foreground">
                    AED {item.unit_price.toFixed(2)} × {item.quantity}
                  </p>
                  {item.staff_name && (
                    <p className="text-xs text-blue-600">Staff: {item.staff_name}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateLineItemQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="px-2 text-sm">{item.quantity}</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateLineItemQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-medium text-sm">AED {item.line_total.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {lineItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No items in cart</p>
            </div>
          )}

          {/* Order Summary */}
          {lineItems.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>AED {subtotal.toFixed(2)}</span>
              </div>
              
              {transactionDiscount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount</span>
                  <span>-AED {transactionDiscount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span>VAT (5%)</span>
                <span>AED {taxAmount.toFixed(2)}</span>
              </div>
              
              {tipAmount > 0 && (
                <div className="flex justify-between">
                  <span>Tip</span>
                  <span>AED {tipAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span>AED {totalAmount.toFixed(2)}</span>
              </div>

              {/* Payment Status */}
              {paymentSplits.length > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-green-600">
                    <span>Paid</span>
                    <span>AED {totalPaid.toFixed(2)}</span>
                  </div>
                  <div className={`flex justify-between ${balanceDue > 0.01 ? 'text-red-600' : 'text-green-600'}`}>
                    <span>{balanceDue > 0.01 ? 'Balance Due' : 'Change'}</span>
                    <span>AED {Math.abs(balanceDue).toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button 
                  className="w-full"
                  size="lg"
                  onClick={() => setShowPaymentModal(true)}
                  disabled={isProcessing}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {paymentSplits.length > 0 ? 'Add Payment' : 'Pay Now'}
                </Button>
                
                {paymentSplits.length > 0 && (
                  <Button 
                    className="w-full"
                    variant="default"
                    onClick={processTransaction}
                    disabled={isProcessing || balanceDue > 0.01}
                  >
                    {isProcessing ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Complete Transaction
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  // Main POS interface
  if (currentView === 'sale') {
    return (
      <div className={cn("h-full", className)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Products */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search products and services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button 
                variant="outline"
                onClick={() => setCurrentView('transactions')}
              >
                <Clock className="w-4 h-4 mr-2" />
                Recent
              </Button>
            </div>
            
            {renderProductGrid()}
          </div>

          {/* Cart */}
          <div className="lg:col-span-1">
            {renderCart()}
          </div>
        </div>

        {/* Payment Modal */}
        <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Payment</DialogTitle>
              <DialogDescription>
                Total amount: AED {totalAmount.toFixed(2)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline"
                  className="h-16"
                  onClick={() => {
                    addPaymentSplit('cash', balanceDue)
                    setShowPaymentModal(false)
                  }}
                >
                  <Banknote className="w-6 h-6 mr-2" />
                  Cash
                </Button>
                <Button 
                  variant="outline"
                  className="h-16"
                  onClick={() => {
                    addPaymentSplit('card', balanceDue)
                    setShowPaymentModal(false)
                  }}
                >
                  <CreditCard className="w-6 h-6 mr-2" />
                  Card
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline"
                  className="h-16"
                  onClick={() => {
                    addPaymentSplit('digital_wallet', balanceDue)
                    setShowPaymentModal(false)
                  }}
                >
                  <Smartphone className="w-6 h-6 mr-2" />
                  Digital
                </Button>
                <Button 
                  variant="outline"
                  className="h-16"
                  onClick={() => {
                    addPaymentSplit('gift_card', balanceDue)
                    setShowPaymentModal(false)
                  }}
                >
                  <Gift className="w-6 h-6 mr-2" />
                  Gift Card
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Receipt Modal */}
        <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Transaction Complete</DialogTitle>
            </DialogHeader>
            
            {currentTransaction && (
              <div className="space-y-4">
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-2" />
                  <p className="text-lg font-medium">Payment Successful</p>
                  <p className="text-sm text-muted-foreground">
                    Transaction #{currentTransaction.transaction_number}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={printReceipt}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print Receipt
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setShowReceiptModal(false)}>
                    Continue
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Recent Transactions View
  if (currentView === 'transactions') {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Recent Transactions</h2>
          <Button onClick={() => setCurrentView('sale')}>
            <ArrowRight className="w-4 h-4 mr-2" />
            Back to POS
          </Button>
        </div>
        
        <WorkspaceUniversalTransactions
          showQuickActions={false}
          showAnalytics={true}
          defaultView="list"
        />
      </div>
    )
  }

  return null
}

export default WorkspaceUniversalPOS