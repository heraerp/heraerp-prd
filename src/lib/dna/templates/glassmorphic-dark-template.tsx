/**
 * HERA DNA Design Template: "Glassmorphic Dark"
 *
 * A premium dark theme template with glassmorphic effects, animated gradients,
 * and professional depth. Perfect for enterprise applications, dashboards,
 * and data-heavy interfaces.
 *
 * Features:
 * - Dark slate base with glassmorphic cards
 * - Animated gradient blobs for depth
 * - Three-color gradient system
 * - Professional hover states
 * - Consistent opacity levels
 * - Mobile-responsive design
 */

export interface GlassmorphicDarkTheme {
  name: string
  colors: {
    primary: string // Main brand color (e.g., #0049B7)
    secondary: string // Secondary accent (e.g., #0099CC)
    accent: string // Bright accent (e.g., #FFD700)
    danger: string // Alert/danger color (e.g., #E91E63)
    dangerDark: string // Darker danger variant (e.g., #C2185B)
    darkBase: string // Dark background (e.g., #001A3D)
  }
}

// Pre-defined color themes
export const glassmorphicThemes = {
  // ISP Theme (Blue/Cyan/Gold)
  isp: {
    name: 'ISP Broadband',
    colors: {
      primary: '#0049B7',
      secondary: '#0099CC',
      accent: '#FFD700',
      danger: '#E91E63',
      dangerDark: '#C2185B',
      darkBase: '#001A3D'
    }
  },

  // Healthcare Theme (Teal/Green/Lime)
  healthcare: {
    name: 'Healthcare',
    colors: {
      primary: '#00695C',
      secondary: '#00897B',
      accent: '#64DD17',
      danger: '#D32F2F',
      dangerDark: '#B71C1C',
      darkBase: '#004D40'
    }
  },

  // Finance Theme (Navy/Purple/Gold)
  finance: {
    name: 'Finance',
    colors: {
      primary: '#1A237E',
      secondary: '#5C6BC0',
      accent: '#FFC107',
      danger: '#E91E63',
      dangerDark: '#AD1457',
      darkBase: '#0D1642'
    }
  },

  // Restaurant Theme (Orange/Red/Yellow)
  restaurant: {
    name: 'Restaurant',
    colors: {
      primary: '#E65100',
      secondary: '#FF6F00',
      accent: '#FFEB3B',
      danger: '#D32F2F',
      dangerDark: '#B71C1C',
      darkBase: '#3E2723'
    }
  },

  // Manufacturing Theme (Grey/Blue/Orange)
  manufacturing: {
    name: 'Manufacturing',
    colors: {
      primary: '#37474F',
      secondary: '#546E7A',
      accent: '#FF9800',
      danger: '#F44336',
      dangerDark: '#C62828',
      darkBase: '#212121'
    }
  },

  // Retail Theme (Pink/Purple/Yellow)
  retail: {
    name: 'Retail',
    colors: {
      primary: '#6A1B9A',
      secondary: '#AB47BC',
      accent: '#FFD600',
      danger: '#E91E63',
      dangerDark: '#AD1457',
      darkBase: '#311B92'
    }
  }
}

// Template component generator
export function generateGlassmorphicLayout(theme: GlassmorphicDarkTheme) {
  return `
    {/* Main Layout Container */}
    <div className="min-h-screen bg-gradient-to-br from-[${theme.colors.primary}] via-slate-950 to-[${theme.colors.darkBase}]">
      
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[${theme.colors.danger}] to-[${theme.colors.dangerDark}] rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-[${theme.colors.secondary}] to-[${theme.colors.primary}] rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-[${theme.colors.accent}] to-[${theme.colors.secondary}] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
      </div>
      
      {/* Content */}
      {children}
    </div>
  `
}

// Card component template
export function generateGlassmorphicCard(theme: GlassmorphicDarkTheme) {
  return `
    {/* Glassmorphic Card */}
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[${theme.colors.secondary}] to-[${theme.colors.primary}] rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
      <div className="relative bg-background/50 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
        {/* Card Content */}
      </div>
    </div>
  `
}

// Button component template
export function generateGlassmorphicButton(
  theme: GlassmorphicDarkTheme,
  variant: 'primary' | 'secondary' | 'danger' = 'primary'
) {
  const gradients = {
    primary: `from-[${theme.colors.secondary}] to-[${theme.colors.primary}]`,
    secondary: `from-[${theme.colors.accent}] to-[${theme.colors.secondary}]`,
    danger: `from-[${theme.colors.danger}] to-[${theme.colors.dangerDark}]`
  }

  return `
    <button className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r ${gradients[variant]} rounded-xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
      <div className="relative flex items-center space-x-2 px-4 py-2 bg-gradient-to-r ${gradients[variant]} text-foreground rounded-lg font-medium hover:shadow-lg hover:shadow-[${theme.colors.secondary}]/40 transition-all duration-300">
        {/* Button Content */}
      </div>
    </button>
  `
}

// Stat card template
export function generateGlassmorphicStatCard(theme: GlassmorphicDarkTheme) {
  return `
    {/* Stat Card */}
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[${theme.colors.secondary}] to-[${theme.colors.primary}] rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
      <div className="relative bg-background/50 backdrop-blur-xl border border-border/10 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-foreground/60 text-sm">{label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          </div>
          <div className="p-2 bg-gradient-to-br from-[${theme.colors.secondary}] to-[${theme.colors.primary}] rounded-lg">
            {icon}
          </div>
        </div>
      </div>
    </div>
  `
}

// Input field template
export function generateGlassmorphicInput(theme: GlassmorphicDarkTheme) {
  return `
    <input
      className="w-full px-4 py-2 bg-background/50 border border-border/10 rounded-lg text-foreground placeholder-white/40 focus:outline-none focus:border-[${theme.colors.secondary}]/50 focus:bg-background/10 transition-all duration-200"
    />
  `
}

// CSS animations to include
export const glassmorphicAnimations = `
  @keyframes blob {
    0% {
      transform: translate(0px, 0px) scale(1);
    }
    33% {
      transform: translate(30px, -50px) scale(1.1);
    }
    66% {
      transform: translate(-20px, 20px) scale(0.9);
    }
    100% {
      transform: translate(0px, 0px) scale(1);
    }
  }
  
  .animate-blob {
    animation: blob 7s infinite;
  }
  
  .animation-delay-2000 {
    animation-delay: 2s;
  }
  
  .animation-delay-4000 {
    animation-delay: 4s;
  }
  
  @keyframes gradient-shift {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
  
  .animate-gradient-shift {
    background-size: 200% 200%;
    animation: gradient-shift 4s ease infinite;
  }
`

// Usage example
export const usageExample = `
import { glassmorphicThemes, generateGlassmorphicLayout, generateGlassmorphicCard } from '@/lib/dna/templates/glassmorphic-dark-template'

// Use pre-defined theme
const theme = glassmorphicThemes.healthcare

// Or create custom theme
const customTheme = {
  name: 'Custom Business',
  colors: {
    primary: '#YourPrimaryColor',
    secondary: '#YourSecondaryColor',
    accent: '#YourAccentColor',
    danger: '#YourDangerColor',
    dangerDark: '#YourDangerDarkColor',
    darkBase: '#YourDarkBaseColor'
  }
}

// Generate components with theme
const layout = generateGlassmorphicLayout(theme)
const card = generateGlassmorphicCard(theme)
const button = generateGlassmorphicButton(theme, 'primary')
`
