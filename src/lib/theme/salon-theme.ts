// ================================================================================
// HERA SALON THEME CONFIGURATION
// Smart Code: HERA.UI.THEME.SALON.v1
// Stunning color palette with WCAG AA compliance for salon industry
// ================================================================================

export const salonTheme = {
  // Primary Brand Colors - Elegant Purple to Pink Gradient
  primary: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef',  // Main brand color
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
    950: '#4a044e',
  },
  
  // Secondary - Warm Rose Gold
  secondary: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899',  // Rose accent
    600: '#db2777',
    700: '#be185d',
    800: '#9d174d',
    900: '#831843',
    950: '#500724',
  },
  
  // Accent - Luxurious Gold
  accent: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',  // Gold highlight
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },
  
  // Success - Fresh Mint Green
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',  // Success green
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },
  
  // Neutral - Sophisticated Grays
  neutral: {
    50: '#fafaf9',
    100: '#f5f5f4',
    200: '#e7e5e4',
    300: '#d6d3d1',
    400: '#a8a29e',
    500: '#78716c',
    600: '#57534e',
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',
    950: '#0c0a09',
  },
  
  // Gradient Combinations
  gradients: {
    primary: 'from-purple-500 via-pink-500 to-rose-500',
    secondary: 'from-pink-400 via-rose-400 to-amber-400',
    accent: 'from-amber-400 via-orange-400 to-rose-400',
    hero: 'from-purple-600 via-pink-600 to-rose-600',
    card: 'from-purple-50 via-pink-50 to-rose-50',
    dark: 'from-purple-950 via-pink-950 to-rose-950',
  },
  
  // Component-specific colors
  components: {
    // Cards with subtle gradients
    card: {
      background: 'bg-gradient-to-br from-white to-purple-50/30',
      backgroundDark: 'bg-gradient-to-br from-gray-900 to-purple-950/30',
      border: 'border-purple-200/50',
      borderDark: 'border-purple-800/50',
      shadow: 'shadow-lg shadow-purple-500/10',
    },
    
    // Buttons with vibrant gradients
    button: {
      primary: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
      secondary: 'bg-gradient-to-r from-rose-400 to-amber-400 hover:from-rose-500 hover:to-amber-500',
      accent: 'bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500',
    },
    
    // Status colors with proper contrast
    status: {
      pending: {
        bg: 'bg-amber-100 dark:bg-amber-950/30',
        text: 'text-amber-900 dark:text-amber-100',
        border: 'border-amber-300 dark:border-amber-800',
      },
      confirmed: {
        bg: 'bg-blue-100 dark:bg-blue-950/30',
        text: 'text-blue-900 dark:text-blue-100',
        border: 'border-blue-300 dark:border-blue-800',
      },
      arrived: {
        bg: 'bg-purple-100 dark:bg-purple-950/30',
        text: 'text-purple-900 dark:text-purple-100',
        border: 'border-purple-300 dark:border-purple-800',
      },
      in_service: {
        bg: 'bg-pink-100 dark:bg-pink-950/30',
        text: 'text-pink-900 dark:text-pink-100',
        border: 'border-pink-300 dark:border-pink-800',
      },
      completed: {
        bg: 'bg-green-100 dark:bg-green-950/30',
        text: 'text-green-900 dark:text-green-100',
        border: 'border-green-300 dark:border-green-800',
      },
      cancelled: {
        bg: 'bg-gray-100 dark:bg-gray-950/30',
        text: 'text-gray-900 dark:text-gray-100',
        border: 'border-gray-300 dark:border-gray-800',
      },
      no_show: {
        bg: 'bg-red-100 dark:bg-red-950/30',
        text: 'text-red-900 dark:text-red-100',
        border: 'border-red-300 dark:border-red-800',
      },
    },
    
    // Navigation with glass effect
    nav: {
      background: 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl',
      border: 'border-purple-200/20 dark:border-purple-800/20',
      item: 'hover:bg-gradient-to-r hover:from-purple-100/50 hover:to-pink-100/50 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30',
      active: 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50',
    },
    
    // Inputs with elegant styling
    input: {
      background: 'bg-white dark:bg-gray-900',
      border: 'border-purple-200 dark:border-purple-800',
      focus: 'focus:border-purple-500 focus:ring-purple-500/20',
      placeholder: 'placeholder-gray-400 dark:placeholder-gray-500',
    },
    
    // Badges with vibrant colors
    badge: {
      default: 'bg-purple-100 text-purple-900 dark:bg-purple-900/30 dark:text-purple-100',
      secondary: 'bg-pink-100 text-pink-900 dark:bg-pink-900/30 dark:text-pink-100',
      outline: 'border-purple-300 text-purple-700 dark:border-purple-700 dark:text-purple-300',
    },
  },
  
  // Text colors with proper contrast
  text: {
    primary: 'text-gray-900 dark:text-gray-100',
    secondary: 'text-gray-600 dark:text-gray-400',
    muted: 'text-gray-500 dark:text-gray-500',
    accent: 'text-purple-600 dark:text-purple-400',
    inverse: 'text-white dark:text-gray-900',
  },
  
  // Background patterns
  patterns: {
    dots: 'bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]',
    grid: 'bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]',
  },
}

// Utility function to apply salon theme classes
export const salonClasses = {
  // Page backgrounds
  pageGradient: 'bg-gradient-to-br from-purple-50 via-pink-50 to-white dark:from-gray-900 dark:via-purple-950/20 dark:to-gray-900',
  
  // Card styles
  card: 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-purple-200/50 dark:border-purple-800/50 shadow-xl shadow-purple-500/10',
  
  // Button styles
  primaryButton: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-200',
  
  secondaryButton: 'bg-gradient-to-r from-rose-400 to-amber-400 hover:from-rose-500 hover:to-amber-500 text-white font-medium shadow-lg shadow-rose-500/25',
  
  // Status badges
  statusBadge: (status: string) => {
    const statusClasses = salonTheme.components.status[status as keyof typeof salonTheme.components.status]
    if (!statusClasses) return 'bg-gray-100 text-gray-900 dark:bg-gray-900/30 dark:text-gray-100'
    return `${statusClasses.bg} ${statusClasses.text} ${statusClasses.border} border font-medium`
  },
  
  // Input fields
  input: 'bg-white dark:bg-gray-900 border-purple-200 dark:border-purple-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:focus:border-purple-400 transition-colors',
  
  // Navigation items
  navItem: 'px-4 py-2 rounded-lg transition-all duration-200 hover:bg-gradient-to-r hover:from-purple-100/50 hover:to-pink-100/50 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30',
  
  navItemActive: 'px-4 py-2 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 font-medium',
  
  // Headings with gradient
  gradientHeading: 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold',
  
  // Glass effect
  glass: 'bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-purple-200/20 dark:border-purple-800/20',
  
  // Hover effects
  hoverGlow: 'hover:shadow-lg hover:shadow-purple-500/20 dark:hover:shadow-purple-400/20 transition-all duration-300',
}

// Export theme configuration for Tailwind
export const salonTailwindTheme = {
  extend: {
    colors: {
      salon: salonTheme,
    },
    backgroundImage: {
      'salon-gradient': 'linear-gradient(135deg, #d946ef 0%, #ec4899 50%, #f59e0b 100%)',
      'salon-dark': 'linear-gradient(135deg, #701a75 0%, #831843 50%, #78350f 100%)',
    },
    animation: {
      'gradient-x': 'gradient-x 15s ease infinite',
      'float': 'float 6s ease-in-out infinite',
    },
    keyframes: {
      'gradient-x': {
        '0%, 100%': { 'background-position': '0% 50%' },
        '50%': { 'background-position': '100% 50%' },
      },
      'float': {
        '0%, 100%': { transform: 'translateY(0)' },
        '50%': { transform: 'translateY(-10px)' },
      },
    },
  },
}