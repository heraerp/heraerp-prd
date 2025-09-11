'use client'

import { CRMLayout } from '@/components/layout/crm-layout'
import { MultiOrgAuthProvider } from '@/components/auth/MultiOrgAuthProvider'

export default function CRMRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MultiOrgAuthProvider>
      <CRMLayout>{children}</CRMLayout>
    </MultiOrgAuthProvider>
  )
}