import { z } from 'zod'

export interface ProductCategory {
  id: string
  entity_name: string
  entity_code?: string | null
  status: 'active' | 'archived'
  smart_code: string
  description?: string | null
  color?: string | null
  icon?: string | null
  sort_order: number
  product_count?: number
  created_at?: string | null
  updated_at?: string | null
}

export const ProductCategoryFormSchema = z.object({
  name: z.string().min(1, 'Category name is required').max(120, 'Name too long'),
  code: z
    .string()
    .max(50, 'Code too long')
    .optional()
    .transform(value => (value && value.trim().length > 0 ? value.trim() : undefined)),
  description: z
    .string()
    .max(300, 'Description too long')
    .optional()
    .transform(value => (value && value.trim().length > 0 ? value.trim() : undefined)),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a hex code'),
  icon: z.string().min(1, 'Icon selection is required'),
  sort_order: z
    .number({ invalid_type_error: 'Sort order must be a number' })
    .int('Sort order must be a whole number')
    .min(0, 'Sort order cannot be negative')
    .max(9999, 'Sort order too large')
    .default(0)
})

export type ProductCategoryFormValues = z.infer<typeof ProductCategoryFormSchema>
