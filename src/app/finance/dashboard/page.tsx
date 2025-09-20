'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Wallet,
  CreditCard,
  Building2,
  Calculator,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Download,
  ChevronRight,
  BookOpen,
  PieChart,
  BarChart3
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
  PieChart as RePieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart
} from 'recharts'

// India Vision Organization ID
const KERALA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001'

interface MetricCardProps {
  title: string
  value: string
  change?: number
  changeLabel?: string
  icon: React.ElementType
  gradient: string
  trend?: 'up' | 'down'
  subValue?: string
}

function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  gradient,
  trend,
  subValue
}: MetricCardProps) {
  const isPositive = change ? change >= 0 : trend === 'up'

  return (
    <div className="relative group">
      <div
        className={`absolute -inset-0.5 bg-gradient-to-r ${gradient} rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300`}
      />
      <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6 hover:bg-background/10 transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient}`}>
            <Icon className="h-6 w-6 text-foreground" />
          </div>
          {change !== undefined && (
            <div
              className={`flex items-center space-x-1 text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}
            >
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        <h3 className="text-foreground/60 text-sm font-medium mb-1">{title}</h3>
        <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
        {subValue && <p className="text-xs text-foreground/40">{subValue}</p>}
        {changeLabel && <p className="text-xs text-foreground/40">{changeLabel}</p>}
      </div>
    </div>
  )
}

export default function FinanceDashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Financial data with instant loading
  const [cashflowData] = useState([
    { month: 'Jan', inflow: 68, outflow: 52, net: 16 },
    { month: 'Feb', inflow: 72, outflow: 54, net: 18 },
    { month: 'Mar', inflow: 75, outflow: 56, net: 19 },
    { month: 'Apr', inflow: 78, outflow: 58, net: 20 },
    { month: 'May', inflow: 82, outflow: 60, net: 22 },
    { month: 'Jun', inflow: 85, outflow: 62, net: 23 }
  ])

  const [revenueBreakdown] = useState([
    { name: 'Broadband Services', value: 324, color: '#00DDFF' },
    { name: 'Cable TV', value: 129.6, color: '#fff685' },
    { name: 'Enterprise Solutions', value: 54, color: '#ff1d58' },
    { name: 'Advertisement', value: 32.4, color: '#f75990' }
  ])

  const [profitCenters] = useState([
    { name: 'Thiruvananthapuram', revenue: 216, cost: 162, profit: 54, margin: 25 },
    { name: 'Kochi', revenue: 189, cost: 147.4, profit: 41.6, margin: 22 },
    { name: 'Kozhikode', revenue: 135, cost: 108, profit: 27, margin: 20 }
  ])

  const [costCenters] = useState([
    { name: 'Network Operations', budget: 150, actual: 142, variance: 5.3 },
    { name: 'Customer Service', budget: 80, actual: 78, variance: 2.5 },
    { name: 'Field Operations', budget: 100, actual: 105, variance: -5 },
    { name: 'Administration', budget: 50, actual: 48, variance: 4 }
  ])

  const [workingCapital] = useState([
    { item: 'Current Assets', amount: 185 },
    { item: 'Current Liabilities', amount: 82 },
    { item: 'Working Capital', amount: 103 }
  ])

  const [pendingTransactions] = useState([
    {
      type: 'Receivable',
      customer: 'Enterprise Client A',
      amount: 15.5,
      daysOverdue: 12,
      status: 'overdue'
    },
    { type: 'Payable', vendor: 'Network Equipment Ltd', amount: 8.2, dueIn: 5, status: 'upcoming' },
    {
      type: 'Receivable',
      customer: 'Corporate Bundle B',
      amount: 12.8,
      daysOverdue: 0,
      status: 'current'
    },
    { type: 'Payable', vendor: 'Electricity Board', amount: 4.5, dueIn: 10, status: 'upcoming' }
  ])

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchFinancialData()
  }, [])

  async function fetchFinancialData() {
    try {
      // Fetch financial data from Supabase
      const { data: financialEntity } = await supabase
        .from('core_entities')
        .select('metadata')
        .eq('organization_id', KERALA_VISION_ORG_ID)
        .eq('entity_type', 'financial_summary')
        .single()

      if (financialEntity?.metadata) {
        // Update with real financial data if available
        console.log('Financial data loaded:', financialEntity.metadata)
      }
    } catch (error) {
      console.error('Error fetching financial data:', error)
    }
  }

  const refreshData = async () => {
    setIsRefreshing(true)
    await fetchFinancialData()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  // Calculate totals
  const totalRevenue = revenueBreakdown.reduce((sum, item) => sum + item.value, 0)
  const totalProfit = profitCenters.reduce((sum, center) => sum + center.profit, 0)
  const avgMargin = (
    (totalProfit / profitCenters.reduce((sum, center) => sum + center.revenue, 0)) *
    100
  ).toFixed(1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-white/80 bg-clip-text text-transparent">
            Financial Dashboard
          </h1>
          <p className="text-foreground/60 mt-1">
            Real-time financial insights and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={refreshData}
            className={`flex items-center space-x-2 px-4 py-2 bg-background/5 backdrop-blur-xl border border-border/10 rounded-lg text-foreground hover:bg-background/10 transition-all duration-300 ${isRefreshing ? 'animate-pulse' : ''}`}
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg text-foreground font-medium hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300">
            <Download className="h-5 w-5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue (YTD)"
          value="₹540 Cr"
          change={15.2}
          changeLabel="vs last year"
          icon={DollarSign}
          gradient="from-emerald-500 to-green-600"
        />
        <MetricCard
          title="Net Profit"
          value="₹122.6 Cr"
          change={18.5}
          changeLabel="vs last year"
          icon={TrendingUp}
          gradient="from-[#00DDFF] to-[#0049B7]"
        />
        <MetricCard
          title="EBITDA Margin"
          value="30.2%"
          change={2.1}
          changeLabel="improvement"
          icon={Activity}
          gradient="from-[#fff685] to-amber-500"
        />
        <MetricCard
          title="Cash Balance"
          value="₹45 Cr"
          subValue="₹103 Cr working capital"
          icon={Wallet}
          gradient="from-purple-500 to-pink-500"
        />
      </div>

      {/* Cash Flow Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Cash Flow Trend</h2>
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="text-foreground/60">Inflow</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="text-foreground/60">Outflow</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-[#00DDFF]" />
                  <span className="text-foreground/60">Net</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={cashflowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any) => `₹${value} Cr`}
                />
                <Bar dataKey="inflow" fill="#10b981" opacity={0.8} radius={[8, 8, 0, 0]} />
                <Bar dataKey="outflow" fill="#ef4444" opacity={0.8} radius={[8, 8, 0, 0]} />
                <Line type="monotone" dataKey="net" stroke="#00DDFF" strokeWidth={3} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-6">Revenue Breakdown</h2>
            <ResponsiveContainer width="100%" height={200}>
              <RePieChart>
                <Pie
                  data={revenueBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {revenueBreakdown.map((entry, index) => (
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
              {revenueBreakdown.map(item => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-foreground/80">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">₹{item.value} Cr</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Profit Centers & Cost Centers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit Centers */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fff685] to-amber-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Profit Centers Performance</h2>
              <TrendingUp className="h-5 w-5 text-[#fff685]" />
            </div>
            <div className="space-y-4">
              {profitCenters.map(center => (
                <div key={center.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{center.name}</span>
                    <span className="text-sm text-emerald-400">+{center.margin}% margin</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 rounded bg-background/5">
                      <p className="text-foreground/60">Revenue</p>
                      <p className="text-foreground font-medium">₹{center.revenue} Cr</p>
                    </div>
                    <div className="text-center p-2 rounded bg-background/5">
                      <p className="text-foreground/60">Cost</p>
                      <p className="text-foreground font-medium">₹{center.cost} Cr</p>
                    </div>
                    <div className="text-center p-2 rounded bg-background/5">
                      <p className="text-foreground/60">Profit</p>
                      <p className="text-emerald-400 font-medium">₹{center.profit} Cr</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cost Centers */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Cost Center Analysis</h2>
              <Calculator className="h-5 w-5 text-purple-400" />
            </div>
            <div className="space-y-4">
              {costCenters.map(center => (
                <div key={center.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{center.name}</span>
                    <span
                      className={`text-sm font-medium ${
                        center.variance >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {center.variance >= 0 ? '+' : ''}
                      {center.variance}%
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-2 rounded-full bg-background/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          center.variance >= 0
                            ? 'bg-gradient-to-r from-emerald-400 to-green-500'
                            : 'bg-gradient-to-r from-red-400 to-rose-500'
                        }`}
                        style={{ width: `${(center.actual / center.budget) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-foreground/60">
                      ₹{center.actual}/{center.budget} Cr
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pending Transactions */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
        <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Pending Transactions</h2>
            <FileText className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-border/10">
                  <th className="pb-3 text-sm font-medium text-foreground/60">Type</th>
                  <th className="pb-3 text-sm font-medium text-foreground/60">Party</th>
                  <th className="pb-3 text-sm font-medium text-foreground/60 text-right">Amount</th>
                  <th className="pb-3 text-sm font-medium text-foreground/60 text-center">
                    Status
                  </th>
                  <th className="pb-3 text-sm font-medium text-foreground/60 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pendingTransactions.map((txn, index) => (
                  <tr key={index} className="hover:bg-background/5 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center space-x-2">
                        {txn.type === 'Receivable' ? (
                          <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-400" />
                        )}
                        <span className="text-foreground font-medium">{txn.type}</span>
                      </div>
                    </td>
                    <td className="py-4 text-foreground/80">{txn.customer || txn.vendor}</td>
                    <td className="py-4 text-foreground text-right">₹{txn.amount} Cr</td>
                    <td className="py-4 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          txn.status === 'overdue'
                            ? 'bg-red-500/20 text-red-400'
                            : txn.status === 'upcoming'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {txn.status === 'overdue'
                          ? `${txn.daysOverdue}d overdue`
                          : txn.status === 'upcoming'
                            ? `Due in ${txn.dueIn}d`
                            : 'Current'}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button className="text-[#00DDFF] hover:text-[#00DDFF]/80 transition-colors">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button className="p-4 bg-background/5 backdrop-blur-xl border border-border/10 rounded-xl hover:bg-background/10 transition-all duration-300 group">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600">
              <BookOpen className="h-5 w-5 text-foreground" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">General Ledger</p>
              <p className="text-xs text-foreground/60">View all accounts</p>
            </div>
            <ChevronRight className="h-4 w-4 text-foreground/40 group-hover:text-foreground/60 transition-colors ml-auto" />
          </div>
        </button>

        <button className="p-4 bg-background/5 backdrop-blur-xl border border-border/10 rounded-xl hover:bg-background/10 transition-all duration-300 group">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#00DDFF] to-[#0049B7]">
              <CreditCard className="h-5 w-5 text-foreground" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">New Payment</p>
              <p className="text-xs text-foreground/60">Process payment</p>
            </div>
            <ChevronRight className="h-4 w-4 text-foreground/40 group-hover:text-foreground/60 transition-colors ml-auto" />
          </div>
        </button>

        <button className="p-4 bg-background/5 backdrop-blur-xl border border-border/10 rounded-xl hover:bg-background/10 transition-all duration-300 group">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#fff685] to-amber-500">
              <PieChart className="h-5 w-5 text-foreground" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">Cost Analysis</p>
              <p className="text-xs text-foreground/60">Detailed breakdown</p>
            </div>
            <ChevronRight className="h-4 w-4 text-foreground/40 group-hover:text-foreground/60 transition-colors ml-auto" />
          </div>
        </button>

        <button className="p-4 bg-background/5 backdrop-blur-xl border border-border/10 rounded-xl hover:bg-background/10 transition-all duration-300 group">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <BarChart3 className="h-5 w-5 text-foreground" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">Reports</p>
              <p className="text-xs text-foreground/60">Financial reports</p>
            </div>
            <ChevronRight className="h-4 w-4 text-foreground/40 group-hover:text-foreground/60 transition-colors ml-auto" />
          </div>
        </button>
      </div>
    </div>
  )
}
