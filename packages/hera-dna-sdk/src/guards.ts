/**
 * HERA DNA SDK Type Guards
 * Compile-time and runtime type guards for sacred principles
 */

import {
  SmartCode,
  OrganizationId,
  EntityId,
  TransactionId,
  SacredTable,
  SACRED_TABLES,
  CoreEntity,
  UniversalTransaction,
  CoreDynamicData,
  CoreRelationship,
  SMART_CODE_PATTERN
} from './types';

/**
 * Type guard for SmartCode
 */
export function isSmartCode(value: unknown): value is SmartCode {
  return typeof value === 'string' && SMART_CODE_PATTERN.test(value);
}

/**
 * Type guard for OrganizationId
 */
export function isOrganizationId(value: unknown): value is OrganizationId {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  return typeof value === 'string' && uuidPattern.test(value);
}

/**
 * Type guard for EntityId
 */
export function isEntityId(value: unknown): value is EntityId {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  return typeof value === 'string' && uuidPattern.test(value);
}

/**
 * Type guard for TransactionId
 */
export function isTransactionId(value: unknown): value is TransactionId {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  return typeof value === 'string' && uuidPattern.test(value);
}

/**
 * Type guard for SacredTable
 */
export function isSacredTable(value: unknown): value is SacredTable {
  return Object.values(SACRED_TABLES).includes(value as any);
}

/**
 * Type guard for CoreEntity
 */
export function isCoreEntity(value: unknown): value is CoreEntity {
  if (!value || typeof value !== 'object') return false;
  
  const entity = value as any;
  return (
    isEntityId(entity.id) &&
    isOrganizationId(entity.organization_id) &&
    typeof entity.entity_type === 'string' &&
    typeof entity.entity_name === 'string' &&
    isSmartCode(entity.smart_code) &&
    entity.created_at instanceof Date &&
    entity.updated_at instanceof Date
  );
}

/**
 * Type guard for UniversalTransaction
 */
export function isUniversalTransaction(value: unknown): value is UniversalTransaction {
  if (!value || typeof value !== 'object') return false;
  
  const transaction = value as any;
  return (
    isTransactionId(transaction.id) &&
    isOrganizationId(transaction.organization_id) &&
    typeof transaction.transaction_type === 'string' &&
    typeof transaction.transaction_code === 'string' &&
    transaction.transaction_date instanceof Date &&
    isSmartCode(transaction.smart_code) &&
    transaction.created_at instanceof Date &&
    transaction.updated_at instanceof Date
  );
}

/**
 * Type guard for CoreDynamicData
 */
export function isCoreDynamicData(value: unknown): value is CoreDynamicData {
  if (!value || typeof value !== 'object') return false;
  
  const data = value as any;
  return (
    typeof data.id === 'string' &&
    isEntityId(data.entity_id) &&
    isOrganizationId(data.organization_id) &&
    typeof data.field_name === 'string' &&
    isSmartCode(data.smart_code) &&
    data.created_at instanceof Date &&
    data.updated_at instanceof Date
  );
}

/**
 * Type guard for CoreRelationship
 */
export function isCoreRelationship(value: unknown): value is CoreRelationship {
  if (!value || typeof value !== 'object') return false;
  
  const relationship = value as any;
  return (
    typeof relationship.id === 'string' &&
    isOrganizationId(relationship.organization_id) &&
    isEntityId(relationship.from_entity_id) &&
    isEntityId(relationship.to_entity_id) &&
    typeof relationship.relationship_type === 'string' &&
    isSmartCode(relationship.smart_code) &&
    relationship.created_at instanceof Date &&
    relationship.updated_at instanceof Date
  );
}

/**
 * Assert function that throws if condition is false
 */
export function assertDNA<T>(
  condition: unknown,
  message: string
): asserts condition is T {
  if (!condition) {
    throw new Error(`DNA Assertion Failed: ${message}`);
  }
}

/**
 * Assert that value is a SmartCode
 */
export function assertSmartCode(
  value: unknown,
  context?: string
): asserts value is SmartCode {
  if (!isSmartCode(value)) {
    throw new Error(`Invalid SmartCode${context ? ` in ${context}` : ''}: ${value}`);
  }
}

/**
 * Assert that value is an OrganizationId
 */
export function assertOrganizationId(
  value: unknown,
  context?: string
): asserts value is OrganizationId {
  if (!isOrganizationId(value)) {
    throw new Error(`Invalid OrganizationId${context ? ` in ${context}` : ''}: ${value}`);
  }
}

/**
 * Assert that value is a SacredTable
 */
export function assertSacredTable(
  value: unknown,
  context?: string
): asserts value is SacredTable {
  if (!isSacredTable(value)) {
    throw new Error(
      `Invalid table${context ? ` in ${context}` : ''}: ${value}. ` +
      `Only sacred tables allowed: ${Object.values(SACRED_TABLES).join(', ')}`
    );
  }
}

/**
 * Narrow type based on discriminated union
 */
export function narrowEntityType<T extends CoreEntity>(
  entity: CoreEntity,
  entityType: string
): entity is T {
  return entity.entity_type === entityType;
}

/**
 * Narrow transaction type based on discriminated union
 */
export function narrowTransactionType<T extends UniversalTransaction>(
  transaction: UniversalTransaction,
  transactionType: string
): transaction is T {
  return transaction.transaction_type === transactionType;
}