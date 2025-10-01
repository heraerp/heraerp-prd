'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Download,
  Upload,
  Filter,
  Settings,
  Play,
  Pause,
  RefreshCw,
  Save,
  Share2,
  Printer,
  Mail,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Users,
  Package,
  ShoppingBag,
  Target,
  Award,
  Activity,
  Zap,
  Bell,
  Info,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Gem,
  Diamond,
  Crown,
  Star,
  Sparkles,
  Scale,
  Shield,
  Wrench,
  Calculator,
  Percent,
  Hash,
  Layers,
  Database,
  Cpu,
  Grid,
  List,
  MoreVertical,
  Search,
  SlidersHorizontal,
  Maximize2,
  Minimize2
} from 'lucide-react'
import '@/styles/jewelry-glassmorphism.css'

interface Report {
  id: string
  name: string
  type: 'sales' | 'inventory' | 'financial' | 'customer' | 'workshop' | 'security' | 'custom'
  description: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'on_demand'
  lastGenerated: string
  nextScheduled?: string
  format: 'pdf' | 'excel' | 'csv' | 'dashboard'
  recipients?: string[]
  status: 'ready' | 'generating' | 'scheduled' | 'failed'
  size?: string
  parameters?: any
  favorite: boolean
}

interface ReportMetric {
  label: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'stable'
  color?: string
  icon?: any
}

interface ChartData {
  label: string
  value: number
  percentage?: number
  color?: string
}

interface TimeSeriesData {
  date: string
  revenue: number
  orders: number
  customers: number
  avgOrderValue: number
}

interface ReportTemplate {
  id: string
  name: string
  category: string
  description: string
  metrics: string[]
  charts: string[]
  popularity: number
  lastUsed?: string
}

export default function JewelryReportsPage() {
  const [selectedTab, setSelectedTab] = useState('dashboard')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('this_month')
  const [selectedFormat, setSelectedFormat] = useState('pdf')
  const [showScheduler, setShowScheduler] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')

  // Mock report data
  const reports: Report[] = [
    {
      id: '1',
      name: 'Monthly Sales Report',
      type: 'sales',
      description: 'Comprehensive sales analysis including revenue, top products, and customer insights',
      frequency: 'monthly',
      lastGenerated: '2024-01-15 09:00',
      nextScheduled: '2024-02-01 09:00',
      format: 'pdf',
      recipients: ['management@jewelry.com', 'sales@jewelry.com'],
      status: 'ready',
      size: '2.4 MB',
      favorite: true
    },
    {
      id: '2',
      name: 'Inventory Valuation Report',
      type: 'inventory',
      description: 'Current inventory status with valuation, aging analysis, and movement tracking',
      frequency: 'weekly',
      lastGenerated: '2024-01-14 06:00',
      nextScheduled: '2024-01-21 06:00',
      format: 'excel',
      recipients: ['inventory@jewelry.com'],
      status: 'ready',
      size: '1.8 MB',
      favorite: true
    },
    {
      id: '3',
      name: 'Financial Performance Dashboard',
      type: 'financial',
      description: 'Real-time financial metrics including P&L, cash flow, and profitability analysis',
      frequency: 'daily',
      lastGenerated: '2024-01-16 00:00',
      nextScheduled: '2024-01-17 00:00',
      format: 'dashboard',
      status: 'ready',
      favorite: true
    },
    {
      id: '4',
      name: 'Customer Analytics Report',
      type: 'customer',
      description: 'Customer segmentation, purchase behavior, and loyalty program performance',
      frequency: 'monthly',
      lastGenerated: '2024-01-01 09:00',
      format: 'pdf',
      status: 'scheduled',
      favorite: false
    },
    {
      id: '5',
      name: 'Workshop Efficiency Report',
      type: 'workshop',
      description: 'Production metrics, craftsman performance, and quality control statistics',
      frequency: 'weekly',
      lastGenerated: '2024-01-13 15:00',
      format: 'excel',
      status: 'generating',
      favorite: false
    },
    {
      id: '6',
      name: 'Security Audit Report',
      type: 'security',
      description: 'Access logs, security incidents, and compliance status',
      frequency: 'on_demand',
      lastGenerated: '2024-01-10 14:30',
      format: 'pdf',
      status: 'ready',
      size: '0.8 MB',
      favorite: false
    }
  ]

  const reportTemplates: ReportTemplate[] = [
    {
      id: '1',
      name: 'Executive Summary',
      category: 'Management',
      description: 'High-level business overview with key metrics and trends',
      metrics: ['Revenue', 'Profit Margin', 'Customer Count', 'Inventory Value'],
      charts: ['Revenue Trend', 'Category Performance', 'Top Products'],
      popularity: 95,
      lastUsed: '2024-01-15'
    },
    {
      id: '2',
      name: 'Sales Performance Analysis',
      category: 'Sales',
      description: 'Detailed sales metrics with product and customer insights',
      metrics: ['Total Sales', 'Units Sold', 'Average Order Value', 'Conversion Rate'],
      charts: ['Sales Trend', 'Product Mix', 'Customer Segments'],
      popularity: 88
    },
    {
      id: '3',
      name: 'Inventory Turnover Report',
      category: 'Inventory',
      description: 'Stock movement analysis with aging and valuation',
      metrics: ['Stock Value', 'Turnover Rate', 'Dead Stock', 'Reorder Items'],
      charts: ['Stock Levels', 'Category Distribution', 'Aging Analysis'],
      popularity: 76
    },
    {
      id: '4',
      name: 'Customer Lifetime Value',
      category: 'Customer',
      description: 'Customer value analysis with segmentation and trends',
      metrics: ['CLV', 'Retention Rate', 'Churn Rate', 'NPS Score'],
      charts: ['CLV Distribution', 'Cohort Analysis', 'Retention Curve'],
      popularity: 82
    }
  ]

  // Mock dashboard metrics
  const dashboardMetrics: ReportMetric[] = [
    {
      label: 'Total Revenue',
      value: '¹2,850,000',
      change: 12.5,
      trend: 'up',
      icon: DollarSign
    },
    {
      label: 'Total Orders',
      value: '156',
      change: 8.3,
      trend: 'up',
      icon: ShoppingBag
    },
    {
      label: 'Active Customers',
      value: '89',
      change: -2.1,
      trend: 'down',
      icon: Users
    },
    {
      label: 'Inventory Value',
      value: '¹3,200,000',
      change: 5.7,
      trend: 'up',
      icon: Package
    },
    {
      label: 'Profit Margin',
      value: '42.3%',
      change: 3.2,
      trend: 'up',
      icon: Percent
    },
    {
      label: 'Workshop Efficiency',
      value: '87.5%',
      change: 1.8,
      trend: 'up',
      icon: Activity
    }
  ]

  // Mock chart data
  const categoryPerformance: ChartData[] = [
    { label: 'Rings', value: 1250000, percentage: 43.9, color: 'from-yellow-400 to-yellow-600' },
    { label: 'Necklaces', value: 890000, percentage: 31.2, color: 'from-blue-400 to-blue-600' },
    { label: 'Earrings', value: 420000, percentage: 14.7, color: 'from-purple-400 to-purple-600' },
    { label: 'Bracelets', value: 290000, percentage: 10.2, color: 'from-green-400 to-green-600' }
  ]

  const timeSeriesData: TimeSeriesData[] = [
    { date: 'Jan 1', revenue: 85000, orders: 4, customers: 3, avgOrderValue: 21250 },
    { date: 'Jan 5', revenue: 120000, orders: 6, customers: 5, avgOrderValue: 20000 },
    { date: 'Jan 10', revenue: 95000, orders: 5, customers: 4, avgOrderValue: 19000 },
    { date: 'Jan 15', revenue: 150000, orders: 8, customers: 6, avgOrderValue: 18750 }
  ]

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'templates', label: 'Templates', icon: Layers },
    { id: 'scheduler', label: 'Scheduler', icon: Clock },
    { id: 'custom', label: 'Custom Builder', icon: SlidersHorizontal }
  ]

  const periods = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_week', label: 'This Week' },
    { value: 'last_week', label: 'Last Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_quarter', label: 'This Quarter' },
    { value: 'this_year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ]

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'sales': return <ShoppingBag className="jewelry-icon-gold" size={20} />
      case 'inventory': return <Package className="jewelry-icon-gold" size={20} />
      case 'financial': return <DollarSign className="jewelry-icon-gold" size={20} />
      case 'customer': return <Users className="jewelry-icon-gold" size={20} />
      case 'workshop': return <Wrench className="jewelry-icon-gold" size={20} />
      case 'security': return <Shield className="jewelry-icon-gold" size={20} />
      case 'custom': return <SlidersHorizontal className="jewelry-icon-gold" size={20} />
      default: return <FileText className="jewelry-icon-gold" size={20} />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'jewelry-status-active'
      case 'generating': return 'jewelry-status-pending'
      case 'scheduled': return 'jewelry-status-luxury'
      case 'failed': return 'jewelry-status-inactive'
      default: return 'jewelry-status-inactive'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return <CheckCircle className="jewelry-icon-success" size={16} />
      case 'generating': return <Clock className="jewelry-icon-warning animate-spin" size={16} />
      case 'scheduled': return <Calendar className="jewelry-icon-info" size={16} />
      case 'failed': return <XCircle className="jewelry-icon-error" size={16} />
      default: return null
    }
  }

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return <ArrowUpRight className="text-green-500" size={16} />
      case 'down': return <ArrowDownRight className="text-red-500" size={16} />
      default: return <Activity className="text-gray-500" size={16} />
    }
  }

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

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
              Reports & Analytics
            </h1>
            <p className="jewelry-text-luxury text-lg md:text-xl">
              Comprehensive business intelligence and reporting dashboard
            </p>
          </motion.div>

          {/* Navigation Tabs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="jewelry-glass-panel"
          >
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      selectedTab === tab.id
                        ? 'jewelry-btn-primary'
                        : 'jewelry-btn-secondary'
                    }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                <button className="jewelry-btn-secondary flex items-center space-x-2 px-4 py-2">
                  <RefreshCw className="jewelry-icon-gold" size={18} />
                  <span>Refresh</span>
                </button>
                <button className="jewelry-btn-primary flex items-center space-x-2 px-4 py-2">
                  <Plus className="jewelry-icon-gold" size={18} />
                  <span>New Report</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Dashboard Tab */}
          {selectedTab === 'dashboard' && (
            <>
              {/* Period Selection */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="jewelry-glass-panel"
              >
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {periods.map((period) => (
                      <button
                        key={period.value}
                        onClick={() => setSelectedPeriod(period.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          selectedPeriod === period.value
                            ? 'jewelry-btn-primary'
                            : 'jewelry-btn-secondary'
                        }`}
                      >
                        {period.label}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="jewelry-btn-secondary p-2">
                      <Download className="jewelry-icon-gold" size={16} />
                    </button>
                    <button className="jewelry-btn-secondary p-2">
                      <Share2 className="jewelry-icon-gold" size={16} />
                    </button>
                    <button className="jewelry-btn-secondary p-2">
                      <Maximize2 className="jewelry-icon-gold" size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Key Metrics */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
              >
                {dashboardMetrics.map((metric, index) => (
                  <div key={metric.label} className="jewelry-glass-card jewelry-float p-4" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="flex items-center justify-between mb-2">
                      <metric.icon className="jewelry-icon-gold" size={20} />
                      {getTrendIcon(metric.trend)}
                    </div>
                    <h3 className="jewelry-text-high-contrast text-xl font-bold">{metric.value}</h3>
                    <p className="jewelry-text-muted text-xs font-medium">{metric.label}</p>
                    {metric.change && (
                      <div className={`flex items-center mt-1 text-xs ${metric.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                        <span>{metric.trend === 'up' ? '+' : ''}{metric.change}%</span>
                        <span className="ml-1 jewelry-text-muted">vs last period</span>
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Revenue Trend Chart */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="jewelry-glass-panel"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="jewelry-text-luxury text-xl font-semibold flex items-center gap-2">
                      <LineChart className="jewelry-icon-gold" size={24} />
                      Revenue Trend
                    </h3>
                    <button className="jewelry-btn-secondary p-2">
                      <Eye className="jewelry-icon-gold" size={16} />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Simplified chart representation */}
                    <div className="h-48 flex items-end justify-between gap-2">
                      {timeSeriesData.map((data, index) => (
                        <div key={data.date} className="flex-1 flex flex-col items-center gap-2">
                          <div className="w-full bg-gradient-to-t from-jewelry-gold-400 to-jewelry-gold-600 rounded-t"
                               style={{ height: `${(data.revenue / 150000) * 100}%` }}>
                          </div>
                          <span className="jewelry-text-muted text-xs">{data.date}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-jewelry-blue-200">
                      <div>
                        <p className="jewelry-text-muted text-sm">Total Revenue</p>
                        <p className="jewelry-text-high-contrast font-bold text-lg">¹450,000</p>
                      </div>
                      <div>
                        <p className="jewelry-text-muted text-sm">Growth Rate</p>
                        <p className="jewelry-text-high-contrast font-bold text-lg">+12.5%</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Category Performance */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
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
                      <div key={category.label} className="flex items-center gap-4">
                        <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${category.color}`}></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="jewelry-text-high-contrast font-medium">{category.label}</span>
                            <span className="jewelry-text-high-contrast font-bold">¹{(category.value / 1000).toFixed(0)}K</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full bg-gradient-to-r ${category.color}`}
                              style={{ width: `${category.percentage}%` }}
                            ></div>
                          </div>
                          <span className="jewelry-text-muted text-xs">{category.percentage}% of total</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Quick Actions */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.0 }}
                className="jewelry-glass-panel"
              >
                <h3 className="jewelry-text-luxury text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <button className="jewelry-glass-card p-4 text-center hover:scale-105 transition-transform">
                    <Download className="mx-auto mb-2 jewelry-icon-gold" size={24} />
                    <span className="jewelry-text-high-contrast text-sm">Export Data</span>
                  </button>
                  <button className="jewelry-glass-card p-4 text-center hover:scale-105 transition-transform">
                    <Mail className="mx-auto mb-2 jewelry-icon-gold" size={24} />
                    <span className="jewelry-text-high-contrast text-sm">Email Report</span>
                  </button>
                  <button className="jewelry-glass-card p-4 text-center hover:scale-105 transition-transform">
                    <Printer className="mx-auto mb-2 jewelry-icon-gold" size={24} />
                    <span className="jewelry-text-high-contrast text-sm">Print</span>
                  </button>
                  <button className="jewelry-glass-card p-4 text-center hover:scale-105 transition-transform">
                    <Calendar className="mx-auto mb-2 jewelry-icon-gold" size={24} />
                    <span className="jewelry-text-high-contrast text-sm">Schedule</span>
                  </button>
                  <button className="jewelry-glass-card p-4 text-center hover:scale-105 transition-transform">
                    <Save className="mx-auto mb-2 jewelry-icon-gold" size={24} />
                    <span className="jewelry-text-high-contrast text-sm">Save View</span>
                  </button>
                  <button className="jewelry-glass-card p-4 text-center hover:scale-105 transition-transform">
                    <Settings className="mx-auto mb-2 jewelry-icon-gold" size={24} />
                    <span className="jewelry-text-high-contrast text-sm">Customize</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}

          {/* Reports Tab */}
          {selectedTab === 'reports' && (
            <>
              {/* Search and Filters */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="jewelry-glass-panel"
              >
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex flex-wrap gap-4 items-center flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 jewelry-icon-gold" size={20} />
                      <input
                        type="text"
                        placeholder="Search reports..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="jewelry-input pl-10 w-64"
                      />
                    </div>
                    
                    <button 
                      onClick={() => setShowFilters(!showFilters)}
                      className={`jewelry-btn-secondary flex items-center space-x-2 px-4 py-2 ${showFilters ? 'ring-2 ring-jewelry-gold-500' : ''}`}
                    >
                      <Filter className="jewelry-icon-gold" size={18} />
                      <span>Filters</span>
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded ${viewMode === 'grid' ? 'jewelry-btn-primary' : 'jewelry-btn-secondary'}`}
                    >
                      <Grid size={16} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded ${viewMode === 'list' ? 'jewelry-btn-primary' : 'jewelry-btn-secondary'}`}
                    >
                      <List size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Reports Grid/List */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="jewelry-glass-panel"
              >
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredReports.map((report, index) => (
                      <motion.div
                        key={report.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="jewelry-glass-card jewelry-scale-hover p-6"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {getReportIcon(report.type)}
                            <div className="flex-1">
                              <h3 className="jewelry-text-high-contrast font-semibold">{report.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                {getStatusIcon(report.status)}
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(report.status)}`}>
                                  {report.status.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => report.favorite = !report.favorite}
                            className="jewelry-btn-secondary p-1"
                          >
                            <Star className={report.favorite ? 'fill-current jewelry-icon-gold' : 'jewelry-icon-gold'} size={16} />
                          </button>
                        </div>
                        
                        <p className="jewelry-text-muted text-sm mb-4 line-clamp-2">{report.description}</p>
                        
                        <div className="space-y-2 mb-4 text-sm">
                          <div className="flex justify-between">
                            <span className="jewelry-text-muted">Frequency:</span>
                            <span className="jewelry-text-high-contrast capitalize">{report.frequency.replace('_', ' ')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="jewelry-text-muted">Format:</span>
                            <span className="jewelry-text-high-contrast uppercase">{report.format}</span>
                          </div>
                          {report.lastGenerated && (
                            <div className="flex justify-between">
                              <span className="jewelry-text-muted">Last Generated:</span>
                              <span className="jewelry-text-high-contrast">{report.lastGenerated}</span>
                            </div>
                          )}
                          {report.size && (
                            <div className="flex justify-between">
                              <span className="jewelry-text-muted">Size:</span>
                              <span className="jewelry-text-high-contrast">{report.size}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {report.status === 'ready' && (
                            <>
                              <button className="jewelry-btn-primary flex items-center space-x-2 px-3 py-1.5 text-sm flex-1">
                                <Download size={14} />
                                <span>Download</span>
                              </button>
                              <button className="jewelry-btn-secondary p-1.5">
                                <Eye className="jewelry-icon-gold" size={14} />
                              </button>
                              <button className="jewelry-btn-secondary p-1.5">
                                <Share2 className="jewelry-icon-gold" size={14} />
                              </button>
                            </>
                          )}
                          {report.status === 'generating' && (
                            <button disabled className="jewelry-btn-secondary flex items-center space-x-2 px-3 py-1.5 text-sm flex-1">
                              <Clock className="animate-spin" size={14} />
                              <span>Generating...</span>
                            </button>
                          )}
                          {report.status === 'scheduled' && (
                            <button className="jewelry-btn-secondary flex items-center space-x-2 px-3 py-1.5 text-sm flex-1">
                              <Calendar size={14} />
                              <span>View Schedule</span>
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredReports.map((report, index) => (
                      <motion.div
                        key={report.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="jewelry-glass-card p-4 hover:scale-[1.01] transition-transform"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            {getReportIcon(report.type)}
                            <div className="flex-1">
                              <h3 className="jewelry-text-high-contrast font-semibold">{report.name}</h3>
                              <p className="jewelry-text-muted text-sm">{report.description}</p>
                            </div>
                            <div className="flex items-center gap-6 text-sm">
                              <div>
                                <p className="jewelry-text-muted">Frequency</p>
                                <p className="jewelry-text-high-contrast capitalize">{report.frequency.replace('_', ' ')}</p>
                              </div>
                              <div>
                                <p className="jewelry-text-muted">Format</p>
                                <p className="jewelry-text-high-contrast uppercase">{report.format}</p>
                              </div>
                              {report.lastGenerated && (
                                <div>
                                  <p className="jewelry-text-muted">Last Generated</p>
                                  <p className="jewelry-text-high-contrast">{report.lastGenerated}</p>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              {getStatusIcon(report.status)}
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(report.status)}`}>
                                {report.status.toUpperCase()}
                              </span>
                              <button className="jewelry-btn-secondary p-2">
                                <MoreVertical className="jewelry-icon-gold" size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </>
          )}

          {/* Templates Tab */}
          {selectedTab === 'templates' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="jewelry-glass-panel"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="jewelry-text-luxury text-xl font-semibold flex items-center gap-2">
                  <Layers className="jewelry-icon-gold" size={24} />
                  Report Templates
                </h3>
                <button className="jewelry-btn-primary flex items-center space-x-2 px-4 py-2">
                  <Plus className="jewelry-icon-gold" size={18} />
                  <span>Create Template</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reportTemplates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="jewelry-glass-card jewelry-scale-hover p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="jewelry-text-high-contrast font-semibold text-lg">{template.name}</h4>
                        <span className="jewelry-text-muted text-sm">{template.category}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="jewelry-icon-gold" size={16} />
                        <span className="jewelry-text-high-contrast font-medium">{template.popularity}%</span>
                      </div>
                    </div>
                    
                    <p className="jewelry-text-muted text-sm mb-4">{template.description}</p>
                    
                    <div className="space-y-3 mb-4">
                      <div>
                        <p className="jewelry-text-luxury text-xs font-medium mb-2">Included Metrics:</p>
                        <div className="flex flex-wrap gap-2">
                          {template.metrics.map((metric, i) => (
                            <span key={i} className="px-2 py-1 bg-jewelry-blue-100 dark:bg-jewelry-blue-800 text-jewelry-blue-800 dark:text-jewelry-blue-200 rounded text-xs">
                              {metric}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="jewelry-text-luxury text-xs font-medium mb-2">Charts & Visualizations:</p>
                        <div className="flex flex-wrap gap-2">
                          {template.charts.map((chart, i) => (
                            <span key={i} className="px-2 py-1 bg-jewelry-gold-100 dark:bg-jewelry-gold-900 text-jewelry-gold-800 dark:text-jewelry-gold-200 rounded text-xs">
                              {chart}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button className="jewelry-btn-primary flex items-center space-x-2 px-3 py-1.5 text-sm flex-1">
                        <Play size={14} />
                        <span>Use Template</span>
                      </button>
                      <button className="jewelry-btn-secondary p-1.5">
                        <Edit className="jewelry-icon-gold" size={14} />
                      </button>
                      <button className="jewelry-btn-secondary p-1.5">
                        <Eye className="jewelry-icon-gold" size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Footer */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            className="text-center mt-12 mb-6"
          >
            <p className="jewelry-text-muted text-sm">
              Business intelligence powered by <span className="jewelry-text-luxury font-semibold">HERA Analytics Engine</span>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}