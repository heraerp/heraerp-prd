'use client'

import React, { useState } from 'react'
import { useSecuredSalonContext } from '../../SecuredSalonProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import {
  Calendar,
  Clock,
  CheckCircle,
  Users,
  MessageCircle,
  CreditCard,
  AlertCircle,
  UserPlus,
  Phone,
  Search,
  DollarSign,
  TrendingUp,
  XCircle,
  Loader2,
  ArrowRight,
  Star,
  Coffee,
  Scissors
} from 'lucide-react'
import { LUXE_COLORS } from '@/lib/constants/salon'
import Link from 'next/link'

export default function ReceptionistDashboard() {
  const { organizationId, role, user, isLoading, isAuthenticated } = useSecuredSalonContext()
  const [searchQuery, setSearchQuery] = useState('')

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: LUXE_COLORS.charcoal }}
      >
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: LUXE_COLORS.gold }} />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  // Mock data for receptionist view
  const todayStats = {
    appointments: 12,
    completed: 5,
    inProgress: 2,
    upcoming: 5,
    walkIns: 3,
    revenue: 3450,
    averageServiceTime: '45 mins',
    nextAppointment: '10 mins'
  }

  const upcomingAppointments = [
    {
      id: 1,
      time: '10:30 AM',
      client: 'Sarah Johnson',
      service: 'Hair Color & Cut',
      stylist: 'Emma',
      status: 'confirmed',
      phone: '+971 50 123 4567'
    },
    {
      id: 2,
      time: '11:00 AM',
      client: 'Maria Garcia',
      service: 'Manicure & Pedicure',
      stylist: 'Lisa',
      status: 'confirmed',
      phone: '+971 50 234 5678'
    },
    {
      id: 3,
      time: '11:30 AM',
      client: 'Jennifer Lee',
      service: 'Facial Treatment',
      stylist: 'Sophie',
      status: 'pending',
      phone: '+971 50 345 6789'
    },
    {
      id: 4,
      time: '12:00 PM',
      client: 'Amanda White',
      service: 'Hair Styling',
      stylist: 'Emma',
      status: 'confirmed',
      phone: '+971 50 456 7890'
    }
  ]

  const waitingClients = [
    { id: 1, name: 'Walk-in Client', service: 'Haircut', waitTime: '15 mins', status: 'waiting' },
    { id: 2, name: 'Jessica Brown', service: 'Hair Color', waitTime: '5 mins', status: 'waiting' },
    { id: 3, name: 'Walk-in Client', service: 'Beard Trim', waitTime: '20 mins', status: 'waiting' }
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: LUXE_COLORS.charcoal }}>
      <div className="container mx-auto px-6 py-8">
        {/* Header with Search */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-light mb-2" style={{ color: LUXE_COLORS.gold }}>
                Reception Dashboard
              </h1>
              <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                Welcome back, {user?.user_metadata?.full_name || 'Receptionist'} •{' '}
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                  style={{ color: LUXE_COLORS.bronze }}
                />
                <Input
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                  style={{
                    backgroundColor: LUXE_COLORS.charcoalLight,
                    border: `1px solid ${LUXE_COLORS.bronze}30`,
                    color: LUXE_COLORS.champagne
                  }}
                />
              </div>
              <Button style={{ backgroundColor: LUXE_COLORS.gold, color: LUXE_COLORS.black }}>
                <UserPlus className="h-4 w-4 mr-2" />
                Walk-in
              </Button>
            </div>
          </div>
        </div>

        {/* Today's Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card
            className="border-0"
            style={{
              backgroundColor: LUXE_COLORS.charcoalLight,
              borderColor: `${LUXE_COLORS.bronze}30`
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                    Today's Appointments
                  </p>
                  <p className="text-3xl font-light mt-1" style={{ color: LUXE_COLORS.gold }}>
                    {todayStats.appointments}
                  </p>
                  <div className="flex gap-4 mt-2">
                    <span
                      className="text-xs flex items-center gap-1"
                      style={{ color: LUXE_COLORS.emerald }}
                    >
                      <CheckCircle className="h-3 w-3" />
                      {todayStats.completed} done
                    </span>
                    <span
                      className="text-xs flex items-center gap-1"
                      style={{ color: LUXE_COLORS.orange }}
                    >
                      <Clock className="h-3 w-3" />
                      {todayStats.upcoming} upcoming
                    </span>
                  </div>
                </div>
                <Calendar className="h-8 w-8 opacity-50" style={{ color: LUXE_COLORS.gold }} />
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-0"
            style={{
              backgroundColor: LUXE_COLORS.charcoalLight,
              borderColor: `${LUXE_COLORS.bronze}30`
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                    Walk-ins Waiting
                  </p>
                  <p className="text-3xl font-light mt-1" style={{ color: LUXE_COLORS.orange }}>
                    {todayStats.walkIns}
                  </p>
                  <p className="text-xs mt-2" style={{ color: LUXE_COLORS.bronze }}>
                    Avg wait: 15 mins
                  </p>
                </div>
                <Users className="h-8 w-8 opacity-50" style={{ color: LUXE_COLORS.orange }} />
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-0"
            style={{
              backgroundColor: LUXE_COLORS.charcoalLight,
              borderColor: `${LUXE_COLORS.bronze}30`
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                    In Service
                  </p>
                  <p className="text-3xl font-light mt-1" style={{ color: LUXE_COLORS.emerald }}>
                    {todayStats.inProgress}
                  </p>
                  <p className="text-xs mt-2" style={{ color: LUXE_COLORS.bronze }}>
                    Avg time: {todayStats.averageServiceTime}
                  </p>
                </div>
                <Scissors className="h-8 w-8 opacity-50" style={{ color: LUXE_COLORS.emerald }} />
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-0"
            style={{
              backgroundColor: LUXE_COLORS.charcoalLight,
              borderColor: `${LUXE_COLORS.bronze}30`
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                    Today's Revenue
                  </p>
                  <p className="text-3xl font-light mt-1" style={{ color: LUXE_COLORS.gold }}>
                    AED {todayStats.revenue.toLocaleString()}
                  </p>
                  <p
                    className="text-xs mt-2 flex items-center gap-1"
                    style={{ color: LUXE_COLORS.emerald }}
                  >
                    <TrendingUp className="h-3 w-3" />
                    +12% from yesterday
                  </p>
                </div>
                <DollarSign className="h-8 w-8 opacity-50" style={{ color: LUXE_COLORS.gold }} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
          <Link href="/salon/appointments/new" className="block">
            <Card
              className="border-0 hover:scale-[1.02] transition-transform cursor-pointer h-full"
              style={{
                backgroundColor: LUXE_COLORS.charcoalLight,
                border: `1px solid ${LUXE_COLORS.bronze}30`
              }}
            >
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                  style={{
                    backgroundColor: `${LUXE_COLORS.gold}20`,
                    border: `1px solid ${LUXE_COLORS.gold}40`
                  }}
                >
                  <Calendar className="h-6 w-6" style={{ color: LUXE_COLORS.gold }} />
                </div>
                <h3 className="font-medium" style={{ color: LUXE_COLORS.champagne }}>
                  Book Appointment
                </h3>
                <p className="text-xs mt-1" style={{ color: LUXE_COLORS.bronze }}>
                  Schedule new booking
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/salon/pos" className="block">
            <Card
              className="border-0 hover:scale-[1.02] transition-transform cursor-pointer h-full"
              style={{
                backgroundColor: LUXE_COLORS.charcoalLight,
                border: `1px solid ${LUXE_COLORS.bronze}30`
              }}
            >
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                  style={{
                    backgroundColor: `${LUXE_COLORS.emerald}20`,
                    border: `1px solid ${LUXE_COLORS.emerald}40`
                  }}
                >
                  <CreditCard className="h-6 w-6" style={{ color: LUXE_COLORS.emerald }} />
                </div>
                <h3 className="font-medium" style={{ color: LUXE_COLORS.champagne }}>
                  Process Payment
                </h3>
                <p className="text-xs mt-1" style={{ color: LUXE_COLORS.bronze }}>
                  Checkout & billing
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/salon/customers/new" className="block">
            <Card
              className="border-0 hover:scale-[1.02] transition-transform cursor-pointer h-full"
              style={{
                backgroundColor: LUXE_COLORS.charcoalLight,
                border: `1px solid ${LUXE_COLORS.bronze}30`
              }}
            >
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                  style={{
                    backgroundColor: `${LUXE_COLORS.plum}20`,
                    border: `1px solid ${LUXE_COLORS.plum}40`
                  }}
                >
                  <UserPlus className="h-6 w-6" style={{ color: LUXE_COLORS.plum }} />
                </div>
                <h3 className="font-medium" style={{ color: LUXE_COLORS.champagne }}>
                  Add Customer
                </h3>
                <p className="text-xs mt-1" style={{ color: LUXE_COLORS.bronze }}>
                  Register new client
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/salon/whatsapp" className="block">
            <Card
              className="border-0 hover:scale-[1.02] transition-transform cursor-pointer h-full"
              style={{
                backgroundColor: LUXE_COLORS.charcoalLight,
                border: `1px solid ${LUXE_COLORS.bronze}30`
              }}
            >
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                  style={{
                    backgroundColor: `${LUXE_COLORS.emerald}20`,
                    border: `1px solid ${LUXE_COLORS.emerald}40`
                  }}
                >
                  <MessageCircle className="h-6 w-6" style={{ color: LUXE_COLORS.emerald }} />
                </div>
                <h3 className="font-medium" style={{ color: LUXE_COLORS.champagne }}>
                  WhatsApp
                </h3>
                <p className="text-xs mt-1" style={{ color: LUXE_COLORS.bronze }}>
                  Send messages
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Appointments */}
          <Card
            className="border-0"
            style={{
              backgroundColor: LUXE_COLORS.charcoalLight,
              border: `1px solid ${LUXE_COLORS.bronze}30`
            }}
          >
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle style={{ color: LUXE_COLORS.gold }}>Upcoming Appointments</CardTitle>
                  <CardDescription style={{ color: LUXE_COLORS.bronze }}>
                    Next appointments for today
                  </CardDescription>
                </div>
                <Link href="/salon/appointments">
                  <Button variant="outline" size="sm" style={{ borderColor: LUXE_COLORS.bronze }}>
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingAppointments.map(apt => (
                  <div
                    key={apt.id}
                    className="p-4 rounded-lg flex justify-between items-start"
                    style={{ backgroundColor: LUXE_COLORS.charcoal }}
                  >
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p style={{ color: LUXE_COLORS.champagne }}>{apt.client}</p>
                          <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                            {apt.service} with {apt.stylist}
                          </p>
                          <p
                            className="text-xs mt-1 flex items-center gap-1"
                            style={{ color: LUXE_COLORS.bronze }}
                          >
                            <Clock className="h-3 w-3" />
                            {apt.time}
                            <span className="mx-2">•</span>
                            <Phone className="h-3 w-3" />
                            {apt.phone}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs px-2 py-1 rounded"
                            style={{
                              backgroundColor:
                                apt.status === 'confirmed'
                                  ? `${LUXE_COLORS.emerald}20`
                                  : `${LUXE_COLORS.orange}20`,
                              color:
                                apt.status === 'confirmed'
                                  ? LUXE_COLORS.emerald
                                  : LUXE_COLORS.orange
                            }}
                          >
                            {apt.status}
                          </span>
                          <Button
                            size="sm"
                            style={{ backgroundColor: LUXE_COLORS.gold, color: LUXE_COLORS.black }}
                          >
                            Check In
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Walk-in Queue */}
          <Card
            className="border-0"
            style={{
              backgroundColor: LUXE_COLORS.charcoalLight,
              border: `1px solid ${LUXE_COLORS.bronze}30`
            }}
          >
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle style={{ color: LUXE_COLORS.gold }}>Walk-in Queue</CardTitle>
                  <CardDescription style={{ color: LUXE_COLORS.bronze }}>
                    Clients waiting for service
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  style={{ backgroundColor: LUXE_COLORS.gold, color: LUXE_COLORS.black }}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Walk-in
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {waitingClients.length > 0 ? (
                <div className="space-y-3">
                  {waitingClients.map(client => (
                    <div
                      key={client.id}
                      className="p-4 rounded-lg"
                      style={{ backgroundColor: LUXE_COLORS.charcoal }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p style={{ color: LUXE_COLORS.champagne }}>{client.name}</p>
                          <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                            {client.service} • Waiting {client.waitTime}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            style={{ borderColor: LUXE_COLORS.bronze }}
                          >
                            <Coffee className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            style={{ backgroundColor: LUXE_COLORS.emerald, color: 'white' }}
                          >
                            Assign
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users
                    className="h-12 w-12 mx-auto mb-3 opacity-50"
                    style={{ color: LUXE_COLORS.bronze }}
                  />
                  <p style={{ color: LUXE_COLORS.bronze }}>No clients waiting</p>
                  <p className="text-sm mt-1" style={{ color: LUXE_COLORS.bronze }}>
                    Add walk-ins as they arrive
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Next Appointment Alert */}
        <Alert
          className="mt-6"
          style={{
            backgroundColor: `${LUXE_COLORS.gold}10`,
            border: `1px solid ${LUXE_COLORS.gold}30`
          }}
        >
          <AlertCircle className="h-4 w-4" style={{ color: LUXE_COLORS.gold }} />
          <AlertDescription style={{ color: LUXE_COLORS.champagne }}>
            <span className="font-medium">Next appointment in {todayStats.nextAppointment}</span> -
            Sarah Johnson for Hair Color & Cut with Emma
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
