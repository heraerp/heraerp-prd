'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HealthcarePage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to validate page for now as healthcare demo is in development
    router.push('/validate')
  }, [router])
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
          Healthcare Demo
        </h2>
        <p className="text-slate-600 dark:text-slate-300">
          Redirecting to demo...
        </p>
      </div>
    </div>
  )
}