"use strict";
/**
 * HERA DNA SDK Type Guards
 * Compile-time and runtime type guards for sacred principles
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSmartCode = isSmartCode;
exports.isOrganizationId = isOrganizationId;
exports.isEntityId = isEntityId;
exports.isTransactionId = isTransactionId;
exports.isSacredTable = isSacredTable;
exports.isCoreEntity = isCoreEntity;
exports.isUniversalTransaction = isUniversalTransaction;
exports.isCoreDynamicData = isCoreDynamicData;
exports.isCoreRelationship = isCoreRelationship;
exports.assertDNA = assertDNA;
exports.assertSmartCode = assertSmartCode;
exports.assertOrganizationId = assertOrganizationId;
exports.assertSacredTable = assertSacredTable;
exports.narrowEntityType = narrowEntityType;
exports.narrowTransactionType = narrowTransactionType;
const types_1 = require("./types");
/**
 * Type guard for SmartCode
 */
function isSmartCode(value) {
    return typeof value === 'string' && types_1.SMART_CODE_PATTERN.test(value);
}
/**
 * Type guard for OrganizationId
 */
function isOrganizationId(value) {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    return typeof value === 'string' && uuidPattern.test(value);
}
/**
 * Type guard for EntityId
 */
function isEntityId(value) {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    return typeof value === 'string' && uuidPattern.test(value);
}
/**
 * Type guard for TransactionId
 */
function isTransactionId(value) {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    return typeof value === 'string' && uuidPattern.test(value);
}
/**
 * Type guard for SacredTable
 */
function isSacredTable(value) {
    return Object.values(types_1.SACRED_TABLES).includes(value);
}
/**
 * Type guard for CoreEntity
 */
function isCoreEntity(value) {
    if (!value || typeof value !== 'object')
        return false;
    const entity = value;
    return (isEntityId(entity.id) &&
        isOrganizationId(entity.organization_id) &&
        typeof entity.entity_type === 'string' &&
        typeof entity.entity_name === 'string' &&
        isSmartCode(entity.smart_code) &&
        entity.created_at instanceof Date &&
        entity.updated_at instanceof Date);
}
/**
 * Type guard for UniversalTransaction
 */
function isUniversalTransaction(value) {
    if (!value || typeof value !== 'object')
        return false;
    const transaction = value;
    return (isTransactionId(transaction.id) &&
        isOrganizationId(transaction.organization_id) &&
        typeof transaction.transaction_type === 'string' &&
        typeof transaction.transaction_code === 'string' &&
        transaction.transaction_date instanceof Date &&
        isSmartCode(transaction.smart_code) &&
        transaction.created_at instanceof Date &&
        transaction.updated_at instanceof Date);
}
/**
 * Type guard for CoreDynamicData
 */
function isCoreDynamicData(value) {
    if (!value || typeof value !== 'object')
        return false;
    const data = value;
    return (typeof data.id === 'string' &&
        isEntityId(data.entity_id) &&
        isOrganizationId(data.organization_id) &&
        typeof data.field_name === 'string' &&
        isSmartCode(data.smart_code) &&
        data.created_at instanceof Date &&
        data.updated_at instanceof Date);
}
/**
 * Type guard for CoreRelationship
 */
function isCoreRelationship(value) {
    if (!value || typeof value !== 'object')
        return false;
    const relationship = value;
    return (typeof relationship.id === 'string' &&
        isOrganizationId(relationship.organization_id) &&
        isEntityId(relationship.from_entity_id) &&
        isEntityId(relationship.to_entity_id) &&
        typeof relationship.relationship_type === 'string' &&
        isSmartCode(relationship.smart_code) &&
        relationship.created_at instanceof Date &&
        relationship.updated_at instanceof Date);
}
/**
 * Assert function that throws if condition is false
 */
function assertDNA(condition, message) {
    if (!condition) {
        throw new Error(`DNA Assertion Failed: ${message}`);
    }
}
/**
 * Assert that value is a SmartCode
 */
function assertSmartCode(value, context) {
    if (!isSmartCode(value)) {
        throw new Error(`Invalid SmartCode${context ? ` in ${context}` : ''}: ${value}`);
    }
}
/**
 * Assert that value is an OrganizationId
 */
function assertOrganizationId(value, context) {
    if (!isOrganizationId(value)) {
        throw new Error(`Invalid OrganizationId${context ? ` in ${context}` : ''}: ${value}`);
    }
}
/**
 * Assert that value is a SacredTable
 */
function assertSacredTable(value, context) {
    if (!isSacredTable(value)) {
        throw new Error(`Invalid table${context ? ` in ${context}` : ''}: ${value}. ` +
            `Only sacred tables allowed: ${Object.values(types_1.SACRED_TABLES).join(', ')}`);
    }
}
/**
 * Narrow type based on discriminated union
 */
function narrowEntityType(entity, entityType) {
    return entity.entity_type === entityType;
}
/**
 * Narrow transaction type based on discriminated union
 */
function narrowTransactionType(transaction, transactionType) {
    return transaction.transaction_type === transactionType;
}
//# sourceMappingURL=guards.js.map