'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface SalonThemeContextType {
  salonTheme: 'light' | 'dark'
  toggleSalonTheme: () => void
}

const SalonThemeContext = createContext<SalonThemeContextType | undefined>(undefined)

export function useSalonTheme() {
  const context = useContext(SalonThemeContext)
  if (!context) {
    throw new Error('useSalonTheme must be used within SalonThemeProvider')
  }
  return context
}

export function SalonThemeProvider({ children }: { children: React.ReactNode }) {
  const [salonTheme, setSalonTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('salon-theme') as 'light' | 'dark'
    if (savedTheme) {
      setSalonTheme(savedTheme)
    }
  }, [])

  const toggleSalonTheme = () => {
    const newTheme = salonTheme === 'light' ? 'dark' : 'light'
    setSalonTheme(newTheme)
    localStorage.setItem('salon-theme', newTheme)
  }

  if (!mounted) {
    return null
  }

  return (
    <SalonThemeContext.Provider value={{ salonTheme, toggleSalonTheme }}>
      {children}
    </SalonThemeContext.Provider>
  )
}