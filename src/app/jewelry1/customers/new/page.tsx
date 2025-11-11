'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  UserPlus, 
  Save, 
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  User,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { Jewelry1API, JEWELRY1_SMART_CODES, type Jewelry1Customer } from '@/lib/jewelry1/hera-api'
import { toast } from 'sonner'

export default function NewCustomerPage() {
  const router = useRouter()
  const { user, organization, isAuthenticated } = useHERAAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<Jewelry1Customer>({
    entity_name: '',
    phone: '',
    email: '',
    category: 'retail',
    credit_limit: 50000,
    city: '',
    aadhar_number: '',
    pan_number: ''
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.entity_name.trim()) {
      errors.entity_name = 'Customer name is required'
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required'
    } else if (!/^\+91\s\d{5}\s\d{5}$/.test(formData.phone)) {
      errors.phone = 'Phone format: +91 12345 67890'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format'
    }

    if (formData.aadhar_number && !/^\d{12}$/.test(formData.aadhar_number.replace(/\s/g, ''))) {
      errors.aadhar_number = 'Aadhar must be 12 digits'
    }

    if (formData.pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan_number)) {
      errors.pan_number = 'PAN format: ABCDE1234F'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the form errors')
      return
    }

    if (!organization?.id || !user?.id) {
      toast.error('Authentication required')
      return
    }

    setIsSubmitting(true)

    try {
      // Initialize HERA API with current context
      const jewelry1API = new Jewelry1API(organization.id, user.id)
      
      // Create customer using HERA Sacred Six architecture
      const result = await jewelry1API.createCustomer(formData)

      if (result.success) {
        toast.success('Customer created successfully!', {
          description: `${formData.entity_name} has been added to your customer database.`
        })
        
        // Navigate back to customer list
        router.push('/jewelry1/customers')
      } else {
        console.error('HERA API Error:', result.error)
        toast.error('Failed to create customer', {
          description: result.error?.message || 'Please try again'
        })
      }
    } catch (error) {
      console.error('Customer creation error:', error)
      toast.error('System error occurred', {
        description: 'Please contact support if this continues'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof Jewelry1Customer, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to create customers</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* SAP Fiori Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/jewelry1/customers')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Customers
              </Button>
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Add New Customer</h1>
                <p className="text-sm text-slate-500">Create customer record in HERA Sacred Six</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                <CheckCircle className="w-4 h-4 mr-1" />
                HERA Integrated
              </Badge>
              <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
                {organization?.entity_name || 'Organization'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Basic Information</span>
              </CardTitle>
              <CardDescription>
                Customer details for HERA entity creation with Smart Code: {JEWELRY1_SMART_CODES.CUSTOMER}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="entity_name">Customer Name *</Label>
                  <Input
                    id="entity_name"
                    value={formData.entity_name}
                    onChange={(e) => handleInputChange('entity_name', e.target.value)}
                    placeholder="Enter full customer name"
                    className={validationErrors.entity_name ? 'border-red-500' : ''}
                  />
                  {validationErrors.entity_name && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.entity_name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="category">Customer Category *</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="retail">Retail Customer</option>
                    <option value="wholesale">Wholesale Customer</option>
                    <option value="premium">Premium Customer</option>
                    <option value="vip">VIP Customer</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="w-5 h-5" />
                <span>Contact Information</span>
              </CardTitle>
              <CardDescription>
                Contact details (PII fields will be encrypted in HERA)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+91 12345 67890"
                    className={validationErrors.phone ? 'border-red-500' : ''}
                  />
                  {validationErrors.phone && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.phone}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="customer@example.com"
                    className={validationErrors.email ? 'border-red-500' : ''}
                  />
                  {validationErrors.email && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Mumbai, Delhi, etc."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Financial Information</span>
              </CardTitle>
              <CardDescription>
                Credit limits and identification documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="credit_limit">Credit Limit (₹)</Label>
                  <Input
                    id="credit_limit"
                    type="number"
                    value={formData.credit_limit}
                    onChange={(e) => handleInputChange('credit_limit', parseInt(e.target.value) || 0)}
                    placeholder="50000"
                    min="0"
                  />
                </div>

                <div>
                  <Label htmlFor="aadhar_number">Aadhar Number</Label>
                  <Input
                    id="aadhar_number"
                    value={formData.aadhar_number}
                    onChange={(e) => handleInputChange('aadhar_number', e.target.value)}
                    placeholder="1234 5678 9012"
                    className={validationErrors.aadhar_number ? 'border-red-500' : ''}
                  />
                  {validationErrors.aadhar_number && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.aadhar_number}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="pan_number">PAN Number</Label>
                  <Input
                    id="pan_number"
                    value={formData.pan_number}
                    onChange={(e) => handleInputChange('pan_number', e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    className={validationErrors.pan_number ? 'border-red-500' : ''}
                  />
                  {validationErrors.pan_number && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.pan_number}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* HERA Integration Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 text-sm text-slate-600">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-medium">HERA Sacred Six Integration</div>
                  <div>This customer will be created in HERA's core_entities table with dynamic fields in core_dynamic_data.</div>
                  <div className="mt-1 text-xs">
                    Organization: {organization?.entity_name} | Actor: {user?.entity_name} | Smart Code: {JEWELRY1_SMART_CODES.CUSTOMER}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => router.push('/jewelry1/customers')}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Customer
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}