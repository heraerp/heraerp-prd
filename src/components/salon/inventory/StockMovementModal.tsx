/**
 * Stock Movement Modal
 * Form for creating and editing stock movements
 */

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'

interface StockMovementModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  products: any[]
  movement?: any
}

export function StockMovementModal({
  isOpen,
  onClose,
  onSave,
  products,
  movement
}: StockMovementModalProps) {
  const [formData, setFormData] = useState({
    productId: '',
    movementType: 'in',
    quantity: '',
    unitCost: '',
    reason: '',
    notes: '',
    location: 'main'
  })

  useEffect(() => {
    if (movement) {
      setFormData({
        productId: movement.reference_entity_id || '',
        movementType: (movement.metadata as any)?.movement_type || 'in',
        quantity: (movement.metadata as any)?.quantity?.toString() || '',
        unitCost: (movement.metadata as any)?.unit_cost?.toString() || '',
        reason: (movement.metadata as any)?.reason || '',
        notes: (movement.metadata as any)?.notes || '',
        location: (movement.metadata as any)?.location || 'main'
      })
    } else {
      setFormData({
        productId: '',
        movementType: 'in',
        quantity: '',
        unitCost: '',
        reason: '',
        notes: '',
        location: 'main'
      })
    }
  }, [movement])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const data = {
      ...formData,
      quantity: parseInt(formData.quantity),
      unitCost: parseFloat(formData.unitCost) || 0
    }
    
    onSave(data)
  }

  const movementReasons = {
    in: [
      'Purchase Order Received',
      'Customer Return',
      'Transfer In',
      'Initial Stock',
      'Found Stock',
      'Other'
    ],
    out: [
      'Sold',
      'Used in Service',
      'Transfer Out',
      'Damaged',
      'Expired',
      'Sample',
      'Other'
    ],
    adjustment: [
      'Stock Count Correction',
      'System Adjustment',
      'Reconciliation',
      'Other'
    ]
  }

  const getReasonOptions = () => {
    return movementReasons[formData.movementType as keyof typeof movementReasons] || []
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {movement ? 'Pencil Stock Movement' : 'Add Stock Movement'}
            </DialogTitle>
            <DialogDescription>
              Record inventory changes for products
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Product Selection */}
            <div className="grid gap-2">
              <Label htmlFor="product">Product</Label>
              <Select
                value={formData.productId}
                onValueChange={(value) => setFormData({ ...formData, productId: value })}
                required
              >
                <SelectTrigger id="product">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent className="hera-select-content">
                  {products.map((product) => (
                    <SelectItem 
                      key={product.id} 
                      value={product.id}
                      className="hera-select-item"
                    >
                      <div className="flex justify-between items-center w-full">
                        <span>{product.entity_name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {product.sku || product.entity_code}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Movement Type */}
            <div className="grid gap-2">
              <Label>Movement Type</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={formData.movementType === 'in' ? 'default' : 'outline'}
                  onClick={() => setFormData({ ...formData, movementType: 'in', reason: '' })}
                  className="flex items-center justify-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  Stock In
                </Button>
                <Button
                  type="button"
                  variant={formData.movementType === 'out' ? 'default' : 'outline'}
                  onClick={() => setFormData({ ...formData, movementType: 'out', reason: '' })}
                  className="flex items-center justify-center gap-2"
                >
                  <TrendingDown className="w-4 h-4" />
                  Stock Out
                </Button>
                <Button
                  type="button"
                  variant={formData.movementType === 'adjustment' ? 'default' : 'outline'}
                  onClick={() => setFormData({ ...formData, movementType: 'adjustment', reason: '' })}
                  className="flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Adjust
                </Button>
              </div>
            </div>

            {/* Quantity and Cost */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="Enter quantity"
                  min="1"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unitCost">Unit Cost (Optional)</Label>
                <Input
                  id="unitCost"
                  type="number"
                  step="0.01"
                  value={formData.unitCost}
                  onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Reason */}
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason</Label>
              <Select
                value={formData.reason}
                onValueChange={(value) => setFormData({ ...formData, reason: value })}
                required
              >
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent className="hera-select-content">
                  {getReasonOptions().map((reason) => (
                    <SelectItem 
                      key={reason} 
                      value={reason}
                      className="hera-select-item"
                    >
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Select
                value={formData.location}
                onValueChange={(value) => setFormData({ ...formData, location: value })}
              >
                <SelectTrigger id="location">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="hera-select-content">
                  <SelectItem value="main" className="hera-select-item">Main Storage</SelectItem>
                  <SelectItem value="display" className="hera-select-item">Display Area</SelectItem>
                  <SelectItem value="backroom" className="hera-select-item">Back Room</SelectItem>
                  <SelectItem value="station1" className="hera-select-item">Station 1</SelectItem>
                  <SelectItem value="station2" className="hera-select-item">Station 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any additional notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {movement ? 'Update Movement' : 'Add Movement'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}