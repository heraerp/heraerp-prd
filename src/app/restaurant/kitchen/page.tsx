'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useEffect } from 'react'
import { useLoadingStore } from '@/lib/stores/loading-store'
import { KitchenDisplay } from '@/components/restaurant/KitchenDisplay'

// Restaurant organization configuration
const RESTAURANT_CONFIG = {
  organizationId: '6f591f1a-ea86-493e-8ae4-639d28a7e3c8', // Mario's Restaurant
  smartCodes: {
    // Order smart codes
    ORDER_NEW: 'HERA.RESTAURANT.FOH.ORDER.NEW.V1',
    ORDER_IN_PROGRESS: 'HERA.RESTAURANT.FOH.ORDER.PROGRESS.V1',
    ORDER_READY: 'HERA.RESTAURANT.FOH.ORDER.READY.V1',
    ORDER_SERVED: 'HERA.RESTAURANT.FOH.ORDER.SERVED.V1',

    // Kitchen station entities
    KITCHEN_STATION: 'HERA.RESTAURANT.FOH.KITCHEN.STATION.V1',

    // Order line items
    LINE_ITEM: 'HERA.RESTAURANT.FOH.ORDER.LINE.ITEM.V1',
    LINE_MODIFIER: 'HERA.RESTAURANT.FOH.ORDER.LINE.MODIFIER.V1',
    LINE_SPECIAL: 'HERA.RESTAURANT.FOH.ORDER.LINE.SPECIAL.V1',

    // Relationships
    REL_ORDER_STATION: 'HERA.RESTAURANT.FOH.REL.ORDER.STATION.V1',
    REL_ORDER_TABLE: 'HERA.RESTAURANT.FOH.REL.ORDER.TABLE.V1'
  }
}

export default function KitchenPage() {
  const { updateProgress, finishLoading } = useLoadingStore()

  // ⚡ ENTERPRISE: Complete loading animation on mount (if coming from login)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const isInitializing = urlParams.get('initializing') === 'true'

    if (isInitializing) {
      console.log('🍽️ Restaurant Kitchen: Completing loading animation from 70% → 100%')

      // Animate from 70% to 100% smoothly
      let progress = 70
      const progressInterval = setInterval(() => {
        progress += 5
        if (progress <= 100) {
          updateProgress(progress, undefined, progress === 100 ? 'Ready!' : 'Loading your workspace...')
        }
        if (progress >= 100) {
          clearInterval(progressInterval)
          // Complete and hide overlay after brief delay
          setTimeout(() => {
            finishLoading()
            // Clean up URL parameter
            window.history.replaceState({}, '', window.location.pathname)
            console.log('✅ Restaurant Kitchen: Loading complete!')
          }, 500)
        }
      }, 50)

      return () => clearInterval(progressInterval)
    }
  }, [updateProgress, finishLoading])

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <KitchenDisplay
        organizationId={RESTAURANT_CONFIG.organizationId}
        smartCodes={RESTAURANT_CONFIG.smartCodes}
        isDemoMode={false}
      />
    </div>
  )
}
