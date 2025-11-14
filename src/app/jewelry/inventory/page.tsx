'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Package,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Gem,
  Diamond,
  Crown,
  Sparkles,
  Scale,
  DollarSign,
  Calendar,
  MapPin,
  Archive,
  RefreshCw,
  Download,
  Upload,
  BarChart3,
  PieChart,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Trash2,
  X
} from 'lucide-react'
import '@/styles/jewelry-glassmorphism.css'

interface InventoryItem {
  id: string
  name: string
  sku: string
  category: string
  type: string
  purity: number
  grossWeight: number
  netWeight: number
  stoneWeight: number
  quantity: number
  unitPrice: number
  totalValue: number
  location: string
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'reserved'
  lastUpdated: string
  supplier: string
  description: string
  image?: string
}

export default function JewelryInventoryPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [filterValues, setFilterValues] = useState({
    minValue: '',
    maxValue: '',
    minWeight: '',
    maxWeight: '',
    location: 'all',
    supplier: 'all'
  })

  // Mock inventory data
  const inventoryItems: InventoryItem[] = [
    {
      id: '1',
      name: 'Diamond Solitaire Ring',
      sku: 'DSR-001',
      category: 'Rings',
      type: 'Engagement Ring',
      purity: 18,
      grossWeight: 5.2,
      netWeight: 4.8,
      stoneWeight: 0.4,
      quantity: 3,
      unitPrice: 12500,
      totalValue: 37500,
      location: 'Vault A-1',
      status: 'in_stock',
      lastUpdated: '2024-01-15',
      supplier: 'Diamond Elite Co.',
      description: '1.2ct Round Brilliant Diamond in 18K White Gold Setting'
    },
    {
      id: '2',
      name: 'Gold Tennis Bracelet',
      sku: 'GTB-002',
      category: 'Bracelets',
      type: 'Tennis Bracelet',
      purity: 14,
      grossWeight: 12.3,
      netWeight: 11.8,
      stoneWeight: 0.5,
      quantity: 1,
      unitPrice: 8900,
      totalValue: 8900,
      location: 'Display Case B',
      status: 'low_stock',
      lastUpdated: '2024-01-14',
      supplier: 'Golden Chains Ltd.',
      description: '14K Yellow Gold Tennis Bracelet with 2ct Total Diamond Weight'
    },
    {
      id: '3',
      name: 'Pearl Necklace Set',
      sku: 'PNS-003',
      category: 'Necklaces',
      type: 'Pearl Set',
      purity: 14,
      grossWeight: 25.6,
      netWeight: 25.0,
      stoneWeight: 0.6,
      quantity: 0,
      unitPrice: 4200,
      totalValue: 0,
      location: 'Vault A-2',
      status: 'out_of_stock',
      lastUpdated: '2024-01-12',
      supplier: 'Pearl Paradise Inc.',
      description: 'Cultured Pearl Necklace and Earring Set with 14K Gold Clasp'
    },
    {
      id: '4',
      name: 'Sapphire Earrings',
      sku: 'SE-004',
      category: 'Earrings',
      type: 'Stud Earrings',
      purity: 18,
      grossWeight: 3.2,
      netWeight: 2.8,
      stoneWeight: 0.4,
      quantity: 2,
      unitPrice: 6750,
      totalValue: 13500,
      location: 'Display Case A',
      status: 'reserved',
      lastUpdated: '2024-01-13',
      supplier: 'Sapphire Source Co.',
      description: '2ct Blue Sapphire Stud Earrings in 18K White Gold'
    },
    {
      id: '5',
      name: 'Rose Gold Wedding Band',
      sku: 'RGWB-005',
      category: 'Rings',
      type: 'Wedding Band',
      purity: 14,
      grossWeight: 4.5,
      netWeight: 4.5,
      stoneWeight: 0,
      quantity: 8,
      unitPrice: 1250,
      totalValue: 10000,
      location: 'Vault B-1',
      status: 'in_stock',
      lastUpdated: '2024-01-16',
      supplier: 'Wedding Rings Co.',
      description: '14K Rose Gold Classic Wedding Band - 4mm Width'
    },
    {
      id: '6',
      name: 'Emerald Pendant',
      sku: 'EP-006',
      category: 'Necklaces',
      type: 'Pendant',
      purity: 18,
      grossWeight: 8.9,
      netWeight: 8.2,
      stoneWeight: 0.7,
      quantity: 1,
      unitPrice: 9500,
      totalValue: 9500,
      location: 'Display Case C',
      status: 'low_stock',
      lastUpdated: '2024-01-11',
      supplier: 'Emerald Experts Ltd.',
      description: '3ct Colombian Emerald Pendant in 18K Yellow Gold'
    }
  ]

  const categories = ['all', 'Rings', 'Necklaces', 'Bracelets', 'Earrings']
  const statuses = ['all', 'in_stock', 'low_stock', 'out_of_stock', 'reserved']
  const locations = [
    'all',
    'Vault A-1',
    'Vault A-2',
    'Vault B-1',
    'Display Case A',
    'Display Case B',
    'Display Case C'
  ]
  const suppliers = [
    'all',
    'Diamond Elite Co.',
    'Golden Chains Ltd.',
    'Pearl Paradise Inc.',
    'Sapphire Source Co.',
    'Wedding Rings Co.',
    'Emerald Experts Ltd.'
  ]

  // Calculate summary metrics
  const totalItems = inventoryItems.reduce((sum, item) => sum + item.quantity, 0)
  const totalValue = inventoryItems.reduce((sum, item) => sum + item.totalValue, 0)
  const lowStockItems = inventoryItems.filter(
    item => item.status === 'low_stock' || item.status === 'out_of_stock'
  ).length
  const uniqueItems = inventoryItems.length

  // Enhanced filtering with advanced filters
  const filteredItems = inventoryItems
    .filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus

      // Advanced filters
      const matchesMinValue =
        !filterValues.minValue || item.totalValue >= parseFloat(filterValues.minValue)
      const matchesMaxValue =
        !filterValues.maxValue || item.totalValue <= parseFloat(filterValues.maxValue)
      const matchesMinWeight =
        !filterValues.minWeight || item.netWeight >= parseFloat(filterValues.minWeight)
      const matchesMaxWeight =
        !filterValues.maxWeight || item.netWeight <= parseFloat(filterValues.maxWeight)
      const matchesLocation =
        filterValues.location === 'all' || item.location === filterValues.location
      const matchesSupplier =
        filterValues.supplier === 'all' || item.supplier === filterValues.supplier

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus &&
        matchesMinValue &&
        matchesMaxValue &&
        matchesMinWeight &&
        matchesMaxWeight &&
        matchesLocation &&
        matchesSupplier
      )
    })
    .sort((a, b) => {
      const direction = sortOrder === 'asc' ? 1 : -1
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name) * direction
        case 'value':
          return (a.totalValue - b.totalValue) * direction
        case 'quantity':
          return (a.quantity - b.quantity) * direction
        case 'updated':
          return (new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime()) * direction
        default:
          return 0
      }
    })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <CheckCircle className="jewelry-icon-success" size={16} />
      case 'low_stock':
        return <AlertTriangle className="jewelry-icon-warning" size={16} />
      case 'out_of_stock':
        return <XCircle className="jewelry-icon-error" size={16} />
      case 'reserved':
        return <Clock className="jewelry-icon-info" size={16} />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'jewelry-status-active'
      case 'low_stock':
        return 'jewelry-status-pending'
      case 'out_of_stock':
        return 'jewelry-status-inactive'
      case 'reserved':
        return 'jewelry-status-luxury'
      default:
        return 'jewelry-status-inactive'
    }
  }

  // Bulk operations functions
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredItems.map(item => item.id))
    }
  }

  const clearSelection = () => {
    setSelectedItems([])
  }

  const handleBulkDelete = () => {
    if (selectedItems.length === 0) return
    if (confirm(`Are you sure you want to delete ${selectedItems.length} items?`)) {
      // Implementation would go here
      console.log('Bulk delete:', selectedItems)
      setSelectedItems([])
    }
  }

  const handleBulkExport = () => {
    if (selectedItems.length === 0) return
    // Implementation would go here
    console.log('Bulk export:', selectedItems)
  }

  const handleBulkStatusUpdate = (newStatus: string) => {
    if (selectedItems.length === 0) return
    // Implementation would go here
    console.log('Bulk status update:', selectedItems, newStatus)
    setSelectedItems([])
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setSelectedCategory('all')
    setSelectedStatus('all')
    setFilterValues({
      minValue: '',
      maxValue: '',
      minWeight: '',
      maxWeight: '',
      location: 'all',
      supplier: 'all'
    })
  }

  // Update bulk actions visibility based on selection
  React.useEffect(() => {
    setShowBulkActions(selectedItems.length > 0)
  }, [selectedItems])

  return (
    <div className="min-h-screen jewelry-gradient-premium">
      <div className="jewelry-glass-backdrop min-h-screen">
        <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="jewelry-heading text-4xl md:text-5xl mb-4">
              <Package className="inline-block mr-3 mb-2 jewelry-icon-gold" size={48} />
              Jewelry Inventory
            </h1>
            <p className="jewelry-text-luxury text-lg md:text-xl">
              Comprehensive inventory management and tracking
            </p>
          </motion.div>

          {/* Summary Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <div className="jewelry-glass-card jewelry-float p-6 text-center">
              <Package className="mx-auto mb-3 jewelry-icon-gold" size={32} />
              <h3 className="jewelry-text-high-contrast text-2xl font-bold">{totalItems}</h3>
              <p className="jewelry-text-muted text-sm font-medium">Total Items</p>
            </div>

            <div
              className="jewelry-glass-card jewelry-float p-6 text-center"
              style={{ animationDelay: '0.1s' }}
            >
              <DollarSign className="mx-auto mb-3 jewelry-icon-gold" size={32} />
              <h3 className="jewelry-text-high-contrast text-2xl font-bold">
                ${totalValue.toLocaleString()}
              </h3>
              <p className="jewelry-text-muted text-sm font-medium">Total Value</p>
            </div>

            <div
              className="jewelry-glass-card jewelry-float p-6 text-center"
              style={{ animationDelay: '0.2s' }}
            >
              <AlertTriangle className="mx-auto mb-3 jewelry-icon-gold" size={32} />
              <h3 className="jewelry-text-high-contrast text-2xl font-bold">{lowStockItems}</h3>
              <p className="jewelry-text-muted text-sm font-medium">Low Stock Items</p>
            </div>

            <div
              className="jewelry-glass-card jewelry-float p-6 text-center"
              style={{ animationDelay: '0.3s' }}
            >
              <Gem className="mx-auto mb-3 jewelry-icon-gold" size={32} />
              <h3 className="jewelry-text-high-contrast text-2xl font-bold">{uniqueItems}</h3>
              <p className="jewelry-text-muted text-sm font-medium">Unique Items</p>
            </div>
          </motion.div>

          {/* Bulk Actions Bar */}
          {showBulkActions && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="jewelry-glass-panel-strong border-l-4 border-jewelry-gold-500"
            >
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="jewelry-text-high-contrast font-semibold">
                    {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
                  </span>
                  <button
                    onClick={clearSelection}
                    className="jewelry-btn-secondary text-sm px-3 py-1"
                  >
                    Clear Selection
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleBulkExport}
                    className="jewelry-btn-secondary flex items-center space-x-2 px-3 py-2 text-sm"
                  >
                    <Download className="jewelry-icon-gold" size={16} />
                    <span>Export Selected</span>
                  </button>

                  <select
                    onChange={e => handleBulkStatusUpdate(e.target.value)}
                    className="jewelry-input text-sm"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Update Status
                    </option>
                    <option value="in_stock">In Stock</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="reserved">Reserved</option>
                  </select>

                  <button
                    onClick={handleBulkDelete}
                    className="jewelry-btn-secondary flex items-center space-x-2 px-3 py-2 text-sm text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="jewelry-icon-gold" size={16} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="jewelry-glass-panel"
          >
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 items-center flex-1">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 jewelry-icon-gold"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search inventory..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="jewelry-input pl-10 w-64"
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="jewelry-input"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="jewelry-input"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status === 'all' ? 'All Status' : status.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`jewelry-btn-secondary flex items-center space-x-2 px-4 py-2 ${showAdvancedFilters ? 'bg-jewelry-gold-500/20' : ''}`}
                >
                  <Filter className="jewelry-icon-gold" size={18} />
                  <span>Advanced</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={toggleSelectAll}
                  className="jewelry-btn-secondary flex items-center space-x-2 px-4 py-2"
                >
                  <CheckCircle className="jewelry-icon-gold" size={18} />
                  <span>
                    {selectedItems.length === filteredItems.length ? 'Deselect All' : 'Select All'}
                  </span>
                </button>
                <button className="jewelry-btn-secondary flex items-center space-x-2 px-4 py-2">
                  <Download className="jewelry-icon-gold" size={18} />
                  <span>Export</span>
                </button>
                <button className="jewelry-btn-secondary flex items-center space-x-2 px-4 py-2">
                  <Upload className="jewelry-icon-gold" size={18} />
                  <span>Import</span>
                </button>
                <button className="jewelry-btn-primary flex items-center space-x-2 px-4 py-2">
                  <Plus className="jewelry-icon-gold" size={18} />
                  <span>Add Item</span>
                </button>
              </div>
            </div>

            {/* Sort and View Options */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mt-4 pt-4 border-t border-jewelry-blue-200">
              <div className="flex items-center space-x-4">
                <span className="jewelry-text-luxury text-sm font-medium">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="jewelry-input text-sm"
                >
                  <option value="name">Name</option>
                  <option value="value">Value</option>
                  <option value="quantity">Quantity</option>
                  <option value="updated">Last Updated</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="jewelry-btn-secondary p-2"
                >
                  {sortOrder === 'asc' ? (
                    <TrendingUp className="jewelry-icon-gold" size={16} />
                  ) : (
                    <TrendingDown className="jewelry-icon-gold" size={16} />
                  )}
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <span className="jewelry-text-luxury text-sm font-medium">View:</span>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'jewelry-btn-primary' : 'jewelry-btn-secondary'}`}
                >
                  <Package size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'jewelry-btn-primary' : 'jewelry-btn-secondary'}`}
                >
                  <BarChart3 size={16} />
                </button>
              </div>
            </div>

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 pt-4 border-t border-jewelry-blue-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Value Range */}
                  <div className="space-y-2">
                    <label className="jewelry-text-luxury text-sm font-medium">
                      Value Range ($)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filterValues.minValue}
                        onChange={e =>
                          setFilterValues(prev => ({ ...prev, minValue: e.target.value }))
                        }
                        className="jewelry-input text-sm flex-1"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filterValues.maxValue}
                        onChange={e =>
                          setFilterValues(prev => ({ ...prev, maxValue: e.target.value }))
                        }
                        className="jewelry-input text-sm flex-1"
                      />
                    </div>
                  </div>

                  {/* Weight Range */}
                  <div className="space-y-2">
                    <label className="jewelry-text-luxury text-sm font-medium">
                      Weight Range (g)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filterValues.minWeight}
                        onChange={e =>
                          setFilterValues(prev => ({ ...prev, minWeight: e.target.value }))
                        }
                        className="jewelry-input text-sm flex-1"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filterValues.maxWeight}
                        onChange={e =>
                          setFilterValues(prev => ({ ...prev, maxWeight: e.target.value }))
                        }
                        className="jewelry-input text-sm flex-1"
                      />
                    </div>
                  </div>

                  {/* Location Filter */}
                  <div className="space-y-2">
                    <label className="jewelry-text-luxury text-sm font-medium">Location</label>
                    <select
                      value={filterValues.location}
                      onChange={e =>
                        setFilterValues(prev => ({ ...prev, location: e.target.value }))
                      }
                      className="jewelry-input text-sm w-full"
                    >
                      {locations.map(location => (
                        <option key={location} value={location}>
                          {location === 'all' ? 'All Locations' : location}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Supplier Filter */}
                  <div className="space-y-2">
                    <label className="jewelry-text-luxury text-sm font-medium">Supplier</label>
                    <select
                      value={filterValues.supplier}
                      onChange={e =>
                        setFilterValues(prev => ({ ...prev, supplier: e.target.value }))
                      }
                      className="jewelry-input text-sm w-full"
                    >
                      {suppliers.map(supplier => (
                        <option key={supplier} value={supplier}>
                          {supplier === 'all' ? 'All Suppliers' : supplier}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filter Actions */}
                  <div className="space-y-2">
                    <label className="jewelry-text-luxury text-sm font-medium">Actions</label>
                    <div className="flex gap-2">
                      <button
                        onClick={clearAllFilters}
                        className="jewelry-btn-secondary flex items-center space-x-2 px-3 py-2 text-sm flex-1"
                      >
                        <RefreshCw className="jewelry-icon-gold" size={16} />
                        <span>Clear All</span>
                      </button>
                      <button
                        onClick={() => setShowAdvancedFilters(false)}
                        className="jewelry-btn-secondary p-2"
                      >
                        <X className="jewelry-icon-gold" size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Inventory Grid/List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="jewelry-glass-panel"
          >
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`jewelry-glass-card jewelry-scale-hover p-6 relative ${selectedItems.includes(item.id) ? 'ring-2 ring-jewelry-gold-500/50' : ''}`}
                  >
                    {/* Selection Checkbox */}
                    <div className="absolute top-4 left-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                        className="jewelry-checkbox"
                      />
                    </div>

                    {/* Item Header */}
                    <div className="flex items-start justify-between mb-4 ml-8">
                      <div className="flex-1">
                        <h3 className="jewelry-text-high-contrast font-semibold text-lg mb-1">
                          {item.name}
                        </h3>
                        <p className="jewelry-text-muted text-sm font-mono">{item.sku}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(item.status)}
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}
                        >
                          {item.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Item Details */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="jewelry-text-muted text-sm">Category:</span>
                        <span className="jewelry-text-high-contrast text-sm font-medium">
                          {item.category}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="jewelry-text-muted text-sm">Purity:</span>
                        <span className="jewelry-text-high-contrast text-sm font-medium">
                          {item.purity}K
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="jewelry-text-muted text-sm">Net Weight:</span>
                        <span className="jewelry-text-high-contrast text-sm font-medium">
                          {item.netWeight}g
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="jewelry-text-muted text-sm">Quantity:</span>
                        <span className="jewelry-text-high-contrast text-sm font-bold">
                          {item.quantity}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="jewelry-text-muted text-sm">Unit Price:</span>
                        <span className="jewelry-text-high-contrast text-sm font-bold">
                          ${item.unitPrice.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-jewelry-blue-200">
                        <span className="jewelry-text-luxury text-sm font-medium">
                          Total Value:
                        </span>
                        <span className="jewelry-text-high-contrast text-lg font-bold">
                          ${item.totalValue.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Item Actions */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-jewelry-blue-200">
                      <div className="flex items-center space-x-1">
                        <MapPin className="jewelry-icon-gold" size={14} />
                        <span className="jewelry-text-muted text-xs">{item.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 rounded jewelry-btn-secondary hover:scale-105 transition-transform">
                          <Eye className="jewelry-icon-gold" size={16} />
                        </button>
                        <button className="p-2 rounded jewelry-btn-secondary hover:scale-105 transition-transform">
                          <Edit className="jewelry-icon-gold" size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-2">
                {/* List Header */}
                <div className="grid grid-cols-12 gap-4 p-4 jewelry-glass-card-subtle">
                  <div className="col-span-1 jewelry-text-luxury text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={
                        selectedItems.length === filteredItems.length && filteredItems.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="jewelry-checkbox"
                    />
                  </div>
                  <div className="col-span-3 jewelry-text-luxury text-sm font-semibold">Item</div>
                  <div className="col-span-2 jewelry-text-luxury text-sm font-semibold">
                    Category
                  </div>
                  <div className="col-span-1 jewelry-text-luxury text-sm font-semibold">Qty</div>
                  <div className="col-span-2 jewelry-text-luxury text-sm font-semibold">
                    Unit Price
                  </div>
                  <div className="col-span-1 jewelry-text-luxury text-sm font-semibold">
                    Total Value
                  </div>
                  <div className="col-span-1 jewelry-text-luxury text-sm font-semibold">Status</div>
                  <div className="col-span-1 jewelry-text-luxury text-sm font-semibold">
                    Actions
                  </div>
                </div>

                {/* List Items */}
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`grid grid-cols-12 gap-4 p-4 jewelry-glass-card hover:scale-[1.01] transition-transform ${selectedItems.includes(item.id) ? 'ring-2 ring-jewelry-gold-500/50' : ''}`}
                  >
                    <div className="col-span-1">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                        className="jewelry-checkbox"
                      />
                    </div>
                    <div className="col-span-3">
                      <h3 className="jewelry-text-high-contrast font-medium">{item.name}</h3>
                      <p className="jewelry-text-muted text-sm font-mono">{item.sku}</p>
                    </div>
                    <div className="col-span-2 jewelry-text-high-contrast">{item.category}</div>
                    <div className="col-span-1 jewelry-text-high-contrast font-bold">
                      {item.quantity}
                    </div>
                    <div className="col-span-2 jewelry-text-high-contrast font-medium">
                      ${item.unitPrice.toLocaleString()}
                    </div>
                    <div className="col-span-1 jewelry-text-high-contrast font-bold">
                      ${item.totalValue.toLocaleString()}
                    </div>
                    <div className="col-span-1">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(item.status)}`}
                      >
                        {item.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="col-span-1 flex items-center space-x-1">
                      <button className="p-1 rounded jewelry-btn-secondary hover:scale-105 transition-transform">
                        <Eye className="jewelry-icon-gold" size={14} />
                      </button>
                      <button className="p-1 rounded jewelry-btn-secondary hover:scale-105 transition-transform">
                        <Edit className="jewelry-icon-gold" size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <Package className="mx-auto mb-4 jewelry-icon-gold opacity-50" size={64} />
                <h3 className="jewelry-text-luxury text-xl font-semibold mb-2">No Items Found</h3>
                <p className="jewelry-text-muted">
                  Try adjusting your search criteria or add new inventory items.
                </p>
              </div>
            )}
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="text-center mt-12 mb-6"
          >
            <p className="text-jewelry-platinum-500 text-sm">
              Real-time inventory management powered by{' '}
              <span className="jewelry-text-luxury font-semibold">HERA Jewelry System</span>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
