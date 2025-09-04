"use strict";
/**
 * HERA DNA SDK Validators
 * Runtime validation functions for sacred principles
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSmartCode = validateSmartCode;
exports.validateOrganizationId = validateOrganizationId;
exports.validateEntityId = validateEntityId;
exports.validateTransactionId = validateTransactionId;
exports.validateSacredTable = validateSacredTable;
exports.validateEntityType = validateEntityType;
exports.validateTransactionType = validateTransactionType;
exports.validateRelationshipType = validateRelationshipType;
exports.validateCurrencyCode = validateCurrencyCode;
exports.validateFieldName = validateFieldName;
exports.validateDateRange = validateDateRange;
exports.validateAmount = validateAmount;
exports.batchValidate = batchValidate;
const types_1 = require("./types");
/**
 * Validate smart code format
 */
function validateSmartCode(code) {
    try {
        return (0, types_1.createSmartCode)(code);
    }
    catch (error) {
        throw new types_1.DNAViolationError(`Invalid smart code: ${code}`);
    }
}
/**
 * Validate organization ID format
 */
function validateOrganizationId(id) {
    try {
        return (0, types_1.createOrganizationId)(id);
    }
    catch (error) {
        throw new types_1.DNAViolationError(`Invalid organization ID: ${id}`);
    }
}
/**
 * Validate entity ID format
 */
function validateEntityId(id) {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    if (!uuidPattern.test(id)) {
        throw new types_1.DNAViolationError(`Invalid entity ID: ${id}`);
    }
    return id;
}
/**
 * Validate transaction ID format
 */
function validateTransactionId(id) {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    if (!uuidPattern.test(id)) {
        throw new types_1.DNAViolationError(`Invalid transaction ID: ${id}`);
    }
    return id;
}
/**
 * Validate table name is sacred
 */
function validateSacredTable(table) {
    const sacredTables = Object.values(types_1.SACRED_TABLES);
    if (!sacredTables.includes(table)) {
        throw new types_1.DNAViolationError(`Invalid table: ${table}. Only sacred tables allowed: ${sacredTables.join(', ')}`);
    }
    return table;
}
/**
 * Validate entity type
 */
function validateEntityType(type) {
    const validTypes = [
        'customer',
        'vendor',
        'product',
        'employee',
        'gl_account',
        'budget',
        'forecast',
        'location',
        'project',
        'development_task',
        'user',
        'ai_agent',
        'workflow_status'
    ];
    if (!type || type.length < 2) {
        throw new types_1.DNAViolationError(`Entity type must be at least 2 characters: ${type}`);
    }
    // Warn if not a standard type (but don't error)
    if (!validTypes.includes(type)) {
        console.warn(`Non-standard entity type: ${type}. Consider using standard types: ${validTypes.join(', ')}`);
    }
    return type;
}
/**
 * Validate transaction type
 */
function validateTransactionType(type) {
    const validTypes = [
        'sale',
        'purchase',
        'payment',
        'transfer',
        'journal_entry',
        'budget_line',
        'forecast_line',
        'audit_log'
    ];
    if (!type || type.length < 2) {
        throw new types_1.DNAViolationError(`Transaction type must be at least 2 characters: ${type}`);
    }
    // Warn if not a standard type (but don't error)
    if (!validTypes.includes(type)) {
        console.warn(`Non-standard transaction type: ${type}. Consider using standard types: ${validTypes.join(', ')}`);
    }
    return type;
}
/**
 * Validate relationship type
 */
function validateRelationshipType(type) {
    const validTypes = [
        'has_status',
        'parent_of',
        'reports_to',
        'customer_of',
        'vendor_of',
        'member_of',
        'located_at',
        'belongs_to',
        'manages',
        'owns'
    ];
    if (!type || type.length < 2) {
        throw new types_1.DNAViolationError(`Relationship type must be at least 2 characters: ${type}`);
    }
    // Warn if not a standard type (but don't error)
    if (!validTypes.includes(type)) {
        console.warn(`Non-standard relationship type: ${type}. Consider using standard types: ${validTypes.join(', ')}`);
    }
    return type;
}
/**
 * Validate currency code
 */
function validateCurrencyCode(code) {
    if (!code || code.length !== 3) {
        throw new types_1.DNAViolationError(`Currency code must be exactly 3 characters: ${code}`);
    }
    return code.toUpperCase();
}
/**
 * Validate field name for dynamic data
 */
function validateFieldName(name) {
    if (!name || name.length < 2) {
        throw new types_1.DNAViolationError(`Field name must be at least 2 characters: ${name}`);
    }
    // Check for reserved field names
    const reserved = ['id', 'created_at', 'updated_at', 'organization_id'];
    if (reserved.includes(name.toLowerCase())) {
        throw new types_1.DNAViolationError(`Field name is reserved: ${name}`);
    }
    return name;
}
/**
 * Validate date range
 */
function validateDateRange(from, to) {
    if (from && to && from > to) {
        throw new types_1.DNAViolationError(`Invalid date range: from (${from}) is after to (${to})`);
    }
}
/**
 * Validate amount
 */
function validateAmount(amount) {
    if (amount === undefined)
        return undefined;
    if (isNaN(amount) || !isFinite(amount)) {
        throw new types_1.DNAViolationError(`Invalid amount: ${amount}`);
    }
    // Warn for extreme values
    if (Math.abs(amount) > 1e12) {
        console.warn(`Large amount detected: ${amount}. Please verify this is correct.`);
    }
    return amount;
}
function batchValidate(validations) {
    const errors = [];
    const warnings = [];
    // Capture console.warn
    const originalWarn = console.warn;
    console.warn = (message) => warnings.push(message);
    for (const validation of validations) {
        try {
            validation();
        }
        catch (error) {
            if (error instanceof types_1.DNAViolationError) {
                errors.push(error.message);
            }
            else {
                errors.push(String(error));
            }
        }
    }
    // Restore console.warn
    console.warn = originalWarn;
    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}
//# sourceMappingURL=validators.js.map