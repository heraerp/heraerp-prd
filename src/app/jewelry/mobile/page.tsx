'use client'

import React, { useState, useCallback, useMemo, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import {
  Search,
  Grid,
  List,
  Plus,
  Minus,
  ShoppingCart,
  User,
  Star,
  Heart,
  Package,
  Users,
  CreditCard,
  Bell,
  Crown,
  Diamond,
  Award,
  Sparkles,
  Eye,
  ShoppingBag,
  Gem,
  Filter,
  X,
  Loader2
} from 'lucide-react'
import '@/styles/jewelry-glassmorphism.css'

// Lazy load heavy components
const ProductDetailModal = dynamic(() => import('@/app/jewelry/mobile/components/ProductDetailModal'), {
  loading: () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-3xl p-8">
        <Loader2 className="h-8 w-8 animate-spin jewelry-text-gold mx-auto" />
      </div>
    </div>
  )
})

const PaymentReceiptModal = dynamic(() => import('@/app/jewelry/mobile/components/PaymentReceiptModal'), {
  loading: () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-3xl p-8">
        <Loader2 className="h-8 w-8 animate-spin jewelry-text-gold mx-auto" />
      </div>
    </div>
  )
})

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="h-6 w-6 animate-spin jewelry-text-gold" />
  </div>
)

interface MobileProduct {
  id: string
  name: string
  category: string
  price: number
  image: string
  specifications: {
    metal: string
    purity: string
    weight: string
    stones?: string
    size?: string
  }
  inventory: {
    inStock: boolean
    quantity: number
    location: string
  }
  certification?: {
    lab: string
    number: string
    grade?: string
  }
  rating: number
  reviews: number
}

interface MobileCustomer {
  id: string
  name: string
  phone: string
  email?: string
  vipTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
  totalSpent: number
  lastPurchase?: string
  preferences: {
    metals: string[]
    styles: string[]
    priceRange: { min: number; max: number }
  }
}

interface CartItem {
  product: MobileProduct
  quantity: number
  notes?: string
  customizations?: {
    engraving?: string
    sizing?: string
    modifications?: string
  }
}

interface MobileOrder {
  id: string
  customer: MobileCustomer
  items: CartItem[]
  subtotal: number
  tax: number
  total: number
  paymentMethod: string
  status: 'pending' | 'processing' | 'completed'
  timestamp: string
}

export default function JewelryMobilePage() {
  const [activeTab, setActiveTab] = useState<'browse' | 'customers' | 'cart' | 'sales'>('browse')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<MobileCustomer | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<MobileProduct | null>(null)
  const [showPaymentReceipt, setShowPaymentReceipt] = useState(false)
  const [lastOrder, setLastOrder] = useState<MobileOrder | null>(null)
  const [isProcessingOrder, setIsProcessingOrder] = useState(false)
  const [isChangingTab, setIsChangingTab] = useState(false)

  // Sample data with high-quality jewelry images
  const products: MobileProduct[] = [
    {
      id: '1',
      name: 'Diamond Solitaire Ring',
      category: 'rings',
      price: 8500,
      image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop&crop=center',
      specifications: {
        metal: '18K White Gold',
        purity: '750',
        weight: '3.2g',
        stones: '1.2ct Round Diamond',
        size: '6.5'
      },
      inventory: {
        inStock: true,
        quantity: 1,
        location: 'Display Case A'
      },
      certification: {
        lab: 'GIA',
        number: 'GIA-1234567',
        grade: 'VS1, G'
      },
      rating: 4.9,
      reviews: 127
    },
    {
      id: '2',
      name: 'Pearl Drop Earrings',
      category: 'earrings',
      price: 1250,
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop&crop=center',
      specifications: {
        metal: '14K Yellow Gold',
        purity: '585',
        weight: '4.1g',
        stones: 'Tahitian Pearls'
      },
      inventory: {
        inStock: true,
        quantity: 3,
        location: 'Display Case B'
      },
      rating: 4.7,
      reviews: 89
    },
    {
      id: '3',
      name: 'Tennis Bracelet',
      category: 'bracelets',
      price: 12500,
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop&crop=center',
      specifications: {
        metal: 'Platinum',
        purity: '950',
        weight: '15.3g',
        stones: '5.0ct Total Diamond Weight'
      },
      inventory: {
        inStock: false,
        quantity: 0,
        location: 'Vault'
      },
      rating: 5.0,
      reviews: 203
    },
    {
      id: '4',
      name: 'Emerald Pendant Necklace',
      category: 'necklaces',
      price: 3750,
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop&crop=center',
      specifications: {
        metal: '18K Yellow Gold',
        purity: '750',
        weight: '8.7g',
        stones: '2.5ct Colombian Emerald'
      },
      inventory: {
        inStock: true,
        quantity: 2,
        location: 'Display Case C'
      },
      certification: {
        lab: 'AGL',
        number: 'AGL-987654',
        grade: 'Natural'
      },
      rating: 4.8,
      reviews: 156
    },
    {
      id: '5',
      name: 'Vintage Wedding Band',
      category: 'rings',
      price: 2200,
      image: 'https://images.unsplash.com/photo-1544376664-80b17f09d399?w=400&h=400&fit=crop&crop=center',
      specifications: {
        metal: '14K Rose Gold',
        purity: '585',
        weight: '2.8g',
        stones: 'Vintage Cut Diamonds'
      },
      inventory: {
        inStock: true,
        quantity: 5,
        location: 'Display Case A'
      },
      rating: 4.6,
      reviews: 94
    },
    {
      id: '6',
      name: 'Sapphire Stud Earrings',
      category: 'earrings',
      price: 4250,
      image: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400&h=400&fit=crop&crop=center',
      specifications: {
        metal: 'Platinum',
        purity: '950',
        weight: '3.1g',
        stones: '2.0ct Blue Sapphires'
      },
      inventory: {
        inStock: true,
        quantity: 1,
        location: 'Display Case B'
      },
      certification: {
        lab: 'GRS',
        number: 'GRS-456789',
        grade: 'Royal Blue'
      },
      rating: 4.9,
      reviews: 78
    }
  ]

  const customers: MobileCustomer[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      phone: '+1 (555) 123-4567',
      email: 'sarah@email.com',
      vipTier: 'Gold',
      totalSpent: 25000,
      lastPurchase: '2024-01-15',
      preferences: {
        metals: ['18K Gold', 'Platinum'],
        styles: ['Classic', 'Vintage'],
        priceRange: { min: 5000, max: 20000 }
      }
    },
    {
      id: '2',
      name: 'Michael Chen',
      phone: '+1 (555) 987-6543',
      vipTier: 'Platinum',
      totalSpent: 45000,
      lastPurchase: '2024-01-10',
      preferences: {
        metals: ['Platinum', 'White Gold'],
        styles: ['Modern', 'Contemporary'],
        priceRange: { min: 10000, max: 50000 }
      }
    }
  ]

  const categories = [
    { id: 'all', name: 'All Items', icon: Grid },
    { id: 'rings', name: 'Rings', icon: Diamond },
    { id: 'necklaces', name: 'Necklaces', icon: Sparkles },
    { id: 'earrings', name: 'Earrings', icon: Star },
    { id: 'bracelets', name: 'Bracelets', icon: Crown },
    { id: 'watches', name: 'Watches', icon: Award }
  ]

  // Memoized filtered products for performance
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch = product.name.toLowerCase().includes(searchLower) ||
                           product.specifications.metal.toLowerCase().includes(searchLower) ||
                           (product.specifications.stones && product.specifications.stones.toLowerCase().includes(searchLower))
      return matchesCategory && matchesSearch
    })
  }, [products, selectedCategory, searchQuery])

  // Memoized cart calculations
  const { cartTotal, cartCount } = useMemo(() => {
    const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
    const count = cart.reduce((sum, item) => sum + item.quantity, 0)
    return { cartTotal: total, cartCount: count }
  }, [cart])

  // Optimized cart functions with useCallback
  const addToCart = useCallback((product: MobileProduct, quantity: number = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id)
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      } else {
        return [...prevCart, { product, quantity }]
      }
    })
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId))
  }, [])

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else {
      setCart(prevCart => prevCart.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      ))
    }
  }, [removeFromCart])

  // Fast tab switching with loading state
  const handleTabChange = useCallback((newTab: 'browse' | 'customers' | 'cart' | 'sales') => {
    setIsChangingTab(true)
    setActiveTab(newTab)
    // Small delay to show loading state, then quickly switch
    setTimeout(() => setIsChangingTab(false), 100)
  }, [])

  const processOrder = useCallback(async () => {
    if (!selectedCustomer || cart.length === 0 || isProcessingOrder) return

    setIsProcessingOrder(true)

    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      const order: MobileOrder = {
        id: `ORD-${Date.now()}`,
        customer: selectedCustomer,
        items: cart,
        subtotal: cartTotal,
        tax: cartTotal * 0.08,
        total: cartTotal * 1.08,
        paymentMethod: 'Card',
        status: 'completed',
        timestamp: new Date().toISOString()
      }

      console.log('Processing order:', order)
      setLastOrder(order)
      setCart([])
      setSelectedCustomer(null)
      setShowPaymentReceipt(true)
    } catch (error) {
      console.error('Order processing failed:', error)
    } finally {
      setIsProcessingOrder(false)
    }
  }, [selectedCustomer, cart, cartTotal, isProcessingOrder])

  return (
    <div className="min-h-screen jewelry-gradient-luxury">
      {/* Mobile App Container */}
      <div className="w-full max-w-md mx-auto min-h-screen jewelry-glass-card relative overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-50 jewelry-glass-navbar backdrop-blur-xl border-b border-jewelry-gold-200/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                className="jewelry-crown-glow p-2 rounded-xl bg-gradient-to-r from-jewelry-gold-400 to-jewelry-gold-600"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Crown className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-lg font-bold jewelry-text-royal">HERA Mobile</h1>
                <p className="text-xs jewelry-text-muted">Jewelry Sales Pro</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button 
                className="jewelry-glass-btn p-2 rounded-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Bell className="h-5 w-5 jewelry-text-royal" />
              </motion.button>
              <div className="relative">
                <motion.button 
                  className="jewelry-glass-btn p-2 rounded-lg"
                  onClick={() => setActiveTab('cart')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ShoppingCart className="h-5 w-5 jewelry-text-royal" />
                  <AnimatePresence>
                    {cartCount > 0 && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1 -right-1 bg-gradient-to-r from-jewelry-gold-500 to-jewelry-gold-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg"
                      >
                        {cartCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 pb-20 relative">
          {/* Loading Overlay */}
          {isChangingTab && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin jewelry-text-gold mx-auto mb-2" />
                <p className="text-sm jewelry-text-muted">Loading...</p>
              </div>
            </div>
          )}

          {/* Browse Products Tab */}
          {activeTab === 'browse' && (
            <div className="p-4 space-y-6">
              {/* Search Bar */}
              <motion.div 
                className="relative"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 jewelry-text-muted" />
                <input
                  type="text"
                  placeholder="Search diamonds, rings, necklaces..."
                  className="w-full pl-12 pr-4 py-4 jewelry-glass-input rounded-2xl border-0 jewelry-text-royal placeholder:jewelry-text-muted focus:outline-none focus:ring-2 focus:ring-jewelry-gold-400 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </motion.div>

              {/* Category Filters */}
              <motion.div 
                className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {categories.map((category, index) => {
                  const IconComponent = category.icon
                  return (
                    <motion.button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                        selectedCategory === category.id
                          ? 'bg-gradient-to-r from-jewelry-gold-400 to-jewelry-gold-600 text-white shadow-lg'
                          : 'jewelry-glass-btn jewelry-text-royal hover:bg-jewelry-gold-100'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span className="text-sm font-medium">{category.name}</span>
                    </motion.button>
                  )
                })}
              </motion.div>

              {/* View Mode Toggle & Results */}
              <motion.div 
                className="flex items-center justify-between"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-lg font-bold jewelry-text-royal">
                  {filteredProducts.length} Premium Items
                </h2>
                <div className="flex items-center jewelry-glass-btn rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-jewelry-gold-400 text-white' : 'jewelry-text-royal'}`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-jewelry-gold-400 text-white' : 'jewelry-text-royal'}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>

              {/* Products Grid */}
              <div className="grid grid-cols-2 gap-4">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="jewelry-glass-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
                    whileHover={{ y: -5 }}
                  >
                    <div className="aspect-square bg-gradient-to-br from-jewelry-cream to-jewelry-blue-50 relative group overflow-hidden">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                        sizes="(max-width: 768px) 50vw, 33vw"
                        priority={index < 4}
                        placeholder="blur"
                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                      />
                      
                      {/* Action Buttons */}
                      <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.button 
                          className="jewelry-glass-btn p-2 rounded-full shadow-lg"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Heart className="h-4 w-4 jewelry-text-royal" />
                        </motion.button>
                        <motion.button 
                          className="jewelry-glass-btn p-2 rounded-full shadow-lg"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setSelectedProduct(product)}
                        >
                          <Eye className="h-4 w-4 jewelry-text-royal" />
                        </motion.button>
                      </div>
                      
                      {/* Stock Status */}
                      {!product.inventory.inStock && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <motion.span 
                            className="text-white font-semibold px-3 py-1 bg-red-500 rounded-full text-xs"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            Out of Stock
                          </motion.span>
                        </div>
                      )}
                      
                      {/* Quick Add Button */}
                      {product.inventory.inStock && (
                        <motion.button
                          onClick={() => addToCart(product)}
                          className="absolute bottom-3 left-3 right-3 bg-gradient-to-r from-jewelry-gold-400 to-jewelry-gold-600 text-white py-2 px-4 rounded-xl font-medium text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          initial={{ y: 20 }}
                          animate={{ y: 0 }}
                        >
                          <Plus className="h-4 w-4 inline mr-2" />
                          Add to Cart
                        </motion.button>
                      )}
                    </div>
                    
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-bold jewelry-text-royal text-sm leading-tight mb-1">
                          {product.name}
                        </h3>
                        <p className="jewelry-text-muted text-xs">
                          {product.specifications.metal}
                        </p>
                      </div>
                      
                      {/* Rating */}
                      <div className="flex items-center gap-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-3 w-3 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'jewelry-text-muted'}`} 
                            />
                          ))}
                        </div>
                        <span className="text-xs jewelry-text-muted">({product.reviews})</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="jewelry-text-gold font-bold text-lg">
                          ${product.price.toLocaleString()}
                        </span>
                        {product.certification && (
                          <div className="flex items-center gap-1">
                            <Award className="h-3 w-3 jewelry-text-gold" />
                            <span className="text-xs jewelry-text-muted font-medium">{product.certification.lab}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <div className="p-4 space-y-4">
              <h2 className="text-lg font-semibold jewelry-text-royal">Customers</h2>
              
              <div className="space-y-3">
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className={`jewelry-glass-card rounded-xl p-4 cursor-pointer transition-all ${
                      selectedCustomer?.id === customer.id ? 'ring-2 ring-jewelry-gold-400' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="jewelry-crown-glow p-2 rounded-full">
                          <User className="h-5 w-5 jewelry-text-gold" />
                        </div>
                        <div>
                          <h3 className="font-semibold jewelry-text-royal">{customer.name}</h3>
                          <p className="jewelry-text-muted text-sm">{customer.phone}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          customer.vipTier === 'Platinum' ? 'bg-gray-800 text-white' :
                          customer.vipTier === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                          customer.vipTier === 'Silver' ? 'bg-gray-100 text-gray-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {customer.vipTier}
                        </div>
                        <p className="jewelry-text-muted text-xs mt-1">
                          ${customer.totalSpent.toLocaleString()} spent
                        </p>
                      </div>
                    </div>
                    
                    {selectedCustomer?.id === customer.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 pt-3 border-t border-white/20 space-y-2"
                      >
                        <div>
                          <p className="text-xs jewelry-text-muted mb-1">Preferred Metals:</p>
                          <div className="flex gap-1 flex-wrap">
                            {customer.preferences.metals.map((metal) => (
                              <span
                                key={metal}
                                className="text-xs jewelry-text-muted bg-white/5 px-2 py-1 rounded-md"
                              >
                                {metal}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs jewelry-text-muted mb-1">Price Range:</p>
                          <span className="text-xs jewelry-text-muted">
                            ${customer.preferences.priceRange.min.toLocaleString()} - ${customer.preferences.priceRange.max.toLocaleString()}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cart Tab */}
          {activeTab === 'cart' && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold jewelry-text-royal">Shopping Cart</h2>
                <span className="jewelry-text-muted text-sm">{cartCount} items</span>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 jewelry-text-muted mx-auto mb-4" />
                  <p className="jewelry-text-muted">Your cart is empty</p>
                  <button
                    onClick={() => setActiveTab('browse')}
                    className="mt-4 jewelry-gradient-gold text-white px-6 py-2 rounded-xl font-medium"
                  >
                    Browse Products
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.product.id} className="jewelry-glass-card rounded-xl p-4">
                      <div className="flex gap-3">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-jewelry-blue-50 to-jewelry-blue-100">
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                            placeholder="blur"
                            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold jewelry-text-royal text-sm">
                            {item.product.name}
                          </h3>
                          <p className="jewelry-text-muted text-xs">
                            {item.product.specifications.metal}
                          </p>
                          <p className="jewelry-text-gold font-bold mt-1">
                            ${item.product.price.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                            className="jewelry-glass-btn p-1 rounded"
                          >
                            <Minus className="h-4 w-4 jewelry-text-royal" />
                          </button>
                          <span className="w-8 text-center jewelry-text-royal font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                            className="jewelry-glass-btn p-1 rounded"
                          >
                            <Plus className="h-4 w-4 jewelry-text-royal" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Cart Summary */}
                  <div className="jewelry-glass-card rounded-xl p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="jewelry-text-muted">Subtotal:</span>
                      <span className="jewelry-text-royal font-semibold">
                        ${cartTotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="jewelry-text-muted">Tax (8%):</span>
                      <span className="jewelry-text-royal font-semibold">
                        ${(cartTotal * 0.08).toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t border-white/20 pt-3 flex justify-between">
                      <span className="jewelry-text-royal font-bold">Total:</span>
                      <span className="jewelry-text-gold font-bold text-lg">
                        ${(cartTotal * 1.08).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Customer Selection */}
                  {!selectedCustomer ? (
                    <button
                      onClick={() => setActiveTab('customers')}
                      className="w-full jewelry-glass-card rounded-xl p-4 text-center"
                    >
                      <User className="h-5 w-5 jewelry-text-royal mx-auto mb-2" />
                      <span className="jewelry-text-royal font-medium">Select Customer</span>
                    </button>
                  ) : (
                    <div className="jewelry-glass-card rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="jewelry-text-royal font-medium">{selectedCustomer.name}</p>
                          <p className="jewelry-text-muted text-sm">{selectedCustomer.vipTier} Member</p>
                        </div>
                        <button
                          onClick={() => setSelectedCustomer(null)}
                          className="jewelry-text-muted text-sm underline"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Checkout Button */}
                  <button
                    onClick={processOrder}
                    disabled={!selectedCustomer || isProcessingOrder}
                    className="w-full jewelry-gradient-gold text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessingOrder ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : selectedCustomer ? (
                      'Process Order'
                    ) : (
                      'Select Customer to Continue'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Sales Tab */}
          {activeTab === 'sales' && (
            <div className="p-4 space-y-4">
              <h2 className="text-lg font-semibold jewelry-text-royal">Today's Sales</h2>
              
              {/* Sales Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="jewelry-glass-card rounded-xl p-4 text-center">
                  <div className="jewelry-crown-glow p-2 rounded-xl w-fit mx-auto mb-2">
                    <ShoppingBag className="h-5 w-5 jewelry-text-gold" />
                  </div>
                  <p className="jewelry-text-royal font-bold text-xl">12</p>
                  <p className="jewelry-text-muted text-xs">Transactions</p>
                </div>
                <div className="jewelry-glass-card rounded-xl p-4 text-center">
                  <div className="jewelry-crown-glow p-2 rounded-xl w-fit mx-auto mb-2">
                    <CreditCard className="h-5 w-5 jewelry-text-gold" />
                  </div>
                  <p className="jewelry-text-royal font-bold text-xl">$47.2K</p>
                  <p className="jewelry-text-muted text-xs">Revenue</p>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="space-y-3">
                <h3 className="font-semibold jewelry-text-royal">Recent Transactions</h3>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="jewelry-glass-card rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="jewelry-crown-glow p-2 rounded-full">
                          <Diamond className="h-4 w-4 jewelry-text-gold" />
                        </div>
                        <div>
                          <p className="jewelry-text-royal font-medium text-sm">
                            Order #{1000 + i}
                          </p>
                          <p className="jewelry-text-muted text-xs">
                            {i === 1 ? 'Sarah Johnson' : i === 2 ? 'Michael Chen' : 'Emma Davis'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="jewelry-text-gold font-bold">
                          ${(8500 + i * 1000).toLocaleString()}
                        </p>
                        <p className="jewelry-text-muted text-xs">
                          {i === 1 ? '2 min ago' : i === 2 ? '15 min ago' : '1 hour ago'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 jewelry-glass-navbar backdrop-blur-xl border-t border-jewelry-gold-200/30 px-4 py-2">
          <div className="grid grid-cols-4 gap-1">
            {[
              { id: 'browse', icon: Gem, label: 'Browse' },
              { id: 'customers', icon: Users, label: 'Customers' },
              { id: 'cart', icon: ShoppingCart, label: 'Cart' },
              { id: 'sales', icon: CreditCard, label: 'Sales' }
            ].map((tab) => {
              const IconComponent = tab.icon
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as any)}
                  className={`relative flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-jewelry-gold-400 to-jewelry-gold-600 text-white shadow-lg'
                      : 'jewelry-text-royal hover:bg-jewelry-gold-100/50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isChangingTab}
                >
                  <IconComponent className="h-5 w-5" />
                  <span className="text-xs font-medium">{tab.label}</span>
                  {tab.id === 'cart' && cartCount > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Lazy-loaded Modals */}
        <Suspense fallback={null}>
          {selectedProduct && (
            <ProductDetailModal
              product={selectedProduct}
              onClose={() => setSelectedProduct(null)}
              onAddToCart={(product) => {
                addToCart(product)
                setSelectedProduct(null)
              }}
            />
          )}
        </Suspense>

        <Suspense fallback={null}>
          {showPaymentReceipt && lastOrder && (
            <PaymentReceiptModal
              order={lastOrder}
              onClose={() => setShowPaymentReceipt(false)}
            />
          )}
        </Suspense>
      </div>
    </div>
  )
}