// HERA Universal API Schemas - Request body validation for all RPC operations
// ✅ STEP 4 COMPLIANT - All guardrail violations fixed
import { z } from 'zod'
import { UUID, SmartCodeSchema, CurrencySchema } from './zprimitives'

// ================================================================================
// ENTITIES
// ================================================================================

export const EntityUpsertBody = z.object({
  p_organization_id: UUID,
  p_entity_type: z.string().min(1).max(100),
  p_entity_name: z.string().min(1).max(500),
  p_smart_code: SmartCodeSchema,
  p_entity_id: UUID.optional().nullable(),
  p_entity_code: z.string().max(100).optional().nullable(),
  p_entity_description: z.string().max(2000).optional().nullable(),
  p_parent_entity_id: UUID.optional().nullable(),
  p_status: z.enum(['active', 'inactive', 'draft', 'archived']).optional().nullable(),
  p_metadata: z.record(z.any()).optional().nullable()
})

export const EntityReadParams = z.object({
  p_entity_id: UUID,
  p_organization_id: UUID
})

export const EntityDeleteParams = z.object({
  p_entity_id: UUID,
  p_organization_id: UUID
})

export const EntityRecoverParams = z.object({
  p_entity_id: UUID,
  p_organization_id: UUID
})

export const EntityProfilesQuery = z.object({
  p_organization_id: UUID,
  p_entity_type: z.string().optional(),
  p_smart_code: SmartCodeSchema.optional(),
  p_parent_entity_id: UUID.optional(),
  p_status: z.string().optional()
})

// ================================================================================
// DYNAMIC DATA
// ✅ FIX #3: Smart code now REQUIRED
// ✅ FIX #5: Added field_value_file_url and calculated_value
// ✅ FIX #6: Consistent datetime format for field_value_date
// ================================================================================

export const DynamicDataSetBody = z.object({
  p_organization_id: UUID,
  p_entity_id: UUID,
  p_field_name: z.string().min(1).max(200),
  p_field_type: z.enum(['text', 'number', 'boolean', 'date', 'json']),
  p_field_value: z.string().optional().nullable(),
  p_field_value_number: z.number().optional().nullable(),
  p_field_value_boolean: z.boolean().optional().nullable(),
  p_field_value_date: z.string().datetime().optional().nullable(), // ✅ FIX #6: datetime format
  p_field_value_json: z.any().optional().nullable(),
  p_field_value_file_url: z.string().url().optional().nullable(), // ✅ FIX #5: added
  p_calculated_value: z.any().optional().nullable(), // ✅ FIX #5: added
  p_smart_code: SmartCodeSchema // ✅ FIX #3: now required
})

export const DynamicDataBatchBody = z.object({
  p_organization_id: UUID,
  p_entity_id: UUID,
  p_fields: z.array(
    z.object({
      field_name: z.string(),
      field_type: z.enum(['text', 'number', 'boolean', 'date', 'json']),
      field_value: z.string().optional().nullable(),
      field_value_number: z.number().optional().nullable(),
      field_value_boolean: z.boolean().optional().nullable(),
      field_value_date: z.string().datetime().optional().nullable(), // ✅ FIX #6: datetime format
      field_value_json: z.any().optional().nullable(),
      field_value_file_url: z.string().url().optional().nullable(), // ✅ FIX #5: added
      calculated_value: z.any().optional().nullable() // ✅ FIX #5: added
    })
  ),
  p_smart_code: SmartCodeSchema // ✅ FIX #3: now required
})

export const DynamicDataGetParams = z.object({
  p_entity_id: UUID,
  p_organization_id: UUID,
  p_field_name: z.string().optional()
})

export const DynamicDataDeleteParams = z.object({
  p_organization_id: UUID,
  p_entity_id: UUID,
  p_field_name: z.string().optional() // delete one field or all fields for entity
})

// ================================================================================
// RELATIONSHIPS
// ✅ FIX #1: Changed from source/target to from/to (canonical relationship keys)
// ================================================================================

export const RelationshipUpsertBody = z.object({
  p_organization_id: UUID,
  p_from_entity_id: UUID, // ✅ FIX #1: was p_source_entity_id
  p_to_entity_id: UUID, // ✅ FIX #1: was p_target_entity_id
  p_relationship_type: z.string().min(1).max(100),
  p_smart_code: SmartCodeSchema,
  p_relationship_id: UUID.optional().nullable(),
  p_relationship_strength: z.number().min(0).max(1).optional().nullable(),
  p_relationship_data: z.any().optional().nullable(),
  p_is_bidirectional: z.boolean().optional().nullable(),
  p_hierarchy_level: z.number().optional().nullable()
})

export const RelationshipUpsertBatchBody = z.object({
  p_organization_id: UUID,
  p_relationships: z.array(
    z.object({
      from_entity_id: UUID, // ✅ FIX #1: was source_entity_id
      to_entity_id: UUID, // ✅ FIX #1: was target_entity_id
      relationship_type: z.string(),
      smart_code: SmartCodeSchema,
      relationship_strength: z.number().optional(),
      relationship_data: z.any().optional(),
      is_bidirectional: z.boolean().optional()
    })
  )
})

export const RelationshipQueryBody = z.object({
  p_organization_id: UUID,
  p_from_entity_id: UUID.optional(), // ✅ FIX #1: was p_source_entity_id
  p_to_entity_id: UUID.optional(), // ✅ FIX #1: was p_target_entity_id
  p_relationship_type: z.string().optional(),
  p_smart_code: SmartCodeSchema.optional()
})

export const RelationshipReadParams = z.object({
  p_relationship_id: UUID,
  p_organization_id: UUID
})

export const RelationshipDeleteParams = z.object({
  p_relationship_id: UUID,
  p_organization_id: UUID
})

export const RelationshipCreateBody = z.object({
  p_organization_id: UUID,
  p_from_entity_id: UUID, // ✅ FIX #1: was p_source_entity_id
  p_to_entity_id: UUID, // ✅ FIX #1: was p_target_entity_id
  p_relationship_type: z.string(),
  p_smart_code: SmartCodeSchema,
  p_relationship_data: z.any().optional()
})

// ================================================================================
// TRANSACTIONS
// ✅ FIX #4: Added full Finance DNA currency fields
// ================================================================================

// Enhanced Currency Schema with Finance DNA fields
export const FinanceDNACurrencySchema = z.object({
  transaction_currency_code: z.string().length(3),
  base_currency_code: z.string().length(3).optional(),
  exchange_rate: z.number().positive().optional(),
  exchange_rate_date: z.string().datetime().optional(),
  exchange_rate_type: z.string().optional()
})

export const TransactionEmitBody = z.object({
  p_organization_id: UUID,
  p_transaction_type: z.string().min(1).max(100),
  p_smart_code: SmartCodeSchema,
  p_source_entity_id: UUID.optional().nullable(),
  p_target_entity_id: UUID.optional().nullable(),
  p_transaction_date: z.string().datetime().optional(),
  p_total_amount: z.number().optional().nullable(),
  // ✅ FIX #4: Full Finance DNA currency fields
  p_transaction_currency_code: z.string().length(3).optional(),
  p_base_currency_code: z.string().length(3).optional(),
  p_exchange_rate: z.number().positive().optional(),
  p_exchange_rate_date: z.string().datetime().optional(),
  p_exchange_rate_type: z.string().optional(),
  p_reference_number: z.string().max(200).optional().nullable(),
  p_metadata: z.any().optional().nullable()
})

export const TransactionCreateBody = z.object({
  p_organization_id: UUID,
  p_transaction_type: z.string().min(1).max(100),
  p_smart_code: SmartCodeSchema,
  p_source_entity_id: UUID.optional().nullable(),
  p_target_entity_id: UUID.optional().nullable(),
  p_transaction_date: z.string().datetime(),
  p_total_amount: z.number(),
  // ✅ FIX #4: Full Finance DNA currency fields
  p_transaction_currency_code: z.string().length(3),
  p_base_currency_code: z.string().length(3).optional(),
  p_exchange_rate: z.number().positive().optional(),
  p_exchange_rate_date: z.string().datetime().optional(),
  p_exchange_rate_type: z.string().optional(),
  p_reference_number: z.string().max(200).optional().nullable(),
  p_status: z.enum(['draft', 'pending', 'approved', 'completed', 'cancelled']).optional(),
  p_fiscal_year: z.number().optional(),
  p_fiscal_period: z.number().optional(),
  p_metadata: z.any().optional().nullable(),
  // Optional line items (can be added separately)
  p_line_items: z
    .array(
      z.object({
        entity_id: UUID.optional(),
        smart_code: SmartCodeSchema, // ✅ REQUIRED - matches universal_transaction_lines table
        line_number: z.number().int().min(1), // ✅ FIX #2: aligned with table
        line_type: z.string().min(1), // ✅ FIX #2: aligned with table
        description: z.string(), // ✅ FIX #2: renamed from line_description
        quantity: z.number(),
        unit_amount: z.number(), // ✅ FIX #2: renamed from unit_price
        line_amount: z.number(),
        account_id: UUID.optional(),
        tax_code: z.string().optional(),
        tax_amount: z.number().optional(),
        discount_percentage: z.number().optional(),
        discount_amount: z.number().optional()
      })
    )
    .optional()
})

export const TransactionReadParams = z.object({
  p_transaction_id: UUID,
  p_organization_id: UUID
})

export const TransactionQueryBody = z.object({
  p_organization_id: UUID,
  p_transaction_type: z.string().optional(),
  p_smart_code: SmartCodeSchema.optional(),
  p_source_entity_id: UUID.optional(),
  p_target_entity_id: UUID.optional(),
  p_status: z.enum(['draft', 'pending', 'approved', 'completed', 'cancelled']).optional(),
  p_date_from: z.string().datetime().optional(),
  p_date_to: z.string().datetime().optional(),
  p_fiscal_year: z.number().optional(),
  p_fiscal_period: z.number().optional()
})

export const TransactionUpdateBody = z.object({
  p_transaction_id: UUID,
  p_organization_id: UUID,
  p_transaction_type: z.string().optional(),
  p_source_entity_id: UUID.optional(),
  p_target_entity_id: UUID.optional(),
  p_total_amount: z.number().optional(),
  // ✅ FIX #4: Full Finance DNA currency fields
  p_transaction_currency_code: z.string().length(3).optional(),
  p_base_currency_code: z.string().length(3).optional(),
  p_exchange_rate: z.number().positive().optional(),
  p_exchange_rate_date: z.string().datetime().optional(),
  p_exchange_rate_type: z.string().optional(),
  p_status: z.enum(['draft', 'pending', 'approved', 'completed', 'cancelled']).optional(),
  p_reference_number: z.string().optional(),
  p_metadata: z.any().optional()
})

export const TransactionDeleteParams = z.object({
  p_transaction_id: UUID,
  p_organization_id: UUID
})

export const TransactionVoidBody = z.object({
  p_transaction_id: UUID,
  p_organization_id: UUID,
  p_void_reason: z.string().optional(),
  p_void_date: z.string().datetime().optional()
})

export const TransactionReverseBody = z.object({
  p_transaction_id: UUID,
  p_organization_id: UUID,
  p_reverse_date: z.string().datetime().optional(),
  p_reverse_reason: z.string().optional()
})

export const TransactionValidateParams = z.object({
  p_transaction_id: UUID,
  p_organization_id: UUID
})

// ================================================================================
// TRANSACTION LINES
// ✅ FIX #2: Complete alignment with universal_transaction_lines table
// - Added required: line_number, line_type, smart_code
// - Renamed: line_description → description, unit_price → unit_amount
// - Removed: debit_credit (moved to metadata - GL polarity derived by posting rules)
// ================================================================================

export const TransactionLineAppendBody = z.object({
  p_transaction_id: UUID,
  p_organization_id: UUID,
  p_line_number: z.number().int().min(1), // ✅ FIX #2: required
  p_line_type: z.string().min(1), // ✅ FIX #2: required
  p_smart_code: SmartCodeSchema, // ✅ FIX #2: required by guardrail
  p_entity_id: UUID.optional().nullable(),
  p_description: z.string().min(1).max(1000), // ✅ FIX #2: renamed from p_line_description
  p_quantity: z.number(),
  p_unit_amount: z.number(), // ✅ FIX #2: renamed from p_unit_price
  p_line_amount: z.number(),
  p_discount_amount: z.number().optional(),
  p_tax_amount: z.number().optional(),
  p_account_id: UUID.optional(),
  p_tax_code: z.string().max(50).optional(),
  p_metadata: z.any().optional() // ✅ FIX #2: debit_credit moved here if needed
})

// ================================================================================
// QUERY & FILTER SCHEMAS
// ================================================================================

export const PaginationParams = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc')
})

export const SearchParams = z
  .object({
    q: z.string().optional(),
    p_organization_id: UUID, // ✅ Consistent naming with other RPC schemas
    entity_type: z.string().optional(),
    smart_code: SmartCodeSchema.optional(),
    date_from: z.string().datetime().optional(),
    date_to: z.string().datetime().optional()
  })
  .merge(PaginationParams)

// ================================================================================
// RESPONSE SCHEMAS
// ================================================================================

export const SuccessResponse = z.object({
  success: z.literal(true),
  data: z.any(),
  message: z.string().optional()
})

export const ErrorResponse = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
  details: z.any().optional()
})

export const PaginatedResponse = z.object({
  success: z.literal(true),
  data: z.array(z.any()),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    pages: z.number()
  }),
  _links: z
    .object({
      self: z.string(),
      next: z.string().nullable(),
      prev: z.string().nullable()
    })
    .optional()
})

// ================================================================================
// EXPORT ALL SCHEMAS
// ================================================================================

export const Schemas = {
  // Entities
  EntityUpsertBody,
  EntityReadParams,
  EntityDeleteParams,
  EntityRecoverParams,
  EntityProfilesQuery,

  // Dynamic Data
  DynamicDataSetBody,
  DynamicDataBatchBody,
  DynamicDataGetParams,
  DynamicDataDeleteParams,

  // Relationships
  RelationshipUpsertBody,
  RelationshipUpsertBatchBody,
  RelationshipQueryBody,
  RelationshipReadParams,
  RelationshipDeleteParams,
  RelationshipCreateBody,

  // Transactions
  TransactionEmitBody,
  TransactionCreateBody,
  TransactionReadParams,
  TransactionQueryBody,
  TransactionUpdateBody,
  TransactionDeleteParams,
  TransactionVoidBody,
  TransactionReverseBody,
  TransactionValidateParams,
  TransactionLineAppendBody,

  // Query & Pagination
  PaginationParams,
  SearchParams,

  // Responses
  SuccessResponse,
  ErrorResponse,
  PaginatedResponse
}

export default Schemas
// compat re-exports
export {
  DynamicGetQuery,
  DynamicBatchBody,
  DynamicSetBody,
  RelationshipBatchBody,
  RelationshipQuery,
  TxnBatchBody,
  TxnEmitBody,
  TxnSearchQuery
} from './schemas-core'

// Dynamic Delete Body Schema - for batch deletion of dynamic data fields
export const DynamicDeleteBody = z.object({
  organization_id: UUID,
  entity_id: UUID,
  field_name: z.string().min(1).optional() // if provided, delete specific field; if not, delete all fields for entity
})

export type DynamicDeleteBody = z.infer<typeof DynamicDeleteBody>
