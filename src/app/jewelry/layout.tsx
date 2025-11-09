/**
 * Jewelry Industry Layout
 * Smart Code: HERA.JEWELRY.LAYOUT.v1
 * 
 * Enhanced jewelry industry layout using Universal Layout system
 * Provides jewelry-specific theming and navigation
 */

import React from 'react'
import { HERAAuthProvider } from '@/components/auth/HERAAuthProvider'
import UniversalLayout from '@/components/layouts/UniversalLayout'

interface JewelryLayoutProps {
  children: React.ReactNode
}

export default function JewelryLayout({ children }: JewelryLayoutProps) {
  return (
    <HERAAuthProvider>
      <UniversalLayout
        showSidebar={true}
        showBreadcrumbs={true}
        showTopBar={true}
        className="jewelry-layout"
      >
        {children}
      </UniversalLayout>
    </HERAAuthProvider>
  )
}

// Generate metadata for the jewelry industry section
export const metadata = {
  title: 'HERA Jewelry ERP - Precious Metals & Gemstone Management',
  description: 'Professional jewelry industry ERP with precious metals tracking, gemstone certification, and compliance management',
  openGraph: {
    title: 'HERA Jewelry ERP',
    description: 'Specialized ERP solution for jewelry manufacturers and retailers',
    type: 'website'
  }
}