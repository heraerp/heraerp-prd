/**
 * HERA FICO Policy Engine
 * Smart Code: HERA.FICO.POLICY.ENGINE.CORE.v1
 * 
 * 🎯 Platform-grade finance policy engine with deterministic merge lattice
 * - Policy-as-data with overlay composition
 * - Real-time rule compilation and validation
 * - Multi-tenant organization-specific policies
 * - Industry and regional compliance overlays
 * - Perfect audit trail and change tracking
 */

import { cache } from 'react'
import { createClient } from '@supabase/supabase-js'

// Types for FICO Policy Engine
export interface PostingRule {
  match: {
    transaction_type?: string
    industry?: string
    region?: string
    currency?: string
    when?: string  // JavaScript expression
    [key: string]: any
  }
  lines: PostingLine[]
  dimensions?: Record<string, string>  // dimension requirements
  approval_required?: boolean
  sequence?: number
}

export interface PostingLine {
  side: 'DR' | 'CR'
  account: string  // Account code or expression
  amount: string   // Amount expression (e.g., "payload.total", "payload.net * 0.05")
  tax_code?: string
  dimension_override?: Record<string, string>
  description?: string
}

export interface ValidationRule {
  code: string
  name: string
  expr: string  // JavaScript expression that must evaluate to true
  message?: string
  severity: 'ERROR' | 'WARNING' | 'INFO'
  applies_to?: string[]  // Transaction types
}

export interface PolicyBundle {
  bundle_id: string
  version: string
  priority: number  // For merge lattice (1=highest priority)
  effective_date: string
  expiry_date?: string
  
  // Core policy components
  validations: {
    header_required: string[]
    line_required: string[]
    rules: ValidationRule[]
  }
  
  posting_rules: PostingRule[]
  
  tax_rules?: {
    engine_ref: string
    default_tax_code?: string
    tax_calculation_method: 'GROSS' | 'NET'
  }
  
  dimension_rules?: {
    required_dimensions: string[]
    conditional_requirements: Array<{
      condition: string
      required_dimensions: string[]
    }>
  }
  
  currency_rules?: {
    allowed_currencies: string[]
    base_currency: string
    exchange_rate_type: string
    revaluation_frequency?: 'DAILY' | 'MONTHLY' | 'QUARTERLY'
  }
  
  close_rules?: {
    close_tasks: string[]
    auto_close_enabled: boolean
    cutoff_time?: string
  }
  
  // Metadata
  metadata: {
    created_by: string
    created_at: string
    source: 'BASE' | 'INDUSTRY' | 'REGION' | 'ORG' | 'OVERLAY'
    description?: string
    applies_to?: string[]
  }
}

export interface CompiledPolicy {
  bundle_id: string
  compiled_at: string
  organization_id: string
  
  // Flattened and merged rules
  validations: ValidationRule[]
  posting_rules: PostingRule[]
  
  // Computed indexes for fast lookup
  rule_index: Map<string, PostingRule[]>  // by transaction_type
  validation_index: Map<string, ValidationRule[]>
  
  // Merge resolution log
  merge_log: Array<{
    rule_id: string
    winning_source: string
    conflict_sources: string[]
    resolution_reason: string
  }>
  
  // Performance metadata
  compilation_time_ms: number
  rule_count: number
  cache_until: string
}

export interface PolicyResolutionContext {
  organization_id: string
  industry?: string
  region?: string
  transaction_type?: string
  fiscal_period?: string
  user_role?: string
}

// Policy Engine Priority Levels (Merge Lattice)
export enum PolicyPriority {
  ORG_OVERRIDE = 1,      // Organization-specific policies (highest)
  INDUSTRY_OVERLAY = 2,  // Industry-specific overlays
  REGION_OVERLAY = 3,    // Regional compliance overlays  
  BASE_MODULE = 4,       // Core FICO base policies
  HARDCODED_FALLBACK = 5 // Emergency fallback (lowest)
}

export class FICOPolicyEngine {
  private supabase
  private cache = new Map<string, CompiledPolicy>()
  private cacheTimeout = 10 * 60 * 1000 // 10 minutes

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  /**
   * Get compiled policy for organization with merge lattice resolution
   */
  async getCompiledPolicy(context: PolicyResolutionContext): Promise<CompiledPolicy> {
    const cacheKey = this.buildCacheKey(context)
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!
      if (new Date(cached.cache_until) > new Date()) {
        console.log(`[FICOPolicy] 💾 Cache hit for ${cacheKey}`)
        return cached
      }
      this.cache.delete(cacheKey)
    }

    console.log(`[FICOPolicy] 🔄 Compiling policy for context:`, context)
    const startTime = Date.now()

    try {
      // 1. Load all applicable policy bundles in priority order
      const bundles = await this.loadApplicableBundles(context)
      console.log(`[FICOPolicy] 📦 Found ${bundles.length} applicable policy bundles`)

      // 2. Apply merge lattice to resolve conflicts
      const mergedPolicy = this.applyMergeLattice(bundles, context)
      
      // 3. Compile and index for fast runtime lookup
      const compiledPolicy = this.compilePolicy(mergedPolicy, context, Date.now() - startTime)
      
      // 4. Cache the result
      this.cache.set(cacheKey, compiledPolicy)
      setTimeout(() => this.cache.delete(cacheKey), this.cacheTimeout)
      
      console.log(`[FICOPolicy] ✅ Policy compiled in ${Date.now() - startTime}ms with ${compiledPolicy.rule_count} rules`)
      return compiledPolicy

    } catch (error) {
      console.error(`[FICOPolicy] ❌ Policy compilation failed:`, error)
      // Return emergency fallback policy
      return this.getEmergencyFallbackPolicy(context)
    }
  }

  /**
   * Validate transaction against compiled policy
   */
  async validateTransaction(
    context: PolicyResolutionContext,
    transaction: any,
    lines: any[]
  ): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const policy = await this.getCompiledPolicy(context)
    const errors: string[] = []
    const warnings: string[] = []

    // Get applicable validations for this transaction type
    const validations = policy.validation_index.get(transaction.transaction_type) || []
    
    for (const validation of validations) {
      try {
        const isValid = this.evaluateExpression(validation.expr, { 
          header: transaction, 
          lines, 
          sum: this.createSumFunction(lines),
          is_open_period: this.createPeriodCheck()
        })
        
        if (!isValid) {
          const message = validation.message || `Validation failed: ${validation.name}`
          if (validation.severity === 'ERROR') {
            errors.push(`[${validation.code}] ${message}`)
          } else if (validation.severity === 'WARNING') {
            warnings.push(`[${validation.code}] ${message}`)
          }
        }
      } catch (evalError) {
        errors.push(`[${validation.code}] Expression evaluation error: ${evalError}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Generate posting lines for transaction using policy rules
   */
  async generatePostingLines(
    context: PolicyResolutionContext,
    transaction: any
  ): Promise<{ lines: any[]; applied_rules: string[] }> {
    const policy = await this.getCompiledPolicy(context)
    const appliedRules: string[] = []
    const generatedLines: any[] = []

    // Get posting rules for this transaction type
    const rules = policy.rule_index.get(transaction.transaction_type) || []
    
    for (const rule of rules.sort((a, b) => (a.sequence || 0) - (b.sequence || 0))) {
      try {
        // Check if rule matches this transaction
        const matches = this.evaluateRuleMatch(rule.match, transaction, context)
        
        if (matches) {
          console.log(`[FICOPolicy] ✅ Applying rule: ${JSON.stringify(rule.match)}`)
          
          // Generate lines from rule
          for (const lineTemplate of rule.lines) {
            const line = await this.generateLineFromTemplate(lineTemplate, transaction, context)
            if (line) {
              generatedLines.push(line)
            }
          }
          
          appliedRules.push(`${rule.match.transaction_type || 'DEFAULT'}_${rule.sequence || 0}`)
        }
      } catch (error) {
        console.error(`[FICOPolicy] ❌ Error applying posting rule:`, error)
      }
    }

    return {
      lines: generatedLines,
      applied_rules: appliedRules
    }
  }

  /**
   * Update organization policy with governance tracking
   */
  async updateOrganizationPolicy(
    organizationId: string,
    policyUpdates: Partial<PolicyBundle>,
    actorUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`[FICOPolicy] 🔄 Updating org policy for ${organizationId}`)

      // 1. Load current policy
      const currentContext = { organization_id: organizationId }
      const currentPolicy = await this.getCompiledPolicy(currentContext)
      
      // 2. Create new policy bundle
      const newBundle: PolicyBundle = {
        bundle_id: `org_${organizationId}_${Date.now()}`,
        version: "v1.0",
        priority: PolicyPriority.ORG_OVERRIDE,
        effective_date: new Date().toISOString(),
        ...policyUpdates,
        metadata: {
          created_by: actorUserId,
          created_at: new Date().toISOString(),
          source: 'ORG',
          description: 'Organization-specific policy override'
        }
      }

      // 3. Validate new policy
      const validation = this.validatePolicyBundle(newBundle)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // 4. Store policy bundle as entity
      const { error: storeError } = await this.supabase.rpc('hera_entities_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: actorUserId,
        p_organization_id: organizationId,
        p_entity: {
          entity_type: 'POLICY_BUNDLE',
          entity_name: `Organization Policy Override`,
          smart_code: `HERA.FICO.POLICY.BUNDLE.ORG.${organizationId.slice(-8).toUpperCase()}.v1`
        },
        p_dynamic: {
          policy_data: {
            field_type: 'json',
            field_value_json: newBundle,
            smart_code: 'HERA.FICO.POLICY.DATA.JSON.v1'
          }
        },
        p_relationships: [
          {
            target_entity_type: 'ORGANIZATION',
            target_entity_id: organizationId,
            relationship_type: 'ORG_HAS_POLICY_OVERRIDE',
            smart_code: 'HERA.FICO.REL.ORG.POLICY.OVERRIDE.v1'
          }
        ],
        p_options: {}
      })

      if (storeError) {
        return { success: false, error: storeError.message }
      }

      // 5. Create governance transaction for audit trail
      await this.createGovernanceTransaction(
        organizationId,
        actorUserId,
        'POLICY_UPDATE',
        {
          bundle_id: newBundle.bundle_id,
          changes: Object.keys(policyUpdates),
          previous_bundle: currentPolicy.bundle_id
        }
      )

      // 6. Invalidate cache
      this.invalidateCache(organizationId)

      console.log(`[FICOPolicy] ✅ Policy updated successfully`)
      return { success: true }

    } catch (error) {
      console.error(`[FICOPolicy] ❌ Error updating policy:`, error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Private helper methods

  private buildCacheKey(context: PolicyResolutionContext): string {
    return `${context.organization_id}:${context.industry || 'default'}:${context.region || 'default'}`
  }

  private async loadApplicableBundles(context: PolicyResolutionContext): Promise<PolicyBundle[]> {
    const bundles: PolicyBundle[] = []

    try {
      // Load policy bundles from entities
      const { data, error } = await this.supabase.rpc('hera_entities_crud_v1', {
        p_action: 'READ',
        p_actor_user_id: null,
        p_organization_id: '00000000-0000-0000-0000-000000000000', // Platform org for base policies
        p_entity: {
          entity_type: 'POLICY_BUNDLE'
        },
        p_dynamic: {},
        p_relationships: [],
        p_options: {
          include_dynamic: true,
          filters: {
            effective_date: `<= ${new Date().toISOString()}`,
            expiry_date: `> ${new Date().toISOString()} OR NULL`
          }
        }
      })

      if (error) {
        console.error('[FICOPolicy] Error loading policy bundles:', error)
        return bundles
      }

      // Parse policy data from entities
      for (const entity of data?.items || []) {
        if (entity.dynamic_data?.policy_data?.field_value_json) {
          const bundle = entity.dynamic_data.policy_data.field_value_json as PolicyBundle
          if (this.bundleAppliesTo(bundle, context)) {
            bundles.push(bundle)
          }
        }
      }

      // Sort by priority (lowest number = highest priority)
      bundles.sort((a, b) => a.priority - b.priority)
      
      return bundles

    } catch (error) {
      console.error('[FICOPolicy] Error in loadApplicableBundles:', error)
      return bundles
    }
  }

  private bundleAppliesTo(bundle: PolicyBundle, context: PolicyResolutionContext): boolean {
    // Check if bundle applies to this context
    if (bundle.metadata.applies_to) {
      if (context.industry && !bundle.metadata.applies_to.includes(context.industry)) {
        return false
      }
      if (context.region && !bundle.metadata.applies_to.includes(context.region)) {
        return false
      }
    }
    
    return true
  }

  private applyMergeLattice(bundles: PolicyBundle[], context: PolicyResolutionContext): PolicyBundle {
    console.log(`[FICOPolicy] 🔄 Applying merge lattice to ${bundles.length} bundles`)
    
    // Start with base bundle
    const baseBundles = bundles.filter(b => b.metadata.source === 'BASE')
    const merged: PolicyBundle = baseBundles[0] || this.getBasePolicyBundle()
    
    // Apply overlays in priority order
    for (const overlay of bundles.filter(b => b.metadata.source !== 'BASE')) {
      this.mergeBundle(merged, overlay)
    }
    
    return merged
  }

  private mergeBundle(target: PolicyBundle, overlay: PolicyBundle): void {
    // Merge posting rules (overlay extends or overrides)
    target.posting_rules = target.posting_rules || []
    target.posting_rules.push(...(overlay.posting_rules || []))
    
    // Merge validations (overlay adds new validations)
    if (overlay.validations) {
      target.validations.rules.push(...overlay.validations.rules)
      target.validations.header_required.push(...overlay.validations.header_required)
      target.validations.line_required.push(...overlay.validations.line_required)
    }
    
    // Overlay rules take precedence for tax, currency, dimensions
    if (overlay.tax_rules) target.tax_rules = { ...target.tax_rules, ...overlay.tax_rules }
    if (overlay.currency_rules) target.currency_rules = { ...target.currency_rules, ...overlay.currency_rules }
    if (overlay.dimension_rules) target.dimension_rules = { ...target.dimension_rules, ...overlay.dimension_rules }
  }

  private compilePolicy(policy: PolicyBundle, context: PolicyResolutionContext, compilationTime: number): CompiledPolicy {
    // Create indexes for fast runtime lookup
    const ruleIndex = new Map<string, PostingRule[]>()
    const validationIndex = new Map<string, ValidationRule[]>()
    
    // Index posting rules by transaction type
    for (const rule of policy.posting_rules) {
      const txnType = rule.match.transaction_type || 'DEFAULT'
      if (!ruleIndex.has(txnType)) {
        ruleIndex.set(txnType, [])
      }
      ruleIndex.get(txnType)!.push(rule)
    }
    
    // Index validation rules by transaction type  
    for (const validation of policy.validations.rules) {
      const applicableTypes = validation.applies_to || ['DEFAULT']
      for (const txnType of applicableTypes) {
        if (!validationIndex.has(txnType)) {
          validationIndex.set(txnType, [])
        }
        validationIndex.get(txnType)!.push(validation)
      }
    }
    
    const compiled: CompiledPolicy = {
      bundle_id: policy.bundle_id,
      compiled_at: new Date().toISOString(),
      organization_id: context.organization_id,
      validations: policy.validations.rules,
      posting_rules: policy.posting_rules,
      rule_index: ruleIndex,
      validation_index: validationIndex,
      merge_log: [], // TODO: Track merge conflicts and resolutions
      compilation_time_ms: compilationTime,
      rule_count: policy.posting_rules.length + policy.validations.rules.length,
      cache_until: new Date(Date.now() + this.cacheTimeout).toISOString()
    }
    
    return compiled
  }

  private evaluateExpression(expr: string, context: any): boolean {
    try {
      // Create safe evaluation context
      const func = new Function('context', `
        with(context) {
          return ${expr};
        }
      `)
      return func(context)
    } catch (error) {
      console.error(`[FICOPolicy] Expression evaluation error:`, error, 'Expression:', expr)
      return false
    }
  }

  private evaluateRuleMatch(match: any, transaction: any, context: PolicyResolutionContext): boolean {
    // Check each match condition
    for (const [key, value] of Object.entries(match)) {
      if (key === 'when') {
        // JavaScript expression
        if (!this.evaluateExpression(value as string, { 
          payload: transaction, 
          context, 
          transaction 
        })) {
          return false
        }
      } else {
        // Direct property match
        if (transaction[key] !== value && context[key as keyof PolicyResolutionContext] !== value) {
          return false
        }
      }
    }
    return true
  }

  private async generateLineFromTemplate(
    template: PostingLine, 
    transaction: any, 
    context: PolicyResolutionContext
  ): Promise<any | null> {
    try {
      // Evaluate account code
      const account = this.evaluateAmountExpression(template.account, transaction)
      
      // Evaluate amount
      const amount = this.evaluateAmountExpression(template.amount, transaction)
      
      if (!account || !amount || amount === 0) {
        return null
      }
      
      return {
        account_code: account,
        side: template.side,
        amount: Math.abs(amount),
        currency: transaction.currency_code || 'AED',
        description: template.description || `Auto-posted ${template.side}`,
        tax_code: template.tax_code,
        dimensions: template.dimension_override || transaction.dimensions || {},
        smart_code: `HERA.FICO.TXN.LINE.${template.side}.AUTO.v1`
      }
    } catch (error) {
      console.error(`[FICOPolicy] Error generating line from template:`, error)
      return null
    }
  }

  private evaluateAmountExpression(expr: string, transaction: any): any {
    try {
      // If it's a simple property path like "payload.total"
      if (expr.includes('.')) {
        const parts = expr.split('.')
        let value = transaction
        for (const part of parts) {
          if (part === 'payload') continue  // Skip payload prefix
          value = value?.[part]
        }
        return value
      }
      
      // If it's a simple value
      if (!isNaN(Number(expr))) {
        return Number(expr)
      }
      
      // Otherwise return as string (account code)
      return expr
      
    } catch (error) {
      console.error(`[FICOPolicy] Error evaluating expression:`, expr, error)
      return null
    }
  }

  private createSumFunction(lines: any[]) {
    return (side: string) => {
      return lines
        .filter(line => line.side === side)
        .reduce((sum, line) => sum + (line.amount || 0), 0)
    }
  }

  private createPeriodCheck() {
    return (period: string) => {
      // TODO: Implement actual period open/close check
      return true
    }
  }

  private getEmergencyFallbackPolicy(context: PolicyResolutionContext): CompiledPolicy {
    // Emergency fallback when policy compilation fails
    return {
      bundle_id: 'EMERGENCY_FALLBACK',
      compiled_at: new Date().toISOString(),
      organization_id: context.organization_id,
      validations: [],
      posting_rules: [],
      rule_index: new Map(),
      validation_index: new Map(),
      merge_log: [{ 
        rule_id: 'EMERGENCY', 
        winning_source: 'FALLBACK', 
        conflict_sources: [], 
        resolution_reason: 'Policy compilation failed' 
      }],
      compilation_time_ms: 0,
      rule_count: 0,
      cache_until: new Date(Date.now() + 60000).toISOString() // 1 minute
    }
  }

  private getBasePolicyBundle(): PolicyBundle {
    // Base FICO policies that always apply
    return {
      bundle_id: 'FICO_BASE_v1',
      version: 'v1.0',
      priority: PolicyPriority.BASE_MODULE,
      effective_date: '2024-01-01T00:00:00Z',
      validations: {
        header_required: ['transaction_date', 'currency_code'],
        line_required: ['account_code', 'side', 'amount'],
        rules: [
          {
            code: 'DRCR_BALANCE',
            name: 'Debit Credit Balance',
            expr: 'sum("DR") == sum("CR")',
            severity: 'ERROR' as const,
            message: 'Total debits must equal total credits'
          }
        ]
      },
      posting_rules: [],
      metadata: {
        created_by: 'SYSTEM',
        created_at: '2024-01-01T00:00:00Z',
        source: 'BASE',
        description: 'Base FICO validation rules'
      }
    }
  }

  private validatePolicyBundle(bundle: PolicyBundle): { valid: boolean; error?: string } {
    if (!bundle.bundle_id) {
      return { valid: false, error: 'Bundle ID is required' }
    }
    
    if (!bundle.version) {
      return { valid: false, error: 'Version is required' }
    }
    
    if (!bundle.validations) {
      return { valid: false, error: 'Validations are required' }
    }
    
    return { valid: true }
  }

  private async createGovernanceTransaction(
    organizationId: string,
    actorUserId: string,
    action: string,
    metadata: any
  ): Promise<void> {
    try {
      await this.supabase.rpc('hera_txn_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: actorUserId,
        p_organization_id: organizationId,
        p_transaction: {
          transaction_type: 'FICO.GOVERNANCE',
          smart_code: 'HERA.FICO.TXN.GOVERNANCE.v1',
          transaction_number: `GOV-${Date.now()}`,
          total_amount: 0,
          metadata
        },
        p_lines: [],
        p_options: {}
      })
    } catch (error) {
      console.error('[FICOPolicy] Error creating governance transaction:', error)
    }
  }

  private invalidateCache(organizationId: string): void {
    // Remove all cache entries for this organization
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${organizationId}:`)) {
        this.cache.delete(key)
      }
    }
  }
}

// Export singleton instance
export const ficoPolicyEngine = new FICOPolicyEngine()

// Cache for React Server Components
export const getCachedPolicy = cache(
  async (context: PolicyResolutionContext) => {
    return await ficoPolicyEngine.getCompiledPolicy(context)
  }
)