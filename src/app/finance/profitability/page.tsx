'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  PieChart as PieChartIcon,
  Search,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  BarChart3,
  Target,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Eye,
  Calendar,
  Users,
  Package,
  MapPin,
  Zap,
  ChevronRight,
  Info
} from 'lucide-react'
import { 
  ResponsiveContainer,
  Treemap,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Sector
} from 'recharts'

// Kerala Vision Organization ID
const KERALA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001'

interface ProfitabilityData {
  name: string
  value: number
  margin: number
  growth: number
  color: string
}

interface ProductProfitability {
  product: string
  revenue: number
  cost: number
  profit: number
  margin: number
  units: number
  trend: 'up' | 'down' | 'stable'
}

interface CustomerSegment {
  segment: string
  revenue: number
  profit: number
  margin: number
  customers: number
  avgRevenue: number
}

export default function ProfitabilityPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'customers' | 'trends'>('overview')
  const [selectedPeriod, setSelectedPeriod] = useState('ytd')
  const [selectedMetric, setSelectedMetric] = useState('profit')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  // Profitability Overview
  const [overviewMetrics] = useState({
    grossProfit: 163200000,
    grossMargin: 30.2,
    operatingProfit: 122600000,
    operatingMargin: 22.7,
    netProfit: 98080000,
    netMargin: 18.2,
    ebitda: 143600000,
    ebitdaMargin: 26.6
  })

  // Business Unit Profitability
  const [businessUnits] = useState<ProfitabilityData[]>([
    { name: 'Broadband Services', value: 97200000, margin: 30, growth: 18.5, color: '#00DDFF' },
    { name: 'Cable TV', value: 25920000, margin: 20, growth: 12.3, color: '#10b981' },
    { name: 'Enterprise Solutions', value: 21600000, margin: 40, growth: 25.7, color: '#f59e0b' },
    { name: 'Advertisement', value: 9720000, margin: 30, growth: 15.2, color: '#8b5cf6' },
    { name: 'Other Services', value: 8760000, margin: 25, growth: 8.5, color: '#ef4444' }
  ])

  // Product Profitability
  const [productProfitability] = useState<ProductProfitability[]>([
    {
      product: 'High-Speed Internet 100Mbps',
      revenue: 162000000,
      cost: 113400000,
      profit: 48600000,
      margin: 30,
      units: 4500,
      trend: 'up'
    },
    {
      product: 'Premium Cable Package',
      revenue: 64800000,
      cost: 51840000,
      profit: 12960000,
      margin: 20,
      units: 2400,
      trend: 'stable'
    },
    {
      product: 'Enterprise Fiber',
      revenue: 54000000,
      cost: 32400000,
      profit: 21600000,
      margin: 40,
      units: 120,
      trend: 'up'
    },
    {
      product: 'Digital Advertising',
      revenue: 32400000,
      cost: 22680000,
      profit: 9720000,
      margin: 30,
      units: 850,
      trend: 'up'
    }
  ])

  // Customer Segment Analysis
  const [customerSegments] = useState<CustomerSegment[]>([
    {
      segment: 'Enterprise',
      revenue: 216000000,
      profit: 86400000,
      margin: 40,
      customers: 245,
      avgRevenue: 881632
    },
    {
      segment: 'Corporate',
      revenue: 162000000,
      profit: 48600000,
      margin: 30,
      customers: 580,
      avgRevenue: 279310
    },
    {
      segment: 'Residential Premium',
      revenue: 108000000,
      profit: 21600000,
      margin: 20,
      customers: 3200,
      avgRevenue: 33750
    },
    {
      segment: 'Residential Basic',
      revenue: 54000000,
      profit: 6480000,
      margin: 12,
      customers: 8500,
      avgRevenue: 6353
    }
  ])

  // Profitability Trend
  const [profitabilityTrend] = useState([
    { month: 'Jan', grossMargin: 28.5, operatingMargin: 20.2, netMargin: 16.1 },
    { month: 'Feb', grossMargin: 29.2, operatingMargin: 21.5, netMargin: 17.2 },
    { month: 'Mar', grossMargin: 29.8, operatingMargin: 22.1, netMargin: 17.7 },
    { month: 'Apr', grossMargin: 30.1, operatingMargin: 22.5, netMargin: 18.0 },
    { month: 'May', grossMargin: 30.5, operatingMargin: 23.0, netMargin: 18.4 },
    { month: 'Jun', grossMargin: 30.2, operatingMargin: 22.7, netMargin: 18.2 }
  ])

  // Radar Chart Data
  const [performanceMetrics] = useState([
    { metric: 'Revenue Growth', A: 85, fullMark: 100 },
    { metric: 'Cost Control', A: 78, fullMark: 100 },
    { metric: 'Market Share', A: 72, fullMark: 100 },
    { metric: 'Customer Satisfaction', A: 88, fullMark: 100 },
    { metric: 'Operational Efficiency', A: 82, fullMark: 100 },
    { metric: 'Innovation', A: 75, fullMark: 100 }
  ])

  const supabase = createClientComponentClient()

  const refreshData = async () => {
    setIsRefreshing(true)
    // Fetch profitability data from Supabase
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-lg font-bold">
          {payload.name}
        </text>
        <text x={cx} y={cy} dy={30} textAnchor="middle" fill="#fff" className="text-sm">
          {`₹${(value/10000000).toFixed(1)} Cr`}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
      </g>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Profitability Analysis
          </h1>
          <p className="text-white/60 mt-1">Deep dive into profit margins and business performance</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#fff685] transition-colors"
          >
            <option value="mtd">Month to Date</option>
            <option value="qtd">Quarter to Date</option>
            <option value="ytd">Year to Date</option>
          </select>
          <button 
            onClick={refreshData}
            className={`flex items-center space-x-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white hover:bg-white/10 transition-all duration-300 ${isRefreshing ? 'animate-pulse' : ''}`}
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#fff685] to-amber-500 rounded-lg text-slate-900 font-medium hover:shadow-lg hover:shadow-[#fff685]/30 transition-all duration-300">
            <Download className="h-5 w-5" />
            <span>Export Analysis</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white/5 backdrop-blur-xl p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-md font-medium transition-all duration-300 ${
            activeTab === 'overview'
              ? 'bg-gradient-to-r from-[#fff685] to-amber-500 text-slate-900'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-md font-medium transition-all duration-300 ${
            activeTab === 'products'
              ? 'bg-gradient-to-r from-[#fff685] to-amber-500 text-slate-900'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Product Analysis
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`px-4 py-2 rounded-md font-medium transition-all duration-300 ${
            activeTab === 'customers'
              ? 'bg-gradient-to-r from-[#fff685] to-amber-500 text-slate-900'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Customer Segments
        </button>
        <button
          onClick={() => setActiveTab('trends')}
          className={`px-4 py-2 rounded-md font-medium transition-all duration-300 ${
            activeTab === 'trends'
              ? 'bg-gradient-to-r from-[#fff685] to-amber-500 text-slate-900'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Trends & Insights
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Profitability Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
                <h3 className="text-white/60 text-sm font-medium mb-1">Gross Profit</h3>
                <p className="text-2xl font-bold text-white">₹{(overviewMetrics.grossProfit / 10000000).toFixed(1)} Cr</p>
                <p className="text-xs text-white/40 mt-1">{overviewMetrics.grossMargin}% margin</p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-[#00DDFF] to-[#0049B7]">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-[#00DDFF]" />
                </div>
                <h3 className="text-white/60 text-sm font-medium mb-1">Operating Profit</h3>
                <p className="text-2xl font-bold text-white">₹{(overviewMetrics.operatingProfit / 10000000).toFixed(1)} Cr</p>
                <p className="text-xs text-white/40 mt-1">{overviewMetrics.operatingMargin}% margin</p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fff685] to-amber-500 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-[#fff685] to-amber-500">
                    <Target className="h-6 w-6 text-slate-900" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-[#fff685]" />
                </div>
                <h3 className="text-white/60 text-sm font-medium mb-1">Net Profit</h3>
                <p className="text-2xl font-bold text-white">₹{(overviewMetrics.netProfit / 10000000).toFixed(1)} Cr</p>
                <p className="text-xs text-white/40 mt-1">{overviewMetrics.netMargin}% margin</p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-purple-400" />
                </div>
                <h3 className="text-white/60 text-sm font-medium mb-1">EBITDA</h3>
                <p className="text-2xl font-bold text-white">₹{(overviewMetrics.ebitda / 10000000).toFixed(1)} Cr</p>
                <p className="text-xs text-white/40 mt-1">{overviewMetrics.ebitdaMargin}% margin</p>
              </div>
            </div>
          </div>

          {/* Business Unit Profitability */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fff685] to-amber-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Business Unit Profitability</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      activeIndex={activeIndex}
                      activeShape={renderActiveShape}
                      data={businessUnits}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                      onMouseEnter={(_, index) => setActiveIndex(index)}
                    >
                      {businessUnits.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {businessUnits.map((unit) => (
                    <div key={unit.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: unit.color }} />
                        <span className="text-sm text-white/80">{unit.name}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-white/60">{unit.margin}% margin</span>
                        <span className="text-sm font-medium text-white">
                          ₹{(unit.value/10000000).toFixed(1)} Cr
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Performance Scorecard</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={performanceMetrics}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="metric" stroke="rgba(255,255,255,0.5)" />
                    <PolarRadiusAxis stroke="rgba(255,255,255,0.5)" />
                    <Radar
                      name="Score"
                      dataKey="A"
                      stroke="#00DDFF"
                      fill="#00DDFF"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px'
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'products' && (
        <>
          {/* Product Profitability Table */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fff685] to-amber-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white">Product Profitability Analysis</h2>
              </div>
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="text-left py-4 pl-6 text-sm font-medium text-white/60">Product</th>
                    <th className="text-right py-4 text-sm font-medium text-white/60">Revenue</th>
                    <th className="text-right py-4 text-sm font-medium text-white/60">Cost</th>
                    <th className="text-right py-4 text-sm font-medium text-white/60">Profit</th>
                    <th className="text-center py-4 text-sm font-medium text-white/60">Margin</th>
                    <th className="text-right py-4 text-sm font-medium text-white/60">Units</th>
                    <th className="text-center py-4 pr-6 text-sm font-medium text-white/60">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {productProfitability.map((product) => (
                    <tr key={product.product} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 pl-6">
                        <div className="flex items-center space-x-3">
                          <Package className="h-5 w-5 text-white/40" />
                          <div>
                            <p className="font-medium text-white">{product.product}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-right text-white">
                        ₹{(product.revenue / 10000000).toFixed(1)} Cr
                      </td>
                      <td className="py-4 text-right text-white/60">
                        ₹{(product.cost / 10000000).toFixed(1)} Cr
                      </td>
                      <td className="py-4 text-right">
                        <span className="font-medium text-emerald-400">
                          ₹{(product.profit / 10000000).toFixed(1)} Cr
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          product.margin >= 35 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : product.margin >= 25
                            ? 'bg-[#00DDFF]/20 text-[#00DDFF]'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {product.margin}%
                        </span>
                      </td>
                      <td className="py-4 text-right text-white">
                        {product.units.toLocaleString()}
                      </td>
                      <td className="py-4 pr-6 text-center">
                        {product.trend === 'up' && <TrendingUp className="h-5 w-5 text-emerald-400 mx-auto" />}
                        {product.trend === 'down' && <TrendingDown className="h-5 w-5 text-red-400 mx-auto" />}
                        {product.trend === 'stable' && <Activity className="h-5 w-5 text-yellow-400 mx-auto" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Product Margin Comparison */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Product Margin Comparison</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productProfitability}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="product" stroke="rgba(255,255,255,0.5)" angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px'
                    }}
                    formatter={(value: any, name: string) => {
                      if (name === 'margin') return `${value}%`
                      return `₹${(value/10000000).toFixed(1)} Cr`
                    }}
                  />
                  <Bar dataKey="revenue" fill="#00DDFF" opacity={0.8} />
                  <Bar dataKey="profit" fill="#10b981" opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {activeTab === 'customers' && (
        <>
          {/* Customer Segment Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {customerSegments.map((segment) => (
              <div key={segment.segment} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fff685] to-amber-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-[#fff685]" />
                      <h3 className="text-lg font-semibold text-white">{segment.segment}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      segment.margin >= 35 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : segment.margin >= 20
                        ? 'bg-[#00DDFF]/20 text-[#00DDFF]'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {segment.margin}% margin
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-white/60 mb-1">Revenue</p>
                      <p className="text-lg font-semibold text-white">
                        ₹{(segment.revenue / 10000000).toFixed(0)} Cr
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60 mb-1">Profit</p>
                      <p className="text-lg font-semibold text-emerald-400">
                        ₹{(segment.profit / 10000000).toFixed(1)} Cr
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Customers</span>
                      <span className="text-white font-medium">{segment.customers.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Avg Revenue/Customer</span>
                      <span className="text-white font-medium">₹{(segment.avgRevenue).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-white/60 mb-1">
                      <span>Revenue Contribution</span>
                      <span>{((segment.revenue / 540000000) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-[#fff685] to-amber-500"
                        style={{ width: `${(segment.revenue / 540000000) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Customer Profitability Matrix */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Customer Segment Revenue vs Margin</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={customerSegments}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="segment" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px'
                    }}
                    formatter={(value: any, name: string) => {
                      if (name === 'margin') return `${value}%`
                      return `₹${(value/10000000).toFixed(1)} Cr`
                    }}
                  />
                  <Bar dataKey="revenue" fill="#00DDFF" opacity={0.8} />
                  <Bar dataKey="profit" fill="#10b981" opacity={0.8} />
                  <Bar dataKey="margin" fill="#f59e0b" opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {activeTab === 'trends' && (
        <>
          {/* Margin Trend Analysis */}
          <div className="relative group mb-6">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fff685] to-amber-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Profitability Margin Trends</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={profitabilityTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" tickFormatter={(value) => `${value}%`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px'
                    }}
                    formatter={(value: any) => `${value}%`}
                  />
                  <Area
                    type="monotone"
                    dataKey="grossMargin"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="operatingMargin"
                    stackId="2"
                    stroke="#00DDFF"
                    fill="#00DDFF"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="netMargin"
                    stackId="3"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Key Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Positive Trends</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <TrendingUp className="h-4 w-4 text-emerald-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-white">Gross margin improving</p>
                      <p className="text-xs text-white/60">+1.7pp over 6 months</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <TrendingUp className="h-4 w-4 text-emerald-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-white">Enterprise segment growth</p>
                      <p className="text-xs text-white/60">40% margin maintained</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <TrendingUp className="h-4 w-4 text-emerald-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-white">Cost efficiency gains</p>
                      <p className="text-xs text-white/60">Operating leverage improving</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-600">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Areas of Focus</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Info className="h-4 w-4 text-yellow-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-white">Residential Basic margin</p>
                      <p className="text-xs text-white/60">12% - below target of 15%</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Info className="h-4 w-4 text-yellow-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-white">Cable TV profitability</p>
                      <p className="text-xs text-white/60">20% margin declining</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Info className="h-4 w-4 text-yellow-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-white">Customer acquisition cost</p>
                      <p className="text-xs text-white/60">Rising in competitive segments</p>
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