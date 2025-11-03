/**
 * HERA Standard Demo Organization
 * This is the default organization used for all development and demos
 */

export const STANDARD_DEMO_ORGANIZATION = {
  id: '550e8400-e29b-41d4-a716-446655440000', // Fixed UUID for consistency
  entity_id: '550e8400-e29b-41d4-a716-446655440001',
  name: 'HERA Demo Corporation',
  type: 'corporation',
  industry: 'technology',
  country: 'AE',
  currency: 'AED',
  fiscal_year_start: '2024-01-01',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-10-31T00:00:00Z'
}

export const STANDARD_DEMO_USER = {
  id: '660e8400-e29b-41d4-a716-446655440000', // Fixed UUID for consistency
  entity_id: '660e8400-e29b-41d4-a716-446655440001',
  email: 'demo@heraerp.com',
  name: 'Demo User',
  role: 'admin',
  organization_id: STANDARD_DEMO_ORGANIZATION.id
}

// Standard Chart of Accounts for Demo Organization
export const STANDARD_CHART_OF_ACCOUNTS = [
  // Assets
  { code: '1000', name: 'Current Assets', type: 'ASSET', category: 'CURRENT' },
  { code: '1100', name: 'Cash and Cash Equivalents', type: 'ASSET', category: 'CURRENT' },
  { code: '1110', name: 'Petty Cash', type: 'ASSET', category: 'CURRENT' },
  { code: '1120', name: 'Bank Account - Main', type: 'ASSET', category: 'CURRENT' },
  { code: '1200', name: 'Accounts Receivable', type: 'ASSET', category: 'CURRENT' },
  { code: '1300', name: 'Inventory', type: 'ASSET', category: 'CURRENT' },
  { code: '1500', name: 'Fixed Assets', type: 'ASSET', category: 'NON_CURRENT' },
  { code: '1510', name: 'Equipment', type: 'ASSET', category: 'NON_CURRENT' },
  { code: '1520', name: 'Accumulated Depreciation', type: 'ASSET', category: 'NON_CURRENT' },
  
  // Liabilities
  { code: '2000', name: 'Current Liabilities', type: 'LIABILITY', category: 'CURRENT' },
  { code: '2100', name: 'Accounts Payable', type: 'LIABILITY', category: 'CURRENT' },
  { code: '2200', name: 'Accrued Expenses', type: 'LIABILITY', category: 'CURRENT' },
  { code: '2300', name: 'Short-term Loans', type: 'LIABILITY', category: 'CURRENT' },
  { code: '2500', name: 'Long-term Liabilities', type: 'LIABILITY', category: 'NON_CURRENT' },
  
  // Equity
  { code: '3000', name: 'Owner\'s Equity', type: 'EQUITY', category: 'EQUITY' },
  { code: '3100', name: 'Retained Earnings', type: 'EQUITY', category: 'EQUITY' },
  { code: '3200', name: 'Current Year Earnings', type: 'EQUITY', category: 'EQUITY' },
  
  // Revenue
  { code: '4000', name: 'Revenue', type: 'REVENUE', category: 'OPERATING' },
  { code: '4100', name: 'Sales Revenue', type: 'REVENUE', category: 'OPERATING' },
  { code: '4200', name: 'Service Revenue', type: 'REVENUE', category: 'OPERATING' },
  { code: '4900', name: 'Other Income', type: 'REVENUE', category: 'NON_OPERATING' },
  
  // Expenses
  { code: '5000', name: 'Cost of Goods Sold', type: 'EXPENSE', category: 'COGS' },
  { code: '6000', name: 'Operating Expenses', type: 'EXPENSE', category: 'OPERATING' },
  { code: '6100', name: 'Salaries and Wages', type: 'EXPENSE', category: 'OPERATING' },
  { code: '6200', name: 'Rent Expense', type: 'EXPENSE', category: 'OPERATING' },
  { code: '6300', name: 'Utilities', type: 'EXPENSE', category: 'OPERATING' },
  { code: '6400', name: 'Office Supplies', type: 'EXPENSE', category: 'OPERATING' },
  { code: '6500', name: 'Marketing and Advertising', type: 'EXPENSE', category: 'OPERATING' },
  { code: '6600', name: 'Professional Services', type: 'EXPENSE', category: 'OPERATING' },
  { code: '6700', name: 'Insurance', type: 'EXPENSE', category: 'OPERATING' },
  { code: '6800', name: 'Depreciation Expense', type: 'EXPENSE', category: 'OPERATING' },
  { code: '6900', name: 'Interest Expense', type: 'EXPENSE', category: 'NON_OPERATING' }
]

// Standard Master Data Templates
export const STANDARD_CUSTOMERS = [
  {
    code: 'CUST001',
    name: 'ABC Trading LLC',
    email: 'contact@abctrading.ae',
    phone: '+971-4-1234567',
    address: 'Dubai, UAE',
    credit_limit: 50000,
    payment_terms: '30 days'
  },
  {
    code: 'CUST002', 
    name: 'XYZ Industries',
    email: 'sales@xyzind.com',
    phone: '+971-4-2345678',
    address: 'Abu Dhabi, UAE',
    credit_limit: 75000,
    payment_terms: '45 days'
  }
]

export const STANDARD_VENDORS = [
  {
    code: 'VEND001',
    name: 'Office Supplies Co.',
    email: 'orders@officesupplies.ae',
    phone: '+971-4-3456789',
    address: 'Sharjah, UAE',
    payment_terms: '30 days'
  },
  {
    code: 'VEND002',
    name: 'Tech Equipment LLC',
    email: 'sales@techequip.com',
    phone: '+971-4-4567890', 
    address: 'Dubai, UAE',
    payment_terms: '15 days'
  }
]

export const STANDARD_PRODUCTS = [
  {
    code: 'PROD001',
    name: 'Laptop Computer',
    description: 'High-performance business laptop',
    category: 'Electronics',
    unit_price: 3500,
    cost_price: 2800,
    stock_quantity: 25
  },
  {
    code: 'PROD002',
    name: 'Office Chair',
    description: 'Ergonomic office chair',
    category: 'Furniture',
    unit_price: 850,
    cost_price: 600,
    stock_quantity: 50
  }
]

// Helper functions
export function getStandardOrgId(): string {
  return STANDARD_DEMO_ORGANIZATION.id
}

export function getStandardUserId(): string {
  return STANDARD_DEMO_USER.id
}

export function createEntityWithStandardOrg(entityData: any) {
  return {
    ...entityData,
    organization_id: getStandardOrgId(),
    created_by: getStandardUserId(),
    updated_by: getStandardUserId()
  }
}

export function createTransactionWithStandardOrg(transactionData: any) {
  return {
    ...transactionData,
    organization_id: getStandardOrgId(),
    created_by: getStandardUserId(),
    updated_by: getStandardUserId()
  }
}