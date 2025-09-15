'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  Calculator,
  Search,
  Filter,
  Download,
  Plus,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Eye,
  Edit,
  MoreVertical,
  Building2,
  Briefcase,
  Settings,
  Package,
  BarChart3,
  PieChart
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  Legend
} from 'recharts'

// India Vision Organization ID
const KERALA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001'

interface CostCenter {
  id: string
  code: string
  name: string
  type: 'operational' | 'support' | 'administrative' | 'r&d'
  manager: string
  budget: number
  actualSpend: number
  variance: number
  variancePercent: number
  headcount: number
  status: 'on-track' | 'warning' | 'over-budget'
  lastUpdated: string
}

interface CostBreakdown {
  category: string
  budget: number
  actual: number
  variance: number
}

export default function CostCentersPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'centers' | 'analysis'>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Cost Center Overview
  const [overviewMetrics] = useState({
    totalCenters: 12,
    totalBudget: 380000000,
    totalSpend: 342000000,
    overallVariance: 10,
    centersOverBudget: 2,
    centersOnTrack: 8
  })

  // Cost Centers
  const [costCenters] = useState<CostCenter[]>([
    {
      id: '1',
      code: 'CC-001',
      name: 'Network Operations',
      type: 'operational',
      manager: 'Rajesh Kumar',
      budget: 150000000,
      actualSpend: 142000000,
      variance: 8000000,
      variancePercent: 5.3,
      headcount: 45,
      status: 'on-track',
      lastUpdated: '2024-06-15'
    },
    {
      id: '2',
      code: 'CC-002',
      name: 'Customer Service',
      type: 'support',
      manager: 'Priya Nair',
      budget: 80000000,
      actualSpend: 78000000,
      variance: 2000000,
      variancePercent: 2.5,
      headcount: 120,
      status: 'on-track',
      lastUpdated: '2024-06-15'
    },
    {
      id: '3',
      code: 'CC-003',
      name: 'Field Operations',
      type: 'operational',
      manager: 'Suresh Menon',
      budget: 100000000,
      actualSpend: 105000000,
      variance: -5000000,
      variancePercent: -5.0,
      headcount: 85,
      status: 'over-budget',
      lastUpdated: '2024-06-14'
    },
    {
      id: '4',
      code: 'CC-004',
      name: 'Administration',
      type: 'administrative',
      manager: 'Lakshmi Pillai',
      budget: 50000000,
      actualSpend: 48000000,
      variance: 2000000,
      variancePercent: 4.0,
      headcount: 35,
      status: 'on-track',
      lastUpdated: '2024-06-15'
    }
  ])

  // Monthly Spend Trend
  const [spendTrend] = useState([
    { month: 'Jan', budget: 63.3, actual: 58.5 },
    { month: 'Feb', budget: 63.3, actual: 60.2 },
    { month: 'Mar', budget: 63.3, actual: 61.8 },
    { month: 'Apr', budget: 63.3, actual: 64.5 },
    { month: 'May', budget: 63.3, actual: 65.0 },
    { month: 'Jun', budget: 63.3, actual: 62.0 }
  ])

  // Cost Category Breakdown
  const [categoryBreakdown] = useState<CostBreakdown[]>([
    { category: 'Personnel', budget: 200000000, actual: 185000000, variance: 15000000 },
    { category: 'Operations', budget: 100000000, actual: 95000000, variance: 5000000 },
    { category: 'Technology', budget: 50000000, actual: 48000000, variance: 2000000 },
    { category: 'Facilities', budget: 30000000, actual: 28000000, variance: 2000000 }
  ])

  // Department Efficiency
  const [efficiencyData] = useState([
    { name: 'Network Ops', efficiency: 94.7, fill: '#10b981' },
    { name: 'Customer Service', efficiency: 97.5, fill: '#00DDFF' },
    { name: 'Field Ops', efficiency: 95.0, fill: '#f59e0b' },
    { name: 'Admin', efficiency: 96.0, fill: '#8b5cf6' }
  ])

  const supabase = createClientComponentClient()

  const refreshData = async () => {
    setIsRefreshing(true)
    // Fetch cost center data from Supabase
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'bg-emerald-500/20 text-emerald-400'
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'over-budget':
        return 'bg-red-500/20 text-red-400'
      default:
        return 'bg-gray-500/20 text-muted-foreground'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'operational':
        return Settings
      case 'support':
        return Users
      case 'administrative':
        return Building2
      case 'r&d':
        return Package
      default:
        return Briefcase
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Cost Centers
          </h1>
          <p className="text-foreground/60 mt-1">Monitor and manage departmental costs and budgets</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={refreshData}
            className={`flex items-center space-x-2 px-4 py-2 bg-background/5 backdrop-blur-xl border border-border/10 rounded-lg text-foreground hover:bg-background/10 transition-all duration-300 ${isRefreshing ? 'animate-pulse' : ''}`}
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-lg text-foreground font-medium hover:shadow-lg hover:shadow-yellow-500/30 transition-all duration-300">
            <Plus className="h-5 w-5" />
            <span>New Cost Center</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-background/5 backdrop-blur-xl p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-md font-medium transition-all duration-300 ${
            activeTab === 'overview'
              ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-foreground'
              : 'text-foreground/60 hover:text-foreground'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('centers')}
          className={`px-4 py-2 rounded-md font-medium transition-all duration-300 ${
            activeTab === 'centers'
              ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-foreground'
              : 'text-foreground/60 hover:text-foreground'
          }`}
        >
          Cost Centers
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`px-4 py-2 rounded-md font-medium transition-all duration-300 ${
            activeTab === 'analysis'
              ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-foreground'
              : 'text-foreground/60 hover:text-foreground'
          }`}
        >
          Analysis
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600">
                    <Calculator className="h-6 w-6 text-foreground" />
                  </div>
                  <span className="text-xs text-yellow-400 font-medium">
                    {overviewMetrics.totalCenters} centers
                  </span>
                </div>
                <h3 className="text-foreground/60 text-sm font-medium mb-1">Total Budget</h3>
                <p className="text-2xl font-bold text-foreground">
                  ₹{(overviewMetrics.totalBudget / 10000000).toFixed(0)} Cr
                </p>
                <p className="text-xs text-foreground/40 mt-1">Annual allocation</p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600">
                    <DollarSign className="h-6 w-6 text-foreground" />
                  </div>
                  <span className="text-xs text-emerald-400 font-medium">YTD</span>
                </div>
                <h3 className="text-foreground/60 text-sm font-medium mb-1">Actual Spend</h3>
                <p className="text-2xl font-bold text-foreground">
                  ₹{(overviewMetrics.totalSpend / 10000000).toFixed(0)} Cr
                </p>
                <p className="text-xs text-foreground/40 mt-1">90% of budget</p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-[#00DDFF] to-[#0049B7]">
                    <Activity className="h-6 w-6 text-foreground" />
                  </div>
                  <div className="flex items-center space-x-1 text-sm font-medium text-emerald-400">
                    <TrendingUp className="h-4 w-4" />
                    <span>{overviewMetrics.overallVariance}%</span>
                  </div>
                </div>
                <h3 className="text-foreground/60 text-sm font-medium mb-1">Budget Variance</h3>
                <p className="text-2xl font-bold text-foreground">₹3.8 Cr</p>
                <p className="text-xs text-foreground/40 mt-1">Under budget</p>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trend */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-foreground mb-6">Budget vs Actual Spend</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={spendTrend}>
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
                    <Line
                      type="monotone"
                      dataKey="budget"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                    <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Efficiency Chart */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-foreground mb-6">Department Efficiency</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="10%"
                    outerRadius="80%"
                    data={efficiencyData}
                  >
                    <RadialBar minAngle={15} background clockWise dataKey="efficiency" />
                    <Legend
                      iconSize={10}
                      layout="vertical"
                      verticalAlign="middle"
                      align="right"
                      wrapperStyle={{
                        paddingLeft: '20px'
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px'
                      }}
                      formatter={(value: any) => `${value}%`}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
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
                placeholder="Search cost centers..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background/5 backdrop-blur-xl border border-border/10 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-yellow-500 transition-colors"
              />
            </div>

            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="px-4 py-3 bg-background/5 backdrop-blur-xl border border-border/10 rounded-lg text-foreground focus:outline-none focus:border-yellow-500 transition-colors"
            >
              <option value="all">All Types</option>
              <option value="operational">Operational</option>
              <option value="support">Support</option>
              <option value="administrative">Administrative</option>
              <option value="r&d">R&D</option>
            </select>

            <button className="flex items-center space-x-2 px-4 py-3 bg-background/5 backdrop-blur-xl border border-border/10 rounded-lg text-foreground hover:bg-background/10 transition-colors">
              <Download className="h-5 w-5" />
              <span>Export</span>
            </button>
          </div>

          {/* Cost Centers List */}
          <div className="space-y-4">
            {costCenters.map(center => {
              const Icon = getTypeIcon(center.type)
              return (
                <div key={center.id} className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                  <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Icon className="h-5 w-5 text-yellow-400" />
                          <h3 className="text-lg font-semibold text-foreground">{center.name}</h3>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-background/10 text-foreground/60">
                            {center.code}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(center.status)}`}
                          >
                            {center.status.replace('-', ' ')}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-foreground/60 mb-1">Budget</p>
                            <p className="text-lg font-semibold text-foreground">
                              ₹{(center.budget / 10000000).toFixed(1)} Cr
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-foreground/60 mb-1">Actual Spend</p>
                            <p className="text-lg font-semibold text-foreground">
                              ₹{(center.actualSpend / 10000000).toFixed(1)} Cr
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-foreground/60 mb-1">Variance</p>
                            <p
                              className={`text-lg font-semibold ${center.variance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                            >
                              {center.variance >= 0 ? '+' : ''}₹
                              {(Math.abs(center.variance) / 10000000).toFixed(1)} Cr
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-foreground/60 mb-1">Variance %</p>
                            <p
                              className={`text-lg font-semibold ${center.variancePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                            >
                              {center.variancePercent >= 0 ? '+' : ''}
                              {center.variancePercent}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-foreground/60 mb-1">Headcount</p>
                            <p className="text-lg font-semibold text-foreground">{center.headcount}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-6 text-sm text-foreground/60">
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4" />
                              <span>Manager: {center.manager}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Activity className="h-4 w-4" />
                              <span>
                                Updated: {new Date(center.lastUpdated).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-48">
                            <div className="flex justify-between text-xs text-foreground/60 mb-1">
                              <span>Budget Used</span>
                              <span>
                                {((center.actualSpend / center.budget) * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-background/10 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  center.status === 'on-track'
                                    ? 'bg-gradient-to-r from-emerald-400 to-green-500'
                                    : center.status === 'warning'
                                      ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                                      : 'bg-gradient-to-r from-red-400 to-rose-500'
                                }`}
                                style={{
                                  width: `${Math.min((center.actualSpend / center.budget) * 100, 100)}%`
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <button className="ml-4 text-foreground/40 hover:text-foreground transition-colors">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {activeTab === 'analysis' && (
        <>
          {/* Category Breakdown */}
          <div className="relative group mb-6">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-foreground mb-6">Cost Category Analysis</h2>
              <div className="space-y-4">
                {categoryBreakdown.map(category => (
                  <div key={category.category}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">{category.category}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-foreground/60">
                          Budget: ₹{(category.budget / 10000000).toFixed(0)} Cr
                        </span>
                        <span className="text-sm text-foreground/60">
                          Actual: ₹{(category.actual / 10000000).toFixed(0)} Cr
                        </span>
                        <span
                          className={`text-sm font-medium ${
                            category.variance >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {category.variance >= 0 ? '+' : ''}₹
                          {(Math.abs(category.variance) / 10000000).toFixed(1)} Cr
                        </span>
                      </div>
                    </div>
                    <div className="relative h-8 rounded-lg bg-background/10 overflow-hidden">
                      <div
                        className="absolute h-full bg-gradient-to-r from-yellow-500/30 to-amber-600/30"
                        style={{ width: '100%' }}
                      />
                      <div
                        className="absolute h-full bg-gradient-to-r from-yellow-500 to-amber-600"
                        style={{ width: `${(category.actual / category.budget) * 100}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-foreground">
                          {((category.actual / category.budget) * 100).toFixed(0)}% utilized
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Variances */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-foreground mb-6">Top Savings</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div>
                      <p className="font-medium text-foreground">Network Operations</p>
                      <p className="text-xs text-foreground/60">CC-001</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-emerald-400">+₹0.8 Cr</p>
                      <p className="text-xs text-foreground/60">5.3% saved</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div>
                      <p className="font-medium text-foreground">Customer Service</p>
                      <p className="text-xs text-foreground/60">CC-002</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-emerald-400">+₹0.2 Cr</p>
                      <p className="text-xs text-foreground/60">2.5% saved</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-foreground mb-6">Budget Overruns</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div>
                      <p className="font-medium text-foreground">Field Operations</p>
                      <p className="text-xs text-foreground/60">CC-003</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-400">-₹0.5 Cr</p>
                      <p className="text-xs text-foreground/60">5.0% over</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
