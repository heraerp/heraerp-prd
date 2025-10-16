/**
 * Master CRUD v2 - Client Library
 * Easy-to-use client for Master CRUD v2 operations with built-in optimization
 */

import { fetchV2Json, apiV2 } from '@/lib/client/fetchV2'
import {
  CreateEntityCompleteRequest,
  CreateEntityCompleteResponse,
  UpdateEntityCompleteRequest,
  UpdateEntityCompleteResponse,
  DeleteEntityCompleteRequest,
  DeleteEntityCompleteResponse,
  QueryEntityCompleteRequest,
  QueryEntityCompleteResponse,
  MasterCrudEntityResult,
  MasterCrudError
} from '@/types/master-crud-v2.types'

/**
 * Master CRUD v2 Client
 * Provides high-level interface for atomic operations
 */
export class MasterCrudV2Client {
  private baseUrl = '/api/v2/master-crud'
  private performanceLogging = true

  constructor(options?: { 
    baseUrl?: string
    enablePerformanceLogging?: boolean 
  }) {
    if (options?.baseUrl) {
      this.baseUrl = options.baseUrl
    }
    this.performanceLogging = options?.enablePerformanceLogging ?? true
  }

  /**
   * Create entity with dynamic data and relationships atomically
   * Target: 80ms response time (73% improvement from 300ms)
   */
  async createEntityComplete(request: CreateEntityCompleteRequest): Promise<CreateEntityCompleteResponse> {
    const startTime = Date.now()
    
    try {
      const { data, error } = await fetchV2Json<CreateEntityCompleteResponse>(
        `${this.baseUrl}/create-entity-complete`,
        {
          method: 'POST',
          body: JSON.stringify(request)
        }
      )

      if (error || !data) {
        throw new MasterCrudClientError('CREATE_FAILED', error?.message || 'Create operation failed', error)
      }

      const totalTime = Date.now() - startTime
      this.logPerformance('createEntityComplete', totalTime, data.performance?.executionTimeMs)

      return data

    } catch (error) {
      const totalTime = Date.now() - startTime
      this.logError('createEntityComplete', error, totalTime)
      throw error
    }
  }

  /**
   * Update entity with dynamic data and relationships atomically
   * Target: 75ms response time for updates
   */
  async updateEntityComplete(request: UpdateEntityCompleteRequest): Promise<UpdateEntityCompleteResponse> {
    const startTime = Date.now()
    
    try {
      const { data, error } = await fetchV2Json<UpdateEntityCompleteResponse>(
        `${this.baseUrl}/update-entity-complete`,
        {
          method: 'PUT',
          body: JSON.stringify(request)
        }
      )

      if (error || !data) {
        throw new MasterCrudClientError('UPDATE_FAILED', error?.message || 'Update operation failed', error)
      }

      const totalTime = Date.now() - startTime
      this.logPerformance('updateEntityComplete', totalTime, data.performance?.executionTimeMs)

      return data

    } catch (error) {
      const totalTime = Date.now() - startTime
      this.logError('updateEntityComplete', error, totalTime)
      throw error
    }
  }

  /**
   * Delete entity with cascade options atomically
   * Target: 60ms response time for deletions
   */
  async deleteEntityComplete(request: DeleteEntityCompleteRequest): Promise<DeleteEntityCompleteResponse> {
    const startTime = Date.now()
    
    try {
      const { data, error } = await fetchV2Json<DeleteEntityCompleteResponse>(
        `${this.baseUrl}/delete-entity-complete`,
        {
          method: 'DELETE',
          body: JSON.stringify(request)
        }
      )

      if (error || !data) {
        throw new MasterCrudClientError('DELETE_FAILED', error?.message || 'Delete operation failed', error)
      }

      const totalTime = Date.now() - startTime
      this.logPerformance('deleteEntityComplete', totalTime, data.performance?.executionTimeMs)

      return data

    } catch (error) {
      const totalTime = Date.now() - startTime
      this.logError('deleteEntityComplete', error, totalTime)
      throw error
    }
  }

  /**
   * Query entities with dynamic data and relationships efficiently
   * Target: 60ms response time for queries
   */
  async queryEntityComplete(request: QueryEntityCompleteRequest): Promise<QueryEntityCompleteResponse> {
    const startTime = Date.now()
    
    try {
      // Use GET for simple queries, POST for complex ones
      const usePost = this.shouldUsePostForQuery(request)
      
      let response
      if (usePost) {
        response = await fetchV2Json<QueryEntityCompleteResponse>(
          `${this.baseUrl}/query-entity-complete`,
          {
            method: 'POST',
            body: JSON.stringify(request)
          }
        )
      } else {
        const params = this.buildQueryParams(request)
        response = await fetchV2Json<QueryEntityCompleteResponse>(
          `${this.baseUrl}/query-entity-complete?${params.toString()}`,
          { method: 'GET' }
        )
      }

      const { data, error } = response

      if (error || !data) {
        throw new MasterCrudClientError('QUERY_FAILED', error?.message || 'Query operation failed', error)
      }

      const totalTime = Date.now() - startTime
      this.logPerformance('queryEntityComplete', totalTime, data.performance?.executionTimeMs)

      return data

    } catch (error) {
      const totalTime = Date.now() - startTime
      this.logError('queryEntityComplete', error, totalTime)
      throw error
    }
  }

  /**
   * Health check for Master CRUD v2 system
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    responseTimeMs: number
    features: string[]
    performance: any
  }> {
    const startTime = Date.now()
    
    try {
      const { data, error } = await fetchV2Json(
        `${this.baseUrl}/health`,
        { method: 'GET' }
      )

      if (error || !data) {
        return {
          status: 'unhealthy',
          responseTimeMs: Date.now() - startTime,
          features: [],
          performance: { error: error?.message || 'Health check failed' }
        }
      }

      return data

    } catch (error) {
      return {
        status: 'unhealthy',
        responseTimeMs: Date.now() - startTime,
        features: [],
        performance: { error: error instanceof Error ? error.message : 'Health check failed' }
      }
    }
  }

  /**
   * Helper: Create customer entity (common use case)
   */
  async createCustomer(
    organizationId: string,
    customerData: {
      name: string
      email?: string
      phone?: string
      industry?: string
      revenue?: number
      assignedTo?: string
    }
  ): Promise<CreateEntityCompleteResponse> {
    const request: CreateEntityCompleteRequest = {
      organizationId,
      entityType: 'customer',
      entityName: customerData.name,
      smartCode: 'HERA.CRM.CUSTOMER.ENTITY.PROFILE.V1',
      dynamicData: {
        ...(customerData.email && { email: customerData.email }),
        ...(customerData.phone && { phone: customerData.phone }),
        ...(customerData.industry && { industry: customerData.industry }),
        ...(customerData.revenue && { revenue: customerData.revenue })
      },
      relationships: customerData.assignedTo ? [{
        type: 'ASSIGNED_TO',
        targetEntityId: customerData.assignedTo
      }] : undefined
    }

    return this.createEntityComplete(request)
  }

  /**
   * Helper: Create product entity (common use case)
   */
  async createProduct(
    organizationId: string,
    productData: {
      name: string
      description?: string
      price?: number
      category?: string
      sku?: string
      supplierId?: string
    }
  ): Promise<CreateEntityCompleteResponse> {
    const request: CreateEntityCompleteRequest = {
      organizationId,
      entityType: 'product',
      entityName: productData.name,
      smartCode: 'HERA.ECOM.PRODUCT.ENTITY.CATALOG.V1',
      entityDescription: productData.description,
      dynamicData: {
        ...(productData.price && { price: productData.price }),
        ...(productData.category && { category: productData.category }),
        ...(productData.sku && { sku: productData.sku })
      },
      relationships: productData.supplierId ? [{
        type: 'SUPPLIED_BY',
        targetEntityId: productData.supplierId
      }] : undefined
    }

    return this.createEntityComplete(request)
  }

  /**
   * Helper: Find entities by type with common filters
   */
  async findEntities(
    organizationId: string,
    entityType: string,
    options?: {
      includeDynamicData?: boolean
      includeRelationships?: boolean
      limit?: number
      status?: string[]
    }
  ): Promise<MasterCrudEntityResult[]> {
    const request: QueryEntityCompleteRequest = {
      organizationId,
      entityType,
      includeDynamicData: options?.includeDynamicData ?? false,
      includeRelationships: options?.includeRelationships ?? false,
      limit: options?.limit ?? 50,
      filters: options?.status ? { status: options.status } : undefined
    }

    const response = await this.queryEntityComplete(request)
    return response.entities
  }

  /**
   * Helper: Get entity by ID with all related data
   */
  async getEntityById(
    organizationId: string,
    entityId: string,
    options?: {
      includeDynamicData?: boolean
      includeRelationships?: boolean
    }
  ): Promise<MasterCrudEntityResult | null> {
    const request: QueryEntityCompleteRequest = {
      organizationId,
      entityId,
      includeDynamicData: options?.includeDynamicData ?? true,
      includeRelationships: options?.includeRelationships ?? true
    }

    const response = await this.queryEntityComplete(request)
    return response.entities[0] || null
  }

  // Private helper methods
  private shouldUsePostForQuery(request: QueryEntityCompleteRequest): boolean {
    // Use POST for complex queries that would create long URLs
    return !!(
      request.entityIds?.length ||
      request.entityTypes?.length ||
      request.smartCodes?.length ||
      request.filters ||
      (typeof request.includeDynamicData === 'object') ||
      (typeof request.includeRelationships === 'object')
    )
  }

  private buildQueryParams(request: QueryEntityCompleteRequest): URLSearchParams {
    const params = new URLSearchParams()
    
    params.append('organizationId', request.organizationId)
    
    if (request.entityId) params.append('entityId', request.entityId)
    if (request.entityType) params.append('entityType', request.entityType)
    if (request.smartCode) params.append('smartCode', request.smartCode)
    if (request.includeDynamicData === true) params.append('includeDynamicData', 'true')
    if (request.includeRelationships === true) params.append('includeRelationships', 'true')
    if (request.limit) params.append('limit', request.limit.toString())
    if (request.offset) params.append('offset', request.offset.toString())
    if (request.orderBy) params.append('orderBy', request.orderBy)
    if (request.orderDirection) params.append('orderDirection', request.orderDirection)
    
    return params
  }

  private logPerformance(operation: string, totalTime: number, serverTime?: number): void {
    if (!this.performanceLogging) return

    const networkTime = serverTime ? totalTime - serverTime : 0
    
    if (totalTime > 100) {
      console.warn(`[Master CRUD v2 Client] Slow ${operation}: ${totalTime}ms total (server: ${serverTime}ms, network: ${networkTime}ms)`)
    } else {
      console.log(`[Master CRUD v2 Client] Fast ${operation}: ${totalTime}ms total (server: ${serverTime}ms, network: ${networkTime}ms)`)
    }
  }

  private logError(operation: string, error: any, totalTime: number): void {
    console.error(`[Master CRUD v2 Client] ${operation} failed (${totalTime}ms):`, error)
  }
}

/**
 * Master CRUD v2 Client Error
 */
export class MasterCrudClientError extends Error {
  public readonly code: string
  public readonly details?: any

  constructor(code: string, message: string, details?: any) {
    super(message)
    this.name = 'MasterCrudClientError'
    this.code = code
    this.details = details
  }
}

/**
 * Create a new Master CRUD v2 client instance
 */
export function createMasterCrudV2Client(options?: {
  baseUrl?: string
  enablePerformanceLogging?: boolean
}): MasterCrudV2Client {
  return new MasterCrudV2Client(options)
}

// Export default client instance
export const masterCrudV2Client = new MasterCrudV2Client()