'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function AgroPage() {
  const router = useRouter()

  // Redirect to dashboard immediately
  useEffect(() => {
    console.log('🎯 AGRO: Redirecting to dashboard')
    router.replace('/agro/dashboard')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
        <p className="text-slate-600">Redirecting to HERA Agro dashboard...</p>
      </div>
    </div>
  )
}
