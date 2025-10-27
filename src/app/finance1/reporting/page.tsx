'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { SapNavbar } from '@/components/sap/SapNavbar'
import { 
  FileText, Plus, Search, Filter, Download, Upload, ArrowLeft,
  RefreshCw, Settings, Eye, Edit, MoreHorizontal, TrendingUp,
  TrendingDown, Target, AlertTriangle, CheckCircle, Calculator,
  BarChart3, PieChart, Clock, DollarSign, Calendar, 
  Star, Package, Factory, ArrowRight, 
  ChevronDown, ChevronRight, Maximize2, CircleDollarSign,
  Percent, CalendarDays, UserCheck, ClipboardList, Banknote,
  Building2, Users, Activity, MapPin, Award, Database,
  Layers, Zap, Grid, Table, Monitor, Briefcase, Shield,
  Globe, Bookmark, LineChart, Gauge, Box,
  ArrowUpRight, Bell, Hash, Timer, Workflow, Wrench,
  Brain, Bot, Sparkles, Lightbulb, Radar, Microscope,
  ArrowUpDown, BarChart2, Mail, Send, Archive, // TrendingUpDown not in this lucide version
  FilePlus, FileSpreadsheet, Presentation, Image,
  CheckSquare, XCircle, Pause, Play, RotateCcw, Copy
} from 'lucide-react'

interface Report {
  id: string
  report_code: string
  report_name: string
  description: string
  report_category: 'financial_statements' | 'management' | 'regulatory' | 'operational' | 'analytical'
  report_type: 'balance_sheet' | 'income_statement' | 'cash_flow' | 'trial_balance' | 'budget_variance' | 'custom'
  output_format: 'pdf' | 'excel' | 'word' | 'powerpoint' | 'html'
  data_source: string
  parameters: ReportParameter[]
  schedule: ReportSchedule | null
  last_generated: string
  generation_status: 'success' | 'failed' | 'pending' | 'running'
  file_size: number
  download_count: number
  created_by: string
  created_at: string
  is_template: boolean
  is_public: boolean
  tags: string[]
}

interface ReportParameter {
  id: string
  parameter_name: string
  parameter_type: 'date' | 'period' | 'entity' | 'currency' | 'boolean' | 'text'
  is_required: boolean
  default_value?: any
  description: string
}

interface ReportSchedule {
  id: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'custom'
  next_run: string
  recipients: string[]
  delivery_method: 'email' | 'shared_folder' | 'api' | 'portal'
  is_active: boolean
  last_run?: string
  created_by: string
}

interface ReportTemplate {
  id: string
  template_name: string
  template_category: 'financial' | 'management' | 'regulatory' | 'operational'
  description: string
  preview_image?: string
  sections: TemplateSection[]
  formatting_rules: any
  compliance_standards: string[]
  usage_count: number
  rating: number
  created_by: string
  is_certified: boolean
}

interface TemplateSection {
  id: string
  section_name: string
  section_type: 'header' | 'table' | 'chart' | 'text' | 'footer'
  data_binding: string
  formatting: any
  position: number
}

interface ReportExecution {
  id: string
  report_id: string
  execution_date: string
  parameters_used: any
  execution_time: number
  status: 'completed' | 'failed' | 'running' | 'queued'
  file_path?: string
  file_size?: number
  error_message?: string
  triggered_by: 'manual' | 'scheduled' | 'api'
  executed_by: string
}

interface DataSource {
  id: string
  source_name: string
  source_type: 'database' | 'api' | 'file' | 'web_service'
  connection_string: string
  schema_info: any
  last_updated: string
  is_active: boolean
  refresh_frequency: number
  data_quality_score: number
  created_by: string
}

interface ReportingMetrics {
  total_reports: number
  active_schedules: number
  reports_generated_today: number
  average_generation_time: number
  success_rate: number
  total_downloads: number
  storage_used: number
  data_sources_count: number
}

// Management Reporting (FI-REPORTING) Module
export default function ManagementReportingPage() {
  const { user, organization, isAuthenticated, contextLoading } = useHERAAuth()
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<Report[]>([])
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [executions, setExecutions] = useState<ReportExecution[]>([])
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [metrics, setMetrics] = useState<ReportingMetrics | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'templates' | 'schedules' | 'executions' | 'data_sources' | 'builder'>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)

  // Mock data for demonstration
  useEffect(() => {
    const loadReportingData = async () => {
      if (!organization?.id) return
      
      setLoading(true)
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Mock reports
        const mockReports: Report[] = [
          {
            id: '1',
            report_code: 'RPT-BS-001',
            report_name: 'Balance Sheet - Monthly',
            description: 'Comprehensive balance sheet with comparative analysis',
            report_category: 'financial_statements',
            report_type: 'balance_sheet',
            output_format: 'pdf',
            data_source: 'GL_ACCOUNTS',
            parameters: [
              {
                id: '1',
                parameter_name: 'reporting_date',
                parameter_type: 'date',
                is_required: true,
                default_value: '2024-01-31',
                description: 'Balance sheet as of date'
              },
              {
                id: '2',
                parameter_name: 'comparison_period',
                parameter_type: 'period',
                is_required: false,
                default_value: 'previous_year',
                description: 'Comparison period for variance analysis'
              }
            ],
            schedule: {
              id: '1',
              frequency: 'monthly',
              next_run: '2024-02-01T08:00:00Z',
              recipients: ['cfo@company.com', 'controller@company.com'],
              delivery_method: 'email',
              is_active: true,
              last_run: '2024-01-01T08:00:00Z',
              created_by: 'finance_admin'
            },
            last_generated: '2024-01-25T14:30:00Z',
            generation_status: 'success',
            file_size: 2.4,
            download_count: 47,
            created_by: 'finance_team',
            created_at: '2023-06-01T10:00:00Z',
            is_template: false,
            is_public: true,
            tags: ['financial', 'statutory', 'monthly']
          },
          {
            id: '2',
            report_code: 'RPT-PL-001',
            report_name: 'Profit & Loss Statement',
            description: 'Detailed P&L with cost center breakdown',
            report_category: 'financial_statements',
            report_type: 'income_statement',
            output_format: 'excel',
            data_source: 'GL_ACCOUNTS',
            parameters: [
              {
                id: '3',
                parameter_name: 'period_from',
                parameter_type: 'date',
                is_required: true,
                description: 'Period start date'
              },
              {
                id: '4',
                parameter_name: 'period_to',
                parameter_type: 'date',
                is_required: true,
                description: 'Period end date'
              },
              {
                id: '5',
                parameter_name: 'cost_center',
                parameter_type: 'entity',
                is_required: false,
                description: 'Filter by cost center'
              }
            ],
            schedule: {
              id: '2',
              frequency: 'monthly',
              next_run: '2024-02-01T09:00:00Z',
              recipients: ['management@company.com'],
              delivery_method: 'email',
              is_active: true,
              created_by: 'finance_admin'
            },
            last_generated: '2024-01-24T16:15:00Z',
            generation_status: 'success',
            file_size: 3.1,
            download_count: 62,
            created_by: 'finance_team',
            created_at: '2023-06-15T11:30:00Z',
            is_template: false,
            is_public: true,
            tags: ['financial', 'management', 'monthly']
          },
          {
            id: '3',
            report_code: 'RPT-CF-001',
            report_name: 'Cash Flow Statement',
            description: 'Statement of cash flows with operating, investing, and financing activities',
            report_category: 'financial_statements',
            report_type: 'cash_flow',
            output_format: 'pdf',
            data_source: 'CASH_TRANSACTIONS',
            parameters: [
              {
                id: '6',
                parameter_name: 'fiscal_year',
                parameter_type: 'period',
                is_required: true,
                default_value: '2024',
                description: 'Fiscal year for cash flow analysis'
              }
            ],
            schedule: {
              id: '3',
              frequency: 'quarterly',
              next_run: '2024-04-01T10:00:00Z',
              recipients: ['investors@company.com', 'board@company.com'],
              delivery_method: 'email',
              is_active: true,
              created_by: 'finance_admin'
            },
            last_generated: '2024-01-20T12:45:00Z',
            generation_status: 'success',
            file_size: 1.8,
            download_count: 28,
            created_by: 'finance_team',
            created_at: '2023-07-01T09:15:00Z',
            is_template: false,
            is_public: false,
            tags: ['financial', 'cash_flow', 'quarterly']
          },
          {
            id: '4',
            report_code: 'RPT-BV-001',
            report_name: 'Budget Variance Analysis',
            description: 'Detailed budget vs actual variance analysis with commentary',
            report_category: 'management',
            report_type: 'budget_variance',
            output_format: 'powerpoint',
            data_source: 'BUDGET_ACTUALS',
            parameters: [
              {
                id: '7',
                parameter_name: 'analysis_period',
                parameter_type: 'period',
                is_required: true,
                description: 'Period for variance analysis'
              },
              {
                id: '8',
                parameter_name: 'variance_threshold',
                parameter_type: 'text',
                is_required: false,
                default_value: '5',
                description: 'Variance threshold percentage'
              }
            ],
            schedule: null,
            last_generated: '2024-01-22T11:20:00Z',
            generation_status: 'success',
            file_size: 4.7,
            download_count: 35,
            created_by: 'budget_analyst',
            created_at: '2023-08-10T14:00:00Z',
            is_template: false,
            is_public: true,
            tags: ['management', 'budget', 'variance']
          },
          {
            id: '5',
            report_code: 'RPT-TB-001',
            report_name: 'Trial Balance Report',
            description: 'Complete trial balance with aging and reconciliation status',
            report_category: 'operational',
            report_type: 'trial_balance',
            output_format: 'excel',
            data_source: 'GL_ACCOUNTS',
            parameters: [
              {
                id: '9',
                parameter_name: 'as_of_date',
                parameter_type: 'date',
                is_required: true,
                description: 'Trial balance as of date'
              },
              {
                id: '10',
                parameter_name: 'include_zero_balances',
                parameter_type: 'boolean',
                is_required: false,
                default_value: false,
                description: 'Include accounts with zero balances'
              }
            ],
            schedule: {
              id: '4',
              frequency: 'daily',
              next_run: '2024-01-26T07:00:00Z',
              recipients: ['accounting@company.com'],
              delivery_method: 'shared_folder',
              is_active: true,
              created_by: 'accounting_manager'
            },
            last_generated: '2024-01-25T07:05:00Z',
            generation_status: 'success',
            file_size: 5.2,
            download_count: 156,
            created_by: 'accounting_team',
            created_at: '2023-05-20T08:45:00Z',
            is_template: false,
            is_public: false,
            tags: ['operational', 'trial_balance', 'daily']
          }
        ]

        // Mock report templates
        const mockTemplates: ReportTemplate[] = [
          {
            id: '1',
            template_name: 'Standard Balance Sheet',
            template_category: 'financial',
            description: 'GAAP-compliant balance sheet template with standard formatting',
            sections: [
              {
                id: '1',
                section_name: 'Assets',
                section_type: 'table',
                data_binding: 'asset_accounts',
                formatting: { groupBy: 'account_type' },
                position: 1
              },
              {
                id: '2',
                section_name: 'Liabilities',
                section_type: 'table',
                data_binding: 'liability_accounts',
                formatting: { groupBy: 'account_type' },
                position: 2
              },
              {
                id: '3',
                section_name: 'Equity',
                section_type: 'table',
                data_binding: 'equity_accounts',
                formatting: { groupBy: 'account_type' },
                position: 3
              }
            ],
            formatting_rules: {
              currency: 'INR',
              decimal_places: 2,
              thousands_separator: ',',
              negative_format: 'parentheses'
            },
            compliance_standards: ['GAAP', 'IFRS'],
            usage_count: 23,
            rating: 4.8,
            created_by: 'template_team',
            is_certified: true
          },
          {
            id: '2',
            template_name: 'Executive Dashboard',
            template_category: 'management',
            description: 'High-level KPI dashboard for executive reporting',
            sections: [
              {
                id: '4',
                section_name: 'Key Metrics',
                section_type: 'chart',
                data_binding: 'kpi_metrics',
                formatting: { chart_type: 'gauge' },
                position: 1
              },
              {
                id: '5',
                section_name: 'Trend Analysis',
                section_type: 'chart',
                data_binding: 'trend_data',
                formatting: { chart_type: 'line' },
                position: 2
              }
            ],
            formatting_rules: {
              theme: 'executive',
              color_scheme: 'blue',
              font: 'Arial'
            },
            compliance_standards: [],
            usage_count: 41,
            rating: 4.6,
            created_by: 'bi_team',
            is_certified: true
          }
        ]

        // Mock report executions
        const mockExecutions: ReportExecution[] = [
          {
            id: '1',
            report_id: '1',
            execution_date: '2024-01-25T14:30:00Z',
            parameters_used: { reporting_date: '2024-01-31', comparison_period: 'previous_year' },
            execution_time: 45.2,
            status: 'completed',
            file_path: '/reports/balance_sheet_202401.pdf',
            file_size: 2.4,
            triggered_by: 'scheduled',
            executed_by: 'system'
          },
          {
            id: '2',
            report_id: '2',
            execution_date: '2024-01-25T16:15:00Z',
            parameters_used: { period_from: '2024-01-01', period_to: '2024-01-31' },
            execution_time: 67.8,
            status: 'completed',
            file_path: '/reports/pl_statement_202401.xlsx',
            file_size: 3.1,
            triggered_by: 'manual',
            executed_by: 'john.smith'
          },
          {
            id: '3',
            report_id: '4',
            execution_date: '2024-01-25T18:20:00Z',
            parameters_used: { analysis_period: '2024-01', variance_threshold: '5' },
            execution_time: 124.5,
            status: 'running',
            triggered_by: 'manual',
            executed_by: 'sarah.wilson'
          }
        ]

        // Mock data sources
        const mockDataSources: DataSource[] = [
          {
            id: '1',
            source_name: 'General Ledger',
            source_type: 'database',
            connection_string: 'postgresql://localhost:5432/erp',
            schema_info: { tables: ['gl_accounts', 'gl_transactions'], last_sync: '2024-01-25T20:00:00Z' },
            last_updated: '2024-01-25T20:00:00Z',
            is_active: true,
            refresh_frequency: 300,
            data_quality_score: 98.5,
            created_by: 'system_admin'
          },
          {
            id: '2',
            source_name: 'Budget System',
            source_type: 'api',
            connection_string: 'https://api.budgetsystem.com/v1',
            schema_info: { endpoints: ['budgets', 'actuals'], version: 'v1.2' },
            last_updated: '2024-01-25T19:30:00Z',
            is_active: true,
            refresh_frequency: 600,
            data_quality_score: 94.2,
            created_by: 'integration_team'
          },
          {
            id: '3',
            source_name: 'Cash Management',
            source_type: 'database',
            connection_string: 'oracle://finance.company.com:1521/CASH',
            schema_info: { tables: ['cash_positions', 'transactions'], last_sync: '2024-01-25T19:45:00Z' },
            last_updated: '2024-01-25T19:45:00Z',
            is_active: true,
            refresh_frequency: 900,
            data_quality_score: 96.8,
            created_by: 'treasury_team'
          }
        ]

        // Mock metrics
        const mockMetrics: ReportingMetrics = {
          total_reports: 47,
          active_schedules: 12,
          reports_generated_today: 8,
          average_generation_time: 78.5,
          success_rate: 97.3,
          total_downloads: 1247,
          storage_used: 156.7,
          data_sources_count: 3
        }

        setReports(mockReports)
        setTemplates(mockTemplates)
        setExecutions(mockExecutions)
        setDataSources(mockDataSources)
        setMetrics(mockMetrics)
        
      } catch (error) {
        console.error('Error loading reporting data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadReportingData()
  }, [organization?.id])

  // Filter reports based on search and filters
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.report_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.report_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || report.report_category === categoryFilter
    const matchesStatus = statusFilter === 'all' || report.generation_status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Auth Guard
  if (!isAuthenticated) {
    return (
      <div className="sap-font min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access Management Reporting.</p>
        </div>
      </div>
    )
  }

  if (contextLoading) {
    return (
      <div className="sap-font min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading organization context...</p>
        </div>
      </div>
    )
  }

  if (!organization?.id) {
    return (
      <div className="sap-font min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <h2 className="text-xl font-semibold text-red-600 mb-4">No Organization Context</h2>
          <p className="text-gray-600">Unable to determine organization context.</p>
        </div>
      </div>
    )
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Reporting KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Total Reports',
            value: metrics?.total_reports?.toString() || '0',
            subtitle: `${metrics?.active_schedules || 0} scheduled`,
            icon: FileText,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
          },
          {
            title: 'Reports Today',
            value: metrics?.reports_generated_today?.toString() || '0',
            subtitle: `${metrics?.success_rate?.toFixed(1) || '0'}% success rate`,
            icon: Calendar,
            color: 'text-green-600',
            bgColor: 'bg-green-50'
          },
          {
            title: 'Avg Generation Time',
            value: `${metrics?.average_generation_time?.toFixed(1) || '0'}s`,
            subtitle: 'Processing time',
            icon: Clock,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50'
          },
          {
            title: 'Total Downloads',
            value: metrics?.total_downloads?.toLocaleString() || '0',
            subtitle: `${metrics?.storage_used?.toFixed(1) || '0'}MB used`,
            icon: Download,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50'
          }
        ].map((metric, index) => {
          const IconComponent = metric.icon
          return (
            <div key={index} className="bg-white rounded-lg shadow-md border border-gray-300 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-full ${metric.bgColor}`}>
                  <IconComponent className={`w-6 h-6 ${metric.color}`} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">{metric.title}</h3>
              <p className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</p>
              <p className="text-sm text-gray-500">{metric.subtitle}</p>
            </div>
          )
        })}
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Report Categories
          </h3>
          <div className="space-y-4">
            {[
              { category: 'Financial Statements', count: 3, color: 'bg-blue-500', percentage: 60 },
              { category: 'Management Reports', count: 1, color: 'bg-green-500', percentage: 20 },
              { category: 'Operational Reports', count: 1, color: 'bg-orange-500', percentage: 20 },
              { category: 'Regulatory Reports', count: 0, color: 'bg-purple-500', percentage: 0 }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-sm font-medium text-gray-700">{item.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{item.count}</span>
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color}`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 w-10">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Recent Executions
          </h3>
          <div className="space-y-4">
            {executions.slice(0, 4).map((execution) => {
              const report = reports.find(r => r.id === execution.report_id)
              return (
                <div key={execution.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      execution.status === 'completed' ? 'bg-green-100' :
                      execution.status === 'running' ? 'bg-blue-100' :
                      execution.status === 'failed' ? 'bg-red-100' :
                      'bg-gray-100'
                    }`}>
                      {execution.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-600" />}
                      {execution.status === 'running' && <Play className="w-4 h-4 text-blue-600" />}
                      {execution.status === 'failed' && <XCircle className="w-4 h-4 text-red-600" />}
                      {execution.status === 'queued' && <Pause className="w-4 h-4 text-gray-600" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{report?.report_name}</h4>
                      <p className="text-xs text-gray-600">{new Date(execution.execution_date).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{execution.execution_time?.toFixed(1)}s</p>
                    <p className="text-xs text-gray-600">{execution.triggered_by}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { title: 'New Report', icon: FilePlus, color: 'bg-blue-600' },
            { title: 'Run Report', icon: Play, color: 'bg-green-600' },
            { title: 'Create Template', icon: Copy, color: 'bg-purple-600' },
            { title: 'Schedule Report', icon: Calendar, color: 'bg-orange-600' },
            { title: 'Export Data', icon: Download, color: 'bg-indigo-600' },
            { title: 'Report Builder', icon: Settings, color: 'bg-gray-600' }
          ].map((action) => {
            const IconComponent = action.icon
            return (
              <button
                key={action.title}
                className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-center"
              >
                <div className={`p-3 rounded-full ${action.color} mb-3`}>
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-900">{action.title}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Popular Reports */}
      <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Star className="w-5 h-5" />
          Most Popular Reports
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.slice(0, 3).map((report) => (
            <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    report.output_format === 'pdf' ? 'bg-red-100' :
                    report.output_format === 'excel' ? 'bg-green-100' :
                    report.output_format === 'powerpoint' ? 'bg-orange-100' :
                    'bg-blue-100'
                  }`}>
                    {report.output_format === 'pdf' && <FileText className="w-5 h-5 text-red-600" />}
                    {report.output_format === 'excel' && <FileSpreadsheet className="w-5 h-5 text-green-600" />}
                    {report.output_format === 'powerpoint' && <Presentation className="w-5 h-5 text-orange-600" />}
                    {report.output_format === 'html' && <Globe className="w-5 h-5 text-blue-600" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{report.report_name}</h4>
                    <p className="text-sm text-gray-600">{report.report_code}</p>
                  </div>
                </div>
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  {report.download_count} downloads
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{report.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {report.tags.slice(0, 2).map((tag, index) => (
                    <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Run Report →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderReports = () => (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="financial_statements">Financial Statements</option>
            <option value="management">Management</option>
            <option value="regulatory">Regulatory</option>
            <option value="operational">Operational</option>
            <option value="analytical">Analytical</option>
          </select>
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
            <option value="running">Running</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            New Report
          </button>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Report Name</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Category</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Format</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Last Generated</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Downloads</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Schedule</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-gray-900">{report.report_name}</div>
                      <div className="text-sm text-gray-600">{report.report_code}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      report.report_category === 'financial_statements' ? 'bg-blue-100 text-blue-800' :
                      report.report_category === 'management' ? 'bg-green-100 text-green-800' :
                      report.report_category === 'regulatory' ? 'bg-purple-100 text-purple-800' :
                      report.report_category === 'operational' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {report.report_category.replace('_', ' ').charAt(0).toUpperCase() + report.report_category.replace('_', ' ').slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {report.output_format === 'pdf' && <FileText className="w-4 h-4 text-red-600" />}
                      {report.output_format === 'excel' && <FileSpreadsheet className="w-4 h-4 text-green-600" />}
                      {report.output_format === 'powerpoint' && <Presentation className="w-4 h-4 text-orange-600" />}
                      {report.output_format === 'html' && <Globe className="w-4 h-4 text-blue-600" />}
                      <span className="text-sm text-gray-900">{report.output_format.toUpperCase()}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="text-sm text-gray-900">{new Date(report.last_generated).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-600">{new Date(report.last_generated).toLocaleTimeString()}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      report.generation_status === 'success' ? 'bg-green-100 text-green-800' :
                      report.generation_status === 'running' ? 'bg-blue-100 text-blue-800' :
                      report.generation_status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {report.generation_status.charAt(0).toUpperCase() + report.generation_status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-900">{report.download_count}</span>
                  </td>
                  <td className="py-3 px-4">
                    {report.schedule ? (
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        report.schedule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {report.schedule.frequency}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">Manual</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1 text-gray-400 hover:text-blue-600" title="Run Report">
                        <Play className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-green-600" title="Download">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-purple-600" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-gray-600" title="More">
                        <MoreHorizontal className="w-4 h-4" />
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
  )

  return (
    <div className="sap-font min-h-screen bg-gray-100">
      <SapNavbar 
        title="HERA Finance" 
        breadcrumb="Finance • Management Reporting"
        showBack={true}
        userInitials={user?.email?.charAt(0).toUpperCase() || 'U'}
        showSearch={true}
      />
      
      <main className="mt-12 min-h-[calc(100vh-48px)] p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
                  <FileText className="w-8 h-8 text-blue-600" />
                  Management Reporting
                </h1>
                <p className="text-gray-600 mt-1">
                  Comprehensive financial reporting with automated generation and distribution
                </p>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <FilePlus className="w-4 h-4" />
                  New Report
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  <Play className="w-4 h-4" />
                  Run Report
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-lg shadow-md border border-gray-300">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {[
                  { key: 'overview', label: 'Overview', icon: BarChart3 },
                  { key: 'reports', label: 'Reports', icon: FileText },
                  { key: 'templates', label: 'Templates', icon: Copy },
                  { key: 'schedules', label: 'Schedules', icon: Calendar },
                  { key: 'executions', label: 'Executions', icon: Play },
                  { key: 'data_sources', label: 'Data Sources', icon: Database },
                  { key: 'builder', label: 'Report Builder', icon: Settings }
                ].map((tab) => {
                  const IconComponent = tab.icon
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`${
                        activeTab === tab.key
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                    >
                      <IconComponent className="w-4 h-4" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </div>
            
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  {activeTab === 'overview' && renderOverview()}
                  {activeTab === 'reports' && renderReports()}
                  {activeTab === 'templates' && (
                    <div className="text-center py-12">
                      <Copy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Report Templates</h3>
                      <p className="text-gray-600">Template management and customization coming soon</p>
                    </div>
                  )}
                  {activeTab === 'schedules' && (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Report Schedules</h3>
                      <p className="text-gray-600">Automated scheduling and distribution coming soon</p>
                    </div>
                  )}
                  {activeTab === 'executions' && (
                    <div className="text-center py-12">
                      <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Report Executions</h3>
                      <p className="text-gray-600">Execution history and monitoring coming soon</p>
                    </div>
                  )}
                  {activeTab === 'data_sources' && (
                    <div className="text-center py-12">
                      <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Data Sources</h3>
                      <p className="text-gray-600">Data source management and integration coming soon</p>
                    </div>
                  )}
                  {activeTab === 'builder' && (
                    <div className="text-center py-12">
                      <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Report Builder</h3>
                      <p className="text-gray-600">Visual report designer and builder coming soon</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}