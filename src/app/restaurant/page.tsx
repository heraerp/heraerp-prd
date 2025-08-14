'use client'

import React, { useState, useEffect } from 'react'
import { useProgressiveAuth } from "@/components/auth/ProgressiveAuthProvider"
import { UnifiedRestaurantInterface } from '@/components/restaurant/UnifiedRestaurantInterface'
import { RestaurantLogin } from '@/components/restaurant/RestaurantLogin'
import { Card } from '@/components/ui/card'
import { Loader2, ChefHat } from 'lucide-react'

// Restaurant Management System - Powered by HERA Universal Platform
function RestaurantApp() {
  const { isRegistered, isLoading } = useProgressiveAuth()
  const [appLoading, setAppLoading] = useState(true)

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => setAppLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (appLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center">
        <Card className="p-12 text-center bg-white/80 backdrop-blur-sm border border-orange-200/50 shadow-xl">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <div className="mb-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">HERA Restaurant</h2>
          <p className="text-gray-600 text-sm">Loading your restaurant management system...</p>
          <p className="text-xs text-gray-400 mt-4">Powered by HERA Universal Platform</p>
        </Card>
      </div>
    )
  }

  if (isRegistered) {
    return <UnifiedRestaurantInterface />
  }

  return <RestaurantLogin />
}

// Main page component - auth provider now handled by layout
export default function RestaurantPage() {
  return <RestaurantApp />
}