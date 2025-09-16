import { supabase } from './supabase'
import { heraValidationService } from './services/hera-validation-service'

/**
 * 🧬 HERA Universal API v2 - Enterprise Grade
 *
 * Standardized API for all 6 sacred tables with:
 * - Consistent response format
 * - Complete CRUD operations
 * - Enterprise features (batch, pagination, validation)
 * - Multi-tenant security
 * - Comprehensive error handling
 * - Audit trail support
 * - HERA Standards validation integration
 */

// ==================== Type Definitions ====================

export interface UniversalResponse<T> {
  success: boolean
  data: T | null
  error: string | null
  metadata?: {
    count?: number
    page?: number
    pageSize?: number
    totalPages?: number
    executionTime?: number
  }
}

export interface QueryOptions {
  // Pagination
  page?: number
  pageSize?: number

  // Filtering
  filters?: Record<string, any>
  search?: string
  searchFields?: string[]

  // Sorting
  orderBy?: string
  orderDirection?: 'asc' | 'desc'

  // Field selection
  select?: string[]

  // Organization override
  organizationId?: string

  // Validation options
  skipValidation?: boolean
  validateOnly?: boolean
}

export interface BatchOperation<T> {
  operation: 'create' | 'update' | 'delete'
  data: T
}

// Sacred Table Types
export interface Entity {
  id?: string
  organization_id: string
  entity_type: string
  entity_name: string
  entity_code?: string
  smart_code: string
  metadata?: any
  created_at?: string
  updated_at?: string
}

export interface Relationship {
  id?: string
  organization_id: string
  from_entity_id: string
  to_entity_id: string
  relationship_type: string
  smart_code: string
  relationship_data?: any
  created_at?: string
  updated_at?: string
}

export interface Transaction {
  id?: string
  organization_id: string
  transaction_type: string
  transaction_code?: string
  transaction_date: string
  source_entity_id?: string
  target_entity_id?: string
  reference_entity_id?: string
  total_amount?: number
  smart_code: string
  metadata?: any
  created_at?: string
  updated_at?: string
}

export interface TransactionLine {
  id?: string
  organization_id: string
  transaction_id: string
  line_number: number
  entity_id?: string
  quantity?: string
  unit_price?: number
  line_amount?: number
  smart_code: string
  metadata?: any
  created_at?: string
  updated_at?: string
}

export interface DynamicData {
  id?: string
  organization_id: string
  entity_id?: string
  field_name: string
  field_type: 'text' | 'number' | 'date' | 'json' | 'boolean'
  field_value_text?: string
  field_value_number?: number
  field_value_date?: string
  field_value_json?: any
  field_value_boolean?: boolean
  smart_code?: string
  metadata?: any
  created_at?: string
  updated_at?: string
}

export interface Organization {
  id?: string
  organization_name: string
  organization_code: string
  industry?: string
  country?: string
  settings?: any
  created_at?: string
  updated_at?: string
}

// ==================== Main API Class ====================

class UniversalAPIv2 {
  private organizationId: string | null = null
  private mockMode = false
  private defaultPageSize = 50

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    this.mockMode = !supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')

    if (this.mockMode) {
      console.log('⚠️ HERA Universal API v2 running in mock mode')
    }
  }

  // ==================== Configuration ====================

  setOrganizationId(orgId: string | null) {
    this.organizationId = orgId
  }

  getOrganizationId(): string | null {
    return this.organizationId
  }

  setDefaultPageSize(size: number) {
    this.defaultPageSize = size
  }

  // ==================== Utility Methods ====================

  private async executeWithTiming<T>(
    operation: () => Promise<T>
  ): Promise<{ result: T; executionTime: number }> {
    const startTime = Date.now()
    const result = await operation()
    const executionTime = Date.now() - startTime
    return { result, executionTime }
  }

  private standardizeError(error: any): string {
    if (typeof error === 'string') return error
    if (error?.message) return error.message
    if (error?.error) return error.error
    return 'An unexpected error occurred'
  }

  private ensureOrganizationId(providedOrgId?: string): string {
    const orgId = providedOrgId || this.organizationId
    if (!orgId) {
      throw new Error('Organization ID is required but not set')
    }
    return orgId
  }

  private applyQueryOptions(query: any, options: QueryOptions) {
    // Organization filter
    if (options.organizationId || this.organizationId) {
      query = query.eq('organization_id', options.organizationId || this.organizationId)
    }

    // Additional filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query = query.in(key, value)
          } else {
            query = query.eq(key, value)
          }
        }
      })
    }

    // Search
    if (options.search && options.searchFields?.length) {
      const searchConditions = options.searchFields
        .map(field => `${field}.ilike.%${options.search}%`)
        .join(',')
      query = query.or(searchConditions)
    }

    // Sorting
    if (options.orderBy) {
      query = query.order(options.orderBy, { ascending: options.orderDirection === 'asc' })
    }

    // Field selection
    if (options.select?.length) {
      query = query.select(options.select.join(','))
    }

    return query
  }

  private async paginateQuery(
    query: any,
    options: QueryOptions
  ): Promise<{ data: any[]; count: number }> {
    const page = options.page || 1
    const pageSize = options.pageSize || this.defaultPageSize

    // Get total count
    const countQuery = query
    const { count } = await countQuery

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error } = await query

    if (error) throw error

    return { data: data || [], count: count || 0 }
  }

  // ==================== CRUD Operations for core_entities ====================

  async createEntity(
    entity: Entity,
    options?: { skipValidation?: boolean; validateOnly?: boolean }
  ): Promise<UniversalResponse<Entity>> {
    try {
      const orgId = this.ensureOrganizationId(entity.organization_id)

      // HERA Standards Validation
      if (!options?.skipValidation) {
        const validation = await heraValidationService.validateEntity({
          entity_type: entity.entity_type,
          entity_name: entity.entity_name,
          entity_code: entity.entity_code,
          smart_code: entity.smart_code,
          organization_id: orgId
        })

        if (!validation.valid) {
          return {
            success: false,
            data: null,
            error: `Validation failed: ${validation.errors.map(e => e.message).join('; ')}`,
            metadata: {
              validationErrors: validation.errors,
              validationWarnings: validation.warnings
            }
          }
        }

        // If validation only, return validation results without creating
        if (options?.validateOnly) {
          return {
            success: true,
            data: null,
            error: null,
            metadata: {
              validationPassed: true,
              validationWarnings: validation.warnings
            }
          }
        }
      }

      if (this.mockMode) {
        const mockEntity = {
          id: crypto.randomUUID(),
          ...entity,
          organization_id: orgId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        return { success: true, data: mockEntity, error: null }
      }

      const { result, executionTime } = await this.executeWithTiming(async () => {
        // Use HERA Entity Normalization DNA by default
        const { data, error } = await supabase.rpc('rpc_entities_resolve_and_upsert', {
          p_org_id: orgId,
          p_entity_type: entity.entity_type,
          p_entity_name: entity.entity_name,
          p_entity_code: entity.entity_code,
          p_smart_code: entity.smart_code,
          p_metadata: entity.metadata || null
        })

        if (error) throw error

        // If it's not a new entity, we might want to warn about duplicate
        if (data && data[0] && !data[0].is_new) {
          console.warn(
            `Entity resolved to existing: matched by ${data[0].matched_by} with ${(data[0].confidence_score * 100).toFixed(0)}% confidence`
          )
        }

        // Fetch the full entity data
        const entityId = data[0].entity_id
        const { data: fullEntity, error: fetchError } = await supabase
          .from('core_entities')
          .select()
          .eq('id', entityId)
          .single()

        if (fetchError) throw fetchError

        // Store normalization metadata for reference
        const normalizationInfo = {
          isNew: data[0].is_new,
          matchedBy: data[0].matched_by,
          confidenceScore: data[0].confidence_score
        }

        return { entity: fullEntity, normalizationInfo }
      })

      return {
        success: true,
        data: result.entity,
        error: null,
        metadata: {
          executionTime,
          normalizationApplied: true,
          ...result.normalizationInfo
        }
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  async getEntity(id: string, options?: QueryOptions): Promise<UniversalResponse<Entity>> {
    try {
      const orgId = this.ensureOrganizationId(options?.organizationId)

      if (this.mockMode) {
        return { success: false, data: null, error: 'Mock mode - entity not found' }
      }

      const { result, executionTime } = await this.executeWithTiming(async () => {
        let query = supabase
          .from('core_entities')
          .select(options?.select?.join(',') || '*')
          .eq('id', id)
          .eq('organization_id', orgId)
          .single()

        const { data, error } = await query

        if (error) throw error
        return data
      })

      return {
        success: true,
        data: result,
        error: null,
        metadata: { executionTime }
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  async getEntities(options: QueryOptions = {}): Promise<UniversalResponse<Entity[]>> {
    try {
      const orgId = this.ensureOrganizationId(options.organizationId)

      if (this.mockMode) {
        return { success: true, data: [], error: null }
      }

      const { result, executionTime } = await this.executeWithTiming(async () => {
        let query = supabase.from('core_entities').select('*')

        // Apply standard query options
        query = this.applyQueryOptions(query, { ...options, organizationId: orgId })

        // Handle pagination
        const { data, count } = await this.paginateQuery(query, options)

        return { data, count }
      })

      const page = options.page || 1
      const pageSize = options.pageSize || this.defaultPageSize
      const totalPages = Math.ceil(result.count / pageSize)

      return {
        success: true,
        data: result.data,
        error: null,
        metadata: {
          count: result.count,
          page,
          pageSize,
          totalPages,
          executionTime
        }
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  async updateEntity(id: string, updates: Partial<Entity>): Promise<UniversalResponse<Entity>> {
    try {
      const orgId = this.ensureOrganizationId(updates.organization_id)

      if (this.mockMode) {
        return {
          success: true,
          data: { id, ...updates, updated_at: new Date().toISOString() } as Entity,
          error: null
        }
      }

      const { result, executionTime } = await this.executeWithTiming(async () => {
        const { data, error } = await supabase
          .from('core_entities')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('organization_id', orgId)
          .select()
          .single()

        if (error) throw error
        return data
      })

      return {
        success: true,
        data: result,
        error: null,
        metadata: { executionTime }
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  async deleteEntity(id: string, soft = true): Promise<UniversalResponse<void>> {
    try {
      const orgId = this.ensureOrganizationId()

      if (this.mockMode) {
        return { success: true, data: null, error: null }
      }

      const { executionTime } = await this.executeWithTiming(async () => {
        if (soft) {
          // Soft delete - mark as deleted
          const { error } = await supabase
            .from('core_entities')
            .update({
              metadata: { ...{}, deleted: true, deleted_at: new Date().toISOString() },
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('organization_id', orgId)

          if (error) throw error
        } else {
          // Hard delete
          const { error } = await supabase
            .from('core_entities')
            .delete()
            .eq('id', id)
            .eq('organization_id', orgId)

          if (error) throw error
        }
      })

      return {
        success: true,
        data: null,
        error: null,
        metadata: { executionTime }
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  // ==================== CRUD Operations for core_relationships ====================

  async createRelationship(relationship: Relationship): Promise<UniversalResponse<Relationship>> {
    try {
      const orgId = this.ensureOrganizationId(relationship.organization_id)

      if (this.mockMode) {
        const mockRelationship = {
          id: crypto.randomUUID(),
          ...relationship,
          organization_id: orgId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        return { success: true, data: mockRelationship, error: null }
      }

      const { result, executionTime } = await this.executeWithTiming(async () => {
        const { data, error } = await supabase
          .from('core_relationships')
          .insert({
            id: crypto.randomUUID(),
            ...relationship,
            organization_id: orgId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (error) throw error
        return data
      })

      return {
        success: true,
        data: result,
        error: null,
        metadata: { executionTime }
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  async getRelationships(options: QueryOptions = {}): Promise<UniversalResponse<Relationship[]>> {
    try {
      const orgId = this.ensureOrganizationId(options.organizationId)

      if (this.mockMode) {
        return { success: true, data: [], error: null }
      }

      const { result, executionTime } = await this.executeWithTiming(async () => {
        let query = supabase.from('core_relationships').select('*')

        query = this.applyQueryOptions(query, { ...options, organizationId: orgId })

        const { data, count } = await this.paginateQuery(query, options)

        return { data, count }
      })

      const page = options.page || 1
      const pageSize = options.pageSize || this.defaultPageSize
      const totalPages = Math.ceil(result.count / pageSize)

      return {
        success: true,
        data: result.data,
        error: null,
        metadata: {
          count: result.count,
          page,
          pageSize,
          totalPages,
          executionTime
        }
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  async updateRelationship(
    id: string,
    updates: Partial<Relationship>
  ): Promise<UniversalResponse<Relationship>> {
    try {
      const orgId = this.ensureOrganizationId(updates.organization_id)

      if (this.mockMode) {
        return {
          success: true,
          data: { id, ...updates, updated_at: new Date().toISOString() } as Relationship,
          error: null
        }
      }

      const { result, executionTime } = await this.executeWithTiming(async () => {
        const { data, error } = await supabase
          .from('core_relationships')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('organization_id', orgId)
          .select()
          .single()

        if (error) throw error
        return data
      })

      return {
        success: true,
        data: result,
        error: null,
        metadata: { executionTime }
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  async deleteRelationship(id: string): Promise<UniversalResponse<void>> {
    try {
      const orgId = this.ensureOrganizationId()

      if (this.mockMode) {
        return { success: true, data: null, error: null }
      }

      const { executionTime } = await this.executeWithTiming(async () => {
        const { error } = await supabase
          .from('core_relationships')
          .delete()
          .eq('id', id)
          .eq('organization_id', orgId)

        if (error) throw error
      })

      return {
        success: true,
        data: null,
        error: null,
        metadata: { executionTime }
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  // ==================== CRUD Operations for universal_transactions ====================

  async createTransaction(
    transaction: Transaction & { line_items?: any[] },
    options?: { skipValidation?: boolean; validateOnly?: boolean }
  ): Promise<UniversalResponse<Transaction>> {
    try {
      const orgId = this.ensureOrganizationId(transaction.organization_id)

      // HERA Standards Validation
      if (!options?.skipValidation) {
        const validation = await heraValidationService.validateTransaction({
          transaction_type: transaction.transaction_type,
          transaction_code: transaction.transaction_code,
          smart_code: transaction.smart_code,
          organization_id: orgId,
          total_amount: transaction.total_amount
        })

        if (!validation.valid) {
          return {
            success: false,
            data: null,
            error: `Validation failed: ${validation.errors.map(e => e.message).join('; ')}`,
            metadata: {
              validationErrors: validation.errors,
              validationWarnings: validation.warnings
            }
          }
        }

        // If validation only, return validation results without creating
        if (options?.validateOnly) {
          return {
            success: true,
            data: null,
            error: null,
            metadata: {
              validationPassed: true,
              validationWarnings: validation.warnings
            }
          }
        }
      }

      // If line_items are provided, use the enhanced method
      if (transaction.line_items && transaction.line_items.length > 0) {
        const result = await this.createTransactionWithLineItems(transaction, options)
        if (result.success && result.data) {
          // Return just the transaction for backward compatibility
          return {
            success: true,
            data: result.data.transaction,
            error: null,
            metadata: result.metadata
          }
        } else {
          return {
            success: false,
            data: null,
            error: result.error
          }
        }
      }

      // Otherwise use standard transaction creation
      // orgId already declared above

      if (this.mockMode) {
        const mockTransaction = {
          id: crypto.randomUUID(),
          ...transaction,
          organization_id: orgId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        return { success: true, data: mockTransaction, error: null }
      }

      const { result, executionTime } = await this.executeWithTiming(async () => {
        const { data, error } = await supabase
          .from('universal_transactions')
          .insert({
            id: crypto.randomUUID(),
            ...transaction,
            organization_id: orgId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (error) throw error
        return data
      })

      return {
        success: true,
        data: result,
        error: null,
        metadata: { executionTime }
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  async getTransaction(
    id: string,
    options?: QueryOptions
  ): Promise<UniversalResponse<Transaction>> {
    try {
      const orgId = this.ensureOrganizationId(options?.organizationId)

      if (this.mockMode) {
        return { success: false, data: null, error: 'Mock mode - transaction not found' }
      }

      const { result, executionTime } = await this.executeWithTiming(async () => {
        let query = supabase
          .from('universal_transactions')
          .select(options?.select?.join(',') || '*')
          .eq('id', id)
          .eq('organization_id', orgId)
          .single()

        const { data, error } = await query

        if (error) throw error
        return data
      })

      return {
        success: true,
        data: result,
        error: null,
        metadata: { executionTime }
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  async getTransactions(options: QueryOptions = {}): Promise<UniversalResponse<Transaction[]>> {
    try {
      const orgId = this.ensureOrganizationId(options.organizationId)

      if (this.mockMode) {
        return { success: true, data: [], error: null }
      }

      const { result, executionTime } = await this.executeWithTiming(async () => {
        let query = supabase.from('universal_transactions').select('*')

        query = this.applyQueryOptions(query, { ...options, organizationId: orgId })

        const { data, count } = await this.paginateQuery(query, options)

        return { data, count }
      })

      const page = options.page || 1
      const pageSize = options.pageSize || this.defaultPageSize
      const totalPages = Math.ceil(result.count / pageSize)

      return {
        success: true,
        data: result.data,
        error: null,
        metadata: {
          count: result.count,
          page,
          pageSize,
          totalPages,
          executionTime
        }
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  async updateTransaction(
    id: string,
    updates: Partial<Transaction>
  ): Promise<UniversalResponse<Transaction>> {
    try {
      const orgId = this.ensureOrganizationId(updates.organization_id)

      if (this.mockMode) {
        return {
          success: true,
          data: { id, ...updates, updated_at: new Date().toISOString() } as Transaction,
          error: null
        }
      }

      const { result, executionTime } = await this.executeWithTiming(async () => {
        const { data, error } = await supabase
          .from('universal_transactions')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('organization_id', orgId)
          .select()
          .single()

        if (error) throw error
        return data
      })

      return {
        success: true,
        data: result,
        error: null,
        metadata: { executionTime }
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  async deleteTransaction(id: string, soft = true): Promise<UniversalResponse<void>> {
    try {
      const orgId = this.ensureOrganizationId()

      if (this.mockMode) {
        return { success: true, data: null, error: null }
      }

      const { executionTime } = await this.executeWithTiming(async () => {
        if (soft) {
          const { error } = await supabase
            .from('universal_transactions')
            .update({
              metadata: { ...{}, deleted: true, deleted_at: new Date().toISOString() },
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('organization_id', orgId)

          if (error) throw error
        } else {
          const { error } = await supabase
            .from('universal_transactions')
            .delete()
            .eq('id', id)
            .eq('organization_id', orgId)

          if (error) throw error
        }
      })

      return {
        success: true,
        data: null,
        error: null,
        metadata: { executionTime }
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  // ==================== CRUD Operations for universal_transaction_lines ====================

  async createTransactionLine(line: TransactionLine): Promise<UniversalResponse<TransactionLine>> {
    try {
      const orgId = this.ensureOrganizationId(line.organization_id)

      if (this.mockMode) {
        const mockLine = {
          id: crypto.randomUUID(),
          ...line,
          organization_id: orgId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        return { success: true, data: mockLine, error: null }
      }

      const { result, executionTime } = await this.executeWithTiming(async () => {
        const { data, error } = await supabase
          .from('universal_transaction_lines')
          .insert({
            id: crypto.randomUUID(),
            ...line,
            organization_id: orgId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (error) throw error
        return data
      })

      return {
        success: true,
        data: result,
        error: null,
        metadata: { executionTime }
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  async getTransactionLines(
    options: QueryOptions = {}
  ): Promise<UniversalResponse<TransactionLine[]>> {
    try {
      const orgId = this.ensureOrganizationId(options.organizationId)

      if (this.mockMode) {
        return { success: true, data: [], error: null }
      }

      const { result, executionTime } = await this.executeWithTiming(async () => {
        let query = supabase.from('universal_transaction_lines').select('*')

        query = this.applyQueryOptions(query, { ...options, organizationId: orgId })

        const { data, count } = await this.paginateQuery(query, options)

        return { data, count }
      })

      const page = options.page || 1
      const pageSize = options.pageSize || this.defaultPageSize
      const totalPages = Math.ceil(result.count / pageSize)

      return {
        success: true,
        data: result.data,
        error: null,
        metadata: {
          count: result.count,
          page,
          pageSize,
          totalPages,
          executionTime
        }
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  async updateTransactionLine(
    id: string,
    updates: Partial<TransactionLine>
  ): Promise<UniversalResponse<TransactionLine>> {
    try {
      const orgId = this.ensureOrganizationId(updates.organization_id)

      if (this.mockMode) {
        return {
          success: true,
          data: { id, ...updates, updated_at: new Date().toISOString() } as TransactionLine,
          error: null
        }
      }

      const { result, executionTime } = await this.executeWithTiming(async () => {
        const { data, error } = await supabase
          .from('universal_transaction_lines')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('organization_id', orgId)
          .select()
          .single()

        if (error) throw error
        return data
      })

      return {
        success: true,
        data: result,
        error: null,
        metadata: { executionTime }
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  async deleteTransactionLine(id: string): Promise<UniversalResponse<void>> {
    try {
      const orgId = this.ensureOrganizationId()

      if (this.mockMode) {
        return { success: true, data: null, error: null }
      }

      const { executionTime } = await this.executeWithTiming(async () => {
        const { error } = await supabase
          .from('universal_transaction_lines')
          .delete()
          .eq('id', id)
          .eq('organization_id', orgId)

        if (error) throw error
      })

      return {
        success: true,
        data: null,
        error: null,
        metadata: { executionTime }
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  // ==================== CRUD Operations for core_dynamic_data ====================

  async setDynamicField(
    entityId: string,
    fieldName: string,
    fieldValue: any,
    options?: {
      smart_code?: string
      metadata?: any
    }
  ): Promise<UniversalResponse<DynamicData>> {
    try {
      const orgId = this.ensureOrganizationId()

      // Determine field type and value
      let fieldType: DynamicData['field_type']
      let dynamicData: Partial<DynamicData> = {
        organization_id: orgId,
        entity_id: entityId,
        field_name: fieldName,
        smart_code: options?.smart_code,
        metadata: options?.metadata
      }

      if (typeof fieldValue === 'string') {
        fieldType = 'text'
        dynamicData.field_type = fieldType
        dynamicData.field_value_text = fieldValue
      } else if (typeof fieldValue === 'number') {
        fieldType = 'number'
        dynamicData.field_type = fieldType
        dynamicData.field_value_number = fieldValue
      } else if (typeof fieldValue === 'boolean') {
        fieldType = 'boolean'
        dynamicData.field_type = fieldType
        dynamicData.field_value_boolean = fieldValue
      } else if (fieldValue instanceof Date) {
        fieldType = 'date'
        dynamicData.field_type = fieldType
        dynamicData.field_value_date = fieldValue.toISOString()
      } else {
        fieldType = 'json'
        dynamicData.field_type = fieldType
        dynamicData.field_value_json = fieldValue
      }

      if (this.mockMode) {
        const mockData = {
          id: crypto.randomUUID(),
          ...dynamicData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as DynamicData
        return { success: true, data: mockData, error: null }
      }

      const { result, executionTime } = await this.executeWithTiming(async () => {
        // Check if field already exists
        const { data: existingData } = await supabase
          .from('core_dynamic_data')
          .select('id')
          .eq('organization_id', orgId)
          .eq('entity_id', entityId)
          .eq('field_name', fieldName)
          .single()

        if (existingData) {
          // Update existing field
          const { data, error } = await supabase
            .from('core_dynamic_data')
            .update({
              ...dynamicData,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingData.id)
            .select()
            .single()

          if (error) throw error
          return data
        } else {
          // Create new field
          const { data, error } = await supabase
            .from('core_dynamic_data')
            .insert({
              id: crypto.randomUUID(),
              ...dynamicData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single()

          if (error) throw error
          return data
        }
      })

      return {
        success: true,
        data: result,
        error: null,
        metadata: { executionTime }
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  async getDynamicFields(entityId: string): Promise<UniversalResponse<DynamicData[]>> {
    try {
      const orgId = this.ensureOrganizationId()

      if (this.mockMode) {
        return { success: true, data: [], error: null }
      }

      const { result, executionTime } = await this.executeWithTiming(async () => {
        const { data, error } = await supabase
          .from('core_dynamic_data')
          .select('*')
          .eq('organization_id', orgId)
          .eq('entity_id', entityId)
          .order('field_name')

        if (error) throw error
        return data || []
      })

      return {
        success: true,
        data: result,
        error: null,
        metadata: { executionTime }
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  async deleteDynamicField(entityId: string, fieldName: string): Promise<UniversalResponse<void>> {
    try {
      const orgId = this.ensureOrganizationId()

      if (this.mockMode) {
        return { success: true, data: null, error: null }
      }

      const { executionTime } = await this.executeWithTiming(async () => {
        const { error } = await supabase
          .from('core_dynamic_data')
          .delete()
          .eq('organization_id', orgId)
          .eq('entity_id', entityId)
          .eq('field_name', fieldName)

        if (error) throw error
      })

      return {
        success: true,
        data: null,
        error: null,
        metadata: { executionTime }
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  // ==================== CRUD Operations for core_organizations ====================

  async getOrganization(id: string): Promise<UniversalResponse<Organization>> {
    try {
      if (this.mockMode) {
        return { success: false, data: null, error: 'Mock mode - organization not found' }
      }

      const { result, executionTime } = await this.executeWithTiming(async () => {
        const { data, error } = await supabase
          .from('core_organizations')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        return data
      })

      return {
        success: true,
        data: result,
        error: null,
        metadata: { executionTime }
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  async updateOrganization(
    id: string,
    updates: Partial<Organization>
  ): Promise<UniversalResponse<Organization>> {
    try {
      if (this.mockMode) {
        return {
          success: true,
          data: { id, ...updates, updated_at: new Date().toISOString() } as Organization,
          error: null
        }
      }

      const { result, executionTime } = await this.executeWithTiming(async () => {
        const { data, error } = await supabase
          .from('core_organizations')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        return data
      })

      return {
        success: true,
        data: result,
        error: null,
        metadata: { executionTime }
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  // ==================== Batch Operations ====================

  async batchCreate<T extends Entity | Relationship | Transaction | TransactionLine>(
    table:
      | 'core_entities'
      | 'core_relationships'
      | 'universal_transactions'
      | 'universal_transaction_lines',
    items: T[]
  ): Promise<UniversalResponse<T[]>> {
    try {
      const orgId = this.ensureOrganizationId()

      if (items.length === 0) {
        return { success: true, data: [], error: null }
      }

      if (this.mockMode) {
        const mockItems = items.map(item => ({
          id: crypto.randomUUID(),
          ...item,
          organization_id: orgId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })) as T[]
        return { success: true, data: mockItems, error: null }
      }

      const { result, executionTime } = await this.executeWithTiming(async () => {
        const itemsWithDefaults = items.map(item => ({
          id: crypto.randomUUID(),
          ...item,
          organization_id: orgId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))

        const { data, error } = await supabase.from(table).insert(itemsWithDefaults).select()

        if (error) throw error
        return data
      })

      return {
        success: true,
        data: result,
        error: null,
        metadata: {
          executionTime,
          count: result.length
        }
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  async batchUpdate<T extends Entity | Relationship | Transaction | TransactionLine>(
    table:
      | 'core_entities'
      | 'core_relationships'
      | 'universal_transactions'
      | 'universal_transaction_lines',
    updates: Array<{ id: string; data: Partial<T> }>
  ): Promise<UniversalResponse<number>> {
    try {
      const orgId = this.ensureOrganizationId()

      if (updates.length === 0) {
        return { success: true, data: 0, error: null }
      }

      if (this.mockMode) {
        return { success: true, data: updates.length, error: null }
      }

      const { result, executionTime } = await this.executeWithTiming(async () => {
        let updatedCount = 0

        // Batch updates must be done individually in Supabase
        for (const update of updates) {
          const { error } = await supabase
            .from(table)
            .update({
              ...update.data,
              updated_at: new Date().toISOString()
            })
            .eq('id', update.id)
            .eq('organization_id', orgId)

          if (!error) {
            updatedCount++
          }
        }

        return updatedCount
      })

      return {
        success: true,
        data: result,
        error: null,
        metadata: {
          executionTime,
          requested: updates.length,
          updated: result
        }
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  // ==================== Wizard & Business Setup Methods ====================

  async saveWizardStep(stepData: {
    organization_id: string
    wizard_session_id: string
    step: string
    data: any
    metadata?: any
  }): Promise<UniversalResponse<DynamicData>> {
    try {
      const dynamicData = {
        organization_id: stepData.organization_id,
        entity_id: null,
        field_name: `wizard_step_${stepData.step}`,
        field_value_json: {
          wizard_session_id: stepData.wizard_session_id,
          step_data: stepData.data,
          metadata: stepData.metadata
        },
        smart_code: `HERA.UCR.WIZARD.STEP.${stepData.step.toUpperCase()}.v1`,
        metadata: stepData.metadata
      }

      return await this.setDynamicField(
        '',
        `wizard_step_${stepData.step}`,
        dynamicData.field_value_json,
        {
          smart_code: dynamicData.smart_code,
          metadata: dynamicData.metadata
        }
      )
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  async getCOATemplate(request: {
    industry: string
    country: string
    currency: string
  }): Promise<UniversalResponse<any>> {
    try {
      if (this.mockMode) {
        // Return mock COA template
        const mockAccounts = this.generateMockCOATemplate(request)
        return { success: true, data: mockAccounts, error: null }
      }

      const systemOrgId = 'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944'

      const result = await this.getEntities({
        organizationId: systemOrgId,
        filters: {
          entity_type: 'account_template'
        },
        search: request.industry,
        searchFields: ['smart_code']
      })

      if (result.success && result.data) {
        return {
          success: true,
          data: { accounts: result.data },
          error: null
        }
      }

      // Fallback to mock if no templates found
      const mockAccounts = this.generateMockCOATemplate(request)
      return { success: true, data: mockAccounts, error: null }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  async activateOrganization(activationData: {
    organization_id: string
    wizard_data: any
    wizard_session_id: string
  }): Promise<UniversalResponse<any>> {
    try {
      const result = await this.updateOrganization(activationData.organization_id, {
        settings: {
          ...activationData.wizard_data,
          wizard_completed: true,
          wizard_session_id: activationData.wizard_session_id,
          activation_date: new Date().toISOString()
        }
      })

      if (result.success) {
        return {
          success: true,
          data: { message: 'Organization activated successfully' },
          error: null
        }
      } else {
        return result
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  // Mock COA template generator
  private generateMockCOATemplate(request: {
    industry: string
    country: string
    currency: string
  }) {
    const industryPrefix = request.industry.toUpperCase()

    const baseAccounts = [
      // Assets
      {
        entity_code: '1100000',
        entity_name: 'Cash and Cash Equivalents',
        parent_entity_code: '1000000',
        account_type: 'ASSET',
        account_subtype: 'CURRENT_ASSET',
        allow_posting: true,
        natural_balance: 'DEBIT',
        ifrs_classification: 'ASSET',
        smart_code: `HERA.${industryPrefix}.COA.ACCOUNT.GL.CASH.v1`
      },
      {
        entity_code: '1200000',
        entity_name: 'Accounts Receivable',
        parent_entity_code: '1000000',
        account_type: 'ASSET',
        account_subtype: 'CURRENT_ASSET',
        allow_posting: true,
        natural_balance: 'DEBIT',
        ifrs_classification: 'ASSET',
        smart_code: `HERA.${industryPrefix}.COA.ACCOUNT.GL.AR.v1`
      },
      // Liabilities
      {
        entity_code: '2100000',
        entity_name: 'Accounts Payable',
        parent_entity_code: '2000000',
        account_type: 'LIABILITY',
        account_subtype: 'CURRENT_LIABILITY',
        allow_posting: true,
        natural_balance: 'CREDIT',
        ifrs_classification: 'LIABILITY',
        smart_code: `HERA.${industryPrefix}.COA.ACCOUNT.GL.AP.v1`
      },
      // Revenue
      {
        entity_code: '4100000',
        entity_name: 'Sales Revenue',
        parent_entity_code: '4000000',
        account_type: 'REVENUE',
        account_subtype: 'OPERATING_REVENUE',
        allow_posting: true,
        natural_balance: 'CREDIT',
        ifrs_classification: 'REVENUE',
        smart_code: `HERA.${industryPrefix}.COA.ACCOUNT.GL.SALES.v1`
      },
      // Expenses
      {
        entity_code: '5100000',
        entity_name: 'Cost of Goods Sold',
        parent_entity_code: '5000000',
        account_type: 'EXPENSE',
        account_subtype: 'COST_OF_SALES',
        allow_posting: true,
        natural_balance: 'DEBIT',
        ifrs_classification: 'EXPENSE',
        smart_code: `HERA.${industryPrefix}.COA.ACCOUNT.GL.COGS.v1`
      }
    ]

    // Add industry-specific accounts
    if (request.industry === 'salon') {
      baseAccounts.push(
        {
          entity_code: '1350000',
          entity_name: 'Beauty Supplies Inventory',
          parent_entity_code: '1300000',
          account_type: 'ASSET',
          account_subtype: 'CURRENT_ASSET',
          allow_posting: true,
          natural_balance: 'DEBIT',
          ifrs_classification: 'ASSET',
          smart_code: `HERA.${industryPrefix}.COA.ACCOUNT.GL.INV.SUPPLIES.v1`
        },
        {
          entity_code: '4200000',
          entity_name: 'Service Revenue',
          parent_entity_code: '4000000',
          account_type: 'REVENUE',
          account_subtype: 'SERVICE_REVENUE',
          allow_posting: true,
          natural_balance: 'CREDIT',
          ifrs_classification: 'REVENUE',
          smart_code: `HERA.${industryPrefix}.COA.ACCOUNT.GL.SVC.v1`
        },
        {
          entity_code: '5200000',
          entity_name: 'Beauty Supply Costs',
          parent_entity_code: '5000000',
          account_type: 'EXPENSE',
          account_subtype: 'COST_OF_SALES',
          allow_posting: true,
          natural_balance: 'DEBIT',
          ifrs_classification: 'EXPENSE',
          smart_code: `HERA.${industryPrefix}.COA.ACCOUNT.GL.EXP.SUPPLIES.v1`
        }
      )
    }

    return { accounts: baseAccounts }
  }

  // ==================== Enhanced Transaction Methods ====================

  async createTransactionWithLineItems(
    transaction: Transaction & { line_items?: TransactionLine[] }
  ): Promise<UniversalResponse<{ transaction: Transaction; lines: TransactionLine[] }>> {
    try {
      const orgId = this.ensureOrganizationId(transaction.organization_id)

      if (this.mockMode) {
        const mockTransaction = {
          id: crypto.randomUUID(),
          ...transaction,
          organization_id: orgId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        const mockLines =
          transaction.line_items?.map((line, index) => ({
            id: crypto.randomUUID(),
            ...line,
            transaction_id: mockTransaction.id,
            organization_id: orgId,
            line_number: line.line_number || index + 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })) || []

        return {
          success: true,
          data: { transaction: mockTransaction, lines: mockLines },
          error: null
        }
      }

      const { result, executionTime } = await this.executeWithTiming(async () => {
        // Extract line items from transaction data
        const { line_items, ...transactionData } = transaction

        // Create transaction first
        const transactionId = crypto.randomUUID()
        const { data: txData, error: txError } = await supabase
          .from('universal_transactions')
          .insert({
            id: transactionId,
            ...transactionData,
            organization_id: orgId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (txError) throw txError

        // Create line items if provided
        const createdLines: TransactionLine[] = []
        if (line_items && line_items.length > 0) {
          const lineData = line_items.map((line, index) => ({
            id: crypto.randomUUID(),
            ...line,
            transaction_id: transactionId,
            organization_id: orgId,
            line_number: line.line_number || index + 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))

          const { data: linesData, error: linesError } = await supabase
            .from('universal_transaction_lines')
            .insert(lineData)
            .select()

          if (linesError) throw linesError
          createdLines.push(...(linesData || []))
        }

        return { transaction: txData, lines: createdLines }
      })

      return {
        success: true,
        data: result,
        error: null,
        metadata: { executionTime }
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  // ==================== Backwards Compatibility Methods ====================

  // Legacy read method for backwards compatibility
  async read(
    table: string,
    filter?: any,
    organizationId?: string
  ): Promise<UniversalResponse<any[]>> {
    try {
      const options: QueryOptions = {
        organizationId: organizationId || this.organizationId || undefined,
        filters: filter
      }

      switch (table) {
        case 'core_entities':
          return await this.getEntities(options)
        case 'core_relationships':
          return await this.getRelationships(options)
        case 'universal_transactions':
          return await this.getTransactions(options)
        case 'universal_transaction_lines':
          return await this.getTransactionLines(options)
        case 'core_dynamic_data':
          // Special handling for dynamic data
          if (filter?.entity_id) {
            return await this.getDynamicFields(filter.entity_id)
          }
        // Fall through to generic query
        default:
          // Generic query for any table
          if (this.mockMode) {
            return { success: true, data: [], error: null }
          }

          const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq('organization_id', options.organizationId || this.organizationId)

          if (error) throw error
          return { success: true, data: data || [], error: null }
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  // Legacy query method for backwards compatibility
  async query(table: string, filters?: any): Promise<{ data: any[] | null; error: string | null }> {
    const result = await this.read(table, filters)
    return {
      data: result.data,
      error: result.error
    }
  }

  // Legacy readEntities for backwards compatibility
  async readEntities(params: {
    entity_type?: string
    organization_id?: string
    search?: string
  }): Promise<{ data: any[] | null; error: string | null }> {
    const result = await this.getEntities({
      organizationId: params.organization_id,
      filters: params.entity_type ? { entity_type: params.entity_type } : undefined,
      search: params.search,
      searchFields: params.search ? ['entity_name', 'entity_code'] : undefined
    })

    return {
      data: result.data,
      error: result.error
    }
  }

  // Legacy getEntityBySmartCode for backwards compatibility
  async getEntityBySmartCode(smartCode: string): Promise<Entity | null> {
    const result = await this.getEntities({
      filters: { smart_code: smartCode },
      pageSize: 1
    })

    return result.success && result.data && result.data.length > 0 ? result.data[0] : null
  }

  // Legacy getTransactionsByIds for backwards compatibility
  async getTransactionsByIds(ids: string[]): Promise<Transaction[]> {
    if (ids.length === 0) return []

    const result = await this.getTransactions({
      filters: { id: ids },
      pageSize: ids.length
    })

    return result.success && result.data ? result.data : []
  }

  // ==================== HERA Standards Validation Methods ====================

  /**
   * Validate entity data against HERA standards
   */
  async validateEntity(entityData: {
    entity_type: string
    entity_name: string
    entity_code?: string
    smart_code?: string
    organization_id: string
  }): Promise<UniversalResponse<{ valid: boolean; errors: any[]; warnings: any[] }>> {
    try {
      const validation = await heraValidationService.validateEntity(entityData)

      return {
        success: true,
        data: validation,
        error: null
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  /**
   * Validate transaction data against HERA standards
   */
  async validateTransaction(transactionData: {
    transaction_type: string
    transaction_code?: string
    smart_code?: string
    organization_id: string
    total_amount?: number
  }): Promise<UniversalResponse<{ valid: boolean; errors: any[]; warnings: any[] }>> {
    try {
      const validation = await heraValidationService.validateTransaction(transactionData)

      return {
        success: true,
        data: validation,
        error: null
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  /**
   * Validate relationship data against HERA standards
   */
  async validateRelationship(relationshipData: {
    relationship_type: string
    from_entity_id: string
    to_entity_id: string
    organization_id: string
  }): Promise<UniversalResponse<{ valid: boolean; errors: any[]; warnings: any[] }>> {
    try {
      const validation = await heraValidationService.validateRelationship(relationshipData)

      return {
        success: true,
        data: validation,
        error: null
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  /**
   * Get all registered standards for a category
   */
  async getStandards(category: string, organizationId?: string): Promise<UniversalResponse<any[]>> {
    try {
      const orgId = organizationId || this.ensureOrganizationId()
      const standards = await heraValidationService.getStandards(category, orgId)

      return {
        success: true,
        data: standards,
        error: null
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  /**
   * Get validation statistics for current organization
   */
  async getValidationStats(organizationId?: string): Promise<UniversalResponse<any>> {
    try {
      const orgId = organizationId || this.ensureOrganizationId()
      const stats = await heraValidationService.getValidationStats(orgId)

      return {
        success: true,
        data: stats,
        error: null
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  /**
   * Load standards definitions from system organization
   */
  async loadStandards(organizationId?: string): Promise<UniversalResponse<void>> {
    try {
      const orgId = organizationId || this.ensureOrganizationId()
      await heraValidationService.loadStandards(orgId)

      return {
        success: true,
        data: null,
        error: null
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }

  /**
   * Clear validation cache
   */
  clearValidationCache(): UniversalResponse<void> {
    try {
      heraValidationService.clearCache()

      return {
        success: true,
        data: null,
        error: null
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: this.standardizeError(error)
      }
    }
  }
}

// Export singleton instance
export const universalApi = new UniversalAPIv2()

// Export class for testing
export { UniversalAPIv2 }
