/**
 * HERA DNA SDK Core Types
 * Sacred type definitions that enforce the 6-table architecture
 */
import { z } from 'zod';
/**
 * Branded type for Smart Codes
 * Ensures only valid HERA smart codes can be used
 */
export type SmartCode = string & {
    readonly __brand: 'SmartCode';
};
/**
 * Branded type for Organization IDs
 * Ensures organization isolation at the type level
 */
export type OrganizationId = string & {
    readonly __brand: 'OrganizationId';
};
/**
 * Branded type for Entity IDs
 * Ensures entity references are type-safe
 */
export type EntityId = string & {
    readonly __brand: 'EntityId';
};
/**
 * Branded type for Transaction IDs
 * Ensures transaction references are type-safe
 */
export type TransactionId = string & {
    readonly __brand: 'TransactionId';
};
/**
 * Smart Code Pattern: HERA.{INDUSTRY}.{MODULE}.{FUNCTION}.{TYPE}.v{VERSION}
 */
export declare const SMART_CODE_PATTERN: RegExp;
export declare const SmartCodeSchema: z.ZodString;
export declare function createSmartCode(code: string): SmartCode;
export declare const OrganizationIdSchema: z.ZodString;
export declare function createOrganizationId(id: string): OrganizationId;
export declare function validateEntityId(id: string): EntityId;
export declare function validateTransactionId(id: string): TransactionId;
/**
 * Sacred Table Names - The only 6 tables in HERA
 */
export declare const SACRED_TABLES: {
    readonly ORGANIZATIONS: "core_organizations";
    readonly ENTITIES: "core_entities";
    readonly DYNAMIC_DATA: "core_dynamic_data";
    readonly RELATIONSHIPS: "core_relationships";
    readonly TRANSACTIONS: "universal_transactions";
    readonly TRANSACTION_LINES: "universal_transaction_lines";
};
export type SacredTable = typeof SACRED_TABLES[keyof typeof SACRED_TABLES];
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
export declare const CoreEntitySchema: z.ZodObject<{
    entity_type: z.ZodString;
    entity_name: z.ZodString;
    entity_code: z.ZodOptional<z.ZodString>;
    smart_code: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    entity_type: string;
    entity_name: string;
    smart_code: string;
    entity_code?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    entity_type: string;
    entity_name: string;
    smart_code: string;
    entity_code?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
export declare const UniversalTransactionSchema: z.ZodObject<{
    transaction_type: z.ZodString;
    transaction_code: z.ZodString;
    transaction_date: z.ZodDate;
    smart_code: z.ZodString;
    from_entity_id: z.ZodOptional<z.ZodString>;
    to_entity_id: z.ZodOptional<z.ZodString>;
    total_amount: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    smart_code: string;
    transaction_type: string;
    transaction_code: string;
    transaction_date: Date;
    metadata?: Record<string, unknown> | undefined;
    from_entity_id?: string | undefined;
    to_entity_id?: string | undefined;
    total_amount?: number | undefined;
    currency?: string | undefined;
}, {
    smart_code: string;
    transaction_type: string;
    transaction_code: string;
    transaction_date: Date;
    metadata?: Record<string, unknown> | undefined;
    from_entity_id?: string | undefined;
    to_entity_id?: string | undefined;
    total_amount?: number | undefined;
    currency?: string | undefined;
}>;
export declare function isSmartCode(value: unknown): value is SmartCode;
export declare function isOrganizationId(value: unknown): value is OrganizationId;
export declare function isSacredTable(value: unknown): value is SacredTable;
export declare const INDUSTRY_TYPES: {
    readonly RESTAURANT: "REST";
    readonly HEALTHCARE: "HLTH";
    readonly MANUFACTURING: "MFG";
    readonly RETAIL: "RETL";
    readonly PROFESSIONAL: "PROF";
    readonly FINANCIAL: "FIN";
    readonly EDUCATION: "EDU";
    readonly TECHNOLOGY: "TECH";
};
export type IndustryType = typeof INDUSTRY_TYPES[keyof typeof INDUSTRY_TYPES];
export declare const MODULE_TYPES: {
    readonly CRM: "CRM";
    readonly FINANCE: "FIN";
    readonly INVENTORY: "INV";
    readonly HR: "HR";
    readonly SALES: "SAL";
    readonly PURCHASE: "PUR";
    readonly PRODUCTION: "PRD";
    readonly QUALITY: "QUA";
};
export type ModuleType = typeof MODULE_TYPES[keyof typeof MODULE_TYPES];
export interface SmartCodeComponents {
    industry: IndustryType;
    module: ModuleType;
    function: string;
    type: string;
    version: number;
}
export declare function buildSmartCode(components: SmartCodeComponents): SmartCode;
export declare class DNAViolationError extends Error {
    readonly violation: string;
    readonly table?: SacredTable | undefined;
    readonly smartCode?: SmartCode | undefined;
    constructor(violation: string, table?: SacredTable | undefined, smartCode?: SmartCode | undefined);
}
export declare class OrganizationIsolationError extends Error {
    readonly attemptedOrgId: string;
    readonly authorizedOrgId: OrganizationId;
    constructor(attemptedOrgId: string, authorizedOrgId: OrganizationId);
}
//# sourceMappingURL=types.d.ts.map