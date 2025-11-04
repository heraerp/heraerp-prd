/**
 * HERA THEME - COLOR CONSTANTS
 *
 * Public-facing theme for landing pages, auth pages, and marketing site.
 * Based on indigo/purple/cyan gradient palette with glassmorphism effects.
 *
 * Inspired by Salon Luxe theme but with modern tech/SaaS aesthetic.
 */

export const HERA_THEME_COLORS = {
  // Base backgrounds
  background: {
    darkest: 'rgb(2, 6, 23)',      // slate-950
    dark: 'rgb(15, 23, 42)',        // slate-900
    base: 'rgb(30, 41, 59)',        // slate-800
    light: 'rgb(51, 65, 85)',       // slate-700
  },

  // Primary gradient colors (indigo → purple → cyan)
  primary: {
    indigo: {
      base: 'rgb(99, 102, 241)',      // indigo-500
      light: 'rgb(129, 140, 248)',    // indigo-400
      lighter: 'rgb(165, 180, 252)',  // indigo-300
      dark: 'rgb(79, 70, 229)',       // indigo-600
      darker: 'rgb(67, 56, 202)',     // indigo-700
    },
    purple: {
      base: 'rgb(168, 85, 247)',      // purple-500
      light: 'rgb(192, 132, 252)',    // purple-400
      lighter: 'rgb(216, 180, 254)',  // purple-300
      dark: 'rgb(147, 51, 234)',      // purple-600
      darker: 'rgb(126, 34, 206)',    // purple-700
    },
    cyan: {
      base: 'rgb(6, 182, 212)',       // cyan-500
      light: 'rgb(34, 211, 238)',     // cyan-400
      lighter: 'rgb(103, 232, 249)',  // cyan-300
      dark: 'rgb(8, 145, 178)',       // cyan-600
      darker: 'rgb(14, 116, 144)',    // cyan-700
    },
  },

  // Accent colors
  accent: {
    emerald: {
      base: 'rgb(16, 185, 129)',      // emerald-500
      light: 'rgb(52, 211, 153)',     // emerald-400
      dark: 'rgb(5, 150, 105)',       // emerald-600
    },
    pink: {
      base: 'rgb(236, 72, 153)',      // pink-500
      light: 'rgb(244, 114, 182)',    // pink-400
      dark: 'rgb(219, 39, 119)',      // pink-600
    },
    amber: {
      base: 'rgb(245, 158, 11)',      // amber-500
      light: 'rgb(251, 191, 36)',     // amber-400
      dark: 'rgb(217, 119, 6)',       // amber-600
    },
    rose: {
      base: 'rgb(244, 63, 94)',       // rose-500
      light: 'rgb(251, 113, 133)',    // rose-400
      dark: 'rgb(225, 29, 72)',       // rose-600
    },
  },

  // Text colors
  text: {
    primary: 'rgb(248, 250, 252)',      // slate-50
    secondary: 'rgb(148, 163, 184)',    // slate-400
    muted: 'rgb(100, 116, 139)',        // slate-500
    onDark: 'rgb(226, 232, 240)',       // slate-200
  },

  // Border and effects
  border: {
    base: 'rgba(99, 102, 241, 0.2)',    // indigo/20
    light: 'rgba(99, 102, 241, 0.1)',   // indigo/10
    lighter: 'rgba(99, 102, 241, 0.05)', // indigo/5
    muted: 'rgba(148, 163, 184, 0.1)',  // slate-400/10
  },

  // Shadow colors
  shadow: {
    indigo: 'rgba(99, 102, 241, 0.3)',
    indigoLight: 'rgba(99, 102, 241, 0.15)',
    purple: 'rgba(168, 85, 247, 0.3)',
    purpleLight: 'rgba(168, 85, 247, 0.15)',
    cyan: 'rgba(6, 182, 212, 0.3)',
    cyanLight: 'rgba(6, 182, 212, 0.15)',
    black: 'rgba(0, 0, 0, 0.5)',
    blackDeep: 'rgba(0, 0, 0, 0.8)',
  },
} as const

/**
 * RGBA Helper Functions
 * Convert rgb to rgba with custom opacity
 */
export const withOpacity = (rgbColor: string, opacity: number): string => {
  // Extract RGB values from rgb(r, g, b) format
  const match = rgbColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  if (!match) return rgbColor

  const [, r, g, b] = match
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

/**
 * GRADIENT HELPERS
 * Pre-built gradients for consistent styling
 */
export const HERA_THEME_GRADIENTS = {
  // Primary gradients
  primaryHorizontal: `linear-gradient(90deg, ${HERA_THEME_COLORS.primary.indigo.base} 0%, ${HERA_THEME_COLORS.primary.purple.base} 50%, ${HERA_THEME_COLORS.primary.cyan.base} 100%)`,
  primaryVertical: `linear-gradient(180deg, ${HERA_THEME_COLORS.primary.indigo.base} 0%, ${HERA_THEME_COLORS.primary.purple.base} 50%, ${HERA_THEME_COLORS.primary.cyan.base} 100%)`,
  primaryDiagonal: `linear-gradient(135deg, ${HERA_THEME_COLORS.primary.indigo.base} 0%, ${HERA_THEME_COLORS.primary.purple.base} 50%, ${HERA_THEME_COLORS.primary.cyan.base} 100%)`,

  // Background gradients (subtle)
  backgroundRadial: `radial-gradient(ellipse 80% 50% at 50% -20%, ${withOpacity(HERA_THEME_COLORS.primary.indigo.base, 0.15)} 0%, transparent 50%)`,
  backgroundFlow: `radial-gradient(ellipse 60% 50% at 0% 100%, ${withOpacity(HERA_THEME_COLORS.primary.purple.base, 0.1)} 0%, transparent 50%)`,
  backgroundAccent: `radial-gradient(ellipse 60% 50% at 100% 100%, ${withOpacity(HERA_THEME_COLORS.primary.cyan.base, 0.08)} 0%, transparent 50%)`,

  // Card backgrounds
  cardGlass: `linear-gradient(135deg, ${withOpacity(HERA_THEME_COLORS.background.dark, 0.95)} 0%, ${withOpacity(HERA_THEME_COLORS.background.darkest, 0.95)} 100%)`,
  cardGlassLight: `linear-gradient(135deg, ${withOpacity(HERA_THEME_COLORS.background.base, 0.8)} 0%, ${withOpacity(HERA_THEME_COLORS.background.dark, 0.8)} 100%)`,

  // Hover effects
  hoverGlow: `linear-gradient(135deg, ${withOpacity(HERA_THEME_COLORS.primary.indigo.base, 0.1)} 0%, ${withOpacity(HERA_THEME_COLORS.primary.purple.base, 0.1)} 100%)`,
  hoverGlowStrong: `linear-gradient(135deg, ${withOpacity(HERA_THEME_COLORS.primary.indigo.base, 0.2)} 0%, ${withOpacity(HERA_THEME_COLORS.primary.purple.base, 0.2)} 100%)`,

  // Button gradients
  buttonPrimary: `linear-gradient(90deg, ${HERA_THEME_COLORS.primary.indigo.base} 0%, ${HERA_THEME_COLORS.primary.purple.base} 100%)`,
  buttonPrimaryHover: `linear-gradient(90deg, ${HERA_THEME_COLORS.primary.indigo.dark} 0%, ${HERA_THEME_COLORS.primary.purple.dark} 100%)`,

  // Accent gradients
  emerald: `linear-gradient(135deg, ${HERA_THEME_COLORS.accent.emerald.light} 0%, ${HERA_THEME_COLORS.accent.emerald.dark} 100%)`,
  emeraldSubtle: `linear-gradient(to bottom right, ${withOpacity(HERA_THEME_COLORS.accent.emerald.base, 0.15)} 0%, ${withOpacity(HERA_THEME_COLORS.accent.emerald.dark, 0.05)} 100%)`,

  pink: `linear-gradient(135deg, ${HERA_THEME_COLORS.accent.pink.light} 0%, ${HERA_THEME_COLORS.accent.pink.dark} 100%)`,
  pinkSubtle: `linear-gradient(to bottom right, ${withOpacity(HERA_THEME_COLORS.accent.pink.base, 0.15)} 0%, ${withOpacity(HERA_THEME_COLORS.accent.pink.dark, 0.05)} 100%)`,

  amber: `linear-gradient(135deg, ${HERA_THEME_COLORS.accent.amber.light} 0%, ${HERA_THEME_COLORS.accent.amber.dark} 100%)`,
  amberSubtle: `linear-gradient(to bottom right, ${withOpacity(HERA_THEME_COLORS.accent.amber.base, 0.15)} 0%, ${withOpacity(HERA_THEME_COLORS.accent.amber.dark, 0.05)} 100%)`,
} as const

/**
 * STYLE PRESETS
 * Pre-configured inline style objects for common use cases
 */
export const HERA_THEME_STYLES = {
  // Page background
  pageBackground: {
    backgroundColor: HERA_THEME_COLORS.background.darkest,
    backgroundImage: `
      ${HERA_THEME_GRADIENTS.backgroundRadial},
      ${HERA_THEME_GRADIENTS.backgroundFlow},
      ${HERA_THEME_GRADIENTS.backgroundAccent}
    `,
  },

  // Card backgrounds
  cardGlass: {
    background: HERA_THEME_GRADIENTS.cardGlass,
    backdropFilter: 'blur(48px)',
    border: `1px solid ${HERA_THEME_COLORS.border.base}`,
    boxShadow: `0 25px 50px ${HERA_THEME_COLORS.shadow.black}, 0 0 0 1px ${HERA_THEME_COLORS.border.light}`,
  },

  cardGlassHover: {
    border: `1px solid ${withOpacity(HERA_THEME_COLORS.primary.indigo.base, 0.3)}`,
    boxShadow: `0 25px 50px ${HERA_THEME_COLORS.shadow.blackDeep}, 0 0 40px ${HERA_THEME_COLORS.shadow.indigoLight}`,
  },

  // Text styles
  textPrimary: {
    color: HERA_THEME_COLORS.text.primary,
  },

  textSecondary: {
    color: HERA_THEME_COLORS.text.secondary,
  },

  textMuted: {
    color: HERA_THEME_COLORS.text.muted,
  },

  // Button styles
  buttonPrimary: {
    background: HERA_THEME_GRADIENTS.buttonPrimary,
    color: 'white',
    border: `1px solid ${HERA_THEME_COLORS.border.base}`,
    boxShadow: `0 8px 24px ${HERA_THEME_COLORS.shadow.indigoLight}`,
  },

  buttonPrimaryHover: {
    background: HERA_THEME_GRADIENTS.buttonPrimaryHover,
    boxShadow: `0 12px 32px ${HERA_THEME_COLORS.shadow.indigo}`,
  },
} as const
