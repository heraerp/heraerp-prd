'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuditClientsRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/audit-progressive/clients')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to clients...</p>
      </div>
    </div>
  )
}
