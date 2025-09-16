// ================================================================================
// SALON THEME PROVIDER
// Smart Code: HERA.UI.THEME.PROVIDER.v1
// Provides beautiful salon theme classes and utilities
// ================================================================================

'use client'

import React, { createContext, useContext } from 'react'
import { cn } from '@/src/lib/utils'

interface SalonThemeContextType {
  // Page backgrounds
  pageBackground: string
  
  // Card styles
  cardClass: string
  glassCard: string
  
  // Button styles
  primaryButton: string
  secondaryButton: string
  ghostButton: string
  
  // Status styles
  getStatusClass: (status: string) => string
  
  // Text styles
  gradientText: string
  mutedText: string
  
  // Input styles
  inputClass: string
  
  // Navigation
  navItem: string
  navItemActive: string
}

const salonTheme: SalonThemeContextType = {
  // Beautiful gradient backgrounds
  pageBackground: 'bg-gradient-to-br from-purple-50 via-pink-50 to-white dark:from-gray-900 dark:via-purple-950/20 dark:to-gray-900',
  
  // Card styles with glass effect
  cardClass: cn(
    'bg-white/80 dark:bg-gray-900/80',
    'backdrop-blur-xl',
    'border border-purple-200/50 dark:border-purple-800/50',
    'shadow-xl shadow-purple-500/10',
    'transition-all duration-300',
    'hover:shadow-2xl hover:shadow-purple-500/20',
    'hover:-translate-y-1'
  ),
  
  glassCard: cn(
    'bg-white/70 dark:bg-gray-900/70',
    'backdrop-blur-2xl backdrop-saturate-200',
    'border border-purple-200/20 dark:border-purple-800/20',
    'shadow-xl'
  ),
  
  // Button styles with gradients
  primaryButton: cn(
    'relative overflow-hidden',
    'bg-gradient-to-r from-purple-500 to-pink-500',
    'hover:from-purple-600 hover:to-pink-600',
    'text-white font-medium',
    'shadow-lg shadow-purple-500/25',
    'hover:shadow-xl hover:shadow-purple-500/30',
    'transition-all duration-200',
    'hover:scale-105'
  ),
  
  secondaryButton: cn(
    'bg-gradient-to-r from-rose-400 to-amber-400',
    'hover:from-rose-500 hover:to-amber-500',
    'text-white font-medium',
    'shadow-lg shadow-rose-500/25',
    'transition-all duration-200'
  ),
  
  ghostButton: cn(
    'text-gray-700 dark:text-gray-300',
    'hover:bg-purple-100/50 dark:hover:bg-purple-900/30',
    'transition-colors duration-200'
  ),
  
  // Status styles with perfect contrast
  getStatusClass: (status: string) => {
    const statusClasses: Record<string, string> = {
      pending: 'bg-amber-100 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100 border border-amber-300 dark:border-amber-800',
      confirmed: 'bg-blue-100 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 border border-blue-300 dark:border-blue-800',
      arrived: 'bg-purple-100 dark:bg-purple-950/30 text-purple-900 dark:text-purple-100 border border-purple-300 dark:border-purple-800',
      in_service: 'bg-pink-100 dark:bg-pink-950/30 text-pink-900 dark:text-pink-100 border border-pink-300 dark:border-pink-800',
      in_progress: 'bg-pink-100 dark:bg-pink-950/30 text-pink-900 dark:text-pink-100 border border-pink-300 dark:border-pink-800',
      completed: 'bg-green-100 dark:bg-green-950/30 text-green-900 dark:text-green-100 border border-green-300 dark:border-green-800',
      cancelled: 'bg-gray-100 dark:bg-gray-950/30 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-800',
      no_show: 'bg-red-100 dark:bg-red-950/30 text-red-900 dark:text-red-100 border border-red-300 dark:border-red-800',
    }
    
    return statusClasses[status] || statusClasses.pending
  },
  
  // Text styles
  gradientText: 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold',
  mutedText: 'text-gray-600 dark:text-gray-400',
  
  // Input styles
  inputClass: cn(
    'bg-white dark:bg-gray-900',
    'border-purple-200 dark:border-purple-800',
    'focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20',
    'placeholder-gray-400 dark:placeholder-gray-500',
    'transition-colors duration-200'
  ),
  
  // Navigation styles
  navItem: cn(
    'px-4 py-2 rounded-lg',
    'transition-all duration-200',
    'hover:bg-gradient-to-r hover:from-purple-100/50 hover:to-pink-100/50',
    'dark:hover:from-purple-900/30 dark:hover:to-pink-900/30'
  ),
  
  navItemActive: cn(
    'px-4 py-2 rounded-lg',
    'bg-gradient-to-r from-purple-100 to-pink-100',
    'dark:from-purple-900/50 dark:to-pink-900/50',
    'font-medium'
  ),
}

const SalonThemeContext = createContext<SalonThemeContextType>(salonTheme)

export function SalonThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <SalonThemeContext.Provider value={salonTheme}>
      {children}
    </SalonThemeContext.Provider>
  )
}

export function useSalonTheme() {
  const context = useContext(SalonThemeContext)
  if (!context) {
    throw new Error('useSalonTheme must be used within SalonThemeProvider')
  }
  return context
}

// Export theme utilities
export const salonClasses = {
  // Quick access to common patterns
  page: salonTheme.pageBackground,
  card: salonTheme.cardClass,
  glass: salonTheme.glassCard,
  primaryBtn: salonTheme.primaryButton,
  secondaryBtn: salonTheme.secondaryButton,
  ghostBtn: salonTheme.ghostButton,
  gradient: salonTheme.gradientText,
  muted: salonTheme.mutedText,
  input: salonTheme.inputClass,
  nav: salonTheme.navItem,
  navActive: salonTheme.navItemActive,
  status: salonTheme.getStatusClass,
}