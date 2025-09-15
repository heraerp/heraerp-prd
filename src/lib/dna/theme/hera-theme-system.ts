/**
 * HERA Universal Theme System
 *
 * A comprehensive theming system that provides semantic color tokens,
 * consistent styling patterns, and perfect light/dark mode support.
 *
 * Principles:
 * 1. Semantic naming - colors have meaning, not just hue
 * 2. Accessibility first - WCAG AAA contrast ratios
 * 3. Consistency - same visual language across all modules
 * 4. Flexibility - easy to customize for different industries
 */

export interface ColorScale {
  50: string
  100: string
  200: string
  300: string
  400: string
  500: string
  600: string
  700: string
  800: string
  900: string
  950: string
}

export interface SemanticColors {
  // Base colors
  background: string
  foreground: string

  // Card/Container colors
  card: string
  cardForeground: string

  // Interactive elements
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string

  // Feedback colors
  success: string
  successForeground: string
  warning: string
  warningForeground: string
  danger: string
  dangerForeground: string
  info: string
  infoForeground: string

  // Neutral colors
  muted: string
  mutedForeground: string

  // Borders and dividers
  border: string
  borderSubtle: string

  // Special UI elements
  accent: string
  accentForeground: string
  highlight: string

  // Overlays and backdrops
  overlay: string
  backdrop: string
}

export interface GradientPalette {
  // Primary gradients
  primary: string
  secondary: string
  accent: string

  // Semantic gradients
  success: string
  warning: string
  danger: string
  info: string

  // Special effect gradients
  shimmer: string
  glow: string
  aurora: string

  // Module-specific gradients
  moduleHero: string
  moduleAccent: string
}

export interface ThemeConfig {
  name: string
  description: string
  colors: {
    light: SemanticColors
    dark: SemanticColors
  }
  gradients: {
    light: GradientPalette
    dark: GradientPalette
  }
  // Component-specific tokens
  components: {
    card: {
      background: string
      border: string
      shadow: string
      hoverShadow: string
    }
    stat: {
      background: string
      valueForeground: string
      labelForeground: string
      trendPositive: string
      trendNegative: string
      trendNeutral: string
    }
    table: {
      headerBackground: string
      rowBackground: string
      rowBackgroundAlt: string
      rowHover: string
      borderColor: string
    }
    badge: {
      defaultBackground: string
      defaultForeground: string
      // Variants for different states
      variants: {
        [key: string]: {
          background: string
          foreground: string
          border?: string
        }
      }
    }
    button: {
      // Different button variants
      variants: {
        default: {
          background: string
          foreground: string
          hover: string
          active: string
        }
        primary: {
          background: string
          foreground: string
          hover: string
          active: string
        }
        secondary: {
          background: string
          foreground: string
          hover: string
          active: string
        }
        ghost: {
          background: string
          foreground: string
          hover: string
          active: string
        }
      }
    }
  }
  // Animation and transition tokens
  animation: {
    duration: {
      fast: string
      normal: string
      slow: string
    }
    easing: {
      default: string
      smooth: string
      bounce: string
    }
  }
  // Spacing and layout tokens
  spacing: {
    card: string
    section: string
    component: string
  }
  // Border radius tokens
  radius: {
    small: string
    medium: string
    large: string
    full: string
  }
  // Backdrop and glass effects
  effects: {
    backdropBlur: string
    glassMorphism: string
    cardOpacity: string
  }
}

/**
 * HERA Base Color Palette
 * Using oklch for perceptually uniform colors
 */
export const heraColors = {
  // Primary brand colors
  blue: {
    50: 'oklch(0.97 0.012 250)',
    100: 'oklch(0.93 0.024 250)',
    200: 'oklch(0.86 0.048 250)',
    300: 'oklch(0.77 0.096 250)',
    400: 'oklch(0.65 0.144 250)',
    500: 'oklch(0.57 0.192 250)', // Primary
    600: 'oklch(0.49 0.192 250)',
    700: 'oklch(0.41 0.168 250)',
    800: 'oklch(0.34 0.144 250)',
    900: 'oklch(0.28 0.096 250)',
    950: 'oklch(0.20 0.072 250)'
  },

  // Secondary colors
  cyan: {
    50: 'oklch(0.97 0.012 200)',
    100: 'oklch(0.93 0.024 200)',
    200: 'oklch(0.86 0.048 200)',
    300: 'oklch(0.77 0.096 200)',
    400: 'oklch(0.68 0.12 200)', // Secondary
    500: 'oklch(0.60 0.144 200)',
    600: 'oklch(0.52 0.144 200)',
    700: 'oklch(0.44 0.12 200)',
    800: 'oklch(0.36 0.096 200)',
    900: 'oklch(0.30 0.072 200)',
    950: 'oklch(0.22 0.048 200)'
  },

  // Accent colors
  purple: {
    50: 'oklch(0.97 0.012 280)',
    100: 'oklch(0.93 0.024 280)',
    200: 'oklch(0.86 0.048 280)',
    300: 'oklch(0.77 0.096 280)',
    400: 'oklch(0.65 0.144 280)',
    500: 'oklch(0.58 0.192 280)', // Accent
    600: 'oklch(0.50 0.192 280)',
    700: 'oklch(0.42 0.168 280)',
    800: 'oklch(0.35 0.144 280)',
    900: 'oklch(0.29 0.096 280)',
    950: 'oklch(0.21 0.072 280)'
  },

  // Semantic colors
  emerald: {
    50: 'oklch(0.97 0.012 160)',
    100: 'oklch(0.93 0.024 160)',
    200: 'oklch(0.86 0.048 160)',
    300: 'oklch(0.77 0.096 160)',
    400: 'oklch(0.68 0.12 160)',
    500: 'oklch(0.64 0.12 160)', // Success
    600: 'oklch(0.56 0.12 160)',
    700: 'oklch(0.48 0.096 160)',
    800: 'oklch(0.40 0.072 160)',
    900: 'oklch(0.33 0.048 160)',
    950: 'oklch(0.25 0.036 160)'
  },

  amber: {
    50: 'oklch(0.97 0.012 85)',
    100: 'oklch(0.93 0.024 85)',
    200: 'oklch(0.86 0.048 85)',
    300: 'oklch(0.77 0.096 85)',
    400: 'oklch(0.69 0.12 85)', // Warning
    500: 'oklch(0.61 0.144 85)',
    600: 'oklch(0.53 0.144 85)',
    700: 'oklch(0.45 0.12 85)',
    800: 'oklch(0.37 0.096 85)',
    900: 'oklch(0.31 0.072 85)',
    950: 'oklch(0.23 0.048 85)'
  },

  orange: {
    50: 'oklch(0.97 0.012 50)',
    100: 'oklch(0.93 0.024 50)',
    200: 'oklch(0.86 0.048 50)',
    300: 'oklch(0.77 0.096 50)',
    400: 'oklch(0.69 0.144 50)',
    500: 'oklch(0.61 0.168 50)', // Orange
    600: 'oklch(0.53 0.168 50)',
    700: 'oklch(0.45 0.144 50)',
    800: 'oklch(0.37 0.120 50)',
    900: 'oklch(0.31 0.096 50)',
    950: 'oklch(0.23 0.072 50)'
  },

  rose: {
    50: 'oklch(0.97 0.012 10)',
    100: 'oklch(0.93 0.024 10)',
    200: 'oklch(0.86 0.048 10)',
    300: 'oklch(0.77 0.096 10)',
    400: 'oklch(0.65 0.144 10)',
    500: 'oklch(0.57 0.192 10)', // Danger
    600: 'oklch(0.49 0.192 10)',
    700: 'oklch(0.41 0.168 10)',
    800: 'oklch(0.34 0.144 10)',
    900: 'oklch(0.28 0.096 10)',
    950: 'oklch(0.20 0.072 10)'
  },

  // Neutral colors (enhanced for better contrast)
  gray: {
    50: 'oklch(0.98 0.004 250)',
    100: 'oklch(0.95 0.006 250)',
    200: 'oklch(0.89 0.008 250)',
    300: 'oklch(0.79 0.010 250)',
    400: 'oklch(0.65 0.010 250)',
    500: 'oklch(0.53 0.010 250)',
    600: 'oklch(0.44 0.010 250)',
    700: 'oklch(0.36 0.010 250)',
    800: 'oklch(0.25 0.010 250)',
    900: 'oklch(0.15 0.010 250)',
    950: 'oklch(0.10 0.010 250)'
  },

  // Special module colors (for ice cream)
  pink: {
    50: 'oklch(0.97 0.012 350)',
    100: 'oklch(0.93 0.024 350)',
    200: 'oklch(0.86 0.048 350)',
    300: 'oklch(0.77 0.096 350)',
    400: 'oklch(0.65 0.144 350)',
    500: 'oklch(0.57 0.192 350)', // Ice cream primary
    600: 'oklch(0.49 0.192 350)',
    700: 'oklch(0.41 0.168 350)',
    800: 'oklch(0.34 0.144 350)',
    900: 'oklch(0.28 0.096 350)',
    950: 'oklch(0.20 0.072 350)'
  }
} as const

/**
 * Create semantic color mappings for light and dark modes
 */
export function createSemanticColors(mode: 'light' | 'dark'): SemanticColors {
  if (mode === 'light') {
    return {
      background: heraColors.gray[50],
      foreground: heraColors.gray[900],

      card: 'rgba(255, 255, 255, 0.80)',
      cardForeground: heraColors.gray[900],

      primary: heraColors.blue[500],
      primaryForeground: 'white',
      secondary: heraColors.cyan[400],
      secondaryForeground: 'white',

      success: heraColors.emerald[500],
      successForeground: 'white',
      warning: heraColors.amber[400],
      warningForeground: heraColors.gray[900],
      danger: heraColors.rose[500],
      dangerForeground: 'white',
      info: heraColors.blue[400],
      infoForeground: 'white',

      muted: heraColors.gray[100],
      mutedForeground: heraColors.gray[600],

      border: heraColors.gray[200],
      borderSubtle: heraColors.gray[100],

      accent: heraColors.purple[500],
      accentForeground: 'white',
      highlight: heraColors.amber[200],

      overlay: 'rgba(0, 0, 0, 0.5)',
      backdrop: 'rgba(255, 255, 255, 0.8)'
    }
  } else {
    return {
      background: heraColors.gray[950],
      foreground: heraColors.gray[50],

      card: 'rgba(15, 23, 42, 0.80)', // slate-900 with opacity
      cardForeground: heraColors.gray[50],

      primary: heraColors.blue[400],
      primaryForeground: heraColors.gray[950],
      secondary: heraColors.cyan[400],
      secondaryForeground: heraColors.gray[950],

      success: heraColors.emerald[400],
      successForeground: heraColors.gray[950],
      warning: heraColors.amber[400],
      warningForeground: heraColors.gray[950],
      danger: heraColors.rose[400],
      dangerForeground: heraColors.gray[950],
      info: heraColors.blue[400],
      infoForeground: heraColors.gray[950],

      muted: heraColors.gray[800],
      mutedForeground: heraColors.gray[300],

      border: heraColors.gray[700],
      borderSubtle: heraColors.gray[800],

      accent: heraColors.purple[400],
      accentForeground: heraColors.gray[950],
      highlight: heraColors.amber[900],

      overlay: 'rgba(0, 0, 0, 0.7)',
      backdrop: 'rgba(15, 23, 42, 0.8)'
    }
  }
}

/**
 * Create gradient palette for light and dark modes
 */
export function createGradientPalette(mode: 'light' | 'dark'): GradientPalette {
  const isDark = mode === 'dark'

  return {
    // Adjusted for better visibility in each mode
    primary: isDark
      ? `linear-gradient(to bottom right, ${heraColors.blue[400]}, ${heraColors.purple[400]})`
      : `linear-gradient(to bottom right, ${heraColors.blue[500]}, ${heraColors.purple[500]})`,

    secondary: isDark
      ? `linear-gradient(to bottom right, ${heraColors.cyan[400]}, ${heraColors.blue[400]})`
      : `linear-gradient(to bottom right, ${heraColors.cyan[500]}, ${heraColors.blue[500]})`,

    accent: isDark
      ? `linear-gradient(to bottom right, ${heraColors.purple[400]}, ${heraColors.pink[400]})`
      : `linear-gradient(to bottom right, ${heraColors.purple[500]}, ${heraColors.pink[500]})`,

    success: isDark
      ? `linear-gradient(to bottom right, ${heraColors.emerald[400]}, ${heraColors.emerald[500]})`
      : `linear-gradient(to bottom right, ${heraColors.emerald[500]}, ${heraColors.emerald[600]})`,

    warning: isDark
      ? `linear-gradient(to bottom right, ${heraColors.amber[400]}, ${heraColors.amber[500]})`
      : `linear-gradient(to bottom right, ${heraColors.amber[500]}, ${heraColors.amber[600]})`,

    danger: isDark
      ? `linear-gradient(to bottom right, ${heraColors.rose[400]}, ${heraColors.rose[500]})`
      : `linear-gradient(to bottom right, ${heraColors.rose[500]}, ${heraColors.rose[600]})`,

    info: isDark
      ? `linear-gradient(to bottom right, ${heraColors.blue[400]}, ${heraColors.cyan[400]})`
      : `linear-gradient(to bottom right, ${heraColors.blue[500]}, ${heraColors.cyan[500]})`,

    // Special effects
    shimmer: isDark
      ? `linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.1) 50%, transparent 60%)`
      : `linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.7) 50%, transparent 60%)`,

    glow: isDark
      ? `radial-gradient(circle at center, ${heraColors.purple[400]}22, transparent)`
      : `radial-gradient(circle at center, ${heraColors.purple[500]}22, transparent)`,

    aurora: isDark
      ? `linear-gradient(45deg, ${heraColors.blue[500]}33, ${heraColors.purple[500]}33, ${heraColors.pink[500]}33)`
      : `linear-gradient(45deg, ${heraColors.blue[300]}33, ${heraColors.purple[300]}33, ${heraColors.pink[300]}33)`,

    // Module specific (will be overridden per module)
    moduleHero: '',
    moduleAccent: ''
  }
}

/**
 * Export theme mode type
 */
export type ThemeMode = 'light' | 'dark' | 'system'

/**
 * Export color scale type
 */
export type { ColorScale }

/**
 * Utility function to get CSS custom properties from theme
 */
export function getThemeCSSVariables(theme: ThemeConfig, mode: 'light' | 'dark') {
  const colors = theme.colors[mode]
  const gradients = theme.gradients[mode]

  return {
    // Semantic colors
    '--color-background': colors.background,
    '--color-foreground': colors.foreground,
    '--color-card': colors.card,
    '--color-card-foreground': colors.cardForeground,
    '--color-primary': colors.primary,
    '--color-primary-foreground': colors.primaryForeground,
    '--color-secondary': colors.secondary,
    '--color-secondary-foreground': colors.secondaryForeground,
    '--color-success': colors.success,
    '--color-success-foreground': colors.successForeground,
    '--color-warning': colors.warning,
    '--color-warning-foreground': colors.warningForeground,
    '--color-danger': colors.danger,
    '--color-danger-foreground': colors.dangerForeground,
    '--color-info': colors.info,
    '--color-info-foreground': colors.infoForeground,
    '--color-muted': colors.muted,
    '--color-muted-foreground': colors.mutedForeground,
    '--color-border': colors.border,
    '--color-border-subtle': colors.borderSubtle,
    '--color-accent': colors.accent,
    '--color-accent-foreground': colors.accentForeground,

    // Gradients
    '--gradient-primary': gradients.primary,
    '--gradient-secondary': gradients.secondary,
    '--gradient-accent': gradients.accent,
    '--gradient-success': gradients.success,
    '--gradient-warning': gradients.warning,
    '--gradient-danger': gradients.danger,
    '--gradient-shimmer': gradients.shimmer,

    // Effects
    '--backdrop-blur': theme.effects.backdropBlur,
    '--glass-morphism': theme.effects.glassMorphism,
    '--card-opacity': theme.effects.cardOpacity,

    // Spacing
    '--spacing-card': theme.spacing.card,
    '--spacing-section': theme.spacing.section,
    '--spacing-component': theme.spacing.component,

    // Radius
    '--radius-small': theme.radius.small,
    '--radius-medium': theme.radius.medium,
    '--radius-large': theme.radius.large,
    '--radius-full': theme.radius.full,

    // Animation
    '--duration-fast': theme.animation.duration.fast,
    '--duration-normal': theme.animation.duration.normal,
    '--duration-slow': theme.animation.duration.slow,
    '--easing-default': theme.animation.easing.default,
    '--easing-smooth': theme.animation.easing.smooth,
    '--easing-bounce': theme.animation.easing.bounce
  }
}
