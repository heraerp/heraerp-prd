'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { SapNavbar } from '@/components/sap/SapNavbar'
import { 
  Target, Plus, Search, Filter, Download, Upload, ArrowLeft,
  RefreshCw, Settings, Eye, Edit, MoreHorizontal, TrendingUp,
  TrendingDown, AlertTriangle, CheckCircle, Calculator,
  BarChart3, PieChart, Clock, DollarSign, Calendar, 
  Star, Package, Factory, ArrowRight, FileText,
  ChevronDown, ChevronRight, Maximize2, CircleDollarSign,
  Percent, CalendarDays, UserCheck, ClipboardList, Banknote,
  Building2, Users, Activity, MapPin, Award, Database,
  Layers, Zap, Grid, Table, Monitor
} from 'lucide-react'

interface CostCenter {
  id: string
  cost_center_code: string
  cost_center_name: string
  description: string
  valid_from: string
  valid_to: string
  hierarchy_area: string
  company_code: string
  controlling_area: string
  person_responsible: string
  department: string
  cost_center_category: 'revenue' | 'cost' | 'profit' | 'auxiliary'
  profit_center?: string
  currency: string
  status: 'active' | 'inactive' | 'locked'
  planned_costs: number
  actual_costs: number
  committed_costs: number
  budget_variance: number
  budget_utilization: number
  created_by: string
  created_at: string
  updated_at: string
}

interface CostElement {
  id: string
  cost_element_code: string
  cost_element_name: string
  description: string
  cost_element_category: 'primary' | 'secondary'
  cost_element_type: 'expense' | 'revenue' | 'asset' | 'liability'
  gl_account: string
  valid_from: string
  valid_to: string
  currency: string
  status: 'active' | 'inactive'
}

interface CostAllocation {
  id: string
  allocation_id: string
  sender_cost_center: string
  receiver_cost_center: string
  cost_element: string
  allocation_method: 'percentage' | 'fixed_amount' | 'driver_based' | 'statistical'
  allocation_base: string
  allocation_percentage?: number
  allocation_amount?: number
  fiscal_year: number
  period: number
  status: 'planned' | 'executed' | 'reversed'
  created_by: string
  created_at: string
}

interface BudgetPlan {
  id: string
  cost_center_id: string
  cost_element_id: string
  fiscal_year: number
  version: string
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
  currency: string
  status: 'draft' | 'submitted' | 'approved' | 'released'
  approved_by?: string
  approved_at?: string
}

interface CostCenterMetrics {
  total_cost_centers: number
  active_cost_centers: number
  total_planned_costs: number
  total_actual_costs: number
  overall_variance: number
  budget_utilization: number
  centers_over_budget: number
  centers_under_budget: number
}

// Cost Center Accounting (CO-CCA) Module
export default function CostCentersPage() {
  const { user, organization, isAuthenticated, contextLoading } = useHERAAuth()
  const [loading, setLoading] = useState(true)
  const [costCenters, setCostCenters] = useState<CostCenter[]>([])
  const [costElements, setCostElements] = useState<CostElement[]>([])
  const [allocations, setAllocations] = useState<CostAllocation[]>([])
  const [budgetPlans, setBudgetPlans] = useState<BudgetPlan[]>([])
  const [metrics, setMetrics] = useState<CostCenterMetrics | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'centers' | 'elements' | 'planning' | 'allocations' | 'variance' | 'reports'>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenter | null>(null)

  // Mock data for demonstration
  useEffect(() => {
    const loadCostCenterData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const mockMetrics: CostCenterMetrics = {
        total_cost_centers: 156,
        active_cost_centers: 145,
        total_planned_costs: 12450000,
        total_actual_costs: 13567000,
        overall_variance: 8.7,
        budget_utilization: 76.3,
        centers_over_budget: 23,
        centers_under_budget: 122
      }

      const mockCostElements: CostElement[] = [
        {
          id: 'ce-001',
          cost_element_code: '400000',
          cost_element_name: 'Raw Materials',
          description: 'Direct material costs for production',
          cost_element_category: 'primary',
          cost_element_type: 'expense',
          gl_account: '400000',
          valid_from: '2024-01-01',
          valid_to: '2024-12-31',
          currency: 'INR',
          status: 'active'
        },
        {
          id: 'ce-002',
          cost_element_code: '500000',
          cost_element_name: 'Labor Costs',
          description: 'Direct and indirect labor expenses',
          cost_element_category: 'primary',
          cost_element_type: 'expense',
          gl_account: '500000',
          valid_from: '2024-01-01',
          valid_to: '2024-12-31',
          currency: 'INR',
          status: 'active'
        },
        {
          id: 'ce-003',
          cost_element_code: '600000',
          cost_element_name: 'Utilities',
          description: 'Electricity, water, gas expenses',
          cost_element_category: 'primary',
          cost_element_type: 'expense',
          gl_account: '600000',
          valid_from: '2024-01-01',
          valid_to: '2024-12-31',
          currency: 'INR',
          status: 'active'
        },
        {
          id: 'ce-004',
          cost_element_code: '700000',
          cost_element_name: 'Depreciation',
          description: 'Fixed asset depreciation',
          cost_element_category: 'primary',
          cost_element_type: 'expense',
          gl_account: '700000',
          valid_from: '2024-01-01',
          valid_to: '2024-12-31',
          currency: 'INR',
          status: 'active'
        },
        {
          id: 'ce-005',
          cost_element_code: '900000',
          cost_element_name: 'Allocated Overhead',
          description: 'Overhead costs allocated from support centers',
          cost_element_category: 'secondary',
          cost_element_type: 'expense',
          gl_account: '900000',
          valid_from: '2024-01-01',
          valid_to: '2024-12-31',
          currency: 'INR',
          status: 'active'
        }
      ]

      const mockCostCenters: CostCenter[] = [
        {
          id: 'cc-001',
          cost_center_code: '4100',
          cost_center_name: 'Manufacturing - Production Line 1',
          description: 'Primary production line for consumer goods',
          valid_from: '2024-01-01',
          valid_to: '2024-12-31',
          hierarchy_area: 'PRODUCTION',
          company_code: '1000',
          controlling_area: 'A000',
          person_responsible: 'Rajesh Kumar',
          department: 'Manufacturing',
          cost_center_category: 'cost',
          profit_center: 'P1000',
          currency: 'INR',
          status: 'active',
          planned_costs: 2450000,
          actual_costs: 2650000,
          committed_costs: 125000,
          budget_variance: 8.2,
          budget_utilization: 88.1,
          created_by: 'admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-10-24T08:30:00Z'
        },
        {
          id: 'cc-002',
          cost_center_code: '4150',
          cost_center_name: 'Manufacturing - Production Line 2',
          description: 'Secondary production line for specialty items',
          valid_from: '2024-01-01',
          valid_to: '2024-12-31',
          hierarchy_area: 'PRODUCTION',
          company_code: '1000',
          controlling_area: 'A000',
          person_responsible: 'Suresh Patel',
          department: 'Manufacturing',
          cost_center_category: 'cost',
          profit_center: 'P1000',
          currency: 'INR',
          status: 'active',
          planned_costs: 1850000,
          actual_costs: 1920000,
          committed_costs: 85000,
          budget_variance: 3.8,
          budget_utilization: 82.4,
          created_by: 'admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-10-24T08:30:00Z'
        },
        {
          id: 'cc-003',
          cost_center_code: '6100',
          cost_center_name: 'Sales & Marketing',
          description: 'Sales operations and marketing activities',
          valid_from: '2024-01-01',
          valid_to: '2024-12-31',
          hierarchy_area: 'SALES',
          company_code: '1000',
          controlling_area: 'A000',
          person_responsible: 'Priya Sharma',
          department: 'Sales',
          cost_center_category: 'revenue',
          profit_center: 'P2000',
          currency: 'INR',
          status: 'active',
          planned_costs: 3200000,
          actual_costs: 2950000,
          committed_costs: 180000,
          budget_variance: -7.8,
          budget_utilization: 72.1,
          created_by: 'admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-10-24T08:30:00Z'
        },
        {
          id: 'cc-004',
          cost_center_code: '8100',
          cost_center_name: 'IT Services',
          description: 'Information technology support and infrastructure',
          valid_from: '2024-01-01',
          valid_to: '2024-12-31',
          hierarchy_area: 'SUPPORT',
          company_code: '1000',
          controlling_area: 'A000',
          person_responsible: 'Amit Singh',
          department: 'IT',
          cost_center_category: 'auxiliary',
          currency: 'INR',
          status: 'active',
          planned_costs: 1250000,
          actual_costs: 1425000,
          committed_costs: 95000,
          budget_variance: 14.0,
          budget_utilization: 91.6,
          created_by: 'admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-10-24T08:30:00Z'
        },
        {
          id: 'cc-005',
          cost_center_code: '9100',
          cost_center_name: 'HR & Administration',
          description: 'Human resources and general administration',
          valid_from: '2024-01-01',
          valid_to: '2024-12-31',
          hierarchy_area: 'SUPPORT',
          company_code: '1000',
          controlling_area: 'A000',
          person_responsible: 'Neha Gupta',
          department: 'HR',
          cost_center_category: 'auxiliary',
          currency: 'INR',
          status: 'active',
          planned_costs: 850000,
          actual_costs: 780000,
          committed_costs: 42000,
          budget_variance: -8.2,
          budget_utilization: 68.9,
          created_by: 'admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-10-24T08:30:00Z'
        },
        {
          id: 'cc-006',
          cost_center_code: '5100',
          cost_center_name: 'Quality Control',
          description: 'Product quality assurance and testing',
          valid_from: '2024-01-01',
          valid_to: '2024-12-31',
          hierarchy_area: 'QUALITY',
          company_code: '1000',
          controlling_area: 'A000',
          person_responsible: 'Vikram Rao',
          department: 'Quality',
          cost_center_category: 'cost',
          profit_center: 'P1000',
          currency: 'INR',
          status: 'active',
          planned_costs: 650000,
          actual_costs: 695000,
          committed_costs: 35000,
          budget_variance: 6.9,
          budget_utilization: 79.5,
          created_by: 'admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-10-24T08:30:00Z'
        }
      ]

      const mockAllocations: CostAllocation[] = [
        {
          id: 'ca-001',
          allocation_id: 'ALLOC-2024-10-001',
          sender_cost_center: '8100',
          receiver_cost_center: '4100',
          cost_element: '900000',
          allocation_method: 'percentage',
          allocation_base: 'Labor Hours',
          allocation_percentage: 35.5,
          fiscal_year: 2024,
          period: 10,
          status: 'executed',
          created_by: 'controlling_clerk',
          created_at: '2024-10-31T23:00:00Z'
        },
        {
          id: 'ca-002',
          allocation_id: 'ALLOC-2024-10-002',
          sender_cost_center: '8100',
          receiver_cost_center: '4150',
          cost_element: '900000',
          allocation_method: 'percentage',
          allocation_base: 'Labor Hours',
          allocation_percentage: 28.3,
          fiscal_year: 2024,
          period: 10,
          status: 'executed',
          created_by: 'controlling_clerk',
          created_at: '2024-10-31T23:00:00Z'
        },
        {
          id: 'ca-003',
          allocation_id: 'ALLOC-2024-10-003',
          sender_cost_center: '9100',
          receiver_cost_center: '4100',
          cost_element: '900000',
          allocation_method: 'driver_based',
          allocation_base: 'Headcount',
          fiscal_year: 2024,
          period: 10,
          status: 'planned',
          created_by: 'controlling_clerk',
          created_at: '2024-10-30T10:00:00Z'
        }
      ]

      const mockBudgetPlans: BudgetPlan[] = [
        {
          id: 'bp-001',
          cost_center_id: 'cc-001',
          cost_element_id: 'ce-001',
          fiscal_year: 2025,
          version: 'PLAN0',
          period_01: 200000,
          period_02: 205000,
          period_03: 210000,
          period_04: 215000,
          period_05: 220000,
          period_06: 225000,
          period_07: 230000,
          period_08: 235000,
          period_09: 240000,
          period_10: 245000,
          period_11: 250000,
          period_12: 255000,
          total_planned: 2730000,
          currency: 'INR',
          status: 'draft',
          approved_by: undefined,
          approved_at: undefined
        }
      ]

      setMetrics(mockMetrics)
      setCostCenters(mockCostCenters)
      setCostElements(mockCostElements)
      setAllocations(mockAllocations)
      setBudgetPlans(mockBudgetPlans)
      setLoading(false)
    }

    loadCostCenterData()
  }, [])

  // Filter functions
  const filteredCostCenters = costCenters.filter(center => {
    const matchesSearch = center.cost_center_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          center.cost_center_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          center.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || center.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || center.cost_center_category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  // Utility functions
  const getCostCenterStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50'
      case 'inactive': return 'text-gray-600 bg-gray-50'
      case 'locked': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getCostCenterCategoryColor = (category: string) => {
    switch (category) {
      case 'revenue': return 'text-green-600 bg-green-50'
      case 'cost': return 'text-blue-600 bg-blue-50'
      case 'profit': return 'text-purple-600 bg-purple-50'
      case 'auxiliary': return 'text-orange-600 bg-orange-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getCostCenterCategoryIcon = (category: string) => {
    switch (category) {
      case 'revenue': return TrendingUp
      case 'cost': return TrendingDown
      case 'profit': return Target
      case 'auxiliary': return Settings
      default: return Package
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  // Auth guards
  if (!isAuthenticated) {
    return (
      <div className="sap-font min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access Cost Center Accounting.</p>
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

  return (
    <div className="sap-font min-h-screen bg-gray-100">
      <SapNavbar 
        title="Finance" 
        breadcrumb="Cost Center Accounting (CO-CCA)"
        showBack={true}
        userInitials={user?.email?.charAt(0).toUpperCase() || 'F'}
        showSearch={true}
      />
      
      <main className="mt-12 min-h-[calc(100vh-48px)]">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
                  <Target className="w-8 h-8 text-blue-600" />
                  Cost Center Accounting (CO-CCA)
                </h1>
                <p className="text-gray-600 mt-1">
                  Cost planning, allocation, and performance analysis
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Cost Center
                </button>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-full bg-blue-50">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Total Cost Centers</h3>
                <p className="text-2xl font-bold text-gray-900">{metrics?.total_cost_centers}</p>
                <p className="text-sm text-blue-600">{metrics?.active_cost_centers} active</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-full bg-green-50">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Budget Utilization</h3>
                <p className="text-2xl font-bold text-gray-900">{metrics?.budget_utilization}%</p>
                <p className="text-sm text-green-600">Average across centers</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-full bg-orange-50">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Overall Variance</h3>
                <p className="text-2xl font-bold text-gray-900">{metrics?.overall_variance}%</p>
                <p className="text-sm text-orange-600">Above budget</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-full bg-red-50">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Over Budget</h3>
                <p className="text-2xl font-bold text-gray-900">{metrics?.centers_over_budget}</p>
                <p className="text-sm text-red-600">Cost centers</p>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {[
                  { id: 'overview', name: 'Overview', icon: Eye },
                  { id: 'centers', name: 'Cost Centers', icon: Target },
                  { id: 'elements', name: 'Cost Elements', icon: ClipboardList },
                  { id: 'planning', name: 'Planning', icon: Calendar },
                  { id: 'allocations', name: 'Allocations', icon: Layers },
                  { id: 'variance', name: 'Variance Analysis', icon: BarChart3 },
                  { id: 'reports', name: 'Reports', icon: FileText }
                ].map((tab) => {
                  const IconComponent = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <IconComponent className="w-4 h-4 mr-2" />
                      {tab.name}
                    </button>
                  )
                })}
              </nav>
            </div>

            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Cost Center Distribution */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <PieChart className="w-5 h-5" />
                        Cost Center Distribution
                      </h3>
                      <div className="space-y-4">
                        {['cost', 'revenue', 'auxiliary', 'profit'].map((category) => {
                          const categoryCenters = costCenters.filter(c => c.cost_center_category === category)
                          const totalCosts = categoryCenters.reduce((sum, c) => sum + c.actual_costs, 0)
                          const percentage = metrics ? (totalCosts / metrics.total_actual_costs) * 100 : 0
                          const IconComponent = getCostCenterCategoryIcon(category)
                          
                          return (
                            <div key={category} className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <IconComponent className="w-5 h-5 text-gray-600" />
                                <div>
                                  <p className="font-medium text-gray-900 capitalize">{category} Centers</p>
                                  <p className="text-sm text-gray-600">{categoryCenters.length} centers</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900">{formatCurrency(totalCosts)}</p>
                                <p className="text-sm text-gray-600">{percentage.toFixed(1)}%</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Recent Allocations */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Layers className="w-5 h-5" />
                        Recent Allocations
                      </h3>
                      <div className="space-y-4">
                        {allocations.slice(0, 3).map((allocation) => (
                          <div key={allocation.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                            <div>
                              <p className="font-medium text-gray-900">{allocation.allocation_id}</p>
                              <p className="text-sm text-gray-600">
                                {allocation.sender_cost_center} → {allocation.receiver_cost_center}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">{allocation.allocation_method}</p>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                allocation.status === 'executed' ? 'bg-green-100 text-green-800' :
                                allocation.status === 'planned' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {allocation.status.charAt(0).toUpperCase() + allocation.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Top Performers/Underperformers */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        Best Performing Centers
                      </h3>
                      <div className="space-y-3">
                        {costCenters
                          .filter(c => c.budget_variance < 0)
                          .sort((a, b) => a.budget_variance - b.budget_variance)
                          .slice(0, 3)
                          .map((center) => (
                            <div key={center.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                              <div>
                                <p className="font-medium text-gray-900">{center.cost_center_name}</p>
                                <p className="text-sm text-gray-600">{center.cost_center_code}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-green-600">
                                  {center.budget_variance.toFixed(1)}% under budget
                                </p>
                                <p className="text-xs text-gray-600">
                                  Saved: {formatCurrency(center.planned_costs - center.actual_costs)}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-red-600" />
                        Attention Required
                      </h3>
                      <div className="space-y-3">
                        {costCenters
                          .filter(c => c.budget_variance > 0)
                          .sort((a, b) => b.budget_variance - a.budget_variance)
                          .slice(0, 3)
                          .map((center) => (
                            <div key={center.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                              <div>
                                <p className="font-medium text-gray-900">{center.cost_center_name}</p>
                                <p className="text-sm text-gray-600">{center.cost_center_code}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-red-600">
                                  {center.budget_variance.toFixed(1)}% over budget
                                </p>
                                <p className="text-xs text-gray-600">
                                  Excess: {formatCurrency(center.actual_costs - center.planned_costs)}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Cost Centers Tab */}
              {activeTab === 'centers' && (
                <div className="space-y-6">
                  {/* Search and Filter Controls */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search cost centers..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="locked">Locked</option>
                      </select>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Categories</option>
                        <option value="cost">Cost Centers</option>
                        <option value="revenue">Revenue Centers</option>
                        <option value="profit">Profit Centers</option>
                        <option value="auxiliary">Auxiliary Centers</option>
                      </select>
                    </div>
                  </div>

                  {/* Cost Centers List */}
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <h3 className="text-lg font-semibold text-gray-900 p-4 border-b border-gray-200">Cost Center List</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Center</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsible</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variance</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredCostCenters.map((center) => {
                            const IconComponent = getCostCenterCategoryIcon(center.cost_center_category)
                            return (
                              <tr key={center.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <IconComponent className="w-5 h-5 text-gray-400 mr-3" />
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">{center.cost_center_name}</div>
                                      <div className="text-sm text-gray-500">{center.cost_center_code}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCostCenterCategoryColor(center.cost_center_category)}`}>
                                    {center.cost_center_category.charAt(0).toUpperCase() + center.cost_center_category.slice(1)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{center.person_responsible}</div>
                                  <div className="text-sm text-gray-500">{center.department}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatCurrency(center.planned_costs)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatCurrency(center.actual_costs)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className={`text-sm font-medium ${
                                    center.budget_variance > 0 ? 'text-red-600' : 'text-green-600'
                                  }`}>
                                    {center.budget_variance > 0 ? '+' : ''}{center.budget_variance.toFixed(1)}%
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {formatCurrency(Math.abs(center.actual_costs - center.planned_costs))}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCostCenterStatusColor(center.status)}`}>
                                    {center.status.charAt(0).toUpperCase() + center.status.slice(1)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex items-center space-x-2">
                                    <button className="text-blue-600 hover:text-blue-900">
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button className="text-gray-600 hover:text-gray-900">
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button className="text-gray-600 hover:text-gray-900">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Cost Elements Tab */}
              {activeTab === 'elements' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Cost Element Master Data</h3>
                    <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Cost Element
                    </button>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Element</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GL Account</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid From</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {costElements.map((element) => (
                            <tr key={element.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{element.cost_element_name}</div>
                                  <div className="text-sm text-gray-500">{element.cost_element_code}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  element.cost_element_category === 'primary' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {element.cost_element_category.charAt(0).toUpperCase() + element.cost_element_category.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                                {element.cost_element_type}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                                {element.gl_account}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(element.valid_from)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCostCenterStatusColor(element.status)}`}>
                                  {element.status.charAt(0).toUpperCase() + element.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center space-x-2">
                                  <button className="text-blue-600 hover:text-blue-900">
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button className="text-gray-600 hover:text-gray-900">
                                    <Edit className="w-4 h-4" />
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
              )}

              {/* Planning Tab */}
              {activeTab === 'planning' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Budget Planning</h3>
                    <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Budget Plan
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Planning Overview */}
                    <div className="lg:col-span-2">
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Planning Data</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-2">Cost Center</th>
                                <th className="text-right py-2">Q1 Plan</th>
                                <th className="text-right py-2">Q2 Plan</th>
                                <th className="text-right py-2">Q3 Plan</th>
                                <th className="text-right py-2">Q4 Plan</th>
                                <th className="text-right py-2">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {costCenters.slice(0, 4).map((center) => {
                                const q1 = center.planned_costs * 0.25
                                const q2 = center.planned_costs * 0.24
                                const q3 = center.planned_costs * 0.26
                                const q4 = center.planned_costs * 0.25
                                return (
                                  <tr key={center.id} className="border-b border-gray-100">
                                    <td className="py-3 font-medium">{center.cost_center_code}</td>
                                    <td className="text-right py-3">{formatCurrency(q1)}</td>
                                    <td className="text-right py-3">{formatCurrency(q2)}</td>
                                    <td className="text-right py-3">{formatCurrency(q3)}</td>
                                    <td className="text-right py-3">{formatCurrency(q4)}</td>
                                    <td className="text-right py-3 font-semibold">{formatCurrency(center.planned_costs)}</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Planning Tools */}
                    <div className="space-y-6">
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Planning Tools</h4>
                        <div className="space-y-3">
                          {[
                            { title: 'Copy Previous Year', icon: Calendar, color: 'bg-blue-600' },
                            { title: 'Distribute Equally', icon: BarChart3, color: 'bg-green-600' },
                            { title: 'Apply Growth Rate', icon: TrendingUp, color: 'bg-purple-600' },
                            { title: 'Import from Excel', icon: Upload, color: 'bg-orange-600' }
                          ].map((tool) => {
                            const IconComponent = tool.icon
                            return (
                              <button
                                key={tool.title}
                                className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <div className={`p-2 rounded-lg ${tool.color} mr-3`}>
                                  <IconComponent className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-sm font-medium text-gray-900">{tool.title}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Planning Status</h4>
                        <div className="space-y-3">
                          {[
                            { status: 'Draft', count: 45, color: 'bg-gray-100 text-gray-800' },
                            { status: 'Submitted', count: 38, color: 'bg-blue-100 text-blue-800' },
                            { status: 'Approved', count: 67, color: 'bg-green-100 text-green-800' },
                            { status: 'Released', count: 6, color: 'bg-purple-100 text-purple-800' }
                          ].map((item) => (
                            <div key={item.status} className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">{item.status}</span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.color}`}>
                                {item.count}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Allocations Tab */}
              {activeTab === 'allocations' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Cost Allocations</h3>
                    <button className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                      <Layers className="w-4 h-4 mr-2" />
                      Run Allocation
                    </button>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h4 className="text-lg font-medium text-gray-900">Allocation Cycles</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allocation ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sender</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receiver</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {allocations.map((allocation) => (
                            <tr key={allocation.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {allocation.allocation_id}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {allocation.sender_cost_center}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {allocation.receiver_cost_center}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                                {allocation.allocation_method.replace('_', ' ')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {allocation.allocation_base}
                                {allocation.allocation_percentage && ` (${allocation.allocation_percentage}%)`}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {allocation.period}/{allocation.fiscal_year}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  allocation.status === 'executed' ? 'bg-green-100 text-green-800' :
                                  allocation.status === 'planned' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {allocation.status.charAt(0).toUpperCase() + allocation.status.slice(1)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Variance Analysis Tab */}
              {activeTab === 'variance' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Variance Analysis</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Budget vs Actual</h4>
                      <div className="space-y-4">
                        {costCenters.slice(0, 4).map((center) => (
                          <div key={center.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">{center.cost_center_code}</span>
                              <span className={`text-sm font-medium ${
                                center.budget_variance > 0 ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {center.budget_variance > 0 ? '+' : ''}{center.budget_variance.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                              <span>Budget: {formatCurrency(center.planned_costs)}</span>
                              <span>Actual: {formatCurrency(center.actual_costs)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  center.budget_utilization > 100 ? 'bg-red-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${Math.min(center.budget_utilization, 100)}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Utilization: {center.budget_utilization.toFixed(1)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Variance Drivers</h4>
                      <div className="space-y-4">
                        {[
                          { driver: 'Labor Cost Increase', impact: 145000, percentage: 12.5 },
                          { driver: 'Material Price Inflation', impact: 98000, percentage: 8.3 },
                          { driver: 'Utility Rate Changes', impact: 67000, percentage: 5.8 },
                          { driver: 'Overtime Premium', impact: 54000, percentage: 4.6 }
                        ].map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{item.driver}</p>
                              <p className="text-sm text-gray-600">Impact on variance</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-red-600">{formatCurrency(item.impact)}</p>
                              <p className="text-sm text-gray-600">{item.percentage}%</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Reports Tab */}
              {activeTab === 'reports' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Cost Center Reports</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { title: 'Cost Center Report', description: 'Comprehensive cost center analysis', icon: Target, color: 'bg-blue-600' },
                      { title: 'Variance Report', description: 'Budget vs actual variance analysis', icon: BarChart3, color: 'bg-red-600' },
                      { title: 'Allocation Report', description: 'Cost allocation details and calculations', icon: Layers, color: 'bg-purple-600' },
                      { title: 'Budget Report', description: 'Budget planning and utilization', icon: Calendar, color: 'bg-green-600' },
                      { title: 'Cost Element Report', description: 'Cost element wise analysis', icon: ClipboardList, color: 'bg-orange-600' },
                      { title: 'Hierarchy Report', description: 'Cost center hierarchy structure', icon: Grid, color: 'bg-cyan-600' }
                    ].map((report) => {
                      const IconComponent = report.icon
                      return (
                        <div key={report.title} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
                          <div className="flex items-center mb-4">
                            <div className={`p-3 rounded-lg ${report.color} mr-4`}>
                              <IconComponent className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{report.title}</h4>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                          <div className="flex items-center justify-between">
                            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                              Generate Report
                            </button>
                            <Download className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}