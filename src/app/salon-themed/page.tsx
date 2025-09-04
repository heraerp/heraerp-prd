'use client'

import React, { useState, useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'

export default function ThemedSalonPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check if user has a theme preference
    const savedTheme = localStorage.getItem('salon-theme') as 'light' | 'dark'
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle('dark', savedTheme === 'dark')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('salon-theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  // Theme toggle button
  const ThemeToggle = () => (
    <button
      onClick={toggleTheme}
      className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 group"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-6 h-6">
        {theme === 'dark' ? (
          <Sun className="w-6 h-6 animate-spin-slow group-hover:animate-spin" />
        ) : (
          <Moon className="w-6 h-6 group-hover:animate-pulse" />
        )}
      </div>
      <span className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        Switch to {theme === 'dark' ? 'light' : 'dark'} mode
      </span>
    </button>
  )

  return (
    <div className="relative">
      {/* Dynamic iframe to load the appropriate version */}
      <iframe
        src={theme === 'dark' ? '/salon-data' : '/salon'}
        className="w-full h-screen border-0"
        title="Salon Interface"
      />
      <ThemeToggle />
    </div>
  )
}