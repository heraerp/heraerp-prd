'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RetailPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to discover page for now as retail demo is in development
    router.push('/discover')
  }, [router])
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
          Retail Chain Demo
        </h2>
        <p className="text-slate-600 dark:text-slate-300">
          Coming soon...
        </p>
      </div>
    </div>
  )
}