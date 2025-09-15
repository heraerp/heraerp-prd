'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Package,
  Building2,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Edit,
  Eye,
  RefreshCw,
  Download,
  Send,
  ShoppingCart,
  Truck,
  User,
  Hash
} from 'lucide-react'

// Steve Jobs: "Design is not just what it looks like and feels like. Design is how it works."
// This PO system is designed to feel intuitive and powerful

interface PurchaseOrderLine {
  id: string
  line_order: number
  product_id: string
  product_name: string
  product_code: string
  quantity: number
  unit_price: number
  line_amount: number
  unit_of_measure: string
}

interface PurchaseOrder {
  id: string
  po_number: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'processing' | 'completed' | 'cancelled'
  total_amount: number
  created_at: string
  updated_at: string
  expected_delivery: string | null
  notes: string

  supplier: {
    id: string
    name: string
    code: string
  } | null

  lines?: PurchaseOrderLine[]
  total_items?: number
}

interface Supplier {
  id: string
  name: string
  code: string
  status: string
}

interface Product {
  id: string
  name: string
  code: string
  standard_cost: number
  unit_of_measure: string
}

interface POFormData {
  supplier_id: string
  expected_delivery: string
  payment_terms: string
  delivery_address: string
  notes: string
  lines: Array<{
    product_id: string
    product_name: string
    product_code: string
    quantity: number
    unit_price: number
    unit_of_measure: string
    notes: string
  }>
}

// Steve Jobs: "Focus and simplicity" - Clean, purposeful component
export function PurchaseOrderManager() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [filteredPOs, setFilteredPOs] = useState<PurchaseOrder[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [supplierFilter, setSupplierFilter] = useState<string>('')

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [formData, setFormData] = useState<POFormData>({
    supplier_id: '',
    expected_delivery: '',
    payment_terms: 'NET30',
    delivery_address: '',
    notes: '',
    lines: []
  })

  // Status configurations
  const statusConfig = {
    draft: { color: 'bg-muted text-gray-800', icon: Edit },
    submitted: { color: 'bg-blue-100 text-blue-800', icon: Send },
    approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
    processing: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    completed: { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
    cancelled: { color: 'bg-muted text-gray-800', icon: XCircle }
  }

  // Load purchase orders from API
  const loadPurchaseOrders = async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log('📋 PO Manager: Loading purchase orders...')
      const response = await fetch('/api/v1/procurement/purchase-orders?include_lines=true')
      const result = await response.json()

      if (result.success) {
        setPurchaseOrders(result.data)
        setFilteredPOs(result.data)
        console.log(`✅ Loaded ${result.data.length} purchase orders`)
      } else {
        throw new Error(result.message || 'Failed to load purchase orders')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('❌ PO Manager: Load error:', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Load suppliers and products for form
  const loadFormData = async () => {
    try {
      // Load suppliers
      const suppliersResponse = await fetch('/api/v1/procurement/suppliers?status=active')
      const suppliersResult = await suppliersResponse.json()
      if (suppliersResult.success) {
        setSuppliers(suppliersResult.data)
      }

      // Load products
      const productsResponse = await fetch('/api/v1/procurement/products?status=active')
      const productsResult = await productsResponse.json()
      if (productsResult.success) {
        setProducts(productsResult.data)
      }
    } catch (err) {
      console.error('❌ Error loading form data:', err)
    }
  }

  // Apply filters
  useEffect(() => {
    let filtered = purchaseOrders

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        po =>
          po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          po.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          po.supplier?.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(po => po.status === statusFilter)
    }

    // Supplier filter
    if (supplierFilter) {
      filtered = filtered.filter(po => po.supplier?.id === supplierFilter)
    }

    setFilteredPOs(filtered)
  }, [purchaseOrders, searchTerm, statusFilter, supplierFilter])

  // Load data on mount
  useEffect(() => {
    loadPurchaseOrders()
    loadFormData()
  }, [])

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Add line item
  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      lines: [
        ...prev.lines,
        {
          product_id: '',
          product_name: '',
          product_code: '',
          quantity: 1,
          unit_price: 0,
          unit_of_measure: 'each',
          notes: ''
        }
      ]
    }))
  }

  // Remove line item
  const removeLineItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index)
    }))
  }

  // Update line item
  const updateLineItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) => {
        if (i === index) {
          const updatedLine = { ...line, [field]: value }

          // Auto-populate product details when product is selected
          if (field === 'product_id' && value) {
            const product = products.find(p => p.id === value)
            if (product) {
              updatedLine.product_name = product.name
              updatedLine.product_code = product.code
              updatedLine.unit_price = product.standard_cost
              updatedLine.unit_of_measure = product.unit_of_measure
            }
          }

          return updatedLine
        }
        return line
      })
    }))
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      supplier_id: '',
      expected_delivery: '',
      payment_terms: 'NET30',
      delivery_address: '',
      notes: '',
      lines: []
    })
  }

  // Handle create purchase order
  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.supplier_id || formData.lines.length === 0) {
      alert('Please select a supplier and add at least one line item')
      return
    }

    try {
      setIsSubmitting(true)
      console.log('📋 Creating new purchase order')

      const response = await fetch('/api/v1/procurement/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        console.log('✅ Purchase order created successfully')
        setShowCreateModal(false)
        resetForm()
        await loadPurchaseOrders() // Reload the list
      } else {
        throw new Error(result.message || 'Failed to create purchase order')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      alert(`Error creating purchase order: ${errorMessage}`)
      console.error('❌ Create PO error:', errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle status change
  const handleStatusChange = async (po: PurchaseOrder, newStatus: string) => {
    try {
      console.log(`📋 Changing PO ${po.po_number} status to ${newStatus}`)

      const response = await fetch('/api/v1/procurement/purchase-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: po.id, status: newStatus })
      })

      const result = await response.json()

      if (result.success) {
        console.log('✅ Purchase order status updated successfully')
        await loadPurchaseOrders() // Reload the list
      } else {
        throw new Error(result.message || 'Failed to update status')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      alert(`Error updating status: ${errorMessage}`)
      console.error('❌ Update status error:', errorMessage)
    }
  }

  // View purchase order details
  const viewPODetails = async (po: PurchaseOrder) => {
    setViewingPO(po)
    setShowViewModal(true)
  }

  // Steve Jobs: "The details are not the details. They make the design."
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString()

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <span className="text-lg text-muted-foreground">Loading purchase orders...</span>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Purchase Orders</h1>
          <p className="text-muted-foreground">
            Universal procurement workflow powered by HERA's transaction architecture
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-foreground rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create PO</span>
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
              placeholder="Search by PO number or supplier..."
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
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Supplier Filter */}
          <select
            value={supplierFilter}
            onChange={e => setSupplierFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Suppliers</option>
            {suppliers.map(supplier => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>

          <button
            onClick={loadPurchaseOrders}
            className="flex items-center space-x-2 px-3 py-2 text-muted-foreground hover:text-gray-800 transition-colors"
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
              <h3 className="font-semibold text-red-900">Error Loading Purchase Orders</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Purchase Orders List */}
      <div className="space-y-4">
        {filteredPOs.map(po => {
          const StatusIcon = statusConfig[po.status]?.icon || FileText
          return (
            <Card key={po.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="font-semibold text-gray-900">{po.po_number}</h3>
                      <Badge className={statusConfig[po.status]?.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {po.status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Building2 className="w-4 h-4" />
                        <span>{po.supplier?.name || 'No Supplier'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(po.created_at)}</span>
                      </div>
                      {po.total_items && (
                        <div className="flex items-center space-x-1">
                          <Package className="w-4 h-4" />
                          <span>{po.total_items} items</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(po.total_amount)}
                    </p>
                    {po.expected_delivery && (
                      <p className="text-sm text-muted-foreground">
                        Due: {formatDate(po.expected_delivery)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => viewPODetails(po)}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-background border border-border rounded-md hover:bg-muted"
                    >
                      <Eye className="w-4 h-4 mr-1 inline" />
                      View
                    </button>

                    {/* Status Action Buttons */}
                    {po.status === 'draft' && (
                      <button
                        onClick={() => handleStatusChange(po, 'submitted')}
                        className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
                      >
                        <Send className="w-4 h-4 mr-1 inline" />
                        Submit
                      </button>
                    )}

                    {po.status === 'submitted' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(po, 'approved')}
                          className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100"
                        >
                          <CheckCircle className="w-4 h-4 mr-1 inline" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatusChange(po, 'rejected')}
                          className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100"
                        >
                          <XCircle className="w-4 h-4 mr-1 inline" />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredPOs.length === 0 && !isLoading && !error && (
        <Card className="p-12 text-center">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Purchase Orders Found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== 'all' || supplierFilter
              ? 'Try adjusting your filters to see more purchase orders.'
              : 'Get started by creating your first purchase order.'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-foreground rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Purchase Order
          </button>
        </Card>
      )}

      {/* Create PO Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-background bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-gray-900">Create Purchase Order</h2>
              <p className="text-muted-foreground mt-1">Create a new purchase order for your supplier</p>
            </div>

            <form onSubmit={handleCreatePO} className="p-6 space-y-6">
              {/* Header Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="supplier_id"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Supplier *
                  </label>
                  <select
                    id="supplier_id"
                    name="supplier_id"
                    required
                    value={formData.supplier_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-900"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name} ({supplier.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="expected_delivery"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Expected Delivery
                  </label>
                  <input
                    id="expected_delivery"
                    name="expected_delivery"
                    type="date"
                    value={formData.expected_delivery}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-900"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">Line Items *</label>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-blue-600 text-foreground rounded-md hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.lines.map((line, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-3 bg-muted rounded-lg"
                    >
                      <select
                        value={line.product_id}
                        onChange={e => updateLineItem(index, 'product_id', e.target.value)}
                        className="flex-1 px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-900"
                      >
                        <option value="">Select Product</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name} ({product.code})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        placeholder="Qty"
                        min="1"
                        value={line.quantity}
                        onChange={e =>
                          updateLineItem(index, 'quantity', parseInt(e.target.value) || 0)
                        }
                        className="w-20 px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-900"
                      />

                      <input
                        type="number"
                        placeholder="Price"
                        step="0.01"
                        min="0"
                        value={line.unit_price}
                        onChange={e =>
                          updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)
                        }
                        className="w-24 px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-900"
                      />

                      <span className="w-20 text-sm font-medium text-gray-900">
                        {formatCurrency(line.quantity * line.unit_price)}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className="px-2 py-1.5 text-red-600 hover:text-red-700"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {formData.lines.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="w-12 h-12 mx-auto mb-2" />
                      <p>No items added yet. Click "Add Item" to get started.</p>
                    </div>
                  )}
                </div>

                {/* Total */}
                {formData.lines.length > 0 && (
                  <div className="flex justify-end pt-4 border-t border-border mt-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {formatCurrency(
                          formData.lines.reduce(
                            (sum, line) => sum + line.quantity * line.unit_price,
                            0
                          )
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-900"
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
                  disabled={isSubmitting || formData.lines.length === 0}
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
                      <span>Create PO</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View PO Modal */}
      {showViewModal && viewingPO && (
        <div className="fixed inset-0 bg-background bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{viewingPO.po_number}</h2>
                  <p className="text-muted-foreground mt-1">Purchase Order Details</p>
                </div>
                <Badge className={statusConfig[viewingPO.status]?.color}>{viewingPO.status}</Badge>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* PO Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Order Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">PO Number:</span>
                      <span className="font-medium">{viewingPO.po_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className={statusConfig[viewingPO.status]?.color}>
                        {viewingPO.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{formatDate(viewingPO.created_at)}</span>
                    </div>
                    {viewingPO.expected_delivery && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Expected Delivery:</span>
                        <span>{formatDate(viewingPO.expected_delivery)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Supplier</h3>
                  {viewingPO.supplier ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{viewingPO.supplier.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Code:</span>
                        <span>{viewingPO.supplier.code}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No supplier information</p>
                  )}
                </div>
              </div>

              {/* Line Items */}
              {viewingPO.lines && viewingPO.lines.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Line Items ({viewingPO.lines.length})
                  </h3>
                  <div className="space-y-2">
                    {viewingPO.lines.map(line => (
                      <div
                        key={line.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{line.product_name}</p>
                          <p className="text-sm text-muted-foreground">{line.product_code}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {line.quantity} × {formatCurrency(line.unit_price)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            = {formatCurrency(line.line_amount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-4 border-t border-border mt-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {formatCurrency(viewingPO.total_amount)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {viewingPO.notes && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Notes</h3>
                  <p className="text-gray-700 text-sm">{viewingPO.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-gray-700 bg-background border border-border rounded-lg hover:bg-muted"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HERA Architecture Attribution */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-purple-900 mb-2">
            HERA Universal Procurement Architecture
          </h3>
          <p className="text-sm text-purple-800 mb-4">
            This purchase order system demonstrates HERA's universal transaction workflow in action:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-purple-700">
            <div className="bg-background/50 p-3 rounded-lg">
              <strong>universal_transactions</strong>
              <br />
              Purchase orders stored as standardized business transactions
            </div>
            <div className="bg-background/50 p-3 rounded-lg">
              <strong>universal_transaction_lines</strong>
              <br />
              Line items with product relationships and flexible metadata
            </div>
            <div className="bg-background/50 p-3 rounded-lg">
              <strong>core_relationships</strong>
              <br />
              Supplier-PO and Product-PO relationships with smart workflows
            </div>
          </div>
          <p className="text-xs text-purple-600 mt-4">
            Same architecture supports sales orders, service requests, manufacturing orders, and
            healthcare billing
          </p>
        </div>
      </Card>
    </div>
  )
}
