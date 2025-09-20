import { z } from 'zod'

// Base schema for all write operations
export const BaseWriteSchema = z.object({
  orgId: z.string().uuid(),
  smart_code: z.string().regex(/^HERA\.SALON\.POS\.[A-Z0-9._]+\.v\d+$/),
  idempotency_key: z.string().min(8).optional(),
  actor_user_id: z.string().uuid().optional(),
})

// Service CRUD schemas
export const ServiceCreateSchema = BaseWriteSchema.extend({
  service: z.object({
    entity_name: z.string().min(3).max(100),
    price: z.number().min(0),
    duration: z.number().int().min(15).max(480), // minutes
    tax_code: z.string().default('VAT5'),
    category: z.string().optional(),
    description: z.string().optional(),
  }),
})

export const ServiceUpdateSchema = BaseWriteSchema.extend({
  service: z.object({
    id: z.string().uuid(),
    entity_name: z.string().min(3).max(100).optional(),
    price: z.number().min(0).optional(),
    duration: z.number().int().min(15).max(480).optional(),
    tax_code: z.string().optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['active', 'archived']).optional(),
  }).refine(data => {
    const { id, ...rest } = data
    return Object.keys(rest).length > 0
  }, { message: "At least one field must be updated" }),
})

export const ServiceDeleteSchema = BaseWriteSchema.extend({
  service: z.object({
    id: z.string().uuid(),
  }),
})

// Product CRUD schemas
export const ProductCreateSchema = BaseWriteSchema.extend({
  product: z.object({
    entity_name: z.string().min(3).max(100),
    sku: z.string().min(3).max(50),
    price: z.number().min(0),
    tax_code: z.string().default('VAT5'),
    category: z.string().optional(),
    uom: z.string().default('unit'),
    track_stock: z.boolean().default(true),
    description: z.string().optional(),
  }),
})

export const ProductUpdateSchema = BaseWriteSchema.extend({
  product: z.object({
    id: z.string().uuid(),
    entity_name: z.string().min(3).max(100).optional(),
    sku: z.string().min(3).max(50).optional(),
    price: z.number().min(0).optional(),
    tax_code: z.string().optional(),
    category: z.string().optional(),
    uom: z.string().optional(),
    track_stock: z.boolean().optional(),
    description: z.string().optional(),
    status: z.enum(['active', 'archived']).optional(),
  }).refine(data => {
    const { id, ...rest } = data
    return Object.keys(rest).length > 0
  }, { message: "At least one field must be updated" }),
})

export const ProductDeleteSchema = BaseWriteSchema.extend({
  product: z.object({
    id: z.string().uuid(),
  }),
})

// Customer CRUD schemas
export const CustomerCreateSchema = BaseWriteSchema.extend({
  customer: z.object({
    entity_name: z.string().min(3).max(100),
    phone: z.string().min(10).max(20),
    email: z.string().email().optional(),
    address: z.string().optional(),
    loyalty_points: z.number().int().min(0).default(0),
    notes: z.string().optional(),
  }),
})

export const CustomerUpdateSchema = BaseWriteSchema.extend({
  customer: z.object({
    id: z.string().uuid(),
    entity_name: z.string().min(3).max(100).optional(),
    phone: z.string().min(10).max(20).optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
    loyalty_points: z.number().int().min(0).optional(),
    notes: z.string().optional(),
    status: z.enum(['active', 'archived']).optional(),
  }).refine(data => {
    const { id, ...rest } = data
    return Object.keys(rest).length > 0
  }, { message: "At least one field must be updated" }),
})

export const CustomerDeleteSchema = BaseWriteSchema.extend({
  customer: z.object({
    id: z.string().uuid(),
  }),
})

// Query schemas
export const ListQuerySchema = z.object({
  orgId: z.string().uuid(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().optional(),
  status: z.enum(['active', 'archived', 'all']).default('active'),
  category: z.string().optional(),
})

export const GetByIdSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
})

// Response schemas for type safety
export const ServiceResponseSchema = z.object({
  id: z.string().uuid(),
  entity_name: z.string(),
  entity_type: z.literal('salon_service'),
  price: z.number(),
  duration: z.number(),
  tax_code: z.string(),
  category: z.string().nullable(),
  description: z.string().nullable(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const ProductResponseSchema = z.object({
  id: z.string().uuid(),
  entity_name: z.string(),
  entity_type: z.literal('product'),
  sku: z.string(),
  price: z.number(),
  tax_code: z.string(),
  category: z.string().nullable(),
  uom: z.string(),
  track_stock: z.boolean(),
  description: z.string().nullable(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const CustomerResponseSchema = z.object({
  id: z.string().uuid(),
  entity_name: z.string(),
  entity_type: z.literal('customer'),
  phone: z.string(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  loyalty_points: z.number(),
  notes: z.string().nullable(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})

// Type exports
export type ServiceCreate = z.infer<typeof ServiceCreateSchema>
export type ServiceUpdate = z.infer<typeof ServiceUpdateSchema>
export type ServiceResponse = z.infer<typeof ServiceResponseSchema>

export type ProductCreate = z.infer<typeof ProductCreateSchema>
export type ProductUpdate = z.infer<typeof ProductUpdateSchema>
export type ProductResponse = z.infer<typeof ProductResponseSchema>

export type CustomerCreate = z.infer<typeof CustomerCreateSchema>
export type CustomerUpdate = z.infer<typeof CustomerUpdateSchema>
export type CustomerResponse = z.infer<typeof CustomerResponseSchema>

export type ListQuery = z.infer<typeof ListQuerySchema>
export type GetById = z.infer<typeof GetByIdSchema>