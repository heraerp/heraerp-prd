'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React from 'react'
import { PaymentProcessing } from '@/components/restaurant/PaymentProcessing'

// Restaurant organization configuration
const RESTAURANT_CONFIG = {
  organizationId: '6f591f1a-ea86-493e-8ae4-639d28a7e3c8', // Mario's Restaurant
  smartCodes: {
    // Payment transaction smart codes
    PAYMENT_RECEIVED: 'HERA.RESTAURANT.FOH.PAYMENT.RECEIVED.v1',
    REFUND: 'HERA.RESTAURANT.FOH.PAYMENT.REFUND.v1',
    TIP_ADDED: 'HERA.RESTAURANT.FOH.PAYMENT.TIP.v1',
    SETTLEMENT: 'HERA.RESTAURANT.FOH.PAYMENT.SETTLEMENT.v1',

    // Payment method entities
    PAYMENT_METHOD: 'HERA.RESTAURANT.FOH.PAYMENT.METHOD.v1',

    // Transaction line items
    LINE_PAYMENT: 'HERA.RESTAURANT.FOH.PAYMENT.LINE.v1',
    LINE_TIP: 'HERA.RESTAURANT.FOH.PAYMENT.LINE.TIP.v1',
    LINE_FEE: 'HERA.RESTAURANT.FOH.PAYMENT.LINE.FEE.v1'
  }
}

export default function PaymentsPage() {
  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <PaymentProcessing
        organizationId={RESTAURANT_CONFIG.organizationId}
        smartCodes={RESTAURANT_CONFIG.smartCodes}
        isDemoMode={false}
      />
    </div>
  )
}
