'use client'

import React from 'react'
import SalonDashboardSidebar from '@/src/components/salon/SalonDashboardSidebar'

export default function SalonLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <SalonDashboardSidebar />
      
      {/* Main Content Area - Offset by sidebar width */}
      <div className="lg:pl-64">
        {/* Mobile spacing for bottom nav */}
        <div className="lg:hidden h-16" />
        
        {/* Page Content */}
        {children}
      </div>
    </div>
  )
}