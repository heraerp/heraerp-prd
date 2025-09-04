/**
 * HERA DNA SDK Builders
 * Type-safe builders for creating DNA-compliant objects
 */
import { SmartCode, OrganizationId, EntityId, CoreEntity, UniversalTransaction, CoreDynamicData, CoreRelationship, INDUSTRY_TYPES, MODULE_TYPES } from './types';
/**
 * Entity Builder - Type-safe entity creation
 */
export declare class EntityBuilder {
    private entity;
    constructor(organizationId: OrganizationId);
    id(id: string): this;
    type(type: string): this;
    name(name: string): this;
    code(code: string): this;
    smartCode(code: SmartCode | string): this;
    metadata(metadata: Record<string, unknown>): this;
    build(): CoreEntity;
}
/**
 * Transaction Builder - Type-safe transaction creation
 */
export declare class TransactionBuilder {
    private transaction;
    constructor(organizationId: OrganizationId);
    id(id: string): this;
    type(type: string): this;
    code(code: string): this;
    date(date: Date): this;
    smartCode(code: SmartCode | string): this;
    fromEntity(id: EntityId | string): this;
    toEntity(id: EntityId | string): this;
    amount(amount: number): this;
    currency(currency: string): this;
    metadata(metadata: Record<string, unknown>): this;
    build(): UniversalTransaction;
}
/**
 * Dynamic Data Builder - Type-safe dynamic field creation
 */
export declare class DynamicDataBuilder {
    private data;
    constructor(organizationId: OrganizationId, entityId: EntityId);
    field(name: string): this;
    text(value: string): this;
    number(value: number): this;
    date(value: Date): this;
    boolean(value: boolean): this;
    json(value: unknown): this;
    smartCode(code: SmartCode | string): this;
    build(): CoreDynamicData;
}
/**
 * Relationship Builder - Type-safe relationship creation
 */
export declare class RelationshipBuilder {
    private relationship;
    constructor(organizationId: OrganizationId);
    from(entityId: EntityId | string): this;
    to(entityId: EntityId | string): this;
    type(type: string): this;
    smartCode(code: SmartCode | string): this;
    validFrom(date: Date): this;
    validTo(date: Date): this;
    metadata(metadata: Record<string, unknown>): this;
    build(): CoreRelationship;
}
/**
 * Smart Code Builder - Type-safe smart code creation
 */
export declare class SmartCodeBuilder {
    private components;
    industry(industry: keyof typeof INDUSTRY_TYPES): this;
    module(module: keyof typeof MODULE_TYPES): this;
    function(func: string): this;
    type(type: string): this;
    version(version: number): this;
    build(): SmartCode;
}
/**
 * Factory functions for quick builder creation
 */
export declare const DNA: {
    entity: (orgId: OrganizationId) => EntityBuilder;
    transaction: (orgId: OrganizationId) => TransactionBuilder;
    dynamicData: (orgId: OrganizationId, entityId: EntityId) => DynamicDataBuilder;
    relationship: (orgId: OrganizationId) => RelationshipBuilder;
    smartCode: () => SmartCodeBuilder;
};
//# sourceMappingURL=builders.d.ts.map