'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  TrendingUp, 
  Users, 
  Wifi, 
  CreditCard,
  Globe,
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Radio,
  Building2,
  UserCheck,
  DollarSign,
  Target,
  Award,
  AlertCircle
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

// India Vision Organization ID
const INDIA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001'

interface MetricCardProps {
  title: string
  value: string
  change: number
  icon: React.ElementType
  gradient: string
  subValue?: string
}

function MetricCard({ title, value, change, icon: Icon, gradient, subValue }: MetricCardProps) {
  const isPositive = change >= 0

  return (
    <div className="relative group">
      {/* Glow effect on hover */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${gradient} rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300`} />
      
      {/* Card content */}
      <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/20 transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className={`flex items-center space-x-1 text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            <span>{Math.abs(change)}%</span>
          </div>
        </div>
        
        <h3 className="text-white/60 text-sm font-medium mb-1">{title}</h3>
        <p className="text-2xl font-bold text-white mb-1">{value}</p>
        {subValue && <p className="text-xs text-white/40">{subValue}</p>}
      </div>
    </div>
  )
}

export default function ISPDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [isLoading, setIsLoading] = useState(false)
  const [dashboardData, setDashboardData] = useState<any>({
    total_subscribers: 45832,
    monthly_revenue: 42000000,
    arpu: 916,
    network_uptime: 99.8,
    new_this_month: 1245,
    churn_rate: 2.3
  })
  const [revenueData, setRevenueData] = useState<any[]>([
    { month: 'Jan', revenue: 38000000, subscribers: 42000 },
    { month: 'Feb', revenue: 39500000, subscribers: 42800 },
    { month: 'Mar', revenue: 41000000, subscribers: 43600 },
    { month: 'Apr', revenue: 42500000, subscribers: 44400 },
    { month: 'May', revenue: 44000000, subscribers: 45200 },
    { month: 'Jun', revenue: 45500000, subscribers: 46000 }
  ])
  const [networkMetrics, setNetworkMetrics] = useState<any[]>([
    { region: 'Thiruvananthapuram', uptime: 99.8, subscribers: 18000 },
    { region: 'Kochi', uptime: 99.7, subscribers: 15000 },
    { region: 'Kozhikode', uptime: 99.9, subscribers: 12832 }
  ])
  const [revenueStreams, setRevenueStreams] = useState<any[]>([
    { name: 'Broadband', value: 60, color: '#0099CC' },
    { name: 'Cable Tv', value: 24, color: '#FFD700' },
    { name: 'Advertisement', value: 10, color: '#E91E63' },
    { name: 'Leased Lines', value: 6, color: '#C2185B' }
  ])
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      // Run all queries in parallel for faster loading
      const [metricsResult, revenueResult, networkResult] = await Promise.all([
        // Fetch dashboard metrics
        supabase
          .from('core_entities')
          .select('metadata')
          .eq('organization_id', INDIA_VISION_ORG_ID)
          .eq('entity_type', 'metrics')
          .single(),
        
        // Fetch revenue transactions
        supabase
          .from('universal_transactions')
          .select('total_amount, metadata, transaction_date')
          .eq('organization_id', INDIA_VISION_ORG_ID)
          .eq('transaction_type', 'revenue')
          .order('transaction_date', { ascending: true })
          .limit(6),
        
        // Fetch network data
        supabase
          .from('core_entities')
          .select('metadata')
          .eq('organization_id', INDIA_VISION_ORG_ID)
          .eq('entity_type', 'network_metrics')
          .single()
      ])

      // Process metrics data
      if (metricsResult.data?.metadata) {
        setDashboardData(metricsResult.data.metadata)
        
        // Set revenue streams
        if (metricsResult.data.metadata.revenue_streams) {
          const streams = Object.entries(metricsResult.data.metadata.revenue_streams).map(([name, value]) => ({
            name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            value: value as number,
            color: name === 'broadband' ? '#0099CC' : 
                   name === 'cable_tv' ? '#FFD700' : 
                   name === 'advertisement' ? '#E91E63' : '#C2185B'
          }))
          setRevenueStreams(streams)
        }
      } else {
        // Fallback data if query fails
        setDashboardData({
          total_subscribers: 45832,
          monthly_revenue: 42000000,
          arpu: 916,
          network_uptime: 99.8,
          new_this_month: 1245
        })
      }

      // Process revenue data
      if (revenueResult.data && revenueResult.data.length > 0) {
        const chartData = revenueResult.data.map((txn: any) => ({
          month: txn.metadata?.month || '',
          revenue: txn.total_amount || 0,
          subscribers: txn.metadata?.subscriber_count || 0
        }))
        setRevenueData(chartData)
      }

      // Process network data
      if (networkResult.data?.metadata?.regions) {
        const metrics = networkResult.data.metadata.regions.map((region: any) => ({
          region: region.name,
          uptime: region.uptime,
          subscribers: region.subscribers
        }))
        setNetworkMetrics(metrics)
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Data will fall back to initial state values
    }
  }

  // Defensive normalization for chart inputs
  const toArray = (v: any): any[] => (Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v) : [])
  const safeRevenueData = toArray(revenueData)
  const safeRevenueStreams = toArray(revenueStreams)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            ISP Dashboard
          </h1>
          <p className="text-white/60 mt-1">Real-time performance metrics and analytics</p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => setSelectedPeriod('day')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              selectedPeriod === 'day'
                ? 'bg-gradient-to-r from-[#0099CC] to-[#0049B7] text-white shadow-lg shadow-[#0099CC]/40'
                : 'bg-slate-900/50 text-white/60 hover:bg-white/20 hover:text-white'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              selectedPeriod === 'month'
                ? 'bg-gradient-to-r from-[#0099CC] to-[#0049B7] text-white shadow-lg shadow-[#0099CC]/40'
                : 'bg-slate-900/50 text-white/60 hover:bg-white/20 hover:text-white'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setSelectedPeriod('year')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              selectedPeriod === 'year'
                ? 'bg-gradient-to-r from-[#0099CC] to-[#0049B7] text-white shadow-lg shadow-[#0099CC]/40'
                : 'bg-slate-900/50 text-white/60 hover:bg-white/20 hover:text-white'
            }`}
          >
            Year
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value={`₹${((dashboardData?.monthly_revenue || 0) / 10000000).toFixed(1)} Cr`}
          change={12.5}
          icon={DollarSign}
          gradient="from-[#E91E63] to-[#C2185B]"
          subValue="Target: ₹5 Cr"
        />
        <MetricCard
          title="Active Subscribers"
          value={(dashboardData?.total_subscribers || 0).toLocaleString()}
          change={8.3}
          icon={Users}
          gradient="from-[#0099CC] to-[#0049B7]"
          subValue={`+${(dashboardData?.new_this_month || 0).toLocaleString()} this month`}
        />
        <MetricCard
          title="Network Uptime"
          value={`${dashboardData?.network_uptime || 0}%`}
          change={0.2}
          icon={Wifi}
          gradient="from-[#FFD700] to-[#0099CC]"
          subValue="SLA: 99.5%"
        />
        <MetricCard
          title="ARPU"
          value={`₹${dashboardData?.arpu || 0}`}
          change={5.7}
          icon={Target}
          gradient="from-emerald-500 to-green-500"
          subValue="Industry avg: ₹850"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <div className="lg:col-span-2">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0099CC] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none z-0" />
            <div className="relative z-10 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Revenue & Subscriber Growth</h2>
                <div className="flex items-center space-x-4 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-[#0099CC]" />
                    <span className="text-white/60">Revenue</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-[#FFD700]" />
                    <span className="text-white/60">Subscribers</span>
                  </div>
                </div>
              </div>
              
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={safeRevenueData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0099CC" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0099CC" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="subscriberGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFD700" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#FFD700" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" />
                  <YAxis yAxisId="left" stroke="rgba(255,255,255,0.4)" />
                  <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.4)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      backdropFilter: 'blur(10px)'
                    }} 
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0099CC"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#revenueGradient)"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="subscribers"
                    stroke="#FFD700"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#subscriberGradient)"
                  />
                </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Streams */}
        <div>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#E91E63] to-[#C2185B] rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
            <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Revenue Streams</h2>
              
              <div className="w-full h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                  <Pie
                    data={safeRevenueStreams}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {safeRevenueStreams.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      backdropFilter: 'blur(10px)'
                    }}
                  />
                </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-2 mt-4">
                {revenueStreams.map((stream, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: stream.color }}
                      />
                      <span className="text-sm text-white/60">{stream.name}</span>
                    </div>
                    <span className="text-sm font-medium text-white">{stream.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Network Performance */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FFD700] to-[#0099CC] rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
          <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Regional Network Performance</h2>
            
            <div className="space-y-4">
              {networkMetrics.map((region, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{region.region}</span>
                    <span className="text-sm text-white/60">{region.uptime}% uptime</span>
                  </div>
                  <div className="relative">
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#00DDFF] to-[#fff685] rounded-full transition-all duration-1000"
                        style={{ width: `${region.uptime}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40">{region.subscribers.toLocaleString()} subscribers</span>
                    <span className="text-emerald-400">Excellent</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Agent Performance */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0049B7] to-[#00DDFF] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Agent Network</h2>
              <span className="text-sm text-[#fff685] font-medium">3,000+ Agents</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/50 rounded-xl p-4 border border-white/10">
                <UserCheck className="h-8 w-8 text-[#00DDFF] mb-2" />
                <p className="text-2xl font-bold text-white">245</p>
                <p className="text-xs text-white/60">New activations today</p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4 border border-white/10">
                <Award className="h-8 w-8 text-[#fff685] mb-2" />
                <p className="text-2xl font-bold text-white">92%</p>
                <p className="text-xs text-white/60">Target achievement</p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4 border border-white/10">
                <Target className="h-8 w-8 text-[#ff1d58] mb-2" />
                <p className="text-2xl font-bold text-white">₹8.5L</p>
                <p className="text-xs text-white/60">Commission this month</p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4 border border-white/10">
                <TrendingUp className="h-8 w-8 text-emerald-400 mb-2" />
                <p className="text-2xl font-bold text-white">15%</p>
                <p className="text-xs text-white/60">Growth rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* IPO Readiness Alert */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#ff1d58]/10 via-[#f75990]/10 to-[#fff685]/10 animate-gradient-shift" />
        <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-start space-x-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#ff1d58] to-[#f75990]">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">IPO Readiness Update</h3>
              <p className="text-white/60 text-sm mb-3">
                Your SEBI compliance score has improved to 8.5/10. Complete the pending audit requirements to reach the target score of 9.0.
              </p>
              <div className="flex items-center space-x-4">
                <button className="px-4 py-2 bg-gradient-to-r from-[#ff1d58] to-[#f75990] text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-[#ff1d58]/30 transition-all duration-300">
                  View Compliance Report
                </button>
                <button className="px-4 py-2 bg-slate-900/50 text-white rounded-lg text-sm font-medium hover:bg-white/20 transition-all duration-300">
                  Schedule Audit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
