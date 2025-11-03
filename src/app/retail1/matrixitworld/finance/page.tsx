'use client'

/**
 * MatrixIT World ERP - Finance Management (Enterprise)
 * SAP Fiori Design System Implementation
 * Smart Code: HERA.RETAIL.MATRIXITWORLD.FINANCE.ENTERPRISE.v1
 * 
 * Enterprise-grade financial management with Fiori design patterns
 */

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useEntities, useEntity, useUpsertEntity, useDeleteEntity } from '@/lib/hera-react-provider'
import { brandingEngine } from '@/lib/platform/branding-engine'
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calculator,
  FileText,
  Receipt,
  CreditCard,
  Building2,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Percent,
  Target,
  Award,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  RefreshCw,
  Settings,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Bell,
  X,
  Users,
  Package,
  ShoppingCart
} from 'lucide-react'

// Enterprise interfaces following Fiori standards
interface FinancialMetric {
  id: string
  title: string
  value: string
  target?: string
  change: string
  trend: 'up' | 'down' | 'stable'
  icon: React.ComponentType<any>
  color: string
  status: 'good' | 'warning' | 'critical'
  category: 'revenue' | 'profit' | 'expenses' | 'compliance'
  period: string
}

interface BranchFinancials {
  id: string
  branchName: string
  revenue: number
  profit: number
  margin: number
  expenses: number
  rebates: number
  growth: string
  status: 'excellent' | 'good' | 'average' | 'poor'
  location: string
}

interface ComplianceItem {
  id: string
  type: string
  description: string
  dueDate: string
  status: 'completed' | 'pending' | 'overdue' | 'upcoming'
  amount: number
  branch: string
  priority: 'high' | 'medium' | 'low'
}

const ENTITY_TYPE = 'FINANCIAL_RECORD'
const SMART_CODE_BASE = 'HERA.RETAIL.FINANCE.RECORD'

export default function MatrixITWorldFinanceEnterprise() {
  const router = useRouter()
  const { user, organization, isAuthenticated, contextLoading } = useHERAAuth()
  const [selectedView, setSelectedView] = useState<'overview' | 'branches' | 'compliance' | 'rebates'>('overview')
  const [selectedBranch, setSelectedBranch] = useState('all')
  const [refreshing, setRefreshing] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<FinancialMetric | null>(null)
  const [showMetricDetail, setShowMetricDetail] = useState(false)

  // Authentication check
  useEffect(() => {
    if (!contextLoading && !isAuthenticated) {
      router.push('/retail1/matrixitworld/login')
    }
  }, [isAuthenticated, contextLoading, router])

  // HERA Entity hooks
  const {
    entities: financialRecords,
    loading: recordsLoading,
    error: recordsError,
    refetch: refetchRecords
  } = useEntities({
    entityType: ENTITY_TYPE,
    organizationId: organization?.id,
    includeDeleted: false
  })

  // Initialize branding
  useEffect(() => {
    if (organization?.id) {
      brandingEngine.initializeBranding(organization.id)
    }
  }, [organization?.id])

  // Financial KPIs across all branches - Enhanced with more metrics
  const financialMetrics: FinancialMetric[] = [
    {
      id: 'total_revenue',
      title: 'Total Revenue',
      value: '₹84.2L',
      target: '₹90L',
      change: '+18.5%',
      trend: 'up',
      icon: DollarSign,
      color: '#10b981',
      status: 'good',
      category: 'revenue',
      period: 'This Month'
    },
    {
      id: 'gross_profit',
      title: 'Gross Profit',
      value: '₹16.8L',
      target: '₹18L',
      change: '+22.1%',
      trend: 'up',
      icon: TrendingUp,
      color: '#3b82f6',
      status: 'good',
      category: 'profit',
      period: 'Margin: 20%'
    },
    {
      id: 'operating_expenses',
      title: 'Operating Expenses',
      value: '₹8.9L',
      target: '₹8.5L',
      change: '+5.3%',
      trend: 'up',
      icon: Receipt,
      color: '#f59e0b',
      status: 'warning',
      category: 'expenses',
      period: 'All Branches'
    },
    {
      id: 'net_profit',
      title: 'Net Profit',
      value: '₹7.9L',
      target: '₹9.5L',
      change: '+15.8%',
      trend: 'up',
      icon: Target,
      color: '#8b5cf6',
      status: 'good',
      category: 'profit',
      period: 'After Tax'
    },
    {
      id: 'rebates_earned',
      title: 'Rebates Earned',
      value: '₹2.4L',
      target: '₹2.8L',
      change: '+35.2%',
      trend: 'up',
      icon: Percent,
      color: '#ec4899',
      status: 'good',
      category: 'revenue',
      period: 'From Suppliers'
    },
    {
      id: 'cash_flow',
      title: 'Cash Flow',
      value: '₹12.3L',
      target: '₹15L',
      change: '+8.7%',
      trend: 'up',
      icon: CreditCard,
      color: '#06b6d4',
      status: 'good',
      category: 'revenue',
      period: 'Operating CF'
    }
  ]

  // Branch-wise financial performance - Enhanced
  const branchFinancials: BranchFinancials[] = [
    {
      id: '1',
      branchName: 'Kochi Main',
      revenue: 3210000,
      profit: 680000,
      margin: 21.2,
      expenses: 2530000,
      rebates: 90000,
      growth: '+24.3%',
      status: 'excellent',
      location: 'Kochi, Kerala'
    },
    {
      id: '2',
      branchName: 'Trivandrum Main',
      revenue: 2850000,
      profit: 540000,
      margin: 18.9,
      expenses: 2310000,
      rebates: 70000,
      growth: '+16.8%',
      status: 'good',
      location: 'Trivandrum, Kerala'
    },
    {
      id: '3',
      branchName: 'Kozhikode',
      revenue: 1520000,
      profit: 290000,
      margin: 19.1,
      expenses: 1230000,
      rebates: 50000,
      growth: '+12.4%',
      status: 'good',
      location: 'Kozhikode, Kerala'
    },
    {
      id: '4',
      branchName: 'Thrissur',
      revenue: 480000,
      profit: 90000,
      margin: 18.8,
      expenses: 390000,
      rebates: 10000,
      growth: '+8.1%',
      status: 'average',
      location: 'Thrissur, Kerala'
    }
  ]

  // Compliance tracking - Enhanced
  const complianceItems: ComplianceItem[] = [
    {
      id: '1',
      type: 'GST Return (GSTR-1)',
      description: 'Monthly GST filing for all branches',
      dueDate: '2024-11-11',
      status: 'pending',
      amount: 1280000,
      branch: 'All Branches',
      priority: 'high'
    },
    {
      id: '2',
      type: 'Kerala VAT',
      description: 'State VAT payment',
      dueDate: '2024-11-15',
      status: 'completed',
      amount: 210000,
      branch: 'Kochi Main',
      priority: 'medium'
    },
    {
      id: '3',
      type: 'TDS Return',
      description: 'Tax deducted at source filing',
      dueDate: '2024-11-07',
      status: 'overdue',
      amount: 45200,
      branch: 'Trivandrum Main',
      priority: 'high'
    },
    {
      id: '4',
      type: 'Professional Tax',
      description: 'Monthly professional tax payment',
      dueDate: '2024-11-30',
      status: 'upcoming',
      amount: 15600,
      branch: 'All Branches',
      priority: 'low'
    }
  ]

  const handleRefresh = async () => {
    setRefreshing(true)
    await refetchRecords()
    setTimeout(() => setRefreshing(false), 1000)
  }

  const handleMetricClick = (metric: FinancialMetric) => {
    setSelectedMetric(metric)
    setShowMetricDetail(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'good':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'average':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'poor':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatCurrency = (amount: number) => {
    return `₹${(amount / 100000).toFixed(1)}L`
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (contextLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Finance Management...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SAP Fiori Header Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Breadcrumb */}
            <div className="flex items-center space-x-4">
              <Link href="/retail1/matrixitworld/dashboard" className="text-blue-600 hover:text-blue-700">
                Dashboard
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-gray-900">Finance Management</span>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <Link href="/retail1/matrixitworld/dashboard">
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Finance Management</h1>
                <p className="text-gray-600">Financial analytics and compliance across all branches</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>New Record</span>
              </button>
            </div>
          </div>
        </div>

        {/* View Selector */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'branches', label: 'Branch Performance', icon: Building2 },
            { key: 'compliance', label: 'Compliance', icon: FileText },
            { key: 'rebates', label: 'Rebates', icon: Percent }
          ].map((view) => {
            const Icon = view.icon
            return (
              <button
                key={view.key}
                onClick={() => setSelectedView(view.key as any)}
                className={`px-4 py-2 text-sm rounded-lg whitespace-nowrap transition-colors flex items-center space-x-2 ${
                  selectedView === view.key
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{view.label}</span>
              </button>
            )
          })}
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {financialMetrics.map((metric) => (
            <div
              key={metric.id}
              className="bg-white rounded-lg border p-6 hover:shadow-md transition-all cursor-pointer"
              onClick={() => handleMetricClick(metric)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${metric.color}15`, color: metric.color }}>
                    <metric.icon className="w-6 h-6" />
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    metric.status === 'good' ? 'bg-green-500' :
                    metric.status === 'warning' ? 'bg-orange-500' : 'bg-red-500'
                  }`} />
                </div>
                <span className={`text-xs px-2 py-1 font-semibold rounded-full ${
                  metric.trend === 'up' ? 'bg-green-100 text-green-700' : 
                  metric.trend === 'down' ? 'bg-red-100 text-red-700' : 
                  'bg-gray-100 text-gray-700'
                }`}>
                  {metric.change}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-1">{metric.title}</h4>
                <div className="flex items-baseline space-x-2 mb-1">
                  <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
                  {metric.target && (
                    <span className="text-sm text-gray-500">/ {metric.target}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{metric.period}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Content based on selected view */}
        {selectedView === 'overview' && (
          <div className="space-y-8">
            {/* Branch Performance Overview */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Branch Performance Summary</h3>
              <div className="space-y-4">
                {branchFinancials.slice(0, 4).map((branch) => (
                  <div key={branch.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{branch.branchName}</h4>
                        <p className="text-sm text-gray-500">{branch.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-green-600">{formatCurrency(branch.revenue)}</div>
                        <div className="text-gray-500">Revenue</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-blue-600">{formatCurrency(branch.profit)}</div>
                        <div className="text-gray-500">Profit</div>
                      </div>
                      <div className="text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(branch.status)}`}>
                          {branch.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { title: 'Rebate Report', description: 'Generate supplier rebates', icon: FileText, color: 'bg-green-500' },
                  { title: 'GL Journals', description: 'View journal entries', icon: Calculator, color: 'bg-blue-500' },
                  { title: 'GST Filing', description: 'Tax compliance', icon: Receipt, color: 'bg-purple-500' },
                  { title: 'Branch P&L', description: 'Profit & loss reports', icon: Building2, color: 'bg-orange-500' }
                ].map((action, index) => (
                  <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                    <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-3`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">{action.title}</h4>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedView === 'branches' && (
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Branch Financial Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {branchFinancials.map((branch) => (
                    <tr key={branch.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <Building2 className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{branch.branchName}</div>
                            <div className="text-sm text-gray-500">{branch.location}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {formatCurrency(branch.revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                        {formatCurrency(branch.profit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {branch.margin.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {branch.growth}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(branch.status)}`}>
                          {branch.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedView === 'compliance' && (
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Kerala Statutory Compliance</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {complianceItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          item.status === 'completed' ? 'bg-green-100' :
                          item.status === 'overdue' ? 'bg-red-100' :
                          item.status === 'pending' ? 'bg-orange-100' : 'bg-blue-100'
                        }`}>
                          <FileText className={`w-5 h-5 ${
                            item.status === 'completed' ? 'text-green-600' :
                            item.status === 'overdue' ? 'text-red-600' :
                            item.status === 'pending' ? 'text-orange-600' : 'text-blue-600'
                          }`} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{item.type}</h4>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityBadge(item.priority)}`}>
                          {item.priority}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Amount:</span>
                        <div className="font-semibold">{formatCurrency(item.amount)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Due Date:</span>
                        <div className="font-semibold text-orange-600">{item.dueDate}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Branch:</span>
                        <div className="font-semibold text-gray-700">{item.branch}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedView === 'rebates' && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplier Rebate Tracking</h3>
            <div className="text-center py-12">
              <Percent className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Rebate Management</h4>
              <p className="text-gray-600 mb-6">Track and manage supplier rebates across all branches</p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Setup Rebate Tracking
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Metric Detail Modal */}
      {showMetricDetail && selectedMetric && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Financial Metric Details</h2>
                <button
                  onClick={() => setShowMetricDetail(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="p-4 rounded-lg" style={{ backgroundColor: `${selectedMetric.color}15`, color: selectedMetric.color }}>
                    <selectedMetric.icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedMetric.title}</h3>
                    <p className="text-gray-600">{selectedMetric.period}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Current Performance</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Value:</span>
                        <span className="font-bold text-2xl">{selectedMetric.value}</span>
                      </div>
                      {selectedMetric.target && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Target:</span>
                          <span className="font-medium">{selectedMetric.target}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Change:</span>
                        <span className={`font-medium ${
                          selectedMetric.trend === 'up' ? 'text-green-600' : 
                          selectedMetric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {selectedMetric.change}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                          selectedMetric.status === 'good' ? 'bg-green-100 text-green-800 border-green-200' :
                          selectedMetric.status === 'warning' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                          'bg-red-100 text-red-800 border-red-200'
                        }`}>
                          {selectedMetric.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Category</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium capitalize">{selectedMetric.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Trend:</span>
                        <span className="font-medium capitalize">{selectedMetric.trend}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    View Details
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Export Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}