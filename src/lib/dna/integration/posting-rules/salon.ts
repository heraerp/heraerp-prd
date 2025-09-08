/**
 * Salon Industry Posting Rules
 * Finance DNA Configuration for Salon/Beauty Operations
 */

import type { PostingRule } from '../finance-integration-dna'

export const POSTING_RULES: PostingRule[] = [
  // Salon Service Sale
  {
    smart_code: 'HERA.SALON.SALE.SERVICE.v1',
    validations: {
      required_header: ['organization_id', 'currency', 'origin_txn_id'],
      required_lines: ['entity_id', 'dr|cr'],
      fiscal_check: 'open_period'
    },
    posting_recipe: {
      lines: [
        { 
          derive: 'DR Cash/Card', 
          from: 'payment.method.clearing_account'
        },
        { 
          derive: 'CR Service Revenue', 
          from: 'service.type.revenue_account'
        },
        { 
          derive: 'CR Sales Tax', 
          from: 'tax.jurisdiction.liability_account'
        }
      ]
    },
    outcomes: {
      auto_post_if: 'ai_confidence >= 0.95',
      else: 'stage_for_review'
    }
  },
  
  // Product Sale (Retail)
  {
    smart_code: 'HERA.SALON.SALE.PRODUCT.v1',
    validations: {
      required_header: ['organization_id', 'currency', 'origin_txn_id'],
      required_lines: ['entity_id', 'quantity', 'amount'],
      fiscal_check: 'open_period'
    },
    posting_recipe: {
      lines: [
        { 
          derive: 'DR Cash/Card', 
          from: 'payment.method.clearing_account'
        },
        { 
          derive: 'CR Product Sales', 
          from: 'product.category.revenue_account'
        },
        { 
          derive: 'CR Sales Tax', 
          from: 'tax.jurisdiction.liability_account'
        },
        {
          derive: 'DR Product COGS',
          from: 'product.category.cogs_account'
        },
        {
          derive: 'CR Product Inventory',
          from: 'product.category.inventory_account'
        }
      ]
    },
    outcomes: {
      auto_post_if: 'ai_confidence >= 0.90',
      else: 'stage_for_review'
    }
  },
  
  // Stylist Commission
  {
    smart_code: 'HERA.SALON.PAYROLL.COMMISSION.v1',
    validations: {
      required_header: ['organization_id', 'currency', 'origin_txn_id', 'employee_id'],
      required_lines: ['amount', 'commission_rate'],
      fiscal_check: 'open_period'
    },
    posting_recipe: {
      lines: [
        { 
          derive: 'DR Commission Expense', 
          from: 'employee.type.commission_expense'
        },
        { 
          derive: 'CR Commission Payable', 
          from: 'finance.defaults.commission_liability'
        }
      ]
    },
    outcomes: {
      auto_post_if: 'ai_confidence >= 0.85',
      else: 'stage_for_review'
    }
  },
  
  // Supply Purchase
  {
    smart_code: 'HERA.SALON.EXPENSE.SUPPLIES.v1',
    validations: {
      required_header: ['organization_id', 'currency', 'origin_txn_id'],
      required_lines: ['entity_id', 'amount'],
      fiscal_check: 'open_period'
    },
    posting_recipe: {
      lines: [
        { 
          derive: 'DR Supplies Inventory', 
          from: 'supply.category.inventory_account'
        },
        { 
          derive: 'DR Input Tax', 
          from: 'tax.jurisdiction.input_tax_account'
        },
        { 
          derive: 'CR Cash/AP', 
          from: 'payment.method.account'
        }
      ]
    },
    outcomes: {
      auto_post_if: 'ai_confidence >= 0.80',
      else: 'stage_for_review'
    }
  },
  
  // Supply Usage
  {
    smart_code: 'HERA.SALON.INV.SUPPLY_USAGE.v1',
    validations: {
      required_header: ['organization_id', 'currency', 'origin_txn_id'],
      required_lines: ['entity_id', 'quantity'],
      fiscal_check: 'open_period'
    },
    posting_recipe: {
      lines: [
        { 
          derive: 'DR Supply Expense', 
          from: 'supply.category.expense_account'
        },
        { 
          derive: 'CR Supplies Inventory', 
          from: 'supply.category.inventory_account'
        }
      ]
    },
    outcomes: {
      auto_post_if: 'ai_confidence >= 0.90',
      else: 'stage_for_review'
    }
  },
  
  // Booth Rental Income
  {
    smart_code: 'HERA.SALON.RENTAL.BOOTH.v1',
    validations: {
      required_header: ['organization_id', 'currency', 'origin_txn_id'],
      required_lines: ['stylist_id', 'amount', 'period'],
      fiscal_check: 'open_period'
    },
    posting_recipe: {
      lines: [
        { 
          derive: 'DR Rental Receivable', 
          from: 'stylist.booth.receivable_account'
        },
        { 
          derive: 'CR Rental Income', 
          from: 'revenue.booth_rental_account'
        }
      ]
    },
    outcomes: {
      auto_post_if: 'ai_confidence >= 0.85',
      else: 'stage_for_review'
    }
  },
  
  // Tips Distribution
  {
    smart_code: 'HERA.SALON.TIPS.DISTRIBUTION.v1',
    validations: {
      required_header: ['organization_id', 'currency', 'origin_txn_id'],
      required_lines: ['employee_id', 'amount'],
      fiscal_check: 'open_period'
    },
    posting_recipe: {
      lines: [
        { 
          derive: 'DR Tips Clearing', 
          from: 'finance.defaults.tips_clearing'
        },
        { 
          derive: 'CR Tips Payable', 
          from: 'employee.tips_payable_account'
        }
      ]
    },
    outcomes: {
      auto_post_if: 'ai_confidence >= 0.95',
      else: 'stage_for_review'
    }
  }
]

// Salon-specific COA structure
export const SALON_COA = {
  // Assets (1xxxxx)
  '110000': { name: 'Cash on Hand', type: 'Asset', subtype: 'Current' },
  '110100': { name: 'Cash Register', type: 'Asset', subtype: 'Current' },
  '110200': { name: 'Card Clearing Account', type: 'Asset', subtype: 'Current' },
  '111000': { name: 'Bank Accounts', type: 'Asset', subtype: 'Current' },
  '120000': { name: 'Accounts Receivable', type: 'Asset', subtype: 'Current' },
  '121000': { name: 'Booth Rental Receivable', type: 'Asset', subtype: 'Current' },
  '130000': { name: 'Beauty Product Inventory', type: 'Asset', subtype: 'Current' },
  '131000': { name: 'Hair Color Inventory', type: 'Asset', subtype: 'Current' },
  '132000': { name: 'Supplies Inventory', type: 'Asset', subtype: 'Current' },
  '140000': { name: 'Prepaid Rent', type: 'Asset', subtype: 'Current' },
  '150000': { name: 'Salon Equipment', type: 'Asset', subtype: 'Fixed' },
  '151000': { name: 'Accumulated Depreciation - Equipment', type: 'Asset', subtype: 'ContraAsset' },
  '160000': { name: 'Furniture & Fixtures', type: 'Asset', subtype: 'Fixed' },
  
  // Liabilities (2xxxxx)
  '210000': { name: 'Accounts Payable', type: 'Liability', subtype: 'Current' },
  '220000': { name: 'Sales Tax Payable', type: 'Liability', subtype: 'Current' },
  '221000': { name: 'Input Tax Recoverable', type: 'Asset', subtype: 'Current' },
  '230000': { name: 'Commission Payable', type: 'Liability', subtype: 'Current' },
  '231000': { name: 'Tips Payable', type: 'Liability', subtype: 'Current' },
  '232000': { name: 'Tips Clearing', type: 'Liability', subtype: 'Current' },
  '240000': { name: 'Payroll Liabilities', type: 'Liability', subtype: 'Current' },
  
  // Revenue (4xxxxx)
  '400000': { name: 'Service Revenue - Hair', type: 'Revenue', subtype: 'Operating' },
  '401000': { name: 'Service Revenue - Color', type: 'Revenue', subtype: 'Operating' },
  '402000': { name: 'Service Revenue - Treatment', type: 'Revenue', subtype: 'Operating' },
  '403000': { name: 'Service Revenue - Other', type: 'Revenue', subtype: 'Operating' },
  '410000': { name: 'Product Sales Revenue', type: 'Revenue', subtype: 'Operating' },
  '420000': { name: 'Booth Rental Income', type: 'Revenue', subtype: 'Operating' },
  
  // COGS (5xxxxx)
  '500000': { name: 'Product COGS', type: 'Expense', subtype: 'COGS' },
  '510000': { name: 'Supply Usage', type: 'Expense', subtype: 'COGS' },
  
  // Operating Expenses (6xxxxx)
  '600000': { name: 'Commission Expense', type: 'Expense', subtype: 'Operating' },
  '601000': { name: 'Wages - Receptionist', type: 'Expense', subtype: 'Operating' },
  '602000': { name: 'Wages - Management', type: 'Expense', subtype: 'Operating' },
  '610000': { name: 'Rent Expense', type: 'Expense', subtype: 'Operating' },
  '620000': { name: 'Utilities', type: 'Expense', subtype: 'Operating' },
  '621000': { name: 'Laundry & Cleaning', type: 'Expense', subtype: 'Operating' },
  '630000': { name: 'Marketing & Advertising', type: 'Expense', subtype: 'Operating' },
  '640000': { name: 'Insurance', type: 'Expense', subtype: 'Operating' },
  '650000': { name: 'Professional Development', type: 'Expense', subtype: 'Operating' }
}