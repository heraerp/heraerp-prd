'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DocsPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the docs hub
    router.push('/docs/hub')
  }, [router])

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Documentation</h1>
        <p className="text-slate-400 mb-4">
          Complete developer documentation and API references for HERA ERP.
        </p>
        <p className="text-slate-500 text-sm">Redirecting to documentation hub...</p>
      </div>
    </div>
  )
}
