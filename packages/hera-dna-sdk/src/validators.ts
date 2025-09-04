/**
 * HERA DNA SDK Validators
 * Runtime validation functions for sacred principles
 */

import {
  SmartCode,
  OrganizationId,
  EntityId,
  TransactionId,
  SacredTable,
  SACRED_TABLES,
  DNAViolationError,
  createSmartCode,
  createOrganizationId
} from './types';

/**
 * Validate smart code format
 */
export function validateSmartCode(code: string): SmartCode {
  try {
    return createSmartCode(code);
  } catch (error) {
    throw new DNAViolationError(`Invalid smart code: ${code}`);
  }
}

/**
 * Validate organization ID format
 */
export function validateOrganizationId(id: string): OrganizationId {
  try {
    return createOrganizationId(id);
  } catch (error) {
    throw new DNAViolationError(`Invalid organization ID: ${id}`);
  }
}

/**
 * Validate entity ID format
 */
export function validateEntityId(id: string): EntityId {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  if (!uuidPattern.test(id)) {
    throw new DNAViolationError(`Invalid entity ID: ${id}`);
  }
  return id as EntityId;
}

/**
 * Validate transaction ID format
 */
export function validateTransactionId(id: string): TransactionId {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  if (!uuidPattern.test(id)) {
    throw new DNAViolationError(`Invalid transaction ID: ${id}`);
  }
  return id as TransactionId;
}

/**
 * Validate table name is sacred
 */
export function validateSacredTable(table: string): SacredTable {
  const sacredTables = Object.values(SACRED_TABLES);
  if (!sacredTables.includes(table as any)) {
    throw new DNAViolationError(
      `Invalid table: ${table}. Only sacred tables allowed: ${sacredTables.join(', ')}`
    );
  }
  return table as SacredTable;
}

/**
 * Validate entity type
 */
export function validateEntityType(type: string): string {
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
    throw new DNAViolationError(`Entity type must be at least 2 characters: ${type}`);
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
export function validateTransactionType(type: string): string {
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
    throw new DNAViolationError(`Transaction type must be at least 2 characters: ${type}`);
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
export function validateRelationshipType(type: string): string {
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
    throw new DNAViolationError(`Relationship type must be at least 2 characters: ${type}`);
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
export function validateCurrencyCode(code: string): string {
  if (!code || code.length !== 3) {
    throw new DNAViolationError(`Currency code must be exactly 3 characters: ${code}`);
  }
  return code.toUpperCase();
}

/**
 * Validate field name for dynamic data
 */
export function validateFieldName(name: string): string {
  if (!name || name.length < 2) {
    throw new DNAViolationError(`Field name must be at least 2 characters: ${name}`);
  }

  // Check for reserved field names
  const reserved = ['id', 'created_at', 'updated_at', 'organization_id'];
  if (reserved.includes(name.toLowerCase())) {
    throw new DNAViolationError(`Field name is reserved: ${name}`);
  }

  return name;
}

/**
 * Validate date range
 */
export function validateDateRange(from?: Date, to?: Date): void {
  if (from && to && from > to) {
    throw new DNAViolationError(`Invalid date range: from (${from}) is after to (${to})`);
  }
}

/**
 * Validate amount
 */
export function validateAmount(amount?: number): number | undefined {
  if (amount === undefined) return undefined;
  
  if (isNaN(amount) || !isFinite(amount)) {
    throw new DNAViolationError(`Invalid amount: ${amount}`);
  }

  // Warn for extreme values
  if (Math.abs(amount) > 1e12) {
    console.warn(`Large amount detected: ${amount}. Please verify this is correct.`);
  }

  return amount;
}

/**
 * Batch validation for multiple values
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function batchValidate(validations: Array<() => void>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Capture console.warn
  const originalWarn = console.warn;
  console.warn = (message: string) => warnings.push(message);

  for (const validation of validations) {
    try {
      validation();
    } catch (error) {
      if (error instanceof DNAViolationError) {
        errors.push(error.message);
      } else {
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