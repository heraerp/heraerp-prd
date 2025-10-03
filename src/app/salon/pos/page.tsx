'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React from 'react'
import { SalonPOSTerminalGlass } from '@/components/salon/SalonPOSTerminalGlass'
import { PageLayout } from '@/components/universal/PageLayout'
import { PageHeader } from '@/components/universal/PageHeader'
import { useSalonPOSSecurity } from '@/hooks/useSalonSecurity'
import { useSecuredSalonContext } from '../SecuredSalonProvider'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'
import { LUXE_COLORS } from '@/lib/constants/salon'

// Salon organization configuration
const SALON_CONFIG = {
  organizationId: '0fd09e31-d257-4329-97eb-7d7f522ed6f0', // Hair Talkz Salon
  smartCodes: {
    SERVICE: 'HERA.SALON.SVC.SERVICE.V1',
    STYLIST: 'HERA.SALON.HR.STYLIST.V1',
    CUSTOMER: 'HERA.SALON.CRM.CUSTOMER.V1',
    APPOINTMENT: 'HERA.SALON.APPT.BOOKING.V1',
    SALE: 'HERA.SALON.TXN.SALE.V1',
    PAYMENT: 'HERA.SALON.TXN.PAYMENT.V1',
    TABLE: 'HERA.SALON.ENT.TABLE.V1' // For waiting area seats
  }
}

export default function POSPage() {
  const { organizationId, isAuthenticated, isLoading } = useSecuredSalonContext()
  const { canUsePOS, canProcessSales, canManageCarts, canApplyDiscounts, logPOSAction } =
    useSalonPOSSecurity()

  // Show loading state
  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader
          title="Point of Sale"
          breadcrumbs={[{ label: 'HERA' }, { label: 'SALON OS' }, { label: 'POS', isActive: true }]}
        />
        <div className="flex items-center justify-center h-64">
          <div style={{ color: LUXE_COLORS.gold }}>Loading POS system...</div>
        </div>
      </PageLayout>
    )
  }

  // Show access denied if user can't use POS
  if (!canUsePOS) {
    return (
      <PageLayout>
        <PageHeader
          title="Point of Sale"
          breadcrumbs={[{ label: 'HERA' }, { label: 'SALON OS' }, { label: 'POS', isActive: true }]}
        />
        <div className="flex items-center justify-center h-64">
          <Card
            className="max-w-md w-full border-0"
            style={{ backgroundColor: LUXE_COLORS.charcoalLight }}
          >
            <CardContent className="p-8 text-center">
              <AlertTriangle
                className="h-12 w-12 mx-auto mb-4"
                style={{ color: LUXE_COLORS.ruby }}
              />
              <h3 className="text-xl mb-2" style={{ color: LUXE_COLORS.gold }}>
                Access Restricted
              </h3>
              <p style={{ color: LUXE_COLORS.bronze }}>
                POS access is limited to front-desk staff and management. Please contact your
                manager for access.
              </p>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    )
  }

  // Log POS access
  React.useEffect(() => {
    if (isAuthenticated && canUsePOS) {
      logPOSAction('pos_accessed')
    }
  }, [isAuthenticated, canUsePOS, logPOSAction])

  return (
    <PageLayout>
      <PageHeader
        title="Point of Sale"
        breadcrumbs={[{ label: 'HERA' }, { label: 'SALON OS' }, { label: 'POS', isActive: true }]}
      />
      <div className="h-[calc(100vh-200px)]">
        <SalonPOSTerminalGlass
          organizationId={organizationId}
          smartCodes={SALON_CONFIG.smartCodes}
          isDemoMode={false}
          // Pass security permissions to the POS component
          permissions={{
            canProcessSales,
            canManageCarts,
            canApplyDiscounts
          }}
          onPOSAction={logPOSAction}
        />
      </div>
    </PageLayout>
  )
}
