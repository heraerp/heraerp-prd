'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { SapNavbar } from '@/components/sap/SapNavbar'
import { 
  Package, Plus, Search, Filter, Download, Upload, ArrowLeft,
  RefreshCw, Settings, Eye, Edit, MoreHorizontal, TrendingUp,
  TrendingDown, Target, AlertTriangle, CheckCircle, Calculator,
  BarChart3, PieChart, Clock, DollarSign, Calendar, 
  Star, Factory, ArrowRight, FileText,
  ChevronDown, ChevronRight, Maximize2, CircleDollarSign,
  Percent, CalendarDays, UserCheck, ClipboardList, Banknote,
  Building2, Users, Activity, MapPin, Award, Database,
  Layers, Zap, Grid, Table, Monitor, Briefcase, Shield,
  Globe, Bookmark, LineChart, BarChart, Gauge, Box,
  ArrowUpRight, Bell, Hash, Timer, Workflow, Wrench,
  Cog, List, Boxes, ShoppingCart, Truck, Archive
} from 'lucide-react'

interface Product {
  id: string
  product_code: string
  product_name: string
  description: string
  product_type: 'finished_good' | 'semi_finished' | 'raw_material' | 'service'
  product_group: string
  base_unit: string
  standard_cost: number
  actual_cost: number
  target_cost: number
  current_cost_estimate: string
  costing_method: 'standard' | 'actual' | 'average' | 'fifo' | 'lifo'
  costing_lot_size: number
  production_plant: string
  profit_center: string
  cost_center: string
  material_overhead_group: string
  variance_amount: number
  variance_percent: number
  last_cost_update: string
  status: 'active' | 'inactive' | 'blocked'
  created_by: string
  created_at: string
  updated_at: string
}

interface CostEstimate {
  id: string
  estimate_number: string
  product_id: string
  estimate_name: string
  costing_variant: string
  costing_version: string
  costing_date: string
  quantity: number
  base_unit: string
  total_cost: number
  unit_cost: number
  material_cost: number
  labor_cost: number
  overhead_cost: number
  sub_contracting_cost: number
  by_product_credit: number
  estimate_status: 'draft' | 'released' | 'approved' | 'archived'
  cost_breakdown: CostComponent[]
  created_by: string
  created_at: string
}

interface CostComponent {
  id: string
  component_type: 'material' | 'labor' | 'overhead' | 'subcontracting'
  cost_element: string
  cost_element_name: string
  quantity: number
  unit: string
  unit_cost: number
  total_cost: number
  cost_percentage: number
  overhead_rate?: number
  activity_type?: string
  work_center?: string
}

interface BOM {
  id: string
  bom_number: string
  product_id: string
  bom_name: string
  bom_status: 'active' | 'inactive' | 'blocked'
  valid_from: string
  valid_to: string
  base_quantity: number
  base_unit: string
  alternative_bom?: string
  plant: string
  bom_items: BOMItem[]
  created_by: string
  created_at: string
}

interface BOMItem {
  id: string
  item_number: number
  component_product_id: string
  component_name: string
  component_type: 'stock' | 'non_stock' | 'variable_size' | 'document_info'
  quantity: number
  unit: string
  cost_per_unit: number
  total_cost: number
  scrap_percent: number
  item_text?: string
  procurement_type: 'in_house' | 'external' | 'both'
}

interface Routing {
  id: string
  routing_number: string
  product_id: string
  routing_name: string
  routing_type: 'production' | 'reference' | 'standard'
  routing_status: 'active' | 'inactive' | 'blocked'
  valid_from: string
  valid_to: string
  plant: string
  routing_operations: RoutingOperation[]
  total_processing_time: number
  total_setup_time: number
  total_labor_cost: number
  total_machine_cost: number
  created_by: string
  created_at: string
}

interface RoutingOperation {
  id: string
  operation_number: number
  work_center: string
  work_center_name: string
  operation_description: string
  operation_type: 'internal' | 'external' | 'rework'
  setup_time: number
  processing_time: number
  teardown_time: number
  labor_rate: number
  machine_rate: number
  overhead_rate: number
  operation_cost: number
  activity_type: string
  control_key: string
}

interface VarianceAnalysis {
  id: string
  analysis_period: string
  product_id: string
  standard_cost: number
  actual_cost: number
  variance_amount: number
  variance_percent: number
  variance_type: 'material' | 'labor' | 'overhead' | 'total'
  variance_category: 'price' | 'quantity' | 'efficiency' | 'volume'
  root_cause?: string
  responsible_area?: string
  corrective_action?: string
  analysis_status: 'open' | 'analyzing' | 'resolved'
}

interface CostingRun {
  id: string
  run_number: string
  run_name: string
  costing_type: 'standard' | 'actual' | 'target' | 'planned'
  run_date: string
  period: string
  fiscal_year: number
  plant: string
  product_group?: string
  run_status: 'planning' | 'running' | 'completed' | 'error'
  total_products: number
  successful_costings: number
  failed_costings: number
  total_processing_time: number
  started_by: string
  started_at: string
  completed_at?: string
}

interface ProductCostingMetrics {
  total_products: number
  active_products: number
  total_standard_cost: number
  total_actual_cost: number
  average_variance: number
  cost_estimates: number
  pending_approvals: number
  recent_updates: number
}

// Product Costing (CO-PC) Module
export default function ProductCostingPage() {
  const { user, organization, isAuthenticated, contextLoading } = useHERAAuth()
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [costEstimates, setCostEstimates] = useState<CostEstimate[]>([])
  const [boms, setBoms] = useState<BOM[]>([])
  const [routings, setRoutings] = useState<Routing[]>([])
  const [variances, setVariances] = useState<VarianceAnalysis[]>([])
  const [costingRuns, setCostingRuns] = useState<CostingRun[]>([])
  const [metrics, setMetrics] = useState<ProductCostingMetrics | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'estimates' | 'bom' | 'routing' | 'variance' | 'runs' | 'reports'>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Mock data for demonstration
  useEffect(() => {
    const loadProductCostingData = async () => {
      if (!organization?.id) return
      
      setLoading(true)
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Mock products
        const mockProducts: Product[] = [
          {
            id: '1',
            product_code: 'FG-001',
            product_name: 'Smartphone Model X',
            description: 'Premium smartphone with advanced features',
            product_type: 'finished_good',
            product_group: 'Electronics',
            base_unit: 'Each',
            standard_cost: 25000,
            actual_cost: 26200,
            target_cost: 24500,
            current_cost_estimate: 'EST-2024-001',
            costing_method: 'standard',
            costing_lot_size: 1000,
            production_plant: 'Plant-001',
            profit_center: 'PC-ELE',
            cost_center: 'CC-PROD',
            material_overhead_group: 'MOH-01',
            variance_amount: 1200,
            variance_percent: 4.8,
            last_cost_update: '2024-01-15T10:00:00Z',
            status: 'active',
            created_by: 'user1',
            created_at: '2023-06-01T09:00:00Z',
            updated_at: '2024-01-15T10:00:00Z'
          },
          {
            id: '2',
            product_code: 'FG-002',
            product_name: 'Laptop Professional',
            description: 'High-performance laptop for professionals',
            product_type: 'finished_good',
            product_group: 'Electronics',
            base_unit: 'Each',
            standard_cost: 45000,
            actual_cost: 44200,
            target_cost: 43000,
            current_cost_estimate: 'EST-2024-002',
            costing_method: 'standard',
            costing_lot_size: 500,
            production_plant: 'Plant-001',
            profit_center: 'PC-ELE',
            cost_center: 'CC-PROD',
            material_overhead_group: 'MOH-01',
            variance_amount: -800,
            variance_percent: -1.8,
            last_cost_update: '2024-01-20T14:30:00Z',
            status: 'active',
            created_by: 'user2',
            created_at: '2023-07-15T11:00:00Z',
            updated_at: '2024-01-20T14:30:00Z'
          },
          {
            id: '3',
            product_code: 'SF-001',
            product_name: 'Circuit Board Assembly',
            description: 'Main circuit board for electronic devices',
            product_type: 'semi_finished',
            product_group: 'Components',
            base_unit: 'Each',
            standard_cost: 3500,
            actual_cost: 3650,
            target_cost: 3400,
            current_cost_estimate: 'EST-2024-003',
            costing_method: 'standard',
            costing_lot_size: 2000,
            production_plant: 'Plant-002',
            profit_center: 'PC-COM',
            cost_center: 'CC-ASSY',
            material_overhead_group: 'MOH-02',
            variance_amount: 150,
            variance_percent: 4.3,
            last_cost_update: '2024-01-18T12:15:00Z',
            status: 'active',
            created_by: 'user3',
            created_at: '2023-08-01T08:30:00Z',
            updated_at: '2024-01-18T12:15:00Z'
          },
          {
            id: '4',
            product_code: 'RM-001',
            product_name: 'Silicon Wafer',
            description: 'High-grade silicon wafer for semiconductor manufacturing',
            product_type: 'raw_material',
            product_group: 'Materials',
            base_unit: 'Piece',
            standard_cost: 850,
            actual_cost: 820,
            target_cost: 800,
            current_cost_estimate: 'EST-2024-004',
            costing_method: 'fifo',
            costing_lot_size: 5000,
            production_plant: 'Plant-003',
            profit_center: 'PC-MAT',
            cost_center: 'CC-PROC',
            material_overhead_group: 'MOH-03',
            variance_amount: -30,
            variance_percent: -3.5,
            last_cost_update: '2024-01-22T09:45:00Z',
            status: 'active',
            created_by: 'user4',
            created_at: '2023-09-10T13:20:00Z',
            updated_at: '2024-01-22T09:45:00Z'
          },
          {
            id: '5',
            product_code: 'SV-001',
            product_name: 'Technical Support Service',
            description: 'Premium technical support service package',
            product_type: 'service',
            product_group: 'Services',
            base_unit: 'Hour',
            standard_cost: 150,
            actual_cost: 155,
            target_cost: 145,
            current_cost_estimate: 'EST-2024-005',
            costing_method: 'actual',
            costing_lot_size: 1,
            production_plant: 'Plant-004',
            profit_center: 'PC-SRV',
            cost_center: 'CC-SUPP',
            material_overhead_group: 'MOH-04',
            variance_amount: 5,
            variance_percent: 3.3,
            last_cost_update: '2024-01-25T16:00:00Z',
            status: 'active',
            created_by: 'user5',
            created_at: '2023-10-05T10:15:00Z',
            updated_at: '2024-01-25T16:00:00Z'
          }
        ]

        // Mock cost estimates
        const mockCostEstimates: CostEstimate[] = [
          {
            id: '1',
            estimate_number: 'EST-2024-001',
            product_id: '1',
            estimate_name: 'Smartphone X Standard Cost',
            costing_variant: 'PPC1',
            costing_version: '1',
            costing_date: '2024-01-15',
            quantity: 1,
            base_unit: 'Each',
            total_cost: 25000,
            unit_cost: 25000,
            material_cost: 18000,
            labor_cost: 4500,
            overhead_cost: 2200,
            sub_contracting_cost: 300,
            by_product_credit: 0,
            estimate_status: 'approved',
            cost_breakdown: [
              {
                id: '1',
                component_type: 'material',
                cost_element: '400100',
                cost_element_name: 'Raw Materials',
                quantity: 1,
                unit: 'Each',
                unit_cost: 18000,
                total_cost: 18000,
                cost_percentage: 72.0
              },
              {
                id: '2',
                component_type: 'labor',
                cost_element: '620100',
                cost_element_name: 'Direct Labor',
                quantity: 3,
                unit: 'Hour',
                unit_cost: 1500,
                total_cost: 4500,
                cost_percentage: 18.0,
                work_center: 'WC-ASSY'
              },
              {
                id: '3',
                component_type: 'overhead',
                cost_element: '641100',
                cost_element_name: 'Manufacturing Overhead',
                quantity: 1,
                unit: 'Each',
                unit_cost: 2200,
                total_cost: 2200,
                cost_percentage: 8.8,
                overhead_rate: 48.9
              }
            ],
            created_by: 'cost_analyst1',
            created_at: '2024-01-15T10:00:00Z'
          },
          {
            id: '2',
            estimate_number: 'EST-2024-002',
            product_id: '2',
            estimate_name: 'Laptop Professional Standard Cost',
            costing_variant: 'PPC1',
            costing_version: '1',
            costing_date: '2024-01-20',
            quantity: 1,
            base_unit: 'Each',
            total_cost: 45000,
            unit_cost: 45000,
            material_cost: 32000,
            labor_cost: 8500,
            overhead_cost: 4200,
            sub_contracting_cost: 300,
            by_product_credit: 0,
            estimate_status: 'approved',
            cost_breakdown: [
              {
                id: '4',
                component_type: 'material',
                cost_element: '400100',
                cost_element_name: 'Raw Materials',
                quantity: 1,
                unit: 'Each',
                unit_cost: 32000,
                total_cost: 32000,
                cost_percentage: 71.1
              },
              {
                id: '5',
                component_type: 'labor',
                cost_element: '620100',
                cost_element_name: 'Direct Labor',
                quantity: 5.5,
                unit: 'Hour',
                unit_cost: 1545,
                total_cost: 8500,
                cost_percentage: 18.9,
                work_center: 'WC-ASSY'
              },
              {
                id: '6',
                component_type: 'overhead',
                cost_element: '641100',
                cost_element_name: 'Manufacturing Overhead',
                quantity: 1,
                unit: 'Each',
                unit_cost: 4200,
                total_cost: 4200,
                cost_percentage: 9.3,
                overhead_rate: 49.4
              }
            ],
            created_by: 'cost_analyst2',
            created_at: '2024-01-20T14:30:00Z'
          }
        ]

        // Mock variance analysis
        const mockVariances: VarianceAnalysis[] = [
          {
            id: '1',
            analysis_period: '2024-01',
            product_id: '1',
            standard_cost: 25000,
            actual_cost: 26200,
            variance_amount: 1200,
            variance_percent: 4.8,
            variance_type: 'total',
            variance_category: 'price',
            root_cause: 'Material price increase due to supply shortage',
            responsible_area: 'Procurement',
            corrective_action: 'Negotiate long-term contracts with suppliers',
            analysis_status: 'analyzing'
          },
          {
            id: '2',
            analysis_period: '2024-01',
            product_id: '2',
            standard_cost: 45000,
            actual_cost: 44200,
            variance_amount: -800,
            variance_percent: -1.8,
            variance_type: 'material',
            variance_category: 'quantity',
            root_cause: 'Reduced material waste through process improvement',
            responsible_area: 'Production',
            analysis_status: 'resolved'
          },
          {
            id: '3',
            analysis_period: '2024-01',
            product_id: '3',
            standard_cost: 3500,
            actual_cost: 3650,
            variance_amount: 150,
            variance_percent: 4.3,
            variance_type: 'labor',
            variance_category: 'efficiency',
            root_cause: 'Learning curve for new production line',
            responsible_area: 'Manufacturing',
            corrective_action: 'Additional training for operators',
            analysis_status: 'open'
          }
        ]

        // Mock costing runs
        const mockCostingRuns: CostingRun[] = [
          {
            id: '1',
            run_number: 'CR-2024-001',
            run_name: 'January 2024 Standard Costing',
            costing_type: 'standard',
            run_date: '2024-01-31',
            period: '001.2024',
            fiscal_year: 2024,
            plant: 'Plant-001',
            run_status: 'completed',
            total_products: 150,
            successful_costings: 147,
            failed_costings: 3,
            total_processing_time: 45,
            started_by: 'cost_controller',
            started_at: '2024-01-31T08:00:00Z',
            completed_at: '2024-01-31T08:45:00Z'
          },
          {
            id: '2',
            run_number: 'CR-2024-002',
            run_name: 'Q1 2024 Actual Costing',
            costing_type: 'actual',
            run_date: '2024-01-25',
            period: '001.2024',
            fiscal_year: 2024,
            plant: 'Plant-002',
            run_status: 'running',
            total_products: 85,
            successful_costings: 62,
            failed_costings: 0,
            total_processing_time: 0,
            started_by: 'cost_analyst1',
            started_at: '2024-01-25T14:30:00Z'
          }
        ]

        // Mock metrics
        const mockMetrics: ProductCostingMetrics = {
          total_products: 5,
          active_products: 5,
          total_standard_cost: 119500,
          total_actual_cost: 121225,
          average_variance: 1.4,
          cost_estimates: 12,
          pending_approvals: 2,
          recent_updates: 8
        }

        setProducts(mockProducts)
        setCostEstimates(mockCostEstimates)
        setVariances(mockVariances)
        setCostingRuns(mockCostingRuns)
        setMetrics(mockMetrics)
        
      } catch (error) {
        console.error('Error loading product costing data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProductCostingData()
  }, [organization?.id])

  // Filter products based on search and filters
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter
    const matchesType = typeFilter === 'all' || product.product_type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  // Auth Guard
  if (!isAuthenticated) {
    return (
      <div className="sap-font min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access Product Costing.</p>
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
            title: 'Total Products',
            value: metrics?.total_products?.toString() || '0',
            subtitle: `${metrics?.active_products || 0} active products`,
            icon: Package,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
          },
          {
            title: 'Total Standard Cost',
            value: `₹${metrics?.total_standard_cost?.toLocaleString() || '0'}`,
            subtitle: 'Aggregate standard cost',
            icon: DollarSign,
            color: 'text-green-600',
            bgColor: 'bg-green-50'
          },
          {
            title: 'Average Variance',
            value: `${metrics?.average_variance?.toFixed(1) || '0'}%`,
            subtitle: 'Standard vs actual cost',
            icon: TrendingUp,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50'
          },
          {
            title: 'Cost Estimates',
            value: metrics?.cost_estimates?.toString() || '0',
            subtitle: `${metrics?.pending_approvals || 0} pending approval`,
            icon: Calculator,
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

      {/* Product Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Product Type Distribution
          </h3>
          <div className="space-y-4">
            {[
              { type: 'Finished Goods', count: 2, color: 'bg-blue-500', percentage: 40 },
              { type: 'Semi-Finished', count: 1, color: 'bg-green-500', percentage: 20 },
              { type: 'Raw Materials', count: 1, color: 'bg-orange-500', percentage: 20 },
              { type: 'Services', count: 1, color: 'bg-purple-500', percentage: 20 }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-sm font-medium text-gray-700">{item.type}</span>
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
            Cost Variance Analysis
          </h3>
          <div className="space-y-4">
            {[
              { product: 'Smartphone Model X', variance: 4.8, color: 'text-red-600', bgColor: 'bg-red-100' },
              { product: 'Circuit Board Assembly', variance: 4.3, color: 'text-red-600', bgColor: 'bg-red-100' },
              { product: 'Technical Support Service', variance: 3.3, color: 'text-red-600', bgColor: 'bg-red-100' },
              { product: 'Laptop Professional', variance: -1.8, color: 'text-green-600', bgColor: 'bg-green-100' },
              { product: 'Silicon Wafer', variance: -3.5, color: 'text-green-600', bgColor: 'bg-green-100' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-700">{item.product}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium px-2 py-1 rounded ${item.bgColor} ${item.color}`}>
                    {item.variance > 0 ? '+' : ''}{item.variance}%
                  </span>
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
          Recent Costing Activities
        </h3>
        <div className="space-y-4">
          {[
            {
              action: 'Cost Estimate Approved',
              description: 'Laptop Professional standard cost estimate approved',
              time: '1 hour ago',
              icon: CheckCircle,
              color: 'text-green-600'
            },
            {
              action: 'Variance Identified',
              description: 'Material price variance detected for Smartphone Model X',
              time: '3 hours ago',
              icon: AlertTriangle,
              color: 'text-orange-600'
            },
            {
              action: 'Costing Run Completed',
              description: 'January 2024 standard costing run completed successfully',
              time: '5 hours ago',
              icon: Factory,
              color: 'text-blue-600'
            },
            {
              action: 'BOM Updated',
              description: 'Circuit Board Assembly BOM updated with new components',
              time: '1 day ago',
              icon: List,
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

  const renderProducts = () => (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked</option>
          </select>
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="finished_good">Finished Good</option>
            <option value="semi_finished">Semi-Finished</option>
            <option value="raw_material">Raw Material</option>
            <option value="service">Service</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            New Product
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Product Code</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Product Name</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Standard Cost</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Actual Cost</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Variance</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Method</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="font-medium text-blue-600">{product.product_code}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-gray-900">{product.product_name}</div>
                      <div className="text-sm text-gray-600">{product.description}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.product_type === 'finished_good' ? 'bg-blue-100 text-blue-800' :
                      product.product_type === 'semi_finished' ? 'bg-green-100 text-green-800' :
                      product.product_type === 'raw_material' ? 'bg-orange-100 text-orange-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {product.product_type.replace('_', ' ').charAt(0).toUpperCase() + product.product_type.replace('_', ' ').slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium">₹{product.standard_cost.toLocaleString()}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium">₹{product.actual_cost.toLocaleString()}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-medium ${product.variance_percent < 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.variance_percent > 0 ? '+' : ''}{product.variance_percent.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-900">{product.costing_method.charAt(0).toUpperCase() + product.costing_method.slice(1)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.status === 'active' ? 'bg-green-100 text-green-800' :
                      product.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
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

  const renderEstimates = () => (
    <div className="space-y-6">
      {/* Cost Estimates Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: 'Total Estimates',
            value: costEstimates.length.toString(),
            subtitle: 'All cost estimates',
            icon: Calculator,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
          },
          {
            title: 'Approved Estimates',
            value: costEstimates.filter(e => e.estimate_status === 'approved').length.toString(),
            subtitle: 'Ready for use',
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-50'
          },
          {
            title: 'Draft Estimates',
            value: costEstimates.filter(e => e.estimate_status === 'draft').length.toString(),
            subtitle: 'Under development',
            icon: Edit,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50'
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

      {/* Cost Estimates List */}
      <div className="bg-white rounded-lg shadow-md border border-gray-300 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Cost Estimates
          </h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            New Estimate
          </button>
        </div>
        
        <div className="space-y-6">
          {costEstimates.map((estimate) => (
            <div key={estimate.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg">{estimate.estimate_name}</h4>
                  <p className="text-sm text-gray-600">Estimate: {estimate.estimate_number}</p>
                  <p className="text-sm text-gray-600">Product: {products.find(p => p.id === estimate.product_id)?.product_name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    estimate.estimate_status === 'approved' ? 'bg-green-100 text-green-800' :
                    estimate.estimate_status === 'released' ? 'bg-blue-100 text-blue-800' :
                    estimate.estimate_status === 'draft' ? 'bg-gray-100 text-gray-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {estimate.estimate_status.charAt(0).toUpperCase() + estimate.estimate_status.slice(1)}
                  </span>
                  <span className="text-sm font-medium text-gray-600">₹{estimate.unit_cost.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <h5 className="text-xs font-medium text-gray-700 mb-1">Material Cost</h5>
                  <p className="text-lg font-bold text-blue-600">₹{estimate.material_cost.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">{((estimate.material_cost / estimate.total_cost) * 100).toFixed(1)}%</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <h5 className="text-xs font-medium text-gray-700 mb-1">Labor Cost</h5>
                  <p className="text-lg font-bold text-green-600">₹{estimate.labor_cost.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">{((estimate.labor_cost / estimate.total_cost) * 100).toFixed(1)}%</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                  <h5 className="text-xs font-medium text-gray-700 mb-1">Overhead Cost</h5>
                  <p className="text-lg font-bold text-orange-600">₹{estimate.overhead_cost.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">{((estimate.overhead_cost / estimate.total_cost) * 100).toFixed(1)}%</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <h5 className="text-xs font-medium text-gray-700 mb-1">Total Cost</h5>
                  <p className="text-lg font-bold text-purple-600">₹{estimate.total_cost.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">Per {estimate.base_unit}</p>
                </div>
              </div>
              
              {/* Cost Breakdown */}
              <div className="border-t border-gray-200 pt-4">
                <h5 className="text-sm font-medium text-gray-700 mb-3">Cost Breakdown</h5>
                <div className="space-y-2">
                  {estimate.cost_breakdown.map((component) => (
                    <div key={component.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          component.component_type === 'material' ? 'bg-blue-500' :
                          component.component_type === 'labor' ? 'bg-green-500' :
                          component.component_type === 'overhead' ? 'bg-orange-500' :
                          'bg-purple-500'
                        }`}></div>
                        <span className="text-gray-700">{component.cost_element_name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-600">{component.quantity} {component.unit}</span>
                        <span className="text-gray-600">₹{component.unit_cost.toLocaleString()}</span>
                        <span className="font-medium text-gray-900">₹{component.total_cost.toLocaleString()}</span>
                        <span className="text-xs text-gray-500 w-12">{component.cost_percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-500">Version: {estimate.costing_version}</span>
                  <span className="text-xs text-gray-500">Date: {new Date(estimate.costing_date).toLocaleDateString()}</span>
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

  return (
    <div className="sap-font min-h-screen bg-gray-100">
      <SapNavbar 
        title="HERA Finance" 
        breadcrumb="Finance • Product Costing"
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
                  <Package className="w-8 h-8 text-blue-600" />
                  Product Costing
                </h1>
                <p className="text-gray-600 mt-1">
                  Comprehensive product costing with standard, actual, and target cost management
                </p>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Calculator className="w-4 h-4" />
                  Cost Estimate
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  <Factory className="w-4 h-4" />
                  Costing Run
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
                  { key: 'products', label: 'Products', icon: Package },
                  { key: 'estimates', label: 'Cost Estimates', icon: Calculator },
                  { key: 'bom', label: 'Bill of Materials', icon: List },
                  { key: 'routing', label: 'Routing', icon: Workflow },
                  { key: 'variance', label: 'Variance Analysis', icon: TrendingUp },
                  { key: 'runs', label: 'Costing Runs', icon: Factory },
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
                  {activeTab === 'products' && renderProducts()}
                  {activeTab === 'estimates' && renderEstimates()}
                  {activeTab === 'bom' && (
                    <div className="text-center py-12">
                      <List className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Bill of Materials</h3>
                      <p className="text-gray-600">BOM management functionality coming soon</p>
                    </div>
                  )}
                  {activeTab === 'routing' && (
                    <div className="text-center py-12">
                      <Workflow className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Routing</h3>
                      <p className="text-gray-600">Routing management functionality coming soon</p>
                    </div>
                  )}
                  {activeTab === 'variance' && (
                    <div className="text-center py-12">
                      <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Variance Analysis</h3>
                      <p className="text-gray-600">Variance analysis functionality coming soon</p>
                    </div>
                  )}
                  {activeTab === 'runs' && (
                    <div className="text-center py-12">
                      <Factory className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Costing Runs</h3>
                      <p className="text-gray-600">Costing runs functionality coming soon</p>
                    </div>
                  )}
                  {activeTab === 'reports' && (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Reports</h3>
                      <p className="text-gray-600">Reporting functionality coming soon</p>
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