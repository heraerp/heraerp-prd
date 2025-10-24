'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { FurnitureNavbar } from '@/components/furniture/FurnitureNavbar'
import { JewelryGradientBG } from '@/components/jewelry/JewelryGradientBG'
import '@/styles/jewelry-glassmorphism.css'

interface Furniture1LayoutProps {
  children: React.ReactNode
}

export default function Furniture1Layout({ children }: Furniture1LayoutProps) {
  const pathname = usePathname()

  // Don't show navbar on auth pages only
  const isAuthPage = pathname === '/furniture/auth'

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen">
      <JewelryGradientBG />
      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="relative z-50">
          <FurnitureNavbar />
        </div>
        <main className="flex-1 w-full py-2 sm:py-3 lg:py-4 relative z-0">
          {children}
        </main>
      </div>
    </div>
  )
}