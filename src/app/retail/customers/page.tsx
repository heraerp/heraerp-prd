/**
 * Retail Customers Page
 * 
 * Shared org-aware customers interface with:
 * - Dynamic field rendering based on org configuration
 * - Real-time search and pagination
 * - CRUD operations through hooks
 * - Mobile-first responsive design
 */

'use client'

import { useState, useMemo } from 'react'
import { useCustomers, useCustomerMutations, useCustomerFieldConfig } from '@/lib/hooks/useCustomers'
import { useOrg } from '@/lib/hooks/useOrg'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Search, 
  Plus, 
  Users, 
  Building2, 
  Mail, 
  Phone, 
  Calendar,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react'

export default function CustomersPage() {
  // Hooks
  const auth = useHERAAuth()
  const { organization, isLoading: orgLoading, error: orgError } = useOrg()
  const { createCustomer, updateCustomer, deleteCustomer } = useCustomerMutations()
  const { fieldConfig, isLoading: configLoading } = useCustomerFieldConfig()

  // Local state
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [formData, setFormData] = useState({})

  // Query parameters
  const limit = 50
  const offset = currentPage * limit

  // Fetch customers
  const { 
    data: customersData, 
    error: customersError, 
    isLoading: customersLoading,
    mutate: refreshCustomers
  } = useCustomers({ 
    search, 
    limit, 
    offset,
    sort: 'entity_name',
    order: 'asc'
  })

  // Authentication and organization checks
  if (!auth?.isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert>
          <AlertDescription>Please log in to access customers.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (orgError || !organization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive">
          <AlertDescription>
            {orgError || 'No organization context available'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Loading states
  if (configLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Loading field configuration...</p>
        </div>
      </div>
    )
  }

  // Data preparation
  const customers = customersData?.data || []
  const pagination = customersData?.pagination
  const hasMore = pagination?.has_more || false
  const total = pagination?.total || 0

  // Field configuration for forms
  const visibleFields = fieldConfig?.fields?.filter(f => f.is_visible) || []
  const requiredFields = visibleFields.filter(f => f.required)

  // Form handlers
  const handleCreateCustomer = async (data) => {
    try {
      await createCustomer({
        entity_name: data.entity_name,
        dynamic_fields: data
      })
      setShowCreateForm(false)
      setFormData({})
      refreshCustomers()
    } catch (error) {
      console.error('Create customer failed:', error)
      // TODO: Show error toast
    }
  }

  const handleUpdateCustomer = async (customerId, data) => {
    try {
      await updateCustomer(customerId, {
        entity_name: data.entity_name,
        dynamic_fields: data
      })
      setEditingCustomer(null)
      setFormData({})
      refreshCustomers()
    } catch (error) {
      console.error('Update customer failed:', error)
      // TODO: Show error toast
    }
  }

  const handleDeleteCustomer = async (customerId) => {
    if (!confirm('Are you sure you want to delete this customer?')) return
    
    try {
      await deleteCustomer(customerId)
      refreshCustomers()
    } catch (error) {
      console.error('Delete customer failed:', error)
      // TODO: Show error toast
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Mobile Header */}
      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />
      
      <div className="md:hidden sticky top-0 z-50 bg-white border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Customers</h1>
              <p className="text-xs text-gray-500">{organization.name}</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setShowCreateForm(true)}
            className="min-w-[44px] min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-gray-600">Manage customer records for {organization.name}</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Customer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-xl font-bold">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-xl font-bold">{customers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-2 md:col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Organization</p>
                <p className="text-lg font-semibold truncate">{organization.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Error handling */}
      {customersError && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load customers: {customersError.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Customers List */}
      {customersLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : customers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No customers found</h3>
            <p className="text-gray-600 mb-4">
              {search ? 'Try adjusting your search terms' : 'Get started by creating your first customer'}
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Customer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {customers.map((customer) => (
              <Card key={customer.entity_id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{customer.entity_name}</h3>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingCustomer(customer)}
                      className="min-w-[44px] min-h-[44px]"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteCustomer(customer.entity_id)}
                      className="min-w-[44px] min-h-[44px] text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  {customer.dynamic_fields.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{customer.dynamic_fields.email.field_value_text}</span>
                    </div>
                  )}
                  {customer.dynamic_fields.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{customer.dynamic_fields.phone.field_value_text}</span>
                    </div>
                  )}
                  
                  {/* Dynamic org-specific fields */}
                  {visibleFields.slice(0, 3).map((field) => {
                    const value = customer.dynamic_fields[field.name]
                    if (!value || field.name === 'email' || field.name === 'phone') return null
                    
                    return (
                      <div key={field.name} className="flex items-center justify-between">
                        <span className="text-gray-600">{field.label}:</span>
                        <Badge variant="secondary">
                          {value.field_value_text || value.field_value_number || 'N/A'}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-4 font-semibold">Name</th>
                        <th className="text-left p-4 font-semibold">Email</th>
                        <th className="text-left p-4 font-semibold">Phone</th>
                        {/* Dynamic org-specific columns */}
                        {visibleFields.slice(0, 2).map((field) => (
                          <th key={field.name} className="text-left p-4 font-semibold">
                            {field.label}
                          </th>
                        ))}
                        <th className="text-left p-4 font-semibold">Created</th>
                        <th className="text-right p-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((customer) => (
                        <tr key={customer.entity_id} className="border-t hover:bg-gray-50">
                          <td className="p-4 font-medium">{customer.entity_name}</td>
                          <td className="p-4">
                            {customer.dynamic_fields.email?.field_value_text || 'N/A'}
                          </td>
                          <td className="p-4">
                            {customer.dynamic_fields.phone?.field_value_text || 'N/A'}
                          </td>
                          {/* Dynamic org-specific columns */}
                          {visibleFields.slice(0, 2).map((field) => {
                            const value = customer.dynamic_fields[field.name]
                            return (
                              <td key={field.name} className="p-4">
                                {value?.field_value_text || value?.field_value_number || 'N/A'}
                              </td>
                            )
                          })}
                          <td className="p-4 text-sm text-gray-600">
                            {new Date(customer.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingCustomer(customer)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteCustomer(customer.entity_id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pagination */}
          {hasMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={customersLoading}
              >
                {customersLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Load More
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Bottom spacing for mobile */}
      <div className="h-24 md:h-0" />
    </div>
  )
}