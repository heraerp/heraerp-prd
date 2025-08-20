'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/DualAuthProvider'
import { EnterpriseRetailSolutionSidebar } from '@/components/enterprise-retail-progressive/EnterpriseRetailSolutionSidebar'
import { UniversalTourProvider, TourElement } from '@/components/tours/SimpleTourProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  ShoppingCart, 
  Search, 
  Plus,
  Minus,
  X,
  CreditCard,
  DollarSign,
  Receipt,
  User,
  Package,
  Percent,
  Clock,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Eye,
  Edit3,
  Calculator,
  Star,
  Gift,
  Tag,
  Phone,
  Mail,
  MapPin,
  Camera,
  Smartphone,
  Wifi,
  Bluetooth,
  Zap,
  TrendingUp,
  Users,
  BarChart3,
  Heart,
  Settings,
  Printer,
  RefreshCw,
  Filter,
  Grid3X3,
  List,
  QrCode,
  Scan,
  Target,
  Award,
  Crown,
  Sparkles,
  Coffee,
  Shirt,
  Watch,
  Headphones,
  Monitor,
  Battery,
  Volume2,
  MousePointer,
  Keyboard
} from 'lucide-react'

// Enterprise POS Sample Data with Real Product Catalog
const samplePOSData = {
  products: [
    // Electronics Category
    {
      id: 'PROD001',
      name: 'iPhone 15 Pro Max',
      sku: 'ELEC-IP15-PM-256',
      barcode: '194253000000',
      category: 'Electronics',
      subcategory: 'Smartphones',
      brand: 'Apple',
      price: 1199.00,
      cost: 899.00,
      margin: 25.0,
      stock: 45,
      image: '📱',
      description: 'Latest iPhone with ProRes video recording',
      tax_rate: 8.5,
      color: 'Natural Titanium',
      size: '256GB',
      weight: '221g',
      supplier: 'Apple Distribution',
      ai_insights: {
        popularity_score: 9.2,
        upsell_potential: 8.5,
        seasonal_trend: 'high',
        recommended_accessories: ['PROD007', 'PROD008']
      }
    },
    {
      id: 'PROD002',
      name: 'MacBook Pro 14"',
      sku: 'ELEC-MBP-14-512',
      barcode: '194253000001',
      category: 'Electronics',
      subcategory: 'Laptops',
      brand: 'Apple',
      price: 1999.00,
      cost: 1499.00,
      margin: 25.0,
      stock: 12,
      image: '💻',
      description: 'M3 Pro chip, 14-inch display, 512GB SSD',
      tax_rate: 8.5,
      color: 'Space Gray',
      size: '512GB',
      weight: '1.6kg',
      supplier: 'Apple Distribution',
      ai_insights: {
        popularity_score: 8.8,
        upsell_potential: 9.2,
        seasonal_trend: 'medium',
        recommended_accessories: ['PROD009', 'PROD010']
      }
    },
    {
      id: 'PROD003',
      name: 'AirPods Pro (3rd Gen)',
      sku: 'ELEC-APP-PRO3',
      barcode: '194253000002',
      category: 'Electronics',
      subcategory: 'Audio',
      brand: 'Apple',
      price: 249.00,
      cost: 179.00,
      margin: 28.1,
      stock: 78,
      image: '🎧',
      description: 'Active Noise Cancellation, USB-C',
      tax_rate: 8.5,
      color: 'White',
      size: 'Standard',
      weight: '56g',
      supplier: 'Apple Distribution',
      ai_insights: {
        popularity_score: 9.5,
        upsell_potential: 7.8,
        seasonal_trend: 'high',
        recommended_accessories: ['PROD007']
      }
    },
    // Fashion Category
    {
      id: 'PROD004',
      name: 'Premium Leather Jacket',
      sku: 'FASH-LJ-BLK-L',
      barcode: '194253000003',
      category: 'Fashion',
      subcategory: 'Outerwear',
      brand: 'Urban Style',
      price: 299.99,
      cost: 149.99,
      margin: 50.0,
      stock: 23,
      image: '🧥',
      description: 'Genuine leather, modern cut, premium quality',
      tax_rate: 8.5,
      color: 'Black',
      size: 'Large',
      weight: '1.2kg',
      supplier: 'Fashion Forward Inc',
      ai_insights: {
        popularity_score: 7.2,
        upsell_potential: 6.5,
        seasonal_trend: 'high',
        recommended_accessories: ['PROD011', 'PROD012']
      }
    },
    {
      id: 'PROD005',
      name: 'Designer Denim Jeans',
      sku: 'FASH-DJ-BLU-32',
      barcode: '194253000004',
      category: 'Fashion',
      subcategory: 'Bottoms',
      brand: 'Denim Co',
      price: 89.99,
      cost: 44.99,
      margin: 50.0,
      stock: 56,
      image: '👖',
      description: 'Slim fit, premium denim, comfortable stretch',
      tax_rate: 8.5,
      color: 'Blue',
      size: '32W x 32L',
      weight: '0.6kg',
      supplier: 'Fashion Forward Inc',
      ai_insights: {
        popularity_score: 8.1,
        upsell_potential: 7.2,
        seasonal_trend: 'medium',
        recommended_accessories: ['PROD004', 'PROD013']
      }
    },
    {
      id: 'PROD006',
      name: 'Athletic Sneakers',
      sku: 'FASH-AS-WHT-10',
      barcode: '194253000005',
      category: 'Fashion',
      subcategory: 'Footwear',
      brand: 'SportMax',
      price: 129.99,
      cost: 64.99,
      margin: 50.0,
      stock: 34,
      image: '👟',
      description: 'Breathable mesh, memory foam sole, all-day comfort',
      tax_rate: 8.5,
      color: 'White',
      size: '10 US',
      weight: '0.8kg',
      supplier: 'Athletic Wear Ltd',
      ai_insights: {
        popularity_score: 8.9,
        upsell_potential: 6.8,
        seasonal_trend: 'high',
        recommended_accessories: ['PROD014']
      }
    },
    // Accessories Category
    {
      id: 'PROD007',
      name: 'Phone Case Pro Max',
      sku: 'ACC-PC-CLR',
      barcode: '194253000006',
      category: 'Accessories',
      subcategory: 'Phone Cases',
      brand: 'ProtectTech',
      price: 29.99,
      cost: 12.99,
      margin: 56.7,
      stock: 125,
      image: '📱💎',
      description: 'Crystal clear, drop protection, wireless charging compatible',
      tax_rate: 8.5,
      color: 'Clear',
      size: 'iPhone 15 Pro Max',
      weight: '45g',
      supplier: 'Mobile Accessories Inc',
      ai_insights: {
        popularity_score: 9.0,
        upsell_potential: 9.8,
        seasonal_trend: 'stable',
        recommended_accessories: ['PROD008']
      }
    },
    {
      id: 'PROD008',
      name: 'Wireless Charger Stand',
      sku: 'ACC-WC-BLK',
      barcode: '194253000007',
      category: 'Accessories',
      subcategory: 'Chargers',
      brand: 'ChargeFast',
      price: 49.99,
      cost: 24.99,
      margin: 50.0,
      stock: 67,
      image: '⚡',
      description: '15W fast charging, adjustable stand, LED indicator',
      tax_rate: 8.5,
      color: 'Black',
      size: 'Universal',
      weight: '320g',
      supplier: 'Mobile Accessories Inc',
      ai_insights: {
        popularity_score: 8.3,
        upsell_potential: 8.9,
        seasonal_trend: 'stable',
        recommended_accessories: ['PROD001', 'PROD007']
      }
    }
  ],
  customers: [
    {
      id: 'CUST001',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1 (555) 123-4567',
      loyalty_points: 1250,
      membership_tier: 'Gold',
      total_purchases: 4850.75,
      last_visit: '2024-08-07',
      preferred_categories: ['Electronics', 'Fashion'],
      ai_profile: {
        spending_pattern: 'premium',
        visit_frequency: 'monthly',
        price_sensitivity: 'low',
        recommendation_score: 9.2
      }
    },
    {
      id: 'CUST002',
      name: 'Michael Chen',
      email: 'michael.chen@email.com',
      phone: '+1 (555) 234-5678',
      loyalty_points: 890,
      membership_tier: 'Silver',
      total_purchases: 2340.50,
      last_visit: '2024-08-05',
      preferred_categories: ['Electronics', 'Accessories'],
      ai_profile: {
        spending_pattern: 'value_seeker',
        visit_frequency: 'bi_weekly',
        price_sensitivity: 'medium',
        recommendation_score: 7.8
      }
    },
    {
      id: 'CUST003',
      name: 'Emma Rodriguez',
      email: 'emma.rodriguez@email.com',
      phone: '+1 (555) 345-6789',
      loyalty_points: 2150,
      membership_tier: 'Platinum',
      total_purchases: 7890.25,
      last_visit: '2024-08-08',
      preferred_categories: ['Fashion', 'Accessories'],
      ai_profile: {
        spending_pattern: 'luxury',
        visit_frequency: 'weekly',
        price_sensitivity: 'very_low',
        recommendation_score: 9.8
      }
    }
  ],
  promotions: [
    {
      id: 'PROMO001',
      name: 'Tech Bundle Deal',
      type: 'bundle',
      description: 'Buy iPhone + AirPods, get 15% off',
      discount_percent: 15,
      applicable_products: ['PROD001', 'PROD003'],
      active: true,
      expires: '2024-08-31'
    },
    {
      id: 'PROMO002',
      name: 'Fashion Friday',
      type: 'category',
      description: '20% off all Fashion items',
      discount_percent: 20,
      applicable_categories: ['Fashion'],
      active: true,
      expires: '2024-08-16'
    },
    {
      id: 'PROMO003',
      name: 'Loyalty Bonus',
      type: 'customer_tier',
      description: 'Extra 10% for Gold+ members',
      discount_percent: 10,
      applicable_tiers: ['Gold', 'Platinum'],
      active: true,
      expires: '2024-09-30'
    }
  ],
  paymentMethods: [
    { id: 'cash', name: 'Cash', icon: '💵', enabled: true },
    { id: 'card', name: 'Credit/Debit Card', icon: '💳', enabled: true },
    { id: 'contactless', name: 'Contactless/NFC', icon: '📲', enabled: true },
    { id: 'mobile_pay', name: 'Apple Pay / Google Pay', icon: '📱', enabled: true },
    { id: 'gift_card', name: 'Gift Card', icon: '🎁', enabled: true },
    { id: 'store_credit', name: 'Store Credit', icon: '🏪', enabled: true },
    { id: 'loyalty_points', name: 'Loyalty Points', icon: '⭐', enabled: true }
  ]
}

export default function EnterprisePOSPage() {
  const { user, workspace } = useAuth()
  
  // Cart and Transaction State
  const [cart, setCart] = useState([])
  const [currentCustomer, setCurrentCustomer] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  
  // UI State
  const [activeView, setActiveView] = useState('products') // products, cart, customer, payment
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  
  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [appliedDiscounts, setAppliedDiscounts] = useState([])
  const [lastTransaction, setLastTransaction] = useState(null)
  
  // Data and Loading State
  const [products] = useState(samplePOSData.products)
  const [customers] = useState(samplePOSData.customers)
  const [promotions] = useState(samplePOSData.promotions)
  const [loading, setLoading] = useState(false)

  // Filtered products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.barcode.includes(searchQuery)
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Calculate cart totals with promotions
  const calculateCartTotals = useCallback(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    let discount = 0
    
    // Apply automatic promotions
    appliedDiscounts.forEach(promo => {
      if (promo.type === 'category') {
        const categoryItems = cart.filter(item => 
          promo.applicable_categories.includes(item.category)
        )
        const categorySubtotal = categoryItems.reduce((sum, item) => 
          sum + (item.price * item.quantity), 0
        )
        discount += categorySubtotal * (promo.discount_percent / 100)
      } else if (promo.type === 'customer_tier' && currentCustomer) {
        if (promo.applicable_tiers.includes(currentCustomer.membership_tier)) {
          discount += subtotal * (promo.discount_percent / 100)
        }
      }
    })
    
    const tax = (subtotal - discount) * 0.085 // 8.5% tax rate
    const total = subtotal - discount + tax
    
    return { subtotal, discount, tax, total }
  }, [cart, appliedDiscounts, currentCustomer])

  // Add product to cart
  const addToCart = (product, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id)
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      } else {
        return [...prevCart, { ...product, quantity }]
      }
    })
    
    // Auto-apply applicable promotions
    checkAndApplyPromotions([...cart, { ...product, quantity }])
  }

  // Remove or update cart item
  const updateCartItem = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(prevCart => prevCart.filter(item => item.id !== productId))
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === productId
            ? { ...item, quantity: newQuantity }
            : item
        )
      )
    }
  }

  // Clear cart
  const clearCart = () => {
    setCart([])
    setAppliedDiscounts([])
    setCurrentCustomer(null)
  }

  // Check and apply automatic promotions
  const checkAndApplyPromotions = (currentCart) => {
    const applicablePromotions = []
    
    promotions.forEach(promo => {
      if (!promo.active) return
      
      if (promo.type === 'bundle') {
        const hasAllProducts = promo.applicable_products.every(productId =>
          currentCart.some(item => item.id === productId)
        )
        if (hasAllProducts) {
          applicablePromotions.push(promo)
        }
      } else if (promo.type === 'category') {
        const hasCategoryItems = currentCart.some(item =>
          promo.applicable_categories.includes(item.category)
        )
        if (hasCategoryItems) {
          applicablePromotions.push(promo)
        }
      } else if (promo.type === 'customer_tier' && currentCustomer) {
        if (promo.applicable_tiers.includes(currentCustomer.membership_tier)) {
          applicablePromotions.push(promo)
        }
      }
    })
    
    setAppliedDiscounts(applicablePromotions)
  }

  // Process payment
  const processPayment = async (paymentData) => {
    setLoading(true)
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const totals = calculateCartTotals()
      const transaction = {
        id: `TXN-${Date.now()}`,
        timestamp: new Date().toISOString(),
        customer: currentCustomer,
        items: cart,
        totals,
        payment_method: paymentMethod,
        payment_amount: parseFloat(paymentAmount) || totals.total,
        change: Math.max(0, (parseFloat(paymentAmount) || totals.total) - totals.total),
        employee: user?.name || 'Store Associate',
        store_id: organization?.organization_id || 'STORE001',
        discounts: appliedDiscounts
      }
      
      // Update customer loyalty points
      if (currentCustomer) {
        const pointsEarned = Math.floor(totals.total / 10) // 1 point per $10
        // In real system, would update customer record
      }
      
      setLastTransaction(transaction)
      setShowPaymentModal(false)
      setShowReceiptModal(true)
      clearCart()
      
    } catch (error) {
      console.error('Payment processing failed:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get AI recommendations based on cart
  const getAIRecommendations = () => {
    if (cart.length === 0) return []
    
    const recommendations = []
    const cartProductIds = cart.map(item => item.id)
    
    cart.forEach(item => {
      if (item.ai_insights?.recommended_accessories) {
        item.ai_insights.recommended_accessories.forEach(accessoryId => {
          if (!cartProductIds.includes(accessoryId)) {
            const accessory = products.find(p => p.id === accessoryId)
            if (accessory && !recommendations.find(r => r.id === accessoryId)) {
              recommendations.push({
                ...accessory,
                reason: `Perfect with ${item.name}`,
                confidence: item.ai_insights.upsell_potential
              })
            }
          }
        })
      }
    })
    
    return recommendations.slice(0, 3) // Top 3 recommendations
  }

  const categories = ['All', ...new Set(products.map(p => p.category))]
  const { subtotal, discount, tax, total } = calculateCartTotals()
  const aiRecommendations = getAIRecommendations()

  return (
    <UniversalTourProvider industryKey="enterprise-pos" autoStart={true}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex">
        <EnterpriseRetailSolutionSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Modern POS Header */}
          <TourElement tourId="pos-header">
            <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200/50 flex items-center justify-between px-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">Enterprise POS</h1>
                    <p className="text-xs text-gray-500">{user?.organizationName || 'HERA Retail Store'}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Current Customer Display */}
                {currentCustomer && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-500/10 to-emerald-600/10 rounded-lg border border-green-200/30">
                    <Crown className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">{currentCustomer.name}</span>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      {currentCustomer.membership_tier}
                    </Badge>
                  </div>
                )}
                
                {/* Cart Summary */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500/10 to-indigo-600/10 rounded-lg border border-blue-200/30">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    {cart.length} items • ${total.toFixed(2)}
                  </span>
                </div>
                
                {/* Quick Actions */}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowCustomerModal(true)}
                  className="gap-2"
                >
                  <User className="w-4 h-4" />
                  Customer
                </Button>
                
                <Button 
                  size="sm" 
                  onClick={() => setShowPaymentModal(true)}
                  disabled={cart.length === 0}
                  className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Checkout
                </Button>
              </div>
            </header>
          </TourElement>

          <div className="flex-1 flex">
            {/* Left Panel - Product Catalog */}
            <div className="flex-1 flex flex-col bg-white">
              {/* Search and Filter Bar */}
              <TourElement tourId="product-search">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search products by name, SKU, or barcode..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white"
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      <QrCode className="w-4 h-4 mr-2" />
                      Scan
                    </Button>
                  </div>
                  
                  {/* Category Filter */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {categories.map(category => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                        className={selectedCategory === category 
                          ? "bg-gradient-to-r from-blue-600 to-indigo-700" 
                          : "hover:bg-blue-50"
                        }
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>
              </TourElement>

              {/* Products Grid */}
              <TourElement tourId="product-grid">
                <div className="flex-1 overflow-auto p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredProducts.map(product => (
                      <Card 
                        key={product.id}
                        className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                        onClick={() => addToCart(product)}
                      >
                        <CardContent className="p-4">
                          <div className="text-center mb-3">
                            <div className="text-2xl mb-2">{product.image}</div>
                            <h3 className="font-medium text-sm text-gray-900 mb-1 line-clamp-2 h-8">
                              {product.name}
                            </h3>
                            <p className="text-xs text-gray-500 mb-2">{product.brand}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-lg text-gray-900">
                                ${product.price.toFixed(2)}
                              </span>
                              <Badge 
                                variant={product.stock > 20 ? "default" : product.stock > 0 ? "secondary" : "destructive"}
                                className="text-xs"
                              >
                                {product.stock > 0 ? `${product.stock} left` : 'Out of stock'}
                              </Badge>
                            </div>
                            
                            {/* AI Insights */}
                            {product.ai_insights && (
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-500" />
                                  <span className="text-gray-600">
                                    {product.ai_insights.popularity_score}/10
                                  </span>
                                </div>
                                <div className={`px-2 py-1 rounded ${
                                  product.ai_insights.seasonal_trend === 'high' 
                                    ? 'bg-green-100 text-green-800' 
                                    : product.ai_insights.seasonal_trend === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {product.ai_insights.seasonal_trend}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TourElement>
            </div>

            {/* Right Panel - Shopping Cart */}
            <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
              <TourElement tourId="shopping-cart">
                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-blue-600" />
                      Shopping Cart
                    </h2>
                    {cart.length > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={clearCart}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{cart.length} items</p>
                </div>
              </TourElement>

              {/* Cart Items */}
              <div className="flex-1 overflow-auto">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <ShoppingCart className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-2">Cart is empty</p>
                    <p className="text-sm text-gray-400">Add products to get started</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-4">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg">{item.image}</div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">{item.name}</h4>
                          <p className="text-xs text-gray-500">${item.price.toFixed(2)} each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateCartItem(item.id, item.quantity - 1)}
                            className="w-8 h-8 p-0"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateCartItem(item.id, item.quantity + 1)}
                            className="w-8 h-8 p-0"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                    
                    {/* AI Recommendations */}
                    {aiRecommendations.length > 0 && (
                      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                        <h3 className="text-sm font-semibold text-purple-900 mb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          AI Recommendations
                        </h3>
                        <div className="space-y-2">
                          {aiRecommendations.map(rec => (
                            <div 
                              key={rec.id}
                              className="flex items-center gap-3 p-2 bg-white rounded cursor-pointer hover:bg-gray-50"
                              onClick={() => addToCart(rec)}
                            >
                              <div className="text-sm">{rec.image}</div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{rec.name}</p>
                                <p className="text-xs text-purple-600">{rec.reason}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold">${rec.price.toFixed(2)}</p>
                                <p className="text-xs text-gray-500">{Math.round(rec.confidence * 10)}% match</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cart Summary */}
              {cart.length > 0 && (
                <TourElement tourId="cart-summary">
                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount:</span>
                          <span>-${discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span>Tax:</span>
                        <span>${tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-300">
                        <span>Total:</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    {/* Applied Promotions */}
                    {appliedDiscounts.length > 0 && (
                      <div className="mb-4 p-2 bg-green-50 rounded border border-green-200">
                        <p className="text-xs font-medium text-green-800 mb-1">Active Promotions:</p>
                        {appliedDiscounts.map(promo => (
                          <p key={promo.id} className="text-xs text-green-700 flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {promo.name} ({promo.discount_percent}% off)
                          </p>
                        ))}
                      </div>
                    )}
                    
                    <Button 
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800"
                      onClick={() => setShowPaymentModal(true)}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Proceed to Payment
                    </Button>
                  </div>
                </TourElement>
              )}
            </div>
          </div>
        </div>

        {/* Customer Selection Modal */}
        {showCustomerModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Select Customer</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowCustomerModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    setCurrentCustomer(null)
                    setShowCustomerModal(false)
                  }}
                >
                  <User className="w-4 h-4 mr-2" />
                  Walk-in Customer
                </Button>
                
                {customers.map(customer => (
                  <Card 
                    key={customer.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      setCurrentCustomer(customer)
                      setShowCustomerModal(false)
                      checkAndApplyPromotions(cart)
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{customer.name}</h4>
                        <Badge variant="outline" className={
                          customer.membership_tier === 'Platinum' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          customer.membership_tier === 'Gold' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }>
                          {customer.membership_tier}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          {customer.email}
                        </p>
                        <p className="flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </p>
                        <p className="flex items-center gap-2">
                          <Star className="w-3 h-3 text-yellow-500" />
                          {customer.loyalty_points} points
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Payment</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowPaymentModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Order Summary */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Order Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-300">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {/* Payment Methods */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-3 block">Payment Method</Label>
                <div className="grid grid-cols-2 gap-2">
                  {samplePOSData.paymentMethods.filter(pm => pm.enabled).map(method => (
                    <Button
                      key={method.id}
                      variant={paymentMethod === method.id ? "default" : "outline"}
                      className={`h-16 flex-col ${paymentMethod === method.id 
                        ? "bg-gradient-to-r from-blue-600 to-indigo-700" 
                        : "hover:bg-blue-50"
                      }`}
                      onClick={() => setPaymentMethod(method.id)}
                    >
                      <div className="text-lg mb-1">{method.icon}</div>
                      <div className="text-xs">{method.name}</div>
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Payment Amount (for cash) */}
              {paymentMethod === 'cash' && (
                <div className="mb-6">
                  <Label htmlFor="payment-amount" className="text-sm font-medium mb-2 block">
                    Amount Received
                  </Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    step="0.01"
                    placeholder={total.toFixed(2)}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="text-right text-lg font-semibold"
                  />
                  {paymentAmount && parseFloat(paymentAmount) >= total && (
                    <p className="text-sm text-green-600 mt-2">
                      Change: ${(parseFloat(paymentAmount) - total).toFixed(2)}
                    </p>
                  )}
                </div>
              )}
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowPaymentModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-700"
                  onClick={() => processPayment({ method: paymentMethod, amount: paymentAmount })}
                  disabled={loading || (paymentMethod === 'cash' && (!paymentAmount || parseFloat(paymentAmount) < total))}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </div>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete Payment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {showReceiptModal && lastTransaction && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-auto">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-green-800">Payment Successful!</h3>
                <p className="text-sm text-gray-600">Transaction completed</p>
              </div>
              
              {/* Receipt */}
              <div className="border-2 border-dashed border-gray-300 p-4 mb-6 font-mono text-sm">
                <div className="text-center mb-4">
                  <h4 className="font-bold">HERA RETAIL STORE</h4>
                  <p>123 Commerce Street</p>
                  <p>Store ID: {lastTransaction.store_id}</p>
                  <p>{new Date(lastTransaction.timestamp).toLocaleString()}</p>
                </div>
                
                <div className="border-t border-dashed border-gray-300 pt-2 mb-2">
                  <p>Transaction: {lastTransaction.id}</p>
                  <p>Cashier: {lastTransaction.employee}</p>
                  {lastTransaction.customer && (
                    <p>Customer: {lastTransaction.customer.name}</p>
                  )}
                </div>
                
                <div className="border-t border-dashed border-gray-300 pt-2 mb-2">
                  {lastTransaction.items.map(item => (
                    <div key={item.id} className="flex justify-between mb-1">
                      <span>{item.name} x{item.quantity}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-dashed border-gray-300 pt-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${lastTransaction.totals.subtotal.toFixed(2)}</span>
                  </div>
                  {lastTransaction.totals.discount > 0 && (
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>-${lastTransaction.totals.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>${lastTransaction.totals.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-dashed border-gray-300 pt-1 mt-1">
                    <span>TOTAL:</span>
                    <span>${lastTransaction.totals.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span>Payment ({lastTransaction.payment_method}):</span>
                    <span>${lastTransaction.payment_amount.toFixed(2)}</span>
                  </div>
                  {lastTransaction.change > 0 && (
                    <div className="flex justify-between">
                      <span>Change:</span>
                      <span>${lastTransaction.change.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                
                <div className="text-center mt-4 pt-2 border-t border-dashed border-gray-300">
                  <p>Thank you for your business!</p>
                  {lastTransaction.customer && (
                    <p>Points earned: {Math.floor(lastTransaction.totals.total / 10)}</p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowReceiptModal(false)}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Receipt
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700"
                  onClick={() => setShowReceiptModal(false)}
                >
                  New Transaction
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </UniversalTourProvider>
  )
}