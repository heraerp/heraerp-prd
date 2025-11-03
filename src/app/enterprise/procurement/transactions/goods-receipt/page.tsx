'use client'

/**
 * Goods Receipt Transaction Page
 * Smart Code: HERA.PURCHASE.TXN.GR.MAIN.v1
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
  Package, 
  Plus,
  Trash2,
  Truck
} from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { apiV2 } from '@/lib/client/fetchV2'

interface TransactionLine {
  line_number: number
  line_type: string
  description: string
  quantity_received: number
  quantity_ordered: number
  unit_price: number
  line_amount: number
  product_code?: string
  po_line_ref?: string
}

interface TransactionFormData {
  transaction_type: string
  gr_number: string
  po_reference: string
  vendor_id: string
  description: string
  total_amount: number
  receipt_date: string
  lines: TransactionLine[]
}

export default function CreateGoodsReceiptPage() {
  const { organization, user } = useHERAAuth()
  const [currentSection, setCurrentSection] = useState('header')
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<TransactionFormData>({
    transaction_type: 'GOODS_RECEIPT',
    gr_number: '',
    po_reference: '',
    vendor_id: '',
    description: '',
    total_amount: 0,
    receipt_date: new Date().toISOString().split('T')[0],
    lines: [
      {
        line_number: 1,
        line_type: 'PRODUCT',
        description: '',
        quantity_received: 0,
        quantity_ordered: 0,
        unit_price: 0,
        line_amount: 0,
        product_code: '',
        po_line_ref: ''
      }
    ]
  })

  // Page sections for navigation
  const sections: CreatePageSection[] = [
    {
      id: 'header',
      title: 'Goods Receipt Header',
      icon: Receipt,
      isRequired: true,
      isComplete: !!(formData.description && formData.vendor_id && formData.gr_number)
    },
    {
      id: 'lines',
      title: 'Receipt Lines',
      icon: Calculator,
      isRequired: true,
      isComplete: formData.lines.every(line => line.quantity_received > 0 && line.description)
    }
  ]

  // AI insights for transaction
  const aiInsights: AIInsight[] = [
    {
      id: 'po_matching',
      type: 'automation',
      title: 'PO Matching',
      content: 'HERA automatically validates goods receipt against purchase order for 3-way matching.'
    },
    {
      id: 'inventory_update',
      type: 'suggestion',
      title: 'Inventory Update',
      content: 'Stock levels will be automatically updated across all MatrixIT World branches.',
      action: {
        label: 'Auto-update Stock',
        onClick: () => {
          console.log('📦 Auto-updating inventory levels...')
        }
      }
    },
    {
      id: 'quality_check',
      type: 'warning',
      title: 'Quality Inspection',
      content: 'Ensure quality inspection is completed before posting goods receipt.'
    }
  ]

  const updateLine = (lineNumber: number, field: keyof TransactionLine, value: any) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map(line => {
        if (line.line_number === lineNumber) {
          const updatedLine = { ...line, [field]: value }
          // Auto-calculate line amount when quantity received or unit price changes
          if (field === 'quantity_received' || field === 'unit_price') {
            updatedLine.line_amount = updatedLine.quantity_received * updatedLine.unit_price
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
        quantity_received: 0,
        quantity_ordered: 0,
        unit_price: 0,
        line_amount: 0,
        product_code: '',
        po_line_ref: ''
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
    const totalReceived = formData.lines.reduce((sum, line) => sum + line.quantity_received, 0)
    return { totalAmount, totalReceived }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      const { totalAmount } = calculateTotals()

      // Prepare transaction data for hera_txn_crud_v1
      const transactionData = {
        transaction_type: formData.transaction_type,
        smart_code: 'HERA.PURCHASE.TXN.GR.MAIN.v1',
        transaction_code: formData.gr_number,
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
          quantity: line.quantity_received,
          unit_amount: line.unit_price,
          line_amount: line.line_amount,
          entity_id: line.product_code, // Product reference
          smart_code: `HERA.PURCHASE.TXN.GR.LINE.v1`
        })),
        organization_id: organization!.id
      })

      // Success - redirect to goods receipts list
      window.location.href = `/enterprise/procurement/goods-receipts`
      
    } catch (error) {
      console.error('Failed to create goods receipt:', error)
      alert('Failed to create goods receipt. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    window.location.href = `/enterprise/procurement/goods-receipts`
  }

  const completionPercentage = Math.round(
    (sections.filter(s => s.isComplete).length / sections.length) * 100
  )

  const { totalAmount, totalReceived } = calculateTotals()

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'header':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Goods Receipt Header</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>GR Number *</Label>
                  <Input
                    value={formData.gr_number}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      gr_number: e.target.value
                    }))}
                    placeholder="Enter GR number"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>PO Reference</Label>
                  <Input
                    value={formData.po_reference}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      po_reference: e.target.value
                    }))}
                    placeholder="Link to purchase order"
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
                  <Label>Receipt Date</Label>
                  <Input
                    type="date"
                    value={formData.receipt_date}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      receipt_date: e.target.value
                    }))}
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
                    placeholder="Enter goods receipt description"
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
                  <CardTitle>Receipt Lines</CardTitle>
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
                      <div className="col-span-2">
                        <Label>Product Code</Label>
                        <Input
                          value={line.product_code || ''}
                          onChange={(e) => updateLine(line.line_number, 'product_code', e.target.value)}
                          placeholder="Product"
                        />
                      </div>
                      
                      <div className="col-span-3">
                        <Label>Description</Label>
                        <Input
                          value={line.description}
                          onChange={(e) => updateLine(line.line_number, 'description', e.target.value)}
                          placeholder="Product description"
                        />
                      </div>
                      
                      <div className="col-span-1">
                        <Label>Ordered</Label>
                        <Input
                          type="number"
                          step="1"
                          value={line.quantity_ordered}
                          onChange={(e) => updateLine(line.line_number, 'quantity_ordered', parseFloat(e.target.value) || 0)}
                          placeholder="Qty"
                          className="bg-gray-50"
                          disabled
                        />
                      </div>
                      
                      <div className="col-span-1">
                        <Label>Received</Label>
                        <Input
                          type="number"
                          step="1"
                          value={line.quantity_received}
                          onChange={(e) => updateLine(line.line_number, 'quantity_received', parseFloat(e.target.value) || 0)}
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
            
            {/* Receipt Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Receipt Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{formData.lines.length}</div>
                    <div className="text-sm text-blue-800">Total Lines</div>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{totalReceived}</div>
                    <div className="text-sm text-green-800">Total Received</div>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">₹{totalAmount.toFixed(2)}</div>
                    <div className="text-sm text-purple-800">Total Value</div>
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
      title="Create Goods Receipt"
      subtitle="MatrixIT World procurement receipt processing"
      breadcrumb="Enterprise > Procurement > Goods Receipts > New"
      sections={sections}
      currentSection={currentSection}
      onSectionChange={setCurrentSection}
      onSave={handleSave}
      onCancel={handleCancel}
      isSaving={isSaving}
      saveLabel="Post Goods Receipt"
      aiInsights={aiInsights}
      aiSuggestions={[
        'Verify received quantities match delivery notes',
        'Check product quality before posting receipt',
        'Ensure storage locations are updated',
        'Review pricing against purchase order'
      ]}
      completionPercentage={completionPercentage}
      estimatedTime="4-6 minutes"
      hasErrors={false}
      errorCount={0}
    >
      {renderCurrentSection()}
    </EnterpriseCreatePage>
  )
}