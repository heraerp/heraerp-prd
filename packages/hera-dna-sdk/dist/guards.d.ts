/**
 * HERA DNA SDK Type Guards
 * Compile-time and runtime type guards for sacred principles
 */
import { SmartCode, OrganizationId, EntityId, TransactionId, SacredTable, CoreEntity, UniversalTransaction, CoreDynamicData, CoreRelationship } from './types';
/**
 * Type guard for SmartCode
 */
export declare function isSmartCode(value: unknown): value is SmartCode;
/**
 * Type guard for OrganizationId
 */
export declare function isOrganizationId(value: unknown): value is OrganizationId;
/**
 * Type guard for EntityId
 */
export declare function isEntityId(value: unknown): value is EntityId;
/**
 * Type guard for TransactionId
 */
export declare function isTransactionId(value: unknown): value is TransactionId;
/**
 * Type guard for SacredTable
 */
export declare function isSacredTable(value: unknown): value is SacredTable;
/**
 * Type guard for CoreEntity
 */
export declare function isCoreEntity(value: unknown): value is CoreEntity;
/**
 * Type guard for UniversalTransaction
 */
export declare function isUniversalTransaction(value: unknown): value is UniversalTransaction;
/**
 * Type guard for CoreDynamicData
 */
export declare function isCoreDynamicData(value: unknown): value is CoreDynamicData;
/**
 * Type guard for CoreRelationship
 */
export declare function isCoreRelationship(value: unknown): value is CoreRelationship;
/**
 * Assert function that throws if condition is false
 */
export declare function assertDNA<T>(condition: unknown, message: string): asserts condition is T;
/**
 * Assert that value is a SmartCode
 */
export declare function assertSmartCode(value: unknown, context?: string): asserts value is SmartCode;
/**
 * Assert that value is an OrganizationId
 */
export declare function assertOrganizationId(value: unknown, context?: string): asserts value is OrganizationId;
/**
 * Assert that value is a SacredTable
 */
export declare function assertSacredTable(value: unknown, context?: string): asserts value is SacredTable;
/**
 * Narrow type based on discriminated union
 */
export declare function narrowEntityType<T extends CoreEntity>(entity: CoreEntity, entityType: string): entity is T;
/**
 * Narrow transaction type based on discriminated union
 */
export declare function narrowTransactionType<T extends UniversalTransaction>(transaction: UniversalTransaction, transactionType: string): transaction is T;
//# sourceMappingURL=guards.d.ts.map