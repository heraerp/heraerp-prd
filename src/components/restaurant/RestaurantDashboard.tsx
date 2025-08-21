'use client'

import React, { useState, useEffect } from 'react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  Users, 
  Clock,
  ChefHat,
  Receipt,
  Settings,
  BarChart3,
  LogOut,
  Plus,
  Menu,
  Package,
  Truck
} from 'lucide-react'

// Restaurant Dashboard - Universal HERA Architecture Demo
export function RestaurantDashboard() {
  const { user, organization, logout } = useMultiOrgAuth()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [todaysStats, setTodaysStats] = useState({
    revenue: 0,
    orders: 0,
    customers: 0,
    avgOrderTime: 0
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Load restaurant statistics from API
  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoadingStats(true)
        const response = await fetch('/api/v1/restaurant/stats')
        const result = await response.json()
        
        if (result.success) {
          setTodaysStats(result.data.todaysStats)
          setRecentOrders(result.data.recentOrders)
        } else {
          console.error('Failed to load restaurant stats:', result.message)
        }
      } catch (error) {
        console.error('Error loading restaurant stats:', error)
      } finally {
        setIsLoadingStats(false)
      }
    }

    loadStats()
    
    // Refresh stats every 30 seconds
    const statsTimer = setInterval(loadStats, 30000)
    return () => clearInterval(statsTimer)
  }, [])

  const handleLogout = async () => {
    await logout()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Restaurant Info */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {organization?.organization_name || 'Restaurant Manager'}
                </h1>
                <p className="text-sm text-gray-500">
                  {currentTime.toLocaleDateString()} • {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Right: User Actions */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user?.full_name || 'Manager'}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 border-gray-300"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Today's Performance */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Revenue */}
            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Revenue</p>
                  <p className="text-2xl font-bold text-green-900">
                    {isLoadingStats ? '...' : `$${todaysStats.revenue.toFixed(2)}`}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </Card>

            {/* Orders */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Orders</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {isLoadingStats ? '...' : todaysStats.orders}
                  </p>
                </div>
                <Receipt className="w-8 h-8 text-blue-600" />
              </div>
            </Card>

            {/* Customers */}
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800">Customers</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {isLoadingStats ? '...' : todaysStats.customers}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </Card>

            {/* Avg Order Time */}
            <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-800">Avg Order Time</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {isLoadingStats ? '...' : `${todaysStats.avgOrderTime} min`}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <Link href="/restaurant/orders">
              <Button className="h-20 w-full bg-blue-600 hover:bg-blue-700 text-white flex-col space-y-2">
                <Plus className="w-6 h-6" />
                <span>Orders</span>
              </Button>
            </Link>
            
            <Link href="/restaurant/menu">
              <Button 
                variant="outline" 
                className="h-20 w-full flex-col space-y-2 border-gray-300 hover:bg-gray-50"
              >
                <Menu className="w-6 h-6" />
                <span>Menu</span>
              </Button>
            </Link>
            
            <Link href="/restaurant/customers">
              <Button 
                variant="outline"
                className="h-20 w-full flex-col space-y-2 border-gray-300 hover:bg-gray-50"
              >
                <Users className="w-6 h-6" />
                <span>Customers</span>
              </Button>
            </Link>
            
            <Link href="/restaurant/kitchen">
              <Button 
                className="h-20 w-full bg-gradient-to-br from-orange-600 to-red-700 hover:from-orange-700 hover:to-red-800 text-white flex-col space-y-2 shadow-lg"
              >
                <ChefHat className="w-6 h-6" />
                <span>Kitchen</span>
              </Button>
            </Link>
            
            <Link href="/restaurant/financial">
              <Button 
                className="h-20 w-full bg-gradient-to-br from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white flex-col space-y-2 shadow-lg"
              >
                <BarChart3 className="w-6 h-6" />
                <span>Financial</span>
              </Button>
            </Link>
            
            <Link href="/restaurant/operations">
              <Button 
                className="h-20 w-full bg-gradient-to-br from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 text-white flex-col space-y-2 shadow-lg"
              >
                <BarChart3 className="w-6 h-6" />
                <span>Operations</span>
              </Button>
            </Link>
            
            <Link href="/procurement">
              <Button 
                className="h-20 w-full bg-gradient-to-br from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white flex-col space-y-2 shadow-lg"
              >
                <Package className="w-6 h-6" />
                <span>Procurement</span>
              </Button>
            </Link>
            
            <Link href="/delivery-platforms">
              <Button 
                className="h-20 w-full bg-gradient-to-br from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white flex-col space-y-2 shadow-lg"
              >
                <Truck className="w-6 h-6" />
                <span>Delivery</span>
              </Button>
            </Link>
            
            <Link href="/restaurant/table-management">
              <Button 
                className="h-20 w-full bg-gradient-to-br from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white flex-col space-y-2 shadow-lg"
              >
                <BarChart3 className="w-6 h-6" />
                <span>Tables</span>
              </Button>
            </Link>
            
            <Button variant="outline" className="h-20 flex-col space-y-2 border-gray-300 hover:bg-gray-50">
              <Settings className="w-6 h-6" />
              <span>Settings</span>
            </Button>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
            <Button variant="outline" size="sm">
              View All Orders
            </Button>
          </div>
          <Card className="overflow-hidden">
            <div className="divide-y divide-gray-200">
              {recentOrders.map((order) => (
                <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <span className="font-semibold text-gray-900">{order.id}</span>
                        <Badge variant="secondary" className="text-xs">
                          {order.table}
                        </Badge>
                        <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{order.items}</p>
                      <p className="text-xs text-gray-500">{order.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">${order.total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* HERA Universal Platform Attribution */}
        <div className="text-center py-8 border-t border-gray-200">
          <div className="max-w-lg mx-auto">
            <p className="text-sm text-gray-500 mb-2">
              This restaurant management system demonstrates how HERA's universal 6-table architecture 
              can power industry-specific applications without custom database schemas.
            </p>
            <p className="text-xs text-gray-400">
              <span className="font-semibold">Powered by HERA Universal Platform</span> • One platform, infinite business possibilities
            </p>
            <div className="mt-4 text-xs text-gray-400">
              <span className="bg-gray-100 px-2 py-1 rounded text-gray-600">
                core_entities • core_dynamic_data • universal_transactions
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}