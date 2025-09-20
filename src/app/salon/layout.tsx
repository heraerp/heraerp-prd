'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import SalonDarkSidebar from '@/components/salon/SalonDarkSidebar'

export default function SalonLayout({
  children
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Don't show sidebar on the public landing page
  const isPublicPage = pathname === '/salon'
  
  if (isPublicPage) {
    return <>{children}</>
  }
  
  return (
    <>
      <SalonDarkSidebar />
      {/* reserve exactly the sidebar width */}
      <main id="salon-main" className="ml-20 min-h-[100dvh]">
        {children}
      </main>
    </>
  )
}
