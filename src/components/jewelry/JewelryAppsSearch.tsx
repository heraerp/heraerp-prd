'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Crown,
  Diamond,
  Gem,
  Scale,
  Sparkles,
  Shield,
  Home,
  BarChart3,
  TrendingUp,
  Calculator,
  FileText,
  Settings,
  Users,
  Package,
  ShoppingBag,
  CreditCard,
  Receipt,
  Award,
  Star,
  Gift,
  Zap,
  Bell,
  Clock,
  Calendar,
  Building2,
  Brain,
  Camera,
  Palette,
  Search,
  Archive,
  Tag,
  Briefcase,
  BookOpen,
  Heart,
  Coins,
  Target,
  Activity,
  Layers,
  Fingerprint,
  X
} from 'lucide-react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

// All jewelry apps with search metadata
const allJewelryApps = [
  // Core Operations
  {
    id: 'dashboard',
    title: 'Dashboard',
    href: '/jewelry/dashboard',
    icon: Home,
    category: 'Core Operations',
    description: 'Overview and key metrics',
    tags: ['overview', 'metrics', 'kpi', 'summary']
  },
  {
    id: 'worklist',
    title: 'Worklist',
    href: '/jewelry/worklist',
    icon: Gem,
    category: 'Core Operations',
    description: 'Tasks and workflow management',
    tags: ['tasks', 'workflow', 'todo', 'assignments']
  },
  {
    id: 'pos',
    title: 'POS System',
    href: '/jewelry/pos',
    icon: CreditCard,
    category: 'Core Operations',
    description: 'Point of sale and transactions',
    tags: ['sales', 'transactions', 'payment', 'checkout']
  },
  {
    id: 'inventory',
    title: 'Inventory',
    href: '/jewelry/inventory',
    icon: Package,
    category: 'Core Operations',
    description: 'Stock management and tracking',
    tags: ['stock', 'items', 'products', 'warehouse']
  },
  {
    id: 'search',
    title: 'Search',
    href: '/jewelry/search',
    icon: Search,
    category: 'Core Operations',
    description: 'Find items and information',
    tags: ['find', 'lookup', 'query', 'locate']
  },

  // Quality & Certification
  {
    id: 'appraisals',
    title: 'Appraisals',
    href: '/jewelry/appraisals',
    icon: Scale,
    category: 'Quality & Certification',
    description: 'Item valuation and assessment',
    tags: ['value', 'assessment', 'evaluation', 'worth']
  },
  {
    id: 'certificates',
    title: 'Certificates',
    href: '/jewelry/certificates',
    icon: Shield,
    category: 'Quality & Certification',
    description: 'Certification management',
    tags: ['certificates', 'documentation', 'authenticity', 'proof']
  },
  {
    id: 'quality',
    title: 'Quality Control',
    href: '/jewelry/quality',
    icon: Award,
    category: 'Quality & Certification',
    description: 'Quality assurance processes',
    tags: ['quality', 'control', 'standards', 'inspection']
  },
  {
    id: 'auth',
    title: 'Authentication',
    href: '/jewelry/auth',
    icon: Fingerprint,
    category: 'Quality & Certification',
    description: 'Item authentication',
    tags: ['authentication', 'verification', 'genuine', 'real']
  },
  {
    id: 'grading',
    title: 'Grading',
    href: '/jewelry/grading',
    icon: Star,
    category: 'Quality & Certification',
    description: 'Item grading and classification',
    tags: ['grading', 'classification', 'rating', 'grade']
  },

  // Customer Management
  {
    id: 'customers',
    title: 'Customers',
    href: '/jewelry/customers',
    icon: Users,
    category: 'Customer Management',
    description: 'Customer relationship management',
    tags: ['clients', 'customers', 'contacts', 'crm']
  },
  {
    id: 'vip',
    title: 'VIP Services',
    href: '/jewelry/vip',
    icon: Crown,
    category: 'Customer Management',
    description: 'Premium customer services',
    tags: ['vip', 'premium', 'luxury', 'exclusive']
  },
  {
    id: 'wishlist',
    title: 'Wishlist',
    href: '/jewelry/wishlist',
    icon: Heart,
    category: 'Customer Management',
    description: 'Customer wish lists',
    tags: ['wishlist', 'desires', 'wants', 'favorites']
  },
  {
    id: 'loyalty',
    title: 'Loyalty Program',
    href: '/jewelry/loyalty',
    icon: Gift,
    category: 'Customer Management',
    description: 'Customer loyalty and rewards',
    tags: ['loyalty', 'rewards', 'points', 'program']
  },

  // Business Intelligence
  {
    id: 'analytics',
    title: 'Analytics',
    href: '/jewelry/analytics',
    icon: TrendingUp,
    category: 'Business Intelligence',
    description: 'Business analytics and insights',
    tags: ['analytics', 'insights', 'data', 'trends']
  },
  {
    id: 'reports',
    title: 'Reports',
    href: '/jewelry/reports',
    icon: BarChart3,
    category: 'Business Intelligence',
    description: 'Business reports and metrics',
    tags: ['reports', 'metrics', 'kpi', 'performance']
  },
  {
    id: 'finance',
    title: 'Financial',
    href: '/jewelry/finance',
    icon: Calculator,
    category: 'Business Intelligence',
    description: 'Financial management',
    tags: ['finance', 'accounting', 'money', 'budget']
  },
  {
    id: 'profit',
    title: 'Profit Analysis',
    href: '/jewelry/profit',
    icon: Target,
    category: 'Business Intelligence',
    description: 'Profitability analysis',
    tags: ['profit', 'margin', 'profitability', 'earnings']
  },
  {
    id: 'trends',
    title: 'Market Trends',
    href: '/jewelry/trends',
    icon: Activity,
    category: 'Business Intelligence',
    description: 'Market and trend analysis',
    tags: ['trends', 'market', 'forecasting', 'patterns']
  },

  // Catalog & Products
  {
    id: 'catalog',
    title: 'Catalog',
    href: '/jewelry/catalog',
    icon: BookOpen,
    category: 'Catalog & Products',
    description: 'Product catalog management',
    tags: ['catalog', 'products', 'items', 'collection']
  },
  {
    id: 'collections',
    title: 'Collections',
    href: '/jewelry/collections',
    icon: Layers,
    category: 'Catalog & Products',
    description: 'Product collections',
    tags: ['collections', 'sets', 'groups', 'series']
  },
  {
    id: 'pricing',
    title: 'Pricing',
    href: '/jewelry/pricing',
    icon: Coins,
    category: 'Catalog & Products',
    description: 'Price management',
    tags: ['pricing', 'cost', 'price', 'rates']
  },
  {
    id: 'tags',
    title: 'Tags & Labels',
    href: '/jewelry/tags',
    icon: Tag,
    category: 'Catalog & Products',
    description: 'Item tagging and labeling',
    tags: ['tags', 'labels', 'categories', 'classification']
  },

  // Operations
  {
    id: 'repairs',
    title: 'Repairs',
    href: '/jewelry/repairs',
    icon: Zap,
    category: 'Operations',
    description: 'Repair and maintenance services',
    tags: ['repairs', 'maintenance', 'fix', 'service']
  },
  {
    id: 'custom',
    title: 'Custom Orders',
    href: '/jewelry/custom',
    icon: Sparkles,
    category: 'Operations',
    description: 'Custom jewelry orders',
    tags: ['custom', 'bespoke', 'personalized', 'orders']
  },
  {
    id: 'appointments',
    title: 'Appointments',
    href: '/jewelry/appointments',
    icon: Calendar,
    category: 'Operations',
    description: 'Appointment scheduling',
    tags: ['appointments', 'schedule', 'booking', 'calendar']
  },
  {
    id: 'schedule',
    title: 'Scheduling',
    href: '/jewelry/schedule',
    icon: Clock,
    category: 'Operations',
    description: 'Resource and staff scheduling',
    tags: ['scheduling', 'time', 'resources', 'staff']
  },

  // Sales & Marketing
  {
    id: 'sales',
    title: 'Sales',
    href: '/jewelry/sales',
    icon: ShoppingBag,
    category: 'Sales & Marketing',
    description: 'Sales management',
    tags: ['sales', 'selling', 'revenue', 'orders']
  },
  {
    id: 'invoices',
    title: 'Invoices',
    href: '/jewelry/invoices',
    icon: Receipt,
    category: 'Sales & Marketing',
    description: 'Invoice management',
    tags: ['invoices', 'billing', 'payments', 'receipts']
  },
  {
    id: 'promotions',
    title: 'Promotions',
    href: '/jewelry/promotions',
    icon: Gift,
    category: 'Sales & Marketing',
    description: 'Marketing and promotions',
    tags: ['promotions', 'marketing', 'discounts', 'offers']
  },
  {
    id: 'gallery',
    title: 'Photography',
    href: '/jewelry/gallery',
    icon: Camera,
    category: 'Sales & Marketing',
    description: 'Product photography',
    tags: ['photography', 'images', 'gallery', 'photos']
  },

  // Administration
  {
    id: 'settings',
    title: 'Settings',
    href: '/jewelry/settings',
    icon: Settings,
    category: 'Administration',
    description: 'System configuration',
    tags: ['settings', 'configuration', 'preferences', 'system']
  },
  {
    id: 'security',
    title: 'Security',
    href: '/jewelry/security',
    icon: Shield,
    category: 'Administration',
    description: 'Security management',
    tags: ['security', 'protection', 'access', 'permissions']
  },
  {
    id: 'branches',
    title: 'Branch Management',
    href: '/jewelry/branches',
    icon: Building2,
    category: 'Administration',
    description: 'Multi-location management',
    tags: ['branches', 'locations', 'stores', 'outlets']
  },
  {
    id: 'staff',
    title: 'Staff Portal',
    href: '/jewelry/staff',
    icon: Briefcase,
    category: 'Administration',
    description: 'Staff management',
    tags: ['staff', 'employees', 'team', 'personnel']
  },
  {
    id: 'archive',
    title: 'Archive',
    href: '/jewelry/archive',
    icon: Archive,
    category: 'Administration',
    description: 'Data archival',
    tags: ['archive', 'backup', 'storage', 'history']
  },
  {
    id: 'notifications',
    title: 'Notifications',
    href: '/jewelry/notifications',
    icon: Bell,
    category: 'Administration',
    description: 'Notification management',
    tags: ['notifications', 'alerts', 'messages', 'updates']
  },
  {
    id: 'themes',
    title: 'Themes',
    href: '/jewelry/themes',
    icon: Palette,
    category: 'Administration',
    description: 'Theme customization',
    tags: ['themes', 'appearance', 'design', 'customization']
  },
  {
    id: 'ai',
    title: 'Smart AI',
    href: '/jewelry/ai',
    icon: Brain,
    category: 'Administration',
    description: 'AI-powered features',
    tags: ['ai', 'artificial intelligence', 'smart', 'automation']
  }
]

interface JewelryAppsSearchProps {
  isOpen: boolean
  onClose: () => void
}

export function JewelryAppsSearch({ isOpen, onClose }: JewelryAppsSearchProps) {
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredApps, setFilteredApps] = useState(allJewelryApps)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredApps(allJewelryApps)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = allJewelryApps.filter(
      app =>
        app.title.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query) ||
        app.category.toLowerCase().includes(query) ||
        app.tags.some(tag => tag.toLowerCase().includes(query))
    )

    setFilteredApps(filtered)
  }, [searchQuery])

  // Group apps by category
  const groupedApps = filteredApps.reduce(
    (acc, app) => {
      if (!acc[app.category]) {
        acc[app.category] = []
      }
      acc[app.category].push(app)
      return acc
    },
    {} as Record<string, typeof allJewelryApps>
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen || !mounted) return null

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 backdrop-blur-sm z-50"
        style={{ backgroundColor: 'rgba(26, 31, 61, 0.8)' }}
        onClick={onClose}
        onKeyDown={handleKeyDown}
      >
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={prefersReducedMotion ? {} : { opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="jewelry-glass-panel w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-yellow-500/20">
              <div>
                <h2 className="text-2xl font-bold jewelry-text-luxury flex items-center gap-3">
                  <Crown className="h-6 w-6 jewelry-text-gold" />
                  Jewelry Management Suite
                </h2>
                <p className="text-sm mt-1 jewelry-text-muted">
                  Search and access all jewelry management tools
                </p>
              </div>
              <button
                onClick={onClose}
                className="jewelry-glass-btn p-2 rounded-xl transition-all hover:scale-110"
              >
                <X className="h-5 w-5 jewelry-text-luxury" />
              </button>
            </div>

            {/* Search */}
            <div className="p-6 border-b border-yellow-500/20">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 jewelry-text-muted" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search apps, features, or categories..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 jewelry-glass-input rounded-xl text-lg focus:ring-2 focus:ring-yellow-500/50 focus:outline-none"
                />
              </div>
            </div>

            {/* Apps Grid */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {Object.entries(groupedApps).map(([category, apps]) => (
                <div key={category} className="mb-8 last:mb-0">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4 flex items-center gap-2">
                    <Diamond className="h-4 w-4 jewelry-text-gold" />
                    {category}
                    <span className="text-sm jewelry-text-muted font-normal">({apps.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {apps.map(app => {
                      const Icon = app.icon
                      return (
                        <motion.a
                          key={app.id}
                          href={app.href}
                          onClick={onClose}
                          className="jewelry-glass-card p-4 rounded-xl transition-all hover:scale-[1.02] group"
                          whileHover={prefersReducedMotion ? {} : { y: -2 }}
                          whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="jewelry-crown-glow p-2 rounded-lg group-hover:scale-110 transition-transform">
                              <Icon className="h-5 w-5 jewelry-text-gold" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold jewelry-text-luxury group-hover:jewelry-text-gold transition-colors">
                                {app.title}
                              </h4>
                              <p className="text-sm jewelry-text-muted mt-1 line-clamp-2">
                                {app.description}
                              </p>
                            </div>
                          </div>
                        </motion.a>
                      )
                    })}
                  </div>
                </div>
              ))}

              {filteredApps.length === 0 && (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 jewelry-text-muted mx-auto mb-4" />
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-2">No apps found</h3>
                  <p className="jewelry-text-muted">
                    Try adjusting your search terms or browse all categories above.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
