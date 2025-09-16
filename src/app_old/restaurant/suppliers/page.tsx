'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React from 'react'
import { SuppliersManagement } from '@/components/restaurant/SuppliersManagement'

// Restaurant organization configuration
const RESTAURANT_CONFIG = {
  organizationId: '6f591f1a-ea86-493e-8ae4-639d28a7e3c8', // Mario's Restaurant
  smartCodes: {
    // Supplier entities
    SUPPLIER: 'HERA.RESTAURANT.SUP.VENDOR.v1',
    SUPPLIER_CONTACT: 'HERA.RESTAURANT.SUP.CONTACT.v1',
    SUPPLIER_CATEGORY: 'HERA.RESTAURANT.SUP.CATEGORY.v1',

    // Purchase transactions
    PURCHASE_ORDER: 'HERA.RESTAURANT.SUP.PO.v1',
    PURCHASE_INVOICE: 'HERA.RESTAURANT.SUP.INVOICE.v1',
    GOODS_RECEIPT: 'HERA.RESTAURANT.SUP.RECEIPT.v1',
    SUPPLIER_PAYMENT: 'HERA.RESTAURANT.SUP.PAYMENT.v1',
    SUPPLIER_RETURN: 'HERA.RESTAURANT.SUP.RETURN.v1',

    // Purchase order lines
    PO_LINE: 'HERA.RESTAURANT.SUP.PO.LINE.v1',
    RECEIPT_LINE: 'HERA.RESTAURANT.SUP.RECEIPT.LINE.v1',

    // Relationships
    REL_SUPPLIER_ITEM: 'HERA.RESTAURANT.SUP.REL.SUPPLIER.ITEM.v1',
    REL_SUPPLIER_CATEGORY: 'HERA.RESTAURANT.SUP.REL.SUPPLIER.CATEGORY.v1',
    REL_PO_RECEIPT: 'HERA.RESTAURANT.SUP.REL.PO.RECEIPT.v1'
  }
}

export default function SuppliersPage() {
  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <SuppliersManagement
        organizationId={RESTAURANT_CONFIG.organizationId}
        smartCodes={RESTAURANT_CONFIG.smartCodes}
        isDemoMode={false}
      />
    </div>
  )
}
