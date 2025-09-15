'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Target,
  Zap,
  Globe,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  UserCheck,
  Wifi,
  Clock,
  ChevronRight,
  Download,
  RefreshCw
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Scatter
} from 'recharts'

// India Vision Organization ID
const INDIA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001'

interface MetricCardProps {
  title: string
  value: string
  change: number
  changeLabel: string
  icon: React.ElementType
  gradient: string
  forecast?: string
}

function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  gradient,
  forecast
}: MetricCardProps) {
  const isPositive = change >= 0

  return (
    <div className="relative group">
      <div
        className={`absolute -inset-0.5 bg-gradient-to-r ${gradient} rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300`}
      />
      <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/20 transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div
            className={`flex items-center space-x-1 text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}
          >
            {isPositive ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )}
            <span>{Math.abs(change)}%</span>
          </div>
        </div>
        <h3 className="text-white/60 text-sm font-medium mb-1">{title}</h3>
        <p className="text-2xl font-bold text-white mb-1">{value}</p>
        <p className="text-xs text-white/40">{changeLabel}</p>
        {forecast && <p className="text-xs text-[#FFD700] mt-2">Forecast: {forecast}</p>}
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  // State for dynamic data from Supabase
  const [revenueData, setRevenueData] = useState([
    { month: 'Jan', actual: 38000000, target: 37000000, lastYear: 32000000 },
    { month: 'Feb', actual: 39500000, target: 38500000, lastYear: 33500000 },
    { month: 'Mar', actual: 41000000, target: 40000000, lastYear: 35000000 },
    { month: 'Apr', actual: 42500000, target: 41500000, lastYear: 36500000 },
    { month: 'May', actual: 44000000, target: 43000000, lastYear: 38000000 },
    { month: 'Jun', actual: 45500000, target: 44500000, lastYear: 39500000 },
    { month: 'Jul', forecast: 47000000, target: 46000000, lastYear: 41000000 },
    { month: 'Aug', forecast: 48500000, target: 47500000, lastYear: 42500000 },
    { month: 'Sep', forecast: 50000000, target: 49000000, lastYear: 44000000 },
    { month: 'Oct', forecast: 51500000, target: 50500000, lastYear: 45500000 },
    { month: 'Nov', forecast: 53000000, target: 52000000, lastYear: 47000000 },
    { month: 'Dec', forecast: 54500000, target: 53500000, lastYear: 48500000 }
  ])

  const [customerSegments, setCustomerSegments] = useState([
    { name: 'Residential', value: 35000, growth: 15.2, color: '#0099CC' },
    { name: 'Business', value: 8500, growth: 22.5, color: '#FFD700' },
    { name: 'Enterprise', value: 2332, growth: 8.7, color: '#E91E63' }
  ])

  const [serviceMetrics, setServiceMetrics] = useState([
    { service: 'Broadband', customers: 38500, revenue: 32725000, satisfaction: 92 },
    { service: 'Cable TV', customers: 22000, revenue: 13200000, satisfaction: 88 },
    { service: 'Leased Lines', customers: 2500, revenue: 7500000, satisfaction: 95 },
    { service: 'Bundle Plans', customers: 15832, revenue: 12675600, satisfaction: 94 }
  ])

  const [kpiData, setKpiData] = useState([
    { metric: 'ARPU', value: 916, target: 900, unit: '₹' },
    { metric: 'Churn Rate', value: 2.3, target: 3.0, unit: '%' },
    { metric: 'NPS Score', value: 72, target: 70, unit: '' },
    { metric: 'Uptime', value: 99.8, target: 99.5, unit: '%' },
    { metric: 'Response Time', value: 4.2, target: 6.0, unit: 'hrs' },
    { metric: 'First Call Resolution', value: 87, target: 85, unit: '%' }
  ])

  const [regionPerformance, setRegionPerformance] = useState([
    { region: 'TVM', revenue: 16200000, customers: 18000, growth: 12.5, satisfaction: 91 },
    { region: 'Kochi', revenue: 13500000, customers: 15000, growth: 15.8, satisfaction: 89 },
    { region: 'Kozhikode', revenue: 11544800, customers: 12832, growth: 18.2, satisfaction: 93 }
  ])

  const [churnAnalysis, setChurnAnalysis] = useState([
    { reason: 'Price', percentage: 35, count: 287 },
    { reason: 'Service Quality', percentage: 25, count: 205 },
    { reason: 'Competition', percentage: 20, count: 164 },
    { reason: 'Relocation', percentage: 15, count: 123 },
    { reason: 'Other', percentage: 5, count: 41 }
  ])

  const [predictiveInsights, setPredictiveInsights] = useState([
    {
      title: 'Revenue Growth Opportunity',
      description:
        'Based on current trends, targeting SMB segment could increase revenue by ₹2.5 Cr in Q3',
      impact: 'high',
      confidence: 85
    },
    {
      title: 'Churn Risk Alert',
      description: '342 customers showing high churn indicators in Kochi region',
      impact: 'medium',
      confidence: 78
    },
    {
      title: 'Network Capacity',
      description:
        'TVM region will need 20% capacity upgrade by October based on growth projections',
      impact: 'high',
      confidence: 92
    },
    {
      title: 'Seasonal Opportunity',
      description: 'Holiday season bundle offers could attract 2,000+ new subscribers',
      impact: 'medium',
      confidence: 81
    }
  ])

  const supabase = createClientComponentClient()
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  async function fetchAnalyticsData() {
    try {
      // Fetch real data from Supabase - run queries in parallel for performance
      const [metricsResult, transactionsResult, customersResult, networkResult] = await Promise.all(
        [
          supabase
            .from('core_entities')
            .select('metadata')
            .eq('organization_id', INDIA_VISION_ORG_ID)
            .eq('entity_type', 'analytics_metrics')
            .single(),

          supabase
            .from('universal_transactions')
            .select('*')
            .eq('organization_id', INDIA_VISION_ORG_ID)
            .eq('transaction_type', 'revenue')
            .order('transaction_date', { ascending: true })
            .limit(50),

          supabase
            .from('core_entities')
            .select('metadata, entity_type')
            .eq('organization_id', INDIA_VISION_ORG_ID)
            .eq('entity_type', 'isp_subscriber'),

          supabase
            .from('core_entities')
            .select('metadata')
            .eq('organization_id', INDIA_VISION_ORG_ID)
            .eq('entity_type', 'network_region')
        ]
      )

      // Process metrics data
      if (metricsResult.data?.metadata) {
        const metrics = metricsResult.data.metadata

        if (metrics.revenue_trend) {
          setRevenueData(metrics.revenue_trend)
        }

        if (metrics.customer_segments) {
          setCustomerSegments(metrics.customer_segments)
        }

        if (metrics.service_metrics) {
          setServiceMetrics(metrics.service_metrics)
        }

        if (metrics.kpi_data) {
          setKpiData(metrics.kpi_data)
        }

        if (metrics.churn_analysis) {
          setChurnAnalysis(metrics.churn_analysis)
        }

        if (metrics.predictive_insights) {
          setPredictiveInsights(metrics.predictive_insights)
        }
      }

      // Process transaction data for revenue charts
      if (transactionsResult.data && transactionsResult.data.length > 0) {
        const monthlyData = transactionsResult.data.reduce((acc: any, txn: any) => {
          const month = new Date(txn.transaction_date).toLocaleDateString('en-US', {
            month: 'short'
          })
          if (!acc[month]) {
            acc[month] = { month, actual: 0, target: 0, lastYear: 0 }
          }
          acc[month].actual += txn.total_amount || 0
          return acc
        }, {})

        if (Object.keys(monthlyData).length > 0) {
          setRevenueData(Object.values(monthlyData))
        }
      }

      // Process customer data for segments
      if (customersResult.data && customersResult.data.length > 0) {
        const segments = customersResult.data.reduce((acc: any, customer: any) => {
          const type = customer.metadata?.customer_type || 'Residential'
          if (!acc[type]) {
            acc[type] = { name: type, value: 0, growth: 0, color: '#0099CC' }
          }
          acc[type].value += 1
          return acc
        }, {})

        const segmentArray = Object.values(segments).map((seg: any, index) => ({
          ...seg,
          color: ['#0099CC', '#FFD700', '#E91E63'][index] || '#0099CC',
          growth: Math.random() * 20 + 5 // Mock growth data
        }))

        if (segmentArray.length > 0) {
          setCustomerSegments(segmentArray)
        }
      }

      // Process network data for regional performance
      if (networkResult.data && networkResult.data.length > 0) {
        const regions = networkResult.data.map((region: any) => ({
          region: region.metadata?.region_name || 'Region',
          revenue: region.metadata?.monthly_revenue || 0,
          customers: region.metadata?.subscriber_count || 0,
          growth: region.metadata?.growth_rate || 0,
          satisfaction: region.metadata?.satisfaction_score || 90
        }))

        setRegionPerformance(regions)
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error)
      // Keep fallback data on error
    }
  }

  // Defensive normalization for chart inputs (guards against unexpected object payloads)
  const toArray = (v: any): any[] =>
    Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v) : []
  const safeRevenueData = toArray(revenueData)
  const safeCustomerSegments = toArray(customerSegments)
  const safeKpiData = toArray(kpiData)
  const safeRegionPerformance = toArray(regionPerformance)

  const refreshData = async () => {
    setIsRefreshing(true)
    await fetchAnalyticsData()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  // Calculate totals
  const totalRevenue = revenueData.slice(0, 6).reduce((sum, d) => sum + (d.actual || 0), 0)
  const avgMonthlyRevenue = totalRevenue / 6
  const projectedAnnualRevenue = revenueData.reduce(
    (sum, d) => sum + (d.actual || d.forecast || 0),
    0
  )
  const totalCustomers = customerSegments.reduce((sum, s) => sum + s.value, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Business Analytics & Insights
          </h1>
          <p className="text-white/60 mt-1">
            AI-powered analytics and predictive insights for Kerala Vision
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={refreshData}
            className={`flex items-center space-x-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white hover:bg-white/10 transition-all duration-300 ${isRefreshing ? 'animate-pulse' : ''}`}
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-lg text-white font-medium hover:shadow-lg hover:shadow-[#00DDFF]/30 transition-all duration-300">
            <Download className="h-5 w-5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue (YTD)"
          value={`₹${(totalRevenue / 10000000).toFixed(1)} Cr`}
          change={15.8}
          changeLabel="vs last year"
          icon={DollarSign}
          gradient="from-[#E91E63] to-[#C2185B]"
          forecast={`₹${(projectedAnnualRevenue / 10000000).toFixed(1)} Cr by year end`}
        />
        <MetricCard
          title="Active Subscribers"
          value={totalCustomers.toLocaleString()}
          change={12.3}
          changeLabel="vs last quarter"
          icon={Users}
          gradient="from-[#0099CC] to-[#0049B7]"
          forecast="50K by Q4"
        />
        <MetricCard
          title="Average ARPU"
          value="₹916"
          change={5.7}
          changeLabel="vs last month"
          icon={Target}
          gradient="from-[#FFD700] to-[#0099CC]"
          forecast="₹950 target"
        />
        <MetricCard
          title="Churn Rate"
          value="2.3%"
          change={-0.8}
          changeLabel="improvement"
          icon={Activity}
          gradient="from-emerald-500 to-green-500"
          forecast="2.0% target"
        />
      </div>

      {/* Revenue Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative group min-w-0">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0099CC] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
          <div className="relative bg-slate-900/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Revenue Trend & Forecast</h2>
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-[#0099CC]" />
                  <span className="text-white/60">Actual</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-[#FFD700]" />
                  <span className="text-white/60">Target</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-[#E91E63]" />
                  <span className="text-white/60">Forecast</span>
                </div>
              </div>
            </div>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={safeRevenueData}>
                  <defs>
                    <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0099CC" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0099CC" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                  <YAxis
                    stroke="rgba(255,255,255,0.5)"
                    tickFormatter={value => `₹${(value / 1000000).toFixed(0)}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px'
                    }}
                    formatter={(value: any) => `₹${(value / 1000000).toFixed(1)}M`}
                  />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    stroke="#0099CC"
                    fillOpacity={1}
                    fill="url(#actualGradient)"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="#FFD700"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#E91E63"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FFD700] to-[#0099CC] rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
          <div className="relative bg-slate-900/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Customer Segments</h2>
            <div className="w-full h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={safeCustomerSegments}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {safeCustomerSegments.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-3">
              {safeCustomerSegments.map((segment: any) => (
                <div key={segment.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="text-sm text-white/80">{segment.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">
                      {segment.value.toLocaleString()}
                    </p>
                    <p className="text-xs text-emerald-400">+{segment.growth}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Service Performance */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
        <div className="relative bg-slate-900/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Service Performance Analysis</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-border/50">
                  <th className="pb-3 text-sm font-medium text-white/60">Service</th>
                  <th className="pb-3 text-sm font-medium text-white/60 text-right">Customers</th>
                  <th className="pb-3 text-sm font-medium text-white/60 text-right">Revenue</th>
                  <th className="pb-3 text-sm font-medium text-white/60 text-right">
                    Satisfaction
                  </th>
                  <th className="pb-3 text-sm font-medium text-white/60 text-right">
                    Revenue/Customer
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {serviceMetrics.map(service => (
                  <tr key={service.service} className="hover:bg-accent/20 transition-colors">
                    <td className="py-4 text-white font-medium">{service.service}</td>
                    <td className="py-4 text-white text-right">
                      {service.customers.toLocaleString()}
                    </td>
                    <td className="py-4 text-white text-right">
                      ₹{(service.revenue / 100000).toFixed(1)}L
                    </td>
                    <td className="py-4 text-right">
                      <span
                        className={`font-medium ${
                          service.satisfaction >= 90
                            ? 'text-emerald-400'
                            : service.satisfaction >= 85
                              ? 'text-yellow-400'
                              : 'text-red-400'
                        }`}
                      >
                        {service.satisfaction}%
                      </span>
                    </td>
                    <td className="py-4 text-[#0099CC] font-medium text-right">
                      ₹{Math.round(service.revenue / service.customers)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* KPI Dashboard & Predictive Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KPI Radar Chart */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FFD700] to-[#0099CC] rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
          <div className="relative bg-slate-900/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">KPI Performance</h2>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={safeKpiData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="metric" stroke="rgba(255,255,255,0.5)" />
                  <PolarRadiusAxis stroke="rgba(255,255,255,0.3)" />
                  <Radar
                    name="Actual"
                    dataKey="value"
                    stroke="#0099CC"
                    fill="#0099CC"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Radar
                    name="Target"
                    dataKey="target"
                    stroke="#FFD700"
                    fill="#FFD700"
                    fillOpacity={0.1}
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

        {/* Predictive Insights */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#E91E63] to-[#C2185B] rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
          <div className="relative bg-slate-900/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">AI-Powered Insights</h2>
            <div className="space-y-4">
              {predictiveInsights.map((insight, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-slate-900/50 border border-border/50 hover:bg-accent/20 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-white">{insight.title}</h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        insight.impact === 'high'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {insight.impact} impact
                    </span>
                  </div>
                  <p className="text-sm text-white/60 mb-2">{insight.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#0099CC] to-[#FFD700] rounded-full"
                          style={{ width: `${insight.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/40">
                        {insight.confidence}% confidence
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/40" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Regional Performance & Churn Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Performance */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0099CC] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
          <div className="relative bg-slate-900/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Regional Performance</h2>
            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={safeRegionPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="region" stroke="rgba(255,255,255,0.5)" />
                  <YAxis
                    yAxisId="left"
                    stroke="rgba(255,255,255,0.5)"
                    tickFormatter={value => `₹${(value / 1000000).toFixed(0)}M`}
                  />
                  <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar yAxisId="left" dataKey="revenue" fill="#0099CC" radius={[8, 8, 0, 0]} />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="satisfaction"
                    stroke="#fff685"
                    strokeWidth={2}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Churn Analysis */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#E91E63] to-[#C2185B] rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
          <div className="relative bg-slate-900/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Churn Analysis</h2>
            <div className="space-y-4">
              {churnAnalysis.map(reason => (
                <div key={reason.reason}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/80">{reason.reason}</span>
                    <span className="text-sm font-medium text-white">
                      {reason.percentage}% ({reason.count})
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#E91E63] to-[#C2185B] rounded-full transition-all duration-500"
                      style={{ width: `${reason.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium text-yellow-400">Action Required</span>
              </div>
              <p className="text-xs text-white/60">
                Price sensitivity is the leading churn factor. Consider introducing retention offers
                for price-sensitive segments.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
