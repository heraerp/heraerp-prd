/**
 * Guardrail Auto-Fix Service
 * Automatically corrects common payload issues and logs fixes
 * Extends guardrail validation with intelligent corrections
 */

import { getSupabase } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'

export interface AutoFixResult {
  fixed: boolean
  original: any
  corrected: any
  fixes_applied: AutoFix[]
  validation_passed: boolean
}

export interface AutoFix {
  field: string
  issue: string
  fix_type: 'inject' | 'normalize' | 'generate' | 'transform'
  original_value: any
  corrected_value: any
  confidence: number // 0-1
}

export class GuardrailAutoFixService {
  private static instance: GuardrailAutoFixService
  private currentOrganizationId?: string

  static getInstance(): GuardrailAutoFixService {
    if (!this.instance) {
      this.instance = new GuardrailAutoFixService()
    }
    return this.instance
  }

  setOrganizationContext(organizationId: string) {
    this.currentOrganizationId = organizationId
  }

  /**
   * Apply auto-fixes to a payload
   */
  async autoFixPayload(
    table: string,
    payload: any,
    context?: {
      user_id?: string
      session_org_id?: string
      request_type?: string
    }
  ): Promise<AutoFixResult> {
    const fixes: AutoFix[] = []
    let corrected = { ...payload }

    // Fix 1: Missing organization_id
    if (!corrected.organization_id && (this.currentOrganizationId || context?.session_org_id)) {
      const orgId = this.currentOrganizationId || context?.session_org_id
      fixes.push({
        field: 'organization_id',
        issue: 'Missing required organization_id',
        fix_type: 'inject',
        original_value: undefined,
        corrected_value: orgId,
        confidence: 0.95
      })
      corrected.organization_id = orgId
    }

    // Fix 2: Normalize entity_type for GL accounts
    if (table === 'core_entities' && corrected.entity_type === 'gl_account') {
      fixes.push({
        field: 'entity_type',
        issue: 'Non-standard entity_type for GL account',
        fix_type: 'normalize',
        original_value: 'gl_account',
        corrected_value: 'account',
        confidence: 0.9
      })
      corrected.entity_type = 'account'
      
      // Also inject business rules for ledger type
      if (!corrected.metadata) corrected.metadata = {}
      if (!corrected.metadata.business_rules) corrected.metadata.business_rules = {}
      corrected.metadata.business_rules.ledger_type = 'GL'
      
      fixes.push({
        field: 'metadata.business_rules.ledger_type',
        issue: 'Missing ledger type for GL account',
        fix_type: 'inject',
        original_value: undefined,
        corrected_value: 'GL',
        confidence: 0.85
      })
    }

    // Fix 3: Generate smart_code if missing but inferable
    if (!corrected.smart_code) {
      const generatedSmartCode = await this.inferSmartCode(table, corrected)
      if (generatedSmartCode) {
        fixes.push({
          field: 'smart_code',
          issue: 'Missing smart_code',
          fix_type: 'generate',
          original_value: undefined,
          corrected_value: generatedSmartCode,
          confidence: 0.8
        })
        corrected.smart_code = generatedSmartCode
      }
    }

    // Fix 4: Normalize transaction_type values
    if (table === 'universal_transactions' && corrected.transaction_type) {
      const normalizedType = this.normalizeTransactionType(corrected.transaction_type)
      if (normalizedType !== corrected.transaction_type) {
        fixes.push({
          field: 'transaction_type',
          issue: 'Non-standard transaction_type',
          fix_type: 'normalize',
          original_value: corrected.transaction_type,
          corrected_value: normalizedType,
          confidence: 0.85
        })
        corrected.transaction_type = normalizedType
      }
    }

    // Fix 5: Add timestamps if missing
    if (!corrected.created_at) {
      corrected.created_at = new Date().toISOString()
      fixes.push({
        field: 'created_at',
        issue: 'Missing creation timestamp',
        fix_type: 'inject',
        original_value: undefined,
        corrected_value: corrected.created_at,
        confidence: 1.0
      })
    }

    // Fix 6: Generate IDs if missing
    if (!corrected.id && ['core_entities', 'universal_transactions'].includes(table)) {
      corrected.id = uuidv4()
      fixes.push({
        field: 'id',
        issue: 'Missing record ID',
        fix_type: 'generate',
        original_value: undefined,
        corrected_value: corrected.id,
        confidence: 1.0
      })
    }

    // Log auto-fixes if any were applied
    if (fixes.length > 0) {
      await this.logAutoFixes(table, payload, corrected, fixes, context)
    }

    return {
      fixed: fixes.length > 0,
      original: payload,
      corrected,
      fixes_applied: fixes,
      validation_passed: await this.validateCorrected(table, corrected)
    }
  }

  /**
   * Infer smart_code based on entity type and context
   */
  private async inferSmartCode(table: string, payload: any): Promise<string | null> {
    const patterns: Record<string, any> = {
      core_entities: {
        customer: 'HERA.CRM.CUSTOMER.ENTITY.[SUBTYPE].v1',
        vendor: 'HERA.SCM.VENDOR.ENTITY.[SUBTYPE].v1',
        product: 'HERA.INV.PRODUCT.ENTITY.[SUBTYPE].v1',
        employee: 'HERA.HR.EMPLOYEE.ENTITY.[SUBTYPE].v1',
        account: 'HERA.FIN.GL.ACCOUNT.[SUBTYPE].v1',
        branch: 'HERA.ORG.BRANCH.ENTITY.[SUBTYPE].v1',
        service: 'HERA.SVC.SERVICE.ENTITY.[SUBTYPE].v1'
      },
      universal_transactions: {
        sale: 'HERA.SALES.TXN.ORDER.[SUBTYPE].v1',
        purchase: 'HERA.SCM.TXN.PURCHASE.[SUBTYPE].v1',
        payment: 'HERA.FIN.TXN.PAYMENT.[SUBTYPE].v1',
        journal_entry: 'HERA.FIN.TXN.JOURNAL.[SUBTYPE].v1',
        appointment: 'HERA.SVC.TXN.APPOINTMENT.[SUBTYPE].v1',
        'GL.CLOSE': 'HERA.FIN.TXN.PERIOD.CLOSE.v1'
      }
    }

    if (table === 'core_entities' && payload.entity_type) {
      const pattern = patterns.core_entities[payload.entity_type]
      if (pattern) {
        // Determine subtype based on metadata or name
        let subtype = 'STANDARD'
        if (payload.metadata?.vip_level) subtype = 'VIP'
        if (payload.metadata?.category) subtype = payload.metadata.category.toUpperCase()
        
        return pattern.replace('[SUBTYPE]', subtype)
      }
    }

    if (table === 'universal_transactions' && payload.transaction_type) {
      const pattern = patterns.universal_transactions[payload.transaction_type]
      if (pattern) {
        let subtype = 'STANDARD'
        if (payload.metadata?.channel) subtype = payload.metadata.channel.toUpperCase()
        
        return pattern.replace('[SUBTYPE]', subtype)
      }
    }

    return null
  }

  /**
   * Normalize transaction types to standard values
   */
  private normalizeTransactionType(type: string): string {
    const normalizations: Record<string, string> = {
      'sales': 'sale',
      'order': 'sale',
      'invoice': 'sale',
      'purchases': 'purchase',
      'bill': 'purchase',
      'receipt': 'payment',
      'pay': 'payment',
      'je': 'journal_entry',
      'journal': 'journal_entry',
      'booking': 'appointment',
      'reservation': 'appointment',
      'close': 'GL.CLOSE',
      'period_close': 'GL.CLOSE'
    }

    return normalizations[type.toLowerCase()] || type
  }

  /**
   * Validate the corrected payload
   */
  private async validateCorrected(table: string, payload: any): Promise<boolean> {
    // Basic validation rules
    const requiredFields: Record<string, string[]> = {
      core_entities: ['entity_type', 'entity_name', 'organization_id'],
      universal_transactions: ['transaction_type', 'transaction_date', 'organization_id'],
      core_dynamic_data: ['entity_id', 'field_name', 'organization_id'],
      core_relationships: ['from_entity_id', 'to_entity_id', 'relationship_type', 'organization_id']
    }

    const required = requiredFields[table] || []
    for (const field of required) {
      if (!payload[field]) {
        return false
      }
    }

    return true
  }

  /**
   * Log auto-fixes to universal_transactions
   */
  private async logAutoFixes(
    table: string,
    original: any,
    corrected: any,
    fixes: AutoFix[],
    context?: any
  ): Promise<void> {
    const supabase = getSupabase()

    const { error } = await supabase
      .from('universal_transactions')
      .insert({
        id: uuidv4(),
        transaction_type: 'guardrail_autofix',
        transaction_date: new Date().toISOString(),
        total_amount: 0,
        smart_code: `HERA.GUARDRAIL.AUTOFIX.${table.toUpperCase()}.v1`,
        organization_id: corrected.organization_id || this.currentOrganizationId || 'SYSTEM',
        metadata: {
          table_name: table,
          fixes_applied: fixes.length,
          fix_details: fixes,
          original_payload: original,
          corrected_payload: corrected,
          context,
          confidence_score: fixes.reduce((sum, f) => sum + f.confidence, 0) / fixes.length
        }
      })

    if (error) {
      console.error('Failed to log auto-fixes:', error)
    }
  }

  /**
   * Get auto-fix history for analysis
   */
  async getAutoFixHistory(
    organizationId: string,
    filters?: {
      table?: string
      start_date?: string
      end_date?: string
      fix_type?: string
    }
  ): Promise<any[]> {
    const supabase = getSupabase()

    let query = supabase
      .from('universal_transactions')
      .select('*')
      .eq('transaction_type', 'guardrail_autofix')
      .eq('organization_id', organizationId)

    if (filters?.table) {
      query = query.eq('metadata->>table_name', filters.table)
    }

    if (filters?.start_date) {
      query = query.gte('transaction_date', filters.start_date)
    }

    if (filters?.end_date) {
      query = query.lte('transaction_date', filters.end_date)
    }

    const { data, error } = await query.order('transaction_date', { ascending: false })

    if (error) throw error

    return data || []
  }

  /**
   * Get auto-fix statistics
   */
  async getAutoFixStats(organizationId: string, days: number = 30): Promise<any> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const history = await this.getAutoFixHistory(organizationId, {
      start_date: startDate.toISOString()
    })

    const stats = {
      total_fixes: history.length,
      by_table: {} as Record<string, number>,
      by_fix_type: {} as Record<string, number>,
      common_fields: {} as Record<string, number>,
      average_confidence: 0
    }

    let totalConfidence = 0

    history.forEach(record => {
      const metadata = record.metadata
      
      // Count by table
      stats.by_table[metadata.table_name] = (stats.by_table[metadata.table_name] || 0) + 1

      // Count by fix type and field
      metadata.fix_details.forEach((fix: AutoFix) => {
        stats.by_fix_type[fix.fix_type] = (stats.by_fix_type[fix.fix_type] || 0) + 1
        stats.common_fields[fix.field] = (stats.common_fields[fix.field] || 0) + 1
        totalConfidence += fix.confidence
      })
    })

    stats.average_confidence = history.length > 0 
      ? totalConfidence / history.reduce((sum, r) => sum + r.metadata.fix_details.length, 0)
      : 0

    return stats
  }
}

export const guardrailAutoFix = GuardrailAutoFixService.getInstance()