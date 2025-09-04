import type { Config } from 'tailwindcss'

const config: Config = {
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
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // HERA Salon Brand Colors
        hera: {
          // Primary Royal Purple
          primary: {
            50: '#EEF2FF',
            100: '#E0E7FF', 
            200: '#C7D2FE',
            300: '#A5B4FC',
            400: '#8B80F9',
            500: '#7C7CF4',
            600: '#6366F1',
            700: '#4338CA',
            800: '#3730A3',
            900: '#312E81'
          },
          // Vibrant Pink
          pink: {
            50: '#FDF2F8',
            100: '#FCE7F3',
            200: '#FBCFE8', 
            300: '#F9A8D4',
            400: '#F472B6',
            500: '#EC4899',
            600: '#DB2777',
            700: '#BE185D',
            800: '#9D174D',
            900: '#831843'
          },
          // Fresh Teal Accent
          teal: {
            50: '#ECFDF5',
            100: '#D1FAE5',
            200: '#A7F3D0',
            300: '#6EE7B7', 
            400: '#34D399',
            500: '#10B981',
            600: '#059669',
            700: '#047857',
            800: '#065F46',
            900: '#064E3B'
          },
          // Functional Colors
          success: '#22C55E',
          warning: '#F59E0B', 
          danger: '#EF4444',
          info: '#3B82F6',
          // Neutrals
          bg: {
            50: '#F9FAFB',
            100: '#F3F4F6',
            200: '#E5E7EB'
          },
          line: {
            200: '#E5E7EB',
            300: '#D1D5DB'
          },
          ink: {
            900: '#111827',
            700: '#374151',
            600: '#4B5563',
            500: '#6B7280'
          }
        }
      },
      borderRadius: {
        lg: "14px",
        md: "10px", 
        sm: "6px",
        xl: "20px",
        "2xl": "24px"
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont", 
          "Segoe UI",
          "Roboto",
          "SF Pro Text",
          "system-ui",
          "sans-serif"
        ],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem'
      },
      boxShadow: {
        'hera-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'hera-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'hera-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'hera-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'hera-2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      },
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
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "scale-out": {
          "0%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(0.9)" },
        },
        "slide-in-from-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-out-to-right": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-out": "fade-out 0.2s ease-out", 
        "scale-in": "scale-in 0.2s ease-out",
        "scale-out": "scale-out 0.2s ease-out",
        "slide-in-from-right": "slide-in-from-right 0.3s ease-out",
        "slide-out-to-right": "slide-out-to-right 0.3s ease-out",
      },
    },
  },
  safelist: [
    // HERA Salon semantic utilities that appear dynamically
    'bg-hera-primary-50', 'bg-hera-primary-100', 'bg-hera-primary-600', 'bg-hera-primary-700',
    'bg-hera-pink-50', 'bg-hera-pink-100', 'bg-hera-pink-500', 'bg-hera-pink-600', 
    'bg-hera-teal-50', 'bg-hera-teal-100', 'bg-hera-teal-500', 'bg-hera-teal-600',
    'text-hera-primary-600', 'text-hera-primary-700', 'text-hera-pink-600', 'text-hera-teal-600',
    'text-hera-ink-900', 'text-hera-ink-700', 'text-hera-ink-600', 'text-hera-ink-500',
    'border-hera-primary-400', 'border-hera-pink-400', 'border-hera-teal-400',
    'border-hera-line-200', 'border-hera-line-300',
    'ring-hera-primary-400', 'ring-hera-pink-400', 'ring-hera-teal-400',
    'shadow-hera-sm', 'shadow-hera-md', 'shadow-hera-lg', 'shadow-hera-xl',
    // State classes
    'hover:bg-hera-primary-700', 'hover:bg-hera-pink-600', 'hover:bg-hera-teal-600',
    'focus:ring-2', 'focus:ring-offset-2', 'focus:outline-none',
    'disabled:opacity-50', 'disabled:pointer-events-none',
    // Animation classes
    'animate-fade-in', 'animate-scale-in', 'animate-slide-in-from-right',
    // Typography classes  
    'text-5xl', 'text-4xl', 'text-2xl', 'text-xl', 'text-lg', 'text-base', 'text-sm',
    'font-bold', 'font-semibold', 'font-medium',
    'tracking-tight', 'leading-7', 'leading-relaxed'
  ],
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config