'use client'

/**
 * MatrixIT World Multi-Branch Inventory Manager
 * Real-time inventory management across 6 Kerala branches
 * Smart Code: HERA.RETAIL.MATRIXITWORLD.INVENTORY.MANAGEMENT.v1
 */

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search,
  Package,
  Smartphone,
  Monitor,
  HardDrive,
  MapPin,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Plus,
  Minus,
  Eye,
  Edit,
  Filter,
  Download,
  Upload,
  Warehouse,
  Route,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Clock,
  ArrowUpDown
} from 'lucide-react'

export function MatrixITInventoryManager() {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('all')

  // Branding is handled by MatrixITWorldBrandingProvider in layout

  // Branch data with Kerala locations
  const branches = [
    { id: 'all', name: 'All Branches', count: 5240, status: 'active' },
    { id: 'kochi-main', name: 'Kochi Main', city: 'Kochi', count: 1420, status: 'active', alerts: 3 },
    { id: 'trivandrum-main', name: 'Trivandrum Main', city: 'Trivandrum', count: 1180, status: 'active', alerts: 2 },
    { id: 'kozhikode-distributor', name: 'Kozhikode Distributor', city: 'Kozhikode', count: 980, status: 'active', alerts: 1 },
    { id: 'thrissur-retail', name: 'Thrissur Retail', city: 'Thrissur', count: 720, status: 'active', alerts: 4 },
    { id: 'kannur-service', name: 'Kannur Service', city: 'Kannur', count: 520, status: 'active', alerts: 0 },
    { id: 'kollam-retail', name: 'Kollam Retail', city: 'Kollam', count: 420, status: 'active', alerts: 2 }
  ]

  // Product categories with inventory data
  const productCategories = [
    {
      id: 'mobile-phones',
      name: 'Mobile Phones',
      icon: Smartphone,
      totalStock: 1250,
      lowStock: 45,
      outOfStock: 8,
      color: 'bg-[var(--brand-primary-600)]',
      trend: 'up',
      trendValue: '+12%'
    },
    {
      id: 'laptops',
      name: 'Laptops',
      icon: Monitor,
      totalStock: 680,
      lowStock: 28,
      outOfStock: 5,
      color: 'bg-[var(--brand-accent-600)]',
      trend: 'up',
      trendValue: '+8%'
    },
    {
      id: 'desktop-pcs',
      name: 'Desktop PCs',
      icon: Monitor,
      totalStock: 420,
      lowStock: 18,
      outOfStock: 3,
      color: 'bg-[var(--brand-secondary-600)]',
      trend: 'down',
      trendValue: '-3%'
    },
    {
      id: 'components',
      name: 'PC Components',
      icon: HardDrive,
      totalStock: 2890,
      lowStock: 125,
      outOfStock: 22,
      color: 'bg-[var(--brand-warning-600)]',
      trend: 'up',
      trendValue: '+15%'
    }
  ]

  // Recent inventory movements
  const recentMovements = [
    {
      id: 1,
      type: 'IN',
      product: 'iPhone 15 Pro Max 256GB',
      quantity: 25,
      branch: 'Kochi Main',
      timestamp: '2 minutes ago',
      value: '₹3,12,500'
    },
    {
      id: 2,
      type: 'OUT',
      product: 'Dell XPS 13 Laptop',
      quantity: 3,
      branch: 'Trivandrum Main',
      timestamp: '8 minutes ago',
      value: '₹2,97,000'
    },
    {
      id: 3,
      type: 'TRANSFER',
      product: 'Samsung Galaxy S24 Ultra',
      quantity: 15,
      branch: 'Kochi → Kozhikode',
      timestamp: '15 minutes ago',
      value: '₹22,50,000'
    },
    {
      id: 4,
      type: 'IN',
      product: 'AMD Ryzen 9 7900X',
      quantity: 50,
      branch: 'Kozhikode Distributor',
      timestamp: '32 minutes ago',
      value: '₹1,85,000'
    },
    {
      id: 5,
      type: 'OUT',
      product: 'ASUS ROG Gaming Laptop',
      quantity: 2,
      branch: 'Thrissur Retail',
      timestamp: '1 hour ago',
      value: '₹3,40,000'
    }
  ]

  // Low stock alerts
  const lowStockAlerts = [
    {
      id: 1,
      product: 'iPhone 14 128GB',
      currentStock: 5,
      minStock: 20,
      branch: 'Thrissur Retail',
      urgency: 'high',
      suggestedAction: 'Transfer from Kochi Main (35 units available)'
    },
    {
      id: 2,
      product: 'MacBook Air M2',
      currentStock: 3,
      minStock: 15,
      branch: 'Kollam Retail',
      urgency: 'medium',
      suggestedAction: 'Purchase order recommended (Lead time: 5 days)'
    },
    {
      id: 3,
      product: 'NVIDIA RTX 4070',
      currentStock: 2,
      minStock: 10,
      branch: 'Kannur Service',
      urgency: 'high',
      suggestedAction: 'Transfer from Kozhikode (8 units available)'
    }
  ]

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'IN':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'OUT':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      case 'TRANSFER':
        return <Route className="w-4 h-4 text-blue-600" />
      default:
        return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  const getMovementBadgeColor = (type: string) => {
    switch (type) {
      case 'IN':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'OUT':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'TRANSFER':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header with Search and Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-[var(--brand-text-primary)] mb-2">
            Multi-Branch Inventory Management
          </h1>
          <p className="text-[var(--brand-text-secondary)] text-lg">
            Real-time inventory across 6 Kerala branches • 5,240 total units
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--brand-text-secondary)]" />
            <Input
              placeholder="Search products, SKUs, or branches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-80 border-[var(--brand-border-color)] focus:border-[var(--brand-primary-400)]"
            />
          </div>
          
          <select 
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-4 py-2 border border-[var(--brand-border-color)] rounded-md focus:border-[var(--brand-primary-400)] focus:outline-none"
          >
            {branches.map(branch => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
          
          <Button className="bg-[var(--brand-primary-600)] hover:bg-[var(--brand-primary-700)] text-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync All
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-[var(--brand-surface-color)] p-1 rounded-lg">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-[var(--brand-primary-700)]">
            Overview
          </TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-white data-[state=active]:text-[var(--brand-primary-700)]">
            Categories
          </TabsTrigger>
          <TabsTrigger value="movements" className="data-[state=active]:bg-white data-[state=active]:text-[var(--brand-primary-700)]">
            Movements
          </TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-white data-[state=active]:text-[var(--brand-primary-700)]">
            Alerts
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-8 space-y-8">
          {/* Branch Cards Grid */}
          <div>
            <h2 className="text-xl font-semibold text-[var(--brand-text-primary)] mb-6">Branch Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {branches.slice(1).map((branch) => (
                <Card key={branch.id} className="border-[var(--brand-border-color)] hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[var(--brand-primary-100)] rounded-lg flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-[var(--brand-primary-600)]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[var(--brand-text-primary)]">{branch.name}</h3>
                          <p className="text-sm text-[var(--brand-text-secondary)]">{branch.city}</p>
                        </div>
                      </div>
                      {branch.alerts > 0 && (
                        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                          {branch.alerts} alerts
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[var(--brand-text-secondary)]">Total Stock:</span>
                        <span className="font-semibold text-[var(--brand-text-primary)]">{branch.count.toLocaleString()} units</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[var(--brand-text-secondary)]">Status:</span>
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                      <div className="pt-2">
                        <Button variant="outline" size="sm" className="w-full border-[var(--brand-border-color)]">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div>
            <h2 className="text-xl font-semibold text-[var(--brand-text-primary)] mb-6">Inventory Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Card className="border-[var(--brand-border-color)]">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-[var(--brand-text-secondary)]">Total Products</p>
                      <p className="text-2xl font-bold text-[var(--brand-text-primary)]">5,240</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[var(--brand-border-color)]">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-[var(--brand-text-secondary)]">Low Stock</p>
                      <p className="text-2xl font-bold text-[var(--brand-text-primary)]">216</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[var(--brand-border-color)]">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <Minus className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-[var(--brand-text-secondary)]">Out of Stock</p>
                      <p className="text-2xl font-bold text-[var(--brand-text-primary)]">38</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[var(--brand-border-color)]">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-[var(--brand-text-secondary)]">Turnover Rate</p>
                      <p className="text-2xl font-bold text-[var(--brand-text-primary)]">8.2x</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {productCategories.map((category) => {
              const Icon = category.icon
              return (
                <Card key={category.id} className="border-[var(--brand-border-color)] hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[var(--brand-text-primary)]">{category.name}</h3>
                          <div className="flex items-center gap-2">
                            {category.trend === 'up' ? (
                              <TrendingUp className="w-4 h-4 text-green-600" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-600" />
                            )}
                            <span className={`text-sm font-medium ${
                              category.trend === 'up' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {category.trendValue}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-sm text-[var(--brand-text-secondary)]">Total Stock</p>
                          <p className="text-lg font-bold text-[var(--brand-text-primary)]">{category.totalStock.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-[var(--brand-text-secondary)]">Low Stock</p>
                          <p className="text-lg font-bold text-orange-600">{category.lowStock}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-[var(--brand-text-secondary)]">Out of Stock</p>
                          <p className="text-lg font-bold text-red-600">{category.outOfStock}</p>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full border-[var(--brand-border-color)]">
                        <Package className="w-4 h-4 mr-2" />
                        Manage Category
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Movements Tab */}
        <TabsContent value="movements" className="mt-8">
          <Card className="border-[var(--brand-border-color)]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[var(--brand-text-primary)]">Recent Inventory Movements</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentMovements.map((movement) => (
                  <div key={movement.id} className="flex items-center justify-between p-4 bg-[var(--brand-surface-color)] rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg border border-[var(--brand-border-color)]">
                        {getMovementIcon(movement.type)}
                      </div>
                      <div>
                        <h4 className="font-medium text-[var(--brand-text-primary)]">{movement.product}</h4>
                        <p className="text-sm text-[var(--brand-text-secondary)]">{movement.branch}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-3">
                        <Badge className={getMovementBadgeColor(movement.type)}>
                          {movement.type} • {movement.quantity}
                        </Badge>
                        <div>
                          <p className="font-medium text-[var(--brand-text-primary)]">{movement.value}</p>
                          <p className="text-xs text-[var(--brand-text-secondary)]">{movement.timestamp}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="mt-8">
          <Card className="border-[var(--brand-border-color)]">
            <CardHeader>
              <h3 className="text-lg font-semibold text-[var(--brand-text-primary)]">Low Stock Alerts</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowStockAlerts.map((alert) => (
                  <div key={alert.id} className="p-4 border border-red-200 bg-red-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-gray-900">{alert.product}</h4>
                          <p className="text-sm text-gray-600 mb-2">{alert.branch}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span>Current: <strong className="text-red-600">{alert.currentStock}</strong></span>
                            <span>Min Required: <strong>{alert.minStock}</strong></span>
                          </div>
                          <p className="text-sm text-gray-700 mt-2">{alert.suggestedAction}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={alert.urgency === 'high' ? 'destructive' : 'secondary'}>
                          {alert.urgency} priority
                        </Badge>
                        <Button size="sm" className="bg-[var(--brand-primary-600)] hover:bg-[var(--brand-primary-700)] text-white">
                          Resolve
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}