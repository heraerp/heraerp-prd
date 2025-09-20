import { z } from 'zod'

// Item form schema
export const ItemFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  sku: z.string().regex(/^[A-Z0-9-]+$/, 'SKU must contain only uppercase letters, numbers, and hyphens').optional().or(z.literal('')),
  barcode: z.string().optional().or(z.literal('')),
  category: z.string().optional().or(z.literal('')),
  uom: z.enum(['ml', 'g', 'unit', 'piece', 'box', 'bottle']).optional(),
  track_stock: z.boolean().default(true),
  reorder_level: z.number().min(0).optional().or(z.nan()).transform(v => isNaN(v) ? undefined : v),
  reorder_qty: z.number().min(0).optional().or(z.nan()).transform(v => isNaN(v) ? undefined : v),
  status: z.enum(['active', 'archived']).default('active'),
  cost: z.number().min(0).optional().or(z.nan()).transform(v => isNaN(v) ? undefined : v),
  tax_rate: z.number().min(0).max(100).optional().or(z.nan()).transform(v => isNaN(v) ? undefined : v)
})

export type ItemForm = z.infer<typeof ItemFormSchema>

// Movement form schema
export const MovementFormSchema = z.object({
  type: z.enum(['RECEIPT', 'ISSUE', 'TRANSFER', 'ADJUST']),
  when_ts: z.date(),
  branch_id: z.string().min(1, 'Branch is required'),
  from_branch_id: z.string().optional(),
  to_branch_id: z.string().optional(),
  reference: z.string().optional().or(z.literal('')),
  lines: z.array(z.object({
    item_id: z.string().min(1, 'Item is required'),
    item_name: z.string().optional(), // For display
    qty: z.number().gt(0, 'Quantity must be greater than 0'),
    unit_cost: z.number().min(0).optional().or(z.nan()).transform(v => isNaN(v) ? undefined : v),
    note: z.string().optional().or(z.literal(''))
  })).min(1, 'At least one item is required')
}).superRefine((data, ctx) => {
  if (data.type === 'TRANSFER') {
    if (!data.from_branch_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'From branch is required for transfers',
        path: ['from_branch_id']
      })
    }
    if (!data.to_branch_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'To branch is required for transfers',
        path: ['to_branch_id']
      })
    }
    if (data.from_branch_id === data.to_branch_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'From and To branches must be different',
        path: ['to_branch_id']
      })
    }
  }
  
  // Validate unit cost for receipts and positive adjustments
  if (data.type === 'RECEIPT' || data.type === 'ADJUST') {
    data.lines.forEach((line, index) => {
      if (!line.unit_cost || line.unit_cost <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Unit cost is required for receipts and adjustments',
          path: ['lines', index, 'unit_cost']
        })
      }
    })
  }
})

export type MovementForm = z.infer<typeof MovementFormSchema>

// Enhanced types with dynamic data
export interface ItemWithStock {
  id: string
  organization_id: string
  smart_code: string
  name: string
  sku?: string
  barcode?: string
  category?: string
  uom?: string
  track_stock: boolean
  status: 'active' | 'archived'
  created_at: string
  updated_at: string
  metadata?: {
    tax_rate?: number
    track_stock?: boolean
    reorder_level?: number
    reorder_qty?: number
    cost?: number
  }
  // Dynamic data
  on_hand?: number // From HERA.INVENTORY.STOCKLEVEL.V1
  avg_cost?: number // From HERA.INVENTORY.COST.AVG.V1
  value?: number // on_hand * avg_cost
  low_stock?: boolean // on_hand < reorder_level
}

export interface Movement {
  id: string
  organization_id: string
  smart_code: string
  transaction_code: string
  when_ts: string
  branch_id: string
  from_entity_id?: string // From branch for transfers
  to_entity_id?: string // To branch for transfers
  status: 'draft' | 'posted' | 'cancelled'
  total_amount: number
  metadata?: {
    type: 'RECEIPT' | 'ISSUE' | 'TRANSFER' | 'ADJUST'
    reference?: string
    posted_by?: string
    posted_at?: string
    accounting_ref?: string
  }
  lines?: MovementLine[]
  created_at: string
  updated_at: string
}

export interface MovementLine {
  id: string
  transaction_id: string
  line_no: number
  smart_code: string
  entity_id: string // Item ID
  qty: number
  uom?: string
  unit_cost: number
  amount: number
  metadata?: {
    item_name?: string
    note?: string
    from_branch_id?: string
    to_branch_id?: string
  }
}

export interface StockLevel {
  item_id: string
  branch_id: string
  on_hand: number
  available: number // on_hand - allocated
  allocated: number
  in_transit?: number
  last_movement?: string
  last_updated: string
}

export interface ValuationSummary {
  branch_id: string
  branch_name: string
  total_items: number
  total_value: number
  low_stock_items: number
  out_of_stock_items: number
  valuation_method: 'WAC' | 'FIFO'
  last_updated: string
  cogs_mtd?: number
  cogs_ytd?: number
}