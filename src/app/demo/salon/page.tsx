'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Loader2 } from 'lucide-react'

export default function SalonDemoPage() {
  const router = useRouter()
  const { initializeDemo } = useHERAAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    
    async function setupDemoSession() {
      // Prevent multiple calls
      if (!mounted) return
      
      try {
        console.log('🚀 Initializing salon demo session...')
        
        // Initialize demo session
        const success = await initializeDemo('salon-receptionist')
        
        if (mounted && success) {
          console.log('✅ Demo session created, redirecting to salon dashboard...')
          // Small delay to ensure session is fully set
          setTimeout(() => {
            if (mounted) {
              router.push('/salon/dashboard')
            }
          }, 500)
        } else if (mounted) {
          setError('Failed to initialize demo session')
          setIsLoading(false)
        }
      } catch (err) {
        if (mounted) {
          console.error('❌ Demo initialization error:', err)
          setError(err instanceof Error ? err.message : 'Failed to initialize demo')
          setIsLoading(false)
        }
      }
    }

    setupDemoSession()
    
    return () => {
      mounted = false
    }
  }, []) // Remove dependencies to prevent re-runs

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Setting up Hair Talkz Salon Demo</h2>
          <p className="text-gray-600">Creating your demo session...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Demo Setup Failed</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}