/**
 * HERA Apps Layout
 * Smart Code: HERA.PLATFORM.APPS.LAYOUT.v1
 * 
 * Root layout for all HERA application modules
 * Provides authentication context and consistent styling
 */

import React from 'react'
import { HERAAuthProvider } from '@/components/auth/HERAAuthProvider'

interface AppsLayoutProps {
  children: React.ReactNode
}

export default function AppsLayout({ children }: AppsLayoutProps) {
  return (
    <HERAAuthProvider>
      <div className="hera-apps">
        {children}
      </div>
    </HERAAuthProvider>
  )
}

// Apps module metadata
export const metadata = {
  title: 'HERA Apps - Enterprise Application Modules',
  description: 'Comprehensive business application modules for retail, wholesale, finance, and operations management',
  openGraph: {
    title: 'HERA Apps',
    description: 'Enterprise-grade business application modules with role-based access',
    type: 'website'
  }
}