/**
 * HERA Retail & Distribution Layout
 * Smart Code: HERA.RETAIL.LAYOUT.v1
 * 
 * Root layout for retail and distribution management system
 * Provides retail-specific theming and authentication context
 */

import React from 'react'
import { HERAAuthProvider } from '@/components/auth/HERAAuthProvider'

interface RetailLayoutProps {
  children: React.ReactNode
}

export default function RetailLayout({ children }: RetailLayoutProps) {
  return (
    <HERAAuthProvider>
      <div className="retail-app">
        {children}
      </div>
    </HERAAuthProvider>
  )
}

// Retail module metadata
export const metadata = {
  title: 'HERA Retail & Distribution - Enterprise Retail Management',
  description: 'Comprehensive retail and distribution management with POS, inventory, analytics, and customer loyalty',
  openGraph: {
    title: 'HERA Retail & Distribution',
    description: 'Enterprise-grade retail management solution with multi-channel capabilities',
    type: 'website'
  }
}