/**
 * HERA Wholesale Domain Layout
 * Smart Code: HERA.WHOLESALE.LAYOUT.v1
 * 
 * Domain-specific layout for wholesale applications
 * Provides authentication context and wholesale-specific styling
 */

import React from 'react'
import { HERAAuthProvider } from '@/components/auth/HERAAuthProvider'

interface WholesaleLayoutProps {
  children: React.ReactNode
}

export default function WholesaleLayout({ children }: WholesaleLayoutProps) {
  return (
    <HERAAuthProvider>
      <div className="hera-wholesale">
        {children}
      </div>
    </HERAAuthProvider>
  )
}

// Wholesale domain metadata
export const metadata = {
  title: 'HERA Wholesale - B2B Trading & Distribution',
  description: 'Comprehensive wholesale management with bulk ordering, pricing tiers, distributor networks, and supply chain integration',
  openGraph: {
    title: 'HERA Wholesale',
    description: 'Enterprise-grade wholesale management system with advanced pricing and distribution features',
    type: 'website'
  }
}