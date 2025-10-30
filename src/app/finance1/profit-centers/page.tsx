'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { SapNavbar } from '@/components/sap/SapNavbar'
import { 
  TrendingUp, Plus, Search, Filter, Download, Upload, ArrowLeft,
  RefreshCw, Settings, Eye, Edit, MoreHorizontal, TrendingDown,
  Target, AlertTriangle, CheckCircle, Calculator,
  BarChart3, PieChart, Clock, DollarSign, Calendar, 
  Star, Package, Factory, ArrowRight, FileText,
  ChevronDown, ChevronRight, Maximize2, CircleDollarSign,
  Percent, CalendarDays, UserCheck, ClipboardList, Banknote,
  Building2, Users, Activity, MapPin, Award, Database,
  Layers, Zap, Grid, Table, Monitor, Briefcase
} from 'lucide-react'

interface ProfitCenter {
  id: string
  profit_center_code: string
  profit_center_name: string
  description: string
  valid_from: string
  valid_to: string
  hierarchy_area: string
  company_code: string
  controlling_area: string
  segment: string
  person_responsible: string
  department: string
  profit_center_type: 'standard' | 'dummy' | 'consolidation'
  currency: string
  status: 'active' | 'inactive' | 'locked'
  revenue: number
  cost_of_goods_sold: number
  gross_profit: number
  operating_expenses: number
  operating_profit: number
  net_profit: number
  profit_margin: number
  revenue_growth: number
  created_by: string
  created_at: string
  updated_at: string
}

interface ProfitCenterPL {
  id: string
  profit_center_id: string
  fiscal_year: number
  period: number
  revenue: number
  cost_of_sales: number
  gross_profit: number
  selling_expenses: number
  admin_expenses: number
  operating_expenses: number
  operating_profit: number
  financial_income: number
  financial_expenses: number
  extraordinary_income: number
  extraordinary_expenses: number
  net_profit_before_tax: number
  tax_expense: number
  net_profit_after_tax: number
  currency: string
  status: 'draft' | 'posted' | 'closed'
}

interface Segment {
  id: string
  segment_code: string
  segment_name: string
  description: string
  segment_type: 'business' | 'geographical' | 'product' | 'customer'
  parent_segment?: string
  responsible_manager: string
  currency: string
  status: 'active' | 'inactive'
  profit_centers_count: number
  total_revenue: number
  total_profit: number
}

interface ProfitCenterMetrics {
  total_profit_centers: number
  active_profit_centers: number
  total_revenue: number
  total_operating_profit: number
  average_profit_margin: number
  total_segments: number
  profitable_centers: number
  loss_making_centers: number
}

// Profit Center Accounting (CO-PCA) Module
export default function ProfitCentersPage() {
  const { user, organization, isAuthenticated, contextLoading } = useHERAAuth()
  const [loading, setLoading] = useState(true)
  const [profitCenters, setProfitCenters] = useState<ProfitCenter[]>([])
  const [profitLoss, setProfitLoss] = useState<ProfitCenterPL[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [metrics, setMetrics] = useState<ProfitCenterMetrics | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'centers' | 'pnl' | 'segments' | 'hierarchy' | 'reports' | 'analysis'>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedProfitCenter, setSelectedProfitCenter] = useState<ProfitCenter | null>(null)

  // Mock data for demonstration
  useEffect(() => {
    const loadProfitCenterData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const mockMetrics: ProfitCenterMetrics = {
        total_profit_centers: 48,
        active_profit_centers: 45,
        total_revenue: 45670000,
        total_operating_profit: 8940000,
        average_profit_margin: 19.6,
        total_segments: 12,
        profitable_centers: 38,
        loss_making_centers: 7
      }

      const mockSegments: Segment[] = [
        {
          id: 'seg-001',
          segment_code: 'CONSUMER',
          segment_name: 'Consumer Products',
          description: 'Consumer goods and retail products',
          segment_type: 'business',
          responsible_manager: 'Rajesh Kumar',
          currency: 'INR',
          status: 'active',
          profit_centers_count: 8,
          total_revenue: 18500000,
          total_profit: 3750000
        },
        {
          id: 'seg-002',
          segment_code: 'INDUSTRIAL',
          segment_name: 'Industrial Solutions',
          description: 'B2B industrial equipment and solutions',
          segment_type: 'business',
          responsible_manager: 'Priya Sharma',
          currency: 'INR',
          status: 'active',
          profit_centers_count: 6,
          total_revenue: 15200000,
          total_profit: 2890000
        },
        {
          id: 'seg-003',
          segment_code: 'SERVICES',
          segment_name: 'Professional Services',
          description: 'Consulting and professional services',
          segment_type: 'business',
          responsible_manager: 'Amit Singh',
          currency: 'INR',
          status: 'active',
          profit_centers_count: 4,
          total_revenue: 8950000,
          total_profit: 1850000
        },
        {
          id: 'seg-004',
          segment_code: 'NORTH',
          segment_name: 'Northern Region',
          description: 'Northern India geographical segment',
          segment_type: 'geographical',
          responsible_manager: 'Neha Gupta',
          currency: 'INR',
          status: 'active',
          profit_centers_count: 12,
          total_revenue: 22100000,
          total_profit: 4200000
        },
        {
          id: 'seg-005',
          segment_code: 'SOUTH',
          segment_name: 'Southern Region',
          description: 'Southern India geographical segment',
          segment_type: 'geographical',
          responsible_manager: 'Vikram Rao',
          currency: 'INR',
          status: 'active',
          profit_centers_count: 18,
          total_revenue: 23570000,
          total_profit: 4890000
        }
      ]

      const mockProfitCenters: ProfitCenter[] = [
        {
          id: 'pc-001',
          profit_center_code: 'P1000',
          profit_center_name: 'Manufacturing Division',
          description: 'Primary manufacturing and production operations',
          valid_from: '2024-01-01',
          valid_to: '2024-12-31',
          hierarchy_area: 'OPERATIONS',
          company_code: '1000',
          controlling_area: 'A000',
          segment: 'CONSUMER',
          person_responsible: 'Rajesh Kumar',
          department: 'Manufacturing',
          profit_center_type: 'standard',
          currency: 'INR',
          status: 'active',
          revenue: 12450000,
          cost_of_goods_sold: 8750000,
          gross_profit: 3700000,
          operating_expenses: 1850000,
          operating_profit: 1850000,
          net_profit: 1650000,
          profit_margin: 14.9,
          revenue_growth: 12.3,
          created_by: 'admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-10-24T08:30:00Z'
        },
        {
          id: 'pc-002',
          profit_center_code: 'P2000',
          profit_center_name: 'Sales & Marketing',
          description: 'Sales operations and marketing activities',
          valid_from: '2024-01-01',
          valid_to: '2024-12-31',
          hierarchy_area: 'COMMERCIAL',
          company_code: '1000',
          controlling_area: 'A000',
          segment: 'CONSUMER',
          person_responsible: 'Priya Sharma',
          department: 'Sales',
          profit_center_type: 'standard',
          currency: 'INR',
          status: 'active',
          revenue: 8950000,
          cost_of_goods_sold: 5850000,
          gross_profit: 3100000,
          operating_expenses: 1750000,
          operating_profit: 1350000,
          net_profit: 1200000,
          profit_margin: 15.1,
          revenue_growth: 8.7,
          created_by: 'admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-10-24T08:30:00Z'
        },
        {
          id: 'pc-003',
          profit_center_code: 'P3000',
          profit_center_name: 'Industrial Equipment',
          description: 'Industrial equipment sales and services',
          valid_from: '2024-01-01',
          valid_to: '2024-12-31',
          hierarchy_area: 'INDUSTRIAL',
          company_code: '1000',
          controlling_area: 'A000',
          segment: 'INDUSTRIAL',
          person_responsible: 'Suresh Patel',
          department: 'Industrial',
          profit_center_type: 'standard',
          currency: 'INR',
          status: 'active',
          revenue: 15200000,
          cost_of_goods_sold: 11250000,
          gross_profit: 3950000,
          operating_expenses: 2150000,
          operating_profit: 1800000,
          net_profit: 1580000,
          profit_margin: 11.8,
          revenue_growth: 15.4,
          created_by: 'admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-10-24T08:30:00Z'
        },
        {
          id: 'pc-004',
          profit_center_code: 'P4000',
          profit_center_name: 'Professional Services',
          description: 'Consulting and professional services division',
          valid_from: '2024-01-01',
          valid_to: '2024-12-31',
          hierarchy_area: 'SERVICES',
          company_code: '1000',
          controlling_area: 'A000',
          segment: 'SERVICES',
          person_responsible: 'Amit Singh',
          department: 'Services',
          profit_center_type: 'standard',
          currency: 'INR',
          status: 'active',
          revenue: 6750000,
          cost_of_goods_sold: 3850000,
          gross_profit: 2900000,
          operating_expenses: 1650000,
          operating_profit: 1250000,
          net_profit: 1100000,
          profit_margin: 18.5,
          revenue_growth: 22.1,
          created_by: 'admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-10-24T08:30:00Z'
        },
        {
          id: 'pc-005',
          profit_center_code: 'P5000',
          profit_center_name: 'Research & Development',
          description: 'Product research and development center',
          valid_from: '2024-01-01',
          valid_to: '2024-12-31',
          hierarchy_area: 'INNOVATION',
          company_code: '1000',
          controlling_area: 'A000',
          segment: 'CONSUMER',
          person_responsible: 'Dr. Sarah Johnson',
          department: 'R&D',
          profit_center_type: 'standard',
          currency: 'INR',
          status: 'active',
          revenue: 2320000,
          cost_of_goods_sold: 1950000,
          gross_profit: 370000,
          operating_expenses: 850000,
          operating_profit: -480000,
          net_profit: -520000,
          profit_margin: -15.9,
          revenue_growth: -5.2,
          created_by: 'admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-10-24T08:30:00Z'
        },
        {
          id: 'pc-006',
          profit_center_code: 'P6000',
          profit_center_name: 'Export Operations',
          description: 'International sales and export operations',
          valid_from: '2024-01-01',
          valid_to: '2024-12-31',
          hierarchy_area: 'INTERNATIONAL',
          company_code: '1000',
          controlling_area: 'A000',
          segment: 'CONSUMER',
          person_responsible: 'Vikram Rao',
          department: 'Export',
          profit_center_type: 'standard',
          currency: 'INR',
          status: 'active',
          revenue: 9850000,
          cost_of_goods_sold: 6950000,
          gross_profit: 2900000,
          operating_expenses: 1450000,
          operating_profit: 1450000,
          net_profit: 1280000,
          profit_margin: 14.7,
          revenue_growth: 18.9,
          created_by: 'admin',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-10-24T08:30:00Z'
        }
      ]

      const mockProfitLoss: ProfitCenterPL[] = [
        {
          id: 'pl-001',
          profit_center_id: 'pc-001',
          fiscal_year: 2024,
          period: 10,
          revenue: 1245000,
          cost_of_sales: 875000,
          gross_profit: 370000,
          selling_expenses: 125000,
          admin_expenses: 60000,
          operating_expenses: 185000,
          operating_profit: 185000,
          financial_income: 15000,
          financial_expenses: 25000,
          extraordinary_income: 0,
          extraordinary_expenses: 5000,
          net_profit_before_tax: 170000,
          tax_expense: 51000,
          net_profit_after_tax: 119000,
          currency: 'INR',
          status: 'posted'
        }
      ]

      setMetrics(mockMetrics)
      setProfitCenters(mockProfitCenters)
      setSegments(mockSegments)
      setProfitLoss(mockProfitLoss)
      setLoading(false)
    }

    loadProfitCenterData()
  }, [])

  // Filter functions
  const filteredProfitCenters = profitCenters.filter(center => {
    const matchesSearch = center.profit_center_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          center.profit_center_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          center.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || center.status === statusFilter
    const matchesType = typeFilter === 'all' || center.profit_center_type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  // Utility functions
  const getProfitCenterStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50'
      case 'inactive': return 'text-gray-600 bg-gray-50'
      case 'locked': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getProfitCenterTypeColor = (type: string) => {
    switch (type) {
      case 'standard': return 'text-blue-600 bg-blue-50'
      case 'dummy': return 'text-gray-600 bg-gray-50'
      case 'consolidation': return 'text-purple-600 bg-purple-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getSegmentTypeColor = (type: string) => {
    switch (type) {
      case 'business': return 'text-blue-600 bg-blue-50'
      case 'geographical': return 'text-green-600 bg-green-50'
      case 'product': return 'text-purple-600 bg-purple-50'
      case 'customer': return 'text-orange-600 bg-orange-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getProfitabilityColor = (margin: number) => {
    if (margin > 15) return 'text-green-600 bg-green-50'
    if (margin > 5) return 'text-blue-600 bg-blue-50'
    if (margin > 0) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
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
          <p className="text-gray-600">Please log in to access Profit Center Accounting.</p>
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
        breadcrumb="Profit Center Accounting (CO-PCA)"
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
                  <TrendingUp className="w-8 h-8 text-green-600" />
                  Profit Center Accounting (CO-PCA)
                </h1>
                <p className="text-gray-600 mt-1">
                  Profitability analysis, segment reporting, and P&L management
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Profit Center
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
                  <div className="p-3 rounded-full bg-green-50">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Total Revenue</h3>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics?.total_revenue || 0)}</p>
                <p className="text-sm text-green-600">+12.4% YoY growth</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-full bg-blue-50">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Operating Profit</h3>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics?.total_operating_profit || 0)}</p>
                <p className="text-sm text-blue-600">Strong performance</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-full bg-purple-50">
                    <Percent className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Avg Profit Margin</h3>
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(metrics?.average_profit_margin || 0)}</p>
                <p className="text-sm text-purple-600">Above industry avg</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-full bg-orange-50">
                    <Building2 className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Profit Centers</h3>
                <p className="text-2xl font-bold text-gray-900">{metrics?.total_profit_centers}</p>
                <p className="text-sm text-orange-600">{metrics?.active_profit_centers} active</p>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {[
                  { id: 'overview', name: 'Overview', icon: Eye },
                  { id: 'centers', name: 'Profit Centers', icon: TrendingUp },
                  { id: 'pnl', name: 'P&L Analysis', icon: BarChart3 },
                  { id: 'segments', name: 'Segments', icon: Grid },
                  { id: 'hierarchy', name: 'Hierarchy', icon: Layers },
                  { id: 'reports', name: 'Reports', icon: FileText },
                  { id: 'analysis', name: 'Analysis', icon: Calculator }
                ].map((tab) => {
                  const IconComponent = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-green-500 text-green-600'
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
                    {/* Profitability Distribution */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <PieChart className="w-5 h-5" />
                        Profitability Distribution
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <div>
                              <p className="font-medium text-gray-900">High Performers (&gt;15%)</p>
                              <p className="text-sm text-gray-600">{profitCenters.filter(c => c.profit_margin > 15).length} centers</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(profitCenters.filter(c => c.profit_margin > 15).reduce((sum, c) => sum + c.revenue, 0))}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <div>
                              <p className="font-medium text-gray-900">Average Performers (5-15%)</p>
                              <p className="text-sm text-gray-600">{profitCenters.filter(c => c.profit_margin > 5 && c.profit_margin <= 15).length} centers</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(profitCenters.filter(c => c.profit_margin > 5 && c.profit_margin <= 15).reduce((sum, c) => sum + c.revenue, 0))}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div>
                              <p className="font-medium text-gray-900">Low Performers (0-5%)</p>
                              <p className="text-sm text-gray-600">{profitCenters.filter(c => c.profit_margin > 0 && c.profit_margin <= 5).length} centers</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(profitCenters.filter(c => c.profit_margin > 0 && c.profit_margin <= 5).reduce((sum, c) => sum + c.revenue, 0))}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div>
                              <p className="font-medium text-gray-900">Loss Making (&lt;0%)</p>
                              <p className="text-sm text-gray-600">{profitCenters.filter(c => c.profit_margin < 0).length} centers</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(profitCenters.filter(c => c.profit_margin < 0).reduce((sum, c) => sum + c.revenue, 0))}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Segment Performance */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Grid className="w-5 h-5" />
                        Segment Performance
                      </h3>
                      <div className="space-y-4">
                        {segments.slice(0, 4).map((segment) => {
                          const margin = (segment.total_profit / segment.total_revenue) * 100
                          return (
                            <div key={segment.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                              <div>
                                <p className="font-medium text-gray-900">{segment.segment_name}</p>
                                <p className="text-sm text-gray-600">{segment.profit_centers_count} profit centers</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900">{formatCurrency(segment.total_revenue)}</p>
                                <p className={`text-sm font-medium ${margin > 15 ? 'text-green-600' : margin > 5 ? 'text-blue-600' : 'text-orange-600'}`}>
                                  {formatPercentage(margin)} margin
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Top and Bottom Performers */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        Top Performers
                      </h3>
                      <div className="space-y-3">
                        {profitCenters
                          .filter(c => c.profit_margin > 0)
                          .sort((a, b) => b.profit_margin - a.profit_margin)
                          .slice(0, 3)
                          .map((center) => (
                            <div key={center.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                              <div>
                                <p className="font-medium text-gray-900">{center.profit_center_name}</p>
                                <p className="text-sm text-gray-600">{center.profit_center_code}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-green-600">
                                  {formatPercentage(center.profit_margin)} margin
                                </p>
                                <p className="text-xs text-gray-600">
                                  {formatCurrency(center.net_profit)} profit
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-red-600" />
                        Requires Attention
                      </h3>
                      <div className="space-y-3">
                        {profitCenters
                          .sort((a, b) => a.profit_margin - b.profit_margin)
                          .slice(0, 3)
                          .map((center) => (
                            <div key={center.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                              <div>
                                <p className="font-medium text-gray-900">{center.profit_center_name}</p>
                                <p className="text-sm text-gray-600">{center.profit_center_code}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-red-600">
                                  {formatPercentage(center.profit_margin)} margin
                                </p>
                                <p className="text-xs text-gray-600">
                                  {formatCurrency(center.net_profit)} {center.net_profit < 0 ? 'loss' : 'profit'}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Profit Centers Tab */}
              {activeTab === 'centers' && (
                <div className="space-y-6">
                  {/* Search and Filter Controls */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search profit centers..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="locked">Locked</option>
                      </select>
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="all">All Types</option>
                        <option value="standard">Standard</option>
                        <option value="dummy">Dummy</option>
                        <option value="consolidation">Consolidation</option>
                      </select>
                    </div>
                  </div>

                  {/* Profit Centers Table */}
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit Center</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Segment</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operating Profit</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredProfitCenters.map((center) => (
                            <tr key={center.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <TrendingUp className="w-5 h-5 text-gray-400 mr-3" />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{center.profit_center_name}</div>
                                    <div className="text-sm text-gray-500">{center.profit_center_code}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{center.segment}</div>
                                <div className="text-sm text-gray-500">{center.person_responsible}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {formatCurrency(center.revenue)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {formatCurrency(center.operating_profit)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getProfitabilityColor(center.profit_margin)}`}>
                                  {formatPercentage(center.profit_margin)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`text-sm font-medium ${
                                  center.revenue_growth > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {center.revenue_growth > 0 ? '+' : ''}{formatPercentage(center.revenue_growth)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getProfitCenterStatusColor(center.status)}`}>
                                  {center.status.charAt(0).toUpperCase() + center.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center space-x-2">
                                  <button className="text-green-600 hover:text-green-900">
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
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* P&L Analysis Tab */}
              {activeTab === 'pnl' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Profit & Loss Analysis</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* P&L Statement */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">P&L Structure</h4>
                      <div className="space-y-4">
                        {[
                          { label: 'Revenue', amount: 45670000, type: 'revenue' },
                          { label: 'Cost of Goods Sold', amount: -32450000, type: 'expense' },
                          { label: 'Gross Profit', amount: 13220000, type: 'profit' },
                          { label: 'Operating Expenses', amount: -4280000, type: 'expense' },
                          { label: 'Operating Profit', amount: 8940000, type: 'profit' },
                          { label: 'Financial Income', amount: 285000, type: 'income' },
                          { label: 'Financial Expenses', amount: -185000, type: 'expense' },
                          { label: 'Net Profit', amount: 9040000, type: 'profit' }
                        ].map((item, index) => (
                          <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                            <span className={`font-medium ${
                              item.type === 'revenue' || item.type === 'profit' ? 'text-green-700' :
                              item.type === 'expense' ? 'text-red-700' :
                              'text-blue-700'
                            }`}>
                              {item.label}
                            </span>
                            <span className={`font-semibold ${
                              item.amount > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(Math.abs(item.amount))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Monthly Trend */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Monthly Profit Trend</h4>
                      <div className="space-y-3">
                        {[
                          { month: 'Oct 2024', profit: 1245000, margin: 14.2 },
                          { month: 'Sep 2024', profit: 1180000, margin: 13.8 },
                          { month: 'Aug 2024', profit: 1325000, margin: 15.1 },
                          { month: 'Jul 2024', profit: 1150000, margin: 13.5 },
                          { month: 'Jun 2024', profit: 1280000, margin: 14.7 },
                          { month: 'May 2024', profit: 1095000, margin: 12.9 }
                        ].map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-900">{item.month}</span>
                            <div className="text-right">
                              <p className="font-semibold text-green-600">{formatCurrency(item.profit)}</p>
                              <p className="text-sm text-gray-600">{formatPercentage(item.margin)} margin</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Segments Tab */}
              {activeTab === 'segments' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Business Segments</h3>
                    <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Segment
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {segments.map((segment) => {
                      const margin = (segment.total_profit / segment.total_revenue) * 100
                      return (
                        <div key={segment.id} className="bg-white border border-gray-200 rounded-lg p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="p-3 rounded-lg bg-blue-50">
                                <Grid className="w-6 h-6 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{segment.segment_name}</h4>
                                <p className="text-sm text-gray-600">{segment.segment_code}</p>
                              </div>
                            </div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSegmentTypeColor(segment.segment_type)}`}>
                              {segment.segment_type.charAt(0).toUpperCase() + segment.segment_type.slice(1)}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-4">{segment.description}</p>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-500">Profit Centers</p>
                              <p className="font-semibold text-gray-900">{segment.profit_centers_count}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Manager</p>
                              <p className="font-semibold text-gray-900">{segment.responsible_manager}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Revenue:</span>
                              <span className="font-semibold text-gray-900">{formatCurrency(segment.total_revenue)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Profit:</span>
                              <span className="font-semibold text-green-600">{formatCurrency(segment.total_profit)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Margin:</span>
                              <span className={`font-semibold ${margin > 15 ? 'text-green-600' : margin > 5 ? 'text-blue-600' : 'text-orange-600'}`}>
                                {formatPercentage(margin)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Reports Tab */}
              {activeTab === 'reports' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Profit Center Reports</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { title: 'Profit Center Report', description: 'Comprehensive profitability analysis', icon: TrendingUp, color: 'bg-green-600' },
                      { title: 'Segment Analysis', description: 'Business segment performance', icon: Grid, color: 'bg-blue-600' },
                      { title: 'P&L Statement', description: 'Detailed profit and loss statements', icon: BarChart3, color: 'bg-purple-600' },
                      { title: 'Margin Analysis', description: 'Profitability margin breakdown', icon: Percent, color: 'bg-orange-600' },
                      { title: 'Trend Analysis', description: 'Performance trends over time', icon: TrendingUp, color: 'bg-red-600' },
                      { title: 'Benchmark Report', description: 'Performance benchmarking', icon: Target, color: 'bg-cyan-600' }
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
                            <button className="text-green-600 hover:text-green-700 text-sm font-medium">
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

              {/* Analysis Tab */}
              {activeTab === 'analysis' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Advanced Analysis</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Profitability Drivers */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Profitability Drivers</h4>
                      <div className="space-y-4">
                        {[
                          { driver: 'Revenue Growth', impact: 'High', trend: 'up', value: '+12.4%' },
                          { driver: 'Cost Optimization', impact: 'Medium', trend: 'up', value: '+3.2%' },
                          { driver: 'Market Expansion', impact: 'High', trend: 'up', value: '+8.7%' },
                          { driver: 'Product Mix', impact: 'Medium', trend: 'down', value: '-1.8%' }
                        ].map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center space-x-3">
                              {item.trend === 'up' ? 
                                <TrendingUp className="w-5 h-5 text-green-600" /> :
                                <TrendingDown className="w-5 h-5 text-red-600" />
                              }
                              <div>
                                <p className="font-medium text-gray-900">{item.driver}</p>
                                <p className="text-sm text-gray-600">{item.impact} impact</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-semibold ${item.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                {item.value}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Benchmarking */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Industry Benchmarking</h4>
                      <div className="space-y-4">
                        {[
                          { metric: 'Profit Margin', company: 19.6, industry: 15.2, benchmark: 'Above' },
                          { metric: 'Revenue Growth', company: 12.4, industry: 8.5, benchmark: 'Above' },
                          { metric: 'Cost Efficiency', company: 78.5, industry: 82.1, benchmark: 'Below' },
                          { metric: 'Market Share', company: 24.8, industry: 20.0, benchmark: 'Above' }
                        ].map((item, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-900">{item.metric}</span>
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                item.benchmark === 'Above' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                              }`}>
                                {item.benchmark}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Company: {item.company}%</span>
                              <span className="text-gray-600">Industry: {item.industry}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${item.benchmark === 'Above' ? 'bg-green-500' : 'bg-orange-500'}`}
                                style={{ width: `${(item.company / Math.max(item.company, item.industry)) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
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