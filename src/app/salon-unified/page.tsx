'use client'

import React, { useState, useEffect } from 'react'
import { ThemeProviderDNA, useTheme } from '@/lib/dna/theme/theme-provider-dna'
import dynamic from 'next/dynamic'

// Dynamically import the appropriate version based on theme
const SalonLightTheme = dynamic(() => import('../salon-backup/page'), {
  ssr: false,
})

const SalonDarkTheme = dynamic(() => import('../salon-data-backup/page'), {
  ssr: false,
})

function UnifiedSalonContent() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  // Theme toggle button that floats on the page
  const ThemeToggle = () => (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="fixed bottom-4 right-4 z-50 p-3 rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  )

  return (
    <>
      {theme === 'dark' ? <SalonDarkTheme /> : <SalonLightTheme />}
      <ThemeToggle />
    </>
  )
}

export default function UnifiedSalonPage() {
  return (
    <ThemeProviderDNA>
      <UnifiedSalonContent />
    </ThemeProviderDNA>
  )
}