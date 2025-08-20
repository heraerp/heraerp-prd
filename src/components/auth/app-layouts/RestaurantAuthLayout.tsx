'use client'

import { UniversalAuthenticatedLayout } from '../UniversalAuthenticatedLayout'
import { ChefHat } from 'lucide-react'

interface RestaurantAuthLayoutProps {
  children: React.ReactNode
  requiredRole?: string | string[]
}

export function RestaurantAuthLayout({ children, requiredRole }: RestaurantAuthLayoutProps) {
  return (
    <UniversalAuthenticatedLayout
      requiredRole={requiredRole}
      appName="HERA Restaurant"
      appIcon={
        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ChefHat className="w-8 h-8 text-white" />
        </div>
      }
      backgroundColor="bg-gradient-to-br from-orange-50 via-red-50 to-pink-50"
    >
      {children}
    </UniversalAuthenticatedLayout>
  )
}