/**
 * 🎨 HERA Salon Luxe Theme
 *
 * Enterprise-grade theme system for luxury salon applications
 * Inspired by high-end beauty salons with soft, elegant aesthetics
 */

export const SALON_LUXE_THEME = {
  // Core Colors - Elegant and Luxurious
  colors: {
    // Primary Palette
    champagne: '#F5E6C8',      // Soft champagne for premium feel
    gold: '#D4AF37',            // Rich gold for accents
    goldDark: '#B8860B',        // Deep gold for hover states
    goldLight: '#F0E68C',       // Light gold for highlights

    // Neutral Palette
    charcoal: '#1A1A1A',        // Deep charcoal for backgrounds
    charcoalLight: '#232323',   // Lighter charcoal for cards
    charcoalDark: '#0F0F0F',    // Darker charcoal for contrast
    black: '#0B0B0B',           // Pure black for depth

    // Accent Colors
    bronze: '#8C7853',          // Bronze for secondary elements
    emerald: '#0F6F5C',         // Elegant emerald for success
    plum: '#B794F4',            // Soft plum for info
    rose: '#E6B8C3',            // Delicate rose for highlights
    pearl: '#F8F6F0',           // Pearl white for contrast

    // Text Colors
    lightText: '#E0E0E0',       // Light text for dark backgrounds
    mutedText: '#A0A0A0',       // Muted text for secondary info
    darkText: '#2A2A2A',        // Dark text for light backgrounds

    // Status Colors
    success: '#0F6F5C',         // Success green
    warning: '#D4AF37',         // Warning gold
    error: '#DC6B6B',           // Error red (softer than harsh red)
    info: '#B794F4',            // Info purple
  },

  // Typography
  typography: {
    fontFamily: {
      primary: 'Inter, system-ui, -apple-system, sans-serif',
      display: 'Playfair Display, Georgia, serif',
      mono: 'JetBrains Mono, Monaco, monospace',
    },
    fontSize: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // Spacing System (based on 8px grid)
  spacing: {
    xs: '0.25rem',      // 4px
    sm: '0.5rem',       // 8px
    md: '1rem',         // 16px
    lg: '1.5rem',       // 24px
    xl: '2rem',         // 32px
    '2xl': '3rem',      // 48px
    '3xl': '4rem',      // 64px
  },

  // Border Radius
  borderRadius: {
    sm: '0.375rem',     // 6px
    md: '0.5rem',       // 8px
    lg: '0.75rem',      // 12px
    xl: '1rem',         // 16px
    '2xl': '1.5rem',    // 24px
    full: '9999px',     // Circle
  },

  // Shadows - Soft and Elegant
  shadows: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
    sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
    md: '0 4px 8px rgba(0, 0, 0, 0.15)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.2)',
    xl: '0 12px 24px rgba(0, 0, 0, 0.25)',
    '2xl': '0 20px 40px rgba(0, 0, 0, 0.3)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
    glow: '0 0 20px rgba(212, 175, 55, 0.3)',
    goldGlow: '0 0 30px rgba(212, 175, 55, 0.4)',
  },

  // Animation Timings - Smooth and Luxurious
  animation: {
    // Timing Functions
    timing: {
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',      // Springy bounce
      ease: 'cubic-bezier(0.22, 0.61, 0.36, 1)',        // Smooth ease
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',           // Material smooth
      elegant: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',  // Elegant ease
      soft: 'cubic-bezier(0.16, 1, 0.3, 1)',            // Soft ease-out
    },
    // Durations
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
      slower: '700ms',
    },
    // Common Animations
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    slideUp: {
      from: { transform: 'translateY(20px)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
    },
    scaleIn: {
      from: { transform: 'scale(0.95)', opacity: 0 },
      to: { transform: 'scale(1)', opacity: 1 },
    },
  },

  // Gradients - Luxurious Blends
  gradients: {
    gold: 'linear-gradient(135deg, #F0E68C 0%, #D4AF37 50%, #B8860B 100%)',
    champagne: 'linear-gradient(135deg, #F5E6C8 0%, #E6D5B8 100%)',
    charcoal: 'linear-gradient(135deg, #232323 0%, #1A1A1A 100%)',
    goldSubtle: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)',
    radialGold: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.2) 0%, transparent 70%)',
    shimmer: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
  },

  // Glass Effects - Modern Luxury
  glass: {
    light: {
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    medium: {
      background: 'rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
    },
    dark: {
      background: 'rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(15px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
    },
  },

  // Component-specific Styles
  components: {
    card: {
      background: 'rgba(35, 35, 35, 0.95)',
      border: '1px solid rgba(140, 120, 83, 0.3)',
      borderRadius: '1rem',
      padding: '1.5rem',
      shadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
      hover: {
        transform: 'translateY(-4px) scale(1.02)',
        shadow: '0 12px 28px rgba(212, 175, 55, 0.25)',
        borderColor: 'rgba(212, 175, 55, 0.6)',
      },
    },
    button: {
      primary: {
        background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
        color: '#0B0B0B',
        shadow: '0 4px 12px rgba(212, 175, 55, 0.3)',
        hover: {
          background: 'linear-gradient(135deg, #F0E68C 0%, #D4AF37 100%)',
          shadow: '0 6px 16px rgba(212, 175, 55, 0.4)',
          transform: 'translateY(-2px)',
        },
      },
      secondary: {
        background: 'rgba(140, 120, 83, 0.2)',
        color: '#D4AF37',
        border: '1px solid rgba(212, 175, 55, 0.4)',
        hover: {
          background: 'rgba(212, 175, 55, 0.15)',
          borderColor: 'rgba(212, 175, 55, 0.6)',
        },
      },
      ghost: {
        background: 'transparent',
        color: '#E0E0E0',
        hover: {
          background: 'rgba(255, 255, 255, 0.05)',
          color: '#D4AF37',
        },
      },
    },
    input: {
      background: '#232323',
      border: '1px solid rgba(140, 120, 83, 0.4)',
      borderRadius: '0.5rem',
      color: '#F5E6C8',
      placeholder: '#A0A0A0',
      focus: {
        borderColor: '#D4AF37',
        shadow: '0 0 0 3px rgba(212, 175, 55, 0.1)',
      },
    },
    modal: {
      background: '#1A1A1A',
      border: '1px solid rgba(140, 120, 83, 0.4)',
      borderRadius: '1.5rem',
      shadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
      overlay: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(8px)',
    },
  },
} as const

// Helper function to get color with opacity
export function withOpacity(color: string, opacity: number): string {
  // Convert hex to rgba
  const hex = color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

// Helper function to create hover style object
export function createHoverStyle(baseStyle: any, hoverStyle: any) {
  return {
    ...baseStyle,
    transition: `all ${SALON_LUXE_THEME.animation.duration.normal} ${SALON_LUXE_THEME.animation.timing.soft}`,
    ':hover': hoverStyle,
  }
}

// Export type for TypeScript support
export type SalonLuxeTheme = typeof SALON_LUXE_THEME
