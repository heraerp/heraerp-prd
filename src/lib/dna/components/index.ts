// ================================================================================
// HERA DNA COMPONENTS - UNIFIED EXPORT SYSTEM
// Smart Code: HERA.DNA.EXPORT.UNIFIED.SYSTEM.v1
// Central export hub for all HERA DNA components with tree-shaking support
// ================================================================================

// ================================================================================
// CORE UI COMPONENTS
// ================================================================================

// Stat Cards
export { StatCardDNA, type StatCardDNAProps } from './ui/stat-card-dna'
export { MiniStatCardDNA, type MiniStatCardDNAProps } from './ui/mini-stat-card-dna'

// Buttons & Inputs
export { HeraButtonDNA, type HeraButtonDNAProps } from './ui/hera-button-dna'
export { HeraInputDNA, type HeraInputDNAProps } from './ui/hera-input-dna'

// Layouts
export { HeraSidebarDNA, type HeraSidebarDNAProps } from './layout/hera-sidebar-dna'
export { GlassmorphicDarkLayout, type GlassmorphicDarkLayoutProps } from './layouts/GlassmorphicDarkLayout'

// Theme System
export { ThemeProviderDNA, type ThemeProviderDNAProps } from '../theme/theme-provider-dna'

// ================================================================================
// ENTERPRISE COMPONENTS
// ================================================================================

// Enterprise Data Management
export { 
  EnterpriseCard, 
  type EnterpriseCardProps,
  EnterpriseDashboard,
  type EnterpriseDashboardProps,
  EnterpriseStatsCard,
  type EnterpriseStatsCardProps
} from './enterprise'

// Enterprise Data Table
export { 
  EnterpriseDataTable,
  type EnterpriseDataTableProps,
  type EnterpriseTableColumn,
  type EnterpriseTableData
} from './organisms/EnterpriseDataTable'

// ================================================================================
// BUSINESS LOGIC COMPONENTS  
// ================================================================================

// Transaction Flow
export { 
  UniversalTransactionFlow,
  type UniversalTransactionFlowProps,
  type TransactionStep,
  type TransactionFlowConfig
} from './transaction/UniversalTransactionFlow'

// Search Components
export {
  UniversalSearch,
  type UniversalSearchProps,
  type SearchResult,
  type SearchScope
} from './search/UniversalSearch'

// Entity Management
export {
  EntityQuickView,
  type EntityQuickViewProps,
  type EntityData,
  type EntityField
} from './entity/EntityQuickView'

// Smart Code Management
export {
  SmartCodePicker,
  type SmartCodePickerProps,
  type SmartCode,
  type SmartCodeCategory
} from './smart-code/SmartCodePicker'

// ================================================================================
// MOBILE COMPONENTS
// ================================================================================

// Mobile Interactions
export {
  BottomSheet,
  type BottomSheetProps,
  type BottomSheetHandle,
  useBottomSheet
} from './mobile/BottomSheet'

export {
  PullToRefresh,
  type PullToRefreshProps,
  type PullToRefreshHandle
} from './mobile/PullToRefresh'

// ================================================================================
// SPECIALIZED COMPONENTS
// ================================================================================

// Chat Interface
export { ChatInterfaceDNA, type ChatInterfaceDNAProps } from './chat-interface-dna'

// Document Numbering
export { DocumentNumberingDNA, type DocumentNumberingDNAProps } from './document-numbering-dna'

// Assessment Dashboard
export { AssessmentDashboardDNA, type AssessmentDashboardDNAProps } from './ui/assessment-dashboard-dna'

// Production UI Pattern
export { ProductionUIPattern, type ProductionUIPatternProps } from './production-ui-pattern'

// ================================================================================
// MODULE EXPORTS
// ================================================================================

// Financial Modules
export * from '../modules/financial/ap-module-dna'
export * from '../modules/financial/ar-module-dna'
export * from '../modules/financial/fa-module-dna'
export * from '../modules/financial/gl-module-dna'

// ERP Modules
export * from '../modules/erp/sap-fi-module-dna'

// ================================================================================
// PATTERN EXPORTS
// ================================================================================

// Layout Patterns
export * from '../patterns/dark-sidebar-layout-pattern'
export * from '../patterns/demo-org-pattern'
export * from '../patterns/glassmorphic-dark-template'

// ================================================================================
// EXAMPLE EXPORTS
// ================================================================================

// Usage Examples
export * from '../examples/stat-card-usage'

// ================================================================================
// UTILITY EXPORTS
// ================================================================================

// Component Categories (for documentation and tooling)
export const HERA_DNA_CATEGORIES = {
  CORE_UI: [
    'StatCardDNA',
    'MiniStatCardDNA', 
    'HeraButtonDNA',
    'HeraInputDNA',
    'HeraSidebarDNA',
    'GlassmorphicDarkLayout',
    'ThemeProviderDNA'
  ],
  ENTERPRISE: [
    'EnterpriseCard',
    'EnterpriseDashboard', 
    'EnterpriseStatsCard',
    'EnterpriseDataTable'
  ],
  BUSINESS_LOGIC: [
    'UniversalTransactionFlow',
    'UniversalSearch',
    'EntityQuickView',
    'SmartCodePicker'
  ],
  MOBILE: [
    'BottomSheet',
    'PullToRefresh'
  ],
  SPECIALIZED: [
    'ChatInterfaceDNA',
    'DocumentNumberingDNA',
    'AssessmentDashboardDNA',
    'ProductionUIPattern'
  ]
} as const

// Component Registry (for dynamic imports and lazy loading)
export const HERA_DNA_REGISTRY = {
  // Core UI Components
  'stat-card': () => import('./ui/stat-card-dna'),
  'mini-stat-card': () => import('./ui/mini-stat-card-dna'),
  'hera-button': () => import('./ui/hera-button-dna'),
  'hera-input': () => import('./ui/hera-input-dna'),
  'hera-sidebar': () => import('./layout/hera-sidebar-dna'),
  'glassmorphic-layout': () => import('./layouts/GlassmorphicDarkLayout'),
  
  // Enterprise Components
  'enterprise-card': () => import('./enterprise/EnterpriseCard'),
  'enterprise-dashboard': () => import('./enterprise/EnterpriseDashboard'),
  'enterprise-stats-card': () => import('./enterprise/EnterpriseStatsCard'),
  'enterprise-data-table': () => import('./organisms/EnterpriseDataTable'),
  
  // Business Logic Components
  'transaction-flow': () => import('./transaction/UniversalTransactionFlow'),
  'universal-search': () => import('./search/UniversalSearch'),
  'entity-quick-view': () => import('./entity/EntityQuickView'),
  'smart-code-picker': () => import('./smart-code/SmartCodePicker'),
  
  // Mobile Components
  'bottom-sheet': () => import('./mobile/BottomSheet'),
  'pull-to-refresh': () => import('./mobile/PullToRefresh'),
  
  // Specialized Components
  'chat-interface': () => import('./chat-interface-dna'),
  'document-numbering': () => import('./document-numbering-dna'),
  'assessment-dashboard': () => import('./ui/assessment-dashboard-dna'),
  'production-ui-pattern': () => import('./production-ui-pattern')
} as const

// Helper function for dynamic component loading
export const loadDNAComponent = async (componentKey: keyof typeof HERA_DNA_REGISTRY) => {
  try {
    const componentModule = await HERA_DNA_REGISTRY[componentKey]()
    return componentModule
  } catch (error) {
    console.error(`Failed to load DNA component: ${componentKey}`, error)
    throw new Error(`Component ${componentKey} not found`)
  }
}

// Version information
export const HERA_DNA_VERSION = '1.0.0'
export const HERA_DNA_BUILD_DATE = new Date().toISOString()

// Smart Codes for the component system itself
export const HERA_DNA_SMART_CODES = {
  EXPORT_SYSTEM: 'HERA.DNA.EXPORT.UNIFIED.SYSTEM.v1',
  COMPONENT_REGISTRY: 'HERA.DNA.REGISTRY.COMPONENT.SYSTEM.v1',
  DYNAMIC_LOADING: 'HERA.DNA.LOADER.DYNAMIC.IMPORT.v1'
} as const

// Type definitions for the export system
export type HeraDNACategory = keyof typeof HERA_DNA_CATEGORIES
export type HeraDNAComponentKey = keyof typeof HERA_DNA_REGISTRY
export type HeraDNAComponent = typeof HERA_DNA_CATEGORIES[HeraDNACategory][number]

// ================================================================================
// BACKWARDS COMPATIBILITY
// ================================================================================

// Legacy exports (deprecated but maintained for backwards compatibility)
export { StatCardDNA as LegacyStatCard } from './ui/stat-card-dna'
export { HeraButtonDNA as LegacyHeraButton } from './ui/hera-button-dna'

// ================================================================================
// DOCUMENTATION HELPERS
// ================================================================================

// Component metadata for documentation generation
export const getComponentMetadata = (componentName: string) => {
  const category = Object.entries(HERA_DNA_CATEGORIES).find(([_, components]) =>
    components.includes(componentName as any)
  )?.[0] as HeraDNACategory | undefined

  return {
    name: componentName,
    category,
    version: HERA_DNA_VERSION,
    smartCode: HERA_DNA_SMART_CODES.EXPORT_SYSTEM,
    buildDate: HERA_DNA_BUILD_DATE
  }
}

// Get all components in a category
export const getComponentsByCategory = (category: HeraDNACategory) => {
  return HERA_DNA_CATEGORIES[category]
}

// Get component import path
export const getComponentImportPath = (componentKey: HeraDNAComponentKey) => {
  return `@/lib/dna/components/${componentKey.replace('-', '/')}`
}

// ================================================================================
// DEFAULT EXPORT
// ================================================================================

// Default export for convenience
export default {
  version: HERA_DNA_VERSION,
  buildDate: HERA_DNA_BUILD_DATE,
  smartCodes: HERA_DNA_SMART_CODES,
  categories: HERA_DNA_CATEGORIES,
  registry: HERA_DNA_REGISTRY,
  loadComponent: loadDNAComponent,
  getMetadata: getComponentMetadata,
  getByCategory: getComponentsByCategory,
  getImportPath: getComponentImportPath
}