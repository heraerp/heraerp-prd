'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PartnerSystemRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to new franchise system
    router.replace('/franchise')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-8"></div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Partner System Upgraded</h1>
        <p className="text-slate-600">Redirecting to new HERA Franchise system...</p>
      </div>
    </div>
  )
}