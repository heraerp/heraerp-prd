'use client'

/**
 * Greenworms Service Order Creation Page
 * Generated using HERA Enterprise Patterns
 * 
 * Module: OPERATIONS
 * Entity: SERVICE_ORDER
 * Smart Code: HERA.WASTE.TXN.COLLECTION.v1
 * Description: Waste collection service order creation wizard
 */

import React, { useState, useEffect } from 'react'
import { MobilePageLayout } from '@/components/mobile/MobilePageLayout'
import { MobileCard } from '@/components/mobile/MobileCard'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useUniversalEntity } from '@/hooks/useUniversalEntity'
import { 
  AlertCircle,
  CheckCircle,
  Clock,
  Save,
  Send,
  Plus,
  Minus,
  MapPin,
  Truck,
  Users,
  Calendar,
  Package,
  DollarSign,
  FileText,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Search,
  X
} from 'lucide-react'

/**
 * Service Order Interface
 */
interface ServiceOrder {
  transaction_type: string
  smart_code: string
  source_entity_id?: string // Customer
  target_entity_id?: string // Location/Route
  transaction_date: string
  scheduled_date: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  service_type: 'regular' | 'one_time' | 'emergency' | 'bulk'
  notes?: string
  total_amount: number
  currency: string
  organization_id: string
}

/**
 * Service Order Line Interface
 */
interface ServiceOrderLine {
  line_number: number
  line_type: string
  description: string
  quantity: number
  unit_amount: number
  line_amount: number
  entity_id?: string // Waste item or service
  smart_code: string
  uom: string
  waste_category?: string
}

/**
 * Customer Interface
 */
interface Customer {
  id: string
  entity_name: string
  entity_type: string
  address?: string
  contact_person?: string
  phone?: string
  email?: string
}

/**
 * Location Interface
 */
interface Location {
  id: string
  entity_name: string
  location_type: string
  address?: string
  coordinates?: string
}

/**
 * Waste Item Interface
 */
interface WasteItem {
  id: string
  entity_name: string
  category: string
  uom: string
  unit_rate?: number
}

/**
 * Greenworms Service Order Creation Component
 * Multi-step wizard with HERA transaction patterns
 */
export default function NewServiceOrderPage() {
  const { currentOrganization, isAuthenticated, user } = useHERAAuth()
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Service order state
  const [serviceOrder, setServiceOrder] = useState<ServiceOrder>({
    transaction_type: 'SERVICE_ORDER',
    smart_code: 'HERA.WASTE.TXN.COLLECTION.v1',
    transaction_date: new Date().toISOString().split('T')[0],
    scheduled_date: new Date().toISOString().split('T')[0],
    priority: 'medium',
    service_type: 'regular',
    total_amount: 0,
    currency: 'INR',
    organization_id: currentOrganization?.id || ''
  })

  const [serviceLines, setServiceLines] = useState<ServiceOrderLine[]>([
    {
      line_number: 1,
      line_type: 'SERVICE',
      description: 'Waste collection service',
      quantity: 1,
      unit_amount: 0,
      line_amount: 0,
      smart_code: 'HERA.WASTE.TXN.COLLECTION.LINE.v1',
      uom: 'KG'
    }
  ])

  // Search states
  const [customerSearch, setCustomerSearch] = useState('')
  const [locationSearch, setLocationSearch] = useState('')
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)
  const [showLocationSearch, setShowLocationSearch] = useState(false)

  // HERA Universal Entity Integration
  const customersData = useUniversalEntity({
    entity_type: 'CUSTOMER',
    organizationId: currentOrganization?.id,
    filters: { include_dynamic: true, status: 'active' }
  })

  const locationsData = useUniversalEntity({
    entity_type: 'LOCATION',
    organizationId: currentOrganization?.id,
    filters: { include_dynamic: true, status: 'active' }
  })

  const wasteItemsData = useUniversalEntity({
    entity_type: 'WASTE_ITEM',
    organizationId: currentOrganization?.id,
    filters: { include_dynamic: true, status: 'active' }
  })

  // Transform entities
  const customers: Customer[] = customersData.entities?.map((entity: any) => ({
    id: entity.id,
    entity_name: entity.entity_name,
    entity_type: entity.entity_type,
    address: entity.dynamic_data?.find((d: any) => d.field_name === 'address')?.field_value_text,
    contact_person: entity.dynamic_data?.find((d: any) => d.field_name === 'contact_person')?.field_value_text,
    phone: entity.dynamic_data?.find((d: any) => d.field_name === 'phone')?.field_value_text,
    email: entity.dynamic_data?.find((d: any) => d.field_name === 'email')?.field_value_text
  })) || []

  const locations: Location[] = locationsData.entities?.map((entity: any) => ({
    id: entity.id,
    entity_name: entity.entity_name,
    location_type: entity.dynamic_data?.find((d: any) => d.field_name === 'location_type')?.field_value_text || 'CUSTOMER_SITE',
    address: entity.dynamic_data?.find((d: any) => d.field_name === 'address')?.field_value_text,
    coordinates: entity.dynamic_data?.find((d: any) => d.field_name === 'coordinates')?.field_value_text
  })) || []

  const wasteItems: WasteItem[] = wasteItemsData.entities?.map((entity: any) => ({
    id: entity.id,
    entity_name: entity.entity_name,
    category: entity.dynamic_data?.find((d: any) => d.field_name === 'category')?.field_value_text || 'MIXED',
    uom: entity.dynamic_data?.find((d: any) => d.field_name === 'uom')?.field_value_text || 'KG',
    unit_rate: entity.dynamic_data?.find((d: any) => d.field_name === 'unit_rate')?.field_value_number || 0
  })) || []

  // Filter customers and locations based on search
  const filteredCustomers = customers.filter(customer => 
    customer.entity_name.toLowerCase().includes(customerSearch.toLowerCase())
  )

  const filteredLocations = locations.filter(location => 
    location.entity_name.toLowerCase().includes(locationSearch.toLowerCase())
  )

  // Calculate totals
  useEffect(() => {
    const total = serviceLines.reduce((sum, line) => sum + line.line_amount, 0)
    setServiceOrder(prev => ({ ...prev, total_amount: total }))
  }, [serviceLines])

  // Add service line
  const addServiceLine = () => {
    const newLine: ServiceOrderLine = {
      line_number: serviceLines.length + 1,
      line_type: 'SERVICE',
      description: '',
      quantity: 1,
      unit_amount: 0,
      line_amount: 0,
      smart_code: 'HERA.WASTE.TXN.COLLECTION.LINE.v1',
      uom: 'KG'
    }
    setServiceLines([...serviceLines, newLine])
  }

  // Remove service line
  const removeServiceLine = (index: number) => {
    if (serviceLines.length > 1) {
      const updatedLines = serviceLines.filter((_, i) => i !== index)
      // Renumber lines
      updatedLines.forEach((line, i) => line.line_number = i + 1)
      setServiceLines(updatedLines)
    }
  }

  // Update service line
  const updateServiceLine = (index: number, field: keyof ServiceOrderLine, value: any) => {
    const updatedLines = [...serviceLines]
    updatedLines[index] = { ...updatedLines[index], [field]: value }
    
    // Calculate line amount
    if (field === 'quantity' || field === 'unit_amount') {
      updatedLines[index].line_amount = updatedLines[index].quantity * updatedLines[index].unit_amount
    }
    
    setServiceLines(updatedLines)
  }

  // Select customer
  const selectCustomer = (customer: Customer) => {
    setServiceOrder(prev => ({ ...prev, source_entity_id: customer.id }))
    setShowCustomerSearch(false)
    setCustomerSearch('')
  }

  // Select location
  const selectLocation = (location: Location) => {
    setServiceOrder(prev => ({ ...prev, target_entity_id: location.id }))
    setShowLocationSearch(false)
    setLocationSearch('')
  }

  // Validate current step
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!serviceOrder.source_entity_id) newErrors.customer = 'Customer is required'
        if (!serviceOrder.target_entity_id) newErrors.location = 'Location is required'
        if (!serviceOrder.scheduled_date) newErrors.scheduled_date = 'Scheduled date is required'
        break
      case 2:
        serviceLines.forEach((line, index) => {
          if (!line.description) newErrors[`line_${index}_description`] = 'Description is required'
          if (line.quantity <= 0) newErrors[`line_${index}_quantity`] = 'Quantity must be greater than 0'
          if (line.unit_amount < 0) newErrors[`line_${index}_unit_amount`] = 'Unit amount cannot be negative'
        })
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Next step
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1)
    }
  }

  // Previous step
  const prevStep = () => {
    setCurrentStep(currentStep - 1)
    setErrors({})
  }

  // Submit service order
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    setIsSubmitting(true)
    try {
      // Here you would call the HERA transaction API
      // await universalApi.createTransaction('SERVICE_ORDER', serviceOrder, serviceLines)
      
      console.log('✅ Service Order Created:', { serviceOrder, serviceLines })
      
      // Redirect to orders list or show success message
      // router.push('/greenworms/ops/service-orders')
      
    } catch (error) {
      console.error('❌ Error creating service order:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get selected customer
  const selectedCustomer = customers.find(c => c.id === serviceOrder.source_entity_id)
  const selectedLocation = locations.find(l => l.id === serviceOrder.target_entity_id)

  // Enterprise security checks
  if (!isAuthenticated) {
    return (
      <div className="p-4 text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p>Please log in to create service orders.</p>
      </div>
    )
  }

  if (!currentOrganization) {
    return (
      <div className="p-4 text-center">
        <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
        <p>No organization context found. Please select an organization.</p>
      </div>
    )
  }

  return (
    <MobilePageLayout
      title="New Service Order"
      subtitle={`Step ${currentStep} of 3`}
      primaryColor="#10b981"
      accentColor="#059669"
      showBackButton={true}
    >
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= currentStep ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {step}
              </div>
              <p className="text-xs mt-1 text-gray-600">
                {step === 1 ? 'Details' : step === 2 ? 'Services' : 'Review'}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Service Order Details */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <MobileCard className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Order Details</h2>
            
            {/* Customer Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer *
              </label>
              {selectedCustomer ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-900">{selectedCustomer.entity_name}</p>
                    <p className="text-sm text-green-700">{selectedCustomer.address}</p>
                  </div>
                  <button
                    onClick={() => setServiceOrder(prev => ({ ...prev, source_entity_id: undefined }))}
                    className="text-green-600 hover:text-green-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomerSearch(true)}
                  className="w-full p-3 border border-gray-300 rounded-md text-left text-gray-600 hover:bg-gray-50"
                >
                  Select Customer...
                </button>
              )}
              {errors.customer && <p className="text-sm text-red-600 mt-1">{errors.customer}</p>}
            </div>

            {/* Location Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Location *
              </label>
              {selectedLocation ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between">
                  <div>
                    <p className="font-medium text-blue-900">{selectedLocation.entity_name}</p>
                    <p className="text-sm text-blue-700">{selectedLocation.address}</p>
                  </div>
                  <button
                    onClick={() => setServiceOrder(prev => ({ ...prev, target_entity_id: undefined }))}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLocationSearch(true)}
                  className="w-full p-3 border border-gray-300 rounded-md text-left text-gray-600 hover:bg-gray-50"
                >
                  Select Location...
                </button>
              )}
              {errors.location && <p className="text-sm text-red-600 mt-1">{errors.location}</p>}
            </div>

            {/* Service Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Date *
                </label>
                <input
                  type="date"
                  value={serviceOrder.scheduled_date}
                  onChange={(e) => setServiceOrder(prev => ({ ...prev, scheduled_date: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.scheduled_date ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                  }`}
                />
                {errors.scheduled_date && <p className="text-sm text-red-600 mt-1">{errors.scheduled_date}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={serviceOrder.priority}
                  onChange={(e) => setServiceOrder(prev => ({ 
                    ...prev, 
                    priority: e.target.value as ServiceOrder['priority'] 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Type
                </label>
                <select
                  value={serviceOrder.service_type}
                  onChange={(e) => setServiceOrder(prev => ({ 
                    ...prev, 
                    service_type: e.target.value as ServiceOrder['service_type'] 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="regular">Regular Collection</option>
                  <option value="one_time">One-time Service</option>
                  <option value="emergency">Emergency</option>
                  <option value="bulk">Bulk Collection</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  value={serviceOrder.currency}
                  onChange={(e) => setServiceOrder(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Instructions
              </label>
              <textarea
                value={serviceOrder.notes || ''}
                onChange={(e) => setServiceOrder(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter any special instructions or notes..."
              />
            </div>
          </MobileCard>
        </div>
      )}

      {/* Step 2: Service Lines */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <MobileCard className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Service Items</h2>
              <button
                onClick={addServiceLine}
                className="px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </button>
            </div>

            {serviceLines.map((line, index) => (
              <div key={index} className="border border-gray-200 rounded-md p-4 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-gray-900">Item {line.line_number}</h3>
                  {serviceLines.length > 1 && (
                    <button
                      onClick={() => removeServiceLine(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <input
                      type="text"
                      value={line.description}
                      onChange={(e) => updateServiceLine(index, 'description', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        errors[`line_${index}_description`] ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                      }`}
                      placeholder="e.g., Mixed waste collection"
                    />
                    {errors[`line_${index}_description`] && (
                      <p className="text-sm text-red-600 mt-1">{errors[`line_${index}_description`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      value={line.quantity}
                      onChange={(e) => updateServiceLine(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        errors[`line_${index}_quantity`] ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                      }`}
                      min="0"
                      step="0.01"
                    />
                    {errors[`line_${index}_quantity`] && (
                      <p className="text-sm text-red-600 mt-1">{errors[`line_${index}_quantity`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      UOM
                    </label>
                    <select
                      value={line.uom}
                      onChange={(e) => updateServiceLine(index, 'uom', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="KG">KG</option>
                      <option value="TON">TON</option>
                      <option value="TRIP">TRIP</option>
                      <option value="HOUR">HOUR</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Rate
                    </label>
                    <input
                      type="number"
                      value={line.unit_amount}
                      onChange={(e) => updateServiceLine(index, 'unit_amount', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        errors[`line_${index}_unit_amount`] ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                      }`}
                      min="0"
                      step="0.01"
                    />
                    {errors[`line_${index}_unit_amount`] && (
                      <p className="text-sm text-red-600 mt-1">{errors[`line_${index}_unit_amount`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Line Total
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                      {serviceOrder.currency} {line.line_amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Total */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                <span className="text-xl font-bold text-green-600">
                  {serviceOrder.currency} {serviceOrder.total_amount.toFixed(2)}
                </span>
              </div>
            </div>
          </MobileCard>
        </div>
      )}

      {/* Step 3: Review */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <MobileCard className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Service Order</h2>
            
            {/* Order Summary */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Service Details</h3>
                <div className="bg-gray-50 p-4 rounded-md space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer:</span>
                    <span className="font-medium">{selectedCustomer?.entity_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{selectedLocation?.entity_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Scheduled Date:</span>
                    <span className="font-medium">{serviceOrder.scheduled_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Priority:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                      serviceOrder.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      serviceOrder.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      serviceOrder.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {serviceOrder.priority}
                    </span>
                  </div>
                </div>
              </div>

              {/* Service Lines */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Service Items</h3>
                <div className="space-y-2">
                  {serviceLines.map((line, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{line.description}</p>
                          <p className="text-sm text-gray-600">
                            {line.quantity} {line.uom} × {serviceOrder.currency} {line.unit_amount}
                          </p>
                        </div>
                        <p className="font-medium">
                          {serviceOrder.currency} {line.line_amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                  <span className="text-xl font-bold text-green-600">
                    {serviceOrder.currency} {serviceOrder.total_amount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </MobileCard>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </button>

        {currentStep < 3 ? (
          <button
            onClick={nextStep}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Create Order
              </>
            )}
          </button>
        )}
      </div>

      {/* Customer Search Modal */}
      {showCustomerSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold">Select Customer</h3>
                <button onClick={() => setShowCustomerSearch(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customers..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => selectCustomer(customer)}
                  className="w-full p-4 text-left hover:bg-gray-50 border-b"
                >
                  <p className="font-medium">{customer.entity_name}</p>
                  <p className="text-sm text-gray-600">{customer.address}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Location Search Modal */}
      {showLocationSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold">Select Location</h3>
                <button onClick={() => setShowLocationSearch(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  placeholder="Search locations..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {filteredLocations.map((location) => (
                <button
                  key={location.id}
                  onClick={() => selectLocation(location)}
                  className="w-full p-4 text-left hover:bg-gray-50 border-b"
                >
                  <p className="font-medium">{location.entity_name}</p>
                  <p className="text-sm text-gray-600">{location.address}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </MobilePageLayout>
  )
}