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

export default function SalonPOSPage() {
  const { currentOrganization } = useMultiOrgAuth()
  const { currencyCode, format: formatCurrency } = useOrganizationCurrency()
  const { toast } = useToast()
  const organizationId = currentOrganization?.id

  // State
  const [activeTab, setActiveTab] = useState('services')
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showSplitPayment, setShowSplitPayment] = useState(false)
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplit[]>([])
  const [processingPayment, setProcessingPayment] = useState(false)
  
  // Sample data
  const [services, setServices] = useState([
    { id: '1', name: 'Hair Cut & Style', price: 150, duration: 45, category: 'Hair', staff: ['Emma', 'Lisa'] },
    { id: '2', name: 'Hair Color', price: 350, duration: 120, category: 'Hair', staff: ['Emma'] },
    { id: '3', name: 'Manicure', price: 80, duration: 30, category: 'Nails', staff: ['Lisa', 'Nina'] },
    { id: '4', name: 'Pedicure', price: 100, duration: 45, category: 'Nails', staff: ['Lisa', 'Nina'] },
    { id: '5', name: 'Facial Treatment', price: 250, duration: 60, category: 'Skin', staff: ['Nina'] },
    { id: '6', name: 'Full Body Massage', price: 400, duration: 90, category: 'Spa', staff: ['Sarah'] },
  ])

  const [products, setProducts] = useState([
    { id: 'p1', name: 'Shampoo Professional', price: 120, brand: 'L\'Oreal', stock: 15 },
    { id: 'p2', name: 'Hair Serum', price: 180, brand: 'Kerastase', stock: 8 },
    { id: 'p3', name: 'Nail Polish', price: 45, brand: 'OPI', stock: 25 },
    { id: 'p4', name: 'Face Cream', price: 220, brand: 'Clinique', stock: 10 },
    { id: 'p5', name: 'Hair Mask', price: 150, brand: 'Olaplex', stock: 12 },
    { id: 'p6', name: 'Perfume', price: 450, brand: 'Chanel', stock: 5 },
  ])

  const [customers, setCustomers] = useState([
    { id: 'c1', name: 'Sarah Johnson', phone: '+971 50 123 4567', visits: 12, tier: 'Gold' },
    { id: 'c2', name: 'Fatima Al Rashid', phone: '+971 55 234 5678', visits: 8, tier: 'Silver' },
    { id: 'c3', name: 'Maya Patel', phone: '+971 56 345 6789', visits: 15, tier: 'Platinum' },
    { id: 'c4', name: 'Aisha Khan', phone: '+971 52 456 7890', visits: 5, tier: 'Bronze' },
  ])

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
      const newItem: CartItem = {
        id: item.id,
        name: item.name,
        type,
        price: item.price,
        quantity: 1,
        vat: item.price * VAT_RATE,
        discount: 0,
        discountType: 'percentage',
        ...(type === 'service' && { duration: item.duration, staff: item.staff[0] })
      }
      setCart([...cart, newItem])
    }
    
    toast({
      title: 'Added to cart',
      description: `${item.name} added to cart`
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

    const discount = tierDiscounts[selectedCustomer.tier] || 0
    if (discount > 0) {
      setCart(cart.map(item => ({
        ...item,
        discount: discount,
        discountType: 'percentage'
      })))
      
      toast({
        title: 'Discount Applied',
        description: `${discount}% ${selectedCustomer.tier} member discount applied`
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

    setProcessingPayment(true)
    
    // Simulate payment processing
    setTimeout(() => {
      toast({
        title: 'Payment Successful',
        description: 'Transaction completed successfully'
      })
      
      // Reset
      setCart([])
      setSelectedCustomer(null)
      setPaymentSplits([])
      setShowPaymentDialog(false)
      setShowSplitPayment(false)
      setProcessingPayment(false)
      
      // Print receipt
      printReceipt()
    }, 2000)
  }

  // Print receipt
  const printReceipt = () => {
    // In real implementation, this would send to printer
    console.log('Printing receipt...')
  }

  // Filter items based on search
  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Panel - Products/Services */}
      <div className="flex-1 p-6 overflow-auto">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search services or products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg"
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
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredServices.map((service) => (
                <Card 
                  key={service.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => addToCart(service, 'service')}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">{service.name}</CardTitle>
                    <Badge variant="secondary" className="w-fit">
                      {service.category}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-pink-600">
                      {formatCurrency(service.price)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      <Clock className="inline h-3 w-3 mr-1" />
                      {service.duration} min
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Products Grid */}
          <TabsContent value="products">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <Card 
                  key={product.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => addToCart(product, 'product')}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">{product.name}</CardTitle>
                    <Badge variant="outline" className="w-fit">
                      {product.brand}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(product.price)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Stock: {product.stock}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Right Panel - Cart */}
      <div className="w-[450px] bg-white border-l flex flex-col">
        {/* Customer Selection */}
        <div className="p-4 border-b">
          <Label>Customer</Label>
          <Select 
            value={selectedCustomer?.id || ''} 
            onValueChange={(value) => {
              const customer = customers.find(c => c.id === value)
              setSelectedCustomer(customer)
              if (customer) {
                applyCustomerDiscount()
              }
            }}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Walk-in Customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Walk-in Customer</SelectItem>
              {customers.map(customer => (
                <SelectItem key={customer.id} value={customer.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{customer.name}</span>
                    <Badge 
                      variant="secondary" 
                      className={`ml-2 ${
                        customer.tier === 'Platinum' ? 'bg-purple-100' :
                        customer.tier === 'Gold' ? 'bg-yellow-100' :
                        customer.tier === 'Silver' ? 'bg-gray-100' :
                        'bg-orange-100'
                      }`}
                    >
                      {customer.tier}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCustomer && (
            <div className="mt-2 text-sm text-gray-600">
              <p>{selectedCustomer.phone}</p>
              <p className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                {selectedCustomer.visits} visits
              </p>
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Cart is empty</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <Card key={`${item.type}-${item.id}`} className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-500">
                        {item.type === 'service' ? (
                          <>
                            <User className="inline h-3 w-3 mr-1" />
                            {item.staff}
                            <Clock className="inline h-3 w-3 ml-2 mr-1" />
                            {item.duration} min
                          </>
                        ) : (
                          <Package className="inline h-3 w-3 mr-1" />
                        )}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <X className="h-4 w-4" />
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
                        <span className="w-8 text-center">{item.quantity}</span>
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
                      <span className="font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>

                    {/* Discount */}
                    {item.discount > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-600">
                          <Percent className="inline h-3 w-3 mr-1" />
                          Discount
                        </span>
                        <span className="text-green-600">
                          -{item.discountType === 'percentage' 
                            ? `${item.discount}%` 
                            : formatCurrency(item.discount)}
                        </span>
                      </div>
                    )}

                    {/* Staff Selection for Services */}
                    {item.type === 'service' && item.staff && (
                      <Select
                        value={item.staff}
                        onValueChange={(value) => updateCartItem(item.id, { staff: value })}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {services.find(s => s.id === item.id)?.staff.map(staff => (
                            <SelectItem key={staff} value={staff}>
                              {staff}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="p-4 border-t bg-gray-50">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(calculateSubtotal())}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>VAT (5%)</span>
              <span>{formatCurrency(calculateVAT())}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-pink-600">{formatCurrency(calculateTotal())}</span>
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
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Total Due</span>
                <span className="text-2xl font-bold text-pink-600">
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
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center text-red-600">
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