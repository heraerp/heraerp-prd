'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React from 'react'
import { OrderManagement } from '@/components/restaurant/OrderManagement'

// Restaurant organization configuration
const RESTAURANT_CONFIG = {
  organizationId: '6f591f1a-ea86-493e-8ae4-639d28a7e3c8', // Mario's Restaurant
  smartCodes: {
    // Order entities
    ORDER: 'HERA.RESTAURANT.ORDER.ENTITY.v1',
    ORDER_TYPE: 'HERA.RESTAURANT.ORDER.TYPE.v1',
    CUSTOMER: 'HERA.RESTAURANT.CUSTOMER.ENTITY.v1',
    
    // Order transactions
    ORDER_SALE: 'HERA.RESTAURANT.ORDER.SALE.v1',
    ORDER_REFUND: 'HERA.RESTAURANT.ORDER.REFUND.v1',
    ORDER_VOID: 'HERA.RESTAURANT.ORDER.VOID.v1',
    ORDER_DISCOUNT: 'HERA.RESTAURANT.ORDER.DISCOUNT.v1',
    ORDER_PAYMENT: 'HERA.RESTAURANT.ORDER.PAYMENT.v1',
    
    // Order line items
    ORDER_LINE_ITEM: 'HERA.RESTAURANT.ORDER.LINE.ITEM.v1',
    ORDER_LINE_MODIFIER: 'HERA.RESTAURANT.ORDER.LINE.MODIFIER.v1',
    ORDER_LINE_DISCOUNT: 'HERA.RESTAURANT.ORDER.LINE.DISCOUNT.v1',
    ORDER_LINE_TAX: 'HERA.RESTAURANT.ORDER.LINE.TAX.v1',
    ORDER_LINE_TIP: 'HERA.RESTAURANT.ORDER.LINE.TIP.v1',
    
    // Relationships
    REL_ORDER_TABLE: 'HERA.RESTAURANT.ORDER.REL.TABLE.v1',
    REL_ORDER_CUSTOMER: 'HERA.RESTAURANT.ORDER.REL.CUSTOMER.v1',
    REL_ORDER_SERVER: 'HERA.RESTAURANT.ORDER.REL.SERVER.v1',
    REL_ORDER_STATUS: 'HERA.RESTAURANT.ORDER.REL.STATUS.v1',
  }
}

export default function OrdersPage() {
  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <OrderManagement 
        organizationId={RESTAURANT_CONFIG.organizationId}
        smartCodes={RESTAURANT_CONFIG.smartCodes}
        isDemoMode={false}
      />
    </div>
  )
}