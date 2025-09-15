'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  FileText,
  Download,
  Calendar,
  Filter,
  Search,
  Play,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Send,
  Printer,
  Mail,
  BarChart3,
  PieChart,
  TrendingUp,
  DollarSign,
  Receipt,
  CreditCard,
  Calculator,
  Building2,
  FileSpreadsheet,
  FileBarChart,
  FilePieChart,
  RefreshCw,
  ChevronRight,
  Info
} from 'lucide-react'

// India Vision Organization ID
const KERALA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001'

interface Report {
  id: string
  name: string
  category: string
  description: string
  frequency: string
  lastRun?: string
  nextRun?: string
  status: 'ready' | 'scheduled' | 'processing' | 'error'
  format: string[]
  size?: string
  icon: React.ElementType
}

interface ScheduledReport {
  id: string
  reportName: string
  frequency: string
  recipients: string[]
  nextRun: string
  lastRun: string
  status: 'active' | 'paused'
}

export default function FinanceReportsPage() {
  const [activeTab, setActiveTab] = useState<'standard' | 'custom' | 'scheduled'>('standard')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Standard Reports
  const [standardReports] = useState<Report[]>([
    {
      id: '1',
      name: 'Profit & Loss Statement',
      category: 'Financial Statements',
      description: 'Comprehensive income statement with revenue, expenses, and net profit',
      frequency: 'Monthly',
      lastRun: '2024-06-15',
      status: 'ready',
      format: ['PDF', 'Excel', 'CSV'],
      size: '2.5 MB',
      icon: FileBarChart
    },
    {
      id: '2',
      name: 'Balance Sheet',
      category: 'Financial Statements',
      description: 'Statement of financial position showing assets, liabilities, and equity',
      frequency: 'Monthly',
      lastRun: '2024-06-15',
      status: 'ready',
      format: ['PDF', 'Excel'],
      size: '1.8 MB',
      icon: FileSpreadsheet
    },
    {
      id: '3',
      name: 'Cash Flow Statement',
      category: 'Financial Statements',
      description: 'Cash inflows and outflows from operating, investing, and financing activities',
      frequency: 'Monthly',
      lastRun: '2024-06-15',
      status: 'ready',
      format: ['PDF', 'Excel'],
      size: '1.5 MB',
      icon: DollarSign
    },
    {
      id: '4',
      name: 'Trial Balance',
      category: 'Accounting Reports',
      description: 'List of all general ledger accounts with debit and credit balances',
      frequency: 'Daily',
      lastRun: '2024-06-15',
      status: 'ready',
      format: ['Excel', 'CSV'],
      size: '850 KB',
      icon: Calculator
    },
    {
      id: '5',
      name: 'Accounts Receivable Aging',
      category: 'Receivables',
      description: 'Detailed aging analysis of customer outstanding balances',
      frequency: 'Weekly',
      lastRun: '2024-06-14',
      status: 'ready',
      format: ['PDF', 'Excel'],
      size: '1.2 MB',
      icon: Receipt
    },
    {
      id: '6',
      name: 'Accounts Payable Aging',
      category: 'Payables',
      description: 'Vendor payment aging and outstanding liability analysis',
      frequency: 'Weekly',
      lastRun: '2024-06-14',
      status: 'ready',
      format: ['PDF', 'Excel'],
      size: '980 KB',
      icon: CreditCard
    },
    {
      id: '7',
      name: 'Budget vs Actual',
      category: 'Management Reports',
      description: 'Comprehensive budget variance analysis by department and category',
      frequency: 'Monthly',
      lastRun: '2024-06-10',
      status: 'processing',
      format: ['PDF', 'Excel'],
      icon: BarChart3
    },
    {
      id: '8',
      name: 'Profitability Analysis',
      category: 'Management Reports',
      description: 'Product, customer, and regional profitability metrics',
      frequency: 'Monthly',
      lastRun: '2024-06-10',
      status: 'scheduled',
      nextRun: '2024-07-01',
      format: ['PDF', 'Excel'],
      icon: PieChart
    }
  ])

  // Custom Reports
  const [customReports] = useState<Report[]>([
    {
      id: '9',
      name: 'Executive Dashboard',
      category: 'Custom',
      description: 'High-level KPIs and financial metrics for leadership',
      frequency: 'On-demand',
      lastRun: '2024-06-15',
      status: 'ready',
      format: ['PDF'],
      size: '3.2 MB',
      icon: TrendingUp
    },
    {
      id: '10',
      name: 'Department Cost Analysis',
      category: 'Custom',
      description: 'Detailed cost breakdown by department with trend analysis',
      frequency: 'On-demand',
      lastRun: '2024-06-12',
      status: 'ready',
      format: ['Excel'],
      size: '1.5 MB',
      icon: Building2
    }
  ])

  // Scheduled Reports
  const [scheduledReports] = useState<ScheduledReport[]>([
    {
      id: '1',
      reportName: 'Monthly Financial Package',
      frequency: 'Monthly - 1st of month',
      recipients: ['cfo@keralavision.com', 'board@keralavision.com'],
      nextRun: '2024-07-01',
      lastRun: '2024-06-01',
      status: 'active'
    },
    {
      id: '2',
      reportName: 'Weekly Cash Position',
      frequency: 'Weekly - Monday 8:00 AM',
      recipients: ['finance@keralavision.com', 'treasury@keralavision.com'],
      nextRun: '2024-06-17',
      lastRun: '2024-06-10',
      status: 'active'
    },
    {
      id: '3',
      reportName: 'Daily GL Summary',
      frequency: 'Daily - 6:00 PM',
      recipients: ['accounting@keralavision.com'],
      nextRun: '2024-06-16',
      lastRun: '2024-06-15',
      status: 'active'
    }
  ])

  const supabase = createClientComponentClient()

  const refreshReports = async () => {
    setIsRefreshing(true)
    // Refresh report status
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-emerald-500/20 text-emerald-400'
      case 'scheduled':
        return 'bg-blue-500/20 text-blue-400'
      case 'processing':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'error':
        return 'bg-red-500/20 text-red-400'
      case 'active':
        return 'bg-emerald-500/20 text-emerald-400'
      case 'paused':
        return 'bg-gray-9000/20 text-muted-foreground'
      default:
        return 'bg-gray-9000/20 text-muted-foreground'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Financial Statements':
        return 'from-emerald-500 to-green-600'
      case 'Accounting Reports':
        return 'from-[#00DDFF] to-[#0049B7]'
      case 'Receivables':
        return 'from-purple-500 to-pink-500'
      case 'Payables':
        return 'from-red-500 to-rose-600'
      case 'Management Reports':
        return 'from-[#fff685] to-amber-500'
      case 'Custom':
        return 'from-indigo-500 to-purple-600'
      default:
        return 'from-gray-9000 to-gray-600'
    }
  }

  const allReports = [...standardReports, ...customReports]
  const filteredReports = allReports.filter(report => {
    const matchesSearch =
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-white/80 bg-clip-text text-transparent">
            Financial Reports
          </h1>
          <p className="text-foreground/60 mt-1">
            Generate and schedule financial reports and statements
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={refreshReports}
            className={`flex items-center space-x-2 px-4 py-2 bg-background/5 backdrop-blur-xl border border-border/10 rounded-lg text-foreground hover:bg-background/10 transition-all duration-300 ${isRefreshing ? 'animate-pulse' : ''}`}
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-foreground font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300">
            <FileText className="h-5 w-5" />
            <span>Create Report</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-background/5 backdrop-blur-xl p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('standard')}
          className={`px-4 py-2 rounded-md font-medium transition-all duration-300 ${
            activeTab === 'standard'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-foreground'
              : 'text-foreground/60 hover:text-foreground'
          }`}
        >
          Standard Reports
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`px-4 py-2 rounded-md font-medium transition-all duration-300 ${
            activeTab === 'custom'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-foreground'
              : 'text-foreground/60 hover:text-foreground'
          }`}
        >
          Custom Reports
        </button>
        <button
          onClick={() => setActiveTab('scheduled')}
          className={`px-4 py-2 rounded-md font-medium transition-all duration-300 ${
            activeTab === 'scheduled'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-foreground'
              : 'text-foreground/60 hover:text-foreground'
          }`}
        >
          Scheduled Reports
        </button>
      </div>

      {(activeTab === 'standard' || activeTab === 'custom') && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-foreground/40" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background/5 backdrop-blur-xl border border-border/10 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-4 py-3 bg-background/5 backdrop-blur-xl border border-border/10 rounded-lg text-foreground focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="all">All Categories</option>
              <option value="Financial Statements">Financial Statements</option>
              <option value="Accounting Reports">Accounting Reports</option>
              <option value="Receivables">Receivables</option>
              <option value="Payables">Payables</option>
              <option value="Management Reports">Management Reports</option>
              <option value="Custom">Custom Reports</option>
            </select>

            <button className="flex items-center space-x-2 px-4 py-3 bg-background/5 backdrop-blur-xl border border-border/10 rounded-lg text-foreground hover:bg-background/10 transition-colors">
              <Calendar className="h-5 w-5" />
              <span>Date Range</span>
            </button>
          </div>

          {/* Reports Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredReports
              .filter(report =>
                activeTab === 'standard'
                  ? report.category !== 'Custom'
                  : report.category === 'Custom'
              )
              .map(report => {
                const Icon = report.icon
                return (
                  <div key={report.id} className="relative group">
                    <div
                      className={`absolute -inset-0.5 bg-gradient-to-r ${getCategoryColor(report.category)} rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300`}
                    />
                    <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4">
                          <div
                            className={`p-3 rounded-xl bg-gradient-to-br ${getCategoryColor(report.category)}`}
                          >
                            <Icon className="h-6 w-6 text-foreground" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">{report.name}</h3>
                            <p className="text-sm text-foreground/60 mt-1">{report.description}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-foreground/60">Category</span>
                          <span className="text-foreground">{report.category}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-foreground/60">Frequency</span>
                          <span className="text-foreground">{report.frequency}</span>
                        </div>
                        {report.lastRun && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-foreground/60">Last Run</span>
                            <span className="text-foreground">
                              {new Date(report.lastRun).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {report.nextRun && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-foreground/60">Next Run</span>
                            <span className="text-foreground">
                              {new Date(report.nextRun).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-foreground/60">Status</span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}
                          >
                            {report.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border/10">
                        <div className="flex items-center space-x-2">
                          {report.format.map(format => (
                            <span
                              key={format}
                              className="px-2 py-1 rounded text-xs bg-background/10 text-foreground/60"
                            >
                              {format}
                            </span>
                          ))}
                          {report.size && (
                            <span className="text-xs text-foreground/40">{report.size}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {report.status === 'ready' && (
                            <>
                              <button className="p-2 text-foreground/40 hover:text-foreground transition-colors">
                                <Eye className="h-4 w-4" />
                              </button>
                              <button className="p-2 text-foreground/40 hover:text-foreground transition-colors">
                                <Download className="h-4 w-4" />
                              </button>
                              <button className="p-2 text-foreground/40 hover:text-foreground transition-colors">
                                <Send className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {report.status === 'scheduled' && (
                            <button className="flex items-center space-x-2 px-3 py-1.5 bg-background/10 rounded-lg text-foreground hover:bg-background/20 transition-colors">
                              <Play className="h-4 w-4" />
                              <span className="text-sm">Run Now</span>
                            </button>
                          )}
                          {report.status === 'processing' && (
                            <div className="flex items-center space-x-2 text-yellow-400">
                              <Clock className="h-4 w-4 animate-spin" />
                              <span className="text-sm">Processing...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </>
      )}

      {activeTab === 'scheduled' && (
        <>
          {/* Scheduled Reports Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-indigo-400" />
              <p className="text-foreground/80">Manage automated report delivery schedules</p>
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 bg-background/5 backdrop-blur-xl border border-border/10 rounded-lg text-foreground hover:bg-background/10 transition-colors">
              <Calendar className="h-5 w-5" />
              <span>New Schedule</span>
            </button>
          </div>

          {/* Scheduled Reports List */}
          <div className="space-y-4">
            {scheduledReports.map(schedule => (
              <div key={schedule.id} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <FileText className="h-5 w-5 text-indigo-400" />
                        <h3 className="text-lg font-semibold text-foreground">{schedule.reportName}</h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(schedule.status)}`}
                        >
                          {schedule.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-foreground/60 mb-1">Frequency</p>
                          <p className="text-sm text-foreground">{schedule.frequency}</p>
                        </div>
                        <div>
                          <p className="text-xs text-foreground/60 mb-1">Next Run</p>
                          <p className="text-sm text-foreground">
                            {new Date(schedule.nextRun).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-foreground/60 mb-1">Last Run</p>
                          <p className="text-sm text-foreground">
                            {new Date(schedule.lastRun).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-foreground/60 mb-1">Recipients</p>
                          <p className="text-sm text-foreground">{schedule.recipients.length} emails</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        {schedule.recipients.map((email, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2 text-xs text-foreground/60"
                          >
                            <Mail className="h-3 w-3" />
                            <span>{email}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button className="p-2 text-foreground/40 hover:text-foreground transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-foreground/40 hover:text-foreground transition-colors">
                        <Play className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-foreground/40 hover:text-foreground transition-colors">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Info Box */}
          <div className="relative group mt-6">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                  <Info className="h-6 w-6 text-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Report Scheduling Tips</h3>
                  <ul className="space-y-2 text-sm text-foreground/60">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5" />
                      <span>
                        Schedule monthly reports after month-end close (typically 5th business day)
                      </span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5" />
                      <span>
                        Set up automated distribution lists for different stakeholder groups
                      </span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5" />
                      <span>
                        Use PDF format for external stakeholders, Excel for internal analysis
                      </span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5" />
                      <span>Enable report archiving for audit trail and historical reference</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
