/**
 * Waste Management Industry Layout
 * Smart Code: HERA.WASTE_MGMT.LAYOUT.v1
 * 
 * Enhanced waste management industry layout using Universal Layout system
 * Provides waste management-specific theming and navigation
 */

import React from 'react'
import { HERAAuthProvider } from '@/components/auth/HERAAuthProvider'
import UniversalLayout from '@/components/layouts/UniversalLayout'

interface WasteManagementLayoutProps {
  children: React.ReactNode
}

export default function WasteManagementLayout({ children }: WasteManagementLayoutProps) {
  return (
    <HERAAuthProvider>
      <UniversalLayout
        showSidebar={true}
        showBreadcrumbs={true}
        showTopBar={true}
        className="waste-management-layout"
      >
        {children}
      </UniversalLayout>
    </HERAAuthProvider>
  )
}

// Generate metadata for the waste management industry section
export const metadata = {
  title: 'HERA Waste Management ERP - Route Optimization & Environmental Compliance',
  description: 'Professional waste management industry ERP with route optimization, EPA compliance, and fleet management',
  openGraph: {
    title: 'HERA Waste Management ERP',
    description: 'Specialized ERP solution for waste management companies and recycling operations',
    type: 'website'
  }
}