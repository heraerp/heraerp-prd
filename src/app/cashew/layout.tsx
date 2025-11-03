/**
 * Cashew Manufacturing Layout
 * Provides HERA Universal Authentication for the entire cashew app
 * Smart Code: HERA.CASHEW.LAYOUT.AUTH.v1
 */

'use client'

import { ReactNode } from 'react'
import { HERAAuthProvider } from '@/components/auth/HERAAuthProvider'

interface CashewLayoutProps {
  children: ReactNode
}

export default function CashewLayout({ children }: CashewLayoutProps) {
  return (
    <HERAAuthProvider>
      {children}
    </HERAAuthProvider>
  )
}