/**
 * SALON LUXE THEME - COLOR CONSTANTS
 *
 * These constants provide explicit hex/rgba values for the salon luxe theme.
 * Use these for inline styles to prevent global CSS overrides.
 *
 * Based on Charcoal + Gold aesthetic with enterprise-grade contrast.
 */

export const SALON_LUXE_COLORS = {
  // Charcoal Backgrounds
  charcoal: {
    dark: '#0F0F0F',      // Deepest charcoal
    base: '#1A1A1A',       // Base charcoal
    light: '#252525',      // Lighter charcoal
    lighter: '#303030',    // Even lighter
  },

  // Gold Accent (Primary)
  gold: {
    base: '#D4AF37',       // Primary gold
    light: '#E3C75F',      // Lighter gold
    lighter: '#F0D584',    // Lightest gold
    dark: '#B8860B',       // Darker gold
  },

  // Champagne (Text on dark backgrounds)
  champagne: {
    lightest: '#fefdf9',   // champagne-50
    lighter: '#fdfaf0',    // champagne-100
    light: '#faf4db',      // champagne-200
    base: '#f5e9b8',       // champagne-300
    medium: '#eed97f',     // champagne-400
    dark: '#D4AF37',       // champagne-500 (same as gold)
  },

  // Text Colors
  text: {
    primary: '#F5F7FA',    // Primary text (very light)
    secondary: '#C7CCD4',  // Secondary text (muted)
    tertiary: '#9AA3AE',   // Tertiary text (more muted)
    onGold: '#0F0F0F',     // Text on gold backgrounds
  },

  // State Colors
  success: {
    base: '#0F6F5C',       // Emerald green
    light: 'rgba(15, 111, 92, 0.2)',   // 20% opacity
    lighter: 'rgba(15, 111, 92, 0.12)', // 12% opacity
    border: 'rgba(15, 111, 92, 0.4)',   // 40% opacity
    borderLight: 'rgba(15, 111, 92, 0.25)', // 25% opacity
  },

  danger: {
    base: '#E8B4B8',       // Rose/Pink danger
    light: 'rgba(232, 180, 184, 0.2)',   // 20% opacity
    lighter: 'rgba(232, 180, 184, 0.1)', // 10% opacity
    border: 'rgba(232, 180, 184, 0.6)',  // 60% opacity
    borderLight: 'rgba(232, 180, 184, 0.4)', // 40% opacity
  },

  // Extended Luxe Palette for Visual Balance
  emerald: {
    base: '#10B981',       // Vibrant emerald
    dark: '#0F6F5C',       // Deep emerald
    light: '#6EE7B7',      // Light emerald
    lighter: 'rgba(16, 185, 129, 0.15)', // 15% opacity
  },

  rose: {
    base: '#E8B4B8',       // Soft rose
    dark: '#F43F5E',       // Deep rose/red
    light: '#FDA4AF',      // Light rose
    lighter: 'rgba(232, 180, 184, 0.15)', // 15% opacity
  },

  plum: {
    base: '#B794F4',       // Soft plum
    dark: '#9333EA',       // Deep purple
    light: '#D8B4FE',      // Light lavender
    lighter: 'rgba(183, 148, 244, 0.15)', // 15% opacity
  },

  // Border Colors
  border: {
    base: 'rgba(212, 175, 55, 0.3)',    // Gold border base
    light: 'rgba(212, 175, 55, 0.2)',   // Lighter border
    lighter: 'rgba(212, 175, 55, 0.1)',  // Lightest border
    muted: 'rgba(255, 255, 255, 0.1)',  // Generic muted border
  },

  // Shadow Colors
  shadow: {
    gold: 'rgba(212, 175, 55, 0.6)',     // Gold glow
    goldLight: 'rgba(212, 175, 55, 0.3)', // Light gold glow
    goldLighter: 'rgba(212, 175, 55, 0.15)', // Lighter gold glow
    danger: 'rgba(232, 180, 184, 0.2)',  // Danger glow
    black: 'rgba(0, 0, 0, 0.8)',         // Deep shadow
  },
} as const

/**
 * RGBA Helper Functions
 * Convert hex to rgba with custom opacity
 */
export const withOpacity = (hexColor: string, opacity: number): string => {
  // Remove # if present
  const hex = hexColor.replace('#', '')

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

/**
 * GRADIENT HELPERS
 * Pre-built gradients for consistent styling
 */
export const SALON_LUXE_GRADIENTS = {
  charcoal: `linear-gradient(135deg, ${SALON_LUXE_COLORS.charcoal.base} 0%, ${SALON_LUXE_COLORS.charcoal.dark} 100%)`,
  charcoalReverse: `linear-gradient(135deg, ${SALON_LUXE_COLORS.charcoal.dark} 0%, ${SALON_LUXE_COLORS.charcoal.base} 100%)`,
  gold: `linear-gradient(135deg, ${SALON_LUXE_COLORS.gold.base} 0%, ${SALON_LUXE_COLORS.gold.dark} 100%)`,
  goldLight: `linear-gradient(135deg, ${SALON_LUXE_COLORS.gold.light} 0%, ${SALON_LUXE_COLORS.gold.base} 100%)`,
  goldAccent: `linear-gradient(to bottom right, ${withOpacity(SALON_LUXE_COLORS.gold.base, 0.2)} 0%, ${withOpacity(SALON_LUXE_COLORS.gold.base, 0.1)} 100%)`,
  success: `linear-gradient(to bottom right, ${withOpacity(SALON_LUXE_COLORS.success.base, 0.15)} 0%, ${withOpacity(SALON_LUXE_COLORS.success.base, 0.05)} 100%)`,
  danger: `linear-gradient(to bottom right, ${withOpacity(SALON_LUXE_COLORS.danger.base, 0.15)} 0%, ${withOpacity(SALON_LUXE_COLORS.danger.base, 0.05)} 100%)`,
  emerald: `linear-gradient(135deg, ${SALON_LUXE_COLORS.emerald?.base || '#10B981'} 0%, ${SALON_LUXE_COLORS.emerald?.dark || '#0F6F5C'} 100%)`,
  emeraldSubtle: `linear-gradient(to bottom right, ${SALON_LUXE_COLORS.emerald?.lighter || 'rgba(16, 185, 129, 0.15)'} 0%, ${withOpacity(SALON_LUXE_COLORS.emerald?.dark || '#0F6F5C', 0.05)} 100%)`,
  rose: `linear-gradient(135deg, ${SALON_LUXE_COLORS.rose?.base || '#E8B4B8'} 0%, ${SALON_LUXE_COLORS.rose?.dark || '#F43F5E'} 100%)`,
  roseSubtle: `linear-gradient(to bottom right, ${SALON_LUXE_COLORS.rose?.lighter || 'rgba(232, 180, 184, 0.15)'} 0%, ${withOpacity(SALON_LUXE_COLORS.rose?.base || '#E8B4B8', 0.05)} 100%)`,
  plum: `linear-gradient(135deg, ${SALON_LUXE_COLORS.plum?.base || '#B794F4'} 0%, ${SALON_LUXE_COLORS.plum?.dark || '#9333EA'} 100%)`,
  plumSubtle: `linear-gradient(to bottom right, ${SALON_LUXE_COLORS.plum?.lighter || 'rgba(183, 148, 244, 0.15)'} 0%, ${withOpacity(SALON_LUXE_COLORS.plum?.base || '#B794F4', 0.05)} 100%)`,
} as const

/**
 * STYLE PRESETS
 * Pre-configured inline style objects for common use cases
 */
export const SALON_LUXE_STYLES = {
  // Modal/Dialog backgrounds
  modalBackground: {
    background: SALON_LUXE_GRADIENTS.charcoal,
    backdropFilter: 'blur(20px)',
    boxShadow: `0 25px 50px ${SALON_LUXE_COLORS.shadow.black}, 0 0 0 1px ${SALON_LUXE_COLORS.border.base}`,
  },

  // Card backgrounds
  cardBackground: {
    backgroundColor: SALON_LUXE_COLORS.charcoal.light,
  },

  cardBackgroundHover: {
    backgroundColor: SALON_LUXE_COLORS.charcoal.lighter,
  },

  // Text styles
  textPrimary: {
    color: SALON_LUXE_COLORS.text.primary,
  },

  textSecondary: {
    color: SALON_LUXE_COLORS.text.secondary,
  },

  textMuted: {
    color: SALON_LUXE_COLORS.text.tertiary,
  },

  textOnGold: {
    color: SALON_LUXE_COLORS.text.onGold,
  },

  // Input styles
  input: {
    backgroundColor: SALON_LUXE_COLORS.charcoal.dark,
    color: SALON_LUXE_COLORS.text.primary,
    borderColor: withOpacity(SALON_LUXE_COLORS.border.base, 0.8),
  },

  inputFocus: {
    borderColor: withOpacity(SALON_LUXE_COLORS.gold.base, 0.6),
    boxShadow: `0 0 20px ${SALON_LUXE_COLORS.shadow.goldLighter}`,
  },
} as const
