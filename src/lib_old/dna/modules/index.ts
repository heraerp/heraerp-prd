/**
 * HERA DNA Modules Master Index
 * Central registry for all DNA modules across the system
 * Smart Code: HERA.DNA.MODULE.MASTER.INDEX.V1
 *
 * This master index provides unified discovery and access to all HERA DNA modules
 */

// Import module registries
import { FINANCIAL_MODULE_REGISTRY, FINANCIAL_COMPONENT_REGISTRY } from './financial'

// Master module type
interface MasterModuleEntry {
  id: string
  name: string
  category: string
  type: 'module' | 'component' | 'system' | 'integration'
  location?: string
  status: 'production' | 'beta' | 'development' | 'planned'
  description: string
}

/**
 * Master Registry of All HERA DNA Modules
 */
export const HERA_DNA_MASTER_REGISTRY: Record<string, MasterModuleEntry> = {
  // ============================================
  // FINANCIAL MODULES (FI)
  // ============================================
  'HERA.FIN.GL.MODULE.v1': {
    id: 'HERA.FIN.GL.MODULE.v1',
    name: 'General Ledger Module',
    category: 'financial',
    type: 'module',
    location: '/src/lib/dna/modules/financial/gl-module-dna.tsx',
    status: 'production',
    description: 'Complete GL management with journal entries, COA, and period management'
  },

  'HERA.FIN.AP.MODULE.v1': {
    id: 'HERA.FIN.AP.MODULE.v1',
    name: 'Accounts Payable Module',
    category: 'financial',
    type: 'module',
    location: '/src/lib/dna/modules/financial/ap-module-dna.tsx',
    status: 'production',
    description: 'Vendor management, invoice processing, and payment workflows'
  },

  'HERA.FIN.AR.MODULE.v1': {
    id: 'HERA.FIN.AR.MODULE.v1',
    name: 'Accounts Receivable Module',
    category: 'financial',
    type: 'module',
    location: '/src/lib/dna/modules/financial/ar-module-dna.tsx',
    status: 'production',
    description: 'Customer management, invoicing, and collections'
  },

  'HERA.FIN.FA.MODULE.v1': {
    id: 'HERA.FIN.FA.MODULE.v1',
    name: 'Fixed Assets Module',
    category: 'financial',
    type: 'module',
    location: '/src/lib/dna/modules/financial/fa-module-dna.tsx',
    status: 'production',
    description: 'Asset lifecycle management with depreciation automation'
  },

  // Financial Components
  'HERA.FIN.AUTO.JOURNAL.ENGINE.V1': {
    id: 'HERA.FIN.AUTO.JOURNAL.ENGINE.V1',
    name: 'Auto-Journal Engine',
    category: 'financial',
    type: 'component',
    status: 'production',
    description: '85% automation rate for journal entries'
  },

  'HERA.FIN.CASHFLOW.SYSTEM.v1': {
    id: 'HERA.FIN.CASHFLOW.SYSTEM.v1',
    name: 'Universal Cashflow DNA',
    category: 'financial',
    type: 'system',
    location: '/src/components/cashflow/CashflowDashboard.tsx',
    status: 'production',
    description: 'Real-time cashflow with industry intelligence'
  },

  // ============================================
  // INVENTORY & SUPPLY CHAIN
  // ============================================
  'HERA.INV.UNIVERSAL.MODULE.v1': {
    id: 'HERA.INV.UNIVERSAL.MODULE.v1',
    name: 'Universal Inventory Module',
    category: 'inventory',
    type: 'module',
    status: 'production',
    description: 'Multi-location inventory with batch tracking'
  },

  // ============================================
  // SALES & ORDER MANAGEMENT
  // ============================================
  'HERA.SALES.O2C.MODULE.v1': {
    id: 'HERA.SALES.O2C.MODULE.v1',
    name: 'Order-to-Cash Module',
    category: 'sales',
    type: 'module',
    location: '/src/components/o2c/O2CDashboard.tsx',
    status: 'production',
    description: 'Complete order-to-cash workflow'
  },

  'HERA.UI.POS.UNIVERSAL.ENGINE.v1': {
    id: 'HERA.UI.POS.UNIVERSAL.ENGINE.v1',
    name: 'Universal POS Engine',
    category: 'sales',
    type: 'component',
    location: '/src/components/universal/UniversalPOS.tsx',
    status: 'production',
    description: 'Cross-industry point-of-sale system'
  },

  // ============================================
  // PROCUREMENT
  // ============================================
  'HERA.PROC.P2P.MODULE.v1': {
    id: 'HERA.PROC.P2P.MODULE.v1',
    name: 'Purchase-to-Pay Module',
    category: 'procurement',
    type: 'module',
    status: 'production',
    description: 'Complete procurement workflow'
  },

  // ============================================
  // HUMAN CAPITAL
  // ============================================
  'HERA.HCM.CORE.MODULE.v1': {
    id: 'HERA.HCM.CORE.MODULE.v1',
    name: 'Human Capital Management',
    category: 'hcm',
    type: 'module',
    status: 'development',
    description: 'Employee management and payroll'
  },

  // ============================================
  // ERP INTEGRATIONS
  // ============================================
  'HERA.SAP.FI.MODULE.v1': {
    id: 'HERA.SAP.FI.MODULE.v1',
    name: 'SAP FI Integration',
    category: 'integration',
    type: 'integration',
    location: '/src/lib/dna/modules/erp/sap-fi-module-dna.tsx',
    status: 'production',
    description: 'SAP Financial integration module'
  },

  // ============================================
  // INDUSTRY-SPECIFIC
  // ============================================
  'HERA.SALON.DNA.MODULE.v1': {
    id: 'HERA.SALON.DNA.MODULE.v1',
    name: 'Salon Management DNA',
    category: 'industry',
    type: 'module',
    location: '/src/lib/salon/salon-dna-client.ts',
    status: 'production',
    description: 'Complete salon business management'
  },

  'HERA.REST.DNA.MODULE.v1': {
    id: 'HERA.REST.DNA.MODULE.v1',
    name: 'Restaurant Management DNA',
    category: 'industry',
    type: 'module',
    status: 'production',
    description: 'Restaurant operations and management'
  },

  // ============================================
  // UI/UX COMPONENTS
  // ============================================
  'HERA.UI.GLASS.PANEL.v1': {
    id: 'HERA.UI.GLASS.PANEL.v1',
    name: 'Glass Panel Component',
    category: 'ui',
    type: 'component',
    status: 'production',
    description: 'Glassmorphism panel with Fiori design'
  },

  'HERA.UI.ENTERPRISE.TABLE.v1': {
    id: 'HERA.UI.ENTERPRISE.TABLE.v1',
    name: 'Enterprise Data Table',
    category: 'ui',
    type: 'component',
    location: '/src/lib/dna/components/organisms/EnterpriseDataTable',
    status: 'production',
    description: 'Professional data grid with export'
  },

  // ============================================
  // CALENDAR & SCHEDULING
  // ============================================
  'HERA.CAL.UNIVERSAL.RESOURCE.v1': {
    id: 'HERA.CAL.UNIVERSAL.RESOURCE.v1',
    name: 'Universal Resource Calendar',
    category: 'calendar',
    type: 'component',
    location: '/src/components/calendar/HeraDnaUniversalResourceCalendar.tsx',
    status: 'production',
    description: 'Multi-resource scheduling calendar'
  },

  // ============================================
  // COMMUNICATION
  // ============================================
  'HERA.COMM.WHATSAPP.DNA.v1': {
    id: 'HERA.COMM.WHATSAPP.DNA.v1',
    name: 'WhatsApp Integration DNA',
    category: 'communication',
    type: 'integration',
    location: '/src/lib/mcp/whatsapp-mcp-tools.ts',
    status: 'production',
    description: 'WhatsApp business messaging'
  },

  // ============================================
  // ANALYTICS & REPORTING
  // ============================================
  'HERA.ANALYTICS.ENGINE.v1': {
    id: 'HERA.ANALYTICS.ENGINE.v1',
    name: 'Universal Analytics Engine',
    category: 'analytics',
    type: 'system',
    status: 'production',
    description: 'AI-powered business analytics'
  },

  // ============================================
  // DEVELOPMENT TOOLS
  // ============================================
  'HERA.DEV.MCP.SQL.CONVERTER.V1': {
    id: 'HERA.DEV.MCP.SQL.CONVERTER.V1',
    name: 'MCP SQL Converter',
    category: 'development',
    type: 'component',
    location: '/src/app/mcp-sql-converter/page.tsx',
    status: 'production',
    description: 'Progressive to production converter'
  },

  'HERA.DEV.FACTORY.v1': {
    id: 'HERA.DEV.FACTORY.v1',
    name: 'Universal Factory',
    category: 'development',
    type: 'system',
    location: '/src/lib/factory/universal-factory.ts',
    status: 'production',
    description: 'Test data generation system'
  }
}

/**
 * Module Categories
 */
export const MODULE_CATEGORIES = {
  financial: 'Financial Management',
  inventory: 'Inventory & Supply Chain',
  sales: 'Sales & Revenue',
  procurement: 'Procurement & Purchasing',
  hcm: 'Human Capital Management',
  integration: 'External Integrations',
  industry: 'Industry-Specific Solutions',
  ui: 'User Interface Components',
  calendar: 'Scheduling & Calendar',
  communication: 'Communication & Messaging',
  analytics: 'Analytics & Reporting',
  development: 'Development Tools'
}

/**
 * Helper functions for module discovery
 */
export function getModuleById(moduleId: string): MasterModuleEntry | undefined {
  return HERA_DNA_MASTER_REGISTRY[moduleId]
}

export function getModulesByCategory(category: string): MasterModuleEntry[] {
  return Object.values(HERA_DNA_MASTER_REGISTRY).filter(module => module.category === category)
}

export function getModulesByStatus(status: string): MasterModuleEntry[] {
  return Object.values(HERA_DNA_MASTER_REGISTRY).filter(module => module.status === status)
}

export function getProductionModules(): MasterModuleEntry[] {
  return getModulesByStatus('production')
}

export function searchModules(query: string): MasterModuleEntry[] {
  const lowerQuery = query.toLowerCase()
  return Object.values(HERA_DNA_MASTER_REGISTRY).filter(
    module =>
      module.name.toLowerCase().includes(lowerQuery) ||
      module.description.toLowerCase().includes(lowerQuery) ||
      module.id.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Module Statistics
 */
export function getModuleStatistics() {
  const modules = Object.values(HERA_DNA_MASTER_REGISTRY)
  const byCategory = modules.reduce(
    (acc, module) => {
      acc[module.category] = (acc[module.category] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const byStatus = modules.reduce(
    (acc, module) => {
      acc[module.status] = (acc[module.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return {
    total: modules.length,
    byCategory,
    byStatus,
    withLocation: modules.filter(m => m.location).length
  }
}

// Re-export specific registries
export { FINANCIAL_MODULE_REGISTRY, FINANCIAL_COMPONENT_REGISTRY } from './financial'

// Default export
export default HERA_DNA_MASTER_REGISTRY
