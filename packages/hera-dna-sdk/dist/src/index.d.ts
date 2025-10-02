/**
 * HERA DNA SDK
 * Type-safe enforcement of the sacred 6-table architecture
 */
export type { SmartCode, OrganizationId, EntityId, TransactionId, CoreOrganization, CoreEntity, CoreDynamicData, CoreRelationship, UniversalTransaction, UniversalTransactionLine, SacredTable, DNAOperation, DNAResponse, IndustryType, ModuleType, SmartCodeComponents, } from './types';
export { SACRED_TABLES, INDUSTRY_TYPES, MODULE_TYPES, createSmartCode, createOrganizationId, createEntityId, createTransactionId, validateEntityId, validateTransactionId, buildSmartCode, SMART_CODE_PATTERN, ORGANIZATION_ID_REGEX, CoreEntitySchema, UniversalTransactionSchema, SmartCodeSchema, OrganizationIdSchema } from './types';
export * from './client';
export * from './validators';
export { isEntityId, isTransactionId, isCoreEntity, isUniversalTransaction, isCoreDynamicData, isCoreRelationship, assertDNA, assertSmartCode, assertOrganizationId, assertSacredTable, narrowEntityType, narrowTransactionType } from './guards';
export * from './builders';
export * from '../generated/sdk-functions';
//# sourceMappingURL=index.d.ts.map