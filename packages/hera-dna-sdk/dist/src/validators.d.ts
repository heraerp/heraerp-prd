/**
 * HERA DNA SDK Validators
 * Runtime validation functions for sacred principles
 */
import { SmartCode, OrganizationId, EntityId, TransactionId, SacredTable } from './types';
/**
 * Validate smart code format
 */
export declare function validateSmartCode(code: string): SmartCode;
/**
 * Validate organization ID format
 */
export declare function validateOrganizationId(id: string): OrganizationId;
/**
 * Validate entity ID format
 */
export declare function validateEntityId(id: string): EntityId;
/**
 * Validate transaction ID format
 */
export declare function validateTransactionId(id: string): TransactionId;
/**
 * Validate table name is sacred
 */
export declare function validateSacredTable(table: string): SacredTable;
/**
 * Validate entity type
 */
export declare function validateEntityType(type: string): string;
/**
 * Validate transaction type
 */
export declare function validateTransactionType(type: string): string;
/**
 * Validate relationship type
 */
export declare function validateRelationshipType(type: string): string;
/**
 * Validate currency code
 */
export declare function validateCurrencyCode(code: string): string;
/**
 * Validate field name for dynamic data
 */
export declare function validateFieldName(name: string): string;
/**
 * Validate date range
 */
export declare function validateDateRange(from?: Date, to?: Date): void;
/**
 * Validate amount
 */
export declare function validateAmount(amount?: number): number | undefined;
/**
 * Batch validation for multiple values
 */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
export declare function batchValidate(validations: Array<() => void>): ValidationResult;
//# sourceMappingURL=validators.d.ts.map