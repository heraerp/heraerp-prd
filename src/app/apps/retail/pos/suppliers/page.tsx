/**
 * Retail POS Supplier Management
 * Real Supabase Integration with Universal POS Service
 * Smart Code: HERA.RETAIL.POS.SUPPLIERS.PAGE.v1
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { UniversalEntityListShell } from '@/components/universal/UniversalEntityListShell'
import { useSuppliers, Supplier, SupplierFilters } from '@/lib/pos/hooks'
import { 
  Building2, 
  Search, 
  Filter, 
  Plus, 
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  Edit,
  Eye,
  Trash2,
  Download,
  Upload,
  UserPlus,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'

// ============ Create Supplier Modal ============

interface CreateSupplierModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const CreateSupplierModal: React.FC<CreateSupplierModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { createSupplier } = useSuppliers()
  const [formData, setFormData] = useState<Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    email: '',
    phone: '',
    gstNumber: '',
    paymentTerms: 'net_30',
    address: '',
    status: 'active'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await createSupplier(formData)
      if (result.success) {
        onSuccess()
        onClose()
        setFormData({
          name: '',
          email: '',
          phone: '',
          gstNumber: '',
          paymentTerms: 'net_30',
          address: '',
          status: 'active'
        })
      } else {
        setError(result.error || 'Failed to create supplier')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Add New Supplier</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Supplier Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-3 border border-slate-300 rounded-xl text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Enter supplier name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full p-3 border border-slate-300 rounded-xl text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="supplier@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full p-3 border border-slate-300 rounded-xl text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">GST Number</label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, gstNumber: e.target.value.toUpperCase() }))}
                className="w-full p-3 border border-slate-300 rounded-xl text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="29AAAAA0000A1Z5"
                pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Payment Terms</label>
              <select
                value={formData.paymentTerms}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                className="w-full p-3 border border-slate-300 rounded-xl text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="immediate">Immediate</option>
                <option value="net_7">Net 7 Days</option>
                <option value="net_15">Net 15 Days</option>
                <option value="net_30">Net 30 Days</option>
                <option value="net_45">Net 45 Days</option>
                <option value="net_60">Net 60 Days</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="w-full p-3 border border-slate-300 rounded-xl text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              rows={3}
              placeholder="Full business address"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 p-3 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Creating...' : 'Create Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============ Supplier Filter Panel ============

interface SupplierFilterPanelProps {
  onFilterChange: (filters: SupplierFilters) => void
}

const SupplierFilterPanel: React.FC<SupplierFilterPanelProps> = ({ onFilterChange }) => {
  const [filters, setFilters] = useState<SupplierFilters>({
    search: '',
    status: 'active',
    paymentTerms: '',
    hasGst: false
  })

  const paymentTermsOptions = [
    { value: '', label: 'All Terms' },
    { value: 'immediate', label: 'Immediate' },
    { value: 'net_7', label: 'Net 7 Days' },
    { value: 'net_15', label: 'Net 15 Days' },
    { value: 'net_30', label: 'Net 30 Days' },
    { value: 'net_45', label: 'Net 45 Days' },
    { value: 'net_60', label: 'Net 60 Days' }
  ]

  const handleFilterChange = (key: keyof SupplierFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5 text-blue-600" />
          Supplier Filters
        </h3>
      </div>

      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium text-slate-900 mb-2">Status</label>
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="w-full min-h-[44px] bg-white border border-slate-300 rounded-xl px-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="blocked">Blocked</option>
          <option value="all">All Status</option>
        </select>
      </div>

      {/* Payment Terms Filter */}
      <div>
        <label className="block text-sm font-medium text-slate-900 mb-2">Payment Terms</label>
        <select
          value={filters.paymentTerms}
          onChange={(e) => handleFilterChange('paymentTerms', e.target.value)}
          className="w-full min-h-[44px] bg-white border border-slate-300 rounded-xl px-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          {paymentTermsOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* GST Filter */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.hasGst}
            onChange={(e) => handleFilterChange('hasGst', e.target.checked)}
            className="w-4 h-4 bg-white border border-slate-300 rounded text-blue-600 focus:ring-blue-200"
          />
          <span className="text-slate-900">GST Registered Only</span>
        </label>
      </div>

      {/* Quick Actions */}
      <div className="pt-4 border-t border-slate-200">
        <h4 className="text-sm font-medium text-slate-900 mb-3">Quick Actions</h4>
        <div className="space-y-2">
          <button className="w-full min-h-[44px] bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 px-3 text-blue-700 hover:bg-blue-100 active:scale-95 transition-all">
            <Upload className="w-4 h-4" />
            Import Suppliers
          </button>
          <button className="w-full min-h-[44px] bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 px-3 text-green-700 hover:bg-green-100 active:scale-95 transition-all">
            <Download className="w-4 h-4" />
            Export Suppliers
          </button>
        </div>
      </div>
    </div>
  )
}

// ============ Supplier List Content ============

interface SupplierListContentProps {
  view: string
  searchTerm: string
  filters: SupplierFilters
}

const SupplierListContent: React.FC<SupplierListContentProps> = ({ view, searchTerm, filters }) => {
  const { suppliers, loading, error, deleteSupplier, refresh } = useSuppliers()
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([])

  // Apply filters
  useEffect(() => {
    let filtered = suppliers

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(supplier =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.phone?.includes(searchTerm) ||
        supplier.gstNumber?.includes(searchTerm)
      )
    }

    setFilteredSuppliers(filtered)
  }, [suppliers, searchTerm])

  const handleSupplierAction = async (action: string, supplierId: string) => {
    switch (action) {
      case 'delete':
        if (window.confirm('Are you sure you want to delete this supplier?')) {
          const result = await deleteSupplier(supplierId)
          if (!result.success) {
            alert(result.error || 'Failed to delete supplier')
          }
        }
        break
      case 'view':
      case 'edit':
        console.log(`${action} supplier:`, supplierId)
        break
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      'active': 'bg-green-100 text-green-700 border-green-200',
      'inactive': 'bg-gray-100 text-gray-700 border-gray-200',
      'blocked': 'bg-red-100 text-red-700 border-red-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const formatPaymentTerms = (terms: string) => {
    const labels = {
      'immediate': 'Immediate',
      'net_7': 'Net 7',
      'net_15': 'Net 15',
      'net_30': 'Net 30',
      'net_45': 'Net 45',
      'net_60': 'Net 60'
    }
    return labels[terms] || terms
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading suppliers...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <div>
            <h3 className="font-medium">Error Loading Suppliers</h3>
            <p className="text-sm">{error}</p>
            <button
              onClick={refresh}
              className="mt-2 text-sm font-medium hover:underline"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'mobile' || view === 'list') {
    return (
      <div className="space-y-3">
        {filteredSuppliers.map((supplier) => (
          <div key={supplier.id} className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                {/* Supplier Icon */}
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>

                {/* Supplier Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-slate-900 truncate">{supplier.name}</h3>
                    <span className={`px-2 py-1 rounded-lg text-xs border ${getStatusColor(supplier.status || 'active')}`}>
                      {(supplier.status || 'active').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                    {supplier.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {supplier.email}
                      </span>
                    )}
                    {supplier.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {supplier.phone}
                      </span>
                    )}
                    {supplier.paymentTerms && (
                      <span className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        {formatPaymentTerms(supplier.paymentTerms)}
                      </span>
                    )}
                    {supplier.gstNumber && (
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        GST: {supplier.gstNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button 
                  onClick={() => handleSupplierAction('view', supplier.id!)}
                  className="w-10 h-10 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-100 active:scale-95 transition-all"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleSupplierAction('edit', supplier.id!)}
                  className="w-10 h-10 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-center text-amber-600 hover:bg-amber-100 active:scale-95 transition-all"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleSupplierAction('delete', supplier.id!)}
                  className="w-10 h-10 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center text-red-600 hover:bg-red-100 active:scale-95 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredSuppliers.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="font-medium text-slate-900 mb-2">No Suppliers Found</h3>
            <p className="text-slate-600">
              {searchTerm ? 'Try adjusting your search terms' : 'Add your first supplier to get started'}
            </p>
          </div>
        )}
      </div>
    )
  }

  // Grid view
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredSuppliers.map((supplier) => (
        <div key={supplier.id} className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-lg transition-all group">
          {/* Supplier Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                {supplier.name}
              </h3>
              <span className={`inline-block px-2 py-1 rounded-lg text-xs border mt-1 ${getStatusColor(supplier.status || 'active')}`}>
                {(supplier.status || 'active').toUpperCase()}
              </span>
            </div>
          </div>

          {/* Supplier Details */}
          <div className="space-y-2 text-sm">
            {supplier.email && (
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-3 h-3" />
                <span className="truncate">{supplier.email}</span>
              </div>
            )}
            
            {supplier.phone && (
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-3 h-3" />
                <span>{supplier.phone}</span>
              </div>
            )}

            {supplier.address && (
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{supplier.address.split(',')[0]}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <div className="text-center">
                <p className="text-xs text-slate-500">Payment</p>
                <p className="text-blue-600 font-bold text-sm">
                  {formatPaymentTerms(supplier.paymentTerms || 'net_30')}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">GST</p>
                <div className="flex items-center justify-center">
                  {supplier.gstNumber ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => handleSupplierAction('view', supplier.id!)}
              className="flex-1 min-h-[36px] bg-blue-50 border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-100 active:scale-95 transition-all flex items-center justify-center"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button 
              onClick={() => handleSupplierAction('edit', supplier.id!)}
              className="flex-1 min-h-[36px] bg-amber-50 border border-amber-200 rounded-lg text-amber-600 hover:bg-amber-100 active:scale-95 transition-all flex items-center justify-center"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      {filteredSuppliers.length === 0 && (
        <div className="col-span-full text-center py-12">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="font-medium text-slate-900 mb-2">No Suppliers Found</h3>
          <p className="text-slate-600">
            {searchTerm ? 'Try adjusting your search terms' : 'Add your first supplier to get started'}
          </p>
        </div>
      )}
    </div>
  )
}

// ============ Main Page Component ============

export default function POSSuppliersPage() {
  const router = useRouter()
  const { user, organization, isAuthenticated } = useHERAAuth()
  const { suppliers, loading, refresh } = useSuppliers()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedView, setSelectedView] = useState<'grid' | 'list' | 'mobile'>('grid')
  const [filters, setFilters] = useState<SupplierFilters>({})
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Authentication guards
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Authentication Required</h1>
          <p className="text-slate-600">Please log in to access supplier management</p>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Organization Required</h1>
          <p className="text-slate-600">Please select an organization to continue</p>
        </div>
      </div>
    )
  }

  const breadcrumbs = [
    { label: 'Retail', href: '/apps/retail' },
    { label: 'POS', href: '/apps/retail/pos/main' },
    { label: 'Suppliers', href: '/apps/retail/pos/suppliers' }
  ]

  const handleCreateNew = () => {
    setShowCreateModal(true)
  }

  const handleExport = () => {
    console.log('Exporting suppliers...')
    // Future: Implement export functionality
  }

  const handleBatchDelete = () => {
    console.log('Batch deleting suppliers...')
    // Future: Implement batch operations
  }

  return (
    <>
      <UniversalEntityListShell
        title="Supplier Management"
        description="Manage your retail suppliers with GST compliance and payment terms"
        breadcrumbs={breadcrumbs}
        module="Retail"
        entityType="SUPPLIER"
        
        // Panel Content
        filterPanelContent={<SupplierFilterPanel onFilterChange={setFilters} />}
        listContentComponent={
          <SupplierListContent 
            view={selectedView} 
            searchTerm={searchTerm} 
            filters={filters}
          />
        }
        
        // Configuration
        enableSearch={true}
        enableFilters={true}
        enableExport={true}
        enableBatchOperations={true}
        showViewToggle={true}
        showCreateButton={true}
        
        // State & Callbacks
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedView={selectedView}
        onViewChange={setSelectedView}
        totalCount={suppliers.length}
        selectedCount={0}
        onCreateNew={handleCreateNew}
        onExport={handleExport}
        onBatchDelete={handleBatchDelete}
        loading={loading}
        lastUpdated={new Date()}
      />

      {/* Create Supplier Modal */}
      <CreateSupplierModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          refresh()
          console.log('Supplier created successfully!')
        }}
      />
    </>
  )
}