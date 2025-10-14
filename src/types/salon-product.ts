import { z } from 'zod'

// Base product interface
export interface Product {
  id: string
  entity_name: string
  entity_code?: string | null
  status: 'active' | 'archived'
  smart_code: string
  qty_on_hand: number
  price?: number | null
  cost_price?: number | null
  selling_price?: number | null
  stock_level?: number | null
  reorder_level?: number | null
  category?: string | null
  description?: string | null
  currency: string
  requires_inventory: boolean
  created_at?: string | null
  updated_at?: string | null
}

// Product with dynamic data
export interface ProductWithDynamicData extends Product {
  metadata?: {
    description?: string
    requires_inventory?: boolean
    [key: string]: any
  }
}

// Form schemas
export const ProductFormSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255, 'Name too long'),
  code: z.string().max(50, 'Code too long').optional(),
  category: z.string().max(120, 'Category too long').optional(),
  cost_price: z.number().min(0, 'Cost price must be positive').optional(),
  selling_price: z.number().min(0, 'Selling price must be positive').optional(),
  stock_level: z.number().int().min(0, 'Stock level must be non-negative').optional(),
  reorder_level: z.number().int().min(0, 'Reorder level must be non-negative').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  requires_inventory: z.boolean().default(false),
  status: z.enum(['active', 'archived']).default('active'),
  branch_ids: z.array(z.string()).optional(), // Branch relationships via STOCK_AT
  // ✅ ENTERPRISE BARCODE FIELDS
  barcode_primary: z.string().max(128, 'Barcode too long').optional(),
  barcode_type: z.enum(['EAN13', 'UPC', 'CODE128', 'QR']).default('EAN13').optional(),
  barcodes_alt: z.array(z.string()).optional(),
  gtin: z.string().regex(/^\d{8,14}$/, 'GTIN must be 8-14 digits').optional().or(z.literal(''))
})

export type ProductForm = z.infer<typeof ProductFormSchema>

// API response types
export interface ProductsResponse {
  items: Product[]
  total_count: number
  limit: number
  offset: number
}

// Filter and sort types
export type ProductStatus = 'active' | 'archived' | 'all'
export type ProductSort = 'name_asc' | 'name_desc' | 'updated_desc' | 'updated_asc'

export interface ProductFilters {
  q?: string
  status: ProductStatus
  category?: string
  branch_id?: string
  sort: ProductSort
  limit: number
  offset: number
}
