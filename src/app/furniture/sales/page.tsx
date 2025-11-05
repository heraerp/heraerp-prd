'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useLoadingStore } from '@/lib/stores/loading-store'
import {
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Globe,
  Target,
  BarChart3,
  Calendar,
  MapPin,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Award,
  Building2,
  Phone,
  Mail,
  FileText,
  Eye,
  Edit,
  Plus,
  Filter,
  Download,
  RefreshCw,
  Zap,
  Heart,
  ThumbsUp
} from 'lucide-react'

interface SalesOrder {
  id: string
  orderNumber: string
  customerName: string
  customerType: 'hotel' | 'resort' | 'export_client' | 'restaurant' | 'corporate'
  productCategory: string
  totalAmount: number
  orderDate: string
  expectedDelivery: string
  status: 'pending' | 'confirmed' | 'production' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue'
  salesPerson: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  isExport: boolean
  profit: number
  margin: number
  location: string
  notes: string[]
}

interface SalesMetrics {
  period: string
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  exportRevenue: number
  domesticRevenue: number
  profitMargin: number
  newCustomers: number
  repeatCustomers: number
  conversionRate: number
}

interface SalesTarget {
  category: string
  target: number
  achieved: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
}

interface RegionalPerformance {
  region: string
  revenue: number
  orders: number
  growth: number
  topProducts: string[]
  marketShare: number
}

export default function SalesDashboard() {
  const { updateProgress, finishLoading } = useLoadingStore()
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([])
  const [metrics, setMetrics] = useState<SalesMetrics | null>(null)
  const [targets, setTargets] = useState<SalesTarget[]>([])
  const [regionalData, setRegionalData] = useState<RegionalPerformance[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [filterStatus, setFilterStatus] = useState('all')

  // ⚡ ENTERPRISE: Complete loading animation on mount (if coming from login)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const isInitializing = urlParams.get('initializing') === 'true'

    if (isInitializing) {
      console.log('🪑 Furniture Sales: Completing loading animation from 70% → 100%')

      // Animate from 70% to 100% smoothly
      let progress = 70
      const progressInterval = setInterval(() => {
        progress += 5
        if (progress <= 100) {
          updateProgress(progress, undefined, progress === 100 ? 'Ready!' : 'Loading your workspace...')
        }
        if (progress >= 100) {
          clearInterval(progressInterval)
          // Complete and hide overlay after brief delay
          setTimeout(() => {
            finishLoading()
            // Clean up URL parameter
            window.history.replaceState({}, '', window.location.pathname)
            console.log('✅ Furniture Sales: Loading complete!')
          }, 500)
        }
      }, 50)

      return () => clearInterval(progressInterval)
    }
  }, [updateProgress, finishLoading])

  // Kerala furniture sales sample data
  const sampleOrders: SalesOrder[] = [
    {
      id: '1',
      orderNumber: 'KFS-2024-001',
      customerName: 'ITC Grand Chola',
      customerType: 'hotel',
      productCategory: 'Executive Room Furniture',
      totalAmount: 1250000,
      orderDate: '2024-01-15',
      expectedDelivery: '2024-02-28',
      status: 'production',
      paymentStatus: 'partial',
      salesPerson: 'Rajesh Kumar',
      priority: 'high',
      isExport: false,
      profit: 375000,
      margin: 30,
      location: 'Chennai, Tamil Nadu',
      notes: ['Bulk order', 'Premium finish', 'Urgent delivery']
    },
    {
      id: '2',
      orderNumber: 'KFS-2024-002',
      customerName: 'Dubai Furniture LLC',
      customerType: 'export_client',
      productCategory: 'Traditional Kerala Dining Sets',
      totalAmount: 2100000,
      orderDate: '2024-01-20',
      expectedDelivery: '2024-03-15',
      status: 'confirmed',
      paymentStatus: 'paid',
      salesPerson: 'Priya Nair',
      priority: 'urgent',
      isExport: true,
      profit: 630000,
      margin: 30,
      location: 'Dubai, UAE',
      notes: ['Export quality', 'Container shipping', 'Documentation required']
    },
    {
      id: '3',
      orderNumber: 'KFS-2024-003',
      customerName: 'Taj Kumarakom Resort',
      customerType: 'resort',
      productCategory: 'Lakeside Villa Furniture',
      totalAmount: 850000,
      orderDate: '2024-01-25',
      expectedDelivery: '2024-03-10',
      status: 'confirmed',
      paymentStatus: 'pending',
      salesPerson: 'Anoop Menon',
      priority: 'medium',
      isExport: false,
      profit: 255000,
      margin: 30,
      location: 'Kumarakom, Kerala',
      notes: ['Weather resistant', 'Resort delivery', 'Eco-friendly materials']
    },
    {
      id: '4',
      orderNumber: 'KFS-2024-004',
      customerName: 'Singapore Hotels Pte Ltd',
      customerType: 'export_client',
      productCategory: 'Modern Hotel Furniture',
      totalAmount: 1800000,
      orderDate: '2024-01-28',
      expectedDelivery: '2024-04-15',
      status: 'pending',
      paymentStatus: 'pending',
      salesPerson: 'Suresh Achari',
      priority: 'high',
      isExport: true,
      profit: 540000,
      margin: 30,
      location: 'Singapore',
      notes: ['Tropical climate specs', 'Modern design', 'Bulk order']
    },
    {
      id: '5',
      orderNumber: 'KFS-2024-005',
      customerName: 'Leela Palace Bangalore',
      customerType: 'hotel',
      productCategory: 'Luxury Suite Furniture',
      totalAmount: 950000,
      orderDate: '2024-01-30',
      expectedDelivery: '2024-03-25',
      status: 'shipped',
      paymentStatus: 'paid',
      salesPerson: 'Rajesh Kumar',
      priority: 'medium',
      isExport: false,
      profit: 285000,
      margin: 30,
      location: 'Bangalore, Karnataka',
      notes: ['Luxury finish', 'Brand compliance', 'Premium materials']
    }
  ]

  const sampleMetrics: SalesMetrics = {
    period: 'January 2024',
    totalRevenue: 6950000,
    totalOrders: 47,
    averageOrderValue: 147872,
    exportRevenue: 3900000,
    domesticRevenue: 3050000,
    profitMargin: 28.5,
    newCustomers: 8,
    repeatCustomers: 15,
    conversionRate: 65
  }

  const sampleTargets: SalesTarget[] = [
    {
      category: 'Monthly Revenue',
      target: 8000000,
      achieved: 6950000,
      percentage: 87,
      trend: 'up'
    },
    {
      category: 'Export Sales',
      target: 4000000,
      achieved: 3900000,
      percentage: 98,
      trend: 'up'
    },
    {
      category: 'New Customers',
      target: 10,
      achieved: 8,
      percentage: 80,
      trend: 'up'
    },
    {
      category: 'Order Volume',
      target: 50,
      achieved: 47,
      percentage: 94,
      trend: 'stable'
    }
  ]

  const sampleRegionalData: RegionalPerformance[] = [
    {
      region: 'Kerala Domestic',
      revenue: 1250000,
      orders: 15,
      growth: 25,
      topProducts: ['Resort Furniture', 'Traditional Sets', 'Heritage Pieces'],
      marketShare: 35
    },
    {
      region: 'South India Hotels',
      revenue: 1800000,
      orders: 18,
      growth: 30,
      topProducts: ['Hotel Room Sets', 'Lobby Furniture', 'Restaurant Furniture'],
      marketShare: 28
    },
    {
      region: 'Middle East Export',
      revenue: 2400000,
      orders: 8,
      growth: 40,
      topProducts: ['Traditional Kerala Sets', 'Modern Office', 'Luxury Suites'],
      marketShare: 22
    },
    {
      region: 'Southeast Asia',
      revenue: 1500000,
      orders: 6,
      growth: 20,
      topProducts: ['Hotel Furniture', 'Climate Resistant', 'Modern Designs'],
      marketShare: 15
    }
  ]

  useEffect(() => {
    setSalesOrders(sampleOrders)
    setMetrics(sampleMetrics)
    setTargets(sampleTargets)
    setRegionalData(sampleRegionalData)
  }, [])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      'confirmed': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      'production': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      'shipped': 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
      'delivered': 'bg-green-500/10 text-green-600 border-green-500/20',
      'cancelled': 'bg-red-500/10 text-red-600 border-red-500/20'
    }
    return colors[status] || colors.pending
  }

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-amber-500/10 text-amber-600',
      'partial': 'bg-blue-500/10 text-blue-600',
      'paid': 'bg-green-500/10 text-green-600',
      'overdue': 'bg-red-500/10 text-red-600'
    }
    return colors[status] || colors.pending
  }

  const filteredOrders = salesOrders.filter(order => {
    return filterStatus === 'all' || order.status === filterStatus
  })

  const totalRevenue = salesOrders.reduce((sum, order) => sum + order.totalAmount, 0)
  const totalProfit = salesOrders.reduce((sum, order) => sum + order.profit, 0)
  const exportRevenue = salesOrders.filter(order => order.isExport).reduce((sum, order) => sum + order.totalAmount, 0)

  return (
    <div className="min-h-screen">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="jewelry-glass-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="jewelry-crown-glow p-3 rounded-xl">
                  <ShoppingCart className="h-8 w-8 jewelry-text-gold" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold jewelry-text-luxury">Sales Dashboard</h1>
                  <p className="text-lg text-gray-300">Kerala Furniture Export & Domestic Sales</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  <Globe className="h-3 w-3 mr-1" />
                  Export Focus
                </Badge>
                <Button className="jewelry-glass-btn gap-2">
                  <Plus className="h-4 w-4" />
                  New Order
                </Button>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Monthly Revenue</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">₹{(totalRevenue / 100000).toFixed(1)}L</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+18% vs last month</span>
              </div>
            </div>

            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Total Orders</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">{salesOrders.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+12% vs last month</span>
              </div>
            </div>

            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Export Revenue</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">₹{(exportRevenue / 100000).toFixed(1)}L</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-gray-300">{Math.round((exportRevenue / totalRevenue) * 100)}% of total</span>
              </div>
            </div>

            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Profit Margin</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">{Math.round((totalProfit / totalRevenue) * 100)}%</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-gray-300">₹{(totalProfit / 100000).toFixed(1)}L profit</span>
              </div>
            </div>
          </div>

          <Tabs defaultValue="orders" className="space-y-4">
            <TabsList className="jewelry-glass-panel">
              <TabsTrigger value="orders" className="jewelry-glass-btn">Sales Orders</TabsTrigger>
              <TabsTrigger value="targets" className="jewelry-glass-btn">Sales Targets</TabsTrigger>
              <TabsTrigger value="regional" className="jewelry-glass-btn">Regional Performance</TabsTrigger>
              <TabsTrigger value="analytics" className="jewelry-glass-btn">Analytics</TabsTrigger>
            </TabsList>

            {/* Sales Orders */}
            <TabsContent value="orders" className="space-y-6">
              {/* Filters */}
              <div className="jewelry-glass-card p-4">
                <div className="flex items-center gap-4">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="jewelry-glass-input min-w-[150px]"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="production">Production</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                  </select>
                  <Button variant="outline" className="jewelry-glass-btn gap-2">
                    <Filter className="h-4 w-4" />
                    More Filters
                  </Button>
                  <Button variant="outline" className="jewelry-glass-btn gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                  <Button variant="outline" className="jewelry-glass-btn gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Orders List */}
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="jewelry-glass-card p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                            {order.isExport ? (
                              <Globe className="h-6 w-6 text-white" />
                            ) : (
                              <Building2 className="h-6 w-6 text-white" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold jewelry-text-luxury">{order.orderNumber}</h3>
                            <p className="text-sm text-gray-300">{order.customerName} • {order.location}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                            <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                              {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                            </Badge>
                            {order.isExport && (
                              <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                                Export
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-300 mb-4">
                          <div>
                            <span className="font-medium">Product:</span> {order.productCategory}
                          </div>
                          <div>
                            <span className="font-medium">Amount:</span> ₹{(order.totalAmount / 100000).toFixed(1)}L
                          </div>
                          <div>
                            <span className="font-medium">Order Date:</span> {order.orderDate}
                          </div>
                          <div>
                            <span className="font-medium">Delivery:</span> {order.expectedDelivery}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-300 mb-4">
                          <div>
                            <span className="font-medium">Sales Person:</span> {order.salesPerson}
                          </div>
                          <div>
                            <span className="font-medium">Profit:</span> ₹{(order.profit / 100000).toFixed(1)}L
                          </div>
                          <div>
                            <span className="font-medium">Margin:</span> {order.margin}%
                          </div>
                          <div className={`font-medium ${
                            order.priority === 'urgent' ? 'text-red-500' :
                            order.priority === 'high' ? 'text-orange-500' :
                            order.priority === 'medium' ? 'text-amber-500' :
                            'text-green-500'
                          }`}>
                            {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)} Priority
                          </div>
                        </div>

                        {order.notes.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium jewelry-text-luxury">Notes:</p>
                            <div className="flex flex-wrap gap-2">
                              {order.notes.map((note, index) => (
                                <Badge key={index} variant="outline" className="text-xs jewelry-badge-text">
                                  {note}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button size="sm" className="jewelry-glass-btn gap-1">
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1">
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1">
                          <FileText className="h-3 w-3" />
                          Invoice
                        </Button>
                        <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1">
                          <Truck className="h-3 w-3" />
                          Track
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Sales Targets */}
            <TabsContent value="targets" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {targets.map((target, index) => (
                  <div key={index} className="jewelry-glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <Target className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold jewelry-text-luxury">{target.category}</h3>
                          <p className="text-sm text-gray-300">Current period target</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {target.trend === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : target.trend === 'down' ? (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        ) : (
                          <Target className="h-4 w-4 text-blue-500" />
                        )}
                        <Badge className={`${
                          target.percentage >= 90 ? 'bg-green-500/10 text-green-600' :
                          target.percentage >= 70 ? 'bg-amber-500/10 text-amber-600' :
                          'bg-red-500/10 text-red-600'
                        }`}>
                          {target.percentage}%
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Achieved</span>
                        <span className="jewelry-text-luxury font-medium">
                          {target.category.includes('Revenue') ? `₹${(target.achieved / 100000).toFixed(1)}L` : target.achieved}
                        </span>
                      </div>
                      <Progress value={target.percentage} className="h-3" />
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Target</span>
                        <span className="jewelry-text-luxury font-medium">
                          {target.category.includes('Revenue') ? `₹${(target.target / 100000).toFixed(1)}L` : target.target}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-blue-500/10 rounded-lg">
                      <p className="text-sm jewelry-text-luxury">
                        {target.percentage >= 90 ? '🎉 Excellent performance! Target nearly achieved.' :
                         target.percentage >= 70 ? '📈 Good progress. Push for final stretch.' :
                         '⚠️ Needs attention. Review strategy and accelerate efforts.'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Monthly Performance Overview */}
              <div className="jewelry-glass-card p-6">
                <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Monthly Performance Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mb-3">
                      <TrendingUp className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-2xl font-bold jewelry-text-luxury">₹69.5L</p>
                    <p className="text-sm text-gray-300">Revenue Achieved</p>
                    <p className="text-xs text-green-500 mt-1">87% of target</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mb-3">
                      <Globe className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-2xl font-bold jewelry-text-luxury">₹39L</p>
                    <p className="text-sm text-gray-300">Export Revenue</p>
                    <p className="text-xs text-blue-500 mt-1">98% of target</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center mb-3">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-2xl font-bold jewelry-text-luxury">8</p>
                    <p className="text-sm text-gray-300">New Customers</p>
                    <p className="text-xs text-purple-500 mt-1">80% of target</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Regional Performance */}
            <TabsContent value="regional" className="space-y-6">
              <div className="space-y-4">
                {regionalData.map((region, index) => (
                  <div key={index} className="jewelry-glass-card p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                            <MapPin className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold jewelry-text-luxury">{region.region}</h3>
                            <p className="text-sm text-gray-300">Market performance analysis</p>
                          </div>
                          <Badge className={`${
                            region.growth > 30 ? 'bg-green-500/10 text-green-600' :
                            region.growth > 15 ? 'bg-blue-500/10 text-blue-600' :
                            'bg-amber-500/10 text-amber-600'
                          }`}>
                            +{region.growth}% Growth
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                            <p className="text-xl font-bold jewelry-text-luxury">₹{(region.revenue / 100000).toFixed(1)}L</p>
                            <p className="text-xs text-gray-300">Revenue</p>
                          </div>
                          <div className="text-center p-3 bg-green-500/10 rounded-lg">
                            <p className="text-xl font-bold jewelry-text-luxury">{region.orders}</p>
                            <p className="text-xs text-gray-300">Orders</p>
                          </div>
                          <div className="text-center p-3 bg-purple-500/10 rounded-lg">
                            <p className="text-xl font-bold jewelry-text-luxury">{region.marketShare}%</p>
                            <p className="text-xs text-gray-300">Market Share</p>
                          </div>
                          <div className="text-center p-3 bg-amber-500/10 rounded-lg">
                            <p className="text-xl font-bold jewelry-text-luxury">₹{Math.round(region.revenue / region.orders / 1000)}K</p>
                            <p className="text-xs text-gray-300">Avg Order</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium jewelry-text-luxury mb-2">Top Products:</p>
                          <div className="flex flex-wrap gap-2">
                            {region.topProducts.map((product, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs jewelry-badge-text">
                                {product}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="ml-4">
                        <Button size="sm" className="jewelry-glass-btn gap-1">
                          <BarChart3 className="h-3 w-3" />
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Regional Summary */}
              <div className="jewelry-glass-card p-6">
                <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Regional Market Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-md font-medium jewelry-text-luxury mb-3 text-green-600">Growth Opportunities</h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-300">Middle East market showing 40% growth potential</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-300">South India hotel segment expanding rapidly</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-300">Kerala domestic market premium positioning success</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-md font-medium jewelry-text-luxury mb-3 text-amber-600">Focus Areas</h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-300">Southeast Asia needs stronger market presence</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-300">Export documentation efficiency improvements</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-300">Seasonal demand planning optimization</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Analytics */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Trend */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Sales Trend Analysis</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                      <div>
                        <p className="text-sm font-medium jewelry-text-luxury">Year-over-Year Growth</p>
                        <p className="text-xs text-gray-300">Compared to last year</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">+28%</p>
                        <p className="text-xs text-green-600">Strong growth</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
                      <div>
                        <p className="text-sm font-medium jewelry-text-luxury">Export vs Domestic</p>
                        <p className="text-xs text-gray-300">Revenue split</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-blue-600">56% : 44%</p>
                        <p className="text-xs text-blue-600">Export leading</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg">
                      <div>
                        <p className="text-sm font-medium jewelry-text-luxury">Customer Retention</p>
                        <p className="text-xs text-gray-300">Repeat customers</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-purple-600">92%</p>
                        <p className="text-xs text-purple-600">Excellent</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Performance */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Top Performing Products</h3>
                  <div className="space-y-3">
                    {[
                      { name: 'Hotel Room Furniture Sets', revenue: 2100000, percentage: 30 },
                      { name: 'Traditional Kerala Dining', revenue: 1800000, percentage: 26 },
                      { name: 'Resort Outdoor Furniture', revenue: 1400000, percentage: 20 },
                      { name: 'Corporate Office Sets', revenue: 1050000, percentage: 15 },
                      { name: 'Custom Heritage Pieces', revenue: 700000, percentage: 9 }
                    ].map((product, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="jewelry-text-luxury">{product.name}</span>
                          <span className="text-gray-300">₹{(product.revenue / 100000).toFixed(1)}L ({product.percentage}%)</span>
                        </div>
                        <Progress value={product.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sales Team Performance */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Sales Team Performance</h3>
                  <div className="space-y-3">
                    {[
                      { name: 'Rajesh Kumar', orders: 15, revenue: 2500000, rating: 4.8 },
                      { name: 'Priya Nair', orders: 12, revenue: 2100000, rating: 4.9 },
                      { name: 'Anoop Menon', orders: 10, revenue: 1800000, rating: 4.6 },
                      { name: 'Suresh Achari', orders: 8, revenue: 1600000, rating: 4.7 }
                    ].map((person, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium jewelry-text-luxury">{person.name}</p>
                            <p className="text-xs text-gray-300">{person.orders} orders</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium jewelry-text-luxury">₹{(person.revenue / 100000).toFixed(1)}L</p>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            <span className="text-xs text-gray-300">{person.rating}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Market Opportunities */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Market Opportunities</h3>
                  <div className="space-y-4">
                    <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                      <div className="flex items-center gap-2 text-green-600 font-medium mb-2">
                        <TrendingUp className="h-4 w-4" />
                        Heritage Tourism Boom
                      </div>
                      <p className="text-sm text-gray-300">
                        Kerala's heritage tourism growth creates 40% increase in demand for traditional furniture
                      </p>
                    </div>

                    <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <div className="flex items-center gap-2 text-blue-600 font-medium mb-2">
                        <Globe className="h-4 w-4" />
                        Middle East Expansion
                      </div>
                      <p className="text-sm text-gray-300">
                        Growing hospitality sector in UAE and Qatar presents major export opportunities
                      </p>
                    </div>

                    <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                      <div className="flex items-center gap-2 text-purple-600 font-medium mb-2">
                        <Award className="h-4 w-4" />
                        Premium Positioning
                      </div>
                      <p className="text-sm text-gray-300">
                        Luxury hotel chains seeking authentic Kerala craftsmanship for premium properties
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}