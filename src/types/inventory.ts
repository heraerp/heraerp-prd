import { z } from 'zod'

/**
 * HERA Enterprise Inventory Management System
 *
 * Architecture:
 * - Products are universal entities (core_entities)
 * - Branch-specific stock levels stored in core_dynamic_data
 * - Stock movements tracked via universal_transactions
 * - STOCK_AT relationships link products to branches
 */

// ==================== CORE TYPES ====================

export interface BranchStock {
  branch_id: string
  branch_name: string
  quantity: number
  reorder_level: number
  last_counted_at?: string
  last_updated_at?: string
  value?: number // quantity * cost_price
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock'
}

export interface ProductInventory {
  product_id: string
  product_name: string
  product_code?: string
  total_quantity: number
  total_value: number
  cost_price: number
  selling_price: number
  branch_stocks: BranchStock[]
  requires_inventory: boolean
  track_by: 'unit' | 'batch' | 'serial' // Inventory tracking method
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

export interface StockMovement {
  id: string
  movement_type: StockMovementType
  product_id: string
  branch_id: string
  quantity: number
  unit_cost: number
  total_value: number
  reference_id?: string // Link to sale/purchase transaction
  from_branch_id?: string // For transfers
  to_branch_id?: string // For transfers
  reason?: string
  notes?: string
  created_by: string
  created_at: string
  smart_code: string
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
  count_type: 'full' | 'partial' | 'cycle' // Full count, partial category, or cycle count
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

export const BranchStockSchema = z.object({
  branch_id: z.string().uuid(),
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
  reorder_level: z.number().int().min(0, 'Reorder level cannot be negative').default(10)
})

export const StockMovementSchema = z.object({
  movement_type: z.enum([
    'purchase', 'sale', 'transfer_out', 'transfer_in',
    'adjustment_in', 'adjustment_out', 'return_from_customer',
    'return_to_supplier', 'damage', 'expiry', 'sample'
  ]),
  product_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  quantity: z.number().int().positive('Quantity must be positive'),
  unit_cost: z.number().min(0, 'Unit cost cannot be negative').optional(),
  from_branch_id: z.string().uuid().optional(),
  to_branch_id: z.string().uuid().optional(),
  reference_id: z.string().uuid().optional(),
  reason: z.string().max(500).optional(),
  notes: z.string().max(1000).optional()
})

export const StockTransferSchema = z.object({
  from_branch_id: z.string().uuid(),
  to_branch_id: z.string().uuid(),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().int().positive()
  })).min(1, 'At least one item required'),
  notes: z.string().max(1000).optional()
}).refine(data => data.from_branch_id !== data.to_branch_id, {
  message: 'Source and destination branches must be different'
})

export const StockCountSchema = z.object({
  branch_id: z.string().uuid(),
  count_type: z.enum(['full', 'partial', 'cycle']),
  scheduled_date: z.string().datetime(),
  product_ids: z.array(z.string().uuid()).optional(), // For partial/cycle counts
  notes: z.string().max(1000).optional()
})

export const StockAdjustmentSchema = z.object({
  product_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  adjustment_type: z.enum(['set', 'increase', 'decrease']),
  quantity: z.number().int(),
  reason: z.string().min(1, 'Reason is required').max(500),
  notes: z.string().max(1000).optional()
})

// ==================== SMART CODES ====================

export const INVENTORY_SMART_CODES = {
  // Stock Movements
  PURCHASE: 'HERA.SALON.INV.MOV.PURCHASE.V1',
  SALE: 'HERA.SALON.INV.MOV.SALE.V1',
  TRANSFER_OUT: 'HERA.SALON.INV.MOV.TRANSFER.OUT.V1',
  TRANSFER_IN: 'HERA.SALON.INV.MOV.TRANSFER.IN.V1',
  ADJUSTMENT_IN: 'HERA.SALON.INV.MOV.ADJUST.IN.V1',
  ADJUSTMENT_OUT: 'HERA.SALON.INV.MOV.ADJUST.OUT.V1',
  RETURN_CUSTOMER: 'HERA.SALON.INV.MOV.RETURN.CUSTOMER.V1',
  RETURN_SUPPLIER: 'HERA.SALON.INV.MOV.RETURN.SUPPLIER.V1',
  DAMAGE: 'HERA.SALON.INV.MOV.DAMAGE.V1',
  EXPIRY: 'HERA.SALON.INV.MOV.EXPIRY.V1',
  SAMPLE: 'HERA.SALON.INV.MOV.SAMPLE.V1',

  // Stock Transfers
  TRANSFER: 'HERA.SALON.INV.TRANSFER.V1',

  // Stock Counts
  STOCK_COUNT: 'HERA.SALON.INV.COUNT.V1',

  // Alerts
  ALERT_LOW_STOCK: 'HERA.SALON.INV.ALERT.LOW.STOCK.V1',
  ALERT_OUT_STOCK: 'HERA.SALON.INV.ALERT.OUT.STOCK.V1',
  ALERT_OVERSTOCK: 'HERA.SALON.INV.ALERT.OVERSTOCK.V1',

  // Branch Stock Dynamic Fields
  BRANCH_STOCK_QTY: 'HERA.SALON.INV.BRANCH.STOCK.QTY.V1',
  BRANCH_STOCK_REORDER: 'HERA.SALON.INV.BRANCH.STOCK.REORDER.V1'
} as const

// ==================== HELPER FUNCTIONS ====================

export function getStockStatus(quantity: number, reorderLevel: number): BranchStock['status'] {
  if (quantity === 0) return 'out_of_stock'
  if (quantity <= reorderLevel) return 'low_stock'
  if (quantity > reorderLevel * 3) return 'overstock'
  return 'in_stock'
}

export function getAlertSeverity(stockStatus: BranchStock['status']): StockAlert['severity'] {
  switch (stockStatus) {
    case 'out_of_stock': return 'critical'
    case 'low_stock': return 'warning'
    case 'overstock': return 'info'
    default: return 'info'
  }
}

export function calculateStockValue(quantity: number, costPrice: number): number {
  return Math.round(quantity * costPrice * 100) / 100
}

// ==================== TYPE EXPORTS ====================

export type BranchStockInput = z.infer<typeof BranchStockSchema>
export type StockMovementInput = z.infer<typeof StockMovementSchema>
export type StockTransferInput = z.infer<typeof StockTransferSchema>
export type StockCountInput = z.infer<typeof StockCountSchema>
export type StockAdjustmentInput = z.infer<typeof StockAdjustmentSchema>
