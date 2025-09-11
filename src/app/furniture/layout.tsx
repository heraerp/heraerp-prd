// Force dynamic rendering for all furniture pages - skip SSG
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import React from 'react'
import FurnitureDarkLayout from '@/components/furniture/FurnitureDarkLayout'
import { FurnitureOrgProvider } from '@/components/furniture/FurnitureOrgContext'

export default function FurnitureLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <FurnitureDarkLayout>
      <FurnitureOrgProvider>
        {children}
      </FurnitureOrgProvider>
    </FurnitureDarkLayout>
  )
}