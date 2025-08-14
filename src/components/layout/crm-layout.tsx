'use client'

import React from 'react'
import { TeamsSidebar } from '@/components/ui/teams-sidebar'

interface CRMLayoutProps {
  children: React.ReactNode
}

export function CRMLayout({ children }: CRMLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Teams-style Sidebar */}
      <TeamsSidebar />
      
      {/* Main Content */}
      <div className="ml-16">
        {children}
      </div>
    </div>
  )
}