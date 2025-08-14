#!/usr/bin/env node

/**
 * HERA Module Generator - Steve Jobs Customer-Focused Template
 * 
 * Generates restaurant modules that speak customer language, not tech jargon
 * Usage: npm run generate-module --name=orders --type=restaurant
 */

const fs = require('fs')
const path = require('path')

// Get command line arguments
const args = process.argv.slice(2)
const getName = () => args.find(arg => arg.startsWith('--name='))?.split('=')[1]
const getType = () => args.find(arg => arg.startsWith('--type='))?.split('=')[1] || 'restaurant'

const moduleName = getName()
let moduleType = getType()

// Auto-detect restaurant modules
if (['inventory', 'menu', 'staff', 'customers', 'orders', 'kitchen', 'delivery', 'suppliers'].includes(moduleName)) {
  moduleType = 'restaurant'
  console.log(`Restaurant module detected: ${moduleName}`)
}

if (!moduleName) {
  console.error('Module name is required: --name=module_name')
  process.exit(1)
}

console.log(`Generating Restaurant Module: ${moduleName.toUpperCase()}`)

// Customer-focused descriptions
function getCustomerDescription(name) {
  const descriptions = {
    inventory: 'Know what you have, when to reorder, stop wasting money',
    menu: 'Create dishes that sell, price them right, make more money',
    staff: 'Manage your team, track hours, control labor costs',
    customers: 'Keep customers happy, get them back, increase spending',
    orders: 'Take orders fast, deliver on time, get paid quickly',
    kitchen: 'Cook efficiently, reduce wait times, serve quality food',
    delivery: 'Get food to customers hot, fast, and profitable',
    suppliers: 'Better prices, reliable delivery, quality ingredients'
  }
  return descriptions[name] || `Manage your ${name} better, make more money`
}

// Module configuration
const config = {
  name: moduleName,
  type: moduleType,
  prefix: moduleName.substring(0, 3).toUpperCase(),
  description: `Restaurant ${moduleName} that makes money`,
  customerDescription: getCustomerDescription(moduleName),
  entities: ['item', 'order', 'customer', 'supplier'],
  transactions: ['sale', 'purchase', 'waste', 'reorder'],
  apis: ['entities', 'transactions', 'reports', 'validations'],
  ui: ['dashboard', 'list', 'form', 'reports'],
  generatedAt: new Date().toISOString(),
  generatedBy: 'HERA_MODULE_GENERATOR_CUSTOMER_FOCUSED',
  version: '2.0.0',
  steveJobsPrinciple: 'Simplicity is the ultimate sophistication'
}

console.log('Creating module directories...')

// Create directories
const modulePath = path.join(process.cwd(), 'src', 'app', 'restaurant', moduleName)
const apiPath = path.join(process.cwd(), 'src', 'app', 'api', 'v1', moduleName)

const dirsToCreate = [modulePath, apiPath]
dirsToCreate.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    console.log(`Created: ${dir}`)
  }
})

// Generate delivery-specific form page
function createDeliveryFormPage() {
  return `'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import '../../../app/globals.css' // HERA DNA: Universal dropdown visibility fix
import { 
  Truck, ArrowLeft, Save, AlertCircle, User, Phone, MapPin, Clock, DollarSign, Navigation
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DeliveryFormPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationType, setNotificationType] = useState('success')

  // Demo organization ID (Mario's Restaurant)
  const organizationId = '550e8400-e29b-41d4-a716-446655440000'

  // Form state - Delivery-specific fields
  const [formData, setFormData] = useState({
    entity_name: '',
    entity_code: '',
    driver_name: '',
    driver_phone: '',
    vehicle_info: '',
    delivery_address: '',
    customer_name: '',
    customer_phone: '',
    order_details: '',
    delivery_fee: '',
    estimated_time: '',
    special_instructions: '',
    delivery_date: new Date().toISOString().split('T')[0]
  })

  // Delivery status options
  const deliveryStatuses = [
    { value: 'preparing', label: 'Preparing' },
    { value: 'ready', label: 'Ready for Pickup' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' }
  ]

  // Vehicle type options
  const vehicleTypes = [
    { value: 'bike', label: 'Bike' },
    { value: 'scooter', label: 'Scooter' },
    { value: 'car', label: 'Car' },
    { value: 'van', label: 'Van' }
  ]

  // Create delivery
  const createDelivery = async () => {
    if (!formData.driver_name || !formData.delivery_address || !formData.customer_name) {
      setNotificationMessage('Please fill in driver name, delivery address, and customer name')
      setNotificationType('error')
      setShowNotification(true)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/v1/delivery/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          entity_type: 'delivery',
          entity_name: formData.entity_name || \`Delivery to \${formData.customer_name}\`,
          entity_code: formData.entity_code || \`DEL-\${Date.now().toString().slice(-6)}\`,
          dynamic_fields: {
            driver_name: formData.driver_name,
            driver_phone: formData.driver_phone,
            vehicle_info: formData.vehicle_info,
            delivery_address: formData.delivery_address,
            customer_name: formData.customer_name,
            customer_phone: formData.customer_phone,
            order_details: formData.order_details,
            delivery_fee: formData.delivery_fee,
            estimated_time: formData.estimated_time,
            special_instructions: formData.special_instructions,
            delivery_date: formData.delivery_date
          }
        })
      })

      const result = await response.json()
      if (result.success) {
        setNotificationMessage('Delivery created successfully!')
        setNotificationType('success')
        setShowNotification(true)
        
        setTimeout(() => {
          router.push('/restaurant/delivery/dashboard')
        }, 2000)
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('Error creating delivery:', error)
      setNotificationMessage('Failed to create delivery. Please try again.')
      setNotificationType('error')
      setShowNotification(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
              Mario's Restaurant
            </Badge>
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-600 bg-clip-text text-transparent">
            🚚 New Delivery
          </h1>
          <p className="text-gray-600 mt-2">
            Get food to customers hot, fast, and profitable
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Driver Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Driver Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="driver_name">Driver Name *</Label>
                    <Input
                      id="driver_name"
                      value={formData.driver_name}
                      onChange={(e) => setFormData({...formData, driver_name: e.target.value})}
                      placeholder="Enter driver name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="driver_phone">Driver Phone</Label>
                    <Input
                      id="driver_phone"
                      value={formData.driver_phone}
                      onChange={(e) => setFormData({...formData, driver_phone: e.target.value})}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="vehicle_info">Vehicle Information</Label>
                  <Input
                    id="vehicle_info"
                    value={formData.vehicle_info}
                    onChange={(e) => setFormData({...formData, vehicle_info: e.target.value})}
                    placeholder="e.g., Honda Bike - License: ABC123"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Delivery Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Delivery Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="delivery_address">Delivery Address *</Label>
                  <Textarea
                    id="delivery_address"
                    value={formData.delivery_address}
                    onChange={(e) => setFormData({...formData, delivery_address: e.target.value})}
                    placeholder="Full delivery address with apartment/unit number"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer_name">Customer Name *</Label>
                    <Input
                      id="customer_name"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                      placeholder="Customer name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_phone">Customer Phone</Label>
                    <Input
                      id="customer_phone"
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                      placeholder="Customer phone"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="order_details">Order Details</Label>
                  <Textarea
                    id="order_details"
                    value={formData.order_details}
                    onChange={(e) => setFormData({...formData, order_details: e.target.value})}
                    placeholder="Items being delivered"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Timing & Cost */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Timing & Cost
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="delivery_fee">Delivery Fee</Label>
                    <Input
                      id="delivery_fee"
                      type="number"
                      step="0.01"
                      value={formData.delivery_fee}
                      onChange={(e) => setFormData({...formData, delivery_fee: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="estimated_time">Estimated Time (minutes)</Label>
                    <Input
                      id="estimated_time"
                      type="number"
                      value={formData.estimated_time}
                      onChange={(e) => setFormData({...formData, estimated_time: e.target.value})}
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <Label htmlFor="delivery_date">Delivery Date</Label>
                    <Input
                      id="delivery_date"
                      type="date"
                      value={formData.delivery_date}
                      onChange={(e) => setFormData({...formData, delivery_date: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="special_instructions">Special Instructions</Label>
                  <Textarea
                    id="special_instructions"
                    value={formData.special_instructions}
                    onChange={(e) => setFormData({...formData, special_instructions: e.target.value})}
                    placeholder="Special delivery instructions"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Button
                    onClick={createDelivery}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-500 to-cyan-600"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                        Creating Delivery...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Create Delivery
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => router.push('/restaurant/delivery/dashboard')}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Why This Helps */}
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <Truck className="w-5 h-5" />
                  Why This Matters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded border text-sm">
                    <strong className="text-green-600">Fast Delivery:</strong> Track drivers and routes to ensure food arrives hot and on time.
                  </div>
                  <div className="bg-white p-3 rounded border text-sm">
                    <strong className="text-blue-600">Happy Customers:</strong> Real-time tracking and communication improve customer satisfaction.
                  </div>
                  <div className="bg-white p-3 rounded border text-sm">
                    <strong className="text-purple-600">Increased Revenue:</strong> Efficient delivery means more orders and repeat customers.
                  </div>
                  <p className="text-xs text-green-600 mt-3">
                    Great delivery service drives customer loyalty and business growth.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Notification */}
        {showNotification && (
          <div className="fixed bottom-4 right-4 z-50 max-w-sm">
            <div className={\`p-4 rounded-lg shadow-lg \${
              notificationType === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white\`}>
              <div className="flex items-center">
                {notificationType === 'success' ? (
                  <Save className="w-5 h-5 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 mr-2" />
                )}
                {notificationMessage}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}`
}

// Generate order-specific form page
function createOrderFormPage() {
  return `'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import '../../../app/globals.css' // HERA DNA: Universal dropdown visibility fix
import { 
  ShoppingCart, ArrowLeft, Save, AlertCircle, User, Phone, Mail, Calendar, DollarSign, CreditCard, Truck
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function OrderFormPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationType, setNotificationType] = useState('success')

  // Demo organization ID (Mario's Restaurant)
  const organizationId = '550e8400-e29b-41d4-a716-446655440000'

  // Form state - Order-specific fields
  const [formData, setFormData] = useState({
    entity_name: '',
    entity_code: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    order_type: '',
    items: '',
    special_instructions: '',
    total_amount: '',
    payment_method: '',
    delivery_address: '',
    order_date: new Date().toISOString().split('T')[0]
  })

  // Order type options
  const orderTypes = [
    { value: 'dine_in', label: 'Dine In' },
    { value: 'takeout', label: 'Takeout' },
    { value: 'delivery', label: 'Delivery' },
    { value: 'catering', label: 'Catering' }
  ]

  // Payment method options
  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Credit/Debit Card' },
    { value: 'mobile', label: 'Mobile Payment' },
    { value: 'pending', label: 'Payment Pending' }
  ]

  // Create order
  const createOrder = async () => {
    if (!formData.customer_name || !formData.order_type || !formData.items) {
      setNotificationMessage('Please fill in customer name, order type, and items')
      setNotificationType('error')
      setShowNotification(true)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/v1/orders/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          entity_type: 'order',
          entity_name: formData.entity_name || \`Order from \${formData.customer_name}\`,
          entity_code: formData.entity_code || \`ORD-\${Date.now().toString().slice(-6)}\`,
          dynamic_fields: {
            customer_name: formData.customer_name,
            customer_phone: formData.customer_phone,
            customer_email: formData.customer_email,
            order_type: formData.order_type,
            items: formData.items,
            special_instructions: formData.special_instructions,
            total_amount: formData.total_amount,
            payment_method: formData.payment_method,
            delivery_address: formData.delivery_address,
            order_date: formData.order_date
          }
        })
      })

      const result = await response.json()
      if (result.success) {
        setNotificationMessage('Order created successfully!')
        setNotificationType('success')
        setShowNotification(true)
        
        setTimeout(() => {
          router.push('/restaurant/orders/dashboard')
        }, 2000)
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('Error creating order:', error)
      setNotificationMessage('Failed to create order. Please try again.')
      setNotificationType('error')
      setShowNotification(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
              Mario's Restaurant
            </Badge>
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-emerald-600 bg-clip-text text-transparent">
            📝 New Order
          </h1>
          <p className="text-gray-600 mt-2">
            Take orders fast, deliver on time, get paid quickly
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer_name">Customer Name *</Label>
                    <Input
                      id="customer_name"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_phone">Phone Number</Label>
                    <Input
                      id="customer_phone"
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="customer_email">Email</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                    placeholder="customer@email.com"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Order Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="order_type">Order Type *</Label>
                    <Select value={formData.order_type} onValueChange={(value) => setFormData({...formData, order_type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select order type" />
                      </SelectTrigger>
                      <SelectContent className="hera-select-content">
                        {orderTypes.map(type => (
                          <SelectItem key={type.value} value={type.value} className="hera-select-item">
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="order_date">Order Date</Label>
                    <Input
                      id="order_date"
                      type="date"
                      value={formData.order_date}
                      onChange={(e) => setFormData({...formData, order_date: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="items">Items Ordered *</Label>
                  <Textarea
                    id="items"
                    value={formData.items}
                    onChange={(e) => setFormData({...formData, items: e.target.value})}
                    placeholder="List items ordered (e.g., 2x Margherita Pizza, 1x Caesar Salad, 3x Coke)"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="special_instructions">Special Instructions</Label>
                  <Textarea
                    id="special_instructions"
                    value={formData.special_instructions}
                    onChange={(e) => setFormData({...formData, special_instructions: e.target.value})}
                    placeholder="Any special requests or notes"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment & Delivery */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment & Delivery
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="total_amount">Total Amount</Label>
                    <Input
                      id="total_amount"
                      type="number"
                      step="0.01"
                      value={formData.total_amount}
                      onChange={(e) => setFormData({...formData, total_amount: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment_method">Payment Method</Label>
                    <Select value={formData.payment_method} onValueChange={(value) => setFormData({...formData, payment_method: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent className="hera-select-content">
                        {paymentMethods.map(method => (
                          <SelectItem key={method.value} value={method.value} className="hera-select-item">
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {formData.order_type === 'delivery' && (
                  <div>
                    <Label htmlFor="delivery_address">Delivery Address</Label>
                    <Textarea
                      id="delivery_address"
                      value={formData.delivery_address}
                      onChange={(e) => setFormData({...formData, delivery_address: e.target.value})}
                      placeholder="Full delivery address with apartment/unit number"
                      rows={2}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Button
                    onClick={createOrder}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-orange-500 to-emerald-600"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                        Creating Order...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Create Order
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => router.push('/restaurant/orders/dashboard')}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Why This Helps */}
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <ShoppingCart className="w-5 h-5" />
                  Why This Matters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded border text-sm">
                    <strong className="text-green-600">Fast Order Processing:</strong> Take orders quickly and accurately, reducing wait times and improving customer satisfaction.
                  </div>
                  <div className="bg-white p-3 rounded border text-sm">
                    <strong className="text-blue-600">Better Customer Service:</strong> Keep customer information organized for personalized service and easy reorders.
                  </div>
                  <div className="bg-white p-3 rounded border text-sm">
                    <strong className="text-purple-600">Increased Revenue:</strong> Streamlined ordering process leads to more orders and higher customer retention.
                  </div>
                  <p className="text-xs text-green-600 mt-3">
                    Organized orders mean happy customers, repeat business, and steady profits.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Notification */}
        {showNotification && (
          <div className="fixed bottom-4 right-4 z-50 max-w-sm">
            <div className={\`p-4 rounded-lg shadow-lg \${
              notificationType === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white\`}>
              <div className="flex items-center">
                {notificationType === 'success' ? (
                  <Save className="w-5 h-5 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 mr-2" />
                )}
                {notificationMessage}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}`
}

// API Route Template - Direct Supabase pattern
function createApiRoute(endpoint) {
  return `import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// GET /${moduleName}/${endpoint} - Fetch all ${moduleName} items
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const entityType = searchParams.get('entity_type') || '${moduleName}_item'
    const includeDynamicData = searchParams.get('include_dynamic_data') === 'true'

    if (!organizationId) {
      return NextResponse.json(
        { success: false, message: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Fetch entities
    let query = supabaseAdmin
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('entity_name')

    if (entityType !== 'all') {
      query = query.eq('entity_type', entityType)
    }

    const { data: entities, error: entitiesError } = await query

    if (entitiesError) {
      console.error('Error fetching ${moduleName} entities:', entitiesError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch ${moduleName} entities' },
        { status: 500 }
      )
    }

    // Get dynamic data if requested
    let enhancedEntities = entities
    if (includeDynamicData && entities.length > 0) {
      const entityIds = entities.map(e => e.id)
      const { data: dynamicData } = await supabaseAdmin
        .from('core_dynamic_data')
        .select('*')
        .in('entity_id', entityIds)

      // Merge dynamic data with entities
      enhancedEntities = entities.map(entity => {
        const entityDynamicData = dynamicData?.filter(d => d.entity_id === entity.id) || []
        const dynamicFields = {}
        
        entityDynamicData.forEach(field => {
          let value = field.field_value_text
          if (field.field_type === 'number') value = field.field_value_number
          if (field.field_type === 'json') value = field.field_value_json
          
          dynamicFields[field.field_name] = {
            value,
            ai_enhanced: field.ai_enhanced_value,
            type: field.field_type
          }
        })
        
        return {
          ...entity,
          dynamic_fields: dynamicFields
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: enhancedEntities,
      count: enhancedEntities.length
    })

  } catch (error) {
    console.error('${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /${moduleName}/${endpoint} - Create ${moduleName} item
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    const { organization_id, entity_type, entity_name, entity_code, dynamic_fields } = body

    if (!organization_id || !entity_type || !entity_name) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create entity
    const { data: entity, error: entityError } = await supabaseAdmin
      .from('core_entities')
      .insert({
        organization_id,
        entity_type,
        entity_name,
        entity_code: entity_code || \`${config.prefix}-\${Date.now().toString().slice(-6)}\`,
        status: 'active',
        created_at: new Date().toISOString(),
        created_by: 'system'
      })
      .select()
      .single()

    if (entityError) {
      console.error('Error creating ${moduleName} entity:', entityError)
      return NextResponse.json(
        { success: false, message: 'Failed to create ${moduleName} entity', error: entityError },
        { status: 500 }
      )
    }

    // Create dynamic fields
    if (dynamic_fields && Object.keys(dynamic_fields).length > 0) {
      const dynamicFieldsData = []
      Object.entries(dynamic_fields).forEach(([fieldName, fieldValue]) => {
        if (fieldValue === null || fieldValue === undefined || fieldValue === '') return

        let fieldType = 'text'
        let textValue = null
        let numberValue = null
        let jsonValue = null

        if (typeof fieldValue === 'number') {
          fieldType = 'number'
          numberValue = fieldValue
        } else if (typeof fieldValue === 'object') {
          fieldType = 'json'
          jsonValue = fieldValue
        } else {
          fieldType = 'text'
          textValue = String(fieldValue)
        }

        dynamicFieldsData.push({
          organization_id,
          entity_id: entity.id,
          field_name: fieldName,
          field_type: fieldType,
          field_value_text: textValue,
          field_value_number: numberValue,
          field_value_json: jsonValue,
          created_at: new Date().toISOString()
        })
      })

      if (dynamicFieldsData.length > 0) {
        const { error: dynamicError } = await supabaseAdmin
          .from('core_dynamic_data')
          .insert(dynamicFieldsData)

        if (dynamicError) {
          console.error('Error creating dynamic fields:', dynamicError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...entity,
        message: '${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} created successfully'
      }
    })

  } catch (error) {
    console.error('${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} creation error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
`
}

console.log('Generating APIs...')
config.apis.forEach(endpoint => {
  const apiDir = path.join(apiPath, endpoint)
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true })
  }
  
  const routeFile = path.join(apiDir, 'route.ts')
  fs.writeFileSync(routeFile, createApiRoute(endpoint))
  console.log(`Generated API: /api/v1/${moduleName}/${endpoint}`)
})

console.log('Generating UI Pages...')
config.ui.forEach(pageName => {
  const pageDir = path.join(modulePath, pageName)
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true })
  }
  
  // Generate page component - create module-specific forms
  const pageFile = path.join(pageDir, 'page.tsx')
  let pageContent
  
  if (pageName === 'form' && moduleName === 'orders') {
    pageContent = createOrderFormPage()
  } else if (pageName === 'form' && moduleName === 'delivery') {
    pageContent = createDeliveryFormPage()
  } else {
    // Generic placeholder for other pages
    pageContent = `'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}${pageName.charAt(0).toUpperCase() + pageName.slice(1)}Page() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
          ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} ${pageName.charAt(0).toUpperCase() + pageName.slice(1)}
        </h1>
        <p className="text-muted-foreground mt-2">
          ${getCustomerDescription(moduleName)}
        </p>
        
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} ${pageName.charAt(0).toUpperCase() + pageName.slice(1)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Your ${moduleName} ${pageName} page is ready to be customized.</p>
            <Button className="mt-4 bg-orange-500 hover:bg-orange-600">
              Get Started
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}`
  }
  
  fs.writeFileSync(pageFile, pageContent)
  console.log(`Generated UI: /restaurant/${moduleName}/${pageName}`)
})

// Generate README
const readmeContent = `# Your ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}

${getCustomerDescription(moduleName)}

## What You Get

**Everything you need to ${getCustomerDescription(moduleName).toLowerCase()}:**

1. Dashboard - See everything at a glance
2. Add Items - Quick and easy item creation
3. View All - Complete list with search and filters
4. Reports - Track performance and make decisions
5. Live Updates - Real-time data that stays current
6. Smart Suggestions - Get recommendations that help

## Get Started

\`\`\`bash
# See your ${moduleName} dashboard
http://localhost:3000/restaurant/${moduleName}/dashboard

# Add your first item
http://localhost:3000/restaurant/${moduleName}/form
\`\`\`

## Why This Matters

- **Start Making Money Today**: Set up in minutes, not months
- **Everything Connected**: Works with your other restaurant systems
- **Smart Suggestions**: Get recommendations that increase profit
- **No Learning Curve**: Simple interface anyone can use

## Built for Restaurant Success

**${getCustomerDescription(moduleName)}**

- **Simple**: No complicated setup or training needed
- **Fast**: See results immediately, not weeks later  
- **Profitable**: Every feature helps you make more money
- **Reliable**: Built to work when you need it most

---

*"Simplicity is the ultimate sophistication" - Steve Jobs*`

fs.writeFileSync(path.join(modulePath, 'README.md'), readmeContent)

// Generate module config
fs.writeFileSync(path.join(modulePath, 'module.config.json'), JSON.stringify(config, null, 2))

console.log('Module generation completed successfully!')
console.log(`
Generated files:
- ${modulePath}/dashboard/page.tsx
- ${modulePath}/list/page.tsx  
- ${modulePath}/form/page.tsx
- ${modulePath}/reports/page.tsx
- ${modulePath}/README.md
- ${modulePath}/module.config.json
- ${apiPath}/entities/route.ts
- ${apiPath}/transactions/route.ts
- ${apiPath}/reports/route.ts
- ${apiPath}/validations/route.ts

Next steps:
1. Visit http://localhost:3000/restaurant/${moduleName}/dashboard
2. Test the form at http://localhost:3000/restaurant/${moduleName}/form
3. Customize the generated components as needed

"Simplicity is the ultimate sophistication" - Steve Jobs
`)