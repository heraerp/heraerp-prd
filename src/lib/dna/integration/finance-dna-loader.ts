/**
 * Finance DNA Configuration Loader
 *
 * Loads posting rules, activation matrices, and master data
 * from the universal 6-table architecture
 */

import { supabaseAdmin } from '@/lib/supabase-server'
import type {
  PostingRule,
  OrgFinanceConfig,
  UniversalFinanceEvent,
  UniversalFinanceLine
} from './finance-integration-dna'

export class FinanceDNALoader {
  /**
   * Load organization's finance configuration from core_organizations
   */
  static async loadOrgConfig(organizationId: string): Promise<OrgFinanceConfig> {
    const { data: org, error } = await supabaseAdmin
      .from('core_organizations')
      .select('*')
      .eq('id', organizationId)
      .single()

    if (error || !org) {
      throw new Error(`Failed to load org config: ${error?.message}`)
    }

    // Extract finance config from settings
    const settings = org.settings || {}
    const metadata = settings.finance_dna || {}

    return {
      modules_enabled: metadata.modules_enabled || {
        SD: true,
        MM: true,
        HR: true,
        FI: true
      },
      finance_policy: metadata.finance_policy || {
        default_coa_id: metadata.default_coa_id || 'COA-DEFAULT',
        tax_profile_id: metadata.tax_profile_id || 'TAX-DEFAULT',
        fx_source: metadata.fx_source || 'ECB'
      },
      module_overrides: metadata.module_overrides || {},
      deactivation_behaviour: metadata.deactivation_behaviour || {}
    }
  }

  /**
   * Load posting rules from core_dynamic_data
   * Smart codes are stored as dynamic data with field_name = 'posting_rule'
   */
  static async loadPostingRules(organizationId: string): Promise<Map<string, PostingRule>> {
    // First try org-specific rules
    const { data: orgRules } = await supabaseAdmin
      .from('core_dynamic_data')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('field_name', 'posting_rule')

    // Then load system defaults (HERA System Organization)
    const { data: systemRules } = await supabaseAdmin
      .from('core_dynamic_data')
      .select('*')
      .eq('organization_id', 'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944') // HERA System Org
      .eq('field_name', 'posting_rule')

    const rulesMap = new Map<string, PostingRule>()

    // Load system rules first (defaults)
    systemRules?.forEach(rule => {
      if (rule.field_value_json) {
        const postingRule = rule.field_value_json as PostingRule
        rulesMap.set(postingRule.smart_code, postingRule)
      }
    })

    // Override with org-specific rules
    orgRules?.forEach(rule => {
      if (rule.field_value_json) {
        const postingRule = rule.field_value_json as PostingRule
        rulesMap.set(postingRule.smart_code, postingRule)
      }
    })

    return rulesMap
  }

  /**
   * Load Chart of Accounts from core_entities
   */
  static async loadChartOfAccounts(organizationId: string): Promise<Map<string, any>> {
    const { data: accounts, error } = await supabaseAdmin
      .from('core_entities')
      .select(
        `
        *,
        core_dynamic_data!inner(*)
      `
      )
      .eq('organization_id', organizationId)
      .eq('entity_type', 'gl_account')

    if (error) {
      throw new Error(`Failed to load COA: ${error.message}`)
    }

    const coaMap = new Map()

    accounts?.forEach(account => {
      const accountData = {
        id: account.id,
        code: account.entity_code,
        name: account.entity_name,
        type: account.entity_subtype, // Asset, Liability, Revenue, etc.
        attributes: {}
      }

      // Add dynamic attributes
      account.core_dynamic_data?.forEach((field: any) => {
        accountData.attributes[field.field_name] =
          field.field_value_text || field.field_value_number || field.field_value_json
      })

      coaMap.set(account.entity_code, accountData)
    })

    return coaMap
  }

  /**
   * Load master data relationships for account derivation
   * e.g., Customer -> AR Account, Product -> Revenue Account
   */
  static async loadMasterDataMappings(organizationId: string): Promise<Map<string, any>> {
    const mappings = new Map()

    // Load customer -> AR account mappings
    const { data: customerMappings } = await supabaseAdmin
      .from('core_relationships')
      .select(
        `
        from_entity:from_entity_id(id, entity_code, entity_name),
        to_entity:to_entity_id(id, entity_code, entity_name)
      `
      )
      .eq('organization_id', organizationId)
      .eq('relationship_type', 'has_ar_account')

    customerMappings?.forEach(mapping => {
      if (mapping.from_entity && mapping.to_entity) {
        mappings.set(
          `customer.${mapping.from_entity.entity_code}.ar_control`,
          mapping.to_entity.entity_code
        )
      }
    })

    // Load product -> revenue account mappings
    const { data: productMappings } = await supabaseAdmin
      .from('core_relationships')
      .select(
        `
        from_entity:from_entity_id(id, entity_code, entity_name),
        to_entity:to_entity_id(id, entity_code, entity_name)
      `
      )
      .eq('organization_id', organizationId)
      .eq('relationship_type', 'has_revenue_account')

    productMappings?.forEach(mapping => {
      if (mapping.from_entity && mapping.to_entity) {
        mappings.set(
          `product.${mapping.from_entity.entity_code}.revenue_account`,
          mapping.to_entity.entity_code
        )
      }
    })

    // Add more mappings as needed...

    return mappings
  }

  /**
   * Save a posting rule to core_dynamic_data
   */
  static async savePostingRule(organizationId: string, rule: PostingRule): Promise<void> {
    const { error } = await supabaseAdmin.from('core_dynamic_data').insert({
      organization_id: organizationId,
      entity_id: organizationId, // Use org ID as entity for now
      field_name: 'posting_rule',
      field_type: rule.smart_code,
      field_value_json: rule,
      smart_code: 'HERA.DNA.FINANCE.POSTING_RULE.v1',
      ai_confidence: 1.0
    })

    if (error) {
      throw new Error(`Failed to save posting rule: ${error.message}`)
    }
  }

  /**
   * Initialize default posting rules for an organization
   */
  static async initializeDefaultRules(
    organizationId: string,
    industryType: 'restaurant' | 'salon' | 'retail' | 'manufacturing'
  ): Promise<void> {
    // Import default rules based on industry
    const defaultRules = await import('./posting-rules/' + industryType)

    for (const rule of defaultRules.POSTING_RULES) {
      await this.savePostingRule(organizationId, rule)
    }
  }

  /**
   * Create a journal entry from a universal finance event
   */
  static async createJournalEntry(
    event: UniversalFinanceEvent,
    glLines: UniversalFinanceLine[]
  ): Promise<string> {
    // Create the journal header
    const { data: journal, error: headerError } = await supabaseAdmin
      .from('universal_transactions')
      .insert({
        organization_id: event.organization_id,
        transaction_type: 'journal_entry',
        transaction_code: `JE-${event.origin_txn_id}`,
        transaction_date: event.event_time,
        total_amount: glLines.reduce((sum, line) => sum + line.dr, 0),
        transaction_currency_code: event.currency,
        base_currency_code: event.currency,
        exchange_rate: 1.0,
        smart_code: 'HERA.FIN.GL.TXN.AUTO_POST.v1',
        metadata: {
          source_smart_code: event.smart_code,
          source_system: event.source_system,
          origin_txn_id: event.origin_txn_id,
          ai_confidence: event.ai_confidence,
          posted_at: new Date().toISOString(),
          posted_by: 'Finance DNA Engine'
        }
      })
      .select()
      .single()

    if (headerError || !journal) {
      throw new Error(`Failed to create journal header: ${headerError?.message}`)
    }

    // Create journal lines
    const lineItems = glLines.map((line, index) => ({
      organization_id: event.organization_id,
      transaction_id: journal.id,
      line_number: index + 1,
      line_type: 'journal_line',
      line_entity_id: line.entity_id,
      description: line.role,
      quantity: 1,
      unit_amount: line.dr || line.cr,
      line_amount: line.dr || line.cr,
      smart_code: 'HERA.FIN.GL.LINE.AUTO_POST.v1',
      line_data: {
        account_code: line.entity_id,
        debit: line.dr,
        credit: line.cr,
        role: line.role,
        relationships: line.relationships,
        metadata: line.metadata
      }
    }))

    const { error: linesError } = await supabaseAdmin
      .from('universal_transaction_lines')
      .insert(lineItems)

    if (linesError) {
      // Rollback header on line failure
      await supabaseAdmin.from('universal_transactions').delete().eq('id', journal.id)

      throw new Error(`Failed to create journal lines: ${linesError.message}`)
    }

    return journal.transaction_code
  }
}

/**
 * Finance DNA Activation Service
 * One-time setup when enabling Finance DNA for an organization
 */
export class FinanceDNAActivation {
  static async activate(
    organizationId: string,
    options: {
      industryType: 'restaurant' | 'salon' | 'retail' | 'manufacturing'
      country: string
      currency: string
    }
  ): Promise<void> {
    console.log(`Activating Finance DNA for org ${organizationId}...`)

    // 1. Update organization settings with activation matrix
    const { data: org } = await supabaseAdmin
      .from('core_organizations')
      .select('settings')
      .eq('id', organizationId)
      .single()

    const settings = org?.settings || {}
    settings.finance_dna = {
      modules_enabled: { SD: true, MM: true, HR: true, FI: true },
      finance_policy: {
        default_coa_id: `COA-${options.industryType.toUpperCase()}-${options.country}`,
        tax_profile_id: `TAX-${options.country}-STANDARD`,
        fx_source: 'ECB',
        base_currency: options.currency
      },
      finance_dna_activated: true,
      finance_dna_version: '1.0',
      activated_at: new Date().toISOString()
    }

    const { error: updateError } = await supabaseAdmin
      .from('core_organizations')
      .update({ settings })
      .eq('id', organizationId)

    if (updateError) {
      throw new Error(`Failed to update org metadata: ${updateError.message}`)
    }

    // 2. Initialize default posting rules
    await FinanceDNALoader.initializeDefaultRules(organizationId, options.industryType)

    // 3. Create initial COA if needed
    const { data: existingCOA } = await supabaseAdmin
      .from('core_entities')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'gl_account')
      .limit(1)

    if (!existingCOA || existingCOA.length === 0) {
      // No COA exists, create from template
      console.log(`Creating default COA for ${options.industryType}...`)
      // Implementation would load COA template and create accounts
    }

    console.log(`Finance DNA activated successfully for org ${organizationId}`)
  }
}
