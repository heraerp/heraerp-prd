/**
 * HERA DNA Color Palette System
 * Single source of truth for all colors across HERA applications
 * Integrates with Auto-Enforcement system for guaranteed consistency
 */

export interface ColorToken {
  light: string
  dark: string
}

export interface ColorTokens {
  version: string
  brand: string
  modes: string[]
  tokens: {
    color: {
      // Base colors
      bg: ColorToken
      surface: ColorToken
      surfaceAlt: ColorToken
      border: ColorToken
      
      // Brand colors
      primary: ColorToken
      primaryFg: ColorToken
      secondary: ColorToken
      secondaryFg: ColorToken
      accent: ColorToken
      accentFg: ColorToken
      
      // Extended palette
      purple: ColorToken
      amber: ColorToken
      red: ColorToken
      gold: ColorToken
      
      // Status colors
      success: ColorToken
      warning: ColorToken
      danger: ColorToken
      
      // Typography
      text: ColorToken
      textMuted: ColorToken
      focusRing: ColorToken
    }
    state: {
      primaryHover: ColorToken
      primaryActive: ColorToken
      secondaryHover: ColorToken
      secondaryActive: ColorToken
      accentHover: ColorToken
      accentActive: ColorToken
    }
    elevation: {
      shadow1: string
      shadow2: string
    }
    radius: {
      sm: string
      md: string
      lg: string
      xl: string
    }
    gradient: {
      brand: string
    }
  }
}

/**
 * HERA DNA Color Tokens - Single Source of Truth
 * Based on your provided design tokens specification
 */
export const HERA_COLOR_TOKENS: ColorTokens = {
  version: "1.0",
  brand: "HERA",
  modes: ["light", "dark"],
  tokens: {
    color: {
      // Base colors
      bg: { light: "#FFFFFF", dark: "#0B0F17" },
      surface: { light: "#F8FAFC", dark: "#111725" },
      surfaceAlt: { light: "#EEF2F7", dark: "#161D2D" },
      border: { light: "#E5E7EB", dark: "#27303B" },

      // Brand colors - HERA Primary Blue
      primary: { light: "#3B82F6", dark: "#60A5FA" },
      primaryFg: { light: "#FFFFFF", dark: "#0A0E14" },

      // HERA Secondary Cyan
      secondary: { light: "#06B6D4", dark: "#22D3EE" },
      secondaryFg: { light: "#0A0E14", dark: "#0A0E14" },

      // HERA Accent Green
      accent: { light: "#10B981", dark: "#34D399" },
      accentFg: { light: "#0A0E14", dark: "#0A0E14" },

      // Extended palette
      purple: { light: "#8B5CF6", dark: "#A78BFA" },
      amber: { light: "#F59E0B", dark: "#FBBF24" },
      red: { light: "#EF4444", dark: "#F87171" },
      gold: { light: "#FBBF24", dark: "#FCD34D" },

      // Status colors
      success: { light: "#22C55E", dark: "#4ADE80" },
      warning: { light: "#F59E0B", dark: "#FBBF24" },
      danger: { light: "#EF4444", dark: "#F87171" },

      // Typography
      text: { light: "#0A0E14", dark: "#E8EDF5" },
      textMuted: { light: "#64748B", dark: "#94A3B8" },
      focusRing: { light: "#3B82F6", dark: "#60A5FA" }
    },
    state: {
      primaryHover: { light: "#316FDB", dark: "#4B91F3" },
      primaryActive: { light: "#285DBE", dark: "#3C7EE0" },
      secondaryHover: { light: "#0893AE", dark: "#1ABBD3" },
      secondaryActive: { light: "#077C93", dark: "#159FB4" },
      accentHover: { light: "#0FA171", dark: "#2FC08A" },
      accentActive: { light: "#0C8C62", dark: "#29A878" }
    },
    elevation: {
      shadow1: "0 1px 2px rgba(0,0,0,.06)",
      shadow2: "0 4px 10px rgba(0,0,0,.08)"
    },
    radius: {
      sm: "8px",
      md: "12px", 
      lg: "16px",
      xl: "20px"
    },
    gradient: {
      brand: "linear-gradient(45deg, #3B82F6, #06B6D4, #10B981)"
    }
  }
}

/**
 * CSS Variables Generator
 * Generates CSS custom properties from design tokens
 */
export class HeraCSSVariableGenerator {
  static generateLightMode(): string {
    const { tokens } = HERA_COLOR_TOKENS
    
    return `
:root {
  /* Base colors */
  --color-bg: ${tokens.color.bg.light};
  --color-surface: ${tokens.color.surface.light};
  --color-surfaceAlt: ${tokens.color.surfaceAlt.light};
  --color-border: ${tokens.color.border.light};

  /* Brand colors */
  --color-primary: ${tokens.color.primary.light};
  --color-primary-fg: ${tokens.color.primaryFg.light};
  --color-secondary: ${tokens.color.secondary.light};
  --color-secondary-fg: ${tokens.color.secondaryFg.light};
  --color-accent: ${tokens.color.accent.light};
  --color-accent-fg: ${tokens.color.accentFg.light};

  /* Extended palette */
  --color-purple: ${tokens.color.purple.light};
  --color-amber: ${tokens.color.amber.light};
  --color-red: ${tokens.color.red.light};
  --color-gold: ${tokens.color.gold.light};

  /* Status colors */
  --color-success: ${tokens.color.success.light};
  --color-warning: ${tokens.color.warning.light};
  --color-danger: ${tokens.color.danger.light};

  /* Typography */
  --color-text: ${tokens.color.text.light};
  --color-text-muted: ${tokens.color.textMuted.light};
  --color-focus: ${tokens.color.focusRing.light};

  /* State colors */
  --state-primary-hover: ${tokens.state.primaryHover.light};
  --state-primary-active: ${tokens.state.primaryActive.light};
  --state-secondary-hover: ${tokens.state.secondaryHover.light};
  --state-secondary-active: ${tokens.state.secondaryActive.light};
  --state-accent-hover: ${tokens.state.accentHover.light};
  --state-accent-active: ${tokens.state.accentActive.light};

  /* Elevation */
  --shadow-1: ${tokens.elevation.shadow1};
  --shadow-2: ${tokens.elevation.shadow2};

  /* Radius */
  --radius-sm: ${tokens.radius.sm};
  --radius-md: ${tokens.radius.md};
  --radius-lg: ${tokens.radius.lg};
  --radius-xl: ${tokens.radius.xl};

  /* Gradient */
  --gradient-brand: ${tokens.gradient.brand};
}`
  }

  static generateDarkMode(): string {
    const { tokens } = HERA_COLOR_TOKENS
    
    return `
:root.dark {
  /* Base colors */
  --color-bg: ${tokens.color.bg.dark};
  --color-surface: ${tokens.color.surface.dark};
  --color-surfaceAlt: ${tokens.color.surfaceAlt.dark};
  --color-border: ${tokens.color.border.dark};

  /* Brand colors */
  --color-primary: ${tokens.color.primary.dark};
  --color-primary-fg: ${tokens.color.primaryFg.dark};
  --color-secondary: ${tokens.color.secondary.dark};
  --color-secondary-fg: ${tokens.color.secondaryFg.dark};
  --color-accent: ${tokens.color.accent.dark};
  --color-accent-fg: ${tokens.color.accentFg.dark};

  /* Extended palette */
  --color-purple: ${tokens.color.purple.dark};
  --color-amber: ${tokens.color.amber.dark};
  --color-red: ${tokens.color.red.dark};
  --color-gold: ${tokens.color.gold.dark};

  /* Status colors */
  --color-success: ${tokens.color.success.dark};
  --color-warning: ${tokens.color.warning.dark};
  --color-danger: ${tokens.color.danger.dark};

  /* Typography */
  --color-text: ${tokens.color.text.dark};
  --color-text-muted: ${tokens.color.textMuted.dark};
  --color-focus: ${tokens.color.focusRing.dark};

  /* State colors */
  --state-primary-hover: ${tokens.state.primaryHover.dark};
  --state-primary-active: ${tokens.state.primaryActive.dark};
  --state-secondary-hover: ${tokens.state.secondaryHover.dark};
  --state-secondary-active: ${tokens.state.secondaryActive.dark};
  --state-accent-hover: ${tokens.state.accentHover.dark};
  --state-accent-active: ${tokens.state.accentActive.dark};
}`
  }

  static generateCompleteCSSVars(): string {
    return this.generateLightMode() + '\n\n' + this.generateDarkMode()
  }

  static generateMinifiedCSSVars(): string {
    const { tokens } = HERA_COLOR_TOKENS
    
    return `:root{
--color-bg:${tokens.color.bg.light}; --color-surface:${tokens.color.surface.light}; --color-surfaceAlt:${tokens.color.surfaceAlt.light}; --color-border:${tokens.color.border.light};
--color-primary:${tokens.color.primary.light}; --color-primary-fg:${tokens.color.primaryFg.light};
--color-secondary:${tokens.color.secondary.light}; --color-secondary-fg:${tokens.color.secondaryFg.light};
--color-accent:${tokens.color.accent.light}; --color-accent-fg:${tokens.color.accentFg.light};
--color-purple:${tokens.color.purple.light}; --color-amber:${tokens.color.amber.light}; --color-red:${tokens.color.red.light}; --color-gold:${tokens.color.gold.light};
--color-success:${tokens.color.success.light}; --color-warning:${tokens.color.warning.light}; --color-danger:${tokens.color.danger.light};
--color-text:${tokens.color.text.light}; --color-text-muted:${tokens.color.textMuted.light}; --color-focus:${tokens.color.focusRing.light};
--state-primary-hover:${tokens.state.primaryHover.light}; --state-primary-active:${tokens.state.primaryActive.light};
--state-secondary-hover:${tokens.state.secondaryHover.light}; --state-secondary-active:${tokens.state.secondaryActive.light};
--state-accent-hover:${tokens.state.accentHover.light}; --state-accent-active:${tokens.state.accentActive.light};
--shadow-1:${tokens.elevation.shadow1}; --shadow-2:${tokens.elevation.shadow2};
--radius-sm:${tokens.radius.sm}; --radius-md:${tokens.radius.md}; --radius-lg:${tokens.radius.lg}; --radius-xl:${tokens.radius.xl};
--gradient-brand:${tokens.gradient.brand};
}
:root.dark{
--color-bg:${tokens.color.bg.dark}; --color-surface:${tokens.color.surface.dark}; --color-surfaceAlt:${tokens.color.surfaceAlt.dark}; --color-border:${tokens.color.border.dark};
--color-primary:${tokens.color.primary.dark}; --color-primary-fg:${tokens.color.primaryFg.dark};
--color-secondary:${tokens.color.secondary.dark}; --color-secondary-fg:${tokens.color.secondaryFg.dark};
--color-accent:${tokens.color.accent.dark}; --color-accent-fg:${tokens.color.accentFg.dark};
--color-purple:${tokens.color.purple.dark}; --color-amber:${tokens.color.amber.dark}; --color-red:${tokens.color.red.dark}; --color-gold:${tokens.color.gold.dark};
--color-success:${tokens.color.success.dark}; --color-warning:${tokens.color.warning.dark}; --color-danger:${tokens.color.danger.dark};
--color-text:${tokens.color.text.dark}; --color-text-muted:${tokens.color.textMuted.dark}; --color-focus:${tokens.color.focusRing.dark};
--state-primary-hover:${tokens.state.primaryHover.dark}; --state-primary-active:${tokens.state.primaryActive.dark};
--state-secondary-hover:${tokens.state.secondaryHover.dark}; --state-secondary-active:${tokens.state.secondaryActive.dark};
--state-accent-hover:${tokens.state.accentHover.dark}; --state-accent-active:${tokens.state.accentActive.dark};
}`
  }
}

/**
 * Tailwind Config Generator
 * Generates Tailwind configuration from design tokens
 */
export class HeraTailwindConfigGenerator {
  static generateTailwindConfig() {
    return {
      darkMode: ['class'],
      theme: {
        extend: {
          colors: {
            // Base colors
            bg: 'var(--color-bg)',
            surface: 'var(--color-surface)',
            surfaceAlt: 'var(--color-surfaceAlt)',
            border: 'var(--color-border)',

            // Brand colors
            primary: 'var(--color-primary)',
            'primary-fg': 'var(--color-primary-fg)',
            secondary: 'var(--color-secondary)',
            'secondary-fg': 'var(--color-secondary-fg)',
            accent: 'var(--color-accent)',
            'accent-fg': 'var(--color-accent-fg)',

            // Extended palette
            purple: 'var(--color-purple)',
            amber: 'var(--color-amber)',
            red: 'var(--color-red)',
            gold: 'var(--color-gold)',

            // Status colors
            success: 'var(--color-success)',
            warning: 'var(--color-warning)',
            danger: 'var(--color-danger)',

            // Typography
            text: 'var(--color-text)',
            'text-muted': 'var(--color-text-muted)'
          },
          boxShadow: {
            sm: 'var(--shadow-1)',
            md: 'var(--shadow-2)'
          },
          borderRadius: {
            sm: 'var(--radius-sm)',
            md: 'var(--radius-md)',
            lg: 'var(--radius-lg)',
            xl: 'var(--radius-xl)'
          },
          backgroundImage: {
            'brand-gradient': 'var(--gradient-brand)'
          }
        }
      }
    }
  }

  static generateTailwindConfigString(): string {
    const config = this.generateTailwindConfig()
    return `// tailwind.config.js
module.exports = ${JSON.stringify(config, null, 2)};`
  }
}

/**
 * Theme Management System
 * Handles switching between light and dark modes
 */
export class HeraThemeManager {
  private static instance: HeraThemeManager
  private currentTheme: 'light' | 'dark' = 'light'
  private listeners: Array<(theme: 'light' | 'dark') => void> = []

  static getInstance(): HeraThemeManager {
    if (!this.instance) {
      this.instance = new HeraThemeManager()
    }
    return this.instance
  }

  constructor() {
    this.initializeTheme()
  }

  private initializeTheme(): void {
    if (typeof window !== 'undefined') {
      // Check user preference or system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const storedTheme = localStorage.getItem('hera-theme') as 'light' | 'dark' | null
      const desired = storedTheme ?? (prefersDark ? 'dark' : 'light')
      
      this.setTheme(desired)
      
      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('hera-theme')) {
          this.setTheme(e.matches ? 'dark' : 'light')
        }
      })
    }
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.currentTheme = theme
    
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark')
      localStorage.setItem('hera-theme', theme)
    }
    
    // Notify listeners
    this.listeners.forEach(listener => listener(theme))
  }

  getTheme(): 'light' | 'dark' {
    return this.currentTheme
  }

  toggleTheme(): void {
    this.setTheme(this.currentTheme === 'light' ? 'dark' : 'light')
  }

  subscribe(listener: (theme: 'light' | 'dark') => void): () => void {
    this.listeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }
}

/**
 * Color Utility Functions
 */
export class HeraColorUtils {
  /**
   * Get current color value for a token
   */
  static getTokenValue(tokenPath: string, mode?: 'light' | 'dark'): string {
    const currentMode = mode || HeraThemeManager.getInstance().getTheme()
    const paths = tokenPath.split('.')
    
    let current: any = HERA_COLOR_TOKENS.tokens
    for (const path of paths) {
      current = current?.[path]
    }
    
    if (current && typeof current === 'object' && current.light && current.dark) {
      return current[currentMode]
    }
    
    return current || ''
  }

  /**
   * Generate CSS variable name from token path
   */
  static getCSSVariable(tokenPath: string): string {
    return `var(--${tokenPath.replace(/\./g, '-')})`
  }

  /**
   * Get all colors for current theme
   */
  static getAllColors(mode?: 'light' | 'dark'): Record<string, string> {
    const currentMode = mode || HeraThemeManager.getInstance().getTheme()
    const colors: Record<string, string> = {}
    
    const flattenTokens = (obj: any, prefix: string = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const tokenPath = prefix ? `${prefix}.${key}` : key
        
        if (value && typeof value === 'object' && 'light' in value && 'dark' in value) {
          colors[tokenPath] = (value as ColorToken)[currentMode]
        } else if (value && typeof value === 'object') {
          flattenTokens(value, tokenPath)
        } else if (typeof value === 'string') {
          colors[tokenPath] = value
        }
      }
    }
    
    flattenTokens(HERA_COLOR_TOKENS.tokens)
    return colors
  }
}

/**
 * React Hook for Theme Management
 */
export function useHeraTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  
  useEffect(() => {
    const themeManager = HeraThemeManager.getInstance()
    setTheme(themeManager.getTheme())
    
    const unsubscribe = themeManager.subscribe(setTheme)
    return unsubscribe
  }, [])
  
  const toggleTheme = useCallback(() => {
    HeraThemeManager.getInstance().toggleTheme()
  }, [])
  
  const setThemeMode = useCallback((mode: 'light' | 'dark') => {
    HeraThemeManager.getInstance().setTheme(mode)
  }, [])
  
  return {
    theme,
    toggleTheme,
    setTheme: setThemeMode,
    isLight: theme === 'light',
    isDark: theme === 'dark'
  }
}

// Required imports for React hook
import { useState, useEffect, useCallback } from 'react'

/**
 * Export everything for convenience
 */
export {
  HERA_COLOR_TOKENS as default,
  HERA_COLOR_TOKENS,
  HeraCSSVariableGenerator,
  HeraTailwindConfigGenerator,
  HeraThemeManager,
  HeraColorUtils
}

/**
 * USAGE EXAMPLES:
 * 
 * 1. Generate CSS Variables:
 * const cssVars = HeraCSSVariableGenerator.generateCompleteCSSVars()
 * 
 * 2. Get Tailwind Config:
 * const tailwindConfig = HeraTailwindConfigGenerator.generateTailwindConfig()
 * 
 * 3. Theme Management:
 * const themeManager = HeraThemeManager.getInstance()
 * themeManager.setTheme('dark')
 * 
 * 4. Use in React:
 * const { theme, toggleTheme } = useHeraTheme()
 * 
 * 5. Get color values:
 * const primaryColor = HeraColorUtils.getTokenValue('color.primary')
 */