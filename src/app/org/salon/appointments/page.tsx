'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Plus, Search, Filter } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

function SalonAppointmentsContent() {

  const searchParams = useSearchParams()
  const action = searchParams.get('action')
  const [showNewAppointment, setShowNewAppointment] = useState(false)

  useEffect(() => {
    if (action === 'new') {
      setShowNewAppointment(true)
    }
  }, [action])

  
return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Appointments
          </h1>
          <p className="text-gray-600 mt-1">Manage bookings and schedules</p>
        </div>
        <Button 
          onClick={() => setShowNewAppointment(true)}
          className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Appointment
        </Button>
      </div>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Today's Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">Jennifer Smith</h3>
                  <p className="text-sm text-gray-600">Full Color Treatment • 2:00 PM - 4:00 PM</p>
                  <p className="text-sm text-gray-500">with Sarah Johnson</p>
                </div>
                <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                  Confirmed
                </span>
              </div>
            </div>
            <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">Amanda Wilson</h3>
                  <p className="text-sm text-gray-600">Gel Manicure • 3:30 PM - 4:30 PM</p>
                  <p className="text-sm text-gray-500">with Maria Rodriguez</p>
                </div>
                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                  Pending
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today</p>
                <p className="text-2xl font-bold">15</p>
              </div>
              <Calendar className="w-8 h-8 text-pink-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold">87</p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Confirmed</p>
                <p className="text-2xl font-bold">82</p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cancellations</p>
                <p className="text-2xl font-bold">5</p>
              </div>
              <Calendar className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

}

export default function SalonAppointmentsPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto">Loading...</div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <SalonAppointmentsContent />
    </Suspense>
  )
}