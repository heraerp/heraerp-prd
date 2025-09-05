'use client'

import React, { useState } from 'react'
import { UniversalCalendar } from '@/components/calendar/UniversalCalendar'
import { BookAppointmentModal } from '@/components/salon/BookAppointmentModal'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'

export default function SalonDataCalendarPage() {
  const { currentOrganization } = useMultiOrgAuth()
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ date: Date; time: string } | null>(null)
  
  // Sample organization data for demo
  const salonOrganizations = [
    {
      id: "e3a9ff9e-bb83-43a8-b062-b85e7a2b4258",
      organization_code: "SALON-BR1",
      organization_name: "Hair Talkz • Park Regis Kris Kin (Karama)"
    },
    {
      id: "0b1b37cd-4096-4718-8cd4-e370f234005b",
      organization_code: "SALON-BR2", 
      organization_name: "Hair Talkz • Mercure Gold (Al Mina Rd)"
    },
    {
      id: "849b6efe-2bf0-438f-9c70-01835ac2fe15",
      organization_code: "SALON-GROUP",
      organization_name: "Salon Group"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Salon Calendar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View and manage appointments across all branches
          </p>
        </div>
      </div>
      
      {/* Calendar Container with fixed height */}
      <div className="p-4">
        <div style={{ height: 'calc(100vh - 160px)' }}>
          <UniversalCalendar 
            businessType="salon"
            organizations={salonOrganizations}
            currentOrganizationId={currentOrganization?.id || "e3a9ff9e-bb83-43a8-b062-b85e7a2b4258"}
            onNewBooking={(bookingData: any) => {
              console.log('New booking requested', bookingData)
              if (bookingData.date && bookingData.time) {
                setSelectedTimeSlot({
                  date: bookingData.date,
                  time: bookingData.time
                })
              }
              setIsBookingOpen(true)
            }}
          />
        </div>
      </div>
      
      {/* Booking Modal with Scheduling Assistant */}
      <BookAppointmentModal
        isOpen={isBookingOpen}
        onClose={() => {
          setIsBookingOpen(false)
          setSelectedTimeSlot(null)
        }}
        preSelectedDate={selectedTimeSlot?.date}
        preSelectedTime={selectedTimeSlot?.time}
        onBookingComplete={(appointment) => {
          console.log('Booking completed:', appointment)
          // In a real implementation, refresh the calendar
          setIsBookingOpen(false)
          setSelectedTimeSlot(null)
        }}
      />
    </div>
  )
}