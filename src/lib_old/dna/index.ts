// ================================================================================
// HERA DNA - MASTER EXPORT SYSTEM
// Smart Code: HERA.DNA.MASTER.EXPORT.SYSTEM.v1
// Root export for the entire HERA DNA component library
// ================================================================================

// ================================================================================
// COMPONENT EXPORTS
// ================================================================================

// Re-export all components from the unified component system
export * from './components'

// Default component export
export { default as HeraDNA } from './components'

// ================================================================================
// THEME SYSTEM EXPORTS
// ================================================================================

export * from './theme/theme-provider-dna'

// ================================================================================
// MODULE EXPORTS
// ================================================================================

// Financial modules
export * from './modules/financial'

// ERP modules  
export * from './modules/erp'

// ================================================================================
// PATTERN EXPORTS
// ================================================================================

export * from './patterns'

// ================================================================================
// EXAMPLE EXPORTS
// ================================================================================

export * from './examples'

// ================================================================================
// DNA SYSTEM METADATA
// ================================================================================

export const HERA_DNA_INFO = {
  name: 'HERA DNA Component Library',
  version: '1.0.0',
  description: 'Universal business component library for enterprise applications',
  smartCode: 'HERA.DNA.MASTER.EXPORT.SYSTEM.v1',
  buildDate: new Date().toISOString(),
  components: {
    total: 25,
    categories: ['CORE_UI', 'ENTERPRISE', 'BUSINESS_LOGIC', 'MOBILE', 'SPECIALIZED'],
    frameworks: ['React', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
    patterns: ['Universal Architecture', 'Smart Codes', 'Multi-tenant', 'Mobile-first']
  },
  compatibility: {
    react: '>=18.0.0',
    typescript: '>=5.0.0', 
    nextjs: '>=15.0.0'
  }
} as const

// ================================================================================
// CONVENIENCE EXPORTS
// ================================================================================

// Most commonly used components for easy access
export {
  // Core UI
  StatCardDNA,
  HeraButtonDNA,
  HeraSidebarDNA,
  
  // Business Logic
  UniversalTransactionFlow,
  UniversalSearch,
  EntityQuickView,
  SmartCodePicker,
  
  // Mobile
  BottomSheet,
  PullToRefresh,
  
  // Enterprise
  EnterpriseDataTable,
  EnterpriseDashboard
} from './components'

// ================================================================================
// DEFAULT EXPORT
// ================================================================================

export default HERA_DNA_INFO