'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import React from 'react'
import { useRouter } from 'next/navigation'

export default function SetupCatchAll() {
  const router = useRouter()

  useEffect(() => {
    // Redirect any setup routes to the main auth page
    router.replace('/auth')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to HERA...</p>
      </div>
    </div>
  )
}
