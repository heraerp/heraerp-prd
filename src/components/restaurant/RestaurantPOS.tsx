'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  DollarSign,
  User,
  Clock,
  ChefHat,
  Coffee,
  Pizza,
  Salad,
  Cookie,
  Wine,
  Utensils,
  Home,
  Truck,
  Users,
  Receipt,
  Search,
  Filter,
  X,
  Check,
  AlertCircle,
  Percent,
  Gift,
  Phone,
  MapPin,
  Star,
  TrendingUp,
  Package,
  Smartphone
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MenuItem {
  id: string
  name: string
  category: string
  price: number
  cost: number
  image?: string
  description?: string
  modifiers?: Array<{
    name: string
    price: number
  }>
  allergens?: string[]
  popular?: boolean
  available: boolean
}

interface OrderItem {
  menuItem: MenuItem
  quantity: number
  modifiers: string[]
  specialInstructions?: string
  subtotal: number
}

interface Order {
  id: string
  items: OrderItem[]
  orderType: 'dine-in' | 'takeout' | 'delivery'
  tableNumber?: string
  customerName?: string
  customerPhone?: string
  deliveryAddress?: string
  subtotal: number
  tax: number
  discount: number
  tip: number
  total: number
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  paymentMethod?: 'cash' | 'card' | 'digital'
  timestamp: Date
}

export function RestaurantPOS() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([])
  const [orderType, setOrderType] = useState<'dine-in' | 'takeout' | 'delivery'>('dine-in')
  const [tableNumber, setTableNumber] = useState('')
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '' })
  const [discount, setDiscount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [showPayment, setShowPayment] = useState(false)
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({})

  const TAX_RATE = 0.08 // 8% tax

  // Sample menu data with costing info
  const menuItems: MenuItem[] = [
    // Appetizers
    { id: '1', name: 'Caesar Salad', category: 'appetizers', price: 9.00, cost: 2.00, available: true, popular: true, allergens: ['dairy', 'gluten'] },
    { id: '2', name: 'Bruschetta', category: 'appetizers', price: 8.00, cost: 1.80, available: true, allergens: ['gluten'] },
    { id: '3', name: 'Soup of the Day', category: 'appetizers', price: 7.00, cost: 1.50, available: true },
    { id: '4', name: 'Garlic Bread', category: 'appetizers', price: 6.00, cost: 1.20, available: true, allergens: ['gluten', 'dairy'] },
    
    // Main Courses
    { id: '5', name: 'Grilled Salmon', category: 'mains', price: 24.00, cost: 5.31, available: true, popular: true, allergens: ['fish'] },
    { id: '6', name: 'Truffle Pasta', category: 'mains', price: 25.00, cost: 3.23, available: true, popular: true, allergens: ['gluten', 'dairy'] },
    { id: '7', name: 'Ribeye Steak', category: 'mains', price: 32.00, cost: 8.50, available: true, modifiers: [
      { name: 'Medium Rare', price: 0 },
      { name: 'Medium', price: 0 },
      { name: 'Well Done', price: 0 }
    ]},
    { id: '8', name: 'Chicken Parmesan', category: 'mains', price: 18.00, cost: 4.20, available: true, allergens: ['gluten', 'dairy'] },
    { id: '9', name: 'Vegetarian Bowl', category: 'mains', price: 16.00, cost: 3.00, available: true },
    
    // Desserts
    { id: '10', name: 'Chocolate Lava Cake', category: 'desserts', price: 9.00, cost: 2.10, available: true, popular: true, allergens: ['dairy', 'eggs', 'gluten'] },
    { id: '11', name: 'Tiramisu', category: 'desserts', price: 8.00, cost: 1.80, available: true, allergens: ['dairy', 'eggs'] },
    { id: '12', name: 'Ice Cream', category: 'desserts', price: 6.00, cost: 1.20, available: true, allergens: ['dairy'] },
    
    // Beverages
    { id: '13', name: 'House Wine', category: 'beverages', price: 8.00, cost: 1.50, available: true },
    { id: '14', name: 'Craft Beer', category: 'beverages', price: 7.00, cost: 1.80, available: true },
    { id: '15', name: 'Soft Drinks', category: 'beverages', price: 3.00, cost: 0.50, available: true },
    { id: '16', name: 'Coffee', category: 'beverages', price: 4.00, cost: 0.60, available: true },
    { id: '17', name: 'Fresh Juice', category: 'beverages', price: 5.00, cost: 1.20, available: true }
  ]

  const categories = [
    { id: 'all', name: 'All Items', icon: <Utensils /> },
    { id: 'appetizers', name: 'Appetizers', icon: <Salad /> },
    { id: 'mains', name: 'Main Courses', icon: <Pizza /> },
    { id: 'desserts', name: 'Desserts', icon: <Cookie /> },
    { id: 'beverages', name: 'Beverages', icon: <Wine /> }
  ]

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch && item.available
  })

  const addToOrder = (item: MenuItem) => {
    const existingItemIndex = currentOrder.findIndex(
      orderItem => orderItem.menuItem.id === item.id && 
      JSON.stringify(orderItem.modifiers) === JSON.stringify(selectedModifiers[item.id] || [])
    )

    if (existingItemIndex >= 0) {
      const updatedOrder = [...currentOrder]
      updatedOrder[existingItemIndex].quantity += 1
      updatedOrder[existingItemIndex].subtotal = 
        updatedOrder[existingItemIndex].quantity * item.price
      setCurrentOrder(updatedOrder)
    } else {
      const newOrderItem: OrderItem = {
        menuItem: item,
        quantity: 1,
        modifiers: selectedModifiers[item.id] || [],
        subtotal: item.price
      }
      setCurrentOrder([...currentOrder, newOrderItem])
    }
  }

  const updateQuantity = (index: number, change: number) => {
    const updatedOrder = [...currentOrder]
    updatedOrder[index].quantity += change
    
    if (updatedOrder[index].quantity <= 0) {
      updatedOrder.splice(index, 1)
    } else {
      updatedOrder[index].subtotal = 
        updatedOrder[index].quantity * updatedOrder[index].menuItem.price
    }
    
    setCurrentOrder(updatedOrder)
  }

  const removeFromOrder = (index: number) => {
    const updatedOrder = currentOrder.filter((_, i) => i !== index)
    setCurrentOrder(updatedOrder)
  }

  const calculateTotals = () => {
    const subtotal = currentOrder.reduce((sum, item) => sum + item.subtotal, 0)
    const discountAmount = (subtotal * discount) / 100
    const taxableAmount = subtotal - discountAmount
    const tax = taxableAmount * TAX_RATE
    const total = taxableAmount + tax

    return {
      subtotal,
      discount: discountAmount,
      tax,
      total
    }
  }

  const calculateProfit = () => {
    const totalCost = currentOrder.reduce((sum, item) => 
      sum + (item.menuItem.cost * item.quantity), 0
    )
    const { subtotal } = calculateTotals()
    const profit = subtotal - totalCost
    const margin = subtotal > 0 ? (profit / subtotal) * 100 : 0

    return { profit, margin }
  }

  const processPayment = (method: 'cash' | 'card' | 'digital') => {
    const totals = calculateTotals()
    const newOrder: Order = {
      id: Date.now().toString(),
      items: currentOrder,
      orderType,
      tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      deliveryAddress: orderType === 'delivery' ? customerInfo.address : undefined,
      ...totals,
      tip: 0,
      status: 'pending',
      paymentMethod: method,
      timestamp: new Date()
    }

    // Here you would send to HERA Universal API
    console.log('Processing order:', newOrder)
    
    // Reset for next order
    setCurrentOrder([])
    setTableNumber('')
    setCustomerInfo({ name: '', phone: '', address: '' })
    setDiscount(0)
    setShowPayment(false)
  }

  const totals = calculateTotals()
  const { profit, margin } = calculateProfit()

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Panel - Menu Items */}
      <div className="flex-1 flex flex-col">
        {/* Search and Filters */}
        <div className="p-4 bg-white border-b">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="p-4 bg-white border-b">
          <div className="flex gap-2 overflow-x-auto">
            {categories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={selectedCategory === category.id ? 'restaurant-btn-primary' : ''}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <ScrollArea className="flex-1 p-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map(item => (
              <Card
                key={item.id}
                className="restaurant-card cursor-pointer hover:shadow-lg transition-all"
                onClick={() => addToOrder(item)}
              >
                <CardContent className="p-4">
                  <div className="aspect-square bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg mb-3 flex items-center justify-center">
                    {item.category === 'appetizers' && <Salad className="w-12 h-12 text-orange-500" />}
                    {item.category === 'mains' && <Utensils className="w-12 h-12 text-orange-500" />}
                    {item.category === 'desserts' && <Cookie className="w-12 h-12 text-orange-500" />}
                    {item.category === 'beverages' && <Coffee className="w-12 h-12 text-orange-500" />}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-sm leading-tight">{item.name}</h3>
                      {item.popular && (
                        <Badge className="bg-orange-100 text-orange-600 text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-orange-600">${item.price.toFixed(2)}</span>
                      <Button
                        size="sm"
                        className="restaurant-btn-primary h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          addToOrder(item)
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {item.allergens && item.allergens.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.allergens.map(allergen => (
                          <Badge key={allergen} variant="outline" className="text-xs">
                            {allergen}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Order Summary */}
      <div className="w-96 bg-white border-l flex flex-col">
        {/* Order Type Selection */}
        <div className="p-4 border-b">
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={orderType === 'dine-in' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOrderType('dine-in')}
              className={orderType === 'dine-in' ? 'restaurant-btn-primary' : ''}
            >
              <Home className="w-4 h-4 mr-1" />
              Dine In
            </Button>
            <Button
              variant={orderType === 'takeout' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOrderType('takeout')}
              className={orderType === 'takeout' ? 'restaurant-btn-primary' : ''}
            >
              <Package className="w-4 h-4 mr-1" />
              Takeout
            </Button>
            <Button
              variant={orderType === 'delivery' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOrderType('delivery')}
              className={orderType === 'delivery' ? 'restaurant-btn-primary' : ''}
            >
              <Truck className="w-4 h-4 mr-1" />
              Delivery
            </Button>
          </div>

          {/* Order Info */}
          <div className="mt-3 space-y-2">
            {orderType === 'dine-in' && (
              <Input
                placeholder="Table Number"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="text-center"
              />
            )}
            {orderType === 'takeout' && (
              <>
                <Input
                  placeholder="Customer Name"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder="Phone Number"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                />
              </>
            )}
            {orderType === 'delivery' && (
              <>
                <Input
                  placeholder="Customer Name"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder="Phone Number"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                />
                <Input
                  placeholder="Delivery Address"
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                />
              </>
            )}
          </div>
        </div>

        {/* Order Items */}
        <ScrollArea className="flex-1 p-4">
          {currentOrder.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3" />
              <p>No items in order</p>
              <p className="text-sm mt-1">Tap menu items to add</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentOrder.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.menuItem.name}</p>
                    {item.modifiers.length > 0 && (
                      <p className="text-xs text-gray-500">{item.modifiers.join(', ')}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-6 w-6"
                        onClick={() => updateQuantity(index, -1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-6 w-6"
                        onClick={() => updateQuantity(index, 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${item.subtotal.toFixed(2)}</p>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 mt-1"
                      onClick={() => removeFromOrder(index)}
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Totals and Actions */}
        <div className="border-t p-4 space-y-3">
          {/* Discount */}
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Discount %"
              value={discount || ''}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="w-24"
              min="0"
              max="100"
            />
            <Button variant="outline" size="sm">
              <Gift className="w-4 h-4 mr-1" />
              Apply Coupon
            </Button>
          </div>

          {/* Totals */}
          <div className="space-y-2 py-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${totals.subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount ({discount}%)</span>
                <span>-${totals.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>Tax ({(TAX_RATE * 100).toFixed(0)}%)</span>
              <span>${totals.tax.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-orange-600">${totals.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Profit Indicator (for manager view) */}
          <div className="p-2 bg-green-50 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Est. Profit</span>
              <div className="text-right">
                <span className="font-semibold text-green-600">${profit.toFixed(2)}</span>
                <span className="text-xs text-gray-500 ml-1">({margin.toFixed(1)}%)</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentOrder([])}
              disabled={currentOrder.length === 0}
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
            <Button
              className="restaurant-btn-primary"
              onClick={() => setShowPayment(true)}
              disabled={currentOrder.length === 0}
            >
              <CreditCard className="w-4 h-4 mr-1" />
              Pay ${totals.total.toFixed(2)}
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg">Total Due</span>
                <span className="text-2xl font-bold text-orange-600">
                  ${totals.total.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Button
                className="h-20 flex-col gap-2"
                variant="outline"
                onClick={() => processPayment('cash')}
              >
                <DollarSign className="w-6 h-6" />
                <span>Cash</span>
              </Button>
              <Button
                className="h-20 flex-col gap-2"
                variant="outline"
                onClick={() => processPayment('card')}
              >
                <CreditCard className="w-6 h-6" />
                <span>Card</span>
              </Button>
              <Button
                className="h-20 flex-col gap-2"
                variant="outline"
                onClick={() => processPayment('digital')}
              >
                <Smartphone className="w-6 h-6" />
                <span>Digital</span>
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowPayment(false)}
              >
                Cancel
              </Button>
              <Button className="flex-1 restaurant-btn-primary">
                <Receipt className="w-4 h-4 mr-1" />
                Print Receipt
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}