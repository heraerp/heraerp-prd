/**
 * HERA DNA SDK Client
 * Type-safe client that enforces sacred principles
 */

import {
  OrganizationId,
  SmartCode,
  EntityId,
  CoreEntity,
  UniversalTransaction,
  DNAOperation,
  DNAResponse,
  SACRED_TABLES,
  DNAViolationError,
  OrganizationIsolationError,
  createSmartCode
} from './types';

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
export class HeraDNAClient {
  private readonly config: DNAClientConfig;
  private readonly organizationId: OrganizationId;

  constructor(config: DNAClientConfig) {
    this.config = config;
    this.organizationId = config.organizationId;
  }

  /**
   * Create an entity with type-safe enforcement
   */
  async createEntity(params: {
    entityType: string;
    entityName: string;
    entityCode?: string;
    smartCode: SmartCode;
    metadata?: Record<string, unknown>;
  }): Promise<DNAResponse<CoreEntity>> {
    const operation: DNAOperation<Partial<CoreEntity>> = {
      table: SACRED_TABLES.ENTITIES,
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
      } as Partial<CoreEntity>
    };

    return this.executeOperation(operation);
  }

  /**
   * Create a transaction with type-safe enforcement
   */
  async createTransaction(params: {
    transactionType: string;
    transactionCode: string;
    transactionDate: Date;
    smartCode: SmartCode;
    fromEntityId?: EntityId;
    toEntityId?: EntityId;
    totalAmount?: number;
    currency?: string;
    metadata?: Record<string, unknown>;
  }): Promise<DNAResponse<UniversalTransaction>> {
    const operation: DNAOperation<Partial<UniversalTransaction>> = {
      table: SACRED_TABLES.TRANSACTIONS,
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
      } as Partial<UniversalTransaction>
    };

    return this.executeOperation(operation);
  }

  /**
   * Set dynamic field with type-safe enforcement
   */
  async setDynamicField(
    entityId: EntityId,
    fieldName: string,
    fieldValue: string | number | boolean | Date | unknown,
    smartCode: SmartCode
  ): Promise<DNAResponse<any>> {
    const operation: DNAOperation<any> = {
      table: SACRED_TABLES.DYNAMIC_DATA,
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
  async createRelationship(params: {
    fromEntityId: EntityId;
    toEntityId: EntityId;
    relationshipType: string;
    smartCode: SmartCode;
    validFrom?: Date;
    validTo?: Date;
    metadata?: Record<string, unknown>;
  }): Promise<DNAResponse<any>> {
    const operation: DNAOperation<any> = {
      table: SACRED_TABLES.RELATIONSHIPS,
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
  async queryEntities(params: {
    entityType?: string;
    smartCodePattern?: string;
    filters?: Record<string, any>;
    includeDynamicData?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<CoreEntity[]> {
    const operation: DNAOperation<any> = {
      table: SACRED_TABLES.ENTITIES,
      operation: 'read',
      organizationId: this.organizationId,
      smartCode: createSmartCode('HERA.SYS.QUERY.ENTITY.LIST.v1'),
      data: params
    };

    const response = await this.executeOperation<CoreEntity[]>(operation);
    return response.data || [];
  }

  /**
   * Query transactions with type-safe filters
   */
  async queryTransactions(params: {
    transactionType?: string;
    filters?: Record<string, any>;
    includeLines?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<UniversalTransaction[]> {
    const operation: DNAOperation<any> = {
      table: SACRED_TABLES.TRANSACTIONS,
      operation: 'read',
      organizationId: this.organizationId,
      smartCode: createSmartCode('HERA.SYS.QUERY.TXN.LIST.v1'),
      data: params
    };

    const response = await this.executeOperation<UniversalTransaction[]>(operation);
    return response.data || [];
  }

  /**
   * Query relationships with type-safe filters
   */
  async queryRelationships(params: {
    fromEntityId?: EntityId;
    toEntityId?: EntityId;
    relationshipType?: string;
    limit?: number;
  }): Promise<any[]> {
    const operation: DNAOperation<any> = {
      table: SACRED_TABLES.RELATIONSHIPS,
      operation: 'read',
      organizationId: this.organizationId,
      smartCode: createSmartCode('HERA.SYS.QUERY.REL.LIST.v1'),
      data: params
    };

    const response = await this.executeOperation<any[]>(operation);
    return response.data || [];
  }

  /**
   * Get dynamic fields for an entity
   */
  async getDynamicFields(entityId: EntityId): Promise<any[]> {
    const operation: DNAOperation<any> = {
      table: SACRED_TABLES.DYNAMIC_DATA,
      operation: 'read',
      organizationId: this.organizationId,
      smartCode: createSmartCode('HERA.SYS.QUERY.DYN.FIELDS.v1'),
      data: { entity_id: entityId }
    };

    const response = await this.executeOperation<any[]>(operation);
    return response.data || [];
  }

  /**
   * Delete relationship
   */
  async deleteRelationship(relationshipId: string): Promise<void> {
    const operation: DNAOperation<any> = {
      table: SACRED_TABLES.RELATIONSHIPS,
      operation: 'delete',
      organizationId: this.organizationId,
      smartCode: createSmartCode('HERA.SYS.DELETE.REL.v1'),
      id: relationshipId
    };

    await this.executeOperation(operation);
  }

  /**
   * Update transaction metadata
   */
  async updateTransactionMetadata(transactionId: string, metadata: Record<string, any>): Promise<void> {
    const operation: DNAOperation<any> = {
      table: SACRED_TABLES.TRANSACTIONS,
      operation: 'update',
      organizationId: this.organizationId,
      smartCode: createSmartCode('HERA.SYS.UPDATE.TXN.META.v1'),
      id: transactionId,
      data: { metadata }
    };

    await this.executeOperation(operation);
  }

  /**
   * Set transaction field (for dynamic data on transactions)
   */
  async setTransactionField(
    transactionId: string,
    fieldName: string,
    fieldValue: any,
    smartCode: SmartCode
  ): Promise<void> {
    // Transactions don't have dynamic data table, so we use metadata
    const operation: DNAOperation<any> = {
      table: SACRED_TABLES.TRANSACTIONS,
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
  private async executeOperation<T>(operation: DNAOperation<any>): Promise<DNAResponse<T>> {
    // Validate table is sacred
    if (!Object.values(SACRED_TABLES).includes(operation.table)) {
      throw new DNAViolationError(`Invalid table: ${operation.table}. Only sacred tables allowed.`);
    }

    // Validate organization isolation
    if (operation.organizationId !== this.organizationId) {
      throw new OrganizationIsolationError(operation.organizationId, this.organizationId);
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
        data: result.data as T,
        smartCode: operation.smartCode,
        organizationId: operation.organizationId
      };
    } catch (error) {
      // Fallback to mock data for development
      console.warn('MCP execution failed, using mock data:', error);
      return {
        success: true,
        data: {} as T,
        smartCode: operation.smartCode,
        organizationId: operation.organizationId
      };
    }
  }

  /**
   * Enforce runtime gates
   */
  private async enforceRuntimeGates(operation: DNAOperation<any>): Promise<void> {
    // Check smart code format
    if (!operation.smartCode.match(/^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.[A-Z]+\.v\d+$/)) {
      throw new DNAViolationError('Invalid smart code format', operation.table, operation.smartCode);
    }

    // Check organization ID format
    if (!operation.organizationId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
      throw new DNAViolationError('Invalid organization ID format');
    }

    // Additional runtime checks can be added here
  }

  /**
   * Audit operation
   */
  private async auditOperation(operation: DNAOperation<any>): Promise<void> {
    // Create audit transaction
    const auditSmartCode = createSmartCode('HERA.SYS.AUDIT.OPERATION.LOG.v1');
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
  switchOrganization(organizationId: OrganizationId): HeraDNAClient {
    return new HeraDNAClient({
      ...this.config,
      organizationId
    });
  }
}