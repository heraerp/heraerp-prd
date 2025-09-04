/**
 * HERA DNA SDK Client
 * Type-safe client that enforces sacred principles
 */
import { OrganizationId, SmartCode, EntityId, CoreEntity, UniversalTransaction, DNAResponse } from './types';
/**
 * DNA Client Configuration
 */
export interface DNAClientConfig {
    organizationId: OrganizationId;
    mcpEndpoint?: string;
    enableRuntimeGates?: boolean;
    enableAudit?: boolean;
}
/**
 * HERA DNA Client
 * All operations are type-safe and enforce sacred principles
 */
export declare class HeraDNAClient {
    private readonly config;
    private readonly organizationId;
    constructor(config: DNAClientConfig);
    /**
     * Create an entity with type-safe enforcement
     */
    createEntity(params: {
        entityType: string;
        entityName: string;
        entityCode?: string;
        smartCode: SmartCode;
        metadata?: Record<string, unknown>;
    }): Promise<DNAResponse<CoreEntity>>;
    /**
     * Create a transaction with type-safe enforcement
     */
    createTransaction(params: {
        transactionType: string;
        transactionCode: string;
        transactionDate: Date;
        smartCode: SmartCode;
        fromEntityId?: EntityId;
        toEntityId?: EntityId;
        totalAmount?: number;
        currency?: string;
        metadata?: Record<string, unknown>;
    }): Promise<DNAResponse<UniversalTransaction>>;
    /**
     * Set dynamic field with type-safe enforcement
     */
    setDynamicField(entityId: EntityId, fieldName: string, fieldValue: string | number | boolean | Date | unknown, smartCode: SmartCode): Promise<DNAResponse<any>>;
    /**
     * Create relationship with type-safe enforcement
     */
    createRelationship(params: {
        fromEntityId: EntityId;
        toEntityId: EntityId;
        relationshipType: string;
        smartCode: SmartCode;
        validFrom?: Date;
        validTo?: Date;
        metadata?: Record<string, unknown>;
    }): Promise<DNAResponse<any>>;
    /**
     * Query entities with type-safe filters
     */
    queryEntities(params: {
        entityType?: string;
        smartCodePattern?: string;
        filters?: Record<string, any>;
        includeDynamicData?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<CoreEntity[]>;
    /**
     * Query transactions with type-safe filters
     */
    queryTransactions(params: {
        transactionType?: string;
        filters?: Record<string, any>;
        includeLines?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<UniversalTransaction[]>;
    /**
     * Query relationships with type-safe filters
     */
    queryRelationships(params: {
        fromEntityId?: EntityId;
        toEntityId?: EntityId;
        relationshipType?: string;
        limit?: number;
    }): Promise<any[]>;
    /**
     * Get dynamic fields for an entity
     */
    getDynamicFields(entityId: EntityId): Promise<any[]>;
    /**
     * Delete relationship
     */
    deleteRelationship(relationshipId: string): Promise<void>;
    /**
     * Update transaction metadata
     */
    updateTransactionMetadata(transactionId: string, metadata: Record<string, any>): Promise<void>;
    /**
     * Set transaction field (for dynamic data on transactions)
     */
    setTransactionField(transactionId: string, fieldName: string, fieldValue: any, smartCode: SmartCode): Promise<void>;
    /**
     * Execute operation with runtime gates
     */
    private executeOperation;
    /**
     * Enforce runtime gates
     */
    private enforceRuntimeGates;
    /**
     * Audit operation
     */
    private auditOperation;
    /**
     * Switch organization context (creates new client)
     */
    switchOrganization(organizationId: OrganizationId): HeraDNAClient;
}
//# sourceMappingURL=client.d.ts.map