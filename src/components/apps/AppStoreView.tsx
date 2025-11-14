'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle,
  Store,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  Star
} from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { AppPurchaseModal } from '@/components/apps/AppPurchaseModal'

interface AppStoreViewProps {
  highlightApp?: string | null
}

// Available HERA apps (mock data - in production, fetch from API)
const AVAILABLE_APPS = [
  {
    code: 'SALON',
    name: 'HERA Salon',
    description: 'Complete salon management system with appointment booking, staff management, and inventory control',
    icon: Store,
    category: 'Operations',
    pricing: { plan: 'professional', price: 99, period: 'month' },
    features: ['Appointment Booking', 'Staff Management', 'Inventory Control', 'Customer Analytics'],
    rating: 4.8,
    installs: 1200
  },
  {
    code: 'RETAIL',
    name: 'HERA Retail',
    description: 'Omnichannel retail management with POS, inventory, and e-commerce integration',
    icon: ShoppingBag,
    category: 'Operations',
    pricing: { plan: 'professional', price: 149, period: 'month' },
    features: ['Point of Sale', 'Inventory Management', 'E-commerce Integration', 'Multi-location Support'],
    rating: 4.7,
    installs: 850
  },
  {
    code: 'WMS',
    name: 'HERA Warehouse',
    description: 'Warehouse management system with advanced logistics and fulfillment capabilities',
    icon: Package,
    category: 'Operations',
    pricing: { plan: 'enterprise', price: 299, period: 'month' },
    features: ['Warehouse Optimization', 'Order Fulfillment', 'Inventory Tracking', 'Shipping Integration'],
    rating: 4.9,
    installs: 450
  },
  {
    code: 'CENTRAL',
    name: 'HERA Central',
    description: 'Central command center for platform administration and multi-org management',
    icon: TrendingUp,
    category: 'Platform',
    pricing: { plan: 'enterprise', price: 499, period: 'month' },
    features: ['Platform Administration', 'Multi-org Management', 'Analytics Dashboard', 'User Management'],
    rating: 5.0,
    installs: 125
  },
  {
    code: 'CRM',
    name: 'HERA CRM',
    description: 'Customer relationship management with sales pipeline and marketing automation',
    icon: Users,
    category: 'Sales & Marketing',
    pricing: { plan: 'professional', price: 79, period: 'month' },
    features: ['Contact Management', 'Sales Pipeline', 'Marketing Automation', 'Lead Scoring'],
    rating: 4.6,
    installs: 2100
  },
  {
    code: 'FINANCE',
    name: 'HERA Finance',
    description: 'Financial management system with accounting, invoicing, and reporting',
    icon: DollarSign,
    category: 'Finance',
    pricing: { plan: 'professional', price: 129, period: 'month' },
    features: ['General Ledger', 'Accounts Payable', 'Accounts Receivable', 'Financial Reporting'],
    rating: 4.7,
    installs: 980
  }
]

export function AppStoreView({ highlightApp }: AppStoreViewProps) {
  const { user, organization, availableApps } = useHERAAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedApp, setSelectedApp] = useState<typeof AVAILABLE_APPS[0] | null>(null)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)

  // Get list of installed app codes for quick lookup
  const installedAppCodes = new Set(availableApps.map(app => app.code.toUpperCase()))

  // Filter apps based on search and category
  const filteredApps = AVAILABLE_APPS.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || app.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Get unique categories
  const categories = ['All', ...Array.from(new Set(AVAILABLE_APPS.map(app => app.category)))]

  // Auto-highlight app if specified
  useEffect(() => {
    if (highlightApp) {
      const app = AVAILABLE_APPS.find(a => a.code.toUpperCase() === highlightApp.toUpperCase())
      if (app) {
        // Scroll to app card and add visual highlight
        setTimeout(() => {
          const element = document.getElementById(`app-card-${app.code}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            element.classList.add('ring-4', 'ring-emerald-500/50')
            setTimeout(() => {
              element.classList.remove('ring-4', 'ring-emerald-500/50')
            }, 3000)
          }
        }, 500)
      }
    }
  }, [highlightApp])

  const handlePurchase = (app: typeof AVAILABLE_APPS[0]) => {
    setSelectedApp(app)
    setShowPurchaseModal(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Store className="w-8 h-8 text-emerald-400" />
                HERA App Store
              </h1>
              <p className="text-slate-400 mt-1">
                Discover and install apps for {organization?.name || 'your organization'}
              </p>
            </div>
            <Badge variant="outline" className="px-4 py-2 text-sm border-emerald-500/30 text-emerald-400">
              {availableApps.length} Installed
            </Badge>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search apps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder-slate-400"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  }
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* App Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredApps.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No apps found</h3>
            <p className="text-slate-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApps.map((app) => {
              const Icon = app.icon
              const isInstalled = installedAppCodes.has(app.code)

              return (
                <Card
                  key={app.code}
                  id={`app-card-${app.code}`}
                  className="bg-slate-900/50 border-slate-800 hover:border-emerald-500/30 transition-all duration-300 group"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon className="w-7 h-7 text-emerald-400" />
                      </div>
                      {isInstalled && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Installed
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl text-white">{app.name}</CardTitle>
                    <CardDescription className="text-slate-400 text-sm">
                      {app.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      {/* Features */}
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                          Key Features
                        </p>
                        <div className="space-y-1">
                          {app.features.slice(0, 3).map((feature, index) => (
                            <p key={index} className="text-sm text-slate-300 flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                              {feature}
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-slate-400 pt-4 border-t border-slate-800">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span>{app.rating}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{app.installs.toLocaleString()} installs</span>
                        </div>
                      </div>

                      {/* Pricing and Action */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                        <div>
                          <p className="text-2xl font-bold text-white">
                            ${app.pricing.price}
                          </p>
                          <p className="text-xs text-slate-400">per {app.pricing.period}</p>
                        </div>
                        {isInstalled ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-700 text-slate-300 cursor-not-allowed"
                            disabled
                          >
                            Installed
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handlePurchase(app)}
                            size="sm"
                            className="bg-emerald-500 hover:bg-emerald-600 text-white"
                          >
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            Install
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Purchase Modal */}
      {selectedApp && (
        <AppPurchaseModal
          app={selectedApp as any}
          isOpen={showPurchaseModal}
          onClose={() => {
            setShowPurchaseModal(false)
            setSelectedApp(null)
          }}
        />
      )}
    </div>
  )
}
