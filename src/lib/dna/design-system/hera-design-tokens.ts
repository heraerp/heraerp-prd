/**
 * HERA Design System Tokens
 * Official design tokens for HERA ERP applications
 * Part of HERA DNA System
 */

export const heraDesignTokens = {
  // Color Palette
  colors: {
    // Primary Gradient Colors
    gradient: {
      purple: '#7C3AED',
      purpleDark: '#6366F1',
      blue: '#3B82F6',
      sky: '#0EA5E9',
      cyan: '#06B6D4'
    },
    // Action Colors
    violet: {
      600: '#7C3AED',
      700: '#6D28D9',
      800: '#5B21B6'
    },
    // Text Colors - High Contrast Only
    text: {
      primary: '#1F2937', // gray-800
      secondary: '#374151', // gray-700
      tertiary: '#4B5563', // gray-600
      light: '#6B7280' // gray-500 - use sparingly
    },
    // Backgrounds
    background: {
      white: '#FFFFFF',
      offWhite: '#F8FAFC',
      input: '#F9FAFB', // gray-50
      card: 'rgba(255, 255, 255, 0.98)'
    }
  },

  // Typography
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontWeight: {
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900
    },
    // Mobile-first responsive sizes
    size: {
      xs: { mobile: '0.75rem', desktop: '0.75rem' }, // 12px
      sm: { mobile: '0.875rem', desktop: '1rem' }, // 14px → 16px
      base: { mobile: '1rem', desktop: '1.125rem' }, // 16px → 18px
      lg: { mobile: '1.125rem', desktop: '1.25rem' }, // 18px → 20px
      xl: { mobile: '1.25rem', desktop: '1.5rem' }, // 20px → 24px
      '2xl': { mobile: '1.5rem', desktop: '1.875rem' }, // 24px → 30px
      '3xl': { mobile: '1.875rem', desktop: '2.25rem' } // 30px → 36px
    }
  },

  // Animation
  animation: {
    duration: {
      fast: '200ms',
      normal: '300ms',
      slow: '500ms',
      bgSlow: '8000ms',
      gradient: '20000ms'
    },
    easing: {
      default: 'ease',
      in: 'ease-in',
      out: 'ease-out',
      inOut: 'ease-in-out'
    }
  },

  // Spacing
  spacing: {
    1: '0.25rem', // 4px
    2: '0.5rem', // 8px
    3: '0.75rem', // 12px
    4: '1rem', // 16px
    5: '1.25rem', // 20px
    6: '1.5rem', // 24px
    8: '2rem', // 32px
    10: '2.5rem', // 40px
    12: '3rem', // 48px
    16: '4rem' // 64px
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.125rem', // 2px
    base: '0.25rem', // 4px
    md: '0.375rem', // 6px
    lg: '0.5rem', // 8px
    xl: '0.75rem', // 12px
    '2xl': '1rem', // 16px
    '3xl': '1.5rem', // 24px
    full: '9999px'
  },

  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  }
}

// CSS Custom Properties Generator
export function generateCSSVariables(): string {
  return `
:root {
  /* Primary Gradient Colors */
  --hera-purple: ${heraDesignTokens.colors.gradient.purple};
  --hera-purple-dark: ${heraDesignTokens.colors.gradient.purpleDark};
  --hera-blue: ${heraDesignTokens.colors.gradient.blue};
  --hera-sky: ${heraDesignTokens.colors.gradient.sky};
  --hera-cyan: ${heraDesignTokens.colors.gradient.cyan};
  
  /* Text Colors */
  --text-primary: ${heraDesignTokens.colors.text.primary};
  --text-secondary: ${heraDesignTokens.colors.text.secondary};
  --text-tertiary: ${heraDesignTokens.colors.text.tertiary};
  --text-light: ${heraDesignTokens.colors.text.light};
  
  /* Animation Durations */
  --animation-fast: ${heraDesignTokens.animation.duration.fast};
  --animation-normal: ${heraDesignTokens.animation.duration.normal};
  --animation-slow: ${heraDesignTokens.animation.duration.slow};
  --animation-bg-slow: ${heraDesignTokens.animation.duration.bgSlow};
  --animation-gradient: ${heraDesignTokens.animation.duration.gradient};
}
  `.trim()
}

// Export design principles
export const heraDesignPrinciples = {
  gradientFirst: 'Primary gradient from purple to cyan defines the HERA brand',
  highContrast: 'All text must maintain high contrast for readability - minimum gray-600',
  mobileFirst: 'Design for mobile screens first, enhance for desktop',
  singleScreen: 'Auth pages fit perfectly on one screen without scrolling',
  subtleAnimations: 'Animations should be slow (8s+) and gentle for professional feel',
  enterpriseReady: 'Clean, professional appearance suitable for enterprise deployment',
  tagline: 'ERP in weeks, not years',
  poweredBy: 'Powered by patent pending technology'
}
