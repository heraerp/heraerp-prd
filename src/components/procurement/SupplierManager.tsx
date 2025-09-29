'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  Globe,
  MapPin,
  CreditCard,
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
  Upload
} from 'lucide-react'

// Steve Jobs: "Design is not just what it looks like and feels like. Design is how it works."
// This interface is designed to feel intuitive and powerful

interface Supplier {
  id: string
  name: string
  code: string
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  created_at: string
  updated_at: string

  // Contact Information
  contact_person: string
  email: string
  phone: string
  website: string

  // Business Details
  tax_id: string
  registration_number: string
  category: string
  payment_terms: string
  credit_limit: number
  currency: string

  // Address
  address_line1: string
  address_line2: string
  city: string
  state: string
  postal_code: string
  country: string

  // Performance Metrics (optional)
  total_orders?: number
  total_spent?: number
  last_order_date?: string
  performance_rating?: number
  on_time_delivery_rate?: number
}

interface SupplierFormData {
  name: string
  contact_person: string
  email: string
  phone: string
  website: string
  category: string
  payment_terms: string
  credit_limit: number
  currency: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  postal_code: string
  country: string
  description: string
}

// Steve Jobs: "Focus and simplicity" - Clean, purposeful component
export function SupplierManager() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [categoryFilter, setCategoryFilter] = useState<string>('')

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null)

  // Form State
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    website: '',
    category: 'general',
    payment_terms: 'NET30',
    credit_limit: 0,
    currency: 'USD',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    description: ''
  })

  // Load suppliers with elegant error handling
  const loadSuppliers = async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log('🏢 Loading suppliers with universal architecture...')
      const response = await fetch('/api/v1/procurement/suppliers?include_stats=true')
      const result = await response.json()

      if (result.success) {
        setSuppliers(result.data)
        console.log(`✅ Loaded ${result.data.length} suppliers successfully`)
      } else {
        setError(result.message || 'Failed to load suppliers')
      }
    } catch (err) {
      setError('Error loading suppliers')
      console.error('❌ Supplier loading error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initialize
  useEffect(() => {
    loadSuppliers()
  }, [])

  // Smart filtering (Steve Jobs: "It just works")
  useEffect(() => {
    let filtered = suppliers

    // Search filtering
    if (searchTerm) {
      filtered = filtered.filter(
        supplier =>
          supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
          supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filtering
    if (statusFilter !== 'all') {
      filtered = filtered.filter(supplier => supplier.status === statusFilter)
    }

    // Category filtering
    if (categoryFilter) {
      filtered = filtered.filter(supplier => supplier.category === categoryFilter)
    }

    setFilteredSuppliers(filtered)
  }, [suppliers, searchTerm, statusFilter, categoryFilter])

  // Create supplier with Jobs-level UX
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsLoading(true)

      const response = await fetch('/api/v1/procurement/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        await loadSuppliers() // Refresh list
        setShowAddModal(false)
        resetForm()
        console.log(`✅ Supplier created: ${result.data.name}`)
      } else {
        setError(result.message || 'Failed to create supplier')
      }
    } catch (err) {
      setError('Error creating supplier')
      console.error('❌ Create supplier error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      website: '',
      category: 'general',
      payment_terms: 'NET30',
      credit_limit: 0,
      currency: 'USD',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
      description: ''
    })
  }

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive':
        return 'bg-muted text-gray-200 border-border'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-muted text-gray-200 border-border'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />
      case 'suspended':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <CheckCircle className="w-4 h-4 text-muted-foreground" />
    }
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const getPerformanceRating = (rating: number) => {
    const stars = Math.round(rating)
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < stars ?'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
  }

  // Steve Jobs: "Details are not details. They make the design."
  if (isLoading && suppliers.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <span className="text-lg text-muted-foreground">Loading suppliers...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header - Steve Jobs: "Simplicity is the ultimate sophistication" */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Supplier Management</h1>
          <p className="text-muted-foreground">
            Manage suppliers using HERA's universal architecture - same system, infinite
            possibilities
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadSuppliers}
            className="flex items-center space-x-2 px-4 py-2 text-muted-foreground hover:text-gray-200 border border-border rounded-lg hover:bg-muted"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-foreground rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Search & Filters - Jobs: "Focus and simplicity" */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background"
            >
              <option value="">All Categories</option>
              <option value="general">General</option>
              <option value="raw_materials">Raw Materials</option>
              <option value="equipment">Equipment</option>
              <option value="services">Services</option>
              <option value="technology">Technology</option>
            </select>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Total Suppliers</p>
                <p className="text-2xl font-bold text-blue-900">{suppliers.length}</p>
              </div>
              <Building2 className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Active</p>
                <p className="text-2xl font-bold text-green-900">
                  {suppliers.filter(s => s.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {suppliers.filter(s => s.status === 'pending').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Total Value</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatCurrency(suppliers.reduce((sum, s) => sum + (s.total_spent || 0), 0))}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="p-4 bg-red-50 border border-red-200">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </Card>
      )}

      {/* Suppliers Grid - Jobs: "It just works" */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSuppliers.map(supplier => (
          <Card
            key={supplier.id}
            className="overflow-hidden hover:shadow-lg transition-all duration-200 group"
          >
            {/* Supplier Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-100 mb-1 group-hover:text-primary transition-colors">
                    {supplier.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{supplier.code}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(supplier.status)}>
                    <span className="flex items-center space-x-1">
                      {getStatusIcon(supplier.status)}
                      <span className="capitalize">{supplier.status}</span>
                    </span>
                  </Badge>
                </div>
              </div>

              {/* Contact Person */}
              <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold">
                    {supplier.contact_person
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()}
                  </span>
                </div>
                <span className="font-medium">{supplier.contact_person}</span>
              </div>

              {/* Category & Payment Terms */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="capitalize">{supplier.category.replace('_', ' ')}</span>
                <span>{supplier.payment_terms}</span>
              </div>
            </div>

            {/* Contact Information */}
            <div className="p-6 space-y-3">
              {supplier.email && (
                <div className="flex items-center space-x-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a href={`mailto:${supplier.email}`} className="text-primary hover:text-blue-800">
                    {supplier.email}
                  </a>
                </div>
              )}

              {supplier.phone && (
                <div className="flex items-center space-x-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a
                    href={`tel:${supplier.phone}`}
                    className="text-muted-foreground hover:text-gray-200"
                  >
                    {supplier.phone}
                  </a>
                </div>
              )}

              {supplier.website && (
                <div className="flex items-center space-x-3 text-sm">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <a
                    href={
                      supplier.website.startsWith('http')
                        ? supplier.website
                        : `https://${supplier.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-blue-800"
                  >
                    {supplier.website}
                  </a>
                </div>
              )}

              {(supplier.city || supplier.country) && (
                <div className="flex items-center space-x-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {[supplier.city, supplier.country].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}

              {/* Credit Limit */}
              {supplier.credit_limit > 0 && (
                <div className="flex items-center space-x-3 text-sm">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Credit Limit: {formatCurrency(supplier.credit_limit, supplier.currency)}
                  </span>
                </div>
              )}
            </div>

            {/* Performance Metrics (if available) */}
            {supplier.total_orders !== undefined && (
              <div className="px-6 pb-6">
                <div className="bg-muted rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Orders</span>
                    <span className="font-semibold">{supplier.total_orders}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Spent</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(supplier.total_spent || 0, supplier.currency)}
                    </span>
                  </div>

                  {supplier.performance_rating !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Rating</span>
                      <div className="flex items-center space-x-1">
                        {getPerformanceRating(supplier.performance_rating)}
                      </div>
                    </div>
                  )}

                  {supplier.on_time_delivery_rate !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">On-Time Delivery</span>
                      <span className="font-semibold text-primary">
                        {(supplier.on_time_delivery_rate * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="px-6 pb-6">
              <div className="flex gap-2">
                <button
                  onClick={() => setViewingSupplier(supplier)}
                  className="flex-1 px-4 py-2 text-sm font-medium ink bg-background border border-border rounded-md hover:bg-muted transition-colors flex items-center justify-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
                <button
                  onClick={() => setEditingSupplier(supplier)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors flex items-center justify-center space-x-2"
                >
                  <Pencil className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredSuppliers.length === 0 && !isLoading && (
        <Card className="p-12 text-center">
          <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-gray-100 mb-2">
            {searchTerm || statusFilter !== 'all' || categoryFilter
              ? 'No suppliers found'
              : 'No suppliers yet'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm || statusFilter !== 'all' || categoryFilter
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first supplier to the system'}
          </p>
          {!searchTerm && statusFilter === 'all' && !categoryFilter && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2 bg-blue-600 text-foreground rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Your First Supplier
            </button>
          )}
        </Card>
      )}

      {/* Add Supplier Modal - Jobs: "Design is how it works" */}
      {showAddModal && (
        <div className="fixed inset-0 bg-background bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-100">Add New Supplier</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    resetForm()
                  }}
                  className="text-muted-foreground hover:text-muted-foreground"
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateSupplier} className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-100 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium ink mb-2">
                      Supplier Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ABC Supplies Ltd."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium ink mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="general">General</option>
                      <option value="raw_materials">Raw Materials</option>
                      <option value="equipment">Equipment</option>
                      <option value="services">Services</option>
                      <option value="technology">Technology</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-100 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium ink mb-2">
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.contact_person}
                      onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="John Smith"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium ink mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="john@abcsupplies.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium ink mb-2">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+1-555-0123"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium ink mb-2">Website</label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={e => setFormData({ ...formData, website: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="www.abcsupplies.com"
                    />
                  </div>
                </div>
              </div>

              {/* Business Terms */}
              <div>
                <h3 className="text-lg font-medium text-gray-100 mb-4">Business Terms</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium ink mb-2">
                      Payment Terms
                    </label>
                    <select
                      value={formData.payment_terms}
                      onChange={e => setFormData({ ...formData, payment_terms: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="NET15">NET 15</option>
                      <option value="NET30">NET 30</option>
                      <option value="NET45">NET 45</option>
                      <option value="NET60">NET 60</option>
                      <option value="COD">Cash on Delivery</option>
                      <option value="PREPAID">Prepaid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium ink mb-2">
                      Credit Limit
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.credit_limit}
                      onChange={e =>
                        setFormData({ ...formData, credit_limit: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="50000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium ink mb-2">Currency</label>
                    <select
                      value={formData.currency}
                      onChange={e => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="CAD">CAD</option>
                      <option value="AUD">AUD</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-lg font-medium text-gray-100 mb-4">Address</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium ink mb-2">
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      value={formData.address_line1}
                      onChange={e => setFormData({ ...formData, address_line1: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="123 Business Street"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium ink mb-2">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      value={formData.address_line2}
                      onChange={e => setFormData({ ...formData, address_line2: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Suite 100"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium ink mb-2">City</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="New York"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium ink mb-2">State</label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={e => setFormData({ ...formData, state: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="NY"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium ink mb-2">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={formData.postal_code}
                        onChange={e => setFormData({ ...formData, postal_code: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="10001"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium ink mb-2">
                        Country
                      </label>
                      <input
                        type="text"
                        value={formData.country}
                        onChange={e => setFormData({ ...formData, country: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="United States"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium ink mb-2">
                  Description/Notes
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional notes about this supplier..."
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    resetForm()
                  }}
                  disabled={isLoading}
                  className="px-6 py-2 ink bg-background border border-border rounded-lg hover:bg-muted transition-colors disabled:"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-foreground rounded-lg hover:bg-blue-700 transition-colors disabled: flex items-center space-x-2"
                >
                  {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{isLoading ? 'Creating...' : 'Create Supplier'}</span>
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* HERA Architecture Showcase */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            🍎 Steve Jobs Philosophy: "Simplicity is the Ultimate Sophistication"
          </h3>
          <p className="text-sm text-blue-800 mb-4">
            This supplier management system demonstrates HERA's revolutionary approach - making
            complex procurement feel as intuitive as using an iPhone.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-blue-700">
            <div className="bg-background/50 p-3 rounded-lg">
              <strong>Universal Entities</strong>
              <br />
              Suppliers stored with infinite flexibility - same table handles restaurants,
              manufacturers, or hospitals
            </div>
            <div className="bg-background/50 p-3 rounded-lg">
              <strong>Dynamic Properties</strong>
              <br />
              Payment terms, contacts, ratings - all stored without schema changes
            </div>
            <div className="bg-background/50 p-3 rounded-lg">
              <strong>Elegant APIs</strong>
              <br />
              One endpoint handles all supplier operations with Jobs-level UX design
            </div>
          </div>
          <p className="text-xs text-primary mt-4">
            "Design is not just what it looks like and feels like. Design is how it works." - Steve
            Jobs
          </p>
        </div>
      </Card>
    </div>
  )
}
