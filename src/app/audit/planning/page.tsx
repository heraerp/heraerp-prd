'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuditPlanningRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/audit-progressive/planning')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to planning...</p>
      </div>
    </div>
  )
}
