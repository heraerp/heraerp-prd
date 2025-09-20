/**
 * HERA Universal Configuration Rules Service
 * Smart Code: HERA.UNIV.CONFIG.SERVICE.v1
 *
 * Core service for resolving and applying configuration rules
 */

import { universalApi } from '@/lib/universal-api'
import { supabase } from '@/lib/supabase'
import type { Entity, Transaction, DynamicData, Relationship } from '@/types/universal.types'

// Rule interface matching the README specification
export interface UniversalRule {
  rule_id: string
  smart_code: string
  status: 'active' | 'inactive' | 'draft'

  scope: {
    organization_id: string
    branches?: string[]
    services?: string[]
    specialists?: string[]
    customers?: string[]
    channels?: string[]
  }

  conditions: {
    effective_from: string
    effective_to?: string
    days_of_week?: number[]
    time_windows?: TimeWindow[]
    utilization_below?: number
    min_lead_minutes?: number
    [key: string]: any // Family-specific conditions
  }

  priority: number

  payload: {
    [key: string]: any // Family-specific configuration
  }

  metadata: {
    created_by: string
    created_at: string
    rollout?: RolloutStrategy
    version: number
  }
}

export interface TimeWindow {
  start_time: string // HH:MM format
  end_time: string // HH:MM format
}

export interface RolloutStrategy {
  type: 'immediate' | 'percentage' | 'gradual'
  percentage?: number
  target_groups?: string[]
}

export interface Context {
  organization_id: string
  branch_id?: string
  service_ids?: string[]
  specialist_id?: string
  customer_segments?: string[]
  channel?: string
  now: Date
  utilization?: number
  [key: string]: any
}

export interface Decision {
  decision: string
  reason: string
  confidence: number
  evidence: {
    matching_rules: string[]
    applied_rule_id: string
    context_snapshot: any
  }
  payload?: any
}

// Rule cache structure
interface RuleCache {
  rules: Map<string, UniversalRule[]> // key: org_id:family
  lastUpdate: Map<string, number> // key: org_id:family
  ttl: number // milliseconds
}

/**
 * Universal Configuration Service
 * Handles rule resolution, caching, and decision-making
 */
export class UniversalConfigService {
  private cache: RuleCache = {
    rules: new Map(),
    lastUpdate: new Map(),
    ttl: 5 * 60 * 1000 // 5 minutes default TTL
  }

  constructor(private organizationId?: string) {}

  /**
   * Set default organization ID for all operations
   */
  setOrganizationId(orgId: string) {
    this.organizationId = orgId
  }

  /**
   * Resolve applicable rules for given context and family
   */
  async resolve(params: {
    organization_id?: string
    family: string
    context: Context
  }): Promise<UniversalRule[]> {
    const orgId = params.organization_id || this.organizationId
    if (!orgId) throw new Error('Organization ID required')

    // Ensure context has organization_id
    const fullContext = { ...params.context, organization_id: orgId }

    // 1. Fetch cached rules
    const candidates = await this.fetchRules(orgId, params.family)

    // 2. Filter by scope
    const inScope = candidates.filter(rule => this.inScopeMatch(rule.scope, fullContext))

    // 3. Filter by time conditions
    const activeNow = inScope.filter(rule => this.timeMatch(rule.conditions, fullContext))

    // 4. Filter by business conditions
    const conditionOK = activeNow.filter(rule => this.conditionsMatch(rule.conditions, fullContext))

    // 5. Sort by priority, specificity, version
    const ordered = this.sortRules(conditionOK)

    // 6. Apply family-specific composition
    return this.composeByFamily(ordered, params.family)
  }

  /**
   * Make a decision based on resolved rules
   */
  async decide(params: { family: string; context: Context; inputs?: any }): Promise<Decision> {
    // Get applicable rules
    const rules = await this.resolve({
      family: params.family,
      context: params.context
    })

    if (rules.length === 0) {
      return {
        decision: 'no_matching_rule',
        reason: 'No applicable rules found',
        confidence: 0,
        evidence: {
          matching_rules: [],
          applied_rule_id: 'none',
          context_snapshot: params.context
        }
      }
    }

    // Apply family-specific decision logic
    const decision = this.applyFamilyLogic(params.family, rules, params.context, params.inputs)

    // Log decision as transaction for audit trail
    await this.logDecision(decision, params)

    return decision
  }

  /**
   * Fetch rules from cache or database
   */
  private async fetchRules(orgId: string, family: string): Promise<UniversalRule[]> {
    const cacheKey = `${orgId}:${family}`
    const now = Date.now()

    // Check cache validity
    const lastUpdate = this.cache.lastUpdate.get(cacheKey) || 0
    if (now - lastUpdate < this.cache.ttl) {
      return this.cache.rules.get(cacheKey) || []
    }

    // Fetch from database
    try {
      // Query core_entities for rules using Supabase directly
      if (!supabase) {
        console.warn('No Supabase client available, returning empty rules')
        return []
      }

      const { data: ruleEntities, error } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', orgId)
        .eq('entity_type', 'universal_rule')
        .ilike('smart_code', `${family}%`)

      if (error || !ruleEntities) {
        console.error('Failed to fetch rule entities:', error)
        return []
      }

      // Fetch dynamic data for each rule
      const rules: UniversalRule[] = await Promise.all(
        ruleEntities.map(async (entity: any) => {
          // Get rule data from dynamic fields
          const { data: dynamicData, error: dynamicError } = await supabase
            .from('core_dynamic_data')
            .select('*')
            .eq('entity_id', entity.id)
            .eq('organization_id', orgId)

          if (dynamicError) {
            console.error('Failed to fetch dynamic data for rule:', dynamicError)
          }

          return this.entityToRule(entity, dynamicData || [])
        })
      )

      // Update cache
      this.cache.rules.set(cacheKey, rules)
      this.cache.lastUpdate.set(cacheKey, now)

      return rules
    } catch (error) {
      console.error('Failed to fetch rules:', error)
      return []
    }
  }

  /**
   * Convert entity + dynamic data to rule structure
   */
  private entityToRule(entity: Entity, dynamicData: DynamicData[]): UniversalRule {
    // Parse JSON fields from dynamic data
    const getJsonField = (fieldName: string, defaultValue: any = {}) => {
      const field = dynamicData.find(d => d.field_name === fieldName)
      return field ? JSON.parse(field.field_value_text || '{}') : defaultValue
    }

    const getNumberField = (fieldName: string, defaultValue: number = 0) => {
      const field = dynamicData.find(d => d.field_name === fieldName)
      return field ? field.field_value_number || defaultValue : defaultValue
    }

    return {
      rule_id: entity.id,
      smart_code: entity.smart_code || '',
      status: entity.status as 'active' | 'inactive' | 'draft',
      scope: getJsonField('scope', { organization_id: entity.organization_id }),
      conditions: getJsonField('conditions', { effective_from: new Date().toISOString() }),
      priority: getNumberField('priority', 0),
      payload: getJsonField('payload'),
      metadata: {
        created_by: entity.created_by || 'system',
        created_at: entity.created_at,
        rollout: getJsonField('rollout', undefined),
        version: getNumberField('version', 1)
      }
    }
  }

  /**
   * Check if context matches rule scope
   */
  private inScopeMatch(scope: UniversalRule['scope'], context: Context): boolean {
    // Organization must match
    if (scope.organization_id !== context.organization_id) return false

    // Branch check
    if (scope.branches && context.branch_id) {
      if (!scope.branches.includes(context.branch_id)) return false
    }

    // Services check
    if (scope.services && context.service_ids) {
      const hasMatchingService = context.service_ids.some(id => scope.services!.includes(id))
      if (!hasMatchingService) return false
    }

    // Specialist check
    if (scope.specialists && context.specialist_id) {
      if (!scope.specialists.includes(context.specialist_id)) return false
    }

    // Customer segments check
    if (scope.customers && context.customer_segments) {
      const hasMatchingSegment = context.customer_segments.some(segment =>
        scope.customers!.includes(segment)
      )
      if (!hasMatchingSegment) return false
    }

    // Channel check
    if (scope.channels && context.channel) {
      if (!scope.channels.includes(context.channel)) return false
    }

    return true
  }

  /**
   * Check if current time matches rule conditions
   */
  private timeMatch(conditions: UniversalRule['conditions'], context: Context): boolean {
    const now = context.now || new Date()

    // Effective date range check
    if (conditions.effective_from) {
      const effectiveFrom = new Date(conditions.effective_from)
      if (now < effectiveFrom) return false
    }

    if (conditions.effective_to) {
      const effectiveTo = new Date(conditions.effective_to)
      if (now > effectiveTo) return false
    }

    // Day of week check
    if (conditions.days_of_week) {
      const currentDay = now.getDay()
      if (!conditions.days_of_week.includes(currentDay)) return false
    }

    // Time window check
    if (conditions.time_windows && conditions.time_windows.length > 0) {
      const currentTime = now.toTimeString().substring(0, 5) // HH:MM format
      const inTimeWindow = conditions.time_windows.some(window => {
        return currentTime >= window.start_time && currentTime <= window.end_time
      })
      if (!inTimeWindow) return false
    }

    return true
  }

  /**
   * Check business-specific conditions
   */
  private conditionsMatch(conditions: UniversalRule['conditions'], context: Context): boolean {
    // Utilization check
    if (conditions.utilization_below !== undefined && context.utilization !== undefined) {
      if (context.utilization >= conditions.utilization_below) return false
    }

    // Lead time check
    if (conditions.min_lead_minutes !== undefined && context.appointment_time) {
      const appointmentTime = new Date(context.appointment_time)
      const now = context.now || new Date()
      const leadMinutes = (appointmentTime.getTime() - now.getTime()) / (1000 * 60)
      if (leadMinutes < conditions.min_lead_minutes) return false
    }

    // Additional family-specific conditions would be checked here
    // This is extensible for each rule family

    return true
  }

  /**
   * Sort rules by priority, specificity, and version
   */
  private sortRules(rules: UniversalRule[]): UniversalRule[] {
    return rules.sort((a, b) => {
      // 1. Priority (higher wins)
      if (a.priority !== b.priority) {
        return b.priority - a.priority
      }

      // 2. Specificity (more specific scope wins)
      const aSpecificity = this.calculateSpecificity(a.scope)
      const bSpecificity = this.calculateSpecificity(b.scope)
      if (aSpecificity !== bSpecificity) {
        return bSpecificity - aSpecificity
      }

      // 3. Version (newer wins)
      return b.metadata.version - a.metadata.version
    })
  }

  /**
   * Calculate scope specificity score
   */
  private calculateSpecificity(scope: UniversalRule['scope']): number {
    let score = 0
    if (scope.branches) score += scope.branches.length * 5
    if (scope.services) score += scope.services.length * 4
    if (scope.specialists) score += scope.specialists.length * 3
    if (scope.customers) score += scope.customers.length * 2
    if (scope.channels) score += scope.channels.length * 1
    return score
  }

  /**
   * Apply family-specific composition logic
   */
  private composeByFamily(rules: UniversalRule[], family: string): UniversalRule[] {
    // Different families have different composition strategies
    const familyPrefix = family.split('.').slice(0, 5).join('.')

    switch (familyPrefix) {
      case 'HERA.UNIV.CONFIG.BOOKING.AVAILABILITY':
      case 'HERA.UNIV.CONFIG.BOOKING.NO_SHOW':
      case 'HERA.UNIV.CONFIG.BOOKING.SLOT_FILTER':
        // Booking rules: take highest priority only
        return rules.length > 0 ? [rules[0]] : []

      case 'HERA.UNIV.CONFIG.PRICING.DISCOUNT':
        // Pricing discounts: can stack, return all
        return rules

      case 'HERA.UNIV.CONFIG.NOTIFICATION.SMS':
      case 'HERA.UNIV.CONFIG.NOTIFICATION.EMAIL':
        // Notifications: merge all templates
        return rules

      case 'HERA.UNIV.CONFIG.UI.FEATURE_FLAG':
        // Feature flags: first matching rule wins
        return rules.length > 0 ? [rules[0]] : []

      default:
        // Default: return highest priority rule
        return rules.length > 0 ? [rules[0]] : []
    }
  }

  /**
   * Apply family-specific decision logic
   */
  private applyFamilyLogic(
    family: string,
    rules: UniversalRule[],
    context: Context,
    inputs?: any
  ): Decision {
    if (rules.length === 0) {
      return {
        decision: 'no_rule',
        reason: 'No matching rules found',
        confidence: 0,
        evidence: {
          matching_rules: [],
          applied_rule_id: 'none',
          context_snapshot: context
        }
      }
    }

    const familyPrefix = family.split('.').slice(0, 5).join('.')
    const primaryRule = rules[0]

    // Family-specific decision logic
    switch (familyPrefix) {
      case 'HERA.UNIV.CONFIG.BOOKING.NO_SHOW':
        return this.decideNoShowPolicy(primaryRule, context, inputs)

      case 'HERA.UNIV.CONFIG.PRICING.DISCOUNT':
        return this.decidePricingDiscount(rules, context, inputs)

      case 'HERA.UNIV.CONFIG.BOOKING.AVAILABILITY':
        return this.decideAvailability(primaryRule, context, inputs)

      default:
        // Generic decision
        return {
          decision: 'apply',
          reason: 'Rule matched',
          confidence: 0.9,
          evidence: {
            matching_rules: rules.map(r => r.rule_id),
            applied_rule_id: primaryRule.rule_id,
            context_snapshot: context
          },
          payload: primaryRule.payload
        }
    }
  }

  /**
   * Decide no-show policy for appointment
   */
  private decideNoShowPolicy(rule: UniversalRule, context: Context, inputs?: any): Decision {
    const payload = rule.payload as {
      grace_customers?: string[]
      waive_first_offense?: boolean
      min_fee_amount?: number
      max_fee_amount?: number
      fee_percentage?: number
    }

    // Check if customer is in grace list
    if (payload.grace_customers && context.customer_id) {
      if (payload.grace_customers.includes(context.customer_id)) {
        return {
          decision: 'waive',
          reason: 'Customer in grace list',
          confidence: 1.0,
          evidence: {
            matching_rules: [rule.rule_id],
            applied_rule_id: rule.rule_id,
            context_snapshot: context
          },
          payload: { fee: 0, waived: true }
        }
      }
    }

    // Check first offense
    if (payload.waive_first_offense && inputs?.is_first_offense) {
      return {
        decision: 'waive',
        reason: 'First offense waived',
        confidence: 0.95,
        evidence: {
          matching_rules: [rule.rule_id],
          applied_rule_id: rule.rule_id,
          context_snapshot: context
        },
        payload: { fee: 0, waived: true }
      }
    }

    // Calculate fee
    const appointmentValue = inputs?.appointment_value || 0
    let fee = 0

    if (payload.fee_percentage) {
      fee = appointmentValue * (payload.fee_percentage / 100)
    }

    if (payload.min_fee_amount) {
      fee = Math.max(fee, payload.min_fee_amount)
    }

    if (payload.max_fee_amount) {
      fee = Math.min(fee, payload.max_fee_amount)
    }

    return {
      decision: 'charge',
      reason: 'No-show fee applied',
      confidence: 0.9,
      evidence: {
        matching_rules: [rule.rule_id],
        applied_rule_id: rule.rule_id,
        context_snapshot: context
      },
      payload: { fee, waived: false }
    }
  }

  /**
   * Decide pricing discount
   */
  private decidePricingDiscount(rules: UniversalRule[], context: Context, inputs?: any): Decision {
    // Stack all applicable discounts
    const discounts = rules.map(rule => ({
      rule_id: rule.rule_id,
      type: rule.payload.discount_type,
      value: rule.payload.discount_value,
      max_amount: rule.payload.max_discount_amount
    }))

    // Calculate total discount
    const originalPrice = inputs?.original_price || 0
    let totalDiscount = 0

    for (const discount of discounts) {
      let discountAmount = 0

      if (discount.type === 'percentage') {
        discountAmount = originalPrice * (discount.value / 100)
      } else if (discount.type === 'fixed') {
        discountAmount = discount.value
      }

      if (discount.max_amount) {
        discountAmount = Math.min(discountAmount, discount.max_amount)
      }

      totalDiscount += discountAmount
    }

    return {
      decision: 'apply_discount',
      reason: `${discounts.length} discount(s) applied`,
      confidence: 0.95,
      evidence: {
        matching_rules: rules.map(r => r.rule_id),
        applied_rule_id: rules[0].rule_id,
        context_snapshot: context
      },
      payload: {
        original_price: originalPrice,
        total_discount: totalDiscount,
        final_price: Math.max(0, originalPrice - totalDiscount),
        applied_discounts: discounts
      }
    }
  }

  /**
   * Decide availability
   */
  private decideAvailability(rule: UniversalRule, context: Context, inputs?: any): Decision {
    const payload = rule.payload as {
      available: boolean
      reason?: string
      alternative_slots?: any[]
    }

    return {
      decision: payload.available ? 'available' : 'unavailable',
      reason: payload.reason || (payload.available ? 'Slot available' : 'Slot unavailable'),
      confidence: 0.9,
      evidence: {
        matching_rules: [rule.rule_id],
        applied_rule_id: rule.rule_id,
        context_snapshot: context
      },
      payload: {
        available: payload.available,
        alternative_slots: payload.alternative_slots || []
      }
    }
  }

  /**
   * Log decision as transaction for audit trail
   */
  private async logDecision(decision: Decision, params: any): Promise<void> {
    try {
      await universalApi.createTransaction({
        transaction_type: 'config_decision',
        smart_code: 'HERA.UNIV.CONFIG.DECISION.AUDIT.V1',
        organization_id: this.organizationId!,
        total_amount: 0,
        metadata: {
          family: params.family,
          decision: decision.decision,
          reason: decision.reason,
          confidence: decision.confidence,
          context: params.context,
          inputs: params.inputs,
          evidence: decision.evidence
        }
      })
    } catch (error) {
      console.error('Failed to log config decision:', error)
    }
  }

  /**
   * Invalidate cache for specific organization and family
   */
  invalidateCache(orgId?: string, family?: string): void {
    if (!orgId && !family) {
      // Clear entire cache
      this.cache.rules.clear()
      this.cache.lastUpdate.clear()
    } else if (orgId && family) {
      // Clear specific entry
      const key = `${orgId}:${family}`
      this.cache.rules.delete(key)
      this.cache.lastUpdate.delete(key)
    } else if (orgId) {
      // Clear all entries for organization
      for (const [key] of this.cache.rules) {
        if (key.startsWith(`${orgId}:`)) {
          this.cache.rules.delete(key)
          this.cache.lastUpdate.delete(key)
        }
      }
    }
  }

  /**
   * Create or update a rule
   */
  async upsertRule(rule: Partial<UniversalRule> & { organization_id: string }): Promise<string> {
    const orgId = rule.organization_id || this.organizationId
    if (!orgId) throw new Error('Organization ID required')

    try {
      // Create or update entity
      const entity = rule.rule_id
        ? await universalApi.updateEntity(rule.rule_id, {
            entity_name: rule.smart_code || 'Universal Rule',
            smart_code: rule.smart_code,
            status: rule.status || 'draft'
          })
        : await universalApi.createEntity({
            entity_type: 'universal_rule',
            entity_name: rule.smart_code || 'Universal Rule',
            smart_code: rule.smart_code,
            status: rule.status || 'draft',
            organization_id: orgId
          })

      // Save dynamic fields
      const fieldsToSave = [
        { field_name: 'scope', field_value_text: JSON.stringify(rule.scope || {}) },
        { field_name: 'conditions', field_value_text: JSON.stringify(rule.conditions || {}) },
        { field_name: 'priority', field_value_number: rule.priority || 0 },
        { field_name: 'payload', field_value_text: JSON.stringify(rule.payload || {}) },
        {
          field_name: 'rollout',
          field_value_text: JSON.stringify((rule.metadata as any)?.rollout || null)
        },
        { field_name: 'version', field_value_number: (rule.metadata as any)?.version || 1 }
      ]

      for (const field of fieldsToSave) {
        await universalApi.setDynamicField(
          entity.id,
          field.field_name,
          field.field_value_text || field.field_value_number?.toString() || ''
        )
      }

      // Invalidate cache
      const family = rule.smart_code?.split('.').slice(0, 5).join('.')
      if (family) {
        this.invalidateCache(orgId, family)
      }

      return entity.id
    } catch (error) {
      console.error('Failed to upsert rule:', error)
      throw error
    }
  }
}

// Export singleton instance
export const universalConfigService = new UniversalConfigService()
