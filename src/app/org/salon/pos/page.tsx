'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShoppingCart, CreditCard, DollarSign, Plus, Minus, X } from 'lucide-react'
import { useState } from 'react'

export default function SalonPOSPage() {
  const [cart, setCart] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState('services')

  const services = [
    { id: 1, name: 'Classic Haircut', price: 65, category: 'hair' },
    { id: 2, name: 'Full Color Treatment', price: 185, category: 'hair' },
    { id: 3, name: 'Gel Manicure', price: 55, category: 'nails' },
    { id: 4, name: 'Deep Cleansing Facial', price: 125, category: 'facial' }
  ]

  const products = [
    { id: 11, name: 'Professional Shampoo', price: 28, category: 'haircare' },
    { id: 12, name: 'Moisturizing Conditioner', price: 32, category: 'haircare' },
    { id: 13, name: 'Gel Polish - Ruby Red', price: 18, category: 'nails' }
  ]

  const addToCart = (item: any) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id)
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ))
    } else {
      setCart([...cart, { ...item, quantity: 1 }])
    }
  }

  const updateQuantity = (id: number, change: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + change
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null
      }
      return item
    }).filter(Boolean) as any[])
  }

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id))
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = subtotal * 0.08875
  const total = subtotal + tax

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-8rem)]">
      {/* Left Side - Product Selection */}
      <div className="space-y-4 overflow-y-auto">
        <div className="flex gap-2">
          <Button 
            variant={selectedCategory === 'services' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('services')}
            className={selectedCategory === 'services' ? 'bg-gradient-to-r from-pink-500 to-purple-500' : ''}
          >
            Services
          </Button>
          <Button 
            variant={selectedCategory === 'products' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('products')}
            className={selectedCategory === 'products' ? 'bg-gradient-to-r from-pink-500 to-purple-500' : ''}
          >
            Products
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {(selectedCategory === 'services' ? services : products).map((item) => (
            <Card 
              key={item.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => addToCart(item)}
            >
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm">{item.name}</h3>
                <p className="text-lg font-bold text-green-600 mt-2">${item.price}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Right Side - Cart and Checkout */}
      <Card className="flex flex-col h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Current Sale
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto space-y-2 mb-4">
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Cart is empty</p>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold">{item.name}</h4>
                    <p className="text-sm text-gray-600">${item.price} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Buttons */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Button 
              className="bg-green-600 hover:bg-green-700"
              disabled={cart.length === 0}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Cash
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={cart.length === 0}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Card
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}