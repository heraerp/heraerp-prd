/**
 * Restaurant Industry Posting Rules
 * Finance DNA Configuration for Restaurant Operations
 */

import type { PostingRule } from '../finance-integration-dna'

export const POSTING_RULES: PostingRule[] = [
  // Restaurant Sales
  {
    smart_code: 'HERA.RESTAURANT.FOH.ORDER.POSTED.v1',
    validations: {
      required_header: ['organization_id', 'currency', 'origin_txn_id'],
      required_lines: ['entity_id', 'dr|cr'],
      fiscal_check: 'open_period'
    },
    posting_recipe: {
      lines: [
        { 
          derive: 'DR Cash/Card', 
          from: 'payment.method.clearing_account',
          conditions: { payment_method: ['cash', 'card'] }
        },
        { 
          derive: 'CR Food Revenue', 
          from: 'product.category.revenue_account',
          conditions: { category: 'food' }
        },
        { 
          derive: 'CR Beverage Revenue', 
          from: 'product.category.revenue_account',
          conditions: { category: 'beverage' }
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
  
  // Kitchen Goods Issue
  {
    smart_code: 'HERA.RESTAURANT.KOT.GOODS_ISSUE.v1',
    validations: {
      required_header: ['organization_id', 'currency', 'origin_txn_id'],
      required_lines: ['entity_id', 'quantity'],
      fiscal_check: 'open_period'
    },
    posting_recipe: {
      lines: [
        { 
          derive: 'DR Food COGS', 
          from: 'product.category.cogs_account',
          conditions: { category: 'food' }
        },
        { 
          derive: 'CR Food Inventory', 
          from: 'product.category.inventory_account',
          conditions: { category: 'food' }
        }
      ]
    },
    outcomes: {
      auto_post_if: 'ai_confidence >= 0.90',
      else: 'stage_for_review'
    }
  },
  
  // Supplier Delivery
  {
    smart_code: 'HERA.RESTAURANT.PUR.GOODS_RECEIPT.v1',
    validations: {
      required_header: ['organization_id', 'currency', 'origin_txn_id', 'vendor_id'],
      required_lines: ['entity_id', 'quantity', 'unit_price'],
      fiscal_check: 'open_period'
    },
    posting_recipe: {
      lines: [
        { 
          derive: 'DR Inventory', 
          from: 'product.category.inventory_account'
        },
        { 
          derive: 'CR GR/IR', 
          from: 'finance.defaults.grir_account'
        }
      ]
    },
    outcomes: {
      auto_post_if: 'ai_confidence >= 0.85',
      else: 'stage_for_review'
    }
  },
  
  // Vendor Invoice
  {
    smart_code: 'HERA.RESTAURANT.PUR.INVOICE_POSTED.v1',
    validations: {
      required_header: ['organization_id', 'currency', 'origin_txn_id', 'vendor_id'],
      required_lines: ['entity_id', 'amount'],
      fiscal_check: 'open_period'
    },
    posting_recipe: {
      lines: [
        { 
          derive: 'DR GR/IR', 
          from: 'finance.defaults.grir_account'
        },
        { 
          derive: 'DR Input Tax', 
          from: 'tax.jurisdiction.input_tax_account'
        },
        { 
          derive: 'CR Accounts Payable', 
          from: 'vendor.default.ap_account'
        }
      ]
    },
    outcomes: {
      auto_post_if: 'ai_confidence >= 0.80',
      else: 'stage_for_review'
    }
  },
  
  // Daily Cash Reconciliation
  {
    smart_code: 'HERA.RESTAURANT.CASH.RECONCILIATION.v1',
    validations: {
      required_header: ['organization_id', 'currency', 'origin_txn_id'],
      required_lines: ['entity_id', 'dr|cr'],
      fiscal_check: 'open_period'
    },
    posting_recipe: {
      lines: [
        { 
          derive: 'DR Cash on Hand', 
          from: 'cash.register.asset_account'
        },
        { 
          derive: 'CR Cash Clearing', 
          from: 'cash.clearing_account'
        }
      ]
    },
    outcomes: {
      auto_post_if: 'ai_confidence >= 0.99',
      else: 'stage_for_review'
    }
  },
  
  // Staff Payroll
  {
    smart_code: 'HERA.RESTAURANT.HR.PAYROLL.v1',
    validations: {
      required_header: ['organization_id', 'currency', 'origin_txn_id'],
      required_lines: ['employee_id', 'amount'],
      fiscal_check: 'open_period'
    },
    posting_recipe: {
      lines: [
        { 
          derive: 'DR Wages - Kitchen', 
          from: 'department.kitchen.payroll_expense',
          conditions: { department: 'kitchen' }
        },
        { 
          derive: 'DR Wages - Service', 
          from: 'department.service.payroll_expense',
          conditions: { department: 'service' }
        },
        { 
          derive: 'CR Payroll Payable', 
          from: 'finance.defaults.payroll_liability'
        },
        { 
          derive: 'CR Tax Withholdings', 
          from: 'tax.payroll.withholding_account'
        }
      ]
    },
    outcomes: {
      auto_post_if: 'ai_confidence >= 0.95',
      else: 'stage_for_review'
    }
  },
  
  // Wastage/Spoilage
  {
    smart_code: 'HERA.RESTAURANT.INV.WASTAGE.v1',
    validations: {
      required_header: ['organization_id', 'currency', 'origin_txn_id'],
      required_lines: ['entity_id', 'quantity', 'reason'],
      fiscal_check: 'open_period'
    },
    posting_recipe: {
      lines: [
        { 
          derive: 'DR Wastage Expense', 
          from: 'expense.wastage_account'
        },
        { 
          derive: 'CR Inventory', 
          from: 'product.category.inventory_account'
        }
      ]
    },
    outcomes: {
      auto_post_if: 'ai_confidence >= 0.75 && amount < 100',
      else: 'stage_for_review'
    }
  }
]

// Restaurant-specific COA structure
export const RESTAURANT_COA = {
  // Assets (1xxxxx)
  '110000': { name: 'Cash on Hand', type: 'Asset', subtype: 'Current' },
  '110100': { name: 'Cash Registers', type: 'Asset', subtype: 'Current' },
  '110200': { name: 'Card Clearing Account', type: 'Asset', subtype: 'Current' },
  '111000': { name: 'Bank Accounts', type: 'Asset', subtype: 'Current' },
  '120000': { name: 'Accounts Receivable', type: 'Asset', subtype: 'Current' },
  '130000': { name: 'Food Inventory', type: 'Asset', subtype: 'Current' },
  '131000': { name: 'Beverage Inventory', type: 'Asset', subtype: 'Current' },
  '132000': { name: 'Supplies Inventory', type: 'Asset', subtype: 'Current' },
  '150000': { name: 'Prepaid Expenses', type: 'Asset', subtype: 'Current' },
  '160000': { name: 'Kitchen Equipment', type: 'Asset', subtype: 'Fixed' },
  '161000': { name: 'Accumulated Depreciation - Kitchen', type: 'Asset', subtype: 'ContraAsset' },
  '170000': { name: 'Furniture & Fixtures', type: 'Asset', subtype: 'Fixed' },
  
  // Liabilities (2xxxxx)
  '210000': { name: 'Accounts Payable', type: 'Liability', subtype: 'Current' },
  '210500': { name: 'GR/IR Clearing', type: 'Liability', subtype: 'Current' },
  '220000': { name: 'Sales Tax Payable', type: 'Liability', subtype: 'Current' },
  '221000': { name: 'Input Tax Recoverable', type: 'Asset', subtype: 'Current' },
  '230000': { name: 'Payroll Liabilities', type: 'Liability', subtype: 'Current' },
  '231000': { name: 'Tips Payable', type: 'Liability', subtype: 'Current' },
  '240000': { name: 'Accrued Expenses', type: 'Liability', subtype: 'Current' },
  
  // Revenue (4xxxxx)
  '400000': { name: 'Food Revenue', type: 'Revenue', subtype: 'Operating' },
  '401000': { name: 'Beverage Revenue', type: 'Revenue', subtype: 'Operating' },
  '402000': { name: 'Delivery Revenue', type: 'Revenue', subtype: 'Operating' },
  '403000': { name: 'Catering Revenue', type: 'Revenue', subtype: 'Operating' },
  
  // COGS (5xxxxx)
  '500000': { name: 'Food COGS', type: 'Expense', subtype: 'COGS' },
  '501000': { name: 'Beverage COGS', type: 'Expense', subtype: 'COGS' },
  '502000': { name: 'Food Wastage', type: 'Expense', subtype: 'COGS' },
  
  // Operating Expenses (6xxxxx)
  '600000': { name: 'Wages - Kitchen', type: 'Expense', subtype: 'Operating' },
  '601000': { name: 'Wages - Service', type: 'Expense', subtype: 'Operating' },
  '602000': { name: 'Wages - Management', type: 'Expense', subtype: 'Operating' },
  '610000': { name: 'Rent Expense', type: 'Expense', subtype: 'Operating' },
  '620000': { name: 'Utilities', type: 'Expense', subtype: 'Operating' },
  '630000': { name: 'Marketing', type: 'Expense', subtype: 'Operating' },
  '640000': { name: 'Supplies', type: 'Expense', subtype: 'Operating' },
  '650000': { name: 'Repairs & Maintenance', type: 'Expense', subtype: 'Operating' }
}