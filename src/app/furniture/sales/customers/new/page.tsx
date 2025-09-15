'use client'

import { useState } from 'react'
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
  Save
} from 'lucide-react'
import { useDemoOrganization } from '@/lib/dna/patterns/demo-org-pattern'
import { universalApi } from '@/lib/universal-api'

interface CustomerFormData {
  // Core entity fields
  entity_name: string
  entity_code: string

  // Contact information
  email: string
  phone: string
  mobile: string

  // Address
  address: string
  city: string
  state: string
  pincode: string

  // Business information
  gstin: string
  pan_number: string
  contact_person: string

  // Financial
  credit_limit: string
  payment_terms: string

  // Additional
  notes: string
}

export default function NewCustomerPage() {
  const router = useRouter()
  const { organizationId, orgLoading } = useDemoOrganization()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<CustomerFormData>({
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
    payment_terms: 'Net 30',
    notes: ''
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const generateCustomerCode = () => {
    const prefix = 'CUST'
    const timestamp = Date.now().toString(36).toUpperCase().slice(-4)
    const random = Math.random().toString(36).toUpperCase().slice(2, 5)
    return `${prefix}-${timestamp}-${random}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.entity_name) {
      setError('Please enter customer name')
      return
    }

    setLoading(true)

    try {
      // Set organization context
      universalApi.setOrganizationId(organizationId!)

      // Generate customer code if not provided
      const customerCode = formData.entity_code || generateCustomerCode()

      // Create the customer entity
      const customerData = {
        entity_type: 'customer' as const,
        entity_name: formData.entity_name,
        entity_code: customerCode,
        smart_code: 'HERA.FURNITURE.CUSTOMER.ENTITY.v1',
        metadata: {
          industry: 'furniture',
          customer_type: 'business',
          source: 'direct',
          created_at: new Date().toISOString()
        }
      }

      const customer = await universalApi.createEntity(customerData)

      // Now create all the dynamic data fields
      const dynamicFields = [
        // Contact Information
        { field_name: 'email', field_value_text: formData.email, field_type: 'text' as const },
        { field_name: 'phone', field_value_text: formData.phone, field_type: 'text' as const },
        { field_name: 'mobile', field_value_text: formData.mobile, field_type: 'text' as const },
        {
          field_name: 'contact_person',
          field_value_text: formData.contact_person,
          field_type: 'text' as const
        },

        // Address
        { field_name: 'address', field_value_text: formData.address, field_type: 'text' as const },
        { field_name: 'city', field_value_text: formData.city, field_type: 'text' as const },
        { field_name: 'state', field_value_text: formData.state, field_type: 'text' as const },
        { field_name: 'pincode', field_value_text: formData.pincode, field_type: 'text' as const },

        // Business Information
        { field_name: 'gstin', field_value_text: formData.gstin, field_type: 'text' as const },
        {
          field_name: 'pan_number',
          field_value_text: formData.pan_number,
          field_type: 'text' as const
        },

        // Financial
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

        // Additional
        { field_name: 'notes', field_value_text: formData.notes, field_type: 'text' as const }
      ]

      // Save all dynamic fields
      for (const field of dynamicFields) {
        if (field.field_value_text || field.field_value_number) {
          await universalApi.setDynamicField(
            customer.data.id,
            field.field_name,
            field.field_type === 'number' ? field.field_value_number! : field.field_value_text!,
            `HERA.FURNITURE.CUSTOMER.${field.field_name.toUpperCase()}.v1`
          )
        }
      }

      // Navigate to the customers list
      router.push('/furniture/sales/customers')
    } catch (err) {
      console.error('Error creating customer:', err)
      setError('Failed to create customer. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/furniture/sales/customers"
            className="p-2 hover:bg-muted dark:hover:bg-muted rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground dark:text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">New Customer</h1>
            <p className="text-muted-foreground dark:text-muted-foreground">Add a new customer to your database</p>
          </div>
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-background dark:bg-muted shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Building2 className="h-5 w-5 text-muted-foreground mr-2" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-foreground">Basic Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="entity_name"
                value={formData.entity_name}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-border dark:border-border rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 dark:bg-muted-foreground/10 dark:text-foreground"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Customer Code
              </label>
              <input
                type="text"
                name="entity_code"
                value={formData.entity_code}
                onChange={handleInputChange}
                placeholder="Auto-generated if blank"
                className="block w-full px-3 py-2 border border-border dark:border-border rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 dark:bg-muted-foreground/10 dark:text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contact Person
              </label>
              <input
                type="text"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-border dark:border-border rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 dark:bg-muted-foreground/10 dark:text-foreground"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-background dark:bg-muted shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Phone className="h-5 w-5 text-muted-foreground mr-2" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-foreground">
              Contact Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-border dark:border-border rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 dark:bg-muted-foreground/10 dark:text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-border dark:border-border rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 dark:bg-muted-foreground/10 dark:text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mobile
              </label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-border dark:border-border rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 dark:bg-muted-foreground/10 dark:text-foreground"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-background dark:bg-muted shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <MapPin className="h-5 w-5 text-muted-foreground mr-2" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-foreground">Address</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Street Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={2}
                className="block w-full px-3 py-2 border border-border dark:border-border rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 dark:bg-muted-foreground/10 dark:text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-border dark:border-border rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 dark:bg-muted-foreground/10 dark:text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                State
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-border dark:border-border rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 dark:bg-muted-foreground/10 dark:text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                PIN Code
              </label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-border dark:border-border rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 dark:bg-muted-foreground/10 dark:text-foreground"
              />
            </div>
          </div>
        </div>

        {/* Business Information */}
        <div className="bg-background dark:bg-muted shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <CreditCard className="h-5 w-5 text-muted-foreground mr-2" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-foreground">
              Business Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                GSTIN
              </label>
              <input
                type="text"
                name="gstin"
                value={formData.gstin}
                onChange={handleInputChange}
                placeholder="29AAAAA0000A1Z5"
                className="block w-full px-3 py-2 border border-border dark:border-border rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 dark:bg-muted-foreground/10 dark:text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                PAN Number
              </label>
              <input
                type="text"
                name="pan_number"
                value={formData.pan_number}
                onChange={handleInputChange}
                placeholder="AAAAA0000A"
                className="block w-full px-3 py-2 border border-border dark:border-border rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 dark:bg-muted-foreground/10 dark:text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Credit Limit (₹)
              </label>
              <input
                type="number"
                name="credit_limit"
                value={formData.credit_limit}
                onChange={handleInputChange}
                min="0"
                step="1000"
                className="block w-full px-3 py-2 border border-border dark:border-border rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 dark:bg-muted-foreground/10 dark:text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Terms
              </label>
              <select
                name="payment_terms"
                value={formData.payment_terms}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-border dark:border-border rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 dark:bg-muted-foreground/10 dark:text-foreground"
              >
                <option value="Cash">Cash</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="Net 60">Net 60</option>
              </select>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-background dark:bg-muted shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <FileText className="h-5 w-5 text-muted-foreground mr-2" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-foreground">
              Additional Information
            </h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
              className="block w-full px-3 py-2 border border-border dark:border-border rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 dark:bg-muted-foreground/10 dark:text-foreground"
              placeholder="Any additional information about this customer..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Link
            href="/furniture/sales/customers"
            className="px-4 py-2 border border-border dark:border-border text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-background dark:bg-muted-foreground/10 hover:bg-muted dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-foreground bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Customer
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
