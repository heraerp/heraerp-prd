'use client'

// ================================================================================
// HERA DNA UNIVERSAL THEME PROVIDER
// Smart Code: HERA.DNA.THEME.PROVIDER.UNIVERSAL.V1
// React context provider for dynamic theme variants with configuration rules
// ================================================================================

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  THEME_VARIANTS,
  ThemeVariant,
  ThemeConfiguration,
  generateCSSVariables,
  getThemeVariant
} from './universal-theme-variants'

// ================================================================================
// TYPES AND INTERFACES
// ================================================================================

interface UniversalThemeContextType {
  currentTheme: ThemeVariant
  themeConfig: ThemeConfiguration
  availableThemes: ThemeVariant[]

  // Theme management
  setTheme: (variantId: string, config?: ThemeConfiguration['customizations']) => void
  applyThemeFromConfig: (configRules: UniversalConfigurationRules) => void
  resetToDefault: () => void

  // Utilities
  getColorShade: (color: 'main' | 'accent', shade: keyof ThemeVariant['main']) => string
  getSemanticColor: (semantic: keyof ThemeVariant['semantic']) => string
  generateThemeClasses: () => Record<string, string>
}

interface UniversalConfigurationRules {
  organizationId: string
  industryType?: 'restaurant' | 'salon' | 'healthcare' | 'retail' | 'manufacturing' | 'professional'
  brandColors?: {
    primary?: string
    secondary?: string
  }
  userPreferences?: {
    themeVariant?: string
    darkMode?: boolean
    highContrast?: boolean
    reducedMotion?: boolean
  }
  businessRules?: {
    allowCustomThemes?: boolean
    enforceIndustryTheme?: boolean
    availableVariants?: string[]
  }
}

interface UniversalThemeProviderProps {
  children: React.ReactNode
  defaultVariant?: string
  configurationRules?: UniversalConfigurationRules
  onThemeChange?: (theme: ThemeVariant, config: ThemeConfiguration) => void
}

// ================================================================================
// DEFAULT CONFIGURATION
// ================================================================================

const DEFAULT_THEME_VARIANT = 'professional'
const DEFAULT_THEME_CONFIG: ThemeConfiguration = {
  variant: DEFAULT_THEME_VARIANT,
  customizations: {
    primaryShade: 500,
    accentShade: 500,
    backgroundOpacity: 1,
    borderRadius: 'md',
    shadows: 'md'
  }
}

// Industry-specific theme recommendations
const INDUSTRY_THEME_MAPPING = {
  restaurant: 'warm',
  salon: 'elegant',
  healthcare: 'cool',
  retail: 'vibrant',
  manufacturing: 'modern',
  professional: 'professional'
}

// ================================================================================
// CONTEXT CREATION
// ================================================================================

const UniversalThemeContext = createContext<UniversalThemeContextType | undefined>(undefined)

// ================================================================================
// THEME PROVIDER COMPONENT
// ================================================================================

export function UniversalThemeProvider({
  children,
  defaultVariant = DEFAULT_THEME_VARIANT,
  configurationRules,
  onThemeChange
}: UniversalThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemeVariant>(
    THEME_VARIANTS[defaultVariant] || THEME_VARIANTS[DEFAULT_THEME_VARIANT]
  )
  const [themeConfig, setThemeConfig] = useState<ThemeConfiguration>(DEFAULT_THEME_CONFIG)

  // Apply theme from configuration rules
  const applyThemeFromConfig = useCallback(
    (rules: UniversalConfigurationRules) => {
      let selectedVariant = defaultVariant

      // 1. Check if industry-specific theme should be enforced
      if (rules.businessRules?.enforceIndustryTheme && rules.industryType) {
        selectedVariant = INDUSTRY_THEME_MAPPING[rules.industryType] || defaultVariant
      }
      // 2. Apply user preferences if allowed
      else if (rules.userPreferences?.themeVariant && !rules.businessRules?.enforceIndustryTheme) {
        // Check if the preferred variant is in allowed list
        if (
          !rules.businessRules?.availableVariants ||
          rules.businessRules.availableVariants.includes(rules.userPreferences.themeVariant)
        ) {
          selectedVariant = rules.userPreferences.themeVariant
        }
      }
      // 3. Fall back to industry recommendation
      else if (rules.industryType) {
        selectedVariant = INDUSTRY_THEME_MAPPING[rules.industryType] || defaultVariant
      }

      const theme = getThemeVariant(selectedVariant)
      if (theme) {
        setCurrentTheme(theme)
        setThemeConfig({
          variant: selectedVariant,
          customizations: {
            ...DEFAULT_THEME_CONFIG.customizations,
            borderRadius: rules.userPreferences?.highContrast ? 'none' : 'md',
            shadows: rules.userPreferences?.highContrast ? 'lg' : 'md'
          }
        })
      }
    },
    [defaultVariant]
  )

  // Set theme programmatically
  const setTheme = useCallback(
    (variantId: string, customizations?: ThemeConfiguration['customizations']) => {
      const theme = getThemeVariant(variantId)
      if (theme) {
        setCurrentTheme(theme)
        const newConfig: ThemeConfiguration = {
          variant: variantId,
          customizations: {
            ...DEFAULT_THEME_CONFIG.customizations,
            ...customizations
          }
        }
        setThemeConfig(newConfig)

        // Notify parent component
        onThemeChange?.(theme, newConfig)
      }
    },
    [onThemeChange]
  )

  // Reset to default theme
  const resetToDefault = useCallback(() => {
    setTheme(DEFAULT_THEME_VARIANT)
  }, [setTheme])

  // Utility functions
  const getColorShade = useCallback(
    (color: 'main' | 'accent', shade: keyof ThemeVariant['main']) => {
      return currentTheme[color][shade]
    },
    [currentTheme]
  )

  const getSemanticColor = useCallback(
    (semantic: keyof ThemeVariant['semantic']) => {
      return currentTheme.semantic[semantic]
    },
    [currentTheme]
  )

  const generateThemeClasses = useCallback(() => {
    const { main, accent } = currentTheme

    return {
      // Background classes
      'bg-main-50': main[50],
      'bg-main-100': main[100],
      'bg-main-500': main[500],
      'bg-accent-50': accent[50],
      'bg-accent-500': accent[500],

      // Text classes
      'text-main-500': main[500],
      'text-main-900': main[900],
      'text-accent-500': accent[500],
      'text-accent-900': accent[900],

      // Border classes
      'border-main-200': main[200],
      'border-main-500': main[500],
      'border-accent-500': accent[500],

      // Hover classes
      'hover:bg-main-600': main[600],
      'hover:bg-accent-600': accent[600],
      'hover:text-main-600': main[600],
      'hover:text-accent-600': accent[600]
    }
  }, [currentTheme])

  // Apply configuration rules on mount or when rules change
  useEffect(() => {
    if (configurationRules) {
      applyThemeFromConfig(configurationRules)
    }
  }, [configurationRules, applyThemeFromConfig])

  // Apply CSS variables when theme changes
  useEffect(() => {
    const cssVariables = generateCSSVariables(currentTheme, themeConfig.customizations)
    const root = document.documentElement

    Object.entries(cssVariables).forEach(([property, value]) => {
      root.style.setProperty(property, value)
    })

    // Add theme class to body for CSS targeting
    document.body.className = document.body.className
      .replace(/theme-\w+/g, '')
      .concat(` theme-${currentTheme.id}`)
      .trim()

    return () => {
      // Cleanup: remove CSS variables
      Object.keys(cssVariables).forEach(property => {
        root.style.removeProperty(property)
      })
    }
  }, [currentTheme, themeConfig])

  // Context value
  const contextValue: UniversalThemeContextType = {
    currentTheme,
    themeConfig,
    availableThemes: Object.values(THEME_VARIANTS),
    setTheme,
    applyThemeFromConfig,
    resetToDefault,
    getColorShade,
    getSemanticColor,
    generateThemeClasses
  }

  return (
    <UniversalThemeContext.Provider value={contextValue}>{children}</UniversalThemeContext.Provider>
  )
}

// ================================================================================
// CUSTOM HOOK
// ================================================================================

export function useUniversalTheme() {
  const context = useContext(UniversalThemeContext)
  if (context === undefined) {
    throw new Error('useUniversalTheme must be used within a UniversalThemeProvider')
  }
  return context
}

// ================================================================================
// UTILITY COMPONENTS
// ================================================================================

// Theme selector component for admin interfaces
export function ThemeSelector({
  onThemeSelect,
  allowedVariants,
  className
}: {
  onThemeSelect?: (variantId: string) => void
  allowedVariants?: string[]
  className?: string
}) {
  const { currentTheme, setTheme, availableThemes } = useUniversalTheme()

  const filteredThemes = allowedVariants
    ? availableThemes.filter(theme => allowedVariants.includes(theme.id))
    : availableThemes

  const handleThemeChange = (variantId: string) => {
    setTheme(variantId)
    onThemeSelect?.(variantId)
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 ${className}`}>
      {filteredThemes.map(theme => (
        <button
          key={theme.id}
          onClick={() => handleThemeChange(theme.id)}
          className={`
            p-4 rounded-lg border-2 transition-all duration-200
            ${
              currentTheme.id === theme.id
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-border hover:border-primary/50'
            }
          `}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-6 h-6 rounded-full border"
              style={{ backgroundColor: theme.main[500] }}
            />
            <div
              className="w-6 h-6 rounded-full border"
              style={{ backgroundColor: theme.accent[500] }}
            />
          </div>
          <div className="text-left">
            <h3 className="font-medium text-sm">{theme.name}</h3>
            <p className="text-xs text-muted-foreground">{theme.description}</p>
          </div>
        </button>
      ))}
    </div>
  )
}

// Theme preview component
export function ThemePreview({
  variant,
  className
}: {
  variant: ThemeVariant
  className?: string
}) {
  return (
    <div
      className={`p-4 rounded-lg border ${className}`}
      style={{
        backgroundColor: variant.semantic.background,
        borderColor: variant.semantic.border,
        color: variant.semantic.foreground
      }}
    >
      <div className="space-y-3">
        <div
          className="px-3 py-1.5 rounded text-sm font-medium"
          style={{
            backgroundColor: variant.semantic.primary,
            color: variant.main[50]
          }}
        >
          Primary Button
        </div>
        <div
          className="px-3 py-1.5 rounded text-sm"
          style={{
            backgroundColor: variant.semantic.secondary,
            color: variant.accent[50]
          }}
        >
          Secondary Button
        </div>
        <div className="space-y-1">
          <div className="text-sm font-medium">Sample Text</div>
          <div className="text-xs" style={{ color: variant.semantic.muted }}>
            Muted description text
          </div>
        </div>
      </div>
    </div>
  )
}

// Export types for external use
export type { UniversalConfigurationRules, ThemeConfiguration, UniversalThemeContextType }
