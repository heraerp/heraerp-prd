/**
 * HERA DNA SDK
 * Type-safe enforcement of the sacred 6-table architecture
 */

// Re-export specific items to avoid conflicts
export {
  // Types
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
  SACRED_TABLES,
  DNAOperation,
  DNAResponse,
  DNAViolationError,
  OrganizationIsolationError,
  INDUSTRY_TYPES,
  MODULE_TYPES,
  IndustryType,
  ModuleType,
  SmartCodeComponents,
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