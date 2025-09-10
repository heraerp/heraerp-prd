'use client'

import React, { useEffect, useState } from 'react'
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
  const { currentOrganization } = useMultiOrgAuth()
  const [salonConfig, setSalonConfig] = useState<any>({})
  const [configLoading, setConfigLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  
  const organizationId = currentOrganization?.id || DEFAULT_SALON_ORG_ID
  
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
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-dusty-rose-50 to-champagne-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/salon-data/settings">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Settings
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-sage-700 via-dusty-rose-600 to-champagne-600 bg-clip-text text-transparent">
                Universal Configuration Rules
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage salon business logic without code changes
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Card className="bg-white/90 backdrop-blur-sm border-sage-200/50">
          <CardHeader className="pb-3">
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "min-w-fit",
                      activeTab === tab.id && "bg-gradient-to-r from-sage-500 to-dusty-rose-500 text-white"
                    )}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </Button>
                )
              })}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Configuration Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-br from-sage-100 to-sage-200/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <CalendarCheck className="h-5 w-5 text-sage-600" />
                        <Badge className="bg-sage-500 text-white">Active</Badge>
                      </div>
                      <h3 className="font-semibold text-sage-800">Booking Rules</h3>
                      <p className="text-2xl font-bold text-sage-900">
                        {salonConfig.rules_applied?.booking_rules || 0}
                      </p>
                      <p className="text-sm text-sage-600 mt-1">Configuration rules</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-dusty-rose-100 to-dusty-rose-200/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <DollarSign className="h-5 w-5 text-dusty-rose-600" />
                        <Badge className="bg-dusty-rose-500 text-white">Active</Badge>
                      </div>
                      <h3 className="font-semibold text-dusty-rose-800">Pricing Rules</h3>
                      <p className="text-2xl font-bold text-dusty-rose-900">
                        {salonConfig.rules_applied?.pricing_rules || 0}
                      </p>
                      <p className="text-sm text-dusty-rose-600 mt-1">Dynamic pricing</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-champagne-100 to-champagne-200/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <MessageCircle className="h-5 w-5 text-champagne-600" />
                        <Badge className="bg-champagne-500 text-white">Active</Badge>
                      </div>
                      <h3 className="font-semibold text-champagne-800">Notifications</h3>
                      <p className="text-2xl font-bold text-champagne-900">
                        {salonConfig.rules_applied?.notification_rules || 0}
                      </p>
                      <p className="text-sm text-champagne-600 mt-1">Alert rules</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-sage-200/50">
                    <CardHeader>
                      <CardTitle className="text-sage-800 flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Rule Templates
                      </CardTitle>
                      <CardDescription>
                        Pre-configured salon business rule templates
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 rounded bg-sage-50">
                          <span className="text-sm text-sage-700">VIP Client Pricing</span>
                          <Button size="sm" variant="ghost">Apply</Button>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-dusty-rose-50">
                          <span className="text-sm text-dusty-rose-700">Peak Hour Surcharge</span>
                          <Button size="sm" variant="ghost">Apply</Button>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-champagne-50">
                          <span className="text-sm text-champagne-700">Loyalty Program</span>
                          <Button size="sm" variant="ghost">Apply</Button>
                        </div>
                      </div>
                      <Link href="/salon-data/templates">
                        <Button className="w-full mt-4 bg-gradient-to-r from-sage-500 to-champagne-500">
                          Browse All Templates
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  <Card className="border-champagne-200/50">
                    <CardHeader>
                      <CardTitle className="text-champagne-800 flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        AI Configuration Assistant
                      </CardTitle>
                      <CardDescription>
                        Natural language rule creation with AI
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Alert className="bg-champagne-50 border-champagne-200">
                        <AlertDescription className="text-champagne-800">
                          Describe your business rule in plain language and AI will create the configuration for you.
                        </AlertDescription>
                      </Alert>
                      <Link href="/salon-data/config">
                        <Button className="w-full mt-4 bg-gradient-to-r from-champagne-500 to-sage-500">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Open AI Assistant
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Booking Rules Tab */}
            {activeTab === 'booking' && (
              <div className="space-y-6">
                {!configLoading && salonConfig.booking && (
                  <Card className="border-sage-200/50">
                    <CardHeader>
                      <CardTitle className="text-sage-800">Current Booking Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sage-700">General Settings</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between p-3 bg-sage-50 rounded">
                              <span className="text-sm text-sage-600">Advance Booking</span>
                              <span className="font-medium text-sage-800">{salonConfig.booking.advance_booking_days || 30} days</span>
                            </div>
                            <div className="flex justify-between p-3 bg-sage-50 rounded">
                              <span className="text-sm text-sage-600">Minimum Lead Time</span>
                              <span className="font-medium text-sage-800">{salonConfig.booking.min_lead_minutes || 60} minutes</span>
                            </div>
                            <div className="flex justify-between p-3 bg-sage-50 rounded">
                              <span className="text-sm text-sage-600">Same Day Booking</span>
                              <Badge className={cn(
                                salonConfig.booking.allow_same_day ? 
                                "bg-green-100 text-green-800" : 
                                "bg-red-100 text-red-800"
                              )}>
                                {salonConfig.booking.allow_same_day ? 'Allowed' : 'Disabled'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sage-700">Business Hours</h4>
                          <div className="space-y-2">
                            {salonConfig.booking.business_hours && Object.entries(salonConfig.booking.business_hours).map(([day, hours]: [string, any]) => (
                              <div key={day} className="flex justify-between p-3 bg-sage-50 rounded">
                                <span className="text-sm text-sage-600 capitalize">{day}</span>
                                <span className="font-medium text-sage-800">
                                  {hours.open} - {hours.close}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Pricing Rules Tab */}
            {activeTab === 'pricing' && (
              <div className="space-y-6">
                {!configLoading && salonConfig.pricing && (
                  <Card className="border-dusty-rose-200/50">
                    <CardHeader>
                      <CardTitle className="text-dusty-rose-800">Current Pricing Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-dusty-rose-50 rounded-lg p-4">
                          <h4 className="font-semibold text-dusty-rose-700 mb-3">Discounts</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-dusty-rose-600">VIP Discount</span>
                              <span className="font-medium text-dusty-rose-800">{salonConfig.pricing.vip_discount || 10}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-dusty-rose-600">Early Bird</span>
                              <span className="font-medium text-dusty-rose-800">{salonConfig.pricing.early_bird_discount || 15}%</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-dusty-rose-50 rounded-lg p-4">
                          <h4 className="font-semibold text-dusty-rose-700 mb-3">Surcharges</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-dusty-rose-600">Peak Hours</span>
                              <span className="font-medium text-dusty-rose-800">+{((salonConfig.pricing.peak_surcharge || 1.2) - 1) * 100}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-dusty-rose-600">Last Minute</span>
                              <span className="font-medium text-dusty-rose-800">+{((salonConfig.pricing.last_minute_surcharge || 1.1) - 1) * 100}%</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-dusty-rose-50 rounded-lg p-4">
                          <h4 className="font-semibold text-dusty-rose-700 mb-3">Policies</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-dusty-rose-600">Cancellation Fee</span>
                              <span className="font-medium text-dusty-rose-800">{salonConfig.pricing.cancellation_fee || 25}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-dusty-rose-600">No-show Fee</span>
                              <span className="font-medium text-dusty-rose-800">{salonConfig.pricing.no_show_fee || 50}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                {!configLoading && salonConfig.notifications && (
                  <Card className="border-champagne-200/50">
                    <CardHeader>
                      <CardTitle className="text-champagne-800">Notification Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-champagne-700">Channels</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 bg-champagne-50 rounded">
                              <span className="text-sm text-champagne-600">SMS Notifications</span>
                              <Badge className={cn(
                                salonConfig.notifications.sms_enabled ? 
                                "bg-green-100 text-green-800" : 
                                "bg-gray-100 text-gray-800"
                              )}>
                                {salonConfig.notifications.sms_enabled ? 'Enabled' : 'Disabled'}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-champagne-50 rounded">
                              <span className="text-sm text-champagne-600">Email Notifications</span>
                              <Badge className={cn(
                                salonConfig.notifications.email_enabled ? 
                                "bg-green-100 text-green-800" : 
                                "bg-gray-100 text-gray-800"
                              )}>
                                {salonConfig.notifications.email_enabled ? 'Enabled' : 'Disabled'}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-champagne-50 rounded">
                              <span className="text-sm text-champagne-600">WhatsApp</span>
                              <Badge className="bg-yellow-100 text-yellow-800">Coming Soon</Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <h4 className="font-semibold text-champagne-700">Reminder Schedule</h4>
                          <div className="space-y-2">
                            <div className="p-3 bg-champagne-50 rounded">
                              <span className="text-sm text-champagne-600">Appointment Reminders</span>
                              <div className="mt-2">
                                {salonConfig.notifications.reminder_hours?.map((hours: number) => (
                                  <Badge key={hours} className="mr-2 mb-1 bg-champagne-200 text-champagne-800">
                                    {hours}h before
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="p-3 bg-champagne-50 rounded">
                              <span className="text-sm text-champagne-600">Follow-up Messages</span>
                              <Badge className="mt-2 bg-champagne-200 text-champagne-800">
                                24h after service
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-6">
                {/* Activity Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <UserCheck className="h-5 h-5 text-green-600" />
                        <span className="text-sm text-green-700">Active Rules</span>
                      </div>
                      <p className="text-2xl font-bold text-green-800">
                        {salonConfig.rules_applied ? 
                          salonConfig.rules_applied.booking_rules + 
                          salonConfig.rules_applied.pricing_rules + 
                          salonConfig.rules_applied.notification_rules : 0}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-5 h-5 text-yellow-600" />
                        <span className="text-sm text-yellow-700">Draft Rules</span>
                      </div>
                      <p className="text-2xl font-bold text-yellow-800">3</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TestTube className="h-5 h-5 text-blue-600" />
                        <span className="text-sm text-blue-700">Tests Run</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-800">24</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Rocket className="h-5 h-5 text-purple-600" />
                        <span className="text-sm text-purple-700">Deployments</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-800">7</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity Timeline */}
                <Card className="border-sage-200/50">
                  <CardHeader>
                    <CardTitle className="text-sage-800">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sage-800">Deployed "Salon Cancellation Policy"</h4>
                            <span className="text-sm text-sage-600">2h ago</span>
                          </div>
                          <p className="text-sm text-sage-600">Updated policy to production environment</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                          <TestTube className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sage-800">Tested "VIP Discount Rules"</h4>
                            <span className="text-sm text-sage-600">5h ago</span>
                          </div>
                          <p className="text-sm text-sage-600">100% pass rate on all test scenarios</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mt-0.5">
                          <Rocket className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sage-800">Created rule from template</h4>
                            <span className="text-sm text-sage-600">1d ago</span>
                          </div>
                          <p className="text-sm text-sage-600">Used "Peak Hour Pricing" template</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Loading State */}
            {configLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-sage-600" />
                <span className="ml-2 text-sage-600">Loading configuration...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* UCR Information Footer */}
        <Alert className="bg-gradient-to-r from-sage-100 to-champagne-100 border-sage-300">
          <Zap className="h-4 w-4 text-sage-600" />
          <AlertDescription className="text-sage-700">
            Configuration managed via HERA Universal Configuration Rules (UCR) - Smart Codes: HERA.SALON.CONFIG.*
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}