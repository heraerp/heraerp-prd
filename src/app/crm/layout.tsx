'use client'

import { CRMLayout } from '@/src/components/layout/crm-layout'
import { MultiOrgAuthProvider } from '@/src/components/auth/MultiOrgAuthProvider'

export default function CRMRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <MultiOrgAuthProvider>
      <CRMLayout>{children}</CRMLayout>
    </MultiOrgAuthProvider>
  )
}
