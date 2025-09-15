'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to new auth system
    router.push('/auth')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting to your organization...</p>
      </div>
    </div>
  )
}
