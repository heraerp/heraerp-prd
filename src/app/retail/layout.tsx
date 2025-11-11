/**
 * HERA Retail Domain Layout
 * Smart Code: HERA.RETAIL.LAYOUT.v1
 * 
 * Domain-specific layout for retail applications
 * Provides authentication context and retail-specific styling
 */

import React from 'react'
import { HERAAuthProvider } from '@/components/auth/HERAAuthProvider'

interface RetailLayoutProps {
  children: React.ReactNode
}

export default function RetailLayout({ children }: RetailLayoutProps) {
  return (
    <HERAAuthProvider>
      <div className="hera-retail">
        {children}
      </div>
    </HERAAuthProvider>
  )
}

// Retail domain metadata
export const metadata = {
  title: 'HERA Retail - Point of Sale & Inventory Management',
  description: 'Comprehensive retail management with POS, inventory tracking, customer management, and supplier integration',
  openGraph: {
    title: 'HERA Retail',
    description: 'Enterprise-grade retail management system with real-time inventory tracking',
    type: 'website'
  }
}