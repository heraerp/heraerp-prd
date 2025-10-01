// ================================================================================
// HERA LUXURY THEME UTILITIES
// Smart Code: HERA.UI.THEME.LUXURY.UTILS.V1
// Luxury color palette and styling utilities for consistent application theming
// ================================================================================

/**
 * Luxury color palette from the services page
 */
export const LUXURY_COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  plum: '#5A2A40',
  rose: '#E8B4B8',
  lightText: '#E0E0E0'
} as const

/**
 * CSS custom properties for luxury theme
 */
export const LUXURY_CSS_VARS = `
  --hera-black: ${LUXURY_COLORS.black};
  --hera-charcoal: ${LUXURY_COLORS.charcoal};
  --hera-gold: ${LUXURY_COLORS.gold};
  --hera-gold-dark: ${LUXURY_COLORS.goldDark};
  --hera-champagne: ${LUXURY_COLORS.champagne};
  --hera-bronze: ${LUXURY_COLORS.bronze};
  --hera-emerald: ${LUXURY_COLORS.emerald};
  --hera-plum: ${LUXURY_COLORS.plum};
  --hera-rose: ${LUXURY_COLORS.rose};
  --hera-light-text: ${LUXURY_COLORS.lightText};
`

/**
 * Common luxury theme styles
 */
export const luxuryStyles = {
  // Page background
  pageBackground: {
    backgroundColor: LUXURY_COLORS.black,
    minHeight: '100vh'
  },

  // Card styling
  card: {
    backgroundColor: LUXURY_COLORS.charcoal,
    border: `1px solid rgba(212, 175, 55, 0.2)`,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    borderRadius: '0.75rem'
  },

  cardHover: {
    borderColor: LUXURY_COLORS.gold,
    boxShadow: '0 4px 6px rgba(212, 175, 55, 0.1)'
  },

  // Button styling
  primaryButton: {
    background: `linear-gradient(90deg, ${LUXURY_COLORS.gold} 0%, ${LUXURY_COLORS.goldDark} 100%)`,
    color: LUXURY_COLORS.black,
    fontWeight: 500,
    border: 'none',
    boxShadow: '0 2px 4px rgba(212, 175, 55, 0.2)'
  },

  primaryButtonHover: {
    background: `linear-gradient(90deg, ${LUXURY_COLORS.goldDark} 0%, ${LUXURY_COLORS.bronze} 100%)`,
    boxShadow: '0 4px 6px rgba(212, 175, 55, 0.3)'
  },

  // Text colors
  text: {
    primary: LUXURY_COLORS.champagne,
    secondary: LUXURY_COLORS.lightText,
    muted: LUXURY_COLORS.bronze,
    accent: LUXURY_COLORS.gold
  },

  // Icon backgrounds
  iconBackground: (color: keyof typeof LUXURY_COLORS) => ({
    backgroundColor: `rgba(${hexToRgb(LUXURY_COLORS[color])}, 0.1)`,
    color: LUXURY_COLORS[color]
  }),

  // Dropdown styling
  dropdown: {
    backgroundColor: LUXURY_COLORS.charcoal,
    border: `1px solid rgba(212, 175, 55, 0.2)`,
    color: LUXURY_COLORS.lightText
  },

  dropdownHover: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)'
  },

  // Badge variants
  badge: {
    gold: {
      backgroundColor: 'rgba(212, 175, 55, 0.1)',
      color: LUXURY_COLORS.gold,
      border: `1px solid ${LUXURY_COLORS.gold}`
    },
    bronze: {
      backgroundColor: 'rgba(140, 120, 83, 0.1)',
      color: LUXURY_COLORS.bronze,
      border: `1px solid ${LUXURY_COLORS.bronze}`
    },
    emerald: {
      backgroundColor: 'rgba(15, 111, 92, 0.1)',
      color: LUXURY_COLORS.emerald,
      border: `1px solid ${LUXURY_COLORS.emerald}`
    },
    plum: {
      backgroundColor: 'rgba(90, 42, 64, 0.1)',
      color: LUXURY_COLORS.plum,
      border: `1px solid ${LUXURY_COLORS.plum}`
    }
  }
}

/**
 * Helper function to convert hex to RGB
 */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '0, 0, 0'

  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
}

/**
 * Apply luxury theme to an element
 */
export function applyLuxuryTheme(element: HTMLElement) {
  element.style.cssText += LUXURY_CSS_VARS
}

/**
 * Get luxury gradient for different use cases
 */
export const luxuryGradients = {
  gold: `linear-gradient(90deg, ${LUXURY_COLORS.gold} 0%, ${LUXURY_COLORS.goldDark} 100%)`,
  emerald: `linear-gradient(90deg, ${LUXURY_COLORS.emerald} 0%, #0a5448 100%)`,
  plum: `linear-gradient(90deg, ${LUXURY_COLORS.plum} 0%, #3a1a2a 100%)`,
  champagne: `linear-gradient(90deg, ${LUXURY_COLORS.champagne} 0%, ${LUXURY_COLORS.bronze} 100%)`
}

/**
 * Luxury theme class names for Tailwind
 */
export const luxuryClasses = {
  page: 'min-h-screen bg-[#0B0B0B]',
  card: 'bg-[#1A1A1A] border border-[#D4AF37]/20 shadow-sm hover:border-[#D4AF37] hover:shadow-md transition-all',
  primaryButton:
    'bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#0B0B0B] hover:from-[#B8860B] hover:to-[#8C7853] font-medium',
  text: {
    primary: 'text-[#F5E6C8]',
    secondary: 'text-[#E0E0E0]',
    muted: 'text-[#8C7853]',
    accent: 'text-[#D4AF37]'
  }
}
