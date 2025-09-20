'use client'

import React, { useState, useEffect, useCallback }
from 'react'
import FurnitureDarkSidebar from './FurnitureDarkSidebar'
import { cn }
from '@/lib/utils'
import { Menu, X, Armchair, Home, ShoppingCart, Factory, Grid3x3 }
from 'lucide-react'
import { Button }
from '@/components/ui/button'
import { NavigationLoadingProvider }
from '@/components/navigation/NavigationLoadingProvider'


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
      // Always open sidebar on desktop
      setSidebarOpen(!mobile)
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
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[var(--color-body)]/95 backdrop-blur-xl border-b border-[var(--color-border)]/50 z-40 flex items-center px-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-sidebar)]/30/50"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="ml-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[var(--color-accent-teal)] to-[var(--color-accent-indigo)] flex items-center justify-center">
              <Armchair className="h-5 w-5 text-white" />
            </div>
            <span className="text-[var(--color-text-primary)] font-semibold">Kerala Furniture</span>
          </div>
        </div>

        {/* Sidebar - Mobile Drawer */}
        <div
          className={cn(
            'fixed left-0 top-0 h-full z-50 transition-transform duration-300 lg:transition-none overflow-hidden',
            isMobile ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'
          )}
        >
          <FurnitureDarkSidebar onNavigate={handleSidebarClose} />
        </div>

        {/* Main Content */}
        <div
          className={cn(
            'transition-all duration-300 min-h-screen',
            // Mobile: top padding for header, bottom padding for nav
            'pt-16 pb-20 lg:pt-0 lg:pb-0',
            // Desktop: add left margin for sidebar
            !isMobile && 'lg:ml-20'
          )}
        >
          <div className="furniture-main-bg min-h-screen furniture-grid-pattern">{children}</div>
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && isMobile && (
          <div
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 lg:hidden"
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
              className="flex flex-col items-center justify-center h-16 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-sidebar)]/30/50"
              onClick={() => (window.location.href = '/furniture')}
            >
              <Home className="h-5 w-5 mb-1" />
              <span className="text-[10px] font-medium">Home</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center justify-center h-16 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-sidebar)]/30/50"
              onClick={() => (window.location.href = '/furniture/sales')}
            >
              <ShoppingCart className="h-5 w-5 mb-1" />
              <span className="text-[10px] font-medium">Sales</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center justify-center h-16 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-sidebar)]/30/50"
              onClick={() => (window.location.href = '/furniture/production')}
            >
              <Factory className="h-5 w-5 mb-1" />
              <span className="text-[10px] font-medium">Production</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center justify-center h-16 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-sidebar)]/30/50"
              onClick={() => setSidebarOpen(true)}
            >
              <Grid3x3 className="h-5 w-5 mb-1" />
              <span className="text-[10px] font-medium">More</span>
            </Button>
          </div>
        </div>
      </div>
    </NavigationLoadingProvider>
  )
}

export default React.memo(FurnitureDarkLayout)