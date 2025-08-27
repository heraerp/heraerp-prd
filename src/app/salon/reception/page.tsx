'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { SalonProductionSidebar } from '@/components/salon/SalonProductionSidebar'
import { WaitingRoomDisplay } from '@/components/salon/appointments/WaitingRoomDisplay'
import { StaffStatusDisplay } from '@/components/salon/staff/StaffStatusDisplay'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'

export default function ReceptionPage() {
  const router = useRouter()
  const { currentOrganization, isAuthenticated, contextLoading } = useMultiOrgAuth()
  
  // For demo purposes, we'll bypass auth checks
  if (contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin mx-auto mb-4 border-4 border-purple-600 border-t-transparent rounded-full" />
          <p className="text-gray-600">Loading reception dashboard...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white flex">
      <SalonProductionSidebar />
      <div className="flex-1 ml-16">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/salon')}
              className="mb-4"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Reception Dashboard
                </h1>
                <p className="text-gray-600 text-lg">
                  Real-time view of waiting clients and staff availability
                </p>
              </div>
              <Button 
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={() => router.push('/salon/appointments/new')}
              >
                New Walk-In
              </Button>
            </div>
          </div>
          
          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WaitingRoomDisplay />
            <StaffStatusDisplay />
          </div>
          
          {/* Quick Actions */}
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20"
              onClick={() => router.push('/salon/appointments')}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">📅</div>
                <div>View All Appointments</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="h-20"
              onClick={() => router.push('/salon/clients')}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">👥</div>
                <div>Client Directory</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="h-20"
              onClick={() => router.push('/salon/services')}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">💅</div>
                <div>Service Menu</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="h-20"
              onClick={() => router.push('/salon/pos')}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">💰</div>
                <div>Quick Payment</div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}