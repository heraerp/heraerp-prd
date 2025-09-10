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