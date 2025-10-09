'use client'

/**
 * Enterprise Stock Transfer Dialog
 *
 * Features:
 * - Transfer stock between branches
 * - Multi-product transfers
 * - Availability checking
 * - Transfer history
 * - Beautiful UI with glassmorphic design
 */

import { useState } from 'react'
import { ArrowRight, Package, AlertCircle, CheckCircle2, Truck } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { StockTransferInput } from '@/types/inventory'

const COLORS = {
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323',
  gold: '#D4AF37',
  emerald: '#0F6F5C',
  rose: '#E8B4B8',
  lightText: '#E0E0E0'
}

interface Branch {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  code?: string
  available_qty: number
  cost_price: number
}

interface TransferItem {
  product_id: string
  product_name: string
  quantity: number
  available: number
  cost_price: number
}

interface StockTransferDialogProps {
  open: boolean
  onClose: () => void
  branches: Branch[]
  products: Product[]
  currentBranchId?: string
  onTransfer: (data: StockTransferInput) => Promise<void>
}

export function StockTransferDialog({
  open,
  onClose,
  branches,
  products,
  currentBranchId,
  onTransfer
}: StockTransferDialogProps) {
  const [fromBranchId, setFromBranchId] = useState(currentBranchId || '')
  const [toBranchId, setToBranchId] = useState('')
  const [items, setItems] = useState<TransferItem[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const availableProducts = products.filter(p => !items.some(item => item.product_id === p.id))

  const handleAddItem = () => {
    const product = products.find(p => p.id === selectedProductId)
    if (!product || quantity <= 0) return

    setItems([
      ...items,
      {
        product_id: product.id,
        product_name: product.name,
        quantity,
        available: product.available_qty,
        cost_price: product.cost_price
      }
    ])

    setSelectedProductId('')
    setQuantity(1)
  }

  const handleRemoveItem = (productId: string) => {
    setItems(items.filter(item => item.product_id !== productId))
  }

  const handleUpdateQuantity = (productId: string, newQty: number) => {
    setItems(
      items.map(item =>
        item.product_id === productId
          ? { ...item, quantity: Math.max(1, Math.min(newQty, item.available)) }
          : item
      )
    )
  }

  const canTransfer =
    fromBranchId &&
    toBranchId &&
    items.length > 0 &&
    items.every(item => item.quantity <= item.available)

  const totalValue = items.reduce((sum, item) => sum + item.quantity * item.cost_price, 0)
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  const handleSubmit = async () => {
    if (!canTransfer) return

    try {
      setLoading(true)
      await onTransfer({
        from_branch_id: fromBranchId,
        to_branch_id: toBranchId,
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        })),
        notes: notes || undefined
      })

      // Reset form
      setFromBranchId(currentBranchId || '')
      setToBranchId('')
      setItems([])
      setNotes('')
      onClose()
    } catch (error) {
      console.error('Transfer failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl"
        style={{
          backgroundColor: COLORS.charcoalDark,
          border: `1px solid ${COLORS.gold}40`
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: COLORS.gold }}>Stock Transfer</DialogTitle>
          <DialogDescription style={{ color: COLORS.lightText + '80' }}>
            Transfer inventory between branches
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Branch Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: COLORS.lightText }}>
                From Branch
              </label>
              <Select value={fromBranchId} onValueChange={setFromBranchId}>
                <SelectTrigger
                  style={{
                    backgroundColor: COLORS.charcoalLight,
                    borderColor: COLORS.gold + '40',
                    color: COLORS.lightText
                  }}
                >
                  <SelectValue placeholder="Select source branch" />
                </SelectTrigger>
                <SelectContent className="hera-select-content">
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block" style={{ color: COLORS.lightText }}>
                To Branch
              </label>
              <Select value={toBranchId} onValueChange={setToBranchId}>
                <SelectTrigger
                  style={{
                    backgroundColor: COLORS.charcoalLight,
                    borderColor: COLORS.gold + '40',
                    color: COLORS.lightText
                  }}
                >
                  <SelectValue placeholder="Select destination branch" />
                </SelectTrigger>
                <SelectContent className="hera-select-content">
                  {branches
                    .filter(b => b.id !== fromBranchId)
                    .map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Add Items */}
          {fromBranchId && toBranchId && (
            <div
              style={{
                background: `linear-gradient(135deg, ${COLORS.charcoalLight}CC 0%, ${COLORS.charcoalDark}CC 100%)`,
                backdropFilter: 'blur(20px)',
                border: `1px solid ${COLORS.gold}40`,
                borderRadius: '12px',
                padding: '16px'
              }}
            >
              <h4 className="text-sm font-semibold mb-3" style={{ color: COLORS.lightText }}>
                Add Products
              </h4>

              <div className="flex gap-3">
                <div className="flex-1">
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger
                      style={{
                        backgroundColor: COLORS.charcoalLight,
                        borderColor: COLORS.gold + '40',
                        color: COLORS.lightText
                      }}
                    >
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent className="hera-select-content">
                      {availableProducts.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} (Available: {product.available_qty})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Input
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                  placeholder="Quantity"
                  className="w-32"
                  style={{
                    backgroundColor: COLORS.charcoalLight,
                    borderColor: COLORS.gold + '40',
                    color: COLORS.lightText
                  }}
                />

                <Button
                  onClick={handleAddItem}
                  disabled={!selectedProductId}
                  style={{ backgroundColor: COLORS.emerald, color: 'white' }}
                >
                  Add Item
                </Button>
              </div>
            </div>
          )}

          {/* Transfer Items List */}
          {items.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold" style={{ color: COLORS.lightText }}>
                Transfer Items ({items.length})
              </h4>

              {items.map(item => (
                <div
                  key={item.product_id}
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.charcoalLight}CC 0%, ${COLORS.charcoalDark}CC 100%)`,
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${COLORS.gold}40`,
                    borderRadius: '12px',
                    padding: '12px'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium" style={{ color: COLORS.lightText }}>
                        {item.product_name}
                      </div>
                      <div className="text-xs mt-1" style={{ color: COLORS.lightText + '80' }}>
                        Available: {item.available} | Value: AED{' '}
                        {(item.quantity * item.cost_price).toFixed(2)}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={e =>
                          handleUpdateQuantity(item.product_id, parseInt(e.target.value) || 1)
                        }
                        className="w-24"
                        style={{
                          backgroundColor: COLORS.charcoalDark,
                          borderColor: COLORS.gold + '40',
                          color: COLORS.lightText
                        }}
                      />

                      {item.quantity > item.available && (
                        <AlertCircle className="w-4 h-4" style={{ color: COLORS.rose }} />
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveItem(item.product_id)}
                        style={{ color: COLORS.rose }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Summary */}
              <div
                style={{
                  background: `linear-gradient(135deg, ${COLORS.gold}20 0%, ${COLORS.gold}10 100%)`,
                  border: `1px solid ${COLORS.gold}60`,
                  borderRadius: '12px',
                  padding: '16px'
                }}
              >
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs" style={{ color: COLORS.lightText + '80' }}>
                      Total Items
                    </div>
                    <div className="text-xl font-bold" style={{ color: COLORS.gold }}>
                      {totalItems}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: COLORS.lightText + '80' }}>
                      Total Value
                    </div>
                    <div className="text-xl font-bold" style={{ color: COLORS.gold }}>
                      AED {totalValue.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: COLORS.lightText + '80' }}>
                      Status
                    </div>
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: canTransfer ? COLORS.emerald : COLORS.rose,
                        color: canTransfer ? COLORS.emerald : COLORS.rose,
                        backgroundColor: canTransfer ? `${COLORS.emerald}20` : `${COLORS.rose}20`
                      }}
                    >
                      {canTransfer ? 'Ready' : 'Check Quantities'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: COLORS.lightText }}>
              Notes (Optional)
            </label>
            <Input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add transfer notes..."
              style={{
                backgroundColor: COLORS.charcoalLight,
                borderColor: COLORS.gold + '40',
                color: COLORS.lightText
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              style={{ borderColor: COLORS.gold + '40', color: COLORS.lightText }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canTransfer || loading}
              style={{ backgroundColor: COLORS.gold, color: COLORS.charcoalDark }}
            >
              <Truck className="w-4 h-4 mr-2" />
              {loading ? 'Transferring...' : 'Create Transfer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
