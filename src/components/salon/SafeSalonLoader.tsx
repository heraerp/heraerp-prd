/**
 * Safe Salon Dashboard Loader
 * Bypasses complex auth flows for direct salon access
 */

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { getSafeOrgConfig, setSafeOrgContext } from '@/lib/salon/safe-org-loader'
import { supabase } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

interface SafeSalonLoaderProps {
  children: React.ReactNode
  fallbackUrl?: string
}

export function SafeSalonLoader({ children, fallbackUrl = '/auth/login' }: SafeSalonLoaderProps) {
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function initializeSafeAccess() {
      try {
        console.log('🛡️ Safe Salon Loader: Initializing...')
        
        // Get safe organization config
        const config = setSafeOrgContext()
        console.log('✅ Safe org config loaded:', config)

        // Check if user is authenticated
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError)
          throw new Error(`Session error: ${sessionError.message}`)
        }

        if (!session) {
          console.log('🚪 No session, redirecting to auth...')
          router.push(fallbackUrl)
          return
        }

        console.log('✅ Session found:', session.user.email)

        // Small delay to ensure all providers are ready
        setTimeout(() => {
          if (mounted) {
            setIsReady(true)
            console.log('🎯 Safe Salon Loader: Ready!')
          }
        }, 500)

      } catch (error: any) {
        console.error('❌ Safe Salon Loader error:', error)
        if (mounted) {
          setError(error.message)
        }
      }
    }

    initializeSafeAccess()

    return () => {
      mounted = false
    }
  }, [router, fallbackUrl])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-red-400 mb-4">❌ {error}</div>
          <button
            onClick={() => router.push(fallbackUrl)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-400" />
          <p className="text-gray-300">Loading Salon Dashboard...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

/**
 * Quick access button for development
 */
export function QuickSalonAccess() {
  const router = useRouter()
  
  const handleQuickAccess = () => {
    setSafeOrgContext()
    router.push('/salon/dashboard')
  }

  return (
    <button
      onClick={handleQuickAccess}
      className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition-colors"
    >
      🚀 Quick Salon Access
    </button>
  )
}