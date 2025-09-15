'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AnalyticsDemoPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to analytics chat v2 which is the demo
    router.push('/analytics-chat-v2')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
          Analytics Demo
        </h2>
        <p className="text-slate-600 dark:text-slate-300">Loading analytics suite...</p>
      </div>
    </div>
  )
}
