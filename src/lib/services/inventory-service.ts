/**
 * HERA Enterprise Inventory Management Service
 *
 * Handles all inventory operations using HERA Universal Architecture:
 * - Branch-specific stock levels via dynamic_data
 * - Stock movements via universal_transactions
 * - Relationships via STOCK_AT
 *
 * Enterprise Features:
 * - Multi-branch inventory tracking
 * - Stock transfers between branches
 * - Automatic low stock alerts
 * - Physical stock counts
 * - Complete audit trail
 */

import { apiV2 } from '@/lib/client/fetchV2'
import type {
  BranchStock,
  ProductInventory,
  StockMovement,
  StockMovementInput,
  StockTransfer,
  StockTransferInput,
  StockCount,
  StockCountInput,
  StockAlert,
  StockAdjustmentInput,
  BranchStockInput
} from '@/types/inventory'
import {
  INVENTORY_SMART_CODES,
  getStockStatus,
  getAlertSeverity,
  calculateStockValue
} from '@/types/inventory'

// ==================== BRANCH STOCK OPERATIONS ====================

/**
 * Get stock levels for a product across all branches
 */
export async function getProductInventory(
  organizationId: string,
  productId: string
): Promise<ProductInventory> {
  // Get product details
  const { data: products } = await apiV2.get('entities', {
    p_organization_id: organizationId,
    p_entity_type: 'product',
    p_entity_id: productId,
    p_include_dynamic: true,
    p_include_relationships: true
  })

  const product = products?.[0]
  if (!product) throw new Error('Product not found')

  // Get all branches this product is stocked at
  const stockAtRels = product.relationships?.stock_at || product.relationships?.STOCK_AT || []
  const branchIds = Array.isArray(stockAtRels)
    ? stockAtRels.map((rel: any) => rel.to_entity?.id).filter(Boolean)
    : [stockAtRels.to_entity?.id].filter(Boolean)

  // Get branch stock levels from dynamic data
  const branchStocks: BranchStock[] = []
  let totalQuantity = 0
  let totalValue = 0

  const costPrice = product.price_cost || product.cost_price || 0
  const sellingPrice = product.price_market || product.selling_price || 0

  for (const branchId of branchIds) {
    // Get stock quantity for this branch
    const { data: stockData } = await apiV2.get('entities/dynamic-data', {
      p_organization_id: organizationId,
      p_entity_id: productId,
      p_field_name: `stock_qty_${branchId}`
    })

    const quantity = stockData?.[0]?.field_value_number || 0

    // Get reorder level for this branch
    const { data: reorderData } = await apiV2.get('entities/dynamic-data', {
      p_organization_id: organizationId,
      p_entity_id: productId,
      p_field_name: `reorder_level_${branchId}`
    })

    const reorderLevel = reorderData?.[0]?.field_value_number || 10

    // Get branch details
    const { data: branches } = await apiV2.get('entities', {
      p_organization_id: organizationId,
      p_entity_id: branchId
    })

    const branch = branches?.[0]
    const value = calculateStockValue(quantity, costPrice)

    branchStocks.push({
      branch_id: branchId,
      branch_name: branch?.entity_name || 'Unknown Branch',
      quantity,
      reorder_level: reorderLevel,
      value,
      status: getStockStatus(quantity, reorderLevel),
      last_updated_at: stockData?.[0]?.updated_at
    })

    totalQuantity += quantity
    totalValue += value
  }

  return {
    product_id: productId,
    product_name: product.entity_name,
    product_code: product.entity_code,
    total_quantity: totalQuantity,
    total_value: totalValue,
    cost_price: costPrice,
    selling_price: sellingPrice,
    branch_stocks: branchStocks,
    requires_inventory: true,
    track_by: 'unit'
  }
}

/**
 * Set stock level for a product at a specific branch
 */
export async function setBranchStock(
  organizationId: string,
  productId: string,
  branchId: string,
  input: BranchStockInput
): Promise<void> {
  // Update stock quantity
  await apiV2.post('entities/dynamic-data', {
    entity_id: productId,
    field_name: `stock_qty_${branchId}`,
    field_type: 'number',
    field_value_number: input.quantity,
    smart_code: INVENTORY_SMART_CODES.BRANCH_STOCK_QTY,
    organization_id: organizationId
  })

  // Update reorder level
  await apiV2.post('entities/dynamic-data', {
    entity_id: productId,
    field_name: `reorder_level_${branchId}`,
    field_type: 'number',
    field_value_number: input.reorder_level,
    smart_code: INVENTORY_SMART_CODES.BRANCH_STOCK_REORDER,
    organization_id: organizationId
  })

  // Create STOCK_AT relationship if it doesn't exist
  await apiV2.post('relationships', {
    from_entity_id: productId,
    to_entity_id: branchId,
    relationship_type: 'STOCK_AT',
    smart_code: 'HERA.SALON.PRODUCT.REL.STOCK_AT.v1',
    organization_id: organizationId
  })

  // Check and create alert if needed
  await checkAndCreateStockAlert(organizationId, productId, branchId, input.quantity, input.reorder_level)
}

// ==================== STOCK MOVEMENTS ====================

/**
 * Record a stock movement (purchase, sale, transfer, adjustment, etc.)
 */
export async function recordStockMovement(
  organizationId: string,
  userId: string,
  input: StockMovementInput
): Promise<StockMovement> {
  const { product_id, branch_id, movement_type, quantity, unit_cost, from_branch_id, to_branch_id } = input

  // Get current stock level
  const inventory = await getProductInventory(organizationId, product_id)
  const branchStock = inventory.branch_stocks.find(bs => bs.branch_id === branch_id)
  const currentQty = branchStock?.quantity || 0

  // Calculate new quantity based on movement type
  let newQty = currentQty
  const isIncrease = ['purchase', 'transfer_in', 'adjustment_in', 'return_from_customer'].includes(movement_type)
  const isDecrease = ['sale', 'transfer_out', 'adjustment_out', 'return_to_supplier', 'damage', 'expiry', 'sample'].includes(movement_type)

  if (isIncrease) {
    newQty = currentQty + quantity
  } else if (isDecrease) {
    newQty = currentQty - quantity
    if (newQty < 0) throw new Error('Insufficient stock')
  }

  // Get smart code for this movement type
  const smartCodeMap: Record<string, string> = {
    purchase: INVENTORY_SMART_CODES.PURCHASE,
    sale: INVENTORY_SMART_CODES.SALE,
    transfer_out: INVENTORY_SMART_CODES.TRANSFER_OUT,
    transfer_in: INVENTORY_SMART_CODES.TRANSFER_IN,
    adjustment_in: INVENTORY_SMART_CODES.ADJUSTMENT_IN,
    adjustment_out: INVENTORY_SMART_CODES.ADJUSTMENT_OUT,
    return_from_customer: INVENTORY_SMART_CODES.RETURN_CUSTOMER,
    return_to_supplier: INVENTORY_SMART_CODES.RETURN_SUPPLIER,
    damage: INVENTORY_SMART_CODES.DAMAGE,
    expiry: INVENTORY_SMART_CODES.EXPIRY,
    sample: INVENTORY_SMART_CODES.SAMPLE
  }

  const smartCode = smartCodeMap[movement_type] || INVENTORY_SMART_CODES.ADJUSTMENT_IN

  // Create transaction for audit trail
  const { data: txn } = await apiV2.post('transactions', {
    transaction_type: 'stock_movement',
    smart_code: smartCode,
    organization_id: organizationId,
    from_entity_id: product_id,
    to_entity_id: branch_id,
    total_amount: calculateStockValue(quantity, unit_cost || inventory.cost_price),
    metadata: {
      movement_type,
      quantity,
      unit_cost: unit_cost || inventory.cost_price,
      from_branch_id,
      to_branch_id,
      previous_quantity: currentQty,
      new_quantity: newQty,
      reason: input.reason,
      notes: input.notes,
      reference_id: input.reference_id
    },
    created_by: userId
  })

  // Update stock level
  await setBranchStock(organizationId, product_id, branch_id, {
    branch_id,
    quantity: newQty,
    reorder_level: branchStock?.reorder_level || 10
  })

  // If transfer, also update destination branch
  if (movement_type === 'transfer_out' && to_branch_id) {
    await recordStockMovement(organizationId, userId, {
      movement_type: 'transfer_in',
      product_id,
      branch_id: to_branch_id,
      quantity,
      unit_cost: unit_cost || inventory.cost_price,
      from_branch_id: branch_id,
      reference_id: txn.id
    })
  }

  return {
    id: txn.id,
    movement_type,
    product_id,
    branch_id,
    quantity,
    unit_cost: unit_cost || inventory.cost_price,
    total_value: calculateStockValue(quantity, unit_cost || inventory.cost_price),
    from_branch_id,
    to_branch_id,
    reference_id: input.reference_id,
    reason: input.reason,
    notes: input.notes,
    created_by: userId,
    created_at: txn.created_at,
    smart_code: smartCode
  }
}

/**
 * Quick stock adjustment (set, increase, or decrease)
 */
export async function adjustStock(
  organizationId: string,
  userId: string,
  input: StockAdjustmentInput
): Promise<StockMovement> {
  const { product_id, branch_id, adjustment_type, quantity, reason, notes } = input

  let movementType: StockMovementInput['movement_type']
  let finalQuantity = quantity

  switch (adjustment_type) {
    case 'set':
      // Get current qty to determine if increase or decrease
      const inventory = await getProductInventory(organizationId, product_id)
      const branchStock = inventory.branch_stocks.find(bs => bs.branch_id === branch_id)
      const currentQty = branchStock?.quantity || 0

      if (quantity > currentQty) {
        movementType = 'adjustment_in'
        finalQuantity = quantity - currentQty
      } else {
        movementType = 'adjustment_out'
        finalQuantity = currentQty - quantity
      }
      break
    case 'increase':
      movementType = 'adjustment_in'
      break
    case 'decrease':
      movementType = 'adjustment_out'
      break
  }

  return recordStockMovement(organizationId, userId, {
    movement_type: movementType,
    product_id,
    branch_id,
    quantity: Math.abs(finalQuantity),
    reason,
    notes
  })
}

// ==================== STOCK TRANSFERS ====================

/**
 * Create stock transfer between branches
 */
export async function createStockTransfer(
  organizationId: string,
  userId: string,
  input: StockTransferInput
): Promise<StockTransfer> {
  const transferNumber = `TRF-${Date.now()}`

  // Get branch details
  const { data: fromBranch } = await apiV2.get('entities', {
    p_organization_id: organizationId,
    p_entity_id: input.from_branch_id
  })

  const { data: toBranch } = await apiV2.get('entities', {
    p_organization_id: organizationId,
    p_entity_id: input.to_branch_id
  })

  // Create transfer transaction
  const { data: txn } = await apiV2.post('transactions', {
    transaction_type: 'stock_transfer',
    smart_code: INVENTORY_SMART_CODES.TRANSFER,
    organization_id: organizationId,
    from_entity_id: input.from_branch_id,
    to_entity_id: input.to_branch_id,
    metadata: {
      transfer_number: transferNumber,
      status: 'pending',
      items: input.items,
      notes: input.notes
    },
    created_by: userId
  })

  return {
    id: txn.id,
    transfer_number: transferNumber,
    from_branch_id: input.from_branch_id,
    from_branch_name: fromBranch?.[0]?.entity_name || 'Unknown',
    to_branch_id: input.to_branch_id,
    to_branch_name: toBranch?.[0]?.entity_name || 'Unknown',
    status: 'pending',
    items: input.items.map(item => ({
      product_id: item.product_id,
      product_name: '',
      quantity: item.quantity,
      unit_cost: 0,
      total_value: 0,
      status: 'pending'
    })),
    requested_by: userId,
    created_at: txn.created_at,
    updated_at: txn.updated_at
  }
}

/**
 * Complete stock transfer (execute the actual stock movements)
 */
export async function completeStockTransfer(
  organizationId: string,
  userId: string,
  transferId: string
): Promise<void> {
  // Get transfer details
  const { data: transfer } = await apiV2.get('transactions', {
    p_organization_id: organizationId,
    p_transaction_id: transferId
  })

  if (!transfer || transfer.status === 'completed') {
    throw new Error('Transfer not found or already completed')
  }

  const { from_entity_id: fromBranchId, to_entity_id: toBranchId, metadata } = transfer
  const items = metadata?.items || []

  // Process each item
  for (const item of items) {
    await recordStockMovement(organizationId, userId, {
      movement_type: 'transfer_out',
      product_id: item.product_id,
      branch_id: fromBranchId,
      to_branch_id: toBranchId,
      quantity: item.quantity,
      reference_id: transferId,
      notes: `Transfer ${metadata.transfer_number}`
    })
  }

  // Update transfer status
  await apiV2.put('transactions', {
    transaction_id: transferId,
    metadata: {
      ...metadata,
      status: 'completed',
      completed_at: new Date().toISOString()
    }
  })
}

// ==================== STOCK ALERTS ====================

async function checkAndCreateStockAlert(
  organizationId: string,
  productId: string,
  branchId: string,
  quantity: number,
  reorderLevel: number
): Promise<void> {
  const status = getStockStatus(quantity, reorderLevel)

  if (status === 'in_stock') return

  const alertType = status === 'out_of_stock' ? 'out_of_stock' :
                    status === 'low_stock' ? 'low_stock' : 'overstock'

  const smartCode = status === 'out_of_stock' ? INVENTORY_SMART_CODES.ALERT_OUT_STOCK :
                    status === 'low_stock' ? INVENTORY_SMART_CODES.ALERT_LOW_STOCK :
                    INVENTORY_SMART_CODES.ALERT_OVERSTOCK

  // Create alert entity
  await apiV2.post('entities', {
    entity_type: 'stock_alert',
    entity_name: `${alertType} - ${productId}`,
    smart_code: smartCode,
    organization_id: organizationId,
    metadata: {
      alert_type: alertType,
      product_id: productId,
      branch_id: branchId,
      current_quantity: quantity,
      threshold_quantity: reorderLevel,
      severity: getAlertSeverity(status),
      is_acknowledged: false
    }
  })
}

/**
 * Get active stock alerts
 */
export async function getStockAlerts(
  organizationId: string,
  branchId?: string
): Promise<StockAlert[]> {
  const { data: alerts } = await apiV2.get('entities', {
    p_organization_id: organizationId,
    p_entity_type: 'stock_alert',
    p_include_dynamic: true
  })

  return (alerts || [])
    .filter((alert: any) => {
      if (branchId && alert.metadata?.branch_id !== branchId) return false
      return !alert.metadata?.is_acknowledged
    })
    .map((alert: any) => ({
      id: alert.id,
      alert_type: alert.metadata?.alert_type,
      product_id: alert.metadata?.product_id,
      product_name: alert.entity_name,
      branch_id: alert.metadata?.branch_id,
      branch_name: '',
      current_quantity: alert.metadata?.current_quantity,
      threshold_quantity: alert.metadata?.threshold_quantity,
      severity: alert.metadata?.severity,
      is_acknowledged: alert.metadata?.is_acknowledged || false,
      created_at: alert.created_at
    }))
}

// ==================== STOCK REPORTS ====================

/**
 * Get inventory valuation report
 */
export async function getInventoryValuation(
  organizationId: string,
  branchId?: string
): Promise<{
  total_value: number
  total_items: number
  by_category: Array<{ category: string; value: number; count: number }>
}> {
  const { data: products } = await apiV2.get('entities', {
    p_organization_id: organizationId,
    p_entity_type: 'product',
    p_include_dynamic: true,
    p_include_relationships: true
  })

  let totalValue = 0
  let totalItems = 0
  const byCategory: Record<string, { value: number; count: number }> = {}

  for (const product of products || []) {
    const inventory = await getProductInventory(organizationId, product.id)

    const relevantStocks = branchId
      ? inventory.branch_stocks.filter(bs => bs.branch_id === branchId)
      : inventory.branch_stocks

    const stockValue = relevantStocks.reduce((sum, bs) => sum + (bs.value || 0), 0)
    const stockQty = relevantStocks.reduce((sum, bs) => sum + bs.quantity, 0)

    totalValue += stockValue
    totalItems += stockQty

    const category = product.category || 'Uncategorized'
    if (!byCategory[category]) {
      byCategory[category] = { value: 0, count: 0 }
    }
    byCategory[category].value += stockValue
    byCategory[category].count += stockQty
  }

  return {
    total_value: totalValue,
    total_items: totalItems,
    by_category: Object.entries(byCategory).map(([category, data]) => ({
      category,
      value: data.value,
      count: data.count
    }))
  }
}
