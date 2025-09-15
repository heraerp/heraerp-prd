/**
 * Ice Cream Enterprise Theme
 *
 * A delightful, professional theme inspired by premium ice cream brands.
 * Combines playful gradients with enterprise-grade readability.
 *
 * Color Psychology:
 * - Pink/Purple: Creativity, premium quality, delight
 * - Cyan/Blue: Trust, cleanliness, freshness
 * - White/Gray: Purity, sophistication, clarity
 */

import {
  ThemeConfig,
  heraColors,
  createSemanticColors,
  createGradientPalette
} from '../hera-theme-system'

// Ice cream specific color extensions
const iceCreamColors = {
  // Signature ice cream colors
  strawberry: heraColors.pink[500],
  vanilla: heraColors.amber[100],
  chocolate: '#7B3F00',
  mint: heraColors.cyan[400],
  blueberry: heraColors.blue[500],

  // Brand colors
  premiumPink: heraColors.pink[400],
  coolCyan: heraColors.cyan[400],

  // Neutrals optimized for ice cream UI
  cream: {
    50: 'oklch(0.99 0.006 85)', // Very light cream
    100: 'oklch(0.97 0.010 85)', // Light cream
    200: 'oklch(0.94 0.014 85)', // Soft cream
    300: 'oklch(0.90 0.018 85)', // Medium cream
    400: 'oklch(0.85 0.022 85)' // Rich cream
  }
}

/**
 * Create the Ice Cream Enterprise theme configuration
 */
export const iceCreamEnterpriseTheme: ThemeConfig = {
  name: 'Ice Cream Enterprise',
  description: 'Professional theme for ice cream manufacturing and retail management',

  colors: {
    light: {
      ...createSemanticColors('light'),
      // Override with ice cream specific colors
      background: iceCreamColors.cream[50],
      card: 'rgba(255, 255, 255, 0.95)', // Higher opacity for better contrast
      primary: iceCreamColors.strawberry,
      secondary: iceCreamColors.mint,
      accent: heraColors.purple[500],

      // Better contrast for readability
      foreground: heraColors.gray[900],
      cardForeground: heraColors.gray[900],
      mutedForeground: heraColors.gray[700], // Darker than default for better contrast

      // Softer borders
      border: 'rgba(236, 72, 153, 0.2)', // pink-500 at 20%
      borderSubtle: 'rgba(236, 72, 153, 0.1)' // pink-500 at 10%
    },

    dark: {
      ...createSemanticColors('dark'),
      // Override for ice cream dark mode
      background: heraColors.gray[950],
      card: 'rgba(15, 23, 42, 0.95)', // slate-900 with high opacity

      // Adjusted for better visibility
      primary: heraColors.pink[400],
      secondary: heraColors.cyan[400],
      accent: heraColors.purple[400],

      // Enhanced contrast for dark mode
      foreground: heraColors.gray[50],
      cardForeground: heraColors.gray[50],
      mutedForeground: heraColors.gray[300], // Lighter for better readability

      // Themed borders
      border: 'rgba(236, 72, 153, 0.3)', // pink-500 at 30%
      borderSubtle: 'rgba(236, 72, 153, 0.15)' // pink-500 at 15%
    }
  },

  gradients: {
    light: {
      ...createGradientPalette('light'),
      // Ice cream signature gradients
      primary: `linear-gradient(to bottom right, ${heraColors.pink[500]}, ${heraColors.purple[500]})`,
      secondary: `linear-gradient(to bottom right, ${heraColors.cyan[500]}, ${heraColors.blue[500]})`,
      accent: `linear-gradient(to bottom right, ${heraColors.purple[500]}, ${heraColors.pink[600]})`,

      // Module specific
      moduleHero: `linear-gradient(135deg, ${heraColors.pink[400]}, ${heraColors.purple[500]}, ${heraColors.cyan[400]})`,
      moduleAccent: `linear-gradient(to right, ${heraColors.pink[500]}, ${heraColors.purple[500]})`,

      // Semantic gradients with ice cream colors
      success: `linear-gradient(to bottom right, ${heraColors.emerald[500]}, ${heraColors.emerald[600]})`,
      warning: `linear-gradient(to bottom right, ${heraColors.amber[500]}, ${heraColors.amber[600]})`,
      danger: `linear-gradient(to bottom right, ${heraColors.rose[500]}, ${heraColors.pink[600]})`,
      info: `linear-gradient(to bottom right, ${heraColors.cyan[500]}, ${heraColors.blue[500]})`
    },

    dark: {
      ...createGradientPalette('dark'),
      // Adjusted for dark mode visibility
      primary: `linear-gradient(to bottom right, ${heraColors.pink[400]}, ${heraColors.purple[400]})`,
      secondary: `linear-gradient(to bottom right, ${heraColors.cyan[400]}, ${heraColors.blue[400]})`,
      accent: `linear-gradient(to bottom right, ${heraColors.purple[400]}, ${heraColors.pink[500]})`,

      // Module specific for dark
      moduleHero: `linear-gradient(135deg, ${heraColors.pink[500]}, ${heraColors.purple[600]}, ${heraColors.cyan[500]})`,
      moduleAccent: `linear-gradient(to right, ${heraColors.pink[400]}, ${heraColors.purple[400]})`,

      // Semantic with proper contrast
      success: `linear-gradient(to bottom right, ${heraColors.emerald[400]}, ${heraColors.emerald[500]})`,
      warning: `linear-gradient(to bottom right, ${heraColors.amber[400]}, ${heraColors.amber[500]})`,
      danger: `linear-gradient(to bottom right, ${heraColors.rose[400]}, ${heraColors.pink[500]})`,
      info: `linear-gradient(to bottom right, ${heraColors.cyan[400]}, ${heraColors.blue[400]})`
    }
  },

  components: {
    card: {
      background: 'var(--color-card)',
      border: 'var(--color-border)',
      shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      hoverShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    },

    stat: {
      background: 'var(--color-card)',
      valueForeground: 'var(--color-foreground)', // Will use !important in component
      labelForeground: 'var(--color-muted-foreground)',
      trendPositive: heraColors.emerald[600],
      trendNegative: heraColors.rose[600],
      trendNeutral: heraColors.gray[600]
    },

    table: {
      headerBackground: 'rgba(249, 250, 251, 0.8)', // gray-50 with opacity
      rowBackground: 'transparent',
      rowBackgroundAlt: 'rgba(249, 250, 251, 0.3)', // Subtle striping
      rowHover: 'rgba(34, 197, 94, 0.1)', // emerald-500 at 10%
      borderColor: 'var(--color-border)'
    },

    badge: {
      defaultBackground: 'var(--color-muted)',
      defaultForeground: 'var(--color-muted-foreground)',
      variants: {
        success: {
          background: heraColors.emerald[100],
          foreground: heraColors.emerald[700],
          border: heraColors.emerald[200]
        },
        warning: {
          background: heraColors.amber[100],
          foreground: heraColors.amber[700],
          border: heraColors.amber[200]
        },
        danger: {
          background: heraColors.rose[100],
          foreground: heraColors.rose[700],
          border: heraColors.rose[200]
        },
        info: {
          background: heraColors.blue[100],
          foreground: heraColors.blue[700],
          border: heraColors.blue[200]
        },
        premium: {
          background: `linear-gradient(to right, ${heraColors.pink[100]}, ${heraColors.purple[100]})`,
          foreground: heraColors.purple[700],
          border: heraColors.purple[200]
        }
      }
    },

    button: {
      variants: {
        default: {
          background: 'var(--color-muted)',
          foreground: 'var(--color-foreground)',
          hover: heraColors.gray[200],
          active: heraColors.gray[300]
        },
        primary: {
          background: 'var(--gradient-primary)',
          foreground: 'white',
          hover: `linear-gradient(to bottom right, ${heraColors.pink[600]}, ${heraColors.purple[600]})`,
          active: `linear-gradient(to bottom right, ${heraColors.pink[700]}, ${heraColors.purple[700]})`
        },
        secondary: {
          background: 'var(--gradient-secondary)',
          foreground: 'white',
          hover: `linear-gradient(to bottom right, ${heraColors.cyan[600]}, ${heraColors.blue[600]})`,
          active: `linear-gradient(to bottom right, ${heraColors.cyan[700]}, ${heraColors.blue[700]})`
        },
        ghost: {
          background: 'transparent',
          foreground: 'var(--color-foreground)',
          hover: 'rgba(236, 72, 153, 0.1)', // pink-500 at 10%
          active: 'rgba(236, 72, 153, 0.2)' // pink-500 at 20%
        }
      }
    }
  },

  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms'
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      smooth: 'cubic-bezier(0.4, 0, 0.1, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    }
  },

  spacing: {
    card: '1.5rem', // 24px
    section: '2rem', // 32px
    component: '1rem' // 16px
  },

  radius: {
    small: '0.375rem', // 6px
    medium: '0.75rem', // 12px
    large: '1rem', // 16px
    full: '9999px'
  },

  effects: {
    backdropBlur: 'blur(12px)',
    glassMorphism: 'backdrop-filter: blur(12px) saturate(150%)',
    cardOpacity: '0.95'
  }
}

/**
 * Tailwind class mappings for ice cream theme
 * These can be used to quickly apply theme-consistent styles
 */
export const iceCreamTailwindClasses = {
  // Cards
  card: {
    light:
      'backdrop-blur-xl bg-white/95 border-pink-200/50 shadow-lg hover:shadow-xl transition-shadow',
    dark: 'backdrop-blur-xl bg-slate-900/95 border-pink-800/50 shadow-lg hover:shadow-xl transition-shadow'
  },

  // Gradients
  gradient: {
    primary: 'bg-gradient-to-br from-pink-500 to-purple-500',
    secondary: 'bg-gradient-to-br from-cyan-500 to-blue-500',
    accent: 'bg-gradient-to-br from-purple-500 to-pink-600',
    success: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    warning: 'bg-gradient-to-br from-amber-500 to-orange-500',
    danger: 'bg-gradient-to-br from-rose-500 to-pink-600'
  },

  // Text
  text: {
    // Force visibility with !important
    primary: '!text-gray-900 dark:!text-gray-50',
    secondary: '!text-gray-700 dark:!text-gray-300',
    muted: '!text-gray-600 dark:!text-gray-400',

    // Semantic colors
    success: 'text-emerald-700 dark:text-emerald-400',
    warning: 'text-amber-700 dark:text-amber-400',
    danger: 'text-rose-700 dark:text-rose-400'
  },

  // Borders
  border: {
    default: 'border-pink-200/50 dark:border-pink-800/50',
    subtle: 'border-pink-100 dark:border-pink-900/30',
    strong: 'border-pink-300 dark:border-pink-700'
  }
}

/**
 * Component-specific theme utilities
 */
export const iceCreamComponentStyles = {
  statCard: (variant: 'default' | 'compact' = 'default') => {
    const base = variant === 'compact' ? 'p-4 space-y-1' : 'p-6 space-y-2'

    return {
      container: `${base} ${iceCreamTailwindClasses.card.light} dark:${iceCreamTailwindClasses.card.dark}`,
      label: 'text-sm font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide',
      value: 'text-3xl font-bold !text-gray-900 dark:!text-gray-100',
      trend: {
        positive: 'text-xs text-emerald-600 dark:text-emerald-400 font-medium',
        negative: 'text-xs text-rose-600 dark:text-rose-400 font-medium',
        neutral: 'text-xs text-gray-600 dark:text-gray-400 font-medium'
      },
      icon: 'w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg'
    }
  },

  table: {
    container: iceCreamTailwindClasses.card.light + ' dark:' + iceCreamTailwindClasses.card.dark,
    header: 'bg-gray-50/80 dark:bg-gray-800/50',
    headerCell:
      'py-4 px-6 font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider',
    row: 'border-b border-gray-200 dark:border-gray-700',
    rowAlt: 'bg-gray-50/30 dark:bg-gray-800/20',
    rowHover: 'hover:bg-cyan-100/50 dark:hover:bg-cyan-950/30',
    cell: 'py-4 px-6 text-gray-900 dark:text-gray-100'
  },

  badge: (variant: keyof typeof iceCreamEnterpriseTheme.components.badge.variants = 'success') => {
    const config = iceCreamEnterpriseTheme.components.badge.variants[variant]
    return {
      light: `bg-${variant}-100 text-${variant}-700 border border-${variant}-200`,
      dark: `bg-${variant}-900/30 text-${variant}-300 border border-${variant}-800`
    }
  }
}

/**
 * Export theme configuration
 */
export default iceCreamEnterpriseTheme
