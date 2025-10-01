'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React from 'react'
import { POSTerminalGlass } from '@/components/restaurant/POSTerminalGlass'

// Restaurant organization configuration
const RESTAURANT_CONFIG = {
  organizationId: '6f591f1a-ea86-493e-8ae4-639d28a7e3c8', // Mario's Restaurant
  smartCodes: {
    // Menu & Order
    MENU_ITEM: 'HERA.RESTAURANT.MENU.ITEM.V1',
    ORDER_SALE: 'HERA.RESTAURANT.POS.SALE.V1',
    ORDER_LINE: 'HERA.RESTAURANT.POS.LINE.ITEM.V1',
    ORDER_MODIFIER: 'HERA.RESTAURANT.POS.LINE.MODIFIER.V1',
    ORDER_DISCOUNT: 'HERA.RESTAURANT.POS.LINE.DISCOUNT.V1',

    // Customer & Table
    CUSTOMER: 'HERA.RESTAURANT.CUSTOMER.ENTITY.V1',
    TABLE: 'HERA.RESTAURANT.TABLE.ENTITY.V1',

    // Payment
    PAYMENT: 'HERA.RESTAURANT.POS.PAYMENT.V1',
    REFUND: 'HERA.RESTAURANT.POS.REFUND.V1',

    // Relationships
    REL_ORDER_TABLE: 'HERA.RESTAURANT.ORDER.REL.TABLE.V1',
    REL_ORDER_CUSTOMER: 'HERA.RESTAURANT.ORDER.REL.CUSTOMER.V1'
  }
}

export default function RestaurantPOSPage() {
  return (
    <div className="h-screen">
      <POSTerminalGlass
        organizationId={RESTAURANT_CONFIG.organizationId}
        smartCodes={RESTAURANT_CONFIG.smartCodes}
        isDemoMode={false}
      />
    </div>
  )
}
