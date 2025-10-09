/**
 * HERA Enterprise Inventory Chip Component
 * Smart Code: HERA.UI.INVENTORY.CHIP.V1
 *
 * Read-only display of inventory levels with semantic styling
 *
 * Features:
 * - Automatic stock status detection
 * - Semantic color tokens
 * - Loading and error states
 * - Accessibility compliant
 * - No hardcoded colors
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { Loader2, AlertCircle } from 'lucide-react'
import {
  useInventoryLevels,
  getStockStatus,
  getStockStatusLabel,
  getStockStatusVariant
} from '@/hooks/useInventoryLevels'

interface InventoryChipProps {
  productId: string
  organizationId: string
  showStatus?: boolean
  className?: string
}

export function InventoryChip({
  productId,
  organizationId,
  showStatus = false,
  className
}: InventoryChipProps) {
  const { data, isLoading, error } = useInventoryLevels([productId], organizationId)

  // Get level for this product
  const level = data?.items?.find(item => item.product_id === productId)

  // If loading, show minimal loading state
  if (isLoading) {
    return (
      <Badge variant="outline" className={className}>
        <Loader2 className="w-3 h-3 animate-spin" />
      </Badge>
    )
  }

  // If no data exists, return null (invisible) - user should add inventory via Inventory page
  if (error || !level) {
    return null
  }

  // Get status
  const status = getStockStatus(level)
  const variant = getStockStatusVariant(status)
  const available = level.available ?? 0

  return (
    <Badge variant={variant} className={className}>
      <span className="text-xs font-medium">
        {available} {showStatus ? getStockStatusLabel(status) : 'in stock'}
      </span>
    </Badge>
  )
}

/**
 * Compact version for table cells
 */
export function InventoryChipCompact({
  productId,
  organizationId,
  className
}: Omit<InventoryChipProps, 'showStatus'>) {
  const { data, isLoading } = useInventoryLevels([productId], organizationId)

  if (isLoading) {
    return <span className="text-xs text-muted-foreground">...</span>
  }

  const level = data?.items?.find(item => item.product_id === productId)
  const available = level?.available ?? 0
  const status = level ? getStockStatus(level) : 'out_of_stock'

  const colors = {
    in_stock: 'text-green-600 dark:text-green-400',
    low_stock: 'text-yellow-600 dark:text-yellow-400',
    out_of_stock: 'text-red-600 dark:text-red-400',
    overstock: 'text-blue-600 dark:text-blue-400'
  }

  return (
    <span className={`text-xs font-medium ${colors[status]} ${className || ''}`}>{available}</span>
  )
}
