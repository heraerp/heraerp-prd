'use client'

import { UniversalAuthenticatedLayout } from '../UniversalAuthenticatedLayout'
import { Gem } from 'lucide-react'

interface JewelryAuthLayoutProps {
  children: React.ReactNode
  requiredRole?: string | string[]
}

export function JewelryAuthLayout({ children, requiredRole }: JewelryAuthLayoutProps) {
  return (
    <UniversalAuthenticatedLayout
      requiredRole={requiredRole}
      appName="HERA Jewelry"
      appIcon={
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Gem className="w-8 h-8 text-white" />
        </div>
      }
      backgroundColor="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50"
    >
      {children}
    </UniversalAuthenticatedLayout>
  )
}