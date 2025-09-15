'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function AuditCatchAllRedirectPage() {
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    // Get the full path and redirect to audit-progressive with the same path
    const path = Array.isArray(params.path) ? params.path.join('/') : params.path || ''
    const redirectUrl = `/audit-progressive/${path}`
    router.replace(redirectUrl)
  }, [router, params])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to audit system...</p>
      </div>
    </div>
  )
}
