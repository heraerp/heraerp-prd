'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function FinanceDemoPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to financial page which is the demo
    router.push('/financial')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
          Finance Management Demo
        </h2>
        <p className="text-slate-600 dark:text-slate-300">Loading financial management suite...</p>
      </div>
    </div>
  )
}
