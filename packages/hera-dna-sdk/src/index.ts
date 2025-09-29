/**
 * HERA DNA SDK
 * Type-safe enforcement of the sacred 6-table architecture
 */

// Type exports (need to use 'export type' with isolatedModules)
export type {
  SmartCode,
  OrganizationId,
  EntityId,
  TransactionId,
  CoreOrganization,
  CoreEntity,
  CoreDynamicData,
  CoreRelationship,
  UniversalTransaction,
  UniversalTransactionLine,
  SacredTable,
  DNAOperation,
  DNAResponse,
  IndustryType,
  ModuleType,
  SmartCodeComponents,
} from './types';

// export type { DNAViolationError, OrganizationIsolationError } from './guardrails'; // File doesn't exist

// Re-export specific items to avoid conflicts
export {
  // Constants and non-type exports
  SACRED_TABLES,
  INDUSTRY_TYPES,
  MODULE_TYPES,
  // Functions
  createSmartCode,
  createOrganizationId,
  createEntityId,
  createTransactionId,
  validateEntityId,
  validateTransactionId,
  buildSmartCode,
  // Constants
  SMART_CODE_PATTERN,
  ORGANIZATION_ID_REGEX,
  // Schemas
  CoreEntitySchema,
  UniversalTransactionSchema,
  SmartCodeSchema,
  OrganizationIdSchema
} from './types';

export * from './client';
export * from './validators';

// Export specific guards to avoid conflicts
export {
  isEntityId,
  isTransactionId,
  isCoreEntity,
  isUniversalTransaction,
  isCoreDynamicData,
  isCoreRelationship,
  assertDNA,
  assertSmartCode,
  assertOrganizationId,
  assertSacredTable,
  narrowEntityType,
  narrowTransactionType
} from './guards';

export * from './builders';

// Re-export generated SDK functions
export * from '../generated/sdk-functions';