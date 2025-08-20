'use client'

import { SalonAuthLayout } from '@/components/auth/app-layouts'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SalonAuthLayout>
      {children}
    </SalonAuthLayout>
  )
}