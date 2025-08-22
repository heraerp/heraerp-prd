'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Star,
  Clock,
  Scissors,
  Package,
  CreditCard,
  BarChart,
  Settings,
  Heart,
  Sparkles,
  CalendarCheck,
  UserCheck,
  PackageCheck,
  TrendingUp,
  Plus,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

// Default organization ID for development
const DEFAULT_ORG_ID = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'

const statsCards = [
  {
    title: 'Today\'s Appointments',
    value: '12',
    change: '+3 from yesterday',
    icon: CalendarCheck,
    color: 'from-pink-500 to-rose-500',
    bgColor: 'from-pink-50 to-rose-50',
    borderColor: 'border-pink-200'
  },
  {
    title: 'Active Customers',
    value: '248',
    change: '+12 this week',
    icon: UserCheck,
    color: 'from-purple-500 to-violet-500',
    bgColor: 'from-purple-50 to-violet-50',
    borderColor: 'border-purple-200'
  },
  {
    title: 'Today\'s Revenue',
    value: 'AED 3,450',
    change: '+15% from average',
    icon: TrendingUp,
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'from-emerald-50 to-teal-50',
    borderColor: 'border-emerald-200'
  },
  {
    title: 'Products in Stock',
    value: '156',
    change: '8 low stock items',
    icon: PackageCheck,
    color: 'from-amber-500 to-orange-500',
    bgColor: 'from-amber-50 to-orange-50',
    borderColor: 'border-amber-200'
  }
]

const quickActions = [
  {
    title: 'New Appointment',
    description: 'Book a service for a customer',
    icon: CalendarCheck,
    href: '/salon/appointments/new',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    title: 'New Customer',
    description: 'Add a new customer profile',
    icon: UserCheck,
    href: '/salon/customers/new',
    color: 'from-purple-500 to-pink-500'
  },
  {
    title: 'New Sale',
    description: 'Process product or service sale',
    icon: CreditCard,
    href: '/salon/pos',
    color: 'from-green-500 to-emerald-500'
  },
  {
    title: 'View Reports',
    description: 'Check business analytics',
    icon: BarChart,
    href: '/salon/reports',
    color: 'from-orange-500 to-red-500'
  }
]

const upcomingAppointments = [
  { time: '10:00 AM', customer: 'Sarah Johnson', service: 'Hair Color & Cut', staff: 'Emma', status: 'confirmed' },
  { time: '11:30 AM', customer: 'Maya Patel', service: 'Manicure & Pedicure', staff: 'Lisa', status: 'confirmed' },
  { time: '2:00 PM', customer: 'Fatima Al Rashid', service: 'Facial Treatment', staff: 'Nina', status: 'pending' },
  { time: '3:30 PM', customer: 'Aisha Khan', service: 'Hair Styling', staff: 'Emma', status: 'confirmed' }
]

export default function SalonDashboard() {
  const router = useRouter()
  const { currentOrganization, isAuthenticated, isLoading: authLoading } = useMultiOrgAuth()

  // Use organization from context or default
  const organizationId = currentOrganization?.id || DEFAULT_ORG_ID
  
  // Simple loading check
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading salon dashboard...</p>
        </div>
      </div>
    )
  }

  const salonName = currentOrganization?.name || 'Dubai Luxury Salon & Spa'

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome to {salonName}
              </h1>
              <p className="text-gray-600 text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                Your beauty business management hub
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-4 py-2">
                <Heart className="w-4 h-4 mr-2" />
                Professional Plan
              </Badge>
              <Button variant="outline" onClick={() => router.push('/salon/settings')}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index} className={`bg-gradient-to-br ${stat.bgColor} ${stat.borderColor} border-2 hover:shadow-lg transition-all`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-700">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600 mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Card 
                key={index} 
                className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-purple-300 group"
                onClick={() => router.push(action.href)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${action.color} group-hover:scale-110 transition-transform`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{action.title}</CardTitle>
                      <CardDescription className="text-sm">{action.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  Today's Appointments
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => router.push('/salon/appointments')}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingAppointments.map((apt, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-gray-600 w-20">{apt.time}</div>
                      <div>
                        <p className="font-medium text-gray-900">{apt.customer}</p>
                        <p className="text-sm text-gray-600">{apt.service} with {apt.staff}</p>
                      </div>
                    </div>
                    <Badge 
                      variant={apt.status === 'confirmed' ? 'default' : 'secondary'}
                      className={apt.status === 'confirmed' ? 'bg-green-100 text-green-700' : ''}
                    >
                      {apt.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Services */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" />
                  Popular Services This Week
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => router.push('/salon/services')}>
                  Manage Services
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center">
                      <Scissors className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">Hair Color & Highlights</p>
                      <p className="text-sm text-gray-600">32 bookings</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">AED 450</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-violet-400 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">Premium Facial</p>
                      <p className="text-sm text-gray-600">28 bookings</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">AED 350</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">Spa Package</p>
                      <p className="text-sm text-gray-600">24 bookings</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">AED 650</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Button */}
        <div className="mt-8 text-center">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            onClick={() => router.push('/salon/appointments/new')}
          >
            <Plus className="w-5 h-5 mr-2" />
            Book New Appointment
          </Button>
        </div>
      </div>
    </div>
  )
}