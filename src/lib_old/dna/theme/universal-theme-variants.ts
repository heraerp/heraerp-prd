// ================================================================================
// HERA DNA UNIVERSAL THEME VARIANTS SYSTEM
// Smart Code: HERA.DNA.THEME.VARIANTS.UNIVERSAL.V1
// Dynamic color theming with main and accent colors in multiple shades for depth
// ================================================================================

export interface ColorShades {
  50: string    // Lightest shade - backgrounds, subtle highlights
  100: string   // Very light - hover states, disabled elements
  200: string   // Light - borders, dividers
  300: string   // Medium light - secondary text, placeholders
  400: string   // Medium - inactive states
  500: string   // Base color - primary usage
  600: string   // Medium dark - hover states, focus
  700: string   // Dark - active states, pressed
  800: string   // Very dark - high contrast text
  900: string   // Darkest - maximum contrast, headers
  950: string   // Ultra dark - deep shadows, overlays
}

export interface ThemeVariant {
  id: string
  name: string
  description: string
  smartCode: string
  main: ColorShades
  accent: ColorShades
  // Semantic color mappings for depth
  semantic: {
    primary: string      // main-500
    primaryHover: string // main-600
    primaryActive: string // main-700
    primarySubtle: string // main-50
    secondary: string    // accent-500
    secondaryHover: string // accent-600
    secondaryActive: string // accent-700
    secondarySubtle: string // accent-50
    background: string   // main-50
    surface: string      // main-100
    border: string       // main-200
    muted: string        // main-300
    foreground: string   // main-900
    accent: string       // accent-500
    accentForeground: string // accent-900
  }
}

// ================================================================================
// PREDEFINED THEME VARIANTS
// ================================================================================

export const THEME_VARIANTS: Record<string, ThemeVariant> = {
  // Professional Blue Theme
  professional: {
    id: 'professional',
    name: 'Professional Blue',
    description: 'Classic professional theme with blue tones',
    smartCode: 'HERA.DNA.THEME.VARIANT.PROFESSIONAL.V1',
    main: {
      50: '#eff6ff',   // Very light blue
      100: '#dbeafe',  // Light blue
      200: '#bfdbfe',  // Soft blue
      300: '#93c5fd',  // Medium light blue
      400: '#60a5fa',  // Medium blue
      500: '#3b82f6',  // Base blue
      600: '#2563eb',  // Strong blue
      700: '#1d4ed8',  // Dark blue
      800: '#1e40af',  // Very dark blue
      900: '#1e3a8a',  // Darkest blue
      950: '#172554'   // Ultra dark blue
    },
    accent: {
      50: '#f0f9ff',   // Very light cyan
      100: '#e0f2fe',  // Light cyan
      200: '#bae6fd',  // Soft cyan
      300: '#7dd3fc',  // Medium light cyan
      400: '#38bdf8',  // Medium cyan
      500: '#0ea5e9',  // Base cyan
      600: '#0284c7',  // Strong cyan
      700: '#0369a1',  // Dark cyan
      800: '#075985',  // Very dark cyan
      900: '#0c4a6e',  // Darkest cyan
      950: '#082f49'   // Ultra dark cyan
    },
    semantic: {
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      primaryActive: '#1d4ed8',
      primarySubtle: '#eff6ff',
      secondary: '#0ea5e9',
      secondaryHover: '#0284c7',
      secondaryActive: '#0369a1',
      secondarySubtle: '#f0f9ff',
      background: '#eff6ff',
      surface: '#dbeafe',
      border: '#bfdbfe',
      muted: '#93c5fd',
      foreground: '#1e3a8a',
      accent: '#0ea5e9',
      accentForeground: '#0c4a6e'
    }
  },

  // Elegant Purple Theme
  elegant: {
    id: 'elegant',
    name: 'Elegant Purple',
    description: 'Sophisticated purple theme for premium experiences',
    smartCode: 'HERA.DNA.THEME.VARIANT.ELEGANT.V1',
    main: {
      50: '#faf5ff',   // Very light purple
      100: '#f3e8ff',  // Light purple
      200: '#e9d5ff',  // Soft purple
      300: '#d8b4fe',  // Medium light purple
      400: '#c084fc',  // Medium purple
      500: '#a855f7',  // Base purple
      600: '#9333ea',  // Strong purple
      700: '#7c3aed',  // Dark purple
      800: '#6b21a8',  // Very dark purple
      900: '#581c87',  // Darkest purple
      950: '#3b0764'   // Ultra dark purple
    },
    accent: {
      50: '#fdf2f8',   // Very light pink
      100: '#fce7f3',  // Light pink
      200: '#fbcfe8',  // Soft pink
      300: '#f9a8d4',  // Medium light pink
      400: '#f472b6',  // Medium pink
      500: '#ec4899',  // Base pink
      600: '#db2777',  // Strong pink
      700: '#be185d',  // Dark pink
      800: '#9d174d',  // Very dark pink
      900: '#831843',  // Darkest pink
      950: '#500724'   // Ultra dark pink
    },
    semantic: {
      primary: '#a855f7',
      primaryHover: '#9333ea',
      primaryActive: '#7c3aed',
      primarySubtle: '#faf5ff',
      secondary: '#ec4899',
      secondaryHover: '#db2777',
      secondaryActive: '#be185d',
      secondarySubtle: '#fdf2f8',
      background: '#faf5ff',
      surface: '#f3e8ff',
      border: '#e9d5ff',
      muted: '#d8b4fe',
      foreground: '#581c87',
      accent: '#ec4899',
      accentForeground: '#831843'
    }
  },

  // Vibrant Green Theme
  vibrant: {
    id: 'vibrant',
    name: 'Vibrant Green',
    description: 'Fresh and energetic green theme',
    smartCode: 'HERA.DNA.THEME.VARIANT.VIBRANT.V1',
    main: {
      50: '#f0fdf4',   // Very light green
      100: '#dcfce7',  // Light green
      200: '#bbf7d0',  // Soft green
      300: '#86efac',  // Medium light green
      400: '#4ade80',  // Medium green
      500: '#22c55e',  // Base green
      600: '#16a34a',  // Strong green
      700: '#15803d',  // Dark green
      800: '#166534',  // Very dark green
      900: '#14532d',  // Darkest green
      950: '#052e16'   // Ultra dark green
    },
    accent: {
      50: '#fffbeb',   // Very light amber
      100: '#fef3c7',  // Light amber
      200: '#fde68a',  // Soft amber
      300: '#fcd34d',  // Medium light amber
      400: '#fbbf24',  // Medium amber
      500: '#f59e0b',  // Base amber
      600: '#d97706',  // Strong amber
      700: '#b45309',  // Dark amber
      800: '#92400e',  // Very dark amber
      900: '#78350f',  // Darkest amber
      950: '#451a03'   // Ultra dark amber
    },
    semantic: {
      primary: '#22c55e',
      primaryHover: '#16a34a',
      primaryActive: '#15803d',
      primarySubtle: '#f0fdf4',
      secondary: '#f59e0b',
      secondaryHover: '#d97706',
      secondaryActive: '#b45309',
      secondarySubtle: '#fffbeb',
      background: '#f0fdf4',
      surface: '#dcfce7',
      border: '#bbf7d0',
      muted: '#86efac',
      foreground: '#14532d',
      accent: '#f59e0b',
      accentForeground: '#78350f'
    }
  },

  // Modern Slate Theme
  modern: {
    id: 'modern',
    name: 'Modern Slate',
    description: 'Contemporary slate theme with orange accents',
    smartCode: 'HERA.DNA.THEME.VARIANT.MODERN.V1',
    main: {
      50: '#f8fafc',   // Very light slate
      100: '#f1f5f9',  // Light slate
      200: '#e2e8f0',  // Soft slate
      300: '#cbd5e1',  // Medium light slate
      400: '#94a3b8',  // Medium slate
      500: '#64748b',  // Base slate
      600: '#475569',  // Strong slate
      700: '#334155',  // Dark slate
      800: '#1e293b',  // Very dark slate
      900: '#0f172a',  // Darkest slate
      950: '#020617'   // Ultra dark slate
    },
    accent: {
      50: '#fff7ed',   // Very light orange
      100: '#ffedd5',  // Light orange
      200: '#fed7aa',  // Soft orange
      300: '#fdba74',  // Medium light orange
      400: '#fb923c',  // Medium orange
      500: '#f97316',  // Base orange
      600: '#ea580c',  // Strong orange
      700: '#c2410c',  // Dark orange
      800: '#9a3412',  // Very dark orange
      900: '#7c2d12',  // Darkest orange
      950: '#431407'   // Ultra dark orange
    },
    semantic: {
      primary: '#64748b',
      primaryHover: '#475569',
      primaryActive: '#334155',
      primarySubtle: '#f8fafc',
      secondary: '#f97316',
      secondaryHover: '#ea580c',
      secondaryActive: '#c2410c',
      secondarySubtle: '#fff7ed',
      background: '#f8fafc',
      surface: '#f1f5f9',
      border: '#e2e8f0',
      muted: '#cbd5e1',
      foreground: '#0f172a',
      accent: '#f97316',
      accentForeground: '#7c2d12'
    }
  },

  // Warm Earth Theme
  warm: {
    id: 'warm',
    name: 'Warm Earth',
    description: 'Cozy earth tones with red accents',
    smartCode: 'HERA.DNA.THEME.VARIANT.WARM.V1',
    main: {
      50: '#fefaf8',   // Very light brown
      100: '#fef2ee',  // Light brown
      200: '#fde2d4',  // Soft brown
      300: '#fbc5a1',  // Medium light brown
      400: '#f89e6d',  // Medium brown
      500: '#f4723d',  // Base brown
      600: '#e85527',  // Strong brown
      700: '#c2410c',  // Dark brown
      800: '#9a3412',  // Very dark brown
      900: '#7c2d12',  // Darkest brown
      950: '#431407'   // Ultra dark brown
    },
    accent: {
      50: '#fef2f2',   // Very light red
      100: '#fee2e2',  // Light red
      200: '#fecaca',  // Soft red
      300: '#fca5a5',  // Medium light red
      400: '#f87171',  // Medium red
      500: '#ef4444',  // Base red
      600: '#dc2626',  // Strong red
      700: '#b91c1c',  // Dark red
      800: '#991b1b',  // Very dark red
      900: '#7f1d1d',  // Darkest red
      950: '#450a0a'   // Ultra dark red
    },
    semantic: {
      primary: '#f4723d',
      primaryHover: '#e85527',
      primaryActive: '#c2410c',
      primarySubtle: '#fefaf8',
      secondary: '#ef4444',
      secondaryHover: '#dc2626',
      secondaryActive: '#b91c1c',
      secondarySubtle: '#fef2f2',
      background: '#fefaf8',
      surface: '#fef2ee',
      border: '#fde2d4',
      muted: '#fbc5a1',
      foreground: '#7c2d12',
      accent: '#ef4444',
      accentForeground: '#7f1d1d'
    }
  },

  // Cool Teal Theme
  cool: {
    id: 'cool',
    name: 'Cool Teal',
    description: 'Refreshing teal theme with indigo accents',
    smartCode: 'HERA.DNA.THEME.VARIANT.COOL.V1',
    main: {
      50: '#f0fdfa',   // Very light teal
      100: '#ccfbf1',  // Light teal
      200: '#99f6e4',  // Soft teal
      300: '#5eead4',  // Medium light teal
      400: '#2dd4bf',  // Medium teal
      500: '#14b8a6',  // Base teal
      600: '#0d9488',  // Strong teal
      700: '#0f766e',  // Dark teal
      800: '#115e59',  // Very dark teal
      900: '#134e4a',  // Darkest teal
      950: '#042f2e'   // Ultra dark teal
    },
    accent: {
      50: '#eef2ff',   // Very light indigo
      100: '#e0e7ff',  // Light indigo
      200: '#c7d2fe',  // Soft indigo
      300: '#a5b4fc',  // Medium light indigo
      400: '#818cf8',  // Medium indigo
      500: '#6366f1',  // Base indigo
      600: '#4f46e5',  // Strong indigo
      700: '#4338ca',  // Dark indigo
      800: '#3730a3',  // Very dark indigo
      900: '#312e81',  // Darkest indigo
      950: '#1e1b4b'   // Ultra dark indigo
    },
    semantic: {
      primary: '#14b8a6',
      primaryHover: '#0d9488',
      primaryActive: '#0f766e',
      primarySubtle: '#f0fdfa',
      secondary: '#6366f1',
      secondaryHover: '#4f46e5',
      secondaryActive: '#4338ca',
      secondarySubtle: '#eef2ff',
      background: '#f0fdfa',
      surface: '#ccfbf1',
      border: '#99f6e4',
      muted: '#5eead4',
      foreground: '#134e4a',
      accent: '#6366f1',
      accentForeground: '#312e81'
    }
  }
}

// ================================================================================
// THEME CONFIGURATION UTILITIES
// ================================================================================

export interface ThemeConfiguration {
  variant: string
  customizations?: {
    primaryShade?: keyof ColorShades
    accentShade?: keyof ColorShades
    backgroundOpacity?: number
    borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
    shadows?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  }
}

export const generateCSSVariables = (variant: ThemeVariant, customizations?: ThemeConfiguration['customizations']) => {
  const { main, accent, semantic } = variant
  
  return {
    // Main color shades
    '--color-main-50': main[50],
    '--color-main-100': main[100],
    '--color-main-200': main[200],
    '--color-main-300': main[300],
    '--color-main-400': main[400],
    '--color-main-500': main[500],
    '--color-main-600': main[600],
    '--color-main-700': main[700],
    '--color-main-800': main[800],
    '--color-main-900': main[900],
    '--color-main-950': main[950],
    
    // Accent color shades
    '--color-accent-50': accent[50],
    '--color-accent-100': accent[100],
    '--color-accent-200': accent[200],
    '--color-accent-300': accent[300],
    '--color-accent-400': accent[400],
    '--color-accent-500': accent[500],
    '--color-accent-600': accent[600],
    '--color-accent-700': accent[700],
    '--color-accent-800': accent[800],
    '--color-accent-900': accent[900],
    '--color-accent-950': accent[950],
    
    // Semantic colors for easy usage
    '--color-primary': semantic.primary,
    '--color-primary-hover': semantic.primaryHover,
    '--color-primary-active': semantic.primaryActive,
    '--color-primary-subtle': semantic.primarySubtle,
    '--color-secondary': semantic.secondary,
    '--color-secondary-hover': semantic.secondaryHover,
    '--color-secondary-active': semantic.secondaryActive,
    '--color-secondary-subtle': semantic.secondarySubtle,
    '--color-background': semantic.background,
    '--color-surface': semantic.surface,
    '--color-border': semantic.border,
    '--color-muted': semantic.muted,
    '--color-foreground': semantic.foreground,
    '--color-accent': semantic.accent,
    '--color-accent-foreground': semantic.accentForeground,
    
    // Customizations
    '--border-radius': customizations?.borderRadius === 'none' ? '0' :
                      customizations?.borderRadius === 'sm' ? '0.125rem' :
                      customizations?.borderRadius === 'md' ? '0.375rem' :
                      customizations?.borderRadius === 'lg' ? '0.5rem' :
                      customizations?.borderRadius === 'xl' ? '0.75rem' : '0.375rem',
    
    '--shadow-color': main[900],
    '--shadow-opacity': customizations?.shadows === 'none' ? '0' :
                       customizations?.shadows === 'sm' ? '0.1' :
                       customizations?.shadows === 'md' ? '0.15' :
                       customizations?.shadows === 'lg' ? '0.2' :
                       customizations?.shadows === 'xl' ? '0.25' : '0.15'
  }
}

export const getThemeVariant = (variantId: string): ThemeVariant | null => {
  return THEME_VARIANTS[variantId] || null
}

export const getAvailableThemes = (): ThemeVariant[] => {
  return Object.values(THEME_VARIANTS)
}

export const createCustomTheme = (
  id: string,
  name: string,
  description: string,
  mainColors: ColorShades,
  accentColors: ColorShades
): ThemeVariant => {
  return {
    id,
    name,
    description,
    smartCode: `HERA.DNA.THEME.VARIANT.CUSTOM.${id.toUpperCase()}.v1`,
    main: mainColors,
    accent: accentColors,
    semantic: {
      primary: mainColors[500],
      primaryHover: mainColors[600],
      primaryActive: mainColors[700],
      primarySubtle: mainColors[50],
      secondary: accentColors[500],
      secondaryHover: accentColors[600],
      secondaryActive: accentColors[700],
      secondarySubtle: accentColors[50],
      background: mainColors[50],
      surface: mainColors[100],
      border: mainColors[200],
      muted: mainColors[300],
      foreground: mainColors[900],
      accent: accentColors[500],
      accentForeground: accentColors[900]
    }
  }
}

// Export default themes for easy access
export default THEME_VARIANTS