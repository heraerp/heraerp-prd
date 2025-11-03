'use client'

/**
 * MatrixIT World ERP - Inventory Management (Enterprise)
 * SAP Fiori Design System Implementation
 * Smart Code: HERA.RETAIL.MATRIXITWORLD.INVENTORY.ENTERPRISE.v1
 * 
 * Enterprise-grade inventory management with Fiori design patterns
 */

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useEntities, useEntity, useUpsertEntity, useDeleteEntity } from '@/lib/hera-react-provider'
import { brandingEngine } from '@/lib/platform/branding-engine'
import { 
  Package,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  DollarSign,
  Warehouse,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Settings,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Building2,
  Star,
  Activity,
  FileText,
  Bell,
  X,
  Calendar,
  MapPin,
  Truck,
  Monitor,
  Smartphone,
  HardDrive,
  Target,
  BarChart3,
  Layers,
  ShoppingCart
} from 'lucide-react'

// Enterprise interfaces following Fiori standards
interface InventoryItem {
  id: string
  sku: string
  productName: string
  category: 'pc' | 'mobile' | 'accessories' | 'components'
  brand: string
  model: string
  totalStock: number
  availableStock: number
  reservedStock: number
  costPrice: number
  sellingPrice: number
  lastPurchaseDate: string
  reorderLevel: number
  reorderQuantity: number
  status: 'active' | 'discontinued' | 'out_of_stock' | 'low_stock'
  supplier: string
  location: string
  branchStock: {
    [branchName: string]: number
  }
}

interface InventoryFilter {
  category: string
  status: string
  brand: string
  location: string
  stockLevel: string
  searchTerm: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

const ENTITY_TYPE = 'INVENTORY_ITEM'
const SMART_CODE_BASE = 'HERA.RETAIL.INVENTORY.ITEM'

export default function MatrixITWorldInventoryEnterprise() {
  const router = useRouter()
  const { user, organization, isAuthenticated, contextLoading } = useHERAAuth()
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [showItemDetail, setShowItemDetail] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

  // Filters state
  const [filters, setFilters] = useState<InventoryFilter>({
    category: 'all',
    status: 'all',
    brand: 'all',
    location: 'all',
    stockLevel: 'all',
    searchTerm: '',
    sortBy: 'productName',
    sortOrder: 'asc'
  })

  // Authentication check
  useEffect(() => {
    if (!contextLoading && !isAuthenticated) {
      router.push('/retail1/matrixitworld/login')
    }
  }, [isAuthenticated, contextLoading, router])

  // HERA Entity hooks
  const {
    entities: items,
    loading: itemsLoading,
    error: itemsError,
    refetch: refetchItems
  } = useEntities({
    entityType: ENTITY_TYPE,
    organizationId: organization?.id,
    includeDeleted: false
  })

  const { upsertEntity: upsertItem, loading: upsertLoading } = useUpsertEntity()
  const { deleteEntity: deleteItem, loading: deleteLoading } = useDeleteEntity()

  // Initialize branding
  useEffect(() => {
    if (organization?.id) {
      brandingEngine.initializeBranding(organization.id)
    }
  }, [organization?.id])

  // Sample data for demo - replace with real data from HERA entities
  const sampleItems: InventoryItem[] = [
    {
      id: '1',
      sku: 'MTX-PC-001',
      productName: 'Dell Inspiron 15 3000',
      category: 'pc',
      brand: 'Dell',
      model: 'Inspiron 15 3000',
      totalStock: 45,
      availableStock: 38,
      reservedStock: 7,
      costPrice: 35000,
      sellingPrice: 42000,
      lastPurchaseDate: '2024-10-20',
      reorderLevel: 10,
      reorderQuantity: 20,
      status: 'active',
      supplier: 'Dell India',
      location: 'Main Warehouse',
      branchStock: {
        'Kochi Main': 15,
        'Thrissur': 12,
        'Kozhikode': 8,
        'Kottayam': 5,
        'Palakkad': 3,
        'Kollam': 2
      }
    },
    {
      id: '2',
      sku: 'MTX-MOB-002',
      productName: 'iPhone 15 Pro Max',
      category: 'mobile',
      brand: 'Apple',
      model: 'iPhone 15 Pro Max',
      totalStock: 8,
      availableStock: 5,
      reservedStock: 3,
      costPrice: 120000,
      sellingPrice: 134900,
      lastPurchaseDate: '2024-10-25',
      reorderLevel: 5,
      reorderQuantity: 10,
      status: 'low_stock',
      supplier: 'Apple Authorized',
      location: 'Premium Section',
      branchStock: {
        'Kochi Main': 3,
        'Thrissur': 2,
        'Kozhikode': 1,
        'Kottayam': 1,
        'Palakkad': 1,
        'Kollam': 0
      }
    },
    {
      id: '3',
      sku: 'MTX-ACC-003',
      productName: 'Logitech MX Master 3S',
      category: 'accessories',
      brand: 'Logitech',
      model: 'MX Master 3S',
      totalStock: 125,
      availableStock: 118,
      reservedStock: 7,
      costPrice: 6500,
      sellingPrice: 8999,
      lastPurchaseDate: '2024-10-22',
      reorderLevel: 25,
      reorderQuantity: 50,
      status: 'active',
      supplier: 'Logitech India',
      location: 'Accessories Bay',
      branchStock: {
        'Kochi Main': 35,
        'Thrissur': 28,
        'Kozhikode': 22,
        'Kottayam': 18,
        'Palakkad': 12,
        'Kollam': 10
      }
    },
    {
      id: '4',
      sku: 'MTX-COMP-004',
      productName: 'Samsung 970 EVO Plus 1TB',
      category: 'components',
      brand: 'Samsung',
      model: '970 EVO Plus',
      totalStock: 0,
      availableStock: 0,
      reservedStock: 0,
      costPrice: 8500,
      sellingPrice: 11999,
      lastPurchaseDate: '2024-09-15',
      reorderLevel: 15,
      reorderQuantity: 30,
      status: 'out_of_stock',
      supplier: 'Samsung India',
      location: 'Components Storage',
      branchStock: {
        'Kochi Main': 0,
        'Thrissur': 0,
        'Kozhikode': 0,
        'Kottayam': 0,
        'Palakkad': 0,
        'Kollam': 0
      }
    }
  ]

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    let filtered = sampleItems.filter(item => {
      // Category filter
      if (filters.category !== 'all' && item.category !== filters.category) return false
      
      // Status filter
      if (filters.status !== 'all' && item.status !== filters.status) return false
      
      // Brand filter
      if (filters.brand !== 'all' && item.brand !== filters.brand) return false
      
      // Stock level filter
      if (filters.stockLevel !== 'all') {
        if (filters.stockLevel === 'low' && item.availableStock > item.reorderLevel) return false
        if (filters.stockLevel === 'out' && item.availableStock > 0) return false
        if (filters.stockLevel === 'good' && item.availableStock <= item.reorderLevel) return false
      }
      
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase()
        return (
          item.sku.toLowerCase().includes(searchLower) ||
          item.productName.toLowerCase().includes(searchLower) ||
          item.brand.toLowerCase().includes(searchLower) ||
          item.model.toLowerCase().includes(searchLower)
        )
      }
      
      return true
    })

    // Sort items
    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (filters.sortBy) {
        case 'productName':
          aValue = a.productName.toLowerCase()
          bValue = b.productName.toLowerCase()
          break
        case 'sku':
          aValue = a.sku.toLowerCase()
          bValue = b.sku.toLowerCase()
          break
        case 'totalStock':
          aValue = a.totalStock
          bValue = b.totalStock
          break
        case 'sellingPrice':
          aValue = a.sellingPrice
          bValue = b.sellingPrice
          break
        default:
          aValue = a.productName.toLowerCase()
          bValue = b.productName.toLowerCase()
      }

      if (filters.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [filters])

  const handleRefresh = async () => {
    setRefreshing(true)
    await refetchItems()
    setTimeout(() => setRefreshing(false), 1000)
  }

  const handleItemClick = (item: InventoryItem) => {
    setSelectedItem(item)
    setShowItemDetail(true)
  }

  const handleFilterChange = (key: keyof InventoryFilter, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'low_stock':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'out_of_stock':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'discontinued':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pc': return Monitor
      case 'mobile': return Smartphone
      case 'accessories': return Package
      case 'components': return HardDrive
      default: return Package
    }
  }

  const getStockStatus = (item: InventoryItem) => {
    if (item.availableStock === 0) return 'Out of Stock'
    if (item.availableStock <= item.reorderLevel) return 'Low Stock'
    return 'In Stock'
  }

  const getStockStatusColor = (item: InventoryItem) => {
    if (item.availableStock === 0) return 'text-red-600'
    if (item.availableStock <= item.reorderLevel) return 'text-orange-600'
    return 'text-green-600'
  }

  if (contextLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--brand-background-color, #ffffff)' }}
      >
        <div className="text-center">
          <div 
            className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--brand-primary, #F5C400) transparent transparent transparent' }}
          ></div>
          <p style={{ color: 'var(--brand-text-secondary, #757575)' }}>
            Loading Inventory Management...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: 'var(--brand-background-color, #ffffff)' }}
    >
      {/* SAP Fiori Header Bar - Matrix Gold Theme */}
      <div 
        className="border-b shadow-sm"
        style={{ 
          backgroundColor: 'var(--brand-surface-color, #ffffff)',
          borderColor: 'var(--brand-border, #E0E0E0)'
        }}
      >
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Breadcrumb */}
            <div className="flex items-center space-x-4">
              <Link 
                href="/retail1/matrixitworld/dashboard" 
                className="hover:opacity-80 transition-opacity"
                style={{ color: 'var(--brand-primary, #F5C400)' }}
              >
                Dashboard
              </Link>
              <ChevronRight 
                className="w-4 h-4" 
                style={{ color: 'var(--brand-text-secondary, #757575)' }} 
              />
              <span 
                className="font-medium"
                style={{ color: 'var(--brand-text-primary, #2C2C2C)' }}
              >
                Inventory Management
              </span>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 rounded-lg transition-colors hover:opacity-80"
                style={{ 
                  color: 'var(--brand-text-secondary, #757575)',
                  backgroundColor: refreshing ? 'var(--brand-surface-color, #FFF8E1)' : 'transparent'
                }}
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <Link href="/retail1/matrixitworld/dashboard">
                <button 
                  className="p-2 rounded-lg transition-colors hover:opacity-80"
                  style={{ color: 'var(--brand-text-secondary, #757575)' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header - Matrix Gold Theme */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--brand-surface-color, #FFF8E1)' }}
              >
                <Package 
                  className="w-6 h-6" 
                  style={{ color: 'var(--brand-primary, #F5C400)' }}
                />
              </div>
              <div>
                <h1 
                  className="text-2xl font-bold"
                  style={{ color: 'var(--brand-text-primary, #2C2C2C)' }}
                >
                  Inventory Management
                </h1>
                <p style={{ color: 'var(--brand-text-secondary, #757575)' }}>
                  Multi-branch stock control and tracking
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                className="px-4 py-2 border rounded-lg hover:opacity-80 transition-opacity flex items-center space-x-2"
                style={{ 
                  borderColor: 'var(--brand-border, #E0E0E0)',
                  color: 'var(--brand-text-primary, #2C2C2C)',
                  backgroundColor: 'var(--brand-background-color, #FFFFFF)'
                }}
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button 
                className="px-4 py-2 border rounded-lg hover:opacity-80 transition-opacity flex items-center space-x-2"
                style={{ 
                  borderColor: 'var(--brand-border, #E0E0E0)',
                  color: 'var(--brand-text-primary, #2C2C2C)',
                  backgroundColor: 'var(--brand-background-color, #FFFFFF)'
                }}
              >
                <Upload className="w-4 h-4" />
                <span>Import</span>
              </button>
              <button 
                className="px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center space-x-2"
                style={{ 
                  backgroundColor: 'var(--brand-primary, #F5C400)',
                  color: 'var(--brand-text-primary, #2C2C2C)'
                }}
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards - Matrix Gold Theme */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div 
            className="rounded-lg border p-6"
            style={{ 
              backgroundColor: 'var(--brand-background-color, #FFFFFF)',
              borderColor: 'var(--brand-border, #E0E0E0)'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p 
                  className="text-sm font-medium"
                  style={{ color: 'var(--brand-text-secondary, #757575)' }}
                >
                  Total Products
                </p>
                <p 
                  className="text-2xl font-bold"
                  style={{ color: 'var(--brand-text-primary, #2C2C2C)' }}
                >
                  2,847
                </p>
              </div>
              <Package 
                className="w-8 h-8" 
                style={{ color: 'var(--brand-primary, #F5C400)' }}
              />
            </div>
            <div className="flex items-center mt-2">
              <ArrowUp 
                className="w-4 h-4" 
                style={{ color: 'var(--brand-success, #4CAF50)' }}
              />
              <span 
                className="text-sm ml-1"
                style={{ color: 'var(--brand-success, #4CAF50)' }}
              >
                +142 this month
              </span>
            </div>
          </div>
          
          <div 
            className="rounded-lg border p-6"
            style={{ 
              backgroundColor: 'var(--brand-background-color, #FFFFFF)',
              borderColor: 'var(--brand-border, #E0E0E0)'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p 
                  className="text-sm font-medium"
                  style={{ color: 'var(--brand-text-secondary, #757575)' }}
                >
                  Stock Value
                </p>
                <p 
                  className="text-2xl font-bold"
                  style={{ color: 'var(--brand-text-primary, #2C2C2C)' }}
                >
                  ₹2.4Cr
                </p>
              </div>
              <DollarSign 
                className="w-8 h-8" 
                style={{ color: 'var(--brand-success, #4CAF50)' }}
              />
            </div>
            <div className="flex items-center mt-2">
              <ArrowUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600 ml-1">+8.5% from last month</span>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-gray-900">23</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
            <div className="flex items-center mt-2">
              <ArrowDown className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-600 ml-1">+5 from yesterday</span>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-gray-900">7</p>
              </div>
              <X className="w-8 h-8 text-red-600" />
            </div>
            <div className="flex items-center mt-2">
              <ArrowUp className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-600 ml-1">+2 from yesterday</span>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Inventory Items</h3>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 border rounded-lg transition-colors flex items-center space-x-2 ${
                  showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'table' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'cards' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by SKU, product name, brand, or model..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="pc">PC & Laptops</option>
                  <option value="mobile">Mobile Phones</option>
                  <option value="accessories">Accessories</option>
                  <option value="components">Components</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="discontinued">Discontinued</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <select
                  value={filters.brand}
                  onChange={(e) => handleFilterChange('brand', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Brands</option>
                  <option value="Apple">Apple</option>
                  <option value="Dell">Dell</option>
                  <option value="Samsung">Samsung</option>
                  <option value="Logitech">Logitech</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Level</label>
                <select
                  value={filters.stockLevel}
                  onChange={(e) => handleFilterChange('stockLevel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Levels</option>
                  <option value="good">Good Stock</option>
                  <option value="low">Low Stock</option>
                  <option value="out">Out of Stock</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="productName">Product Name</option>
                  <option value="sku">SKU</option>
                  <option value="totalStock">Stock Quantity</option>
                  <option value="sellingPrice">Price</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>
          )}

          {/* Results count */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {filteredItems.length} of {sampleItems.length} items
            </p>
            {selectedItems.length > 0 && (
              <p className="text-sm font-medium text-blue-600">
                {selectedItems.length} item(s) selected
              </p>
            )}
          </div>
        </div>

        {/* Inventory Items Table/Cards */}
        <div className="bg-white rounded-lg border overflow-hidden">
          {viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Available
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.map((item) => {
                    const CategoryIcon = getCategoryIcon(item.category)
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleItemClick(item)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                              <CategoryIcon className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                              <div className="text-sm text-gray-500">{item.sku} • {item.brand}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(item.status)}`}>
                            {getStockStatus(item)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <span className={getStockStatusColor(item)}>{item.availableStock}</span>
                            <span className="text-gray-500"> / {item.totalStock}</span>
                          </div>
                          {item.reservedStock > 0 && (
                            <div className="text-xs text-gray-500">
                              {item.reservedStock} reserved
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{item.sellingPrice.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full capitalize">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button className="text-blue-600 hover:text-blue-700">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="text-gray-600 hover:text-gray-700">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="text-gray-400 hover:text-gray-600">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {filteredItems.map((item) => {
                const CategoryIcon = getCategoryIcon(item.category)
                return (
                  <div
                    key={item.id}
                    className="border rounded-lg p-6 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <CategoryIcon className="w-6 h-6 text-purple-600" />
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(item.status)}`}>
                        {getStockStatus(item)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{item.productName}</h3>
                    <p className="text-sm text-gray-600 mb-2">{item.sku} • {item.brand}</p>
                    <div className="space-y-1 text-sm text-gray-600 mb-4">
                      <div className="flex items-center justify-between">
                        <span>Available:</span>
                        <span className={`font-medium ${getStockStatusColor(item)}`}>
                          {item.availableStock} / {item.totalStock}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Price:</span>
                        <span className="font-medium">₹{item.sellingPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Category:</span>
                        <span className="font-medium capitalize">{item.category}</span>
                      </div>
                    </div>
                    {item.availableStock <= item.reorderLevel && (
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center text-xs text-orange-600">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Reorder Level Reached
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to <span className="font-medium">10</span> of{' '}
              <span className="font-medium">{filteredItems.length}</span> results
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50" disabled>
              Previous
            </button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm">1</button>
            <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">2</button>
            <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">3</button>
            <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Item Detail Modal */}
      {showItemDetail && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Product Details</h2>
                <button
                  onClick={() => setShowItemDetail(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Product Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">SKU:</span>
                        <span className="font-medium">{selectedItem.sku}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Product Name:</span>
                        <span className="font-medium">{selectedItem.productName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Brand:</span>
                        <span className="font-medium">{selectedItem.brand}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Model:</span>
                        <span className="font-medium">{selectedItem.model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium capitalize">{selectedItem.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(selectedItem.status)}`}>
                          {selectedItem.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Stock Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Stock:</span>
                        <span className="font-medium">{selectedItem.totalStock}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Available:</span>
                        <span className={`font-medium ${getStockStatusColor(selectedItem)}`}>
                          {selectedItem.availableStock}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reserved:</span>
                        <span className="font-medium">{selectedItem.reservedStock}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reorder Level:</span>
                        <span className="font-medium">{selectedItem.reorderLevel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reorder Quantity:</span>
                        <span className="font-medium">{selectedItem.reorderQuantity}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Pricing Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cost Price:</span>
                        <span className="font-medium">₹{selectedItem.costPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Selling Price:</span>
                        <span className="font-bold text-lg">₹{selectedItem.sellingPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Margin:</span>
                        <span className="font-medium text-green-600">
                          ₹{(selectedItem.sellingPrice - selectedItem.costPrice).toLocaleString()} 
                          ({(((selectedItem.sellingPrice - selectedItem.costPrice) / selectedItem.costPrice) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Supplier Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Supplier:</span>
                        <span className="font-medium">{selectedItem.supplier}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Purchase:</span>
                        <span className="font-medium">{new Date(selectedItem.lastPurchaseDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-medium">{selectedItem.location}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Branch Stock Distribution</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(selectedItem.branchStock).map(([branch, stock]) => (
                      <div key={branch} className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-gray-900">{branch}</div>
                        <div className={`text-lg font-bold ${stock === 0 ? 'text-red-600' : stock <= 5 ? 'text-orange-600' : 'text-green-600'}`}>
                          {stock}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Edit Product
                  </button>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Reorder Stock
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