'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { SapNavbar } from '@/components/sap/SapNavbar'
import { 
  Building2, Plus, Search, Filter, Download, Upload, ArrowLeft,
  RefreshCw, Settings, Eye, Edit, MoreHorizontal, TrendingUp,
  TrendingDown, Target, AlertTriangle, CheckCircle, Calculator,
  BarChart3, PieChart, Clock, DollarSign, Calendar, 
  Star, Package, Factory, ArrowRight, FileText,
  ChevronDown, ChevronRight, Maximize2, CircleDollarSign,
  Percent, CalendarDays, UserCheck, ClipboardList, Banknote,
  Wrench, Truck, MapPin, Award, Database
} from 'lucide-react'

interface FixedAsset {
  id: string
  asset_number: string
  asset_name: string
  description: string
  asset_class: string
  company_code: string
  business_area: string
  cost_center: string
  plant: string
  location: string
  acquisition_date: string
  capitalization_date: string
  acquisition_value: number
  accumulated_depreciation: number
  net_book_value: number
  useful_life: number
  depreciation_method: string
  depreciation_key: string
  currency: string
  asset_status: 'active' | 'inactive' | 'disposed' | 'under_construction' | 'fully_depreciated'
  responsible_person: string
  vendor: string
  purchase_order: string
  created_by: string
  created_at: string
  updated_at: string
}

interface AssetClass {
  id: string
  class_code: string
  class_name: string
  description: string
  depreciation_area: string
  useful_life_default: number
  depreciation_method_default: string
  asset_account: string
  depreciation_account: string
  accumulated_depreciation_account: string
}

interface DepreciationRun {
  id: string
  run_id: string
  run_date: string
  period: string
  fiscal_year: number
  depreciation_area: string
  status: 'planned' | 'running' | 'completed' | 'error'
  total_assets: number
  total_depreciation: number
  started_by: string
  started_at: string
  completed_at?: string
}

interface FixedAssetsMetrics {
  total_assets: number
  total_acquisition_value: number
  total_accumulated_depreciation: number
  total_net_book_value: number
  avg_asset_age: number
  monthly_depreciation: number
  assets_under_construction: number
  fully_depreciated_assets: number
}

// Fixed Assets (FI-AA) Module
export default function FixedAssetsPage() {
  const { user, organization, isAuthenticated, contextLoading } = useHERAAuth()
  const [loading, setLoading] = useState(true)
  const [assets, setAssets] = useState<FixedAsset[]>([])
  const [assetClasses, setAssetClasses] = useState<AssetClass[]>([])
  const [depreciationRuns, setDepreciationRuns] = useState<DepreciationRun[]>([])
  const [metrics, setMetrics] = useState<FixedAssetsMetrics | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'classes' | 'depreciation' | 'reports' | 'transactions'>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [classFilter, setClassFilter] = useState<string>('all')
  const [selectedAsset, setSelectedAsset] = useState<FixedAsset | null>(null)

  // Mock data for demonstration
  useEffect(() => {
    const loadFixedAssetsData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const mockMetrics: FixedAssetsMetrics = {
        total_assets: 1247,
        total_acquisition_value: 12450000,
        total_accumulated_depreciation: 4850000,
        total_net_book_value: 7600000,
        avg_asset_age: 3.2,
        monthly_depreciation: 185000,
        assets_under_construction: 23,
        fully_depreciated_assets: 156
      }

      const mockAssetClasses: AssetClass[] = [
        {
          id: 'ac-001',
          class_code: 'BUILDINGS',
          class_name: 'Buildings and Structures',
          description: 'Office buildings, warehouses, manufacturing facilities',
          depreciation_area: '01',
          useful_life_default: 25,
          depreciation_method_default: 'SL',
          asset_account: '150000',
          depreciation_account: '680000',
          accumulated_depreciation_account: '151000'
        },
        {
          id: 'ac-002',
          class_code: 'MACHINERY',
          class_name: 'Plant and Machinery',
          description: 'Manufacturing equipment, production machinery',
          depreciation_area: '01',
          useful_life_default: 10,
          depreciation_method_default: 'SL',
          asset_account: '152000',
          depreciation_account: '681000',
          accumulated_depreciation_account: '153000'
        },
        {
          id: 'ac-003',
          class_code: 'VEHICLES',
          class_name: 'Vehicles and Transportation',
          description: 'Company cars, trucks, delivery vehicles',
          depreciation_area: '01',
          useful_life_default: 5,
          depreciation_method_default: 'SL',
          asset_account: '154000',
          depreciation_account: '682000',
          accumulated_depreciation_account: '155000'
        },
        {
          id: 'ac-004',
          class_code: 'FURNITURE',
          class_name: 'Furniture and Fixtures',
          description: 'Office furniture, fixtures, IT equipment',
          depreciation_area: '01',
          useful_life_default: 7,
          depreciation_method_default: 'SL',
          asset_account: '156000',
          depreciation_account: '683000',
          accumulated_depreciation_account: '157000'
        },
        {
          id: 'ac-005',
          class_code: 'INTANGIBLE',
          class_name: 'Intangible Assets',
          description: 'Software licenses, patents, trademarks',
          depreciation_area: '01',
          useful_life_default: 3,
          depreciation_method_default: 'SL',
          asset_account: '158000',
          depreciation_account: '684000',
          accumulated_depreciation_account: '159000'
        }
      ]

      const mockAssets: FixedAsset[] = [
        {
          id: 'fa-001',
          asset_number: 'FA-2024-00001',
          asset_name: 'Manufacturing Building A',
          description: 'Main production facility in Mumbai',
          asset_class: 'BUILDINGS',
          company_code: '1000',
          business_area: 'MANUFACTURING',
          cost_center: '4100',
          plant: 'MUM1',
          location: 'Building-A-Floor-1',
          acquisition_date: '2020-03-15',
          capitalization_date: '2020-04-01',
          acquisition_value: 2500000,
          accumulated_depreciation: 400000,
          net_book_value: 2100000,
          useful_life: 25,
          depreciation_method: 'Straight Line',
          depreciation_key: 'SL25',
          currency: 'INR',
          asset_status: 'active',
          responsible_person: 'Rajesh Kumar',
          vendor: 'Construction Corp Ltd',
          purchase_order: 'PO-2020-001',
          created_by: 'admin',
          created_at: '2020-03-15T10:00:00Z',
          updated_at: '2024-10-24T08:30:00Z'
        },
        {
          id: 'fa-002',
          asset_number: 'FA-2024-00002',
          asset_name: 'CNC Machine Center',
          description: 'High precision CNC machining center',
          asset_class: 'MACHINERY',
          company_code: '1000',
          business_area: 'MANUFACTURING',
          cost_center: '4150',
          plant: 'MUM1',
          location: 'Shop-Floor-Section-B',
          acquisition_date: '2022-06-10',
          capitalization_date: '2022-07-01',
          acquisition_value: 850000,
          accumulated_depreciation: 170000,
          net_book_value: 680000,
          useful_life: 10,
          depreciation_method: 'Straight Line',
          depreciation_key: 'SL10',
          currency: 'INR',
          asset_status: 'active',
          responsible_person: 'Suresh Patel',
          vendor: 'Industrial Machines Ltd',
          purchase_order: 'PO-2022-045',
          created_by: 'procurement',
          created_at: '2022-06-10T14:15:00Z',
          updated_at: '2024-10-24T08:30:00Z'
        },
        {
          id: 'fa-003',
          asset_number: 'FA-2024-00003',
          asset_name: 'Delivery Fleet Vehicle',
          description: 'Tata Ace delivery truck',
          asset_class: 'VEHICLES',
          company_code: '1000',
          business_area: 'LOGISTICS',
          cost_center: '6100',
          plant: 'MUM1',
          location: 'Vehicle-Park-Bay-3',
          acquisition_date: '2023-02-20',
          capitalization_date: '2023-03-01',
          acquisition_value: 450000,
          accumulated_depreciation: 135000,
          net_book_value: 315000,
          useful_life: 5,
          depreciation_method: 'Straight Line',
          depreciation_key: 'SL5',
          currency: 'INR',
          asset_status: 'active',
          responsible_person: 'Amit Singh',
          vendor: 'Tata Motors Ltd',
          purchase_order: 'PO-2023-012',
          created_by: 'logistics',
          created_at: '2023-02-20T11:45:00Z',
          updated_at: '2024-10-24T08:30:00Z'
        },
        {
          id: 'fa-004',
          asset_number: 'FA-2024-00004',
          asset_name: 'ERP Software License',
          description: 'SAP S/4HANA Cloud subscription',
          asset_class: 'INTANGIBLE',
          company_code: '1000',
          business_area: 'IT',
          cost_center: '8100',
          plant: 'HEAD',
          location: 'IT-Cloud-Infrastructure',
          acquisition_date: '2024-01-01',
          capitalization_date: '2024-01-01',
          acquisition_value: 1200000,
          accumulated_depreciation: 300000,
          net_book_value: 900000,
          useful_life: 3,
          depreciation_method: 'Straight Line',
          depreciation_key: 'SL3',
          currency: 'INR',
          asset_status: 'active',
          responsible_person: 'Priya Sharma',
          vendor: 'SAP India Pvt Ltd',
          purchase_order: 'PO-2024-001',
          created_by: 'it',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-10-24T08:30:00Z'
        },
        {
          id: 'fa-005',
          asset_number: 'FA-2024-00005',
          asset_name: 'Office Furniture Set',
          description: 'Executive office furniture suite',
          asset_class: 'FURNITURE',
          company_code: '1000',
          business_area: 'ADMIN',
          cost_center: '9100',
          plant: 'HEAD',
          location: 'Office-Floor-2-Wing-A',
          acquisition_date: '2023-08-15',
          capitalization_date: '2023-09-01',
          acquisition_value: 180000,
          accumulated_depreciation: 25714,
          net_book_value: 154286,
          useful_life: 7,
          depreciation_method: 'Straight Line',
          depreciation_key: 'SL7',
          currency: 'INR',
          asset_status: 'active',
          responsible_person: 'Neha Gupta',
          vendor: 'Office Solutions Ltd',
          purchase_order: 'PO-2023-089',
          created_by: 'admin',
          created_at: '2023-08-15T09:30:00Z',
          updated_at: '2024-10-24T08:30:00Z'
        },
        {
          id: 'fa-006',
          asset_number: 'FA-2024-00006',
          asset_name: 'Warehouse Expansion',
          description: 'Additional warehouse facility under construction',
          asset_class: 'BUILDINGS',
          company_code: '1000',
          business_area: 'LOGISTICS',
          cost_center: '6200',
          plant: 'MUM2',
          location: 'Construction-Site-Phase-2',
          acquisition_date: '2024-06-01',
          capitalization_date: '2024-12-31',
          acquisition_value: 1800000,
          accumulated_depreciation: 0,
          net_book_value: 1800000,
          useful_life: 25,
          depreciation_method: 'Straight Line',
          depreciation_key: 'SL25',
          currency: 'INR',
          asset_status: 'under_construction',
          responsible_person: 'Vikram Rao',
          vendor: 'Metro Construction Ltd',
          purchase_order: 'PO-2024-034',
          created_by: 'project',
          created_at: '2024-06-01T10:00:00Z',
          updated_at: '2024-10-24T08:30:00Z'
        }
      ]

      const mockDepreciationRuns: DepreciationRun[] = [
        {
          id: 'dr-001',
          run_id: 'DEP-2024-10',
          run_date: '2024-10-31',
          period: '10',
          fiscal_year: 2024,
          depreciation_area: '01',
          status: 'completed',
          total_assets: 1247,
          total_depreciation: 185000,
          started_by: 'finance_manager',
          started_at: '2024-10-31T23:00:00Z',
          completed_at: '2024-10-31T23:45:00Z'
        },
        {
          id: 'dr-002',
          run_id: 'DEP-2024-09',
          run_date: '2024-09-30',
          period: '09',
          fiscal_year: 2024,
          depreciation_area: '01',
          status: 'completed',
          total_assets: 1245,
          total_depreciation: 184500,
          started_by: 'finance_manager',
          started_at: '2024-09-30T23:00:00Z',
          completed_at: '2024-09-30T23:42:00Z'
        },
        {
          id: 'dr-003',
          run_id: 'DEP-2024-11',
          run_date: '2024-11-30',
          period: '11',
          fiscal_year: 2024,
          depreciation_area: '01',
          status: 'planned',
          total_assets: 1247,
          total_depreciation: 185000,
          started_by: 'system',
          started_at: '2024-11-30T23:00:00Z'
        }
      ]

      setMetrics(mockMetrics)
      setAssets(mockAssets)
      setAssetClasses(mockAssetClasses)
      setDepreciationRuns(mockDepreciationRuns)
      setLoading(false)
    }

    loadFixedAssetsData()
  }, [])

  // Filter functions
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          asset.asset_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          asset.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || asset.asset_status === statusFilter
    const matchesClass = classFilter === 'all' || asset.asset_class === classFilter
    return matchesSearch && matchesStatus && matchesClass
  })

  // Utility functions
  const getAssetStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50'
      case 'inactive': return 'text-gray-600 bg-gray-50'
      case 'disposed': return 'text-red-600 bg-red-50'
      case 'under_construction': return 'text-blue-600 bg-blue-50'
      case 'fully_depreciated': return 'text-orange-600 bg-orange-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getAssetClassIcon = (assetClass: string) => {
    switch (assetClass) {
      case 'BUILDINGS': return Building2
      case 'MACHINERY': return Settings
      case 'VEHICLES': return Truck
      case 'FURNITURE': return Package
      case 'INTANGIBLE': return Database
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
          <p className="text-gray-600">Please log in to access Fixed Assets.</p>
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
        breadcrumb="Fixed Assets (FI-AA)"
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
                  <Building2 className="w-8 h-8 text-blue-600" />
                  Fixed Assets Management (FI-AA)
                </h1>
                <p className="text-gray-600 mt-1">
                  Asset lifecycle management, depreciation, and financial accounting
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Asset
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
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Total Assets</h3>
                <p className="text-2xl font-bold text-gray-900">{metrics?.total_assets.toLocaleString()}</p>
                <p className="text-sm text-green-600">+12 this month</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-full bg-green-50">
                    <CircleDollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Net Book Value</h3>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics?.total_net_book_value || 0)}</p>
                <p className="text-sm text-blue-600">Current valuation</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-full bg-orange-50">
                    <TrendingDown className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Monthly Depreciation</h3>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics?.monthly_depreciation || 0)}</p>
                <p className="text-sm text-orange-600">Current month</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-full bg-purple-50">
                    <Wrench className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Under Construction</h3>
                <p className="text-2xl font-bold text-gray-900">{metrics?.assets_under_construction}</p>
                <p className="text-sm text-purple-600">In progress</p>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {[
                  { id: 'overview', name: 'Overview', icon: Eye },
                  { id: 'assets', name: 'Asset Master', icon: Building2 },
                  { id: 'classes', name: 'Asset Classes', icon: ClipboardList },
                  { id: 'depreciation', name: 'Depreciation', icon: Calculator },
                  { id: 'reports', name: 'Reports', icon: FileText },
                  { id: 'transactions', name: 'Transactions', icon: ArrowRight }
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
                    {/* Asset Distribution by Class */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <PieChart className="w-5 h-5" />
                        Asset Distribution by Class
                      </h3>
                      <div className="space-y-4">
                        {assetClasses.map((assetClass) => {
                          const classAssets = assets.filter(a => a.asset_class === assetClass.class_code)
                          const totalValue = classAssets.reduce((sum, a) => sum + a.net_book_value, 0)
                          const percentage = metrics ? (totalValue / metrics.total_net_book_value) * 100 : 0
                          const IconComponent = getAssetClassIcon(assetClass.class_code)
                          
                          return (
                            <div key={assetClass.id} className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <IconComponent className="w-5 h-5 text-gray-600" />
                                <div>
                                  <p className="font-medium text-gray-900">{assetClass.class_name}</p>
                                  <p className="text-sm text-gray-600">{classAssets.length} assets</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900">{formatCurrency(totalValue)}</p>
                                <p className="text-sm text-gray-600">{percentage.toFixed(1)}%</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Recent Depreciation Activity */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Calculator className="w-5 h-5" />
                        Recent Depreciation Runs
                      </h3>
                      <div className="space-y-4">
                        {depreciationRuns.slice(0, 3).map((run) => (
                          <div key={run.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                            <div>
                              <p className="font-medium text-gray-900">{run.run_id}</p>
                              <p className="text-sm text-gray-600">Period {run.period}/{run.fiscal_year}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">{formatCurrency(run.total_depreciation)}</p>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                run.status === 'completed' ? 'bg-green-100 text-green-800' :
                                run.status === 'running' ? 'bg-blue-100 text-blue-800' :
                                run.status === 'planned' ? 'bg-gray-100 text-gray-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Asset Status Summary */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Asset Status Summary
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {[
                        { status: 'active', label: 'Active', count: assets.filter(a => a.asset_status === 'active').length },
                        { status: 'under_construction', label: 'Under Construction', count: assets.filter(a => a.asset_status === 'under_construction').length },
                        { status: 'fully_depreciated', label: 'Fully Depreciated', count: assets.filter(a => a.asset_status === 'fully_depreciated').length },
                        { status: 'inactive', label: 'Inactive', count: assets.filter(a => a.asset_status === 'inactive').length },
                        { status: 'disposed', label: 'Disposed', count: assets.filter(a => a.asset_status === 'disposed').length }
                      ].map((item) => (
                        <div key={item.status} className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                          <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                          <p className={`text-sm font-medium ${getAssetStatusColor(item.status).split(' ')[0]}`}>
                            {item.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Assets Tab */}
              {activeTab === 'assets' && (
                <div className="space-y-6">
                  {/* Search and Filter Controls */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search assets..."
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
                        <option value="under_construction">Under Construction</option>
                        <option value="fully_depreciated">Fully Depreciated</option>
                        <option value="inactive">Inactive</option>
                        <option value="disposed">Disposed</option>
                      </select>
                      <select
                        value={classFilter}
                        onChange={(e) => setClassFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Classes</option>
                        {assetClasses.map((assetClass) => (
                          <option key={assetClass.id} value={assetClass.class_code}>
                            {assetClass.class_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Assets Table */}
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acquisition</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Book Value</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredAssets.map((asset) => {
                            const IconComponent = getAssetClassIcon(asset.asset_class)
                            return (
                              <tr key={asset.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <IconComponent className="w-5 h-5 text-gray-400 mr-3" />
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">{asset.asset_name}</div>
                                      <div className="text-sm text-gray-500">{asset.asset_number}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{asset.asset_class}</div>
                                  <div className="text-sm text-gray-500">{asset.cost_center}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{formatCurrency(asset.acquisition_value)}</div>
                                  <div className="text-sm text-gray-500">{formatDate(asset.acquisition_date)}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{formatCurrency(asset.net_book_value)}</div>
                                  <div className="text-sm text-gray-500">
                                    Dep: {formatCurrency(asset.accumulated_depreciation)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAssetStatusColor(asset.asset_status)}`}>
                                    {asset.asset_status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
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

              {/* Asset Classes Tab */}
              {activeTab === 'classes' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Asset Classes Configuration</h3>
                    <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Asset Class
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {assetClasses.map((assetClass) => {
                      const IconComponent = getAssetClassIcon(assetClass.class_code)
                      const classAssets = assets.filter(a => a.asset_class === assetClass.class_code)
                      
                      return (
                        <div key={assetClass.id} className="bg-white border border-gray-200 rounded-lg p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="p-3 rounded-lg bg-blue-50">
                                <IconComponent className="w-6 h-6 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{assetClass.class_name}</h4>
                                <p className="text-sm text-gray-600">{assetClass.class_code}</p>
                              </div>
                            </div>
                            <button className="text-gray-400 hover:text-gray-600">
                              <MoreHorizontal className="w-5 h-5" />
                            </button>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-4">{assetClass.description}</p>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Useful Life</p>
                              <p className="font-medium">{assetClass.useful_life_default} years</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Assets Count</p>
                              <p className="font-medium">{classAssets.length}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Depreciation Method</p>
                              <p className="font-medium">{assetClass.depreciation_method_default}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Depreciation Area</p>
                              <p className="font-medium">{assetClass.depreciation_area}</p>
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="grid grid-cols-1 gap-2 text-xs text-gray-600">
                              <div className="flex justify-between">
                                <span>Asset Account:</span>
                                <span className="font-mono">{assetClass.asset_account}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Depreciation Account:</span>
                                <span className="font-mono">{assetClass.depreciation_account}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Accumulated Dep. Account:</span>
                                <span className="font-mono">{assetClass.accumulated_depreciation_account}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Depreciation Tab */}
              {activeTab === 'depreciation' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Depreciation Management</h3>
                    <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      <Calculator className="w-4 h-4 mr-2" />
                      Run Depreciation
                    </button>
                  </div>

                  {/* Depreciation Runs */}
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h4 className="text-lg font-medium text-gray-900">Depreciation Run History</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Run ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assets</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Depreciation</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Started</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {depreciationRuns.map((run) => (
                            <tr key={run.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{run.run_id}</div>
                                <div className="text-sm text-gray-500">Area: {run.depreciation_area}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{run.period}/{run.fiscal_year}</div>
                                <div className="text-sm text-gray-500">{formatDate(run.run_date)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {run.total_assets.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {formatCurrency(run.total_depreciation)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  run.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  run.status === 'running' ? 'bg-blue-100 text-blue-800' :
                                  run.status === 'planned' ? 'bg-gray-100 text-gray-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{run.started_by}</div>
                                <div className="text-sm text-gray-500">
                                  {new Date(run.started_at).toLocaleString()}
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

              {/* Reports Tab */}
              {activeTab === 'reports' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Fixed Assets Reports</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { title: 'Asset Register', description: 'Complete list of all assets with details', icon: ClipboardList, color: 'bg-blue-600' },
                      { title: 'Depreciation Schedule', description: 'Planned depreciation for future periods', icon: Calendar, color: 'bg-green-600' },
                      { title: 'Asset Valuation', description: 'Current valuation and book values', icon: DollarSign, color: 'bg-purple-600' },
                      { title: 'Asset Movement', description: 'Transfers, additions, and disposals', icon: ArrowRight, color: 'bg-orange-600' },
                      { title: 'Depreciation Report', description: 'Depreciation posted in current period', icon: Calculator, color: 'bg-red-600' },
                      { title: 'Asset Analysis', description: 'Age analysis and utilization metrics', icon: BarChart3, color: 'bg-cyan-600' }
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

              {/* Transactions Tab */}
              {activeTab === 'transactions' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Asset Transactions</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { title: 'Acquisition', description: 'Create new asset', icon: Plus, color: 'bg-green-600' },
                      { title: 'Transfer', description: 'Transfer between locations', icon: ArrowRight, color: 'bg-blue-600' },
                      { title: 'Retirement', description: 'Asset disposal', icon: Truck, color: 'bg-red-600' },
                      { title: 'Revaluation', description: 'Adjust asset value', icon: TrendingUp, color: 'bg-purple-600' }
                    ].map((transaction) => {
                      const IconComponent = transaction.icon
                      return (
                        <button
                          key={transaction.title}
                          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow text-left"
                        >
                          <div className="flex items-center mb-3">
                            <div className={`p-3 rounded-lg ${transaction.color} mr-3`}>
                              <IconComponent className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2">{transaction.title}</h4>
                          <p className="text-sm text-gray-600">{transaction.description}</p>
                        </button>
                      )
                    })}
                  </div>

                  {/* Recent Transactions */}
                  <div className="bg-white border border-gray-200 rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h4 className="text-lg font-medium text-gray-900">Recent Asset Transactions</h4>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {[
                          { type: 'Acquisition', asset: 'ERP Software License', amount: 1200000, date: '2024-01-01', status: 'completed' },
                          { type: 'Transfer', asset: 'CNC Machine Center', amount: 0, date: '2024-09-15', status: 'completed' },
                          { type: 'Depreciation', asset: 'Manufacturing Building A', amount: -10000, date: '2024-10-31', status: 'completed' },
                          { type: 'Acquisition', asset: 'Warehouse Expansion', amount: 1800000, date: '2024-06-01', status: 'in_progress' }
                        ].map((transaction, index) => (
                          <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${
                                transaction.status === 'completed' ? 'bg-green-500' :
                                transaction.status === 'in_progress' ? 'bg-blue-500' :
                                'bg-gray-500'
                              }`}></div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {transaction.type} - {transaction.asset}
                                </p>
                                <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              {transaction.amount !== 0 && (
                                <p className={`text-sm font-medium ${
                                  transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                                </p>
                              )}
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                                transaction.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {transaction.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
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