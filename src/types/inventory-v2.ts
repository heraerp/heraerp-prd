import { z } from 'zod'

/**
 * HERA Enterprise Inventory Management System V2
 *
 * Architecture:
 * - Products are universal entities (core_entities)
 * - STOCK_LEVEL entities per (product, branch) combination
 * - Stock movements tracked via universal_transactions with INVENTORY_MOVE lines
 * - Transactions are the source of truth, STOCK_LEVEL is materialized view
 *
 * Smart Code Hierarchy:
 * - Entity: HERA.SALON.INV.ENTITY.STOCK_LEVEL.V1
 * - Fields: HERA.SALON.INV.DYN.{field}.V1
 * - Relationships: HERA.SALON.INV.REL.{type}.V1
 * - Transaction Lines: HERA.SALON.INV.LINE.{operation}.V1
 */

// ==================== STOCK_LEVEL ENTITY ====================

export interface StockLevelEntity {
  id: string
  entity_type: 'STOCK_LEVEL'
  entity_name: string // "Stock • {Product} • {Branch}"
  smart_code: 'HERA.SALON.INV.ENTITY.STOCK_LEVEL.V1'
  organization_id: string

  // Dynamic fields
  quantity: number
  reorder_level: number
  last_counted_at?: string

  // Relationships
  product_id: string // via STOCK_OF_PRODUCT
  product_name?: string
  branch_id: string // via STOCK_AT_LOCATION
  branch_name?: string

  // Computed
  value?: number // quantity * product cost
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock'

  // Audit
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

// ==================== PRODUCT INVENTORY (Aggregated View) ====================

export interface ProductInventory {
  product_id: string
  product_name: string
  product_code?: string
  total_quantity: number
  total_value: number
  cost_price: number
  selling_price: number
  stock_levels: StockLevelEntity[] // One per branch
  requires_inventory: boolean
  track_by: 'unit' | 'batch' | 'serial'
}

// ==================== INVENTORY MOVE LINE (Transaction Detail) ====================

export interface InventoryMoveLine {
  line_type: 'INVENTORY_MOVE'
  line_number: number
  smart_code: string // HERA.SALON.INV.LINE.{operation}.V1
  quantity: number
  unit_amount: number // Unit cost for valuation
  line_amount: number // Total cost impact

  // Movement details (in line_data JSONB)
  details: {
    product_id: string
    product_name?: string
    from_location_id?: string // For outbound movements
    to_location_id?: string // For inbound movements
    quantity: number
    movement_type: StockMovementType
    reason?: string
    notes?: string

    // Cost tracking
    unit_cost?: number
    total_cost?: number

    // Stock count variance
    system_quantity?: number
    counted_quantity?: number
    variance?: number
  }
}

// ==================== STOCK MOVEMENT TYPES ====================

export type StockMovementType =
  | 'purchase' // Receiving stock from supplier
  | 'sale' // Stock sold to customer
  | 'transfer_out' // Transfer to another branch
  | 'transfer_in' // Receive from another branch
  | 'adjustment_in' // Stock count increase
  | 'adjustment_out' // Stock count decrease/shrinkage
  | 'return_from_customer' // Customer return
  | 'return_to_supplier' // Return to supplier
  | 'damage' // Damaged stock write-off
  | 'expiry' // Expired stock write-off
  | 'sample' // Used as sample/demo

// ==================== TRANSACTION TYPES ====================

export interface InventoryTransaction {
  id: string
  transaction_type: 'PURCHASE_RECEIPT' | 'SALE' | 'INV_TRANSFER' | 'INV_ADJUSTMENT' | 'INV_COUNT'
  smart_code: string
  transaction_number: string
  transaction_date: string
  organization_id: string

  // Business context (in business_context JSONB)
  business_context: {
    supplier_ref?: string
    purchase_order?: string
    receipt_number?: string
    transfer_number?: string
    adjustment_reason?: string
    count_number?: string
    approved_by?: string
    requested_by?: string
  }

  // Transaction lines (including INVENTORY_MOVE lines)
  lines: InventoryMoveLine[]

  // Totals
  total_amount: number
  transaction_status: string

  // Audit
  created_at: string
  created_by: string
  updated_at?: string
  updated_by?: string
}

// ==================== STOCK TRANSFER ====================

export interface StockTransfer {
  id: string
  transfer_number: string
  from_branch_id: string
  from_branch_name: string
  to_branch_id: string
  to_branch_name: string
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled'
  items: StockTransferItem[]
  requested_by: string
  approved_by?: string
  shipped_at?: string
  received_at?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface StockTransferItem {
  product_id: string
  product_name: string
  quantity: number
  unit_cost: number
  total_value: number
  received_quantity?: number
  status: 'pending' | 'shipped' | 'received' | 'partial'
}

// ==================== STOCK ALERTS ====================

export interface StockAlert {
  id: string
  alert_type: 'low_stock' | 'out_of_stock' | 'overstock' | 'approaching_expiry'
  stock_level_id: string // Reference to STOCK_LEVEL entity
  product_id: string
  product_name: string
  branch_id: string
  branch_name: string
  current_quantity: number
  threshold_quantity: number
  severity: 'critical' | 'warning' | 'info'
  is_acknowledged: boolean
  created_at: string
  acknowledged_at?: string
  acknowledged_by?: string
}

// ==================== STOCK COUNT (Physical Inventory) ====================

export interface StockCount {
  id: string
  count_number: string
  branch_id: string
  branch_name: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  count_type: 'full' | 'partial' | 'cycle'
  scheduled_date: string
  started_at?: string
  completed_at?: string
  counted_by?: string[]
  items: StockCountItem[]
  variance_value: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface StockCountItem {
  stock_level_id: string // Reference to STOCK_LEVEL entity
  product_id: string
  product_name: string
  system_quantity: number
  counted_quantity: number
  variance: number
  variance_value: number
  reason?: string
  status: 'pending' | 'counted' | 'reconciled'
}

// ==================== VALIDATION SCHEMAS ====================

export const StockLevelSchema = z.object({
  product_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
  reorder_level: z.number().int().min(0, 'Reorder level cannot be negative').default(10),
  last_counted_at: z.string().datetime().optional()
})

export const InventoryMoveLineSchema = z.object({
  line_type: z.literal('INVENTORY_MOVE'),
  line_number: z.number().int().positive(),
  smart_code: z.string().regex(/^HERA\.SALON\.INV\.LINE\..+\.V1$/),
  quantity: z.number().int().positive(),
  unit_amount: z.number().min(0),
  line_amount: z.number().min(0),
  details: z.object({
    product_id: z.string().uuid(),
    product_name: z.string().optional(),
    from_location_id: z.string().uuid().optional(),
    to_location_id: z.string().uuid().optional(),
    quantity: z.number().int().positive(),
    movement_type: z.enum([
      'purchase',
      'sale',
      'transfer_out',
      'transfer_in',
      'adjustment_in',
      'adjustment_out',
      'return_from_customer',
      'return_to_supplier',
      'damage',
      'expiry',
      'sample'
    ]),
    reason: z.string().max(500).optional(),
    notes: z.string().max(1000).optional(),
    unit_cost: z.number().min(0).optional(),
    total_cost: z.number().min(0).optional(),
    system_quantity: z.number().int().optional(),
    counted_quantity: z.number().int().optional(),
    variance: z.number().int().optional()
  })
})

export const StockTransferSchema = z
  .object({
    from_branch_id: z.string().uuid(),
    to_branch_id: z.string().uuid(),
    items: z
      .array(
        z.object({
          product_id: z.string().uuid(),
          quantity: z.number().int().positive(),
          unit_cost: z.number().min(0).optional()
        })
      )
      .min(1, 'At least one item required'),
    notes: z.string().max(1000).optional()
  })
  .refine(data => data.from_branch_id !== data.to_branch_id, {
    message: 'Source and destination branches must be different'
  })

export const StockCountSchema = z.object({
  branch_id: z.string().uuid(),
  count_type: z.enum(['full', 'partial', 'cycle']),
  scheduled_date: z.string().datetime(),
  product_ids: z.array(z.string().uuid()).optional(),
  notes: z.string().max(1000).optional()
})

export const StockAdjustmentSchema = z.object({
  product_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  adjustment_type: z.enum(['set', 'increase', 'decrease']),
  quantity: z.number().int(),
  reason: z.string().min(1, 'Reason is required').max(500),
  notes: z.string().max(1000).optional(),
  allow_negative: z.boolean().default(false)
})

// ==================== SMART CODES V2 ====================

export const INVENTORY_SMART_CODES_V2 = {
  // STOCK_LEVEL Entity
  ENTITY_STOCK_LEVEL: 'HERA.SALON.INV.ENTITY.STOCK_LEVEL.V1',

  // Dynamic Fields
  DYN_QTY: 'HERA.SALON.INV.DYN.QTY.V1',
  DYN_REORDER: 'HERA.SALON.INV.DYN.REORDER.V1',
  DYN_LAST_COUNT: 'HERA.SALON.INV.DYN.LAST_COUNT.V1',

  // Relationships
  REL_STOCK_OF_PRODUCT: 'HERA.SALON.INV.REL.STOCK_OF_PRODUCT.V1',
  REL_STOCK_AT_LOCATION: 'HERA.SALON.INV.REL.STOCK_AT_LOCATION.V1',

  // Transaction Types
  TXN_RECEIPT: 'HERA.SALON.INV.TXN.RECEIPT.V1',
  TXN_TRANSFER: 'HERA.SALON.INV.TXN.TRANSFER.V1',
  TXN_ADJUSTMENT: 'HERA.SALON.INV.TXN.ADJUST.V1',
  TXN_COUNT: 'HERA.SALON.INV.TXN.COUNT.V1',

  // Transaction Lines (INVENTORY_MOVE operations)
  LINE_RECEIPT: 'HERA.SALON.INV.LINE.RECEIPT.V1', // Purchase receive
  LINE_CONSUME: 'HERA.SALON.INV.LINE.CONSUME.V1', // Sale/usage
  LINE_MOVE_OUT: 'HERA.SALON.INV.LINE.MOVE.OUT.V1', // Transfer out
  LINE_MOVE_IN: 'HERA.SALON.INV.LINE.MOVE.IN.V1', // Transfer in
  LINE_ADJUST_IN: 'HERA.SALON.INV.LINE.ADJUST.IN.V1', // Count increase
  LINE_ADJUST_OUT: 'HERA.SALON.INV.LINE.ADJUST.OUT.V1', // Count decrease
  LINE_RETURN_IN: 'HERA.SALON.INV.LINE.RETURN.IN.V1', // Customer return
  LINE_RETURN_OUT: 'HERA.SALON.INV.LINE.RETURN.OUT.V1', // Supplier return
  LINE_DAMAGE: 'HERA.SALON.INV.LINE.DAMAGE.V1', // Write-off
  LINE_EXPIRY: 'HERA.SALON.INV.LINE.EXPIRY.V1', // Expired
  LINE_SAMPLE: 'HERA.SALON.INV.LINE.SAMPLE.V1', // Sample/demo

  // Alerts
  ALERT_LOW_STOCK: 'HERA.SALON.INV.ALERT.LOW.STOCK.V1',
  ALERT_OUT_STOCK: 'HERA.SALON.INV.ALERT.OUT.STOCK.V1',
  ALERT_OVERSTOCK: 'HERA.SALON.INV.ALERT.OVERSTOCK.V1'
} as const

// ==================== HELPER FUNCTIONS ====================

export function getStockStatus(
  quantity: number,
  reorderLevel: number
): StockLevelEntity['status'] {
  if (quantity === 0) return 'out_of_stock'
  if (quantity <= reorderLevel) return 'low_stock'
  if (quantity > reorderLevel * 3) return 'overstock'
  return 'in_stock'
}

export function getAlertSeverity(stockStatus: StockLevelEntity['status']): StockAlert['severity'] {
  switch (stockStatus) {
    case 'out_of_stock':
      return 'critical'
    case 'low_stock':
      return 'warning'
    case 'overstock':
      return 'info'
    default:
      return 'info'
  }
}

export function calculateStockValue(quantity: number, costPrice: number): number {
  return Math.round(quantity * costPrice * 100) / 100
}

export function generateStockLevelName(productName: string, branchName: string): string {
  return `Stock • ${productName} • ${branchName}`
}

export function getInventoryMoveSmartCode(movementType: StockMovementType): string {
  const mapping: Record<StockMovementType, string> = {
    purchase: INVENTORY_SMART_CODES_V2.LINE_RECEIPT,
    sale: INVENTORY_SMART_CODES_V2.LINE_CONSUME,
    transfer_out: INVENTORY_SMART_CODES_V2.LINE_MOVE_OUT,
    transfer_in: INVENTORY_SMART_CODES_V2.LINE_MOVE_IN,
    adjustment_in: INVENTORY_SMART_CODES_V2.LINE_ADJUST_IN,
    adjustment_out: INVENTORY_SMART_CODES_V2.LINE_ADJUST_OUT,
    return_from_customer: INVENTORY_SMART_CODES_V2.LINE_RETURN_IN,
    return_to_supplier: INVENTORY_SMART_CODES_V2.LINE_RETURN_OUT,
    damage: INVENTORY_SMART_CODES_V2.LINE_DAMAGE,
    expiry: INVENTORY_SMART_CODES_V2.LINE_EXPIRY,
    sample: INVENTORY_SMART_CODES_V2.LINE_SAMPLE
  }
  return mapping[movementType]
}

// ==================== TYPE EXPORTS ====================

export type StockLevelInput = z.infer<typeof StockLevelSchema>
export type InventoryMoveLineInput = z.infer<typeof InventoryMoveLineSchema>
export type StockTransferInput = z.infer<typeof StockTransferSchema>
export type StockCountInput = z.infer<typeof StockCountSchema>
export type StockAdjustmentInput = z.infer<typeof StockAdjustmentSchema>
