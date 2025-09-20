'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React from 'react'
import { SalonPOSTerminalGlass } from '@/components/salon/SalonPOSTerminalGlass'
import { PageLayout } from '@/components/universal/PageLayout'
import { PageHeader } from '@/components/universal/PageHeader'

// Salon organization configuration
const SALON_CONFIG = {
  organizationId: '0fd09e31-d257-4329-97eb-7d7f522ed6f0', // Hair Talkz Salon
  smartCodes: {
    SERVICE: 'HERA.SALON.SVC.SERVICE.v1',
    STYLIST: 'HERA.SALON.HR.STYLIST.v1',
    CUSTOMER: 'HERA.SALON.CRM.CUSTOMER.v1',
    APPOINTMENT: 'HERA.SALON.APPT.BOOKING.v1',
    SALE: 'HERA.SALON.TXN.SALE.v1',
    PAYMENT: 'HERA.SALON.TXN.PAYMENT.v1',
    TABLE: 'HERA.SALON.ENT.TABLE.v1' // For waiting area seats
  }
}

export default function POSPage() {
  return (
    <PageLayout>
      <PageHeader
        title="Point of Sale"
        breadcrumbs={[{ label: 'HERA' }, { label: 'SALON OS' }, { label: 'POS', isActive: true }]}
      />
      <div className="h-[calc(100vh-200px)]">
        <SalonPOSTerminalGlass
          organizationId={SALON_CONFIG.organizationId}
          smartCodes={SALON_CONFIG.smartCodes}
          isDemoMode={false}
        />
      </div>
    </PageLayout>
  )
}
