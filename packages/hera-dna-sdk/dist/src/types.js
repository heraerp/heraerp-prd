"use strict";
/**
 * HERA DNA SDK Core Types
 * Sacred type definitions that enforce the 6-table architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationIsolationError = exports.DNAViolationError = exports.MODULE_TYPES = exports.INDUSTRY_TYPES = exports.UniversalTransactionSchema = exports.CoreEntitySchema = exports.SACRED_TABLES = exports.createTransactionId = exports.createEntityId = exports.OrganizationIdSchema = exports.ORGANIZATION_ID_REGEX = exports.SmartCodeSchema = exports.SMART_CODE_PATTERN = void 0;
exports.createSmartCode = createSmartCode;
exports.createOrganizationId = createOrganizationId;
exports.validateEntityId = validateEntityId;
exports.validateTransactionId = validateTransactionId;
exports.isSmartCode = isSmartCode;
exports.isOrganizationId = isOrganizationId;
exports.isSacredTable = isSacredTable;
exports.buildSmartCode = buildSmartCode;
const zod_1 = require("zod");
// ============================
// SMART CODE VALIDATION
// ============================
/**
 * Smart Code Pattern: HERA.{MODULE}.{DOMAIN}.{TYPE}.{SUBTYPE}.v{VERSION}
 * Updated to match DNA config pattern
 */
exports.SMART_CODE_PATTERN = /^HERA\.[A-Z0-9]{2,15}(?:\.[A-Z0-9_]{2,30}){2,8}\.v[0-9]+$/;
exports.SmartCodeSchema = zod_1.z.string().regex(exports.SMART_CODE_PATTERN, {
    message: 'Invalid Smart Code format. Must match: HERA.{INDUSTRY}.{MODULE}.{FUNCTION}.{TYPE}.v{VERSION}'
});
function createSmartCode(code) {
    const result = exports.SmartCodeSchema.safeParse(code);
    if (!result.success) {
        throw new Error(`Invalid Smart Code: ${result.error.message}`);
    }
    return code;
}
// ============================
// ORGANIZATION ID VALIDATION
// ============================
exports.ORGANIZATION_ID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
exports.OrganizationIdSchema = zod_1.z.string().uuid({
    message: 'Organization ID must be a valid UUID'
});
function createOrganizationId(id) {
    const result = exports.OrganizationIdSchema.safeParse(id);
    if (!result.success) {
        throw new Error(`Invalid Organization ID: ${result.error.message}`);
    }
    return id;
}
// ============================
// ID VALIDATION HELPERS
// ============================
function validateEntityId(id) {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    if (!uuidPattern.test(id)) {
        throw new Error(`Invalid entity ID: ${id}`);
    }
    return id;
}
function validateTransactionId(id) {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    if (!uuidPattern.test(id)) {
        throw new Error(`Invalid transaction ID: ${id}`);
    }
    return id;
}
// Alias functions for convenience
exports.createEntityId = validateEntityId;
exports.createTransactionId = validateTransactionId;
// ============================
// SACRED TABLE TYPES
// ============================
/**
 * Sacred Table Names - The only 6 tables in HERA
 */
exports.SACRED_TABLES = {
    ORGANIZATIONS: 'core_organizations',
    ENTITIES: 'core_entities',
    DYNAMIC_DATA: 'core_dynamic_data',
    RELATIONSHIPS: 'core_relationships',
    TRANSACTIONS: 'universal_transactions',
    TRANSACTION_LINES: 'universal_transaction_lines'
};
// ============================
// VALIDATION SCHEMAS
// ============================
exports.CoreEntitySchema = zod_1.z.object({
    entity_type: zod_1.z.string().min(1),
    entity_name: zod_1.z.string().min(1),
    entity_code: zod_1.z.string().optional(),
    smart_code: exports.SmartCodeSchema,
    metadata: zod_1.z.record(zod_1.z.unknown()).optional()
});
exports.UniversalTransactionSchema = zod_1.z.object({
    transaction_type: zod_1.z.string().min(1),
    transaction_code: zod_1.z.string().min(1),
    transaction_date: zod_1.z.date(),
    smart_code: exports.SmartCodeSchema,
    from_entity_id: zod_1.z.string().uuid().optional(),
    to_entity_id: zod_1.z.string().uuid().optional(),
    total_amount: zod_1.z.number().optional(),
    currency: zod_1.z.string().length(3).optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional()
});
// ============================
// TYPE GUARDS
// ============================
function isSmartCode(value) {
    return typeof value === 'string' && exports.SMART_CODE_PATTERN.test(value);
}
function isOrganizationId(value) {
    return typeof value === 'string' && zod_1.z.string().uuid().safeParse(value).success;
}
function isSacredTable(value) {
    return Object.values(exports.SACRED_TABLES).includes(value);
}
// ============================
// INDUSTRY TYPES
// ============================
exports.INDUSTRY_TYPES = {
    RESTAURANT: 'REST',
    HEALTHCARE: 'HLTH',
    MANUFACTURING: 'MFG',
    RETAIL: 'RETL',
    PROFESSIONAL: 'PROF',
    FINANCIAL: 'FIN',
    EDUCATION: 'EDU',
    TECHNOLOGY: 'TECH'
};
// ============================
// MODULE TYPES
// ============================
exports.MODULE_TYPES = {
    CRM: 'CRM',
    FINANCE: 'FIN',
    INVENTORY: 'INV',
    HR: 'HR',
    SALES: 'SAL',
    PURCHASE: 'PUR',
    PRODUCTION: 'PRD',
    QUALITY: 'QUA'
};
function buildSmartCode(components) {
    const code = `HERA.${components.industry}.${components.module}.${components.function}.${components.type}.v${components.version}`;
    return createSmartCode(code);
}
// ============================
// ERROR TYPES
// ============================
class DNAViolationError extends Error {
    constructor(violation, table, smartCode) {
        super(`DNA Violation: ${violation}`);
        this.violation = violation;
        this.table = table;
        this.smartCode = smartCode;
        this.name = 'DNAViolationError';
    }
}
exports.DNAViolationError = DNAViolationError;
class OrganizationIsolationError extends Error {
    constructor(attemptedOrgId, authorizedOrgId) {
        super(`Organization isolation violation: Attempted to access ${attemptedOrgId} from ${authorizedOrgId}`);
        this.attemptedOrgId = attemptedOrgId;
        this.authorizedOrgId = authorizedOrgId;
        this.name = 'OrganizationIsolationError';
    }
}
exports.OrganizationIsolationError = OrganizationIsolationError;
//# sourceMappingURL=types.js.map