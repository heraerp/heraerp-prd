// ================================================================================
// HERA DNA UNIVERSAL THEME SYSTEM - UNIFIED EXPORTS
// Smart Code: HERA.DNA.THEME.SYSTEM.EXPORTS.V1
// Complete theming system with variants, configuration rules, and provider
// ================================================================================

// Theme variants and utilities
export {
  THEME_VARIANTS,
  generateCSSVariables,
  getThemeVariant,
  getAvailableThemes,
  createCustomTheme
} from './universal-theme-variants'

export type {
  ColorShades,
  ThemeVariant,
  ThemeConfiguration
} from './universal-theme-variants'

// Theme provider and context
export {
  UniversalThemeProvider,
  useUniversalTheme,
  ThemeSelector,
  ThemePreview
} from './universal-theme-provider'

export type {
  UniversalConfigurationRules,
  UniversalThemeContextType
} from './universal-theme-provider'

// Configuration rules engine
export {
  UniversalConfigurationEngine,
  ConfigurationPersistence,
  getThemeConfiguration,
  UNIVERSAL_CONFIGURATION_RULES
} from './universal-configuration-rules'

export type {
  ConfigurationRule,
  ConfigurationCondition,
  ConfigurationAction,
  OrganizationProfile,
  UserProfile
} from './universal-configuration-rules'

// ================================================================================
// THEME REGISTRY FOR DYNAMIC LOADING
// ================================================================================

export const THEME_REGISTRY = {
  variants: () => import('./universal-theme-variants'),
  provider: () => import('./universal-theme-provider'),
  rules: () => import('./universal-configuration-rules')
} as const

// ================================================================================
// QUICK ACCESS THEME UTILITIES
// ================================================================================

/**
 * Get theme configuration for an organization
 */
export async function getOrganizationThemeConfig(organizationId: string) {
  // This would typically fetch from your organization service
  // For now, return a mock configuration
  return {
    organizationId,
    industryType: 'restaurant', // This would be fetched from your org data
    businessSize: 'medium' as const,
    brandColors: {
      primary: '#f97316',
      secondary: '#0ea5e9'
    }
  }
}

/**
 * Get user theme preferences
 */
export async function getUserThemePreferences(userId: string) {
  // This would typically fetch from your user service
  // For now, return a mock configuration
  return {
    userId,
    role: 'user',
    permissions: ['read', 'write'],
    preferences: {
      themeVariant: 'professional',
      darkMode: false,
      highContrast: false,
      reducedMotion: false
    }
  }
}

/**
 * Apply theme configuration with smart defaults
 */
export async function applySmartThemeConfiguration(
  organizationId: string,
  userId: string,
  customRules: ConfigurationRule[] = []
) {
  const [orgProfile, userProfile] = await Promise.all([
    getOrganizationThemeConfig(organizationId),
    getUserThemePreferences(userId)
  ])

  const { getThemeConfiguration } = await import('./universal-configuration-rules')
  
  return await getThemeConfiguration(orgProfile, userProfile, customRules)
}

// ================================================================================
// THEME CONSTANTS
// ================================================================================

export const THEME_CONSTANTS = {
  DEFAULT_VARIANT: 'professional',
  INDUSTRY_MAPPINGS: {
    restaurant: 'warm',
    salon: 'elegant',
    healthcare: 'cool',
    retail: 'vibrant',
    manufacturing: 'modern',
    professional: 'professional'
  },
  SEMANTIC_COLORS: [
    'primary',
    'primaryHover',
    'primaryActive',
    'primarySubtle',
    'secondary',
    'secondaryHover',
    'secondaryActive',
    'secondarySubtle',
    'background',
    'surface',
    'border',
    'muted',
    'foreground',
    'accent',
    'accentForeground'
  ],
  COLOR_SHADES: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
} as const

// ================================================================================
// THEME HOOKS AND UTILITIES
// ================================================================================

/**
 * Hook to get current theme colors for use in components
 */
export function useThemeColors() {
  if (typeof window === 'undefined') {
    return null
  }
  
  const style = getComputedStyle(document.documentElement)
  
  return {
    primary: style.getPropertyValue('--color-primary').trim(),
    secondary: style.getPropertyValue('--color-secondary').trim(),
    background: style.getPropertyValue('--color-background').trim(),
    surface: style.getPropertyValue('--color-surface').trim(),
    border: style.getPropertyValue('--color-border').trim(),
    foreground: style.getPropertyValue('--color-foreground').trim(),
    accent: style.getPropertyValue('--color-accent').trim()
  }
}

/**
 * Utility to generate CSS custom properties for manual theme application
 */
export function generateThemeCSS(variantId: string, customizations?: any) {
  const variant = getThemeVariant(variantId)
  if (!variant) return ''
  
  const variables = generateCSSVariables(variant, customizations)
  
  return Object.entries(variables)
    .map(([property, value]) => `${property}: ${value};`)
    .join('\n')
}

/**
 * Check if a theme variant supports dark mode
 */
export function isThemeDarkModeCapable(variantId: string): boolean {
  const variant = getThemeVariant(variantId)
  return variant ? true : false // All variants support dark mode
}

/**
 * Get contrasting text color for a given background color
 */
export function getContrastingTextColor(backgroundColor: string, theme: ThemeVariant): string {
  // Simple contrast calculation - in a real implementation you'd use proper color contrast algorithms
  const isLight = backgroundColor.includes('50') || backgroundColor.includes('100') || backgroundColor.includes('200')
  return isLight ? theme.semantic.foreground : theme.main[50]
}

// ================================================================================
// DEFAULT EXPORT
// ================================================================================

export default {
  variants: THEME_VARIANTS,
  constants: THEME_CONSTANTS,
  registry: THEME_REGISTRY,
  utils: {
    getOrganizationThemeConfig,
    getUserThemePreferences,
    applySmartThemeConfiguration,
    generateThemeCSS,
    isThemeDarkModeCapable,
    getContrastingTextColor
  }
}