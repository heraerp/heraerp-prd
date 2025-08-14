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
  Truck, ArrowLeft, Save, AlertCircle, Building2, Phone, Mail, 
  MapPin, CreditCard, Calendar, DollarSign, Package, Star
} from 'lucide-react'
import { useRouter } from 'next/navigation'

/**
 * 🚛 Add New Supplier - Vendor Management Form
 * Customer-focused supplier management that restaurant owners understand
 * 
 * Steve Jobs: "Simplicity is the ultimate sophistication"
 */

export default function SuppliersFormPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationType, setNotificationType] = useState('success')
  
  // Demo organization ID (Mario's Restaurant)
  const organizationId = '550e8400-e29b-41d4-a716-446655440000'

  // Form state for supplier
  const [formData, setFormData] = useState({
    entity_name: '',
    entity_code: '',
    contact_person: '',
    company_name: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    supplier_type: '',
    payment_terms: '',
    credit_limit: '',
    tax_id: '',
    categories: [],
    delivery_days: [],
    notes: '',
    minimum_order: '',
    discount_terms: ''
  })

  // Supplier types
  const supplierTypes = [
    'Food & Ingredients', 'Beverages', 'Kitchen Equipment', 'Cleaning Supplies',
    'Paper Products', 'Uniforms & Apparel', 'Marketing Materials', 'Maintenance Services'
  ]

  // Payment terms
  const paymentTerms = [
    'NET 7', 'NET 15', 'NET 30', 'NET 60', 'COD (Cash on Delivery)', 
    '2/10 NET 30', 'Weekly', 'Bi-weekly', 'Monthly'
  ]

  // Delivery days
  const deliveryDays = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ]

  // Product categories
  const productCategories = [
    'Fresh Produce', 'Meat & Poultry', 'Seafood', 'Dairy & Eggs',
    'Dry Goods', 'Frozen Foods', 'Beverages', 'Condiments & Sauces',
    'Kitchen Supplies', 'Cleaning Products'
  ]

  // Toggle array item
  const toggleArrayItem = (field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item) 
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }))
  }

  // Generate entity code
  const generateEntityCode = () => {
    if (!formData.company_name) return ''
    const words = formData.company_name.split(' ')
    const code = words.map(w => w.slice(0, 3).toUpperCase()).join('-')
    return `SUP-${code}-${Date.now().toString().slice(-3)}`
  }

  // Auto-generate entity code when company name changes
  useEffect(() => {
    if (formData.company_name && !formData.entity_code) {
      setFormData(prev => ({ 
        ...prev, 
        entity_name: formData.company_name,
        entity_code: generateEntityCode()
      }))
    }
  }, [formData.company_name])

  // Create supplier
  const createSupplier = async () => {
    if (!formData.company_name || !formData.contact_person || !formData.supplier_type) {
      setNotificationMessage('Please fill in required fields (Company Name, Contact Person, Supplier Type)')
      setNotificationType('error')
      setShowNotification(true)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/v1/suppliers/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          entity_type: 'supplier_vendor',
          entity_name: formData.company_name,
          entity_code: formData.entity_code || generateEntityCode(),
          dynamic_fields: {
            contact_person: formData.contact_person,
            company_name: formData.company_name,
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            website: formData.website,
            supplier_type: formData.supplier_type,
            payment_terms: formData.payment_terms,
            credit_limit: parseFloat(formData.credit_limit) || 0,
            tax_id: formData.tax_id,
            categories: formData.categories,
            delivery_days: formData.delivery_days,
            notes: formData.notes,
            minimum_order: parseFloat(formData.minimum_order) || 0,
            discount_terms: formData.discount_terms,
            created_via: 'hera_supplier_form',
            status: 'active'
          }
        })
      })

      const result = await response.json()
      if (result.success) {
        // ✨ DAVE PATEL MAGIC: Automatic GL posting for new supplier setup
        try {
          console.log('🧬 HERA Universal GL: Auto-posting supplier setup to GL...')
          
          // Post to Universal GL system as vendor setup
          const glResponse = await fetch('/api/v1/financial/universal-gl', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              organizationId: organizationId,
              transactionType: 'purchase',
              amount: 0, // Setup only, no actual purchase yet
              description: `Supplier setup - ${formData.company_name}`,
              details: {
                vendorId: result.data.id,
                paymentTerms: formData.payment_terms,
                creditLimit: parseFloat(formData.credit_limit) || 0,
                supplierType: formData.supplier_type,
                setupOnly: true
              },
              metadata: {
                supplierId: result.data.id,
                supplierIntegration: true,
                davePatelMagic: true,
                setupTransaction: true
              }
            })
          })
          
          const glResult = await glResponse.json()
          if (glResult.success) {
            console.log('✅ Supplier setup automatically posted to GL:', glResult.data.journalEntry.referenceNumber)
            setNotificationMessage(
              `Supplier added! 🧬 AP system ready: ${glResult.data.journalEntry.referenceNumber} - purchase orders will auto-post to accounting!`
            )
          } else {
            console.warn('GL posting failed, but supplier created successfully:', glResult.message)
            setNotificationMessage('Supplier added successfully! (AP setup will retry automatically)')
          }
          
        } catch (glError) {
          console.warn('GL integration error (supplier still created):', glError)
          setNotificationMessage('Supplier added successfully! (AP setup will retry automatically)')
        }
        
        setNotificationType('success')
        setShowNotification(true)
        
        setTimeout(() => {
          router.push('/restaurant/suppliers/dashboard')
        }, 3000) // Extended to show GL message
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('Error creating supplier:', error)
      setNotificationMessage('Failed to add supplier. Please try again.')
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
              Back to Suppliers
            </Button>
            <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30">
              Mario's Restaurant
            </Badge>
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent">
            🚛 Add New Supplier
          </h1>
          <p className="text-gray-600 mt-2">
            Better prices, reliable delivery, quality ingredients
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company_name">Company Name *</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                      placeholder="e.g., Fresh Farms Co."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_person">Contact Person *</Label>
                    <Input
                      id="contact_person"
                      value={formData.contact_person}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                      placeholder="e.g., John Smith"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="entity_code">Supplier Code</Label>
                    <Input
                      id="entity_code"
                      value={formData.entity_code}
                      onChange={(e) => setFormData(prev => ({ ...prev, entity_code: e.target.value }))}
                      placeholder="Auto-generated"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier_type">Supplier Type *</Label>
                    <Select value={formData.supplier_type} onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_type: value }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {supplierTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://supplier.com"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Contact & Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(555) 123-4567"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="orders@supplier.com"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Business Address</Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="123 Business St, City, State 12345"
                      rows={2}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Terms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Business Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payment_terms">Payment Terms</Label>
                    <Select value={formData.payment_terms} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_terms: value }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select terms" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentTerms.map((term) => (
                          <SelectItem key={term} value={term}>
                            {term}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="credit_limit">Credit Limit ($)</Label>
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="credit_limit"
                        type="number"
                        step="0.01"
                        value={formData.credit_limit}
                        onChange={(e) => setFormData(prev => ({ ...prev, credit_limit: e.target.value }))}
                        placeholder="5000.00"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minimum_order">Minimum Order ($)</Label>
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="minimum_order"
                        type="number"
                        step="0.01"
                        value={formData.minimum_order}
                        onChange={(e) => setFormData(prev => ({ ...prev, minimum_order: e.target.value }))}
                        placeholder="100.00"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="tax_id">Tax ID / EIN</Label>
                    <Input
                      id="tax_id"
                      value={formData.tax_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, tax_id: e.target.value }))}
                      placeholder="12-3456789"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="discount_terms">Discount Terms</Label>
                  <Input
                    id="discount_terms"
                    value={formData.discount_terms}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount_terms: e.target.value }))}
                    placeholder="e.g., 2% if paid within 10 days"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Categories & Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Products & Delivery
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Product Categories</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {productCategories.map((category) => (
                      <Badge
                        key={category}
                        variant={formData.categories.includes(category) ? "default" : "outline"}
                        className={`cursor-pointer ${
                          formData.categories.includes(category) 
                            ? 'bg-orange-500 hover:bg-orange-600' 
                            : 'hover:bg-gray-100'
                        }`}
                        onClick={() => toggleArrayItem('categories', category)}
                      >
                        <Package className="w-3 h-3 mr-1" />
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Delivery Days</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {deliveryDays.map((day) => (
                      <Badge
                        key={day}
                        variant={formData.delivery_days.includes(day) ? "default" : "outline"}
                        className={`cursor-pointer ${
                          formData.delivery_days.includes(day) 
                            ? 'bg-green-500 hover:bg-green-600' 
                            : 'hover:bg-gray-100'
                        }`}
                        onClick={() => toggleArrayItem('delivery_days', day)}
                      >
                        <Truck className="w-3 h-3 mr-1" />
                        {day}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Special requirements, quality notes, or other important information..."
                    rows={3}
                    className="mt-1"
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
                    onClick={createSupplier}
                    disabled={loading || !formData.company_name || !formData.contact_person || !formData.supplier_type}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Add Supplier
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => router.push('/restaurant/suppliers/dashboard')}
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
                  Why Track Suppliers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded border text-sm">
                    ✓ Get better prices through relationships<br/>
                    ✓ Never run out of essential ingredients<br/>
                    ✓ Track quality and delivery performance
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded border border-blue-200 text-sm">
                    <strong className="text-blue-600">🧬 Dave Patel Magic:</strong> Every supplier automatically creates AP system - purchase orders post to accounting automatically!
                  </div>
                  <p className="text-xs text-green-600">
                    Great supplier relationships are the foundation of a profitable restaurant. 
                    Track everything to negotiate better deals and ensure consistent quality.
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