'use client'

/**
 * Inventory Adjustment Transaction Page
 * Smart Code: HERA.INVENTORY.TXN.ADJ.MAIN.v1
 * Generated from: MatrixIT World Inventory System
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
  AlertTriangle
} from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { apiV2 } from '@/lib/client/fetchV2'

interface TransactionLine {
  line_number: number
  line_type: string
  product_code: string
  description: string
  current_stock: number
  adjusted_stock: number
  adjustment_qty: number
  unit_cost: number
  adjustment_value: number
  reason_code: string
  location_code?: string
}

interface TransactionFormData {
  transaction_type: string
  adjustment_number: string
  description: string
  total_adjustment_value: number
  adjustment_date: string
  branch_id: string
  reason: string
  lines: TransactionLine[]
}

export default function CreateInventoryAdjustmentPage() {
  const { organization, user } = useHERAAuth()
  const [currentSection, setCurrentSection] = useState('header')
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<TransactionFormData>({
    transaction_type: 'INVENTORY_ADJUSTMENT',
    adjustment_number: '',
    description: '',
    total_adjustment_value: 0,
    adjustment_date: new Date().toISOString().split('T')[0],
    branch_id: '',
    reason: '',
    lines: [
      {
        line_number: 1,
        line_type: 'PRODUCT',
        product_code: '',
        description: '',
        current_stock: 0,
        adjusted_stock: 0,
        adjustment_qty: 0,
        unit_cost: 0,
        adjustment_value: 0,
        reason_code: '',
        location_code: ''
      }
    ]
  })

  // Page sections for navigation
  const sections: CreatePageSection[] = [
    {
      id: 'header',
      title: 'Adjustment Header',
      icon: Receipt,
      isRequired: true,
      isComplete: !!(formData.description && formData.branch_id && formData.adjustment_number)
    },
    {
      id: 'lines',
      title: 'Adjustment Lines',
      icon: Calculator,
      isRequired: true,
      isComplete: formData.lines.every(line => line.product_code && line.adjustment_qty !== 0)
    }
  ]

  // AI insights for transaction
  const aiInsights: AIInsight[] = [
    {
      id: 'stock_validation',
      type: 'automation',
      title: 'Stock Validation',
      content: 'HERA automatically validates current stock levels and prevents negative inventory.'
    },
    {
      id: 'cost_impact',
      type: 'warning',
      title: 'Cost Impact',
      content: 'Inventory adjustments will affect COGS and inventory valuations across all MatrixIT branches.'
    },
    {
      id: 'audit_trail',
      type: 'suggestion',
      title: 'Audit Trail',
      content: 'Include detailed reason codes for better inventory control and audit compliance.',
      action: {
        label: 'Add Reason Codes',
        onClick: () => {
          console.log('📋 Adding standard reason codes...')
        }
      }
    }
  ]

  const updateLine = (lineNumber: number, field: keyof TransactionLine, value: any) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map(line => {
        if (line.line_number === lineNumber) {
          const updatedLine = { ...line, [field]: value }
          
          // Auto-calculate adjustment quantity and value
          if (field === 'current_stock' || field === 'adjusted_stock') {
            updatedLine.adjustment_qty = updatedLine.adjusted_stock - updatedLine.current_stock
            updatedLine.adjustment_value = updatedLine.adjustment_qty * updatedLine.unit_cost
          }
          
          if (field === 'unit_cost' || field === 'adjustment_qty') {
            updatedLine.adjustment_value = updatedLine.adjustment_qty * updatedLine.unit_cost
          }
          
          return updatedLine
        }
        return line
      })
    }))
    
    // Recalculate total
    calculateTotals()
  }

  const addLine = () => {
    const newLineNumber = Math.max(...formData.lines.map(l => l.line_number)) + 1
    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, {
        line_number: newLineNumber,
        line_type: 'PRODUCT',
        product_code: '',
        description: '',
        current_stock: 0,
        adjusted_stock: 0,
        adjustment_qty: 0,
        unit_cost: 0,
        adjustment_value: 0,
        reason_code: '',
        location_code: formData.branch_id
      }]
    }))
  }

  const removeLine = (lineNumber: number) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.filter(line => line.line_number !== lineNumber)
    }))
    calculateTotals()
  }

  const calculateTotals = () => {
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        total_adjustment_value: prev.lines.reduce((sum, line) => sum + line.adjustment_value, 0)
      }))
    }, 0)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)

      // Prepare transaction data for hera_txn_crud_v1
      const transactionData = {
        transaction_type: formData.transaction_type,
        smart_code: 'HERA.INVENTORY.TXN.ADJ.MAIN.v1',
        transaction_code: formData.adjustment_number,
        source_entity_id: formData.branch_id, // Branch/Location
        description: formData.description,
        total_amount: Math.abs(formData.total_adjustment_value),
        organization_id: organization!.id
      }

      // Create transaction via API v2 (calls hera_txn_crud_v1)
      const { data } = await apiV2.post('transactions', {
        transaction: transactionData,
        lines: formData.lines.map(line => ({
          line_number: line.line_number,
          line_type: line.line_type,
          description: line.description,
          quantity: Math.abs(line.adjustment_qty),
          unit_amount: line.unit_cost,
          line_amount: Math.abs(line.adjustment_value),
          entity_id: line.product_code, // Product reference
          smart_code: `HERA.INVENTORY.TXN.ADJ.LINE.v1`,
          line_data: {
            product_code: line.product_code,
            current_stock: line.current_stock,
            adjusted_stock: line.adjusted_stock,
            adjustment_qty: line.adjustment_qty,
            adjustment_type: line.adjustment_qty > 0 ? 'INCREASE' : 'DECREASE',
            reason_code: line.reason_code,
            location_code: line.location_code
          }
        })),
        organization_id: organization!.id
      })

      // Success - redirect to inventory adjustments list
      window.location.href = `/enterprise/inventory/adjustments`
      
    } catch (error) {
      console.error('Failed to create inventory adjustment:', error)
      alert('Failed to create inventory adjustment. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    window.location.href = `/enterprise/inventory/adjustments`
  }

  const completionPercentage = Math.round(
    (sections.filter(s => s.isComplete).length / sections.length) * 100
  )

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'header':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Inventory Adjustment Header</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Adjustment Number *</Label>
                  <Input
                    value={formData.adjustment_number}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      adjustment_number: e.target.value
                    }))}
                    placeholder="Enter adjustment number"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Branch/Location *</Label>
                  <Input
                    value={formData.branch_id}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      branch_id: e.target.value
                    }))}
                    placeholder="Select branch"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Adjustment Date</Label>
                  <Input
                    type="date"
                    value={formData.adjustment_date}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      adjustment_date: e.target.value
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Total Value Impact</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.total_adjustment_value.toFixed(2)}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <select
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      reason: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select reason</option>
                    <option value="PHYSICAL_COUNT">Physical Count</option>
                    <option value="DAMAGE">Damage</option>
                    <option value="THEFT">Theft</option>
                    <option value="OBSOLESCENCE">Obsolescence</option>
                    <option value="SYSTEM_ERROR">System Error</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                
                <div className="md:col-span-2 space-y-2">
                  <Label>Description *</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      description: e.target.value
                    }))}
                    placeholder="Enter adjustment description"
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
                  <CardTitle>Adjustment Lines</CardTitle>
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
                          value={line.product_code}
                          onChange={(e) => updateLine(line.line_number, 'product_code', e.target.value)}
                          placeholder="Product"
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <Label>Description</Label>
                        <Input
                          value={line.description}
                          onChange={(e) => updateLine(line.line_number, 'description', e.target.value)}
                          placeholder="Product description"
                        />
                      </div>
                      
                      <div className="col-span-1">
                        <Label>Current</Label>
                        <Input
                          type="number"
                          step="1"
                          value={line.current_stock}
                          onChange={(e) => updateLine(line.line_number, 'current_stock', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="bg-gray-50"
                        />
                      </div>
                      
                      <div className="col-span-1">
                        <Label>Adjusted</Label>
                        <Input
                          type="number"
                          step="1"
                          value={line.adjusted_stock}
                          onChange={(e) => updateLine(line.line_number, 'adjusted_stock', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                      
                      <div className="col-span-1">
                        <Label>Adj Qty</Label>
                        <Input
                          type="number"
                          step="1"
                          value={line.adjustment_qty}
                          disabled
                          className={`bg-gray-50 ${line.adjustment_qty > 0 ? 'text-green-600' : line.adjustment_qty < 0 ? 'text-red-600' : ''}`}
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <Label>Unit Cost</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={line.unit_cost}
                          onChange={(e) => updateLine(line.line_number, 'unit_cost', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <Label>Value Impact</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={line.adjustment_value.toFixed(2)}
                          disabled
                          className={`bg-gray-50 ${line.adjustment_value > 0 ? 'text-green-600' : line.adjustment_value < 0 ? 'text-red-600' : ''}`}
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
                      
                      {/* Second row for reason code */}
                      <div className="col-span-12 grid grid-cols-12 gap-4 mt-2">
                        <div className="col-span-3">
                          <Label>Reason Code</Label>
                          <select
                            value={line.reason_code}
                            onChange={(e) => updateLine(line.line_number, 'reason_code', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="">Select reason</option>
                            <option value="COUNT_DIFF">Count Difference</option>
                            <option value="DAMAGED">Damaged</option>
                            <option value="EXPIRED">Expired</option>
                            <option value="STOLEN">Stolen</option>
                            <option value="SYSTEM_ERR">System Error</option>
                          </select>
                        </div>
                        
                        <div className="col-span-3">
                          <Label>Location Code</Label>
                          <Input
                            value={line.location_code || ''}
                            onChange={(e) => updateLine(line.line_number, 'location_code', e.target.value)}
                            placeholder="Storage location"
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Adjustment Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Adjustment Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{formData.lines.length}</div>
                    <div className="text-sm text-blue-800">Total Lines</div>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formData.lines.filter(line => line.adjustment_qty > 0).length}
                    </div>
                    <div className="text-sm text-green-800">Increases</div>
                  </div>
                  
                  <div className="p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {formData.lines.filter(line => line.adjustment_qty < 0).length}
                    </div>
                    <div className="text-sm text-red-800">Decreases</div>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className={`text-2xl font-bold ${formData.total_adjustment_value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{Math.abs(formData.total_adjustment_value).toFixed(2)}
                    </div>
                    <div className="text-sm text-purple-800">Value Impact</div>
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
      title="Create Inventory Adjustment"
      subtitle="MatrixIT World inventory control and valuation"
      breadcrumb="Enterprise > Inventory > Adjustments > New"
      sections={sections}
      currentSection={currentSection}
      onSectionChange={setCurrentSection}
      onSave={handleSave}
      onCancel={handleCancel}
      isSaving={isSaving}
      saveLabel="Post Adjustment"
      aiInsights={aiInsights}
      aiSuggestions={[
        'Verify current stock quantities before adjustment',
        'Include detailed reason codes for audit compliance',
        'Check cost implications on inventory valuation',
        'Ensure proper authorization for significant adjustments'
      ]}
      completionPercentage={completionPercentage}
      estimatedTime="5-7 minutes"
      hasErrors={false}
      errorCount={0}
    >
      {renderCurrentSection()}
    </EnterpriseCreatePage>
  )
}