'use client'

/**
 * Purchase Order Transaction Page
 * Smart Code: HERA.PURCHASE.TXN.PO.MAIN.v1
 * Generated from: MatrixIT World Procurement System
 */

import React, { useState } from 'react'
import { EnterpriseCreatePage, CreatePageSection, AIInsight } from '@/components/enterprise/EnterpriseCreatePage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { 
  Calculator, 
  Receipt, 
  ShoppingCart, 
  Plus,
  Trash2,
  Building2
} from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { apiV2 } from '@/lib/client/fetchV2'

interface TransactionLine {
  line_number: number
  line_type: string
  description: string
  quantity: number
  unit_price: number
  line_amount: number
  product_code?: string
  vendor_id?: string
}

interface TransactionFormData {
  transaction_type: string
  po_number: string
  vendor_id: string
  description: string
  total_amount: number
  delivery_date: string
  lines: TransactionLine[]
}

export default function CreatePurchaseOrderPage() {
  const { organization, user } = useHERAAuth()
  const [currentSection, setCurrentSection] = useState('header')
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<TransactionFormData>({
    transaction_type: 'PURCHASE_ORDER',
    po_number: '',
    vendor_id: '',
    description: '',
    total_amount: 0,
    delivery_date: '',
    lines: [
      {
        line_number: 1,
        line_type: 'PRODUCT',
        description: '',
        quantity: 1,
        unit_price: 0,
        line_amount: 0,
        product_code: '',
        vendor_id: ''
      }
    ]
  })

  // Page sections for navigation
  const sections: CreatePageSection[] = [
    {
      id: 'header',
      title: 'Purchase Order Header',
      icon: Receipt,
      isRequired: true,
      isComplete: !!(formData.description && formData.vendor_id && formData.po_number)
    },
    {
      id: 'lines',
      title: 'Order Lines',
      icon: Calculator,
      isRequired: true,
      isComplete: formData.lines.every(line => line.line_amount > 0 && line.description)
    }
  ]

  // AI insights for transaction
  const aiInsights: AIInsight[] = [
    {
      id: 'vendor_integration',
      type: 'automation',
      title: 'Vendor Integration',
      content: 'HERA automatically links to vendor master data and rebate agreements for pricing validation.'
    },
    {
      id: 'inventory_sync',
      type: 'suggestion',
      title: 'Inventory Sync',
      content: 'Purchase orders automatically update ATP (Available to Promise) calculations.',
      action: {
        label: 'Auto-sync Inventory',
        onClick: () => {
          // Auto-populate product codes and pricing
          console.log('🔄 Syncing inventory data...')
        }
      }
    },
    {
      id: 'kerala_compliance',
      type: 'warning',
      title: 'Kerala GST Compliance',
      content: 'Ensure GST registration numbers are valid for inter-state transactions.'
    }
  ]

  const updateLine = (lineNumber: number, field: keyof TransactionLine, value: any) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map(line => {
        if (line.line_number === lineNumber) {
          const updatedLine = { ...line, [field]: value }
          // Auto-calculate line amount when quantity or unit price changes
          if (field === 'quantity' || field === 'unit_price') {
            updatedLine.line_amount = updatedLine.quantity * updatedLine.unit_price
          }
          return updatedLine
        }
        return line
      })
    }))
  }

  const addLine = () => {
    const newLineNumber = Math.max(...formData.lines.map(l => l.line_number)) + 1
    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, {
        line_number: newLineNumber,
        line_type: 'PRODUCT',
        description: '',
        quantity: 1,
        unit_price: 0,
        line_amount: 0,
        product_code: '',
        vendor_id: formData.vendor_id
      }]
    }))
  }

  const removeLine = (lineNumber: number) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.filter(line => line.line_number !== lineNumber)
    }))
  }

  const calculateTotals = () => {
    const totalAmount = formData.lines.reduce((sum, line) => sum + line.line_amount, 0)
    return { totalAmount }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      const { totalAmount } = calculateTotals()

      // Prepare transaction data for hera_txn_crud_v1
      const transactionData = {
        transaction_type: formData.transaction_type,
        smart_code: 'HERA.PURCHASE.TXN.PO.MAIN.v1',
        transaction_code: formData.po_number,
        source_entity_id: formData.vendor_id, // Vendor
        description: formData.description,
        total_amount: totalAmount,
        organization_id: organization!.id
      }

      // Create transaction via API v2 (calls hera_txn_crud_v1)
      const { data } = await apiV2.post('transactions', {
        transaction: transactionData,
        lines: formData.lines.map(line => ({
          line_number: line.line_number,
          line_type: line.line_type,
          description: line.description,
          quantity: line.quantity,
          unit_amount: line.unit_price,
          line_amount: line.line_amount,
          entity_id: line.product_code, // Product reference
          smart_code: `HERA.PURCHASE.TXN.PO.LINE.v1`
        })),
        organization_id: organization!.id
      })

      // Success - redirect to purchase orders list
      window.location.href = `/enterprise/procurement/purchase-orders`
      
    } catch (error) {
      console.error('Failed to create purchase order:', error)
      alert('Failed to create purchase order. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    window.location.href = `/enterprise/procurement/purchase-orders`
  }

  const completionPercentage = Math.round(
    (sections.filter(s => s.isComplete).length / sections.length) * 100
  )

  const { totalAmount } = calculateTotals()

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'header':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Purchase Order Header</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>PO Number *</Label>
                  <Input
                    value={formData.po_number}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      po_number: e.target.value
                    }))}
                    placeholder="Enter PO number"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Vendor *</Label>
                  <Input
                    value={formData.vendor_id}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      vendor_id: e.target.value
                    }))}
                    placeholder="Select vendor"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Delivery Date</Label>
                  <Input
                    type="date"
                    value={formData.delivery_date}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      delivery_date: e.target.value
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Total Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={totalAmount.toFixed(2)}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                
                <div className="md:col-span-2 space-y-2">
                  <Label>Description *</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      description: e.target.value
                    }))}
                    placeholder="Enter purchase order description"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 'lines':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Order Lines</CardTitle>
                  <Button onClick={addLine} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Line
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formData.lines.map((line) => (
                    <div key={line.line_number} className="grid grid-cols-12 gap-4 items-end p-4 border rounded-lg">
                      <div className="col-span-3">
                        <Label>Product/Description</Label>
                        <Input
                          value={line.description}
                          onChange={(e) => updateLine(line.line_number, 'description', e.target.value)}
                          placeholder="Product description"
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <Label>Product Code</Label>
                        <Input
                          value={line.product_code || ''}
                          onChange={(e) => updateLine(line.line_number, 'product_code', e.target.value)}
                          placeholder="Product code"
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          step="1"
                          value={line.quantity}
                          onChange={(e) => updateLine(line.line_number, 'quantity', parseFloat(e.target.value) || 1)}
                          placeholder="Qty"
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <Label>Unit Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={line.unit_price}
                          onChange={(e) => updateLine(line.line_number, 'unit_price', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <Label>Line Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={line.line_amount.toFixed(2)}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                      
                      <div className="col-span-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLine(line.line_number)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{formData.lines.length}</div>
                    <div className="text-sm text-blue-800">Total Lines</div>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formData.lines.reduce((sum, line) => sum + line.quantity, 0)}
                    </div>
                    <div className="text-sm text-green-800">Total Quantity</div>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">₹{totalAmount.toFixed(2)}</div>
                    <div className="text-sm text-purple-800">Total Amount</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <EnterpriseCreatePage
      title="Create Purchase Order"
      subtitle="MatrixIT World procurement transaction processing"
      breadcrumb="Enterprise > Procurement > Purchase Orders > New"
      sections={sections}
      currentSection={currentSection}
      onSectionChange={setCurrentSection}
      onSave={handleSave}
      onCancel={handleCancel}
      isSaving={isSaving}
      saveLabel="Create Purchase Order"
      aiInsights={aiInsights}
      aiSuggestions={[
        'Verify vendor details and payment terms',
        'Check product availability and pricing',
        'Ensure delivery dates align with business needs',
        'Review total amounts for accuracy'
      ]}
      completionPercentage={completionPercentage}
      estimatedTime="5-8 minutes"
      hasErrors={false}
      errorCount={0}
    >
      {renderCurrentSection()}
    </EnterpriseCreatePage>
  )
}