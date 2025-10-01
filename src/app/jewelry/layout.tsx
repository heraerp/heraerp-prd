'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { JewelryNavbar } from '@/components/jewelry/JewelryNavbar'
import { JewelryGradientBG } from '@/components/jewelry/JewelryGradientBG'
import '@/styles/jewelry-glassmorphism.css'

interface JewelryLayoutProps {
  children: React.ReactNode
}

export default function JewelryLayout({ children }: JewelryLayoutProps) {
  const pathname = usePathname()

  // Don't show navbar on public pages
  const isPublicPage = pathname === '/jewelry' || pathname === '/jewelry/auth'

  if (isPublicPage) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen">
      <JewelryGradientBG />
      <div className="relative z-10 min-h-screen flex flex-col">
        <JewelryNavbar />
        <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          {children}
        </main>
      </div>
    </div>
  )
}
