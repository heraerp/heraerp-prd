/**
 * HERA DNA Tailwind Configuration
 * Generated from design tokens - integrates with HERA color system
 * Automatically syncs with CSS variables from hera-color-palette-dna.ts
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Base colors - HERA DNA foundation
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        surfaceAlt: 'var(--color-surfaceAlt)',
        border: 'var(--color-border)',

        // Brand colors - HERA identity system
        primary: {
          DEFAULT: 'var(--color-primary)',
          foreground: 'var(--color-primary-fg)',
          hover: 'var(--state-primary-hover)',
          active: 'var(--state-primary-active)'
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          foreground: 'var(--color-secondary-fg)',
          hover: 'var(--state-secondary-hover)',
          active: 'var(--state-secondary-active)'
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          foreground: 'var(--color-accent-fg)',
          hover: 'var(--state-accent-hover)',
          active: 'var(--state-accent-active)'
        },

        // Extended brand palette
        purple: 'var(--color-purple)',
        amber: 'var(--color-amber)',
        red: 'var(--color-red)',
        gold: 'var(--color-gold)',

        // Semantic status colors
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        destructive: 'var(--color-danger)', // Alias for shadcn compatibility

        // Typography colors
        text: 'var(--color-text)',
        'text-muted': 'var(--color-text-muted)',
        foreground: 'var(--color-text)', // Alias for shadcn compatibility
        'muted-foreground': 'var(--color-text-muted)', // Alias for shadcn compatibility

        // Focus and accessibility
        ring: 'var(--color-focus)',
        
        // Shadcn/ui compatibility aliases
        background: 'var(--color-bg)',
        card: 'var(--color-surface)',
        'card-foreground': 'var(--color-text)',
        popover: 'var(--color-surface)',
        'popover-foreground': 'var(--color-text)',
        muted: 'var(--color-surfaceAlt)',
        input: 'var(--color-surface)',
      },
      
      // Enhanced shadow system
      boxShadow: {
        'sm': 'var(--shadow-1)',
        'md': 'var(--shadow-2)',
        'glass': 'var(--glass-shadow)',
        'enterprise': '0 4px 20px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.05)',
        'enterprise-hover': '0 8px 30px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)'
      },
      
      // HERA DNA border radius system
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)', 
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        'enterprise': 'var(--radius-lg)' // Standard for enterprise components
      },
      
      // Enhanced background images
      backgroundImage: {
        'brand-gradient': 'var(--gradient-brand)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        'dark-glass-gradient': 'linear-gradient(135deg, rgba(17,23,37,0.3) 0%, rgba(17,23,37,0.1) 100%)',
      },
      
      // Animation and transitions
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(-20px)" },
          to: { opacity: "1", transform: "translateX(0)" }
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" }
        },
        "shimmer": {
          "0%": { "background-position": "-200px 0" },
          "100%": { "background-position": "calc(200px + 100%) 0" }
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-5px)" }
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" }
        },
        "glow": {
          "0%, 100%": { "box-shadow": "0 0 10px rgba(59, 130, 246, 0.3)" },
          "50%": { "box-shadow": "0 0 20px rgba(59, 130, 246, 0.6)" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out", 
        "scale-in": "scale-in 0.2s ease-out",
        "shimmer": "shimmer 1.5s infinite",
        "float": "float 3s ease-in-out infinite",
        "pulse-slow": "pulse-slow 2s infinite",
        "glow": "glow 2s ease-in-out infinite"
      },
      
      // Typography enhancements
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif"
        ],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace"
        ]
      },
      
      // Enhanced spacing scale
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // Enhanced z-index scale
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      
      // Glassmorphism backdrop filters
      backdropBlur: {
        'xs': '2px',
        'glass': 'var(--glass-backdrop)',
        '2xl': '40px',
        '3xl': '64px',
      },
      
      // Enhanced opacity scale for glass effects
      opacity: {
        '15': '0.15',
        '35': '0.35',
        '65': '0.65',
        '85': '0.85',
      },
      
      // Additional utilities for enterprise components
      content: {
        'empty-string': '""'
      }
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    
    // HERA DNA Glass Effect Plugin
    function({ addUtilities, theme }) {
      addUtilities({
        '.glass-panel': {
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          backdropFilter: 'var(--glass-backdrop)',
          WebkitBackdropFilter: 'var(--glass-backdrop)',
          boxShadow: 'var(--glass-shadow)',
          borderRadius: theme('borderRadius.md')
        },
        '.glass-panel-intense': {
          background: 'rgba(248, 250, 252, 0.4)',
          border: '1px solid rgba(229, 231, 235, 0.6)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: theme('borderRadius.md')
        },
        '.enterprise-card-base': {
          background: theme('colors.surface'),
          border: `1px solid ${theme('colors.border')}`,
          borderRadius: theme('borderRadius.enterprise'),
          boxShadow: theme('boxShadow.enterprise'),
          transition: 'all 0.2s ease'
        },
        '.enterprise-hover-lift': {
          '&:hover': {
            boxShadow: theme('boxShadow.enterprise-hover'),
            transform: 'translateY(-2px)'
          }
        }
      })
    },
    
    // HERA DNA Animation Plugin
    function({ addUtilities }) {
      addUtilities({
        '.animate-on-scroll': {
          opacity: '0',
          transform: 'translateY(20px)',
          transition: 'opacity 0.6s ease-out, transform 0.6s ease-out'
        },
        '.animate-on-scroll.visible': {
          opacity: '1',
          transform: 'translateY(0)'
        }
      })
    },
    
    // HERA DNA State Utilities Plugin
    function({ addUtilities }) {
      addUtilities({
        '.btn-state-primary': {
          backgroundColor: 'var(--color-primary)',
          color: 'var(--color-primary-fg)',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'var(--state-primary-hover)',
            transform: 'translateY(-1px)',
            boxShadow: 'var(--shadow-2)'
          },
          '&:active': {
            backgroundColor: 'var(--state-primary-active)',
            transform: 'translateY(0)',
            boxShadow: 'var(--shadow-1)'
          }
        },
        '.btn-state-secondary': {
          backgroundColor: 'var(--color-secondary)',
          color: 'var(--color-secondary-fg)',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'var(--state-secondary-hover)',
            transform: 'translateY(-1px)',
            boxShadow: 'var(--shadow-2)'
          },
          '&:active': {
            backgroundColor: 'var(--state-secondary-active)',
            transform: 'translateY(0)',
            boxShadow: 'var(--shadow-1)'
          }
        },
        '.btn-state-accent': {
          backgroundColor: 'var(--color-accent)',
          color: 'var(--color-accent-fg)',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'var(--state-accent-hover)',
            transform: 'translateY(-1px)',
            boxShadow: 'var(--shadow-2)'
          },
          '&:active': {
            backgroundColor: 'var(--state-accent-active)',
            transform: 'translateY(0)',
            boxShadow: 'var(--shadow-1)'
          }
        }
      })
    }
  ],
  
  // Safelist important HERA DNA classes to prevent purging
  safelist: [
    'glass-panel',
    'glass-panel-intense',
    'animate-fade-in',
    'animate-slide-in',
    'animate-scale-in',
    'animate-shimmer',
    'animate-float',
    'animate-pulse-slow',
    'animate-glow',
    'enterprise-card-base',
    'enterprise-hover-lift',
    'btn-state-primary',
    'btn-state-secondary',
    'btn-state-accent',
    'bg-brand-gradient'
  ]
}