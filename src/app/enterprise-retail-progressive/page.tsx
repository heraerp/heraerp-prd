'use client'

import React, { useState } from 'react'
import { useAuth } from '@/components/auth/DualAuthProvider'
import { EnterpriseRetailSolutionSidebar } from '@/components/enterprise-retail-progressive/EnterpriseRetailSolutionSidebar'
import { UniversalTourProvider, TourElement } from '@/components/tours/SimpleTourProvider'
import { 
  Package, 
  Calendar, 
  ShoppingBag, 
  CreditCard, 
  BarChart3, 
  TrendingUp,
  Megaphone,
  Users,
  Sparkles,
  Store,
  Palette,
  Target,
  Zap,
  ChevronRight,
  ArrowUpRight,
  Bell,
  Search,
  MoreHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function EnterpriseRetailSolutionHomePage() {
  const { user, workspace } = useAuth()
  const [hoveredModule, setHoveredModule] = useState<string | null>(null)

  // Modern module configuration with icons and gradients
  const retailModules = [
    {
      id: 'merchandising',
      title: 'Merchandising',
      description: 'Product lifecycle, assortments, and visual merchandising',
      icon: Palette,
      color: 'from-purple-500 to-pink-600',
      stats: '2,450 products',
      trend: '+12%',
      url: '/enterprise-retail-progressive/merchandising'
    },
    {
      id: 'planning',
      title: 'Planning',
      description: 'Demand forecasting, assortment planning, and buying',
      icon: Calendar,
      color: 'from-blue-500 to-cyan-600',
      stats: '89% accuracy',
      trend: '+5%',
      url: '/enterprise-retail-progressive/planning'
    },
    {
      id: 'procurement',
      title: 'Procurement',
      description: 'Supplier management, purchase orders, and sourcing',
      icon: ShoppingBag,
      color: 'from-green-500 to-emerald-600',
      stats: '142 suppliers',
      trend: '+8%',
      url: '/enterprise-retail-progressive/procurement'
    },
    {
      id: 'pos',
      title: 'Point of Sale',
      description: 'Omnichannel sales, transactions, and customer service',
      icon: CreditCard,
      color: 'from-orange-500 to-red-600',
      stats: '$1.2M today',
      trend: '+15%',
      url: '/enterprise-retail-progressive/pos'
    },
    {
      id: 'inventory',
      title: 'Inventory',
      description: 'Stock management, transfers, and warehouse operations',
      icon: Package,
      color: 'from-indigo-500 to-purple-600',
      stats: '98% accuracy',
      trend: '+3%',
      url: '/enterprise-retail-progressive/inventory'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Business intelligence, reporting, and insights',
      icon: BarChart3,
      color: 'from-teal-500 to-cyan-600',
      stats: '24 dashboards',
      trend: '+18%',
      url: '/enterprise-retail-progressive/analytics'
    },
    {
      id: 'promotions',
      title: 'Promotions',
      description: 'Campaign management, pricing, and loyalty programs',
      icon: Megaphone,
      color: 'from-amber-500 to-orange-600',
      stats: '18 active',
      trend: '+22%',
      url: '/enterprise-retail-progressive/promotions'
    },
    {
      id: 'customers',
      title: 'Customers',
      description: 'CRM, segmentation, and customer experience',
      icon: Users,
      color: 'from-rose-500 to-pink-600',
      stats: '45K members',
      trend: '+10%',
      url: '/enterprise-retail-progressive/customers'
    }
  ]

  // Key metrics for header
  const keyMetrics = [
    { label: 'Today\'s Revenue', value: '$45,678', change: '+12.5%', positive: true },
    { label: 'Active Stores', value: '24', change: '+2', positive: true },
    { label: 'Conversion Rate', value: '3.2%', change: '+0.4%', positive: true },
    { label: 'Avg Basket Size', value: '$78.50', change: '-2.1%', positive: false }
  ]

  return (
    <UniversalTourProvider industryKey="enterprise-retail" autoStart={true}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex">
        <TourElement tourId="sidebar">
          <EnterpriseRetailSolutionSidebar />
        </TourElement>
        
        <div className="flex-1 flex flex-col">
          {/* Premium Header */}
          <TourElement tourId="header">
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  Enterprise Retail Command Center
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
                    <Sparkles className="w-3 h-3 mr-1" />
                    HERA Powered
                  </Badge>
                </h1>
                <p className="text-gray-600 mt-1">{workspace?.name || user?.organizationName || 'Retail Excellence Platform'}</p>
              </div>
              
              {/* Header Actions */}
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="relative">
                  <Search className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Key Metrics Bar */}
            <TourElement tourId="metrics-bar">
              <div className="grid grid-cols-4 gap-4">
                {keyMetrics.map((metric, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
                      <span className={`text-sm font-medium flex items-center gap-1 ${
                        metric.positive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <TrendingUp className={`w-3 h-3 ${!metric.positive ? 'rotate-180' : ''}`} />
                        {metric.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </TourElement>
          </div>
        </header>
          </TourElement>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            {/* Welcome Section */}
            <TourElement tourId="welcome-section">
              <div className="text-center max-w-4xl mx-auto mb-16">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl mb-6 shadow-2xl">
                  <Store className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-5xl font-thin text-gray-900 mb-4">
                  Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0] || 'Retailer'}
                </h2>
                <p className="text-xl text-gray-600 font-light">
                  Your retail empire at a glance. Everything you need to excel in modern commerce.
                </p>
              </div>
            </TourElement>

            {/* Module Grid - Premium Design */}
            <TourElement tourId="module-grid">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
                {retailModules.map((module) => (
                  <TourElement key={module.id} tourId="module-card" moduleId={module.id}>
                    <div
                      onClick={() => window.location.href = module.url}
                      onMouseEnter={() => setHoveredModule(module.id)}
                      onMouseLeave={() => setHoveredModule(null)}
                      className="group cursor-pointer"
                    >
                  <div className="relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 border border-gray-100 overflow-hidden h-full">
                    {/* Premium gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-5 transition-opacity duration-700`}></div>
                    
                    {/* Floating icon */}
                    <div className="relative z-10 mb-6">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${module.color} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-500`}>
                        <module.icon className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="relative z-10">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                        {module.title}
                      </h3>
                      
                      <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                        {module.description}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-lg font-semibold text-gray-900">{module.stats}</span>
                        <Badge className="bg-green-100 text-green-700 border-0">
                          <ArrowUpRight className="w-3 h-3 mr-1" />
                          {module.trend}
                        </Badge>
                      </div>
                      
                      {/* Action */}
                      <div className="flex items-center text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
                        <span>Explore</span>
                        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                    {/* Premium shine effect */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-1000"></div>
                    </div>
                  </div>
                  </TourElement>
                ))}
              </div>
            </TourElement>

            {/* Quick Actions */}
            <TourElement tourId="quick-actions">
              <div className="mt-16 max-w-4xl mx-auto">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Quick Actions</h3>
                <div className="flex justify-center gap-4">
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg transition-all duration-300">
                    <Zap className="w-4 h-4 mr-2" />
                    Quick Sale
                  </Button>
                  <Button variant="outline" className="hover:shadow-md transition-all duration-300">
                    <Package className="w-4 h-4 mr-2" />
                    New Product
                  </Button>
                  <Button variant="outline" className="hover:shadow-md transition-all duration-300">
                    <Target className="w-4 h-4 mr-2" />
                    Create Campaign
                  </Button>
                  <Button variant="outline" className="hover:shadow-md transition-all duration-300">
                    <Users className="w-4 h-4 mr-2" />
                    Add Customer
                  </Button>
                </div>
              </div>
            </TourElement>

            {/* Footer */}
            <div className="mt-24 text-center text-sm text-gray-500">
              <p>Powered by HERA Universal Architecture • Real-time Data • Enterprise Grade</p>
            </div>
          </div>
        </main>
      </div>
    </div>
    </UniversalTourProvider>
  )
}