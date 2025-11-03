'use client'

/**
 * MatrixIT World Sales Management System
 * Customer orders and sales management across 6 Kerala branches
 * Smart Code: HERA.RETAIL.MATRIXITWORLD.SALES.MANAGEMENT.v1
 */

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Eye,
  Edit,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Star,
  Package,
  CreditCard,
  Truck
} from 'lucide-react'

export function MatrixITSalesManager() {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')

  // Branding is handled by MatrixITWorldBrandingProvider in layout

  // Sales data
  const salesMetrics = [
    {
      title: 'Today\'s Sales',
      value: '₹2.8L',
      change: '+12.3%',
      trend: 'up',
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      title: 'Orders',
      value: '47',
      change: '+8.2%',
      trend: 'up',
      icon: ShoppingCart,
      color: 'bg-blue-500'
    },
    {
      title: 'Customers',
      value: '32',
      change: '+15.1%',
      trend: 'up',
      icon: Users,
      color: 'bg-purple-500'
    },
    {
      title: 'Avg Order',
      value: '₹5,957',
      change: '+3.7%',
      trend: 'up',
      icon: TrendingUp,
      color: 'bg-orange-500'
    }
  ]

  // Recent orders
  const recentOrders = [
    {
      id: 'ORD-2024-001234',
      customer: 'Rajesh Kumar',
      branch: 'Kochi Main',
      amount: '₹45,500',
      status: 'confirmed',
      items: 'iPhone 15, AirPods Pro',
      timestamp: '10 minutes ago',
      payment: 'paid'
    },
    {
      id: 'ORD-2024-001235',
      customer: 'Priya Nair',
      branch: 'Trivandrum Main',
      amount: '₹125,000',
      status: 'processing',
      items: 'MacBook Pro M3, Magic Mouse',
      timestamp: '25 minutes ago',
      payment: 'pending'
    },
    {
      id: 'ORD-2024-001236',
      customer: 'Mohammed Ali',
      branch: 'Kozhikode Distributor',
      amount: '₹67,890',
      status: 'shipped',
      items: 'Dell XPS 15, Wireless Mouse',
      timestamp: '1 hour ago',
      payment: 'paid'
    },
    {
      id: 'ORD-2024-001237',
      customer: 'Anita Joseph',
      branch: 'Thrissur Retail',
      amount: '₹89,500',
      status: 'delivered',
      items: 'Samsung Galaxy S24 Ultra, Case',
      timestamp: '2 hours ago',
      payment: 'paid'
    },
    {
      id: 'ORD-2024-001238',
      customer: 'Suresh Pillai',
      branch: 'Kannur Service',
      amount: '₹34,200',
      status: 'confirmed',
      items: 'OnePlus 12, Screen Protector',
      timestamp: '3 hours ago',
      payment: 'paid'
    }
  ]

  // Top customers
  const topCustomers = [
    {
      id: 1,
      name: 'Tech Solutions Pvt Ltd',
      email: 'contact@techsolutions.co.in',
      phone: '+91 98765 43210',
      location: 'Kochi',
      totalOrders: 45,
      totalValue: '₹12,45,000',
      lastOrder: '2 days ago',
      rating: 5,
      type: 'enterprise'
    },
    {
      id: 2,
      name: 'Digital Kerala Agency',
      email: 'info@digitalkerala.com',
      phone: '+91 94567 89012',
      location: 'Trivandrum',
      totalOrders: 32,
      totalValue: '₹8,67,500',
      lastOrder: '1 week ago',
      rating: 4.8,
      type: 'business'
    },
    {
      id: 3,
      name: 'Ravi Menon',
      email: 'ravi.menon@gmail.com',
      phone: '+91 90123 45678',
      location: 'Kozhikode',
      totalOrders: 28,
      totalValue: '₹4,23,100',
      lastOrder: '3 days ago',
      rating: 4.9,
      type: 'individual'
    },
    {
      id: 4,
      name: 'Kerala IT Park',
      email: 'procurement@keralaitpark.org',
      phone: '+91 95678 90123',
      location: 'Thrissur',
      totalOrders: 18,
      totalValue: '₹15,67,800',
      lastOrder: '5 days ago',
      rating: 4.7,
      type: 'enterprise'
    }
  ]

  // Branch performance
  const branchPerformance = [
    {
      branch: 'Kochi Main',
      todaySales: '₹1,12,500',
      orders: 18,
      target: '₹1,50,000',
      achievement: 75,
      topProduct: 'iPhone 15 Pro'
    },
    {
      branch: 'Trivandrum Main',
      todaySales: '₹95,200',
      orders: 14,
      target: '₹1,20,000',
      achievement: 79,
      topProduct: 'MacBook Air M2'
    },
    {
      branch: 'Kozhikode Distributor',
      todaySales: '₹67,800',
      orders: 9,
      target: '₹80,000',
      achievement: 85,
      topProduct: 'Samsung Galaxy S24'
    },
    {
      branch: 'Thrissur Retail',
      todaySales: '₹45,600',
      orders: 6,
      target: '₹60,000',
      achievement: 76,
      topProduct: 'OnePlus 12'
    }
  ]

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      processing: { label: 'Processing', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800 border-green-200' },
      cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.confirmed
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const getPaymentBadge = (payment: string) => {
    return payment === 'paid' ? (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Paid
      </Badge>
    ) : (
      <Badge className="bg-orange-100 text-orange-800 border-orange-200">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    )
  }

  const getCustomerTypeBadge = (type: string) => {
    const typeConfig = {
      enterprise: { label: 'Enterprise', color: 'bg-purple-100 text-purple-800' },
      business: { label: 'Business', color: 'bg-blue-100 text-blue-800' },
      individual: { label: 'Individual', color: 'bg-gray-100 text-gray-800' }
    }
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.individual
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-[var(--brand-text-primary)] mb-2">
            Sales Management System
          </h1>
          <p className="text-[var(--brand-text-secondary)] text-lg">
            Customer orders and sales across 6 Kerala branches • ₹2.8L today
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--brand-text-secondary)]" />
            <Input
              placeholder="Search orders, customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-80 border-[var(--brand-border-color)] focus:border-[var(--brand-primary-400)]"
            />
          </div>
          
          <Button className="bg-[var(--brand-primary-600)] hover:bg-[var(--brand-primary-700)] text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* Sales Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {salesMetrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <Card key={index} className="border-[var(--brand-border-color)] hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${metric.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--brand-text-secondary)]">{metric.title}</p>
                    <p className="text-2xl font-bold text-[var(--brand-text-primary)]">{metric.value}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {metric.trend === 'up' ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${
                        metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {metric.change}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-[var(--brand-surface-color)] p-1 rounded-lg">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-[var(--brand-primary-700)]">
            Overview
          </TabsTrigger>
          <TabsTrigger value="orders" className="data-[state=active]:bg-white data-[state=active]:text-[var(--brand-primary-700)]">
            Orders
          </TabsTrigger>
          <TabsTrigger value="customers" className="data-[state=active]:bg-white data-[state=active]:text-[var(--brand-primary-700)]">
            Customers
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-white data-[state=active]:text-[var(--brand-primary-700)]">
            Performance
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Orders */}
            <Card className="border-[var(--brand-border-color)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[var(--brand-text-primary)]">Recent Orders</h3>
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-[var(--brand-surface-color)] rounded-lg">
                      <div>
                        <h4 className="font-medium text-[var(--brand-text-primary)]">{order.customer}</h4>
                        <p className="text-sm text-[var(--brand-text-secondary)]">{order.items}</p>
                        <p className="text-xs text-[var(--brand-text-secondary)]">{order.branch} • {order.timestamp}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[var(--brand-text-primary)]">{order.amount}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(order.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Customers */}
            <Card className="border-[var(--brand-border-color)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[var(--brand-text-primary)]">Top Customers</h3>
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCustomers.slice(0, 4).map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between p-3 bg-[var(--brand-surface-color)] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[var(--brand-primary-100)] rounded-lg flex items-center justify-center">
                          <Users className="w-5 h-5 text-[var(--brand-primary-600)]" />
                        </div>
                        <div>
                          <h4 className="font-medium text-[var(--brand-text-primary)]">{customer.name}</h4>
                          <p className="text-sm text-[var(--brand-text-secondary)]">{customer.location}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {getCustomerTypeBadge(customer.type)}
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              <span className="text-xs text-[var(--brand-text-secondary)]">{customer.rating}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[var(--brand-text-primary)]">{customer.totalValue}</p>
                        <p className="text-xs text-[var(--brand-text-secondary)]">{customer.totalOrders} orders</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="mt-8">
          <Card className="border-[var(--brand-border-color)]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[var(--brand-text-primary)]">All Orders</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="p-4 border border-[var(--brand-border-color)] rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[var(--brand-primary-100)] rounded-lg flex items-center justify-center">
                          <ShoppingCart className="w-6 h-6 text-[var(--brand-primary-600)]" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-[var(--brand-text-primary)]">{order.id}</h4>
                          <p className="text-[var(--brand-text-secondary)]">{order.customer}</p>
                          <p className="text-sm text-[var(--brand-text-secondary)]">{order.items}</p>
                          <p className="text-xs text-[var(--brand-text-secondary)]">{order.branch} • {order.timestamp}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-[var(--brand-text-primary)]">{order.amount}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {getStatusBadge(order.status)}
                          {getPaymentBadge(order.payment)}
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {topCustomers.map((customer) => (
              <Card key={customer.id} className="border-[var(--brand-border-color)] hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[var(--brand-primary-100)] rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-[var(--brand-primary-600)]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[var(--brand-text-primary)]">{customer.name}</h3>
                        <div className="flex items-center gap-2">
                          {getCustomerTypeBadge(customer.type)}
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm text-[var(--brand-text-secondary)]">{customer.rating}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-[var(--brand-text-secondary)]">Total Value</p>
                        <p className="text-lg font-bold text-[var(--brand-text-primary)]">{customer.totalValue}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[var(--brand-text-secondary)]">Total Orders</p>
                        <p className="text-lg font-bold text-[var(--brand-text-primary)]">{customer.totalOrders}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-[var(--brand-text-secondary)]">
                        <Mail className="w-4 h-4" />
                        {customer.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[var(--brand-text-secondary)]">
                        <Phone className="w-4 h-4" />
                        {customer.phone}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[var(--brand-text-secondary)]">
                        <MapPin className="w-4 h-4" />
                        {customer.location}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[var(--brand-text-secondary)]">
                        <Calendar className="w-4 h-4" />
                        Last order: {customer.lastOrder}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="w-4 h-4 mr-2" />
                        View Profile
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Plus className="w-4 h-4 mr-2" />
                        New Order
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {branchPerformance.map((branch, index) => (
              <Card key={index} className="border-[var(--brand-border-color)] hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-[var(--brand-text-primary)]">{branch.branch}</h3>
                    <Badge className={`${
                      branch.achievement >= 80 ? 'bg-green-100 text-green-800' : 
                      branch.achievement >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {branch.achievement}% of target
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-[var(--brand-text-secondary)]">Today's Sales</p>
                        <p className="text-xl font-bold text-[var(--brand-text-primary)]">{branch.todaySales}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[var(--brand-text-secondary)]">Orders</p>
                        <p className="text-xl font-bold text-[var(--brand-text-primary)]">{branch.orders}</p>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-[var(--brand-text-secondary)]">Target Progress</span>
                        <span className="text-sm font-medium text-[var(--brand-text-primary)]">{branch.target}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            branch.achievement >= 80 ? 'bg-green-500' : 
                            branch.achievement >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(branch.achievement, 100)}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[var(--brand-text-secondary)]">Top Product:</span>
                      <span className="text-sm font-medium text-[var(--brand-text-primary)]">{branch.topProduct}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}