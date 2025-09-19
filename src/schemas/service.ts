import { z } from 'zod'

export const ServiceFormSchema = z.object({
  name: z.string().min(2, 'Name is too short').max(100),
  code: z
    .string()
    .regex(/^[A-Z0-9_-]*$/i, 'Letters, numbers, - or _ only')
    .optional()
    .or(z.literal('')),
  duration_mins: z.number().int().min(5).max(480),
  category: z.string().optional(),
  price: z.number().min(0),
  currency: z.string().min(3).max(3).default('AED'),
  tax_rate: z.number().min(0).max(100).optional(),
  commission_type: z.enum(['flat', 'percent']).optional(),
  commission_value: z.number().min(0).optional(),
  description: z.string().max(2000).optional(),
  requires_equipment: z.boolean().optional()
})

export type ServiceForm = z.infer<typeof ServiceFormSchema>

export interface ServiceEntity {
  id: string
  organization_id: string
  smart_code: string
  name: string
  code?: string
  status: 'active' | 'archived'
  duration_mins?: number
  category?: string
  created_at?: string
  updated_at?: string
  metadata?: Record<string, any>
}

export interface ServiceWithDynamicData extends ServiceEntity {
  price?: number
  currency?: string
  tax_rate?: number
  commission_type?: 'flat' | 'percent'
  commission_value?: number
}
