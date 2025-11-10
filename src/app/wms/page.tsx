/**
 * WMS Root Page
 * Smart Code: HERA.WMS.ROOT.v1
 * 
 * Root page for WMS system - redirects to appropriate destination
 */

'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Loader2, Truck } from 'lucide-react'

export default function WMSRootPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useHERAAuth()

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/wms/dashboard')
      } else {
        router.replace('/wms/login')
      }
    }
  }, [isAuthenticated, isLoading, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-lg opacity-30" />
            <div className="relative bg-slate-800 p-4 rounded-2xl border border-slate-700">
              <Truck className="h-8 w-8 text-green-400 animate-pulse" />
            </div>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-4">
          HERA WMS
        </h1>
        
        <div className="flex items-center gap-2 text-slate-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Initializing Waste Management System...</span>
        </div>
      </div>
    </div>
  )
}