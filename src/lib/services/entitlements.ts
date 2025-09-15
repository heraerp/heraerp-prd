/**
 * 🔐 HERA Entitlements Service
 *
 * Manages module entitlements and feature access
 * - Module subscription management
 * - Feature flag checking
 * - Usage tracking
 * - Billing integration hooks
 */

import { createClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { universalApi } from '@/lib/universal-api'

export interface ModuleDefinition {
  id: string
  name: string
  smartCode: string
  description: string
  features: string[]
  pricing?: {
    monthly: number
    yearly: number
    currency: string
  }
  dependencies?: string[] // Other module smart codes required
  category: 'core' | 'industry' | 'addon' | 'enterprise'
}

export interface EntitlementGrant {
  organizationId: string
  moduleSmartCode: string
  grantedBy: string
  expiresAt?: Date
  configuration?: Record<string, any>
  trialDays?: number
}

export interface UsageMetrics {
  moduleSmartCode: string
  organizationId: string
  period: string // YYYY-MM
  metrics: {
    activeUsers: number
    apiCalls: number
    storageUsed: number
    customMetrics?: Record<string, number>
  }
}

// Core modules included with all subscriptions
const CORE_MODULES: ModuleDefinition[] = [
  {
    id: 'core-entities',
    name: 'Entity Management',
    smartCode: 'HERA.CORE.ENTITIES.MODULE.v1',
    description: 'Universal entity management system',
    features: ['Create entities', 'Dynamic fields', 'Relationships'],
    category: 'core'
  },
  {
    id: 'core-transactions',
    name: 'Transaction Processing',
    smartCode: 'HERA.CORE.TRANSACTIONS.MODULE.v1',
    description: 'Universal transaction system',
    features: ['Create transactions', 'Line items', 'Smart codes'],
    category: 'core'
  },
  {
    id: 'core-accounting',
    name: 'Basic Accounting',
    smartCode: 'HERA.CORE.ACCOUNTING.MODULE.v1',
    description: 'Chart of accounts and journal entries',
    features: ['COA setup', 'Journal entries', 'Trial balance'],
    category: 'core'
  }
]

// Industry-specific module definitions
const INDUSTRY_MODULES: ModuleDefinition[] = [
  {
    id: 'salon-pos',
    name: 'Salon POS System',
    smartCode: 'HERA.SALON.POS.MODULE.v1',
    description: 'Complete salon point-of-sale system',
    features: [
      'Appointment booking',
      'Service management',
      'Staff scheduling',
      'Client management'
    ],
    pricing: { monthly: 99, yearly: 990, currency: 'USD' },
    dependencies: ['HERA.CORE.ENTITIES.MODULE.v1', 'HERA.CORE.TRANSACTIONS.MODULE.v1'],
    category: 'industry'
  },
  {
    id: 'restaurant-pos',
    name: 'Restaurant POS System',
    smartCode: 'HERA.RESTAURANT.POS.MODULE.v1',
    description: 'Restaurant point-of-sale and kitchen management',
    features: ['Menu management', 'Order tracking', 'Kitchen display', 'Table management'],
    pricing: { monthly: 149, yearly: 1490, currency: 'USD' },
    dependencies: ['HERA.CORE.ENTITIES.MODULE.v1', 'HERA.CORE.TRANSACTIONS.MODULE.v1'],
    category: 'industry'
  },
  {
    id: 'healthcare-emr',
    name: 'Healthcare EMR',
    smartCode: 'HERA.HEALTHCARE.EMR.MODULE.v1',
    description: 'Electronic medical records system',
    features: ['Patient records', 'Appointment scheduling', 'Prescriptions', 'Lab results'],
    pricing: { monthly: 299, yearly: 2990, currency: 'USD' },
    dependencies: ['HERA.CORE.ENTITIES.MODULE.v1', 'HERA.CORE.TRANSACTIONS.MODULE.v1'],
    category: 'industry'
  }
]

// Add-on modules
const ADDON_MODULES: ModuleDefinition[] = [
  {
    id: 'auto-journal',
    name: 'Auto-Journal Engine',
    smartCode: 'HERA.FIN.AUTO.JOURNAL.MODULE.v1',
    description: 'AI-powered automatic journal entry creation',
    features: ['85% automation', 'Smart classification', 'Batch processing'],
    pricing: { monthly: 49, yearly: 490, currency: 'USD' },
    dependencies: ['HERA.CORE.ACCOUNTING.MODULE.v1'],
    category: 'addon'
  },
  {
    id: 'inventory-advanced',
    name: 'Advanced Inventory',
    smartCode: 'HERA.INV.ADVANCED.MODULE.v1',
    description: 'Multi-location inventory with manufacturing',
    features: ['Multi-warehouse', 'Manufacturing', 'Lot tracking', 'Expiry dates'],
    pricing: { monthly: 79, yearly: 790, currency: 'USD' },
    dependencies: ['HERA.CORE.ENTITIES.MODULE.v1'],
    category: 'addon'
  },
  {
    id: 'analytics-ai',
    name: 'AI Analytics & Insights',
    smartCode: 'HERA.AI.ANALYTICS.MODULE.v1',
    description: 'AI-powered business analytics and predictions',
    features: ['Predictive analytics', 'Anomaly detection', 'Custom dashboards'],
    pricing: { monthly: 199, yearly: 1990, currency: 'USD' },
    dependencies: ['HERA.CORE.ENTITIES.MODULE.v1', 'HERA.CORE.TRANSACTIONS.MODULE.v1'],
    category: 'addon'
  }
]

// Enterprise modules
const ENTERPRISE_MODULES: ModuleDefinition[] = [
  {
    id: 'sso-saml',
    name: 'Enterprise SSO',
    smartCode: 'HERA.ENTERPRISE.SSO.MODULE.v1',
    description: 'SAML 2.0 and OIDC single sign-on',
    features: ['SAML 2.0', 'OIDC', 'Multi-factor auth', 'Directory sync'],
    pricing: { monthly: 299, yearly: 2990, currency: 'USD' },
    category: 'enterprise'
  },
  {
    id: 'api-gateway',
    name: 'API Gateway',
    smartCode: 'HERA.ENTERPRISE.API.MODULE.v1',
    description: 'Advanced API management and integrations',
    features: ['Rate limiting', 'API keys', 'Webhooks', 'Custom endpoints'],
    pricing: { monthly: 499, yearly: 4990, currency: 'USD' },
    category: 'enterprise'
  }
]

export const ALL_MODULES = [
  ...CORE_MODULES,
  ...INDUSTRY_MODULES,
  ...ADDON_MODULES,
  ...ENTERPRISE_MODULES
]

export class EntitlementsService {
  private supabase: any

  constructor() {
    // Initialize on demand
  }

  private async getSupabase() {
    if (!this.supabase) {
      const cookieStore = await cookies()
      this.supabase = createClient(cookieStore)
    }
    return this.supabase
  }

  /**
   * Grant module access to an organization
   */
  async grantModuleAccess(grant: EntitlementGrant): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await this.getSupabase()

      // 1. Find the module entity
      const module = ALL_MODULES.find(m => m.smartCode === grant.moduleSmartCode)
      if (!module) {
        return { success: false, error: 'Unknown module' }
      }

      // 2. Create or find module entity
      let moduleEntityId: string

      const { data: existingModule } = await supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', grant.organizationId)
        .eq('entity_type', 'module')
        .eq('smart_code', module.smartCode)
        .single()

      if (existingModule) {
        moduleEntityId = existingModule.id
      } else {
        // Create module entity
        const { data: newModule, error: createError } = await supabase
          .from('core_entities')
          .insert({
            organization_id: grant.organizationId,
            entity_type: 'module',
            entity_name: module.name,
            entity_code: module.id,
            smart_code: module.smartCode,
            metadata: {
              description: module.description,
              features: module.features,
              category: module.category,
              pricing: module.pricing
            }
          })
          .select()
          .single()

        if (createError) {
          return { success: false, error: 'Failed to create module entity' }
        }
        moduleEntityId = newModule.id
      }

      // 3. Create HAS_MODULE relationship
      const relationshipData = {
        organization_id: grant.organizationId,
        from_entity_id: grant.organizationId,
        to_entity_id: moduleEntityId,
        relationship_type: 'HAS_MODULE',
        relationship_direction: 'forward',
        smart_code: `HERA.ENTITLEMENT.GRANT.${module.category.toUpperCase()}.v1`,
        is_active: true,
        effective_date: new Date().toISOString(),
        expiration_date: grant.expiresAt?.toISOString() || null,
        relationship_data: {
          granted_by: grant.grantedBy,
          trial_days: grant.trialDays,
          grant_timestamp: new Date().toISOString()
        }
      }

      const { error: relError } = await supabase.from('core_relationships').insert(relationshipData)

      if (relError) {
        return { success: false, error: 'Failed to create entitlement relationship' }
      }

      // 4. Store configuration if provided
      if (grant.configuration) {
        await supabase.from('core_dynamic_data').insert({
          organization_id: grant.organizationId,
          entity_id: moduleEntityId,
          field_name: 'configuration',
          field_type: 'json',
          field_value_json: grant.configuration,
          smart_code: 'HERA.CONFIG.MODULE.SETTINGS.v1'
        })
      }

      // 5. Grant access to dependencies
      if (module.dependencies) {
        for (const depSmartCode of module.dependencies) {
          await this.grantModuleAccess({
            ...grant,
            moduleSmartCode: depSmartCode
          })
        }
      }

      return { success: true }
    } catch (error) {
      console.error('[Entitlements] Error granting access:', error)
      return { success: false, error: 'Failed to grant module access' }
    }
  }

  /**
   * Revoke module access
   */
  async revokeModuleAccess(
    organizationId: string,
    moduleSmartCode: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await this.getSupabase()

      // Find and deactivate the relationship
      const { error } = await supabase
        .from('core_relationships')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
        .eq('relationship_type', 'HAS_MODULE')
        .eq('from_entity_id', organizationId)
        .match({ 'module.smart_code': moduleSmartCode })

      if (error) {
        return { success: false, error: 'Failed to revoke access' }
      }

      return { success: true }
    } catch (error) {
      console.error('[Entitlements] Error revoking access:', error)
      return { success: false, error: 'Failed to revoke module access' }
    }
  }

  /**
   * Check if organization has access to module
   */
  async checkModuleAccess(organizationId: string, moduleSmartCode: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()

      const { data, error } = await supabase
        .from('core_relationships')
        .select('id, expiration_date')
        .eq('organization_id', organizationId)
        .eq('relationship_type', 'HAS_MODULE')
        .eq('is_active', true)
        .eq('from_entity_id', organizationId)
        .single()

      if (error || !data) return false

      // Check expiration
      if (data.expiration_date) {
        const expiryDate = new Date(data.expiration_date)
        if (expiryDate < new Date()) return false
      }

      return true
    } catch (error) {
      console.error('[Entitlements] Error checking access:', error)
      return false
    }
  }

  /**
   * Get all modules for an organization
   */
  async getOrganizationModules(organizationId: string): Promise<ModuleDefinition[]> {
    try {
      const supabase = await this.getSupabase()

      const { data: relationships, error } = await supabase
        .from('core_relationships')
        .select(
          `
          *,
          module:to_entity_id (
            id,
            entity_name,
            entity_code,
            smart_code,
            metadata
          )
        `
        )
        .eq('organization_id', organizationId)
        .eq('relationship_type', 'HAS_MODULE')
        .eq('is_active', true)
        .eq('from_entity_id', organizationId)

      if (error || !relationships) return []

      // Map to module definitions
      const modules = relationships
        .map((rel: any) => {
          const moduleEntity = rel.module
          if (!moduleEntity) return null

          const moduleDef = ALL_MODULES.find(m => m.smartCode === moduleEntity.smart_code)
          if (!moduleDef) return null

          return moduleDef
        })
        .filter(Boolean) as ModuleDefinition[]

      return modules
    } catch (error) {
      console.error('[Entitlements] Error getting modules:', error)
      return []
    }
  }

  /**
   * Track module usage
   */
  async trackUsage(metrics: UsageMetrics): Promise<void> {
    try {
      // Store usage metrics as a transaction for auditing
      await universalApi.createTransaction({
        organization_id: metrics.organizationId,
        transaction_type: 'usage_metrics',
        transaction_date: new Date().toISOString(),
        smart_code: 'HERA.USAGE.METRICS.TRACK.v1',
        metadata: {
          module_smart_code: metrics.moduleSmartCode,
          period: metrics.period,
          metrics: metrics.metrics
        }
      })
    } catch (error) {
      console.error('[Entitlements] Error tracking usage:', error)
    }
  }

  /**
   * Get available modules for category
   */
  getAvailableModules(category?: 'core' | 'industry' | 'addon' | 'enterprise'): ModuleDefinition[] {
    if (!category) return ALL_MODULES
    return ALL_MODULES.filter(m => m.category === category)
  }

  /**
   * Get module by smart code
   */
  getModuleDefinition(smartCode: string): ModuleDefinition | null {
    return ALL_MODULES.find(m => m.smartCode === smartCode) || null
  }
}

export const entitlementsService = new EntitlementsService()
