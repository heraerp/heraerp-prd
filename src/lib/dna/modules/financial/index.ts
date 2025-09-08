/**
 * HERA Financial Modules Index
 * Central registry for all financial DNA modules
 * Smart Code: HERA.FIN.MODULE.INDEX.v1
 * 
 * This index provides easy discovery and access to all financial modules
 */

// Import all financial modules
import { GL_MODULE_DNA } from './gl-module-dna'
import { AP_MODULE_DNA } from './ap-module-dna'
import { AR_MODULE_DNA } from './ar-module-dna'
import { FA_MODULE_DNA } from './fa-module-dna'

// Module metadata type
interface ModuleMetadata {
  id: string
  name: string
  description: string
  category: string
  subcategory: string
  location: string
  documentation?: string
  dependencies?: string[]
  features?: string[]
  industryAdaptations?: Record<string, any>
  relatedModules?: string[]
}

/**
 * Complete Financial Module Registry
 * All HERA FI modules with metadata for easy discovery
 */
export const FINANCIAL_MODULE_REGISTRY: Record<string, ModuleMetadata> = {
  // Core Financial Modules
  'HERA.FIN.GL.MODULE.v1': {
    id: 'HERA.FIN.GL.MODULE.v1',
    name: 'General Ledger Module',
    description: 'Complete GL management with journal entries, COA, reporting, and period management',
    category: 'financial',
    subcategory: 'general_ledger',
    location: '/src/lib/dna/modules/financial/gl-module-dna.tsx',
    documentation: '/src/app/docs/features/gl/page.tsx',
    dependencies: ['universalApi', 'Chart of Accounts', 'Organization context'],
    features: [
      'Journal entry creation and posting',
      'Chart of Accounts management',
      'Period management and closing',
      'Auto-journal rules engine',
      'Multi-currency support',
      'Batch posting capabilities',
      'Audit trail tracking',
      'Financial reporting'
    ],
    industryAdaptations: {
      iceCream: 'Cold chain accounts, temperature variance journals, seasonal analysis',
      restaurant: 'Daily closing, multi-location consolidation, recipe costing',
      healthcare: 'Patient billing integration, insurance posting, department allocation'
    },
    relatedModules: ['AP', 'AR', 'FA', 'Auto-Journal Engine']
  },

  'HERA.FIN.AP.MODULE.v1': {
    id: 'HERA.FIN.AP.MODULE.v1',
    name: 'Accounts Payable Module',
    description: 'Vendor management, invoice processing, payment workflows, and aging analysis',
    category: 'financial',
    subcategory: 'accounts_payable',
    location: '/src/lib/dna/modules/financial/ap-module-dna.tsx',
    dependencies: ['GL Module', 'universalApi', 'Vendor entities'],
    features: [
      'Vendor management',
      'Purchase invoice processing',
      'Payment processing',
      'Aging analysis',
      'Approval workflows',
      'Early payment discounts',
      'Recurring invoices',
      'Multi-currency support',
      '3-way matching'
    ],
    industryAdaptations: {
      iceCream: 'Dairy supplier tracking, cold chain vendor management, quality certificates, seasonal pricing',
      restaurant: 'Food supplier management, delivery tracking, invoice matching',
      healthcare: 'Medical supplier tracking, compliance certificates'
    },
    relatedModules: ['GL', 'Cash Management', 'Purchase Order']
  },

  'HERA.FIN.AR.MODULE.v1': {
    id: 'HERA.FIN.AR.MODULE.v1',
    name: 'Accounts Receivable Module',
    description: 'Customer management, invoice generation, collections workflow, and credit management',
    category: 'financial',
    subcategory: 'accounts_receivable',
    location: '/src/lib/dna/modules/financial/ar-module-dna.tsx',
    dependencies: ['GL Module', 'universalApi', 'Customer entities'],
    features: [
      'Customer management',
      'Sales invoice generation',
      'Payment collection',
      'Credit management',
      'Collections workflow',
      'Statement generation',
      'Aging analysis',
      'Multi-currency support',
      'Dunning letters'
    ],
    industryAdaptations: {
      iceCream: 'Multi-channel billing, freezer deposit tracking, seasonal terms, cold chain compensation',
      retail: 'POS integration, loyalty programs, returns processing',
      services: 'Recurring billing, project invoicing, retainer management'
    },
    relatedModules: ['GL', 'Sales Order', 'Cash Management']
  },

  'HERA.FIN.FA.MODULE.v1': {
    id: 'HERA.FIN.FA.MODULE.v1',
    name: 'Fixed Assets Module',
    description: 'Asset lifecycle management from acquisition to disposal with depreciation automation',
    category: 'financial',
    subcategory: 'fixed_assets',
    location: '/src/lib/dna/modules/financial/fa-module-dna.tsx',
    dependencies: ['GL Module', 'universalApi'],
    features: [
      'Asset registration',
      'Depreciation calculation',
      'Asset transfers',
      'Maintenance tracking',
      'Disposal management',
      'Revaluation',
      'Barcode integration',
      'Insurance tracking',
      'Physical inventory'
    ],
    industryAdaptations: {
      iceCream: 'Freezer fleet management, cold chain equipment, refrigerated vehicles, energy tracking',
      manufacturing: 'Production equipment, tooling management, capacity tracking',
      retail: 'Store fixtures, POS equipment, display units'
    },
    relatedModules: ['GL', 'Maintenance', 'Insurance']
  }
}

/**
 * Related Financial Components and Systems
 */
export const FINANCIAL_COMPONENT_REGISTRY = {
  // Fiscal Close System
  'HERA.FIN.FISCAL.CLOSE.ENGINE.v1': {
    name: 'Fiscal Year Close DNA',
    location: '/src/lib/dna/fiscal-year/fiscal-close-engine.ts',
    cli: '/mcp-server/fiscal-close-dna-cli.js',
    api: '/src/app/api/v1/financial/close/year/route.ts',
    documentation: '/docs/FISCAL-YEAR-CLOSE-DNA.md',
    description: '8-step automated year-end closing with GL integration'
  },
  // Dashboards
  'HERA.FIN.UI.DASHBOARD.v1': {
    name: 'FIN Dashboard',
    location: '/src/components/fin/FINDashboard.tsx',
    description: 'Central financial management dashboard with cash position and KPIs'
  },
  
  // Cashflow System
  'HERA.FIN.CASHFLOW.SYSTEM.v1': {
    name: 'Universal Cashflow DNA',
    location: '/src/components/cashflow/CashflowDashboard.tsx',
    cli: '/mcp-server/cashflow-dna-cli.js',
    description: 'Real-time cashflow statements with industry-specific intelligence'
  },
  
  // Auto-Journal Engine
  'HERA.FIN.AUTO.JOURNAL.ENGINE.v1': {
    name: 'Auto-Journal Engine',
    documentation: '/src/app/docs/features/auto-journal/page.tsx',
    description: '85% automation rate for journal entry creation, $34,560 annual savings'
  },
  
  // Daily Operations
  'HERA.FIN.DAILY.CASH.CLOSE.v1': {
    name: 'Daily Cash Close',
    location: '/src/components/pos/DailyCashClose.tsx',
    description: 'POS reconciliation and daily closing procedures'
  },
  
  // Period Management
  'HERA.FIN.YEAR.END.CLOSE.v1': {
    name: 'Year-End Closing Wizard',
    location: '/src/components/accounting/YearEndClosingWizard.tsx',
    checklist: '/src/components/accounting/FiscalCloseChecklist.tsx',
    description: 'Fiscal year closing and balance carry forward'
  },
  
  // Financial Reports
  'HERA.FIN.TRIAL.BALANCE.v1': {
    name: 'Trial Balance DNA',
    cli: '/mcp-server/trial-balance-dna-cli.js',
    description: 'Professional trial balance with industry configurations'
  },
  
  'HERA.FIN.BALANCE.SHEET.v1': {
    name: 'Balance Sheet DNA',
    sql: '/database/dna-updates/balance-sheet-dna.sql',
    description: 'Automated balance sheet generation'
  }
}

/**
 * Helper functions for module discovery
 */
export function getFinancialModule(moduleId: string) {
  return FINANCIAL_MODULE_REGISTRY[moduleId]
}

export function getModulesByCategory(category: string) {
  return Object.values(FINANCIAL_MODULE_REGISTRY).filter(
    module => module.subcategory === category
  )
}

export function getModulesByIndustry(industry: string) {
  return Object.values(FINANCIAL_MODULE_REGISTRY).filter(
    module => module.industryAdaptations && industry in module.industryAdaptations
  )
}

export function getAllFinancialModules() {
  return Object.values(FINANCIAL_MODULE_REGISTRY)
}

/**
 * Module loading and initialization
 */
export const FINANCIAL_MODULES = {
  GL: GL_MODULE_DNA,
  AP: AP_MODULE_DNA,
  AR: AR_MODULE_DNA,
  FA: FA_MODULE_DNA
}

// Export individual modules for direct import
export { GL_MODULE_DNA } from './gl-module-dna'
export { AP_MODULE_DNA } from './ap-module-dna'
export { AR_MODULE_DNA } from './ar-module-dna'
export { FA_MODULE_DNA } from './fa-module-dna'

/**
 * Smart Code Patterns for Financial Modules
 */
export const FINANCIAL_SMART_CODE_PATTERNS = {
  // GL Patterns
  GL_JOURNAL: 'HERA.FIN.GL.TXN.JE.*',
  GL_ACCOUNT: 'HERA.FIN.GL.ACC.*',
  GL_REPORT: 'HERA.FIN.GL.RPT.*',
  
  // AP Patterns
  AP_INVOICE: 'HERA.FIN.AP.TXN.INV.*',
  AP_PAYMENT: 'HERA.FIN.AP.TXN.PAY.*',
  AP_VENDOR: 'HERA.FIN.AP.VND.*',
  
  // AR Patterns
  AR_INVOICE: 'HERA.FIN.AR.TXN.INV.*',
  AR_RECEIPT: 'HERA.FIN.AR.TXN.RCP.*',
  AR_CUSTOMER: 'HERA.FIN.AR.CUS.*',
  
  // FA Patterns
  FA_ASSET: 'HERA.FIN.FA.AST.*',
  FA_DEPRECIATION: 'HERA.FIN.FA.DEP.*',
  FA_DISPOSAL: 'HERA.FIN.FA.DSP.*'
}

// Default export for easy access
export default FINANCIAL_MODULE_REGISTRY