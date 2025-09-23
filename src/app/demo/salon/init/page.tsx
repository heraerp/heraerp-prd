'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

export default function SalonDemoInitPage() {
  const router = useRouter()
  const { initializeDemo } = useHERAAuth()

  useEffect(() => {
    async function setupSalonDemo() {
      console.log('🎯 Initializing salon demo session...')

      // Initialize the demo session
      const success = await initializeDemo('salon-receptionist')

      if (success) {
        console.log('✅ Demo session initialized, redirecting to dashboard...')
        // Small delay to ensure cookies are set
        setTimeout(() => {
          router.push('/salon/dashboard')
        }, 100)
      } else {
        console.error('❌ Failed to initialize demo session')
        router.push('/demo')
      }
    }

    setupSalonDemo()
  }, [initializeDemo, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Setting up salon demo...</p>
      </div>
    </div>
  )
}
