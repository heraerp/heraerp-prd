'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Input } from '@/src/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { cn } from '@/src/lib/utils'
import {
  Plus,
  Minus,
  X,
  CreditCard,
  DollarSign,
  Smartphone,
  Gift,
  User,
  Clock,
  ShoppingBag,
  Coffee,
  Sandwich,
  Pizza,
  Beer,
  Salad,
  IceCream,
  Search,
  Percent,
  UserPlus,
  Car,
  Package
} from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  category: string
  price: number
  modifiers?: Array<{
    id: string
    name: string
    price: number
    required?: boolean
    options?: Array<{ name: string; price: number }>
  }>
}

interface OrderItem {
  id: string
  menuItem: MenuItem
  quantity: number
  modifiers: Array<{ name: string; price: number }>
  notes?: string
  totalPrice: number
}

interface QuickServicePOSProps {
  mode: 'counter' | 'bar' | 'drive-thru'
  isOnline: boolean
  currentEmployee: {
    name: string
    id: string
  }
}

export function QuickServicePOS({ mode, isOnline, currentEmployee }: QuickServicePOSProps) {
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState('popular')
  const [searchQuery, setSearchQuery] = useState('')
  const [orderType, setOrderType] = useState<'dine-in' | 'takeout' | 'delivery'>('dine-in')
  const [customerName, setCustomerName] = useState('')

  // Calculate order totals
  const subtotal = currentOrder.reduce((sum, item) => sum + item.totalPrice, 0)
  const tax = subtotal * 0.0875 // 8.75% tax
  const total = subtotal + tax

  // Demo menu data
  const menuCategories = [
    { id: 'popular', name: 'Popular', icon: <Coffee className="h-4 w-4" /> },
    { id: 'beverages', name: 'Beverages', icon: <Coffee className="h-4 w-4" /> },
    { id: 'appetizers', name: 'Appetizers', icon: <Sandwich className="h-4 w-4" /> },
    { id: 'entrees', name: 'Entrees', icon: <Pizza className="h-4 w-4" /> },
    { id: 'bar', name: 'Bar', icon: <Beer className="h-4 w-4" /> },
    { id: 'sides', name: 'Sides', icon: <Salad className="h-4 w-4" /> },
    { id: 'desserts', name: 'Desserts', icon: <IceCream className="h-4 w-4" /> }
  ]

  const menuItems: MenuItem[] = [
    // Popular items
    { id: 'm1', name: 'House Burger', category: 'popular', price: 14.95 },
    { id: 'm2', name: 'Caesar Salad', category: 'popular', price: 12.95 },
    { id: 'm3', name: 'Margherita Pizza', category: 'popular', price: 16.95 },
    { id: 'm4', name: 'Fish & Chips', category: 'popular', price: 18.95 },
    { id: 'm5', name: 'Chicken Wings', category: 'popular', price: 13.95 },
    { id: 'm6', name: 'Pasta Carbonara', category: 'popular', price: 17.95 },

    // Beverages
    { id: 'b1', name: 'Coca-Cola', category: 'beverages', price: 3.95 },
    { id: 'b2', name: 'Iced Tea', category: 'beverages', price: 3.95 },
    { id: 'b3', name: 'Lemonade', category: 'beverages', price: 4.95 },
    { id: 'b4', name: 'Coffee', category: 'beverages', price: 3.5 },
    { id: 'b5', name: 'Orange Juice', category: 'beverages', price: 4.95 },

    // Bar items
    { id: 'bar1', name: 'Draft Beer', category: 'bar', price: 6.95 },
    { id: 'bar2', name: 'House Wine', category: 'bar', price: 8.95 },
    { id: 'bar3', name: 'Margarita', category: 'bar', price: 10.95 },
    { id: 'bar4', name: 'Old Fashioned', category: 'bar', price: 12.95 }
  ]

  const filteredItems = menuItems.filter(
    item =>
      item.category === selectedCategory &&
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const addToOrder = (menuItem: MenuItem) => {
    const existingItem = currentOrder.find(item => item.menuItem.id === menuItem.id)

    if (existingItem) {
      // Increase quantity
      setCurrentOrder(
        currentOrder.map(item =>
          item.id === existingItem.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                totalPrice: (item.quantity + 1) * menuItem.price
              }
            : item
        )
      )
    } else {
      // Add new item
      const newItem: OrderItem = {
        id: `order-${Date.now()}`,
        menuItem,
        quantity: 1,
        modifiers: [],
        totalPrice: menuItem.price
      }
      setCurrentOrder([...currentOrder, newItem])
    }
  }

  const updateQuantity = (itemId: string, delta: number) => {
    setCurrentOrder(
      currentOrder
        .map(item => {
          if (item.id === itemId) {
            const newQuantity = Math.max(0, item.quantity + delta)
            if (newQuantity === 0) return null
            return {
              ...item,
              quantity: newQuantity,
              totalPrice: newQuantity * item.menuItem.price
            }
          }
          return item
        })
        .filter(Boolean) as OrderItem[]
    )
  }

  const removeItem = (itemId: string) => {
    setCurrentOrder(currentOrder.filter(item => item.id !== itemId))
  }

  const clearOrder = () => {
    setCurrentOrder([])
    setCustomerName('')
    setOrderType('dine-in')
  }

  const processPayment = (method: string) => {
    console.log('Processing payment:', { method, total, items: currentOrder })
    // Process payment and sync with backend
    if (!isOnline) {
      // Queue for later sync
      console.log('Queuing transaction for offline sync')
    }
    clearOrder()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Menu Section */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid grid-cols-7 w-full">
            {menuCategories.map(cat => (
              <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
                <span className="hidden sm:inline">{cat.name}</span>
                <span className="sm:hidden">{cat.icon}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredItems.map(item => (
                <Button
                  key={item.id}
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center text-center p-2"
                  onClick={() => addToOrder(item)}
                >
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-lg font-bold mt-1">${item.price.toFixed(2)}</span>
                </Button>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <Percent className="h-4 w-4 mr-2" />
            Discount
          </Button>
          <Button variant="outline" size="sm">
            <Gift className="h-4 w-4 mr-2" />
            Gift Card
          </Button>
          <Button variant="outline" size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Loyalty
          </Button>
          {mode === 'drive-thru' && (
            <Button variant="outline" size="sm">
              <Car className="h-4 w-4 mr-2" />
              Car Info
            </Button>
          )}
        </div>
      </div>

      {/* Order Section */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Current Order</CardTitle>
              <div className="flex items-center gap-2">
                {mode === 'drive-thru' && (
                  <Badge variant="secondary">
                    <Car className="h-3 w-3 mr-1" />
                    Lane 1
                  </Badge>
                )}
                <Badge variant={isOnline ? 'default' : 'secondary'}>
                  {isOnline ? 'Online' : 'Offline'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Order Type */}
            <div className="flex gap-2">
              <Button
                variant={orderType === 'dine-in' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrderType('dine-in')}
                className="flex-1"
              >
                Dine In
              </Button>
              <Button
                variant={orderType === 'takeout' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrderType('takeout')}
                className="flex-1"
              >
                <Package className="h-4 w-4 mr-2" />
                Takeout
              </Button>
              <Button
                variant={orderType === 'delivery' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrderType('delivery')}
                className="flex-1"
              >
                Delivery
              </Button>
            </div>

            {/* Customer Name */}
            <div>
              <Input
                placeholder="Customer name..."
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
              />
            </div>

            {/* Order Items */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {currentOrder.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No items in order</p>
                </div>
              ) : (
                currentOrder.map(item => (
                  <div key={item.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.menuItem.name}</div>
                      <div className="text-xs text-muted-foreground">
                        ${item.menuItem.price.toFixed(2)} each
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => updateQuantity(item.id, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button variant="ghost" size="sm" onClick={() => updateQuantity(item.id, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${item.totalPrice.toFixed(2)}</div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Totals */}
            {currentOrder.length > 0 && (
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Payment Buttons */}
            {currentOrder.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => processPayment('cash')}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Cash
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => processPayment('card')}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Card
                </Button>
                <Button variant="outline" onClick={() => processPayment('mobile')}>
                  <Smartphone className="h-4 w-4 mr-2" />
                  Mobile
                </Button>
                <Button variant="outline" onClick={() => processPayment('gift')}>
                  <Gift className="h-4 w-4 mr-2" />
                  Gift Card
                </Button>
              </div>
            )}

            {/* Clear Order */}
            {currentOrder.length > 0 && (
              <Button variant="outline" className="w-full" onClick={clearOrder}>
                Clear Order
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Order Queue (for counter/drive-thru) */}
        {(mode === 'counter' || mode === 'drive-thru') && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Order Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                  <div>
                    <div className="font-medium">#247 - John D.</div>
                    <div className="text-xs text-muted-foreground">2 items • $18.90</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      3m
                    </Badge>
                    <Button size="sm">Ready</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <div>
                    <div className="font-medium">#248 - Sarah M.</div>
                    <div className="text-xs text-muted-foreground">4 items • $42.75</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      1m
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
