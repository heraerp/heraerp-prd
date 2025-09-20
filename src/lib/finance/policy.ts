/**
 * HERA Finance DNA - Sales Posting Policy Management
 * 
 * Manages finance posting policies stored as data in core_dynamic_data
 * following Finance DNA patterns.
 */

import { universalApi } from '@/lib/universal-api-v2'

interface SalesPostingPolicy {
  accounts: {
    service_revenue: string
    product_revenue: string
    vat_liability: string
    discounts_contra: string
    tips_payable: string
    cash_clearing: string
    card_clearing: string
    giftcard_liability: string
    rounding_diff: string
  }
  grouping: {
    by_branch: boolean
    by_tax_rate: boolean
  }
  include_cogs_from_inventory: boolean
}

interface ExpensePostingPolicy {
  accounts: {
    vat_recoverable_account: string
    accounts_payable_account: string
    default_cash_account: string
    default_bank_account: string
    default_credit_card_account: string
  }
  settings: {
    auto_vat_calculation: boolean
    default_vat_rate: number
    require_receipts: boolean
  }
}

interface GLAccount {
  id: string
  code: string
  name: string
  type: string
  ledger_type: string
  is_active: boolean
}

/**
 * Gets sales posting policy for organization
 */
export async function getSalesPostingPolicy(organization_id: string): Promise<SalesPostingPolicy | null> {
  try {
    universalApi.setOrganizationId(organization_id)

    const policyResponse = await universalApi.read({
      table: 'core_dynamic_data',
      filters: [
        { field: 'organization_id', operator: 'eq', value: organization_id },
        { field: 'smart_code', operator: 'eq', value: 'HERA.FINANCE.POLICY.SALES_POSTING.v1' }
      ]
    })

    const policyFields = policyResponse?.data || []
    
    if (policyFields.length === 0) {
      return null
    }

    // Convert dynamic fields to policy object
    const policy: any = {
      accounts: {},
      grouping: {},
      include_cogs_from_inventory: false
    }

    policyFields.forEach(field => {
      const path = field.field_name.split('.')
      let current = policy

      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {}
        }
        current = current[path[i]]
      }

      const value = field.field_value_text || 
                   field.field_value_boolean || 
                   field.field_value_number

      current[path[path.length - 1]] = value
    })

    return policy as SalesPostingPolicy

  } catch (error) {
    console.error('Error getting sales posting policy:', error)
    return null
  }
}

/**
 * Creates or updates sales posting policy
 */
export async function setSalesPostingPolicy(
  organization_id: string,
  policy: SalesPostingPolicy
): Promise<{ success: boolean; error?: string }> {
  try {
    universalApi.setOrganizationId(organization_id)

    // Delete existing policy fields
    const existingResponse = await universalApi.read({
      table: 'core_dynamic_data',
      filters: [
        { field: 'organization_id', operator: 'eq', value: organization_id },
        { field: 'smart_code', operator: 'eq', value: 'HERA.FINANCE.POLICY.SALES_POSTING.v1' }
      ]
    })

    const existing = existingResponse?.data || []
    for (const field of existing) {
      await universalApi.delete({
        table: 'core_dynamic_data',
        id: field.id
      })
    }

    // Create new policy fields
    const fieldsToCreate = [
      // Account mappings
      { field_name: 'accounts.service_revenue', field_value_text: policy.accounts.service_revenue },
      { field_name: 'accounts.product_revenue', field_value_text: policy.accounts.product_revenue },
      { field_name: 'accounts.vat_liability', field_value_text: policy.accounts.vat_liability },
      { field_name: 'accounts.discounts_contra', field_value_text: policy.accounts.discounts_contra },
      { field_name: 'accounts.tips_payable', field_value_text: policy.accounts.tips_payable },
      { field_name: 'accounts.cash_clearing', field_value_text: policy.accounts.cash_clearing },
      { field_name: 'accounts.card_clearing', field_value_text: policy.accounts.card_clearing },
      { field_name: 'accounts.giftcard_liability', field_value_text: policy.accounts.giftcard_liability },
      { field_name: 'accounts.rounding_diff', field_value_text: policy.accounts.rounding_diff },

      // Grouping settings
      { field_name: 'grouping.by_branch', field_value_boolean: policy.grouping.by_branch },
      { field_name: 'grouping.by_tax_rate', field_value_boolean: policy.grouping.by_tax_rate },

      // Other settings
      { field_name: 'include_cogs_from_inventory', field_value_boolean: policy.include_cogs_from_inventory }
    ]

    for (const field of fieldsToCreate) {
      await universalApi.create({
        table: 'core_dynamic_data',
        data: {
          organization_id,
          entity_id: organization_id, // Policy belongs to the organization
          smart_code: 'HERA.FINANCE.POLICY.SALES_POSTING.v1',
          ...field
        }
      })
    }

    return { success: true }

  } catch (error) {
    console.error('Error setting sales posting policy:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Gets expense posting policy for organization
 */
export async function getExpensePostingPolicy(organization_id: string): Promise<ExpensePostingPolicy | null> {
  try {
    universalApi.setOrganizationId(organization_id)

    const policyResponse = await universalApi.read({
      table: 'core_dynamic_data',
      filters: [
        { field: 'organization_id', operator: 'eq', value: organization_id },
        { field: 'smart_code', operator: 'eq', value: 'HERA.FINANCE.POLICY.EXPENSE_POSTING.v1' }
      ]
    })

    const policyFields = policyResponse?.data || []
    
    if (policyFields.length === 0) {
      return null
    }

    // Convert dynamic fields to policy object
    const policy: any = {
      accounts: {},
      settings: {}
    }

    policyFields.forEach(field => {
      const path = field.field_name.split('.')
      let current = policy

      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {}
        }
        current = current[path[i]]
      }

      const value = field.field_value_text || 
                   field.field_value_boolean || 
                   field.field_value_number

      current[path[path.length - 1]] = value
    })

    return policy as ExpensePostingPolicy

  } catch (error) {
    console.error('Error getting expense posting policy:', error)
    return null
  }
}

/**
 * Gets GL accounts for organization
 */
export async function getGLAccounts(organization_id: string): Promise<GLAccount[]> {
  try {
    universalApi.setOrganizationId(organization_id)

    const accountsResponse = await universalApi.read({
      table: 'core_entities',
      filters: [
        { field: 'organization_id', operator: 'eq', value: organization_id },
        { field: 'entity_type', operator: 'eq', value: 'account' }
      ]
    })

    const accounts = accountsResponse?.data || []
    
    // Get dynamic data for accounts
    const accountIds = accounts.map(a => a.id)
    if (accountIds.length === 0) return []

    const dynamicResponse = await universalApi.read({
      table: 'core_dynamic_data',
      filters: [
        { field: 'organization_id', operator: 'eq', value: organization_id },
        { field: 'entity_id', operator: 'in', value: accountIds },
        { field: 'field_name', operator: 'in', value: ['ledger_type', 'account_type', 'is_active'] }
      ]
    })

    const dynamicFields = dynamicResponse?.data || []

    return accounts.map(account => {
      const accountFields = dynamicFields.filter(f => f.entity_id === account.id)
      const fieldMap: any = {}
      
      accountFields.forEach(field => {
        fieldMap[field.field_name] = field.field_value_text || 
                                    field.field_value_boolean || 
                                    field.field_value_number
      })

      return {
        id: account.id,
        code: account.entity_code || '',
        name: account.entity_name,
        type: fieldMap.account_type || 'unknown',
        ledger_type: fieldMap.ledger_type || 'GL',
        is_active: fieldMap.is_active !== false
      }
    }).filter(account => account.ledger_type === 'GL' && account.is_active)

  } catch (error) {
    console.error('Error getting GL accounts:', error)
    return []
  }
}

/**
 * Gets suggested account mappings based on account names and types
 */
export async function getSuggestedAccountMappings(organization_id: string): Promise<Partial<SalesPostingPolicy['accounts']>> {
  try {
    const accounts = await getGLAccounts(organization_id)
    const suggestions: Partial<SalesPostingPolicy['accounts']> = {}

    // Helper to find account by name pattern
    const findAccount = (patterns: string[]) => {
      return accounts.find(account => 
        patterns.some(pattern => 
          account.name.toLowerCase().includes(pattern.toLowerCase()) ||
          account.code.toLowerCase().includes(pattern.toLowerCase())
        )
      )
    }

    // Revenue accounts
    const serviceRevenue = findAccount(['service revenue', 'service sales', 'salon revenue', '4100', '4110'])
    if (serviceRevenue) suggestions.service_revenue = serviceRevenue.id

    const productRevenue = findAccount(['product revenue', 'product sales', 'retail sales', '4200', '4210'])
    if (productRevenue) suggestions.product_revenue = productRevenue.id

    // Liability accounts
    const vatLiability = findAccount(['vat payable', 'sales tax payable', 'tax liability', '2200', '2210'])
    if (vatLiability) suggestions.vat_liability = vatLiability.id

    const tipsPayable = findAccount(['tips payable', 'gratuities payable', 'tips liability', '2300'])
    if (tipsPayable) suggestions.tips_payable = tipsPayable.id

    const giftcardLiability = findAccount(['gift card liability', 'voucher liability', '2400'])
    if (giftcardLiability) suggestions.giftcard_liability = giftcardLiability.id

    // Asset/clearing accounts
    const cashClearing = findAccount(['cash', 'cash on hand', 'petty cash', '1100', '1110'])
    if (cashClearing) suggestions.cash_clearing = cashClearing.id

    const cardClearing = findAccount(['credit card clearing', 'card receivable', 'payment processor', '1200', '1210'])
    if (cardClearing) suggestions.card_clearing = cardClearing.id

    // Contra revenue
    const discountsContra = findAccount(['discounts', 'sales discounts', 'promotional discounts', '4900', '4910'])
    if (discountsContra) suggestions.discounts_contra = discountsContra.id

    // Rounding
    const roundingDiff = findAccount(['rounding', 'miscellaneous', 'other income', '4950', '6900'])
    if (roundingDiff) suggestions.rounding_diff = roundingDiff.id

    return suggestions

  } catch (error) {
    console.error('Error getting suggested account mappings:', error)
    return {}
  }
}

/**
 * Validates that all required accounts exist and are active
 */
export async function validateSalesPostingPolicy(
  organization_id: string,
  policy: SalesPostingPolicy
): Promise<{ isValid: boolean; errors: string[] }> {
  try {
    const accounts = await getGLAccounts(organization_id)
    const accountIds = accounts.map(a => a.id)
    const errors: string[] = []

    // Check each required account
    const requiredAccounts = [
      { field: 'service_revenue', name: 'Service Revenue' },
      { field: 'product_revenue', name: 'Product Revenue' },
      { field: 'vat_liability', name: 'VAT Liability' },
      { field: 'discounts_contra', name: 'Discounts Contra' },
      { field: 'tips_payable', name: 'Tips Payable' },
      { field: 'cash_clearing', name: 'Cash Clearing' },
      { field: 'card_clearing', name: 'Card Clearing' },
      { field: 'giftcard_liability', name: 'Gift Card Liability' },
      { field: 'rounding_diff', name: 'Rounding Difference' }
    ]

    for (const account of requiredAccounts) {
      const accountId = policy.accounts[account.field as keyof typeof policy.accounts]
      if (!accountId) {
        errors.push(`${account.name} account is required`)
      } else if (!accountIds.includes(accountId)) {
        errors.push(`${account.name} account does not exist or is inactive`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }

  } catch (error) {
    console.error('Error validating sales posting policy:', error)
    return {
      isValid: false,
      errors: ['Error validating policy']
    }
  }
}

/**
 * Creates default sales posting policy with auto-mapped accounts
 */
export async function createDefaultSalesPostingPolicy(organization_id: string): Promise<{
  success: boolean
  policy?: SalesPostingPolicy
  error?: string
}> {
  try {
    const suggestions = await getSuggestedAccountMappings(organization_id)
    
    // Create minimal policy structure
    const policy: SalesPostingPolicy = {
      accounts: {
        service_revenue: suggestions.service_revenue || '',
        product_revenue: suggestions.product_revenue || '',
        vat_liability: suggestions.vat_liability || '',
        discounts_contra: suggestions.discounts_contra || '',
        tips_payable: suggestions.tips_payable || '',
        cash_clearing: suggestions.cash_clearing || '',
        card_clearing: suggestions.card_clearing || '',
        giftcard_liability: suggestions.giftcard_liability || '',
        rounding_diff: suggestions.rounding_diff || ''
      },
      grouping: {
        by_branch: true,
        by_tax_rate: true
      },
      include_cogs_from_inventory: false
    }

    // Validate the policy
    const validation = await validateSalesPostingPolicy(organization_id, policy)
    
    if (!validation.isValid) {
      return {
        success: false,
        error: `Cannot create default policy: ${validation.errors.join(', ')}`
      }
    }

    // Save the policy
    const result = await setSalesPostingPolicy(organization_id, policy)
    
    if (result.success) {
      return {
        success: true,
        policy
      }
    } else {
      return result
    }

  } catch (error) {
    console.error('Error creating default sales posting policy:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}