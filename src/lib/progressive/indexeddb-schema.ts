/**
 * HERA Progressive IndexedDB Schema Adapter
 * Implements the complete HERA 6-table universal schema in IndexedDB
 * Smart Code: HERA.PROGRESSIVE.SCHEMA.INDEXEDDB.v1
 */

export interface CoreOrganization {
  id: string
  organization_name: string
  organization_code: string
  organization_type: string
  industry_classification?: string
  ai_insights?: Record<string, any>
  settings?: Record<string, any>
  status: 'active' | 'inactive' | 'suspended'
  created_at: Date
  updated_at: Date
  expires_at: Date // Progressive-specific: 30-day expiry
}

export interface CoreEntity {
  id: string
  organization_id: string
  entity_type: string
  entity_name: string
  entity_code?: string
  entity_description?: string
  smart_code: string
  metadata?: Record<string, any>
  ai_insights?: Record<string, any>
  ai_confidence?: number
  ai_classification?: string
  status: 'active' | 'inactive' | 'draft'
  parent_entity_id?: string
  sort_order?: number
  created_at: Date
  updated_at: Date
  expires_at: Date // Progressive-specific: 30-day expiry
}

export interface CoreDynamicData {
  id: string
  organization_id: string
  entity_id: string
  field_name: string
  field_type: 'text' | 'number' | 'boolean' | 'date' | 'json' | 'file'
  field_value_text?: string
  field_value_number?: number
  field_value_boolean?: boolean
  field_value_date?: Date
  field_value_json?: Record<string, any>
  field_value_file?: string
  smart_code: string
  metadata?: Record<string, any>
  ai_insights?: Record<string, any>
  version: number
  created_at: Date
  updated_at: Date
}

export interface CoreRelationship {
  id: string
  organization_id: string
  source_entity_id: string
  target_entity_id: string
  relationship_type: string
  relationship_name?: string
  relationship_description?: string
  smart_code: string
  metadata?: Record<string, any>
  properties?: Record<string, any>
  ai_insights?: Record<string, any>
  strength?: number
  status: 'active' | 'inactive'
  effective_date?: Date
  expiry_date?: Date
  created_at: Date
  updated_at: Date
}

export interface UniversalTransaction {
  id: string
  organization_id: string
  transaction_type: string
  transaction_number: string
  transaction_date: Date
  reference_number?: string
  reference_entity_id?: string
  reference_document?: string
  smart_code: string
  description?: string
  total_amount?: number
  currency_code?: string
  exchange_rate?: number
  status: 'draft' | 'pending' | 'confirmed' | 'cancelled'
  metadata?: Record<string, any>
  ai_insights?: Record<string, any>
  workflow_status?: string
  approval_required?: boolean
  approved_by?: string
  approved_at?: Date
  posted_at?: Date
  created_at: Date
  updated_at: Date
  expires_at: Date // Progressive-specific: 30-day expiry
}

export interface UniversalTransactionLine {
  id: string
  organization_id: string
  transaction_id: string
  line_number: number
  line_entity_id?: string
  line_type?: string
  smart_code: string
  description?: string
  quantity?: number
  unit_price?: number
  line_amount?: number
  currency_code?: string
  tax_amount?: number
  discount_amount?: number
  metadata?: Record<string, any>
  ai_insights?: Record<string, any>
  properties?: Record<string, any>
  status: 'active' | 'cancelled'
  created_at: Date
  updated_at: Date
}

export interface IndexedDBConfig {
  dbName: string
  version: number
  stores: Record<string, {
    keyPath: string
    autoIncrement?: boolean
    indexes?: Record<string, {
      keyPath: string | string[]
      unique?: boolean
      multiEntry?: boolean
    }>
  }>
  expiry: {
    enabled: boolean
    duration: number // milliseconds
    cleanup_interval: number // milliseconds
  }
}

export class HERAIndexedDBSchema {
  private static readonly DB_NAME = 'hera_progressive'
  private static readonly DB_VERSION = 1
  private static readonly EXPIRY_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days
  private static readonly CLEANUP_INTERVAL = 24 * 60 * 60 * 1000 // Daily cleanup
  
  private db: IDBDatabase | null = null
  private cleanupTimer: NodeJS.Timeout | null = null

  /**
   * Get complete IndexedDB configuration for HERA schema
   */
  static getConfig(): IndexedDBConfig {
    return {
      dbName: HERAIndexedDBSchema.DB_NAME,
      version: HERAIndexedDBSchema.DB_VERSION,
      stores: {
        core_organizations: {
          keyPath: 'id',
          indexes: {
            organization_code: { keyPath: 'organization_code', unique: true },
            status: { keyPath: 'status' },
            expires_at: { keyPath: 'expires_at' },
            created_at: { keyPath: 'created_at' }
          }
        },
        core_entities: {
          keyPath: 'id',
          indexes: {
            organization_id: { keyPath: 'organization_id' },
            entity_type: { keyPath: 'entity_type' },
            smart_code: { keyPath: 'smart_code' },
            entity_code: { keyPath: 'entity_code' },
            status: { keyPath: 'status' },
            parent_entity_id: { keyPath: 'parent_entity_id' },
            expires_at: { keyPath: 'expires_at' },
            created_at: { keyPath: 'created_at' },
            // Composite indexes for complex queries
            org_type: { keyPath: ['organization_id', 'entity_type'] },
            org_status: { keyPath: ['organization_id', 'status'] }
          }
        },
        core_dynamic_data: {
          keyPath: 'id',
          indexes: {
            organization_id: { keyPath: 'organization_id' },
            entity_id: { keyPath: 'entity_id' },
            field_name: { keyPath: 'field_name' },
            smart_code: { keyPath: 'smart_code' },
            field_type: { keyPath: 'field_type' },
            created_at: { keyPath: 'created_at' },
            // Composite indexes
            entity_field: { keyPath: ['entity_id', 'field_name'], unique: true },
            org_field: { keyPath: ['organization_id', 'field_name'] }
          }
        },
        core_relationships: {
          keyPath: 'id',
          indexes: {
            organization_id: { keyPath: 'organization_id' },
            source_entity_id: { keyPath: 'source_entity_id' },
            target_entity_id: { keyPath: 'target_entity_id' },
            relationship_type: { keyPath: 'relationship_type' },
            smart_code: { keyPath: 'smart_code' },
            status: { keyPath: 'status' },
            created_at: { keyPath: 'created_at' },
            // Composite indexes
            source_target: { keyPath: ['source_entity_id', 'target_entity_id'] },
            source_type: { keyPath: ['source_entity_id', 'relationship_type'] }
          }
        },
        universal_transactions: {
          keyPath: 'id',
          indexes: {
            organization_id: { keyPath: 'organization_id' },
            transaction_type: { keyPath: 'transaction_type' },
            transaction_number: { keyPath: 'transaction_number', unique: true },
            transaction_date: { keyPath: 'transaction_date' },
            reference_entity_id: { keyPath: 'reference_entity_id' },
            smart_code: { keyPath: 'smart_code' },
            status: { keyPath: 'status' },
            expires_at: { keyPath: 'expires_at' },
            created_at: { keyPath: 'created_at' },
            // Composite indexes
            org_type: { keyPath: ['organization_id', 'transaction_type'] },
            org_date: { keyPath: ['organization_id', 'transaction_date'] },
            org_status: { keyPath: ['organization_id', 'status'] }
          }
        },
        universal_transaction_lines: {
          keyPath: 'id',
          indexes: {
            organization_id: { keyPath: 'organization_id' },
            transaction_id: { keyPath: 'transaction_id' },
            line_entity_id: { keyPath: 'line_entity_id' },
            line_number: { keyPath: 'line_number' },
            smart_code: { keyPath: 'smart_code' },
            status: { keyPath: 'status' },
            created_at: { keyPath: 'created_at' },
            // Composite indexes
            txn_line: { keyPath: ['transaction_id', 'line_number'], unique: true },
            entity_lines: { keyPath: ['line_entity_id', 'status'] }
          }
        },
        // Progressive-specific metadata store
        progressive_metadata: {
          keyPath: 'key',
          indexes: {
            type: { keyPath: 'type' },
            created_at: { keyPath: 'created_at' }
          }
        },
        // Offline sync queue
        sync_queue: {
          keyPath: 'id',
          autoIncrement: true,
          indexes: {
            operation_type: { keyPath: 'operation_type' },
            table_name: { keyPath: 'table_name' },
            status: { keyPath: 'status' },
            created_at: { keyPath: 'created_at' },
            retry_count: { keyPath: 'retry_count' }
          }
        }
      },
      expiry: {
        enabled: true,
        duration: HERAIndexedDBSchema.EXPIRY_DURATION,
        cleanup_interval: HERAIndexedDBSchema.CLEANUP_INTERVAL
      }
    }
  }

  /**
   * Initialize IndexedDB with HERA schema
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const config = HERAIndexedDBSchema.getConfig()
      const request = indexedDB.open(config.dbName, config.version)

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result as IDBDatabase
        this.createStores(db, config)
      }

      request.onsuccess = (event: any) => {
        this.db = event.target.result as IDBDatabase
        this.startExpiryCleanup()
        resolve()
      }

      request.onerror = () => {
        reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`))
      }
    })
  }

  /**
   * Create all object stores and indexes
   */
  private createStores(db: IDBDatabase, config: IndexedDBConfig): void {
    for (const [storeName, storeConfig] of Object.entries(config.stores)) {
      // Skip if store already exists
      if (db.objectStoreNames.contains(storeName)) {
        continue
      }

      // Create object store
      const store = db.createObjectStore(storeName, {
        keyPath: storeConfig.keyPath,
        autoIncrement: storeConfig.autoIncrement || false
      })

      // Create indexes
      if (storeConfig.indexes) {
        for (const [indexName, indexConfig] of Object.entries(storeConfig.indexes)) {
          store.createIndex(indexName, indexConfig.keyPath, {
            unique: indexConfig.unique || false,
            multiEntry: indexConfig.multiEntry || false
          })
        }
      }
    }
  }

  /**
   * Start automatic cleanup of expired data
   */
  private startExpiryCleanup(): void {
    const config = HERAIndexedDBSchema.getConfig()
    
    // Run cleanup immediately
    this.cleanupExpiredData()
    
    // Schedule periodic cleanup
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredData()
    }, config.expiry.cleanup_interval)
  }

  /**
   * Clean up expired data from progressive stores
   */
  private async cleanupExpiredData(): Promise<void> {
    if (!this.db) return

    const now = new Date()
    const expirableStores = [
      'core_organizations',
      'core_entities', 
      'universal_transactions'
    ]

    try {
      for (const storeName of expirableStores) {
        const transaction = this.db.transaction([storeName], 'readwrite')
        const store = transaction.objectStore(storeName)
        
        if (store.indexNames.contains('expires_at')) {
          const index = store.index('expires_at')
          const range = IDBKeyRange.upperBound(now)
          
          const request = index.openCursor(range)
          
          request.onsuccess = (event: any) => {
            const cursor = event.target.result
            if (cursor) {
              console.log(`Cleaning up expired record: ${cursor.value.id}`)
              cursor.delete()
              cursor.continue()
            }
          }
        }
      }
    } catch (error) {
      console.error('Error during cleanup:', error)
    }
  }

  /**
   * Add expiry timestamp to record
   */
  static addExpiryTimestamp<T extends Record<string, any>>(
    record: T, 
    customExpiry?: Date
  ): T & { expires_at: Date } {
    const expiryDate = customExpiry || new Date(
      Date.now() + HERAIndexedDBSchema.EXPIRY_DURATION
    )
    
    return {
      ...record,
      expires_at: expiryDate
    }
  }

  /**
   * Generate UUID for new records
   */
  static generateId(): string {
    return crypto.randomUUID()
  }

  /**
   * Get database instance
   */
  getDatabase(): IDBDatabase | null {
    return this.db
  }

  /**
   * Close database and cleanup
   */
  close(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }

  /**
   * Delete entire progressive database (for clean restart)
   */
  static async deleteDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const deleteReq = indexedDB.deleteDatabase(HERAIndexedDBSchema.DB_NAME)
      
      deleteReq.onsuccess = () => resolve()
      deleteReq.onerror = () => reject(deleteReq.error)
      deleteReq.onblocked = () => {
        console.warn('Delete blocked - close all tabs using this database')
        reject(new Error('Database deletion blocked'))
      }
    })
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    usage: number
    quota: number
    percentage: number
    recordCounts: Record<string, number>
  }> {
    if (!this.db) throw new Error('Database not initialized')

    const navigator_storage = navigator.storage
    const estimate = await navigator_storage?.estimate?.() || { usage: 0, quota: 0 }
    
    const recordCounts: Record<string, number> = {}
    const config = HERAIndexedDBSchema.getConfig()
    
    for (const storeName of Object.keys(config.stores)) {
      try {
        const transaction = this.db.transaction([storeName], 'readonly')
        const store = transaction.objectStore(storeName)
        const count = await new Promise<number>((resolve, reject) => {
          const countReq = store.count()
          countReq.onsuccess = () => resolve(countReq.result)
          countReq.onerror = () => reject(countReq.error)
        })
        recordCounts[storeName] = count
      } catch (error) {
        recordCounts[storeName] = 0
      }
    }

    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
      percentage: estimate.quota ? ((estimate.usage || 0) / estimate.quota) * 100 : 0,
      recordCounts
    }
  }
}

/**
 * Factory function to create and initialize schema
 */
export async function createHERASchema(): Promise<HERAIndexedDBSchema> {
  const schema = new HERAIndexedDBSchema()
  await schema.initialize()
  return schema
}

/**
 * Utility functions for common operations
 */
export const HERASchemaUtils = {
  /**
   * Generate smart code for entity
   */
  generateSmartCode(
    industry: string, 
    module: string, 
    type: string, 
    subtype: string = 'v1'
  ): string {
    return `HERA.${industry.toUpperCase()}.${module.toUpperCase()}.${type.toUpperCase()}.${subtype.toUpperCase()}`
  },

  /**
   * Create organization record
   */
  createOrganization(
    name: string, 
    code: string, 
    type: string = 'progressive_trial'
  ): CoreOrganization {
    return HERAIndexedDBSchema.addExpiryTimestamp({
      id: HERAIndexedDBSchema.generateId(),
      organization_name: name,
      organization_code: code,
      organization_type: type,
      status: 'active' as const,
      created_at: new Date(),
      updated_at: new Date()
    })
  },

  /**
   * Create entity record
   */
  createEntity(
    organizationId: string,
    entityType: string,
    entityName: string,
    smartCode: string
  ): CoreEntity {
    return HERAIndexedDBSchema.addExpiryTimestamp({
      id: HERAIndexedDBSchema.generateId(),
      organization_id: organizationId,
      entity_type: entityType,
      entity_name: entityName,
      smart_code: smartCode,
      status: 'active' as const,
      created_at: new Date(),
      updated_at: new Date()
    })
  },

  /**
   * Create transaction record
   */
  createTransaction(
    organizationId: string,
    transactionType: string,
    smartCode: string,
    amount?: number
  ): UniversalTransaction {
    return HERAIndexedDBSchema.addExpiryTimestamp({
      id: HERAIndexedDBSchema.generateId(),
      organization_id: organizationId,
      transaction_type: transactionType,
      transaction_number: `TXN-${Date.now()}`,
      transaction_date: new Date(),
      smart_code: smartCode,
      total_amount: amount,
      currency_code: 'USD',
      status: 'confirmed' as const,
      created_at: new Date(),
      updated_at: new Date()
    })
  }
}