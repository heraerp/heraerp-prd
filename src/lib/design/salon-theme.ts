/**
 * HERA Salon Luxe Theme System
 *
 * Extends the base HERA design system with luxury salon-specific colors,
 * animations, and styling for a premium salon management experience.
 */

export const salonTheme = {
  colors: {
    // Primary Luxe Palette
    primary: {
      50: '#fdf4ff', // Lightest lavender
      100: '#fae8ff', // Very light purple
      200: '#f3d1ff', // Light purple
      300: '#e9a9ff', // Medium light purple
      400: '#d97aff', // Medium purple
      500: '#c44dff', // Base purple
      600: '#b833ff', // Rich purple
      700: '#9f1aff', // Deep purple
      800: '#8b0dff', // Very deep purple
      900: '#6b0080' // Darkest purple
    },

    // Luxe Gold Accents
    gold: {
      50: '#fffdf0', // Cream
      100: '#fff9d9', // Light cream
      200: '#fff2b3', // Pale gold
      300: '#ffe680', // Light gold
      400: '#ffd54d', // Medium gold
      500: '#ffc107', // Base gold
      600: '#ffb300', // Rich gold
      700: '#ff8f00', // Deep gold
      800: '#ff6f00', // Orange gold
      900: '#e65100' // Darkest gold
    },

    // Salon Rose
    rose: {
      50: '#fff1f2', // Lightest rose
      100: '#ffe4e6', // Very light rose
      200: '#fecdd3', // Light rose
      300: '#fda4af', // Medium light rose
      400: '#fb7185', // Medium rose
      500: '#f43f5e', // Base rose
      600: '#e11d48', // Rich rose
      700: '#be123c', // Deep rose
      800: '#9f1239', // Very deep rose
      900: '#881337' // Darkest rose
    },

    // Neutral Luxe Grays
    luxeGray: {
      50: '#fafafa', // Nearly white
      100: '#f5f5f5', // Very light gray
      200: '#e5e5e5', // Light gray
      300: '#d4d4d4', // Medium light gray
      400: '#a3a3a3', // Medium gray
      500: '#737373', // Base gray
      600: '#525252', // Rich gray
      700: '#404040', // Deep gray
      800: '#262626', // Very deep gray
      900: '#171717' // Darkest gray
    },

    // Semantic Colors
    success: {
      light: '#dcfce7',
      DEFAULT: '#16a34a',
      dark: '#15803d'
    },
    warning: {
      light: '#fef3c7',
      DEFAULT: '#f59e0b',
      dark: '#d97706'
    },
    error: {
      light: '#fecaca',
      DEFAULT: '#dc2626',
      dark: '#b91c1c'
    }
  },

  gradients: {
    // Luxe Gradients
    primary: 'linear-gradient(135deg, #c44dff 0%, #b833ff 50%, #9f1aff 100%)',
    gold: 'linear-gradient(135deg, #ffc107 0%, #ffb300 50%, #ff8f00 100%)',
    rose: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 50%, #be123c 100%)',
    sunset: 'linear-gradient(135deg, #ff8f00 0%, #f43f5e 50%, #9f1aff 100%)',

    // Glassmorphism Backgrounds
    glass: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
    glassRose: 'linear-gradient(135deg, rgba(244, 63, 94, 0.1) 0%, rgba(244, 63, 94, 0.05) 100%)',
    glassPurple:
      'linear-gradient(135deg, rgba(196, 77, 255, 0.1) 0%, rgba(196, 77, 255, 0.05) 100%)',

    // Card Gradients
    cardLight: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
    cardDark: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)'
  },

  shadows: {
    // Luxury Shadows
    luxe: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    luxeSoft: '0 10px 25px -3px rgba(0, 0, 0, 0.1)',
    luxeInner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',

    // Colored Shadows
    purple: '0 10px 25px -3px rgba(196, 77, 255, 0.3)',
    gold: '0 10px 25px -3px rgba(255, 193, 7, 0.3)',
    rose: '0 10px 25px -3px rgba(244, 63, 94, 0.3)',

    // Glassmorphism Shadows
    glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
  },

  animations: {
    // Luxury Animations
    fadeInUp: 'fadeInUp 0.6s ease-out',
    slideInRight: 'slideInRight 0.5s ease-out',
    scaleIn: 'scaleIn 0.4s ease-out',
    glow: 'glow 2s ease-in-out infinite alternate',
    float: 'float 3s ease-in-out infinite',
    shimmer: 'shimmer 2s linear infinite',

    // Micro-interactions
    buttonHover: 'transform 0.2s ease-in-out',
    cardHover: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out'
  },

  spacing: {
    // Luxury Spacing Scale
    xs: '0.5rem', // 8px
    sm: '0.75rem', // 12px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
    '2xl': '3rem', // 48px
    '3xl': '4rem', // 64px
    '4xl': '6rem', // 96px
    '5xl': '8rem' // 128px
  },

  typography: {
    // Luxury Typography Scale
    heading: {
      fontFamily: 'Inter, -apple-system, sans-serif',
      fontWeight: '700',
      letterSpacing: '-0.025em'
    },
    body: {
      fontFamily: 'Inter, -apple-system, sans-serif',
      fontWeight: '400',
      lineHeight: '1.6'
    },
    caption: {
      fontFamily: 'Inter, -apple-system, sans-serif',
      fontWeight: '500',
      fontSize: '0.875rem',
      letterSpacing: '0.025em'
    }
  },

  borderRadius: {
    // Luxury Border Radius
    sm: '0.375rem', // 6px
    md: '0.5rem', // 8px
    lg: '0.75rem', // 12px
    xl: '1rem', // 16px
    '2xl': '1.5rem', // 24px
    '3xl': '2rem', // 32px
    full: '9999px'
  },

  glassmorphism: {
    // Glassmorphism Presets
    card: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
    },

    sidebar: {
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    },

    modal: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(30px)',
      border: '1px solid rgba(255, 255, 255, 0.3)'
    }
  }
} as const

// CSS-in-JS Keyframes
export const salonKeyframes = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @keyframes glow {
    from {
      box-shadow: 0 0 20px rgba(196, 77, 255, 0.3);
    }
    to {
      box-shadow: 0 0 30px rgba(196, 77, 255, 0.6);
    }
  }
  
  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-6px);
    }
  }
  
  @keyframes shimmer {
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: calc(200px + 100%) 0;
    }
  }
`

// Utility Functions
export const getSalonColor = (color: string, shade?: number) => {
  const [colorName, defaultShade] = color.split('-')
  const targetShade = shade || parseInt(defaultShade) || 500

  // @ts-ignore
  return salonTheme.colors[colorName]?.[targetShade] || color
}

export const getSalonGradient = (gradientName: string) => {
  // @ts-ignore
  return salonTheme.gradients[gradientName] || gradientName
}

export const getSalonShadow = (shadowName: string) => {
  // @ts-ignore
  return salonTheme.shadows[shadowName] || shadowName
}

// CSS Variables for Dynamic Theming
export const salonCSSVariables = {
  '--salon-primary': salonTheme.colors.primary[500],
  '--salon-primary-light': salonTheme.colors.primary[100],
  '--salon-primary-dark': salonTheme.colors.primary[700],

  '--salon-gold': salonTheme.colors.gold[500],
  '--salon-gold-light': salonTheme.colors.gold[100],
  '--salon-gold-dark': salonTheme.colors.gold[700],

  '--salon-rose': salonTheme.colors.rose[500],
  '--salon-rose-light': salonTheme.colors.rose[100],
  '--salon-rose-dark': salonTheme.colors.rose[700],

  '--salon-gradient-primary': salonTheme.gradients.primary,
  '--salon-gradient-sunset': salonTheme.gradients.sunset,
  '--salon-shadow-luxe': salonTheme.shadows.luxe
}
