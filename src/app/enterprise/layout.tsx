'use client'

/**
 * Enterprise Layout
 * Smart Code: HERA.ENTERPRISE.LAYOUT.v2
 * 
 * Enhanced enterprise layout using Universal Layout system
 * Provides dynamic navigation and industry-aware theming
 */

import React from 'react'
import { HERAAuthProvider } from '@/components/auth/HERAAuthProvider'
import UniversalLayout from '@/components/layouts/UniversalLayout'

interface EnterpriseLayoutProps {
  children: React.ReactNode
}

export default function EnterpriseLayout({ children }: EnterpriseLayoutProps) {
  return (
    <HERAAuthProvider>
      <UniversalLayout
        showSidebar={false}
        showBreadcrumbs={false}  
        showTopBar={false}  
        className="enterprise-layout"
      >
        {children}
      </UniversalLayout>
    </HERAAuthProvider>
  )
}