'use client'

import React from 'react'
import { SapNavbar } from '@/components/sap/SapNavbar'

export interface MobilePageLayoutProps {
  children: React.ReactNode
  title?: string
  breadcrumb?: string
  showBack?: boolean
  onBack?: () => void
  userInitials?: string
  className?: string
}

export function MobilePageLayout({
  children,
  title = "HERA",
  breadcrumb,
  showBack = true,
  onBack,
  userInitials = "EG",
  className = ""
}: MobilePageLayoutProps) {
  return (
    <div className={`sap-font min-h-screen bg-gray-50 ${className}`}>
      {/* Mobile-Optimized Navbar */}
      <SapNavbar 
        title={title}
        breadcrumb={breadcrumb}
        showBack={showBack}
        onBack={onBack}
        userInitials={userInitials}
        showSearch={true}
      />
      
      {/* Main Content with Mobile Spacing */}
      <main className="mt-12 sm:mt-12 min-h-[calc(100vh-48px)] sm:min-h-[calc(100vh-48px)] bg-gray-50">
        {children}
      </main>
    </div>
  )
}