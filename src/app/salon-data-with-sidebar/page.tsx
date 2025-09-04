'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import SalonDarkSidebar from '@/components/salon/SalonDarkSidebar'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'

// Dynamically import the original salon-data page
const SalonDataContent = dynamic(() => import('../salon-data/page'), {
  ssr: false,
})

function SalonDataWithSidebarContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const searchParams = useSearchParams()
  
  // Check if sidebar should be collapsed based on screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setSidebarCollapsed(window.innerWidth < 768)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  return (
    <div className="relative min-h-screen bg-gray-900">
      {/* Sidebar */}
      <SalonDarkSidebar />
      
      {/* Main Content - Adjust margin based on sidebar state */}
      <div 
        className={cn(
          "transition-all duration-300",
          sidebarCollapsed ? "ml-20" : "ml-64"
        )}
      >
        {/* Render the original salon-data content */}
        <SalonDataContent />
      </div>

      {/* Mobile Overlay when sidebar is open */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
    </div>
  )
}

export default function SalonDataWithSidebarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <SalonDataWithSidebarContent />
    </Suspense>
  )
}