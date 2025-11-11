'use client'

/**
 * Universal Transaction Wizard Component
 * Smart Code: HERA.UNIVERSAL.COMPONENT.TRANSACTION_WIZARD.v1
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, Loader2, Plus } from 'lucide-react'
import type { DynamicComponentProps } from '@/lib/hera/component-loader'

interface TransactionWizardProps extends DynamicComponentProps {
  transactionType: string
}

export function TransactionWizard({ 
  resolvedOperation, 
  orgId, 
  actorId, 
  transactionType,
  searchParams 
}: TransactionWizardProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [lines, setLines] = useState<any[]>([{ description: '', amount: 0 }])
  const [loading, setLoading] = useState(false)
  const [calculations, setCalculations] = useState<Record<string, any>>({})
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const getTransactionConfig = (type: string) => {
    const configs: Record<string, any> = {
      GL_JOURNAL: {
        title: 'Create GL Journal',
        description: 'Create a new general ledger journal entry',
        icon: '📊',
        listPath: resolvedOperation.canonical_path.replace('/create', '/list'),
        fields: [
          { name: 'reference', label: 'Reference', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea', required: true },
          { name: 'date', label: 'Transaction Date', type: 'date', required: true }
        ]
      },
      PURCHASE_ORDER: {
        title: 'Create Purchase Order',
        description: 'Create a new purchase order',
        icon: '🛒',
        listPath: resolvedOperation.canonical_path.replace('/create', '/list'),
        fields: [
          { name: 'vendor', label: 'Vendor', type: 'text', required: true },
          { name: 'reference', label: 'PO Number', type: 'text', required: true },
          { name: 'date', label: 'Order Date', type: 'date', required: true },
          { name: 'terms', label: 'Payment Terms', type: 'text', required: false }
        ]
      },
      SALES_ORDER: {
        title: 'Create Sales Order',
        description: 'Create a new sales order',
        icon: '💰',
        listPath: resolvedOperation.canonical_path.replace('/create', '/list'),
        fields: [
          { name: 'customer', label: 'Customer', type: 'text', required: true },
          { name: 'reference', label: 'SO Number', type: 'text', required: true },
          { name: 'date', label: 'Order Date', type: 'date', required: true },
          { name: 'terms', label: 'Payment Terms', type: 'text', required: false }
        ]
      },
      
      // Cashew Manufacturing Transactions
      MFG_ISSUE: {
        title: 'Material Issue to WIP',
        description: 'Issue raw materials to work-in-process',
        icon: '📤',
        listPath: resolvedOperation.canonical_path?.replace('/create', '/list') || '/list',
        fields: [
          { name: 'batchId', label: 'Production Batch', type: 'select', options: ['B-2024-001 (W320)', 'B-2024-002 (W240)', 'B-2024-003 (LWP)'], required: true },
          { name: 'workCenterId', label: 'Work Center', type: 'select', options: ['Steaming Line A', 'Peeling Line B', 'Grading Line C'], required: true },
          { name: 'issueDate', label: 'Issue Date', type: 'date', required: true },
          { name: 'reference', label: 'Issue Reference', type: 'text', required: false, placeholder: 'MI-2024-001' }
        ],
        lineFields: [
          { name: 'materialId', label: 'Material', type: 'select', options: ['Raw Cashew Nuts (Kerala)', 'Vacuum Pack Bags 50kg', 'Steam Coal'], required: true },
          { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 0, step: 0.1 },
          { name: 'uom', label: 'UOM', type: 'select', options: ['KG', 'BAG', 'CARTON', 'LITRE'], required: true },
          { name: 'rate', label: 'Rate (INR)', type: 'number', required: false, min: 0, step: 0.01 }
        ]
      },
      
      MFG_LABOR: {
        title: 'Labor Booking',
        description: 'Book labor hours to production batch',
        icon: '👷',
        listPath: resolvedOperation.canonical_path?.replace('/create', '/list') || '/list',
        fields: [
          { name: 'batchId', label: 'Production Batch', type: 'select', options: ['B-2024-001 (W320)', 'B-2024-002 (W240)', 'B-2024-003 (LWP)'], required: true },
          { name: 'workCenterId', label: 'Work Center', type: 'select', options: ['Steaming Line A', 'Peeling Line B', 'Grading Line C'], required: true },
          { name: 'hours', label: 'Labor Hours', type: 'number', required: true, min: 0, max: 24, step: 0.5, placeholder: '8.0' },
          { name: 'labourRatePerHr', label: 'Labor Rate per Hour (INR)', type: 'number', required: true, min: 0, step: 0.01, placeholder: '150.00' },
          { name: 'bookingDate', label: 'Booking Date', type: 'date', required: true },
          { name: 'shift', label: 'Shift', type: 'select', options: ['Day Shift (6AM-2PM)', 'Evening Shift (2PM-10PM)', 'Night Shift (10PM-6AM)'], required: false },
          { name: 'crewSize', label: 'Crew Size', type: 'number', required: false, min: 1, max: 20, step: 1, placeholder: '8' }
        ]
      },
      
      MFG_OVERHEAD: {
        title: 'Overhead Absorption',
        description: 'Absorb overhead costs to production batch',
        icon: '⚡',
        listPath: resolvedOperation.canonical_path?.replace('/create', '/list') || '/list',
        fields: [
          { name: 'batchId', label: 'Production Batch', type: 'select', options: ['B-2024-001 (W320)', 'B-2024-002 (W240)', 'B-2024-003 (LWP)'], required: true },
          { name: 'workCenterId', label: 'Work Center', type: 'select', options: ['Steaming Line A', 'Peeling Line B', 'Grading Line C'], required: true },
          { name: 'machineHours', label: 'Machine Hours', type: 'number', required: false, min: 0, max: 24, step: 0.5, placeholder: '8.0' },
          { name: 'powerRatePerHr', label: 'Power Rate per Hour (INR)', type: 'number', required: false, min: 0, step: 0.01, placeholder: '25.00' },
          { name: 'absorptionAmount', label: 'Total Absorption Amount (INR)', type: 'number', required: true, min: 0, step: 0.01, placeholder: '1200.00' },
          { name: 'bookingDate', label: 'Booking Date', type: 'date', required: true },
          { name: 'costCenter', label: 'Cost Center', type: 'select', options: ['Production - Steaming', 'Production - Peeling', 'Maintenance'], required: false },
          { name: 'allocationType', label: 'Allocation Type', type: 'select', options: ['MACHINE_HOURS', 'LABOR_HOURS', 'FIXED_AMOUNT'], required: false }
        ]
      },
      
      MFG_RECEIPT: {
        title: 'Finished Goods Receipt',
        description: 'Receive finished cashew kernels by grade',
        icon: '🥜',
        listPath: resolvedOperation.canonical_path?.replace('/create', '/list') || '/list',
        fields: [
          { name: 'batchId', label: 'Production Batch', type: 'select', options: ['B-2024-001 (W320)', 'B-2024-002 (W240)', 'B-2024-003 (LWP)'], required: true },
          { name: 'receiptDate', label: 'Receipt Date', type: 'date', required: true },
          { name: 'moistureLossPct', label: 'Moisture Loss %', type: 'number', required: false, min: 0, max: 20, step: 0.1, placeholder: '2.5' },
          { name: 'qualityGrade', label: 'Overall Quality Grade', type: 'select', options: ['Premium', 'Standard', 'Commercial'], required: false },
          { name: 'inspector', label: 'Quality Inspector', type: 'text', required: false, placeholder: 'QC Officer Name' }
        ],
        lineFields: [
          { name: 'grade', label: 'Kernel Grade', type: 'select', options: ['W180', 'W240', 'W320', 'LWP', 'SWP', 'BB'], required: true },
          { name: 'quantity', label: 'Quantity (KG)', type: 'number', required: true, min: 0, step: 0.1 },
          { name: 'qualityNotes', label: 'Quality Notes', type: 'text', required: false, placeholder: 'Visual inspection notes' }
        ]
      },
      
      MFG_BATCHCOST: {
        title: 'Batch Cost Roll-Up',
        description: 'Calculate and roll-up batch costs',
        icon: '🧮',
        listPath: resolvedOperation.canonical_path?.replace('/create', '/list') || '/list',
        fields: [
          { name: 'batchId', label: 'Production Batch', type: 'select', options: ['B-2024-001 (W320)', 'B-2024-002 (W240)', 'B-2024-003 (LWP)'], required: true },
          { name: 'transactionDate', label: 'Costing Date', type: 'date', required: true },
          { name: 'materialCost', label: 'Total Material Cost (INR)', type: 'number', required: true, min: 0, step: 0.01, placeholder: '180000.00' },
          { name: 'labourCost', label: 'Total Labour Cost (INR)', type: 'number', required: true, min: 0, step: 0.01, placeholder: '25000.00' },
          { name: 'overheadCost', label: 'Total Overhead Cost (INR)', type: 'number', required: true, min: 0, step: 0.01, placeholder: '15000.00' },
          { name: 'scrapRecovery', label: 'Scrap Recovery Value (INR)', type: 'number', required: false, min: 0, step: 0.01, placeholder: '5000.00' },
          { name: 'outputKg', label: 'Total Output (KG)', type: 'number', required: false, min: 0, step: 0.1, placeholder: '5000.0' },
          { name: 'costingMethod', label: 'Costing Method', type: 'select', options: ['STANDARD', 'ACTUAL', 'WEIGHTED_AVERAGE'], required: false }
        ]
      },
      
      MFG_QC: {
        title: 'Quality Inspection',
        description: 'Perform quality control checks',
        icon: '🔍',
        listPath: resolvedOperation.canonical_path?.replace('/create', '/list') || '/list',
        fields: [
          { name: 'batchId', label: 'Production Batch', type: 'select', options: ['B-2024-001 (W320)', 'B-2024-002 (W240)', 'B-2024-003 (LWP)'], required: true },
          { name: 'qcDate', label: 'Inspection Date', type: 'date', required: true },
          { name: 'aql', label: 'AQL Level', type: 'select', options: ['0.1', '0.25', '0.4', '0.65', '1.0', '1.5', '2.5'], required: false },
          { name: 'sampleSize', label: 'Sample Size (KG)', type: 'number', required: false, min: 0, step: 0.1, placeholder: '50.0' },
          { name: 'inspector', label: 'Quality Inspector', type: 'text', required: true, placeholder: 'QC Officer Name' },
          { name: 'result', label: 'Overall QC Result', type: 'select', options: ['PASS', 'REWORK', 'REJECT'], required: true },
          { name: 'rejectReason', label: 'Reject Reason', type: 'textarea', required: false, placeholder: 'Specify reason if result is REJECT' },
          { name: 'certificationRequired', label: 'Certification Required', type: 'select', options: ['None', 'HACCP', 'ISO22000', 'Organic', 'Fair_Trade'], required: false }
        ]
      }
    }
    
    return configs[type] || {
      title: `Create ${type}`,
      description: `Create a new ${type.toLowerCase().replace('_', ' ')} transaction`,
      icon: '📋',
      listPath: '/list',
      fields: [
        { name: 'reference', label: 'Reference', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea', required: true }
      ]
    }
  }

  const config = getTransactionConfig(transactionType)

  const handleInputChange = (name: string, value: any) => {
    const newFormData = { ...formData, [name]: value }
    setFormData(newFormData)
    
    // Trigger real-time calculations for cashew transactions
    if (transactionType.startsWith('MFG_')) {
      updateCashewCalculations(newFormData, lines)
    }
  }

  const handleLineChange = (index: number, field: string, value: any) => {
    const newLines = [...lines]
    newLines[index] = { ...newLines[index], [field]: value }
    setLines(newLines)
    
    // Trigger real-time calculations for cashew transactions
    if (transactionType.startsWith('MFG_')) {
      updateCashewCalculations(formData, newLines)
    }
  }

  const addLine = () => {
    if (config.lineFields) {
      // Initialize cashew-specific line fields
      const newLine: any = {}
      config.lineFields.forEach((field: any) => {
        newLine[field.name] = field.type === 'number' ? 0 : ''
      })
      setLines(prev => [...prev, newLine])
    } else {
      // Generic line for non-cashew transactions
      setLines(prev => [...prev, { description: '', amount: 0 }])
    }
  }

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(prev => prev.filter((_, i) => i !== index))
    }
  }

  const validateCashewTransaction = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    switch (transactionType) {
      case 'MFG_ISSUE':
        if (!formData.batchId) errors.push('Production batch is required')
        if (!formData.workCenterId) errors.push('Work center is required')
        if (lines.every(line => !line.materialId)) errors.push('At least one material must be issued')
        break
        
      case 'MFG_LABOR':
        if (!formData.hours || parseFloat(formData.hours) <= 0) errors.push('Labor hours must be greater than 0')
        if (!formData.labourRatePerHr || parseFloat(formData.labourRatePerHr) <= 0) errors.push('Labor rate must be greater than 0')
        break
        
      case 'MFG_RECEIPT':
        if (!formData.batchId) errors.push('Production batch is required')
        if (lines.every(line => !line.grade || !line.quantity)) errors.push('At least one finished grade with quantity is required')
        break
        
      case 'MFG_QC':
        if (!formData.result) errors.push('QC result is required')
        if (formData.result === 'REJECT' && !formData.rejectReason) errors.push('Reject reason is required when result is REJECT')
        break
    }
    
    return { valid: errors.length === 0, errors }
  }

  const updateCashewCalculations = (headerData: Record<string, any>, lineData: any[]) => {
    const newCalculations: Record<string, any> = {}
    
    switch (transactionType) {
      case 'MFG_ISSUE':
        const totalMaterialCost = lineData.reduce((sum, line) => {
          const qty = parseFloat(line.quantity) || 0
          const rate = parseFloat(line.rate) || 0
          return sum + (qty * rate)
        }, 0)
        newCalculations.totalMaterialCost = totalMaterialCost
        newCalculations.totalMaterialQty = lineData.reduce((sum, line) => sum + (parseFloat(line.quantity) || 0), 0)
        break
        
      case 'MFG_LABOR':
        const hours = parseFloat(headerData.hours) || 0
        const rate = parseFloat(headerData.labourRatePerHr) || 0
        newCalculations.totalLabourCost = hours * rate
        break
        
      case 'MFG_OVERHEAD':
        const machineHours = parseFloat(headerData.machineHours) || 0
        const powerRate = parseFloat(headerData.powerRatePerHr) || 0
        const absorptionAmount = parseFloat(headerData.absorptionAmount) || 0
        newCalculations.calculatedPowerCost = machineHours * powerRate
        newCalculations.totalOverheadCost = absorptionAmount
        break
        
      case 'MFG_RECEIPT':
        const totalFinishedQty = lineData.reduce((sum, line) => sum + (parseFloat(line.quantity) || 0), 0)
        const moistureLoss = parseFloat(headerData.moistureLossPct) || 0
        newCalculations.totalFinishedQty = totalFinishedQty
        newCalculations.adjustedQty = totalFinishedQty * (1 - moistureLoss / 100)
        break
        
      case 'MFG_BATCHCOST':
        const materialCost = parseFloat(headerData.materialCost) || 0
        const labourCost = parseFloat(headerData.labourCost) || 0
        const overheadCost = parseFloat(headerData.overheadCost) || 0
        const scrapRecovery = parseFloat(headerData.scrapRecovery) || 0
        newCalculations.totalCost = materialCost + labourCost + overheadCost - scrapRecovery
        newCalculations.costPerKg = newCalculations.totalCost / (parseFloat(headerData.outputKg) || 1)
        break
    }
    
    setCalculations(newCalculations)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setValidationErrors([])
    
    try {
      // Validate cashew-specific business logic
      if (transactionType.startsWith('MFG_')) {
        const validation = validateCashewTransaction()
        if (!validation.valid) {
          setValidationErrors(validation.errors)
          setLoading(false)
          return
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log('Creating transaction:', { 
        transactionType, 
        formData, 
        lines, 
        calculations,
        orgId, 
        actorId 
      })
      
      // Show success notification
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity duration-500'
      notification.textContent = `✅ ${transactionType.replace('_', ' ')} created successfully!`
      document.body.appendChild(notification)
      
      setTimeout(() => {
        notification.style.opacity = '0'
        setTimeout(() => document.body.removeChild(notification), 500)
      }, 3000)
      
      // Redirect after delay
      setTimeout(() => {
        window.location.href = config.listPath
      }, 1500)
    } catch (error) {
      console.error('Error creating transaction:', error)
      setValidationErrors(['An error occurred while creating the transaction. Please try again.'])
    } finally {
      setLoading(false)
    }
  }

  const totalAmount = lines.reduce((sum, line) => sum + (parseFloat(line.amount) || 0), 0)

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="sm" asChild>
            <a href={config.listPath}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </a>
          </Button>
        </div>
        
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <span className="text-2xl">{config.icon}</span>
          {config.title}
        </h1>
        <p className="text-muted-foreground mt-1">{config.description}</p>
        
        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
          <span>HERA</span>
          <span>→</span>
          <span>{resolvedOperation.params?.module || 'Module'}</span>
          <span>→</span>
          <span>{resolvedOperation.params?.area || 'Area'}</span>
          <span>→</span>
          <Badge variant="outline">{resolvedOperation.scenario}</Badge>
        </div>
      </div>

      {/* Debug Info */}
      <Card className="mb-6 bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Dynamic Resolution Info</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Component:</strong><br />
              <code className="text-xs">{resolvedOperation.component_id}</code>
            </div>
            <div>
              <strong>Transaction Type:</strong><br />
              <code className="text-xs">{transactionType}</code>
            </div>
            <div>
              <strong>Smart Code:</strong><br />
              <code className="text-xs">{resolvedOperation.smart_code}</code>
            </div>
            <div>
              <strong>Alias Hit:</strong><br />
              <Badge variant={resolvedOperation.aliasHit ? "default" : "secondary"}>
                {resolvedOperation.aliasHit ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Header Information */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Header</CardTitle>
            <CardDescription>
              Enter the main transaction details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {config.fields.map((field: any) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {field.type === 'textarea' ? (
                  <Textarea
                    value={formData[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                ) : (
                  <Input
                    type={field.type || 'text'}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Summary & Calculations */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Summary</CardTitle>
            <CardDescription>
              Review transaction totals and calculations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Line Items:</span>
                <span>{lines.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Amount:</span>
                <span className="font-semibold">₹{totalAmount.toFixed(2)}</span>
              </div>
              
              {/* Cashew-specific calculations */}
              {Object.keys(calculations).length > 0 && (
                <div className="border-t pt-3 mt-3">
                  <div className="text-sm font-medium mb-2">Live Calculations:</div>
                  {calculations.totalMaterialCost && (
                    <div className="flex justify-between text-sm">
                      <span>Material Cost:</span>
                      <span className="font-medium">₹{calculations.totalMaterialCost.toFixed(2)}</span>
                    </div>
                  )}
                  {calculations.totalMaterialQty && (
                    <div className="flex justify-between text-sm">
                      <span>Material Qty:</span>
                      <span className="font-medium">{calculations.totalMaterialQty.toFixed(1)} KG</span>
                    </div>
                  )}
                  {calculations.totalLabourCost && (
                    <div className="flex justify-between text-sm">
                      <span>Labour Cost:</span>
                      <span className="font-medium">₹{calculations.totalLabourCost.toFixed(2)}</span>
                    </div>
                  )}
                  {calculations.totalOverheadCost && (
                    <div className="flex justify-between text-sm">
                      <span>Overhead Cost:</span>
                      <span className="font-medium">₹{calculations.totalOverheadCost.toFixed(2)}</span>
                    </div>
                  )}
                  {calculations.totalFinishedQty && (
                    <div className="flex justify-between text-sm">
                      <span>Finished Qty:</span>
                      <span className="font-medium">{calculations.totalFinishedQty.toFixed(1)} KG</span>
                    </div>
                  )}
                  {calculations.adjustedQty && (
                    <div className="flex justify-between text-sm">
                      <span>Moisture Adjusted:</span>
                      <span className="font-medium">{calculations.adjustedQty.toFixed(1)} KG</span>
                    </div>
                  )}
                  {calculations.totalCost && (
                    <div className="flex justify-between text-sm">
                      <span>Total Batch Cost:</span>
                      <span className="font-semibold text-primary">₹{calculations.totalCost.toFixed(2)}</span>
                    </div>
                  )}
                  {calculations.costPerKg && (
                    <div className="flex justify-between text-sm">
                      <span>Cost per KG:</span>
                      <span className="font-semibold text-primary">₹{calculations.costPerKg.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex justify-between text-sm">
                <span>Status:</span>
                <Badge variant="outline">Draft</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="mt-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="text-red-800">
              <div className="font-medium mb-2">Please fix the following errors:</div>
              <ul className="text-sm space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Line Items */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {config.lineFields ? 'Transaction Details' : 'Line Items'}
              </CardTitle>
              <CardDescription>
                {config.lineFields 
                  ? 'Add specific transaction details based on type'
                  : 'Add transaction line items'
                }
              </CardDescription>
            </div>
            <Button onClick={addLine} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add {config.lineFields ? 'Detail' : 'Line'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {lines.map((line, index) => (
              <div key={index} className="p-4 border rounded-lg bg-muted/20">
                {config.lineFields ? (
                  // Cashew-specific transaction fields
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {config.lineFields.map((field: any) => (
                      <div key={field.name}>
                        <Label htmlFor={`line-${field.name}-${index}`} className="text-sm">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {field.type === 'select' ? (
                          <select
                            id={`line-${field.name}-${index}`}
                            value={line[field.name] || ''}
                            onChange={(e) => handleLineChange(index, field.name, e.target.value)}
                            className="w-full mt-1 px-3 py-2 border border-input bg-background text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                            required={field.required}
                          >
                            <option value="">Select {field.label.toLowerCase()}</option>
                            {field.options?.map((option: string) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        ) : field.type === 'textarea' ? (
                          <textarea
                            id={`line-${field.name}-${index}`}
                            value={line[field.name] || ''}
                            onChange={(e) => handleLineChange(index, field.name, e.target.value)}
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                            className="w-full mt-1 px-3 py-2 border border-input bg-background text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-ring min-h-[60px]"
                            rows={2}
                          />
                        ) : (
                          <Input
                            id={`line-${field.name}-${index}`}
                            type={field.type || 'text'}
                            value={line[field.name] || ''}
                            onChange={(e) => handleLineChange(index, field.name, e.target.value)}
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            className="mt-1"
                          />
                        )}
                      </div>
                    ))}
                    
                    {/* Remove button */}
                    <div className="flex items-end">
                      {lines.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLine(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  // Generic line items
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label htmlFor={`line-desc-${index}`} className="text-sm">
                        Description
                      </Label>
                      <Input
                        id={`line-desc-${index}`}
                        value={line.description}
                        onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                        placeholder="Enter line description"
                      />
                    </div>
                    <div className="w-32">
                      <Label htmlFor={`line-amount-${index}`} className="text-sm">
                        Amount
                      </Label>
                      <Input
                        id={`line-amount-${index}`}
                        type="number"
                        step="0.01"
                        value={line.amount}
                        onChange={(e) => handleLineChange(index, 'amount', e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    {lines.length > 1 && (
                      <div className="pt-6">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLine(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" asChild>
          <a href={config.listPath}>Cancel</a>
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Create {transactionType.replace('_', ' ')}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}