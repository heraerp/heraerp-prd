'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Moon, Sun, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function SalonProPage() {
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | null>(null)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    // Check if user has a saved preference
    const savedTheme = localStorage.getItem('salon-theme-preference') as 'light' | 'dark'
    if (savedTheme) {
      // Auto-redirect to their preferred theme
      router.push(savedTheme === 'dark' ? '/salon-data' : '/salon')
    }
  }, [router])

  const selectTheme = (theme: 'light' | 'dark') => {
    setSelectedTheme(theme)
    localStorage.setItem('salon-theme-preference', theme)
    // Redirect to the appropriate page
    setTimeout(() => {
      router.push(theme === 'dark' ? '/salon-data' : '/salon')
    }, 500)
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-violet-50 to-cyan-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center mb-6">
            <Sparkles className="h-12 w-12 text-violet-600 mr-3" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-600 to-cyan-600 text-transparent bg-clip-text">
              Salon Pro Experience
            </h1>
          </div>
          <p className="text-lg text-gray-700 font-medium">
            Choose your preferred interface theme
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Light Theme Option */}
          <Card 
            className={`p-6 cursor-pointer transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1 ${
              selectedTheme === 'light' ? 'ring-4 ring-violet-500 shadow-2xl' : ''
            }`}
            onClick={() => selectTheme('light')}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Light Theme</h3>
              <Sun className="h-8 w-8 text-yellow-500" />
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-gray-700">Professional business interface</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-gray-700">Sidebar navigation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-gray-700">Clean, minimal design</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-gray-700">Best for desktop use</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <img 
                src="/api/placeholder/400/250" 
                alt="Light theme preview" 
                className="rounded w-full"
              />
            </div>

            <Button 
              className="w-full bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white"
              onClick={(e) => {
                e.stopPropagation()
                selectTheme('light')
              }}
            >
              Use Light Theme
            </Button>
          </Card>

          {/* Dark Theme Option */}
          <Card 
            className={`p-6 cursor-pointer transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1 ${
              selectedTheme === 'dark' ? 'ring-4 ring-cyan-500 shadow-2xl' : ''
            }`}
            onClick={() => selectTheme('dark')}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Dark Theme</h3>
              <Moon className="h-8 w-8 text-purple-600" />
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                <span className="text-gray-700">Modern gradient design</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                <span className="text-gray-700">Tab-based navigation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                <span className="text-gray-700">Vibrant gradients</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                <span className="text-gray-700">Mobile-optimized</span>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 mb-6">
              <img 
                src="/api/placeholder/400/250" 
                alt="Dark theme preview" 
                className="rounded w-full opacity-90"
              />
            </div>

            <Button 
              className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white"
              onClick={(e) => {
                e.stopPropagation()
                selectTheme('dark')
              }}
            >
              Use Dark Theme
            </Button>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            You can switch themes anytime from the settings menu
          </p>
        </div>
      </div>
    </div>
  )
}