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
  price: z.number().min(0, 'Price must be positive').optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').default('AED'),
  description: z.string().max(1000, 'Description too long').optional(),
  requires_inventory: z.boolean().default(false)
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
