/**
 * HERA Progressive DNA Adapter
 * Extends existing DNA system for progressive PWA generation
 * Smart Code: HERA.PROGRESSIVE.DNA.ADAPTER.v1
 */

import { SupabaseClient } from '@supabase/supabase-js'

export interface DNAPattern {
  smart_code: string
  component_dna: any
  business_logic: any
  ui_pattern: any
  storage_config: StorageConfig
}

export interface StorageConfig {
  mode: 'progressive' | 'production'
  backend: 'indexeddb' | 'supabase'
  expiry?: string
  auth_required: boolean
}

export interface ProgressiveConfig {
  storage: 'indexeddb'
  auth: false
  expiry: '30_days'
  offline_capable: true
  installable: true
}

export class HeraProgressiveAdapter {
  private storageMode: 'progressive' | 'production' = 'progressive'
  private dnaPatterns: Map<string, DNAPattern> = new Map()
  
  constructor(
    private supabase?: SupabaseClient,
    private config: ProgressiveConfig = {
      storage: 'indexeddb',
      auth: false,
      expiry: '30_days',
      offline_capable: true,
      installable: true
    }
  ) {}

  /**
   * Load existing DNA patterns from HERA DNA System
   */
  async loadDNAContext(): Promise<any> {
    if (this.supabase) {
      // Load from Supabase DNA system
      const { data, error } = await this.supabase.rpc('claude_load_dna_context')
      if (error) throw error
      return data
    } else {
      // Load from local DNA cache for progressive mode
      return this.loadLocalDNAPatterns()
    }
  }

  /**
   * Apply DNA pattern with progressive or production configuration
   */
  async applyDNAPattern(
    smartCode: string, 
    mode: 'progressive' | 'production' = 'progressive'
  ): Promise<DNAPattern> {
    // Load the DNA pattern
    const pattern = await this.loadDNAPattern(smartCode)
    
    if (mode === 'progressive') {
      // Configure for IndexedDB and PWA
      pattern.storage_config = {
        mode: 'progressive',
        backend: 'indexeddb',
        expiry: '30_days',
        auth_required: false
      }
      
      // Add PWA capabilities
      this.addPWAFeatures(pattern)
      
      // Configure offline sync
      this.configureOfflineSync(pattern)
      
    } else {
      // Configure for production Supabase
      pattern.storage_config = {
        mode: 'production',
        backend: 'supabase',
        auth_required: true
      }
    }
    
    return pattern
  }

  /**
   * Generate complete progressive app from business requirements
   */
  async generateProgressiveApp(businessRequirements: any): Promise<any> {
    // 1. Load DNA patterns
    const dnaContext = await this.loadDNAContext()
    
    // 2. Select appropriate components based on requirements
    const selectedComponents = this.selectDNAComponents(
      dnaContext,
      businessRequirements
    )
    
    // 3. Check MVP completeness
    const mvpAnalysis = await this.checkMVPCompleteness(
      businessRequirements.description
    )
    
    // 4. Apply progressive configuration
    const progressiveComponents = await Promise.all(
      selectedComponents.map(comp => 
        this.applyDNAPattern(comp.smart_code, 'progressive')
      )
    )
    
    // 5. Generate PWA structure
    const pwa = {
      manifest: this.generatePWAManifest(businessRequirements),
      service_worker: this.generateServiceWorker(),
      components: progressiveComponents,
      storage: new IndexedDBAdapter(),
      routes: this.generateRoutes(businessRequirements),
      demo_data: this.generateDemoData(businessRequirements)
    }
    
    return pwa
  }

  /**
   * Configure IndexedDB with HERA Universal Schema
   */
  private configureIndexedDB(pattern: DNAPattern): any {
    return {
      dbName: 'hera_progressive',
      version: 1,
      stores: {
        core_organizations: { keyPath: 'id', indexes: ['organization_code'] },
        core_entities: { keyPath: 'id', indexes: ['entity_type', 'smart_code', 'created_at'] },
        core_dynamic_data: { keyPath: 'id', indexes: ['entity_id', 'field_name'] },
        core_relationships: { keyPath: 'id', indexes: ['source_entity_id', 'target_entity_id'] },
        universal_transactions: { keyPath: 'id', indexes: ['transaction_type', 'created_at'] },
        universal_transaction_lines: { keyPath: 'id', indexes: ['transaction_id', 'line_entity_id'] }
      },
      expiry: {
        enabled: true,
        duration: 30 * 24 * 60 * 60 * 1000, // 30 days
        cleanup_interval: 24 * 60 * 60 * 1000 // Daily cleanup
      }
    }
  }

  /**
   * Add PWA features to DNA pattern
   */
  private addPWAFeatures(pattern: DNAPattern): void {
    pattern.ui_pattern.pwa_features = {
      installable: true,
      offline_capable: true,
      background_sync: true,
      push_notifications: true,
      app_shortcuts: this.generateAppShortcuts(pattern)
    }
  }

  /**
   * Configure offline synchronization
   */
  private configureOfflineSync(pattern: DNAPattern): void {
    pattern.business_logic.offline_sync = {
      strategy: 'cache_first',
      sync_interval: 5 * 60 * 1000, // 5 minutes
      conflict_resolution: 'last_write_wins',
      queue_operations: true
    }
  }

  /**
   * Generate PWA manifest
   */
  private generatePWAManifest(requirements: any): any {
    return {
      name: `${requirements.business_name} Progressive`,
      short_name: requirements.business_name,
      description: requirements.description,
      start_url: `/${requirements.business_type}-progressive`,
      display: 'standalone',
      theme_color: '#3B82F6',
      background_color: '#F3F4F6',
      icons: [
        {
          src: '/icons/icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/icons/icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ],
      shortcuts: this.generatePWAShortcuts(requirements)
    }
  }

  /**
   * Generate service worker for offline capability
   */
  private generateServiceWorker(): string {
    return `
// HERA Progressive Service Worker
// Smart Code: HERA.PROGRESSIVE.SW.v1

const CACHE_NAME = 'hera-progressive-v1';
const urlsToCache = [
  '/',
  '/styles/main.css',
  '/scripts/app.js',
  '/offline.html'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch event with cache-first strategy
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .catch(() => caches.match('/offline.html'))
  );
});

// Background sync for offline data
self.addEventListener('sync', event => {
  if (event.tag === 'sync-progressive-data') {
    event.waitUntil(syncProgressiveData());
  }
});
    `
  }

  /**
   * Select DNA components based on business requirements
   */
  private selectDNAComponents(dnaContext: any, requirements: any): any[] {
    const components = []
    
    // Always include core components
    components.push(
      dnaContext.find((c: any) => c.smart_code === 'HERA.UI.SHELL.BAR.ENHANCED.v2'),
      dnaContext.find((c: any) => c.smart_code === 'HERA.UI.TABLE.ENTERPRISE.v2'),
      dnaContext.find((c: any) => c.smart_code === 'HERA.UI.FORM.DYNAMIC.v2')
    )
    
    // Add industry-specific components
    switch (requirements.business_type) {
      case 'restaurant':
        components.push(
          dnaContext.find((c: any) => c.smart_code === 'HERA.RESTAURANT.MENU.v1'),
          dnaContext.find((c: any) => c.smart_code === 'HERA.RESTAURANT.POS.v1')
        )
        break
      case 'healthcare':
        components.push(
          dnaContext.find((c: any) => c.smart_code === 'HERA.HEALTHCARE.PATIENT.v1'),
          dnaContext.find((c: any) => c.smart_code === 'HERA.HEALTHCARE.APPOINTMENT.v1')
        )
        break
      // Add more industries...
    }
    
    return components.filter(Boolean)
  }

  /**
   * Check MVP completeness using existing system
   */
  private async checkMVPCompleteness(description: string): Promise<any> {
    if (this.supabase) {
      const { data } = await this.supabase.rpc('claude_check_mvp_completeness', {
        app_description: description
      })
      return data
    }
    
    // Local MVP check for progressive mode
    return this.localMVPCheck(description)
  }

  /**
   * Generate demo data based on business type
   */
  private generateDemoData(requirements: any): any {
    const demoData: any = {
      organization: {
        name: `${requirements.business_name} (Demo)`,
        code: `${requirements.business_type}-demo`,
        type: requirements.business_type
      },
      entities: [],
      transactions: []
    }
    
    // Generate industry-specific demo data
    switch (requirements.business_type) {
      case 'restaurant':
        demoData.entities = this.generateRestaurantDemoData()
        demoData.transactions = this.generateRestaurantTransactions()
        break
      case 'healthcare':
        demoData.entities = this.generateHealthcareDemoData()
        demoData.transactions = this.generateHealthcareTransactions()
        break
      // Add more industries...
    }
    
    return demoData
  }

  /**
   * Generate restaurant demo data
   */
  private generateRestaurantDemoData(): any[] {
    return [
      {
        entity_type: 'menu_item',
        entity_name: 'Margherita Pizza',
        smart_code: 'HERA.RESTAURANT.MENU.PIZZA.v1',
        metadata: { price: 12.99, category: 'Pizza', preparation_time: 15 }
      },
      {
        entity_type: 'customer',
        entity_name: 'John Doe',
        smart_code: 'HERA.RESTAURANT.CUSTOMER.v1',
        metadata: { phone: '555-0123', email: 'john@example.com' }
      }
      // Add more demo entities...
    ]
  }

  /**
   * Generate restaurant transactions
   */
  private generateRestaurantTransactions(): any[] {
    return [
      {
        transaction_type: 'order',
        transaction_number: 'ORD-001',
        smart_code: 'HERA.RESTAURANT.ORDER.v1',
        total_amount: 25.98,
        status: 'completed'
      }
      // Add more demo transactions...
    ]
  }

  /**
   * Local MVP check for offline mode
   */
  private localMVPCheck(description: string): any {
    const requiredComponents = [
      'shell bar', 'navigation', 'table', 'form', 'search',
      'filter', 'dashboard', 'report', 'export'
    ]
    
    const foundComponents = requiredComponents.filter(comp =>
      description.toLowerCase().includes(comp)
    )
    
    const completeness = (foundComponents.length / requiredComponents.length) * 100
    
    return {
      completeness_percentage: Math.round(completeness),
      missing_components: requiredComponents.filter(comp =>
        !foundComponents.includes(comp)
      ),
      mvp_status: completeness >= 80 ? 'MVP_READY' : 'NEEDS_ENHANCEMENTS'
    }
  }

  /**
   * Generate PWA shortcuts
   */
  private generatePWAShortcuts(requirements: any): any[] {
    const shortcuts = []
    
    switch (requirements.business_type) {
      case 'restaurant':
        shortcuts.push(
          { name: 'New Order', url: '/order/new', icon: '/icons/order.png' },
          { name: 'Menu', url: '/menu', icon: '/icons/menu.png' }
        )
        break
      case 'healthcare':
        shortcuts.push(
          { name: 'New Patient', url: '/patient/new', icon: '/icons/patient.png' },
          { name: 'Appointments', url: '/appointments', icon: '/icons/calendar.png' }
        )
        break
    }
    
    return shortcuts
  }

  /**
   * Generate app shortcuts for pattern
   */
  private generateAppShortcuts(pattern: DNAPattern): any[] {
    // Based on pattern type, generate appropriate shortcuts
    return []
  }

  /**
   * Generate routes based on requirements
   */
  private generateRoutes(requirements: any): any {
    const baseRoute = `/${requirements.business_type}-progressive`
    
    return {
      home: baseRoute,
      dashboard: `${baseRoute}/dashboard`,
      entities: `${baseRoute}/manage`,
      transactions: `${baseRoute}/transactions`,
      reports: `${baseRoute}/reports`,
      settings: `${baseRoute}/settings`
    }
  }

  /**
   * Load local DNA patterns for offline development
   */
  private async loadLocalDNAPatterns(): Promise<any> {
    // This would load from a local cache or bundled patterns
    return []
  }

  /**
   * Load specific DNA pattern
   */
  private async loadDNAPattern(smartCode: string): Promise<DNAPattern> {
    const cached = this.dnaPatterns.get(smartCode)
    if (cached) return cached
    
    // Load from DNA system
    if (this.supabase) {
      const { data } = await this.supabase.rpc('claude_get_component_dna', {
        component_smart_code: smartCode
      })
      
      const pattern: DNAPattern = {
        smart_code: smartCode,
        component_dna: data.component_dna,
        business_logic: data.business_logic,
        ui_pattern: data.ui_pattern,
        storage_config: {
          mode: 'progressive',
          backend: 'indexeddb',
          auth_required: false
        }
      }
      
      this.dnaPatterns.set(smartCode, pattern)
      return pattern
    }
    
    throw new Error(`DNA pattern ${smartCode} not found`)
  }
}

/**
 * IndexedDB Adapter for HERA Universal Schema
 */
export class IndexedDBAdapter {
  private schema: any = null

  async initialize(): Promise<void> {
    const { createHERASchema } = await import('./indexeddb-schema')
    this.schema = await createHERASchema()
  }

  /**
   * Create entity with automatic expiry
   */
  async createEntity(entity: any): Promise<any> {
    if (!this.schema) throw new Error('Database not initialized')
    
    const { HERASchemaUtils } = await import('./indexeddb-schema')
    
    // Add required fields if missing
    if (!entity.id) entity.id = crypto.randomUUID()
    if (!entity.created_at) entity.created_at = new Date()
    if (!entity.updated_at) entity.updated_at = new Date()
    if (!entity.expires_at) {
      entity.expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
    
    const db = this.schema.getDatabase()
    if (!db) throw new Error('Database not available')
    
    const transaction = db.transaction(['core_entities'], 'readwrite')
    const store = transaction.objectStore('core_entities')
    
    return new Promise((resolve, reject) => {
      const request = store.add(entity)
      request.onsuccess = () => resolve(entity)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get all entities of a type with organization filtering
   */
  async getEntities(entityType: string, organizationId?: string): Promise<any[]> {
    if (!this.schema) throw new Error('Database not initialized')
    
    const db = this.schema.getDatabase()
    if (!db) throw new Error('Database not available')
    
    const transaction = db.transaction(['core_entities'], 'readonly')
    const store = transaction.objectStore('core_entities')
    
    return new Promise((resolve, reject) => {
      const results: any[] = []
      
      if (organizationId) {
        // Use composite index for better performance
        const index = store.index('org_type')
        const range = IDBKeyRange.bound([organizationId, entityType], [organizationId, entityType])
        
        const request = index.openCursor(range)
        request.onsuccess = (event: any) => {
          const cursor = event.target.result
          if (cursor) {
            results.push(cursor.value)
            cursor.continue()
          } else {
            resolve(results)
          }
        }
        request.onerror = () => reject(request.error)
      } else {
        // Get all entities of type across all organizations
        const index = store.index('entity_type')
        const request = index.getAll(entityType)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      }
    })
  }

  /**
   * Create transaction with lines
   */
  async createTransaction(txn: any, lines: any[] = []): Promise<any> {
    if (!this.schema) throw new Error('Database not initialized')
    
    const db = this.schema.getDatabase()
    if (!db) throw new Error('Database not available')
    
    // Add required fields
    if (!txn.id) txn.id = crypto.randomUUID()
    if (!txn.created_at) txn.created_at = new Date()
    if (!txn.updated_at) txn.updated_at = new Date()
    if (!txn.expires_at) {
      txn.expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
    if (!txn.transaction_number) {
      txn.transaction_number = `TXN-${Date.now()}`
    }
    
    lines.forEach((line, index) => {
      if (!line.id) line.id = crypto.randomUUID()
      line.transaction_id = txn.id
      line.line_number = index + 1
      if (!line.created_at) line.created_at = new Date()
      if (!line.updated_at) line.updated_at = new Date()
      line.organization_id = txn.organization_id
    })
    
    const transaction = db.transaction(
      ['universal_transactions', 'universal_transaction_lines'],
      'readwrite'
    )
    
    try {
      // Add transaction
      await new Promise((resolve, reject) => {
        const request = transaction.objectStore('universal_transactions').add(txn)
        request.onsuccess = resolve
        request.onerror = () => reject(request.error)
      })
      
      // Add lines
      for (const line of lines) {
        await new Promise((resolve, reject) => {
          const request = transaction.objectStore('universal_transaction_lines').add(line)
          request.onsuccess = resolve
          request.onerror = () => reject(request.error)
        })
      }
      
      return { transaction: txn, lines }
    } catch (error) {
      throw new Error(`Transaction creation failed: ${error}`)
    }
  }

  /**
   * Get transactions by type and organization
   */
  async getTransactions(
    organizationId: string, 
    transactionType?: string,
    limit?: number
  ): Promise<any[]> {
    if (!this.schema) throw new Error('Database not initialized')
    
    const db = this.schema.getDatabase()
    if (!db) throw new Error('Database not available')
    
    const transaction = db.transaction(['universal_transactions'], 'readonly')
    const store = transaction.objectStore('universal_transactions')
    
    return new Promise((resolve, reject) => {
      const results: any[] = []
      
      if (transactionType) {
        const index = store.index('org_type')
        const range = IDBKeyRange.bound([organizationId, transactionType], [organizationId, transactionType])
        
        const request = index.openCursor(range)
        request.onsuccess = (event: any) => {
          const cursor = event.target.result
          if (cursor && (!limit || results.length < limit)) {
            results.push(cursor.value)
            cursor.continue()
          } else {
            resolve(results)
          }
        }
        request.onerror = () => reject(request.error)
      } else {
        const index = store.index('organization_id')
        const request = index.getAll(organizationId)
        request.onsuccess = () => {
          const all = request.result
          resolve(limit ? all.slice(0, limit) : all)
        }
        request.onerror = () => reject(request.error)
      }
    })
  }

  /**
   * Add dynamic data field
   */
  async setDynamicField(
    entityId: string,
    fieldName: string,
    value: any,
    fieldType: 'text' | 'number' | 'boolean' | 'date' | 'json' = 'text',
    smartCode: string
  ): Promise<any> {
    if (!this.schema) throw new Error('Database not initialized')
    
    const db = this.schema.getDatabase()
    if (!db) throw new Error('Database not available')
    
    // Get entity to determine organization
    const entity = await this.getEntityById(entityId)
    if (!entity) throw new Error(`Entity ${entityId} not found`)
    
    const dynamicData = {
      id: crypto.randomUUID(),
      organization_id: entity.organization_id,
      entity_id: entityId,
      field_name: fieldName,
      field_type: fieldType,
      smart_code: smartCode,
      version: 1,
      created_at: new Date(),
      updated_at: new Date()
    }
    
    // Set value based on type
    switch (fieldType) {
      case 'text':
        dynamicData.field_value_text = String(value)
        break
      case 'number':
        dynamicData.field_value_number = Number(value)
        break
      case 'boolean':
        dynamicData.field_value_boolean = Boolean(value)
        break
      case 'date':
        dynamicData.field_value_date = value instanceof Date ? value : new Date(value)
        break
      case 'json':
        dynamicData.field_value_json = typeof value === 'object' ? value : JSON.parse(value)
        break
    }
    
    const transaction = db.transaction(['core_dynamic_data'], 'readwrite')
    const store = transaction.objectStore('core_dynamic_data')
    
    return new Promise((resolve, reject) => {
      const request = store.add(dynamicData)
      request.onsuccess = () => resolve(dynamicData)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get entity by ID
   */
  async getEntityById(entityId: string): Promise<any> {
    if (!this.schema) throw new Error('Database not initialized')
    
    const db = this.schema.getDatabase()
    if (!db) throw new Error('Database not available')
    
    const transaction = db.transaction(['core_entities'], 'readonly')
    const store = transaction.objectStore('core_entities')
    
    return new Promise((resolve, reject) => {
      const request = store.get(entityId)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<any> {
    if (!this.schema) throw new Error('Database not initialized')
    return this.schema.getStorageStats()
  }

  /**
   * Export all data for migration
   */
  async exportAllData(): Promise<{
    organizations: any[]
    entities: any[]
    dynamicData: any[]
    relationships: any[]
    transactions: any[]
    transactionLines: any[]
  }> {
    if (!this.schema) throw new Error('Database not initialized')
    
    const db = this.schema.getDatabase()
    if (!db) throw new Error('Database not available')
    
    const transaction = db.transaction([
      'core_organizations',
      'core_entities',
      'core_dynamic_data', 
      'core_relationships',
      'universal_transactions',
      'universal_transaction_lines'
    ], 'readonly')
    
    const results = await Promise.all([
      this.getAllFromStore(transaction, 'core_organizations'),
      this.getAllFromStore(transaction, 'core_entities'),
      this.getAllFromStore(transaction, 'core_dynamic_data'),
      this.getAllFromStore(transaction, 'core_relationships'),
      this.getAllFromStore(transaction, 'universal_transactions'),
      this.getAllFromStore(transaction, 'universal_transaction_lines')
    ])
    
    return {
      organizations: results[0],
      entities: results[1],
      dynamicData: results[2],
      relationships: results[3],
      transactions: results[4],
      transactionLines: results[5]
    }
  }

  /**
   * Helper to get all records from a store
   */
  private getAllFromStore(transaction: IDBTransaction, storeName: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const store = transaction.objectStore(storeName)
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.schema) {
      this.schema.close()
      this.schema = null
    }
  }
}

// Export factory function
export function createProgressiveAdapter(config?: Partial<ProgressiveConfig>): HeraProgressiveAdapter {
  return new HeraProgressiveAdapter(undefined, {
    storage: 'indexeddb',
    auth: false,
    expiry: '30_days',
    offline_capable: true,
    installable: true,
    ...config
  })
}