'use client'

import React from 'react'
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
      appName="HERA Restaurant Pro"
      appIcon={
        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <ChefHat className="w-8 h-8 text-foreground" />
        </div>
      }
      backgroundColor="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50"
    >
      {children}
    </UniversalAuthenticatedLayout>
  )
}
