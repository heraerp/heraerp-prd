'use client'

// Force dynamic rendering to avoid build issues
export const dynamic = 'force-dynamic'

import React from 'react'
import { UCRTemplateBrowser } from '@/components/salon/UCRTemplateBrowser'
import { CustomizationExampleCard } from '@/components/salon/CustomizationExampleCard'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function SalonTemplatesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/salon-data">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Business Rule Templates
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ready-to-use configurations for your salon operations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">
        <CustomizationExampleCard />
        <UCRTemplateBrowser />
      </div>
    </div>
  )
}