"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SMART_CODE_PATTERNS = exports.BusinessProcessTestSchema = exports.AssertionSchema = exports.BusinessAssertionSchema = exports.DatabaseAssertionSchema = exports.UIAssertionSchema = exports.StepSchema = exports.StepActionSchema = exports.RelationshipDataSchema = exports.TransactionDataSchema = exports.EntityDataSchema = exports.ContextSchema = exports.PersonaSchema = void 0;
const zod_1 = require("zod");
// HERA Universal Testing DSL Schema
// Defines business process tests using HERA's 6-table architecture
exports.PersonaSchema = zod_1.z.object({
    role: zod_1.z.enum(['owner', 'admin', 'manager', 'user', 'accountant', 'warehouse', 'sales', 'hr']),
    organization_id: zod_1.z.string().uuid().optional(),
    entity_id: zod_1.z.string().uuid().optional(),
    permissions: zod_1.z.array(zod_1.z.string()).optional()
});
exports.ContextSchema = zod_1.z.object({
    tenant: zod_1.z.string(),
    organization_id: zod_1.z.string().uuid(),
    currency: zod_1.z.string().default('USD'),
    timezone: zod_1.z.string().default('UTC'),
    locale: zod_1.z.string().default('en-US'),
    fiscal_year: zod_1.z.number().default(2024),
    clock: zod_1.z.string().datetime().optional(), // Fixed time for deterministic tests
    smart_code_prefix: zod_1.z.string().default('HERA.TEST'),
    industry: zod_1.z.enum(['restaurant', 'healthcare', 'retail', 'salon', 'manufacturing', 'professional_services']).optional()
});
exports.EntityDataSchema = zod_1.z.object({
    entity_type: zod_1.z.string(),
    entity_name: zod_1.z.string(),
    entity_code: zod_1.z.string().optional(),
    smart_code: zod_1.z.string(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    dynamic_fields: zod_1.z.record(zod_1.z.any()).optional()
});
exports.TransactionDataSchema = zod_1.z.object({
    transaction_type: zod_1.z.string(),
    transaction_code: zod_1.z.string().optional(),
    smart_code: zod_1.z.string(),
    total_amount: zod_1.z.number().optional(),
    currency: zod_1.z.string().optional(),
    reference_entity_id: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    line_items: zod_1.z.array(zod_1.z.object({
        line_entity_id: zod_1.z.string().optional(),
        line_number: zod_1.z.number(),
        quantity: zod_1.z.number().optional(),
        unit_price: zod_1.z.number().optional(),
        line_amount: zod_1.z.number(),
        smart_code: zod_1.z.string(),
        metadata: zod_1.z.record(zod_1.z.any()).optional()
    })).optional()
});
exports.RelationshipDataSchema = zod_1.z.object({
    from_entity_id: zod_1.z.string(),
    to_entity_id: zod_1.z.string(),
    relationship_type: zod_1.z.string(),
    smart_code: zod_1.z.string(),
    relationship_data: zod_1.z.record(zod_1.z.any()).optional()
});
exports.StepActionSchema = zod_1.z.discriminatedUnion('action_type', [
    zod_1.z.object({
        action_type: zod_1.z.literal('create_entity'),
        data: exports.EntityDataSchema,
        store_as: zod_1.z.string().optional()
    }),
    zod_1.z.object({
        action_type: zod_1.z.literal('create_transaction'),
        data: exports.TransactionDataSchema,
        store_as: zod_1.z.string().optional()
    }),
    zod_1.z.object({
        action_type: zod_1.z.literal('create_relationship'),
        data: exports.RelationshipDataSchema,
        store_as: zod_1.z.string().optional()
    }),
    zod_1.z.object({
        action_type: zod_1.z.literal('set_dynamic_field'),
        entity_id: zod_1.z.string(),
        field_name: zod_1.z.string(),
        field_value: zod_1.z.any(),
        smart_code: zod_1.z.string()
    }),
    zod_1.z.object({
        action_type: zod_1.z.literal('ui_interaction'),
        selector: zod_1.z.string(),
        interaction: zod_1.z.enum(['click', 'fill', 'select', 'upload', 'wait']),
        value: zod_1.z.string().optional(),
        timeout: zod_1.z.number().optional()
    }),
    zod_1.z.object({
        action_type: zod_1.z.literal('api_call'),
        endpoint: zod_1.z.string(),
        method: zod_1.z.enum(['GET', 'POST', 'PUT', 'DELETE']),
        data: zod_1.z.record(zod_1.z.any()).optional(),
        store_as: zod_1.z.string().optional()
    }),
    zod_1.z.object({
        action_type: zod_1.z.literal('wait'),
        duration: zod_1.z.number(),
        condition: zod_1.z.string().optional()
    })
]);
exports.StepSchema = zod_1.z.object({
    id: zod_1.z.string(),
    description: zod_1.z.string(),
    persona: zod_1.z.string(),
    actions: zod_1.z.array(exports.StepActionSchema),
    preconditions: zod_1.z.array(zod_1.z.string()).optional(),
    postconditions: zod_1.z.array(zod_1.z.string()).optional(),
    timeout: zod_1.z.number().default(30000),
    retry: zod_1.z.number().default(0)
});
exports.UIAssertionSchema = zod_1.z.object({
    type: zod_1.z.literal('ui'),
    assertions: zod_1.z.array(zod_1.z.object({
        selector: zod_1.z.string().optional(),
        condition: zod_1.z.enum(['visible', 'hidden', 'contains', 'not_contains', 'enabled', 'disabled', 'count']),
        value: zod_1.z.any().optional(),
        timeout: zod_1.z.number().optional()
    }))
});
exports.DatabaseAssertionSchema = zod_1.z.object({
    type: zod_1.z.literal('database'),
    assertions: zod_1.z.array(zod_1.z.object({
        table: zod_1.z.enum(['core_organizations', 'core_entities', 'core_dynamic_data', 'core_relationships', 'universal_transactions', 'universal_transaction_lines']),
        condition: zod_1.z.enum(['count', 'exists', 'not_exists', 'equals', 'contains']),
        filters: zod_1.z.record(zod_1.z.any()).optional(),
        expected: zod_1.z.any()
    }))
});
exports.BusinessAssertionSchema = zod_1.z.object({
    type: zod_1.z.literal('business'),
    assertions: zod_1.z.array(zod_1.z.object({
        oracle: zod_1.z.enum(['accounting_equation', 'inventory_balance', 'workflow_status', 'tax_calculation', 'smart_code_validation']),
        expected: zod_1.z.any(),
        tolerance: zod_1.z.number().optional()
    }))
});
exports.AssertionSchema = zod_1.z.discriminatedUnion('type', [
    exports.UIAssertionSchema,
    exports.DatabaseAssertionSchema,
    exports.BusinessAssertionSchema
]);
exports.BusinessProcessTestSchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    industry: zod_1.z.string().optional(),
    version: zod_1.z.string().default('1.0.0'),
    author: zod_1.z.string().optional(),
    context: exports.ContextSchema,
    personas: zod_1.z.record(exports.PersonaSchema),
    setup: zod_1.z.array(exports.StepActionSchema).optional(),
    steps: zod_1.z.array(exports.StepSchema),
    cleanup: zod_1.z.array(exports.StepActionSchema).optional(),
    assertions: zod_1.z.array(exports.AssertionSchema),
    metadata: zod_1.z.object({
        tags: zod_1.z.array(zod_1.z.string()).default([]),
        priority: zod_1.z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
        estimated_duration: zod_1.z.number().optional(), // seconds
        requires_auth: zod_1.z.boolean().default(true),
        requires_data: zod_1.z.boolean().default(true),
        browser_support: zod_1.z.array(zod_1.z.enum(['chromium', 'firefox', 'webkit'])).default(['chromium']),
        mobile_support: zod_1.z.boolean().default(false)
    }).default({})
});
// Smart Code patterns for testing
exports.SMART_CODE_PATTERNS = {
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
};
