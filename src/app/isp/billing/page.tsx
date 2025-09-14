'use client'

import { useState } from 'react'
import { 
  CreditCard, 
  Download,
  FileText,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Receipt,
  Filter,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const billingData = [
  { month: 'Jan', billed: 3800000, collected: 3650000, pending: 150000 },
  { month: 'Feb', billed: 3950000, collected: 3800000, pending: 150000 },
  { month: 'Mar', billed: 4100000, collected: 3900000, pending: 200000 },
  { month: 'Apr', billed: 4050000, collected: 3950000, pending: 100000 },
  { month: 'May', billed: 4200000, collected: 4050000, pending: 150000 },
  { month: 'Jun', billed: 4350000, collected: 4200000, pending: 150000 },
]

const paymentMethods = [
  { method: 'Online Banking', amount: 2520000, percentage: 60 },
  { method: 'Credit/Debit Card', amount: 1050000, percentage: 25 },
  { method: 'UPI', amount: 420000, percentage: 10 },
  { method: 'Cash', amount: 210000, percentage: 5 },
]

const recentInvoices = [
  {
    id: 'INV-2024-06-001',
    customer: 'ABC Enterprises',
    amount: 2499,
    status: 'paid',
    dueDate: '2024-06-15',
    paidDate: '2024-06-12'
  },
  {
    id: 'INV-2024-06-002',
    customer: 'XYZ Shopping Mall',
    amount: 9999,
    status: 'paid',
    dueDate: '2024-06-15',
    paidDate: '2024-06-14'
  },
  {
    id: 'INV-2024-06-003',
    customer: 'John Doe',
    amount: 799,
    status: 'pending',
    dueDate: '2024-06-20',
    paidDate: null
  },
  {
    id: 'INV-2024-06-004',
    customer: 'Sarah Johnson',
    amount: 799,
    status: 'overdue',
    dueDate: '2024-05-20',
    paidDate: null
  },
]

interface BillingCardProps {
  title: string
  value: string
  change?: number
  icon: React.ElementType
  gradient: string
  subValue?: string
}

function BillingCard({ title, value, change, icon: Icon, gradient, subValue }: BillingCardProps) {
  const isPositive = change ? change >= 0 : true

  return (
    <div className="relative group">
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${gradient} rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300`} />
      <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          {change !== undefined && (
            <div className={`flex items-center space-x-1 text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        <h3 className="text-white/60 text-sm font-medium mb-1">{title}</h3>
        <p className="text-2xl font-bold text-white mb-1">{value}</p>
        {subValue && <p className="text-xs text-white/40">{subValue}</p>}
      </div>
    </div>
  )
}

export default function BillingPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [searchTerm, setSearchTerm] = useState('')

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle className="h-3 w-3 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">Paid</span>
          </div>
        )
      case 'pending':
        return (
          <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-[#fff685]/10 border border-[#fff685]/20">
            <Clock className="h-3 w-3 text-[#fff685]" />
            <span className="text-xs font-medium text-[#fff685]">Pending</span>
          </div>
        )
      case 'overdue':
        return (
          <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-[#ff1d58]/10 border border-[#ff1d58]/20">
            <AlertCircle className="h-3 w-3 text-[#ff1d58]" />
            <span className="text-xs font-medium text-[#ff1d58]">Overdue</span>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Billing & Revenue
          </h1>
          <p className="text-white/60 mt-1">Manage invoices, payments, and revenue tracking</p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-all duration-200">
            <Calendar className="h-5 w-5" />
            <span>Jun 2024</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] text-white rounded-lg font-medium hover:shadow-lg hover:shadow-[#00DDFF]/30 transition-all duration-300">
            <FileText className="h-5 w-5" />
            <span>Generate Invoice</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <BillingCard
          title="Total Billed"
          value="₹4.35 Cr"
          change={8.5}
          icon={DollarSign}
          gradient="from-[#00DDFF] to-[#0049B7]"
          subValue="June 2024"
        />
        <BillingCard
          title="Collected"
          value="₹4.2 Cr"
          change={5.2}
          icon={CheckCircle}
          gradient="from-emerald-500 to-green-500"
          subValue="96.5% collection rate"
        />
        <BillingCard
          title="Pending"
          value="₹15 L"
          change={-12.3}
          icon={Clock}
          gradient="from-[#fff685] to-[#00DDFF]"
          subValue="3.5% of total"
        />
        <BillingCard
          title="Overdue"
          value="₹3.2 L"
          icon={AlertCircle}
          gradient="from-[#ff1d58] to-[#f75990]"
          subValue="45 invoices"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Billing Trend */}
        <div className="lg:col-span-2">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Billing & Collection Trend</h2>
                <div className="flex items-center space-x-4 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-[#00DDFF]" />
                    <span className="text-white/60">Billed</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="text-white/60">Collected</span>
                  </div>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={billingData}>
                  <defs>
                    <linearGradient id="billedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00DDFF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00DDFF" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="collectedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" />
                  <YAxis stroke="rgba(255,255,255,0.4)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      backdropFilter: 'blur(10px)'
                    }} 
                  />
                  <Area
                    type="monotone"
                    dataKey="billed"
                    stroke="#00DDFF"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#billedGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="collected"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#collectedGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fff685] to-[#00DDFF] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Payment Methods</h2>
              
              <div className="space-y-4">
                {paymentMethods.map((method, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/80">{method.method}</span>
                      <span className="text-sm font-medium text-white">{method.percentage}%</span>
                    </div>
                    <div className="relative">
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#00DDFF] to-[#fff685] rounded-full transition-all duration-1000"
                          style={{ width: `${method.percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/40">₹{(method.amount / 100000).toFixed(1)} L</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Total Collected</span>
                  <span className="text-lg font-bold text-white">₹42 L</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="relative overflow-hidden">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00DDFF]/20 to-[#0049B7]/20 rounded-2xl blur" />
        <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
          <div className="p-6 border-b border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-semibold text-white">Recent Invoices</h2>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#00DDFF]/50 focus:bg-white/10 transition-all duration-200"
                  />
                </div>
                <button className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-all duration-200">
                  <Filter className="h-5 w-5" />
                </button>
                <button className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-all duration-200">
                  <Download className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left px-6 py-4 text-xs font-medium text-white/60 uppercase tracking-wider">
                    Invoice ID
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-white/60 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-white/60 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-white/60 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-white/60 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-white/60 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-white/5 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-[#00DDFF]">{invoice.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-white">{invoice.customer}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-white">₹{invoice.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm text-white/80">{invoice.dueDate}</p>
                        {invoice.paidDate && (
                          <p className="text-xs text-emerald-400">Paid: {invoice.paidDate}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors duration-200">
                          <Receipt className="h-4 w-4 text-white/60" />
                        </button>
                        <button className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors duration-200">
                          <Download className="h-4 w-4 text-white/60" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
          <div className="relative flex items-center space-x-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300">
            <div className="p-2 bg-gradient-to-br from-[#00DDFF] to-[#0049B7] rounded-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">Bulk Invoice Generation</p>
              <p className="text-xs text-white/60">Generate monthly invoices</p>
            </div>
          </div>
        </button>

        <button className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fff685] to-[#00DDFF] rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
          <div className="relative flex items-center space-x-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300">
            <div className="p-2 bg-gradient-to-br from-[#fff685] to-[#00DDFF] rounded-lg">
              <CreditCard className="h-5 w-5 text-[#0049B7]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">Payment Reminders</p>
              <p className="text-xs text-white/60">Send automated reminders</p>
            </div>
          </div>
        </button>

        <button className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#ff1d58] to-[#f75990] rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
          <div className="relative flex items-center space-x-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300">
            <div className="p-2 bg-gradient-to-br from-[#ff1d58] to-[#f75990] rounded-lg">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">Revenue Report</p>
              <p className="text-xs text-white/60">Generate detailed report</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}