'use client'

import React from 'react'
import { KitchenDisplay } from '@/components/restaurant/KitchenDisplay'

// Restaurant organization configuration
const RESTAURANT_CONFIG = {
  organizationId: '6f591f1a-ea86-493e-8ae4-639d28a7e3c8', // Mario's Restaurant
  smartCodes: {
    // Order smart codes
    ORDER_NEW: 'HERA.RESTAURANT.FOH.ORDER.NEW.v1',
    ORDER_IN_PROGRESS: 'HERA.RESTAURANT.FOH.ORDER.PROGRESS.v1',
    ORDER_READY: 'HERA.RESTAURANT.FOH.ORDER.READY.v1',
    ORDER_SERVED: 'HERA.RESTAURANT.FOH.ORDER.SERVED.v1',
    
    // Kitchen station entities
    KITCHEN_STATION: 'HERA.RESTAURANT.FOH.KITCHEN.STATION.v1',
    
    // Order line items
    LINE_ITEM: 'HERA.RESTAURANT.FOH.ORDER.LINE.ITEM.v1',
    LINE_MODIFIER: 'HERA.RESTAURANT.FOH.ORDER.LINE.MODIFIER.v1',
    LINE_SPECIAL: 'HERA.RESTAURANT.FOH.ORDER.LINE.SPECIAL.v1',
    
    // Relationships
    REL_ORDER_STATION: 'HERA.RESTAURANT.FOH.REL.ORDER.STATION.v1',
    REL_ORDER_TABLE: 'HERA.RESTAURANT.FOH.REL.ORDER.TABLE.v1',
  }
}

export default function KitchenPage() {
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