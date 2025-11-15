'use client'

/**
 * HERA Inventory Movement Modal
 *
 * Transaction-Driven Architecture:
 * - ALL inventory movements are transactions (universal_transactions)
 * - stock_entity is a projection (updated by posting processor)
 * - Finance DNA integration for COGS/valuation
 * - Supports: OPENING, RECEIPT, ADJUSTMENT, ISSUE movements
 */

import React, { useEffect, useState } from 'react'
import { X, Package, TrendingUp, TrendingDown, RefreshCw, AlertCircle } from 'lucide-react'
import { SalonLuxeButton } from '@/components/salon/shared/SalonLuxeButton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { apiV2 } from '@/lib/client/fetchV2'
import { INVENTORY_SMART_CODES } from '@/lib/finance/smart-codes-finance-dna-v2'

const COLORS = {
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323',
  gold: '#D4AF37',
  emerald: '#0F6F5C',
  rose: '#E8B4B8',
  lightText: '#E0E0E0'
}

export type MovementType = 'OPENING' | 'RECEIPT' | 'ADJUSTMENT' | 'ISSUE'

interface MovementTypeConfig {
  label: string
  icon: typeof Package
  color: string
  description: string
  smartCode: string
  transactionType: string
}

const MOVEMENT_TYPES: Record<MovementType, MovementTypeConfig> = {
  OPENING: {
    label: 'Opening Stock',
    icon: Package,
    color: COLORS.gold,
    description: 'Initial stock load for product at location',
    smartCode: INVENTORY_SMART_CODES.TRANSACTION.OPENING,
    transactionType: 'INVENTORY_OPENING'
  },
  RECEIPT: {
    label: 'Stock Receipt',
    icon: TrendingUp,
    color: COLORS.emerald,
    description: 'Receiving stock from purchase order or supplier',
    smartCode: INVENTORY_SMART_CODES.TRANSACTION.RECEIPT,
    transactionType: 'INVENTORY_RECEIPT'
  },
  ADJUSTMENT: {
    label: 'Stock Adjustment',
    icon: RefreshCw,
    color: '#F59E0B',
    description: 'Cycle count corrections or physical adjustments',
    smartCode: INVENTORY_SMART_CODES.TRANSACTION.ADJUSTMENT,
    transactionType: 'INVENTORY_ADJUSTMENT'
  },
  ISSUE: {
    label: 'Stock Issue',
    icon: TrendingDown,
    color: COLORS.rose,
    description: 'Manual stock usage or service consumption',
    smartCode: INVENTORY_SMART_CODES.TRANSACTION.ISSUE,
    transactionType: 'INVENTORY_ISSUE'
  }
}

interface InventoryMovementModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  movementType: MovementType
  productId?: string
  locationId?: string
}

export function InventoryMovementModal({
  isOpen,
  onClose,
  onSuccess,
  movementType,
  productId: initialProductId,
  locationId: initialLocationId
}: InventoryMovementModalProps) {
  const { user, organization } = useHERAAuth()

  // Form state
  const [productId, setProductId] = useState(initialProductId || '')
  const [locationId, setLocationId] = useState(initialLocationId || '')
  const [quantity, setQuantity] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [reference, setReference] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')

  // Data state
  const [products, setProducts] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [currentStock, setCurrentStock] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const config = MOVEMENT_TYPES[movementType]
  const Icon = config.icon

  // Load products and locations
  useEffect(() => {
    if (!isOpen || !organization?.id) return

    async function loadData() {
      setLoading(true)
      setError(null)

      try {
        // Load products
        const productsResult = await apiV2.get('entities', {
          p_organization_id: organization.id,
          p_entity_type: 'PRODUCT',
          p_status: 'active'
        })

        if (productsResult.error) throw new Error(productsResult.error.message)
        setProducts(productsResult.data?.data || [])

        // Load locations (branches)
        const locationsResult = await apiV2.get('entities', {
          p_organization_id: organization.id,
          p_entity_type: 'BRANCH',
          p_status: 'active'
        })

        if (locationsResult.error) throw new Error(locationsResult.error.message)
        setLocations(locationsResult.data?.data || [])

      } catch (err: any) {
        console.error('Failed to load data:', err)
        setError(err.message || 'Failed to load products and locations')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isOpen, organization?.id])

  // Load current stock level when product and location selected
  useEffect(() => {
    if (!productId || !locationId || !organization?.id) {
      setCurrentStock(null)
      return
    }

    async function loadCurrentStock() {
      try {
        // Query STOCK_ENTITY projection for current stock
        const result = await apiV2.get('entities', {
          p_organization_id: organization.id,
          p_entity_type: 'STOCK_ENTITY',
          p_status: 'active'
        })

        if (result.error) throw new Error(result.error.message)

        const stockEntities = result.data?.data || []

        // Find stock entity for this product + location
        const stockEntity = stockEntities.find((se: any) => {
          const rels = se.relationships || []
          const hasProduct = rels.some((r: any) =>
            r.relationship_type === 'STOCK_OF_PRODUCT' && r.to_entity_id === productId
          )
          const hasLocation = rels.some((r: any) =>
            r.relationship_type === 'STOCK_AT_LOCATION' && r.to_entity_id === locationId
          )
          return hasProduct && hasLocation
        })

        if (stockEntity) {
          // Get quantity from dynamic data
          const quantityField = stockEntity.dynamic_data?.find((d: any) => d.field_name === 'quantity')
          setCurrentStock(quantityField?.field_value_number || 0)
        } else {
          setCurrentStock(0)
        }

      } catch (err) {
        console.error('Failed to load current stock:', err)
        setCurrentStock(null)
      }
    }

    loadCurrentStock()
  }, [productId, locationId, organization?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.id || !organization?.id) {
      setError('Authentication required')
      return
    }

    if (!productId || !locationId || !quantity || !costPrice) {
      setError('Please fill all required fields')
      return
    }

    const qty = parseFloat(quantity)
    const cost = parseFloat(costPrice)

    if (isNaN(qty) || qty <= 0) {
      setError('Quantity must be a positive number')
      return
    }

    if (isNaN(cost) || cost < 0) {
      setError('Cost price must be a valid number')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Generate transaction number
      const timestamp = Date.now()
      const txnNumber = `${config.transactionType}-${timestamp}`

      // Calculate total amount
      const totalAmount = qty * cost

      // Create inventory movement transaction
      const txnPayload = {
        p_action: 'CREATE',
        p_actor_user_id: user.entity_id || user.id,
        p_organization_id: organization.id,
        p_transaction: {
          transaction_type: config.transactionType,
          smart_code: config.smartCode,
          transaction_number: txnNumber,
          transaction_date: new Date().toISOString(),
          source_entity_id: productId,
          target_entity_id: locationId,
          total_amount: totalAmount,
          transaction_status: 'completed',
          metadata: {
            movement_type: movementType,
            reference: reference || undefined,
            reason: reason || undefined,
            notes: notes || undefined,
            posted_to_inventory: false, // Posting processor will update this
            posted_to_finance: false
          }
        },
        p_lines: [
          {
            line_number: 1,
            line_type: 'INVENTORY_MOVEMENT',
            entity_id: productId,
            quantity: qty.toString(),
            unit_amount: cost,
            line_amount: totalAmount,
            description: `${config.label} - ${products.find(p => p.id === productId)?.entity_name || 'Unknown'}`,
            smart_code: config.smartCode,
            line_data: {
              location_id: locationId,
              cost_price: cost,
              movement_type: movementType
            }
          }
        ],
        p_options: {}
      }

      // Call RPC via API v2
      const result = await apiV2.post('transactions/rpc', txnPayload)

      if (result.error) {
        throw new Error(result.error.message || 'Failed to create transaction')
      }

      console.log('✅ Inventory movement transaction created:', result.data)

      // Trigger posting processor to update STOCK_ENTITY projection
      const transactionId = result.data?.data?.id
      if (transactionId) {
        console.log('📦 Triggering inventory posting processor...')

        // Import the processor dynamically to avoid circular dependencies
        const { processInventoryTransaction } = await import('@/services/inventory-posting-processor')

        const processorResult = await processInventoryTransaction({
          transactionId,
          organizationId: organization.id,
          actorUserId: user.entity_id || user.id
        })

        if (processorResult.success) {
          console.log(`✅ Stock projection updated: ${processorResult.stockEntitiesUpdated} entities`)
        } else {
          console.error('⚠️ Posting processor failed:', processorResult.error)
          // Don't fail the whole operation - transaction is already created
        }
      }

      // Reset form
      setQuantity('')
      setCostPrice('')
      setReference('')
      setReason('')
      setNotes('')

      // Call success callback
      onSuccess?.()

      // Close modal
      onClose()

    } catch (err: any) {
      console.error('Failed to create inventory movement:', err)
      setError(err.message || 'Failed to create inventory movement')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{
          background: `linear-gradient(135deg, ${COLORS.charcoalLight} 0%, ${COLORS.charcoalDark} 100%)`,
          borderRadius: '16px',
          border: `1px solid ${config.color}40`
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between p-6 border-b"
          style={{
            borderColor: `${config.color}40`,
            background: `linear-gradient(135deg, ${COLORS.charcoalLight} 0%, ${COLORS.charcoalDark} 100%)`
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${config.color}20` }}
            >
              <Icon className="w-6 h-6" style={{ color: config.color }} />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: COLORS.lightText }}>
                {config.label}
              </h2>
              <p className="text-sm" style={{ color: COLORS.lightText + '80' }}>
                {config.description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            style={{ color: COLORS.lightText }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Alert */}
          {error && (
            <div
              className="p-4 rounded-lg flex items-start gap-3"
              style={{ backgroundColor: `${COLORS.rose}20`, border: `1px solid ${COLORS.rose}` }}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: COLORS.rose }} />
              <p className="text-sm" style={{ color: COLORS.rose }}>
                {error}
              </p>
            </div>
          )}

          {/* Product Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium" style={{ color: COLORS.lightText }}>
              Product <span style={{ color: COLORS.rose }}>*</span>
            </Label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              disabled={loading || !!initialProductId}
              required
              className="w-full min-h-[44px] px-4 rounded-lg border transition-colors"
              style={{
                backgroundColor: COLORS.charcoalDark,
                borderColor: `${COLORS.gold}40`,
                color: COLORS.lightText
              }}
            >
              <option value="">Select product...</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.entity_name} ({product.entity_code || 'No code'})
                </option>
              ))}
            </select>
          </div>

          {/* Location Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium" style={{ color: COLORS.lightText }}>
              Location (Branch) <span style={{ color: COLORS.rose }}>*</span>
            </Label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              disabled={loading || !!initialLocationId}
              required
              className="w-full min-h-[44px] px-4 rounded-lg border transition-colors"
              style={{
                backgroundColor: COLORS.charcoalDark,
                borderColor: `${COLORS.gold}40`,
                color: COLORS.lightText
              }}
            >
              <option value="">Select location...</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.entity_name}
                </option>
              ))}
            </select>
          </div>

          {/* Current Stock Display */}
          {currentStock !== null && (
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: `${COLORS.emerald}20`, border: `1px solid ${COLORS.emerald}40` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: COLORS.lightText }}>
                  Current Stock:
                </span>
                <Badge
                  variant="outline"
                  style={{
                    borderColor: COLORS.emerald,
                    color: COLORS.emerald,
                    backgroundColor: `${COLORS.emerald}20`
                  }}
                >
                  {currentStock} units
                </Badge>
              </div>
            </div>
          )}

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium" style={{ color: COLORS.lightText }}>
              Quantity <span style={{ color: COLORS.rose }}>*</span>
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              required
              className="min-h-[44px]"
              style={{
                backgroundColor: COLORS.charcoalDark,
                borderColor: `${COLORS.gold}40`,
                color: COLORS.lightText
              }}
            />
          </div>

          {/* Cost Price Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium" style={{ color: COLORS.lightText }}>
              Cost Price (AED) <span style={{ color: COLORS.rose }}>*</span>
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              placeholder="0.00"
              required
              className="min-h-[44px]"
              style={{
                backgroundColor: COLORS.charcoalDark,
                borderColor: `${COLORS.gold}40`,
                color: COLORS.lightText
              }}
            />
          </div>

          {/* Reference Input (optional) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium" style={{ color: COLORS.lightText }}>
              Reference (PO Number, Invoice, etc.)
            </Label>
            <Input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Optional reference number"
              className="min-h-[44px]"
              style={{
                backgroundColor: COLORS.charcoalDark,
                borderColor: `${COLORS.gold}40`,
                color: COLORS.lightText
              }}
            />
          </div>

          {/* Reason Input (for adjustments) */}
          {movementType === 'ADJUSTMENT' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium" style={{ color: COLORS.lightText }}>
                Adjustment Reason
              </Label>
              <Input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="E.g., Physical count correction, damaged goods"
                className="min-h-[44px]"
                style={{
                  backgroundColor: COLORS.charcoalDark,
                  borderColor: `${COLORS.gold}40`,
                  color: COLORS.lightText
                }}
              />
            </div>
          )}

          {/* Notes Input (optional) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium" style={{ color: COLORS.lightText }}>
              Notes
            </Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
              className="w-full px-4 py-2 rounded-lg border transition-colors resize-none"
              style={{
                backgroundColor: COLORS.charcoalDark,
                borderColor: `${COLORS.gold}40`,
                color: COLORS.lightText
              }}
            />
          </div>

          {/* Finance Impact Preview */}
          {quantity && costPrice && (
            <div
              className="p-4 rounded-lg space-y-2"
              style={{ backgroundColor: `${COLORS.gold}20`, border: `1px solid ${COLORS.gold}40` }}
            >
              <h4 className="text-sm font-semibold" style={{ color: COLORS.gold }}>
                Finance Impact
              </h4>
              <div className="space-y-1 text-sm" style={{ color: COLORS.lightText + '80' }}>
                <div className="flex justify-between">
                  <span>Transaction Value:</span>
                  <span className="font-medium" style={{ color: COLORS.lightText }}>
                    AED {(parseFloat(quantity) * parseFloat(costPrice)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>GL Posting:</span>
                  <span className="font-medium" style={{ color: COLORS.lightText }}>
                    Auto (Finance DNA)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <SalonLuxeButton
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="flex-1 min-h-[48px]"
            >
              Cancel
            </SalonLuxeButton>
            <SalonLuxeButton
              type="submit"
              variant="primary"
              disabled={saving || loading}
              loading={saving}
              className="flex-1 min-h-[48px]"
              icon={<Icon className="w-5 h-5" />}
            >
              {saving ? 'Creating...' : 'Create Movement'}
            </SalonLuxeButton>
          </div>
        </form>
      </div>
    </div>
  )
}
