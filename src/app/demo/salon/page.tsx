'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SalonDemoPage() {
  const router = useRouter()

  useEffect(() => {
    // Simple redirect to salon dashboard for now
    router.push('/salon/dashboard')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to salon dashboard...</p>
      </div>
    </div>
  )
}
