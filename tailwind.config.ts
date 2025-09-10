// tailwind.config.ts
import formsPlugin from '@tailwindcss/forms'
import typographyPlugin from '@tailwindcss/typography'
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // HERA Universal Brand Colors - AI + ERP + Modern Fusion
      colors: {
        // Primary Sage Green - Wellness & Growth
        sage: {
          50: '#f6f8f6',
          100: '#e9f1ea',
          200: '#d4e3d6',
          300: '#b8cebb',
          400: '#A8C3A3', // Primary Sage Green
          500: '#8bb088',
          600: '#6f936d',
          700: '#5a7757',
          800: '#4a5f47',
          900: '#3d4e3b',
          950: '#1f2720',
        },
        // Secondary Dusty Rose - Beauty & Elegance  
        'dusty-rose': {
          50: '#faf6f6',
          100: '#f1e9e9',
          200: '#e7d5d5',
          300: '#D4A5A5', // Secondary Dusty Rose
          400: '#c88a8a',
          500: '#b76e6e',
          600: '#a55656',
          700: '#8a4646',
          800: '#733d3d',
          900: '#603636',
          950: '#331a1a',
        },
        // Accent Champagne Gold - Luxury & Premium
        champagne: {
          50: '#fefdf9',
          100: '#fdfaf0',
          200: '#faf4db',
          300: '#f5e9b8',
          400: '#eed97f',
          500: '#D4AF37', // Champagne Gold
          600: '#c9a332',
          700: '#a8842b',
          800: '#896a29',
          900: '#715626',
          950: '#402d12',
        },
        // Legacy HERA colors for compatibility
        hera: {
          50: '#f6f8f6',
          100: '#e9f1ea', 
          200: '#d4e3d6',
          300: '#b8cebb',
          400: '#A8C3A3',
          500: '#8bb088', // Now maps to sage
          600: '#6f936d',
          700: '#5a7757',
          800: '#4a5f47',
          900: '#3d4e3b',
          950: '#1f2720',
        },
        'hera-cyan': {
          50: '#faf6f6',
          100: '#f1e9e9',
          200: '#e7d5d5',
          300: '#D4A5A5',
          400: '#c88a8a',
          500: '#b76e6e', // Now maps to dusty-rose
          600: '#a55656',
          700: '#8a4646',
          800: '#733d3d',
          900: '#603636',
          950: '#331a1a',
        },
        'hera-emerald': {
          50: '#f6f8f6',
          100: '#e9f1ea',
          200: '#d4e3d6',
          300: '#b8cebb',
          400: '#A8C3A3',
          500: '#8bb088', // Sage green
          600: '#6f936d',
          700: '#5a7757',
          800: '#4a5f47',
          900: '#3d4e3b',
          950: '#1f2720',
        },
        'hera-amber': {
          50: '#fefdf9',
          100: '#fdfaf0',
          200: '#faf4db',
          300: '#f5e9b8',
          400: '#eed97f',
          500: '#D4AF37', // Champagne gold
          600: '#c9a332',
          700: '#a8842b',
          800: '#896a29',
          900: '#715626',
          950: '#402d12',
        }
      },
      
      // HERA-specific gradients with new AI + ERP + Modern fusion colors
      backgroundImage: {
        'hera-gradient': 'linear-gradient(45deg, #A8C3A3, #D4A5A5, #D4AF37)', // Sage → Dusty Rose → Champagne
        'hera-gradient-dark': 'linear-gradient(45deg, #5a7757, #8a4646, #a8842b)', // Darker variants
        'hera-mesh': 'radial-gradient(circle at 1px 1px, rgba(168, 195, 163, 0.15) 1px, transparent 0)', // Sage mesh
        'salon-gradient': 'linear-gradient(135deg, #A8C3A3 0%, #D4A5A5 50%, #D4AF37 100%)', // Hair Talkz salon
        'wellness-gradient': 'linear-gradient(90deg, #f6f8f6, #A8C3A3)', // Sage wellness gradient
        'luxury-gradient': 'linear-gradient(90deg, #D4A5A5, #D4AF37)', // Rose to gold luxury
      },
      
      // Enhanced typography for business applications
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      
      // Business-focused spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // Professional shadows
      boxShadow: {
        'hera-sm': '0 1px 2px 0 rgba(59, 130, 246, 0.05)',
        'hera': '0 4px 6px -1px rgba(59, 130, 246, 0.1), 0 2px 4px -1px rgba(59, 130, 246, 0.06)',
        'hera-lg': '0 10px 15px -3px rgba(59, 130, 246, 0.1), 0 4px 6px -2px rgba(59, 130, 246, 0.05)',
        'hera-xl': '0 20px 25px -5px rgba(59, 130, 246, 0.1), 0 10px 10px -5px rgba(59, 130, 246, 0.04)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
      
      // Animation for modern UX
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'fadeIn': 'fadeIn 0.6s ease-in-out forwards',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      
      // Professional border radius
      borderRadius: {
        'hera': '12px',
        'hera-lg': '16px',
        'hera-xl': '20px',
      },
    },
  },
  plugins: [
    formsPlugin,
    typographyPlugin,
  ],
}

export default config