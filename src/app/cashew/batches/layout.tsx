/**
 * Cashew Batches Layout
 * Inherits authentication from parent cashew layout
 */

import { ReactNode } from 'react'

interface CashewBatchesLayoutProps {
  children: ReactNode
}

export default function CashewBatchesLayout({ children }: CashewBatchesLayoutProps) {
  // No additional providers needed - inherits CashewAuthProvider from /cashew layout
  return <>{children}</>
}