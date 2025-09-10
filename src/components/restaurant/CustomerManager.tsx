'use client'

import React, { useState, useEffect } from 'react'
import { 
  UniversalForm,
  UniversalInput,
  UniversalTextarea,
  UniversalButton,
  UniversalFieldGroup,
  UniversalModal,
  UniversalErrorBoundary,
  UniversalInlineLoading,
  UniversalCardSkeleton,
  UniversalErrorDisplay,
  FormValidation,
  useFormState,
  useLoadingState,
  createUniversalAPIClient
} from '@/components/universal'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User
} from 'lucide-react'

// Customer interface using HERA universal pattern
interface Customer {
  id: string
  entity_name: string  // Customer name
  entity_code: string  // Customer code (e.g., CUST_001)
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip_code: string
  notes: string
  status: 'active' | 'inactive'
  total_orders: number
  total_spent: number
  last_order_date: string | null
  created_at: string
  updated_at: string
}

// Initialize Universal API Client
const api = createUniversalAPIClient({
  baseUrl: '/api/v1',
  retries: { maxRetries: 3, retryDelay: 1000 },
  cache: { ttl: 30000 }, // 30 second cache
  onError: (error) => console.error('Customer API Error:', error)
})

interface CustomerFormProps {
  customer?: Customer | null
  onCustomerSaved: () => void
  onClose: () => void
}

function CustomerForm({ customer, onCustomerSaved, onClose }: CustomerFormProps) {
  const isEditing = !!customer
  const { isLoading, withLoading } = useLoadingState()
  
  const { values, errors, setValue, validate, reset } = useFormState({
    entity_name: customer?.entity_name || '',
    entity_code: customer?.entity_code || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    city: customer?.city || '',
    state: customer?.state || '',
    zip_code: customer?.zip_code || '',
    notes: customer?.notes || ''
  })

  // Auto-generate customer code from name
  useEffect(() => {
    if (values.entity_name && !values.entity_code && !isEditing) {
      const code = 'CUST_' + values.entity_name
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 15)
      setValue('entity_code', code)
    }
  }, [values.entity_name, values.entity_code, isEditing, setValue])

  const validationRules = {
    entity_name: [FormValidation.required],
    email: [FormValidation.email],
    phone: [FormValidation.required],
    entity_code: [FormValidation.required]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate(validationRules)) {
      return
    }

    const result = await withLoading(async () => {
      const customerData = {
        entity_type: 'customer',
        entity_name: values.entity_name,
        entity_code: values.entity_code,
        status: 'active',
        properties: {
          email: values.email,
          phone: values.phone,
          address: values.address,
          city: values.city,
          state: values.state,
          zip_code: values.zip_code,
          notes: values.notes,
          total_orders: customer?.total_orders || 0,
          total_spent: customer?.total_spent || 0,
          last_order_date: customer?.last_order_date || null
        }
      }

      if (isEditing) {
        return await api.put('/entities', {
          id: customer.id,
          ...customerData
        })
      } else {
        return await api.post('/entities', customerData)
      }
    })

    if (result?.success) {
      onCustomerSaved()
      onClose()
    }
  }

  return (
    <UniversalModal
      isOpen={true}
      onClose={onClose}
      title={isEditing ? 'Pencil Customer' : 'Add New Customer'}
      maxWidth="lg"
    >
      <UniversalForm onSubmit={handleSubmit}>
        <UniversalFieldGroup title="Basic Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UniversalInput
              name="entity_name"
              label="Customer Name"
              value={values.entity_name}
              onChange={(value) => setValue('entity_name', value)}
              error={errors.entity_name}
              required
              placeholder="John Doe"
            />
            
            <UniversalInput
              name="entity_code"
              label="Customer Code"
              value={values.entity_code}
              onChange={(value) => setValue('entity_code', value)}
              error={errors.entity_code}
              required
              placeholder="CUST_JOHN_DOE"
            />
          </div>
        </UniversalFieldGroup>

        <UniversalFieldGroup title="Contact Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UniversalInput
              name="email"
              label="Email"
              type="email"
              value={values.email}
              onChange={(value) => setValue('email', value)}
              error={errors.email}
              placeholder="john@example.com"
            />
            
            <UniversalInput
              name="phone"
              label="Phone Number"
              type="tel"
              value={values.phone}
              onChange={(value) => setValue('phone', value)}
              error={errors.phone}
              required
              placeholder="(555) 123-4567"
            />
          </div>
        </UniversalFieldGroup>

        <UniversalFieldGroup title="Address">
          <div className="space-y-4">
            <UniversalInput
              name="address"
              label="Street Address"
              value={values.address}
              onChange={(value) => setValue('address', value)}
              placeholder="123 Main Street"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <UniversalInput
                name="city"
                label="City"
                value={values.city}
                onChange={(value) => setValue('city', value)}
                placeholder="New York"
              />
              
              <UniversalInput
                name="state"
                label="State"
                value={values.state}
                onChange={(value) => setValue('state', value)}
                placeholder="NY"
              />
              
              <UniversalInput
                name="zip_code"
                label="ZIP Code"
                value={values.zip_code}
                onChange={(value) => setValue('zip_code', value)}
                placeholder="10001"
              />
            </div>
          </div>
        </UniversalFieldGroup>

        <UniversalFieldGroup title="Additional Information">
          <UniversalTextarea
            name="notes"
            label="Notes"
            value={values.notes}
            onChange={(value) => setValue('notes', value)}
            rows={3}
            placeholder="Special preferences, dietary restrictions, etc."
          />
        </UniversalFieldGroup>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <UniversalButton
            type="submit"
            loading={isLoading}
            className="flex-1"
          >
            {isEditing ? 'Update Customer' : 'Add Customer'}
          </UniversalButton>
          
          <UniversalButton
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </UniversalButton>
        </div>
      </UniversalForm>
    </UniversalModal>
  )
}

export function CustomerManager() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const { isLoading, error, withLoading, clearError } = useLoadingState()

  // Load customers from Universal API
  const loadCustomers = async () => {
    const result = await withLoading(async () => {
      return await api.get('/entities', {
        entity_type: 'customer',
        include_dynamic: true
      })
    })

    if (result?.success && result.data && Array.isArray(result.data)) {
      // Transform universal entity format to customer format
      const transformedCustomers = result.data.map((entity: any) => ({
        id: entity.id,
        entity_name: entity.entity_name,
        entity_code: entity.entity_code,
        status: entity.status,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
        // Properties from dynamic data
        email: entity.properties?.email || '',
        phone: entity.properties?.phone || '',
        address: entity.properties?.address || '',
        city: entity.properties?.city || '',
        state: entity.properties?.state || '',
        zip_code: entity.properties?.zip_code || '',
        notes: entity.properties?.notes || '',
        total_orders: entity.properties?.total_orders || 0,
        total_spent: entity.properties?.total_spent || 0,
        last_order_date: entity.properties?.last_order_date || null
      }))
      
      setCustomers(transformedCustomers)
      setFilteredCustomers(transformedCustomers)
    }
  }

  // Delete customer
  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) {
      return
    }

    const result = await withLoading(async () => {
      return await api.delete('/entities', { id: customerId })
    })

    if (result?.success) {
      setCustomers(customers.filter(c => c.id !== customerId))
      setFilteredCustomers(filteredCustomers.filter(c => c.id !== customerId))
    }
  }

  // Filter customers based on search
  useEffect(() => {
    if (!searchTerm) {
      setFilteredCustomers(customers)
    } else {
      const filtered = customers.filter(customer =>
        customer.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
      )
      setFilteredCustomers(filtered)
    }
  }, [searchTerm, customers])

  useEffect(() => {
    loadCustomers()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <UniversalErrorBoundary>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Customer Management</h1>
          <p className="text-gray-600">
            Manage your restaurant customers using HERA's universal entity system
          </p>
        </div>

        {/* Search and Actions */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 flex gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                />
              </div>
            </div>

            {/* Add Customer Button */}
            <UniversalButton
              onClick={() => setShowAddForm(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </UniversalButton>
          </div>
        </Card>

        {/* Error Display */}
        {error && (
          <UniversalErrorDisplay
            message={error}
            onDismiss={clearError}
            onRetry={loadCustomers}
          />
        )}

        {/* Loading State */}
        {isLoading && customers.length === 0 ? (
          <UniversalCardSkeleton count={6} />
        ) : (
          <>
            {/* Customers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCustomers.map((customer) => (
                <Card key={customer.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    {/* Customer Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {customer.entity_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {customer.entity_code}
                        </p>
                      </div>
                      <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                        {customer.status}
                      </Badge>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 mb-4">
                      {customer.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span>{customer.email}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{customer.phone}</span>
                      </div>
                      
                      {customer.address && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{customer.city}, {customer.state}</span>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <p className="text-lg font-semibold text-gray-900">{customer.total_orders}</p>
                        <p className="text-xs text-gray-500">Orders</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-green-600">
                          ${customer.total_spent.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">Total Spent</p>
                      </div>
                    </div>

                    {/* Last Order */}
                    {customer.last_order_date && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>Last order: {formatDate(customer.last_order_date)}</span>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <button
                        type="button"
                        className="flex-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center"
                        onClick={() => setEditingCustomer(customer)}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </button>
                      
                      <button
                        type="button"
                        className="px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-md hover:bg-red-50 hover:text-red-700 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center justify-center"
                        onClick={() => handleDeleteCustomer(customer.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {filteredCustomers.length === 0 && !isLoading && (
              <Card className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <User className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No customers found' : 'No customers yet'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm 
                    ? 'Try adjusting your search terms'
                    : 'Add your first customer to get started'
                  }
                </p>
                {!searchTerm && (
                  <UniversalButton onClick={() => setShowAddForm(true)}>
                    Add Customer
                  </UniversalButton>
                )}
              </Card>
            )}
          </>
        )}

        {/* Add Customer Form */}
        {showAddForm && (
          <CustomerForm
            onCustomerSaved={loadCustomers}
            onClose={() => setShowAddForm(false)}
          />
        )}

        {/* Pencil Customer Form */}
        {editingCustomer && (
          <CustomerForm
            customer={editingCustomer}
            onCustomerSaved={loadCustomers}
            onClose={() => setEditingCustomer(null)}
          />
        )}

        {/* HERA Architecture Info */}
        <Card className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Universal Customer Management
            </h3>
            <p className="text-sm text-blue-800 mb-4">
              This customer system demonstrates HERA's universal entity pattern with dynamic properties:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-blue-700">
              <div className="bg-white/50 p-3 rounded-lg">
                <strong>core_entities</strong><br />
                Customers stored as entities with type "customer"
              </div>
              <div className="bg-white/50 p-3 rounded-lg">
                <strong>core_dynamic_data</strong><br />
                Contact info, preferences as flexible properties
              </div>
              <div className="bg-white/50 p-3 rounded-lg">
                <strong>universal_transactions</strong><br />
                Order history linked through entity relationships
              </div>
            </div>
          </div>
        </Card>
      </div>
    </UniversalErrorBoundary>
  )
}