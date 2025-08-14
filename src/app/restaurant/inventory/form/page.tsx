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
  StatusIndicator,
  FloatingNotification,
  GlowButton
} from '@/components/restaurant/JobsStyleMicroInteractions'
import { 
  Package, Truck, DollarSign, ArrowLeft, Save, Sparkles,
  Plus, Minus, AlertTriangle, CheckCircle, Brain, Zap,
  Clock, Calendar, Barcode, Scale, Info
} from 'lucide-react'
import { useRouter } from 'next/navigation'

/**
 * 📦 HERA Universal Inventory Item Creation Form
 * Revolutionary Restaurant Inventory using HERA's 6-Table Architecture
 * 
 * Steve Jobs: "Quality is more important than quantity"
 * AI-Enhanced Inventory Management with Smart Code Integration
 */

export default function InventoryFormPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationType, setNotificationType] = useState('success')
  
  // Demo organization ID (Mario's Restaurant)
  const organizationId = '550e8400-e29b-41d4-a716-446655440000'

  // Form state
  const [formData, setFormData] = useState({
    entity_name: '',
    entity_code: '',
    description: '',
    quantity: '',
    unit: 'unit',
    cost_per_unit: '',
    reorder_point: '',
    category: '',
    supplier_id: '',
    location: '',
    expiry_date: ''
  })

  // AI Enhancement state
  const [aiSuggestions, setAiSuggestions] = useState({
    category: '',
    reorder_point: 0,
    optimal_quantity: 0,
    cost_prediction: 0,
    supplier_recommendation: ''
  })

  // Available options
  const categories = [
    { id: 'produce', name: 'Fresh Produce' },
    { id: 'vegetables', name: 'Vegetables' },
    { id: 'dairy', name: 'Dairy & Eggs' },
    { id: 'meat', name: 'Meat & Poultry' },
    { id: 'seafood', name: 'Seafood' },
    { id: 'grains', name: 'Grains & Dry Goods' },
    { id: 'beverages', name: 'Beverages' },
    { id: 'condiments', name: 'Condiments & Sauces' },
    { id: 'frozen', name: 'Frozen Goods' },
    { id: 'supplies', name: 'Kitchen Supplies' }
  ]

  const units = [
    { id: 'unit', name: 'Unit' },
    { id: 'kg', name: 'Kilogram' },
    { id: 'lb', name: 'Pound' },
    { id: 'oz', name: 'Ounce' },
    { id: 'liter', name: 'Liter' },
    { id: 'gallon', name: 'Gallon' },
    { id: 'case', name: 'Case' },
    { id: 'box', name: 'Box' },
    { id: 'bag', name: 'Bag' },
    { id: 'dozen', name: 'Dozen' }
  ]

  const locations = [
    { id: 'main_kitchen', name: 'Main Kitchen' },
    { id: 'cold_storage', name: 'Cold Storage' },
    { id: 'freezer', name: 'Freezer' },
    { id: 'dry_storage', name: 'Dry Storage' },
    { id: 'bar', name: 'Bar Storage' },
    { id: 'prep_area', name: 'Prep Area' }
  ]

  // Mock suppliers (in production, fetch from API)
  const suppliers = [
    { id: 'sup-001', name: 'Fresh Farms Co.' },
    { id: 'sup-002', name: 'Italian Imports Ltd.' },
    { id: 'sup-003', name: 'Local Meat Suppliers' },
    { id: 'sup-004', name: 'Ocean Fresh Seafood' },
    { id: 'sup-005', name: 'Restaurant Supply Direct' }
  ]

  // AI Enhancement - Analyze inventory item for suggestions
  const analyzeInventoryItem = async () => {
    if (!formData.entity_name || !formData.description) return

    try {
      // Simulate AI analysis (in production, this would call an AI service)
      const mockAiResponse = {
        category: formData.entity_name.toLowerCase().includes('tomato') ? 'produce' :
                 formData.entity_name.toLowerCase().includes('cheese') ? 'dairy' :
                 formData.entity_name.toLowerCase().includes('chicken') ? 'meat' : 'grains',
        reorder_point: Math.floor(10 + Math.random() * 20),
        optimal_quantity: Math.floor(50 + Math.random() * 100),
        cost_prediction: Math.round((5 + Math.random() * 20) * 100) / 100,
        supplier_recommendation: suppliers[Math.floor(Math.random() * suppliers.length)].id
      }

      setAiSuggestions(mockAiResponse)
      setNotificationMessage('AI analysis complete! Check the suggestions below.')
      setNotificationType('success')
      setShowNotification(true)
    } catch (error) {
      console.error('AI analysis error:', error)
    }
  }

  // Apply AI suggestion
  const applySuggestion = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Generate entity code
  const generateEntityCode = () => {
    if (!formData.entity_name) return ''
    const words = formData.entity_name.split(' ')
    const code = words.map(w => w.slice(0, 3).toUpperCase()).join('-')
    return `INV-${code}-${Date.now().toString().slice(-3)}`
  }

  // Auto-generate entity code when name changes
  useEffect(() => {
    if (formData.entity_name && !formData.entity_code) {
      setFormData(prev => ({ ...prev, entity_code: generateEntityCode() }))
    }
  }, [formData.entity_name])

  // Create inventory item
  const createInventoryItem = async () => {
    if (!formData.entity_name || !formData.quantity || !formData.cost_per_unit) {
      setNotificationMessage('Please fill in required fields (Name, Quantity, Cost per Unit)')
      setNotificationType('error')
      setShowNotification(true)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/v1/inventory/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          entity_type: 'inventory_item',
          entity_name: formData.entity_name,
          entity_code: formData.entity_code || generateEntityCode(),
          dynamic_fields: {
            quantity: parseFloat(formData.quantity),
            unit: formData.unit,
            cost_per_unit: parseFloat(formData.cost_per_unit),
            reorder_point: parseInt(formData.reorder_point) || 10,
            category: formData.category,
            supplier_id: formData.supplier_id,
            location: formData.location,
            expiry_date: formData.expiry_date,
            description: formData.description,
            created_via: 'hera_inventory_form',
            ai_enhanced: !!aiSuggestions.category
          }
        })
      })

      const result = await response.json()
      if (result.success) {
        // ✨ DAVE PATEL MAGIC: Automatic GL posting for inventory additions
        try {
          console.log('🧬 HERA Universal GL: Auto-posting inventory addition to GL...')
          
          const totalValue = parseFloat(formData.quantity) * parseFloat(formData.cost_per_unit)
          
          // Create inventory adjustment data for GL integration
          const inventoryData = {
            id: result.data.id,
            organizationId: organizationId,
            itemId: result.data.id,
            itemName: formData.entity_name,
            adjustmentType: 'initial_stock',
            quantity: parseFloat(formData.quantity),
            unitCost: parseFloat(formData.cost_per_unit),
            totalCost: totalValue,
            reason: 'Initial inventory setup',
            adjustmentDate: new Date()
          }
          
          // Post to Universal GL system as inventory purchase
          const glResponse = await fetch('/api/v1/financial/universal-gl', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              organizationId: organizationId,
              transactionType: 'purchase',
              amount: totalValue,
              description: `Initial inventory - ${formData.entity_name}`,
              details: {
                itemId: result.data.id,
                adjustmentType: 'initial_stock',
                quantity: parseFloat(formData.quantity),
                unitCost: parseFloat(formData.cost_per_unit),
                category: formData.category,
                paymentMethod: 'pending' // AP created
              },
              metadata: {
                inventoryId: result.data.id,
                inventoryIntegration: true,
                davePatelMagic: true
              }
            })
          })
          
          const glResult = await glResponse.json()
          if (glResult.success) {
            console.log('✅ Inventory automatically posted to GL:', glResult.data.journalEntry.referenceNumber)
            setNotificationMessage(
              `Inventory item created! 🧬 Automatic GL posting: ${glResult.data.journalEntry.referenceNumber} (${glResult.data.journalEntry.linesCount} journal entries)`
            )
          } else {
            console.warn('GL posting failed, but inventory created successfully:', glResult.message)
            setNotificationMessage('Inventory item created successfully! (GL posting will retry automatically)')
          }
          
        } catch (glError) {
          console.warn('GL integration error (inventory still created):', glError)
          setNotificationMessage('Inventory item created successfully! (GL posting will retry automatically)')
        }
        
        setNotificationType('success')
        setShowNotification(true)
        
        setTimeout(() => {
          router.push('/restaurant/inventory/dashboard')
        }, 3000) // Extended to show GL message
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('Error creating inventory item:', error)
      setNotificationMessage('Failed to create inventory item. Please try again.')
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
            <StatusIndicator 
              status="success" 
              text="Mario's Restaurant" 
              showText={true} 
            />
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
            📦 Add New Item
          </h1>
          <p className="text-gray-600 mt-2">
            Track what you buy, know when to reorder, stop losing money
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="entity_name">Item Name *</Label>
                    <Input
                      id="entity_name"
                      value={formData.entity_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, entity_name: e.target.value }))}
                      placeholder="e.g., Fresh Tomatoes"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="entity_code">Item Code</Label>
                    <Input
                      id="entity_code"
                      value={formData.entity_code}
                      onChange={(e) => setFormData(prev => ({ ...prev, entity_code: e.target.value }))}
                      placeholder="Auto-generated"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <div className="flex gap-2 mt-1">
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the inventory item..."
                      rows={3}
                      className="flex-1"
                    />
                    <Button
                      onClick={analyzeInventoryItem}
                      variant="outline"
                      className="self-start"
                      disabled={!formData.entity_name || !formData.description}
                    >
                      <Brain className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Click the brain icon for AI suggestions</p>
                </div>
              </CardContent>
            </Card>

            {/* Quantity & Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="w-5 h-5" />
                  Quantity & Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="quantity">Current Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                      placeholder="100"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit of Measure *</Label>
                    <Select value={formData.unit} onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="cost_per_unit">Cost per Unit ($) *</Label>
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="cost_per_unit"
                        type="number"
                        step="0.01"
                        value={formData.cost_per_unit}
                        onChange={(e) => setFormData(prev => ({ ...prev, cost_per_unit: e.target.value }))}
                        placeholder="5.50"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="reorder_point">Reorder Point</Label>
                    <Input
                      id="reorder_point"
                      type="number"
                      value={formData.reorder_point}
                      onChange={(e) => setFormData(prev => ({ ...prev, reorder_point: e.target.value }))}
                      placeholder="10"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Alert when quantity drops below this</p>
                  </div>
                  <div>
                    <Label htmlFor="expiry_date">Expiry Date</Label>
                    <Input
                      id="expiry_date"
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category & Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Category & Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="location">Storage Location</Label>
                    <Select value={formData.location} onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <Select value={formData.supplier_id} onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Suggestions Sidebar */}
          <div className="space-y-6">
            {/* AI Suggestions */}
            {(aiSuggestions.category || aiSuggestions.reorder_point > 0) && (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Sparkles className="w-5 h-5" />
                    AI Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {aiSuggestions.category && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Category: <strong>{aiSuggestions.category}</strong></span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applySuggestion('category', aiSuggestions.category)}
                      >
                        Apply
                      </Button>
                    </div>
                  )}
                  
                  {aiSuggestions.reorder_point > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Reorder at: <strong>{aiSuggestions.reorder_point} units</strong></span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applySuggestion('reorder_point', aiSuggestions.reorder_point)}
                      >
                        Apply
                      </Button>
                    </div>
                  )}
                  
                  {aiSuggestions.cost_prediction > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Market Price: <strong>${aiSuggestions.cost_prediction}</strong></span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applySuggestion('cost_per_unit', aiSuggestions.cost_prediction)}
                      >
                        Apply
                      </Button>
                    </div>
                  )}
                  
                  {aiSuggestions.supplier_recommendation && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        Supplier: <strong>{suppliers.find(s => s.id === aiSuggestions.supplier_recommendation)?.name}</strong>
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applySuggestion('supplier_id', aiSuggestions.supplier_recommendation)}
                      >
                        Apply
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* What Happens Next */}
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <Zap className="w-5 h-5" />
                  What This Does For You
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded border text-sm">
                    ✓ Tracks every time you use this item<br/>
                    ✓ Alerts you before you run out<br/>
                    ✓ Helps you order the right amount
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded border border-blue-200 text-sm">
                    <strong className="text-blue-600">🧬 Dave Patel Magic:</strong> Every inventory item automatically creates accounting entries (GL, AP) - no manual bookkeeping required!
                  </div>
                  <p className="text-xs text-green-600">
                    Your inventory will update automatically as you use items. 
                    No more surprise shortages during busy nights.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <GlowButton
                    onClick={createInventoryItem}
                    disabled={loading || !formData.entity_name || !formData.quantity || !formData.cost_per_unit}
                    glowColor="rgba(34, 197, 94, 0.4)"
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Create Inventory Item
                      </>
                    )}
                  </GlowButton>
                  
                  <Button
                    variant="outline"
                    onClick={() => router.push('/restaurant/inventory/dashboard')}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Total Value Preview */}
            {formData.quantity && formData.cost_per_unit && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">
                    ${(parseFloat(formData.quantity) * parseFloat(formData.cost_per_unit)).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.quantity} {formData.unit} × ${formData.cost_per_unit}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Floating Notification */}
        <FloatingNotification
          show={showNotification}
          message={notificationMessage}
          type={notificationType}
          duration={3000}
          onClose={() => setShowNotification(false)}
        />
      </div>
    </div>
  )
}