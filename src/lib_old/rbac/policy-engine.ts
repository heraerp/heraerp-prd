/**
 * HERA RBAC Policy Engine
 * Role-based access control with smart code family permissions
 */

import { getSupabase } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'
import yaml from 'js-yaml'
import { minimatch } from 'minimatch'

export interface PolicyRule {
  role: string
  allow?: Permission[]
  deny?: Permission[]
  conditions?: PolicyCondition[]
}

export interface Permission {
  api?: string
  smart_code_family?: string
  resource_type?: string
  actions?: string[]
}

export interface PolicyCondition {
  type: 'time_based' | 'ip_range' | 'mfa_required' | 'custom'
  config: Record<string, any>
}

export interface PolicyDecision {
  allowed: boolean
  reason?: string
  applied_rules: string[]
  conditions_met: boolean
  audit_id?: string
}

export class RBACPolicyEngine {
  private static instance: RBACPolicyEngine
  private policyCache: Map<string, PolicyRule[]> = new Map()
  private compiledPatterns: Map<string, RegExp> = new Map()

  static getInstance(): RBACPolicyEngine {
    if (!this.instance) {
      this.instance = new RBACPolicyEngine()
    }
    return this.instance
  }

  /**
   * Load policies from YAML config
   */
  async loadPolicies(organizationId: string): Promise<void> {
    const supabase = getSupabase()

    // Get policy entities
    const { data: policies } = await supabase
      .from('core_entities')
      .select(
        `
        *,
        core_dynamic_data!inner(field_name, field_value_text)
      `
      )
      .eq('entity_type', 'rbac_policy')
      .eq('organization_id', organizationId)
      .eq('metadata->>active', true)

    const parsedPolicies: PolicyRule[] = []

    for (const policy of policies || []) {
      const yamlData = policy.core_dynamic_data?.find(
        (d: any) => d.field_name === 'policy_yaml'
      )?.field_value_text

      if (yamlData) {
        try {
          const parsed = yaml.load(yamlData) as PolicyRule
          parsedPolicies.push(parsed)
        } catch (error) {
          console.error(`Failed to parse policy ${policy.entity_code}:`, error)
        }
      }
    }

    // Cache for organization
    this.policyCache.set(organizationId, parsedPolicies)

    // Compile patterns
    this.compilePatternsForOrg(organizationId, parsedPolicies)
  }

  /**
   * Check if user has permission for action
   */
  async checkPermission(params: {
    organizationId: string
    userId: string
    roles: string[]
    action: string
    resource?: string
    smartCode?: string
    context?: Record<string, any>
  }): Promise<PolicyDecision> {
    const { organizationId, userId, roles, action, resource, smartCode, context } = params

    // Ensure policies are loaded
    if (!this.policyCache.has(organizationId)) {
      await this.loadPolicies(organizationId)
    }

    const policies = this.policyCache.get(organizationId) || []
    const appliedRules: string[] = []
    let finalDecision = false
    let denyReason: string | undefined

    // Check each role
    for (const role of roles) {
      const rolePolicies = policies.filter(p => p.role === role)

      for (const policy of rolePolicies) {
        // Check deny rules first (explicit deny takes precedence)
        if (policy.deny) {
          for (const deny of policy.deny) {
            if (this.matchesPermission(deny, action, resource, smartCode, organizationId)) {
              appliedRules.push(`${role}:DENY:${this.permissionToString(deny)}`)
              finalDecision = false
              denyReason = `Explicitly denied by ${role} policy`
              break
            }
          }
        }

        // If not denied, check allow rules
        if (!denyReason && policy.allow) {
          for (const allow of policy.allow) {
            if (this.matchesPermission(allow, action, resource, smartCode, organizationId)) {
              // Check conditions
              const conditionsMet = await this.evaluateConditions(policy.conditions, context)

              if (conditionsMet) {
                appliedRules.push(`${role}:ALLOW:${this.permissionToString(allow)}`)
                finalDecision = true
              } else {
                appliedRules.push(
                  `${role}:ALLOW_CONDITIONAL_FAILED:${this.permissionToString(allow)}`
                )
              }
            }
          }
        }
      }

      // Stop if explicitly denied
      if (denyReason) break
    }

    // Audit the decision
    const auditId = await this.auditDecision({
      organizationId,
      userId,
      roles,
      action,
      resource,
      smartCode,
      decision: finalDecision,
      reason: denyReason,
      appliedRules
    })

    return {
      allowed: finalDecision,
      reason: denyReason || (finalDecision ? 'Allowed by policy' : 'No matching allow rules'),
      applied_rules: appliedRules,
      conditions_met: true, // TODO: Return actual condition evaluation
      audit_id: auditId
    }
  }

  /**
   * Check if permission matches request
   */
  private matchesPermission(
    permission: Permission,
    action: string,
    resource?: string,
    smartCode?: string,
    organizationId?: string
  ): boolean {
    // Check API pattern
    if (permission.api) {
      const pattern = this.getCompiledPattern(`api:${permission.api}`, permission.api)
      if (!pattern.test(action)) {
        return false
      }
    }

    // Check smart code family
    if (permission.smart_code_family && smartCode) {
      const pattern = this.getCompiledPattern(
        `smart:${permission.smart_code_family}`,
        permission.smart_code_family
      )
      if (!pattern.test(smartCode)) {
        return false
      }
    }

    // Check resource type
    if (permission.resource_type && resource) {
      if (permission.resource_type !== resource) {
        return false
      }
    }

    // Check specific actions
    if (permission.actions && permission.actions.length > 0) {
      const actionParts = action.split(':')
      const actionType = actionParts[actionParts.length - 1]
      if (!permission.actions.includes(actionType)) {
        return false
      }
    }

    return true
  }

  /**
   * Evaluate policy conditions
   */
  private async evaluateConditions(
    conditions?: PolicyCondition[],
    context?: Record<string, any>
  ): Promise<boolean> {
    if (!conditions || conditions.length === 0) return true
    if (!context) return false

    for (const condition of conditions) {
      switch (condition.type) {
        case 'time_based':
          if (!this.evaluateTimeCondition(condition.config)) return false
          break

        case 'ip_range':
          if (!this.evaluateIPCondition(condition.config, context.ip)) return false
          break

        case 'mfa_required':
          if (!context.mfa_verified) return false
          break

        case 'custom':
          if (!(await this.evaluateCustomCondition(condition.config, context))) return false
          break
      }
    }

    return true
  }

  /**
   * Time-based condition evaluation
   */
  private evaluateTimeCondition(config: Record<string, any>): boolean {
    const now = new Date()
    const currentHour = now.getHours()
    const currentDay = now.getDay()

    if (config.business_hours_only) {
      if (currentHour < 8 || currentHour >= 18) return false
      if (currentDay === 0 || currentDay === 6) return false
    }

    if (config.allowed_hours) {
      const [start, end] = config.allowed_hours
      if (currentHour < start || currentHour >= end) return false
    }

    return true
  }

  /**
   * IP range condition evaluation
   */
  private evaluateIPCondition(config: Record<string, any>, clientIP?: string): boolean {
    if (!clientIP) return false

    if (config.allowed_ranges) {
      // Simple check - in production use proper IP range library
      return config.allowed_ranges.some((range: string) => clientIP.startsWith(range.split('/')[0]))
    }

    return true
  }

  /**
   * Custom condition evaluation
   */
  private async evaluateCustomCondition(
    config: Record<string, any>,
    context: Record<string, any>
  ): Promise<boolean> {
    // Implement custom condition logic
    // For example, check if user has completed training
    if (config.requires_training) {
      const supabase = getSupabase()
      const { data } = await supabase
        .from('core_dynamic_data')
        .select('field_value_text')
        .eq('entity_id', context.user_id)
        .eq('field_name', 'training_completed')
        .single()

      return data?.field_value_text === 'true'
    }

    return true
  }

  /**
   * Compile pattern for efficient matching
   */
  private getCompiledPattern(key: string, pattern: string): RegExp {
    if (!this.compiledPatterns.has(key)) {
      // Convert glob patterns to regex
      const regexPattern = minimatch.makeRe(pattern) || new RegExp(pattern)
      this.compiledPatterns.set(key, regexPattern)
    }
    return this.compiledPatterns.get(key)!
  }

  /**
   * Compile all patterns for organization
   */
  private compilePatternsForOrg(organizationId: string, policies: PolicyRule[]): void {
    for (const policy of policies) {
      // Compile allow patterns
      policy.allow?.forEach(perm => {
        if (perm.api) this.getCompiledPattern(`api:${perm.api}`, perm.api)
        if (perm.smart_code_family) {
          this.getCompiledPattern(`smart:${perm.smart_code_family}`, perm.smart_code_family)
        }
      })

      // Compile deny patterns
      policy.deny?.forEach(perm => {
        if (perm.api) this.getCompiledPattern(`api:${perm.api}`, perm.api)
        if (perm.smart_code_family) {
          this.getCompiledPattern(`smart:${perm.smart_code_family}`, perm.smart_code_family)
        }
      })
    }
  }

  /**
   * Convert permission to string for logging
   */
  private permissionToString(permission: Permission): string {
    const parts = []
    if (permission.api) parts.push(`api=${permission.api}`)
    if (permission.smart_code_family) parts.push(`smart=${permission.smart_code_family}`)
    if (permission.resource_type) parts.push(`resource=${permission.resource_type}`)
    if (permission.actions) parts.push(`actions=${permission.actions.join(',')}`)
    return parts.join(';')
  }

  /**
   * Audit policy decision
   */
  private async auditDecision(params: {
    organizationId: string
    userId: string
    roles: string[]
    action: string
    resource?: string
    smartCode?: string
    decision: boolean
    reason?: string
    appliedRules: string[]
  }): Promise<string> {
    const supabase = getSupabase()

    const { data } = await supabase
      .from('universal_transactions')
      .insert({
        id: uuidv4(),
        transaction_type: 'policy_check',
        transaction_date: new Date().toISOString(),
        total_amount: 0,
        smart_code: 'HERA.SECURITY.RBAC.DECISION.v1',
        organization_id: params.organizationId,
        metadata: {
          user_id: params.userId,
          roles: params.roles,
          action: params.action,
          resource: params.resource,
          smart_code: params.smartCode,
          decision: params.decision ? 'ALLOW' : 'DENY',
          reason: params.reason,
          applied_rules: params.appliedRules
        }
      })
      .select('id')
      .single()

    return data?.id
  }

  /**
   * Create or update policy
   */
  async upsertPolicy(
    organizationId: string,
    policyName: string,
    policyYaml: string
  ): Promise<string> {
    const supabase = getSupabase()

    // Validate YAML
    const parsed = yaml.load(policyYaml) as PolicyRule

    // Check if policy exists
    const { data: existing } = await supabase
      .from('core_entities')
      .select('id')
      .eq('entity_type', 'rbac_policy')
      .eq('entity_code', policyName)
      .eq('organization_id', organizationId)
      .single()

    let policyId: string

    if (existing) {
      policyId = existing.id

      // Update metadata
      await supabase
        .from('core_entities')
        .update({
          metadata: {
            active: true,
            updated_at: new Date().toISOString(),
            role: parsed.role
          }
        })
        .eq('id', policyId)

      // Update YAML
      await supabase
        .from('core_dynamic_data')
        .update({
          field_value_text: policyYaml,
          metadata: {
            validated_at: new Date().toISOString()
          }
        })
        .eq('entity_id', policyId)
        .eq('field_name', 'policy_yaml')
    } else {
      // Create new policy
      const { data: entity } = await supabase
        .from('core_entities')
        .insert({
          id: uuidv4(),
          entity_type: 'rbac_policy',
          entity_name: `${parsed.role} Policy`,
          entity_code: policyName,
          smart_code: `HERA.SECURITY.RBAC.POLICY.${parsed.role.toUpperCase()}.v1`,
          organization_id: organizationId,
          metadata: {
            active: true,
            role: parsed.role
          }
        })
        .select('id')
        .single()

      policyId = entity!.id

      // Store YAML
      await supabase.from('core_dynamic_data').insert({
        id: uuidv4(),
        entity_id: policyId,
        field_name: 'policy_yaml',
        field_value_text: policyYaml,
        field_type: 'yaml',
        smart_code: 'HERA.SECURITY.RBAC.POLICY.CONTENT.V1',
        organization_id: organizationId
      })
    }

    // Reload policies
    await this.loadPolicies(organizationId)

    // Audit
    await supabase.from('universal_transactions').insert({
      id: uuidv4(),
      transaction_type: 'policy_update',
      transaction_date: new Date().toISOString(),
      total_amount: 0,
      smart_code: 'HERA.SECURITY.AUDIT.POLICY.UPDATE.V1',
      organization_id: organizationId,
      metadata: {
        policy_id: policyId,
        policy_name: policyName,
        action: existing ? 'updated' : 'created',
        role: parsed.role
      }
    })

    return policyId
  }
}

export const rbacPolicy = RBACPolicyEngine.getInstance()
