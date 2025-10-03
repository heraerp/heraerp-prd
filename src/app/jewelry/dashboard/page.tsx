'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Crown,
  Diamond,
  Gem,
  Scale,
  TrendingUp,
  Users,
  Package,
  ShoppingBag,
  Star,
  Award,
  Calculator,
  DollarSign,
  Search,
  Route
} from 'lucide-react'
import { JewelryAppTile } from '@/components/jewelry/JewelryAppTile'
import '@/styles/jewelry-glassmorphism.css'

// Featured apps for the dashboard
const featuredApps = [
  {
    id: 'search',
    title: 'Global Search',
    description: 'Universal entity search',
    icon: Search,
    href: '/jewelry/search',
    featured: true
  },
  {
    id: 'pos',
    title: 'POS System',
    description: 'Complete point of sale',
    icon: ShoppingBag,
    href: '/jewelry/pos',
    featured: true
  },
  {
    id: 'inventory',
    title: 'Inventory',
    description: 'Stock management',
    icon: Package,
    href: '/jewelry/inventory',
    featured: true
  },
  {
    id: 'appraisals',
    title: 'Appraisals',
    description: 'Item valuations',
    icon: Scale,
    href: '/jewelry/appraisals',
    featured: true
  },
  {
    id: 'customers',
    title: 'Customers',
    description: 'Customer management',
    icon: Users,
    href: '/jewelry/customers',
    featured: true
  },
  {
    id: 'reports',
    title: 'Reports',
    description: 'Business analytics',
    icon: Calculator,
    href: '/jewelry/reports',
    featured: true
  },
  {
    id: 'vip',
    title: 'VIP Services',
    description: 'Premium customer care',
    icon: Crown,
    href: '/jewelry/vip',
    featured: true
  },
  {
    id: 'customer-journey',
    title: 'Customer Journey',
    description: 'End-to-end experience map',
    icon: Route,
    href: '/jewelry/customer-journey',
    featured: true
  }
]

export default function JewelryDashboard() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [currentRole, setCurrentRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for organization context
  useEffect(() => {
    // Allow some time for auth to settle
    const timer = setTimeout(() => {
      const orgId = localStorage.getItem('organizationId')
      const jewelryRole = localStorage.getItem('jewelryRole')
      
      if (!orgId || !jewelryRole) {
        // No organization context, redirect to demo
        router.push('/jewelry/demo')
        return
      }
      
      setOrganizationId(orgId)
      setCurrentRole(jewelryRole)
      setIsLoading(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [router])

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen jewelry-gradient-bg flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="jewelry-glass-card p-6"
        >
          <Crown className="h-12 w-12 jewelry-text-gold" />
        </motion.div>
      </div>
    )
  }

  // Don't render dashboard if no org context
  if (!organizationId) {
    return null
  }

  const stats = [
    {
      title: 'Total Inventory',
      value: '2,847',
      change: '+12.5%',
      icon: Package,
      color: 'jewelry-icon-gold'
    },
    {
      title: 'Monthly Sales',
      value: '$847,250',
      change: '+8.3%',
      icon: TrendingUp,
      color: 'jewelry-icon-gold'
    },
    {
      title: 'VIP Customers',
      value: '156',
      change: '+5.2%',
      icon: Crown,
      color: 'jewelry-icon-gold'
    },
    {
      title: 'Appraisals Due',
      value: '23',
      change: '-3.1%',
      icon: Scale,
      color: 'jewelry-icon-gold'
    }
  ]

  const recentActivity = [
    { action: 'Diamond Ring Sold', amount: '$12,450', time: '2 hours ago', icon: Diamond },
    { action: 'Emerald Necklace Appraised', amount: '$8,900', time: '4 hours ago', icon: Gem },
    { action: 'Gold Bracelet Added', amount: '$3,200', time: '6 hours ago', icon: Award },
    { action: 'Platinum Watch Certified', amount: '$15,700', time: '8 hours ago', icon: Star }
  ]

  const filteredApps = featuredApps.filter(
    app =>
      searchQuery === '' ||
      app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
      >
        <div>
          <h1 className="jewelry-heading text-4xl font-bold flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="jewelry-glass-card p-3"
            >
              <Crown className="h-8 w-8 jewelry-text-gold" />
            </motion.div>
            HERA Jewelry
          </h1>
          <p className="jewelry-text-luxury mt-2 text-lg">
            Complete luxury jewelry management platform
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="jewelry-glass-card p-4">
            <div className="text-center">
              <p className="jewelry-text-high-contrast text-3xl font-bold">$2.4M</p>
              <p className="jewelry-text-muted text-sm">Total Value</p>
            </div>
          </div>
          
          {currentRole && (
            <div className="jewelry-glass-card p-4">
              <div className="text-center">
                <p className="jewelry-text-gold text-lg font-bold">{currentRole}</p>
                <p className="jewelry-text-muted text-sm">Current Role</p>
                <button
                  onClick={() => router.push('/jewelry/demo?logout=true')}
                  className="mt-2 text-xs jewelry-text-muted hover:jewelry-text-gold transition-colors"
                >
                  Switch Role
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
              className="jewelry-glass-card p-6 jewelry-scale-hover"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="jewelry-crown-glow p-3 rounded-xl">
                  <Icon className="h-6 w-6 jewelry-text-gold" />
                </div>
                <span
                  className={`text-sm font-semibold px-3 py-1 rounded-full ${
                    stat.change.startsWith('+')
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {stat.change}
                </span>
              </div>
              <div>
                <h3 className="jewelry-text-high-contrast text-2xl font-bold mb-1">{stat.value}</h3>
                <p className="jewelry-text-muted text-sm">{stat.title}</p>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Search and Apps Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="jewelry-text-luxury text-2xl font-semibold flex items-center gap-2">
            <Diamond className="h-6 w-6 jewelry-text-gold" />
            Featured Applications
          </h2>

          {/* Quick Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 jewelry-text-muted" />
            <input
              type="text"
              placeholder="Search apps..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 jewelry-glass-input rounded-lg text-sm focus:ring-2 focus:ring-yellow-500/50 focus:outline-none"
            />
          </div>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApps.map((app, index) => (
            <JewelryAppTile key={app.id} app={app} index={index} />
          ))}
        </div>

        {filteredApps.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 jewelry-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold jewelry-text-luxury mb-2">No apps found</h3>
            <p className="jewelry-text-muted">
              Try adjusting your search terms or browse all apps from the navigation menu.
            </p>
          </div>
        )}
      </motion.div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="jewelry-glass-panel p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="jewelry-text-luxury text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 jewelry-icon-gold" />
              Recent Activity
            </h2>
            <button className="jewelry-btn-secondary px-4 py-2 text-sm">View All</button>
          </div>

          <div className="space-y-4">
            {recentActivity.map((activity, index) => {
              const Icon = activity.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center gap-4 p-4 jewelry-glass-card hover:scale-[1.02] transition-transform"
                >
                  <div className="jewelry-crown-glow p-2 rounded-lg">
                    <Icon className="h-5 w-5 jewelry-icon-gold" />
                  </div>
                  <div className="flex-1">
                    <p className="jewelry-text-high-contrast font-medium">{activity.action}</p>
                    <p className="jewelry-text-muted text-sm">{activity.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="jewelry-text-gold font-bold">{activity.amount}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Business Metrics */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="jewelry-glass-panel p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="jewelry-text-luxury text-xl font-semibold flex items-center gap-2">
              <Star className="h-5 w-5 jewelry-icon-gold" />
              Business Metrics
            </h2>
          </div>

          <div className="space-y-6">
            <div className="text-center p-4 jewelry-glass-card">
              <Diamond className="h-10 w-10 mx-auto mb-3 jewelry-icon-gold" />
              <h3 className="jewelry-text-high-contrast text-2xl font-bold">847</h3>
              <p className="jewelry-text-muted">Premium Pieces</p>
            </div>
            <div className="text-center p-4 jewelry-glass-card">
              <Star className="h-10 w-10 mx-auto mb-3 jewelry-icon-gold" />
              <h3 className="jewelry-text-high-contrast text-2xl font-bold">4.9/5</h3>
              <p className="jewelry-text-muted">Customer Rating</p>
            </div>
            <div className="text-center p-4 jewelry-glass-card">
              <DollarSign className="h-10 w-10 mx-auto mb-3 jewelry-icon-gold" />
              <h3 className="jewelry-text-high-contrast text-2xl font-bold">$12.4M</h3>
              <p className="jewelry-text-muted">Annual Revenue</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
