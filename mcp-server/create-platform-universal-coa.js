#!/usr/bin/env node

/**
 * HERA Platform Universal Chart of Accounts Generator
 * Creates comprehensive COA template in platform organization for assignment to other organizations
 * Supports all industries with standardized HERA DNA smart codes
 * 
 * Based on proven patterns from existing salon and telecom implementations
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Platform organization for universal templates
const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000';
const PLATFORM_USER_ID = '00000000-0000-0000-0000-000000000001';

// Universal Chart of Accounts - Comprehensive Template
const UNIVERSAL_COA = [
  // ============================================================================
  // ASSETS (1000000-1999999)
  // ============================================================================
  
  // Cash & Bank (1100000-1199999)
  { 
    code: '1100000', name: 'Cash and Cash Equivalents', type: 'asset', subtype: 'cash', level: 2, control: true,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.ASSET.CASH.CONTROL.v1',
    ifrs: 'IAS7.45', statement: 'SFP', balance: 'debit',
    description: 'Control account for all cash and cash equivalent balances'
  },
  { 
    code: '1110000', name: 'Petty Cash', type: 'asset', subtype: 'cash', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.ASSET.CASH.PETTY.v1',
    ifrs: 'IAS7.45', statement: 'SFP', balance: 'debit',
    description: 'Small cash amounts for daily operational expenses'
  },
  { 
    code: '1120000', name: 'Bank Accounts - Operating', type: 'asset', subtype: 'cash', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.ASSET.CASH.BANK_OPERATING.v1',
    ifrs: 'IAS7.45', statement: 'SFP', balance: 'debit',
    description: 'Primary operating bank accounts for daily transactions'
  },
  { 
    code: '1130000', name: 'Bank Accounts - Savings', type: 'asset', subtype: 'cash', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.ASSET.CASH.BANK_SAVINGS.v1',
    ifrs: 'IAS7.45', statement: 'SFP', balance: 'debit',
    description: 'Interest-bearing savings and time deposit accounts'
  },
  { 
    code: '1140000', name: 'Credit Card Receivables', type: 'asset', subtype: 'cash', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.ASSET.CASH.CC_RECEIVABLE.v1',
    ifrs: 'IAS7.45', statement: 'SFP', balance: 'debit',
    description: 'Pending credit card settlements from payment processors'
  },
  { 
    code: '1150000', name: 'Digital Wallet Receivables', type: 'asset', subtype: 'cash', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.ASSET.CASH.DIGITAL_WALLET.v1',
    ifrs: 'IAS7.45', statement: 'SFP', balance: 'debit',
    description: 'Digital payment platform balances (PayPal, Stripe, etc.)'
  },

  // Receivables (1200000-1299999)
  { 
    code: '1200000', name: 'Accounts Receivable', type: 'asset', subtype: 'receivable', level: 2, control: true,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.ASSET.RECEIVABLE.CONTROL.v1',
    ifrs: 'IFRS9.5.1', statement: 'SFP', balance: 'debit',
    description: 'Control account for all customer receivables'
  },
  { 
    code: '1210000', name: 'Trade Receivables - Current', type: 'asset', subtype: 'receivable', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.ASSET.RECEIVABLE.TRADE_CURRENT.v1',
    ifrs: 'IFRS9.5.1', statement: 'SFP', balance: 'debit',
    description: 'Customer receivables due within 12 months'
  },
  { 
    code: '1220000', name: 'Service Receivables', type: 'asset', subtype: 'receivable', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.ASSET.RECEIVABLE.SERVICE.v1',
    ifrs: 'IFRS9.5.1', statement: 'SFP', balance: 'debit',
    description: 'Outstanding balances for services rendered'
  },
  { 
    code: '1230000', name: 'Subscription Receivables', type: 'asset', subtype: 'receivable', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.ASSET.RECEIVABLE.SUBSCRIPTION.v1',
    ifrs: 'IFRS9.5.1', statement: 'SFP', balance: 'debit',
    description: 'Recurring subscription and membership dues receivable'
  },
  { 
    code: '1240000', name: 'Employee Advances', type: 'asset', subtype: 'receivable', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.ASSET.RECEIVABLE.EMPLOYEE.v1',
    ifrs: 'IFRS9.5.1', statement: 'SFP', balance: 'debit',
    description: 'Advances and loans to employees'
  },
  { 
    code: '1250000', name: 'Other Receivables', type: 'asset', subtype: 'receivable', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.ASSET.RECEIVABLE.OTHER.v1',
    ifrs: 'IFRS9.5.1', statement: 'SFP', balance: 'debit',
    description: 'Miscellaneous receivables and deposits'
  },
  { 
    code: '1270000', name: 'Allowance for Bad Debt', type: 'asset', subtype: 'receivable', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.ASSET.RECEIVABLE.ALLOWANCE.v1',
    ifrs: 'IFRS9.5.5', statement: 'SFP', balance: 'credit',
    description: 'Provision for expected credit losses on receivables'
  },

  // Tax Assets (1280000-1289999)
  { 
    code: '1280000', name: 'Tax Receivables', type: 'asset', subtype: 'tax', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.ASSET.TAX.INPUT.v1',
    ifrs: 'IAS12.5', statement: 'SFP', balance: 'debit',
    description: 'Recoverable input tax and advance tax payments'
  },
  { 
    code: '1285000', name: 'Withholding Tax Recoverable', type: 'asset', subtype: 'tax', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.ASSET.TAX.WITHHOLDING.v1',
    ifrs: 'IAS12.5', statement: 'SFP', balance: 'debit',
    description: 'Tax withheld by customers recoverable against tax liability'
  },

  // Inventory (1300000-1399999)
  { 
    code: '1300000', name: 'Inventory', type: 'asset', subtype: 'inventory', level: 2, control: true,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.ASSET.INVENTORY.CONTROL.v1',
    ifrs: 'IAS2.36', statement: 'SFP', balance: 'debit',
    description: 'Control account for all inventory balances'
  },
  { 
    code: '1310000', name: 'Finished Goods Inventory', type: 'asset', subtype: 'inventory', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.ASSET.INVENTORY.FINISHED.v1',
    ifrs: 'IAS2.36', statement: 'SFP', balance: 'debit',
    description: 'Completed products ready for sale'
  },
  { 
    code: '1320000', name: 'Raw Materials Inventory', type: 'asset', subtype: 'inventory', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.ASSET.INVENTORY.MATERIALS.v1',
    ifrs: 'IAS2.36', statement: 'SFP', balance: 'debit',
    description: 'Materials and supplies used in production or service delivery'
  },
  { 
    code: '1330000', name: 'Work in Progress', type: 'asset', subtype: 'inventory', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.ASSET.INVENTORY.WIP.v1',
    ifrs: 'IAS2.36', statement: 'SFP', balance: 'debit',
    description: 'Partially completed products or services in progress'
  },
  { 
    code: '1340000', name: 'Consumable Supplies', type: 'asset', subtype: 'inventory', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.ASSET.INVENTORY.CONSUMABLES.v1',
    ifrs: 'IAS2.36', statement: 'SFP', balance: 'debit',
    description: 'Consumable supplies and operational materials'
  },

  // Prepaid & Other Current Assets (1400000-1499999)
  { 
    code: '1400000', name: 'Prepaid Expenses', type: 'asset', subtype: 'prepaid', level: 2, control: true,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.ASSET.PREPAID.CONTROL.v1',
    ifrs: 'IAS1.66', statement: 'SFP', balance: 'debit',
    description: 'Control account for all prepaid expenses'
  },
  { 
    code: '1410000', name: 'Prepaid Rent', type: 'asset', subtype: 'prepaid', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.ASSET.PREPAID.RENT.v1',
    ifrs: 'IAS1.66', statement: 'SFP', balance: 'debit',
    description: 'Advance rental payments for future periods'
  },
  { 
    code: '1420000', name: 'Prepaid Insurance', type: 'asset', subtype: 'prepaid', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.ASSET.PREPAID.INSURANCE.v1',
    ifrs: 'IAS1.66', statement: 'SFP', balance: 'debit',
    description: 'Insurance premiums paid in advance'
  },
  { 
    code: '1430000', name: 'Prepaid Marketing', type: 'asset', subtype: 'prepaid', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.ASSET.PREPAID.MARKETING.v1',
    ifrs: 'IAS1.66', statement: 'SFP', balance: 'debit',
    description: 'Advance payments for advertising and marketing services'
  },

  // Fixed Assets (1500000-1599999)
  { 
    code: '1500000', name: 'Property, Plant & Equipment', type: 'asset', subtype: 'fixed', level: 2, control: true,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.ASSET.PPE.CONTROL.v1',
    ifrs: 'IAS16.73', statement: 'SFP', balance: 'debit',
    description: 'Control account for property, plant and equipment'
  },
  { 
    code: '1510000', name: 'Land & Buildings', type: 'asset', subtype: 'fixed', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.ASSET.PPE.BUILDINGS.v1',
    ifrs: 'IAS16.37', statement: 'SFP', balance: 'debit',
    description: 'Owned real estate and building improvements'
  },
  { 
    code: '1520000', name: 'Machinery & Equipment', type: 'asset', subtype: 'fixed', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.ASSET.PPE.MACHINERY.v1',
    ifrs: 'IAS16.37', statement: 'SFP', balance: 'debit',
    description: 'Production equipment and machinery'
  },
  { 
    code: '1530000', name: 'Furniture & Fixtures', type: 'asset', subtype: 'fixed', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.ASSET.PPE.FURNITURE.v1',
    ifrs: 'IAS16.37', statement: 'SFP', balance: 'debit',
    description: 'Office furniture, fixtures and fittings'
  },
  { 
    code: '1540000', name: 'Computer Equipment', type: 'asset', subtype: 'fixed', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.ASSET.PPE.COMPUTER.v1',
    ifrs: 'IAS16.37', statement: 'SFP', balance: 'debit',
    description: 'Computer hardware, servers and IT equipment'
  },
  { 
    code: '1550000', name: 'Vehicles', type: 'asset', subtype: 'fixed', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.ASSET.PPE.VEHICLES.v1',
    ifrs: 'IAS16.37', statement: 'SFP', balance: 'debit',
    description: 'Company vehicles and transportation equipment'
  },
  { 
    code: '1590000', name: 'Accumulated Depreciation', type: 'asset', subtype: 'fixed', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.ASSET.PPE.DEPRECIATION.v1',
    ifrs: 'IAS16.73', statement: 'SFP', balance: 'credit',
    description: 'Accumulated depreciation on property, plant & equipment'
  },

  // ============================================================================
  // LIABILITIES (2000000-2999999)
  // ============================================================================
  
  // Current Liabilities - Payables (2100000-2199999)
  { 
    code: '2100000', name: 'Accounts Payable', type: 'liability', subtype: 'payable', level: 2, control: true,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.LIABILITY.PAYABLE.CONTROL.v1',
    ifrs: 'IAS1.69', statement: 'SFP', balance: 'credit',
    description: 'Control account for all accounts payable'
  },
  { 
    code: '2110000', name: 'Trade Payables', type: 'liability', subtype: 'payable', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.LIABILITY.PAYABLE.TRADE.v1',
    ifrs: 'IAS1.69', statement: 'SFP', balance: 'credit',
    description: 'Amounts owed to suppliers for goods and services'
  },
  { 
    code: '2120000', name: 'Expense Payables', type: 'liability', subtype: 'payable', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.LIABILITY.PAYABLE.EXPENSE.v1',
    ifrs: 'IAS1.69', statement: 'SFP', balance: 'credit',
    description: 'Outstanding invoices for operational expenses'
  },
  { 
    code: '2130000', name: 'Employee Payables', type: 'liability', subtype: 'payable', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.LIABILITY.PAYABLE.EMPLOYEE.v1',
    ifrs: 'IAS19.5', statement: 'SFP', balance: 'credit',
    description: 'Amounts owed to employees and contractors'
  },

  // Accrued Expenses (2200000-2299999)
  { 
    code: '2200000', name: 'Accrued Expenses', type: 'liability', subtype: 'accrued', level: 2, control: true,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.LIABILITY.ACCRUED.CONTROL.v1',
    ifrs: 'IAS1.69', statement: 'SFP', balance: 'credit',
    description: 'Control account for all accrued expenses'
  },
  { 
    code: '2210000', name: 'Accrued Salaries', type: 'liability', subtype: 'accrued', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.LIABILITY.ACCRUED.SALARIES.v1',
    ifrs: 'IAS19.5', statement: 'SFP', balance: 'credit',
    description: 'Accrued but unpaid employee compensation'
  },
  { 
    code: '2220000', name: 'Accrued Commission', type: 'liability', subtype: 'accrued', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.LIABILITY.ACCRUED.COMMISSION.v1',
    ifrs: 'IAS19.5', statement: 'SFP', balance: 'credit',
    description: 'Accrued commission payable to sales staff'
  },
  { 
    code: '2230000', name: 'Accrued Interest', type: 'liability', subtype: 'accrued', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.LIABILITY.ACCRUED.INTEREST.v1',
    ifrs: 'IAS23.5', statement: 'SFP', balance: 'credit',
    description: 'Accrued interest on loans and borrowings'
  },
  { 
    code: '2240000', name: 'Accrued Utilities', type: 'liability', subtype: 'accrued', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.LIABILITY.ACCRUED.UTILITIES.v1',
    ifrs: 'IAS1.69', statement: 'SFP', balance: 'credit',
    description: 'Accrued electricity, water and utility expenses'
  },

  // Customer Deposits & Deferred Revenue (2300000-2399999)
  { 
    code: '2300000', name: 'Customer Deposits', type: 'liability', subtype: 'deferred', level: 2, control: true,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.LIABILITY.DEFERRED.CONTROL.v1',
    ifrs: 'IFRS15.106', statement: 'SFP', balance: 'credit',
    description: 'Control account for customer deposits and deferred revenue'
  },
  { 
    code: '2310000', name: 'Unearned Service Revenue', type: 'liability', subtype: 'deferred', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.LIABILITY.DEFERRED.SERVICE.v1',
    ifrs: 'IFRS15.106', statement: 'SFP', balance: 'credit',
    description: 'Prepaid service packages and memberships'
  },
  { 
    code: '2320000', name: 'Gift Card Liability', type: 'liability', subtype: 'deferred', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.LIABILITY.DEFERRED.GIFTCARD.v1',
    ifrs: 'IFRS15.106', statement: 'SFP', balance: 'credit',
    description: 'Outstanding gift card balances'
  },
  { 
    code: '2330000', name: 'Subscription Deposits', type: 'liability', subtype: 'deferred', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.LIABILITY.DEFERRED.SUBSCRIPTION.v1',
    ifrs: 'IFRS15.106', statement: 'SFP', balance: 'credit',
    description: 'Advance payments for subscription services'
  },
  { 
    code: '2340000', name: 'Security Deposits', type: 'liability', subtype: 'deferred', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.LIABILITY.DEFERRED.SECURITY.v1',
    ifrs: 'IFRS15.106', statement: 'SFP', balance: 'credit',
    description: 'Refundable security deposits from customers'
  },

  // Tax Liabilities (2400000-2499999)
  { 
    code: '2400000', name: 'Tax Liabilities', type: 'liability', subtype: 'tax', level: 2, control: true,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.LIABILITY.TAX.CONTROL.v1',
    ifrs: 'IAS12.5', statement: 'SFP', balance: 'credit',
    description: 'Control account for all tax liabilities'
  },
  { 
    code: '2410000', name: 'Sales Tax Payable', type: 'liability', subtype: 'tax', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.LIABILITY.TAX.SALES.v1',
    ifrs: 'IAS12.5', statement: 'SFP', balance: 'credit',
    description: 'Sales tax, VAT or GST collected from customers'
  },
  { 
    code: '2420000', name: 'Income Tax Payable', type: 'liability', subtype: 'tax', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.LIABILITY.TAX.INCOME.v1',
    ifrs: 'IAS12.5', statement: 'SFP', balance: 'credit',
    description: 'Corporate income tax liability'
  },
  { 
    code: '2430000', name: 'Payroll Tax Payable', type: 'liability', subtype: 'tax', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.LIABILITY.TAX.PAYROLL.v1',
    ifrs: 'IAS19.5', statement: 'SFP', balance: 'credit',
    description: 'Employee tax withholdings and employer contributions'
  },

  // ============================================================================
  // EQUITY (3000000-3999999)
  // ============================================================================
  
  { 
    code: '3100000', name: 'Share Capital', type: 'equity', subtype: 'capital', level: 2, control: true,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EQUITY.CAPITAL.v1',
    ifrs: 'IAS1.79', statement: 'SFP', balance: 'credit',
    description: 'Issued and paid-up share capital'
  },
  { 
    code: '3200000', name: 'Retained Earnings', type: 'equity', subtype: 'earnings', level: 2, control: true,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EQUITY.RETAINED.v1',
    ifrs: 'IAS1.79', statement: 'SFP', balance: 'credit',
    description: 'Accumulated earnings from prior periods'
  },
  { 
    code: '3300000', name: 'Current Year Earnings', type: 'equity', subtype: 'earnings', level: 2, control: true,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EQUITY.CURRENT.v1',
    ifrs: 'IAS1.79', statement: 'SFP', balance: 'credit',
    description: 'Net income/loss for current financial period'
  },
  { 
    code: '3400000', name: 'Additional Paid-in Capital', type: 'equity', subtype: 'capital', level: 2, control: true,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EQUITY.ADDITIONAL.v1',
    ifrs: 'IAS1.79', statement: 'SFP', balance: 'credit',
    description: 'Premium received on share issuance over par value'
  },

  // ============================================================================
  // REVENUE (4000000-4999999)
  // ============================================================================
  
  // Service Revenue (4100000-4199999)
  { 
    code: '4100000', name: 'Service Revenue', type: 'revenue', subtype: 'service', level: 2, control: true,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.REVENUE.SERVICE.CONTROL.v1',
    ifrs: 'IFRS15.46', statement: 'SPL', balance: 'credit',
    description: 'Control account for all service revenue'
  },
  { 
    code: '4110000', name: 'Professional Services Revenue', type: 'revenue', subtype: 'service', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.REVENUE.SERVICE.PROFESSIONAL.v1',
    ifrs: 'IFRS15.46', statement: 'SPL', balance: 'credit',
    description: 'Revenue from professional and consulting services'
  },
  { 
    code: '4120000', name: 'Maintenance Services Revenue', type: 'revenue', subtype: 'service', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.REVENUE.SERVICE.MAINTENANCE.v1',
    ifrs: 'IFRS15.46', statement: 'SPL', balance: 'credit',
    description: 'Revenue from ongoing maintenance and support services'
  },
  { 
    code: '4130000', name: 'Installation Services Revenue', type: 'revenue', subtype: 'service', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.REVENUE.SERVICE.INSTALLATION.v1',
    ifrs: 'IFRS15.46', statement: 'SPL', balance: 'credit',
    description: 'Revenue from installation and setup services'
  },
  { 
    code: '4140000', name: 'Training Services Revenue', type: 'revenue', subtype: 'service', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.REVENUE.SERVICE.TRAINING.v1',
    ifrs: 'IFRS15.46', statement: 'SPL', balance: 'credit',
    description: 'Revenue from training and education services'
  },

  // Product Revenue (4200000-4299999)
  { 
    code: '4200000', name: 'Product Sales Revenue', type: 'revenue', subtype: 'product', level: 2, control: true,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.REVENUE.PRODUCT.CONTROL.v1',
    ifrs: 'IFRS15.46', statement: 'SPL', balance: 'credit',
    description: 'Control account for all product sales revenue'
  },
  { 
    code: '4210000', name: 'Finished Goods Sales', type: 'revenue', subtype: 'product', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.REVENUE.PRODUCT.FINISHED.v1',
    ifrs: 'IFRS15.46', statement: 'SPL', balance: 'credit',
    description: 'Revenue from sale of manufactured products'
  },
  { 
    code: '4220000', name: 'Retail Sales Revenue', type: 'revenue', subtype: 'product', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.REVENUE.PRODUCT.RETAIL.v1',
    ifrs: 'IFRS15.46', statement: 'SPL', balance: 'credit',
    description: 'Revenue from retail product sales'
  },
  { 
    code: '4230000', name: 'Digital Product Sales', type: 'revenue', subtype: 'product', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.REVENUE.PRODUCT.DIGITAL.v1',
    ifrs: 'IFRS15.46', statement: 'SPL', balance: 'credit',
    description: 'Revenue from digital products and software licenses'
  },

  // Subscription & Package Revenue (4300000-4399999)
  { 
    code: '4300000', name: 'Subscription Revenue', type: 'revenue', subtype: 'subscription', level: 2, control: true,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.REVENUE.SUBSCRIPTION.CONTROL.v1',
    ifrs: 'IFRS15.46', statement: 'SPL', balance: 'credit',
    description: 'Control account for subscription and recurring revenue'
  },
  { 
    code: '4310000', name: 'Monthly Subscriptions', type: 'revenue', subtype: 'subscription', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.REVENUE.SUBSCRIPTION.MONTHLY.v1',
    ifrs: 'IFRS15.46', statement: 'SPL', balance: 'credit',
    description: 'Monthly subscription revenue'
  },
  { 
    code: '4320000', name: 'Annual Subscriptions', type: 'revenue', subtype: 'subscription', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.REVENUE.SUBSCRIPTION.ANNUAL.v1',
    ifrs: 'IFRS15.46', statement: 'SPL', balance: 'credit',
    description: 'Annual subscription revenue'
  },
  { 
    code: '4330000', name: 'Package Sales Revenue', type: 'revenue', subtype: 'package', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.REVENUE.PACKAGE.v1',
    ifrs: 'IFRS15.46', statement: 'SPL', balance: 'credit',
    description: 'Revenue from bundled service packages'
  },
  { 
    code: '4340000', name: 'Membership Revenue', type: 'revenue', subtype: 'membership', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.REVENUE.MEMBERSHIP.v1',
    ifrs: 'IFRS15.46', statement: 'SPL', balance: 'credit',
    description: 'Membership fees and loyalty program revenue'
  },

  // Other Revenue (4400000-4499999)
  { 
    code: '4400000', name: 'Other Revenue', type: 'revenue', subtype: 'other', level: 2, control: true,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.REVENUE.OTHER.CONTROL.v1',
    ifrs: 'IFRS15.46', statement: 'SPL', balance: 'credit',
    description: 'Control account for other revenue sources'
  },
  { 
    code: '4410000', name: 'Interest Income', type: 'revenue', subtype: 'other', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.REVENUE.OTHER.INTEREST.v1',
    ifrs: 'IFRS9.5.4.1', statement: 'SPL', balance: 'credit',
    description: 'Interest earned on bank deposits and investments'
  },
  { 
    code: '4420000', name: 'Late Fee Income', type: 'revenue', subtype: 'other', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.REVENUE.OTHER.LATEFEE.v1',
    ifrs: 'IFRS15.46', statement: 'SPL', balance: 'credit',
    description: 'Late payment fees and penalties from customers'
  },
  { 
    code: '4430000', name: 'Foreign Exchange Gain', type: 'revenue', subtype: 'other', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.REVENUE.OTHER.FX_GAIN.v1',
    ifrs: 'IAS21.28', statement: 'SPL', balance: 'credit',
    description: 'Gains on foreign currency transactions'
  },

  // ============================================================================
  // EXPENSES (5000000-5999999)
  // ============================================================================
  
  // Cost of Sales (5100000-5199999)
  { 
    code: '5100000', name: 'Cost of Sales', type: 'expense', subtype: 'cogs', level: 2, control: true,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.COGS.CONTROL.v1',
    ifrs: 'IAS2.34', statement: 'SPL', balance: 'debit',
    description: 'Control account for cost of goods/services sold'
  },
  { 
    code: '5110000', name: 'Material Costs', type: 'expense', subtype: 'cogs', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.COGS.MATERIALS.v1',
    ifrs: 'IAS2.34', statement: 'SPL', balance: 'debit',
    description: 'Direct material costs for products and services'
  },
  { 
    code: '5120000', name: 'Direct Labor Costs', type: 'expense', subtype: 'cogs', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.COGS.LABOR.v1',
    ifrs: 'IAS19.5', statement: 'SPL', balance: 'debit',
    description: 'Direct labor costs for production and service delivery'
  },
  { 
    code: '5130000', name: 'Subcontractor Costs', type: 'expense', subtype: 'cogs', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.COGS.SUBCONTRACTOR.v1',
    ifrs: 'IAS2.34', statement: 'SPL', balance: 'debit',
    description: 'External contractor and outsourcing costs'
  },
  { 
    code: '5140000', name: 'Commission Expense', type: 'expense', subtype: 'cogs', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.COGS.COMMISSION.v1',
    ifrs: 'IAS19.5', statement: 'SPL', balance: 'debit',
    description: 'Sales commission and performance-based compensation'
  },
  { 
    code: '5150000', name: 'Shipping & Delivery', type: 'expense', subtype: 'cogs', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.COGS.SHIPPING.v1',
    ifrs: 'IAS2.34', statement: 'SPL', balance: 'debit',
    description: 'Costs for product delivery and shipping'
  },

  // Personnel Costs (5200000-5299999)
  { 
    code: '5200000', name: 'Personnel Costs', type: 'expense', subtype: 'personnel', level: 2, control: true,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.PERSONNEL.CONTROL.v1',
    ifrs: 'IAS19.5', statement: 'SPL', balance: 'debit',
    description: 'Control account for all personnel-related expenses'
  },
  { 
    code: '5210000', name: 'Salaries & Wages', type: 'expense', subtype: 'personnel', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.PERSONNEL.SALARIES.v1',
    ifrs: 'IAS19.5', statement: 'SPL', balance: 'debit',
    description: 'Base salaries and hourly wages'
  },
  { 
    code: '5220000', name: 'Employee Benefits', type: 'expense', subtype: 'personnel', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.PERSONNEL.BENEFITS.v1',
    ifrs: 'IAS19.5', statement: 'SPL', balance: 'debit',
    description: 'Health insurance, retirement and other employee benefits'
  },
  { 
    code: '5230000', name: 'Training & Development', type: 'expense', subtype: 'personnel', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.PERSONNEL.TRAINING.v1',
    ifrs: 'IAS19.5', statement: 'SPL', balance: 'debit',
    description: 'Employee training and professional development costs'
  },
  { 
    code: '5240000', name: 'Recruitment Costs', type: 'expense', subtype: 'personnel', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.PERSONNEL.RECRUITMENT.v1',
    ifrs: 'IAS19.5', statement: 'SPL', balance: 'debit',
    description: 'Hiring and recruitment expenses'
  },

  // Operating Expenses (6000000-6999999) - General & Administrative
  { 
    code: '6000000', name: 'General & Administrative', type: 'expense', subtype: 'admin', level: 2, control: true,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.ADMIN.CONTROL.v1',
    ifrs: 'IAS1.103', statement: 'SPL', balance: 'debit',
    description: 'Control account for general and administrative expenses'
  },
  { 
    code: '6100000', name: 'Rent & Occupancy', type: 'expense', subtype: 'admin', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.ADMIN.RENT.v1',
    ifrs: 'IFRS16.53', statement: 'SPL', balance: 'debit',
    description: 'Office rent and occupancy costs'
  },
  { 
    code: '6110000', name: 'Utilities', type: 'expense', subtype: 'admin', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.ADMIN.UTILITIES.v1',
    ifrs: 'IAS1.103', statement: 'SPL', balance: 'debit',
    description: 'Electricity, water, gas and other utility expenses'
  },
  { 
    code: '6120000', name: 'Insurance Expense', type: 'expense', subtype: 'admin', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.ADMIN.INSURANCE.v1',
    ifrs: 'IAS1.103', statement: 'SPL', balance: 'debit',
    description: 'Business insurance premiums and coverage costs'
  },
  { 
    code: '6130000', name: 'Professional Services', type: 'expense', subtype: 'admin', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.ADMIN.PROFESSIONAL.v1',
    ifrs: 'IAS1.103', statement: 'SPL', balance: 'debit',
    description: 'Legal, accounting and professional consulting fees'
  },
  { 
    code: '6140000', name: 'Office Supplies', type: 'expense', subtype: 'admin', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.ADMIN.SUPPLIES.v1',
    ifrs: 'IAS1.103', statement: 'SPL', balance: 'debit',
    description: 'Office supplies and administrative materials'
  },
  { 
    code: '6150000', name: 'Telecommunications', type: 'expense', subtype: 'admin', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.ADMIN.TELECOM.v1',
    ifrs: 'IAS1.103', statement: 'SPL', balance: 'debit',
    description: 'Phone, internet and communication expenses'
  },
  { 
    code: '6160000', name: 'Maintenance & Repairs', type: 'expense', subtype: 'admin', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.ADMIN.MAINTENANCE.v1',
    ifrs: 'IAS1.103', statement: 'SPL', balance: 'debit',
    description: 'Equipment maintenance and repair costs'
  },

  // Marketing & Sales (6200000-6299999)
  { 
    code: '6200000', name: 'Marketing & Sales', type: 'expense', subtype: 'marketing', level: 2, control: true,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.MARKETING.CONTROL.v1',
    ifrs: 'IAS1.103', statement: 'SPL', balance: 'debit',
    description: 'Control account for marketing and sales expenses'
  },
  { 
    code: '6210000', name: 'Digital Marketing', type: 'expense', subtype: 'marketing', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.MARKETING.DIGITAL.v1',
    ifrs: 'IAS1.103', statement: 'SPL', balance: 'debit',
    description: 'Online advertising and digital marketing campaigns'
  },
  { 
    code: '6220000', name: 'Traditional Marketing', type: 'expense', subtype: 'marketing', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.MARKETING.TRADITIONAL.v1',
    ifrs: 'IAS1.103', statement: 'SPL', balance: 'debit',
    description: 'Print, radio, TV and traditional advertising'
  },
  { 
    code: '6230000', name: 'Events & Trade Shows', type: 'expense', subtype: 'marketing', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.MARKETING.EVENTS.v1',
    ifrs: 'IAS1.103', statement: 'SPL', balance: 'debit',
    description: 'Trade show participation and event marketing costs'
  },
  { 
    code: '6240000', name: 'Customer Loyalty Programs', type: 'expense', subtype: 'marketing', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.MARKETING.LOYALTY.v1',
    ifrs: 'IAS1.103', statement: 'SPL', balance: 'debit',
    description: 'Customer loyalty and retention program costs'
  },

  // Technology & IT (6300000-6399999)
  { 
    code: '6300000', name: 'Technology & IT', type: 'expense', subtype: 'technology', level: 2, control: true,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.TECHNOLOGY.CONTROL.v1',
    ifrs: 'IAS1.103', statement: 'SPL', balance: 'debit',
    description: 'Control account for technology and IT expenses'
  },
  { 
    code: '6310000', name: 'Software Licenses', type: 'expense', subtype: 'technology', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.TECHNOLOGY.SOFTWARE.v1',
    ifrs: 'IAS1.103', statement: 'SPL', balance: 'debit',
    description: 'Software licensing and subscription costs'
  },
  { 
    code: '6320000', name: 'Cloud Services', type: 'expense', subtype: 'technology', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.TECHNOLOGY.CLOUD.v1',
    ifrs: 'IAS1.103', statement: 'SPL', balance: 'debit',
    description: 'Cloud hosting and infrastructure services'
  },
  { 
    code: '6330000', name: 'IT Support & Maintenance', type: 'expense', subtype: 'technology', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.TECHNOLOGY.SUPPORT.v1',
    ifrs: 'IAS1.103', statement: 'SPL', balance: 'debit',
    description: 'IT support and system maintenance costs'
  },

  // Depreciation & Amortization (6400000-6499999)
  { 
    code: '6400000', name: 'Depreciation & Amortization', type: 'expense', subtype: 'depreciation', level: 2, control: true,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.DEPRECIATION.CONTROL.v1',
    ifrs: 'IAS16.48', statement: 'SPL', balance: 'debit',
    description: 'Control account for depreciation and amortization'
  },
  { 
    code: '6410000', name: 'Building Depreciation', type: 'expense', subtype: 'depreciation', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.DEPRECIATION.BUILDING.v1',
    ifrs: 'IAS16.48', statement: 'SPL', balance: 'debit',
    description: 'Depreciation expense on buildings and improvements'
  },
  { 
    code: '6420000', name: 'Equipment Depreciation', type: 'expense', subtype: 'depreciation', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.DEPRECIATION.EQUIPMENT.v1',
    ifrs: 'IAS16.48', statement: 'SPL', balance: 'debit',
    description: 'Depreciation expense on machinery and equipment'
  },
  { 
    code: '6430000', name: 'Software Amortization', type: 'expense', subtype: 'depreciation', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.DEPRECIATION.SOFTWARE.v1',
    ifrs: 'IAS38.97', statement: 'SPL', balance: 'debit',
    description: 'Amortization of software and intangible assets'
  },

  // Financial Expenses (6500000-6599999)
  { 
    code: '6500000', name: 'Financial Expenses', type: 'expense', subtype: 'financial', level: 2, control: true,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.FINANCIAL.CONTROL.v1',
    ifrs: 'IAS23.5', statement: 'SPL', balance: 'debit',
    description: 'Control account for financial and interest expenses'
  },
  { 
    code: '6510000', name: 'Interest Expense', type: 'expense', subtype: 'financial', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.FINANCIAL.INTEREST.v1',
    ifrs: 'IAS23.5', statement: 'SPL', balance: 'debit',
    description: 'Interest expense on loans and borrowings'
  },
  { 
    code: '6520000', name: 'Bank Fees', type: 'expense', subtype: 'financial', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.FINANCIAL.BANKFEES.v1',
    ifrs: 'IAS1.103', statement: 'SPL', balance: 'debit',
    description: 'Bank service charges and transaction fees'
  },
  { 
    code: '6530000', name: 'Foreign Exchange Loss', type: 'expense', subtype: 'financial', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.FINANCIAL.FX_LOSS.v1',
    ifrs: 'IAS21.28', statement: 'SPL', balance: 'debit',
    description: 'Losses on foreign currency transactions'
  },
  { 
    code: '6540000', name: 'Bad Debt Expense', type: 'expense', subtype: 'financial', level: 3, control: false,
    smartCode: 'HERA.PLATFORM.FINANCE.GL.EXPENSE.FINANCIAL.BADDEBT.v1',
    ifrs: 'IFRS9.5.5', statement: 'SPL', balance: 'debit',
    description: 'Write-offs and provision for uncollectible receivables'
  }
];

async function createPlatformCOA() {
  console.log('🏗️  HERA Platform Universal Chart of Accounts Generator');
  console.log('======================================================');
  console.log(`Target Organization: Platform (${PLATFORM_ORG_ID})`);
  console.log(`Total Accounts: ${UNIVERSAL_COA.length}`);
  console.log(`Coverage: Assets, Liabilities, Equity, Revenue, Expenses`);
  console.log(`Compliance: IFRS, Multi-Currency Ready, Industry Agnostic\n`);

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const account of UNIVERSAL_COA) {
    try {
      // Create GL account entity
      const { data: entity, error: entityError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: PLATFORM_ORG_ID,
          entity_type: 'gl_account',
          entity_code: account.code,
          entity_name: account.name,
          smart_code: account.smartCode,
          created_by: PLATFORM_USER_ID,
          updated_by: PLATFORM_USER_ID,
          status: 'active',
          metadata: {
            account_type: account.type,
            account_subtype: account.subtype,
            account_level: account.level,
            is_control_account: account.control,
            normal_balance: account.balance,
            currency: 'MULTI',
            is_active: true,
            description: account.description,
            ifrs_mapping: {
              ifrs_code: account.ifrs,
              statement_type: account.statement,
              classification: account.level === 2 ? 'control' : 'detail'
            }
          }
        })
        .select()
        .single();

      if (entityError) throw entityError;

      // Add detailed dynamic data
      const dynamicFields = [
        { field_name: 'account_type', field_type: 'text', field_value_text: account.type },
        { field_name: 'account_subtype', field_type: 'text', field_value_text: account.subtype },
        { field_name: 'account_level', field_type: 'number', field_value_number: account.level },
        { field_name: 'is_control_account', field_type: 'boolean', field_value_boolean: account.control },
        { field_name: 'normal_balance', field_type: 'text', field_value_text: account.balance },
        { field_name: 'ifrs_code', field_type: 'text', field_value_text: account.ifrs },
        { field_name: 'statement_type', field_type: 'text', field_value_text: account.statement },
        { field_name: 'description', field_type: 'text', field_value_text: account.description },
        { field_name: 'usage_notes', field_type: 'text', field_value_text: account.description }
      ];

      for (const field of dynamicFields) {
        await supabase
          .from('core_dynamic_data')
          .insert({
            organization_id: PLATFORM_ORG_ID,
            entity_id: entity.id,
            field_name: field.field_name,
            field_type: field.field_type,
            field_value_text: field.field_value_text || null,
            field_value_number: field.field_value_number || null,
            field_value_boolean: field.field_value_boolean || null,
            smart_code: `HERA.PLATFORM.FINANCE.GL.FIELD.${field.field_name.toUpperCase()}.v1`,
            created_by: PLATFORM_USER_ID,
            updated_by: PLATFORM_USER_ID
          });
      }

      console.log(`✅ ${account.code} - ${account.name} (${account.type}/${account.subtype})`);
      successCount++;

    } catch (error) {
      console.error(`❌ ${account.code} - ${account.name}: ${error.message}`);
      errors.push({ account: account.code, error: error.message });
      errorCount++;
    }
  }

  console.log('\n========================================');
  console.log('📊 PLATFORM COA GENERATION SUMMARY');
  console.log('========================================');
  console.log(`✅ Successfully created: ${successCount} accounts`);
  console.log(`❌ Errors: ${errorCount}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Error Details:');
    errors.forEach(err => console.log(`   ${err.account}: ${err.error}`));
  }

  console.log('\n🎯 Platform COA Features:');
  console.log('   • Complete account hierarchy (Level 2 control, Level 3 detail)');
  console.log('   • IFRS compliant with full statement mapping');
  console.log('   • Multi-currency ready for any organization');
  console.log('   • Industry agnostic - covers all business types');
  console.log('   • Standardized HERA DNA smart codes');
  console.log('   • Comprehensive metadata for automation');
  console.log('   • Control accounts for proper reporting');

  console.log('\n📋 Account Summary by Type:');
  const accountsByType = UNIVERSAL_COA.reduce((acc, account) => {
    acc[account.type] = (acc[account.type] || 0) + 1;
    return acc;
  }, {});
  
  Object.entries(accountsByType).forEach(([type, count]) => {
    console.log(`   • ${type.toUpperCase()}: ${count} accounts`);
  });

  console.log('\n🚀 Next Steps:');
  console.log('   1. Create industry-specific templates');
  console.log('   2. Add country localization (UAE VAT, India GST)');
  console.log('   3. Build organization assignment system');
  console.log('   4. Test with sample organizations');

  return {
    success: successCount,
    errors: errorCount,
    total: UNIVERSAL_COA.length,
    details: errors
  };
}

// Execute if run directly
if (require.main === module) {
  createPlatformCOA()
    .then(result => {
      console.log('\n✨ Platform Universal COA Generation Complete!');
      console.log(`📊 Results: ${result.success}/${result.total} accounts created`);
      if (result.errors === 0) {
        console.log('🎉 Perfect! Ready for industry templates and organization assignment.');
      }
      process.exit(result.errors > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { createPlatformCOA, UNIVERSAL_COA };