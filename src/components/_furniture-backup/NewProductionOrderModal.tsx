'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Calendar, Factory, Package, AlertCircle, Clock } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { format } from 'date-fns'
import { universalApi } from '@/lib/universal-api'

interface NewProductionOrderModalProps {
  open: boolean
  onClose: () => void
  organizationId: string
  onSuccess?: () => void
}

export default function NewProductionOrderModal({
  open,
  onClose,
  organizationId,
  onSuccess
}: NewProductionOrderModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    productId: '',
    workCenterId: '',
    plannedQuantity: 1,
    plannedStartDate: format(new Date(), 'yyyy-MM-dd'),
    plannedEndDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    priority: 'medium',
    batchNumber: '',
    notes: ''
  })

  const products: any[] = []
  const workCenters: any[] = []

  const generateBatchNumber = () => {
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `BATCH-${year}${month}${day}-${random}`
  }

  useEffect(() => {
    if (open) {
      setFormData({
        productId: '',
        workCenterId: '',
        plannedQuantity: 1,
        plannedStartDate: format(new Date(), 'yyyy-MM-dd'),
        plannedEndDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        priority: 'medium',
        batchNumber: generateBatchNumber(),
        notes: ''
      })
      setError('')
    }
  }, [open])

  const generateOrderCode = () => {
    const timestamp = Date.now().toString(36).toUpperCase()
    return `PROD-${timestamp}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.productId) {
      setError('Please select a product to produce')
      return
    }

    if (!formData.workCenterId) {
      setError('Please select a work center')
      return
    }

    setLoading(true)

    try {
      universalApi.setOrganizationId(organizationId)

      const orderData = {
        organization_id: organizationId,
        transaction_type: 'production_order' as const,
        transaction_code: generateOrderCode(),
        transaction_date: new Date().toISOString(),
        source_entity_id: formData.productId,
        target_entity_id: formData.workCenterId,
        total_amount: formData.plannedQuantity,
        description: `Production order for product`,
        smart_code: 'HERA.FURNITURE.MFG.PROD.ORDER.V1',
        metadata: {
          batch_number: formData.batchNumber,
          planned_start: formData.plannedStartDate,
          planned_end: formData.plannedEndDate,
          priority: formData.priority,
          notes: formData.notes,
          status: 'planned',
          created_at: new Date().toISOString()
        }
      }

      const result = await universalApi.createTransaction({
        ...orderData,
        line_items: [{
          organization_id: organizationId,
          line_number: 1,
          entity_id: formData.productId,
          quantity: formData.plannedQuantity.toString(),
          unit_price: 0,
          line_amount: 0,
          description: `Output`,
          smart_code: 'HERA.FURNITURE.PROD.LINE.OUTPUT.V1',
          metadata: {
            line_type: 'output',
            completed_quantity: 0,
            scrap_quantity: 0
          }
        }]
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to create production order')
      }

      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('Error creating production order:', err)
      setError('Failed to create production order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5" />
            New Production Order
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product">Product to Produce</Label>
              <Select
                value={formData.productId}
                onValueChange={(value) => setFormData({ ...formData, productId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product: any) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.entity_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="workcenter">Work Center</Label>
              <Select
                value={formData.workCenterId}
                onValueChange={(value) => setFormData({ ...formData, workCenterId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select work center" />
                </SelectTrigger>
                <SelectContent>
                  {workCenters.map((center: any) => (
                    <SelectItem key={center.id} value={center.id}>
                      {center.entity_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Planned Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.plannedQuantity}
                onChange={(e) => setFormData({ ...formData, plannedQuantity: parseInt(e.target.value) || 1 })}
                required
              />
            </div>
            <div>
              <Label htmlFor="batch">Batch Number</Label>
              <Input
                id="batch"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-date">Planned Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={formData.plannedStartDate}
                onChange={(e) => setFormData({ ...formData, plannedStartDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="end-date">Planned End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={formData.plannedEndDate}
                onChange={(e) => setFormData({ ...formData, plannedEndDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData({ ...formData, priority: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Production Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Special instructions, materials needed, quality requirements..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Production Order
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}