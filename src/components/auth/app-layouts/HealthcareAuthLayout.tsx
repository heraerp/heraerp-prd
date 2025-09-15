'use client'

import { UniversalAuthenticatedLayout } from '../UniversalAuthenticatedLayout'
import { Heart } from 'lucide-react'

interface HealthcareAuthLayoutProps {
  children: React.ReactNode
  requiredRole?: string | string[]
}

export function HealthcareAuthLayout({ children, requiredRole }: HealthcareAuthLayoutProps) {
  return (
    <UniversalAuthenticatedLayout
      requiredRole={requiredRole}
      appName="HERA Healthcare"
      appIcon={
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-white" />
        </div>
      }
      backgroundColor="bg-gradient-to-br from-blue-50 via-teal-50 to-green-50"
    >
      {children}
    </UniversalAuthenticatedLayout>
  )
}
