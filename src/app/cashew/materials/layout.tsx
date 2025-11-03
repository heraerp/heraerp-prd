/**
 * Cashew Materials Layout
 * Inherits authentication from parent cashew layout
 */

import { ReactNode } from 'react'

interface CashewMaterialsLayoutProps {
  children: ReactNode
}

export default function CashewMaterialsLayout({ children }: CashewMaterialsLayoutProps) {
  // No additional providers needed - inherits CashewAuthProvider from /cashew layout
  return <>{children}</>
}