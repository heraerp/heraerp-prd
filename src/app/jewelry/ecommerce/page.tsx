'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Globe,
  ShoppingBag,
  Monitor,
  Smartphone,
  Tablet,
  Eye,
  EyeOff,
  Settings,
  Zap,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  Users,
  Package,
  CreditCard,
  Truck,
  Star,
  Heart,
  Share2,
  MessageSquare,
  Bell,
  Search,
  Filter,
  Grid,
  List,
  Plus,
  Edit,
  Trash2,
  Upload,
  Download,
  RefreshCw,
  Save,
  Copy,
  ExternalLink,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Camera,
  Video,
  Image,
  FileText,
  Database,
  Cloud,
  Wifi,
  Shield,
  Lock,
  Key,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Target,
  Award,
  Crown,
  Gem,
  Diamond,
  Sparkles,
  Scale,
  Tag,
  DollarSign,
  Percent,
  Hash,
  Layers,
  Activity,
  Navigation,
  Compass,
  Home,
  Store,
  Warehouse
} from 'lucide-react'
import '@/styles/jewelry-glassmorphism.css'

interface EcommerceProduct {
  id: string
  name: string
  category: string
  subcategory: string
  brand: string
  sku: string
  description: string
  shortDescription: string
  price: number
  comparePrice?: number
  cost: number
  profit: number
  margin: number
  weight: number
  dimensions: {
    length: number
    width: number
    height: number
  }
  materials: string[]
  gemstones: string[]
  certification: string[]
  images: {
    url: string
    alt: string
    isPrimary: boolean
  }[]
  videos: string[]
  variants: {
    size?: string[]
    color?: string[]
    metal?: string[]
  }
  seo: {
    title: string
    description: string
    keywords: string[]
    slug: string
  }
  inventory: {
    inStock: boolean
    quantity: number
    lowStockThreshold: number
    allowBackorder: boolean
  }
  visibility: {
    isVisible: boolean
    isFeature: boolean
    isBestseller: boolean
    isNewArrival: boolean
    isSaleItem: boolean
  }
  shipping: {
    weight: number
    requiresSignature: boolean
    freeShipping: boolean
    shippingClass: string
  }
  customization: {
    isCustomizable: boolean
    engravingOptions: string[]
    sizeOptions: string[]
    metalOptions: string[]
  }
  status: 'draft' | 'active' | 'inactive' | 'archived'
  createdAt: string
  updatedAt: string
}

interface EcommerceOrder {
  id: string
  orderNumber: string
  customer: {
    id: string
    name: string
    email: string
    phone: string
    isRegistered: boolean
  }
  items: {
    productId: string
    productName: string
    variant?: string
    quantity: number
    price: number
    customizations?: any
  }[]
  pricing: {
    subtotal: number
    tax: number
    shipping: number
    discount: number
    total: number
  }
  shipping: {
    method: string
    carrier: string
    trackingNumber?: string
    address: {
      street: string
      city: string
      state: string
      zip: string
      country: string
    }
  }
  payment: {
    method: string
    gateway: string
    transactionId: string
    status: 'pending' | 'paid' | 'failed' | 'refunded'
  }
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
  timeline: {
    event: string
    timestamp: string
    note?: string
  }[]
  notes: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface WebsiteSettings {
  general: {
    siteName: string
    tagline: string
    description: string
    logo: string
    favicon: string
    primaryColor: string
    secondaryColor: string
    accentColor: string
  }
  seo: {
    metaTitle: string
    metaDescription: string
    keywords: string[]
    googleAnalytics: string
    facebookPixel: string
    sitemapEnabled: boolean
  }
  ecommerce: {
    currency: string
    taxRate: number
    shippingZones: string[]
    paymentMethods: string[]
    checkoutFlow: 'single' | 'multi'
    guestCheckout: boolean
    inventoryTracking: boolean
    lowStockAlerts: boolean
  }
  social: {
    facebook: string
    instagram: string
    twitter: string
    pinterest: string
    youtube: string
    tiktok: string
  }
  features: {
    wishlist: boolean
    reviews: boolean
    compare: boolean
    quickView: boolean
    virtualTryOn: boolean
    appointmentBooking: boolean
    livechat: boolean
  }
}

interface EcommerceAnalytics {
  overview: {
    totalRevenue: number
    totalOrders: number
    averageOrderValue: number
    conversionRate: number
    totalVisitors: number
    returningCustomers: number
    newCustomers: number
    cartAbandonment: number
  }
  traffic: {
    source: string
    visitors: number
    percentage: number
    conversionRate: number
  }[]
  topProducts: {
    productId: string
    name: string
    sales: number
    revenue: number
    views: number
    conversionRate: number
  }[]
  salesTrends: {
    period: string
    revenue: number
    orders: number
    visitors: number
  }[]
}

export default function JewelryEcommercePage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedPeriod, setSelectedPeriod] = useState('this_month')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<EcommerceProduct | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<EcommerceOrder | null>(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)

  // Mock data for e-commerce
  const ecommerceAnalytics: EcommerceAnalytics = {
    overview: {
      totalRevenue: 18750000,
      totalOrders: 1247,
      averageOrderValue: 15032,
      conversionRate: 3.8,
      totalVisitors: 45680,
      returningCustomers: 892,
      newCustomers: 355,
      cartAbandonment: 68.5
    },
    traffic: [
      { source: 'Organic Search', visitors: 18500, percentage: 40.5, conversionRate: 4.2 },
      { source: 'Social Media', visitors: 12300, percentage: 26.9, conversionRate: 3.8 },
      { source: 'Direct', visitors: 8900, percentage: 19.5, conversionRate: 5.1 },
      { source: 'Email Marketing', visitors: 4200, percentage: 9.2, conversionRate: 6.8 },
      { source: 'Paid Ads', visitors: 1780, percentage: 3.9, conversionRate: 2.9 }
    ],
    topProducts: [
      { productId: 'EP001', name: 'Diamond Engagement Ring', sales: 89, revenue: 12750000, views: 2340, conversionRate: 8.5 },
      { productId: 'EP002', name: 'Gold Chain Necklace', sales: 156, revenue: 3900000, views: 1890, conversionRate: 6.2 },
      { productId: 'EP003', name: 'Pearl Earrings Set', sales: 234, revenue: 2450000, views: 3450, conversionRate: 4.8 }
    ],
    salesTrends: [
      { period: 'Week 1', revenue: 4200000, orders: 289, visitors: 11200 },
      { period: 'Week 2', revenue: 4850000, orders: 324, visitors: 12800 },
      { period: 'Week 3', revenue: 5100000, orders: 356, visitors: 13500 },
      { period: 'Week 4', revenue: 4600000, orders: 278, visitors: 8180 }
    ]
  }

  const ecommerceProducts: EcommerceProduct[] = [
    {
      id: 'EP001',
      name: 'Royal Diamond Engagement Ring',
      category: 'rings',
      subcategory: 'engagement',
      brand: 'Royal Collection',
      sku: 'RC-DR-001',
      description: 'Exquisite platinum engagement ring featuring a brilliant 2-carat center diamond with pavé band.',
      shortDescription: 'Platinum engagement ring with 2ct diamond',
      price: 450000,
      comparePrice: 525000,
      cost: 280000,
      profit: 170000,
      margin: 37.8,
      weight: 4.8,
      dimensions: { length: 20, width: 20, height: 8 },
      materials: ['Platinum 950', 'Diamond'],
      gemstones: ['2ct Diamond (F, VS1)', '0.5ct Pavé Diamonds'],
      certification: ['GIA Certified', 'Hallmarked'],
      images: [
        { url: '/jewelry/ring-main.jpg', alt: 'Diamond Ring Main View', isPrimary: true },
        { url: '/jewelry/ring-side.jpg', alt: 'Diamond Ring Side View', isPrimary: false }
      ],
      videos: ['/jewelry/ring-360.mp4'],
      variants: {
        size: ['5', '5.5', '6', '6.5', '7', '7.5', '8'],
        metal: ['Platinum', '18K White Gold', '18K Yellow Gold']
      },
      seo: {
        title: 'Royal Diamond Engagement Ring - 2 Carat Platinum Setting',
        description: 'Shop our exquisite Royal Diamond Engagement Ring featuring a brilliant 2-carat center diamond in platinum setting with pavé band.',
        keywords: ['diamond engagement ring', 'platinum ring', '2 carat diamond', 'bridal jewelry'],
        slug: 'royal-diamond-engagement-ring-2ct-platinum'
      },
      inventory: {
        inStock: true,
        quantity: 5,
        lowStockThreshold: 2,
        allowBackorder: true
      },
      visibility: {
        isVisible: true,
        isFeature: true,
        isBestseller: true,
        isNewArrival: false,
        isSaleItem: true
      },
      shipping: {
        weight: 0.05,
        requiresSignature: true,
        freeShipping: true,
        shippingClass: 'premium'
      },
      customization: {
        isCustomizable: true,
        engravingOptions: ['Inside Band', 'Custom Message'],
        sizeOptions: ['5', '5.5', '6', '6.5', '7', '7.5', '8'],
        metalOptions: ['Platinum', '18K White Gold', '18K Yellow Gold']
      },
      status: 'active',
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-15T14:30:00Z'
    },
    {
      id: 'EP002',
      name: 'Emerald Goddess Necklace',
      category: 'necklaces',
      subcategory: 'statement',
      brand: 'Goddess Collection',
      sku: 'GC-EN-002',
      description: 'Stunning statement necklace featuring a 5-carat emerald centerpiece surrounded by diamonds in 18K gold.',
      shortDescription: '18K gold necklace with 5ct emerald',
      price: 325000,
      cost: 195000,
      profit: 130000,
      margin: 40.0,
      weight: 18.5,
      dimensions: { length: 450, width: 35, height: 12 },
      materials: ['18K Yellow Gold', 'Emerald', 'Diamonds'],
      gemstones: ['5ct Colombian Emerald', '2ct Diamond Accents'],
      certification: ['AIGS Certified', 'Hallmarked'],
      images: [
        { url: '/jewelry/necklace-main.jpg', alt: 'Emerald Necklace Main View', isPrimary: true }
      ],
      videos: [],
      variants: {
        metal: ['18K Yellow Gold', '18K White Gold']
      },
      seo: {
        title: 'Emerald Goddess Statement Necklace - 5 Carat Colombian Emerald',
        description: 'Luxury emerald necklace featuring a stunning 5-carat Colombian emerald with diamond accents in 18K gold.',
        keywords: ['emerald necklace', 'statement jewelry', 'colombian emerald', 'luxury necklace'],
        slug: 'emerald-goddess-statement-necklace-5ct'
      },
      inventory: {
        inStock: true,
        quantity: 2,
        lowStockThreshold: 1,
        allowBackorder: false
      },
      visibility: {
        isVisible: true,
        isFeature: true,
        isBestseller: false,
        isNewArrival: true,
        isSaleItem: false
      },
      shipping: {
        weight: 0.08,
        requiresSignature: true,
        freeShipping: true,
        shippingClass: 'premium'
      },
      customization: {
        isCustomizable: false,
        engravingOptions: [],
        sizeOptions: [],
        metalOptions: ['18K Yellow Gold', '18K White Gold']
      },
      status: 'active',
      createdAt: '2024-01-12T09:00:00Z',
      updatedAt: '2024-01-14T16:20:00Z'
    },
    {
      id: 'EP003',
      name: 'Classic Pearl Earrings',
      category: 'earrings',
      subcategory: 'studs',
      brand: 'Classic Collection',
      sku: 'CC-PE-003',
      description: 'Timeless Akoya pearl stud earrings in 14K gold setting, perfect for everyday elegance.',
      shortDescription: '14K gold Akoya pearl stud earrings',
      price: 85000,
      cost: 45000,
      profit: 40000,
      margin: 47.1,
      weight: 2.8,
      dimensions: { length: 10, width: 10, height: 10 },
      materials: ['14K Yellow Gold', 'Akoya Pearls'],
      gemstones: ['8-9mm Akoya Pearls'],
      certification: ['Hallmarked'],
      images: [
        { url: '/jewelry/earrings-main.jpg', alt: 'Pearl Earrings Main View', isPrimary: true }
      ],
      videos: [],
      variants: {
        metal: ['14K Yellow Gold', '14K White Gold'],
        color: ['White', 'Cream']
      },
      seo: {
        title: 'Classic Akoya Pearl Stud Earrings - 14K Gold Setting',
        description: 'Elegant Akoya pearl stud earrings in 14K gold, featuring lustrous 8-9mm pearls perfect for any occasion.',
        keywords: ['pearl earrings', 'akoya pearls', 'stud earrings', 'classic jewelry'],
        slug: 'classic-akoya-pearl-stud-earrings-14k-gold'
      },
      inventory: {
        inStock: true,
        quantity: 25,
        lowStockThreshold: 5,
        allowBackorder: true
      },
      visibility: {
        isVisible: true,
        isFeature: false,
        isBestseller: true,
        isNewArrival: false,
        isSaleItem: false
      },
      shipping: {
        weight: 0.01,
        requiresSignature: false,
        freeShipping: false,
        shippingClass: 'standard'
      },
      customization: {
        isCustomizable: true,
        engravingOptions: ['Custom Gift Box'],
        sizeOptions: ['8mm', '9mm', '10mm'],
        metalOptions: ['14K Yellow Gold', '14K White Gold']
      },
      status: 'active',
      createdAt: '2024-01-08T11:00:00Z',
      updatedAt: '2024-01-13T13:45:00Z'
    }
  ]

  const recentOrders: EcommerceOrder[] = [
    {
      id: 'EO001',
      orderNumber: 'WEB-2024-001',
      customer: {
        id: 'CU001',
        name: 'Priya Sharma',
        email: 'priya.sharma@email.com',
        phone: '+91 98765 43210',
        isRegistered: true
      },
      items: [
        {
          productId: 'EP001',
          productName: 'Royal Diamond Engagement Ring',
          variant: 'Size 6.5, Platinum',
          quantity: 1,
          price: 450000,
          customizations: { engraving: 'P & R Forever' }
        }
      ],
      pricing: {
        subtotal: 450000,
        tax: 13500,
        shipping: 0,
        discount: 22500,
        total: 441000
      },
      shipping: {
        method: 'Express Delivery',
        carrier: 'BlueDart',
        trackingNumber: 'BD123456789',
        address: {
          street: '123 MG Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          zip: '400001',
          country: 'India'
        }
      },
      payment: {
        method: 'Credit Card',
        gateway: 'Razorpay',
        transactionId: 'pay_123456789',
        status: 'paid'
      },
      status: 'processing',
      timeline: [
        { event: 'Order Placed', timestamp: '2024-01-15T10:30:00Z' },
        { event: 'Payment Confirmed', timestamp: '2024-01-15T10:32:00Z' },
        { event: 'Order Confirmed', timestamp: '2024-01-15T11:00:00Z' }
      ],
      notes: 'Rush order for engagement ceremony',
      tags: ['VIP Customer', 'Rush Order'],
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T11:00:00Z'
    }
  ]

  const tabs = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'products', label: 'Products', icon: Package },
    { key: 'orders', label: 'Orders', icon: ShoppingBag },
    { key: 'analytics', label: 'Analytics', icon: TrendingUp },
    { key: 'website', label: 'Website', icon: Globe },
    { key: 'settings', label: 'Settings', icon: Settings }
  ]

  const formatCurrency = (amount: number) => {
    return `¹${amount.toLocaleString()}`
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'paid':
      case 'delivered':
        return 'jewelry-status-active'
      case 'processing':
      case 'pending':
        return 'jewelry-status-pending'
      case 'inactive':
      case 'failed':
      case 'cancelled':
        return 'jewelry-status-inactive'
      default:
        return 'jewelry-status-inactive'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'paid':
      case 'delivered':
        return <CheckCircle size={16} className="text-green-500" />
      case 'processing':
      case 'pending':
        return <Clock size={16} className="text-yellow-500" />
      case 'inactive':
      case 'failed':
      case 'cancelled':
        return <XCircle size={16} className="text-red-500" />
      default:
        return <AlertTriangle size={16} className="text-gray-500" />
    }
  }

  return (
    <div className="min-h-screen jewelry-gradient-premium">
      <div className="jewelry-glass-backdrop min-h-screen">
        <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
          
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="jewelry-heading text-4xl md:text-5xl mb-4">
              <Globe className="inline-block mr-3 mb-2 jewelry-icon-gold" size={48} />
              E-commerce Integration
            </h1>
            <p className="jewelry-text-luxury text-lg md:text-xl">
              Manage your online jewelry store with advanced e-commerce features
            </p>
          </motion.div>

          {/* Navigation Tabs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="jewelry-glass-panel"
          >
            <div className="flex flex-wrap gap-2 p-4">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.key
                      ? 'jewelry-btn-primary'
                      : 'jewelry-btn-secondary'
                  }`}
                >
                  <tab.icon size={16} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Key Metrics */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                <div className="jewelry-glass-card jewelry-float p-6 text-center">
                  <DollarSign className="mx-auto mb-3 jewelry-icon-gold" size={32} />
                  <h3 className="jewelry-text-high-contrast text-3xl font-bold">{formatCurrency(ecommerceAnalytics.overview.totalRevenue)}</h3>
                  <p className="jewelry-text-muted text-sm font-medium">Online Revenue</p>
                  <div className="flex items-center justify-center mt-2 text-green-500">
                    <TrendingUp size={16} />
                    <span className="text-xs ml-1">+24.5%</span>
                  </div>
                </div>
                
                <div className="jewelry-glass-card jewelry-float p-6 text-center" style={{ animationDelay: '0.1s' }}>
                  <ShoppingBag className="mx-auto mb-3 jewelry-icon-gold" size={32} />
                  <h3 className="jewelry-text-high-contrast text-3xl font-bold">{ecommerceAnalytics.overview.totalOrders.toLocaleString()}</h3>
                  <p className="jewelry-text-muted text-sm font-medium">Online Orders</p>
                  <div className="flex items-center justify-center mt-2 text-green-500">
                    <TrendingUp size={16} />
                    <span className="text-xs ml-1">+18.2%</span>
                  </div>
                </div>
                
                <div className="jewelry-glass-card jewelry-float p-6 text-center" style={{ animationDelay: '0.2s' }}>
                  <Target className="mx-auto mb-3 jewelry-icon-gold" size={32} />
                  <h3 className="jewelry-text-high-contrast text-3xl font-bold">{formatCurrency(ecommerceAnalytics.overview.averageOrderValue)}</h3>
                  <p className="jewelry-text-muted text-sm font-medium">Avg Order Value</p>
                  <div className="flex items-center justify-center mt-2 text-green-500">
                    <TrendingUp size={16} />
                    <span className="text-xs ml-1">+12.8%</span>
                  </div>
                </div>
                
                <div className="jewelry-glass-card jewelry-float p-6 text-center" style={{ animationDelay: '0.3s' }}>
                  <Percent className="mx-auto mb-3 jewelry-icon-gold" size={32} />
                  <h3 className="jewelry-text-high-contrast text-3xl font-bold">{ecommerceAnalytics.overview.conversionRate}%</h3>
                  <p className="jewelry-text-muted text-sm font-medium">Conversion Rate</p>
                  <div className="flex items-center justify-center mt-2 text-green-500">
                    <TrendingUp size={16} />
                    <span className="text-xs ml-1">+0.8%</span>
                  </div>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Traffic Sources */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="jewelry-glass-panel"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="jewelry-text-luxury text-xl font-semibold flex items-center gap-2">
                      <Navigation className="jewelry-icon-gold" size={24} />
                      Traffic Sources
                    </h3>
                    <button className="jewelry-btn-secondary p-2">
                      <Eye className="jewelry-icon-gold" size={16} />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {ecommerceAnalytics.traffic.map((source, index) => (
                      <div key={source.source} className="jewelry-glass-card p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="jewelry-text-high-contrast font-semibold">{source.source}</h4>
                            <p className="jewelry-text-muted text-sm">{source.visitors.toLocaleString()} visitors ({source.percentage}%)</p>
                          </div>
                          <div className="text-right">
                            <p className="jewelry-text-high-contrast font-bold">{source.conversionRate}%</p>
                            <p className="jewelry-text-muted text-xs">conversion</p>
                          </div>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-gradient-to-r from-jewelry-blue-400 to-jewelry-blue-600"
                            style={{ width: `${source.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Top Products */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="jewelry-glass-panel"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="jewelry-text-luxury text-xl font-semibold flex items-center gap-2">
                      <Award className="jewelry-icon-gold" size={24} />
                      Top Products
                    </h3>
                    <button className="jewelry-btn-secondary flex items-center space-x-2 px-3 py-1">
                      <BarChart3 className="jewelry-icon-gold" size={14} />
                      <span className="text-sm">Details</span>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {ecommerceAnalytics.topProducts.map((product, index) => (
                      <div key={product.productId} className="jewelry-glass-card p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-jewelry-blue-100 to-jewelry-blue-200 rounded-lg flex items-center justify-center">
                            <Gem className="jewelry-icon-gold" size={20} />
                          </div>
                          <div className="flex-1">
                            <h4 className="jewelry-text-high-contrast font-semibold text-sm">{product.name}</h4>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex space-x-4 text-xs">
                                <span className="jewelry-text-muted">{product.sales} sales</span>
                                <span className="jewelry-text-muted">{product.views} views</span>
                              </div>
                              <div className="text-right">
                                <p className="jewelry-text-luxury font-bold text-sm">{formatCurrency(product.revenue)}</p>
                                <p className="jewelry-text-muted text-xs">{product.conversionRate}% conv.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              
              {/* Product Controls */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="jewelry-glass-panel"
              >
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 jewelry-icon-muted" size={16} />
                      <input
                        type="text"
                        placeholder="Search products..."
                        className="pl-10 pr-4 py-2 border border-jewelry-blue-200 rounded-lg jewelry-text-high-contrast text-sm w-64"
                      />
                    </div>
                    
                    <button 
                      onClick={() => setShowFilters(!showFilters)}
                      className="jewelry-btn-secondary flex items-center space-x-2 px-4 py-2"
                    >
                      <Filter className="jewelry-icon-gold" size={18} />
                      <span>Filters</span>
                    </button>
                    
                    <button 
                      onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                      className="jewelry-btn-secondary p-2"
                    >
                      {viewMode === 'grid' ? <List size={18} /> : <Grid size={18} />}
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button className="jewelry-btn-secondary flex items-center space-x-2 px-4 py-2">
                      <Upload className="jewelry-icon-gold" size={18} />
                      <span>Import</span>
                    </button>
                    
                    <button className="jewelry-btn-secondary flex items-center space-x-2 px-4 py-2">
                      <Download className="jewelry-icon-gold" size={18} />
                      <span>Export</span>
                    </button>
                    
                    <button className="jewelry-btn-primary flex items-center space-x-2 px-4 py-2">
                      <Plus className="jewelry-icon-gold" size={18} />
                      <span>Add Product</span>
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Products Grid/List */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="jewelry-glass-panel"
              >
                <div className="p-6">
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {ecommerceProducts.map((product) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          className="jewelry-glass-card jewelry-scale-hover cursor-pointer"
                          onClick={() => {
                            setSelectedProduct(product)
                            setShowProductModal(true)
                          }}
                        >
                          <div className="relative">
                            <div className="aspect-square bg-gradient-to-br from-jewelry-blue-100 to-jewelry-blue-200 rounded-t-lg flex items-center justify-center">
                              <Gem className="jewelry-icon-gold" size={48} />
                            </div>
                            <div className="absolute top-3 left-3 flex flex-col gap-2">
                              {product.visibility.isNewArrival && (
                                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">New</span>
                              )}
                              {product.visibility.isBestseller && (
                                <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded">Bestseller</span>
                              )}
                              {product.visibility.isSaleItem && (
                                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">Sale</span>
                              )}
                            </div>
                            <div className="absolute top-3 right-3">
                              <span className={`text-xs px-2 py-1 rounded ${getStatusColor(product.status)}`}>
                                {product.status}
                              </span>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="jewelry-text-high-contrast font-semibold text-sm line-clamp-2">{product.name}</h4>
                                <p className="jewelry-text-muted text-xs">{product.sku}</p>
                              </div>
                              <button className="text-gray-400 hover:text-gray-600">
                                <MoreVertical size={16} />
                              </button>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="jewelry-text-luxury font-bold">{formatCurrency(product.price)}</span>
                                {product.comparePrice && (
                                  <span className="jewelry-text-muted text-xs line-through">{formatCurrency(product.comparePrice)}</span>
                                )}
                              </div>
                              
                              <div className="flex items-center justify-between text-xs">
                                <span className="jewelry-text-muted">Stock: {product.inventory.quantity}</span>
                                <span className="jewelry-text-luxury font-medium">Margin: {product.margin}%</span>
                              </div>
                              
                              <div className="flex space-x-2">
                                <button className="flex-1 jewelry-btn-secondary py-1 text-xs">
                                  <Edit size={12} className="mr-1" />
                                  Edit
                                </button>
                                <button className="flex-1 jewelry-btn-primary py-1 text-xs">
                                  <Eye size={12} className="mr-1" />
                                  View
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {ecommerceProducts.map((product) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3 }}
                          className="jewelry-glass-card p-4 flex items-center space-x-4 jewelry-scale-hover cursor-pointer"
                          onClick={() => {
                            setSelectedProduct(product)
                            setShowProductModal(true)
                          }}
                        >
                          <div className="w-20 h-20 bg-gradient-to-br from-jewelry-blue-100 to-jewelry-blue-200 rounded-lg flex items-center justify-center">
                            <Gem className="jewelry-icon-gold" size={32} />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="jewelry-text-high-contrast font-semibold">{product.name}</h4>
                                <p className="jewelry-text-muted text-sm">{product.sku} " {product.category}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(product.status)}`}>
                                  {product.status}
                                </span>
                                <button className="text-gray-400 hover:text-gray-600">
                                  <MoreVertical size={16} />
                                </button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="jewelry-text-muted block">Price</span>
                                <span className="jewelry-text-luxury font-bold">{formatCurrency(product.price)}</span>
                              </div>
                              <div>
                                <span className="jewelry-text-muted block">Stock</span>
                                <span className="jewelry-text-high-contrast">{product.inventory.quantity}</span>
                              </div>
                              <div>
                                <span className="jewelry-text-muted block">Margin</span>
                                <span className="jewelry-text-high-contrast">{product.margin}%</span>
                              </div>
                              <div>
                                <span className="jewelry-text-muted block">Status</span>
                                <div className="flex items-center space-x-1">
                                  {getStatusIcon(product.status)}
                                  <span className="capitalize">{product.status}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              
              {/* Order Controls */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="jewelry-glass-panel"
              >
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 jewelry-icon-muted" size={16} />
                      <input
                        type="text"
                        placeholder="Search orders..."
                        className="pl-10 pr-4 py-2 border border-jewelry-blue-200 rounded-lg jewelry-text-high-contrast text-sm w-64"
                      />
                    </div>
                    
                    <select className="px-4 py-2 border border-jewelry-blue-200 rounded-lg jewelry-text-high-contrast text-sm">
                      <option value="">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                    </select>

                    <select className="px-4 py-2 border border-jewelry-blue-200 rounded-lg jewelry-text-high-contrast text-sm">
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="quarter">This Quarter</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <button className="jewelry-btn-secondary flex items-center space-x-2 px-4 py-2">
                      <RefreshCw className="jewelry-icon-gold" size={18} />
                      <span>Refresh</span>
                    </button>
                    
                    <button className="jewelry-btn-secondary flex items-center space-x-2 px-4 py-2">
                      <Download className="jewelry-icon-gold" size={18} />
                      <span>Export</span>
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Orders List */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="jewelry-glass-panel"
              >
                <div className="p-6">
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="jewelry-glass-card p-4 jewelry-scale-hover cursor-pointer"
                        onClick={() => {
                          setSelectedOrder(order)
                          setShowOrderModal(true)
                        }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-jewelry-blue-100 to-jewelry-blue-200 rounded-lg flex items-center justify-center">
                              <ShoppingBag className="jewelry-icon-gold" size={20} />
                            </div>
                            <div>
                              <h4 className="jewelry-text-high-contrast font-semibold">{order.orderNumber}</h4>
                              <p className="jewelry-text-muted text-sm">{order.customer.name} " {order.customer.email}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
                              {order.status.toUpperCase()}
                            </span>
                            <span className="jewelry-text-luxury font-bold">{formatCurrency(order.pricing.total)}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="jewelry-text-muted block">Items</span>
                            <span className="jewelry-text-high-contrast">{order.items.length} product(s)</span>
                          </div>
                          <div>
                            <span className="jewelry-text-muted block">Payment</span>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(order.payment.status)}
                              <span className="capitalize">{order.payment.status}</span>
                            </div>
                          </div>
                          <div>
                            <span className="jewelry-text-muted block">Shipping</span>
                            <span className="jewelry-text-high-contrast">{order.shipping.method}</span>
                          </div>
                          <div>
                            <span className="jewelry-text-muted block">Date</span>
                            <span className="jewelry-text-high-contrast">{new Date(order.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {order.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {order.tags.map((tag, index) => (
                              <span key={index} className="bg-jewelry-blue-100 text-jewelry-blue-900 text-xs px-2 py-1 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="jewelry-glass-panel"
            >
              <div className="p-6 text-center">
                <BarChart3 className="mx-auto mb-4 jewelry-icon-gold" size={64} />
                <h3 className="jewelry-text-luxury text-xl font-semibold mb-2">Advanced Analytics</h3>
                <p className="jewelry-text-muted">
                  Comprehensive e-commerce analytics, customer behavior insights, and performance tracking coming soon.
                </p>
              </div>
            </motion.div>
          )}

          {/* Website Tab */}
          {activeTab === 'website' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="jewelry-glass-panel"
            >
              <div className="p-6 text-center">
                <Globe className="mx-auto mb-4 jewelry-icon-gold" size={64} />
                <h3 className="jewelry-text-luxury text-xl font-semibold mb-2">Website Management</h3>
                <p className="jewelry-text-muted">
                  Website customization, theme settings, SEO optimization, and content management tools.
                </p>
              </div>
            </motion.div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="jewelry-glass-panel"
            >
              <div className="p-6 text-center">
                <Settings className="mx-auto mb-4 jewelry-icon-gold" size={64} />
                <h3 className="jewelry-text-luxury text-xl font-semibold mb-2">E-commerce Settings</h3>
                <p className="jewelry-text-muted">
                  Payment gateways, shipping methods, tax settings, inventory management, and store configuration.
                </p>
              </div>
            </motion.div>
          )}

          {/* Footer */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            className="text-center mt-12 mb-6"
          >
            <p className="jewelry-text-muted text-sm">
              E-commerce platform powered by <span className="jewelry-text-luxury font-semibold">HERA Business Intelligence</span>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}