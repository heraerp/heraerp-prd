/**
 * HERA DNA SDK Core Types
 * Sacred type definitions that enforce the 6-table architecture
 */

import { z } from 'zod';

// ============================
// BRANDED TYPES - COMPILE-TIME SAFETY
// ============================

/**
 * Branded type for Smart Codes
 * Ensures only valid HERA smart codes can be used
 */
export type SmartCode = string & { readonly __brand: 'SmartCode' };

/**
 * Branded type for Organization IDs
 * Ensures organization isolation at the type level
 */
export type OrganizationId = string & { readonly __brand: 'OrganizationId' };

/**
 * Branded type for Entity IDs
 * Ensures entity references are type-safe
 */
export type EntityId = string & { readonly __brand: 'EntityId' };

/**
 * Branded type for Transaction IDs
 * Ensures transaction references are type-safe
 */
export type TransactionId = string & { readonly __brand: 'TransactionId' };

// ============================
// SMART CODE VALIDATION
// ============================

/**
 * Smart Code Pattern: HERA.{MODULE}.{DOMAIN}.{TYPE}.{SUBTYPE}.v{VERSION}
 * Updated to match DNA config pattern
 */
export const SMART_CODE_PATTERN = /^HERA\.[A-Z0-9]{2,15}(?:\.[A-Z0-9_]{2,30}){2,8}\.v[0-9]+$/;

export const SmartCodeSchema = z.string().regex(SMART_CODE_PATTERN, {
  message: 'Invalid Smart Code format. Must match: HERA.{INDUSTRY}.{MODULE}.{FUNCTION}.{TYPE}.v{VERSION}'
});

export function createSmartCode(code: string): SmartCode {
  const result = SmartCodeSchema.safeParse(code);
  if (!result.success) {
    throw new Error(`Invalid Smart Code: ${result.error.message}`);
  }
  return code as SmartCode;
}

// ============================
// ORGANIZATION ID VALIDATION
// ============================

export const ORGANIZATION_ID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const OrganizationIdSchema = z.string().uuid({
  message: 'Organization ID must be a valid UUID'
});

export function createOrganizationId(id: string): OrganizationId {
  const result = OrganizationIdSchema.safeParse(id);
  if (!result.success) {
    throw new Error(`Invalid Organization ID: ${result.error.message}`);
  }
  return id as OrganizationId;
}

// ============================
// ID VALIDATION HELPERS
// ============================

export function validateEntityId(id: string): EntityId {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  if (!uuidPattern.test(id)) {
    throw new Error(`Invalid entity ID: ${id}`);
  }
  return id as EntityId;
}

export function validateTransactionId(id: string): TransactionId {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  if (!uuidPattern.test(id)) {
    throw new Error(`Invalid transaction ID: ${id}`);
  }
  return id as TransactionId;
}

// Alias functions for convenience
export const createEntityId = validateEntityId;
export const createTransactionId = validateTransactionId;

// ============================
// SACRED TABLE TYPES
// ============================

/**
 * Sacred Table Names - The only 6 tables in HERA
 */
export const SACRED_TABLES = {
  ORGANIZATIONS: 'core_organizations',
  ENTITIES: 'core_entities',
  DYNAMIC_DATA: 'core_dynamic_data',
  RELATIONSHIPS: 'core_relationships',
  TRANSACTIONS: 'universal_transactions',
  TRANSACTION_LINES: 'universal_transaction_lines'
} as const;

export type SacredTable = typeof SACRED_TABLES[keyof typeof SACRED_TABLES];

// ============================
// CORE ENTITY TYPES
// ============================

export interface CoreOrganization {
  id: OrganizationId;
  organization_name: string;
  created_at: Date;
  updated_at: Date;
  status: 'active' | 'inactive' | 'suspended';
  metadata?: Record<string, unknown>;
}

export interface CoreEntity {
  id: EntityId;
  organization_id: OrganizationId;
  entity_type: string;
  entity_name: string;
  entity_code?: string;
  smart_code: SmartCode;
  created_at: Date;
  updated_at: Date;
  metadata?: Record<string, unknown>;
}

export interface CoreDynamicData {
  id: string;
  entity_id: EntityId;
  organization_id: OrganizationId;
  field_name: string;
  field_value_text?: string;
  field_value_number?: number;
  field_value_date?: Date;
  field_value_boolean?: boolean;
  field_value_json?: unknown;
  smart_code: SmartCode;
  created_at: Date;
  updated_at: Date;
}

export interface CoreRelationship {
  id: string;
  organization_id: OrganizationId;
  from_entity_id: EntityId;
  to_entity_id: EntityId;
  relationship_type: string;
  smart_code: SmartCode;
  valid_from?: Date;
  valid_to?: Date;
  metadata?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface UniversalTransaction {
  id: TransactionId;
  organization_id: OrganizationId;
  transaction_type: string;
  transaction_code: string;
  transaction_date: Date;
  smart_code: SmartCode;
  from_entity_id?: EntityId;
  to_entity_id?: EntityId;
  total_amount?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface UniversalTransactionLine {
  id: string;
  transaction_id: TransactionId;
  organization_id: OrganizationId;
  line_number: number;
  line_entity_id?: EntityId;
  quantity?: number;
  unit_price?: number;
  line_amount?: number;
  smart_code: SmartCode;
  metadata?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

// ============================
// OPERATION TYPES
// ============================

export interface DNAOperation<T> {
  table: SacredTable;
  operation: 'create' | 'read' | 'update' | 'delete';
  organizationId: OrganizationId;
  smartCode: SmartCode;
  data?: T;
  id?: string;
}

export interface DNAResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  smartCode: SmartCode;
  organizationId: OrganizationId;
}

// ============================
// VALIDATION SCHEMAS
// ============================

export const CoreEntitySchema = z.object({
  entity_type: z.string().min(1),
  entity_name: z.string().min(1),
  entity_code: z.string().optional(),
  smart_code: SmartCodeSchema,
  metadata: z.record(z.unknown()).optional()
});

export const UniversalTransactionSchema = z.object({
  transaction_type: z.string().min(1),
  transaction_code: z.string().min(1),
  transaction_date: z.date(),
  smart_code: SmartCodeSchema,
  from_entity_id: z.string().uuid().optional(),
  to_entity_id: z.string().uuid().optional(),
  total_amount: z.number().optional(),
  currency: z.string().length(3).optional(),
  metadata: z.record(z.unknown()).optional()
});

// ============================
// TYPE GUARDS
// ============================

export function isSmartCode(value: unknown): value is SmartCode {
  return typeof value === 'string' && SMART_CODE_PATTERN.test(value);
}

export function isOrganizationId(value: unknown): value is OrganizationId {
  return typeof value === 'string' && z.string().uuid().safeParse(value).success;
}

export function isSacredTable(value: unknown): value is SacredTable {
  return Object.values(SACRED_TABLES).includes(value as any);
}

// ============================
// INDUSTRY TYPES
// ============================

export const INDUSTRY_TYPES = {
  RESTAURANT: 'REST',
  HEALTHCARE: 'HLTH',
  MANUFACTURING: 'MFG',
  RETAIL: 'RETL',
  PROFESSIONAL: 'PROF',
  FINANCIAL: 'FIN',
  EDUCATION: 'EDU',
  TECHNOLOGY: 'TECH'
} as const;

export type IndustryType = typeof INDUSTRY_TYPES[keyof typeof INDUSTRY_TYPES];

// ============================
// MODULE TYPES
// ============================

export const MODULE_TYPES = {
  CRM: 'CRM',
  FINANCE: 'FIN',
  INVENTORY: 'INV',
  HR: 'HR',
  SALES: 'SAL',
  PURCHASE: 'PUR',
  PRODUCTION: 'PRD',
  QUALITY: 'QUA'
} as const;

export type ModuleType = typeof MODULE_TYPES[keyof typeof MODULE_TYPES];

// ============================
// SMART CODE BUILDER
// ============================

export interface SmartCodeComponents {
  industry: IndustryType;
  module: ModuleType;
  function: string;
  type: string;
  version: number;
}

export function buildSmartCode(components: SmartCodeComponents): SmartCode {
  const code = `HERA.${components.industry}.${components.module}.${components.function}.${components.type}.v${components.version}`;
  return createSmartCode(code);
}

// ============================
// ERROR TYPES
// ============================

export class DNAViolationError extends Error {
  constructor(
    public readonly violation: string,
    public readonly table?: SacredTable,
    public readonly smartCode?: SmartCode
  ) {
    super(`DNA Violation: ${violation}`);
    this.name = 'DNAViolationError';
  }
}

export class OrganizationIsolationError extends Error {
  constructor(
    public readonly attemptedOrgId: string,
    public readonly authorizedOrgId: OrganizationId
  ) {
    super(`Organization isolation violation: Attempted to access ${attemptedOrgId} from ${authorizedOrgId}`);
    this.name = 'OrganizationIsolationError';
  }
}