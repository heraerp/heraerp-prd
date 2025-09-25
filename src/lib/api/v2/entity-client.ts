/**
 * HERA Universal Entity Client v2
 *
 * A unified client for complete CRUD operations using the v2 API endpoints.
 * Provides a clean interface for entity management with minimal overhead.
 */

export interface EntityV2 {
  id?: string;
  organization_id: string;
  entity_type: string;
  entity_name: string;
  entity_code?: string;
  entity_description?: string;
  smart_code: string;
  status?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  business_rules?: Record<string, any>;
  attributes?: Record<string, any>;
  ai_confidence?: number;
  ai_classification?: string;
  ai_insights?: Record<string, any>;
  parent_entity_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface QueryOptions {
  filters?: Record<string, any>;
  search?: string;
  joins?: ('dynamic_data' | 'relationships')[];
  select?: string[];
  order_by?: {
    field: string;
    direction: 'ASC' | 'DESC';
  };
  limit?: number;
  offset?: number;
  aggregate?: boolean;
}

export interface DeleteOptions {
  hard_delete?: boolean;
  cascade?: boolean;
  actor_user_id?: string;
}

export interface DynamicField {
  id?: string;
  entity_id: string;
  field_name: string;
  field_type: 'text' | 'number' | 'boolean' | 'date' | 'datetime' | 'json';
  field_value_text?: string;
  field_value_number?: number;
  field_value_boolean?: boolean;
  field_value_date?: string;
  field_value_datetime?: string;
  field_value_json?: Record<string, any>;
  smart_code?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface DynamicFieldOptions {
  entity_id?: string;
  field_name?: string;
  field_type?: string;
  limit?: number;
  offset?: number;
  group_by_entity?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: Record<string, any>;
  statistics?: Record<string, any>;
}

export class EntityClientV2 {
  private baseUrl: string;
  private organizationId: string | null = null;
  private headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  constructor(baseUrl: string = '/api/v2/universal') {
    this.baseUrl = baseUrl;
  }

  /**
   * Set the organization ID for all operations
   */
  setOrganizationId(orgId: string) {
    this.organizationId = orgId;
  }

  /**
   * Set authorization header
   */
  setAuthToken(token: string) {
    this.headers = {
      ...this.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  /**
   * CREATE or UPDATE - Upsert an entity
   */
  async upsert(entity: EntityV2): Promise<ApiResponse<{ entity_id: string }>> {
    const orgId = entity.organization_id || this.organizationId;

    if (!orgId) {
      return {
        success: false,
        error: 'organization_id is required',
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/entity-upsert`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          ...entity,
          organization_id: orgId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to upsert entity',
          message: data.message,
        };
      }

      return {
        success: true,
        data: { entity_id: data.entity_id },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * READ - Get entity by ID or filters
   */
  async read(params: {
    entity_id?: string;
    entity_type?: string;
    entity_code?: string;
    smart_code?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<EntityV2 | EntityV2[]>> {
    const orgId = this.organizationId;

    if (!orgId) {
      return {
        success: false,
        error: 'organization_id is required',
      };
    }

    try {
      const queryParams = new URLSearchParams({
        organization_id: orgId,
        ...Object.fromEntries(
          Object.entries(params).filter(([_, v]) => v !== undefined)
        ),
      });

      const response = await fetch(`${this.baseUrl}/entity-read?${queryParams}`, {
        method: 'GET',
        headers: this.headers,
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to read entities',
        };
      }

      return {
        success: true,
        data: result.data,
        metadata: result.metadata,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * READ - Advanced query with filters, joins, and aggregations
   */
  async query(options: QueryOptions = {}): Promise<ApiResponse<EntityV2[]>> {
    const orgId = this.organizationId;

    if (!orgId) {
      return {
        success: false,
        error: 'organization_id is required',
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/entity-query`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          organization_id: orgId,
          ...options,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to query entities',
        };
      }

      return {
        success: true,
        data: result.data,
        metadata: result.metadata,
        statistics: result.statistics,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * UPDATE - Convenience method for updating existing entity
   */
  async update(entityId: string, updates: Partial<EntityV2>): Promise<ApiResponse<{ entity_id: string }>> {
    return this.upsert({
      ...updates,
      id: entityId,
      entity_id: entityId,
      organization_id: updates.organization_id || this.organizationId!,
      entity_type: updates.entity_type || '',
      entity_name: updates.entity_name || '',
      smart_code: updates.smart_code || '',
    } as EntityV2);
  }

  /**
   * DELETE - Soft or hard delete an entity
   */
  async delete(entityId: string, options: DeleteOptions = {}): Promise<ApiResponse<any>> {
    const orgId = this.organizationId;

    if (!orgId) {
      return {
        success: false,
        error: 'organization_id is required',
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/entity-delete`, {
        method: 'DELETE',
        headers: this.headers,
        body: JSON.stringify({
          entity_id: entityId,
          organization_id: orgId,
          ...options,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to delete entity',
          message: result.message,
        };
      }

      return {
        success: true,
        data: result,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * RECOVER - Recover a soft-deleted entity
   */
  async recover(entityId: string, actorUserId?: string): Promise<ApiResponse<EntityV2>> {
    const orgId = this.organizationId;

    if (!orgId) {
      return {
        success: false,
        error: 'organization_id is required',
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/entity-delete/recover`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          entity_id: entityId,
          organization_id: orgId,
          actor_user_id: actorUserId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to recover entity',
        };
      }

      return {
        success: true,
        data: result.entity,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * BATCH - Perform multiple operations
   */
  async batch(operations: Array<{
    operation: 'create' | 'update' | 'delete';
    entity?: EntityV2;
    entity_id?: string;
    options?: DeleteOptions;
  }>): Promise<ApiResponse<any[]>> {
    const results = [];

    for (const op of operations) {
      let result;

      switch (op.operation) {
        case 'create':
        case 'update':
          if (op.entity) {
            result = await this.upsert(op.entity);
          }
          break;
        case 'delete':
          if (op.entity_id) {
            result = await this.delete(op.entity_id, op.options);
          }
          break;
      }

      results.push(result);
    }

    const hasErrors = results.some(r => !r?.success);

    return {
      success: !hasErrors,
      data: results,
      error: hasErrors ? 'Some operations failed' : undefined,
    };
  }

  /**
   * Helper: Get entity by code
   */
  async getByCode(entityCode: string, entityType?: string): Promise<ApiResponse<EntityV2>> {
    const result = await this.read({
      entity_code: entityCode,
      entity_type: entityType,
      limit: 1,
    });

    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
      return {
        success: true,
        data: result.data[0],
      };
    }

    return {
      success: false,
      error: 'Entity not found',
    };
  }

  /**
   * Helper: Search entities by name
   */
  async search(searchTerm: string, entityType?: string, limit: number = 10): Promise<ApiResponse<EntityV2[]>> {
    return this.query({
      search: searchTerm,
      filters: entityType ? { entity_type: entityType } : undefined,
      limit,
    });
  }

  /**
   * Helper: Get entities with relationships
   */
  async getWithRelationships(entityId: string): Promise<ApiResponse<EntityV2>> {
    const result = await this.query({
      filters: { id: entityId },
      joins: ['relationships', 'dynamic_data'],
      limit: 1,
    });

    if (result.success && result.data && result.data.length > 0) {
      return {
        success: true,
        data: result.data[0],
      };
    }

    return {
      success: false,
      error: 'Entity not found',
    };
  }

  // ==================== DYNAMIC DATA CRUD OPERATIONS ====================

  /**
   * CREATE/UPDATE - Upsert a dynamic field
   */
  async upsertDynamicField(field: DynamicField): Promise<ApiResponse<{ dynamic_field_id: string; is_update: boolean }>> {
    const orgId = this.organizationId;

    if (!orgId) {
      return {
        success: false,
        error: 'organization_id is required',
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/dynamic-data-upsert`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          organization_id: orgId,
          ...field,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to upsert dynamic field',
          message: data.message,
        };
      }

      return {
        success: true,
        data: {
          dynamic_field_id: data.dynamic_field_id,
          is_update: data.is_update,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * READ - Get dynamic fields
   */
  async getDynamicFields(options: DynamicFieldOptions = {}): Promise<ApiResponse<DynamicField[]>> {
    const orgId = this.organizationId;

    if (!orgId) {
      return {
        success: false,
        error: 'organization_id is required',
      };
    }

    try {
      const queryParams = new URLSearchParams({
        organization_id: orgId,
        ...Object.fromEntries(
          Object.entries(options).filter(([_, v]) => v !== undefined)
        ),
      });

      const response = await fetch(`${this.baseUrl}/dynamic-data-read?${queryParams}`, {
        method: 'GET',
        headers: this.headers,
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to read dynamic fields',
        };
      }

      return {
        success: true,
        data: result.data,
        metadata: result.metadata,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * DELETE - Remove dynamic field(s)
   */
  async deleteDynamicField(params: {
    field_id?: string;
    entity_id?: string;
    field_name?: string;
    delete_all_fields?: boolean;
  }): Promise<ApiResponse<any>> {
    const orgId = this.organizationId;

    if (!orgId) {
      return {
        success: false,
        error: 'organization_id is required',
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/dynamic-data-delete`, {
        method: 'DELETE',
        headers: this.headers,
        body: JSON.stringify({
          organization_id: orgId,
          ...params,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to delete dynamic field',
        };
      }

      return {
        success: true,
        data: result.deleted_data,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * BATCH - Upsert multiple dynamic fields for an entity
   */
  async batchUpsertDynamicFields(entityId: string, fields: Partial<DynamicField>[]): Promise<ApiResponse<any[]>> {
    const orgId = this.organizationId;

    if (!orgId) {
      return {
        success: false,
        error: 'organization_id is required',
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/dynamic-data-upsert`, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify({
          organization_id: orgId,
          entity_id: entityId,
          fields: fields.map(field => ({
            entity_id: entityId,
            ...field,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok && response.status !== 207) { // 207 is multi-status (partial success)
        return {
          success: false,
          error: result.error || 'Failed to batch upsert dynamic fields',
        };
      }

      return {
        success: result.success,
        data: result.results,
        metadata: {
          total: result.total,
          succeeded: result.succeeded,
          failed: result.failed,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Helper: Set a single dynamic field value
   */
  async setDynamicFieldValue(
    entityId: string,
    fieldName: string,
    value: string | number | boolean | Date | Record<string, any>,
    fieldType?: DynamicField['field_type']
  ): Promise<ApiResponse<{ dynamic_field_id: string; is_update: boolean }>> {
    // Auto-detect field type if not provided
    let detectedType: DynamicField['field_type'] = fieldType || 'text';
    let fieldData: Partial<DynamicField> = {
      entity_id: entityId,
      field_name: fieldName,
      field_type: detectedType,
    };

    if (!fieldType) {
      if (typeof value === 'number') {
        detectedType = 'number';
      } else if (typeof value === 'boolean') {
        detectedType = 'boolean';
      } else if (value instanceof Date) {
        detectedType = 'datetime';
      } else if (typeof value === 'object') {
        detectedType = 'json';
      }
      fieldData.field_type = detectedType;
    }

    // Set the appropriate field value based on type
    switch (detectedType) {
      case 'text':
        fieldData.field_value_text = String(value);
        break;
      case 'number':
        fieldData.field_value_number = Number(value);
        break;
      case 'boolean':
        fieldData.field_value_boolean = Boolean(value);
        break;
      case 'date':
        fieldData.field_value_date = value instanceof Date ? value.toISOString().split('T')[0] : String(value);
        break;
      case 'datetime':
        fieldData.field_value_datetime = value instanceof Date ? value.toISOString() : String(value);
        break;
      case 'json':
        fieldData.field_value_json = typeof value === 'object' ? value as Record<string, any> : { value };
        break;
    }

    return this.upsertDynamicField(fieldData as DynamicField);
  }

  /**
   * Helper: Get all dynamic fields for an entity as key-value object
   */
  async getDynamicFieldsAsObject(entityId: string): Promise<ApiResponse<Record<string, any>>> {
    const result = await this.getDynamicFields({ entity_id: entityId });

    if (!result.success || !result.data) {
      return result as ApiResponse<Record<string, any>>;
    }

    const fieldsObject = result.data.reduce((acc: Record<string, any>, field: DynamicField) => {
      let value: any;

      // Extract the actual value based on field type
      switch (field.field_type) {
        case 'text':
          value = field.field_value_text;
          break;
        case 'number':
          value = field.field_value_number;
          break;
        case 'boolean':
          value = field.field_value_boolean;
          break;
        case 'date':
          value = field.field_value_date;
          break;
        case 'datetime':
          value = field.field_value_datetime;
          break;
        case 'json':
          value = field.field_value_json;
          break;
        default:
          value = field.field_value_text;
      }

      acc[field.field_name] = value;
      return acc;
    }, {});

    return {
      success: true,
      data: fieldsObject,
      metadata: { field_count: result.data.length },
    };
  }
}

// Export singleton instance
export const entityClientV2 = new EntityClientV2();

// Export factory function for multiple instances
export function createEntityClientV2(baseUrl?: string): EntityClientV2 {
  return new EntityClientV2(baseUrl);
}