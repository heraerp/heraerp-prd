'use client'
import React, { createContext, useContext, useEffect } from 'react'

type Theme = 'dark' // Only dark for public pages
type Ctx = { theme: Theme; setTheme: (t: Theme) => void }

const ThemeCtx = createContext<Ctx | null>(null)

export function useTheme() {
  const ctx = useContext(ThemeCtx)
  if (!ctx) throw new Error('useTheme must be used within PublicThemeProvider')
  return ctx
}

export default function PublicThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Force dark mode on mount
    const root = document.documentElement
    root.classList.remove('light')
    root.classList.add('dark')

    // Override any theme changes
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const root = document.documentElement
          if (!root.classList.contains('dark')) {
            root.classList.remove('light')
            root.classList.add('dark')
          }
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

  // No-op setTheme for public pages
  const handleSet = (t: Theme) => {
    // Always dark, ignore any attempts to change
    return
  }

  return (
    <ThemeCtx.Provider value={{ theme: 'dark', setTheme: handleSet }}>{children}</ThemeCtx.Provider>
  )
}
