'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Target,
  Crown,
  Gem,
  Scale,
  Award,
  Activity,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Diamond,
  Shield,
  Clock,
  Star,
  ChevronRight,
  Plus,
  Settings,
  Search,
  MapPin,
  Phone,
  Mail
} from 'lucide-react'
import '@/styles/jewelry-glassmorphism.css'

interface SalesMetrics {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  totalCustomers: number
  topProduct: string
  conversionRate: number
  returnRate: number
  customerSatisfaction: number
}

interface CategoryPerformance {
  category: string
  revenue: number
  orders: number
  growth: number
  margin: number
  topItem: string
}

interface CustomerInsight {
  id: string
  name: string
  email: string
  totalPurchases: number
  lastPurchase: string
  vipStatus: 'diamond' | 'platinum' | 'gold' | 'silver' | 'none'
  preferredCategory: string
  loyaltyPoints: number
}

interface SalesTarget {
  period: string
  target: number
  achieved: number
  percentage: number
  status: 'achieved' | 'on_track' | 'at_risk' | 'behind'
}

export default function JewelryAnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('this_month')
  const [selectedMetric, setSelectedMetric] = useState('revenue')
  const [showFilters, setShowFilters] = useState(false)

  // Mock analytics data
  const salesMetrics: SalesMetrics = {
    totalRevenue: 2850000,
    totalOrders: 156,
    averageOrderValue: 18269,
    totalCustomers: 89,
    topProduct: 'Diamond Solitaire Ring',
    conversionRate: 24.5,
    returnRate: 2.1,
    customerSatisfaction: 4.8
  }

  const categoryPerformance: CategoryPerformance[] = [
    {
      category: 'Rings',
      revenue: 1250000,
      orders: 68,
      growth: 18.5,
      margin: 45.2,
      topItem: 'Diamond Solitaire Ring'
    },
    {
      category: 'Necklaces',
      revenue: 890000,
      orders: 42,
      growth: 12.3,
      margin: 42.8,
      topItem: 'Pearl Statement Necklace'
    },
    {
      category: 'Earrings',
      revenue: 420000,
      orders: 28,
      growth: -5.2,
      margin: 38.9,
      topItem: 'Sapphire Drop Earrings'
    },
    {
      category: 'Bracelets',
      revenue: 290000,
      orders: 18,
      growth: 22.7,
      margin: 41.5,
      topItem: 'Tennis Bracelet'
    }
  ]

  const topCustomers: CustomerInsight[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      totalPurchases: 485000,
      lastPurchase: '2024-01-14',
      vipStatus: 'diamond',
      preferredCategory: 'Rings',
      loyaltyPoints: 4850
    },
    {
      id: '2',
      name: 'Ahmed Al-Rashid',
      email: 'ahmed.rashid@email.com',
      totalPurchases: 320000,
      lastPurchase: '2024-01-12',
      vipStatus: 'platinum',
      preferredCategory: 'Necklaces',
      loyaltyPoints: 3200
    },
    {
      id: '3',
      name: 'Maria Rodriguez',
      email: 'maria.rodriguez@email.com',
      totalPurchases: 275000,
      lastPurchase: '2024-01-15',
      vipStatus: 'gold',
      preferredCategory: 'Earrings',
      loyaltyPoints: 2750
    },
    {
      id: '4',
      name: 'Jennifer Chen',
      email: 'jennifer.chen@email.com',
      totalPurchases: 190000,
      lastPurchase: '2024-01-10',
      vipStatus: 'silver',
      preferredCategory: 'Bracelets',
      loyaltyPoints: 1900
    }
  ]

  const salesTargets: SalesTarget[] = [
    {
      period: 'January 2024',
      target: 3000000,
      achieved: 2850000,
      percentage: 95.0,
      status: 'on_track'
    },
    {
      period: 'Q1 2024',
      target: 8500000,
      achieved: 7200000,
      percentage: 84.7,
      status: 'at_risk'
    },
    {
      period: 'Annual 2024',
      target: 35000000,
      achieved: 7200000,
      percentage: 20.6,
      status: 'on_track'
    }
  ]

  const periods = [
    { value: 'today', label: 'Today' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'this_quarter', label: 'This Quarter' },
    { value: 'this_year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ]

  const getVipIcon = (status: string) => {
    switch (status) {
      case 'diamond':
        return <Crown className="jewelry-icon-gold" size={16} />
      case 'platinum':
        return <Award className="text-gray-400" size={16} />
      case 'gold':
        return <Star className="text-yellow-500" size={16} />
      case 'silver':
        return <Shield className="text-gray-300" size={16} />
      default:
        return <Users className="jewelry-text-muted" size={16} />
    }
  }

  const getVipColor = (status: string) => {
    switch (status) {
      case 'diamond':
        return 'jewelry-status-premium'
      case 'platinum':
        return 'jewelry-status-luxury'
      case 'gold':
        return 'jewelry-status-pending'
      case 'silver':
        return 'jewelry-status-inactive'
      default:
        return 'jewelry-status-inactive'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'achieved':
        return <Target className="jewelry-icon-success" size={16} />
      case 'on_track':
        return <TrendingUp className="jewelry-icon-success" size={16} />
      case 'at_risk':
        return <Activity className="jewelry-icon-warning" size={16} />
      case 'behind':
        return <TrendingDown className="jewelry-icon-error" size={16} />
      default:
        return <Clock className="jewelry-text-muted" size={16} />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'achieved':
        return 'jewelry-status-active'
      case 'on_track':
        return 'jewelry-status-active'
      case 'at_risk':
        return 'jewelry-status-pending'
      case 'behind':
        return 'jewelry-status-inactive'
      default:
        return 'jewelry-status-inactive'
    }
  }

  return (
    <div className="min-h-screen jewelry-gradient-premium">
      <div className="jewelry-glass-backdrop min-h-screen">
        <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="jewelry-heading text-4xl md:text-5xl mb-4">
              <BarChart3 className="inline-block mr-3 mb-2 jewelry-icon-gold" size={48} />
              Sales Analytics
            </h1>
            <p className="jewelry-text-luxury text-lg md:text-xl">
              Comprehensive business intelligence and performance insights
            </p>
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="jewelry-glass-panel"
          >
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Period Selection */}
              <div className="flex flex-wrap gap-2">
                {periods.map(period => (
                  <button
                    key={period.value}
                    onClick={() => setSelectedPeriod(period.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedPeriod === period.value
                        ? 'jewelry-btn-primary'
                        : 'jewelry-btn-secondary'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="jewelry-btn-secondary flex items-center space-x-2 px-4 py-2"
                >
                  <Filter className="jewelry-icon-gold" size={18} />
                  <span>Filters</span>
                </button>

                <button className="jewelry-btn-secondary flex items-center space-x-2 px-4 py-2">
                  <RefreshCw className="jewelry-icon-gold" size={18} />
                  <span>Refresh</span>
                </button>

                <button className="jewelry-btn-primary flex items-center space-x-2 px-4 py-2">
                  <Download className="jewelry-icon-gold" size={18} />
                  <span>Export</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Key Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <div className="jewelry-glass-card jewelry-float p-6 text-center">
              <DollarSign className="mx-auto mb-3 jewelry-icon-gold" size={32} />
              <h3 className="jewelry-text-high-contrast text-3xl font-bold">
                ₹{salesMetrics.totalRevenue.toLocaleString()}
              </h3>
              <p className="jewelry-text-muted text-sm font-medium">Total Revenue</p>
              <div className="flex items-center justify-center mt-2 text-green-500">
                <ArrowUpRight size={16} />
                <span className="text-xs ml-1">+18.5%</span>
              </div>
            </div>

            <div
              className="jewelry-glass-card jewelry-float p-6 text-center"
              style={{ animationDelay: '0.1s' }}
            >
              <Package className="mx-auto mb-3 jewelry-icon-gold" size={32} />
              <h3 className="jewelry-text-high-contrast text-3xl font-bold">
                {salesMetrics.totalOrders}
              </h3>
              <p className="jewelry-text-muted text-sm font-medium">Total Orders</p>
              <div className="flex items-center justify-center mt-2 text-green-500">
                <ArrowUpRight size={16} />
                <span className="text-xs ml-1">+12.3%</span>
              </div>
            </div>

            <div
              className="jewelry-glass-card jewelry-float p-6 text-center"
              style={{ animationDelay: '0.2s' }}
            >
              <Target className="mx-auto mb-3 jewelry-icon-gold" size={32} />
              <h3 className="jewelry-text-high-contrast text-3xl font-bold">
                ₹{salesMetrics.averageOrderValue.toLocaleString()}
              </h3>
              <p className="jewelry-text-muted text-sm font-medium">Avg Order Value</p>
              <div className="flex items-center justify-center mt-2 text-green-500">
                <ArrowUpRight size={16} />
                <span className="text-xs ml-1">+5.7%</span>
              </div>
            </div>

            <div
              className="jewelry-glass-card jewelry-float p-6 text-center"
              style={{ animationDelay: '0.3s' }}
            >
              <Users className="mx-auto mb-3 jewelry-icon-gold" size={32} />
              <h3 className="jewelry-text-high-contrast text-3xl font-bold">
                {salesMetrics.totalCustomers}
              </h3>
              <p className="jewelry-text-muted text-sm font-medium">Active Customers</p>
              <div className="flex items-center justify-center mt-2 text-green-500">
                <ArrowUpRight size={16} />
                <span className="text-xs ml-1">+8.2%</span>
              </div>
            </div>
          </motion.div>

          {/* Charts and Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Performance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="jewelry-glass-panel"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="jewelry-text-luxury text-xl font-semibold flex items-center gap-2">
                  <PieChart className="jewelry-icon-gold" size={24} />
                  Category Performance
                </h3>
                <button className="jewelry-btn-secondary p-2">
                  <Eye className="jewelry-icon-gold" size={16} />
                </button>
              </div>

              <div className="space-y-4">
                {categoryPerformance.map((category, index) => (
                  <div key={category.category} className="jewelry-glass-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Gem className="jewelry-icon-gold" size={20} />
                        <div>
                          <h4 className="jewelry-text-high-contrast font-semibold">
                            {category.category}
                          </h4>
                          <p className="jewelry-text-muted text-sm">{category.orders} orders</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="jewelry-text-high-contrast font-bold">
                          ₹{category.revenue.toLocaleString()}
                        </p>
                        <div
                          className={`flex items-center justify-end mt-1 ${category.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}
                        >
                          {category.growth >= 0 ? (
                            <ArrowUpRight size={14} />
                          ) : (
                            <ArrowDownRight size={14} />
                          )}
                          <span className="text-xs ml-1">{Math.abs(category.growth)}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="jewelry-text-muted">Margin:</span>
                        <p className="jewelry-text-high-contrast font-medium">{category.margin}%</p>
                      </div>
                      <div>
                        <span className="jewelry-text-muted">Top Item:</span>
                        <p className="jewelry-text-high-contrast font-medium">{category.topItem}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Sales Targets */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="jewelry-glass-panel"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="jewelry-text-luxury text-xl font-semibold flex items-center gap-2">
                  <Target className="jewelry-icon-gold" size={24} />
                  Sales Targets
                </h3>
                <button className="jewelry-btn-secondary flex items-center space-x-2 px-3 py-1">
                  <Plus className="jewelry-icon-gold" size={14} />
                  <span className="text-sm">Add Target</span>
                </button>
              </div>

              <div className="space-y-4">
                {salesTargets.map((target, index) => (
                  <div key={target.period} className="jewelry-glass-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(target.status)}
                        <div>
                          <h4 className="jewelry-text-high-contrast font-semibold">
                            {target.period}
                          </h4>
                          <span
                            className={`text-xs px-2 py-1 rounded ${getStatusColor(target.status)}`}
                          >
                            {target.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="jewelry-text-high-contrast font-bold text-lg">
                          {target.percentage}%
                        </p>
                        <p className="jewelry-text-muted text-sm">Achievement</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="jewelry-text-muted">
                          Target: ₹{target.target.toLocaleString()}
                        </span>
                        <span className="jewelry-text-muted">
                          Achieved: ₹{target.achieved.toLocaleString()}
                        </span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            target.percentage >= 100
                              ? 'bg-green-500'
                              : target.percentage >= 80
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(target.percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Top Customers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="jewelry-glass-panel"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="jewelry-text-luxury text-xl font-semibold flex items-center gap-2">
                <Crown className="jewelry-icon-gold" size={24} />
                Top Customers
              </h3>
              <button className="jewelry-btn-secondary flex items-center space-x-2 px-3 py-1">
                <Eye className="jewelry-icon-gold" size={14} />
                <span className="text-sm">View All</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {topCustomers.map((customer, index) => (
                <motion.div
                  key={customer.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  className="jewelry-glass-card jewelry-scale-hover p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {getVipIcon(customer.vipStatus)}
                      <span
                        className={`text-xs px-2 py-1 rounded ${getVipColor(customer.vipStatus)}`}
                      >
                        {customer.vipStatus.toUpperCase()}
                      </span>
                    </div>
                    <button className="jewelry-btn-secondary p-1">
                      <ChevronRight className="jewelry-icon-gold" size={14} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="jewelry-text-high-contrast font-semibold">{customer.name}</h4>
                      <p className="jewelry-text-muted text-sm flex items-center gap-1">
                        <Mail size={12} />
                        {customer.email}
                      </p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="jewelry-text-muted">Total Purchases:</span>
                        <span className="jewelry-text-high-contrast font-bold">
                          ₹{customer.totalPurchases.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="jewelry-text-muted">Last Purchase:</span>
                        <span className="jewelry-text-high-contrast">{customer.lastPurchase}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="jewelry-text-muted">Preferred:</span>
                        <span className="jewelry-text-high-contrast">
                          {customer.preferredCategory}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="jewelry-text-muted">Loyalty Points:</span>
                        <span className="jewelry-text-high-contrast font-medium">
                          {customer.loyaltyPoints.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Additional Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <div className="jewelry-glass-card p-6 text-center">
              <Sparkles className="mx-auto mb-3 jewelry-icon-gold" size={24} />
              <h4 className="jewelry-text-high-contrast text-xl font-bold">
                {salesMetrics.conversionRate}%
              </h4>
              <p className="jewelry-text-muted text-sm">Conversion Rate</p>
            </div>

            <div className="jewelry-glass-card p-6 text-center">
              <Shield className="mx-auto mb-3 jewelry-icon-gold" size={24} />
              <h4 className="jewelry-text-high-contrast text-xl font-bold">
                {salesMetrics.returnRate}%
              </h4>
              <p className="jewelry-text-muted text-sm">Return Rate</p>
            </div>

            <div className="jewelry-glass-card p-6 text-center">
              <Star className="mx-auto mb-3 jewelry-icon-gold" size={24} />
              <h4 className="jewelry-text-high-contrast text-xl font-bold">
                {salesMetrics.customerSatisfaction}/5
              </h4>
              <p className="jewelry-text-muted text-sm">Customer Rating</p>
            </div>

            <div className="jewelry-glass-card p-6 text-center">
              <Award className="mx-auto mb-3 jewelry-icon-gold" size={24} />
              <h4 className="jewelry-text-high-contrast text-xl font-bold">
                {salesMetrics.topProduct}
              </h4>
              <p className="jewelry-text-muted text-sm">Best Seller</p>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.4 }}
            className="text-center mt-12 mb-6"
          >
            <p className="jewelry-text-muted text-sm">
              Real-time analytics powered by{' '}
              <span className="jewelry-text-luxury font-semibold">HERA Business Intelligence</span>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
