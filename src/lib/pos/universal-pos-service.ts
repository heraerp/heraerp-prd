/**
 * HERA Universal POS Service Layer
 * Smart Code: HERA.RETAIL.POS.SERVICE.UNIVERSAL.v1
 * 
 * Provides standardized interface between POS UI components and HERA API v2
 * Handles Sacred Six data transformation, caching, and business logic
 */

import { apiV2 } from '@/lib/client/fetchV2'

// ==================== Type Definitions ====================

export interface POSEntity {
  id?: string
  organization_id: string
  entity_type: string
  entity_name: string
  entity_code?: string
  smart_code: string
  created_at?: string
  updated_at?: string
}

export interface POSDynamicField {
  field_name: string
  field_type: 'text' | 'number' | 'boolean' | 'email' | 'phone' | 'date' | 'currency'
  field_value_text?: string
  field_value_number?: number
  field_value_boolean?: boolean
  field_value_date?: string
  smart_code: string
}

export interface POSCreateRequest {
  entity_type: string
  entity_name: string
  entity_code?: string
  smart_code: string
  organization_id: string
  dynamic_fields: POSDynamicField[]
  relationships?: POSRelationship[]
}

export interface POSRelationship {
  from_entity_id: string
  to_entity_id: string
  relationship_type: string
  smart_code: string
  relationship_data?: any
}

export interface POSServiceResponse<T> {
  success: boolean
  data?: T
  error?: string
  metadata?: {
    count?: number
    page?: number
    totalPages?: number
    executionTime?: number
  }
}

// ==================== Smart Code Patterns ====================

export const POS_SMART_CODES = {
  // Entity Types
  CUSTOMER: 'HERA.RETAIL.POS.CUSTOMER.ENTITY.v1',
  PRODUCT: 'HERA.RETAIL.POS.PRODUCT.ENTITY.v1', 
  SUPPLIER: 'HERA.RETAIL.POS.SUPPLIER.ENTITY.v1',
  STAFF: 'HERA.RETAIL.POS.STAFF.ENTITY.v1',
  INVENTORY: 'HERA.RETAIL.POS.INVENTORY.ENTITY.v1',
  CATEGORY: 'HERA.RETAIL.POS.CATEGORY.ENTITY.v1',

  // Field Types
  FIELDS: {
    CUSTOMER: {
      EMAIL: 'HERA.RETAIL.POS.CUSTOMER.FIELD.EMAIL.v1',
      PHONE: 'HERA.RETAIL.POS.CUSTOMER.FIELD.PHONE.v1',
      LOYALTY_TIER: 'HERA.RETAIL.POS.CUSTOMER.FIELD.LOYALTY_TIER.v1',
      LOYALTY_POINTS: 'HERA.RETAIL.POS.CUSTOMER.FIELD.LOYALTY_POINTS.v1',
      TOTAL_SPENT: 'HERA.RETAIL.POS.CUSTOMER.FIELD.TOTAL_SPENT.v1',
      ADDRESS: 'HERA.RETAIL.POS.CUSTOMER.FIELD.ADDRESS.v1',
      GST_NUMBER: 'HERA.RETAIL.POS.CUSTOMER.FIELD.GST_NUMBER.v1'
    },
    PRODUCT: {
      SKU: 'HERA.RETAIL.POS.PRODUCT.FIELD.SKU.v1',
      PRICE: 'HERA.RETAIL.POS.PRODUCT.FIELD.PRICE.v1',
      COST: 'HERA.RETAIL.POS.PRODUCT.FIELD.COST.v1',
      BARCODE: 'HERA.RETAIL.POS.PRODUCT.FIELD.BARCODE.v1',
      CATEGORY: 'HERA.RETAIL.POS.PRODUCT.FIELD.CATEGORY.v1',
      GST_RATE: 'HERA.RETAIL.POS.PRODUCT.FIELD.GST_RATE.v1',
      HSN_CODE: 'HERA.RETAIL.POS.PRODUCT.FIELD.HSN_CODE.v1'
    },
    SUPPLIER: {
      EMAIL: 'HERA.RETAIL.POS.SUPPLIER.FIELD.EMAIL.v1',
      PHONE: 'HERA.RETAIL.POS.SUPPLIER.FIELD.PHONE.v1',
      GST_NUMBER: 'HERA.RETAIL.POS.SUPPLIER.FIELD.GST_NUMBER.v1',
      PAYMENT_TERMS: 'HERA.RETAIL.POS.SUPPLIER.FIELD.PAYMENT_TERMS.v1',
      ADDRESS: 'HERA.RETAIL.POS.SUPPLIER.FIELD.ADDRESS.v1'
    },
    STAFF: {
      EMAIL: 'HERA.RETAIL.POS.STAFF.FIELD.EMAIL.v1',
      PHONE: 'HERA.RETAIL.POS.STAFF.FIELD.PHONE.v1',
      ROLE: 'HERA.RETAIL.POS.STAFF.FIELD.ROLE.v1',
      SALARY: 'HERA.RETAIL.POS.STAFF.FIELD.SALARY.v1',
      HIRE_DATE: 'HERA.RETAIL.POS.STAFF.FIELD.HIRE_DATE.v1',
      PAN_NUMBER: 'HERA.RETAIL.POS.STAFF.FIELD.PAN_NUMBER.v1',
      AADHAR_NUMBER: 'HERA.RETAIL.POS.STAFF.FIELD.AADHAR_NUMBER.v1'
    },
    INVENTORY: {
      QUANTITY: 'HERA.RETAIL.POS.INVENTORY.FIELD.QUANTITY.v1',
      MIN_STOCK: 'HERA.RETAIL.POS.INVENTORY.FIELD.MIN_STOCK.v1',
      MAX_STOCK: 'HERA.RETAIL.POS.INVENTORY.FIELD.MAX_STOCK.v1',
      LOCATION: 'HERA.RETAIL.POS.INVENTORY.FIELD.LOCATION.v1',
      BATCH_NUMBER: 'HERA.RETAIL.POS.INVENTORY.FIELD.BATCH_NUMBER.v1',
      EXPIRY_DATE: 'HERA.RETAIL.POS.INVENTORY.FIELD.EXPIRY_DATE.v1'
    }
  },

  // Relationship Types
  RELATIONSHIPS: {
    PRODUCT_IN_CATEGORY: 'HERA.RETAIL.POS.REL.PRODUCT_IN_CATEGORY.v1',
    SUPPLIER_SUPPLIES_PRODUCT: 'HERA.RETAIL.POS.REL.SUPPLIER_SUPPLIES_PRODUCT.v1',
    STAFF_MANAGES_INVENTORY: 'HERA.RETAIL.POS.REL.STAFF_MANAGES_INVENTORY.v1',
    INVENTORY_FOR_PRODUCT: 'HERA.RETAIL.POS.REL.INVENTORY_FOR_PRODUCT.v1'
  }
} as const

// ==================== Universal POS Service ====================

export class UniversalPOSService {
  private organizationId: string

  constructor(organizationId: string) {
    this.organizationId = organizationId
  }

  // ============ Entity CRUD Operations ============

  /**
   * Create a new POS entity
   */
  async createEntity(request: POSCreateRequest): Promise<POSServiceResponse<POSEntity>> {
    try {
      const { data, error } = await apiV2.post('entities', {
        operation: 'create',
        entity_type: request.entity_type,
        entity_name: request.entity_name,
        entity_code: request.entity_code,
        smart_code: request.smart_code,
        organization_id: this.organizationId,
        entity_data: {
          entity_type: request.entity_type,
          entity_name: request.entity_name,
          entity_code: request.entity_code || this.generateEntityCode(request.entity_type),
          smart_code: request.smart_code,
          organization_id: this.organizationId
        },
        dynamic_fields: request.dynamic_fields,
        relationships: request.relationships || []
      })

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to create entity'
        }
      }

      return {
        success: true,
        data: data?.entity
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get entity by ID
   */
  async getEntity(entityId: string): Promise<POSServiceResponse<POSEntity & { dynamic_fields?: POSDynamicField[] }>> {
    try {
      const { data, error } = await apiV2.post('entities', {
        operation: 'read',
        entity_id: entityId,
        organization_id: this.organizationId,
        include_dynamic: true
      })

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to fetch entity'
        }
      }

      return {
        success: true,
        data: data?.entity
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Search entities by type with filters
   */
  async searchEntities(
    entityType: string,
    filters?: {
      search?: string
      limit?: number
      offset?: number
      [key: string]: any
    }
  ): Promise<POSServiceResponse<POSEntity[]>> {
    try {
      const { data, error } = await apiV2.post('entities/search', {
        entity_type: entityType,
        organization_id: this.organizationId,
        filters: filters || {},
        limit: filters?.limit || 50,
        offset: filters?.offset || 0,
        include_dynamic: true
      })

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to search entities'
        }
      }

      return {
        success: true,
        data: data?.entities || [],
        metadata: {
          count: data?.count || 0,
          page: Math.floor((filters?.offset || 0) / (filters?.limit || 50)) + 1,
          totalPages: Math.ceil((data?.count || 0) / (filters?.limit || 50))
        }
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Update entity
   */
  async updateEntity(
    entityId: string,
    updates: Partial<POSCreateRequest>
  ): Promise<POSServiceResponse<POSEntity>> {
    try {
      const { data, error } = await apiV2.post('entities', {
        operation: 'update',
        entity_id: entityId,
        organization_id: this.organizationId,
        entity_data: updates.entity_name ? { entity_name: updates.entity_name } : {},
        dynamic_fields: updates.dynamic_fields || []
      })

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to update entity'
        }
      }

      return {
        success: true,
        data: data?.entity
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Delete entity
   */
  async deleteEntity(entityId: string): Promise<POSServiceResponse<boolean>> {
    try {
      const { data, error } = await apiV2.post('entities', {
        operation: 'delete',
        entity_id: entityId,
        organization_id: this.organizationId
      })

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to delete entity'
        }
      }

      return {
        success: true,
        data: true
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error occurred'
      }
    }
  }

  // ============ Specialized POS Methods ============

  /**
   * Create customer with standard POS fields
   */
  async createCustomer(customerData: {
    name: string
    email?: string
    phone?: string
    address?: string
    gstNumber?: string
    loyaltyTier?: string
    loyaltyPoints?: number
  }): Promise<POSServiceResponse<POSEntity>> {
    const dynamicFields: POSDynamicField[] = []

    if (customerData.email) {
      dynamicFields.push({
        field_name: 'email',
        field_type: 'email',
        field_value_text: customerData.email,
        smart_code: POS_SMART_CODES.FIELDS.CUSTOMER.EMAIL
      })
    }

    if (customerData.phone) {
      dynamicFields.push({
        field_name: 'phone',
        field_type: 'phone',
        field_value_text: customerData.phone,
        smart_code: POS_SMART_CODES.FIELDS.CUSTOMER.PHONE
      })
    }

    if (customerData.address) {
      dynamicFields.push({
        field_name: 'address',
        field_type: 'text',
        field_value_text: customerData.address,
        smart_code: POS_SMART_CODES.FIELDS.CUSTOMER.ADDRESS
      })
    }

    if (customerData.gstNumber) {
      dynamicFields.push({
        field_name: 'gst_number',
        field_type: 'text',
        field_value_text: customerData.gstNumber,
        smart_code: POS_SMART_CODES.FIELDS.CUSTOMER.GST_NUMBER
      })
    }

    if (customerData.loyaltyTier) {
      dynamicFields.push({
        field_name: 'loyalty_tier',
        field_type: 'text',
        field_value_text: customerData.loyaltyTier,
        smart_code: POS_SMART_CODES.FIELDS.CUSTOMER.LOYALTY_TIER
      })
    }

    if (customerData.loyaltyPoints !== undefined) {
      dynamicFields.push({
        field_name: 'loyalty_points',
        field_type: 'number',
        field_value_number: customerData.loyaltyPoints,
        smart_code: POS_SMART_CODES.FIELDS.CUSTOMER.LOYALTY_POINTS
      })

      dynamicFields.push({
        field_name: 'total_spent',
        field_type: 'currency',
        field_value_number: 0, // Initialize to 0
        smart_code: POS_SMART_CODES.FIELDS.CUSTOMER.TOTAL_SPENT
      })
    }

    return this.createEntity({
      entity_type: 'CUSTOMER',
      entity_name: customerData.name,
      smart_code: POS_SMART_CODES.CUSTOMER,
      organization_id: this.organizationId,
      dynamic_fields: dynamicFields
    })
  }

  /**
   * Create product with Indian GST compliance
   */
  async createProduct(productData: {
    name: string
    sku?: string
    price: number
    cost?: number
    category?: string
    barcode?: string
    gstRate: number
    hsnCode: string
  }): Promise<POSServiceResponse<POSEntity>> {
    const dynamicFields: POSDynamicField[] = [
      {
        field_name: 'price',
        field_type: 'currency',
        field_value_number: productData.price,
        smart_code: POS_SMART_CODES.FIELDS.PRODUCT.PRICE
      },
      {
        field_name: 'gst_rate',
        field_type: 'number',
        field_value_number: productData.gstRate,
        smart_code: POS_SMART_CODES.FIELDS.PRODUCT.GST_RATE
      },
      {
        field_name: 'hsn_code',
        field_type: 'text',
        field_value_text: productData.hsnCode,
        smart_code: POS_SMART_CODES.FIELDS.PRODUCT.HSN_CODE
      }
    ]

    if (productData.sku) {
      dynamicFields.push({
        field_name: 'sku',
        field_type: 'text',
        field_value_text: productData.sku,
        smart_code: POS_SMART_CODES.FIELDS.PRODUCT.SKU
      })
    }

    if (productData.cost) {
      dynamicFields.push({
        field_name: 'cost',
        field_type: 'currency',
        field_value_number: productData.cost,
        smart_code: POS_SMART_CODES.FIELDS.PRODUCT.COST
      })
    }

    if (productData.category) {
      dynamicFields.push({
        field_name: 'category',
        field_type: 'text',
        field_value_text: productData.category,
        smart_code: POS_SMART_CODES.FIELDS.PRODUCT.CATEGORY
      })
    }

    if (productData.barcode) {
      dynamicFields.push({
        field_name: 'barcode',
        field_type: 'text',
        field_value_text: productData.barcode,
        smart_code: POS_SMART_CODES.FIELDS.PRODUCT.BARCODE
      })
    }

    return this.createEntity({
      entity_type: 'PRODUCT',
      entity_name: productData.name,
      entity_code: productData.sku || this.generateEntityCode('PRODUCT'),
      smart_code: POS_SMART_CODES.PRODUCT,
      organization_id: this.organizationId,
      dynamic_fields: dynamicFields
    })
  }

  // ============ Utility Methods ============

  /**
   * Generate entity code for given type
   */
  private generateEntityCode(entityType: string): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 4)
    return `${entityType.substr(0, 3).toUpperCase()}-${timestamp}-${random}`.toUpperCase()
  }

  /**
   * Convert API response to UI format
   */
  convertToUIFormat(apiEntity: any): any {
    // Extract dynamic fields and merge with entity data
    const result = {
      id: apiEntity.id,
      name: apiEntity.entity_name,
      code: apiEntity.entity_code,
      type: apiEntity.entity_type,
      createdAt: apiEntity.created_at,
      updatedAt: apiEntity.updated_at
    }

    // Add dynamic fields as direct properties
    if (apiEntity.dynamic_fields) {
      for (const field of apiEntity.dynamic_fields) {
        const value = field.field_value_text || 
                     field.field_value_number || 
                     field.field_value_boolean ||
                     field.field_value_date

        result[field.field_name] = value
      }
    }

    return result
  }

  /**
   * Get organization ID
   */
  getOrganizationId(): string {
    return this.organizationId
  }
}

// ==================== Factory Function ====================

/**
 * Create Universal POS Service instance
 */
export function createUniversalPOSService(organizationId: string): UniversalPOSService {
  return new UniversalPOSService(organizationId)
}

// ==================== Export Types ====================

export type {
  POSEntity,
  POSDynamicField,
  POSCreateRequest,
  POSRelationship,
  POSServiceResponse
}