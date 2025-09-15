'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  ArrowUpRight,
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
  Mail,
  Phone,
  FileText,
  Building2,
  TrendingUp,
  Users,
  MoreVertical,
  Send,
  CreditCard
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

interface Customer {
  id: string
  customerCode: string
  customerName: string
  category: string
  totalReceivable: number
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
  customerName: string
  customerCode: string
  invoiceDate: string
  dueDate: string
  amount: number
  paidAmount: number
  status: 'paid' | 'partial' | 'pending' | 'overdue'
  category: string
  description: string
}

export default function AccountsReceivablePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'invoices'>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // AR Overview Data
  const [arMetrics] = useState({
    totalReceivable: 125000000,
    overdueAmount: 18000000,
    currentAmount: 107000000,
    customerCount: 2450,
    averageCollectionDays: 21,
    cashCollected: 45000000
  })

  // Aging Analysis
  const [agingData] = useState([
    { range: '0-30 days', amount: 72000000, percentage: 57.6 },
    { range: '31-60 days', amount: 35000000, percentage: 28.0 },
    { range: '61-90 days', amount: 12000000, percentage: 9.6 },
    { range: '90+ days', amount: 6000000, percentage: 4.8 }
  ])

  // Category Breakdown
  const [categoryData] = useState([
    { name: 'Enterprise Clients', value: 65000000, color: '#00DDFF' },
    { name: 'Corporate Bundles', value: 35000000, color: '#10b981' },
    { name: 'Residential', value: 15000000, color: '#fff685' },
    { name: 'Small Business', value: 8000000, color: '#f59e0b' },
    { name: 'Others', value: 2000000, color: '#8b5cf6' }
  ])

  // Customers
  const [customers] = useState<Customer[]>([
    {
      id: '1',
      customerCode: 'CUS-001',
      customerName: 'TechPark Enterprises',
      category: 'Enterprise Clients',
      totalReceivable: 28000000,
      overdueAmount: 5000000,
      currentAmount: 23000000,
      creditLimit: 50000000,
      paymentTerms: 'Net 30',
      lastPayment: '2024-05-25',
      status: 'active',
      contact: {
        person: 'Anjali Nair',
        email: 'anjali@techpark.com',
        phone: '+91 98765 43210'
      }
    },
    {
      id: '2',
      customerCode: 'CUS-002',
      customerName: 'InfoCity Corporate Park',
      category: 'Corporate Bundles',
      totalReceivable: 15500000,
      overdueAmount: 0,
      currentAmount: 15500000,
      creditLimit: 30000000,
      paymentTerms: 'Net 45',
      lastPayment: '2024-06-05',
      status: 'active',
      contact: {
        person: 'Ravi Kumar',
        email: 'ravi@infocity.com',
        phone: '+91 98765 43211'
      }
    },
    {
      id: '3',
      customerCode: 'CUS-003',
      customerName: 'Mall of Kerala',
      category: 'Enterprise Clients',
      totalReceivable: 12000000,
      overdueAmount: 3000000,
      currentAmount: 9000000,
      creditLimit: 20000000,
      paymentTerms: 'Net 30',
      lastPayment: '2024-04-20',
      status: 'on-hold',
      contact: {
        person: 'Sreeja Menon',
        email: 'sreeja@mallofkerala.com',
        phone: '+91 98765 43212'
      }
    }
  ])

  // Recent Invoices
  const [invoices] = useState<Invoice[]>([
    {
      id: '1',
      invoiceNumber: 'INV-2024-1615',
      customerName: 'TechPark Enterprises',
      customerCode: 'CUS-001',
      invoiceDate: '2024-06-15',
      dueDate: '2024-07-15',
      amount: 8500000,
      paidAmount: 0,
      status: 'pending',
      category: 'Enterprise Clients',
      description: 'High-speed internet services - June 2024'
    },
    {
      id: '2',
      invoiceNumber: 'INV-2024-1614',
      customerName: 'InfoCity Corporate Park',
      customerCode: 'CUS-002',
      invoiceDate: '2024-06-01',
      dueDate: '2024-07-16',
      amount: 5500000,
      paidAmount: 0,
      status: 'pending',
      category: 'Corporate Bundles',
      description: 'Corporate bundle package - June 2024'
    },
    {
      id: '3',
      invoiceNumber: 'INV-2024-1542',
      customerName: 'Mall of Kerala',
      customerCode: 'CUS-003',
      invoiceDate: '2024-04-15',
      dueDate: '2024-05-15',
      amount: 3000000,
      paidAmount: 0,
      status: 'overdue',
      category: 'Enterprise Clients',
      description: 'Enterprise connectivity - April 2024'
    }
  ])

  const supabase = createClientComponentClient()

  const refreshData = async () => {
    setIsRefreshing(true)
    // Fetch AR data from Supabase
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
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Accounts Receivable
          </h1>
          <p className="text-white/60 mt-1">Manage customer invoices and receivables</p>
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
            <Plus className="h-5 w-5" />
            <span>New Invoice</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white/5 backdrop-blur-xl p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-md font-medium transition-all duration-300 ${
            activeTab === 'overview'
              ? 'bg-gradient-to-r from-[#00DDFF] to-[#0049B7] text-white'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`px-4 py-2 rounded-md font-medium transition-all duration-300 ${
            activeTab === 'customers'
              ? 'bg-gradient-to-r from-[#00DDFF] to-[#0049B7] text-white'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Customers
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 rounded-md font-medium transition-all duration-300 ${
            activeTab === 'invoices'
              ? 'bg-gradient-to-r from-[#00DDFF] to-[#0049B7] text-white'
              : 'text-white/60 hover:text-white'
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
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-[#00DDFF] to-[#0049B7]">
                    <ArrowUpRight className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xs text-[#00DDFF] font-medium">23% of revenue</span>
                </div>
                <h3 className="text-white/60 text-sm font-medium mb-1">Total Receivable</h3>
                <p className="text-2xl font-bold text-white">
                  ₹{(arMetrics.totalReceivable / 10000000).toFixed(1)} Cr
                </p>
                <p className="text-xs text-white/40 mt-1">
                  {arMetrics.customerCount} active customers
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xs text-yellow-400 font-medium">Action needed</span>
                </div>
                <h3 className="text-white/60 text-sm font-medium mb-1">Overdue Amount</h3>
                <p className="text-2xl font-bold text-white">
                  ₹{(arMetrics.overdueAmount / 10000000).toFixed(1)} Cr
                </p>
                <p className="text-xs text-white/40 mt-1">28 overdue invoices</p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
                <h3 className="text-white/60 text-sm font-medium mb-1">Avg Collection Days</h3>
                <p className="text-2xl font-bold text-white">
                  {arMetrics.averageCollectionDays} days
                </p>
                <p className="text-xs text-white/40 mt-1">Below target</p>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Aging Analysis */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-white mb-6">
                  Receivables Aging Analysis
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
                    <Bar dataKey="amount" fill="#00DDFF" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Receivables by Category</h2>
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
                        <span className="text-sm text-white/80">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium text-white">
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

      {activeTab === 'customers' && (
        <>
          {/* Customers Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[#00DDFF] transition-colors"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00DDFF] transition-colors"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="blocked">Blocked</option>
            </select>

            <button className="flex items-center space-x-2 px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors">
              <Download className="h-5 w-5" />
              <span>Export</span>
            </button>
          </div>

          {/* Customers List */}
          <div className="space-y-4">
            {customers.map(customer => (
              <div key={customer.id} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Building2 className="h-5 w-5 text-[#00DDFF]" />
                        <h3 className="text-lg font-semibold text-white">
                          {customer.customerName}
                        </h3>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-white/10 text-white/60">
                          {customer.customerCode}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            customer.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : customer.status === 'on-hold'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {customer.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-white/60 mb-1">Total Receivable</p>
                          <p className="text-lg font-semibold text-white">
                            ₹{(customer.totalReceivable / 10000000).toFixed(2)} Cr
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-white/60 mb-1">Overdue</p>
                          <p
                            className={`text-lg font-semibold ${customer.overdueAmount > 0 ? 'text-red-400' : 'text-emerald-400'}`}
                          >
                            ₹{(customer.overdueAmount / 10000000).toFixed(2)} Cr
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-white/60 mb-1">Credit Limit</p>
                          <p className="text-lg font-semibold text-white">
                            ₹{(customer.creditLimit / 10000000).toFixed(2)} Cr
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-white/60 mb-1">Payment Terms</p>
                          <p className="text-lg font-semibold text-white">
                            {customer.paymentTerms}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 text-sm text-white/60">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>{customer.contact.person}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span>{customer.contact.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span>{customer.contact.phone}</span>
                        </div>
                      </div>
                    </div>

                    <button className="ml-4 text-white/40 hover:text-white transition-colors">
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[#00DDFF] transition-colors"
              />
            </div>

            <button className="flex items-center space-x-2 px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors">
              <Calendar className="h-5 w-5" />
              <span>Date Range</span>
            </button>

            <button className="flex items-center space-x-2 px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors">
              <Filter className="h-5 w-5" />
              <span>Filter</span>
            </button>
          </div>

          {/* Invoices Table */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="text-left py-4 pl-6 text-sm font-medium text-white/60">
                      Invoice #
                    </th>
                    <th className="text-left py-4 text-sm font-medium text-white/60">Customer</th>
                    <th className="text-left py-4 text-sm font-medium text-white/60">Date</th>
                    <th className="text-left py-4 text-sm font-medium text-white/60">Due Date</th>
                    <th className="text-right py-4 text-sm font-medium text-white/60">Amount</th>
                    <th className="text-center py-4 text-sm font-medium text-white/60">Status</th>
                    <th className="text-right py-4 pr-6 text-sm font-medium text-white/60">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {invoices.map(invoice => (
                    <tr key={invoice.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 pl-6">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-white/40" />
                          <span className="font-mono text-sm text-white">
                            {invoice.invoiceNumber}
                          </span>
                        </div>
                      </td>
                      <td className="py-4">
                        <div>
                          <p className="text-white font-medium">{invoice.customerName}</p>
                          <p className="text-xs text-white/40">{invoice.category}</p>
                        </div>
                      </td>
                      <td className="py-4 text-white/80">
                        {new Date(invoice.invoiceDate).toLocaleDateString()}
                      </td>
                      <td className="py-4">
                        <span
                          className={
                            invoice.status === 'overdue' ? 'text-red-400' : 'text-white/80'
                          }
                        >
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-4 text-right text-white font-medium">
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
                          <button className="p-1 text-white/40 hover:text-white transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-white/40 hover:text-white transition-colors">
                            <Send className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-white/40 hover:text-white transition-colors">
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
