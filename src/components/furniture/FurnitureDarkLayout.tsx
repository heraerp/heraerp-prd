'use client'

import React, { useState, useEffect, useCallback } from 'react'
import FurnitureDarkSidebar from './FurnitureDarkSidebar'
import { cn } from '@/lib/utils'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NavigationLoadingProvider } from '@/components/navigation/NavigationLoadingProvider'

interface FurnitureDarkLayoutProps {
  children: React.ReactNode
}

function FurnitureDarkLayout({ children }: FurnitureDarkLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false) // Default closed on all devices
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024 // Use lg breakpoint instead of md
      setIsMobile(mobile)
      // Only open sidebar by default on desktop
      if (!mobile && window.innerWidth >= 1280) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
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
      <div className="relative min-h-screen bg-gray-900">
        {/* Sidebar with proper mobile behavior */}
        <div className={cn(
          "fixed left-0 top-0 h-full z-40 transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <FurnitureDarkSidebar onNavigate={handleSidebarClose} />
        </div>

      {/* Mobile Menu Button - Always visible on mobile */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "fixed top-4 left-4 z-50 bg-gray-800/90 backdrop-blur-sm text-white hover:bg-gray-700",
          "lg:hidden" // Hide on desktop
        )}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Main Content with proper spacing */}
      <div 
        className={cn(
          "transition-all duration-300 min-h-screen",
          // Add left margin only on desktop when sidebar is open
          "lg:ml-0", // Default no margin
          sidebarOpen && !isMobile && "lg:ml-20" // Add margin on desktop when sidebar is open
        )}
      >
        {/* Add padding for mobile menu button and better mobile spacing */}
        <div className={cn(
          "pt-14 px-2 sm:px-4 lg:pt-0 lg:px-0", // Mobile padding
          "min-h-screen" // Ensure full height
        )}>
          {children}
        </div>
      </div>

      {/* Mobile Overlay - Click to close */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}
      </div>
    </NavigationLoadingProvider>
  )
}

export default React.memo(FurnitureDarkLayout)