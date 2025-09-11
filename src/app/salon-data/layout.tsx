// Force dynamic rendering for all salon-data pages - skip SSG
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import React from 'react'
import SalonThemeSwitcher from '@/components/salon/SalonThemeSwitcher'
import SalonDarkLayout from '@/components/salon/SalonDarkLayout'

export default function SalonDataLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SalonDarkLayout>
      {children}
      <SalonThemeSwitcher />
    </SalonDarkLayout>
  )
}