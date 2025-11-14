'use client'

import React, { useEffect, useState } from 'react'
import { useLoadingStore } from '@/lib/stores/loading-store'
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
  BarChart3,
  Plus,
  Edit2,
  Trash2
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
  Bar
} from 'recharts'
import { ISPModal } from '@/components/isp/ISPModal'
import { ISPTable } from '@/components/isp/ISPTable'
import { ISPInput, ISPSelect, ISPButton } from '@/components/isp/ISPForm'

const billingData = [
  { month: 'Jan', billed: 3800000, collected: 3650000, pending: 150000 },
  { month: 'Feb', billed: 3950000, collected: 3800000, pending: 150000 },
  { month: 'Mar', billed: 4100000, collected: 3900000, pending: 200000 },
  { month: 'Apr', billed: 4050000, collected: 3950000, pending: 100000 },
  { month: 'May', billed: 4200000, collected: 4050000, pending: 150000 },
  { month: 'Jun', billed: 4350000, collected: 4200000, pending: 150000 }
]

const paymentMethods = [
  { method: 'Online Banking', amount: 2520000, percentage: 60 },
  { method: 'Credit/Debit Card', amount: 1050000, percentage: 25 },
  { method: 'UPI', amount: 420000, percentage: 10 },
  { method: 'Cash', amount: 210000, percentage: 5 }
]

interface Invoice {
  id: string
  customer: string
  amount: number
  status: 'paid' | 'pending' | 'overdue'
  dueDate: string
  paidDate: string | null
  description?: string
  billingPeriod?: string
}

const initialInvoices: Invoice[] = [
  {
    id: 'INV-2024-06-001',
    customer: 'ABC Enterprises',
    amount: 2499,
    status: 'paid',
    dueDate: '2024-06-15',
    paidDate: '2024-06-12',
    description: 'Monthly broadband subscription',
    billingPeriod: 'June 2024'
  },
  {
    id: 'INV-2024-06-002',
    customer: 'XYZ Shopping Mall',
    amount: 9999,
    status: 'paid',
    dueDate: '2024-06-15',
    paidDate: '2024-06-14',
    description: 'Enterprise broadband subscription',
    billingPeriod: 'June 2024'
  },
  {
    id: 'INV-2024-06-003',
    customer: 'John Doe',
    amount: 799,
    status: 'pending',
    dueDate: '2024-06-20',
    paidDate: null,
    description: 'Home broadband subscription',
    billingPeriod: 'June 2024'
  },
  {
    id: 'INV-2024-06-004',
    customer: 'Sarah Johnson',
    amount: 799,
    status: 'overdue',
    dueDate: '2024-05-20',
    paidDate: null,
    description: 'Home broadband subscription',
    billingPeriod: 'May 2024'
  }
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
      <div
        className={`absolute -inset-0.5 bg-gradient-to-r ${gradient} rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300`}
      />
      <div className="relative bg-background/50 backdrop-blur-xl border border-border/10 rounded-2xl p-6 hover:bg-background/20 transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient}`}>
            <Icon className="h-6 w-6 text-foreground" />
          </div>
          {change !== undefined && (
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
          )}
        </div>
        <h3 className="text-foreground/60 text-sm font-medium mb-1">{title}</h3>
        <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
        {subValue && <p className="text-xs text-foreground/40">{subValue}</p>}
      </div>
    </div>
  )
}

export default function BillingPage() {
  const { updateProgress, finishLoading } = useLoadingStore()
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [searchTerm, setSearchTerm] = useState('')
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [formData, setFormData] = useState({
    customer: '',
    amount: 0,
    status: 'pending' as const,
    dueDate: '',
    description: '',
    billingPeriod: 'June 2024'
  })

  // ⚡ ENTERPRISE: Complete loading animation on mount (if coming from login)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const isInitializing = urlParams.get('initializing') === 'true'

    if (isInitializing) {
      console.log('💳 ISP Billing: Completing loading animation from 70% → 100%')

      // Animate from 70% to 100% smoothly
      let progress = 70
      const progressInterval = setInterval(() => {
        progress += 5
        if (progress <= 100) {
          updateProgress(progress, undefined, progress === 100 ? 'Ready!' : 'Loading your workspace...')
        }
        if (progress >= 100) {
          clearInterval(progressInterval)
          // Complete and hide overlay after brief delay
          setTimeout(() => {
            finishLoading()
            // Clean up URL parameter
            window.history.replaceState({}, '', window.location.pathname)
            console.log('✅ ISP Billing: Loading complete!')
          }, 500)
        }
      }, 50)

      return () => clearInterval(progressInterval)
    }
  }, [updateProgress, finishLoading])

  const handleAdd = () => {
    const newInvoice: Invoice = {
      id: `INV-2024-06-${String(invoices.length + 1).padStart(3, '0')}`,
      customer: formData.customer,
      amount: formData.amount,
      status: formData.status,
      dueDate: formData.dueDate,
      paidDate: formData.status === 'paid' ? new Date().toISOString().split('T')[0] : null,
      description: formData.description,
      billingPeriod: formData.billingPeriod
    }
    setInvoices([...invoices, newInvoice])
    setShowAddModal(false)
    resetForm()
  }

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setFormData({
      customer: invoice.customer,
      amount: invoice.amount,
      status: invoice.status,
      dueDate: invoice.dueDate,
      description: invoice.description || '',
      billingPeriod: invoice.billingPeriod || 'June 2024'
    })
    setShowEditModal(true)
  }

  const handleUpdate = () => {
    if (selectedInvoice) {
      setInvoices(
        invoices.map(inv =>
          inv.id === selectedInvoice.id
            ? {
                ...inv,
                ...formData,
                paidDate:
                  formData.status === 'paid' && !inv.paidDate
                    ? new Date().toISOString().split('T')[0]
                    : inv.paidDate
              }
            : inv
        )
      )
      setShowEditModal(false)
      setSelectedInvoice(null)
      resetForm()
    }
  }

  const handleDelete = (invoice: Invoice) => {
    if (confirm(`Are you sure you want to delete invoice ${invoice.id}?`)) {
      setInvoices(invoices.filter(inv => inv.id !== invoice.id))
    }
  }

  const resetForm = () => {
    setFormData({
      customer: '',
      amount: 0,
      status: 'pending',
      dueDate: '',
      description: '',
      billingPeriod: 'June 2024'
    })
  }

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch =
      invoice.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

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
          <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20">
            <Clock className="h-3 w-3 text-[#FFD700]" />
            <span className="text-xs font-medium text-[#FFD700]">Pending</span>
          </div>
        )
      case 'overdue':
        return (
          <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-[#E91E63]/10 border border-[#E91E63]/20">
            <AlertCircle className="h-3 w-3 text-[#E91E63]" />
            <span className="text-xs font-medium text-[#E91E63]">Overdue</span>
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
          <h1 className="text-3xl font-bold text-[#F5E6C8]">Billing & Revenue</h1>
          <p className="text-foreground/60 mt-1">Manage invoices, payments, and revenue tracking</p>
        </div>

        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button className="flex items-center space-x-2 px-4 py-2 bg-background/50 border border-border/10 rounded-lg text-foreground/60 hover:bg-background/20 hover:text-foreground transition-all duration-200">
            <Calendar className="h-5 w-5" />
            <span>Jun 2024</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#0099CC] to-[#0049B7] text-foreground rounded-lg font-medium hover:shadow-lg hover:shadow-[#0099CC]/40 transition-all duration-300"
          >
            <Plus className="h-5 w-5" />
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
          gradient="from-[#0099CC] to-[#0049B7]"
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
          gradient="from-[#FFD700] to-[#0099CC]"
          subValue="3.5% of total"
        />
        <BillingCard
          title="Overdue"
          value="₹3.2 L"
          icon={AlertCircle}
          gradient="from-[#E91E63] to-[#C2185B]"
          subValue="45 invoices"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Billing Trend */}
        <div className="lg:col-span-2">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0099CC] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
            <div className="relative bg-background/50 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[#F5E6C8]">Billing & Collection Trend</h2>
                <div className="flex items-center space-x-4 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-[#0099CC]" />
                    <span className="text-foreground/60">Billed</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="text-foreground/60">Collected</span>
                  </div>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={safeBillingData}>
                  <defs>
                    <linearGradient id="billedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0099CC" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0099CC" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="collectedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
                    stroke="#0099CC"
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
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FFD700] to-[#0099CC] rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
            <div className="relative bg-background/50 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-foreground mb-6">Payment Methods</h2>

              <div className="space-y-4">
                {paymentMethods.map((method, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground/80">{method.method}</span>
                      <span className="text-sm font-medium text-foreground">
                        {method.percentage}%
                      </span>
                    </div>
                    <div className="relative">
                      <div className="h-2 rounded-full bg-background/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#0099CC] to-[#FFD700] rounded-full transition-all duration-1000"
                          style={{ width: `${method.percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-foreground/40">
                        ₹{(method.amount / 100000).toFixed(1)} L
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-border/10">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground/60">Total Collected</span>
                  <span className="text-lg font-bold text-foreground">₹42 L</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-6">Recent Invoices</h2>
        <ISPTable
          data={filteredInvoices}
          columns={[
            {
              key: 'id',
              label: 'Invoice ID',
              render: item => <span className="text-sm font-medium text-[#0099CC]">{item.id}</span>
            },
            {
              key: 'customer',
              label: 'Customer',
              render: item => (
                <div>
                  <p className="text-sm font-medium text-foreground">{item.customer}</p>
                  {item.description && (
                    <p className="text-xs text-foreground/60">{item.description}</p>
                  )}
                </div>
              )
            },
            {
              key: 'amount',
              label: 'Amount',
              render: item => (
                <span className="text-sm font-medium text-foreground">
                  ₹{item.amount.toLocaleString()}
                </span>
              )
            },
            {
              key: 'status',
              label: 'Status',
              render: item => getStatusBadge(item.status)
            },
            {
              key: 'dueDate',
              label: 'Due Date',
              render: item => (
                <div className="space-y-1">
                  <p className="text-sm text-foreground/80">{item.dueDate}</p>
                  {item.paidDate && (
                    <p className="text-xs text-emerald-400">Paid: {item.paidDate}</p>
                  )}
                </div>
              )
            }
          ]}
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchPlaceholder="Search invoices by ID or customer..."
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0099CC] to-[#0049B7] rounded-xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
          <div className="relative flex items-center space-x-3 bg-background/50 backdrop-blur-xl border border-border/10 rounded-xl p-4 hover:bg-background/20 transition-all duration-300">
            <div className="p-2 bg-gradient-to-br from-[#0099CC] to-[#0049B7] rounded-lg">
              <FileText className="h-5 w-5 text-foreground" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">Bulk Invoice Generation</p>
              <p className="text-xs text-foreground/60">Generate monthly invoices</p>
            </div>
          </div>
        </button>

        <button className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FFD700] to-[#0099CC] rounded-xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
          <div className="relative flex items-center space-x-3 bg-background/50 backdrop-blur-xl border border-border/10 rounded-xl p-4 hover:bg-background/20 transition-all duration-300">
            <div className="p-2 bg-gradient-to-br from-[#FFD700] to-[#0099CC] rounded-lg">
              <CreditCard className="h-5 w-5 text-[#0049B7]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">Payment Reminders</p>
              <p className="text-xs text-foreground/60">Send automated reminders</p>
            </div>
          </div>
        </button>

        <button className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#E91E63] to-[#C2185B] rounded-xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
          <div className="relative flex items-center space-x-3 bg-background/50 backdrop-blur-xl border border-border/10 rounded-xl p-4 hover:bg-background/20 transition-all duration-300">
            <div className="p-2 bg-gradient-to-br from-[#E91E63] to-[#C2185B] rounded-lg">
              <BarChart3 className="h-5 w-5 text-foreground" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">Revenue Report</p>
              <p className="text-xs text-foreground/60">Generate detailed report</p>
            </div>
          </div>
        </button>
      </div>

      {/* Add Invoice Modal */}
      <ISPModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          resetForm()
        }}
        title="Generate New Invoice"
        size="md"
      >
        <form
          onSubmit={e => {
            e.preventDefault()
            handleAdd()
          }}
          className="space-y-4"
        >
          <ISPInput
            label="Customer Name"
            value={formData.customer}
            onChange={e => setFormData({ ...formData, customer: e.target.value })}
            placeholder="Enter customer name"
            required
          />

          <ISPInput
            label="Amount (₹)"
            type="number"
            value={formData.amount}
            onChange={e => setFormData({ ...formData, amount: parseInt(e.target.value) })}
            placeholder="Enter invoice amount"
            icon={<DollarSign className="h-4 w-4 text-foreground/40" />}
            required
          />

          <ISPInput
            label="Due Date"
            type="date"
            value={formData.dueDate}
            onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
            icon={<Calendar className="h-4 w-4 text-foreground/40" />}
            required
          />

          <ISPSelect
            label="Status"
            value={formData.status}
            onChange={e => setFormData({ ...formData, status: e.target.value as any })}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'paid', label: 'Paid' },
              { value: 'overdue', label: 'Overdue' }
            ]}
          />

          <ISPInput
            label="Billing Period"
            value={formData.billingPeriod}
            onChange={e => setFormData({ ...formData, billingPeriod: e.target.value })}
            placeholder="e.g., June 2024"
            required
          />

          <ISPInput
            label="Description"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter invoice description"
            icon={<FileText className="h-4 w-4 text-foreground/40" />}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <ISPButton
              type="button"
              variant="secondary"
              onClick={() => {
                setShowAddModal(false)
                resetForm()
              }}
            >
              Cancel
            </ISPButton>
            <ISPButton type="submit">Generate Invoice</ISPButton>
          </div>
        </form>
      </ISPModal>

      {/* Edit Invoice Modal */}
      <ISPModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedInvoice(null)
          resetForm()
        }}
        title="Edit Invoice"
        size="md"
      >
        <form
          onSubmit={e => {
            e.preventDefault()
            handleUpdate()
          }}
          className="space-y-4"
        >
          <ISPInput
            label="Customer Name"
            value={formData.customer}
            onChange={e => setFormData({ ...formData, customer: e.target.value })}
            placeholder="Enter customer name"
            required
          />

          <ISPInput
            label="Amount (₹)"
            type="number"
            value={formData.amount}
            onChange={e => setFormData({ ...formData, amount: parseInt(e.target.value) })}
            placeholder="Enter invoice amount"
            icon={<DollarSign className="h-4 w-4 text-foreground/40" />}
            required
          />

          <ISPInput
            label="Due Date"
            type="date"
            value={formData.dueDate}
            onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
            icon={<Calendar className="h-4 w-4 text-foreground/40" />}
            required
          />

          <ISPSelect
            label="Status"
            value={formData.status}
            onChange={e => setFormData({ ...formData, status: e.target.value as any })}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'paid', label: 'Paid' },
              { value: 'overdue', label: 'Overdue' }
            ]}
          />

          <ISPInput
            label="Billing Period"
            value={formData.billingPeriod}
            onChange={e => setFormData({ ...formData, billingPeriod: e.target.value })}
            placeholder="e.g., June 2024"
            required
          />

          <ISPInput
            label="Description"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter invoice description"
            icon={<FileText className="h-4 w-4 text-foreground/40" />}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <ISPButton
              type="button"
              variant="secondary"
              onClick={() => {
                setShowEditModal(false)
                setSelectedInvoice(null)
                resetForm()
              }}
            >
              Cancel
            </ISPButton>
            <ISPButton type="submit">Update Invoice</ISPButton>
          </div>
        </form>
      </ISPModal>
    </div>
  )
}
// Defensive normalization for chart inputs
const toArray = (v: any): any[] =>
  Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v) : []
const safeBillingData = toArray(billingData)
