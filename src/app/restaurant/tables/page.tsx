'use client'

import React from 'react'
import { TableManagement } from '@/components/restaurant/TableManagement'

// Restaurant organization configuration
const RESTAURANT_CONFIG = {
  organizationId: '6f591f1a-ea86-493e-8ae4-639d28a7e3c8', // Mario's Restaurant
  smartCodes: {
    // Table entities
    TABLE: 'HERA.RESTAURANT.TABLE.ENTITY.v1',
    TABLE_SECTION: 'HERA.RESTAURANT.TABLE.SECTION.v1',
    RESERVATION: 'HERA.RESTAURANT.TABLE.RESERVATION.v1',
    WAITLIST: 'HERA.RESTAURANT.TABLE.WAITLIST.v1',
    
    // Table transactions
    TABLE_ASSIGNMENT: 'HERA.RESTAURANT.TABLE.ASSIGN.v1',
    TABLE_TRANSFER: 'HERA.RESTAURANT.TABLE.TRANSFER.v1',
    TABLE_MERGE: 'HERA.RESTAURANT.TABLE.MERGE.v1',
    TABLE_SPLIT: 'HERA.RESTAURANT.TABLE.SPLIT.v1',
    RESERVATION_BOOKING: 'HERA.RESTAURANT.TABLE.BOOKING.v1',
    
    // Relationships
    REL_TABLE_SECTION: 'HERA.RESTAURANT.TABLE.REL.SECTION.v1',
    REL_TABLE_ORDER: 'HERA.RESTAURANT.TABLE.REL.ORDER.v1',
    REL_TABLE_SERVER: 'HERA.RESTAURANT.TABLE.REL.SERVER.v1',
    REL_TABLE_RESERVATION: 'HERA.RESTAURANT.TABLE.REL.RESERVATION.v1',
  }
}

export default function TablesPage() {
  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <TableManagement 
        organizationId={RESTAURANT_CONFIG.organizationId}
        smartCodes={RESTAURANT_CONFIG.smartCodes}
        isDemoMode={false}
      />
    </div>
  )
}