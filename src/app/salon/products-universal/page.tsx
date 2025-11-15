'use client'

import React from 'react'
import { EntityPage } from '@/components/entity/EntityPage'
import { PRODUCT_PRESET } from '@/hooks/entityPresets'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

export default function ProductsUniversalPage() {
  const { userRole = 'staff' } = useHERAAuth() ?? {}

  return (
    <EntityPage
      preset={PRODUCT_PRESET}
      userRole={userRole}
      title="Product Management (Universal)"
      subtitle="Manage your salon's product inventory with real-time stock tracking and pricing using the universal entity framework."
    />
  )
}
