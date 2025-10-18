/**
 * Direct Salon Dashboard Access
 * Safe route that bypasses complex auth flows
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SafeSalonLoader } from '@/components/salon/SafeSalonLoader'
import { getSalonDashboardUrl, setSafeOrgContext } from '@/lib/salon/safe-org-loader'

export default function DirectSalonAccess() {
  const router = useRouter()

  useEffect(() => {
    async function handleAccess() {
      // Check if user is authenticated first
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        console.log('🚪 No session found, redirecting to quick login...')
        router.push('/salon/quick-login')
        return
      }
      
      // Set safe context and redirect
      const config = setSafeOrgContext()
      console.log('🎯 Direct salon access with org:', config.organizationId)
      
      // Redirect to main dashboard after brief delay
      const timer = setTimeout(() => {
        router.push('/salon/dashboard')
      }, 1000)

      return () => clearTimeout(timer)
    }
    
    handleAccess()
  }, [router])

  return (
    <SafeSalonLoader>
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">💇‍♀️</div>
          <h1 className="text-2xl font-bold text-white mb-2">Hair Talkz Salon</h1>
          <p className="text-gray-400 mb-4">Redirecting to dashboard...</p>
          <div className="w-64 h-2 bg-gray-700 rounded-full mx-auto">
            <div className="h-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full animate-pulse w-3/4"></div>
          </div>
        </div>
      </div>
    </SafeSalonLoader>
  )
}