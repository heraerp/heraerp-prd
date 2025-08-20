'use client'

import { UniversalAuthenticatedLayout } from '../UniversalAuthenticatedLayout'
import { Scissors } from 'lucide-react'

interface SalonAuthLayoutProps {
  children: React.ReactNode
  requiredRole?: string | string[]
}

export function SalonAuthLayout({ children, requiredRole }: SalonAuthLayoutProps) {
  return (
    <UniversalAuthenticatedLayout
      requiredRole={requiredRole}
      appName="HERA Salon"
      appIcon={
        <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Scissors className="w-8 h-8 text-white" />
        </div>
      }
      backgroundColor="bg-gradient-to-br from-pink-50 via-white to-purple-50"
    >
      {children}
    </UniversalAuthenticatedLayout>
  )
}