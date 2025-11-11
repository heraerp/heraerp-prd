/**
 * Fiori++ Design Tokens
 * 
 * Glassmorphism + soft motion design system
 * Enterprise-grade theming and animation tokens
 */

// Animation presets using Framer Motion
import { motion } from "framer-motion"

export const fadeIn = { 
  initial: { opacity: 0, y: 8 }, 
  animate: { opacity: 1, y: 0, transition: { duration: 0.24, ease: 'easeOut' } } 
}

export const fadeSlide = (delay = 0) => ({ 
  initial: { opacity: 0, y: 12 }, 
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, delay } }
})

export const staggerChildren = {
  animate: { transition: { staggerChildren: 0.1 } }
}

export const slideInFromRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } }
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } }
}

// Glass morphism utilities
export const glassStyles = {
  card: "rounded-2xl bg-white/60 dark:bg-slate-900/40 backdrop-blur-md shadow-glass border border-white/20",
  cardHover: "hover:bg-white/70 dark:hover:bg-slate-900/50 transition-all duration-200",
  section: "rounded-xl border border-black/10 p-4 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm",
  toolbar: "bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm border border-white/30",
  modal: "bg-white/90 dark:bg-slate-900/80 backdrop-blur-lg shadow-2xl border border-white/40"
}

// Enterprise color palette (extends Tailwind)
export const brandColors = {
  50: '#EEF5FF',
  100: '#DCEBFF', 
  200: '#BAD1FF',
  300: '#8FB3FF',
  400: '#5E90FF',
  500: '#3B82F6', // Primary brand
  600: '#2463EB',
  700: '#1E40AF',
  800: '#172554',
  900: '#0B1020'
}

// Shadow presets
export const shadowPresets = {
  glass: '0 4px 24px rgba(15, 23, 42, 0.18)',
  soft: '0 6px 20px rgba(0,0,0,0.08)',
  elevated: '0 8px 32px rgba(15, 23, 42, 0.12)',
  floating: '0 12px 40px rgba(15, 23, 42, 0.16)'
}

// Motion timing functions
export const motionEasing = {
  soft: 'cubic-bezier(.25,.1,.25,1)',
  snappy: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bouncy: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
}

// Responsive breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px', 
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
}

// Typography scale
export const typography = {
  hero: 'text-4xl md:text-5xl lg:text-6xl font-bold',
  h1: 'text-3xl md:text-4xl font-bold',
  h2: 'text-2xl md:text-3xl font-semibold',
  h3: 'text-xl md:text-2xl font-semibold',
  h4: 'text-lg md:text-xl font-medium',
  body: 'text-base',
  small: 'text-sm',
  caption: 'text-xs'
}