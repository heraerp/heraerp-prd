'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PartnerSystemRegisterRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to new franchise application
    router.replace('/franchise/apply')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500 mx-auto mb-8"></div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Registration Upgraded</h1>
        <p className="text-slate-600">Redirecting to HERA Franchise application...</p>
      </div>
    </div>
  )
}