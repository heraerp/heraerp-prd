'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
          entity_name: formData.entity_name || `Delivery to ${formData.customer_name}`,
          entity_code: formData.entity_code || `DEL-${Date.now().toString().slice(-6)}`,
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
            <div className={`p-4 rounded-lg shadow-lg ${
              notificationType === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white`}>
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
}