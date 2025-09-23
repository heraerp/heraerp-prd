'use client'

import { CRMLayout } from '@/components/layout/crm-layout'
import { HERAAuthProvider } from '@/components/auth/HERAAuthProvider'

export default function CRMRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <HERAAuthProvider>
      <CRMLayout>{children}</CRMLayout>
    </HERAAuthProvider>
  )
}
