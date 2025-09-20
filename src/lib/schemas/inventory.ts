// ================================================================================
// INVENTORY SCHEMAS - ZOD CONTRACTS
// Smart Code: HERA.SCHEMA.INVENTORY.v1
// Zod validation for products, policies, and movements
// ================================================================================

import { z } from 'zod'

// Core Product Entity (stored in core_entities)
export const Product = z.object({
  organization_id: z.string().uuid(),
  entity_type: z.literal('product'),
  entity_code: z.string().min(1, 'Product code is required'),
  entity_name: z.string().min(1, 'Product name is required'),
  unit: z.string().default('ea'),
  category: z.string().optional(),
  smart_code: z.string().min(1).regex(/^HERA\./, 'Smart code must start with HERA.'),
  status: z.enum(['active', 'inactive', 'discontinued']).default('active'),
  metadata: z.record(z.any()).optional()
})

export type Product = z.infer<typeof Product>

// Product Policies (stored in core_dynamic_data)
export const ProductPolicy = z.object({
  reorder_level: z.number().nonnegative().optional().describe('Minimum stock level before reorder alert'),
  qty_on_hand: z.object({
    total: z.number().nonnegative(),
    by_branch: z.array(z.object({ 
      branch_code: z.string(), 
      quantity: z.number().nonnegative() 
    })).optional(),
    last_updated: z.string().datetime().optional()
  }).optional().describe('Current inventory quantity'),
  FINANCE_DNA_COGS_RULE: z.object({
    costing_method: z.enum(['FIFO', 'LIFO', 'AVERAGE', 'STANDARD']).default('FIFO'),
    standard_cost: z.number().positive().optional(),
    last_cost: z.number().positive().optional(),
    average_cost: z.number().positive().optional()
  }).optional().describe('Finance DNA costing policy'),
  supplier_info: z.object({
    primary_supplier_id: z.string().uuid().optional(),
    lead_time_days: z.number().int().nonnegative().optional(),
    min_order_qty: z.number().positive().optional()
  }).optional()
})

export type ProductPolicy = z.infer<typeof ProductPolicy>

// Product with computed fields for UI
export const ProductWithInventory = Product.extend({
  qty_on_hand: z.number().nonnegative().default(0),
  reorder_level: z.number().nonnegative().optional(),
  is_low_stock: z.boolean().default(false),
  last_movement_date: z.string().datetime().optional(),
  last_movement_type: z.enum(['receipt', 'issue', 'adjustment', 'transfer']).optional(),
  costing_method: z.string().optional()
})

export type ProductWithInventory = z.infer<typeof ProductWithInventory>

// Inventory Movement (from universal_transaction_lines)
export const InventoryMovement = z.object({
  transaction_id: z.string().uuid(),
  transaction_date: z.string().datetime(),
  line_number: z.number().int().positive(),
  entity_id: z.string().uuid(), // product entity
  line_type: z.enum(['receipt', 'issue', 'adjustment', 'transfer']),
  description: z.string(),
  quantity: z.number(),
  unit_amount: z.number().optional(),
  line_amount: z.number().optional(),
  smart_code: z.string(),
  metadata: z.object({
    movement_type: z.string(),
    reference_doc: z.string().optional(),
    branch_code: z.string().optional(),
    reason_code: z.string().optional()
  }).optional()
})

export type InventoryMovement = z.infer<typeof InventoryMovement>

// Usage Analytics
export const ProductUsage = z.object({
  product_code: z.string(),
  product_name: z.string(),
  period_start: z.string().datetime(),
  period_end: z.string().datetime(),
  total_receipts: z.number().nonnegative(),
  total_issues: z.number().nonnegative(),
  net_movement: z.number(),
  movement_count: z.number().int().nonnegative(),
  avg_daily_usage: z.number().nonnegative()
})

export type ProductUsage = z.infer<typeof ProductUsage>

// API Request/Response Schemas
export const ListProductsRequest = z.object({
  organization_id: z.string().uuid(),
  search: z.string().optional(),
  category: z.string().optional(),
  low_stock_only: z.boolean().default(false),
  status: z.enum(['active', 'inactive', 'all']).default('active'),
  limit: z.number().int().positive().max(1000).default(100),
  offset: z.number().int().nonnegative().default(0)
})

export type ListProductsRequest = z.infer<typeof ListProductsRequest>

export const CreateProductRequest = z.object({
  organization_id: z.string().uuid(),
  entity_code: z.string().min(1),
  entity_name: z.string().min(1),
  unit: z.string().default('ea'),
  category: z.string().optional(),
  reorder_level: z.number().nonnegative().optional(),
  opening_qty: z.number().nonnegative().default(0),
  standard_cost: z.number().positive().optional(),
  costing_method: z.enum(['FIFO', 'LIFO', 'AVERAGE', 'STANDARD']).default('FIFO')
})

export type CreateProductRequest = z.infer<typeof CreateProductRequest>

export const UpdateProductRequest = CreateProductRequest.partial().extend({
  entity_id: z.string().uuid(),
  organization_id: z.string().uuid()
})

export type UpdateProductRequest = z.infer<typeof UpdateProductRequest>

export const UsageAnalysisRequest = z.object({
  organization_id: z.string().uuid(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  product_codes: z.array(z.string()).optional(),
  category: z.string().optional(),
  top_n: z.number().int().positive().max(100).default(10)
})

export type UsageAnalysisRequest = z.infer<typeof UsageAnalysisRequest>

// Smart Codes for Inventory
export const INVENTORY_SMART_CODES = {
  PRODUCT_ENTITY: 'HERA.SALON.INVENTORY.PRODUCT.ENTITY.V1',
  PRODUCT_RECEIPT: 'HERA.SALON.INVENTORY.RECEIPT.TXN.V1',
  PRODUCT_ISSUE: 'HERA.SALON.INVENTORY.ISSUE.TXN.V1',
  PRODUCT_ADJUSTMENT: 'HERA.SALON.INVENTORY.ADJUSTMENT.TXN.V1',
  PRODUCT_TRANSFER: 'HERA.SALON.INVENTORY.TRANSFER.TXN.V1',
  LOW_STOCK_ALERT: 'HERA.SALON.INVENTORY.ALERT.LOW_STOCK.V1'
} as const

// Validation helpers
export const validateProduct = (data: unknown): Product => {
  return Product.parse(data)
}

export const validateProductPolicy = (data: unknown): ProductPolicy => {
  return ProductPolicy.parse(data)
}

export const validateInventoryMovement = (data: unknown): InventoryMovement => {
  return InventoryMovement.parse(data)
}

// Business logic helpers
export const calculateOnHand = (movements: InventoryMovement[]): number => {
  return movements.reduce((total, movement) => {
    switch (movement.line_type) {
      case 'receipt':
      case 'adjustment':
        return total + Math.abs(movement.quantity)
      case 'issue':
        return total - Math.abs(movement.quantity)
      case 'transfer':
        // Transfer out is negative, transfer in is positive
        return total + movement.quantity
      default:
        return total
    }
  }, 0)
}

export const isLowStock = (onHand: number, reorderLevel?: number): boolean => {
  if (!reorderLevel || reorderLevel <= 0) return false
  return onHand <= reorderLevel
}

export const calculateUsageMetrics = (movements: InventoryMovement[], startDate: Date, endDate: Date): Omit<ProductUsage, 'product_code' | 'product_name'> => {
  const periodMs = endDate.getTime() - startDate.getTime()
  const periodDays = Math.max(1, periodMs / (1000 * 60 * 60 * 24))
  
  const receipts = movements
    .filter(m => m.line_type === 'receipt')
    .reduce((sum, m) => sum + Math.abs(m.quantity), 0)
  
  const issues = movements
    .filter(m => m.line_type === 'issue')
    .reduce((sum, m) => sum + Math.abs(m.quantity), 0)
  
  const net_movement = receipts - issues
  const avg_daily_usage = issues / periodDays
  
  return {
    period_start: startDate.toISOString(),
    period_end: endDate.toISOString(),
    total_receipts: receipts,
    total_issues: issues,
    net_movement,
    movement_count: movements.length,
    avg_daily_usage
  }
}