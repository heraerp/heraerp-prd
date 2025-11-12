/**
 * HERA Apps Index Page
 * Smart Code: HERA.PLATFORM.APPS.INDEX.v1
 * 
 * Landing page for HERA application modules
 * Redirects to appropriate destination based on user context
 */

'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Loader2, Grid3X3 } from 'lucide-react'

export default function AppsIndexPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useHERAAuth()

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Redirect authenticated users to the retail dashboard for now
        // In the future, this could be role-based or preference-based
        router.replace('/retail/dashboard')
      } else {
        // Redirect unauthenticated users to login
        router.replace('/retail/login')
      }
    }
  }, [isAuthenticated, isLoading, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full blur-lg opacity-30" />
            <div className="relative bg-indigo-800 p-4 rounded-2xl border border-indigo-700">
              <Grid3X3 className="h-8 w-8 text-indigo-400 animate-pulse" />
            </div>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-4">
          HERA Application Modules
        </h1>
        
        <div className="flex items-center gap-2 text-indigo-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading your workspace...</span>
        </div>
      </div>
    </div>
  )
}