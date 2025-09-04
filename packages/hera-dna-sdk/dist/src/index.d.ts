/**
 * HERA DNA SDK
 * Type-safe enforcement of the sacred 6-table architecture
 */
export { SmartCode, OrganizationId, EntityId, TransactionId, CoreOrganization, CoreEntity, CoreDynamicData, CoreRelationship, UniversalTransaction, UniversalTransactionLine, SacredTable, SACRED_TABLES, DNAOperation, DNAResponse, DNAViolationError, OrganizationIsolationError, INDUSTRY_TYPES, MODULE_TYPES, IndustryType, ModuleType, SmartCodeComponents, createSmartCode, createOrganizationId, createEntityId, createTransactionId, validateEntityId, validateTransactionId, buildSmartCode, SMART_CODE_PATTERN, ORGANIZATION_ID_REGEX, CoreEntitySchema, UniversalTransactionSchema, SmartCodeSchema, OrganizationIdSchema } from './types';
export * from './client';
export * from './validators';
export { isEntityId, isTransactionId, isCoreEntity, isUniversalTransaction, isCoreDynamicData, isCoreRelationship, assertDNA, assertSmartCode, assertOrganizationId, assertSacredTable, narrowEntityType, narrowTransactionType } from './guards';
export * from './builders';
export * from '../generated/sdk-functions';
//# sourceMappingURL=index.d.ts.map