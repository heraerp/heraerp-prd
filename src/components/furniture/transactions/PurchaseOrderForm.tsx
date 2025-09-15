'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Plus, Trash2, Package, AlertCircle, CheckCircle } from 'lucide-react'
import { universalApi } from '@/lib/universal-api'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/date-utils'

interface PurchaseOrderLineItem {
  material_id: string
  material_name: string
  quantity: number
  unit_cost: number
  line_total?: number
  supplier_part_number?: string
  lead_time_days?: number
}

interface ApprovalInfo {
  required: boolean
  rule?: string
  threshold?: number
  approvers?: string[]
}

export function PurchaseOrderForm() {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [deliveryWarehouse, setDeliveryWarehouse] = useState('Main Warehouse')
  const [paymentTerms, setPaymentTerms] = useState('NET30')
  const [lineItems, setLineItems] = useState<PurchaseOrderLineItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [approvalInfo, setApprovalInfo] = useState<ApprovalInfo | null>(null)
  const [expectedDelivery, setExpectedDelivery] = useState<Date | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load suppliers
      const suppliersData = await universalApi.read({
        table: 'core_entities',
        filter: { entity_type: 'furniture_supplier' }
      })
      setSuppliers(suppliersData.data || [])

      // Load materials with cost data
      const materialsData = await universalApi.read({
        table: 'core_entities',
        filter: { entity_type: 'furniture_material' }
      })

      // Load dynamic cost data for each material
      for (const material of materialsData.data || []) {
        const dynamicData = await universalApi.read({
          table: 'core_dynamic_data',
          filter: {
            entity_id: material.id,
            field_name: 'unit_cost'
          }
        })

        if (dynamicData.data && dynamicData.data.length > 0) {
          material.unit_cost = dynamicData.data[0].field_value_number
        }

        // Load lead time data
        const leadTimeData = await universalApi.read({
          table: 'core_dynamic_data',
          filter: {
            entity_id: material.id,
            field_name: 'standard_lead_time'
          }
        })

        if (leadTimeData.data && leadTimeData.data.length > 0) {
          material.lead_time_days = leadTimeData.data[0].field_value_number
        }
      }

      setMaterials(materialsData.data || [])
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load data')
    }
  }

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        material_id: '',
        material_name: '',
        quantity: 1,
        unit_cost: 0,
        lead_time_days: 14
      }
    ])
  }

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  const updateLineItem = (index: number, field: string, value: any) => {
    const updated = [...lineItems]
    updated[index] = { ...updated[index], [field]: value }

    if (field === 'material_id') {
      const material = materials.find(m => m.id === value)
      if (material) {
        updated[index].material_name = material.entity_name
        updated[index].unit_cost = material.unit_cost || 0
        updated[index].lead_time_days = material.lead_time_days || 14
        updated[index].supplier_part_number = `SP-${material.entity_code}`
      }
    }

    if (field === 'quantity' || field === 'unit_cost') {
      updated[index].line_total = updated[index].quantity * updated[index].unit_cost
    }

    setLineItems(updated)
  }

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0)
  }

  const checkApprovalRequired = (totalAmount: number) => {
    // Simulate UCR approval rules
    if (totalAmount >= 50000) {
      setApprovalInfo({
        required: true,
        rule: 'High Value Purchase Order',
        threshold: 50000,
        approvers: ['Purchase Manager', 'Finance Director']
      })
    } else if (totalAmount >= 25000) {
      setApprovalInfo({
        required: true,
        rule: 'Medium Value Purchase Order',
        threshold: 25000,
        approvers: ['Purchase Manager']
      })
    } else {
      setApprovalInfo({ required: false })
    }
  }

  const calculateExpectedDelivery = () => {
    if (lineItems.length === 0) return

    // Find the maximum lead time
    const maxLeadTime = Math.max(...lineItems.map(item => item.lead_time_days || 14))

    const deliveryDate = new Date()
    deliveryDate.setDate(deliveryDate.getDate() + maxLeadTime)

    // Account for weekends
    const dayOfWeek = deliveryDate.getDay()
    if (dayOfWeek === 0) deliveryDate.setDate(deliveryDate.getDate() + 1) // Sunday to Monday
    if (dayOfWeek === 6) deliveryDate.setDate(deliveryDate.getDate() + 2) // Saturday to Monday

    setExpectedDelivery(deliveryDate)
  }

  useEffect(() => {
    const total = calculateTotal()
    checkApprovalRequired(total)
    calculateExpectedDelivery()
  }, [lineItems])

  const handleSubmit = async () => {
    setError('')
    setSuccess('')

    if (!selectedSupplier) {
      setError('Please select a supplier')
      return
    }

    if (lineItems.length === 0) {
      setError('Please add at least one material')
      return
    }

    setLoading(true)

    try {
      // Create purchase order transaction
      const transaction = await universalApi.createTransaction({
        transaction_type: 'purchase_order',
        transaction_code: `PO-${Date.now()}`,
        transaction_date: new Date().toISOString(),
        to_entity_id: selectedSupplier,
        total_amount: calculateTotal(),
        smart_code: 'HERA.IND.FURN.TXN.PURCHASEORDER.V1',
        metadata: {
          delivery_warehouse: deliveryWarehouse,
          payment_terms: paymentTerms,
          status: approvalInfo?.required ? 'pending_approval' : 'confirmed',
          approval_required: approvalInfo,
          expected_delivery_date: expectedDelivery?.toISOString()
        },
        line_items: lineItems.map((item, index) => ({
          line_number: index + 1,
          entity_id: item.material_id,
          quantity: item.quantity,
          unit_price: item.unit_cost,
          line_amount: item.quantity * item.unit_cost,
          smart_code: 'HERA.IND.FURN.TXN.PURCHASEORDER.LINE.V1',
          metadata: {
            material_name: item.material_name,
            supplier_part_number: item.supplier_part_number,
            expected_delivery_days: item.lead_time_days
          }
        }))
      })

      setSuccess(`Purchase Order ${transaction.transaction_code} created successfully!`)

      // Reset form
      setSelectedSupplier('')
      setLineItems([])
      setApprovalInfo(null)
      setExpectedDelivery(null)
    } catch (err: any) {
      setError(err.message || 'Failed to create purchase order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            New Purchase Order
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Supplier Selection */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Supplier *</Label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.entity_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Delivery Warehouse</Label>
              <Select value={deliveryWarehouse} onValueChange={setDeliveryWarehouse}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Main Warehouse">Main Warehouse</SelectItem>
                  <SelectItem value="Secondary Warehouse">Secondary Warehouse</SelectItem>
                  <SelectItem value="Production Facility">Production Facility</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Payment Terms</Label>
              <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NET15">NET 15</SelectItem>
                  <SelectItem value="NET30">NET 30</SelectItem>
                  <SelectItem value="NET45">NET 45</SelectItem>
                  <SelectItem value="NET60">NET 60</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Materials</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="w-4 h-4 mr-1" />
                Add Material
              </Button>
            </div>

            {lineItems.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead className="w-24">Quantity</TableHead>
                    <TableHead className="w-32">Unit Cost</TableHead>
                    <TableHead className="w-24">Lead Time</TableHead>
                    <TableHead className="w-32">Line Total</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Select
                          value={item.material_id}
                          onValueChange={value => updateLineItem(index, 'material_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select material" />
                          </SelectTrigger>
                          <SelectContent>
                            {materials.map(material => (
                              <SelectItem key={material.id} value={material.id}>
                                {material.entity_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e =>
                            updateLineItem(index, 'quantity', parseInt(e.target.value))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.unit_cost}
                          onChange={e =>
                            updateLineItem(index, 'unit_cost', parseFloat(e.target.value))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {item.lead_time_days} days
                        </div>
                      </TableCell>
                      <TableCell>{(item.quantity * item.unit_cost).toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLineItem(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {lineItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No materials added. Click "Add Material" to start.
              </div>
            )}
          </div>

          {/* Expected Delivery */}
          {expectedDelivery && (
            <Alert className="border-blue-200 bg-blue-50">
              <Package className="h-4 w-4 text-primary" />
              <AlertDescription className="text-blue-800">
                <strong>Expected Delivery:</strong> {formatDate(expectedDelivery, 'PPP')}
                <span className="text-sm ml-2">
                  (Based on maximum lead time of{' '}
                  {Math.max(...lineItems.map(i => i.lead_time_days || 14))} days)
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Approval Required */}
          {approvalInfo?.required && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Approval Required:</strong> {approvalInfo.rule}
                <br />
                This purchase order exceeds AED {approvalInfo.threshold} and requires approval from:{' '}
                {approvalInfo.approvers?.join(', ')}
              </AlertDescription>
            </Alert>
          )}

          {/* Success/Error Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Summary and Actions */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Total Amount</div>
                  <div className="text-2xl font-bold">AED {calculateTotal().toFixed(2)}</div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">
                      {lineItems.length} Item{lineItems.length !== 1 ? 's' : ''}
                    </Badge>
                    <Badge variant="outline">Payment: {paymentTerms}</Badge>
                    {approvalInfo?.required && <Badge variant="secondary">Requires Approval</Badge>}
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={loading || lineItems.length === 0 || !selectedSupplier}
                  size="lg"
                >
                  {loading ? 'Creating...' : 'Create Purchase Order'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
