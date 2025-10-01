'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Smartphone,
  Tablet,
  ShoppingBag,
  CreditCard,
  Camera,
  QrCode,
  User,
  Star,
  Heart,
  Share2,
  Search,
  Filter,
  Grid,
  List,
  Plus,
  Minus,
  ShoppingCart,
  Bookmark,
  Eye,
  Zap,
  Wifi,
  Battery,
  Signal,
  Bell,
  Settings,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Download,
  Upload,
  RefreshCw,
  Home,
  Package,
  Users,
  BarChart3,
  TrendingUp,
  Award,
  Crown,
  Gem,
  Diamond,
  Sparkles,
  Scale,
  Tag,
  DollarSign,
  Percent,
  Info,
  AlertTriangle,
  CheckCircle,
  Target,
  Activity,
  Layers,
  Globe,
  Lock,
  Shield
} from 'lucide-react'
import '@/styles/jewelry-glassmorphism.css'

interface MobileProduct {
  id: string
  name: string
  category: string
  type: string
  metal: string
  purity: string
  weight: number
  stones: string[]
  price: number
  originalPrice?: number
  discount?: number
  images: string[]
  description: string
  inStock: boolean
  stockQuantity: number
  rating: number
  reviews: number
  featured: boolean
  isNew: boolean
  customizable: boolean
  certification?: string
  warranty: string
  tags: string[]
}

interface MobileCustomer {
  id: string
  name: string
  email: string
  phone: string
  avatar: string
  tier: 'standard' | 'gold' | 'platinum' | 'diamond'
  totalSpent: number
  purchaseHistory: number
  lastVisit: string
  preferences: string[]
  wishlist: string[]
  anniversaries: {
    type: string
    date: string
  }[]
}

interface CartItem {
  product: MobileProduct
  quantity: number
  customizations?: any
  personalEngraving?: string
  giftWrap?: boolean
  notes?: string
}

interface MobileOrder {
  id: string
  orderNumber: string
  customer: MobileCustomer
  items: CartItem[]
  subtotal: number
  tax: number
  total: number
  paymentMethod: string
  status: 'pending' | 'processing' | 'ready' | 'completed'
  createdAt: string
  notes?: string
}

export default function JewelryMobilePage() {
  const [currentView, setCurrentView] = useState<'home' | 'products' | 'customers' | 'cart' | 'orders' | 'settings'>('home')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<MobileProduct | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<MobileCustomer | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCustomerDetails, setShowCustomerDetails] = useState(false)
  const [showProductDetails, setShowProductDetails] = useState(false)

  // Mock data for mobile app
  const mobileProducts: MobileProduct[] = [
    {
      id: 'MP001',
      name: 'Royal Elegance Diamond Ring',
      category: 'rings',
      type: 'engagement',
      metal: 'Platinum',
      purity: '950',
      weight: 4.2,
      stones: ['1.5ct Diamond', '0.3ct Side Diamonds'],
      price: 285000,
      originalPrice: 325000,
      discount: 12,
      images: ['/jewelry/ring1.jpg', '/jewelry/ring1-2.jpg'],
      description: 'Exquisite platinum engagement ring featuring a brilliant 1.5-carat center diamond with accent stones.',
      inStock: true,
      stockQuantity: 3,
      rating: 4.9,
      reviews: 47,
      featured: true,
      isNew: false,
      customizable: true,
      certification: 'GIA Certified',
      warranty: '2 Year International Warranty',
      tags: ['engagement', 'platinum', 'diamond', 'luxury']
    },
    {
      id: 'MP002',
      name: 'Emerald Paradise Necklace',
      category: 'necklaces',
      type: 'statement',
      metal: '18K Gold',
      purity: '750',
      weight: 15.8,
      stones: ['5ct Emerald', 'Ruby Accents'],
      price: 425000,
      images: ['/jewelry/necklace1.jpg'],
      description: 'Stunning emerald and ruby statement necklace in 18K gold, perfect for special occasions.',
      inStock: true,
      stockQuantity: 1,
      rating: 5.0,
      reviews: 23,
      featured: true,
      isNew: true,
      customizable: false,
      certification: 'AIGS Certified',
      warranty: 'Lifetime Craftsmanship Warranty',
      tags: ['emerald', 'gold', 'statement', 'luxury']
    },
    {
      id: 'MP003',
      name: 'Classic Pearl Earrings',
      category: 'earrings',
      type: 'studs',
      metal: '14K Gold',
      purity: '585',
      weight: 3.1,
      stones: ['8mm Pearls'],
      price: 45000,
      images: ['/jewelry/earrings1.jpg'],
      description: 'Timeless pearl stud earrings in 14K gold, suitable for everyday elegance.',
      inStock: true,
      stockQuantity: 12,
      rating: 4.7,
      reviews: 156,
      featured: false,
      isNew: false,
      customizable: true,
      warranty: '1 Year Warranty',
      tags: ['pearls', 'classic', 'everyday', 'gold']
    },
    {
      id: 'MP004',
      name: 'Sapphire Tennis Bracelet',
      category: 'bracelets',
      type: 'tennis',
      metal: 'White Gold',
      purity: '750',
      weight: 12.5,
      stones: ['Blue Sapphires', 'Diamonds'],
      price: 195000,
      images: ['/jewelry/bracelet1.jpg'],
      description: 'Elegant tennis bracelet featuring alternating blue sapphires and diamonds in white gold.',
      inStock: true,
      stockQuantity: 5,
      rating: 4.8,
      reviews: 89,
      featured: false,
      isNew: false,
      customizable: true,
      certification: 'Ceylon Sapphires',
      warranty: '2 Year Warranty',
      tags: ['sapphire', 'tennis', 'white gold', 'luxury']
    }
  ]

  const mobileCustomers: MobileCustomer[] = [
    {
      id: 'MC001',
      name: 'Priya Sharma',
      email: 'priya.sharma@email.com',
      phone: '+91 98765 43210',
      avatar: '/avatars/priya.jpg',
      tier: 'diamond',
      totalSpent: 1250000,
      purchaseHistory: 15,
      lastVisit: '2024-01-15',
      preferences: ['diamonds', 'platinum', 'contemporary'],
      wishlist: ['MP001', 'MP004'],
      anniversaries: [
        { type: 'Wedding', date: '2024-03-15' },
        { type: 'Birthday', date: '2024-07-22' }
      ]
    },
    {
      id: 'MC002',
      name: 'Rajesh Gupta',
      email: 'rajesh.gupta@email.com',
      phone: '+91 87654 32109',
      avatar: '/avatars/rajesh.jpg',
      tier: 'platinum',
      totalSpent: 850000,
      purchaseHistory: 8,
      lastVisit: '2024-01-12',
      preferences: ['gold', 'traditional', 'gemstones'],
      wishlist: ['MP002'],
      anniversaries: [
        { type: 'Anniversary', date: '2024-05-10' }
      ]
    },
    {
      id: 'MC003',
      name: 'Anita Mehta',
      email: 'anita.mehta@email.com',
      phone: '+91 76543 21098',
      avatar: '/avatars/anita.jpg',
      tier: 'gold',
      totalSpent: 325000,
      purchaseHistory: 5,
      lastVisit: '2024-01-10',
      preferences: ['pearls', 'silver', 'minimalist'],
      wishlist: ['MP003'],
      anniversaries: [
        { type: 'Birthday', date: '2024-09-05' }
      ]
    }
  ]

  const categories = [
    { value: 'all', label: 'All Items', icon: Grid },
    { value: 'rings', label: 'Rings', icon: Crown },
    { value: 'necklaces', label: 'Necklaces', icon: Gem },
    { value: 'earrings', label: 'Earrings', icon: Diamond },
    { value: 'bracelets', label: 'Bracelets', icon: Sparkles }
  ]

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'diamond': return 'from-purple-400 to-purple-600'
      case 'platinum': return 'from-gray-300 to-gray-500'
      case 'gold': return 'from-yellow-400 to-yellow-600'
      default: return 'from-blue-400 to-blue-600'
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'diamond': return <Diamond size={16} />
      case 'platinum': return <Award size={16} />
      case 'gold': return <Crown size={16} />
      default: return <Star size={16} />
    }
  }

  const formatCurrency = (amount: number) => {
    return `¹${amount.toLocaleString()}`
  }

  const addToCart = (product: MobileProduct) => {
    const existingItem = cart.find(item => item.product.id === product.id)
    if (existingItem) {
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { product, quantity: 1 }])
    }
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else {
      setCart(cart.map(item => 
        item.product.id === productId 
          ? { ...item, quantity }
          : item
      ))
    }
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0)
  }

  const filteredProducts = mobileProducts.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen jewelry-gradient-premium">
      <div className="jewelry-glass-backdrop min-h-screen">
        <div className="w-full max-w-md mx-auto min-h-screen bg-white/95 backdrop-blur-xl relative">
          
          {/* Mobile Status Bar */}
          <div className="flex items-center justify-between p-3 bg-jewelry-blue-900 text-white">
            <div className="flex items-center space-x-1">
              <Signal size={14} />
              <Wifi size={14} />
            </div>
            <div className="text-sm font-medium">9:41 AM</div>
            <div className="flex items-center space-x-1">
              <Battery size={14} />
              <span className="text-xs">85%</span>
            </div>
          </div>

          {/* Mobile Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-jewelry-blue-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Smartphone className="jewelry-icon-gold" size={24} />
                <div>
                  <h1 className="jewelry-text-luxury font-bold text-lg">Jewelry Mobile</h1>
                  <p className="jewelry-text-muted text-xs">Sales Assistant</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="jewelry-btn-ghost p-2">
                  <Bell className="jewelry-icon-gold" size={18} />
                </button>
                <button className="jewelry-btn-ghost p-2">
                  <Settings className="jewelry-icon-gold" size={18} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Navigation Tabs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex bg-white/90 border-b border-jewelry-blue-200 overflow-x-auto"
          >
            {[
              { key: 'home', label: 'Home', icon: Home },
              { key: 'products', label: 'Products', icon: Package },
              { key: 'customers', label: 'Customers', icon: Users },
              { key: 'cart', label: 'Cart', icon: ShoppingCart },
              { key: 'orders', label: 'Orders', icon: BarChart3 }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setCurrentView(tab.key as any)}
                className={`flex-1 flex flex-col items-center py-3 px-2 text-xs font-medium transition-all ${
                  currentView === tab.key
                    ? 'text-jewelry-blue-900 border-b-2 border-jewelry-gold-500'
                    : 'text-jewelry-blue-600'
                }`}
              >
                <tab.icon size={18} className="mb-1" />
                {tab.label}
                {tab.key === 'cart' && cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>
            ))}
          </motion.div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto pb-20">
            
            {/* Home View */}
            {currentView === 'home' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="p-4 space-y-6"
              >
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="jewelry-glass-card p-4 text-center">
                    <TrendingUp className="mx-auto mb-2 jewelry-icon-gold" size={24} />
                    <h3 className="jewelry-text-high-contrast text-lg font-bold">¹2.4M</h3>
                    <p className="jewelry-text-muted text-xs">Today's Sales</p>
                  </div>
                  <div className="jewelry-glass-card p-4 text-center">
                    <Users className="mx-auto mb-2 jewelry-icon-gold" size={24} />
                    <h3 className="jewelry-text-high-contrast text-lg font-bold">42</h3>
                    <p className="jewelry-text-muted text-xs">Customers</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="jewelry-text-luxury font-semibold mb-3">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setCurrentView('products')}
                      className="jewelry-glass-card p-4 text-center jewelry-scale-hover"
                    >
                      <Package className="mx-auto mb-2 jewelry-icon-gold" size={24} />
                      <span className="jewelry-text-high-contrast text-sm font-medium">Browse Products</span>
                    </button>
                    <button 
                      onClick={() => setCurrentView('customers')}
                      className="jewelry-glass-card p-4 text-center jewelry-scale-hover"
                    >
                      <Users className="mx-auto mb-2 jewelry-icon-gold" size={24} />
                      <span className="jewelry-text-high-contrast text-sm font-medium">Find Customer</span>
                    </button>
                    <button className="jewelry-glass-card p-4 text-center jewelry-scale-hover">
                      <QrCode className="mx-auto mb-2 jewelry-icon-gold" size={24} />
                      <span className="jewelry-text-high-contrast text-sm font-medium">Scan QR</span>
                    </button>
                    <button className="jewelry-glass-card p-4 text-center jewelry-scale-hover">
                      <Camera className="mx-auto mb-2 jewelry-icon-gold" size={24} />
                      <span className="jewelry-text-high-contrast text-sm font-medium">Take Photo</span>
                    </button>
                  </div>
                </div>

                {/* Featured Products */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="jewelry-text-luxury font-semibold">Featured Today</h3>
                    <button 
                      onClick={() => setCurrentView('products')}
                      className="jewelry-text-muted text-sm flex items-center"
                    >
                      View All <ChevronRight size={14} className="ml-1" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {mobileProducts.filter(p => p.featured).slice(0, 2).map((product) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="jewelry-glass-card p-3 flex items-center space-x-3"
                      >
                        <div className="w-16 h-16 bg-gradient-to-br from-jewelry-blue-100 to-jewelry-blue-200 rounded-lg flex items-center justify-center">
                          <Gem className="jewelry-icon-gold" size={24} />
                        </div>
                        <div className="flex-1">
                          <h4 className="jewelry-text-high-contrast font-semibold text-sm">{product.name}</h4>
                          <p className="jewelry-text-muted text-xs">{product.category}</p>
                          <div className="flex items-center mt-1">
                            <span className="jewelry-text-luxury font-bold text-sm">{formatCurrency(product.price)}</span>
                            {product.discount && (
                              <span className="jewelry-text-muted text-xs line-through ml-2">
                                {formatCurrency(product.originalPrice!)}
                              </span>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={() => addToCart(product)}
                          className="jewelry-btn-primary p-2"
                        >
                          <Plus size={16} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Products View */}
            {currentView === 'products' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                {/* Search & Filters */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 jewelry-icon-muted" size={16} />
                      <input
                        type="text"
                        placeholder="Search jewelry..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-jewelry-blue-200 rounded-lg jewelry-text-high-contrast text-sm"
                      />
                    </div>
                    <button 
                      onClick={() => setShowFilters(!showFilters)}
                      className="jewelry-btn-secondary p-2"
                    >
                      <Filter size={16} />
                    </button>
                    <button 
                      onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                      className="jewelry-btn-secondary p-2"
                    >
                      {viewMode === 'grid' ? <List size={16} /> : <Grid size={16} />}
                    </button>
                  </div>

                  {/* Categories */}
                  <div className="flex space-x-2 overflow-x-auto">
                    {categories.map((category) => (
                      <button
                        key={category.value}
                        onClick={() => setSelectedCategory(category.value)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                          selectedCategory === category.value
                            ? 'jewelry-btn-primary'
                            : 'jewelry-btn-secondary'
                        }`}
                      >
                        <category.icon size={14} />
                        <span>{category.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Products Grid/List */}
                <div className="px-4">
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 gap-3">
                      {filteredProducts.map((product) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          className="jewelry-glass-card jewelry-scale-hover"
                        >
                          <div className="relative">
                            <div className="aspect-square bg-gradient-to-br from-jewelry-blue-100 to-jewelry-blue-200 rounded-t-lg flex items-center justify-center">
                              <Gem className="jewelry-icon-gold" size={32} />
                            </div>
                            {product.isNew && (
                              <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                                New
                              </span>
                            )}
                            {product.discount && (
                              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                                -{product.discount}%
                              </span>
                            )}
                            <button className="absolute bottom-2 right-2 bg-white/90 p-1 rounded-full">
                              <Heart size={14} className="jewelry-icon-muted" />
                            </button>
                          </div>
                          <div className="p-3">
                            <h4 className="jewelry-text-high-contrast font-semibold text-xs mb-1 line-clamp-2">
                              {product.name}
                            </h4>
                            <div className="flex items-center mb-2">
                              <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} size={10} fill={i < Math.floor(product.rating) ? 'currentColor' : 'none'} />
                                ))}
                              </div>
                              <span className="jewelry-text-muted text-xs ml-1">({product.reviews})</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="jewelry-text-luxury font-bold text-sm">{formatCurrency(product.price)}</span>
                                {product.originalPrice && (
                                  <span className="jewelry-text-muted text-xs line-through block">
                                    {formatCurrency(product.originalPrice)}
                                  </span>
                                )}
                              </div>
                              <button 
                                onClick={() => addToCart(product)}
                                className="jewelry-btn-primary p-1"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredProducts.map((product) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3 }}
                          className="jewelry-glass-card p-3 flex items-center space-x-3"
                        >
                          <div className="w-16 h-16 bg-gradient-to-br from-jewelry-blue-100 to-jewelry-blue-200 rounded-lg flex items-center justify-center">
                            <Gem className="jewelry-icon-gold" size={24} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="jewelry-text-high-contrast font-semibold text-sm">{product.name}</h4>
                                <p className="jewelry-text-muted text-xs">{product.category} " {product.metal}</p>
                                <div className="flex items-center mt-1">
                                  <div className="flex text-yellow-400">
                                    {[...Array(5)].map((_, i) => (
                                      <Star key={i} size={10} fill={i < Math.floor(product.rating) ? 'currentColor' : 'none'} />
                                    ))}
                                  </div>
                                  <span className="jewelry-text-muted text-xs ml-1">({product.reviews})</span>
                                </div>
                              </div>
                              <button 
                                onClick={() => addToCart(product)}
                                className="jewelry-btn-primary p-2"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <div>
                                <span className="jewelry-text-luxury font-bold text-sm">{formatCurrency(product.price)}</span>
                                {product.originalPrice && (
                                  <span className="jewelry-text-muted text-xs line-through ml-2">
                                    {formatCurrency(product.originalPrice)}
                                  </span>
                                )}
                              </div>
                              <span className={`text-xs px-2 py-1 rounded ${
                                product.inStock ? 'jewelry-status-active' : 'jewelry-status-inactive'
                              }`}>
                                {product.inStock ? `${product.stockQuantity} in stock` : 'Out of stock'}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Customers View */}
            {currentView === 'customers' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="p-4 space-y-4"
              >
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 jewelry-icon-muted" size={16} />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    className="w-full pl-10 pr-4 py-2 border border-jewelry-blue-200 rounded-lg jewelry-text-high-contrast text-sm"
                  />
                </div>

                {/* Customers List */}
                <div className="space-y-3">
                  {mobileCustomers.map((customer) => (
                    <motion.div
                      key={customer.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      onClick={() => {
                        setSelectedCustomer(customer)
                        setShowCustomerDetails(true)
                      }}
                      className="jewelry-glass-card p-4 jewelry-scale-hover cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-jewelry-blue-100 to-jewelry-blue-200 rounded-full flex items-center justify-center">
                          <User className="jewelry-icon-gold" size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="jewelry-text-high-contrast font-semibold text-sm">{customer.name}</h4>
                            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full bg-gradient-to-r ${getTierColor(customer.tier)} text-white text-xs`}>
                              {getTierIcon(customer.tier)}
                              <span className="capitalize">{customer.tier}</span>
                            </div>
                          </div>
                          <p className="jewelry-text-muted text-xs">{customer.email}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="jewelry-text-luxury font-semibold text-sm">
                              {formatCurrency(customer.totalSpent)}
                            </span>
                            <span className="jewelry-text-muted text-xs">
                              {customer.purchaseHistory} purchases
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Cart View */}
            {currentView === 'cart' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="p-4 space-y-4"
              >
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="mx-auto mb-4 jewelry-icon-muted" size={48} />
                    <h3 className="jewelry-text-high-contrast font-semibold mb-2">Cart is Empty</h3>
                    <p className="jewelry-text-muted text-sm mb-4">Add products to get started</p>
                    <button 
                      onClick={() => setCurrentView('products')}
                      className="jewelry-btn-primary px-6 py-2"
                    >
                      Browse Products
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Cart Items */}
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <motion.div
                          key={item.product.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3 }}
                          className="jewelry-glass-card p-3 flex items-center space-x-3"
                        >
                          <div className="w-16 h-16 bg-gradient-to-br from-jewelry-blue-100 to-jewelry-blue-200 rounded-lg flex items-center justify-center">
                            <Gem className="jewelry-icon-gold" size={24} />
                          </div>
                          <div className="flex-1">
                            <h4 className="jewelry-text-high-contrast font-semibold text-sm">{item.product.name}</h4>
                            <p className="jewelry-text-muted text-xs">{item.product.category}</p>
                            <p className="jewelry-text-luxury font-bold text-sm">{formatCurrency(item.product.price)}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="w-8 h-8 rounded-full bg-jewelry-blue-100 flex items-center justify-center"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="jewelry-text-high-contrast font-semibold text-sm w-8 text-center">
                              {item.quantity}
                            </span>
                            <button 
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="w-8 h-8 rounded-full bg-jewelry-blue-100 flex items-center justify-center"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Cart Summary */}
                    <div className="jewelry-glass-card p-4 space-y-3">
                      <h3 className="jewelry-text-luxury font-semibold">Order Summary</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="jewelry-text-muted">Subtotal:</span>
                          <span className="jewelry-text-high-contrast">{formatCurrency(getCartTotal())}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="jewelry-text-muted">Tax (3%):</span>
                          <span className="jewelry-text-high-contrast">{formatCurrency(getCartTotal() * 0.03)}</span>
                        </div>
                        <div className="border-t border-jewelry-blue-200 pt-2">
                          <div className="flex justify-between font-bold">
                            <span className="jewelry-text-luxury">Total:</span>
                            <span className="jewelry-text-luxury text-lg">{formatCurrency(getCartTotal() * 1.03)}</span>
                          </div>
                        </div>
                      </div>
                      <button className="w-full jewelry-btn-primary py-3 flex items-center justify-center space-x-2">
                        <CreditCard size={18} />
                        <span>Proceed to Checkout</span>
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* Orders View */}
            {currentView === 'orders' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="p-4 space-y-4"
              >
                <div className="text-center py-12">
                  <BarChart3 className="mx-auto mb-4 jewelry-icon-muted" size={48} />
                  <h3 className="jewelry-text-high-contrast font-semibold mb-2">Orders & Analytics</h3>
                  <p className="jewelry-text-muted text-sm">View sales performance and order history</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Customer Details Modal */}
          {showCustomerDetails && selectedCustomer && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/50 flex items-end z-50"
              onClick={() => setShowCustomerDetails(false)}
            >
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full bg-white rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="jewelry-text-luxury font-bold text-lg">Customer Details</h3>
                  <button 
                    onClick={() => setShowCustomerDetails(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Customer Header */}
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-jewelry-blue-100 to-jewelry-blue-200 rounded-full flex items-center justify-center">
                      <User className="jewelry-icon-gold" size={24} />
                    </div>
                    <div className="flex-1">
                      <h4 className="jewelry-text-high-contrast font-bold text-lg">{selectedCustomer.name}</h4>
                      <div className={`flex items-center space-x-1 px-3 py-1 rounded-full bg-gradient-to-r ${getTierColor(selectedCustomer.tier)} text-white text-sm w-fit`}>
                        {getTierIcon(selectedCustomer.tier)}
                        <span className="capitalize">{selectedCustomer.tier} Member</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="jewelry-glass-card p-4 space-y-3">
                    <h5 className="jewelry-text-luxury font-semibold">Contact Information</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <Mail size={16} className="jewelry-icon-muted" />
                        <span className="jewelry-text-high-contrast">{selectedCustomer.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone size={16} className="jewelry-icon-muted" />
                        <span className="jewelry-text-high-contrast">{selectedCustomer.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Purchase Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="jewelry-glass-card p-4 text-center">
                      <DollarSign className="mx-auto mb-2 jewelry-icon-gold" size={24} />
                      <h4 className="jewelry-text-high-contrast font-bold">{formatCurrency(selectedCustomer.totalSpent)}</h4>
                      <p className="jewelry-text-muted text-xs">Total Spent</p>
                    </div>
                    <div className="jewelry-glass-card p-4 text-center">
                      <ShoppingBag className="mx-auto mb-2 jewelry-icon-gold" size={24} />
                      <h4 className="jewelry-text-high-contrast font-bold">{selectedCustomer.purchaseHistory}</h4>
                      <p className="jewelry-text-muted text-xs">Purchases</p>
                    </div>
                  </div>

                  {/* Preferences */}
                  <div className="jewelry-glass-card p-4">
                    <h5 className="jewelry-text-luxury font-semibold mb-3">Preferences</h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedCustomer.preferences.map((pref, index) => (
                        <span key={index} className="px-3 py-1 bg-jewelry-blue-100 text-jewelry-blue-900 text-xs rounded-full">
                          {pref}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Anniversaries */}
                  <div className="jewelry-glass-card p-4">
                    <h5 className="jewelry-text-luxury font-semibold mb-3">Important Dates</h5>
                    <div className="space-y-2">
                      {selectedCustomer.anniversaries.map((anniversary, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Calendar size={16} className="jewelry-icon-muted" />
                            <span className="jewelry-text-high-contrast text-sm">{anniversary.type}</span>
                          </div>
                          <span className="jewelry-text-muted text-sm">{anniversary.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button className="jewelry-btn-secondary py-3 flex items-center justify-center space-x-2">
                      <Phone size={16} />
                      <span>Call</span>
                    </button>
                    <button className="jewelry-btn-primary py-3 flex items-center justify-center space-x-2">
                      <ShoppingBag size={16} />
                      <span>Start Sale</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}