'use client'

/**
 * MatrixIT World Branding Provider - Database-driven Matrix Gold theme
 * Smart Code: HERA.RETAIL.MATRIXITWORLD.BRANDING.PROVIDER.v1
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { brandingEngine } from '@/lib/platform/branding-engine'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

interface BrandingContextType {
  isLoaded: boolean
  theme: any
  organizationName: string
}

const MatrixITBrandingContext = createContext<BrandingContextType>({
  isLoaded: false,
  theme: null,
  organizationName: 'MatrixIT World'
})

export function MatrixITWorldBrandingProvider({ children }: { children: ReactNode }) {
  const { organization } = useHERAAuth()
  const [isLoaded, setIsLoaded] = useState(false)
  const [theme, setTheme] = useState(null)
  const [organizationName, setOrganizationName] = useState('MatrixIT World')

  // Initialize Matrix Gold theme from database
  useEffect(() => {
    if (organization?.id) {
      initializeMatrixGoldTheme()
    }
  }, [organization?.id])

  const initializeMatrixGoldTheme = async () => {
    try {
      // Initialize with Matrix Gold theme
      const branding = await brandingEngine.initializeBranding(organization.id)
      
      if (branding) {
        setTheme(branding.theme)
        setOrganizationName(branding.organization_name || 'MatrixIT World')
      }
      
      // Apply Matrix Gold CSS variables
      const matrixGoldTheme = {
        primary_color: '#F5C400',      // Matrix Gold
        secondary_color: '#4A4A4A',    // Charcoal Gray
        background_color: '#FFFFFF',    // Pure White
        surface_color: '#FFF8E1',      // Cream Yellow
        text_primary: '#2C2C2C',       // Matrix Black
        text_secondary: '#757575',      // Neutral Gray
        accent_color: '#F5C400',       // Matrix Gold accent
        success_color: '#4CAF50',
        warning_color: '#FF9800',
        error_color: '#F44336',
        border_color: '#E0E0E0',
        font_family_heading: 'Inter',
        font_family_body: 'Inter'
      }
      
      // Inject CSS variables
      brandingEngine.injectCSSVariables(matrixGoldTheme)
      
      setIsLoaded(true)
    } catch (error) {
      console.error('Failed to initialize Matrix Gold theme:', error)
      // Fallback to default Matrix Gold CSS
      setDefaultMatrixGoldCSS()
      setIsLoaded(true)
    }
  }

  const setDefaultMatrixGoldCSS = () => {
    // Fallback Matrix Gold CSS variables
    const root = document.documentElement
    root.style.setProperty('--brand-primary', '#F5C400')
    root.style.setProperty('--brand-secondary', '#4A4A4A')
    root.style.setProperty('--brand-background-color', '#FFFFFF')
    root.style.setProperty('--brand-surface-color', '#FFF8E1')
    root.style.setProperty('--brand-text-primary', '#2C2C2C')
    root.style.setProperty('--brand-text-secondary', '#757575')
    root.style.setProperty('--brand-accent', '#F5C400')
    root.style.setProperty('--brand-success', '#4CAF50')
    root.style.setProperty('--brand-warning', '#FF9800')
    root.style.setProperty('--brand-error', '#F44336')
    root.style.setProperty('--brand-border', '#E0E0E0')
  }

  return (
    <MatrixITBrandingContext.Provider value={{ isLoaded, theme, organizationName }}>
      {/* Loading state with Matrix Gold preview */}
      {!isLoaded && (
        <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center mb-4 mx-auto animate-pulse">
              <span className="text-2xl">⚡</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">MatrixIT World</h2>
            <p className="text-gray-600">Loading Matrix Gold theme...</p>
          </div>
        </div>
      )}
      
      {/* Main content with Matrix Gold theme applied */}
      <div 
        className="min-h-screen"
        style={{
          backgroundColor: 'var(--brand-background-color, #ffffff)',
          color: 'var(--brand-text-primary, #2c2c2c)'
        }}
      >
        {children}
      </div>
    </MatrixITBrandingContext.Provider>
  )
}

export function useMatrixITBranding() {
  const context = useContext(MatrixITBrandingContext)
  if (!context) {
    throw new Error('useMatrixITBranding must be used within MatrixITWorldBrandingProvider')
  }
  return context
}