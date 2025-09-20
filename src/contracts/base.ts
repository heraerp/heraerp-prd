/**
 * HERA Base Contracts
 *
 * Core type definitions and schemas used throughout the HERA system.
 * These follow HERA's Sacred Six Tables architecture.
 */

import { z } from 'zod'

import type { Brand } from '@/utils/exact'

// HERA Brand Types for Type Safety
export type EntityId = Brand<string, 'EntityId'>
export type OrganizationId = Brand<string, 'OrganizationId'>
export type TransactionId = Brand<string, 'TransactionId'>
export type SmartCode = Brand<string, 'SmartCode'>

// UUID Validation Schema
export const UuidSchema = z.string().uuid()

// Smart Code Validation Schema
export const SmartCodeSchema = z
  .string()
  .regex(
    /^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.[A-Z]+\.v\d+$/,
    'Smart Code must follow format: HERA.{DOMAIN}.{MODULE}.{TYPE}.{SUBTYPE}.v{N}'
  )
  .transform(val => val as SmartCode)

// Entity ID Schema
export const EntityIdSchema = UuidSchema.transform(val => val as EntityId)

// Organization ID Schema
export const OrganizationIdSchema = UuidSchema.transform(val => val as OrganizationId)

// Transaction ID Schema
export const TransactionIdSchema = UuidSchema.transform(val => val as TransactionId)

// ISO DateTime Schema
export const DateTimeSchema = z.string().datetime()

// Base Entity Schema (core_entities table)
export const BaseEntitySchema = z
  .object({
    id: EntityIdSchema,
    organization_id: OrganizationIdSchema,
    entity_type: z.string().min(1),
    entity_name: z.string().min(1),
    entity_code: z.string().min(1),
    entity_description: z.string().nullable(),
    smart_code: SmartCodeSchema,
    smart_code_status: z.enum(['active', 'pending', 'deprecated']).default('active'),
    ai_confidence: z.number().min(0).max(1).default(0),
    ai_classification: z.record(z.unknown()).nullable(),
    ai_insights: z.record(z.unknown()).nullable(),
    business_rules: z.record(z.unknown()).nullable(),
    metadata: z.record(z.unknown()).nullable(),
    tags: z.array(z.string()).nullable(),
    status: z.string().default('active'),
    created_at: DateTimeSchema,
    updated_at: DateTimeSchema,
    created_by: UuidSchema.nullable(),
    updated_by: UuidSchema.nullable(),
    version: z.number().int().positive().default(1)
  })
  .strict()

export type BaseEntity = z.infer<typeof BaseEntitySchema>

// Dynamic Data Schema (core_dynamic_data table)
export const DynamicDataSchema = z
  .object({
    id: UuidSchema,
    organization_id: OrganizationIdSchema,
    entity_id: EntityIdSchema,
    field_name: z.string().min(1),
    field_type: z.enum(['text', 'number', 'boolean', 'date', 'json', 'file']).default('text'),
    field_value_text: z.string().nullable(),
    field_value_number: z.number().nullable(),
    field_value_boolean: z.boolean().nullable(),
    field_value_date: DateTimeSchema.nullable(),
    field_value_json: z.record(z.unknown()).nullable(),
    field_value_file_url: z.string().url().nullable(),
    calculated_value: z.record(z.unknown()).nullable(),
    smart_code: SmartCodeSchema,
    smart_code_status: z.enum(['active', 'pending', 'deprecated']).default('active'),
    ai_confidence: z.number().min(0).max(1).default(0),
    ai_enhanced_value: z.record(z.unknown()).nullable(),
    ai_insights: z.record(z.unknown()).nullable(),
    validation_rules: z.record(z.unknown()).nullable(),
    validation_status: z.enum(['valid', 'invalid', 'pending']).default('pending'),
    field_order: z.number().int().default(0),
    is_searchable: z.boolean().default(true),
    is_required: z.boolean().default(false),
    is_system_field: z.boolean().default(false),
    created_at: DateTimeSchema,
    updated_at: DateTimeSchema,
    created_by: UuidSchema.nullable(),
    updated_by: UuidSchema.nullable(),
    version: z.number().int().positive().default(1)
  })
  .strict()

export type DynamicData = z.infer<typeof DynamicDataSchema>

// Relationship Schema (core_relationships table)
export const RelationshipSchema = z
  .object({
    id: UuidSchema,
    organization_id: OrganizationIdSchema,
    from_entity_id: EntityIdSchema,
    to_entity_id: EntityIdSchema,
    relationship_type: z.string().min(1),
    relationship_direction: z.enum(['unidirectional', 'bidirectional']).default('bidirectional'),
    relationship_strength: z.number().min(0).max(1).default(1),
    relationship_data: z.record(z.unknown()).nullable(),
    smart_code: SmartCodeSchema,
    smart_code_status: z.enum(['active', 'pending', 'deprecated']).default('active'),
    ai_confidence: z.number().min(0).max(1).default(0),
    ai_classification: z.record(z.unknown()).nullable(),
    ai_insights: z.record(z.unknown()).nullable(),
    business_logic: z.record(z.unknown()).nullable(),
    validation_rules: z.record(z.unknown()).nullable(),
    is_active: z.boolean().default(true),
    effective_date: DateTimeSchema,
    expiration_date: DateTimeSchema.nullable(),
    created_at: DateTimeSchema,
    updated_at: DateTimeSchema,
    created_by: UuidSchema.nullable(),
    updated_by: UuidSchema.nullable(),
    version: z.number().int().positive().default(1)
  })
  .strict()

export type Relationship = z.infer<typeof RelationshipSchema>

// Transaction Schema (universal_transactions table)
export const TransactionSchema = z
  .object({
    id: TransactionIdSchema,
    organization_id: OrganizationIdSchema,
    transaction_type: z.string().min(1),
    transaction_code: z.string().min(1),
    transaction_date: DateTimeSchema,
    source_entity_id: EntityIdSchema,
    target_entity_id: EntityIdSchema.nullable(),
    total_amount: z.number(),
    transaction_status: z.string().default('pending'),
    reference_number: z.string().nullable(),
    external_reference: z.string().nullable(),
    smart_code: SmartCodeSchema,
    smart_code_status: z.enum(['active', 'pending', 'deprecated']).default('active'),
    ai_confidence: z.number().min(0).max(1).default(0),
    ai_classification: z.record(z.unknown()).nullable(),
    ai_insights: z.record(z.unknown()).nullable(),
    business_context: z.record(z.unknown()).nullable(),
    metadata: z.record(z.unknown()).nullable(),
    approval_required: z.boolean().default(false),
    approved_by: UuidSchema.nullable(),
    approved_at: DateTimeSchema.nullable(),
    created_at: DateTimeSchema,
    updated_at: DateTimeSchema,
    created_by: UuidSchema.nullable(),
    updated_by: UuidSchema.nullable(),
    version: z.number().int().positive().default(1),
    transaction_currency_code: z.string().length(3).nullable(),
    base_currency_code: z.string().length(3).nullable(),
    exchange_rate: z.number().positive().nullable(),
    exchange_rate_date: DateTimeSchema.nullable(),
    exchange_rate_type: z.string().nullable(),
    fiscal_period_entity_id: EntityIdSchema.nullable(),
    fiscal_year: z.number().int().nullable(),
    fiscal_period: z.string().nullable(),
    posting_period_code: z.string().nullable()
  })
  .strict()

export type Transaction = z.infer<typeof TransactionSchema>

// Transaction Line Schema (universal_transaction_lines table)
export const TransactionLineSchema = z
  .object({
    id: UuidSchema,
    organization_id: OrganizationIdSchema,
    transaction_id: TransactionIdSchema,
    line_number: z.number().int().positive(),
    entity_id: EntityIdSchema,
    line_type: z.string().min(1),
    description: z.string(),
    quantity: z.number().default(1),
    unit_amount: z.number(),
    line_amount: z.number(),
    discount_amount: z.number().default(0),
    tax_amount: z.number().default(0),
    smart_code: SmartCodeSchema,
    smart_code_status: z.enum(['active', 'pending', 'deprecated']).default('active'),
    ai_confidence: z.number().min(0).max(1).default(0),
    ai_classification: z.record(z.unknown()).nullable(),
    ai_insights: z.record(z.unknown()).nullable(),
    line_data: z.record(z.unknown()).nullable(),
    created_at: DateTimeSchema,
    updated_at: DateTimeSchema,
    created_by: UuidSchema.nullable(),
    updated_by: UuidSchema.nullable(),
    version: z.number().int().positive().default(1)
  })
  .strict()

export type TransactionLine = z.infer<typeof TransactionLineSchema>

// Organization Schema (core_organizations table)
export const OrganizationSchema = z
  .object({
    id: OrganizationIdSchema,
    organization_name: z.string().min(1),
    organization_code: z.string().min(1),
    organization_type: z.string().min(1),
    industry_classification: z.string().min(1),
    parent_organization_id: OrganizationIdSchema.nullable(),
    ai_insights: z.record(z.unknown()).nullable(),
    ai_classification: z.record(z.unknown()).nullable(),
    ai_confidence: z.number().min(0).max(1).default(0),
    settings: z.record(z.unknown()).nullable(),
    status: z.string().default('active'),
    created_at: DateTimeSchema,
    updated_at: DateTimeSchema,
    created_by: UuidSchema.nullable(),
    updated_by: UuidSchema.nullable()
  })
  .strict()

export type Organization = z.infer<typeof OrganizationSchema>

// Common Status Enums
export const CommonStatusSchema = z.enum([
  'draft',
  'pending',
  'active',
  'approved',
  'rejected',
  'cancelled',
  'completed',
  'archived'
])

export type CommonStatus = z.infer<typeof CommonStatusSchema>

// Pagination Schemas
export const PaginationSchema = z
  .object({
    page: z.number().int().positive().default(1),
    page_size: z.number().int().positive().max(100).default(20)
  })
  .strict()

export type Pagination = z.infer<typeof PaginationSchema>

export const PaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z
    .object({
      items: z.array(itemSchema),
      total_count: z.number().int().nonnegative(),
      page: z.number().int().positive(),
      page_size: z.number().int().positive(),
      total_pages: z.number().int().nonnegative(),
      has_next: z.boolean(),
      has_previous: z.boolean()
    })
    .strict()

// API Response Schemas
export const ApiErrorSchema = z
  .object({
    error: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
    timestamp: DateTimeSchema,
    request_id: z.string().optional()
  })
  .strict()

export type ApiError = z.infer<typeof ApiErrorSchema>

export const ApiSuccessSchema = <T extends z.ZodType>(dataSchema: T) =>
  z
    .object({
      success: z.literal(true),
      data: dataSchema,
      message: z.string().optional(),
      timestamp: DateTimeSchema,
      request_id: z.string().optional()
    })
    .strict()

// Field Validation Helpers
export const nonEmptyString = (message = 'Field cannot be empty'): z.ZodString =>
  z.string().min(1, message)

export const positiveNumber = (message = 'Must be a positive number'): z.ZodNumber =>
  z.number().positive(message)

export const nonNegativeNumber = (message = 'Must be non-negative'): z.ZodNumber =>
  z.number().nonnegative(message)
