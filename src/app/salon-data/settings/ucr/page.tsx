'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { universalConfigService } from '@/lib/universal-config/universal-config-service'
import {
  Code,
  Scale,
  CalendarCheck,
  DollarSign,
  MessageCircle,
  Zap,
  FileText,
  UserCheck,
  Clock,
  TestTube,
  Rocket,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Settings,
  Brain
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

// Default organization ID for salon - Hair Talkz Park Regis
const DEFAULT_SALON_ORG_ID = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'

export default function SalonUCRSettings() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 })
  const { currentOrganization } = useMultiOrgAuth()
  const [salonConfig, setSalonConfig] = useState<any>({})
  const [configLoading, setConfigLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  const organizationId = currentOrganization?.id || DEFAULT_SALON_ORG_ID

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        setMousePosition({ x, y })
      }
    }

    if (containerRef.current) {
      containerRef.current.addEventListener('mousemove', handleMouseMove)
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', handleMouseMove)
      }
    }
  }, [])

  useEffect(() => {
    loadSalonConfig()
  }, [organizationId])

  const loadSalonConfig = async () => {
    setConfigLoading(true)
    try {
      const config = await universalConfigService.fetchIndustryConfig(organizationId, 'salon')
      setSalonConfig(config)
    } catch (error) {
      console.error('Failed to load salon config:', error)
    } finally {
      setConfigLoading(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Code },
    { id: 'booking', label: 'Booking Rules', icon: CalendarCheck },
    { id: 'pricing', label: 'Pricing Rules', icon: DollarSign },
    { id: 'notifications', label: 'Notifications', icon: MessageCircle },
    { id: 'activity', label: 'Activity', icon: Zap }
  ]

  return (
    <div
      ref={containerRef}
      className="min-h-screen relative overflow-hidden"
      style={{
        background: `
          linear-gradient(135deg, 
            rgba(0, 0, 0, 0.95) 0%, 
            rgba(17, 24, 39, 0.95) 25%,
            rgba(31, 41, 55, 0.9) 50%,
            rgba(17, 24, 39, 0.95) 75%,
            rgba(0, 0, 0, 0.95) 100%
          ),
          radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
            rgba(147, 51, 234, 0.08) 0%, 
            rgba(59, 130, 246, 0.05) 25%,
            rgba(16, 185, 129, 0.03) 50%,
            transparent 70%
          ),
          #0a0a0a
        `
      }}
    >
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute w-96 h-96 rounded-full transition-all duration-[3000ms] ease-in-out"
          style={{
            background: `radial-gradient(circle, rgba(147, 51, 234, 0.15) 0%, transparent 70%)`,
            left: '10%',
            top: '20%',
            animation: 'float 10s ease-in-out infinite',
            filter: 'blur(40px)'
          }}
        />
        <div
          className="absolute w-80 h-80 rounded-full transition-all duration-[4000ms] ease-in-out"
          style={{
            background: `radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%)`,
            right: '15%',
            bottom: '30%',
            animation: 'float 12s ease-in-out infinite reverse',
            filter: 'blur(40px)'
          }}
        />
        <div
          className="absolute w-72 h-72 rounded-full transition-all duration-[5000ms] ease-in-out"
          style={{
            background: `radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)`,
            left: '50%',
            top: '60%',
            animation: 'float 15s ease-in-out infinite',
            filter: 'blur(40px)'
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/salon-data/settings">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Settings
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Universal Configuration Rules
              </h1>
              <p className="text-gray-400 mt-2">Manage salon business logic without code changes</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl">
          <div className="p-4 border-b border-white/10">
            <div className="flex gap-2 overflow-x-auto">
              {tabs.map(tab => {
                const Icon = tab.icon
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'min-w-fit transition-all',
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    )}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </Button>
                )
              })}
            </div>
          </div>
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Configuration Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-lg border border-purple-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <CalendarCheck className="h-5 w-5 text-purple-400" />
                      <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Active
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-white/90">Booking Rules</h3>
                    <p className="text-2xl font-bold text-white">
                      {salonConfig.rules_applied?.booking_rules || 0}
                    </p>
                    <p className="text-sm text-purple-300 mt-1">Configuration rules</p>
                  </div>

                  <div className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 backdrop-blur-lg border border-pink-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <DollarSign className="h-5 w-5 text-pink-400" />
                      <Badge className="bg-pink-500/20 text-pink-300 border border-pink-500/30">
                        Active
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-white/90">Pricing Rules</h3>
                    <p className="text-2xl font-bold text-white">
                      {salonConfig.rules_applied?.pricing_rules || 0}
                    </p>
                    <p className="text-sm text-pink-300 mt-1">Dynamic pricing</p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-lg border border-blue-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <MessageCircle className="h-5 w-5 text-blue-400" />
                      <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        Active
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-white/90">Notifications</h3>
                    <p className="text-2xl font-bold text-white">
                      {salonConfig.rules_applied?.notification_rules || 0}
                    </p>
                    <p className="text-sm text-blue-300 mt-1">Alert rules</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                        <FileText className="h-5 w-5 text-purple-400" />
                        Rule Templates
                      </h3>
                      <p className="text-gray-400 mb-4">
                        Pre-configured salon business rule templates
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 rounded bg-purple-500/10 border border-purple-500/20">
                          <span className="text-sm text-purple-300">VIP Client Pricing</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                          >
                            Apply
                          </Button>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded bg-pink-500/10 border border-pink-500/20">
                          <span className="text-sm text-pink-300">Peak Hour Surcharge</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-pink-400 hover:text-pink-300 hover:bg-pink-500/20"
                          >
                            Apply
                          </Button>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded bg-blue-500/10 border border-blue-500/20">
                          <span className="text-sm text-blue-300">Loyalty Program</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                      <Link href="/salon-data/templates">
                        <Button className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                          Browse All Templates
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                        <Brain className="h-5 w-5 text-pink-400" />
                        AI Configuration Assistant
                      </h3>
                      <p className="text-gray-400 mb-4">Natural language rule creation with AI</p>
                      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4 mb-4">
                        <p className="text-purple-300">
                          Describe your business rule in plain language and AI will create the
                          configuration for you.
                        </p>
                      </div>
                      <Link href="/salon-data/config">
                        <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Open AI Assistant
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Booking Rules Tab */}
            {activeTab === 'booking' && (
              <div className="space-y-6">
                {!configLoading && salonConfig.booking && (
                  <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl">
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-white mb-6">
                        Current Booking Configuration
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-purple-400">General Settings</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                              <span className="text-sm text-gray-300">Advance Booking</span>
                              <span className="font-medium text-white">
                                {salonConfig.booking.advance_booking_days || 30} days
                              </span>
                            </div>
                            <div className="flex justify-between p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                              <span className="text-sm text-gray-300">Minimum Lead Time</span>
                              <span className="font-medium text-white">
                                {salonConfig.booking.min_lead_minutes || 60} minutes
                              </span>
                            </div>
                            <div className="flex justify-between p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                              <span className="text-sm text-gray-300">Same Day Booking</span>
                              <Badge
                                className={cn(
                                  'border',
                                  salonConfig.booking.allow_same_day
                                    ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                    : 'bg-red-500/20 text-red-300 border-red-500/30'
                                )}
                              >
                                {salonConfig.booking.allow_same_day ? 'Allowed' : 'Disabled'}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-semibold text-pink-400">Business Hours</h4>
                          <div className="space-y-2">
                            {salonConfig.booking.business_hours &&
                              Object.entries(salonConfig.booking.business_hours).map(
                                ([day, hours]: [string, any]) => (
                                  <div
                                    key={day}
                                    className="flex justify-between p-3 bg-pink-500/10 border border-pink-500/20 rounded-lg"
                                  >
                                    <span className="text-sm text-gray-300 capitalize">{day}</span>
                                    <span className="font-medium text-white">
                                      {hours.open} - {hours.close}
                                    </span>
                                  </div>
                                )
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pricing Rules Tab */}
            {activeTab === 'pricing' && (
              <div className="space-y-6">
                {!configLoading && salonConfig.pricing && (
                  <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl">
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-white mb-6">
                        Current Pricing Configuration
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 backdrop-blur-lg border border-pink-500/20 rounded-xl p-4">
                          <h4 className="font-semibold text-pink-300 mb-3">Discounts</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-300">VIP Discount</span>
                              <span className="font-medium text-white">
                                {salonConfig.pricing.vip_discount || 10}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-300">Early Bird</span>
                              <span className="font-medium text-white">
                                {salonConfig.pricing.early_bird_discount || 15}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-lg border border-purple-500/20 rounded-xl p-4">
                          <h4 className="font-semibold text-purple-300 mb-3">Surcharges</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-300">Peak Hours</span>
                              <span className="font-medium text-white">
                                +{((salonConfig.pricing.peak_surcharge || 1.2) - 1) * 100}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-300">Last Minute</span>
                              <span className="font-medium text-white">
                                +{((salonConfig.pricing.last_minute_surcharge || 1.1) - 1) * 100}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-lg border border-blue-500/20 rounded-xl p-4">
                          <h4 className="font-semibold text-blue-300 mb-3">Policies</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-300">Cancellation Fee</span>
                              <span className="font-medium text-white">
                                {salonConfig.pricing.cancellation_fee || 25}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-300">No-show Fee</span>
                              <span className="font-medium text-white">
                                {salonConfig.pricing.no_show_fee || 50}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                {!configLoading && salonConfig.notifications && (
                  <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl">
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-white mb-6">
                        Notification Settings
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-blue-400">Channels</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                              <span className="text-sm text-gray-300">SMS Notifications</span>
                              <Badge
                                className={cn(
                                  'border',
                                  salonConfig.notifications.sms_enabled
                                    ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                    : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                                )}
                              >
                                {salonConfig.notifications.sms_enabled ? 'Enabled' : 'Disabled'}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                              <span className="text-sm text-gray-300">Email Notifications</span>
                              <Badge
                                className={cn(
                                  'border',
                                  salonConfig.notifications.email_enabled
                                    ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                    : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                                )}
                              >
                                {salonConfig.notifications.email_enabled ? 'Enabled' : 'Disabled'}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                              <span className="text-sm text-gray-300">WhatsApp</span>
                              <Badge className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                                Coming Soon
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-semibold text-purple-400">Reminder Schedule</h4>
                          <div className="space-y-2">
                            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                              <span className="text-sm text-gray-300">Appointment Reminders</span>
                              <div className="mt-2">
                                {salonConfig.notifications.reminder_hours?.map((hours: number) => (
                                  <Badge
                                    key={hours}
                                    className="mr-2 mb-1 bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                  >
                                    {hours}h before
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                              <span className="text-sm text-gray-300">Follow-up Messages</span>
                              <Badge className="mt-2 bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                24h after service
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-6">
                {/* Activity Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-lg border border-green-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <UserCheck className="h-5 h-5 text-green-400" />
                      <span className="text-sm text-green-300">Active Rules</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {salonConfig.rules_applied
                        ? salonConfig.rules_applied.booking_rules +
                          salonConfig.rules_applied.pricing_rules +
                          salonConfig.rules_applied.notification_rules
                        : 0}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-lg border border-yellow-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 h-5 text-yellow-400" />
                      <span className="text-sm text-yellow-300">Draft Rules</span>
                    </div>
                    <p className="text-2xl font-bold text-white">3</p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-lg border border-blue-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TestTube className="h-5 h-5 text-blue-400" />
                      <span className="text-sm text-blue-300">Tests Run</span>
                    </div>
                    <p className="text-2xl font-bold text-white">24</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-lg border border-purple-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Rocket className="h-5 h-5 text-purple-400" />
                      <span className="text-sm text-purple-300">Deployments</span>
                    </div>
                    <p className="text-2xl font-bold text-white">7</p>
                  </div>
                </div>

                {/* Recent Activity Timeline */}
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-white mb-6">Recent Activity</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mt-0.5">
                          <CheckCircle2 className="h-4 w-4 text-green-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-white">
                              Deployed "Salon Cancellation Policy"
                            </h4>
                            <span className="text-sm text-gray-400">2h ago</span>
                          </div>
                          <p className="text-sm text-gray-400">
                            Updated policy to production environment
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mt-0.5">
                          <TestTube className="h-4 w-4 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-white">Tested "VIP Discount Rules"</h4>
                            <span className="text-sm text-gray-400">5h ago</span>
                          </div>
                          <p className="text-sm text-gray-400">
                            100% pass rate on all test scenarios
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mt-0.5">
                          <Rocket className="h-4 w-4 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-white">Created rule from template</h4>
                            <span className="text-sm text-gray-400">1d ago</span>
                          </div>
                          <p className="text-sm text-gray-400">Used "Peak Hour Pricing" template</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {configLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                <span className="ml-2 text-gray-400">Loading configuration...</span>
              </div>
            )}
          </div>
        </div>

        {/* UCR Information Footer */}
        <div className="bg-gradient-to-r from-purple-900/30 via-pink-900/30 to-blue-900/30 backdrop-blur-lg border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-purple-400" />
            <p className="text-gray-300">
              Configuration managed via HERA Universal Configuration Rules (UCR) - Smart Codes:
              HERA.SALON.CONFIG.*
            </p>
          </div>
        </div>

        {/* Add animation styles */}
        <style jsx global>{`
          @keyframes float {
            0%,
            100% {
              transform: translateY(0) translateX(0);
            }
            33% {
              transform: translateY(-20px) translateX(10px);
            }
            66% {
              transform: translateY(10px) translateX(-10px);
            }
          }
        `}</style>
      </div>
    </div>
  )
}
