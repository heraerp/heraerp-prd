'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { ProgressiveBanner } from '@/components/auth/ProgressiveBanner'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'
import { ProgressiveAuthProvider } from '@/components/auth/ProgressiveAuthProvider'

function ProgressiveLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Pages that need progressive auth features
  const progressiveAuthPages = [
    '/restaurant',
    '/crm-progressive',
    '/jewelry-progressive', 
    '/airline-progressive',
    '/restaurant-progressive',
    '/healthcare-progressive',
    '/manufacturing-progressive',
    '/legal-progressive',
    '/audit-progressive',
    '/enterprise-retail-progressive',
    '/email-progressive',
    '/pwm-progressive',
    '/financial-progressive',
    '/profitability-progressive'
  ]
  
  // Only show progressive banner on dashboard and progressive app pages
  const progressivePages = [
    '/dashboard',
    '/crm-progressive',
    '/jewelry-progressive', 
    '/airline-progressive',
    '/restaurant-progressive',
    '/healthcare-progressive',
    '/manufacturing-progressive',
    '/legal-progressive',
    '/audit-progressive',
    '/enterprise-retail-progressive',
    '/email-progressive',
    '/pwm-progressive',
    '/financial-progressive',
    '/profitability-progressive'
  ]
  
  const needsProgressiveAuth = progressiveAuthPages.some(page => pathname.startsWith(page))
  const showProgressiveBanner = progressivePages.some(page => pathname.startsWith(page))
  
  // Wrap with ProgressiveAuthProvider only for pages that need it
  if (needsProgressiveAuth) {
    return (
      <ProgressiveAuthProvider>
        {/* Temporarily disabled progressive banner for HERA auth migration */}
        {/* {showProgressiveBanner && <ProgressiveBanner />} */}
        {children}
        <InstallPrompt />
      </ProgressiveAuthProvider>
    )
  }
  
  return (
    <>
      {/* Temporarily disabled progressive banner for HERA auth migration */}
      {/* {showProgressiveBanner && <ProgressiveBanner />} */}
      {children}
      <InstallPrompt />
    </>
  )
}

export default ProgressiveLayout