'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { ThemeConfig, ThemeMode, getThemeCSSVariables } from './hera-theme-system'
import iceCreamEnterpriseTheme from './themes/ice-cream-enterprise'

/**
 * HERA DNA Theme Provider
 *
 * A universal theme provider that manages theme state, persistence,
 * and CSS variable injection for perfect light/dark mode support.
 *
 * Features:
 * - Automatic theme switching based on system preference
 * - Local storage persistence
 * - CSS variable injection for runtime theming
 * - Theme transition animations
 * - Support for multiple themes
 */

interface ThemeContextValue {
  theme: ThemeConfig
  mode: ThemeMode
  resolvedMode: 'light' | 'dark'
  setMode: (mode: ThemeMode) => void
  setTheme: (theme: ThemeConfig) => void
  toggleMode: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

// Available themes registry
const themes: Record<string, ThemeConfig> = {
  'ice-cream-enterprise': iceCreamEnterpriseTheme
  // Add more themes here as they're created
  // 'salon-luxury': salonLuxuryTheme,
  // 'healthcare-clinical': healthcareClinicalTheme,
  // 'manufacturing-industrial': manufacturingIndustrialTheme,
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: string
  defaultMode?: ThemeMode
  storageKey?: string
  enableTransitions?: boolean
  forceMode?: ThemeMode // For Storybook or testing
}

export function ThemeProviderDNA({
  children,
  defaultTheme = 'ice-cream-enterprise',
  defaultMode = 'system',
  storageKey = 'hera-theme',
  enableTransitions = true,
  forceMode
}: ThemeProviderProps) {
  // Initialize theme
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(
    themes[defaultTheme] || iceCreamEnterpriseTheme
  )

  // Initialize mode
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (forceMode) return forceMode

    // Check localStorage first
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`${storageKey}-mode`)
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        return stored as ThemeMode
      }
    }
    return defaultMode
  })

  // Calculate resolved mode (what actually gets applied)
  const [resolvedMode, setResolvedMode] = useState<'light' | 'dark'>('light')

  // Listen for system theme changes
  useEffect(() => {
    if (mode !== 'system') {
      setResolvedMode(mode as 'light' | 'dark')
      return
    }

    // Set initial value
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setResolvedMode(mediaQuery.matches ? 'dark' : 'light')

    // Listen for changes
    const handler = (e: MediaQueryListEvent) => {
      setResolvedMode(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [mode])

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement

    // Remove old theme classes
    root.classList.remove('light', 'dark')

    // Add new theme class
    root.classList.add(resolvedMode)

    // Apply CSS variables
    const cssVars = getThemeCSSVariables(currentTheme, resolvedMode)
    Object.entries(cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })

    // Add theme name as data attribute
    root.setAttribute('data-theme', currentTheme.name.toLowerCase().replace(/\s+/g, '-'))

    // Handle transitions
    if (enableTransitions) {
      root.classList.add('theme-transition')
      setTimeout(() => {
        root.classList.remove('theme-transition')
      }, 300)
    }
  }, [currentTheme, resolvedMode, enableTransitions])

  // Persist mode preference
  useEffect(() => {
    if (typeof window !== 'undefined' && !forceMode) {
      localStorage.setItem(`${storageKey}-mode`, mode)
    }
  }, [mode, storageKey, forceMode])

  // Context methods
  const setMode = (newMode: ThemeMode) => {
    if (!forceMode) {
      setModeState(newMode)
    }
  }

  const setTheme = (theme: ThemeConfig) => {
    setCurrentTheme(theme)
  }

  const toggleMode = () => {
    if (forceMode) return

    if (mode === 'light') setModeState('dark')
    else if (mode === 'dark') setModeState('light')
    else {
      // If system, toggle to opposite of current resolved mode
      setModeState(resolvedMode === 'light' ? 'dark' : 'light')
    }
  }

  const value: ThemeContextValue = {
    theme: currentTheme,
    mode,
    resolvedMode,
    setMode,
    setTheme,
    toggleMode
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/**
 * Hook to use theme context
 */
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProviderDNA')
  }
  return context
}

/**
 * Theme toggle button component
 */
export function ThemeToggle({
  className = '',
  showLabel = false
}: {
  className?: string
  showLabel?: boolean
}) {
  const { mode, resolvedMode, toggleMode } = useTheme()

  const icon = mode === 'system' ? '🖥️' : resolvedMode === 'light' ? '☀️' : '🌙'

  const label = mode === 'system' ? 'System' : mode === 'light' ? 'Light' : 'Dark'

  return (
    <button
      onClick={toggleMode}
      className={`
        inline-flex items-center justify-center
        px-3 py-2 rounded-lg
        bg-gray-100 dark:bg-gray-800
        hover:bg-gray-200 dark:hover:bg-gray-700
        transition-colors duration-200
        ${className}
      `}
      aria-label={`Switch to ${mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light'} mode`}
    >
      <span className="text-xl" role="img" aria-hidden="true">
        {icon}
      </span>
      {showLabel && <span className="ml-2 text-sm font-medium">{label}</span>}
    </button>
  )
}

/**
 * CSS for theme transitions
 * Add this to your global CSS
 */
export const themeTransitionStyles = `
  .theme-transition,
  .theme-transition *,
  .theme-transition *::before,
  .theme-transition *::after {
    transition: background-color 300ms ease-in-out,
                border-color 300ms ease-in-out,
                color 300ms ease-in-out,
                fill 300ms ease-in-out,
                stroke 300ms ease-in-out !important;
  }
`

/**
 * Utility hook to get current theme colors
 */
export function useThemeColors() {
  const { theme, resolvedMode } = useTheme()
  return theme.colors[resolvedMode]
}

/**
 * Utility hook to get current theme gradients
 */
export function useThemeGradients() {
  const { theme, resolvedMode } = useTheme()
  return theme.gradients[resolvedMode]
}

/**
 * Utility hook to check if dark mode is active
 */
export function useIsDarkMode() {
  const { resolvedMode } = useTheme()
  return resolvedMode === 'dark'
}

/**
 * Export theme registry for external use
 */
export { themes }

/**
 * Export default theme
 */
export { iceCreamEnterpriseTheme as defaultTheme }
