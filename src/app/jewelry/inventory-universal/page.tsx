'use client'

import { JewelryEntityPage } from '@/components/entity/JewelryEntityPage'
import { JEWELRY_ITEM_PRESET } from '@/hooks/entityPresets'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

export default function JewelryInventoryUniversalPage() {
  const { userRole = 'staff' } = useHERAAuth() ?? {}

  return (
    <div className="min-h-screen jewelry-gradient-premium">
      <div className="jewelry-glass-backdrop min-h-screen">
        <JewelryEntityPage
          preset={JEWELRY_ITEM_PRESET}
          userRole={userRole}
          title="Jewelry Inventory"
          subtitle="Universal Entity Framework - Complete jewelry inventory management with 95% code reduction"
        />
      </div>
    </div>
  )
}
