/**
 * HERA Chart of Accounts - UK Salon
 * 
 * UK-compliant COA for salon operations
 * Stored as core_entities with entity_type='account'
 * IFRS-compliant structure with UK-specific requirements
 */

import { heraCode } from '@/lib/smart-codes'
import { GLAccount } from './coa.ae'

/**
 * UK Salon Chart of Accounts
 * Smart Code: HERA.ACCOUNTING.COA.UK.SALON.V1
 * 
 * UK-specific considerations:
 * - PAYE/National Insurance accounts
 * - Business Rates (local tax)
 * - Professional fees (accountant, solicitor)
 * - 20% VAT standard rate
 */
export const UK_SALON_COA: GLAccount[] = [
  // ===== ASSETS =====
  {
    account_code: '1000000',
    account_name: 'ASSETS',
    account_type: 'assets',
    account_category: 'header',
    allow_posting: false,
    description: 'Total Assets',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.ASSET.HEADER.V1'),
    ifrs_classification: 'Assets',
    statement_mapping: 'SFP'
  },
  
  // Current Assets
  {
    account_code: '1100000',
    account_name: 'CURRENT ASSETS',
    account_type: 'assets',
    account_category: 'header',
    parent_account_code: '1000000',
    allow_posting: false,
    description: 'Current Assets',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.ASSET.CURRENT.HEADER.V1'),
    ifrs_classification: 'Current Assets',
    statement_mapping: 'SFP'
  },
  {
    account_code: '1100000',
    account_name: 'Cash on Hand',
    account_type: 'assets',
    account_category: 'cash',
    parent_account_code: '1100000',
    allow_posting: true,
    description: 'Till cash and cash register',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.ASSET.CASH.V1'),
    ifrs_classification: 'Cash and Cash Equivalents',
    statement_mapping: 'SFP'
  },
  {
    account_code: '1150000',
    account_name: 'Petty Cash',
    account_type: 'assets',
    account_category: 'cash',
    parent_account_code: '1100000',
    allow_posting: true,
    description: 'Small cash fund for minor expenses',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.ASSET.PETTY_CASH.V1'),
    ifrs_classification: 'Cash and Cash Equivalents',
    statement_mapping: 'SFP'
  },
  {
    account_code: '1200000',
    account_name: 'Business Bank Account',
    account_type: 'assets',
    account_category: 'bank',
    parent_account_code: '1100000',
    allow_posting: true,
    description: 'Primary business bank account',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.ASSET.BANK.V1'),
    ifrs_classification: 'Cash and Cash Equivalents',
    statement_mapping: 'SFP'
  },
  {
    account_code: '1300000',
    account_name: 'Trade Debtors',
    account_type: 'assets',
    account_category: 'receivables',
    parent_account_code: '1100000',
    allow_posting: true,
    description: 'Amounts owed by customers',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.ASSET.AR.V1'),
    ifrs_classification: 'Trade and Other Receivables',
    statement_mapping: 'SFP'
  },
  {
    account_code: '1400000',
    account_name: 'Stock - Hair Products',
    account_type: 'assets',
    account_category: 'inventory',
    parent_account_code: '1100000',
    allow_posting: true,
    description: 'Hair care products for resale',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.ASSET.INVENTORY.V1'),
    ifrs_classification: 'Inventories',
    statement_mapping: 'SFP'
  },
  {
    account_code: '1450000',
    account_name: 'VAT Recoverable',
    account_type: 'assets',
    account_category: 'vat',
    parent_account_code: '1100000',
    allow_posting: true,
    description: 'Input VAT to be recovered from HMRC',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.ASSET.VAT_RECOVERABLE.V1'),
    ifrs_classification: 'Current Tax Assets',
    statement_mapping: 'SFP'
  },
  {
    account_code: '1470000',
    account_name: 'Prepayments',
    account_type: 'assets',
    account_category: 'prepayments',
    parent_account_code: '1100000',
    allow_posting: true,
    description: 'Expenses paid in advance',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.ASSET.PREPAYMENTS.V1'),
    ifrs_classification: 'Other Current Assets',
    statement_mapping: 'SFP'
  },
  
  // Fixed Assets
  {
    account_code: '1500000',
    account_name: 'FIXED ASSETS',
    account_type: 'assets',
    account_category: 'header',
    parent_account_code: '1000000',
    allow_posting: false,
    description: 'Fixed Assets',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.ASSET.FIXED.HEADER.V1'),
    ifrs_classification: 'Non-current Assets',
    statement_mapping: 'SFP'
  },
  {
    account_code: '1600000',
    account_name: 'Salon Equipment - Cost',
    account_type: 'assets',
    account_category: 'ppe',
    parent_account_code: '1500000',
    allow_posting: true,
    description: 'Salon chairs, dryers, styling equipment at cost',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.ASSET.PPE.V1'),
    ifrs_classification: 'Property, Plant and Equipment',
    statement_mapping: 'SFP'
  },
  {
    account_code: '1650000',
    account_name: 'Salon Equipment - Depreciation',
    account_type: 'assets',
    account_category: 'accumulated_depreciation',
    parent_account_code: '1500000',
    allow_posting: true,
    description: 'Accumulated depreciation on salon equipment',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.ASSET.ACCUM_DEPR.V1'),
    ifrs_classification: 'Property, Plant and Equipment',
    statement_mapping: 'SFP'
  },
  
  // ===== LIABILITIES =====
  {
    account_code: '2000000',
    account_name: 'LIABILITIES',
    account_type: 'liabilities',
    account_category: 'header',
    allow_posting: false,
    description: 'Total Liabilities',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.LIAB.HEADER.V1'),
    ifrs_classification: 'Liabilities',
    statement_mapping: 'SFP'
  },
  
  // Current Liabilities
  {
    account_code: '2100000',
    account_name: 'Trade Creditors',
    account_type: 'liabilities',
    account_category: 'payables',
    parent_account_code: '2000000',
    allow_posting: true,
    description: 'Amounts owed to suppliers',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.LIAB.AP.V1'),
    ifrs_classification: 'Trade and Other Payables',
    statement_mapping: 'SFP'
  },
  {
    account_code: '2200000',
    account_name: 'Accruals',
    account_type: 'liabilities',
    account_category: 'accruals',
    parent_account_code: '2000000',
    allow_posting: true,
    description: 'Expenses incurred but not yet invoiced',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.LIAB.ACCRUED.V1'),
    ifrs_classification: 'Trade and Other Payables',
    statement_mapping: 'SFP'
  },
  {
    account_code: '2250000',
    account_name: 'VAT Payable',
    account_type: 'liabilities',
    account_category: 'vat',
    parent_account_code: '2000000',
    allow_posting: true,
    description: 'Output VAT to be paid to HMRC',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.LIAB.VAT_PAYABLE.V1'),
    ifrs_classification: 'Current Tax Liabilities',
    statement_mapping: 'SFP'
  },
  {
    account_code: '2350000',
    account_name: 'Tips Payable',
    account_type: 'liabilities',
    account_category: 'payroll',
    parent_account_code: '2000000',
    allow_posting: true,
    description: 'Tips owed to staff',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.LIAB.TIPS.V1'),
    ifrs_classification: 'Trade and Other Payables',
    statement_mapping: 'SFP'
  },
  {
    account_code: '2400000',
    account_name: 'PAYE/Tax Payable',
    account_type: 'liabilities',
    account_category: 'payroll',
    parent_account_code: '2000000',
    allow_posting: true,
    description: 'PAYE income tax owed to HMRC',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.LIAB.PAYE.V1'),
    ifrs_classification: 'Current Tax Liabilities',
    statement_mapping: 'SFP'
  },
  {
    account_code: '2410000',
    account_name: 'National Insurance Payable',
    account_type: 'liabilities',
    account_category: 'payroll',
    parent_account_code: '2000000',
    allow_posting: true,
    description: 'Employee and employer NI owed to HMRC',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.LIAB.NI.V1'),
    ifrs_classification: 'Trade and Other Payables',
    statement_mapping: 'SFP'
  },
  {
    account_code: '2420000',
    account_name: 'Pension Contributions Payable',
    account_type: 'liabilities',
    account_category: 'payroll',
    parent_account_code: '2000000',
    allow_posting: true,
    description: 'Auto-enrolment pension contributions',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.LIAB.PENSION.V1'),
    ifrs_classification: 'Trade and Other Payables',
    statement_mapping: 'SFP'
  },
  {
    account_code: '2450000',
    account_name: 'Wages Payable',
    account_type: 'liabilities',
    account_category: 'payroll',
    parent_account_code: '2000000',
    allow_posting: true,
    description: 'Accrued wages and salaries',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.LIAB.WAGES.V1'),
    ifrs_classification: 'Trade and Other Payables',
    statement_mapping: 'SFP'
  },
  
  // ===== CAPITAL & RESERVES =====
  {
    account_code: '3000000',
    account_name: 'CAPITAL & RESERVES',
    account_type: 'equity',
    account_category: 'header',
    allow_posting: false,
    description: 'Capital and Reserves',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.EQUITY.HEADER.V1'),
    ifrs_classification: 'Equity',
    statement_mapping: 'SFP'
  },
  {
    account_code: '3100000',
    account_name: 'Share Capital',
    account_type: 'equity',
    account_category: 'capital',
    parent_account_code: '3000000',
    allow_posting: true,
    description: 'Issued ordinary shares',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.EQUITY.CAPITAL.V1'),
    ifrs_classification: 'Share Capital',
    statement_mapping: 'SFP'
  },
  {
    account_code: '3200000',
    account_name: 'Profit and Loss Account',
    account_type: 'equity',
    account_category: 'retained_earnings',
    parent_account_code: '3000000',
    allow_posting: true,
    description: 'Accumulated profits and losses',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.EQUITY.RETAINED.V1'),
    ifrs_classification: 'Retained Earnings',
    statement_mapping: 'SFP'
  },
  
  // ===== TURNOVER =====
  {
    account_code: '4000000',
    account_name: 'TURNOVER',
    account_type: 'revenue',
    account_category: 'header',
    allow_posting: false,
    description: 'Total Turnover',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.REV.HEADER.V1'),
    ifrs_classification: 'Revenue',
    statement_mapping: 'SPL'
  },
  {
    account_code: '4100000',
    account_name: 'Sales - Services',
    account_type: 'revenue',
    account_category: 'services',
    parent_account_code: '4000000',
    allow_posting: true,
    description: 'Hair and beauty services income',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.REV.SERVICES.V1'),
    ifrs_classification: 'Revenue from Contracts with Customers',
    statement_mapping: 'SPL'
  },
  {
    account_code: '4200000',
    account_name: 'Sales - Products',
    account_type: 'revenue',
    account_category: 'products',
    parent_account_code: '4000000',
    allow_posting: true,
    description: 'Hair care product sales',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.REV.PRODUCTS.V1'),
    ifrs_classification: 'Revenue from Contracts with Customers',
    statement_mapping: 'SPL'
  },
  
  // ===== COST OF SALES =====
  {
    account_code: '5000000',
    account_name: 'COST OF SALES',
    account_type: 'cost_of_sales',
    account_category: 'header',
    allow_posting: false,
    description: 'Cost of Sales',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.COGS.HEADER.V1'),
    ifrs_classification: 'Cost of Sales',
    statement_mapping: 'SPL'
  },
  {
    account_code: '5100000',
    account_name: 'Cost of Products Sold',
    account_type: 'cost_of_sales',
    account_category: 'products',
    parent_account_code: '5000000',
    allow_posting: true,
    description: 'Cost of hair products sold',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.COGS.PRODUCTS.V1'),
    ifrs_classification: 'Cost of Sales',
    statement_mapping: 'SPL'
  },
  {
    account_code: '5200000',
    account_name: 'Card Payment Charges',
    account_type: 'cost_of_sales',
    account_category: 'fees',
    parent_account_code: '5000000',
    allow_posting: true,
    description: 'Credit and debit card processing fees',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.COGS.FEES.V1'),
    ifrs_classification: 'Cost of Sales',
    statement_mapping: 'SPL'
  },
  
  // ===== ADMINISTRATIVE EXPENSES =====
  {
    account_code: '6000000',
    account_name: 'ADMINISTRATIVE EXPENSES',
    account_type: 'direct_expenses',
    account_category: 'header',
    allow_posting: false,
    description: 'Administrative Expenses',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.EXP.HEADER.V1'),
    ifrs_classification: 'Administrative Expenses',
    statement_mapping: 'SPL'
  },
  
  // Staff Costs
  {
    account_code: '6100000',
    account_name: 'Gross Wages',
    account_type: 'direct_expenses',
    account_category: 'payroll',
    parent_account_code: '6000000',
    allow_posting: true,
    description: 'Gross wages before deductions',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.EXP.WAGES.V1'),
    ifrs_classification: 'Employee Benefits Expense',
    statement_mapping: 'SPL'
  },
  {
    account_code: '6110000',
    account_name: 'Employer National Insurance',
    account_type: 'direct_expenses',
    account_category: 'payroll',
    parent_account_code: '6000000',
    allow_posting: true,
    description: 'Employer NI contributions',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.EXP.EMPLOYER_NI.V1'),
    ifrs_classification: 'Employee Benefits Expense',
    statement_mapping: 'SPL'
  },
  {
    account_code: '6120000',
    account_name: 'Employer Pension Contributions',
    account_type: 'direct_expenses',
    account_category: 'payroll',
    parent_account_code: '6000000',
    allow_posting: true,
    description: 'Auto-enrolment pension contributions',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.EXP.PENSION.V1'),
    ifrs_classification: 'Employee Benefits Expense',
    statement_mapping: 'SPL'
  },
  {
    account_code: '6150000',
    account_name: 'Commission Payments',
    account_type: 'direct_expenses',
    account_category: 'payroll',
    parent_account_code: '6000000',
    allow_posting: true,
    description: 'Staff commission payments',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.EXP.COMMISSION.V1'),
    ifrs_classification: 'Employee Benefits Expense',
    statement_mapping: 'SPL'
  },
  
  // Premises Costs
  {
    account_code: '6300000',
    account_name: 'Rent and Rates',
    account_type: 'indirect_expenses',
    account_category: 'occupancy',
    parent_account_code: '6000000',
    allow_posting: true,
    description: 'Premises rent payments',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.EXP.RENT.V1'),
    ifrs_classification: 'Other Operating Expenses',
    statement_mapping: 'SPL'
  },
  {
    account_code: '6350000',
    account_name: 'Business Rates',
    account_type: 'indirect_expenses',
    account_category: 'occupancy',
    parent_account_code: '6000000',
    allow_posting: true,
    description: 'Local authority business rates',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.EXP.RATES.V1'),
    ifrs_classification: 'Other Operating Expenses',
    statement_mapping: 'SPL'
  },
  {
    account_code: '6400000',
    account_name: 'Light and Heat',
    account_type: 'indirect_expenses',
    account_category: 'occupancy',
    parent_account_code: '6000000',
    allow_posting: true,
    description: 'Gas, electricity, water bills',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.EXP.UTILITIES.V1'),
    ifrs_classification: 'Other Operating Expenses',
    statement_mapping: 'SPL'
  },
  
  // Operating Costs
  {
    account_code: '6500000',
    account_name: 'Materials and Consumables',
    account_type: 'direct_expenses',
    account_category: 'supplies',
    parent_account_code: '6000000',
    allow_posting: true,
    description: 'Salon supplies and consumables',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.EXP.SUPPLIES.V1'),
    ifrs_classification: 'Other Operating Expenses',
    statement_mapping: 'SPL'
  },
  {
    account_code: '6600000',
    account_name: 'Advertising and Marketing',
    account_type: 'indirect_expenses',
    account_category: 'marketing',
    parent_account_code: '6000000',
    allow_posting: true,
    description: 'Marketing and promotional expenses',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.EXP.MARKETING.V1'),
    ifrs_classification: 'Other Operating Expenses',
    statement_mapping: 'SPL'
  },
  {
    account_code: '6700000',
    account_name: 'Insurance',
    account_type: 'indirect_expenses',
    account_category: 'insurance',
    parent_account_code: '6000000',
    allow_posting: true,
    description: 'Business insurance premiums',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.EXP.INSURANCE.V1'),
    ifrs_classification: 'Other Operating Expenses',
    statement_mapping: 'SPL'
  },
  {
    account_code: '6750000',
    account_name: 'Professional Fees',
    account_type: 'indirect_expenses',
    account_category: 'professional',
    parent_account_code: '6000000',
    allow_posting: true,
    description: 'Accountant, solicitor, consultant fees',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.EXP.PROFESSIONAL.V1'),
    ifrs_classification: 'Other Operating Expenses',
    statement_mapping: 'SPL'
  },
  {
    account_code: '6800000',
    account_name: 'Repairs and Maintenance',
    account_type: 'indirect_expenses',
    account_category: 'maintenance',
    parent_account_code: '6000000',
    allow_posting: true,
    description: 'Equipment repairs and maintenance',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.EXP.MAINTENANCE.V1'),
    ifrs_classification: 'Other Operating Expenses',
    statement_mapping: 'SPL'
  },
  {
    account_code: '6850000',
    account_name: 'Depreciation',
    account_type: 'indirect_expenses',
    account_category: 'depreciation',
    parent_account_code: '6000000',
    allow_posting: true,
    description: 'Equipment depreciation charge',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.EXP.DEPRECIATION.V1'),
    ifrs_classification: 'Depreciation',
    statement_mapping: 'SPL'
  },
  {
    account_code: '6900000',
    account_name: 'Bank Charges',
    account_type: 'indirect_expenses',
    account_category: 'bank',
    parent_account_code: '6000000',
    allow_posting: true,
    description: 'Bank account fees and charges',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.EXP.BANK.V1'),
    ifrs_classification: 'Finance Costs',
    statement_mapping: 'SPL'
  }
]

/**
 * Seed function to create UK COA in HERA
 */
export async function seedUKSalonCOA(organizationId: string) {
  const { apiV2 } = await import('@/lib/client/fetchV2')
  
  try {
    console.log('🇬🇧 Seeding UK Salon Chart of Accounts...')
    
    let created = 0
    let errors = 0
    
    for (const account of UK_SALON_COA) {
      try {
        const { data: accountEntity } = await apiV2.post('entities', {
          organization_id: organizationId,
          entity_type: 'account',
          entity_name: account.account_name,
          entity_code: account.account_code,
          entity_category: account.account_category,
          smart_code: account.smart_code,
          description: account.description,
          metadata: {
            account_type: account.account_type,
            parent_account_code: account.parent_account_code,
            ifrs_classification: account.ifrs_classification,
            statement_mapping: account.statement_mapping
          }
        })
        
        if (accountEntity?.id) {
          // Store GL-specific properties
          await apiV2.post('entities/dynamic-data', {
            entity_id: accountEntity.id,
            field_name: 'allow_posting',
            field_type: 'boolean',
            field_value_boolean: account.allow_posting,
            smart_code: heraCode('HERA.ACCOUNTING.COA.FIELD.ALLOW_POSTING.V1')
          })
          
          await apiV2.post('entities/dynamic-data', {
            entity_id: accountEntity.id,
            field_name: 'account_type',
            field_type: 'text',
            field_value: account.account_type,
            smart_code: heraCode('HERA.ACCOUNTING.COA.FIELD.ACCOUNT_TYPE.V1')
          })
          
          created++
          console.log(`✅ Created account: ${account.account_code} - ${account.account_name}`)
        }
      } catch (error) {
        console.error(`❌ Error creating account ${account.account_code}:`, error)
        errors++
      }
    }
    
    console.log(`🎉 UK COA seeding completed: ${created} accounts created, ${errors} errors`)
    
    return {
      success: true,
      accounts_created: created,
      errors: errors,
      total_accounts: UK_SALON_COA.length
    }
    
  } catch (error) {
    console.error('❌ Error seeding UK salon COA:', error)
    throw error
  }
}

// Export for CLI usage
if (require.main === module) {
  const organizationId = process.argv[2]
  if (!organizationId) {
    console.error('Usage: node coa.uk.js <organization_id>')
    process.exit(1)
  }
  
  seedUKSalonCOA(organizationId)
    .then(result => {
      console.log('🎉 UK Salon COA seeded:', result)
      process.exit(0)
    })
    .catch(error => {
      console.error('💥 Seeding failed:', error)
      process.exit(1)
    })
}