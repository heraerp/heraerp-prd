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