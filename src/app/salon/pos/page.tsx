'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { useOrganizationCurrency } from '@/hooks/use-organization-currency'
import { 
  ShoppingCart, Search, Plus, Minus, X, CreditCard, 
  Banknote, Smartphone, Receipt, User, Calendar,
  Package, Scissors, Percent, CheckCircle, Printer,
  Calculator, Split, Gift, Clock, Star
} from 'lucide-react'

// VAT rate for Dubai
const VAT_RATE = 0.05 // 5%

// Payment method configurations
const PAYMENT_METHODS = [
  { id: 'cash', name: 'Cash', icon: Banknote, color: 'bg-green-500' },
  { id: 'card', name: 'Credit/Debit Card', icon: CreditCard, color: 'bg-blue-500' },
  { id: 'apple_pay', name: 'Apple Pay', icon: Smartphone, color: 'bg-gray-800' },
  { id: 'google_pay', name: 'Google Pay', icon: Smartphone, color: 'bg-blue-600' },
  { id: 'bank_transfer', name: 'Bank Transfer', icon: Banknote, color: 'bg-purple-500' },
  { id: 'gift_card', name: 'Gift Card', icon: Gift, color: 'bg-pink-500' }
]

interface CartItem {
  id: string
  name: string
  type: 'service' | 'product'
  price: number
  quantity: number
  staff?: string
  duration?: number
  vat: number
  discount: number
  discountType: 'percentage' | 'amount'
}

interface PaymentSplit {
  method: string
  amount: number
  reference?: string
}

// Default organization ID for development
const DEFAULT_ORG_ID = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'

export default function SalonPOSPage() {
  const { currentOrganization } = useMultiOrgAuth()
  const { currencyCode, format: formatCurrency } = useOrganizationCurrency()
  const { toast } = useToast()
  const organizationId = currentOrganization?.id || DEFAULT_ORG_ID

  // State
  const [activeTab, setActiveTab] = useState('services')
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showSplitPayment, setShowSplitPayment] = useState(false)
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplit[]>([])
  const [processingPayment, setProcessingPayment] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Data from API
  const [services, setServices] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])

  // Load data on mount
  useEffect(() => {
    if (organizationId) {
      loadPOSData()
    }
  }, [organizationId])

  const loadPOSData = async () => {
    if (!organizationId) return

    try {
      setLoading(true)

      // Load services
      const servicesResponse = await fetch(`/api/v1/salon/services?organization_id=${organizationId}`)
      if (servicesResponse.ok) {
        const data = await servicesResponse.json()
        setServices(data.services || [])
      }

      // Load products
      const productsResponse = await fetch(`/api/v1/salon/products?organization_id=${organizationId}`)
      if (productsResponse.ok) {
        const data = await productsResponse.json()
        setProducts(data.products || [])
      }

      // Load customers
      const customersResponse = await fetch(`/api/v1/salon/clients?organization_id=${organizationId}`)
      if (customersResponse.ok) {
        const data = await customersResponse.json()
        setCustomers(data.clients || [])
      }

      // Load categories
      const categoriesResponse = await fetch(`/api/v1/salon/categories?organization_id=${organizationId}`)
      if (categoriesResponse.ok) {
        const data = await categoriesResponse.json()
        setCategories(data.categories || [])
      }

      // Load staff
      const staffResponse = await fetch(`/api/v1/salon/staff?organization_id=${organizationId}`)
      if (staffResponse.ok) {
        const data = await staffResponse.json()
        setStaff(data.staff || [])
      }

    } catch (error) {
      console.error('Error loading POS data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Add to cart
  const addToCart = (item: any, type: 'service' | 'product') => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id && cartItem.type === type)
    
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id && cartItem.type === type
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ))
    } else {
      // Get price based on type
      const price = type === 'service' ? (item.price || 0) : (item.price || 0)
      
      const newItem: CartItem = {
        id: item.id,
        name: item.entity_name,
        type,
        price: price,
        quantity: 1,
        vat: price * VAT_RATE,
        discount: 0,
        discountType: 'percentage',
        ...(type === 'service' && { 
          duration: item.duration || 30,
          staff: staff.length > 0 ? staff[0].entity_name : 'Any Staff'
        })
      }
      setCart([...cart, newItem])
    }
    
    toast({
      title: 'Added to cart',
      description: `${item.entity_name} added to cart`
    })
  }

  // Update cart item
  const updateCartItem = (id: string, updates: Partial<CartItem>) => {
    setCart(cart.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ))
  }

  // Remove from cart
  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id))
  }

  // Calculate totals
  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity
      const discountAmount = item.discountType === 'percentage' 
        ? itemTotal * (item.discount / 100)
        : item.discount
      return sum + (itemTotal - discountAmount)
    }, 0)
  }

  const calculateVAT = () => {
    return calculateSubtotal() * VAT_RATE
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateVAT()
  }

  // Apply customer discount based on tier
  const applyCustomerDiscount = () => {
    if (!selectedCustomer) return

    const tierDiscounts: Record<string, number> = {
      'Platinum': 15,
      'Gold': 10,
      'Silver': 5,
      'Bronze': 0
    }

    const customerTier = selectedCustomer.loyalty_tier || 'Bronze'
    const discount = tierDiscounts[customerTier] || 0
    
    if (discount > 0) {
      setCart(cart.map(item => ({
        ...item,
        discount: discount,
        discountType: 'percentage'
      })))
      
      toast({
        title: 'Discount Applied',
        description: `${discount}% ${customerTier} member discount applied`
      })
    }
  }

  // Initialize payment splits
  const initializePayment = () => {
    const total = calculateTotal()
    setPaymentSplits([{ method: 'cash', amount: total }])
    setShowPaymentDialog(true)
  }

  // Add payment split
  const addPaymentSplit = () => {
    setPaymentSplits([...paymentSplits, { method: 'cash', amount: 0 }])
  }

  // Update payment split
  const updatePaymentSplit = (index: number, updates: Partial<PaymentSplit>) => {
    const newSplits = [...paymentSplits]
    newSplits[index] = { ...newSplits[index], ...updates }
    setPaymentSplits(newSplits)
  }

  // Remove payment split
  const removePaymentSplit = (index: number) => {
    if (paymentSplits.length > 1) {
      setPaymentSplits(paymentSplits.filter((_, i) => i !== index))
    }
  }

  // Calculate remaining amount
  const calculateRemaining = () => {
    const total = calculateTotal()
    const paid = paymentSplits.reduce((sum, split) => sum + (split.amount || 0), 0)
    return total - paid
  }

  // Process payment
  const processPayment = async () => {
    const remaining = calculateRemaining()
    if (remaining > 0.01) {
      toast({
        title: 'Payment Incomplete',
        description: `Remaining amount: ${formatCurrency(remaining)}`,
        variant: 'destructive'
      })
      return
    }

    if (!organizationId) {
      toast({
        title: 'Error',
        description: 'Organization not found',
        variant: 'destructive'
      })
      return
    }

    setProcessingPayment(true)
    
    try {
      // Calculate totals
      const subtotal = calculateSubtotal()
      const vatAmount = calculateVAT()
      const totalAmount = calculateTotal()
      
      // Calculate discount amount
      const discountAmount = cart.reduce((sum, item) => {
        const itemTotal = item.price * item.quantity
        const itemDiscount = item.discountType === 'percentage' 
          ? itemTotal * (item.discount / 100)
          : item.discount
        return sum + itemDiscount
      }, 0)

      // Prepare cart items with calculated amounts
      const itemsWithAmounts = cart.map(item => ({
        ...item,
        discountAmount: item.discountType === 'percentage' 
          ? (item.price * item.quantity) * (item.discount / 100)
          : item.discount,
        vatAmount: (item.price * item.quantity - (item.discountType === 'percentage' 
          ? (item.price * item.quantity) * (item.discount / 100)
          : item.discount)) * VAT_RATE
      }))

      // Call POS API to create transaction
      const response = await fetch('/api/v1/salon/pos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organizationId,
          customerId: selectedCustomer?.id || null,
          items: itemsWithAmounts,
          paymentSplits,
          subtotal,
          vatAmount,
          totalAmount,
          discountAmount,
          currencyCode: currencyCode || 'AED' // Support for multi-currency
        })
      })

      if (!response.ok) {
        throw new Error('Failed to process payment')
      }

      const result = await response.json()
      
      toast({
        title: 'Payment Successful',
        description: `Transaction #${result.transaction.transaction_code} completed`
      })
      
      // Print receipt with actual transaction data
      if (result.receipt) {
        printReceipt(result.receipt)
      }
      
      // Reset
      setCart([])
      setSelectedCustomer(null)
      setPaymentSplits([])
      setShowPaymentDialog(false)
      setShowSplitPayment(false)
      
    } catch (error) {
      console.error('Payment error:', error)
      toast({
        title: 'Payment Failed',
        description: 'Failed to process payment. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setProcessingPayment(false)
    }
  }

  // Print receipt
  const printReceipt = (receiptData?: any) => {
    // In real implementation, this would send to printer
    console.log('Printing receipt...', receiptData)
    
    // Could also open a print dialog with the receipt component
    // window.print() or use a receipt printer API
  }

  // Filter items based on search
  const filteredServices = services.filter(service =>
    service.entity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (service.category && service.category.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredProducts = products.filter(product =>
    product.entity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.brand && product.brand.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Panel - Products/Services */}
      <div className="flex-1 p-6 overflow-auto">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search services or products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-600 dark:placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Scissors className="h-4 w-4" />
              Services
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
          </TabsList>

          {/* Services Grid */}
          <TabsContent value="services">
            {loading ? (
              <div className="text-center py-8 text-gray-700 dark:text-gray-400">Loading services...</div>
            ) : filteredServices.length === 0 ? (
              <div className="text-center py-8 text-gray-700 dark:text-gray-400">
                {searchQuery ? 'No services found' : 'No services available'}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredServices.map((service) => {
                  const categoryName = service.category || 'General'
                  const categoryColor = categories.find(c => c.entity_code === service.category)?.color || '#EC4899'
                  
                  return (
                    <Card 
                      key={service.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => addToCart(service, 'service')}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">{service.entity_name}</CardTitle>
                        <Badge 
                          variant="secondary" 
                          className="w-fit"
                          style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
                        >
                          {categoryName}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-pink-600">
                          {formatCurrency(service.price || 0)}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-400 mt-1">
                          <Clock className="inline h-3 w-3 mr-1" />
                          {service.duration || 30} min
                        </p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Products Grid */}
          <TabsContent value="products">
            {loading ? (
              <div className="text-center py-8 text-gray-700 dark:text-gray-400">Loading products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-700 dark:text-gray-400">
                {searchQuery ? 'No products found' : 'No products available'}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <Card 
                    key={product.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => addToCart(product, 'product')}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">{product.entity_name}</CardTitle>
                      {product.brand && (
                        <Badge variant="outline" className="w-fit">
                          {product.brand}
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatCurrency(product.price || 0)}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-400 mt-1">
                        Stock: {product.current_stock || 0}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Right Panel - Cart */}
      <div className="w-[450px] bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Customer Selection */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Label>Customer</Label>
          <Select 
            value={selectedCustomer?.id || 'walk-in'} 
            onValueChange={(value) => {
              if (value === 'walk-in') {
                setSelectedCustomer(null)
              } else {
                const customer = customers.find(c => c.id === value)
                setSelectedCustomer(customer)
                if (customer) {
                  applyCustomerDiscount()
                }
              }
            }}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Walk-in Customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="walk-in">Walk-in Customer</SelectItem>
              {customers.map(customer => (
                <SelectItem key={customer.id} value={customer.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{customer.entity_name}</span>
                    {customer.loyalty_tier && (
                      <Badge 
                        variant="secondary" 
                        className={`ml-2 ${
                          customer.loyalty_tier === 'Platinum' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200' :
                          customer.loyalty_tier === 'Gold' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' :
                          customer.loyalty_tier === 'Silver' ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200' :
                          'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200'
                        }`}
                      >
                        {customer.loyalty_tier}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCustomer && (
            <div className="mt-2 text-sm text-gray-700 dark:text-gray-400">
              <p>{selectedCustomer.phone || selectedCustomer.mobile_number || 'No phone'}</p>
              <p className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                {selectedCustomer.visit_count || 0} visits
              </p>
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center mt-16">
              <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Your cart is empty</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Add services or products to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <Card key={`${item.type}-${item.id}`} className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-base">{item.name}</h4>
                      {item.type === 'service' ? (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                            <User className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                            <span className="font-medium text-gray-800 dark:text-gray-200">Staff:</span>
                            <span className="ml-1 text-gray-900 dark:text-gray-100">{item.staff || 'Any Staff'}</span>
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                            <span className="font-medium text-gray-800 dark:text-gray-200">Duration:</span>
                            <span className="ml-1 text-gray-900 dark:text-gray-100">{item.duration || 30} minutes</span>
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center mt-1">
                          <Package className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                          <span>Product</span>
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFromCart(item.id)}
                      className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    >
                      <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {/* Quantity and Price */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCartItem(item.id, { 
                            quantity: Math.max(1, item.quantity - 1) 
                          })}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-12 text-center font-medium text-gray-900 dark:text-gray-100">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCartItem(item.id, { 
                            quantity: item.quantity + 1 
                          })}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>

                    {/* Discount */}
                    {item.discount > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-700 dark:text-green-400">
                          <Percent className="inline h-3 w-3 mr-1" />
                          Discount
                        </span>
                        <span className="text-green-700 dark:text-green-400">
                          -{item.discountType === 'percentage' 
                            ? `${item.discount}%` 
                            : formatCurrency(item.discount)}
                        </span>
                      </div>
                    )}

                    {/* Staff Selection for Services */}
                    {item.type === 'service' && staff.length > 0 && (
                      <div className="mt-2">
                        <Label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Assign Staff</Label>
                        <Select
                          value={item.staff || staff[0].entity_name}
                          onValueChange={(value) => updateCartItem(item.id, { staff: value })}
                        >
                          <SelectTrigger className="h-9 text-sm font-medium">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {staff.map(s => (
                              <SelectItem key={s.id} value={s.entity_name}>
                                {s.entity_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
              <span className="text-gray-700 dark:text-gray-300">{formatCurrency(calculateSubtotal())}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">VAT (5%)</span>
              <span className="text-gray-700 dark:text-gray-300">{formatCurrency(calculateVAT())}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-gray-100">
              <span>Total</span>
              <span className="text-pink-600 dark:text-pink-500">{formatCurrency(calculateTotal())}</span>
            </div>
          </div>

          <Button
            className="w-full mt-4 h-12 text-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            disabled={cart.length === 0}
            onClick={initializePayment}
          >
            <CreditCard className="mr-2 h-5 w-5" />
            Proceed to Payment
          </Button>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Total Due */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900 dark:text-gray-100">Total Due</span>
                <span className="text-2xl font-bold text-pink-600 dark:text-pink-500">
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
            </div>

            {/* Payment Methods */}
            {!showSplitPayment ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {PAYMENT_METHODS.map((method) => (
                    <Button
                      key={method.id}
                      variant="outline"
                      className="h-20 flex flex-col gap-2"
                      onClick={() => {
                        setPaymentSplits([{ 
                          method: method.id, 
                          amount: calculateTotal() 
                        }])
                        if (method.id === 'cash') {
                          processPayment()
                        } else {
                          // Show reference input for other methods
                          setShowSplitPayment(true)
                        }
                      }}
                    >
                      <method.icon className="h-6 w-6" />
                      <span className="text-sm">{method.name}</span>
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowSplitPayment(true)}
                >
                  <Split className="mr-2 h-4 w-4" />
                  Split Payment
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Payment Splits */}
                {paymentSplits.map((split, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Select
                        value={split.method}
                        onValueChange={(value) => updatePaymentSplit(index, { method: value })}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS.map(method => (
                            <SelectItem key={method.id} value={method.id}>
                              <div className="flex items-center gap-2">
                                <method.icon className="h-4 w-4" />
                                {method.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {paymentSplits.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removePaymentSplit(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          value={split.amount || ''}
                          onChange={(e) => updatePaymentSplit(index, { 
                            amount: parseFloat(e.target.value) || 0 
                          })}
                          className="mt-1"
                        />
                      </div>

                      {split.method !== 'cash' && (
                        <div>
                          <Label>Reference</Label>
                          <Input
                            value={split.reference || ''}
                            onChange={(e) => updatePaymentSplit(index, { 
                              reference: e.target.value 
                            })}
                            placeholder="Transaction ID"
                            className="mt-1"
                          />
                        </div>
                      )}
                    </div>
                  </Card>
                ))}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={addPaymentSplit}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Payment Method
                </Button>

                {/* Remaining Amount */}
                {calculateRemaining() > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    <div className="flex justify-between items-center text-red-600 dark:text-red-400">
                      <span>Remaining</span>
                      <span className="font-bold">
                        {formatCurrency(calculateRemaining())}
                      </span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowSplitPayment(false)}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600"
                    onClick={processPayment}
                    disabled={calculateRemaining() > 0.01 || processingPayment}
                  >
                    {processingPayment ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Complete Payment
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}