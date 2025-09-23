'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DemoInitPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Initializing demo session...')

  useEffect(() => {
    async function initializeDemo() {
      try {
        console.log('🚀 Starting demo initialization...')
        
        // Call the demo initialization API
        const response = await fetch('/api/v1/demo/initialize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ demoType: 'salon-receptionist' })
        })

        const result = await response.json()
        console.log('📦 Demo initialization result:', result)

        if (result.success) {
          setStatus('success')
          setMessage('Demo session initialized! Redirecting...')
          
          // Set the organization cookie manually as backup
          document.cookie = `HERA_ORG_ID=${result.user.organization_id}; Path=/; Max-Age=${60*60*24*365}; SameSite=Lax`
          
          // Redirect after a short delay
          setTimeout(() => {
            router.push('/salon/dashboard')
          }, 1000)
        } else {
          setStatus('error')
          setMessage(result.error || 'Failed to initialize demo session')
          console.error('❌ Demo initialization failed:', result)
        }
      } catch (error) {
        setStatus('error')
        setMessage('Network error. Please check your connection.')
        console.error('💥 Demo initialization error:', error)
      }
    }

    initializeDemo()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            {status === 'loading' && (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Setting Up Demo</h2>
              </>
            )}
            
            {status === 'success' && (
              <>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Success!</h2>
              </>
            )}
            
            {status === 'error' && (
              <>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
              </>
            )}
            
            <p className="text-gray-600">{message}</p>
            
            {status === 'error' && (
              <div className="mt-6">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs text-gray-600 font-mono">
            <p>Status: {status}</p>
            <p>Message: {message}</p>
          </div>
        )}
      </div>
    </div>
  )
}