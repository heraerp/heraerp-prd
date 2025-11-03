/**
 * Cashew Manufacturing Layout
 * Provides HERA Universal Authentication for the entire cashew app
 * Smart Code: HERA.CASHEW.LAYOUT.AUTH.v1
 */

'use client'

import { ReactNode } from 'react'
import { HERAUniversalAuthProvider } from '@/components/auth/HERAUniversalAuthProvider'

interface CashewLayoutProps {
  children: ReactNode
}

export default function CashewLayout({ children }: CashewLayoutProps) {
  return (
    <HERAUniversalAuthProvider
      appName="cashew"
      requireOrganization={true}
      redirectTo="/auth/login"
    >
      {children}
    </HERAUniversalAuthProvider>
  )
}