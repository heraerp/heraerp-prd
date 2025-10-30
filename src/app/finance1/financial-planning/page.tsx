'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { SapNavbar } from '@/components/sap/SapNavbar'
import { 
  Calculator, Plus, Search, Filter, Download, Upload, ArrowLeft,
  RefreshCw, Settings, Eye, Edit, MoreHorizontal, TrendingUp,
  TrendingDown, Target, AlertTriangle, CheckCircle, Calendar,
  BarChart3, PieChart, Clock, DollarSign, 
  Star, Package, Factory, ArrowRight, FileText,
  ChevronDown, ChevronRight, Maximize2, CircleDollarSign,
  Percent, CalendarDays, UserCheck, ClipboardList, Banknote,
  Building2, Users, Activity, MapPin, Award, Database,
  Layers, Zap, Grid, Table, Monitor, Briefcase, Shield,
  Globe, Bookmark, LineChart, BarChart, Gauge, 
  ArrowUpRight, Bell, Hash, Timer, Workflow
} from 'lucide-react'

interface BudgetPlan {
  id: string
  budget_code: string
  budget_name: string
  description: string
  budget_type: 'operational' | 'capital' | 'project' | 'rolling'
  fiscal_year: number
  version: string
  budget_period: 'annual' | 'quarterly' | 'monthly'
  currency: string
  total_budget: number
  approved_budget: number
  utilized_budget: number
  remaining_budget: number
  variance_amount: number
  variance_percent: number
  approval_status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'active'
  budget_owner: string
  department: string
  cost_center: string
  profit_center?: string
  business_area?: string
  approved_by?: string
  approved_date?: string
  created_by: string
  created_at: string
  updated_at: string
}

interface BudgetLine {
  id: string
  budget_id: string
  line_number: number
  account_code: string
  account_name: string
  cost_element: string
  period_01: number
  period_02: number
  period_03: number
  period_04: number
  period_05: number
  period_06: number
  period_07: number
  period_08: number
  period_09: number
  period_10: number
  period_11: number
  period_12: number
  total_planned: number
  actual_spent: number
  committed_amount: number
  variance: number
  variance_percent: number
  comments?: string
}

interface Forecast {
  id: string
  forecast_code: string
  forecast_name: string
  description: string
  forecast_type: 'budget' | 'revenue' | 'expense' | 'cashflow'
  forecast_method: 'trend' | 'regression' | 'seasonal' | 'scenario'
  base_period: string
  forecast_periods: number
  currency: string
  accuracy_score: number
  confidence_level: number
  scenario: 'optimistic' | 'realistic' | 'pessimistic'
  created_by: string
  created_at: string
  status: 'active' | 'archived'
}

interface VarianceAnalysis {
  id: string
  analysis_period: string
  budget_id: string
  actual_amount: number
  budget_amount: number
  variance_amount: number
  variance_percent: number
  variance_type: 'favorable' | 'unfavorable'
  analysis_category: 'revenue' | 'expense' | 'margin'
  root_cause?: string
  corrective_action?: string
  responsible_person?: string
  target_date?: string
  status: 'identified' | 'analyzing' | 'action_taken' | 'resolved'
}

interface PlanningScenario {
  id: string
  scenario_code: string
  scenario_name: string
  description: string
  scenario_type: 'base' | 'best_case' | 'worst_case' | 'stress_test'
  probability: number
  revenue_growth: number
  expense_growth: number
  margin_impact: number
  risk_factors: string[]
  assumptions: string[]
  created_by: string
  created_at: string
  status: 'draft' | 'approved' | 'active'
}

interface FinancialPlanningMetrics {
  total_budgets: number
  approved_budgets: number
  total_budget_amount: number
  budget_utilization: number
  variance_overall: number
  forecasting_accuracy: number
  active_scenarios: number
  pending_approvals: number
}

// Financial Planning & Budgeting (FI-FM) Module
export default function FinancialPlanningPage() {
  const { user, organization, isAuthenticated, contextLoading } = useHERAAuth()
  const [loading, setLoading] = useState(true)
  const [budgets, setBudgets] = useState<BudgetPlan[]>([])
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([])
  const [forecasts, setForecasts] = useState<Forecast[]>([])
  const [variances, setVariances] = useState<VarianceAnalysis[]>([])
  const [scenarios, setScenarios] = useState<PlanningScenario[]>([])
  const [metrics, setMetrics] = useState<FinancialPlanningMetrics | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'budgets' | 'forecasting' | 'variance' | 'scenarios' | 'reports'>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedBudget, setSelectedBudget] = useState<BudgetPlan | null>(null)

  // Mock data for demonstration
  useEffect(() => {
    const loadFinancialPlanningData = async () => {
      if (!organization?.id) return
      
      setLoading(true)
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Mock budget plans
        const mockBudgets: BudgetPlan[] = [
          {
            id: '1',
            budget_code: 'BUD-2024-001',
            budget_name: 'Annual Operating Budget 2024',
            description: 'Comprehensive operating budget for fiscal year 2024',
            budget_type: 'operational',
            fiscal_year: 2024,
            version: 'V1.0',
            budget_period: 'annual',
            currency: 'INR',
            total_budget: 50000000,
            approved_budget: 48000000,
            utilized_budget: 12000000,
            remaining_budget: 36000000,
            variance_amount: -2000000,
            variance_percent: -4.2,
            approval_status: 'approved',
            budget_owner: 'John Smith',
            department: 'Finance',
            cost_center: 'CC001',
            profit_center: 'PC001',
            business_area: 'Operations',
            approved_by: 'Jane Doe',
            approved_date: '2023-12-15',
            created_by: 'user1',
            created_at: '2023-11-01T10:00:00Z',
            updated_at: '2023-12-15T14:30:00Z'
          },
          {
            id: '2',
            budget_code: 'BUD-2024-002',
            budget_name: 'Capital Expenditure Budget 2024',
            description: 'Capital investments and infrastructure budget',
            budget_type: 'capital',
            fiscal_year: 2024,
            version: 'V2.1',
            budget_period: 'annual',
            currency: 'INR',
            total_budget: 25000000,
            approved_budget: 25000000,
            utilized_budget: 3500000,
            remaining_budget: 21500000,
            variance_amount: 0,
            variance_percent: 0,
            approval_status: 'approved',
            budget_owner: 'Mike Johnson',
            department: 'IT',
            cost_center: 'CC002',
            approved_by: 'Jane Doe',
            approved_date: '2023-12-20',
            created_by: 'user2',
            created_at: '2023-11-15T09:00:00Z',
            updated_at: '2023-12-20T11:15:00Z'
          },
          {
            id: '3',
            budget_code: 'BUD-2024-003',
            budget_name: 'Marketing Campaign Budget Q1',
            description: 'First quarter marketing and advertising budget',
            budget_type: 'project',
            fiscal_year: 2024,
            version: 'V1.0',
            budget_period: 'quarterly',
            currency: 'INR',
            total_budget: 5000000,
            approved_budget: 4800000,
            utilized_budget: 2100000,
            remaining_budget: 2700000,
            variance_amount: -200000,
            variance_percent: -4.0,
            approval_status: 'active',
            budget_owner: 'Sarah Wilson',
            department: 'Marketing',
            cost_center: 'CC003',
            profit_center: 'PC002',
            created_by: 'user3',
            created_at: '2023-12-01T08:00:00Z',
            updated_at: '2024-01-15T16:45:00Z'
          },
          {
            id: '4',
            budget_code: 'BUD-2024-004',
            budget_name: 'R&D Innovation Budget',
            description: 'Research and development budget for new products',
            budget_type: 'operational',
            fiscal_year: 2024,
            version: 'V1.2',
            budget_period: 'annual',
            currency: 'INR',
            total_budget: 15000000,
            approved_budget: 15000000,
            utilized_budget: 4200000,
            remaining_budget: 10800000,
            variance_amount: 0,
            variance_percent: 0,
            approval_status: 'approved',
            budget_owner: 'Dr. Robert Chen',
            department: 'R&D',
            cost_center: 'CC004',
            business_area: 'Innovation',
            approved_by: 'Jane Doe',
            approved_date: '2023-12-10',
            created_by: 'user4',
            created_at: '2023-10-15T14:00:00Z',
            updated_at: '2023-12-10T10:30:00Z'
          },
          {
            id: '5',
            budget_code: 'BUD-2024-005',
            budget_name: 'Rolling Forecast Q2-Q4',
            description: 'Rolling forecast budget for remaining quarters',
            budget_type: 'rolling',
            fiscal_year: 2024,
            version: 'V3.0',
            budget_period: 'quarterly',
            currency: 'INR',
            total_budget: 35000000,
            approved_budget: 0,
            utilized_budget: 0,
            remaining_budget: 35000000,
            variance_amount: 0,
            variance_percent: 0,
            approval_status: 'submitted',
            budget_owner: 'Lisa Brown',
            department: 'Finance',
            cost_center: 'CC001',
            created_by: 'user5',
            created_at: '2024-01-20T12:00:00Z',
            updated_at: '2024-01-22T09:15:00Z'
          }
        ]

        // Mock forecasts
        const mockForecasts: Forecast[] = [
          {
            id: '1',
            forecast_code: 'FC-2024-001',
            forecast_name: 'Revenue Forecast Q2-Q4',
            description: 'Revenue prediction based on historical trends and market analysis',
            forecast_type: 'revenue',
            forecast_method: 'regression',
            base_period: '2024-Q1',
            forecast_periods: 9,
            currency: 'INR',
            accuracy_score: 92.5,
            confidence_level: 85,
            scenario: 'realistic',
            created_by: 'analyst1',
            created_at: '2024-01-15T10:00:00Z',
            status: 'active'
          },
          {
            id: '2',
            forecast_code: 'FC-2024-002',
            forecast_name: 'Cash Flow Forecast',
            description: 'Monthly cash flow predictions for liquidity planning',
            forecast_type: 'cashflow',
            forecast_method: 'seasonal',
            base_period: '2024-01',
            forecast_periods: 12,
            currency: 'INR',
            accuracy_score: 88.3,
            confidence_level: 80,
            scenario: 'realistic',
            created_by: 'analyst2',
            created_at: '2024-01-10T14:30:00Z',
            status: 'active'
          },
          {
            id: '3',
            forecast_code: 'FC-2024-003',
            forecast_name: 'Expense Forecast - Operations',
            description: 'Operational expense forecast with trend analysis',
            forecast_type: 'expense',
            forecast_method: 'trend',
            base_period: '2024-Q1',
            forecast_periods: 12,
            currency: 'INR',
            accuracy_score: 90.1,
            confidence_level: 82,
            scenario: 'realistic',
            created_by: 'analyst3',
            created_at: '2024-01-12T11:15:00Z',
            status: 'active'
          }
        ]

        // Mock variance analysis
        const mockVariances: VarianceAnalysis[] = [
          {
            id: '1',
            analysis_period: '2024-01',
            budget_id: '1',
            actual_amount: 4200000,
            budget_amount: 4000000,
            variance_amount: 200000,
            variance_percent: 5.0,
            variance_type: 'unfavorable',
            analysis_category: 'expense',
            root_cause: 'Higher than expected utility costs due to winter weather',
            corrective_action: 'Implement energy efficiency measures',
            responsible_person: 'Facilities Manager',
            target_date: '2024-03-01',
            status: 'action_taken'
          },
          {
            id: '2',
            analysis_period: '2024-01',
            budget_id: '2',
            actual_amount: 850000,
            budget_amount: 1000000,
            variance_amount: -150000,
            variance_percent: -15.0,
            variance_type: 'favorable',
            analysis_category: 'expense',
            root_cause: 'Delayed equipment delivery pushed expenses to next period',
            status: 'identified'
          },
          {
            id: '3',
            analysis_period: '2024-01',
            budget_id: '3',
            actual_amount: 1800000,
            budget_amount: 1600000,
            variance_amount: 200000,
            variance_percent: 12.5,
            variance_type: 'unfavorable',
            analysis_category: 'expense',
            root_cause: 'Additional marketing spend for product launch',
            corrective_action: 'Review marketing ROI and adjust future campaigns',
            responsible_person: 'Marketing Director',
            target_date: '2024-02-15',
            status: 'analyzing'
          }
        ]

        // Mock scenarios
        const mockScenarios: PlanningScenario[] = [
          {
            id: '1',
            scenario_code: 'SC-2024-001',
            scenario_name: 'Base Case Scenario',
            description: 'Most likely business scenario based on current market conditions',
            scenario_type: 'base',
            probability: 60,
            revenue_growth: 8.5,
            expense_growth: 6.2,
            margin_impact: 2.3,
            risk_factors: ['Market competition', 'Regulatory changes'],
            assumptions: ['GDP growth 6%', 'Inflation 4%', 'No major disruptions'],
            created_by: 'planner1',
            created_at: '2024-01-05T09:00:00Z',
            status: 'approved'
          },
          {
            id: '2',
            scenario_code: 'SC-2024-002',
            scenario_name: 'Optimistic Growth Scenario',
            description: 'Best case scenario with aggressive market expansion',
            scenario_type: 'best_case',
            probability: 25,
            revenue_growth: 15.0,
            expense_growth: 8.5,
            margin_impact: 6.5,
            risk_factors: ['Overextension', 'Resource constraints'],
            assumptions: ['New market entry successful', 'Economic boom', 'Low competition'],
            created_by: 'planner1',
            created_at: '2024-01-05T09:30:00Z',
            status: 'approved'
          },
          {
            id: '3',
            scenario_code: 'SC-2024-003',
            scenario_name: 'Economic Downturn Scenario',
            description: 'Pessimistic scenario accounting for economic recession',
            scenario_type: 'worst_case',
            probability: 15,
            revenue_growth: -2.5,
            expense_growth: 3.0,
            margin_impact: -5.5,
            risk_factors: ['Recession', 'High unemployment', 'Credit crunch'],
            assumptions: ['GDP decline 2%', 'High inflation', 'Market contraction'],
            created_by: 'planner2',
            created_at: '2024-01-05T10:00:00Z',
            status: 'approved'
          }
        ]

        // Mock metrics
        const mockMetrics: FinancialPlanningMetrics = {
          total_budgets: 5,
          approved_budgets: 4,
          total_budget_amount: 130000000,
          budget_utilization: 18.7,
          variance_overall: -2.1,
          forecasting_accuracy: 89.6,
          active_scenarios: 3,
          pending_approvals: 1
        }

        setBudgets(mockBudgets)
        setForecasts(mockForecasts)
        setVariances(mockVariances)
        setScenarios(mockScenarios)
        setMetrics(mockMetrics)
        
      } catch (error) {
        console.error('Error loading financial planning data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFinancialPlanningData()
  }, [organization?.id])

  // Filter budgets based on search and filters
  const filteredBudgets = budgets.filter(budget => {
    const matchesSearch = budget.budget_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         budget.budget_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         budget.budget_owner.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || budget.approval_status === statusFilter
    const matchesType = typeFilter === 'all' || budget.budget_type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  // Auth Guard
  if (!isAuthenticated) {
    return (
      <div className="sap-font min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access Financial Planning.</p>
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
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Total Budget Amount',
            value: `₹${metrics?.total_budget_amount?.toLocaleString() || '0'}`,
            subtitle: `${metrics?.approved_budgets || 0} of ${metrics?.total_budgets || 0} approved`,
            icon: DollarSign,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
          },
          {
            title: 'Budget Utilization',
            value: `${metrics?.budget_utilization?.toFixed(1) || '0'}%`,
            subtitle: 'Year-to-date utilization',
            icon: Gauge,
            color: 'text-green-600',
            bgColor: 'bg-green-50'
          },
          {
            title: 'Forecast Accuracy',
            value: `${metrics?.forecasting_accuracy?.toFixed(1) || '0'}%`,
            subtitle: 'Model prediction accuracy',
            icon: Target,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50'
          },
          {
            title: 'Overall Variance',
            value: `${metrics?.variance_overall?.toFixed(1) || '0'}%`,
            subtitle: `${metrics?.pending_approvals || 0} pending approvals`,
            icon: TrendingDown,
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

      {/* Budget Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Budget Status Distribution
          </h3>
          <div className="space-y-4">
            {[
              { status: 'Approved', count: 4, color: 'bg-green-500', percentage: 80 },
              { status: 'Submitted', count: 1, color: 'bg-yellow-500', percentage: 20 },
              { status: 'Draft', count: 0, color: 'bg-gray-500', percentage: 0 },
              { status: 'Rejected', count: 0, color: 'bg-red-500', percentage: 0 }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-sm font-medium text-gray-700">{item.status}</span>
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
            Budget Type Breakdown
          </h3>
          <div className="space-y-4">
            {[
              { type: 'Operational', amount: 65000000, color: 'bg-blue-500', percentage: 50 },
              { type: 'Capital', amount: 25000000, color: 'bg-purple-500', percentage: 19.2 },
              { type: 'Rolling', amount: 35000000, color: 'bg-green-500', percentage: 26.9 },
              { type: 'Project', amount: 5000000, color: 'bg-orange-500', percentage: 3.8 }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-sm font-medium text-gray-700">{item.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">₹{(item.amount / 1000000).toFixed(0)}M</span>
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
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Recent Budget Activities
        </h3>
        <div className="space-y-4">
          {[
            {
              action: 'Budget Approved',
              description: 'R&D Innovation Budget approved by Jane Doe',
              time: '2 hours ago',
              icon: CheckCircle,
              color: 'text-green-600'
            },
            {
              action: 'Variance Identified',
              description: 'Marketing Campaign Budget exceeded by 12.5%',
              time: '4 hours ago',
              icon: AlertTriangle,
              color: 'text-orange-600'
            },
            {
              action: 'Forecast Updated',
              description: 'Q2-Q4 Revenue Forecast updated with new data',
              time: '1 day ago',
              icon: TrendingUp,
              color: 'text-blue-600'
            },
            {
              action: 'Budget Submitted',
              description: 'Rolling Forecast Q2-Q4 submitted for approval',
              time: '2 days ago',
              icon: Upload,
              color: 'text-purple-600'
            }
          ].map((activity, index) => {
            const IconComponent = activity.icon
            return (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                <div className={`p-2 rounded-full bg-gray-100`}>
                  <IconComponent className={`w-4 h-4 ${activity.color}`} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{activity.action}</h4>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  const renderBudgets = () => (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search budgets..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="active">Active</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="operational">Operational</option>
            <option value="capital">Capital</option>
            <option value="project">Project</option>
            <option value="rolling">Rolling</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            New Budget
          </button>
        </div>
      </div>

      {/* Budgets Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Budget Code</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Budget Name</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Total Budget</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Utilized</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Variance</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Owner</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBudgets.map((budget) => (
                <tr key={budget.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="font-medium text-blue-600">{budget.budget_code}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-gray-900">{budget.budget_name}</div>
                      <div className="text-sm text-gray-600">{budget.description}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      budget.budget_type === 'operational' ? 'bg-blue-100 text-blue-800' :
                      budget.budget_type === 'capital' ? 'bg-purple-100 text-purple-800' :
                      budget.budget_type === 'project' ? 'bg-orange-100 text-orange-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {budget.budget_type.charAt(0).toUpperCase() + budget.budget_type.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium">₹{budget.total_budget.toLocaleString()}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">₹{budget.utilized_budget.toLocaleString()}</span>
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500"
                          style={{ width: `${(budget.utilized_budget / budget.total_budget) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-medium ${budget.variance_percent < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {budget.variance_percent.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      budget.approval_status === 'approved' ? 'bg-green-100 text-green-800' :
                      budget.approval_status === 'active' ? 'bg-blue-100 text-blue-800' :
                      budget.approval_status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                      budget.approval_status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {budget.approval_status.charAt(0).toUpperCase() + budget.approval_status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-900">{budget.budget_owner}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1 text-gray-400 hover:text-blue-600">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-green-600">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-gray-600">
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

  const renderForecasting = () => (
    <div className="space-y-6">
      {/* Forecasting Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: 'Active Forecasts',
            value: forecasts.filter(f => f.status === 'active').length.toString(),
            subtitle: 'Currently running',
            icon: LineChart,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
          },
          {
            title: 'Average Accuracy',
            value: `${(forecasts.reduce((acc, f) => acc + f.accuracy_score, 0) / forecasts.length).toFixed(1)}%`,
            subtitle: 'Model performance',
            icon: Target,
            color: 'text-green-600',
            bgColor: 'bg-green-50'
          },
          {
            title: 'Confidence Level',
            value: `${(forecasts.reduce((acc, f) => acc + f.confidence_level, 0) / forecasts.length).toFixed(0)}%`,
            subtitle: 'Average confidence',
            icon: Shield,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50'
          }
        ].map((metric, index) => {
          const IconComponent = metric.icon
          return (
            <div key={index} className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
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

      {/* Forecasts List */}
      <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <LineChart className="w-5 h-5" />
            Financial Forecasts
          </h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            New Forecast
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {forecasts.map((forecast) => (
            <div key={forecast.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{forecast.forecast_name}</h4>
                  <p className="text-sm text-gray-600">{forecast.description}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  forecast.forecast_type === 'revenue' ? 'bg-green-100 text-green-800' :
                  forecast.forecast_type === 'expense' ? 'bg-red-100 text-red-800' :
                  forecast.forecast_type === 'cashflow' ? 'bg-blue-100 text-blue-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {forecast.forecast_type.charAt(0).toUpperCase() + forecast.forecast_type.slice(1)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <span className="text-xs text-gray-500">Method</span>
                  <p className="text-sm font-medium">{forecast.forecast_method.charAt(0).toUpperCase() + forecast.forecast_method.slice(1)}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Periods</span>
                  <p className="text-sm font-medium">{forecast.forecast_periods}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Accuracy</span>
                  <p className="text-sm font-medium text-green-600">{forecast.accuracy_score}%</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Confidence</span>
                  <p className="text-sm font-medium text-blue-600">{forecast.confidence_level}%</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${forecast.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="text-xs text-gray-600">{forecast.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1 text-gray-400 hover:text-blue-600">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-green-600">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderVarianceAnalysis = () => (
    <div className="space-y-6">
      {/* Variance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Total Variances',
            value: variances.length.toString(),
            subtitle: 'Identified this period',
            icon: AlertTriangle,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50'
          },
          {
            title: 'Favorable',
            value: variances.filter(v => v.variance_type === 'favorable').length.toString(),
            subtitle: 'Below budget',
            icon: TrendingDown,
            color: 'text-green-600',
            bgColor: 'bg-green-50'
          },
          {
            title: 'Unfavorable',
            value: variances.filter(v => v.variance_type === 'unfavorable').length.toString(),
            subtitle: 'Above budget',
            icon: TrendingUp,
            color: 'text-red-600',
            bgColor: 'bg-red-50'
          },
          {
            title: 'Actions Taken',
            value: variances.filter(v => v.status === 'action_taken').length.toString(),
            subtitle: 'Corrective measures',
            icon: CheckCircle,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
          }
        ].map((metric, index) => {
          const IconComponent = metric.icon
          return (
            <div key={index} className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
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

      {/* Variance Analysis Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-300 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Variance Analysis Details
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Period</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Budget</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Actual</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Variance</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Category</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Root Cause</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {variances.map((variance) => (
                <tr key={variance.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="font-medium text-gray-900">{variance.analysis_period}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm">₹{variance.budget_amount.toLocaleString()}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm">₹{variance.actual_amount.toLocaleString()}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className={`font-medium ${variance.variance_type === 'favorable' ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{Math.abs(variance.variance_amount).toLocaleString()}
                      </span>
                      <span className={`text-xs ${variance.variance_type === 'favorable' ? 'text-green-600' : 'text-red-600'}`}>
                        ({variance.variance_percent.toFixed(1)}%)
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      variance.variance_type === 'favorable' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {variance.variance_type.charAt(0).toUpperCase() + variance.variance_type.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-900">{variance.analysis_category}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">{variance.root_cause || 'Not specified'}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      variance.status === 'action_taken' ? 'bg-green-100 text-green-800' :
                      variance.status === 'analyzing' ? 'bg-yellow-100 text-yellow-800' :
                      variance.status === 'resolved' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {variance.status.replace('_', ' ').charAt(0).toUpperCase() + variance.status.replace('_', ' ').slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1 text-gray-400 hover:text-blue-600">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-green-600">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-gray-600">
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

  const renderScenarios = () => (
    <div className="space-y-6">
      {/* Scenario Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: 'Active Scenarios',
            value: scenarios.filter(s => s.status === 'active').length.toString(),
            subtitle: 'Currently modeled',
            icon: Globe,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
          },
          {
            title: 'Base Case Probability',
            value: `${scenarios.find(s => s.scenario_type === 'base')?.probability || 0}%`,
            subtitle: 'Most likely outcome',
            icon: Target,
            color: 'text-green-600',
            bgColor: 'bg-green-50'
          },
          {
            title: 'Total Scenarios',
            value: scenarios.length.toString(),
            subtitle: 'All defined scenarios',
            icon: Layers,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50'
          }
        ].map((metric, index) => {
          const IconComponent = metric.icon
          return (
            <div key={index} className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
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

      {/* Scenarios List */}
      <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Planning Scenarios
          </h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            New Scenario
          </button>
        </div>
        
        <div className="space-y-4">
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg">{scenario.scenario_name}</h4>
                  <p className="text-sm text-gray-600">{scenario.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    scenario.scenario_type === 'base' ? 'bg-blue-100 text-blue-800' :
                    scenario.scenario_type === 'best_case' ? 'bg-green-100 text-green-800' :
                    scenario.scenario_type === 'worst_case' ? 'bg-red-100 text-red-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {scenario.scenario_type.replace('_', ' ').charAt(0).toUpperCase() + scenario.scenario_type.replace('_', ' ').slice(1)}
                  </span>
                  <span className="text-sm font-medium text-gray-600">{scenario.probability}%</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Revenue Growth</h5>
                  <p className={`text-2xl font-bold ${scenario.revenue_growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {scenario.revenue_growth >= 0 ? '+' : ''}{scenario.revenue_growth}%
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Expense Growth</h5>
                  <p className={`text-2xl font-bold ${scenario.expense_growth <= 5 ? 'text-green-600' : 'text-orange-600'}`}>
                    +{scenario.expense_growth}%
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Margin Impact</h5>
                  <p className={`text-2xl font-bold ${scenario.margin_impact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {scenario.margin_impact >= 0 ? '+' : ''}{scenario.margin_impact}%
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Key Assumptions</h5>
                  <ul className="space-y-1">
                    {scenario.assumptions.map((assumption, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                        {assumption}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Risk Factors</h5>
                  <ul className="space-y-1">
                    {scenario.risk_factors.map((risk, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3 text-orange-500 flex-shrink-0" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${scenario.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-xs text-gray-600">{scenario.status}</span>
                  </div>
                  <span className="text-xs text-gray-500">Created {new Date(scenario.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1 text-gray-400 hover:text-blue-600">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-green-600">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderReports = () => (
    <div className="space-y-6">
      {/* Report Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            title: 'Budget Reports',
            description: 'Comprehensive budget analysis and performance reports',
            icon: FileText,
            color: 'bg-blue-600',
            reports: ['Budget vs Actual', 'Budget Utilization', 'Approval Status', 'Budget Variance']
          },
          {
            title: 'Forecast Reports',
            description: 'Financial forecasting and prediction analysis',
            icon: LineChart,
            color: 'bg-green-600',
            reports: ['Revenue Forecast', 'Expense Forecast', 'Cash Flow Forecast', 'Accuracy Analysis']
          },
          {
            title: 'Variance Reports',
            description: 'Detailed variance analysis and root cause reports',
            icon: BarChart3,
            color: 'bg-orange-600',
            reports: ['Variance Summary', 'Root Cause Analysis', 'Corrective Actions', 'Trend Analysis']
          },
          {
            title: 'Scenario Reports',
            description: 'Planning scenario analysis and comparison reports',
            icon: Globe,
            color: 'bg-purple-600',
            reports: ['Scenario Comparison', 'Sensitivity Analysis', 'Risk Assessment', 'Probability Analysis']
          },
          {
            title: 'Executive Reports',
            description: 'High-level financial planning executive summaries',
            icon: Award,
            color: 'bg-indigo-600',
            reports: ['Executive Summary', 'KPI Dashboard', 'Performance Overview', 'Strategic Analysis']
          },
          {
            title: 'Regulatory Reports',
            description: 'Compliance and regulatory financial planning reports',
            icon: Shield,
            color: 'bg-gray-600',
            reports: ['Compliance Report', 'Audit Trail', 'Regulatory Filing', 'Control Assessment']
          }
        ].map((category) => {
          const IconComponent = category.icon
          return (
            <div key={category.title} className="bg-white rounded-lg shadow-md border border-gray-300 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-full ${category.color} flex-shrink-0`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">{category.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {category.reports.map((report, index) => (
                      <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {report}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{category.reports.length} reports</span>
                <button className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View Reports
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Report Generation */}
      <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Quick Report Generation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Budget Summary', icon: DollarSign, color: 'bg-blue-600' },
            { title: 'Variance Analysis', icon: BarChart3, color: 'bg-orange-600' },
            { title: 'Forecast Accuracy', icon: Target, color: 'bg-green-600' },
            { title: 'Scenario Impact', icon: Globe, color: 'bg-purple-600' },
            { title: 'Monthly Trends', icon: TrendingUp, color: 'bg-indigo-600' },
            { title: 'KPI Dashboard', icon: Monitor, color: 'bg-gray-600' },
            { title: 'Executive Summary', icon: Award, color: 'bg-red-600' },
            { title: 'Custom Report', icon: Settings, color: 'bg-yellow-600' }
          ].map((report) => {
            const IconComponent = report.icon
            return (
              <button
                key={report.title}
                className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-center"
              >
                <div className={`p-3 rounded-full ${report.color} mb-3`}>
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-900">{report.title}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Reports
        </h3>
        <div className="space-y-4">
          {[
            {
              title: 'Monthly Budget vs Actual - January 2024',
              type: 'Budget Report',
              generated: '2024-02-01T09:00:00Z',
              size: '2.3 MB',
              format: 'PDF',
              status: 'Ready'
            },
            {
              title: 'Q1 2024 Revenue Forecast Analysis',
              type: 'Forecast Report',
              generated: '2024-01-28T14:30:00Z',
              size: '1.8 MB',
              format: 'Excel',
              status: 'Ready'
            },
            {
              title: 'Variance Analysis Report - Marketing Budget',
              type: 'Variance Report',
              generated: '2024-01-25T11:15:00Z',
              size: '1.2 MB',
              format: 'PDF',
              status: 'Ready'
            },
            {
              title: 'Scenario Comparison - Base vs Optimistic',
              type: 'Scenario Report',
              generated: '2024-01-22T16:45:00Z',
              size: '3.1 MB',
              format: 'PowerPoint',
              status: 'Ready'
            }
          ].map((report, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{report.title}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{report.type}</span>
                    <span>•</span>
                    <span>{new Date(report.generated).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{report.size}</span>
                    <span>•</span>
                    <span>{report.format}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {report.status}
                </span>
                <button className="p-1 text-gray-400 hover:text-blue-600">
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="sap-font min-h-screen bg-gray-100">
      <SapNavbar 
        title="HERA Finance" 
        breadcrumb="Finance • Financial Planning & Budgeting"
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
                  <Calculator className="w-8 h-8 text-blue-600" />
                  Financial Planning & Budgeting
                </h1>
                <p className="text-gray-600 mt-1">
                  Comprehensive financial planning, budgeting, forecasting, and variance analysis
                </p>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  New Budget
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  <LineChart className="w-4 h-4" />
                  Forecast
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
                  { key: 'budgets', label: 'Budgets', icon: DollarSign },
                  { key: 'forecasting', label: 'Forecasting', icon: LineChart },
                  { key: 'variance', label: 'Variance Analysis', icon: TrendingUp },
                  { key: 'scenarios', label: 'Scenarios', icon: Globe },
                  { key: 'reports', label: 'Reports', icon: FileText }
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
                  {activeTab === 'budgets' && renderBudgets()}
                  {activeTab === 'forecasting' && renderForecasting()}
                  {activeTab === 'variance' && renderVarianceAnalysis()}
                  {activeTab === 'scenarios' && renderScenarios()}
                  {activeTab === 'reports' && renderReports()}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}