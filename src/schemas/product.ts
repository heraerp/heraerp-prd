import { z } from 'zod'

export const ProductFormSchema = z.object({
  name: z.string().min(2, 'Name is too short').max(100),
  code: z
    .string()
    .regex(/^[A-Z0-9_-]*$/i, 'Letters, numbers, - or _ only')
    .optional()
    .or(z.literal('')),
  sku: z.string().optional().or(z.literal('')),
  barcode: z.string().optional().or(z.literal('')),
  brand: z.string().optional(),
  category: z.string().optional(),
  price: z.number().min(0),
  currency: z.string().min(3).max(3).default('AED'),
  tax_rate: z.number().min(0).max(100).optional(),
  reorder_level: z.number().int().min(0).optional(),
  description: z.string().max(2000).optional()
})

export type ProductForm = z.infer<typeof ProductFormSchema>

export interface ProductEntity {
  id: string
  organization_id: string
  smart_code: string
  name: string
  code?: string
  status: 'active' | 'archived'
  created_at?: string
  updated_at?: string
  metadata?: Record<string, any>
}

export interface ProductWithDynamicData extends ProductEntity {
  price?: number
  currency?: string
  tax_rate?: number
  sku?: string
  barcode?: string
  brand?: string
  category?: string
  reorder_level?: number
  stock_on_hand?: number
}