'use client'

/**
 * Universal Layout Component
 * Smart Code: HERA.UNIVERSAL.LAYOUT.v1
 * 
 * Dynamic layout that adapts to industry context and navigation state
 * Integrates authentication, navigation, and theme management
 */

import React, { useState, useEffect } from 'react'
import { useNavigationConfig } from '@/hooks/useNavigationConfig'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { DynamicEnterpriseNavigation } from '@/components/navigation/DynamicEnterpriseNavigation'
import { Button } from '@/components/ui/button'

interface UniversalLayoutProps {
  children: React.ReactNode
  showSidebar?: boolean
  showBreadcrumbs?: boolean
  showTopBar?: boolean
  className?: string
}

export function UniversalLayout({
  children,
  showSidebar = false,  // Default to false to match existing structure
  showBreadcrumbs = true,
  showTopBar = true,
  className = ''
}: UniversalLayoutProps) {
  const navigation = useNavigationConfig()
  const { user, organization, isAuthenticated, contextLoading } = useHERAAuth()
  const [mounted, setMounted] = useState(false)

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Apply industry theme to document
  useEffect(() => {
    if (mounted && navigation.currentTheme && typeof document !== 'undefined') {
      const root = document.documentElement
      Object.entries(navigation.themeVariables).forEach(([property, value]) => {
        root.style.setProperty(property, value)
      })

      // Cleanup on unmount or theme change
      return () => {
        Object.keys(navigation.themeVariables).forEach(property => {
          root.style.removeProperty(property)
        })
      }
    }
  }, [mounted, navigation.themeVariables, navigation.currentTheme])

  // Show loading state during authentication
  if (!mounted || contextLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading HERA...</p>
        </div>
      </div>
    )
  }

  // Show authentication required state
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please log in to access HERA.</p>
          <a 
            href="/auth/enterprise-signin"
            className="inline-flex items-center px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    )
  }

  // Show organization required state
  if (!organization?.id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Organization Required</h1>
          <p className="text-gray-600 mb-6">Please select an organization to continue.</p>
          <Button className="bg-violet-600 hover:bg-violet-700">
            Select Organization
          </Button>
        </div>
      </div>
    )
  }

  // Apply industry theme styles
  const themeStyles = navigation.currentTheme ? {
    backgroundColor: navigation.currentTheme.hero_background?.includes('gradient') 
      ? undefined 
      : navigation.currentTheme.hero_background
  } : {}

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`} style={themeStyles}>
      {/* Main Content Area - No sidebar, full width like existing structure */}
      <div className="flex flex-col min-h-screen">
        {/* Use dynamic navigation that reads from JSON config - only when authenticated */}
        {isAuthenticated && organization?.id && <DynamicEnterpriseNavigation />}

        {/* Page Content */}
        <main className="flex-1 relative">
          {/* Route Error Handling */}
          {!navigation.isValidRoute && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 m-6">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Invalid Route
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{navigation.routeError}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Page Content */}
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <span>© 2024 HERA Enterprise</span>
                {navigation.currentIndustry && (
                  <>
                    <span>•</span>
                    <span>{navigation.currentIndustry.name} Edition</span>
                  </>
                )}
                <span>•</span>
                <a href="/privacy" className="hover:text-gray-700">Privacy</a>
                <span>•</span>
                <a href="/terms" className="hover:text-gray-700">Terms</a>
                <span>•</span>
                <a href="/support" className="hover:text-gray-700">Support</a>
              </div>
              <div className="flex items-center space-x-2">
                <span>Version 3.0.0</span>
                <span>•</span>
                <span className="text-green-600">System Healthy</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default UniversalLayout