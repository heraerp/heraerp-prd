'use client'

import React, { useState } from 'react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
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
  AlertTriangle
} from 'lucide-react'

// HERA Universal Jewelry Appointment Management Page
// Smart Code: HERA.JWLR.CRM.APT.PAGE.v1

export default function JewelryAppointmentsPage() {
  const { workspace, isAnonymous } = useMultiOrgAuth()
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [calendarView, setCalendarView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('timeGridWeek')
  
  // Demo metrics for jewelry store
  const appointmentMetrics = {
    todayAppointments: 8,
    thisWeekAppointments: 42,
    completionRate: 92,
    averageValue: 25000,
    pendingConfirmations: 3,
    upcomingReminders: 5
  }
  
  const handleAppointmentClick = (appointment: any) => {
    setSelectedAppointment(appointment)
    setShowDetailsModal(true)
  }
  
  const handleSlotClick = (dateInfo: any) => {
    setShowCreateModal(true)
  }
  
  const handleAppointmentCreated = (appointment: any) => {
    // In production, this would refresh the calendar
    console.log('New appointment created:', appointment)
  }
  
  const handleStatusUpdate = (appointmentId: string, newStatus: string, notes?: string) => {
    // In production, this would update the appointment in the database
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
                <div className="text-6xl mb-4">💎</div>
                <h1 className="text-3xl font-bold mb-4">Jewelry Appointment System</h1>
                <p className="text-gray-600 mb-8">
                  Professional appointment management powered by HERA's Universal 6-Table Architecture
                </p>
                <div className="bg-white/50 backdrop-blur-sm rounded-lg p-8 border border-purple-200">
                  <h2 className="text-xl font-semibold mb-4">✨ Smart Features</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      <span>Smart appointment scheduling</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Brain className="w-5 h-5 text-purple-600" />
                      <span>AI-powered optimization</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-purple-600" />
                      <span>Customer relationship management</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      <span>Revenue tracking & analytics</span>
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
                  💎 Jewelry Appointments
                </h1>
                <p className="text-gray-600 mt-2">
                  Professional appointment management with AI-powered insights
                </p>
              </div>
              
              <div className="flex items-center gap-4">
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
            
            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-800">Today</p>
                      <p className="text-2xl font-bold text-purple-900">{appointmentMetrics.todayAppointments}</p>
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
                      <p className="text-2xl font-bold text-blue-900">{appointmentMetrics.thisWeekAppointments}</p>
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
                      <p className="text-2xl font-bold text-green-900">{appointmentMetrics.completionRate}%</p>
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
                      <p className="text-2xl font-bold text-amber-900">₹{appointmentMetrics.averageValue.toLocaleString()}</p>
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
                      <p className="text-2xl font-bold text-yellow-900">{appointmentMetrics.pendingConfirmations}</p>
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
                      <p className="text-2xl font-bold text-indigo-900">{appointmentMetrics.upcomingReminders}</p>
                    </div>
                    <Bell className="h-8 w-8 text-indigo-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  Smart Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer">
                    ✅ 3 appointments ready to confirm
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer">
                    📞 5 reminders to send
                  </Badge>
                  <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 cursor-pointer">
                    🔮 AI suggests optimal scheduling for tomorrow
                  </Badge>
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer">
                    💡 2 upsell opportunities identified
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            {/* Calendar */}
            <Card>
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