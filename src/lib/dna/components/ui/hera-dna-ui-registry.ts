/**
 * HERA DNA UI COMPONENT REGISTRY
 * Smart Code: HERA.DNA.UI.REGISTRY.V1
 *
 * Enterprise-grade UI component library with glassmorphism design
 * All components include dark mode support and are linked to corresponding hooks
 */

// ================================================================================
// GLASSMORPHISM THEME CONSTANTS
// ================================================================================

export const HERA_GLASS_THEME = {
  // Glass backgrounds
  glass: {
    light: 'bg-white/80 backdrop-blur-xl',
    dark: 'bg-gray-900/80 backdrop-blur-xl',
    primary: 'bg-gradient-to-br from-violet-500/10 to-purple-500/10 backdrop-blur-xl',
    success: 'bg-gradient-to-br from-emerald-500/10 to-green-500/10 backdrop-blur-xl',
    warning: 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-xl',
    danger: 'bg-gradient-to-br from-red-500/10 to-rose-500/10 backdrop-blur-xl',
    info: 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl'
  },

  // Borders
  border: {
    light: 'border border-gray-200/50',
    dark: 'border border-gray-700/50',
    primary: 'border border-violet-500/20',
    success: 'border border-emerald-500/20',
    warning: 'border border-amber-500/20',
    danger: 'border border-red-500/20',
    info: 'border border-blue-500/20'
  },

  // Shadows
  shadow: {
    sm: 'shadow-sm shadow-black/5',
    md: 'shadow-md shadow-black/10',
    lg: 'shadow-lg shadow-black/15',
    xl: 'shadow-xl shadow-black/20'
  }
}

// ================================================================================
// LAYOUT COMPONENTS
// ================================================================================

/**
 * Page Header with Glassmorphism
 * Smart Code: HERA.DNA.UI.HEADER.GLASS.V1
 * Linked Hook: useHERAAuth (for user context)
 */
export { PageHeaderDNA } from './PageHeaderDNA'

/**
 * Gradient Background Component
 * Smart Code: HERA.DNA.UI.BACKGROUND.GRADIENT.V1
 */
export { HERAGradientBackground } from './hera-gradient-background-dna'

// ================================================================================
// CARD COMPONENTS
// ================================================================================

/**
 * Base Card Component with Glass Effect
 * Smart Code: HERA.DNA.UI.CARD.GLASS.V1
 * Linked Hook: useReadEntities (for data display)
 */
export { CardDNA } from './CardDNA'

/**
 * Info Card Variant
 * Smart Code: HERA.DNA.UI.CARD.INFO.V1
 */
export { InfoCardDNA } from './CardDNA'

/**
 * Success Card Variant
 * Smart Code: HERA.DNA.UI.CARD.SUCCESS.V1
 */
export { SuccessCardDNA } from './CardDNA'

/**
 * Warning Card Variant
 * Smart Code: HERA.DNA.UI.CARD.WARNING.V1
 */
export { WarningCardDNA } from './CardDNA'

/**
 * Danger Card Variant
 * Smart Code: HERA.DNA.UI.CARD.DANGER.V1
 */
export { DangerCardDNA } from './CardDNA'

/**
 * Entity Card with Glassmorphism
 * Smart Code: HERA.DNA.UI.ENTITY.CARD.GLASS.V1
 * Linked Hooks: useReadEntities + useGetDynamicFields
 */
export { EntityCardGlass } from './EntityCardGlass'

// ================================================================================
// STAT CARD COMPONENTS
// ================================================================================

/**
 * Statistics Card with Glass Effect
 * Smart Code: HERA.DNA.UI.STAT.CARD.V1
 * Linked Hook: useReadEntities (for aggregated data)
 */
export { StatCardDNA, StatCardGrid } from './stat-card-dna'

/**
 * Mini Stat Card for Compact Display
 * Smart Code: HERA.DNA.UI.STAT.MINI.V1
 */
export { MiniStatCardDNA } from './mini-stat-card-dna'

/**
 * Assessment Dashboard Component
 * Smart Code: HERA.DNA.UI.DASHBOARD.ASSESSMENT.V1
 * Linked Hook: useReadEntities + useGetDynamicFields
 */
export { AssessmentDashboard } from './assessment-dashboard-dna'

// ================================================================================
// FORM COMPONENTS
// ================================================================================

/**
 * Universal Form Field with Glass Effect
 * Smart Code: HERA.DNA.UI.FORM.FIELD.V1
 * Linked Hook: useCreateEntity, useUpdateEntity
 */
export { FormFieldDNA } from './FormFieldDNA'

/**
 * HERA Input Component with Glassmorphism
 * Smart Code: HERA.DNA.UI.INPUT.GLASS.V1
 * Linked Hook: useSetDynamicField
 */
export { HERAInputDNA } from './hera-input-dna'

// ================================================================================
// BUTTON COMPONENTS
// ================================================================================

/**
 * Base Button with Glass Effect
 * Smart Code: HERA.DNA.UI.BUTTON.BASE.V1
 * Linked Hook: Varies by action
 */
export { ButtonDNA } from './ButtonDNA'

/**
 * Primary Button Variant
 * Smart Code: HERA.DNA.UI.BUTTON.PRIMARY.V1
 * Linked Hook: useCreateEntity, useCreateTransaction
 */
export { PrimaryButtonDNA } from './ButtonDNA'

/**
 * Secondary Button Variant
 * Smart Code: HERA.DNA.UI.BUTTON.SECONDARY.V1
 * Linked Hook: useUpdateEntity
 */
export { SecondaryButtonDNA } from './ButtonDNA'

/**
 * Danger Button Variant
 * Smart Code: HERA.DNA.UI.BUTTON.DANGER.V1
 * Linked Hook: useDeleteEntity
 */
export { DangerButtonDNA } from './ButtonDNA'

/**
 * Ghost Button Variant
 * Smart Code: HERA.DNA.UI.BUTTON.GHOST.V1
 */
export { GhostButtonDNA } from './ButtonDNA'

/**
 * HERA Button with Advanced Features
 * Smart Code: HERA.DNA.UI.BUTTON.ADVANCED.V1
 */
export { HERAButtonDNA } from './hera-button-dna'

// ================================================================================
// BADGE COMPONENTS
// ================================================================================

/**
 * Base Badge Component
 * Smart Code: HERA.DNA.UI.BADGE.BASE.V1
 */
export { BadgeDNA } from './BadgeDNA'

/**
 * Success Badge Variant
 * Smart Code: HERA.DNA.UI.BADGE.SUCCESS.V1
 */
export { SuccessBadgeDNA } from './BadgeDNA'

/**
 * Warning Badge Variant
 * Smart Code: HERA.DNA.UI.BADGE.WARNING.V1
 */
export { WarningBadgeDNA } from './BadgeDNA'

/**
 * Danger Badge Variant
 * Smart Code: HERA.DNA.UI.BADGE.DANGER.V1
 */
export { DangerBadgeDNA } from './BadgeDNA'

/**
 * Info Badge Variant
 * Smart Code: HERA.DNA.UI.BADGE.INFO.V1
 */
export { InfoBadgeDNA } from './BadgeDNA'

// ================================================================================
// SCROLL & LIST COMPONENTS
// ================================================================================

/**
 * Scroll Area with Custom Styling
 * Smart Code: HERA.DNA.UI.SCROLL.AREA.V1
 * Linked Hook: useReadEntities (for large data sets)
 */
export { ScrollAreaDNA, scrollAreaStyles } from './ScrollAreaDNA'

// ================================================================================
// MOBILE COMPONENTS
// ================================================================================

/**
 * Bottom Sheet for Mobile UI
 * Smart Code: HERA.DNA.UI.MOBILE.SHEET.V1
 */
export { BottomSheet } from '../mobile/BottomSheet'

// ================================================================================
// COMPOSITE UI PATTERNS
// ================================================================================

/**
 * Entity List with Glass Cards
 * Smart Code: HERA.DNA.UI.PATTERN.ENTITY.LIST.V1
 * Linked Hooks: useReadEntities + useGetDynamicFields
 */
export const EntityListPattern = {
  smartCode: 'HERA.DNA.UI.PATTERN.ENTITY.LIST.V1',
  hooks: ['useReadEntities', 'useGetDynamicFields'],
  components: ['CardDNA', 'ScrollAreaDNA', 'BadgeDNA']
}

/**
 * Entity Form with Validation
 * Smart Code: HERA.DNA.UI.PATTERN.ENTITY.FORM.V1
 * Linked Hooks: useCreateEntity + useSetDynamicField
 */
export const EntityFormPattern = {
  smartCode: 'HERA.DNA.UI.PATTERN.ENTITY.FORM.V1',
  hooks: ['useCreateEntity', 'useUpdateEntity', 'useSetDynamicField'],
  components: ['CardDNA', 'FormFieldDNA', 'PrimaryButtonDNA', 'SecondaryButtonDNA']
}

/**
 * Transaction Dashboard
 * Smart Code: HERA.DNA.UI.PATTERN.TXN.DASHBOARD.V1
 * Linked Hooks: useReadEntities + useCreateTransaction
 */
export const TransactionDashboardPattern = {
  smartCode: 'HERA.DNA.UI.PATTERN.TXN.DASHBOARD.V1',
  hooks: ['useReadEntities', 'useCreateTransaction', 'useGetRelationships'],
  components: ['StatCardDNA', 'CardDNA', 'ScrollAreaDNA', 'BadgeDNA']
}

// ================================================================================
// GLASSMORPHISM UTILITIES
// ================================================================================

/**
 * Glass Card Utility Classes
 * Smart Code: HERA.DNA.UI.UTIL.GLASS.V1
 */
export const glassCardClasses = (
  variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' = 'default'
) => {
  const baseClasses = 'rounded-lg transition-all duration-200'
  const variantClasses = {
    default: `${HERA_GLASS_THEME.glass.light} dark:${HERA_GLASS_THEME.glass.dark} ${HERA_GLASS_THEME.border.light} dark:${HERA_GLASS_THEME.border.dark}`,
    primary: `${HERA_GLASS_THEME.glass.primary} ${HERA_GLASS_THEME.border.primary}`,
    success: `${HERA_GLASS_THEME.glass.success} ${HERA_GLASS_THEME.border.success}`,
    warning: `${HERA_GLASS_THEME.glass.warning} ${HERA_GLASS_THEME.border.warning}`,
    danger: `${HERA_GLASS_THEME.glass.danger} ${HERA_GLASS_THEME.border.danger}`,
    info: `${HERA_GLASS_THEME.glass.info} ${HERA_GLASS_THEME.border.info}`
  }

  return `${baseClasses} ${variantClasses[variant]} ${HERA_GLASS_THEME.shadow.md}`
}

/**
 * Glass Button Utility Classes
 * Smart Code: HERA.DNA.UI.UTIL.BUTTON.V1
 */
export const glassButtonClasses = (
  variant: 'primary' | 'secondary' | 'danger' | 'ghost' = 'primary'
) => {
  const baseClasses =
    'px-4 py-2 rounded-lg font-medium transition-all duration-200 backdrop-blur-xl'
  const variantClasses = {
    primary:
      'bg-gradient-to-r from-violet-600/90 to-purple-600/90 text-white hover:from-violet-700/90 hover:to-purple-700/90 shadow-lg',
    secondary:
      'bg-white/20 dark:bg-gray-800/20 text-gray-900 dark:text-gray-100 border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/30 dark:hover:bg-gray-800/30',
    danger:
      'bg-gradient-to-r from-red-600/90 to-rose-600/90 text-white hover:from-red-700/90 hover:to-rose-700/90',
    ghost:
      'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100/20 dark:hover:bg-gray-800/20'
  }

  return `${baseClasses} ${variantClasses[variant]}`
}

// ================================================================================
// THEME SYSTEM INTEGRATION
// ================================================================================

/**
 * HERA Theme Provider Integration
 * Smart Code: HERA.DNA.UI.THEME.PROVIDER.V1
 */
export { ThemeProviderDNA } from '@/lib/dna/components/ThemeProviderDNA'

// ================================================================================
// USAGE EXAMPLES
// ================================================================================

/**
 * Example: Customer List with Glass UI
 *
 * import {
 *   CardDNA,
 *   ScrollAreaDNA,
 *   FormFieldDNA,
 *   BadgeDNA,
 *   PrimaryButtonDNA
 * } from '@/lib/dna/components/ui/hera-dna-ui-registry'
 * import { useReadEntities } from '@/lib/dna/hooks/hera-dna-hook-registry'
 *
 * function CustomerList() {
 *   const readEntities = useReadEntities()
 *   const [customers, setCustomers] = useState([])
 *
 *   return (
 *     <CardDNA title="Customers" icon={Users}>
 *       <ScrollAreaDNA height="h-96">
 *         {customers.map(customer => (
 *           <div className={glassCardClasses('default')}>
 *             <h3>{customer.entity_name}</h3>
 *             <BadgeDNA variant="success">Active</BadgeDNA>
 *           </div>
 *         ))}
 *       </ScrollAreaDNA>
 *       <PrimaryButtonDNA icon={Plus}>Add Customer</PrimaryButtonDNA>
 *     </CardDNA>
 *   )
 * }
 */

// ================================================================================
// SMART CODE REFERENCE
// ================================================================================

export const HERA_DNA_UI_SMART_CODES = {
  // Layout
  'HERA.DNA.UI.HEADER.GLASS.V1': 'Page header with glassmorphism',
  'HERA.DNA.UI.BACKGROUND.GRADIENT.V1': 'Animated gradient background',

  // Cards
  'HERA.DNA.UI.CARD.GLASS.V1': 'Base glass card component',
  'HERA.DNA.UI.CARD.INFO.V1': 'Info variant card',
  'HERA.DNA.UI.CARD.SUCCESS.V1': 'Success variant card',
  'HERA.DNA.UI.CARD.WARNING.V1': 'Warning variant card',
  'HERA.DNA.UI.CARD.DANGER.V1': 'Danger variant card',

  // Stats
  'HERA.DNA.UI.STAT.CARD.V1': 'Statistics display card',
  'HERA.DNA.UI.STAT.MINI.V1': 'Compact stat card',
  'HERA.DNA.UI.DASHBOARD.ASSESSMENT.V1': 'Assessment dashboard',

  // Forms
  'HERA.DNA.UI.FORM.FIELD.V1': 'Universal form field',
  'HERA.DNA.UI.INPUT.GLASS.V1': 'Glass effect input',

  // Buttons
  'HERA.DNA.UI.BUTTON.BASE.V1': 'Base button component',
  'HERA.DNA.UI.BUTTON.PRIMARY.V1': 'Primary action button',
  'HERA.DNA.UI.BUTTON.SECONDARY.V1': 'Secondary action button',
  'HERA.DNA.UI.BUTTON.DANGER.V1': 'Danger action button',
  'HERA.DNA.UI.BUTTON.GHOST.V1': 'Ghost style button',
  'HERA.DNA.UI.BUTTON.ADVANCED.V1': 'Advanced button features',

  // Badges
  'HERA.DNA.UI.BADGE.BASE.V1': 'Base badge component',
  'HERA.DNA.UI.BADGE.SUCCESS.V1': 'Success status badge',
  'HERA.DNA.UI.BADGE.WARNING.V1': 'Warning status badge',
  'HERA.DNA.UI.BADGE.DANGER.V1': 'Danger status badge',
  'HERA.DNA.UI.BADGE.INFO.V1': 'Info status badge',

  // Scroll & Lists
  'HERA.DNA.UI.SCROLL.AREA.V1': 'Custom scroll area',

  // Mobile
  'HERA.DNA.UI.MOBILE.SHEET.V1': 'Mobile bottom sheet',

  // Patterns
  'HERA.DNA.UI.PATTERN.ENTITY.LIST.V1': 'Entity list pattern',
  'HERA.DNA.UI.PATTERN.ENTITY.FORM.V1': 'Entity form pattern',
  'HERA.DNA.UI.PATTERN.TXN.DASHBOARD.V1': 'Transaction dashboard pattern',

  // Utilities
  'HERA.DNA.UI.UTIL.GLASS.V1': 'Glass card utilities',
  'HERA.DNA.UI.UTIL.BUTTON.V1': 'Button style utilities',
  'HERA.DNA.UI.THEME.PROVIDER.V1': 'Theme system provider'
}
