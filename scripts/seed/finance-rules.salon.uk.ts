/**
 * HERA Salon Finance Posting Rules - United Kingdom (UK)
 * 
 * Policy-as-data configuration for Auto-Posting Engine (APE)
 * Stored in core_dynamic_data under organization finance settings
 * 
 * UK-specific: 20% VAT, GBP currency, UK GAAP compliance
 */

import { heraCode } from '@/lib/smart-codes'
import { FinanceRulesConfig, PostingRule } from './finance-rules.salon.ae'

/**
 * UK Salon Finance Rules Configuration
 * Smart Code: HERA.SALON.FINANCE.RULES.UK.CONFIG.V1
 */
export const UK_SALON_FINANCE_RULES: FinanceRulesConfig = {
  country_code: 'GB',
  currency_code: 'GBP',
  
  vat_config: {
    standard_rate: 0.20, // 20% UK VAT
    zero_rate: 0.0,
    vat_payable_account: '2250000', // VAT Payable
    vat_receivable_account: '1450000', // VAT Recoverable
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
        vat_rate: 0.20, // UK VAT rate
        vat_account: '2250000',
        vat_inclusive: true
      },
      splits: [
        { account: '1100000', condition: 'cash_collected' },
        { account: '1200000', condition: 'card_settlement' },
        { account: '5200000', condition: 'fees' },
        { account: '4100000', condition: 'gross_sales_ex_vat' },
        { account: '2250000', condition: 'vat' },
        { account: '2350000', condition: 'tips' }
      ]
    },
    
    // Staff Salary (UK-specific: PAYE, NI considerations)
    {
      smart_code: heraCode('HERA.SALON.FINANCE.TXN.EXPENSE.SALARY.V1'),
      rule_name: 'Staff Salary Payment',
      description: 'Monthly salary payment including PAYE/NI deductions',
      debit_accounts: ['6100000', '6110000', '6120000'], // Gross Wages, Employer NI, Pension
      credit_accounts: ['1200000', '2400000', '2410000', '2420000'], // Bank, PAYE, Employee NI, Pension
      conditions: ['total_amount > 0'],
      splits: [
        { account: '6100000', percentage: 0.85 }, // Gross wages ~85%
        { account: '6110000', percentage: 0.10 }, // Employer NI ~10%
        { account: '6120000', percentage: 0.05 }, // Pension contribution ~5%
        { account: '1200000', percentage: 0.70 }, // Net pay ~70%
        { account: '2400000', percentage: 0.20 }, // PAYE ~20%
        { account: '2410000', percentage: 0.10 } // Employee NI ~10%
      ]
    },
    
    // Commission (subject to PAYE)
    {
      smart_code: heraCode('HERA.SALON.FINANCE.TXN.EXPENSE.COMMISSION.V1'),
      rule_name: 'Staff Commission Payment',
      description: 'Commission payment subject to PAYE/NI',
      debit_accounts: ['6150000'], // Commission Expense
      credit_accounts: ['1200000', '2400000'], // Bank, PAYE Payable
      conditions: ['total_amount > 0']
    },
    
    // Business Rates (UK-specific local tax)
    {
      smart_code: heraCode('HERA.SALON.FINANCE.TXN.EXPENSE.RATES.V1'),
      rule_name: 'Business Rates Payment',
      description: 'Local authority business rates',
      debit_accounts: ['6350000'], // Business Rates Expense
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
      description: 'Gas, electricity, water bills',
      debit_accounts: ['6400000'], // Utilities Expense
      credit_accounts: ['1200000'], // Bank Account
      vat_handling: {
        vat_rate: 0.05, // Reduced rate for domestic fuel
        vat_account: '1450000',
        vat_inclusive: true
      }
    },
    
    // Professional Services (Accountant, Legal)
    {
      smart_code: heraCode('HERA.SALON.FINANCE.TXN.EXPENSE.PROFESSIONAL.V1'),
      rule_name: 'Professional Services',
      description: 'Accountant, solicitor, business advisor fees',
      debit_accounts: ['6750000'], // Professional Fees
      credit_accounts: ['1200000'], // Bank Account
      vat_handling: {
        vat_rate: 0.20,
        vat_account: '1450000',
        vat_inclusive: false
      }
    },
    
    // Salon Supplies (VAT recoverable)
    {
      smart_code: heraCode('HERA.SALON.FINANCE.TXN.EXPENSE.SUPPLIES.V1'),
      rule_name: 'Salon Supplies Purchase',
      description: 'Hair products, tools, consumables',
      debit_accounts: ['6500000', '1450000'], // Supplies Expense, VAT Recoverable
      credit_accounts: ['1200000', '2100000'], // Bank or Accounts Payable
      vat_handling: {
        vat_rate: 0.20,
        vat_account: '1450000',
        vat_inclusive: false
      }
    },
    
    // Marketing & Advertising
    {
      smart_code: heraCode('HERA.SALON.FINANCE.TXN.EXPENSE.MARKETING.V1'),
      rule_name: 'Marketing & Advertising',
      description: 'Digital marketing, social media, print ads',
      debit_accounts: ['6600000'], // Marketing Expense
      credit_accounts: ['1200000'], // Bank Account
      vat_handling: {
        vat_rate: 0.20,
        vat_account: '1450000',
        vat_inclusive: false
      }
    },
    
    // Insurance (typically VAT exempt)
    {
      smart_code: heraCode('HERA.SALON.FINANCE.TXN.EXPENSE.INSURANCE.V1'),
      rule_name: 'Insurance Premium',
      description: 'Public liability, professional indemnity',
      debit_accounts: ['6700000'], // Insurance Expense
      credit_accounts: ['1200000'], // Bank Account
      conditions: ['total_amount > 0'] // No VAT on insurance
    },
    
    // Equipment Maintenance
    {
      smart_code: heraCode('HERA.SALON.FINANCE.TXN.EXPENSE.MAINTENANCE.V1'),
      rule_name: 'Equipment Maintenance',
      description: 'Salon equipment repairs and servicing',
      debit_accounts: ['6800000'], // Maintenance Expense
      credit_accounts: ['1200000'], // Bank Account
      vat_handling: {
        vat_rate: 0.20,
        vat_account: '1450000',
        vat_inclusive: false
      }
    },
    
    // Bank Charges
    {
      smart_code: heraCode('HERA.SALON.FINANCE.TXN.BANK.FEE.V1'),
      rule_name: 'Bank Charges',
      description: 'Account fees, transaction fees',
      debit_accounts: ['6900000'], // Bank Charges
      credit_accounts: ['1200000'], // Bank Account
      conditions: ['total_amount > 0'] // VAT exempt
    },
    
    // Service Revenue
    {
      smart_code: heraCode('HERA.SALON.FINANCE.TXN.REVENUE.SERVICE.V1'),
      rule_name: 'Service Revenue',
      description: 'Hair and beauty services (VAT standard rate)',
      debit_accounts: ['1100000', '1200000'], // Cash or Bank
      credit_accounts: ['4100000', '2250000'], // Service Revenue, VAT Payable
      vat_handling: {
        vat_rate: 0.20,
        vat_account: '2250000',
        vat_inclusive: true
      }
    },
    
    // Product Revenue
    {
      smart_code: heraCode('HERA.SALON.FINANCE.TXN.REVENUE.PRODUCT.V1'),
      rule_name: 'Product Revenue',
      description: 'Hair care product retail sales',
      debit_accounts: ['1100000', '1200000'], // Cash or Bank
      credit_accounts: ['4200000', '2250000'], // Product Revenue, VAT Payable
      vat_handling: {
        vat_rate: 0.20,
        vat_account: '2250000',
        vat_inclusive: true
      }
    }
  ],
  
  // UK-specific account mapping
  account_mapping: {
    // Asset accounts
    cash: '1100000',
    bank: '1200000',
    petty_cash: '1150000',
    vat_recoverable: '1450000',
    
    // Liability accounts
    accounts_payable: '2100000',
    vat_payable: '2250000',
    tips_payable: '2350000',
    paye_payable: '2400000',
    ni_payable: '2410000',
    pension_payable: '2420000',
    
    // Revenue accounts
    service_revenue: '4100000',
    product_revenue: '4200000',
    
    // Expense accounts
    gross_wages: '6100000',
    employer_ni: '6110000',
    pension_employer: '6120000',
    commission_expense: '6150000',
    rent_expense: '6300000',
    business_rates: '6350000',
    utilities_expense: '6400000',
    supplies_expense: '6500000',
    marketing_expense: '6600000',
    insurance_expense: '6700000',
    professional_fees: '6750000',
    maintenance_expense: '6800000',
    bank_charges: '6900000',
    card_processing_fees: '5200000'
  }
}

/**
 * Seed function to create UK finance rules in HERA
 */
export async function seedUKSalonFinanceRules(organizationId: string) {
  const { apiV2 } = await import('@/lib/client/fetchV2')
  
  try {
    console.log('🇬🇧 Seeding UK Salon Finance Rules...')
    
    const { data: configEntity } = await apiV2.post('entities', {
      organization_id: organizationId,
      entity_type: 'finance_config',
      entity_name: 'UK Salon Finance Configuration',
      entity_code: 'FIN-CONFIG-UK-SALON',
      smart_code: heraCode('HERA.SALON.FINANCE.CONFIG.UK.V1'),
      metadata: {
        country_code: 'GB',
        config_type: 'posting_rules'
      }
    })
    
    if (!configEntity?.id) {
      throw new Error('Failed to create finance config entity')
    }
    
    console.log(`✅ Created finance config entity: ${configEntity.id}`)
    
    // Store posting rules
    await apiV2.post('entities/dynamic-data', {
      entity_id: configEntity.id,
      field_name: 'posting_rules_config',
      field_type: 'json',
      field_value_json: UK_SALON_FINANCE_RULES,
      smart_code: heraCode('HERA.SALON.FINANCE.RULES.UK.CONFIG.V1'),
      field_description: 'Complete posting rules configuration for UK salon operations'
    })
    
    // Store VAT configuration
    await apiV2.post('entities/dynamic-data', {
      entity_id: configEntity.id,
      field_name: 'vat_config',
      field_type: 'json',
      field_value_json: UK_SALON_FINANCE_RULES.vat_config,
      smart_code: heraCode('HERA.SALON.FINANCE.VAT.UK.CONFIG.V1'),
      field_description: 'UK VAT configuration - 20% standard rate, 5% utilities'
    })
    
    // Store account mapping
    await apiV2.post('entities/dynamic-data', {
      entity_id: configEntity.id,
      field_name: 'account_mapping',
      field_type: 'json',
      field_value_json: UK_SALON_FINANCE_RULES.account_mapping,
      smart_code: heraCode('HERA.SALON.FINANCE.MAPPING.UK.V1'),
      field_description: 'UK account code mapping with PAYE/NI accounts'
    })
    
    console.log('✅ UK Salon Finance Rules seeded successfully')
    
    return {
      success: true,
      config_entity_id: configEntity.id,
      rules_count: UK_SALON_FINANCE_RULES.posting_rules.length,
      message: 'UK Salon Finance Rules seeded successfully'
    }
    
  } catch (error) {
    console.error('❌ Error seeding UK salon finance rules:', error)
    throw error
  }
}

// Export for CLI usage
if (require.main === module) {
  const organizationId = process.argv[2]
  if (!organizationId) {
    console.error('Usage: node finance-rules.salon.uk.js <organization_id>')
    process.exit(1)
  }
  
  seedUKSalonFinanceRules(organizationId)
    .then(result => {
      console.log('🎉 UK Salon Finance Rules seeded:', result)
      process.exit(0)
    })
    .catch(error => {
      console.error('💥 Seeding failed:', error)
      process.exit(1)
    })
}