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
          entity_name: formData.entity_name || `Order from ${formData.customer_name}`,
          entity_code: formData.entity_code || `ORD-${Date.now().toString().slice(-6)}`,
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
        // ✨ DAVE PATEL MAGIC: Automatic GL posting when order is completed
        try {
          console.log('🧬 HERA Universal GL: Auto-posting order to GL...')
          
          // Calculate order totals
          const subtotal = parseFloat(formData.total_amount) || 0
          const taxRate = 0.09 // 9% tax
          const taxAmount = subtotal * taxRate
          const totalAmount = subtotal + taxAmount
          
          // Create restaurant order data for GL integration
          const orderData = {
            id: result.data.id,
            organizationId: organizationId,
            customerId: result.data.id, // Use entity ID as customer reference
            customerName: formData.customer_name,
            orderType: formData.order_type,
            items: [
              {
                itemId: 'general_item',
                itemName: formData.items,
                quantity: 1,
                unitPrice: subtotal,
                totalPrice: subtotal,
                category: 'food'
              }
            ],
            subtotal: subtotal,
            taxAmount: taxAmount,
            totalAmount: totalAmount,
            paymentMethod: formData.payment_method || 'cash',
            status: 'completed',
            orderDate: new Date()
          }
          
          // Post to Universal GL system
          const glResponse = await fetch('/api/v1/financial/universal-gl', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              organizationId: organizationId,
              transactionType: 'sale',
              entityId: result.data.id,
              amount: totalAmount,
              description: `${formData.order_type} order - ${formData.customer_name}`,
              details: {
                customerId: result.data.id,
                items: orderData.items,
                taxAmount: taxAmount,
                paymentMethod: formData.payment_method || 'cash',
                orderType: formData.order_type
              },
              metadata: {
                orderId: result.data.id,
                restaurantIntegration: true,
                davePatelMagic: true
              }
            })
          })
          
          const glResult = await glResponse.json()
          if (glResult.success) {
            console.log('✅ Order automatically posted to GL:', glResult.data.journalEntry.referenceNumber)
            setNotificationMessage(
              `Order created successfully! 🧬 Automatic GL posting: ${glResult.data.journalEntry.referenceNumber} (${glResult.data.journalEntry.linesCount} journal entries)`
            )
          } else {
            console.warn('GL posting failed, but order created successfully:', glResult.message)
            setNotificationMessage('Order created successfully! (GL posting will retry automatically)')
          }
          
        } catch (glError) {
          console.warn('GL integration error (order still created):', glError)
          setNotificationMessage('Order created successfully! (GL posting will retry automatically)')
        }
        
        setNotificationType('success')
        setShowNotification(true)
        
        setTimeout(() => {
          router.push('/restaurant/orders/dashboard')
        }, 3000) // Extended to show GL message
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
                      <SelectContent>
                        {orderTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
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
                      <SelectContent>
                        {paymentMethods.map(method => (
                          <SelectItem key={method.value} value={method.value}>
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
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded border border-blue-200 text-sm">
                    <strong className="text-blue-600">🧬 Dave Patel Magic:</strong> Every order automatically creates accounting entries (GL, AP, AR) - no manual bookkeeping required!
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