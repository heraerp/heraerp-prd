'use client'

import React from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  ArrowDownRight,
  Search,
  Filter,
  Download,
  Plus,
  ChevronRight,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Eye,
  CreditCard,
  FileText,
  Building2,
  TrendingUp,
  Users,
  MoreVertical,
  Mail,
  Phone
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

// India Vision Organization ID
const KERALA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001'

interface Vendor {
  id: string
  vendorCode: string
  vendorName: string
  category: string
  totalPayable: number
  overdueAmount: number
  currentAmount: number
  creditLimit: number
  paymentTerms: string
  lastPayment: string
  status: 'active' | 'on-hold' | 'blocked'
  contact: {
    person: string
    email: string
    phone: string
  }
}

interface Invoice {
  id: string
  invoiceNumber: string
  vendorName: string
  vendorCode: string
  invoiceDate: string
  dueDate: string
  amount: number
  paidAmount: number
  status: 'paid' | 'partial' | 'pending' | 'overdue'
  category: string
  description: string
  approvalStatus: 'approved' | 'pending' | 'rejected'
}

export default function AccountsPayablePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'vendors' | 'invoices'>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // AP Overview Data
  const [apMetrics] = useState({
    totalPayable: 82000000,
    overdueAmount: 15600000,
    currentAmount: 66400000,
    vendorCount: 142,
    averagePaymentDays: 28,
    earlyPaymentDiscount: 1200000
  })

  // Aging Analysis
  const [agingData] = useState([
    { range: '0-30 days', amount: 45000000, percentage: 54.9 },
    { range: '31-60 days', amount: 21400000, percentage: 26.1 },
    { range: '61-90 days', amount: 10000000, percentage: 12.2 },
    { range: '90+ days', amount: 5600000, percentage: 6.8 }
  ])

  // Category Breakdown
  const [categoryData] = useState([
    { name: 'Network Equipment', value: 35000000, color: '#00DDFF' },
    { name: 'Utilities', value: 18000000, color: '#10b981' },
    { name: 'Professional Services', value: 15000000, color: '#fff685' },
    { name: 'Maintenance', value: 8000000, color: '#f59e0b' },
    { name: 'Others', value: 6000000, color: '#8b5cf6' }
  ])

  // Vendors
  const [vendors] = useState<Vendor[]>([
    {
      id: '1',
      vendorCode: 'VEN-001',
      vendorName: 'Network Solutions Ltd',
      category: 'Network Equipment',
      totalPayable: 25000000,
      overdueAmount: 5000000,
      currentAmount: 20000000,
      creditLimit: 50000000,
      paymentTerms: 'Net 30',
      lastPayment: '2024-05-20',
      status: 'active',
      contact: {
        person: 'Rajesh Kumar',
        email: 'rajesh@networksolutions.com',
        phone: '+91 98765 43210'
      }
    },
    {
      id: '2',
      vendorCode: 'VEN-002',
      vendorName: 'Kerala State Electricity Board',
      category: 'Utilities',
      totalPayable: 8500000,
      overdueAmount: 0,
      currentAmount: 8500000,
      creditLimit: 20000000,
      paymentTerms: 'Net 15',
      lastPayment: '2024-06-01',
      status: 'active',
      contact: {
        person: 'KSEB Office',
        email: 'billing@kseb.in',
        phone: '+91 471 2555555'
      }
    },
    {
      id: '3',
      vendorCode: 'VEN-003',
      vendorName: 'TechPro Consulting',
      category: 'Professional Services',
      totalPayable: 12000000,
      overdueAmount: 3000000,
      currentAmount: 9000000,
      creditLimit: 15000000,
      paymentTerms: 'Net 45',
      lastPayment: '2024-04-15',
      status: 'on-hold',
      contact: {
        person: 'Priya Sharma',
        email: 'priya@techpro.com',
        phone: '+91 98765 43211'
      }
    }
  ])

  // Recent Invoices
  const [invoices] = useState<Invoice[]>([
    {
      id: '1',
      invoiceNumber: 'INV-2024-0615',
      vendorName: 'Network Solutions Ltd',
      vendorCode: 'VEN-001',
      invoiceDate: '2024-06-15',
      dueDate: '2024-07-15',
      amount: 5000000,
      paidAmount: 0,
      status: 'pending',
      category: 'Network Equipment',
      description: 'Cisco routers and switches',
      approvalStatus: 'approved'
    },
    {
      id: '2',
      invoiceNumber: 'KSEB-2024-06',
      vendorName: 'Kerala State Electricity Board',
      vendorCode: 'VEN-002',
      invoiceDate: '2024-06-01',
      dueDate: '2024-06-16',
      amount: 2500000,
      paidAmount: 0,
      status: 'pending',
      category: 'Utilities',
      description: 'Monthly electricity charges',
      approvalStatus: 'approved'
    },
    {
      id: '3',
      invoiceNumber: 'TP-2024-042',
      vendorName: 'TechPro Consulting',
      vendorCode: 'VEN-003',
      invoiceDate: '2024-04-01',
      dueDate: '2024-05-16',
      amount: 3000000,
      paidAmount: 0,
      status: 'overdue',
      category: 'Professional Services',
      description: 'Network optimization consulting',
      approvalStatus: 'approved'
    }
  ])

  const supabase = createClientComponentClient()

  const refreshData = async () => {
    setIsRefreshing(true)
    // Fetch AP data from Supabase
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-500/20 text-emerald-400'
      case 'partial':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'pending':
        return 'bg-blue-500/20 text-blue-400'
      case 'overdue':
        return 'bg-red-500/20 text-red-400'
      default:
        return 'bg-gray-9000/20 text-muted-foreground'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-white/80 bg-clip-text text-transparent">
            Accounts Payable
          </h1>
          <p className="text-foreground/60 mt-1">
            Manage vendor payments and outstanding liabilities
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
            <Plus className="h-5 w-5" />
            <span>New Invoice</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-background/5 backdrop-blur-xl p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-md font-medium transition-all duration-300 ${
            activeTab === 'overview'
              ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-foreground'
              : 'text-foreground/60 hover:text-foreground'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('vendors')}
          className={`px-4 py-2 rounded-md font-medium transition-all duration-300 ${
            activeTab === 'vendors'
              ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-foreground'
              : 'text-foreground/60 hover:text-foreground'
          }`}
        >
          Vendors
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 rounded-md font-medium transition-all duration-300 ${
            activeTab === 'invoices'
              ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-foreground'
              : 'text-foreground/60 hover:text-foreground'
          }`}
        >
          Invoices
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-rose-600">
                    <ArrowDownRight className="h-6 w-6 text-foreground" />
                  </div>
                  <span className="text-xs text-red-400 font-medium">19% of total</span>
                </div>
                <h3 className="text-foreground/60 text-sm font-medium mb-1">Total Payable</h3>
                <p className="text-2xl font-bold text-foreground">
                  ₹{(apMetrics.totalPayable / 10000000).toFixed(1)} Cr
                </p>
                <p className="text-xs text-foreground/40 mt-1">
                  {apMetrics.vendorCount} active vendors
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600">
                    <AlertTriangle className="h-6 w-6 text-foreground" />
                  </div>
                  <span className="text-xs text-yellow-400 font-medium">Attention needed</span>
                </div>
                <h3 className="text-foreground/60 text-sm font-medium mb-1">Overdue Amount</h3>
                <p className="text-2xl font-bold text-foreground">
                  ₹{(apMetrics.overdueAmount / 10000000).toFixed(1)} Cr
                </p>
                <p className="text-xs text-foreground/40 mt-1">15 overdue invoices</p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600">
                    <Clock className="h-6 w-6 text-foreground" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
                <h3 className="text-foreground/60 text-sm font-medium mb-1">Avg Payment Days</h3>
                <p className="text-2xl font-bold text-foreground">
                  {apMetrics.averagePaymentDays} days
                </p>
                <p className="text-xs text-foreground/40 mt-1">Within terms</p>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Aging Analysis */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-foreground mb-6">
                  Payables Aging Analysis
                </h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={agingData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="range" stroke="rgba(255,255,255,0.5)" />
                    <YAxis
                      stroke="rgba(255,255,255,0.5)"
                      tickFormatter={value => `₹${(value / 10000000).toFixed(0)}Cr`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px'
                      }}
                      formatter={(value: any) => `₹${(value / 10000000).toFixed(1)} Cr`}
                    />
                    <Bar dataKey="amount" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-foreground mb-6">Payables by Category</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px'
                      }}
                      formatter={(value: any) => `₹${(value / 10000000).toFixed(1)} Cr`}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {categoryData.map(item => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-foreground/80">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        ₹{(item.value / 10000000).toFixed(1)} Cr
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'vendors' && (
        <>
          {/* Vendors Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-foreground/40" />
              <input
                type="text"
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background/5 backdrop-blur-xl border border-border/10 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-4 py-3 bg-background/5 backdrop-blur-xl border border-border/10 rounded-lg text-foreground focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="blocked">Blocked</option>
            </select>

            <button className="flex items-center space-x-2 px-4 py-3 bg-background/5 backdrop-blur-xl border border-border/10 rounded-lg text-foreground hover:bg-background/10 transition-colors">
              <Download className="h-5 w-5" />
              <span>Export</span>
            </button>
          </div>

          {/* Vendors List */}
          <div className="space-y-4">
            {vendors.map(vendor => (
              <div key={vendor.id} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Building2 className="h-5 w-5 text-emerald-400" />
                        <h3 className="text-lg font-semibold text-foreground">
                          {vendor.vendorName}
                        </h3>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-background/10 text-foreground/60">
                          {vendor.vendorCode}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            vendor.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : vendor.status === 'on-hold'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {vendor.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-foreground/60 mb-1">Total Payable</p>
                          <p className="text-lg font-semibold text-foreground">
                            ₹{(vendor.totalPayable / 10000000).toFixed(2)} Cr
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-foreground/60 mb-1">Overdue</p>
                          <p
                            className={`text-lg font-semibold ${vendor.overdueAmount > 0 ? 'text-red-400' : 'text-emerald-400'}`}
                          >
                            ₹{(vendor.overdueAmount / 10000000).toFixed(2)} Cr
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-foreground/60 mb-1">Credit Limit</p>
                          <p className="text-lg font-semibold text-foreground">
                            ₹{(vendor.creditLimit / 10000000).toFixed(2)} Cr
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-foreground/60 mb-1">Payment Terms</p>
                          <p className="text-lg font-semibold text-foreground">
                            {vendor.paymentTerms}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 text-sm text-foreground/60">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>{vendor.contact.person}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span>{vendor.contact.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span>{vendor.contact.phone}</span>
                        </div>
                      </div>
                    </div>

                    <button className="ml-4 text-foreground/40 hover:text-foreground transition-colors">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'invoices' && (
        <>
          {/* Invoices Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-foreground/40" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background/5 backdrop-blur-xl border border-border/10 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <button className="flex items-center space-x-2 px-4 py-3 bg-background/5 backdrop-blur-xl border border-border/10 rounded-lg text-foreground hover:bg-background/10 transition-colors">
              <Calendar className="h-5 w-5" />
              <span>Date Range</span>
            </button>

            <button className="flex items-center space-x-2 px-4 py-3 bg-background/5 backdrop-blur-xl border border-border/10 rounded-lg text-foreground hover:bg-background/10 transition-colors">
              <Filter className="h-5 w-5" />
              <span>Filter</span>
            </button>
          </div>

          {/* Invoices Table */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-background/5 border-b border-border/10">
                  <tr>
                    <th className="text-left py-4 pl-6 text-sm font-medium text-foreground/60">
                      Invoice #
                    </th>
                    <th className="text-left py-4 text-sm font-medium text-foreground/60">
                      Vendor
                    </th>
                    <th className="text-left py-4 text-sm font-medium text-foreground/60">Date</th>
                    <th className="text-left py-4 text-sm font-medium text-foreground/60">
                      Due Date
                    </th>
                    <th className="text-right py-4 text-sm font-medium text-foreground/60">
                      Amount
                    </th>
                    <th className="text-center py-4 text-sm font-medium text-foreground/60">
                      Status
                    </th>
                    <th className="text-right py-4 pr-6 text-sm font-medium text-foreground/60">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {invoices.map(invoice => (
                    <tr key={invoice.id} className="hover:bg-background/5 transition-colors">
                      <td className="py-4 pl-6">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-foreground/40" />
                          <span className="font-mono text-sm text-foreground">
                            {invoice.invoiceNumber}
                          </span>
                        </div>
                      </td>
                      <td className="py-4">
                        <div>
                          <p className="text-foreground font-medium">{invoice.vendorName}</p>
                          <p className="text-xs text-foreground/40">{invoice.category}</p>
                        </div>
                      </td>
                      <td className="py-4 text-foreground/80">
                        {new Date(invoice.invoiceDate).toLocaleDateString()}
                      </td>
                      <td className="py-4">
                        <span
                          className={
                            invoice.status === 'overdue' ? 'text-red-400' : 'text-foreground/80'
                          }
                        >
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-4 text-right text-foreground font-medium">
                        ₹{(invoice.amount / 100000).toFixed(2)} L
                      </td>
                      <td className="py-4 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-4 pr-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button className="p-1 text-foreground/40 hover:text-foreground transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-foreground/40 hover:text-foreground transition-colors">
                            <CreditCard className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-foreground/40 hover:text-foreground transition-colors">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
