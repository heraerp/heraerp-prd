/**
 * HERA Retail Root Page
 * Smart Code: HERA.RETAIL.ROOT.v1
 * 
 * Root page for retail system - redirects to appropriate destination
 */

'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Loader2, ShoppingBag } from 'lucide-react'

export default function RetailRootPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useHERAAuth()

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/retail/dashboard')
      } else {
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
              <ShoppingBag className="h-8 w-8 text-indigo-400 animate-pulse" />
            </div>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-4">
          HERA Retail & Distribution
        </h1>
        
        <div className="flex items-center gap-2 text-indigo-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Initializing Retail Management System...</span>
        </div>
      </div>
    </div>
  )
}