'use client'

/**
 * Enterprise Branch Stock Manager Component
 *
 * Features:
 * - Visual stock level indicators per branch
 * - Quick stock adjustments
 * - Low stock warnings
 * - Stock value calculations
 * - Beautiful glassmorphic design
 */

import { useState, useEffect } from 'react'
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Edit2,
  Check,
  X
} from 'lucide-react'
import { SalonLuxeButton } from '@/components/salon/shared/SalonLuxeButton'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { BranchStock, ProductInventory } from '@/types/inventory'
import { getStockStatus, calculateStockValue } from '@/types/inventory'

const COLORS = {
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323',
  gold: '#D4AF37',
  emerald: '#0F6F5C',
  rose: '#E8B4B8',
  lightText: '#E0E0E0'
}

interface BranchStockManagerProps {
  productId: string
  inventory: ProductInventory
  onStockUpdate: (branchId: string, quantity: number, reorderLevel: number) => Promise<void>
  onQuickAdjust?: (branchId: string, type: 'increase' | 'decrease', amount: number) => Promise<void>
}

interface EditingStock {
  branchId: string
  quantity: string
  reorderLevel: string
}

export function BranchStockManager({
  productId,
  inventory,
  onStockUpdate,
  onQuickAdjust
}: BranchStockManagerProps) {
  const [editing, setEditing] = useState<EditingStock | null>(null)
  const [saving, setSaving] = useState(false)

  const getStatusColor = (status: BranchStock['status']) => {
    switch (status) {
      case 'out_of_stock':
        return '#EF4444'
      case 'low_stock':
        return '#F59E0B'
      case 'in_stock':
        return '#10B981'
      case 'overstock':
        return '#3B82F6'
      default:
        return COLORS.lightText
    }
  }

  const getStatusLabel = (status: BranchStock['status']) => {
    switch (status) {
      case 'out_of_stock':
        return 'Out of Stock'
      case 'low_stock':
        return 'Low Stock'
      case 'in_stock':
        return 'In Stock'
      case 'overstock':
        return 'Overstock'
      default:
        return 'Unknown'
    }
  }

  const handleStartEdit = (branch: BranchStock) => {
    setEditing({
      branchId: branch.branch_id,
      quantity: branch.quantity.toString(),
      reorderLevel: branch.reorder_level.toString()
    })
  }

  const handleSaveEdit = async () => {
    if (!editing) return

    try {
      setSaving(true)
      await onStockUpdate(
        editing.branchId,
        parseInt(editing.quantity) || 0,
        parseInt(editing.reorderLevel) || 10
      )
      setEditing(null)
    } catch (error) {
      console.error('Failed to update stock:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditing(null)
  }

  const handleQuickAdjust = async (branchId: string, type: 'increase' | 'decrease') => {
    if (!onQuickAdjust) return

    try {
      setSaving(true)
      await onQuickAdjust(branchId, type, 1)
    } catch (error) {
      console.error('Failed to adjust stock:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div
          style={{
            background: `linear-gradient(135deg, ${COLORS.charcoalLight}CC 0%, ${COLORS.charcoalDark}CC 100%)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${COLORS.gold}40`,
            borderRadius: '12px',
            padding: '16px'
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4" style={{ color: COLORS.gold }} />
            <span className="text-xs font-medium" style={{ color: COLORS.lightText }}>
              Total Stock
            </span>
          </div>
          <div className="text-2xl font-bold" style={{ color: COLORS.gold }}>
            {inventory.total_quantity}
          </div>
          <div className="text-xs mt-1" style={{ color: COLORS.lightText + '80' }}>
            units across {inventory.branch_stocks.length} branches
          </div>
        </div>

        <div
          style={{
            background: `linear-gradient(135deg, ${COLORS.charcoalLight}CC 0%, ${COLORS.charcoalDark}CC 100%)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${COLORS.emerald}40`,
            borderRadius: '12px',
            padding: '16px'
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4" style={{ color: COLORS.emerald }} />
            <span className="text-xs font-medium" style={{ color: COLORS.lightText }}>
              Total Value
            </span>
          </div>
          <div className="text-2xl font-bold" style={{ color: COLORS.emerald }}>
            AED {inventory.total_value.toFixed(2)}
          </div>
          <div className="text-xs mt-1" style={{ color: COLORS.lightText + '80' }}>
            @ AED {inventory.cost_price.toFixed(2)}/unit
          </div>
        </div>

        <div
          style={{
            background: `linear-gradient(135deg, ${COLORS.charcoalLight}CC 0%, ${COLORS.charcoalDark}CC 100%)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${COLORS.rose}40`,
            borderRadius: '12px',
            padding: '16px'
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" style={{ color: COLORS.rose }} />
            <span className="text-xs font-medium" style={{ color: COLORS.lightText }}>
              Low Stock
            </span>
          </div>
          <div className="text-2xl font-bold" style={{ color: COLORS.rose }}>
            {
              inventory.branch_stocks.filter(
                bs => bs.status === 'low_stock' || bs.status === 'out_of_stock'
              ).length
            }
          </div>
          <div className="text-xs mt-1" style={{ color: COLORS.lightText + '80' }}>
            branches need restocking
          </div>
        </div>
      </div>

      {/* Branch Stock Levels */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold" style={{ color: COLORS.lightText }}>
          Stock Levels by Branch
        </h4>

        {inventory.branch_stocks.map(branch => {
          const isEditing = editing?.branchId === branch.branch_id
          const statusColor = getStatusColor(branch.status)

          return (
            <div
              key={branch.branch_id}
              style={{
                background: `linear-gradient(135deg, ${COLORS.charcoalLight}CC 0%, ${COLORS.charcoalDark}CC 100%)`,
                backdropFilter: 'blur(20px)',
                border: `1px solid ${statusColor}40`,
                borderRadius: '12px',
                padding: '16px',
                transition: 'all 0.3s ease'
              }}
            >
              <div className="flex items-center justify-between">
                {/* Branch Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h5 className="font-semibold" style={{ color: COLORS.lightText }}>
                      {branch.branch_name}
                    </h5>
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: statusColor,
                        color: statusColor,
                        backgroundColor: `${statusColor}20`
                      }}
                    >
                      {getStatusLabel(branch.status)}
                    </Badge>
                  </div>

                  {isEditing ? (
                    // Edit Mode
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-xs" style={{ color: COLORS.lightText + '80' }}>
                          Quantity
                        </label>
                        <Input
                          type="number"
                          value={editing.quantity}
                          onChange={e => setEditing({ ...editing, quantity: e.target.value })}
                          className="mt-1"
                          style={{
                            backgroundColor: COLORS.charcoalDark,
                            borderColor: COLORS.gold + '40',
                            color: COLORS.lightText
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs" style={{ color: COLORS.lightText + '80' }}>
                          Reorder Level
                        </label>
                        <Input
                          type="number"
                          value={editing.reorderLevel}
                          onChange={e => setEditing({ ...editing, reorderLevel: e.target.value })}
                          className="mt-1"
                          style={{
                            backgroundColor: COLORS.charcoalDark,
                            borderColor: COLORS.gold + '40',
                            color: COLORS.lightText
                          }}
                        />
                      </div>
                      <div className="flex gap-2 mt-6">
                        <SalonLuxeButton
                          size="sm"
                          variant="primary"
                          onClick={handleSaveEdit}
                          disabled={saving}
                          loading={saving}
                          icon={<Check className="w-4 h-4" />}
                        >
                          Save
                        </SalonLuxeButton>
                        <SalonLuxeButton
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={saving}
                          icon={<X className="w-4 h-4" />}
                        >
                          Cancel
                        </SalonLuxeButton>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-center gap-6">
                      <div>
                        <div className="text-xs" style={{ color: COLORS.lightText + '80' }}>
                          Quantity
                        </div>
                        <div className="text-xl font-bold" style={{ color: statusColor }}>
                          {branch.quantity}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs" style={{ color: COLORS.lightText + '80' }}>
                          Reorder At
                        </div>
                        <div className="text-sm font-medium" style={{ color: COLORS.lightText }}>
                          {branch.reorder_level}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs" style={{ color: COLORS.lightText + '80' }}>
                          Value
                        </div>
                        <div className="text-sm font-medium" style={{ color: COLORS.gold }}>
                          AED {(branch.value || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {!isEditing && (
                  <div className="flex items-center gap-2">
                    {onQuickAdjust && (
                      <>
                        <SalonLuxeButton
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickAdjust(branch.branch_id, 'decrease')}
                          disabled={saving || branch.quantity === 0}
                          icon={<Minus className="w-4 h-4" />}
                        />
                        <SalonLuxeButton
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickAdjust(branch.branch_id, 'increase')}
                          disabled={saving}
                          icon={<Plus className="w-4 h-4" />}
                        />
                      </>
                    )}
                    <SalonLuxeButton
                      size="sm"
                      variant="outline"
                      onClick={() => handleStartEdit(branch)}
                      disabled={saving}
                      icon={<Edit2 className="w-4 h-4" />}
                    />
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: COLORS.charcoalDark }}
                >
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${Math.min((branch.quantity / (branch.reorder_level * 3)) * 100, 100)}%`,
                      backgroundColor: statusColor
                    }}
                  />
                </div>
              </div>
            </div>
          )
        })}

        {inventory.branch_stocks.length === 0 && (
          <div
            style={{
              background: `linear-gradient(135deg, ${COLORS.charcoalLight}CC 0%, ${COLORS.charcoalDark}CC 100%)`,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${COLORS.gold}40`,
              borderRadius: '12px',
              padding: '32px',
              textAlign: 'center'
            }}
          >
            <Package className="w-12 h-12 mx-auto mb-3" style={{ color: COLORS.gold + '60' }} />
            <p className="text-sm" style={{ color: COLORS.lightText + '80' }}>
              No stock levels configured. Add this product to branches to track inventory.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
