/**
 * HERA Salon Finance Posting Rules - UAE (AE)
 * 
 * Policy-as-data configuration for Auto-Posting Engine (APE)
 * Stored in core_dynamic_data under organization finance settings
 * 
 * UAE-specific: 5% VAT, AED currency, UAE GAAP compliance
 */

import { heraCode } from '@/lib/smart-codes'

export interface PostingRule {
  smart_code: string
  rule_name: string
  description: string
  debit_accounts: string[]
  credit_accounts: string[]
  vat_handling?: {
    vat_rate: number
    vat_account: string
    vat_inclusive: boolean
  }
  splits?: Array<{
    account: string
    percentage?: number
    fixed_amount?: number
    condition?: string
  }>
  conditions?: string[]
}

export interface FinanceRulesConfig {
  country_code: string
  currency_code: string
  vat_config: {
    standard_rate: number
    zero_rate: number
    vat_payable_account: string
    vat_receivable_account: string
    inclusive_default: boolean
  }
  posting_rules: PostingRule[]
  account_mapping: Record<string, string>
}

/**
 * UAE Salon Finance Rules Configuration
 * Smart Code: HERA.SALON.FINANCE.RULES.UAE.CONFIG.V1
 */
export const UAE_SALON_FINANCE_RULES: FinanceRulesConfig = {
  country_code: 'AE',
  currency_code: 'AED',
  
  vat_config: {
    standard_rate: 0.05, // 5% UAE VAT
    zero_rate: 0.0,
    vat_payable_account: '2250000', // VAT Payable
    vat_receivable_account: '1450000', // VAT Receivable  
    inclusive_default: true
  },
  
  posting_rules: [
    // POS Daily Summary
    {
      smart_code: heraCode('HERA.SALON.FINANCE.TXN.POS.DAILY_SUMMARY.V1'),
      rule_name: 'POS Daily Summary',
      description: 'End-of-day POS summary with sales, VAT, tips, and fees',
      debit_accounts: ['1100000', '5200000'], // Cash/Bank, Card Processing Fees
      credit_accounts: ['4100000', '2250000', '2350000'], // Sales Revenue, VAT Payable, Tips Payable
      vat_handling: {
        vat_rate: 0.05,
        vat_account: '2250000',
        vat_inclusive: true
      },
      splits: [
        { account: '1100000', condition: 'cash_collected' }, // Cash to Cash account
        { account: '1200000', condition: 'card_settlement' }, // Cards to Bank account
        { account: '5200000', condition: 'fees' }, // Processing fees
        { account: '4100000', condition: 'gross_sales_ex_vat' }, // Sales revenue (ex-VAT)
        { account: '2250000', condition: 'vat' }, // VAT Payable
        { account: '2350000', condition: 'tips' } // Tips Payable
      ]
    },
    
    // Staff Salary
    {
      smart_code: heraCode('HERA.SALON.FINANCE.TXN.EXPENSE.SALARY.V1'),
      rule_name: 'Staff Salary Payment',
      description: 'Monthly salary payment to salon staff',
      debit_accounts: ['6100000'], // Wages & Salaries
      credit_accounts: ['1200000'], // Bank Account
      conditions: ['total_amount > 0']
    },
    
    // Staff Commission
    {
      smart_code: heraCode('HERA.SALON.FINANCE.TXN.EXPENSE.COMMISSION.V1'),
      rule_name: 'Staff Commission Payment',
      description: 'Commission payment to stylists and therapists',
      debit_accounts: ['6150000'], // Commission Expense
      credit_accounts: ['1200000'], // Bank Account
      conditions: ['total_amount > 0']
    },
    
    // Rent Expense
    {
      smart_code: heraCode('HERA.SALON.FINANCE.TXN.EXPENSE.RENT.V1'),
      rule_name: 'Salon Rent Payment',
      description: 'Monthly rent payment for salon premises',
      debit_accounts: ['6300000'], // Rent Expense
      credit_accounts: ['1200000'], // Bank Account
      conditions: ['total_amount > 0']
    },
    
    // Utilities
    {
      smart_code: heraCode('HERA.SALON.FINANCE.TXN.EXPENSE.UTILITIES.V1'),
      rule_name: 'Utilities Payment',
      description: 'Electricity, water, internet, phone bills',
      debit_accounts: ['6400000'], // Utilities Expense
      credit_accounts: ['1200000'], // Bank Account
      conditions: ['total_amount > 0']
    },
    
    // Salon Supplies
    {
      smart_code: heraCode('HERA.SALON.FINANCE.TXN.EXPENSE.SUPPLIES.V1'),
      rule_name: 'Salon Supplies Purchase',
      description: 'Hair products, tools, consumables',
      debit_accounts: ['6500000'], // Supplies Expense
      credit_accounts: ['1200000', '2100000'], // Bank or Accounts Payable
      vat_handling: {
        vat_rate: 0.05,
        vat_account: '1450000', // VAT Receivable (input VAT)
        vat_inclusive: false
      }
    },
    
    // Marketing & Advertising
    {
      smart_code: heraCode('HERA.SALON.FINANCE.TXN.EXPENSE.MARKETING.V1'),
      rule_name: 'Marketing & Advertising',
      description: 'Social media ads, promotions, website costs',
      debit_accounts: ['6600000'], // Marketing Expense
      credit_accounts: ['1200000'], // Bank Account
      vat_handling: {
        vat_rate: 0.05,
        vat_account: '1450000',
        vat_inclusive: false
      }
    },
    
    // Insurance
    {
      smart_code: heraCode('HERA.SALON.FINANCE.TXN.EXPENSE.INSURANCE.V1'),
      rule_name: 'Insurance Premium',
      description: 'Professional liability, property insurance',
      debit_accounts: ['6700000'], // Insurance Expense
      credit_accounts: ['1200000'], // Bank Account
      conditions: ['total_amount > 0']
    },
    
    // Equipment Maintenance
    {
      smart_code: heraCode('HERA.SALON.FINANCE.TXN.EXPENSE.MAINTENANCE.V1'),
      rule_name: 'Equipment Maintenance',
      description: 'Salon chair repairs, equipment servicing',
      debit_accounts: ['6800000'], // Maintenance Expense
      credit_accounts: ['1200000'], // Bank Account
      vat_handling: {
        vat_rate: 0.05,
        vat_account: '1450000',
        vat_inclusive: false
      }
    },
    
    // Bank Fees
    {
      smart_code: heraCode('HERA.SALON.FINANCE.TXN.BANK.FEE.V1'),
      rule_name: 'Bank Fees',
      description: 'Account fees, transaction fees, card processing',
      debit_accounts: ['6900000'], // Bank Charges
      credit_accounts: ['1200000'], // Bank Account
      conditions: ['total_amount > 0']
    },
    
    // Service Revenue (individual service sale)
    {
      smart_code: heraCode('HERA.SALON.FINANCE.TXN.REVENUE.SERVICE.V1'),
      rule_name: 'Service Revenue',
      description: 'Individual service sale (haircut, color, etc.)',
      debit_accounts: ['1100000', '1200000'], // Cash or Bank
      credit_accounts: ['4100000', '2250000'], // Service Revenue, VAT Payable
      vat_handling: {
        vat_rate: 0.05,
        vat_account: '2250000',
        vat_inclusive: true
      }
    },
    
    // Product Revenue
    {
      smart_code: heraCode('HERA.SALON.FINANCE.TXN.REVENUE.PRODUCT.V1'),
      rule_name: 'Product Revenue',
      description: 'Hair care product sales',
      debit_accounts: ['1100000', '1200000'], // Cash or Bank
      credit_accounts: ['4200000', '2250000'], // Product Revenue, VAT Payable
      vat_handling: {
        vat_rate: 0.05,
        vat_account: '2250000',
        vat_inclusive: true
      }
    }
  ],
  
  // Account mapping for dynamic account resolution
  account_mapping: {
    // Asset accounts
    cash: '1100000',
    bank: '1200000',
    petty_cash: '1150000',
    vat_receivable: '1450000',
    
    // Liability accounts
    accounts_payable: '2100000',
    vat_payable: '2250000',
    tips_payable: '2350000',
    wages_payable: '2400000',
    commission_payable: '2450000',
    
    // Revenue accounts
    service_revenue: '4100000',
    product_revenue: '4200000',
    
    // Expense accounts
    wages_salaries: '6100000',
    commission_expense: '6150000',
    rent_expense: '6300000',
    utilities_expense: '6400000',
    supplies_expense: '6500000',
    marketing_expense: '6600000',
    insurance_expense: '6700000',
    maintenance_expense: '6800000',
    bank_charges: '6900000',
    card_processing_fees: '5200000'
  }
}

/**
 * Seed function to create finance rules in HERA
 * Stores rules as dynamic data on organization
 */
export async function seedUAESalonFinanceRules(organizationId: string) {
  // Import API client
  const { apiV2 } = await import('@/lib/client/fetchV2')
  
  try {
    console.log('🇦🇪 Seeding UAE Salon Finance Rules...')
    
    // Create finance config entity for the organization
    const { data: configEntity } = await apiV2.post('entities', {
      organization_id: organizationId,
      entity_type: 'finance_config',
      entity_name: 'UAE Salon Finance Configuration',
      entity_code: 'FIN-CONFIG-UAE-SALON',
      smart_code: heraCode('HERA.SALON.FINANCE.CONFIG.UAE.V1'),
      metadata: {
        country_code: 'AE',
        config_type: 'posting_rules'
      }
    })
    
    if (!configEntity?.id) {
      throw new Error('Failed to create finance config entity')
    }
    
    console.log(`✅ Created finance config entity: ${configEntity.id}`)
    
    // Store the complete rules configuration as dynamic data
    const { data: rulesData } = await apiV2.post('entities/dynamic-data', {
      entity_id: configEntity.id,
      field_name: 'posting_rules_config',
      field_type: 'json',
      field_value_json: UAE_SALON_FINANCE_RULES,
      smart_code: heraCode('HERA.SALON.FINANCE.RULES.UAE.CONFIG.V1'),
      field_description: 'Complete posting rules configuration for UAE salon operations'
    })
    
    console.log('✅ Stored posting rules configuration')
    
    // Store VAT configuration separately for quick access
    const { data: vatData } = await apiV2.post('entities/dynamic-data', {
      entity_id: configEntity.id,
      field_name: 'vat_config',
      field_type: 'json',
      field_value_json: UAE_SALON_FINANCE_RULES.vat_config,
      smart_code: heraCode('HERA.SALON.FINANCE.VAT.UAE.CONFIG.V1'),
      field_description: 'UAE VAT configuration - 5% standard rate'
    })
    
    console.log('✅ Stored VAT configuration')
    
    // Store account mapping
    const { data: accountData } = await apiV2.post('entities/dynamic-data', {
      entity_id: configEntity.id,
      field_name: 'account_mapping',
      field_type: 'json',
      field_value_json: UAE_SALON_FINANCE_RULES.account_mapping,
      smart_code: heraCode('HERA.SALON.FINANCE.MAPPING.UAE.V1'),
      field_description: 'Account code mapping for dynamic account resolution'
    })
    
    console.log('✅ Stored account mapping')
    
    return {
      success: true,
      config_entity_id: configEntity.id,
      rules_count: UAE_SALON_FINANCE_RULES.posting_rules.length,
      message: 'UAE Salon Finance Rules seeded successfully'
    }
    
  } catch (error) {
    console.error('❌ Error seeding UAE salon finance rules:', error)
    throw error
  }
}

// Export for CLI usage
if (require.main === module) {
  const organizationId = process.argv[2]
  if (!organizationId) {
    console.error('Usage: node finance-rules.salon.ae.js <organization_id>')
    process.exit(1)
  }
  
  seedUAESalonFinanceRules(organizationId)
    .then(result => {
      console.log('🎉 UAE Salon Finance Rules seeded:', result)
      process.exit(0)
    })
    .catch(error => {
      console.error('💥 Seeding failed:', error)
      process.exit(1)
    })
}