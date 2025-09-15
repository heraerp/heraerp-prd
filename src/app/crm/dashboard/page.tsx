'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Activity,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Award,
  ArrowRight,
  MoreVertical,
  Filter,
  RefreshCw
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend
} from 'recharts'

// India Vision Organization ID
const KERALA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001'

interface MetricCard {
  title: string
  value: string | number
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: React.ElementType
  color: string
}

interface Activity {
  id: string
  type: 'call' | 'email' | 'meeting' | 'task'
  title: string
  contact: string
  time: string
  status: 'completed' | 'pending' | 'overdue'
}

interface Opportunity {
  id: string
  name: string
  account: string
  value: number
  stage: string
  closeDate: string
  probability: number
}

export default function CRMDashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('month')

  // Key Metrics
  const metrics: MetricCard[] = [
    {
      title: 'Total Revenue',
      value: '₹8.4 Cr',
      change: '+12.5%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'from-[#FF5A09] to-[#ec7f37]'
    },
    {
      title: 'New Customers',
      value: '48',
      change: '+8.3%',
      changeType: 'positive',
      icon: Users,
      color: 'from-[#ec7f37] to-[#be4f0c]'
    },
    {
      title: 'Opportunities',
      value: '89',
      change: '+15.2%',
      changeType: 'positive',
      icon: Target,
      color: 'from-[#be4f0c] to-[#FF5A09]'
    },
    {
      title: 'Win Rate',
      value: '68%',
      change: '+5.2%',
      changeType: 'positive',
      icon: Award,
      color: 'from-[#FF5A09] to-[#be4f0c]'
    }
  ]

  // Pipeline Data
  const pipelineData = [
    { stage: 'Prospecting', value: 24, amount: 2400000 },
    { stage: 'Qualification', value: 18, amount: 3600000 },
    { stage: 'Proposal', value: 15, amount: 4500000 },
    { stage: 'Negotiation', value: 12, amount: 3600000 },
    { stage: 'Closed Won', value: 8, amount: 2400000 },
    { stage: 'Closed Lost', value: 12, amount: 2000000 }
  ]

  // Revenue Trend
  const revenueTrend = [
    { month: 'Jan', revenue: 120, target: 100 },
    { month: 'Feb', revenue: 132, target: 110 },
    { month: 'Mar', revenue: 145, target: 120 },
    { month: 'Apr', revenue: 138, target: 130 },
    { month: 'May', revenue: 162, target: 140 },
    { month: 'Jun', revenue: 175, target: 150 }
  ]

  // Sales by Category
  const salesByCategory = [
    { name: 'Enterprise', value: 45, color: '#FF5A09' },
    { name: 'SMB', value: 30, color: '#ec7f37' },
    { name: 'Startup', value: 25, color: '#be4f0c' }
  ]

  // Recent Activities
  const [activities] = useState<Activity[]>([
    {
      id: '1',
      type: 'call',
      title: 'Follow-up call with Infosys',
      contact: 'Rajesh Kumar',
      time: '10:30 AM',
      status: 'completed'
    },
    {
      id: '2',
      type: 'email',
      title: 'Proposal sent to TCS',
      contact: 'Priya Sharma',
      time: '11:45 AM',
      status: 'completed'
    },
    {
      id: '3',
      type: 'meeting',
      title: 'Demo meeting with Wipro',
      contact: 'Amit Patel',
      time: '2:00 PM',
      status: 'pending'
    },
    {
      id: '4',
      type: 'task',
      title: 'Prepare contract for HCL Tech',
      contact: 'Neha Singh',
      time: '3:30 PM',
      status: 'pending'
    },
    {
      id: '5',
      type: 'call',
      title: 'Check-in with Tech Mahindra',
      contact: 'Vikram Rao',
      time: 'Yesterday',
      status: 'overdue'
    }
  ])

  // Top Opportunities
  const [opportunities] = useState<Opportunity[]>([
    {
      id: '1',
      name: 'Enterprise Broadband - Infosys',
      account: 'Infosys Ltd',
      value: 8500000,
      stage: 'Negotiation',
      closeDate: '2024-06-30',
      probability: 80
    },
    {
      id: '2',
      name: 'Cloud Connect - TCS',
      account: 'Tata Consultancy Services',
      value: 6200000,
      stage: 'Proposal',
      closeDate: '2024-07-15',
      probability: 60
    },
    {
      id: '3',
      name: 'SD-WAN Solution - Wipro',
      account: 'Wipro Limited',
      value: 5400000,
      stage: 'Qualification',
      closeDate: '2024-07-31',
      probability: 40
    },
    {
      id: '4',
      name: 'Managed Services - HCL',
      account: 'HCL Technologies',
      value: 4800000,
      stage: 'Negotiation',
      closeDate: '2024-06-25',
      probability: 75
    },
    {
      id: '5',
      name: 'Data Center Connect - Tech Mahindra',
      account: 'Tech Mahindra',
      value: 3600000,
      stage: 'Proposal',
      closeDate: '2024-08-10',
      probability: 50
    }
  ])

  const supabase = createClientComponentClient()

  const refreshData = async () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call':
        return Phone
      case 'email':
        return Mail
      case 'meeting':
        return Calendar
      case 'task':
        return CheckCircle
      default:
        return Activity
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'call':
        return 'text-[#FF5A09]'
      case 'email':
        return 'text-[#ec7f37]'
      case 'meeting':
        return 'text-[#be4f0c]'
      case 'task':
        return 'text-emerald-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/20 text-emerald-400'
      case 'pending':
        return 'bg-[#FF5A09]/20 text-[#FF5A09]'
      case 'overdue':
        return 'bg-red-500/20 text-red-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Prospecting':
        return '#be4f0c'
      case 'Qualification':
        return '#ec7f37'
      case 'Proposal':
        return '#FF5A09'
      case 'Negotiation':
        return '#FF5A09'
      case 'Closed Won':
        return '#10b981'
      case 'Closed Lost':
        return '#ef4444'
      default:
        return '#6b7280'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">CRM Dashboard</h1>
          <p className="text-white/60 mt-1">
            Track your sales performance and customer relationships
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <select
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF5A09] transition-colors"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button
            onClick={refreshData}
            className={`p-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white hover:bg-white/10 transition-all duration-300 ${
              isRefreshing ? 'animate-spin' : ''
            }`}
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <div key={index} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF5A09]/50 to-[#ec7f37]/50 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${metric.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div
                    className={`flex items-center space-x-1 text-sm font-medium ${
                      metric.changeType === 'positive'
                        ? 'text-emerald-400'
                        : metric.changeType === 'negative'
                          ? 'text-red-400'
                          : 'text-white/60'
                    }`}
                  >
                    {metric.changeType === 'positive' ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : metric.changeType === 'negative' ? (
                      <TrendingDown className="h-4 w-4" />
                    ) : null}
                    <span>{metric.change}</span>
                  </div>
                </div>
                <h3 className="text-white/60 text-sm font-medium mb-1">{metric.title}</h3>
                <p className="text-2xl font-bold text-white">{metric.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF5A09]/50 to-[#ec7f37]/50 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Revenue Trend</h2>
              <button className="text-white/40 hover:text-white transition-colors">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart
                data={
                  Array.isArray(revenueTrend)
                    ? revenueTrend
                    : revenueTrend && typeof revenueTrend === 'object'
                      ? Object.values(revenueTrend as any)
                      : []
                }
              >
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF5A09" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#FF5A09" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec7f37" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ec7f37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" tickFormatter={value => `₹${value}L`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(57,57,57,0.9)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any) => `₹${value} Lakhs`}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#FF5A09"
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="target"
                  stroke="#ec7f37"
                  fillOpacity={1}
                  fill="url(#targetGradient)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Category */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#ec7f37]/50 to-[#be4f0c]/50 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Sales by Category</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={salesByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {salesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(57,57,57,0.9)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any) => `${value}%`}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {salesByCategory.map(item => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-white/80">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-white">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Overview */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF5A09]/50 to-[#be4f0c]/50 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
        <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Sales Pipeline</h2>
            <span className="text-sm text-white/60">Total: ₹1.85 Cr</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={
                Array.isArray(pipelineData)
                  ? pipelineData
                  : pipelineData && typeof pipelineData === 'object'
                    ? Object.values(pipelineData as any)
                    : []
              }
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="stage"
                stroke="rgba(255,255,255,0.5)"
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(57,57,57,0.9)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px'
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'value') return [`${value} deals`, 'Count']
                  return [`₹${(value / 100000).toFixed(1)}L`, 'Value']
                }}
              />
              <Bar dataKey="value" fill="#FF5A09" radius={[8, 8, 0, 0]}>
                {(Array.isArray(pipelineData)
                  ? pipelineData
                  : pipelineData && typeof pipelineData === 'object'
                    ? Object.values(pipelineData as any)
                    : []
                ).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={getStageColor(entry.stage)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF5A09]/50 to-[#ec7f37]/50 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Recent Activities</h2>
              <button className="text-sm text-[#FF5A09] hover:text-[#ec7f37] transition-colors flex items-center space-x-1">
                <span>View All</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              {activities.map(activity => {
                const Icon = getActivityIcon(activity.type)
                return (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg bg-white/5 ${getActivityColor(activity.type)}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{activity.title}</p>
                      <p className="text-xs text-white/60">
                        {activity.contact} • {activity.time}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}
                    >
                      {activity.status}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Top Opportunities */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#ec7f37]/50 to-[#be4f0c]/50 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Top Opportunities</h2>
              <button className="text-sm text-[#FF5A09] hover:text-[#ec7f37] transition-colors flex items-center space-x-1">
                <span>View All</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              {opportunities.map(opp => (
                <div key={opp.id} className="border-b border-white/10 pb-4 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-white">{opp.name}</p>
                      <p className="text-xs text-white/60">{opp.account}</p>
                    </div>
                    <p className="text-sm font-semibold text-[#FF5A09]">
                      ₹{(opp.value / 100000).toFixed(1)}L
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-white/60">
                      <span className="flex items-center space-x-1">
                        <Target className="h-3 w-3" />
                        <span>{opp.stage}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(opp.closeDate).toLocaleDateString()}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#FF5A09] to-[#ec7f37] rounded-full transition-all duration-500"
                          style={{ width: `${opp.probability}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/60">{opp.probability}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
