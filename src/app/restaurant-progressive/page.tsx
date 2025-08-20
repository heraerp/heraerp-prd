'use client'

import React, { useState } from 'react'
import { useAuth } from '@/components/auth/DualAuthProvider'
import { RestaurantManagementSidebar } from '@/components/restaurant-progressive/RestaurantManagementSidebar'
import { 
  Package, Calendar, ShoppingBag, CreditCard, BarChart3, TrendingUp,
  Megaphone, Users, Sparkles, Store, Palette, Target, Zap,
  ChevronRight, ArrowUpRight, Bell, Search, MoreHorizontal,
  DollarSign, Building, Heart, Briefcase, Truck, Globe,
  Settings, Shield, Activity, FileText, Database, Cloud
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function RestaurantManagementHomePage() {
  const { user, workspace } = useAuth()
  const [hoveredModule, setHoveredModule] = useState<string | null>(null)

  // Modern module configuration with icons and gradients
  const restaurantModules = [
    {
      id: 'pos',
      title: 'Point of Sale',
      description: 'Quick service and seamless transactions',
      icon: CreditCard,
      color: 'from-purple-500 to-pink-600',
      stats: '384 items',
      trend: '+23%',
      url: '/restaurant-pos'
    },
    {
      id: 'menu',
      title: 'Menu Management',
      description: 'Craft your culinary masterpieces',
      icon: FileText,
      color: 'from-blue-500 to-cyan-600',
      stats: '759 items',
      trend: '+6%',
      url: '/restaurant-progressive/menu'
    },
    {
      id: 'kitchen',
      title: 'Kitchen Display',
      description: 'Real-time order orchestration',
      icon: Store,
      color: 'from-green-500 to-emerald-600',
      stats: '367 items',
      trend: '+16%',
      url: '/restaurant-pos/kitchen'
    },
    {
      id: 'delivery',
      title: 'Delivery Orders',
      description: 'Expand your reach, delight customers',
      icon: Truck,
      color: 'from-orange-500 to-red-600',
      stats: '287 items',
      trend: '+9%',
      url: '/restaurant-progressive/delivery'
    },
    {
      id: 'inventory',
      title: 'Inventory',
      description: 'Smart stock management and waste reduction',
      icon: Package,
      color: 'from-indigo-500 to-purple-600',
      stats: '143 items',
      trend: '+11%',
      url: '/restaurant-progressive/inventory'
    }
  ]

  // Key metrics for header
  const keyMetrics = [
    { label: 'Today\'s Revenue', value: '$27,607', change: '+12.5%', positive: true },
    { label: 'Active Tables', value: '133', change: '+2', positive: true },
    { label: 'Conversion Rate', value: '7.0%', change: '+0.7%', positive: true },
    { label: 'Avg Transaction', value: '$50.00', change: '-1.4%', positive: false }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex">
      <RestaurantManagementSidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Premium Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  Restaurant Management Command Center
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
                    <Sparkles className="w-3 h-3 mr-1" />
                    HERA Powered
                  </Badge>
                </h1>
                <p className="text-gray-600 mt-1">{workspace?.name || user?.organizationName || 'Restaurant Excellence Platform'}</p>
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
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            {/* Welcome Section */}
            <div className="text-center max-w-4xl mx-auto mb-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl mb-6 shadow-2xl">
                <Store className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-5xl font-thin text-gray-900 mb-4">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0] || 'Restaurant Professional'}
              </h2>
              <p className="text-xl text-gray-600 font-light">
                Your restaurant empire at a glance. Everything you need to excel in modern hospitality.
              </p>
            </div>

            {/* Module Grid - Premium Design */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
              {restaurantModules.map((module) => (
                <div
                  key={module.id}
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
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-16 max-w-4xl mx-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Quick Actions</h3>
              <div className="flex justify-center gap-4">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg transition-all duration-300">
                  <Zap className="w-4 h-4 mr-2" />
                  Quick Order
                </Button>
                <Button variant="outline" className="hover:shadow-md transition-all duration-300">
                  <Package className="w-4 h-4 mr-2" />
                  New Menu Item
                </Button>
                <Button variant="outline" className="hover:shadow-md transition-all duration-300">
                  <Target className="w-4 h-4 mr-2" />
                  Create Promotion
                </Button>
                <Button variant="outline" className="hover:shadow-md transition-all duration-300">
                  <Users className="w-4 h-4 mr-2" />
                  Add Reservation
                </Button>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-24 text-center text-sm text-gray-500">
              <p>Powered by HERA Universal Architecture • Real-time Data • Enterprise Grade</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}