/**
 * HERA Salon Button Themes - Reusable button styling for consistent design
 *
 * Usage:
 * import { salonButtonThemes } from '@/styles/salon-button-themes'
 *
 * <Button
 *   className={salonButtonThemes.secondaryAction.className}
 *   style={salonButtonThemes.secondaryAction.style}
 * >
 *   Button Text
 * </Button>
 */

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323',
  emerald: '#0F6F5C',
  emeraldDark: '#0A5544'
}

export const salonButtonThemes = {
  // Secondary action buttons - for discount, tip, smaller actions
  secondaryAction: {
    className:
      'h-9 px-4 text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-40',
    style: {
      background: `linear-gradient(135deg, ${COLORS.emerald}20 0%, ${COLORS.emerald}10 100%)`,
      color: COLORS.emerald,
      border: `1px solid ${COLORS.emerald}40`,
      boxShadow: `0 2px 8px ${COLORS.emerald}15`
    }
  },

  // Primary action buttons - for main CTAs like "Complete Payment"
  primaryAction: {
    className:
      'h-14 px-6 text-base font-bold transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group',
    style: {
      background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
      color: COLORS.black,
      boxShadow: `0 12px 32px ${COLORS.gold}60, 0 0 0 2px ${COLORS.gold}`,
      border: 'none'
    }
  },

  // Medium action buttons - for Clear, Cancel, etc.
  mediumAction: {
    className:
      'h-11 px-5 text-sm font-semibold transition-all duration-300 hover:scale-[1.02] disabled:opacity-40',
    style: {
      color: COLORS.champagne,
      borderColor: `${COLORS.gold}40`,
      background: `${COLORS.charcoalDark}80`,
      boxShadow: `0 2px 12px ${COLORS.black}30`
    }
  },

  // Small action buttons - for add/remove in rows
  smallAction: {
    className:
      'h-8 w-8 p-0 transition-all duration-200 hover:scale-110 disabled:opacity-40',
    style: {
      background: `linear-gradient(135deg, ${COLORS.gold}25 0%, ${COLORS.gold}15 100%)`,
      color: COLORS.gold,
      border: `1px solid ${COLORS.gold}50`,
      boxShadow: `0 2px 6px ${COLORS.gold}20`
    }
  },

  // Remove/Delete buttons
  removeAction: {
    className:
      'h-6 w-6 p-0 opacity-60 hover:opacity-100 transition-opacity disabled:opacity-30',
    style: {
      color: '#EF4444'
    }
  },

  // Quick select buttons for percentages/amounts
  quickSelect: {
    className: 'h-9 transition-all duration-200 hover:scale-105 disabled:opacity-40',
    style: {
      background: `linear-gradient(135deg, ${COLORS.gold}25 0%, ${COLORS.gold}15 100%)`,
      color: COLORS.gold,
      border: `1px solid ${COLORS.gold}50`
    }
  },

  // Subtle action buttons - for show/hide sections
  subtleAction: {
    className: 'w-full transition-all duration-300 hover:scale-[1.02]',
    style: {
      background: `${COLORS.charcoalDark}80`,
      borderColor: `${COLORS.emerald}40`,
      color: COLORS.emerald
    }
  }
}

// Helper function to merge custom styles with theme
export const withSalonTheme = (
  theme: keyof typeof salonButtonThemes,
  customClassName?: string,
  customStyle?: React.CSSProperties
) => ({
  className: `${salonButtonThemes[theme].className} ${customClassName || ''}`,
  style: { ...salonButtonThemes[theme].style, ...customStyle }
})
