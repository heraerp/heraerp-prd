'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SalonDemoPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to demo initialization to ensure proper setup
    router.push('/demo-init')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-gray-600">Setting up salon demo...</p>
      </div>
    </div>
  )
}
