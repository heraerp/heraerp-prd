/**
 * HERA Chart of Accounts - UAE Salon
 * 
 * UAE-compliant COA for salon operations
 * Stored as core_entities with entity_type='account'
 * IFRS-compliant structure with proper hierarchies
 */

import { heraCode } from '@/lib/smart-codes'

export interface GLAccount {
  account_code: string
  account_name: string
  account_type: 'assets' | 'liabilities' | 'equity' | 'revenue' | 'cost_of_sales' | 'direct_expenses' | 'indirect_expenses'
  account_category: string
  parent_account_code?: string
  allow_posting: boolean
  description: string
  smart_code: string
  ifrs_classification?: string
  statement_mapping?: string
}

/**
 * UAE Salon Chart of Accounts
 * Smart Code: HERA.ACCOUNTING.COA.UAE.SALON.V1
 */
export const UAE_SALON_COA: GLAccount[] = [
  // ===== ASSETS =====
  // Current Assets
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
    description: 'Cash register and till cash',
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
    account_name: 'Bank Account - Current',
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
    account_name: 'Accounts Receivable',
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
    account_name: 'Inventory - Hair Products',
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
    description: 'Input VAT to be recovered',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.ASSET.VAT_RECOVERABLE.V1'),
    ifrs_classification: 'Current Tax Assets',
    statement_mapping: 'SFP'
  },
  
  // Non-Current Assets
  {
    account_code: '1500000',
    account_name: 'NON-CURRENT ASSETS',
    account_type: 'assets',
    account_category: 'header',
    parent_account_code: '1000000',
    allow_posting: false,
    description: 'Non-Current Assets',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.ASSET.NONCURRENT.HEADER.V1'),
    ifrs_classification: 'Non-current Assets',
    statement_mapping: 'SFP'
  },
  {
    account_code: '1600000',
    account_name: 'Salon Equipment',
    account_type: 'assets',
    account_category: 'ppe',
    parent_account_code: '1500000',
    allow_posting: true,
    description: 'Salon chairs, dryers, styling equipment',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.ASSET.PPE.V1'),
    ifrs_classification: 'Property, Plant and Equipment',
    statement_mapping: 'SFP'
  },
  {
    account_code: '1650000',
    account_name: 'Accumulated Depreciation - Equipment',
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
    account_name: 'Accounts Payable',
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
    account_name: 'Accrued Expenses',
    account_type: 'liabilities',
    account_category: 'accruals',
    parent_account_code: '2000000',
    allow_posting: true,
    description: 'Expenses incurred but not yet paid',
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
    description: 'Output VAT to be paid to FTA',
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
  {
    account_code: '2450000',
    account_name: 'Commission Payable',
    account_type: 'liabilities',
    account_category: 'payroll',
    parent_account_code: '2000000',
    allow_posting: true,
    description: 'Accrued staff commissions',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.LIAB.COMMISSION.V1'),
    ifrs_classification: 'Trade and Other Payables',
    statement_mapping: 'SFP'
  },
  
  // ===== EQUITY =====
  {
    account_code: '3000000',
    account_name: 'EQUITY',
    account_type: 'equity',
    account_category: 'header',
    allow_posting: false,
    description: 'Owners Equity',
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
    description: 'Issued share capital',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.EQUITY.CAPITAL.V1'),
    ifrs_classification: 'Share Capital',
    statement_mapping: 'SFP'
  },
  {
    account_code: '3200000',
    account_name: 'Retained Earnings',
    account_type: 'equity',
    account_category: 'retained_earnings',
    parent_account_code: '3000000',
    allow_posting: true,
    description: 'Accumulated profits',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.EQUITY.RETAINED.V1'),
    ifrs_classification: 'Retained Earnings',
    statement_mapping: 'SFP'
  },
  
  // ===== REVENUE =====
  {
    account_code: '4000000',
    account_name: 'REVENUE',
    account_type: 'revenue',
    account_category: 'header',
    allow_posting: false,
    description: 'Total Revenue',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.REV.HEADER.V1'),
    ifrs_classification: 'Revenue',
    statement_mapping: 'SPL'
  },
  {
    account_code: '4100000',
    account_name: 'Service Revenue',
    account_type: 'revenue',
    account_category: 'services',
    parent_account_code: '4000000',
    allow_posting: true,
    description: 'Hair and beauty services revenue',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.REV.SERVICES.V1'),
    ifrs_classification: 'Revenue from Contracts with Customers',
    statement_mapping: 'SPL'
  },
  {
    account_code: '4200000',
    account_name: 'Product Sales Revenue',
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
    description: 'Cost of Goods Sold',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.COGS.HEADER.V1'),
    ifrs_classification: 'Cost of Sales',
    statement_mapping: 'SPL'
  },
  {
    account_code: '5100000',
    account_name: 'Product Cost of Sales',
    account_type: 'cost_of_sales',
    account_category: 'products',
    parent_account_code: '5000000',
    allow_posting: true,
    description: 'Cost of products sold',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.COGS.PRODUCTS.V1'),
    ifrs_classification: 'Cost of Sales',
    statement_mapping: 'SPL'
  },
  {
    account_code: '5200000',
    account_name: 'Card Processing Fees',
    account_type: 'cost_of_sales',
    account_category: 'fees',
    parent_account_code: '5000000',
    allow_posting: true,
    description: 'Credit card processing fees',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.COGS.FEES.V1'),
    ifrs_classification: 'Cost of Sales',
    statement_mapping: 'SPL'
  },
  
  // ===== EXPENSES =====
  {
    account_code: '6000000',
    account_name: 'OPERATING EXPENSES',
    account_type: 'direct_expenses',
    account_category: 'header',
    allow_posting: false,
    description: 'Operating Expenses',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.EXP.HEADER.V1'),
    ifrs_classification: 'Operating Expenses',
    statement_mapping: 'SPL'
  },
  
  // Staff Expenses
  {
    account_code: '6100000',
    account_name: 'Wages and Salaries',
    account_type: 'direct_expenses',
    account_category: 'payroll',
    parent_account_code: '6000000',
    allow_posting: true,
    description: 'Staff wages and salaries',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.EXP.WAGES.V1'),
    ifrs_classification: 'Employee Benefits Expense',
    statement_mapping: 'SPL'
  },
  {
    account_code: '6150000',
    account_name: 'Commission Expense',
    account_type: 'direct_expenses',
    account_category: 'payroll',
    parent_account_code: '6000000',
    allow_posting: true,
    description: 'Staff commission payments',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.EXP.COMMISSION.V1'),
    ifrs_classification: 'Employee Benefits Expense',
    statement_mapping: 'SPL'
  },
  
  // Occupancy Expenses
  {
    account_code: '6300000',
    account_name: 'Rent Expense',
    account_type: 'indirect_expenses',
    account_category: 'occupancy',
    parent_account_code: '6000000',
    allow_posting: true,
    description: 'Salon premises rent',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.EXP.RENT.V1'),
    ifrs_classification: 'Other Operating Expenses',
    statement_mapping: 'SPL'
  },
  {
    account_code: '6400000',
    account_name: 'Utilities Expense',
    account_type: 'indirect_expenses',
    account_category: 'occupancy',
    parent_account_code: '6000000',
    allow_posting: true,
    description: 'Electricity, water, internet',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.EXP.UTILITIES.V1'),
    ifrs_classification: 'Other Operating Expenses',
    statement_mapping: 'SPL'
  },
  
  // Operating Expenses
  {
    account_code: '6500000',
    account_name: 'Supplies Expense',
    account_type: 'direct_expenses',
    account_category: 'supplies',
    parent_account_code: '6000000',
    allow_posting: true,
    description: 'Consumable salon supplies',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.EXP.SUPPLIES.V1'),
    ifrs_classification: 'Other Operating Expenses',
    statement_mapping: 'SPL'
  },
  {
    account_code: '6600000',
    account_name: 'Marketing Expense',
    account_type: 'indirect_expenses',
    account_category: 'marketing',
    parent_account_code: '6000000',
    allow_posting: true,
    description: 'Advertising and promotion',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.EXP.MARKETING.V1'),
    ifrs_classification: 'Other Operating Expenses',
    statement_mapping: 'SPL'
  },
  {
    account_code: '6700000',
    account_name: 'Insurance Expense',
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
    account_code: '6800000',
    account_name: 'Maintenance Expense',
    account_type: 'indirect_expenses',
    account_category: 'maintenance',
    parent_account_code: '6000000',
    allow_posting: true,
    description: 'Equipment maintenance and repairs',
    smart_code: heraCode('HERA.ACCOUNTING.COA.ACCOUNT.GL.EXP.MAINTENANCE.V1'),
    ifrs_classification: 'Other Operating Expenses',
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
 * Seed function to create UAE COA in HERA
 */
export async function seedUAESalonCOA(organizationId: string) {
  const { apiV2 } = await import('@/lib/client/fetchV2')
  
  try {
    console.log('🇦🇪 Seeding UAE Salon Chart of Accounts...')
    
    let created = 0
    let errors = 0
    
    for (const account of UAE_SALON_COA) {
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
          // Store GL-specific properties in dynamic data
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
    
    console.log(`🎉 UAE COA seeding completed: ${created} accounts created, ${errors} errors`)
    
    return {
      success: true,
      accounts_created: created,
      errors: errors,
      total_accounts: UAE_SALON_COA.length
    }
    
  } catch (error) {
    console.error('❌ Error seeding UAE salon COA:', error)
    throw error
  }
}

// Export for CLI usage
if (require.main === module) {
  const organizationId = process.argv[2]
  if (!organizationId) {
    console.error('Usage: node coa.ae.js <organization_id>')
    process.exit(1)
  }
  
  seedUAESalonCOA(organizationId)
    .then(result => {
      console.log('🎉 UAE Salon COA seeded:', result)
      process.exit(0)
    })
    .catch(error => {
      console.error('💥 Seeding failed:', error)
      process.exit(1)
    })
}