'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Minus, 
  X,
  Search,
  ShoppingCart,
  User,
  MapPin,
  Phone,
  Clock,
  DollarSign,
  Check
} from 'lucide-react'

// MenuItem interface matching the menu API
interface MenuItem {
  id: string
  entity_name: string
  entity_code: string
  price: number
  description: string
  category: string
  prep_time: number
  dietary_tags: string[]
  ingredients: string
  status: 'active' | 'inactive'
  popularity: number
}

// Order item for the cart
interface OrderItem {
  menu_item_id: string
  menu_item_name: string
  quantity: number
  unit_price: number
  special_instructions?: string
  modifications?: string[]
}

// Customer for orders
interface Customer {
  id: string
  entity_name: string
  phone?: string
  email?: string
  address?: string
}

interface NewOrderFormProps {
  onOrderCreated: () => void
  onClose: () => void
}

export function NewOrderForm({ onOrderCreated, onClose }: NewOrderFormProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoadingMenu, setIsLoadingMenu] = useState(true)
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true)
  
  // Order state
  const [orderType, setOrderType] = useState<'dine_in' | 'takeout' | 'delivery'>('dine_in')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [tableNumber, setTableNumber] = useState('')
  const [serverName, setServerName] = useState('')
  const [specialNotes, setSpecialNotes] = useState('')
  const [cart, setCart] = useState<OrderItem[]>([])
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load menu items
  useEffect(() => {
    const loadMenuItems = async () => {
      try {
        setIsLoadingMenu(true)
        const response = await fetch('/api/v1/restaurant/menu')
        const result = await response.json()
        
        if (result.success) {
          setMenuItems(result.data.filter((item: MenuItem) => item.status === 'active'))
        } else {
          console.error('Failed to load menu items:', result.message)
        }
      } catch (error) {
        console.error('Error loading menu items:', error)
      } finally {
        setIsLoadingMenu(false)
      }
    }

    loadMenuItems()
  }, [])

  // Mock customers (in real app, this would come from customers API)
  useEffect(() => {
    setCustomers([
      { id: '550e8400-e29b-41d4-a716-446655440030', entity_name: 'Sarah Johnson', phone: '+1-555-123-4567', email: 'sarah@email.com' },
      { id: '550e8400-e29b-41d4-a716-446655440031', entity_name: 'Mike Chen', phone: '+1-555-987-6543', email: 'mike@email.com' },
      { id: '550e8400-e29b-41d4-a716-446655440032', entity_name: 'Emma Wilson', phone: '+1-555-456-7890', email: 'emma@email.com', address: '123 Oak Street, Apt 4B' },
      { id: '550e8400-e29b-41d4-a716-446655440033', entity_name: 'Robert Davis', phone: '+1-555-789-0123', email: 'robert@email.com' }
    ])
    setIsLoadingCustomers(false)
  }, [])

  // Get unique categories
  const categories = ['All', ...Array.from(new Set(menuItems.map(item => item.category)))]

  // Filter menu items
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Add item to cart
  const addToCart = (menuItem: MenuItem) => {
    const existingItem = cart.find(item => item.menu_item_id === menuItem.id)
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.menu_item_id === menuItem.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, {
        menu_item_id: menuItem.id,
        menu_item_name: menuItem.entity_name,
        quantity: 1,
        unit_price: menuItem.price
      }])
    }
  }

  // Remove item from cart
  const removeFromCart = (menuItemId: string) => {
    setCart(cart.filter(item => item.menu_item_id !== menuItemId))
  }

  // Update quantity
  const updateQuantity = (menuItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(menuItemId)
    } else {
      setCart(cart.map(item => 
        item.menu_item_id === menuItemId 
          ? { ...item, quantity: newQuantity }
          : item
      ))
    }
  }

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  const tax = subtotal * 0.08 // 8% tax
  const total = subtotal + tax

  // Submit order
  const submitOrder = async () => {
    if (cart.length === 0) {
      alert('Please add items to your order')
      return
    }

    setIsSubmitting(true)
    
    try {
      const orderData = {
        customer_id: selectedCustomer?.id || null,
        table_id: orderType === 'dine_in' ? `table_${tableNumber}` : null,
        order_type: orderType,
        items: cart,
        special_notes: specialNotes,
        server_name: serverName
      }

      const response = await fetch('/api/v1/restaurant/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      })

      const result = await response.json()
      
      if (result.success) {
        alert(`Order created successfully! Reference: ${result.data.reference_number}`)
        onOrderCreated()
        onClose()
      } else {
        alert(`Failed to create order: ${result.message}`)
      }
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Error creating order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex h-[90vh]">
          {/* Left Panel - Menu Items */}
          <div className="flex-1 p-6 overflow-y-auto border-r border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">New Order</h2>
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Search and Filter */}
            <div className="mb-6">
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search menu items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.map((item) => (
                <Card key={item.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => addToCart(item)}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{item.entity_name}</h3>
                    <span className="text-lg font-bold text-green-600">${item.price.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{item.prep_time} min</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{item.category}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Panel - Order Details */}
          <div className="w-96 p-6 overflow-y-auto bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Order Details
            </h3>

            {/* Order Type */}
            <div className="mb-4">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Order Type</Label>
              <div className="flex gap-2">
                {(['dine_in', 'takeout', 'delivery'] as const).map((type) => (
                  <Button
                    key={type}
                    variant={orderType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setOrderType(type)}
                    className="flex-1"
                  >
                    {type === 'dine_in' && <User className="w-4 h-4 mr-1" />}
                    {type === 'takeout' && <Plus className="w-4 h-4 mr-1" />}
                    {type === 'delivery' && <MapPin className="w-4 h-4 mr-1" />}
                    {type.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </div>

            {/* Customer Selection */}
            <div className="mb-4">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Customer</Label>
              <select
                value={selectedCustomer?.id || ''}
                onChange={(e) => {
                  const customer = customers.find(c => c.id === e.target.value)
                  setSelectedCustomer(customer || null)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
              >
                <option value="">Walk-in Customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.entity_name} - {customer.phone}
                  </option>
                ))}
              </select>
            </div>

            {/* Table Number (for dine-in) */}
            {orderType === 'dine_in' && (
              <div className="mb-4">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Table Number</Label>
                <Input
                  placeholder="e.g., 5"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                />
              </div>
            )}

            {/* Server Name */}
            <div className="mb-4">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Server</Label>
              <Input
                placeholder="Server name"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
              />
            </div>

            {/* Cart Items */}
            <div className="mb-4">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Order Items ({cart.length})</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.menu_item_id} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.menu_item_name}</p>
                      <p className="text-xs text-gray-500">${item.unit_price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                        className="w-6 h-6 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                        className="w-6 h-6 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFromCart(item.menu_item_id)}
                        className="w-6 h-6 p-0 text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {cart.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No items added yet</p>
                )}
              </div>
            </div>

            {/* Special Notes */}
            <div className="mb-4">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Special Notes</Label>
              <textarea
                placeholder="Any special instructions..."
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                rows={2}
              />
            </div>

            {/* Order Summary */}
            <div className="border-t border-gray-200 pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (8%):</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t border-gray-200 pt-2">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={submitOrder}
              disabled={cart.length === 0 || isSubmitting}
              className="w-full mt-4 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                'Creating Order...'
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Create Order (${total.toFixed(2)})
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}