'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function JewelryPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user has organization context
    const orgId = localStorage.getItem('organizationId')
    const jewelryRole = localStorage.getItem('jewelryRole')
    
    if (orgId && jewelryRole) {
      // Has context, go to dashboard
      router.push('/jewelry/dashboard')
    } else {
      // No context, go to demo
      router.push('/jewelry/demo')
    }
  }, [router])

  return (
    <div className="min-h-screen jewelry-gradient-bg flex items-center justify-center">
      <div className="jewelry-glass-card p-6">
        <div className="animate-pulse text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-gold-500 rounded-lg"></div>
          <p className="jewelry-text-luxury">Loading HERA Jewelry...</p>
        </div>
      </div>
    </div>
  )
}