/**
 * Cashew Products Layout
 * Inherits authentication from parent cashew layout
 */

import { ReactNode } from 'react'

interface CashewProductsLayoutProps {
  children: ReactNode
}

export default function CashewProductsLayout({ children }: CashewProductsLayoutProps) {
  // No additional providers needed - inherits CashewAuthProvider from /cashew layout
  return <>{children}</>
}