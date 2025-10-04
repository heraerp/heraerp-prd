import { z } from 'zod'

// Service Category Type
export interface ServiceCategory {
  id: string
  organization_id: string
  entity_type: 'service_category'
  entity_name: string
  entity_code: string
  smart_code: string
  entity_description?: string | null
  status: 'active' | 'archived' | 'deleted'
  created_at: string | null
  updated_at: string | null

  // Dynamic fields
  color: string
  description?: string
  service_count: number
}

// Service Type
export interface Service {
  id: string
  organization_id: string
  entity_type: 'service'
  entity_name: string
  entity_code: string
  smart_code: string
  entity_description?: string | null
  status: 'active' | 'archived' | 'deleted'
  created_at: string | null
  updated_at: string | null

  // Dynamic fields
  category?: string
  price?: number
  duration_minutes?: number
  requires_booking?: boolean
  color?: string
  currency?: string
}

// Form Validation Schemas
export const ServiceCategoryFormSchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  color: z.string().min(1, 'Color is required'),
  description: z.string().optional()
})

export type ServiceCategoryFormValues = z.infer<typeof ServiceCategoryFormSchema>

export const ServiceFormSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  code: z.string().optional(),
  category: z.string().optional(),
  price: z.number().min(0, 'Price must be positive').optional(),
  duration_minutes: z.number().min(1, 'Duration must be at least 1 minute').optional(),
  requires_booking: z.boolean().optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'archived']),
  currency: z.string().optional(),
  branch_ids: z.array(z.string()).optional() // Branch availability via AVAILABLE_AT relationships
})

export type ServiceFormValues = z.infer<typeof ServiceFormSchema>

// Predefined service colors
export const SERVICE_COLORS = [
  { name: 'Gold', value: '#D4AF37' },
  { name: 'Bronze', value: '#8C7853' },
  { name: 'Emerald', value: '#0F6F5C' },
  { name: 'Ruby', value: '#E0115F' },
  { name: 'Sapphire', value: '#0F52BA' },
  { name: 'Amethyst', value: '#9966CC' },
  { name: 'Rose', value: '#FF66B2' },
  { name: 'Coral', value: '#FF7F50' }
]
