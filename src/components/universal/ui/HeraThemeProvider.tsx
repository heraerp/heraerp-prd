'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  actualTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function HeraThemeProvider({
  children,
  defaultTheme = 'dark',
  storageKey = 'hera-theme'
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('dark')
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Load theme from localStorage or use default
    const savedTheme = localStorage.getItem(storageKey) as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      // Ensure dark theme is set as default if nothing is saved
      setTheme('dark')
      localStorage.setItem(storageKey, 'dark')
    }
  }, [storageKey, mounted])

  useEffect(() => {
    if (!mounted) return

    const root = window.document.documentElement

    // Remove existing theme classes
    root.classList.remove('light', 'dark')

    let effectiveTheme: 'light' | 'dark' = 'dark'

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      effectiveTheme = systemTheme
    } else {
      effectiveTheme = theme
    }

    // Apply theme class
    root.classList.add(effectiveTheme)
    setActualTheme(effectiveTheme)

    // Save to localStorage
    localStorage.setItem(storageKey, theme)
  }, [theme, storageKey, mounted])

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted || theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setActualTheme(e.matches ? 'dark' : 'light')
      const root = window.document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, mounted])

  // Render children with fallback during hydration
  if (!mounted) {
    return (
      <ThemeContext.Provider
        value={{
          theme: defaultTheme,
          setTheme,
          actualTheme: defaultTheme === 'system' ? 'dark' : defaultTheme
        }}
      >
        {children}
      </ThemeContext.Provider>
    )
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// Theme Toggle Component - Wrapper for compatibility
export function HeraThemeToggle({ className }: { className?: string }) {
  // Import dynamically to avoid SSR issues
  const [ThemeToggle, setThemeToggle] = useState<React.ComponentType<{
    className?: string
  }> | null>(null)

  useEffect(() => {
    // Dynamically import the ThemeToggle component
    import('@/app/components/ThemeToggle')
      .then(mod => {
        setThemeToggle(() => mod.default)
      })
      .catch(() => {
        // If import fails, provide a fallback
        console.warn('ThemeToggle component not available')
      })
  }, [])

  // Render the imported component or a simple fallback
  if (ThemeToggle) {
    return <ThemeToggle className={className} />
  }

  // Fallback button if ThemeToggle is not available
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 bg-background hover:bg-accent hover:text-accent-foreground border border-border ${className || ''}
      `}
      title="Theme toggle"
    >
      <span className="text-base">🌙</span>
      <span>Theme</span>
    </button>
  )
}
