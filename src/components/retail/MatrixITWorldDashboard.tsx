'use client'

import { useState } from 'react'
import { 
  Package, 
  Users, 
  TruckIcon, 
  MapPin, 
  DollarSign, 
  BarChart3,
  ShoppingCart,
  Smartphone,
  Monitor,
  Warehouse,
  Settings,
  PlusCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function MatrixITWorldDashboard() {
  const [activeView, setActiveView] = useState('overview')

  // MatrixIT World business data
  const branchData = [
    { id: 1, name: 'Kochi Main', type: 'Main Branch', status: 'Active', stock: 1250 },
    { id: 2, name: 'Trivandrum Main', type: 'Main Branch', status: 'Active', stock: 980 },
    { id: 3, name: 'Kozhikode Distributor', type: 'Distributor', status: 'Active', stock: 2100 },
    { id: 4, name: 'Thrissur Retail', type: 'Retail', status: 'Active', stock: 540 },
    { id: 5, name: 'Kannur Service', type: 'Service Center', status: 'Active', stock: 320 },
    { id: 6, name: 'Kollam Retail', type: 'Retail', status: 'Active', stock: 680 }
  ]

  const productCategories = [
    { name: 'Desktop PCs', count: 145, revenue: '₹24.8L' },
    { name: 'Laptops', count: 298, revenue: '₹56.2L' },
    { name: 'Mobile Phones', count: 520, revenue: '₹42.1L' },
    { name: 'Components', count: 1240, revenue: '₹18.9L' },
    { name: 'Accessories', count: 2850, revenue: '₹12.4L' }
  ]

  const todayMetrics = {
    totalSales: '₹2.8L',
    ordersProcessed: 47,
    stockTransfers: 12,
    activeCustomers: 156
  }

  return (
    <div className="space-y-6">
      {/* Mobile Welcome Card - MANDATORY pattern */}
      <div className="md:hidden bg-gradient-to-br from-blue-600/20 to-blue-400/10 rounded-2xl p-6 mb-6">
        <h2 className="text-2xl font-bold text-champagne mb-2">Welcome to MatrixIT World</h2>
        <p className="text-bronze">Managing 6 branches across Kerala with real-time inventory</p>
        <div className="mt-4 flex items-center gap-4">
          <Badge variant="secondary" className="bg-green-600/20 text-green-400">
            All Systems Online
          </Badge>
          <Badge variant="secondary" className="bg-blue-600/20 text-blue-400">
            6 Branches Active
          </Badge>
        </div>
      </div>

      {/* Today's Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-charcoal border-gold/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              <span className="text-sm text-bronze">Today's Sales</span>
            </div>
            <p className="text-xl font-bold text-champagne">{todayMetrics.totalSales}</p>
          </CardContent>
        </Card>

        <Card className="bg-charcoal border-gold/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-bronze">Orders</span>
            </div>
            <p className="text-xl font-bold text-champagne">{todayMetrics.ordersProcessed}</p>
          </CardContent>
        </Card>

        <Card className="bg-charcoal border-gold/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TruckIcon className="w-5 h-5 text-orange-400" />
              <span className="text-sm text-bronze">Transfers</span>
            </div>
            <p className="text-xl font-bold text-champagne">{todayMetrics.stockTransfers}</p>
          </CardContent>
        </Card>

        <Card className="bg-charcoal border-gold/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-bronze">Customers</span>
            </div>
            <p className="text-xl font-bold text-champagne">{todayMetrics.activeCustomers}</p>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Quick Actions - MANDATORY pattern */}
      <div className="md:hidden space-y-2 mb-6">
        <Button className="w-full min-h-[56px] bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95">
          <PlusCircle className="w-5 h-5" />
          New Sale Order
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button className="min-h-[56px] bg-charcoal text-champagne rounded-xl flex items-center justify-center gap-2 active:scale-95">
            <Package className="w-5 h-5" />
            Inventory
          </Button>
          <Button className="min-h-[56px] bg-charcoal text-champagne rounded-xl flex items-center justify-center gap-2 active:scale-95">
            <Warehouse className="w-5 h-5" />
            Transfer Stock
          </Button>
        </div>
      </div>

      {/* Branch Status Overview */}
      <Card className="bg-charcoal border-gold/20">
        <CardHeader>
          <CardTitle className="text-champagne flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Branch Network - Kerala Operations
          </CardTitle>
          <CardDescription className="text-bronze">
            6 branches across Kerala with real-time inventory management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branchData.map((branch) => (
              <div key={branch.id} className="p-4 bg-gray-800/50 rounded-lg border border-gold/10">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-champagne">{branch.name}</h4>
                  <Badge 
                    variant="secondary" 
                    className={
                      branch.type === 'Main Branch' ? 'bg-blue-600/20 text-blue-400' :
                      branch.type === 'Distributor' ? 'bg-purple-600/20 text-purple-400' :
                      'bg-green-600/20 text-green-400'
                    }
                  >
                    {branch.type}
                  </Badge>
                </div>
                <p className="text-sm text-bronze mb-2">{branch.status}</p>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gold" />
                  <span className="text-sm text-champagne">{branch.stock} items in stock</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Product Categories */}
      <Card className="bg-charcoal border-gold/20">
        <CardHeader>
          <CardTitle className="text-champagne flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Product Performance - Kerala Market
          </CardTitle>
          <CardDescription className="text-bronze">
            PC & Mobile distribution across product categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {productCategories.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
                    {category.name.includes('Desktop') && <Monitor className="w-5 h-5 text-gold" />}
                    {category.name.includes('Laptop') && <Monitor className="w-5 h-5 text-gold" />}
                    {category.name.includes('Mobile') && <Smartphone className="w-5 h-5 text-gold" />}
                    {category.name.includes('Components') && <Settings className="w-5 h-5 text-gold" />}
                    {category.name.includes('Accessories') && <Package className="w-5 h-5 text-gold" />}
                  </div>
                  <div>
                    <p className="font-medium text-champagne">{category.name}</p>
                    <p className="text-sm text-bronze">{category.count} units</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-400">{category.revenue}</p>
                  <p className="text-xs text-bronze">This month</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions for Desktop */}
      <div className="hidden md:block">
        <Card className="bg-charcoal border-gold/20">
          <CardHeader>
            <CardTitle className="text-champagne">Quick Actions</CardTitle>
            <CardDescription className="text-bronze">
              Common operations for MatrixIT World retail management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Button className="h-20 flex-col gap-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30">
                <PlusCircle className="w-6 h-6" />
                New Sale Order
              </Button>
              <Button className="h-20 flex-col gap-2 bg-green-600/20 text-green-400 hover:bg-green-600/30">
                <Package className="w-6 h-6" />
                Manage Inventory
              </Button>
              <Button className="h-20 flex-col gap-2 bg-orange-600/20 text-orange-400 hover:bg-orange-600/30">
                <TruckIcon className="w-6 h-6" />
                Stock Transfer
              </Button>
              <Button className="h-20 flex-col gap-2 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30">
                <BarChart3 className="w-6 h-6" />
                View Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}