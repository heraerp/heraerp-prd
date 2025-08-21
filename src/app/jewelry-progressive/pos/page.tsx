'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/MultiOrgAuthProvider'
import { JewelryTeamsSidebar } from '@/components/jewelry-progressive/JewelryTeamsSidebar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { 
  Gem, 
  ShoppingCart, 
  User, 
  CreditCard, 
  Banknote, 
  Search,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  Calculator,
  Crown,
  Sparkles,
  Star,
  Heart,
  Gift,
  Zap,
  DollarSign,
  Package,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

// Progressive Jewelry POS - HERA Universal Architecture
// Smart Code: HERA.JWLY.POS.PROGRESSIVE.v1

interface JewelryProduct {
  id: string
  name: string
  sku: string
  price: number
  category: string
  metal_type: string
  stone_type?: string
  stone_weight?: number
  image?: string
  in_stock: number
  description: string
  ai_recommended?: boolean
}

interface CartItem extends JewelryProduct {
  quantity: number
  line_total: number
}

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  loyalty_tier: string
  total_spent: number
}

// Enhanced demo jewelry products with more variety
const demoProducts: JewelryProduct[] = [
  {
    id: '1',
    name: 'Classic Diamond Solitaire Ring',
    sku: 'DR-1001',
    price: 3299.00,
    category: 'Engagement Rings',
    metal_type: '14K White Gold',
    stone_type: 'Diamond',
    stone_weight: 1.0,
    in_stock: 3,
    description: '1ct Round Diamond, VVS1 clarity, D color',
    ai_recommended: true
  },
  {
    id: '2', 
    name: 'Vintage Pearl Necklace',
    sku: 'PN-2002',
    price: 899.00,
    category: 'Necklaces',
    metal_type: '18K Yellow Gold',
    stone_type: 'Cultured Pearl',
    in_stock: 7,
    description: '18" strand, 7-8mm cultured pearls'
  },
  {
    id: '3',
    name: 'Sapphire Tennis Bracelet',
    sku: 'SB-3003', 
    price: 2150.00,
    category: 'Bracelets',
    metal_type: '14K White Gold',
    stone_type: 'Blue Sapphire',
    stone_weight: 5.2,
    in_stock: 2,
    description: '5.2ct total weight Ceylon sapphires',
    ai_recommended: true
  },
  {
    id: '4',
    name: 'Rose Gold Wedding Band',
    sku: 'WB-4004',
    price: 649.00,
    category: 'Wedding Bands',
    metal_type: '14K Rose Gold',
    in_stock: 12,
    description: '4mm comfort fit band, brushed finish'
  },
  {
    id: '5',
    name: 'Emerald Drop Earrings',
    sku: 'EE-5005',
    price: 1850.00,
    category: 'Earrings', 
    metal_type: '18K Yellow Gold',
    stone_type: 'Emerald',
    stone_weight: 2.8,
    in_stock: 4,
    description: '2.8ct Colombian emeralds, pear cut'
  },
  {
    id: '6',
    name: 'Diamond Stud Earrings',
    sku: 'DE-6006',
    price: 1299.00,
    category: 'Earrings',
    metal_type: '14K White Gold',
    stone_type: 'Diamond',
    stone_weight: 1.0,
    in_stock: 8,
    description: '0.5ct each, excellent cut, F/VS2',
    ai_recommended: true
  }
]

// Sample VIP customers for progressive demo
const sampleCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'Emma Thompson',
    email: 'emma@example.com',
    phone: '(555) 123-4567',
    loyalty_tier: 'Platinum',
    total_spent: 25000
  },
  {
    id: 'cust-2',
    name: 'James Wilson',
    email: 'james@example.com', 
    phone: '(555) 234-5678',
    loyalty_tier: 'Gold',
    total_spent: 8000
  }
]

export default function ProgressivePOSPage() {
  const { workspace, isAnonymous } = useAuth()
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'layaway'>('card')
  const [showPayment, setShowPayment] = useState(false)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [transactionComplete, setTransactionComplete] = useState(false)
  const [lastTransaction, setLastTransaction] = useState<any>(null)

  const categories = ['All', 'Engagement Rings', 'Wedding Bands', 'Necklaces', 'Earrings', 'Bracelets']

  const filteredProducts = demoProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.metal_type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const cartTotal = cart.reduce((sum, item) => sum + item.line_total, 0)
  const cartTax = cartTotal * 0.08 // 8% tax
  const cartGrandTotal = cartTotal + cartTax

  // Save cart to localStorage for progressive workspace
  useEffect(() => {
    if (workspace && cart.length > 0) {
      const storedData = localStorage.getItem(`hera_data_${organization?.organization_id}`) || '{}'
      const data = JSON.parse(storedData)
      data.active_cart = cart
      data.cart_customer = customer
      localStorage.setItem(`hera_data_${organization?.organization_id}`, JSON.stringify(data))
    }
  }, [cart, customer, workspace])

  // Load saved cart on component mount
  useEffect(() => {
    if (workspace) {
      const storedData = localStorage.getItem(`hera_data_${organization?.organization_id}`)
      if (storedData) {
        try {
          const data = JSON.parse(storedData)
          if (data.active_cart && data.active_cart.length > 0) {
            setCart(data.active_cart)
          }
          if (data.cart_customer) {
            setCustomer(data.cart_customer)
          }
        } catch (e) {
          console.error('Failed to load cart:', e)
        }
      }
    }
  }, [workspace])

  const addToCart = (product: JewelryProduct) => {
    const existingItem = cart.find(item => item.id === product.id)
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1, line_total: (item.quantity + 1) * item.price }
          : item
      ))
    } else {
      setCart([...cart, { ...product, quantity: 1, line_total: product.price }])
    }
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.id !== productId))
    } else {
      setCart(cart.map(item => 
        item.id === productId 
          ? { ...item, quantity: newQuantity, line_total: newQuantity * item.price }
          : item
      ))
    }
  }

  const processTransaction = async () => {
    // Enhanced transaction processing with workspace integration
    const transactionData = {
      smart_code: 'HERA.JWLY.POS.PROGRESSIVE.TXN.v1',
      workspace_id: organization?.id,
      organization_id: organization?.organization_id,
      workspace_type: organization?.type,
      customer_id: customer?.id,
      customer_name: customer?.name || 'Walk-in Customer',
      line_items: cart.map(item => ({
        entity_id: item.id,
        product_name: item.name,
        sku: item.sku,
        category: item.category,
        metal_type: item.metal_type,
        stone_type: item.stone_type,
        quantity: item.quantity,
        unit_price: item.price,
        line_total: item.line_total
      })),
      subtotal: cartTotal,
      tax_amount: cartTax,
      total_amount: cartGrandTotal,
      payment_method: paymentMethod,
      transaction_date: new Date().toISOString(),
      is_sample_data: organization?.data_status === 'sample'
    }

    console.log('🏆 Processing Progressive Jewelry Transaction:', transactionData)
    
    // Save transaction to workspace
    if (workspace) {
      const storedData = localStorage.getItem(`hera_data_${organization?.organization_id}`) || '{}'
      const data = JSON.parse(storedData)
      data.transactions = data.transactions || []
      data.transactions.push(transactionData)
      
      // Update sales totals
      data.sales_today = (data.sales_today || 0) + cartGrandTotal
      data.total_sales = (data.total_sales || 0) + cartGrandTotal
      
      // Clear active cart
      data.active_cart = []
      data.cart_customer = null
      
      localStorage.setItem(`hera_data_${organization?.organization_id}`, JSON.stringify(data))
    }
    
    // Show transaction success
    setLastTransaction(transactionData)
    setTransactionComplete(true)
    
    // Clear cart and reset
    setCart([])
    setCustomer(null)
    setShowPayment(false)
  }

  const selectCustomer = (selectedCustomer: Customer) => {
    setCustomer(selectedCustomer)
    setShowCustomerModal(false)
  }

  const getRecommendations = () => {
    // AI-powered product recommendations based on cart contents
    if (cart.length === 0) return []
    
    const cartCategories = cart.map(item => item.category)
    return demoProducts
      .filter(product => !cart.find(item => item.id === product.id))
      .filter(product => 
        (cartCategories.includes('Engagement Rings') && product.category === 'Wedding Bands') ||
        (cartCategories.includes('Earrings') && product.category === 'Necklaces') ||
        product.ai_recommended
      )
      .slice(0, 3)
  }

  // Show loading state
  if (!workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center animate-pulse">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Setting up your jewelry POS...</p>
          <p className="text-sm text-gray-500 mt-2">Progressive workspace initializing</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      {/* Teams-Style Sidebar */}
      <JewelryTeamsSidebar />
      
      
      <div className="ml-16">
        <div className="flex min-h-screen">
        {/* Product Catalog - Left Side */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/jewelry-progressive')}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                  <Gem className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Jewelry POS</h1>
                  <p className="text-sm text-gray-500">
                    {isAnonymous ? 'Progressive workspace - try it free' : 'Premium Sales Experience'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-600">{organization?.organization_name}</p>
              <p className="text-xs text-gray-400">
                {organization?.type === 'anonymous' ? 'Anonymous Session' : 'Registered User'}
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search jewelry, SKU, or metal type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white min-w-[160px]"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <Card key={product.id} className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-white/90 backdrop-blur">
                <div className="p-4">
                  {/* Product Image Placeholder */}
                  <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                    <Gem className="w-12 h-12 text-gray-400" />
                    {product.ai_recommended && (
                      <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        AI Pick
                      </div>
                    )}
                    <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {product.sku}
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>{product.metal_type}</span>
                      {product.stone_type && (
                        <>
                          <span>•</span>
                          <span>{product.stone_type}</span>
                        </>
                      )}
                    </div>
                    {product.stone_weight && (
                      <p className="text-xs text-gray-500">{product.stone_weight}ct total weight</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl font-bold text-gray-900">${product.price.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{product.in_stock} in stock</p>
                      </div>
                      <Button
                        onClick={() => addToCart(product)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                        disabled={product.in_stock === 0}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* AI Recommendations */}
          {getRecommendations().length > 0 && (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">AI Recommendations</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {getRecommendations().map(product => (
                  <Card key={`rec-${product.id}`} className="p-4 bg-purple-50 border border-purple-200">
                    <div className="flex items-center gap-3">
                      <Gem className="w-8 h-8 text-purple-600" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                        <p className="text-purple-600 font-bold">${product.price.toLocaleString()}</p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => addToCart(product)}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        Add
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Shopping Cart - Right Side */}
        <div className="w-96 bg-white/90 backdrop-blur border-l border-gray-200 flex flex-col">
          {/* Cart Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Shopping Cart</h2>
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                {cart.length}
              </span>
            </div>

            {/* Customer Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Customer:</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowCustomerModal(true)}
                >
                  <User className="w-4 h-4 mr-1" />
                  {customer ? customer.name : 'Select Customer'}
                </Button>
              </div>
              {customer && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-purple-900">{customer.name}</p>
                      <p className="text-xs text-purple-600">{customer.loyalty_tier} • ${customer.total_spent.toLocaleString()} spent</p>
                    </div>
                    <Crown className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Cart is empty</p>
                <p className="text-sm text-gray-400 mt-2">Add jewelry items to start a sale</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <Card key={item.id} className="p-4 border-0 shadow-sm">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <h4 className="font-medium text-gray-900 text-sm pr-2">{item.name}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateQuantity(item.id, 0)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="text-xs text-gray-500">{item.sku}</div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 p-0"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 p-0"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">${item.line_total.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">${item.price.toLocaleString()} each</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <div className="border-t border-gray-100 p-6 space-y-4">
              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (8%):</span>
                  <span className="font-medium">${cartTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>${cartGrandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Payment Method:</label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={paymentMethod === 'card' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPaymentMethod('card')}
                    className="flex flex-col items-center py-3"
                  >
                    <CreditCard className="w-4 h-4 mb-1" />
                    <span className="text-xs">Card</span>
                  </Button>
                  <Button
                    variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPaymentMethod('cash')}
                    className="flex flex-col items-center py-3"
                  >
                    <Banknote className="w-4 h-4 mb-1" />
                    <span className="text-xs">Cash</span>
                  </Button>
                  <Button
                    variant={paymentMethod === 'layaway' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPaymentMethod('layaway')}
                    className="flex flex-col items-center py-3"
                  >
                    <Calculator className="w-4 h-4 mb-1" />
                    <span className="text-xs">Layaway</span>
                  </Button>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={processTransaction}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 py-3"
              >
                <Crown className="w-4 h-4 mr-2" />
                Process Sale - ${cartGrandTotal.toFixed(2)}
              </Button>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full bg-white">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">Select Customer</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCustomerModal(false)}
                >
                  ×
                </Button>
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => selectCustomer(null)}
                >
                  <User className="w-4 h-4 mr-2" />
                  Walk-in Customer
                </Button>
                
                {sampleCustomers.map(cust => (
                  <Button
                    key={cust.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => selectCustomer(cust)}
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    <div className="text-left">
                      <p className="font-medium">{cust.name}</p>
                      <p className="text-xs text-gray-500">{cust.loyalty_tier} • ${cust.total_spent.toLocaleString()}</p>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Transaction Complete Modal */}
      {transactionComplete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full bg-white">
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Transaction Complete!
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Transaction ID:</span>
                    <span className="font-mono">{lastTransaction?.smart_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span>{lastTransaction?.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment:</span>
                    <span className="capitalize">{lastTransaction?.payment_method}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>${lastTransaction?.total_amount?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {isAnonymous && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-purple-800">
                    ✨ This sale is saved in your progressive workspace! 
                    Save your work with an email to keep all your transactions.
                  </p>
                </div>
              )}

              <Button
                onClick={() => setTransactionComplete(false)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
              >
                Continue Shopping
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}