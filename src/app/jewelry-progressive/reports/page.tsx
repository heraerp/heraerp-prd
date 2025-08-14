'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { JewelryTeamsSidebar } from '@/components/jewelry-progressive/JewelryTeamsSidebar'
import { 
  UniversalAppointmentCalendar,
  AppointmentDetailsModal,
  CreateAppointmentModal 
} from '@/components/universal-business-components/appointments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar,
  Clock,
  Users,
  TrendingUp,
  Brain,
  Settings,
  Plus,
  Bell,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  FileText
} from 'lucide-react'

// HERA Universal Jewelry Calendar/Reports Page
// Smart Code: HERA.JWLR.CRM.RPT.CALENDAR.v1
// Note: Transformed from Reports to Calendar view per user request

export default function JewelryReportsCalendarPage() {
  const { workspace, isAnonymous } = useAuth()
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [calendarView, setCalendarView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('timeGridWeek')
  
  // Demo metrics for jewelry store calendar/reporting
  const calendarMetrics = {
    todayAppointments: 8,
    thisWeekBookings: 42,
    completionRate: 92,
    averageBookingValue: 25000,
    pendingConfirmations: 3,
    upcomingReminders: 5,
    totalRevenue: 125000,
    monthlyGrowth: 18
  }
  
  const handleAppointmentClick = (appointment: any) => {
    setSelectedAppointment(appointment)
    setShowDetailsModal(true)
  }
  
  const handleSlotClick = (dateInfo: any) => {
    setShowCreateModal(true)
  }
  
  const handleAppointmentCreated = (appointment: any) => {
    console.log('New appointment created:', appointment)
  }
  
  const handleStatusUpdate = (appointmentId: string, newStatus: string, notes?: string) => {
    console.log('Status update:', { appointmentId, newStatus, notes })
    setShowDetailsModal(false)
  }
  
  if (isAnonymous) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="flex">
          <JewelryTeamsSidebar />
          <main className="flex-1 p-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h1 className="text-3xl font-bold mb-4">Jewelry Appointments</h1>
                <p className="text-gray-600 mb-8">
                  Smart appointment system with integrated analytics powered by HERA's Universal 6-Table Architecture
                </p>
                <div className="bg-white/50 backdrop-blur-sm rounded-lg p-8 border border-purple-200">
                  <h2 className="text-xl font-semibold mb-4">✨ Appointment Features</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      <span>Interactive appointment calendar</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                      <span>Real-time booking analytics</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      <span>Revenue tracking & insights</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Brain className="w-5 h-5 text-purple-600" />
                      <span>AI-powered business intelligence</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="flex">
        <JewelryTeamsSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  📅 Appointments
                </h1>
                <p className="text-gray-600 mt-2">
                  Interactive appointment calendar with integrated business analytics and reporting
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <Button variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Appointment
                </Button>
              </div>
            </div>
            
            {/* Comprehensive Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-8 gap-6">
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-800">Today</p>
                      <p className="text-2xl font-bold text-purple-900">{calendarMetrics.todayAppointments}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-800">This Week</p>
                      <p className="text-2xl font-bold text-blue-900">{calendarMetrics.thisWeekBookings}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">Completion</p>
                      <p className="text-2xl font-bold text-green-900">{calendarMetrics.completionRate}%</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-800">Avg Value</p>
                      <p className="text-2xl font-bold text-amber-900">₹{calendarMetrics.averageBookingValue.toLocaleString()}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-amber-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Pending</p>
                      <p className="text-2xl font-bold text-yellow-900">{calendarMetrics.pendingConfirmations}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-indigo-800">Reminders</p>
                      <p className="text-2xl font-bold text-indigo-900">{calendarMetrics.upcomingReminders}</p>
                    </div>
                    <Bell className="h-8 w-8 text-indigo-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-800">Revenue</p>
                      <p className="text-2xl font-bold text-emerald-900">₹{calendarMetrics.totalRevenue.toLocaleString()}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-emerald-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-pink-800">Growth</p>
                      <p className="text-2xl font-bold text-pink-900">+{calendarMetrics.monthlyGrowth}%</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-pink-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Smart Reporting Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  Smart Calendar Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer">
                    📈 Booking rate up 18% this month
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer">
                    ⭐ Peak booking time: 2-4 PM weekdays
                  </Badge>
                  <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 cursor-pointer">
                    💎 Highest value services: Custom Design & Appraisal
                  </Badge>
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer">
                    📊 Weekend bookings increased 25%
                  </Badge>
                  <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-200 cursor-pointer">
                    🎯 Best conversion rate: Engagement consultations
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            {/* Calendar with Reporting Context */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    Interactive Calendar Reports
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={calendarView === 'dayGridMonth' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCalendarView('dayGridMonth')}
                    >
                      Month
                    </Button>
                    <Button
                      variant={calendarView === 'timeGridWeek' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCalendarView('timeGridWeek')}
                    >
                      Week
                    </Button>
                    <Button
                      variant={calendarView === 'timeGridDay' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCalendarView('timeGridDay')}
                    >
                      Day
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <UniversalAppointmentCalendar
                  organizationId={workspace?.organization_id || 'demo-org'}
                  industry="jewelry"
                  viewType={calendarView}
                  onAppointmentClick={handleAppointmentClick}
                  onSlotClick={handleSlotClick}
                  onAppointmentChange={(appointment) => {
                    console.log('Appointment changed:', appointment)
                  }}
                  customization={{
                    primaryColor: "#8B5CF6",
                    brandName: "HERA Jewelry Reports",
                    showRevenueMetrics: true,
                    enableReporting: true
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      
      {/* Modals */}
      <AppointmentDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        appointment={selectedAppointment}
        industry="jewelry"
        onStatusUpdate={handleStatusUpdate}
        onAppointmentUpdate={(appointmentId, updates) => {
          console.log('Appointment updated:', { appointmentId, updates })
        }}
      />
      
      <CreateAppointmentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        industry="jewelry"
        organizationId={workspace?.organization_id || 'demo-org'}
        onAppointmentCreated={handleAppointmentCreated}
      />
    </div>
  )
}