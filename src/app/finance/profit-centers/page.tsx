'use client'

import React from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  TrendingUp,
  Search,
  Filter,
  Download,
  Plus,
  ChevronRight,
  DollarSign,
  Activity,
  MapPin,
  Users,
  BarChart3,
  PieChart,
  Target,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Eye,
  Edit,
  MoreVertical,
  Building2,
  Zap,
  Package,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  ComposedChart,
  Line,
  Legend
} from 'recharts'

// India Vision Organization ID
const KERALA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001'

interface ProfitCenter {
  id: string
  code: string
  name: string
  region: string
  manager: string
  revenue: number
  cost: number
  profit: number
  margin: number
  customers: number
  employees: number
  status: 'excellent' | 'good' | 'average' | 'poor'
  trend: 'up' | 'down' | 'stable'
  lastUpdated: string
}

interface PerformanceMetric {
  metric: string
  value: number
  target: number
  achievement: number
}

export default function ProfitCentersPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'centers' | 'performance'>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Profit Center Overview
  const [overviewMetrics] = useState({
    totalCenters: 8,
    totalRevenue: 540000000,
    totalCost: 417400000,
    totalProfit: 122600000,
    avgMargin: 22.7,
    topPerformer: 'Thiruvananthapuram Region'
  })

  // Profit Centers
  const [profitCenters] = useState<ProfitCenter[]>([
    {
      id: '1',
      code: 'PC-001',
      name: 'Thiruvananthapuram Region',
      region: 'South',
      manager: 'Ravi Menon',
      revenue: 216000000,
      cost: 162000000,
      profit: 54000000,
      margin: 25.0,
      customers: 8500,
      employees: 120,
      status: 'excellent',
      trend: 'up',
      lastUpdated: '2024-06-15'
    },
    {
      id: '2',
      code: 'PC-002',
      name: 'Kochi Region',
      region: 'Central',
      manager: 'Anjali Nair',
      revenue: 189000000,
      cost: 147400000,
      profit: 41600000,
      margin: 22.0,
      customers: 7200,
      employees: 95,
      status: 'good',
      trend: 'stable',
      lastUpdated: '2024-06-15'
    },
    {
      id: '3',
      code: 'PC-003',
      name: 'Kozhikode Region',
      region: 'North',
      manager: 'Suresh Kumar',
      revenue: 135000000,
      cost: 108000000,
      profit: 27000000,
      margin: 20.0,
      customers: 5800,
      employees: 75,
      status: 'good',
      trend: 'up',
      lastUpdated: '2024-06-14'
    }
  ])

  // Monthly Performance
  const [monthlyPerformance] = useState([
    { month: 'Jan', revenue: 85, cost: 65, profit: 20 },
    { month: 'Feb', revenue: 88, cost: 67, profit: 21 },
    { month: 'Mar', revenue: 90, cost: 68, profit: 22 },
    { month: 'Apr', revenue: 92, cost: 70, profit: 22 },
    { month: 'May', revenue: 95, cost: 72, profit: 23 },
    { month: 'Jun', revenue: 90, cost: 69.6, profit: 20.4 }
  ])

  // Regional Breakdown
  const [regionalData] = useState([
    { name: 'South', value: 216, color: '#10b981' },
    { name: 'Central', value: 189, color: '#00DDFF' },
    { name: 'North', value: 135, color: '#f59e0b' }
  ])

  // Performance Metrics
  const [performanceMetrics] = useState<PerformanceMetric[]>([
    { metric: 'Revenue Growth', value: 15.2, target: 12, achievement: 126.7 },
    { metric: 'Profit Margin', value: 22.7, target: 20, achievement: 113.5 },
    { metric: 'Customer Acquisition', value: 850, target: 750, achievement: 113.3 },
    { metric: 'Cost Efficiency', value: 77.3, target: 80, achievement: 96.6 }
  ])

  const supabase = createClientComponentClient()

  const refreshData = async () => {
    setIsRefreshing(true)
    // Fetch profit center data from Supabase
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-emerald-500/20 text-emerald-400'
      case 'good':
        return 'bg-[#00DDFF]/20 text-[#00DDFF]'
      case 'average':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'poor':
        return 'bg-red-500/20 text-red-400'
      default:
        return 'bg-gray-9000/20 text-muted-foreground'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="h-4 w-4 text-emerald-400" />
      case 'down':
        return <ArrowDownRight className="h-4 w-4 text-red-400" />
      default:
        return <Activity className="h-4 w-4 text-yellow-400" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-white/80 bg-clip-text text-transparent">
            Profit Centers
          </h1>
          <p className="text-foreground/60 mt-1">Monitor regional performance and profitability</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={refreshData}
            className={`flex items-center space-x-2 px-4 py-2 bg-background/5 backdrop-blur-xl border border-border/10 rounded-lg text-foreground hover:bg-background/10 transition-all duration-300 ${isRefreshing ? 'animate-pulse' : ''}`}
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-lg text-foreground font-medium hover:shadow-lg hover:shadow-[#00DDFF]/30 transition-all duration-300">
            <Plus className="h-5 w-5" />
            <span>New Profit Center</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-background/5 backdrop-blur-xl p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-md font-medium transition-all duration-300 ${
            activeTab === 'overview'
              ? 'bg-gradient-to-r from-[#00DDFF] to-[#0049B7] text-foreground'
              : 'text-foreground/60 hover:text-foreground'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('centers')}
          className={`px-4 py-2 rounded-md font-medium transition-all duration-300 ${
            activeTab === 'centers'
              ? 'bg-gradient-to-r from-[#00DDFF] to-[#0049B7] text-foreground'
              : 'text-foreground/60 hover:text-foreground'
          }`}
        >
          Profit Centers
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={`px-4 py-2 rounded-md font-medium transition-all duration-300 ${
            activeTab === 'performance'
              ? 'bg-gradient-to-r from-[#00DDFF] to-[#0049B7] text-foreground'
              : 'text-foreground/60 hover:text-foreground'
          }`}
        >
          Performance
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-[#00DDFF] to-[#0049B7]">
                    <DollarSign className="h-6 w-6 text-foreground" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
                <h3 className="text-foreground/60 text-sm font-medium mb-1">Total Revenue</h3>
                <p className="text-2xl font-bold text-foreground">
                  ₹{(overviewMetrics.totalRevenue / 10000000).toFixed(0)} Cr
                </p>
                <p className="text-xs text-foreground/40 mt-1">+15.2% YoY</p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600">
                    <TrendingUp className="h-6 w-6 text-foreground" />
                  </div>
                  <span className="text-xs text-emerald-400 font-medium">
                    {overviewMetrics.totalCenters} centers
                  </span>
                </div>
                <h3 className="text-foreground/60 text-sm font-medium mb-1">Total Profit</h3>
                <p className="text-2xl font-bold text-foreground">
                  ₹{(overviewMetrics.totalProfit / 10000000).toFixed(1)} Cr
                </p>
                <p className="text-xs text-foreground/40 mt-1">
                  {overviewMetrics.avgMargin}% margin
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fff685] to-amber-500 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-[#fff685] to-amber-500">
                    <Target className="h-6 w-6 text-foreground" />
                  </div>
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                </div>
                <h3 className="text-foreground/60 text-sm font-medium mb-1">Top Performer</h3>
                <p className="text-lg font-bold text-foreground">{overviewMetrics.topPerformer}</p>
                <p className="text-xs text-foreground/40 mt-1">25% profit margin</p>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Performance */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-foreground mb-6">
                  Revenue & Profit Trend
                </h2>
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={monthlyPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" tickFormatter={value => `₹${value}Cr`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px'
                      }}
                      formatter={(value: any) => `₹${value} Cr`}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#00DDFF" opacity={0.8} />
                    <Bar dataKey="cost" fill="#ef4444" opacity={0.8} />
                    <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Regional Distribution */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-foreground mb-6">
                  Regional Revenue Distribution
                </h2>
                <ResponsiveContainer width="100%" height={200}>
                  <RePieChart>
                    <Pie
                      data={regionalData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {regionalData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px'
                      }}
                      formatter={(value: any) => `₹${value} Cr`}
                    />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {regionalData.map(item => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-foreground/80">{item.name} Region</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">₹{item.value} Cr</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'centers' && (
        <>
          {/* Centers Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-foreground/40" />
              <input
                type="text"
                placeholder="Search profit centers..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background/5 backdrop-blur-xl border border-border/10 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-[#00DDFF] transition-colors"
              />
            </div>

            <select
              value={selectedRegion}
              onChange={e => setSelectedRegion(e.target.value)}
              className="px-4 py-3 bg-background/5 backdrop-blur-xl border border-border/10 rounded-lg text-foreground focus:outline-none focus:border-[#00DDFF] transition-colors"
            >
              <option value="all">All Regions</option>
              <option value="south">South</option>
              <option value="central">Central</option>
              <option value="north">North</option>
            </select>

            <button className="flex items-center space-x-2 px-4 py-3 bg-background/5 backdrop-blur-xl border border-border/10 rounded-lg text-foreground hover:bg-background/10 transition-colors">
              <Download className="h-5 w-5" />
              <span>Export</span>
            </button>
          </div>

          {/* Profit Centers Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {profitCenters.map(center => (
              <div key={center.id} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <Building2 className="h-5 w-5 text-[#00DDFF]" />
                        <h3 className="text-lg font-semibold text-foreground">{center.name}</h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(center.status)}`}
                        >
                          {center.status}
                        </span>
                        {getTrendIcon(center.trend)}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-foreground/60">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{center.region}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{center.manager}</span>
                        </div>
                      </div>
                    </div>
                    <button className="text-foreground/40 hover:text-foreground transition-colors">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-foreground/60 mb-1">Revenue</p>
                      <p className="text-lg font-semibold text-foreground">
                        ₹{(center.revenue / 10000000).toFixed(0)} Cr
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground/60 mb-1">Cost</p>
                      <p className="text-lg font-semibold text-foreground">
                        ₹{(center.cost / 10000000).toFixed(0)} Cr
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground/60 mb-1">Profit</p>
                      <p className="text-lg font-semibold text-emerald-400">
                        ₹{(center.profit / 10000000).toFixed(0)} Cr
                      </p>
                    </div>
                  </div>

                  {/* Profit Margin Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-foreground/60 mb-1">
                      <span>Profit Margin</span>
                      <span className="font-medium text-foreground">{center.margin}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-background/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          center.margin >= 25
                            ? 'bg-gradient-to-r from-emerald-400 to-green-500'
                            : center.margin >= 20
                              ? 'bg-gradient-to-r from-[#00DDFF] to-[#0049B7]'
                              : center.margin >= 15
                                ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                                : 'bg-gradient-to-r from-red-400 to-rose-500'
                        }`}
                        style={{ width: `${Math.min(center.margin * 2, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Bottom Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4 text-foreground/60">
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{center.customers} customers</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Zap className="h-4 w-4" />
                        <span>{center.employees} employees</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-foreground/40" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'performance' && (
        <>
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {performanceMetrics.map(metric => (
              <div key={metric.metric} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">{metric.metric}</h3>
                    {metric.achievement >= 100 ? (
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-foreground/60 mb-1">Actual</p>
                      <p className="text-lg font-semibold text-foreground">
                        {metric.metric.includes('%') ||
                        metric.metric.includes('Margin') ||
                        metric.metric.includes('Efficiency')
                          ? `${metric.value}%`
                          : metric.value}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground/60 mb-1">Target</p>
                      <p className="text-lg font-semibold text-foreground/60">
                        {metric.metric.includes('%') ||
                        metric.metric.includes('Margin') ||
                        metric.metric.includes('Efficiency')
                          ? `${metric.target}%`
                          : metric.target}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground/60 mb-1">Achievement</p>
                      <p
                        className={`text-lg font-semibold ${
                          metric.achievement >= 100 ? 'text-emerald-400' : 'text-yellow-400'
                        }`}
                      >
                        {metric.achievement.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="h-3 rounded-full bg-background/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        metric.achievement >= 100
                          ? 'bg-gradient-to-r from-emerald-400 to-green-500'
                          : 'bg-gradient-to-r from-yellow-400 to-amber-500'
                      }`}
                      style={{ width: `${Math.min(metric.achievement, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Regional Comparison */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-foreground mb-6">
                Regional Performance Comparison
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={profitCenters}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="region" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px'
                    }}
                    formatter={(value: any, name: string) => {
                      if (name === 'margin') return `${value}%`
                      return `₹${(value / 10000000).toFixed(0)} Cr`
                    }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#00DDFF" />
                  <Bar dataKey="profit" fill="#10b981" />
                  <Bar dataKey="margin" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
