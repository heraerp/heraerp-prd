'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  FileText,
  AlertCircle,
  Save,
  Package,
  Calendar,
  TrendingUp,
  Edit2,
  X
} from 'lucide-react'
import { useDemoOrganization } from '@/lib/dna/patterns/demo-org-pattern'
import {
  useUniversalData,
  universalFilters
} from '@/lib/dna/patterns/universal-api-loading-pattern'
import { universalApi } from '@/lib/universal-api'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { organizationId, orgLoading } = useDemoOrganization()
  const [activeTab, setActiveTab] = useState('details')
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Load customer entity
  const { data: customers, refetch: refetchCustomer } = useUniversalData({
    table: 'core_entities',
    filter: item =>
      item.id === id && item.entity_type === 'customer' && item.organization_id === organizationId,
    organizationId,
    enabled: !!organizationId
  })

  const customer = customers?.[0]

  // Load customer dynamic data
  const { data: dynamicData, refetch: refetchDynamicData } = useUniversalData({
    table: 'core_dynamic_data',
    filter: item => item.entity_id === params.id && item.organization_id === organizationId,
    organizationId,
    enabled: !!organizationId
  })

  // Load customer transactions
  const { data: transactions } = useUniversalData({
    table: 'universal_transactions',
    filter: item => item.from_entity_id === params.id && item.organization_id === organizationId,
    organizationId,
    enabled: !!organizationId
  })

  // Form state
  const [formData, setFormData] = useState({
    entity_name: '',
    entity_code: '',
    email: '',
    phone: '',
    mobile: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '',
    pan_number: '',
    contact_person: '',
    credit_limit: '',
    payment_terms: '',
    notes: ''
  })

  // Initialize form data from customer and dynamic data
  useEffect(() => {
    if (customer && dynamicData) {
      const getFieldValue = (fieldName: string) => {
        const field = dynamicData.find(d => d.field_name === fieldName)
        return field?.field_value_text || field?.field_value_number?.toString() || ''
      }

      setFormData({
        entity_name: customer.entity_name,
        entity_code: customer.entity_code || '',
        email: getFieldValue('email'),
        phone: getFieldValue('phone'),
        mobile: getFieldValue('mobile'),
        address: getFieldValue('address'),
        city: getFieldValue('city'),
        state: getFieldValue('state'),
        pincode: getFieldValue('pincode'),
        gstin: getFieldValue('gstin'),
        pan_number: getFieldValue('pan_number'),
        contact_person: getFieldValue('contact_person'),
        credit_limit: getFieldValue('credit_limit'),
        payment_terms: getFieldValue('payment_terms') || 'Net 30',
        notes: getFieldValue('notes')
      })
    }
  }, [customer, dynamicData])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setError('')
    setLoading(true)

    try {
      universalApi.setOrganizationId(organizationId!)

      // Update entity basic info
      await universalApi.updateEntity(params.id, {
        entity_name: formData.entity_name,
        entity_code: formData.entity_code
      })

      // Update dynamic fields
      const dynamicFields = [
        { field_name: 'email', field_value_text: formData.email, field_type: 'text' as const },
        { field_name: 'phone', field_value_text: formData.phone, field_type: 'text' as const },
        { field_name: 'mobile', field_value_text: formData.mobile, field_type: 'text' as const },
        {
          field_name: 'contact_person',
          field_value_text: formData.contact_person,
          field_type: 'text' as const
        },
        { field_name: 'address', field_value_text: formData.address, field_type: 'text' as const },
        { field_name: 'city', field_value_text: formData.city, field_type: 'text' as const },
        { field_name: 'state', field_value_text: formData.state, field_type: 'text' as const },
        { field_name: 'pincode', field_value_text: formData.pincode, field_type: 'text' as const },
        { field_name: 'gstin', field_value_text: formData.gstin, field_type: 'text' as const },
        {
          field_name: 'pan_number',
          field_value_text: formData.pan_number,
          field_type: 'text' as const
        },
        {
          field_name: 'credit_limit',
          field_value_number: formData.credit_limit ? parseFloat(formData.credit_limit) : 0,
          field_type: 'number' as const
        },
        {
          field_name: 'payment_terms',
          field_value_text: formData.payment_terms,
          field_type: 'text' as const
        },
        { field_name: 'notes', field_value_text: formData.notes, field_type: 'text' as const }
      ]

      for (const field of dynamicFields) {
        if (field.field_value_text || field.field_value_number) {
          await universalApi.setDynamicField(
            params.id,
            field.field_name,
            field.field_type === 'number' ? field.field_value_number! : field.field_value_text!,
            `HERA.FURNITURE.CUSTOMER.${field.field_name.toUpperCase()}.v1`
          )
        }
      }

      // Refresh data
      await refetchCustomer()
      await refetchDynamicData()

      setEditMode(false)
    } catch (err) {
      console.error('Error updating customer:', err)
      setError('Failed to update customer. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Calculate customer metrics
  const metrics = {
    totalRevenue: transactions?.reduce((sum, t) => sum + t.total_amount, 0) || 0,
    orderCount: transactions?.length || 0,
    avgOrderValue: transactions?.length
      ? transactions.reduce((sum, t) => sum + t.total_amount, 0) / transactions.length
      : 0,
    lastOrderDate: transactions?.sort(
      (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
    )[0]?.transaction_date
  }

  if (orgLoading || !customer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/furniture/sales/customers"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {customer.entity_name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{customer.entity_code}</p>
          </div>
        </div>

        <div>
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Customer
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditMode(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Orders
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {metrics.orderCount}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Revenue
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(metrics.totalRevenue)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-amber-500 rounded-md p-3">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Avg Order Value
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(metrics.avgOrderValue)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Last Order
                  </dt>
                  <dd className="text-sm font-semibold text-gray-900 dark:text-white">
                    {metrics.lastOrderDate
                      ? format(new Date(metrics.lastOrderDate), 'MMM dd, yyyy')
                      : 'No orders yet'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Customer Details
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transactions'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Order History
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Phone className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Contact Information
                </h3>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                  <dd className="mt-1">
                    {editMode ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <span className="text-sm text-gray-900 dark:text-white">
                        {formData.email || '-'}
                      </span>
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</dt>
                  <dd className="mt-1">
                    {editMode ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <span className="text-sm text-gray-900 dark:text-white">
                        {formData.phone || '-'}
                      </span>
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Mobile</dt>
                  <dd className="mt-1">
                    {editMode ? (
                      <input
                        type="tel"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <span className="text-sm text-gray-900 dark:text-white">
                        {formData.mobile || '-'}
                      </span>
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Contact Person
                  </dt>
                  <dd className="mt-1">
                    {editMode ? (
                      <input
                        type="text"
                        name="contact_person"
                        value={formData.contact_person}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <span className="text-sm text-gray-900 dark:text-white">
                        {formData.contact_person || '-'}
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Address */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Address</h3>
              </div>

              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Street Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={2}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      PIN Code
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-900 dark:text-white">
                  {formData.address && <p>{formData.address}</p>}
                  {(formData.city || formData.state || formData.pincode) && (
                    <p className="mt-1">
                      {[formData.city, formData.state, formData.pincode].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {!formData.address && !formData.city && !formData.state && !formData.pincode && (
                    <p className="text-gray-500 dark:text-gray-400">No address provided</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Business Information */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Business Information
                </h3>
              </div>

              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">GSTIN</dt>
                  <dd className="mt-1">
                    {editMode ? (
                      <input
                        type="text"
                        name="gstin"
                        value={formData.gstin}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <span className="text-sm text-gray-900 dark:text-white">
                        {formData.gstin || '-'}
                      </span>
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    PAN Number
                  </dt>
                  <dd className="mt-1">
                    {editMode ? (
                      <input
                        type="text"
                        name="pan_number"
                        value={formData.pan_number}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <span className="text-sm text-gray-900 dark:text-white">
                        {formData.pan_number || '-'}
                      </span>
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Credit Limit
                  </dt>
                  <dd className="mt-1">
                    {editMode ? (
                      <input
                        type="number"
                        name="credit_limit"
                        value={formData.credit_limit}
                        onChange={handleInputChange}
                        min="0"
                        step="1000"
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formData.credit_limit
                          ? formatCurrency(Number(formData.credit_limit))
                          : '-'}
                      </span>
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Payment Terms
                  </dt>
                  <dd className="mt-1">
                    {editMode ? (
                      <select
                        name="payment_terms"
                        value={formData.payment_terms}
                        onChange={handleInputChange}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Net 15">Net 15</option>
                        <option value="Net 30">Net 30</option>
                        <option value="Net 45">Net 45</option>
                        <option value="Net 60">Net 60</option>
                      </select>
                    ) : (
                      <span className="text-sm text-gray-900 dark:text-white">
                        {formData.payment_terms || '-'}
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Notes */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <FileText className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Notes</h3>
              </div>

              {editMode ? (
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={4}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Any additional information..."
                />
              ) : (
                <p className="text-sm text-gray-900 dark:text-white">
                  {formData.notes || (
                    <span className="text-gray-500 dark:text-gray-400">No notes added</span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Order Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {transactions?.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                    >
                      No orders yet
                    </td>
                  </tr>
                ) : (
                  transactions?.map(transaction => (
                    <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {transaction.transaction_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(transaction.transaction_date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {transaction.transaction_type.replace('_', ' ').charAt(0).toUpperCase() +
                          transaction.transaction_type.slice(1).replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(transaction.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                          {transaction.metadata?.status || 'completed'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
