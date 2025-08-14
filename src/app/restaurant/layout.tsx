'use client'

import React from 'react'
import { DualAuthProvider } from '@/components/auth/DualAuthProvider'

export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DualAuthProvider>
      {children}
    </DualAuthProvider>
  )
}