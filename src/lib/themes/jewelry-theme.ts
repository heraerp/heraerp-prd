/**
 * HERA Jewelry Theme Configuration
 * Enterprise-grade color palette with glassmorphism design
 * Inspired by luxury jewelry and precious metals
 */

export const jewelryTheme = {
  // Primary Colors - Luxury Gold & Rose Gold
  primary: {
    50: '#fffbf0',   // Ivory shimmer
    100: '#fff4d6',  // Champagne
    200: '#ffe4a3',  // Light gold
    300: '#ffd470',  // Gold
    400: '#ffba08',  // Rich gold
    500: '#f59e0b',  // Primary gold
    600: '#d97706',  // Deep gold
    700: '#b45309',  // Antique gold
    800: '#92400e',  // Bronze gold
    900: '#78350f',  // Dark bronze
    950: '#451a03',  // Deepest bronze
  },

  // Secondary Colors - Platinum & Silver
  secondary: {
    50: '#f8fafc',   // Platinum white
    100: '#f1f5f9',  // Light platinum
    200: '#e2e8f0',  // Silver mist
    300: '#cbd5e1',  // Silver
    400: '#94a3b8',  // Medium silver
    500: '#64748b',  // Steel silver
    600: '#475569',  // Dark silver
    700: '#334155',  // Charcoal silver
    800: '#1e293b',  // Dark steel
    900: '#0f172a',  // Midnight steel
    950: '#020617',  // Black steel
  },

  // Accent Colors - Precious Gems
  accent: {
    // Diamond Blue
    diamond: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    // Emerald Green
    emerald: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
    // Ruby Red
    ruby: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    // Amethyst Purple
    amethyst: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7c2d12',
      800: '#6b21a8',
      900: '#581c87',
    }
  },

  // Glassmorphism Variables
  glass: {
    // Background overlays with transparency
    backdrop: 'rgba(255, 255, 255, 0.25)',
    backdropDark: 'rgba(0, 0, 0, 0.25)',
    
    // Card backgrounds
    surface: 'rgba(255, 255, 255, 0.15)',
    surfaceDark: 'rgba(255, 255, 255, 0.05)',
    
    // Borders
    border: 'rgba(255, 255, 255, 0.2)',
    borderDark: 'rgba(255, 255, 255, 0.1)',
    
    // Shadows for depth
    shadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    shadowLarge: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    
    // Blur values
    blur: {
      sm: '4px',
      md: '8px',
      lg: '16px',
      xl: '24px'
    }
  },

  // Typography Scale
  typography: {
    fontFamily: {
      // Primary: Modern, clean sans-serif
      primary: ['Inter', 'system-ui', 'sans-serif'],
      // Secondary: Elegant serif for headings
      secondary: ['Playfair Display', 'Georgia', 'serif'],
      // Mono: For codes and technical content
      mono: ['JetBrains Mono', 'Consolas', 'monospace']
    },
    
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
    }
  },

  // Animation Configurations
  animations: {
    // Subtle entrance animations
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.4, ease: 'easeOut' }
    },
    
    scaleIn: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    
    // Hover animations
    hover: {
      scale: 1.02,
      transition: { duration: 0.2, ease: 'easeInOut' }
    },
    
    // Shimmer effect for luxury feel
    shimmer: {
      backgroundImage: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 2s infinite'
    }
  },

  // Spacing Scale
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
    '4xl': '6rem'
  },

  // Border Radius
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px'
  }
}

// CSS Custom Properties for easy theme switching
export const jewelryThemeCSS = `
  :root {
    /* Primary Colors */
    --jewelry-primary-50: ${jewelryTheme.primary[50]};
    --jewelry-primary-100: ${jewelryTheme.primary[100]};
    --jewelry-primary-200: ${jewelryTheme.primary[200]};
    --jewelry-primary-300: ${jewelryTheme.primary[300]};
    --jewelry-primary-400: ${jewelryTheme.primary[400]};
    --jewelry-primary-500: ${jewelryTheme.primary[500]};
    --jewelry-primary-600: ${jewelryTheme.primary[600]};
    --jewelry-primary-700: ${jewelryTheme.primary[700]};
    --jewelry-primary-800: ${jewelryTheme.primary[800]};
    --jewelry-primary-900: ${jewelryTheme.primary[900]};
    
    /* Secondary Colors */
    --jewelry-secondary-50: ${jewelryTheme.secondary[50]};
    --jewelry-secondary-100: ${jewelryTheme.secondary[100]};
    --jewelry-secondary-200: ${jewelryTheme.secondary[200]};
    --jewelry-secondary-300: ${jewelryTheme.secondary[300]};
    --jewelry-secondary-400: ${jewelryTheme.secondary[400]};
    --jewelry-secondary-500: ${jewelryTheme.secondary[500]};
    --jewelry-secondary-600: ${jewelryTheme.secondary[600]};
    --jewelry-secondary-700: ${jewelryTheme.secondary[700]};
    --jewelry-secondary-800: ${jewelryTheme.secondary[800]};
    --jewelry-secondary-900: ${jewelryTheme.secondary[900]};
    
    /* Glassmorphism */
    --jewelry-glass-backdrop: ${jewelryTheme.glass.backdrop};
    --jewelry-glass-surface: ${jewelryTheme.glass.surface};
    --jewelry-glass-border: ${jewelryTheme.glass.border};
    --jewelry-glass-shadow: ${jewelryTheme.glass.shadow};
    --jewelry-glass-blur-md: ${jewelryTheme.glass.blur.md};
    --jewelry-glass-blur-lg: ${jewelryTheme.glass.blur.lg};
  }
  
  /* Dark mode overrides */
  .dark {
    --jewelry-glass-backdrop: ${jewelryTheme.glass.backdropDark};
    --jewelry-glass-surface: ${jewelryTheme.glass.surfaceDark};
    --jewelry-glass-border: ${jewelryTheme.glass.borderDark};
  }
  
  /* Shimmer animation */
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  .jewelry-shimmer {
    background-image: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.4),
      transparent
    );
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
  }
`

// Utility functions for theme usage
export const jewelryThemeUtils = {
  // Get glassmorphism card styles
  getGlassCard: (variant: 'light' | 'dark' = 'light') => ({
    background: variant === 'light' ? jewelryTheme.glass.surface : jewelryTheme.glass.surfaceDark,
    backdropFilter: `blur(${jewelryTheme.glass.blur.md})`,
    border: `1px solid ${variant === 'light' ? jewelryTheme.glass.border : jewelryTheme.glass.borderDark}`,
    boxShadow: jewelryTheme.glass.shadow,
    borderRadius: jewelryTheme.borderRadius.lg
  }),
  
  // Get gradient background
  getGradientBackground: () => ({
    background: `linear-gradient(135deg, ${jewelryTheme.primary[400]} 0%, ${jewelryTheme.accent.amethyst[500]} 50%, ${jewelryTheme.accent.diamond[500]} 100%)`
  }),
  
  // Get luxury button styles
  getLuxuryButton: (variant: 'primary' | 'secondary' = 'primary') => ({
    background: variant === 'primary' 
      ? `linear-gradient(135deg, ${jewelryTheme.primary[500]}, ${jewelryTheme.primary[600]})`
      : `linear-gradient(135deg, ${jewelryTheme.secondary[400]}, ${jewelryTheme.secondary[500]})`,
    color: variant === 'primary' ? '#ffffff' : jewelryTheme.secondary[900],
    border: 'none',
    borderRadius: jewelryTheme.borderRadius.md,
    padding: `${jewelryTheme.spacing.md} ${jewelryTheme.spacing.xl}`,
    fontWeight: '600',
    boxShadow: jewelryTheme.glass.shadow,
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: jewelryTheme.glass.shadowLarge
    }
  })
}

export default jewelryTheme