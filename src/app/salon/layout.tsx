import React from 'react'
import SalonThemeSwitcher from '@/components/salon/SalonThemeSwitcher'
import { SalonSettingsProvider } from '@/contexts/salon-settings-context'

export default function SalonLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SalonSettingsProvider>
      {children}
      <SalonThemeSwitcher />
    </SalonSettingsProvider>
  )
}