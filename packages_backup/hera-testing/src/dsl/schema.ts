import { z } from 'zod';

// HERA Universal Testing DSL Schema
// Defines business process tests using HERA's 6-table architecture

export const PersonaSchema = z.object({
  role: z.enum(['owner', 'admin', 'manager', 'user', 'accountant', 'warehouse', 'sales', 'hr']),
  organization_id: z.string().uuid().optional(),
  entity_id: z.string().uuid().optional(),
  permissions: z.array(z.string()).optional()
});

export const ContextSchema = z.object({
  tenant: z.string(),
  organization_id: z.string().uuid(),
  currency: z.string().default('USD'),
  timezone: z.string().default('UTC'),
  locale: z.string().default('en-US'),
  fiscal_year: z.number().default(2024),
  clock: z.string().datetime().optional(), // Fixed time for deterministic tests
  smart_code_prefix: z.string().default('HERA.TEST'),
  industry: z.enum(['restaurant', 'healthcare', 'retail', 'salon', 'manufacturing', 'professional_services']).optional()
});

export const EntityDataSchema = z.object({
  entity_type: z.string(),
  entity_name: z.string(),
  entity_code: z.string().optional(),
  smart_code: z.string(),
  metadata: z.record(z.any()).optional(),
  dynamic_fields: z.record(z.any()).optional()
});

export const TransactionDataSchema = z.object({
  transaction_type: z.string(),
  transaction_code: z.string().optional(),
  smart_code: z.string(),
  total_amount: z.number().optional(),
  currency: z.string().optional(),
  reference_entity_id: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  line_items: z.array(z.object({
    line_entity_id: z.string().optional(),
    line_number: z.number(),
    quantity: z.number().optional(),
    unit_price: z.number().optional(),
    line_amount: z.number(),
    smart_code: z.string(),
    metadata: z.record(z.any()).optional()
  })).optional()
});

export const RelationshipDataSchema = z.object({
  from_entity_id: z.string(),
  to_entity_id: z.string(),
  relationship_type: z.string(),
  smart_code: z.string(),
  relationship_data: z.record(z.any()).optional()
});

export const StepActionSchema = z.discriminatedUnion('action_type', [
  z.object({
    action_type: z.literal('create_entity'),
    data: EntityDataSchema,
    store_as: z.string().optional()
  }),
  z.object({
    action_type: z.literal('create_transaction'),
    data: TransactionDataSchema,
    store_as: z.string().optional()
  }),
  z.object({
    action_type: z.literal('create_relationship'),
    data: RelationshipDataSchema,
    store_as: z.string().optional()
  }),
  z.object({
    action_type: z.literal('set_dynamic_field'),
    entity_id: z.string(),
    field_name: z.string(),
    field_value: z.any(),
    smart_code: z.string()
  }),
  z.object({
    action_type: z.literal('ui_interaction'),
    selector: z.string(),
    interaction: z.enum(['click', 'fill', 'select', 'upload', 'wait']),
    value: z.string().optional(),
    timeout: z.number().optional()
  }),
  z.object({
    action_type: z.literal('api_call'),
    endpoint: z.string(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
    data: z.record(z.any()).optional(),
    store_as: z.string().optional()
  }),
  z.object({
    action_type: z.literal('wait'),
    duration: z.number(),
    condition: z.string().optional()
  })
]);

export const StepSchema = z.object({
  id: z.string(),
  description: z.string(),
  persona: z.string(),
  actions: z.array(StepActionSchema),
  preconditions: z.array(z.string()).optional(),
  postconditions: z.array(z.string()).optional(),
  timeout: z.number().default(30000),
  retry: z.number().default(0)
});

export const UIAssertionSchema = z.object({
  type: z.literal('ui'),
  assertions: z.array(z.object({
    selector: z.string().optional(),
    condition: z.enum(['visible', 'hidden', 'contains', 'not_contains', 'enabled', 'disabled', 'count']),
    value: z.any().optional(),
    timeout: z.number().optional()
  }))
});

export const DatabaseAssertionSchema = z.object({
  type: z.literal('database'),
  assertions: z.array(z.object({
    table: z.enum(['core_organizations', 'core_entities', 'core_dynamic_data', 'core_relationships', 'universal_transactions', 'universal_transaction_lines']),
    condition: z.enum(['count', 'exists', 'not_exists', 'equals', 'contains']),
    filters: z.record(z.any()).optional(),
    expected: z.any()
  }))
});

export const BusinessAssertionSchema = z.object({
  type: z.literal('business'),
  assertions: z.array(z.object({
    oracle: z.enum(['accounting_equation', 'inventory_balance', 'workflow_status', 'tax_calculation', 'smart_code_validation']),
    expected: z.any(),
    tolerance: z.number().optional()
  }))
});

export const AssertionSchema = z.discriminatedUnion('type', [
  UIAssertionSchema,
  DatabaseAssertionSchema,
  BusinessAssertionSchema
]);

export const BusinessProcessTestSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  industry: z.string().optional(),
  version: z.string().default('1.0.0'),
  author: z.string().optional(),
  
  context: ContextSchema,
  personas: z.record(PersonaSchema),
  
  setup: z.array(StepActionSchema).optional(),
  steps: z.array(StepSchema),
  cleanup: z.array(StepActionSchema).optional(),
  
  assertions: z.array(AssertionSchema),
  
  metadata: z.object({
    tags: z.array(z.string()).default([]),
    priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    estimated_duration: z.number().optional(), // seconds
    requires_auth: z.boolean().default(true),
    requires_data: z.boolean().default(true),
    browser_support: z.array(z.enum(['chromium', 'firefox', 'webkit'])).default(['chromium']),
    mobile_support: z.boolean().default(false)
  }).default({})
});

export type BusinessProcessTest = z.infer<typeof BusinessProcessTestSchema>;
export type Persona = z.infer<typeof PersonaSchema>;
export type Context = z.infer<typeof ContextSchema>;
export type StepAction = z.infer<typeof StepActionSchema>;
export type Step = z.infer<typeof StepSchema>;
export type Assertion = z.infer<typeof AssertionSchema>;

// Smart Code patterns for testing
export const SMART_CODE_PATTERNS = {
  ENTITY: {
    CUSTOMER: 'HERA.CRM.CUST.ENT.PROF.v1',
    VENDOR: 'HERA.SCM.VEND.ENT.PROF.v1',
    PRODUCT: 'HERA.INV.PROD.ENT.ITEM.v1',
    EMPLOYEE: 'HERA.HR.EMP.ENT.PROF.v1',
    GL_ACCOUNT: 'HERA.FIN.GL.ACC.ENT.v1'
  },
  TRANSACTION: {
    SALE: 'HERA.CRM.SALE.TXN.ORDER.v1',
    PURCHASE: 'HERA.SCM.PUR.TXN.ORDER.v1',
    PAYMENT: 'HERA.FIN.PAY.TXN.v1',
    JOURNAL: 'HERA.FIN.GL.TXN.JE.v1'
  },
  RELATIONSHIP: {
    HAS_STATUS: 'HERA.WORKFLOW.STATUS.ASSIGN.v1',
    PARENT_OF: 'HERA.ORG.HIERARCHY.PARENT.v1',
    MEMBER_OF: 'HERA.ORG.MEMBERSHIP.v1'
  }
} as const;