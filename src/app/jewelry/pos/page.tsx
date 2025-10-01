'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { 
  ShoppingCart, Package, Search, Plus, Minus, X, 
  CreditCard, DollarSign, Receipt, User, Star,
  Calculator, Percent, Tag, Gift, Crown, Diamond,
  Sparkles, RefreshCw, Trash2, Edit, Eye, Check,
  Calendar, Clock, MapPin, Phone
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAction } from '@/lib/ui-binder'
import { getEffectiveGoldRate } from '@/lib/jewelry/rates'
import { useOrgId } from '@/lib/runtime/useOrgId'
import '@/styles/jewelry-glassmorphism.css'

interface CartItem {
  id: string
  name: string
  sku: string
  price: number
  quantity: number
  category: string
  image?: string
  purity?: string
  weight?: number
  makingCharges?: number
  stoneValue?: number
}

interface PaymentMethod {
  id: string
  name: string
  icon: React.ElementType
  enabled: boolean
}

interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  vipStatus?: boolean
}

export default function JewelryPOSPage() {
  const orgId = useOrgId()
  const { executeAction } = useAction()
  
  // Cart and transaction state
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [discountPercent, setDiscountPercent] = useState(0)
  const [taxPercent, setTaxPercent] = useState(5)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [currentGoldRate, setCurrentGoldRate] = useState(0)
  
  // POS View Mode
  const [viewMode, setViewMode] = useState<'retail' | 'gold'>('retail')
  
  // Receipt Modal State
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [lastTransaction, setLastTransaction] = useState<{
    id: string
    date: string
    customer: Customer
    items: CartItem[]
    subtotal: number
    discount: number
    tax: number
    total: number
    paymentMethod: string
  } | null>(null)

  // Sample jewelry items for retail mode
  const [retailItems] = useState<CartItem[]>([
    {
      id: '1',
      name: 'Diamond Solitaire Ring',
      sku: 'DSR-001',
      price: 12500.00,
      quantity: 1,
      category: 'Rings',
      image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop&crop=center',
      purity: '18K',
      weight: 3.2,
      makingCharges: 800,
      stoneValue: 5000
    },
    {
      id: '2', 
      name: 'Gold Tennis Bracelet',
      sku: 'GTB-045',
      price: 8750.00,
      quantity: 1,
      category: 'Bracelets',
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop&crop=center',
      purity: '14K',
      weight: 15.5,
      makingCharges: 1200,
      stoneValue: 0
    },
    {
      id: '3',
      name: 'Pearl Necklace Set',
      sku: 'PNS-123',
      price: 4200.00,
      quantity: 1,
      category: 'Necklaces',
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop&crop=center',
      purity: 'Sterling Silver',
      weight: 25.0,
      makingCharges: 400,
      stoneValue: 1800
    },
    {
      id: '4',
      name: 'Emerald Earrings',
      sku: 'EE-078',
      price: 6800.00,
      quantity: 1,
      category: 'Earrings',
      image: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400&h=400&fit=crop&crop=center',
      purity: '18K',
      weight: 4.8,
      makingCharges: 600,
      stoneValue: 3200
    },
    {
      id: '5',
      name: 'Luxury Watch Collection',
      sku: 'LWC-200',
      price: 25000.00,
      quantity: 1,
      category: 'Watches',
      image: 'https://images.unsplash.com/photo-1523170335258-f5c6c6bd6eaf?w=400&h=400&fit=crop&crop=center',
      purity: 'Platinum',
      weight: 120.0,
      makingCharges: 2500,
      stoneValue: 8000
    },
    {
      id: '6',
      name: 'Sapphire Pendant',
      sku: 'SP-099',
      price: 3500.00,
      quantity: 1,
      category: 'Pendants',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop&crop=center',
      purity: '14K',
      weight: 2.1,
      makingCharges: 300,
      stoneValue: 1200
    }
  ])

  // Sample customers
  const [customers] = useState<Customer[]>([
    { id: '1', name: 'Sarah Johnson', phone: '+971 50 123 4567', email: 'sarah@email.com', vipStatus: true },
    { id: '2', name: 'Ahmed Al-Rashid', phone: '+971 55 987 6543', email: 'ahmed@email.com', vipStatus: false },
    { id: '3', name: 'Maria Rodriguez', phone: '+971 52 456 7890', email: 'maria@email.com', vipStatus: true }
  ])

  const categories = ['All', 'Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Watches', 'Pendants']

  const paymentMethods: PaymentMethod[] = [
    { id: 'cash', name: 'Cash Payment', icon: DollarSign, enabled: true },
    { id: 'card', name: 'Credit/Debit Card', icon: CreditCard, enabled: true },
    { id: 'bank', name: 'Bank Transfer', icon: Receipt, enabled: true },
    { id: 'installment', name: 'Installment Plan', icon: Calculator, enabled: true }
  ]

  // Load current gold rate
  useEffect(() => {
    (async () => {
      try {
        const rate = await getEffectiveGoldRate(orgId, new Date().toISOString(), 22)
        setCurrentGoldRate(rate?.rate_per_gram || 0)
      } catch (error) {
        console.error('Failed to load gold rate:', error)
      }
    })()
  }, [orgId])

  const filteredItems = retailItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const addToCart = (item: CartItem) => {
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

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId))
  }

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId)
    } else {
      setCart(cart.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ))
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const discountAmount = subtotal * (discountPercent / 100)
  const discountedSubtotal = subtotal - discountAmount
  const taxAmount = discountedSubtotal * (taxPercent / 100)
  const total = discountedSubtotal + taxAmount

  const clearCart = () => {
    setCart([])
    setDiscountPercent(0)
    setSelectedCustomer(null)
  }

  const completeSale = async () => {
    try {
      if (cart.length === 0) {
        alert('Cart is empty')
        return
      }

      if (!selectedCustomer) {
        alert('Please select a customer')
        return
      }

      // Create transaction record
      const transaction = {
        id: `TXN-${Date.now()}`,
        date: new Date().toISOString(),
        customer: selectedCustomer,
        items: cart,
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        total,
        paymentMethod: 'Credit Card'
      }

      // Store transaction
      setLastTransaction(transaction)
      
      // Show receipt modal
      setShowReceiptModal(true)
      
      // Clear cart
      clearCart()
    } catch (error) {
      console.error('Sale failed:', error)
      alert('Sale failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen jewelry-gradient-premium">
      <div className="jewelry-glass-backdrop min-h-screen">
        <div className="w-full max-w-7xl mx-auto p-6">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="jewelry-heading text-4xl font-bold flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                    className="jewelry-crown-glow p-3 rounded-xl"
                  >
                    <ShoppingCart className="h-8 w-8 jewelry-icon-gold" />
                  </motion.div>
                  Enterprise POS System
                </h1>
                <p className="jewelry-text-luxury mt-2 text-lg">
                  Professional point of sale for luxury jewelry retail
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                {/* View Mode Toggle */}
                <div className="jewelry-glass-card p-1 flex rounded-lg">
                  <Button
                    variant={viewMode === 'retail' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('retail')}
                    className={viewMode === 'retail' ? 'jewelry-btn-primary' : 'jewelry-btn-secondary'}
                  >
                    <Package className="h-4 w-4 mr-1" />
                    Retail
                  </Button>
                  <Button
                    variant={viewMode === 'gold' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('gold')}
                    className={viewMode === 'gold' ? 'jewelry-btn-primary' : 'jewelry-btn-secondary'}
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    Gold Trade
                  </Button>
                </div>

                <div className="jewelry-glass-card p-4">
                  <div className="text-center">
                    <p className="jewelry-text-high-contrast text-2xl font-bold">
                      ${total.toLocaleString()}
                    </p>
                    <p className="jewelry-text-muted text-sm">Cart Total</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="jewelry-glass-card p-4 text-center">
              <ShoppingCart className="mx-auto mb-2 jewelry-icon-gold" size={24} />
              <h3 className="jewelry-text-high-contrast text-2xl font-bold">{cart.length}</h3>
              <p className="jewelry-text-muted text-sm">Items in Cart</p>
            </div>
            
            <div className="jewelry-glass-card p-4 text-center">
              <DollarSign className="mx-auto mb-2 jewelry-icon-gold" size={24} />
              <h3 className="jewelry-text-high-contrast text-2xl font-bold">${currentGoldRate.toFixed(0)}</h3>
              <p className="jewelry-text-muted text-sm">Gold Rate/gram</p>
            </div>
            
            <div className="jewelry-glass-card p-4 text-center">
              <User className="mx-auto mb-2 jewelry-icon-gold" size={24} />
              <h3 className="jewelry-text-high-contrast text-2xl font-bold">{customers.length}</h3>
              <p className="jewelry-text-muted text-sm">Active Customers</p>
            </div>
            
            <div className="jewelry-glass-card p-4 text-center">
              <Star className="mx-auto mb-2 jewelry-icon-gold" size={24} />
              <h3 className="jewelry-text-high-contrast text-2xl font-bold">4.9</h3>
              <p className="jewelry-text-muted text-sm">Customer Rating</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Product Catalog */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Search and Filter Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="jewelry-glass-panel p-6"
              >
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 jewelry-text-muted" />
                    <Input
                      type="text"
                      placeholder="Search jewelry items by name or SKU..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 jewelry-glass-input"
                    />
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                        className={selectedCategory === category ? "jewelry-btn-primary" : "jewelry-btn-secondary"}
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Product Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
              >
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index }}
                    className="jewelry-glass-card p-4 group"
                  >
                    <div className="space-y-3">
                      {/* Item Image */}
                      <div className="jewelry-crown-glow aspect-square rounded-lg bg-gradient-to-br from-yellow-500/10 to-yellow-600/20 relative overflow-hidden group">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            placeholder="blur"
                            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                          />
                        ) : (
                          <Package className="h-12 w-12 jewelry-icon-gold" />
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge variant="outline" className="text-xs bg-white/80 backdrop-blur-sm">
                            {item.category}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Item Details */}
                      <div className="space-y-2">
                        <h3 className="jewelry-text-high-contrast font-bold text-sm group-hover:jewelry-text-gold transition-colors">
                          {item.name}
                        </h3>
                        
                        <p className="jewelry-text-muted text-xs">SKU: {item.sku}</p>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3 jewelry-icon-gold" />
                            <span className="jewelry-text-muted">{item.purity}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Diamond className="h-3 w-3 jewelry-icon-gold" />
                            <span className="jewelry-text-muted">{item.weight}g</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="jewelry-text-gold font-bold text-lg">
                              ${item.price.toLocaleString()}
                            </span>
                            {item.makingCharges && (
                              <p className="jewelry-text-muted text-xs">
                                + ${item.makingCharges} making
                              </p>
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => addToCart(item)}
                            className="jewelry-btn-primary"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {filteredItems.length === 0 && (
                <div className="jewelry-glass-panel text-center py-12">
                  <Package className="h-16 w-16 jewelry-text-muted mx-auto mb-4" />
                  <h3 className="jewelry-text-luxury text-xl font-semibold mb-2">
                    No items found
                  </h3>
                  <p className="jewelry-text-muted">
                    Try adjusting your search terms or browse different categories.
                  </p>
                </div>
              )}
            </div>

            {/* Shopping Cart & Checkout */}
            <div className="space-y-6">
              
              {/* Customer Selection */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="jewelry-glass-panel"
              >
                <div className="p-6">
                  <h3 className="jewelry-text-luxury text-lg font-semibold mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 jewelry-icon-gold" />
                    Customer Selection
                  </h3>
                  
                  <Select value={selectedCustomer?.id || ''} onValueChange={(value) => {
                    const customer = customers.find(c => c.id === value)
                    setSelectedCustomer(customer || null)
                  }}>
                    <SelectTrigger className="jewelry-glass-input">
                      <SelectValue placeholder="Select or add customer" />
                    </SelectTrigger>
                    <SelectContent className="jewelry-glass-dropdown">
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <div className="flex items-center gap-2">
                            <span>{customer.name}</span>
                            {customer.vipStatus && (
                              <Crown className="h-3 w-3 jewelry-icon-gold" />
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedCustomer && (
                    <div className="mt-3 p-3 jewelry-glass-card">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="jewelry-text-high-contrast font-medium">
                            {selectedCustomer.name}
                          </p>
                          <p className="jewelry-text-muted text-sm">
                            {selectedCustomer.phone}
                          </p>
                        </div>
                        {selectedCustomer.vipStatus && (
                          <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
                            <Crown className="h-3 w-3 mr-1" />
                            VIP
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
              
              {/* Cart Items */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="jewelry-glass-panel-strong"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="jewelry-text-luxury text-xl font-semibold flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 jewelry-icon-gold" />
                      Shopping Cart ({cart.length})
                    </h2>
                    {cart.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearCart}
                        className="jewelry-btn-secondary"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {cart.length === 0 ? (
                      <div className="text-center py-8">
                        <ShoppingCart className="h-12 w-12 jewelry-text-muted mx-auto mb-3" />
                        <p className="jewelry-text-muted">Cart is empty</p>
                        <p className="jewelry-text-muted text-sm">Add items to start a sale</p>
                      </div>
                    ) : (
                      cart.map((item) => (
                        <div key={item.id} className="jewelry-glass-card p-4">
                          <div className="flex items-start gap-3">
                            <div className="jewelry-crown-glow p-2 rounded-lg">
                              <Package className="h-6 w-6 jewelry-icon-gold" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="jewelry-text-high-contrast font-medium text-sm">
                                {item.name}
                              </h4>
                              <p className="jewelry-text-muted text-xs">
                                ${item.price.toLocaleString()} each
                              </p>
                              <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  
                                  <span className="jewelry-text-high-contrast font-medium w-8 text-center">
                                    {item.quantity}
                                  </span>
                                  
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                                
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeFromCart(item.id)}
                                  className="h-7 w-7 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <span className="jewelry-text-gold font-bold">
                                ${(item.price * item.quantity).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Discount & Tax */}
              {cart.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="jewelry-glass-panel"
                >
                  <div className="p-6">
                    <h3 className="jewelry-text-luxury text-lg font-semibold mb-4 flex items-center gap-2">
                      <Calculator className="h-5 w-5 jewelry-icon-gold" />
                      Adjustments
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Percent className="h-4 w-4 jewelry-text-muted" />
                        <Input
                          type="number"
                          placeholder="Discount %"
                          value={discountPercent}
                          onChange={(e) => setDiscountPercent(Number(e.target.value) || 0)}
                          className="jewelry-glass-input"
                          min="0"
                          max="100"
                        />
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Tag className="h-4 w-4 jewelry-text-muted" />
                        <Input
                          type="number"
                          placeholder="Tax %"
                          value={taxPercent}
                          onChange={(e) => setTaxPercent(Number(e.target.value) || 0)}
                          className="jewelry-glass-input"
                          min="0"
                          max="50"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Order Summary */}
              {cart.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className="jewelry-glass-panel-strong"
                >
                  <div className="p-6">
                    <h3 className="jewelry-text-luxury text-lg font-semibold mb-4">
                      Order Summary
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="jewelry-text-muted">Subtotal:</span>
                        <span className="jewelry-text-high-contrast font-medium">
                          ${subtotal.toLocaleString()}
                        </span>
                      </div>
                      
                      {discountPercent > 0 && (
                        <div className="flex justify-between">
                          <span className="jewelry-text-muted">Discount ({discountPercent}%):</span>
                          <span className="text-red-500 font-medium">
                            -${discountAmount.toLocaleString()}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span className="jewelry-text-muted">Tax ({taxPercent}%):</span>
                        <span className="jewelry-text-high-contrast font-medium">
                          ${taxAmount.toLocaleString()}
                        </span>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex justify-between">
                        <span className="jewelry-text-luxury text-lg font-semibold">Total:</span>
                        <span className="jewelry-text-gold text-xl font-bold">
                          ${total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Payment Methods */}
              {cart.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="jewelry-glass-panel"
                >
                  <div className="p-6">
                    <h3 className="jewelry-text-luxury text-lg font-semibold mb-4 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 jewelry-icon-gold" />
                      Payment Method
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-3 mb-6">
                      {paymentMethods.map((method) => {
                        const Icon = method.icon
                        return (
                          <Button
                            key={method.id}
                            variant="outline"
                            className="jewelry-btn-secondary p-4 h-auto justify-start"
                            disabled={!method.enabled}
                          >
                            <Icon className="h-5 w-5 mr-3 jewelry-icon-gold" />
                            {method.name}
                          </Button>
                        )
                      })}
                    </div>
                    
                    <Button 
                      onClick={completeSale}
                      className="w-full jewelry-btn-primary py-4 text-lg font-semibold"
                      size="lg"
                      disabled={cart.length === 0}
                    >
                      <Receipt className="h-5 w-5 mr-2" />
                      Complete Sale - ${total.toLocaleString()}
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceiptModal && lastTransaction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowReceiptModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl overflow-hidden max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Receipt Header */}
              <div className="bg-gradient-to-r from-jewelry-gold-400 to-jewelry-gold-600 text-white p-6 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Receipt className="h-8 w-8" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">Sale Completed!</h2>
                <p className="text-white/90">Thank you for your business</p>
              </div>

              {/* Receipt Details */}
              <div className="p-6 space-y-6">
                {/* Transaction Info */}
                <div className="text-center border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold jewelry-text-royal">Transaction #{lastTransaction.id}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(lastTransaction.date).toLocaleDateString()} at {' '}
                    {new Date(lastTransaction.date).toLocaleTimeString(undefined, { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>

                {/* Customer Info */}
                <div className="jewelry-glass-card p-4 rounded-xl">
                  <h4 className="font-semibold jewelry-text-royal mb-2">Customer Information</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-jewelry-gold-400 to-jewelry-gold-600 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <span className="font-medium jewelry-text-royal block">{lastTransaction.customer.name}</span>
                      <span className="text-sm text-gray-600">{lastTransaction.customer.phone}</span>
                      {lastTransaction.customer.vipStatus && (
                        <div className="flex items-center gap-2 mt-1">
                          <Crown className="h-3 w-3 jewelry-icon-gold" />
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            VIP Member
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  <h4 className="font-semibold jewelry-text-royal">Items Purchased</h4>
                  {lastTransaction.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 jewelry-glass-card p-3 rounded-xl">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                            placeholder="blur"
                            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                          />
                        ) : (
                          <Package className="h-6 w-6 jewelry-icon-gold m-3" />
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="font-medium jewelry-text-royal block text-sm">{item.name}</span>
                        <span className="text-xs text-gray-600">{item.purity} • {item.weight}g</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium jewelry-text-royal block">${item.price.toLocaleString()}</span>
                        <span className="text-xs text-gray-600">Qty: {item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Payment Summary */}
                <div className="jewelry-glass-card p-4 rounded-xl space-y-3">
                  <h4 className="font-semibold jewelry-text-royal">Payment Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="jewelry-text-royal font-medium">${lastTransaction.subtotal.toLocaleString()}</span>
                    </div>
                    {lastTransaction.discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Discount</span>
                        <span className="text-red-500 font-medium">-${lastTransaction.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax ({taxPercent}%)</span>
                      <span className="jewelry-text-royal font-medium">${lastTransaction.tax.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between">
                      <span className="font-semibold jewelry-text-royal">Total</span>
                      <span className="font-bold jewelry-text-gold text-lg">${lastTransaction.total.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                    <CreditCard className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Paid with {lastTransaction.paymentMethod}</span>
                    <span className="text-sm font-medium text-green-600 ml-auto">✓ Completed</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    className="flex-1 jewelry-glass-btn py-4 rounded-xl font-medium jewelry-text-royal hover:bg-jewelry-gold-100 transition-colors"
                    onClick={() => {
                      window.print()
                    }}
                  >
                    <Package className="h-5 w-5 inline mr-2" />
                    Print Receipt
                  </button>
                  <button
                    onClick={() => setShowReceiptModal(false)}
                    className="flex-1 bg-gradient-to-r from-jewelry-gold-400 to-jewelry-gold-600 text-white py-4 rounded-xl font-medium hover:from-jewelry-gold-500 hover:to-jewelry-gold-700 transition-all shadow-lg"
                  >
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
