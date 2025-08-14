/**
 * HERA Progressive Trial System
 * Manages 30-day trial countdown, conversion flows, and progressive-to-production migration
 * Smart Code: HERA.PROGRESSIVE.TRIAL.SYSTEM.v1
 */

export interface TrialStatus {
  isActive: boolean
  daysRemaining: number
  hoursRemaining: number
  expiryDate: Date
  startDate: Date
  status: 'active' | 'expired' | 'converted' | 'extended'
  organizationId: string
  dataSize: number // MB
  entityCount: number
  transactionCount: number
  conversionEligible: boolean
  conversionOffers: ConversionOffer[]
}

export interface ConversionOffer {
  id: string
  title: string
  description: string
  pricing: {
    monthly: number
    annual: number
    savings: number
  }
  features: string[]
  ctaText: string
  urgency?: string
  discount?: {
    percentage: number
    validUntil: Date
    code: string
  }
}

export interface ConversionMetrics {
  trialStarted: Date
  lastActivity: Date
  featureUsage: Record<string, number>
  engagementScore: number
  conversionProbability: number
  recommendedPlan: string
  blockers?: string[]
}

export interface ProgressiveToProductionMigration {
  status: 'preparing' | 'validating' | 'migrating' | 'completed' | 'failed'
  organizationData: any
  validationResults: ValidationResult[]
  migrationLog: MigrationLogEntry[]
  productionConfig?: {
    supabaseProjectId: string
    supabaseUrl: string
    apiKeys: Record<string, string>
  }
  preservedData: {
    entities: number
    transactions: number
    relationships: number
    dynamicFields: number
  }
}

export interface ValidationResult {
  category: 'data_integrity' | 'business_rules' | 'relationships' | 'required_fields'
  status: 'passed' | 'warning' | 'failed'
  message: string
  details?: any
  fixable: boolean
}

export interface MigrationLogEntry {
  timestamp: Date
  stage: string
  status: 'info' | 'success' | 'warning' | 'error'
  message: string
  data?: any
}

export class HERATrialSystem {
  private static readonly TRIAL_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days
  private static readonly WARNING_THRESHOLD = 3 * 24 * 60 * 60 * 1000 // 3 days
  private static readonly CRITICAL_THRESHOLD = 1 * 24 * 60 * 60 * 1000 // 1 day

  private indexedDBAdapter: any
  
  constructor(adapter: any) {
    this.indexedDBAdapter = adapter
  }

  /**
   * Initialize trial for organization
   */
  async initializeTrial(organizationId: string, businessType: string): Promise<TrialStatus> {
    const startDate = new Date()
    const expiryDate = new Date(startDate.getTime() + HERATrialSystem.TRIAL_DURATION)
    
    // Store trial metadata
    await this.storeTrialMetadata(organizationId, {
      start_date: startDate,
      expiry_date: expiryDate,
      business_type: businessType,
      status: 'active',
      feature_usage: {},
      last_activity: startDate
    })
    
    return this.getTrialStatus(organizationId)
  }

  /**
   * Get current trial status
   */
  async getTrialStatus(organizationId: string): Promise<TrialStatus> {
    const metadata = await this.getTrialMetadata(organizationId)
    if (!metadata) {
      throw new Error('Trial not found for organization')
    }

    const now = new Date()
    const expiryDate = new Date(metadata.expiry_date)
    const timeRemaining = expiryDate.getTime() - now.getTime()
    
    const daysRemaining = Math.max(0, Math.ceil(timeRemaining / (24 * 60 * 60 * 1000)))
    const hoursRemaining = Math.max(0, Math.ceil(timeRemaining / (60 * 60 * 1000)))
    
    // Calculate data usage
    const stats = await this.indexedDBAdapter.getStorageStats()
    const dataSize = Math.round((stats.usage || 0) / (1024 * 1024)) // Convert to MB
    
    // Get entity and transaction counts
    const entities = await this.indexedDBAdapter.getEntities('all', organizationId)
    const transactions = await this.indexedDBAdapter.getTransactions(organizationId)
    
    const isActive = timeRemaining > 0 && metadata.status === 'active'
    const conversionEligible = this.isConversionEligible(metadata, entities.length, transactions.length)
    
    return {
      isActive,
      daysRemaining,
      hoursRemaining,
      expiryDate,
      startDate: new Date(metadata.start_date),
      status: metadata.status,
      organizationId,
      dataSize,
      entityCount: entities.length,
      transactionCount: transactions.length,
      conversionEligible,
      conversionOffers: await this.generateConversionOffers(metadata, daysRemaining)
    }
  }

  /**
   * Track feature usage for conversion optimization
   */
  async trackFeatureUsage(organizationId: string, feature: string): Promise<void> {
    const metadata = await this.getTrialMetadata(organizationId)
    if (!metadata) return

    const featureUsage = metadata.feature_usage || {}
    featureUsage[feature] = (featureUsage[feature] || 0) + 1
    
    await this.updateTrialMetadata(organizationId, {
      feature_usage: featureUsage,
      last_activity: new Date()
    })
  }

  /**
   * Calculate engagement score and conversion probability
   */
  async getConversionMetrics(organizationId: string): Promise<ConversionMetrics> {
    const metadata = await this.getTrialMetadata(organizationId)
    if (!metadata) throw new Error('Trial not found')

    const featureUsage = metadata.feature_usage || {}
    const totalUsage = Object.values(featureUsage).reduce((sum: any, count: any) => sum + count, 0)
    
    // Calculate engagement score (0-100)
    const daysActive = Math.ceil(
      (new Date().getTime() - new Date(metadata.start_date).getTime()) / (24 * 60 * 60 * 1000)
    )
    const avgDailyUsage = totalUsage / Math.max(daysActive, 1)
    const engagementScore = Math.min(100, avgDailyUsage * 10)
    
    // Calculate conversion probability based on usage patterns
    const conversionProbability = this.calculateConversionProbability(
      engagementScore,
      featureUsage,
      daysActive
    )
    
    // Recommend plan based on usage
    const recommendedPlan = this.recommendPlan(featureUsage, engagementScore)
    
    return {
      trialStarted: new Date(metadata.start_date),
      lastActivity: new Date(metadata.last_activity),
      featureUsage,
      engagementScore,
      conversionProbability,
      recommendedPlan,
      blockers: this.identifyConversionBlockers(featureUsage, engagementScore)
    }
  }

  /**
   * Generate personalized conversion offers
   */
  private async generateConversionOffers(metadata: any, daysRemaining: number): Promise<ConversionOffer[]> {
    const offers: ConversionOffer[] = []
    
    // Standard offer
    offers.push({
      id: 'standard',
      title: 'HERA Professional',
      description: 'Complete ERP system with full Supabase integration',
      pricing: {
        monthly: 149,
        annual: 1499,
        savings: 289
      },
      features: [
        'Unlimited entities and transactions',
        'Full Supabase cloud storage',
        'Advanced reporting and analytics',
        'Multi-user collaboration',
        'API access and integrations',
        'Priority support'
      ],
      ctaText: 'Upgrade to Professional'
    })
    
    // Urgency offer for last 3 days
    if (daysRemaining <= 3) {
      offers.unshift({
        id: 'urgent',
        title: 'Last Chance - 50% Off',
        description: 'Limited time offer - expires with your trial!',
        pricing: {
          monthly: 75,
          annual: 750,
          savings: 1139
        },
        features: [
          'Everything in Professional',
          '50% off first year',
          'Free migration assistance',
          'Extended onboarding support'
        ],
        ctaText: 'Claim 50% Discount',
        urgency: `Only ${daysRemaining} days left!`,
        discount: {
          percentage: 50,
          validUntil: new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000),
          code: 'TRIAL50'
        }
      })
    }
    
    // Enterprise offer for high usage
    const featureUsage = metadata.feature_usage || {}
    const totalUsage = Object.values(featureUsage).reduce((sum: any, count: any) => sum + count, 0)
    
    if (totalUsage > 100) {
      offers.push({
        id: 'enterprise',
        title: 'HERA Enterprise',
        description: 'Advanced features for growing businesses',
        pricing: {
          monthly: 299,
          annual: 2999,
          savings: 589
        },
        features: [
          'Everything in Professional',
          'Advanced AI insights',
          'Custom integrations',
          'Dedicated account manager',
          'SLA guarantees',
          'White-label options'
        ],
        ctaText: 'Upgrade to Enterprise'
      })
    }
    
    return offers
  }

  /**
   * Validate progressive data for production migration
   */
  async validateForMigration(organizationId: string): Promise<ValidationResult[]> {
    const results: ValidationResult[] = []
    
    try {
      // 1. Data integrity validation
      const entities = await this.indexedDBAdapter.getEntities('all', organizationId)
      const transactions = await this.indexedDBAdapter.getTransactions(organizationId)
      
      // Check for required organization data
      const org = entities.find((e: any) => e.entity_type === 'organization')
      if (!org) {
        results.push({
          category: 'required_fields',
          status: 'failed',
          message: 'Organization entity is required for migration',
          fixable: true
        })
      }
      
      // Check for orphaned transactions
      const orphanedTransactions = transactions.filter((t: any) => 
        !entities.some((e: any) => e.id === t.reference_entity_id)
      )
      
      if (orphanedTransactions.length > 0) {
        results.push({
          category: 'relationships',
          status: 'warning',
          message: `${orphanedTransactions.length} transactions have missing entity references`,
          details: orphanedTransactions.map(t => t.id),
          fixable: true
        })
      }
      
      // Validate smart codes
      const invalidSmartCodes = entities.filter((e: any) => 
        !e.smart_code || !e.smart_code.startsWith('HERA.')
      )
      
      if (invalidSmartCodes.length > 0) {
        results.push({
          category: 'business_rules',
          status: 'warning',
          message: `${invalidSmartCodes.length} entities have invalid smart codes`,
          fixable: true
        })
      }
      
      // Check data size limits
      const stats = await this.indexedDBAdapter.getStorageStats()
      const sizeMB = (stats.usage || 0) / (1024 * 1024)
      
      if (sizeMB > 100) {
        results.push({
          category: 'data_integrity',
          status: 'warning',
          message: `Data size (${sizeMB.toFixed(1)}MB) is large - migration may take longer`,
          fixable: false
        })
      }
      
      // All checks passed
      if (results.every(r => r.status !== 'failed')) {
        results.push({
          category: 'data_integrity',
          status: 'passed',
          message: 'All validation checks passed - ready for migration',
          fixable: false
        })
      }
      
    } catch (error) {
      results.push({
        category: 'data_integrity',
        status: 'failed',
        message: `Validation failed: ${error}`,
        fixable: false
      })
    }
    
    return results
  }

  /**
   * Prepare migration data package
   */
  async prepareMigrationData(organizationId: string): Promise<ProgressiveToProductionMigration> {
    const migrationLog: MigrationLogEntry[] = []
    
    const addLog = (stage: string, status: 'info' | 'success' | 'warning' | 'error', message: string, data?: any) => {
      migrationLog.push({
        timestamp: new Date(),
        stage,
        status,
        message,
        data
      })
    }
    
    try {
      addLog('preparation', 'info', 'Starting migration data preparation')
      
      // Validate data first
      const validationResults = await this.validateForMigration(organizationId)
      const hasCriticalErrors = validationResults.some(r => r.status === 'failed')
      
      if (hasCriticalErrors) {
        addLog('validation', 'error', 'Critical validation errors found')
        return {
          status: 'failed',
          organizationData: null,
          validationResults,
          migrationLog,
          preservedData: { entities: 0, transactions: 0, relationships: 0, dynamicFields: 0 }
        }
      }
      
      addLog('validation', 'success', 'Data validation passed')
      
      // Export all data
      addLog('export', 'info', 'Exporting progressive data')
      const exportedData = await this.indexedDBAdapter.exportAllData()
      
      addLog('export', 'success', `Exported ${exportedData.entities.length} entities and ${exportedData.transactions.length} transactions`)
      
      // Transform data for production format
      const transformedData = this.transformProgressiveToProduction(exportedData, organizationId)
      
      addLog('transform', 'success', 'Data transformation completed')
      
      return {
        status: 'preparing',
        organizationData: transformedData,
        validationResults,
        migrationLog,
        preservedData: {
          entities: exportedData.entities.length,
          transactions: exportedData.transactions.length,
          relationships: exportedData.relationships.length,
          dynamicFields: exportedData.dynamicData.length
        }
      }
      
    } catch (error) {
      addLog('preparation', 'error', `Migration preparation failed: ${error}`)
      
      return {
        status: 'failed',
        organizationData: null,
        validationResults: [],
        migrationLog,
        preservedData: { entities: 0, transactions: 0, relationships: 0, dynamicFields: 0 }
      }
    }
  }

  /**
   * Transform progressive data to production format
   */
  private transformProgressiveToProduction(data: any, organizationId: string): any {
    // Remove progressive-specific fields and adjust for production
    return {
      organizations: data.organizations.map((org: any) => ({
        ...org,
        organization_type: 'production', // Change from 'progressive_trial'
        // Remove expires_at field
        expires_at: undefined
      })),
      entities: data.entities.map((entity: any) => ({
        ...entity,
        // Remove expires_at field
        expires_at: undefined,
        // Update smart codes if needed
        smart_code: entity.smart_code.replace('.TRIAL.', '.PROD.')
      })),
      dynamic_data: data.dynamicData,
      relationships: data.relationships,
      transactions: data.transactions.map((txn: any) => ({
        ...txn,
        // Remove expires_at field
        expires_at: undefined
      })),
      transaction_lines: data.transactionLines
    }
  }

  /**
   * Helper methods
   */
  private isConversionEligible(metadata: any, entityCount: number, transactionCount: number): boolean {
    const featureUsage = metadata.feature_usage || {}
    const totalUsage = Object.values(featureUsage).reduce((sum: any, count: any) => sum + count, 0)
    
    // Eligible if they have meaningful usage
    return totalUsage >= 10 || entityCount >= 5 || transactionCount >= 3
  }

  private calculateConversionProbability(
    engagementScore: number,
    featureUsage: Record<string, number>,
    daysActive: number
  ): number {
    let probability = 0
    
    // Base probability from engagement
    probability += engagementScore * 0.4
    
    // Feature diversity bonus
    const featuresUsed = Object.keys(featureUsage).length
    probability += Math.min(featuresUsed * 5, 25)
    
    // Consistency bonus
    if (daysActive >= 3 && engagementScore > 30) {
      probability += 20
    }
    
    return Math.min(100, Math.round(probability))
  }

  private recommendPlan(featureUsage: Record<string, number>, engagementScore: number): string {
    const totalUsage = Object.values(featureUsage).reduce((sum: any, count: any) => sum + count, 0)
    
    if (totalUsage > 100 || engagementScore > 70) {
      return 'enterprise'
    } else if (totalUsage > 20 || engagementScore > 40) {
      return 'professional'
    } else {
      return 'starter'
    }
  }

  private identifyConversionBlockers(featureUsage: Record<string, number>, engagementScore: number): string[] {
    const blockers: string[] = []
    
    if (engagementScore < 20) {
      blockers.push('Low feature adoption - need onboarding assistance')
    }
    
    if (Object.keys(featureUsage).length < 3) {
      blockers.push('Limited feature exploration - show feature tour')
    }
    
    return blockers
  }

  /**
   * Storage methods for trial metadata
   */
  private async storeTrialMetadata(organizationId: string, metadata: any): Promise<void> {
    // Store in progressive_metadata table
    const db = this.indexedDBAdapter.schema?.getDatabase()
    if (!db) throw new Error('Database not available')

    const transaction = db.transaction(['progressive_metadata'], 'readwrite')
    const store = transaction.objectStore('progressive_metadata')
    
    const record = {
      key: `trial_${organizationId}`,
      type: 'trial_metadata',
      data: metadata,
      created_at: new Date(),
      updated_at: new Date()
    }
    
    return new Promise((resolve, reject) => {
      const request = store.put(record)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  private async getTrialMetadata(organizationId: string): Promise<any> {
    const db = this.indexedDBAdapter.schema?.getDatabase()
    if (!db) return null

    const transaction = db.transaction(['progressive_metadata'], 'readonly')
    const store = transaction.objectStore('progressive_metadata')
    
    return new Promise((resolve, reject) => {
      const request = store.get(`trial_${organizationId}`)
      request.onsuccess = () => {
        const result = request.result
        resolve(result ? result.data : null)
      }
      request.onerror = () => reject(request.error)
    })
  }

  private async updateTrialMetadata(organizationId: string, updates: any): Promise<void> {
    const existing = await this.getTrialMetadata(organizationId)
    if (!existing) throw new Error('Trial metadata not found')

    const metadata = { ...existing, ...updates, updated_at: new Date() }
    await this.storeTrialMetadata(organizationId, metadata)
  }
}

/**
 * Factory function
 */
export function createTrialSystem(indexedDBAdapter: any): HERATrialSystem {
  return new HERATrialSystem(indexedDBAdapter)
}

/**
 * Trial status hook for React components
 */
export function useTrialStatus(organizationId: string) {
  // This would be implemented as a React hook
  // For now, just return the interface
  return {
    trialStatus: null as TrialStatus | null,
    refreshStatus: async () => {},
    trackFeature: async (feature: string) => {},
    getConversionMetrics: async () => null as ConversionMetrics | null,
    startMigration: async () => null as ProgressiveToProductionMigration | null
  }
}