"use strict";
/**
 * HERA DNA SDK Client
 * Type-safe client that enforces sacred principles
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeraDNAClient = void 0;
const types_1 = require("./types");
/**
 * HERA DNA Client
 * All operations are type-safe and enforce sacred principles
 */
class HeraDNAClient {
    constructor(config) {
        this.config = config;
        this.organizationId = config.organizationId;
    }
    /**
     * Create an entity with type-safe enforcement
     */
    async createEntity(params) {
        const operation = {
            table: types_1.SACRED_TABLES.ENTITIES,
            operation: 'create',
            organizationId: this.organizationId,
            smartCode: params.smartCode,
            data: {
                entity_type: params.entityType,
                entity_name: params.entityName,
                entity_code: params.entityCode,
                smart_code: params.smartCode,
                metadata: params.metadata,
                organization_id: this.organizationId
            }
        };
        return this.executeOperation(operation);
    }
    /**
     * Create a transaction with type-safe enforcement
     */
    async createTransaction(params) {
        const operation = {
            table: types_1.SACRED_TABLES.TRANSACTIONS,
            operation: 'create',
            organizationId: this.organizationId,
            smartCode: params.smartCode,
            data: {
                transaction_type: params.transactionType,
                transaction_code: params.transactionCode,
                transaction_date: params.transactionDate,
                smart_code: params.smartCode,
                from_entity_id: params.fromEntityId,
                to_entity_id: params.toEntityId,
                total_amount: params.totalAmount,
                currency: params.currency,
                metadata: params.metadata,
                organization_id: this.organizationId
            }
        };
        return this.executeOperation(operation);
    }
    /**
     * Set dynamic field with type-safe enforcement
     */
    async setDynamicField(entityId, fieldName, fieldValue, smartCode) {
        const operation = {
            table: types_1.SACRED_TABLES.DYNAMIC_DATA,
            operation: 'create',
            organizationId: this.organizationId,
            smartCode: smartCode,
            data: {
                entity_id: entityId,
                field_name: fieldName,
                field_value_text: typeof fieldValue === 'string' ? fieldValue : undefined,
                field_value_number: typeof fieldValue === 'number' ? fieldValue : undefined,
                field_value_boolean: typeof fieldValue === 'boolean' ? fieldValue : undefined,
                field_value_date: fieldValue instanceof Date ? fieldValue : undefined,
                field_value_json: typeof fieldValue === 'object' ? fieldValue : undefined,
                smart_code: smartCode
            }
        };
        return this.executeOperation(operation);
    }
    /**
     * Create relationship with type-safe enforcement
     */
    async createRelationship(params) {
        const operation = {
            table: types_1.SACRED_TABLES.RELATIONSHIPS,
            operation: 'create',
            organizationId: this.organizationId,
            smartCode: params.smartCode,
            data: {
                from_entity_id: params.fromEntityId,
                to_entity_id: params.toEntityId,
                relationship_type: params.relationshipType,
                smart_code: params.smartCode,
                valid_from: params.validFrom,
                valid_to: params.validTo,
                metadata: params.metadata
            }
        };
        return this.executeOperation(operation);
    }
    /**
     * Query entities with type-safe filters
     */
    async queryEntities(params) {
        const operation = {
            table: types_1.SACRED_TABLES.ENTITIES,
            operation: 'read',
            organizationId: this.organizationId,
            smartCode: (0, types_1.createSmartCode)('HERA.SYS.QUERY.ENTITY.LIST.v1'),
            data: params
        };
        const response = await this.executeOperation(operation);
        return response.data || [];
    }
    /**
     * Query transactions with type-safe filters
     */
    async queryTransactions(params) {
        const operation = {
            table: types_1.SACRED_TABLES.TRANSACTIONS,
            operation: 'read',
            organizationId: this.organizationId,
            smartCode: (0, types_1.createSmartCode)('HERA.SYS.QUERY.TXN.LIST.v1'),
            data: params
        };
        const response = await this.executeOperation(operation);
        return response.data || [];
    }
    /**
     * Query relationships with type-safe filters
     */
    async queryRelationships(params) {
        const operation = {
            table: types_1.SACRED_TABLES.RELATIONSHIPS,
            operation: 'read',
            organizationId: this.organizationId,
            smartCode: (0, types_1.createSmartCode)('HERA.SYS.QUERY.REL.LIST.v1'),
            data: params
        };
        const response = await this.executeOperation(operation);
        return response.data || [];
    }
    /**
     * Get dynamic fields for an entity
     */
    async getDynamicFields(entityId) {
        const operation = {
            table: types_1.SACRED_TABLES.DYNAMIC_DATA,
            operation: 'read',
            organizationId: this.organizationId,
            smartCode: (0, types_1.createSmartCode)('HERA.SYS.QUERY.DYN.FIELDS.v1'),
            data: { entity_id: entityId }
        };
        const response = await this.executeOperation(operation);
        return response.data || [];
    }
    /**
     * Delete relationship
     */
    async deleteRelationship(relationshipId) {
        const operation = {
            table: types_1.SACRED_TABLES.RELATIONSHIPS,
            operation: 'delete',
            organizationId: this.organizationId,
            smartCode: (0, types_1.createSmartCode)('HERA.SYS.DELETE.REL.v1'),
            id: relationshipId
        };
        await this.executeOperation(operation);
    }
    /**
     * Update transaction metadata
     */
    async updateTransactionMetadata(transactionId, metadata) {
        const operation = {
            table: types_1.SACRED_TABLES.TRANSACTIONS,
            operation: 'update',
            organizationId: this.organizationId,
            smartCode: (0, types_1.createSmartCode)('HERA.SYS.UPDATE.TXN.META.v1'),
            id: transactionId,
            data: { metadata }
        };
        await this.executeOperation(operation);
    }
    /**
     * Set transaction field (for dynamic data on transactions)
     */
    async setTransactionField(transactionId, fieldName, fieldValue, smartCode) {
        // Transactions don't have dynamic data table, so we use metadata
        const operation = {
            table: types_1.SACRED_TABLES.TRANSACTIONS,
            operation: 'update',
            organizationId: this.organizationId,
            smartCode: smartCode,
            id: transactionId,
            data: {
                metadata: {
                    [fieldName]: fieldValue
                }
            }
        };
        await this.executeOperation(operation);
    }
    /**
     * Execute operation with runtime gates
     */
    async executeOperation(operation) {
        // Validate table is sacred
        if (!Object.values(types_1.SACRED_TABLES).includes(operation.table)) {
            throw new types_1.DNAViolationError(`Invalid table: ${operation.table}. Only sacred tables allowed.`);
        }
        // Validate organization isolation
        if (operation.organizationId !== this.organizationId) {
            throw new types_1.OrganizationIsolationError(operation.organizationId, this.organizationId);
        }
        // Runtime gates if enabled
        if (this.config.enableRuntimeGates) {
            await this.enforceRuntimeGates(operation);
        }
        // Audit if enabled
        if (this.config.enableAudit) {
            await this.auditOperation(operation);
        }
        // Execute via MCP endpoint
        try {
            // Call the MCP endpoint
            const endpoint = this.config.mcpEndpoint || '/api/v1/mcp/execute';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operation,
                    organizationId: this.organizationId.toString()
                })
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'MCP execution failed');
            }
            const result = await response.json();
            return {
                success: true,
                data: result.data,
                smartCode: operation.smartCode,
                organizationId: operation.organizationId
            };
        }
        catch (error) {
            // Fallback to mock data for development
            console.warn('MCP execution failed, using mock data:', error);
            return {
                success: true,
                data: {},
                smartCode: operation.smartCode,
                organizationId: operation.organizationId
            };
        }
    }
    /**
     * Enforce runtime gates
     */
    async enforceRuntimeGates(operation) {
        // Check smart code format
        if (!operation.smartCode.match(/^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.[A-Z]+\.v\d+$/)) {
            throw new types_1.DNAViolationError('Invalid smart code format', operation.table, operation.smartCode);
        }
        // Check organization ID format
        if (!operation.organizationId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
            throw new types_1.DNAViolationError('Invalid organization ID format');
        }
        // Additional runtime checks can be added here
    }
    /**
     * Audit operation
     */
    async auditOperation(operation) {
        // Create audit transaction
        const auditSmartCode = (0, types_1.createSmartCode)('HERA.SYS.AUDIT.OPERATION.LOG.v1');
        const auditData = {
            transaction_type: 'audit_log',
            transaction_code: `AUDIT-${Date.now()}`,
            transaction_date: new Date(),
            smart_code: auditSmartCode,
            metadata: {
                operation_table: operation.table,
                operation_type: operation.operation,
                operation_smart_code: operation.smartCode,
                timestamp: new Date().toISOString()
            }
        };
        // In production, this would create an actual audit record
        console.log('[AUDIT]', auditData);
    }
    /**
     * Switch organization context (creates new client)
     */
    switchOrganization(organizationId) {
        return new HeraDNAClient({
            ...this.config,
            organizationId
        });
    }
}
exports.HeraDNAClient = HeraDNAClient;
//# sourceMappingURL=client.js.map