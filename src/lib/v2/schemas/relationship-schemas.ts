import { z } from 'zod';

/**
 * HERA V2 API - Relationship Validation Schemas (Zod)
 * Enforces Sacred Six table constraints
 */

// Smart code pattern for all HERA smart codes
const smartCodePattern = /^HERA\.[A-Z]+\.[A-Z]+(?:\.[A-Z0-9]+)*\.v\d+$/;

// Base relationship schema
const relationshipBaseSchema = z.object({
  from_entity_id: z.string().uuid(),
  to_entity_id: z.string().uuid(),
  relationship_type: z.string().min(1),
  relationship_subtype: z.string().optional(),
  relationship_name: z.string().optional(),
  relationship_code: z.string().optional(),
  smart_code: z.string().regex(smartCodePattern, 'Invalid smart code format'),
  is_active: z.boolean().optional().default(true),
  effective_date: z.string().datetime().optional(),
  expiration_date: z.string().datetime().optional().nullable(),
  relationship_data: z.record(z.any()).optional().default({}),
  metadata: z.record(z.any()).optional().default({})
});

// Upsert schema
export const relationshipUpsertSchema = z.object({
  organization_id: z.string().uuid(),
  id: z.string().uuid().optional(),
  ...relationshipBaseSchema.shape
});

// Read schema
export const relationshipReadSchema = z.object({
  organization_id: z.string().uuid(),
  relationship_id: z.string().uuid()
});

// Query schema
export const relationshipQuerySchema = z.object({
  organization_id: z.string().uuid(),
  entity_id: z.string().uuid().optional(),
  side: z.enum(['either', 'from', 'to']).optional().default('either'),
  relationship_type: z.string().optional(),
  active_only: z.boolean().optional().default(true),
  effective_from: z.string().datetime().optional(),
  effective_to: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(1000).optional().default(100),
  offset: z.number().int().min(0).optional().default(0)
});

// Delete schema
export const relationshipDeleteSchema = z.object({
  organization_id: z.string().uuid(),
  relationship_id: z.string().uuid(),
  expiration_date: z.string().datetime().optional()
});

// Batch upsert schema
export const relationshipBatchSchema = z.object({
  organization_id: z.string().uuid(),
  rows: z.array(
    z.object({
      id: z.string().uuid().optional(),
      ...relationshipBaseSchema.shape
    })
  ).min(1).max(1000)
});

// Response schemas
export const relationshipResponseSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  from_entity_id: z.string().uuid(),
  to_entity_id: z.string().uuid(),
  relationship_type: z.string(),
  relationship_subtype: z.string().optional().nullable(),
  relationship_name: z.string().optional().nullable(),
  relationship_code: z.string().optional().nullable(),
  smart_code: z.string(),
  is_active: z.boolean(),
  effective_date: z.string().datetime(),
  expiration_date: z.string().datetime().optional().nullable(),
  relationship_data: z.record(z.any()),
  metadata: z.record(z.any()),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  version: z.number()
});

export const relationshipListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(relationshipResponseSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number()
});

export const relationshipBatchResponseSchema = z.object({
  success: z.boolean(),
  status: z.number(),
  results: z.array(z.object({
    status: z.number(),
    id: z.string().uuid().optional(),
    action: z.string().optional(),
    error: z.string().optional(),
    row: z.any().optional()
  })),
  summary: z.object({
    success_count: z.number(),
    error_count: z.number(),
    total: z.number()
  })
});

// Type exports
export type RelationshipUpsert = z.infer<typeof relationshipUpsertSchema>;
export type RelationshipRead = z.infer<typeof relationshipReadSchema>;
export type RelationshipQuery = z.infer<typeof relationshipQuerySchema>;
export type RelationshipDelete = z.infer<typeof relationshipDeleteSchema>;
export type RelationshipBatch = z.infer<typeof relationshipBatchSchema>;
export type RelationshipResponse = z.infer<typeof relationshipResponseSchema>;
export type RelationshipListResponse = z.infer<typeof relationshipListResponseSchema>;
export type RelationshipBatchResponse = z.infer<typeof relationshipBatchResponseSchema>;