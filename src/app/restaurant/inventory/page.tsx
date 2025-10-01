'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React from 'react'
import { InventoryManagement } from '@/components/restaurant/InventoryManagement'

// Restaurant organization configuration
const RESTAURANT_CONFIG = {
  organizationId: '6f591f1a-ea86-493e-8ae4-639d28a7e3c8', // Mario's Restaurant
  smartCodes: {
    // Inventory entities
    INVENTORY_ITEM: 'HERA.RESTAURANT.INV.ITEM.V1',
    SUPPLIER: 'HERA.RESTAURANT.INV.SUPPLIER.V1',
    INVENTORY_LOCATION: 'HERA.RESTAURANT.INV.LOCATION.V1',

    // Inventory transactions
    PURCHASE_ORDER: 'HERA.RESTAURANT.INV.PO.V1',
    GOODS_RECEIPT: 'HERA.RESTAURANT.INV.RECEIPT.V1',
    INVENTORY_ADJUSTMENT: 'HERA.RESTAURANT.INV.ADJUSTMENT.V1',
    INVENTORY_COUNT: 'HERA.RESTAURANT.INV.COUNT.V1',
    INVENTORY_TRANSFER: 'HERA.RESTAURANT.INV.TRANSFER.V1',

    // Transaction lines
    LINE_ITEM: 'HERA.RESTAURANT.INV.LINE.ITEM.V1',
    LINE_ADJUSTMENT: 'HERA.RESTAURANT.INV.LINE.ADJUSTMENT.V1',

    // Relationships
    REL_ITEM_SUPPLIER: 'HERA.RESTAURANT.INV.REL.ITEM.SUPPLIER.V1',
    REL_ITEM_LOCATION: 'HERA.RESTAURANT.INV.REL.ITEM.LOCATION.V1'
  }
}

export default function InventoryPage() {
  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <InventoryManagement
        organizationId={RESTAURANT_CONFIG.organizationId}
        smartCodes={RESTAURANT_CONFIG.smartCodes}
        isDemoMode={false}
      />
    </div>
  )
}
