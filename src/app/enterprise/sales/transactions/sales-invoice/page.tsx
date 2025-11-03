'use client'

/**
 * Sales Invoice Transaction Page
 * Smart Code: HERA.SALES.TXN.INV.MAIN.v1
 * Generated from: MatrixIT World Sales System
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
  FileText, 
  Plus,
  Trash2,
  IndianRupee
} from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { apiV2 } from '@/lib/client/fetchV2'

interface TransactionLine {
  line_number: number
  line_type: string
  description: string
  quantity: number
  unit_price: number
  tax_percent: number
  discount_percent: number
  line_amount: number
  tax_amount: number
  product_code?: string
  hsn_code?: string
}

interface TransactionFormData {
  transaction_type: string
  invoice_number: string
  customer_id: string
  description: string
  total_amount: number
  tax_amount: number
  net_amount: number
  invoice_date: string
  due_date: string
  so_reference: string
  lines: TransactionLine[]
}

export default function CreateSalesInvoicePage() {
  const { organization, user } = useHERAAuth()
  const [currentSection, setCurrentSection] = useState('header')
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<TransactionFormData>({
    transaction_type: 'SALES_INVOICE',
    invoice_number: '',
    customer_id: '',
    description: '',
    total_amount: 0,
    tax_amount: 0,
    net_amount: 0,
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    so_reference: '',
    lines: [
      {
        line_number: 1,
        line_type: 'PRODUCT',
        description: '',
        quantity: 1,
        unit_price: 0,
        tax_percent: 18, // Standard GST rate
        discount_percent: 0,
        line_amount: 0,
        tax_amount: 0,
        product_code: '',
        hsn_code: ''
      }
    ]
  })

  // Page sections for navigation
  const sections: CreatePageSection[] = [
    {
      id: 'header',
      title: 'Invoice Header',
      icon: Receipt,
      isRequired: true,
      isComplete: !!(formData.description && formData.customer_id && formData.invoice_number)
    },
    {
      id: 'lines',
      title: 'Invoice Lines',
      icon: Calculator,
      isRequired: true,
      isComplete: formData.lines.every(line => line.line_amount > 0 && line.description)
    },
    {
      id: 'tax',
      title: 'Tax Calculation',
      icon: IndianRupee,
      isRequired: true,
      isComplete: true
    }
  ]

  // AI insights for transaction
  const aiInsights: AIInsight[] = [
    {
      id: 'gst_compliance',
      type: 'automation',
      title: 'GST Compliance',
      content: 'HERA automatically calculates GST and generates compliant invoice format for Kerala state.'
    },
    {
      id: 'payment_terms',
      type: 'suggestion',
      title: 'Payment Terms',
      content: 'Smart payment terms based on customer credit rating and payment history.',
      action: {
        label: 'Auto-set Terms',
        onClick: () => {
          console.log('💳 Setting payment terms...')
        }
      }
    },
    {
      id: 'revenue_recognition',
      type: 'automation',
      title: 'Revenue Recognition',
      content: 'Automatic GL posting for revenue, tax liabilities, and receivables.'
    }
  ]

  const updateLine = (lineNumber: number, field: keyof TransactionLine, value: any) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map(line => {
        if (line.line_number === lineNumber) {
          const updatedLine = { ...line, [field]: value }
          // Auto-calculate amounts
          if (field === 'quantity' || field === 'unit_price' || field === 'discount_percent' || field === 'tax_percent') {
            const grossAmount = updatedLine.quantity * updatedLine.unit_price
            const discountAmount = grossAmount * (updatedLine.discount_percent / 100)
            const netAmount = grossAmount - discountAmount
            updatedLine.line_amount = netAmount
            updatedLine.tax_amount = netAmount * (updatedLine.tax_percent / 100)
          }
          return updatedLine
        }
        return line
      })
    }))
    
    // Recalculate totals
    calculateTotals()
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
        tax_percent: 18,
        discount_percent: 0,
        line_amount: 0,
        tax_amount: 0,
        product_code: '',
        hsn_code: ''
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
      setFormData(prev => {
        const totalAmount = prev.lines.reduce((sum, line) => sum + line.line_amount, 0)
        const taxAmount = prev.lines.reduce((sum, line) => sum + line.tax_amount, 0)
        const netAmount = totalAmount + taxAmount
        
        return {
          ...prev,
          total_amount: totalAmount,
          tax_amount: taxAmount,
          net_amount: netAmount
        }
      })
    }, 0)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)

      // Prepare transaction data for hera_txn_crud_v1
      const transactionData = {
        transaction_type: formData.transaction_type,
        smart_code: 'HERA.SALES.TXN.INV.MAIN.v1',
        transaction_code: formData.invoice_number,
        source_entity_id: formData.customer_id, // Customer
        description: formData.description,
        total_amount: formData.net_amount,
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
          line_amount: line.line_amount + line.tax_amount, // Include tax
          entity_id: line.product_code, // Product reference
          smart_code: `HERA.SALES.TXN.INV.LINE.v1`
        })),
        organization_id: organization!.id
      })

      // Success - redirect to sales invoices list
      window.location.href = `/enterprise/sales/sales-invoices`
      
    } catch (error) {
      console.error('Failed to create sales invoice:', error)
      alert('Failed to create sales invoice. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    window.location.href = `/enterprise/sales/sales-invoices`
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
              <CardTitle>Invoice Header</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Invoice Number *</Label>
                  <Input
                    value={formData.invoice_number}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      invoice_number: e.target.value
                    }))}
                    placeholder="Enter invoice number"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Customer *</Label>
                  <Input
                    value={formData.customer_id}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      customer_id: e.target.value
                    }))}
                    placeholder="Select customer"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Invoice Date</Label>
                  <Input
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      invoice_date: e.target.value
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      due_date: e.target.value
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>SO Reference</Label>
                  <Input
                    value={formData.so_reference}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      so_reference: e.target.value
                    }))}
                    placeholder="Link to sales order"
                  />
                </div>
                
                <div className="md:col-span-1 space-y-2">
                  <Label>Net Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.net_amount.toFixed(2)}
                    disabled
                    className="bg-gray-50 font-bold"
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
                    placeholder="Enter invoice description"
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
                  <CardTitle>Invoice Lines</CardTitle>
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
                      
                      <div className="col-span-2">
                        <Label>Description</Label>
                        <Input
                          value={line.description}
                          onChange={(e) => updateLine(line.line_number, 'description', e.target.value)}
                          placeholder="Product description"
                        />
                      </div>
                      
                      <div className="col-span-1">
                        <Label>HSN</Label>
                        <Input
                          value={line.hsn_code || ''}
                          onChange={(e) => updateLine(line.line_number, 'hsn_code', e.target.value)}
                          placeholder="HSN"
                        />
                      </div>
                      
                      <div className="col-span-1">
                        <Label>Qty</Label>
                        <Input
                          type="number"
                          step="1"
                          value={line.quantity}
                          onChange={(e) => updateLine(line.line_number, 'quantity', parseFloat(e.target.value) || 1)}
                          placeholder="1"
                        />
                      </div>
                      
                      <div className="col-span-1">
                        <Label>Rate</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={line.unit_price}
                          onChange={(e) => updateLine(line.line_number, 'unit_price', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div className="col-span-1">
                        <Label>Disc%</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={line.discount_percent}
                          onChange={(e) => updateLine(line.line_number, 'discount_percent', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                      
                      <div className="col-span-1">
                        <Label>GST%</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={line.tax_percent}
                          onChange={(e) => updateLine(line.line_number, 'tax_percent', parseFloat(e.target.value) || 18)}
                          placeholder="18"
                        />
                      </div>
                      
                      <div className="col-span-1">
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={(line.line_amount + line.tax_amount).toFixed(2)}
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
          </div>
        )

      case 'tax':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Tax Summary & Totals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">₹{formData.total_amount.toFixed(2)}</div>
                  <div className="text-sm text-blue-800">Taxable Amount</div>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">₹{formData.tax_amount.toFixed(2)}</div>
                  <div className="text-sm text-orange-800">Total GST</div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">₹{formData.net_amount.toFixed(2)}</div>
                  <div className="text-sm text-green-800">Invoice Total</div>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{formData.lines.length}</div>
                  <div className="text-sm text-purple-800">Line Items</div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{formData.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CGST (9%):</span>
                    <span>₹{(formData.tax_amount / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST (9%):</span>
                    <span>₹{(formData.tax_amount / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>₹{formData.net_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <EnterpriseCreatePage
      title="Create Sales Invoice"
      subtitle="MatrixIT World GST compliant invoicing"
      breadcrumb="Enterprise > Sales > Sales Invoices > New"
      sections={sections}
      currentSection={currentSection}
      onSectionChange={setCurrentSection}
      onSave={handleSave}
      onCancel={handleCancel}
      isSaving={isSaving}
      saveLabel="Create Invoice"
      aiInsights={aiInsights}
      aiSuggestions={[
        'Verify GST rates and HSN codes',
        'Check customer payment terms and credit',
        'Ensure proper revenue recognition',
        'Review invoice totals and tax calculations'
      ]}
      completionPercentage={completionPercentage}
      estimatedTime="6-8 minutes"
      hasErrors={false}
      errorCount={0}
    >
      {renderCurrentSection()}
    </EnterpriseCreatePage>
  )
}