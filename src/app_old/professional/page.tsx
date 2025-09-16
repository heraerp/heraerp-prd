'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProfessionalPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to discover page for now as professional services demo is in development
    router.push('/discover')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground dark:text-foreground mb-2">
          Professional Services Demo
        </h2>
        <p className="text-muted-foreground dark:text-slate-300">Coming soon...</p>
      </div>
    </div>
  )
}
