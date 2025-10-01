'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, Grid3X3, List, Filter, Crown, Diamond, Gem, Scale, 
  TrendingUp, Users, Package, ShoppingBag, Star, Award, 
  Calculator, DollarSign, Settings, BarChart, FileText, 
  Calendar, Camera, MapPin, Truck, Shield, CreditCard,
  Palette, Zap, Eye, Archive, BookOpen, Bell, Mail,
  Phone, MessageCircle, Globe, Lock, Database, Cpu
} from 'lucide-react'
import { JewelryAppTile } from '@/components/jewelry/JewelryAppTile'
import '@/styles/jewelry-glassmorphism.css'

// Complete jewelry application catalog
const jewelryApps = [
  // Core Business Apps
  {
    id: 'pos',
    title: 'POS System',
    description: 'Complete point of sale with payment processing',
    icon: ShoppingBag,
    href: '/jewelry/pos',
    category: 'Sales',
    featured: true,
    tags: ['sales', 'payment', 'transactions']
  },
  {
    id: 'inventory',
    title: 'Inventory Management',
    description: 'Track stock, manage suppliers, monitor levels',
    icon: Package,
    href: '/jewelry/inventory',
    category: 'Operations',
    featured: true,
    tags: ['inventory', 'stock', 'suppliers']
  },
  {
    id: 'appraisals',
    title: 'Appraisal System',
    description: 'Professional jewelry valuations and certificates',
    icon: Scale,
    href: '/jewelry/appraisals',
    category: 'Services',
    featured: true,
    tags: ['appraisal', 'valuation', 'certificates']
  },
  {
    id: 'customers',
    title: 'Customer Management',
    description: 'CRM for luxury clientele and relationships',
    icon: Users,
    href: '/jewelry/customers',
    category: 'CRM',
    featured: true,
    tags: ['customers', 'crm', 'relationships']
  },
  {
    id: 'vip',
    title: 'VIP Services',
    description: 'Exclusive services for premium clients',
    icon: Crown,
    href: '/jewelry/vip',
    category: 'Premium',
    featured: true,
    tags: ['vip', 'premium', 'exclusive']
  },
  {
    id: 'reports',
    title: 'Analytics & Reports',
    description: 'Business intelligence and financial reports',
    icon: BarChart,
    href: '/jewelry/reports',
    category: 'Analytics',
    featured: true,
    tags: ['reports', 'analytics', 'intelligence']
  },

  // Financial Apps
  {
    id: 'accounting',
    title: 'Financial Management',
    description: 'Complete accounting and financial tracking',
    icon: Calculator,
    href: '/jewelry/accounting',
    category: 'Finance',
    tags: ['accounting', 'finance', 'tracking']
  },
  {
    id: 'pricing',
    title: 'Dynamic Pricing',
    description: 'AI-powered pricing optimization',
    icon: DollarSign,
    href: '/jewelry/pricing',
    category: 'Finance',
    tags: ['pricing', 'optimization', 'ai']
  },
  {
    id: 'insurance',
    title: 'Insurance Manager',
    description: 'Manage insurance policies and claims',
    icon: Shield,
    href: '/jewelry/insurance',
    category: 'Finance',
    tags: ['insurance', 'policies', 'claims']
  },

  // Operations Apps
  {
    id: 'workshop',
    title: 'Workshop Management',
    description: 'Repair services and custom design tracking',
    icon: Settings,
    href: '/jewelry/workshop',
    category: 'Operations',
    tags: ['workshop', 'repairs', 'custom']
  },
  {
    id: 'quality',
    title: 'Quality Control',
    description: 'Quality assurance and certification',
    icon: Award,
    href: '/jewelry/quality',
    category: 'Operations',
    tags: ['quality', 'certification', 'assurance']
  },
  {
    id: 'security',
    title: 'Security System',
    description: 'Vault management and security protocols',
    icon: Lock,
    href: '/jewelry/security',
    category: 'Operations',
    tags: ['security', 'vault', 'protocols']
  },
  {
    id: 'logistics',
    title: 'Shipping & Logistics',
    description: 'Secure shipping and delivery tracking',
    icon: Truck,
    href: '/jewelry/logistics',
    category: 'Operations',
    tags: ['shipping', 'logistics', 'delivery']
  },

  // Design & Production
  {
    id: 'design',
    title: 'Design Studio',
    description: 'CAD design tools and 3D modeling',
    icon: Palette,
    href: '/jewelry/design',
    category: 'Design',
    tags: ['design', 'cad', 'modeling']
  },
  {
    id: 'catalog',
    title: 'Product Catalog',
    description: 'Digital showcase and product management',
    icon: BookOpen,
    href: '/jewelry/catalog',
    category: 'Marketing',
    tags: ['catalog', 'showcase', 'products']
  },
  {
    id: 'photography',
    title: 'Photography Suite',
    description: 'Professional jewelry photography tools',
    icon: Camera,
    href: '/jewelry/photography',
    category: 'Marketing',
    tags: ['photography', 'imaging', 'professional']
  },

  // Marketing & Sales
  {
    id: 'marketing',
    title: 'Marketing Hub',
    description: 'Campaigns, social media, and promotions',
    icon: Zap,
    href: '/jewelry/marketing',
    category: 'Marketing',
    tags: ['marketing', 'campaigns', 'social']
  },
  {
    id: 'ecommerce',
    title: 'E-Commerce Platform',
    description: 'Online store and digital sales channels',
    icon: Globe,
    href: '/jewelry/ecommerce',
    category: 'Sales',
    tags: ['ecommerce', 'online', 'digital']
  },
  {
    id: 'appointments',
    title: 'Appointment Booking',
    description: 'Schedule consultations and fittings',
    icon: Calendar,
    href: '/jewelry/appointments',
    category: 'Services',
    tags: ['appointments', 'scheduling', 'consultations']
  },

  // Communication
  {
    id: 'notifications',
    title: 'Notification Center',
    description: 'Smart alerts and communication hub',
    icon: Bell,
    href: '/jewelry/notifications',
    category: 'Communication',
    tags: ['notifications', 'alerts', 'communication']
  },
  {
    id: 'messaging',
    title: 'Client Messaging',
    description: 'Secure messaging with clients',
    icon: MessageCircle,
    href: '/jewelry/messaging',
    category: 'Communication',
    tags: ['messaging', 'clients', 'secure']
  },
  {
    id: 'email',
    title: 'Email Marketing',
    description: 'Targeted email campaigns and newsletters',
    icon: Mail,
    href: '/jewelry/email',
    category: 'Marketing',
    tags: ['email', 'campaigns', 'newsletters']
  },

  // Analytics & Insights
  {
    id: 'insights',
    title: 'Business Insights',
    description: 'AI-powered business intelligence',
    icon: Eye,
    href: '/jewelry/insights',
    category: 'Analytics',
    tags: ['insights', 'ai', 'intelligence']
  },
  {
    id: 'trends',
    title: 'Market Trends',
    description: 'Industry trends and market analysis',
    icon: TrendingUp,
    href: '/jewelry/trends',
    category: 'Analytics',
    tags: ['trends', 'market', 'analysis']
  },
  {
    id: 'performance',
    title: 'Performance Monitor',
    description: 'System performance and optimization',
    icon: Cpu,
    href: '/jewelry/performance',
    category: 'System',
    tags: ['performance', 'optimization', 'monitoring']
  },

  // Archive & Documentation
  {
    id: 'archive',
    title: 'Digital Archive',
    description: 'Historical records and documentation',
    icon: Archive,
    href: '/jewelry/archive',
    category: 'System',
    tags: ['archive', 'records', 'documentation']
  },
  {
    id: 'database',
    title: 'Database Manager',
    description: 'Data management and backup systems',
    icon: Database,
    href: '/jewelry/database',
    category: 'System',
    tags: ['database', 'data', 'backup']
  }
]

const categories = [
  'All',
  'Sales',
  'Operations', 
  'Finance',
  'Design',
  'Marketing',
  'Services',
  'Analytics',
  'Communication',
  'Premium',
  'CRM',
  'System'
]

export default function JewelryAppsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false)

  const filteredApps = jewelryApps.filter(app => {
    const matchesSearch = searchQuery === '' || 
      app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'All' || app.category === selectedCategory
    const matchesFeatured = !showFeaturedOnly || app.featured
    
    return matchesSearch && matchesCategory && matchesFeatured
  })

  const featuredApps = jewelryApps.filter(app => app.featured)

  return (
    <div className="min-h-screen jewelry-gradient-premium">
      <div className="jewelry-glass-backdrop min-h-screen">
        <div className="w-full max-w-7xl mx-auto p-6 space-y-8">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <h1 className="jewelry-heading text-5xl md:text-6xl flex items-center justify-center gap-4">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <Diamond className="h-12 w-12 jewelry-icon-gold" />
              </motion.div>
              HERA Jewelry Apps
              <motion.div
                animate={{ rotate: [360, 0] }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              >
                <Gem className="h-10 w-10 jewelry-icon-gold" />
              </motion.div>
            </h1>
            <p className="jewelry-text-luxury text-xl max-w-3xl mx-auto">
              Complete suite of luxury jewelry management applications. 
              Discover powerful tools to elevate your business operations.
            </p>
          </motion.div>

          {/* Featured Apps Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="jewelry-glass-panel-strong space-y-6"
          >
            <div className="flex items-center gap-3">
              <Crown className="h-6 w-6 jewelry-icon-gold" />
              <h2 className="jewelry-text-luxury text-2xl font-semibold">Featured Applications</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {featuredApps.map((app, index) => (
                <JewelryAppTile 
                  key={app.id} 
                  app={app} 
                  index={index}
                  compact={true}
                />
              ))}
            </div>
          </motion.div>

          {/* Search and Filter Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="jewelry-glass-panel space-y-6"
          >
            {/* Search Bar */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 jewelry-text-muted" />
                <input
                  type="text"
                  placeholder="Search applications, features, or categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 jewelry-glass-input rounded-xl text-sm focus:ring-2 focus:ring-yellow-500/50 focus:outline-none"
                />
              </div>
              
              <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-white/10 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'grid' 
                        ? 'bg-yellow-500/20 jewelry-text-gold' 
                        : 'jewelry-text-muted hover:jewelry-text-luxury'
                    }`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'list' 
                        ? 'bg-yellow-500/20 jewelry-text-gold' 
                        : 'jewelry-text-muted hover:jewelry-text-luxury'
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>

                {/* Featured Filter */}
                <button
                  onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    showFeaturedOnly 
                      ? 'bg-yellow-500/20 jewelry-text-gold border border-yellow-500/30' 
                      : 'jewelry-glass-btn jewelry-text-luxury hover:bg-yellow-500/10'
                  }`}
                >
                  <Star className="h-4 w-4" />
                  Featured Only
                </button>
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? 'bg-yellow-500/20 jewelry-text-gold border border-yellow-500/30'
                      : 'jewelry-glass-btn jewelry-text-luxury hover:bg-yellow-500/10'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Results Summary */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-between"
          >
            <p className="jewelry-text-muted">
              Showing {filteredApps.length} of {jewelryApps.length} applications
              {selectedCategory !== 'All' && ` in ${selectedCategory}`}
              {showFeaturedOnly && ' (Featured only)'}
            </p>
            
            {filteredApps.length > 0 && (
              <div className="flex items-center gap-2 jewelry-text-muted text-sm">
                <Filter className="h-4 w-4" />
                {searchQuery && `Search: "${searchQuery}"`}
                {selectedCategory !== 'All' && `Category: ${selectedCategory}`}
              </div>
            )}
          </motion.div>

          {/* Apps Grid/List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {filteredApps.length === 0 ? (
              <div className="jewelry-glass-panel-strong text-center py-16">
                <Search className="h-16 w-16 jewelry-text-muted mx-auto mb-6" />
                <h3 className="jewelry-text-luxury text-2xl font-semibold mb-3">
                  No applications found
                </h3>
                <p className="jewelry-text-muted mb-6 max-w-md mx-auto">
                  Try adjusting your search terms or browse different categories to find the apps you need.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('All')
                    setShowFeaturedOnly(false)
                  }}
                  className="jewelry-btn-primary"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className={
                viewMode === 'grid' 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              }>
                {filteredApps.map((app, index) => (
                  <JewelryAppTile 
                    key={app.id} 
                    app={app} 
                    index={index}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center jewelry-glass-panel"
          >
            <p className="jewelry-text-muted">
              Powered by <span className="jewelry-text-luxury font-semibold">HERA Enterprise Platform</span>
            </p>
            <p className="jewelry-text-muted text-sm mt-1">
              Professional jewelry management solutions for luxury businesses
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}