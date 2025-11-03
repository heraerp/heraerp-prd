'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard,
  Banknote,
  User,
  Gem,
  Star,
  Calculator,
  Receipt
} from 'lucide-react'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  category: string
  goldWeight?: number
  purity?: string
}

interface Customer {
  id: string
  name: string
  phone: string
  category: 'retail' | 'wholesale' | 'premium' | 'vip'
  creditLimit: number
}

export default function Jewelry1POSPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Sample products for demo
  const sampleProducts = [
    { id: '1', name: 'Diamond Ring 18K', price: 45000, category: 'rings', goldWeight: 3.5, purity: '18K' },
    { id: '2', name: 'Gold Necklace Set', price: 28000, category: 'necklaces', goldWeight: 12.5, purity: '22K' },
    { id: '3', name: 'Pearl Earrings', price: 8500, category: 'earrings', goldWeight: 2.1, purity: '18K' },
    { id: '4', name: 'Ruby Bracelet', price: 35000, category: 'bracelets', goldWeight: 8.3, purity: '18K' },
    { id: '5', name: 'Emerald Pendant', price: 22000, category: 'pendants', goldWeight: 4.2, purity: '18K' },
    { id: '6', name: 'Silver Chain', price: 3500, category: 'chains', goldWeight: 0, purity: 'Sterling' }
  ]

  const addToCart = (product: typeof sampleProducts[0]) => {
    const existingItem = cartItems.find(item => item.id === product.id)
    if (existingItem) {
      setCartItems(cartItems.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }])
    }
  }

  const updateQuantity = (id: string, change: number) => {
    setCartItems(cartItems.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + change)
        return newQuantity === 0 ? null : { ...item, quantity: newQuantity }
      }
      return item
    }).filter(Boolean) as CartItem[])
  }

  const removeFromCart = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id))
  }

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const calculateTax = (amount: number) => {
    return amount * 0.03 // 3% GST for jewelry
  }

  const total = calculateTotal()
  const tax = calculateTax(total)
  const grandTotal = total + tax

  const filteredProducts = sampleProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Point of Sale</h1>
                <p className="text-sm text-slate-500">Process jewelry sales transactions</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                Terminal 01
              </Badge>
              <Button variant="outline" size="sm">
                <Receipt className="w-4 h-4 mr-2" />
                Print Receipt
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Catalog */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search */}
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search products by name or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Product Grid */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Gem className="w-5 h-5" />
                  <span>Product Catalog</span>
                </CardTitle>
                <CardDescription>Select products to add to cart</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-900">{product.name}</h3>
                          <p className="text-sm text-slate-500 capitalize">{product.category}</p>
                          {product.goldWeight > 0 && (
                            <div className="flex items-center space-x-2 text-xs text-slate-600 mt-1">
                              <span>{product.goldWeight}g</span>
                              <span>•</span>
                              <span>{product.purity}</span>
                            </div>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-blue-700 bg-blue-50">
                          {product.category}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-slate-900">
                          ₹{product.price.toLocaleString()}
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => addToCart(product)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cart and Checkout */}
          <div className="space-y-6">
            {/* Customer Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Customer</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedCustomer ? (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <div className="font-medium text-blue-900">{selectedCustomer.name}</div>
                      <div className="text-sm text-blue-700">{selectedCustomer.phone}</div>
                      <Badge variant="outline" className="mt-1 text-blue-700 border-blue-200">
                        {selectedCustomer.category.toUpperCase()}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full">
                      <Search className="w-4 h-4 mr-2" />
                      Select Customer
                    </Button>
                    <Button variant="ghost" className="w-full text-slate-600">
                      Walk-in Customer
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shopping Cart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="w-5 h-5" />
                    <span>Cart</span>
                  </div>
                  <Badge variant="secondary">{cartItems.length} items</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cartItems.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>Cart is empty</p>
                    <p className="text-sm">Add products to start a sale</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.name}</div>
                          <div className="text-xs text-slate-500">₹{item.price.toLocaleString()}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-6 h-6 p-0"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-6 h-6 p-0"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => removeFromCart(item.id)}
                            className="w-6 h-6 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Checkout */}
            {cartItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calculator className="w-5 h-5" />
                    <span>Checkout</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>₹{total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>GST (3%)</span>
                      <span>₹{tax.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>₹{grandTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay with Card
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Banknote className="w-4 h-4 mr-2" />
                      Cash Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}