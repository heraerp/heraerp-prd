/**
 * WMS (Waste Management System) Layout
 * Smart Code: HERA.WMS.LAYOUT.v1
 * 
 * Dedicated WMS layout using HERAAuthProvider for universal authentication
 * Organization: HERA Waste Management Demo (1fbab8d2-583c-44d2-8671-6d187c1ee755)
 */

'use client'

import React from 'react'
import { HERAAuthProvider } from '@/components/auth/HERAAuthProvider'

interface WMSLayoutProps {
  children: React.ReactNode
}

export default function WMSLayout({ children }: WMSLayoutProps) {
  return (
    <HERAAuthProvider>
      <div className="wms-layout min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {children}
      </div>
    </HERAAuthProvider>
  )
}