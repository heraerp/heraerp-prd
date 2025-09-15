'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React from 'react'
import {
  HairTalkzOrgProvider,
  HairTalkzOrgLoading,
  useHairTalkzOrg
} from '@/components/wizard/HairTalkzOrgContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  Calendar,
  Users,
  DollarSign,
  Scissors,
  Star,
  TrendingUp,
  Clock,
  Award,
  Heart
} from 'lucide-react'
import Link from 'next/link'

function HairTalkzDashboardContent() {
  const { organizationId, organizationName, orgLoading } = useHairTalkzOrg()

  if (orgLoading) {
    return <HairTalkzOrgLoading />
  }

  // Hair Talkz salon stats with AI + ERP + Modern theme
  const stats = [
    {
      label: "Today's Appointments",
      value: '28',
      change: '+4 walk-ins',
      trend: 'up' as const,
      icon: Calendar,
      gradient: 'from-sage-400 to-sage-600'
    },
    {
      label: 'Monthly Revenue',
      value: 'AED 45.8K',
      change: '+22%',
      trend: 'up' as const,
      icon: TrendingUp,
      gradient: 'from-dusty-rose-400 to-dusty-rose-600'
    },
    {
      label: 'Client Satisfaction',
      value: '4.9/5.0',
      change: '158 reviews',
      trend: 'up' as const,
      icon: Star,
      gradient: 'from-champagne-400 to-champagne-600'
    },
    {
      label: 'Product Sales',
      value: 'AED 12.3K',
      change: '+18%',
      trend: 'up' as const,
      icon: Sparkles,
      gradient: 'from-sage-500 to-dusty-rose-500'
    }
  ]

  const todaysSchedule = [
    {
      time: '10:00',
      client: 'Sarah Ahmed',
      service: 'Hair Color & Cut',
      duration: '2h',
      status: 'confirmed'
    },
    {
      time: '11:30',
      client: 'Fatima Al-Rashid',
      service: 'Keratin Treatment',
      duration: '3h',
      status: 'confirmed'
    },
    {
      time: '14:00',
      client: 'Aisha Hassan',
      service: 'Bridal Package',
      duration: '4h',
      status: 'premium'
    },
    {
      time: '16:30',
      client: 'Maryam Khalil',
      service: 'Hair Wash & Blow Dry',
      duration: '1h',
      status: 'confirmed'
    }
  ]

  const quickActions = [
    {
      label: 'Book Appointment',
      href: '/hairtalkz/appointments/new',
      icon: Calendar,
      color: 'sage'
    },
    { label: 'Client Management', href: '/hairtalkz/clients', icon: Users, color: 'dusty-rose' },
    {
      label: 'Product Inventory',
      href: '/hairtalkz/inventory',
      icon: Sparkles,
      color: 'champagne'
    },
    { label: 'Financial Reports', href: '/hairtalkz/reports', icon: DollarSign, color: 'sage' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-dusty-rose-50 to-champagne-50">
      {/* Hair Talkz Header */}
      <div className="bg-gradient-to-r from-sage-500 via-dusty-rose-400 to-champagne-500 text-foreground py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-background/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <span className="text-3xl">💇‍♀️</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold">{organizationName}</h1>
                <p className="text-foreground/90">Premium Hair & Beauty Salon • Dubai, UAE</p>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge className="bg-background/20 text-foreground border-white/30">
                    <Award className="w-3 h-3 mr-1" />
                    5-Star Rated
                  </Badge>
                  <Badge className="bg-background/20 text-foreground border-white/30">
                    <Heart className="w-3 h-3 mr-1" />
                    AI-Powered
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">Dubai Marina</div>
              <div className="text-foreground/90">Open: 9:00 AM - 9:00 PM</div>
              <div className="text-sm text-foreground/80 mt-1">+971 4 123 4567</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Key Metrics with AI + ERP + Modern theme */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map(stat => {
            const Icon = stat.icon
            return (
              <Card
                key={stat.label}
                className="overflow-hidden border-border/20 bg-background/70 backdrop-blur-sm"
              >
                <CardContent className="p-0">
                  <div className={`bg-gradient-to-r ${stat.gradient} p-4 text-foreground`}>
                    <div className="flex items-center justify-between">
                      <Icon className="h-8 w-8" />
                      <div className="text-right">
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <div className="text-xs opacity-90">{stat.change}</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="font-medium text-gray-800">{stat.label}</div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Schedule */}
          <Card className="bg-background/70 backdrop-blur-sm border-border/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-sage-600" />
                <span>Today's Appointments</span>
              </CardTitle>
              <CardDescription>
                Schedule for{' '}
                {new Date().toLocaleDateString('en-AE', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {todaysSchedule.map((appointment, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-3 rounded-lg bg-gradient-to-r from-sage-50 to-dusty-rose-50"
                >
                  <div className="text-sm font-mono text-sage-700 w-16">{appointment.time}</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{appointment.client}</div>
                    <div className="text-sm text-muted-foreground">{appointment.service}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">{appointment.duration}</div>
                    <Badge
                      variant={appointment.status === 'premium' ? 'default' : 'secondary'}
                      className={
                        appointment.status === 'premium' ? 'bg-champagne-500 text-foreground' : ''
                      }
                    >
                      {appointment.status}
                    </Badge>
                  </div>
                </div>
              ))}
              <Link href="/hairtalkz/appointments">
                <Button className="w-full bg-gradient-to-r from-sage-500 to-dusty-rose-500 hover:from-sage-600 hover:to-dusty-rose-600">
                  View Full Schedule
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-background/70 backdrop-blur-sm border-border/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-champagne-600" />
                <span>Salon Operations</span>
              </CardTitle>
              <CardDescription>Quick access to key salon management features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {quickActions.map(action => {
                  const Icon = action.icon
                  return (
                    <Link key={action.label} href={action.href}>
                      <Card
                        className={`p-4 hover:scale-105 transition-transform cursor-pointer bg-gradient-to-br from-${action.color}-100 to-${action.color}-200 border-${action.color}-200`}
                      >
                        <div className="flex flex-col items-center text-center space-y-2">
                          <Icon className={`h-8 w-8 text-${action.color}-600`} />
                          <span className="text-sm font-medium">{action.label}</span>
                        </div>
                      </Card>
                    </Link>
                  )
                })}
              </div>

              {/* HERA Business Setup Wizard */}
              <div className="mt-6 p-4 bg-gradient-to-r from-sage-100 via-dusty-rose-100 to-champagne-100 rounded-lg border border-sage-200">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-sage-500 to-champagne-500 rounded-full flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sage-800">Need to setup a new salon?</h3>
                    <p className="text-sm text-sage-600 mt-1">
                      Use HERA's Business Setup Wizard to create a complete salon management system
                      in 30 seconds
                    </p>
                    <Link href="/wizard/hairtalkz">
                      <Button
                        size="sm"
                        className="mt-3 bg-gradient-to-r from-sage-500 to-champagne-500 hover:from-sage-600 hover:to-champagne-600"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Launch Setup Wizard
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Preview */}
        <Card className="bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm border-border/20">
          <CardHeader>
            <CardTitle className="text-center text-2xl bg-gradient-to-r from-sage-600 via-dusty-rose-600 to-champagne-600 bg-clip-text text-transparent">
              HERA AI + ERP + Modern Fusion
            </CardTitle>
            <CardDescription className="text-center">
              Experience the future of salon management with HERA's revolutionary platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="space-y-3">
                <div className="w-16 h-16 bg-gradient-to-r from-sage-400 to-sage-600 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="h-8 w-8 text-foreground" />
                </div>
                <h3 className="font-semibold text-sage-800">AI-Powered</h3>
                <p className="text-sm text-sage-600">
                  Smart scheduling, inventory prediction, and customer insights powered by advanced
                  AI
                </p>
              </div>
              <div className="space-y-3">
                <div className="w-16 h-16 bg-gradient-to-r from-dusty-rose-400 to-dusty-rose-600 rounded-full flex items-center justify-center mx-auto">
                  <TrendingUp className="h-8 w-8 text-foreground" />
                </div>
                <h3 className="font-semibold text-dusty-rose-800">Enterprise ERP</h3>
                <p className="text-sm text-dusty-rose-600">
                  Complete business management with automated accounting, compliance, and reporting
                </p>
              </div>
              <div className="space-y-3">
                <div className="w-16 h-16 bg-gradient-to-r from-champagne-400 to-champagne-600 rounded-full flex items-center justify-center mx-auto">
                  <Award className="h-8 w-8 text-foreground" />
                </div>
                <h3 className="font-semibold text-champagne-800">Modern Design</h3>
                <p className="text-sm text-champagne-600">
                  Beautiful, intuitive interface that matches your salon's premium brand
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function HairTalkzDashboard() {
  return (
    <HairTalkzOrgProvider>
      <HairTalkzDashboardContent />
    </HairTalkzOrgProvider>
  )
}
