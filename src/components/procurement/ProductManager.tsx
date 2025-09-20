'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Package,
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  Globe,
  MapPin,
  DollarSign,
  Calendar,
  TrendingUp,
  Star,
  AlertCircle,
  CheckCircle,
  Edit,
  Eye,
  MoreHorizontal,
  RefreshCw,
  Download,
  Upload,
  Box,
  Truck,
  Weight,
  Ruler,
  Palette,
  Shield,
  Clock
} from 'lucide-react'

// Steve Jobs: "Design is not just what it looks like and feels like. Design is how it works."
// This product catalog is designed to feel intuitive and powerful

interface Product {
  id: string
  name: string
  code: string
  status: 'active' | 'inactive' | 'discontinued'
  created_at: string
  updated_at: string
  description: string

  // Basic Product Information
  category: string
  brand: string
  model: string
  manufacturer: string

  // Inventory Details
  unit_of_measure: string
  minimum_stock: number
  reorder_point: number
  lead_time_days: number

  // Pricing
  standard_cost: number
  last_purchase_price: number
  list_price: number

  // Physical Specifications (optional)
  weight?: number
  dimensions?: string
  color?: string
  material?: string
  hazardous?: boolean
  perishable?: boolean
  storage_requirements?: string
  specifications?: Record<string, any>
}

interface ProductFormData {
  name: string
  category: string
  brand: string
  model: string
  manufacturer: string
  unit_of_measure: string
  minimum_stock: number
  reorder_point: number
  lead_time_days: number
  standard_cost: number
  list_price: number
  weight: number
  dimensions: string
  color: string
  material: string
  hazardous: boolean
  perishable: boolean
  storage_requirements: string
  description: string
}

// Steve Jobs: "Focus and simplicity" - Clean, purposeful component
export function ProductManager() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [categoryFilter, setCategoryFilter] = useState<string>('')

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    category: '',
    brand: '',
    model: '',
    manufacturer: '',
    unit_of_measure: 'each',
    minimum_stock: 0,
    reorder_point: 0,
    lead_time_days: 0,
    standard_cost: 0,
    list_price: 0,
    weight: 0,
    dimensions: '',
    color: '',
    material: '',
    hazardous: false,
    perishable: false,
    storage_requirements: '',
    description: ''
  })

  // Categories for filtering
  const categories = [
    'general',
    'raw_materials',
    'components',
    'supplies',
    'equipment',
    'consumables',
    'packaging',
    'maintenance',
    'safety',
    'chemicals'
  ]

  // Units of measure
  const units = [
    'each',
    'kg',
    'lb',
    'g',
    'oz',
    'l',
    'ml',
    'gal',
    'ft',
    'm',
    'cm',
    'in',
    'sqft',
    'sqm',
    'box',
    'pack',
    'case',
    'roll',
    'sheet'
  ]

  // Load products from API
  const loadProducts = async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log('📦 Product Manager: Loading products...')
      const response = await fetch('/api/v1/procurement/products?include_specs=true')
      const result = await response.json()

      if (result.success) {
        setProducts(result.data)
        setFilteredProducts(result.data)
        console.log(`✅ Loaded ${result.data.length} products`)
      } else {
        throw new Error(result.message || 'Failed to load products')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('❌ Product Manager: Load error:', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Apply filters
  useEffect(() => {
    let filtered = products

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        product =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(product => product.status === statusFilter)
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(product => product.category === categoryFilter)
    }

    setFilteredProducts(filtered)
  }, [products, searchTerm, statusFilter, categoryFilter])

  // Load data on mount
  useEffect(() => {
    loadProducts()
  }, [])

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : type === 'number'
            ? parseFloat(value) || 0
            : value
    }))
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      brand: '',
      model: '',
      manufacturer: '',
      unit_of_measure: 'each',
      minimum_stock: 0,
      reorder_point: 0,
      lead_time_days: 0,
      standard_cost: 0,
      list_price: 0,
      weight: 0,
      dimensions: '',
      color: '',
      material: '',
      hazardous: false,
      perishable: false,
      storage_requirements: '',
      description: ''
    })
    setEditingProduct(null)
  }

  // Handle create product
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.category.trim()) {
      alert('Please fill in required fields: Name and Category')
      return
    }

    try {
      setIsSubmitting(true)
      console.log('📦 Creating new product:', formData.name)

      const response = await fetch('/api/v1/procurement/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        console.log('✅ Product created successfully')
        setShowCreateModal(false)
        resetForm()
        await loadProducts() // Reload the list
      } else {
        throw new Error(result.message || 'Failed to create product')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      alert(`Error creating product: ${errorMessage}`)
      console.error('❌ Create product error:', errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle edit product
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingProduct || !formData.name.trim()) {
      return
    }

    try {
      setIsSubmitting(true)
      console.log('📦 Updating product:', editingProduct.id)

      const response = await fetch('/api/v1/procurement/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingProduct.id, ...formData })
      })

      const result = await response.json()

      if (result.success) {
        console.log('✅ Product updated successfully')
        setShowEditModal(false)
        resetForm()
        await loadProducts() // Reload the list
      } else {
        throw new Error(result.message || 'Failed to update product')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      alert(`Error updating product: ${errorMessage}`)
      console.error('❌ Update product error:', errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open edit modal
  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      category: product.category,
      brand: product.brand || '',
      model: product.model || '',
      manufacturer: product.manufacturer || '',
      unit_of_measure: product.unit_of_measure,
      minimum_stock: product.minimum_stock,
      reorder_point: product.reorder_point,
      lead_time_days: product.lead_time_days,
      standard_cost: product.standard_cost,
      list_price: product.list_price,
      weight: product.weight || 0,
      dimensions: product.dimensions || '',
      color: product.color || '',
      material: product.material || '',
      hazardous: product.hazardous || false,
      perishable: product.perishable || false,
      storage_requirements: product.storage_requirements || '',
      description: product.description || ''
    })
    setShowEditModal(true)
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-muted text-gray-200'
      case 'discontinued':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-muted text-gray-200'
    }
  }

  // Steve Jobs: "The details are not the details. They make the design."
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <span className="text-lg text-muted-foreground">Loading product catalog...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Product Catalog</h1>
          <p className="text-muted-foreground">
            Universal product and material management powered by HERA's dynamic architecture
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-foreground rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex items-center space-x-2 flex-1 min-w-80">
            <Search className="w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products by name, code, or category..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="discontinued">Discontinued</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>

          <button
            onClick={loadProducts}
            className="flex items-center space-x-2 px-3 py-2 text-muted-foreground hover:text-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Error Loading Products</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map(product => (
          <Card key={product.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-100">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">{product.code}</p>
                </div>
              </div>
              <Badge className={getStatusColor(product.status)}>{product.status}</Badge>
            </div>

            <div className="space-y-3">
              {/* Category & Brand */}
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1 text-muted-foreground">
                  <Box className="w-4 h-4" />
                  <span>{product.category.replace('_', ' ')}</span>
                </div>
                {product.brand && (
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <Star className="w-4 h-4" />
                    <span>{product.brand}</span>
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Standard Cost:</span>
                <span className="font-semibold text-gray-100">
                  {formatCurrency(product.standard_cost)}
                </span>
              </div>

              {product.list_price > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">List Price:</span>
                  <span className="font-semibold text-gray-100">
                    {formatCurrency(product.list_price)}
                  </span>
                </div>
              )}

              {/* Inventory Info */}
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Truck className="w-4 h-4" />
                  <span>{product.unit_of_measure}</span>
                </div>
                {product.lead_time_days > 0 && (
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{product.lead_time_days}d lead</span>
                  </div>
                )}
              </div>

              {/* Special Properties */}
              <div className="flex flex-wrap gap-1">
                {product.hazardous && (
                  <Badge variant="outline" className="text-red-600 border-red-200">
                    <Shield className="w-3 h-3 mr-1" />
                    Hazardous
                  </Badge>
                )}
                {product.perishable && (
                  <Badge variant="outline" className="text-orange-600 border-orange-200">
                    <Clock className="w-3 h-3 mr-1" />
                    Perishable
                  </Badge>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  className="flex-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-background border border-border rounded-md hover:bg-muted"
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('Pencil button clicked for:', product.name)
                    openEditModal(product)
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2 inline" />
                  Edit
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-background border border-border rounded-md hover:bg-muted"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && !isLoading && !error && (
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-gray-100 mb-2">No Products Found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== 'active' || categoryFilter
              ? 'Try adjusting your filters to see more products.'
              : 'Get started by adding your first product to the catalog.'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-foreground rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Product
          </button>
        </Card>
      )}

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-background bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-gray-100">Add New Product</h2>
              <p className="text-muted-foreground mt-1">
                Create a new product or material in your catalog
              </p>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
                    Brand
                  </label>
                  <input
                    id="brand"
                    name="brand"
                    type="text"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                  />
                </div>

                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <input
                    id="model"
                    name="model"
                    type="text"
                    value={formData.model}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="manufacturer"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Manufacturer
                  </label>
                  <input
                    id="manufacturer"
                    name="manufacturer"
                    type="text"
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                  />
                </div>
              </div>

              {/* Inventory & Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label
                    htmlFor="unit_of_measure"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Unit of Measure *
                  </label>
                  <select
                    id="unit_of_measure"
                    name="unit_of_measure"
                    required
                    value={formData.unit_of_measure}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                  >
                    {units.map(unit => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="standard_cost"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Standard Cost
                  </label>
                  <input
                    id="standard_cost"
                    name="standard_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.standard_cost}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="list_price"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    List Price
                  </label>
                  <input
                    id="list_price"
                    name="list_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.list_price}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="lead_time_days"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Lead Time (Days)
                  </label>
                  <input
                    id="lead_time_days"
                    name="lead_time_days"
                    type="number"
                    min="0"
                    value={formData.lead_time_days}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                  />
                </div>
              </div>

              {/* Physical Properties */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                    Weight
                  </label>
                  <input
                    id="weight"
                    name="weight"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.weight}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="dimensions"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Dimensions
                  </label>
                  <input
                    id="dimensions"
                    name="dimensions"
                    type="text"
                    placeholder="L×W×H"
                    value={formData.dimensions}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                  />
                </div>

                <div>
                  <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <input
                    id="color"
                    name="color"
                    type="text"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="material"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Material
                  </label>
                  <input
                    id="material"
                    name="material"
                    type="text"
                    value={formData.material}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                  />
                </div>
              </div>

              {/* Special Properties */}
              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="hazardous"
                    checked={formData.hazardous}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary border-border rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Hazardous Material</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="perishable"
                    checked={formData.perishable}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary border-border rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Perishable</span>
                </label>
              </div>

              {/* Storage Requirements */}
              <div>
                <label
                  htmlFor="storage_requirements"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Storage Requirements
                </label>
                <input
                  id="storage_requirements"
                  name="storage_requirements"
                  type="text"
                  placeholder="e.g., Store in cool, dry place"
                  value={formData.storage_requirements}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    resetForm()
                  }}
                  className="px-4 py-2 text-gray-700 bg-background border border-border rounded-lg hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-foreground rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Create Product</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pencil Product Modal - Similar structure to Create Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-background bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-gray-100">Pencil Product</h2>
              <p className="text-muted-foreground mt-1">
                Update product information and specifications
              </p>
            </div>

            <form onSubmit={handleUpdateProduct} className="p-6 space-y-6">
              {/* Same form fields as create modal - abbreviated for brevity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="edit_name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Product Name *
                  </label>
                  <input
                    id="edit_name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit_category"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Category *
                  </label>
                  <select
                    id="edit_category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    resetForm()
                  }}
                  className="px-4 py-2 text-gray-700 bg-background border border-border rounded-lg hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-foreground rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Update Product</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HERA Architecture Attribution */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            HERA Universal Product Architecture
          </h3>
          <p className="text-sm text-blue-800 mb-4">
            This product catalog demonstrates HERA's universal entity system with unlimited dynamic
            specifications:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-blue-700">
            <div className="bg-background/50 p-3 rounded-lg">
              <strong>core_entities</strong>
              <br />
              Products stored as universal entities with standard properties
            </div>
            <div className="bg-background/50 p-3 rounded-lg">
              <strong>core_dynamic_data</strong>
              <br />
              Unlimited custom specifications without schema changes
            </div>
            <div className="bg-background/50 p-3 rounded-lg">
              <strong>Steve Jobs Design</strong>
              <br />
              "Simplicity is the ultimate sophistication" - one catalog, infinite possibilities
            </div>
          </div>
          <p className="text-xs text-primary mt-4">
            Same architecture supports manufacturing parts, medical supplies, retail inventory, and
            service materials
          </p>
        </div>
      </Card>
    </div>
  )
}
