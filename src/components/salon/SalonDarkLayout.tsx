'use client'

import React, { useState, useEffect } from 'react'
import SalonDarkSidebar from './SalonDarkSidebar'
import { cn } from '@/lib/utils'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SalonDarkLayoutProps {
  children: React.ReactNode
}

export default function SalonDarkLayout({ children }: SalonDarkLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setSidebarOpen(!mobile) // Auto-close on mobile
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  return (
    <div className="relative min-h-screen bg-gray-900">
      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full z-40 transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SalonDarkSidebar />
      </div>

      {/* Mobile Menu Button */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 bg-gray-800/80 backdrop-blur-sm text-white hover:bg-gray-700"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      )}

      {/* Main Content */}
      <div 
        className={cn(
          "transition-all duration-300 min-h-screen",
          sidebarOpen && !isMobile ? "ml-20" : "ml-0"
        )}
      >
        {children}
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}