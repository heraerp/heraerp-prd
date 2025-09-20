/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}', 
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
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
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          50: "#F3F0FF",
          100: "#E8DDFF", 
          200: "#D6C7FF",
          300: "#BFA5FF",
          400: "#A476FF",
          500: "var(--color-primary)", // #6B3FA0
          600: "var(--color-primary-600)", // #5E3791
          700: "var(--color-primary-700)", // #512F82
          800: "#423071",
          900: "#3A2B5F",
          950: "#241945",
          foreground: "var(--color-white)",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
          50: "#FDF2F8",
          100: "#FCE7F3",
          200: "#FBCFE8", 
          300: "#F9A8D4",
          400: "#F472B6",
          500: "var(--color-secondary)", // #F15BB5
          600: "var(--color-secondary-600)", // #DC4AA4
          700: "#BE185D",
          800: "#9D174D",
          900: "#831843",
          950: "#500724",
          foreground: "var(--color-white)",
        },
        salon: {
          dark: "var(--color-dark)", // #472663
          light: "var(--color-light)", // #E4C6F6
          bg: "var(--color-bg-light)", // #F9F6FA
          text: "var(--color-text-dark)", // #2A2730
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
        // CivicFlow Theme Colors
        bg: "rgb(var(--bg) / <alpha-value>)",
        panel: "rgb(var(--panel) / <alpha-value>)",
        "panel-alt": "rgb(var(--panel-alt) / <alpha-value>)",
        "text-100": "rgb(var(--text-100) / <alpha-value>)",
        "text-300": "rgb(var(--text-300) / <alpha-value>)",
        "text-500": "rgb(var(--text-500) / <alpha-value>)",
        "accent-soft": "rgb(var(--accent-soft-bg) / 0.1)",
        "primary-hover": "rgb(var(--primary) / 0.8)",
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      backgroundImage: {
        'gradient-elegant': 'var(--gradient-elegant)',
      },
      boxShadow: {
        'salon': '0 4px 14px 0 rgba(107, 63, 160, 0.15)',
        'salon-lg': '0 10px 25px 0 rgba(107, 63, 160, 0.2)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}