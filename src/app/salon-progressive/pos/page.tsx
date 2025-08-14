'use client'

import React, { useState, useEffect } from 'react'
import '../salon-styles.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { SalonTeamsSidebar } from '@/components/salon-progressive/SalonTeamsSidebar'
import { 
  ShoppingCart, 
  Plus,
  Minus,
  Trash2,
  CreditCard,
  DollarSign,
  User,
  Clock,
  Star,
  ArrowLeft,
  Save,
  TestTube,
  Scissors,
  Sparkles,
  Receipt,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

// Progressive Demo Data - Salon Services & Products
const salonServices = [
  {
    id: 1,
    name: 'Haircut & Style',
    category: 'Hair Services',
    price: 85,
    duration: 60,
    type: 'service',
    stylist: 'Emma',
    description: 'Professional haircut with styling'
  },
  {
    id: 2,
    name: 'Hair Color',
    category: 'Color Services',
    price: 150,
    duration: 120,
    type: 'service',
    stylist: 'Emma',
    description: 'Full hair coloring service'
  },
  {
    id: 3,
    name: 'Highlights',
    category: 'Color Services',
    price: 130,
    duration: 90,
    type: 'service',
    stylist: 'Sarah',
    description: 'Foil highlights with toner'
  },
  {
    id: 4,
    name: 'Beard Trim',
    category: 'Men\'s Services',
    price: 35,
    duration: 30,
    type: 'service',
    stylist: 'David',
    description: 'Professional beard trimming'
  },
  {
    id: 5,
    name: 'Deep Conditioning',
    category: 'Hair Treatments',
    price: 65,
    duration: 45,
    type: 'service',
    stylist: 'Alex',
    description: 'Intensive hair treatment'
  }
]

const salonProducts = [
  {
    id: 101,
    name: 'Professional Shampoo',
    category: 'Hair Care',
    price: 28,
    stock: 45,
    type: 'product',
    brand: 'L\'Oreal Professional',
    description: 'Premium salon shampoo'
  },
  {
    id: 102,
    name: 'Hair Styling Mousse',
    category: 'Styling Products',
    price: 22.50,
    stock: 25,
    type: 'product',
    brand: 'Redken',
    description: 'Professional styling mousse'
  },
  {
    id: 103,
    name: 'Premium Conditioner',
    category: 'Hair Care',
    price: 45,
    stock: 32,
    type: 'product',
    brand: 'Olaplex',
    description: 'Luxury hair conditioner'
  },
  {
    id: 104,
    name: 'Hair Serum',
    category: 'Hair Treatments',
    price: 35,
    stock: 18,
    type: 'product',
    brand: 'Schwarzkopf',
    description: 'Repair and shine serum'
  }
]

const allItems = [...salonServices, ...salonProducts]

export default function SalonPOS() {
  const [testMode, setTestMode] = useState(true)
  const [cart, setCart] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [hasChanges, setHasChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)

  // Filter items
  const filteredItems = allItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const addToCart = (item) => {
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
    setHasChanges(true)
  }

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId))
    setHasChanges(true)
  }

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(itemId)
    } else {
      setCart(cart.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ))
    }
    setHasChanges(true)
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getTax = () => {
    return getCartTotal() * 0.08 // 8% tax
  }

  const getFinalTotal = () => {
    return getCartTotal() + getTax()
  }

  const processPayment = () => {
    if (cart.length === 0) return
    
    console.log('Processing payment:', {
      items: cart,
      subtotal: getCartTotal(),
      tax: getTax(),
      total: getFinalTotal(),
      paymentMethod,
      customer: selectedCustomer
    })
    
    // Clear cart after successful payment
    setCart([])
    setSelectedCustomer(null)
    setHasChanges(false)
    alert('Payment processed successfully!')
  }

  const handleSaveProgress = () => {
    setLastSaved(new Date())
    setHasChanges(false)
    console.log('POS data saved:', { cart, customer: selectedCustomer })
  }

  const categories = [...new Set(allItems.map(item => item.category))]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex">
      {/* Teams-Style Sidebar */}
      <SalonTeamsSidebar />
      
      <div className="flex-1 flex flex-col ml-16">
        {/* Enterprise Glassmorphism Header */}
        <div className="bg-white/20 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50 shadow-lg shadow-black/5">
          <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" asChild className="bg-white/80 text-slate-800 border-slate-300 hover:bg-white shadow-md font-semibold">
                <Link href="/salon-progressive">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Salon Point of Sale
                </h1>
                <p className="text-sm text-slate-700 font-medium">Services & Products Sales System</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Enterprise Controls */}
              <div className="flex items-center gap-3 bg-white/30 backdrop-blur-md rounded-xl p-3 border border-white/20 shadow-lg shadow-black/5">
                {testMode && hasChanges && (
                  <Button
                    size="sm"
                    onClick={handleSaveProgress}
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-md font-medium"
                  >
                    <Save className="h-4 w-4" />
                    Save Progress
                  </Button>
                )}
              </div>

              {lastSaved && (
                <div className="text-xs text-slate-600 font-medium bg-white/20 px-3 py-1 rounded-lg backdrop-blur-sm">
                  Saved: {lastSaved.toLocaleTimeString()}
                </div>
              )}

              <Badge className="px-3 py-1 font-medium border bg-amber-500/20 text-amber-800 border-amber-500/30">
                <div className="w-2 h-2 rounded-full mr-2 bg-amber-500"></div>
                <TestTube className="h-3 w-3 mr-1" />
                Demo Mode
              </Badge>
            </div>
          </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Product/Service Selection */}
            <div className="lg:col-span-2 space-y-6">
              {/* Search and Filters */}
              <Card className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Input
                        placeholder="Search services and products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-white/60 backdrop-blur-sm border-white/30 text-slate-800 placeholder:text-slate-500 focus:bg-white/80 transition-all"
                      />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-48 bg-white/60 backdrop-blur-sm border-white/30 text-slate-800 hover:bg-white/80 transition-all">
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent className="hera-select-content">
                        <SelectItem value="all" className="hera-select-item">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category} className="hera-select-item">
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredItems.map((item) => (
                  <Card key={item.id} className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 group cursor-pointer"
                        onClick={() => addToCart(item)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="relative">
                            <div className="absolute inset-0 bg-pink-500/20 rounded-lg blur-md group-hover:blur-lg transition-all"></div>
                            <div className="h-12 w-12 bg-gradient-to-br from-pink-500/90 to-purple-600/90 rounded-lg flex items-center justify-center shadow-lg relative">
                              {item.type === 'service' ? (
                                <Scissors className="h-6 w-6 text-white drop-shadow-sm" />
                              ) : (
                                <Sparkles className="h-6 w-6 text-white drop-shadow-sm" />
                              )}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-slate-800">{item.name}</p>
                              <Badge className={item.type === 'service' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-green-100 text-green-800 border-green-200'}>
                                {item.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600 mb-2 font-medium">{item.description}</p>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              {item.type === 'service' ? (
                                <>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {item.duration}min
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {item.stylist}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="flex items-center gap-1">
                                    <Sparkles className="h-3 w-3" />
                                    Stock: {item.stock}
                                  </span>
                                  <span className="text-slate-600">{item.brand}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-emerald-700">${item.price}</p>
                          <Button size="sm" className="bg-pink-600 hover:bg-pink-700 text-white mt-2">
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
                    <div className="p-2 bg-pink-500/20 rounded-lg">
                      <ShoppingCart className="h-6 w-6 text-pink-600" />
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
                        <p className="text-sm text-slate-500">Add services or products to start</p>
                      </div>
                    ) : (
                      cart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
                            <p className="text-xs text-slate-600">${item.price} each</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    className="h-6 w-6 p-0">
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                            <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="h-6 w-6 p-0">
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => removeFromCart(item.id)}
                                    className="h-6 w-6 p-0 ml-2">
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
                          <span className="font-medium text-slate-800">${getCartTotal().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Tax (8%):</span>
                          <span className="font-medium text-slate-800">${getTax().toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                          <span className="text-slate-800">Total:</span>
                          <span className="text-emerald-700">${getFinalTotal().toFixed(2)}</span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Payment */}
              {cart.length > 0 && (
                <Card className="bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-slate-800">
                      <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <CreditCard className="h-6 w-6 text-emerald-600" />
                      </div>
                      <span className="text-lg font-semibold">Payment</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-slate-700 font-medium">Payment Method</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger className="bg-white/60 backdrop-blur-sm border-white/30 text-slate-800 hover:bg-white/80 transition-all">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="hera-select-content">
                          <SelectItem value="cash" className="hera-select-item">Cash</SelectItem>
                          <SelectItem value="card" className="hera-select-item">Credit/Debit Card</SelectItem>
                          <SelectItem value="digital" className="hera-select-item">Digital Payment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      onClick={processPayment}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium py-3"
                    >
                      <Receipt className="h-5 w-5 mr-2" />
                      Process Payment (${getFinalTotal().toFixed(2)})
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Progressive Features Notice */}
          {testMode && (
            <Card className="mt-8 bg-white/30 backdrop-blur-xl border border-white/20 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500/20 rounded-xl">
                    <TestTube className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-lg">Demo Mode Active</p>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed mt-1">
                      Process salon services and product sales seamlessly. Add services with stylist assignments and retail products with inventory tracking. 
                      All transactions are simulated in demo mode. Click "Save Progress" to persist your sales data.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enterprise HERA Technology Footer */}
          <div className="mt-12 mb-8">
            <Card className="bg-white/25 backdrop-blur-xl border border-white/15 shadow-lg">
              <CardContent className="px-8 py-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-gradient-to-br from-indigo-500/80 to-purple-600/80 rounded-lg flex items-center justify-center shadow-md">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="text-sm font-bold text-slate-800">
                          Powered by <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-black">HERA</span>
                        </p>
                        <p className="text-xs text-slate-600 font-medium">
                          Universal Enterprise Resource Architecture
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3 w-3 text-slate-400" />
                      <span className="font-medium">Patent Pending Technology</span>
                    </div>
                    <div className="hidden sm:block w-1 h-1 bg-slate-400 rounded-full"></div>
                    <div className="flex items-center gap-2">
                      <Star className="h-3 w-3 text-slate-400" />
                      <span className="font-medium">Enterprise Grade</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}