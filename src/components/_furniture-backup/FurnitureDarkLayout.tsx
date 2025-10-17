'use client'

import React, { useState, useEffect, useCallback } from 'react'
import FurnitureDarkSidebar from './FurnitureDarkSidebar'
import FurnitureNavbar from './FurnitureNavbar'
import { cn } from '@/lib/utils'
import { Menu, X, Armchair, Home, ShoppingCart, Factory, Grid3x3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NavigationLoadingProvider } from '@/components/navigation/NavigationLoadingProvider'

interface FurnitureDarkLayoutProps {
  children: React.ReactNode
}

function FurnitureDarkLayout({ children }: FurnitureDarkLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [isMobile, setIsMobile] = useState(true)

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      // Don't auto-open sidebar anymore since we have top navbar
      setSidebarOpen(false)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)

    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Close sidebar when clicking on a link on mobile
  const handleSidebarClose = useCallback(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [isMobile])

  return (
    <NavigationLoadingProvider>
      <div className="relative min-h-screen bg-[var(--color-body)]">
        {/* Top Navbar - Full Width */}
        <FurnitureNavbar />

        {/* Sidebar - Mobile Drawer (Hidden by default since we have navbar) */}
        <div
          className={cn(
            'fixed left-0 top-0 h-full z-50 transition-transform duration-300 lg:transition-none overflow-hidden',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <FurnitureDarkSidebar onNavigate={handleSidebarClose} />
        </div>

        {/* Main Content - Reduced margins */}
        <div className="min-h-screen">
          <div className="furniture-main-bg min-h-screen furniture-grid-pattern">
            {/* Reduced padding for tighter layout */}
            <div className="px-4 py-4 lg:px-6 lg:py-6">
              {children}
            </div>
          </div>
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          />
        )}

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-body)]/95 backdrop-blur-xl border-t border-[var(--color-border)]/50 z-30">
          <div className="grid grid-cols-4 gap-1 p-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center justify-center h-16 text-[var(--color-icon-secondary)] hover:text-[var(--color-icon-accent)] hover:bg-[var(--color-hover)]"
              onClick={() => (window.location.href = '/furniture')}
            >
              <Home className="h-5 w-5 mb-1" />
              <span className="text-[10px] font-medium text-[var(--color-text-secondary)]">Home</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center justify-center h-16 text-[var(--color-icon-secondary)] hover:text-[var(--color-icon-accent)] hover:bg-[var(--color-hover)]"
              onClick={() => (window.location.href = '/furniture/sales')}
            >
              <ShoppingCart className="h-5 w-5 mb-1" />
              <span className="text-[10px] font-medium text-[var(--color-text-secondary)]">Sales</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center justify-center h-16 text-[var(--color-icon-secondary)] hover:text-[var(--color-icon-accent)] hover:bg-[var(--color-hover)]"
              onClick={() => (window.location.href = '/furniture/production')}
            >
              <Factory className="h-5 w-5 mb-1" />
              <span className="text-[10px] font-medium text-[var(--color-text-secondary)]">Production</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center justify-center h-16 text-[var(--color-icon-secondary)] hover:text-[var(--color-icon-accent)] hover:bg-[var(--color-hover)]"
              onClick={() => setSidebarOpen(true)}
            >
              <Grid3x3 className="h-5 w-5 mb-1" />
              <span className="text-[10px] font-medium text-[var(--color-text-secondary)]">More</span>
            </Button>
          </div>
        </div>
      </div>
    </NavigationLoadingProvider>
  )
}

export default React.memo(FurnitureDarkLayout)
