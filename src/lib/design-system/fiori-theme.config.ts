/**
 * HERA SAP Fiori Design System Configuration
 * Smart Code: HERA.DESIGN_SYSTEM.FIORI.THEME.v1
 * 
 * Centralized theme configuration for consistent SAP Fiori styling
 * across all HERA applications (Retail, Agro, Salon, Waste, etc.)
 */

export interface FioriColorPalette {
  // Primary Brand Colors
  primary: {
    50: string
    100: string
    200: string
    300: string
    400: string
    500: string
    600: string  // Main brand color
    700: string
    800: string
    900: string
  }
  
  // Semantic Colors
  semantic: {
    success: string
    warning: string
    error: string
    info: string
    neutral: string
  }
  
  // Surface Colors
  surface: {
    background: string
    paper: string
    elevated: string
    overlay: string
  }
  
  // Text Colors
  text: {
    primary: string
    secondary: string
    disabled: string
    inverse: string
  }
  
  // Border Colors
  border: {
    light: string
    medium: string
    heavy: string
  }
}

export interface FioriTypography {
  // Font Families
  fontFamily: {
    primary: string
    monospace: string
  }
  
  // Font Weights
  fontWeight: {
    light: number
    regular: number
    medium: number
    semibold: number
    bold: number
  }
  
  // Font Sizes (Mobile / Desktop)
  fontSize: {
    xs: { mobile: string, desktop: string }
    sm: { mobile: string, desktop: string }
    base: { mobile: string, desktop: string }
    lg: { mobile: string, desktop: string }
    xl: { mobile: string, desktop: string }
    '2xl': { mobile: string, desktop: string }
    '3xl': { mobile: string, desktop: string }
  }
  
  // Line Heights
  lineHeight: {
    tight: number
    normal: number
    relaxed: number
  }
}

export interface FioriSpacing {
  // Base spacing unit (typically 8px)
  base: string
  
  // Spacing scale
  xs: string    // 4px
  sm: string    // 8px
  md: string    // 16px
  lg: string    // 24px
  xl: string    // 32px
  '2xl': string // 48px
  '3xl': string // 64px
  '4xl': string // 96px
}

export interface FioriBorderRadius {
  none: string
  sm: string
  base: string
  lg: string
  xl: string
  full: string
}

export interface FioriShadows {
  sm: string
  base: string
  md: string
  lg: string
  xl: string
}

export interface FioriBreakpoints {
  sm: string
  md: string
  lg: string
  xl: string
  '2xl': string
}

export interface FioriAnimations {
  duration: {
    fast: string
    normal: string
    slow: string
  }
  
  easing: {
    ease: string
    easeIn: string
    easeOut: string
    easeInOut: string
  }
}

export interface FioriTheme {
  colors: FioriColorPalette
  typography: FioriTypography
  spacing: FioriSpacing
  borderRadius: FioriBorderRadius
  shadows: FioriShadows
  breakpoints: FioriBreakpoints
  animations: FioriAnimations
}

// Default HERA Retail Theme (Indigo-based)
export const heraRetailTheme: FioriTheme = {
  colors: {
    primary: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',  // Main brand color
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81'
    },
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      neutral: '#6b7280'
    },
    surface: {
      background: '#f8fafc',
      paper: '#ffffff',
      elevated: '#ffffff',
      overlay: 'rgba(0, 0, 0, 0.5)'
    },
    text: {
      primary: '#1e293b',
      secondary: '#475569',
      disabled: '#94a3b8',
      inverse: '#ffffff'
    },
    border: {
      light: '#e2e8f0',
      medium: '#cbd5e1',
      heavy: '#94a3b8'
    }
  },
  
  typography: {
    fontFamily: {
      primary: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      monospace: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, monospace'
    },
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    fontSize: {
      xs: { mobile: '0.75rem', desktop: '0.75rem' },
      sm: { mobile: '0.875rem', desktop: '0.875rem' },
      base: { mobile: '1rem', desktop: '1rem' },
      lg: { mobile: '1.125rem', desktop: '1.125rem' },
      xl: { mobile: '1.25rem', desktop: '1.25rem' },
      '2xl': { mobile: '1.5rem', desktop: '1.875rem' },
      '3xl': { mobile: '1.875rem', desktop: '2.25rem' }
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75
    }
  },
  
  spacing: {
    base: '8px',
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
    '4xl': '96px'
  },
  
  borderRadius: {
    none: '0',
    sm: '4px',
    base: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px'
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },
  
  animations: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms'
    },
    easing: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out'
    }
  }
}

// HERA Agro Theme (Green-based)
export const heraAgroTheme: FioriTheme = {
  ...heraRetailTheme,
  colors: {
    ...heraRetailTheme.colors,
    primary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',  // Main brand color
      700: '#15803d',
      800: '#166534',
      900: '#14532d'
    }
  }
}

// HERA Salon Theme (Purple-based)
export const heraSalonTheme: FioriTheme = {
  ...heraRetailTheme,
  colors: {
    ...heraRetailTheme.colors,
    primary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',  // Main brand color
      700: '#7c3aed',
      800: '#6b21a8',
      900: '#581c87'
    }
  }
}

// HERA Waste Theme (Orange-based)
export const heraWasteTheme: FioriTheme = {
  ...heraRetailTheme,
  colors: {
    ...heraRetailTheme.colors,
    primary: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',  // Main brand color
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12'
    }
  }
}

// Theme Registry
export const heraThemes = {
  retail: heraRetailTheme,
  agro: heraAgroTheme,
  salon: heraSalonTheme,
  waste: heraWasteTheme
} as const

export type HeraAppCode = keyof typeof heraThemes

/**
 * Get theme configuration for a specific HERA application
 */
export function getHeraTheme(appCode: HeraAppCode): FioriTheme {
  return heraThemes[appCode] || heraRetailTheme
}

/**
 * Generate CSS custom properties from theme
 */
export function generateThemeCSSProperties(theme: FioriTheme): Record<string, string> {
  const cssVars: Record<string, string> = {}
  
  // Colors
  Object.entries(theme.colors.primary).forEach(([key, value]) => {
    cssVars[`--color-primary-${key}`] = value
  })
  
  Object.entries(theme.colors.semantic).forEach(([key, value]) => {
    cssVars[`--color-${key}`] = value
  })
  
  Object.entries(theme.colors.surface).forEach(([key, value]) => {
    cssVars[`--color-surface-${key}`] = value
  })
  
  Object.entries(theme.colors.text).forEach(([key, value]) => {
    cssVars[`--color-text-${key}`] = value
  })
  
  Object.entries(theme.colors.border).forEach(([key, value]) => {
    cssVars[`--color-border-${key}`] = value
  })
  
  // Spacing
  Object.entries(theme.spacing).forEach(([key, value]) => {
    cssVars[`--spacing-${key}`] = value
  })
  
  // Border Radius
  Object.entries(theme.borderRadius).forEach(([key, value]) => {
    cssVars[`--radius-${key}`] = value
  })
  
  // Shadows
  Object.entries(theme.shadows).forEach(([key, value]) => {
    cssVars[`--shadow-${key}`] = value
  })
  
  return cssVars
}

/**
 * Get Tailwind-compatible color classes for theme
 */
export function getThemeColorClasses(theme: FioriTheme) {
  return {
    primary: {
      50: `rgb(${theme.colors.primary[50]})`,
      100: `rgb(${theme.colors.primary[100]})`,
      200: `rgb(${theme.colors.primary[200]})`,
      300: `rgb(${theme.colors.primary[300]})`,
      400: `rgb(${theme.colors.primary[400]})`,
      500: `rgb(${theme.colors.primary[500]})`,
      600: `rgb(${theme.colors.primary[600]})`,
      700: `rgb(${theme.colors.primary[700]})`,
      800: `rgb(${theme.colors.primary[800]})`,
      900: `rgb(${theme.colors.primary[900]})`
    },
    semantic: theme.colors.semantic,
    surface: theme.colors.surface,
    text: theme.colors.text,
    border: theme.colors.border
  }
}

export default heraRetailTheme