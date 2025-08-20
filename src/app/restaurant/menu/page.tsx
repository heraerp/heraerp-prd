'use client'

import React from 'react'
import { useAuth } from '@/components/auth/DualAuthProvider'
// import { MenuManager } from '@/components/restaurant/MenuManager'
import { RestaurantLogin } from '@/components/restaurant/RestaurantLogin'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Home, LogOut, Loader2, ChefHat } from 'lucide-react'
import Link from 'next/link'

export default function MenuPage() {
  const { isAuthenticated, isLoading, logout } = useAuth()

  // Show loading state
  if (isLoading) {
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
          <p className="text-gray-600 text-sm">Loading menu management...</p>
        </Card>
      </div>
    )
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <RestaurantLogin />
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Redirect to new HERA Universal Menu Dashboard
  React.useEffect(() => {
    window.location.href = '/restaurant/menu/dashboard'
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center">
      <Card className="p-12 text-center bg-white/80 backdrop-blur-sm border border-orange-200/50 shadow-xl">
        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center">
          <ChefHat className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Redirecting to HERA Menu System</h2>
        <p className="text-gray-600 text-sm">Loading revolutionary menu management...</p>
        <p className="text-xs text-gray-400 mt-4">🍽️ Universal 6-Table Architecture</p>
      </Card>
    </div>
  )
}