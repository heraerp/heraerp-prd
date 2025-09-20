'use client'

/**
 * Salon-Specific WhatsApp Manager
 * Industry-specific WhatsApp integration for salons
 * Built on HERA DNA WhatsApp foundation
 */

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  MessageCircle,
  Calendar,
  Clock,
  Users,
  Star,
  Phone,
  Send,
  Settings,
  Zap,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Heart,
  Sparkles,
  Crown,
  Scissors
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WhatsAppManager } from '@/components/dna/whatsapp/WhatsAppManager'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

interface SalonWhatsAppManagerProps {
  className?: string
}

interface SalonTemplate {
  id: string
  name: string
  category: 'booking' | 'reminder' | 'followup' | 'promotion' | 'general'
  description: string
  icon: React.ReactNode
  usageCount: number
  lastUsed?: Date
  template: {
    name: string
    language: string
    parameters: string[]
  }
  sampleText: string
}

export function SalonWhatsAppManager({ className }: SalonWhatsAppManagerProps) {
  const { organization } = useHERAAuth()
  const [selectedTab, setSelectedTab] = useState('messages')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalMessages: 156,
    responseRate: 94,
    avgResponseTime: 8,
    appointmentBookings: 23,
    customerSatisfaction: 4.8
  })

  // Salon-specific WhatsApp templates
  const salonTemplates: SalonTemplate[] = [
    {
      id: '1',
      name: 'Appointment Reminder',
      category: 'reminder',
      description: 'Send automated reminders 24 hours before appointments',
      icon: <Clock className="w-5 h-5" />,
      usageCount: 48,
      lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000),
      template: {
        name: 'appointment_reminder',
        language: 'en',
        parameters: ['customer_name', 'service', 'time', 'stylist']
      },
      sampleText:
        'Hi Sarah, this is a reminder about your Brazilian Blowout appointment tomorrow at 2:00 PM with Rocky. Reply CONFIRM to confirm or RESCHEDULE to change.'
    },
    {
      id: '2',
      name: 'Booking Confirmation',
      category: 'booking',
      description: 'Confirm new appointments instantly',
      icon: <CheckCircle className="w-5 h-5" />,
      usageCount: 35,
      lastUsed: new Date(Date.now() - 30 * 60 * 1000),
      template: {
        name: 'booking_confirmation',
        language: 'en',
        parameters: ['service', 'date', 'time', 'stylist', 'price']
      },
      sampleText:
        'Your appointment for Hair Color & Highlights on Dec 25, 2024 at 3:00 PM with Maya has been confirmed. Total: AED 280. We look forward to seeing you!'
    },
    {
      id: '3',
      name: 'Service Follow-up',
      category: 'followup',
      description: 'Get feedback after services',
      icon: <Star className="w-5 h-5" />,
      usageCount: 22,
      lastUsed: new Date(Date.now() - 4 * 60 * 60 * 1000),
      template: {
        name: 'service_followup',
        language: 'en',
        parameters: ['customer_name', 'service']
      },
      sampleText:
        "Hi Emma, how was your Premium Cut & Style experience yesterday? We'd love to hear your feedback! Rate us 1-5 ⭐"
    },
    {
      id: '4',
      name: 'VIP Client Welcome',
      category: 'general',
      description: 'Special welcome for VIP clients',
      icon: <Crown className="w-5 h-5" />,
      usageCount: 12,
      lastUsed: new Date(Date.now() - 24 * 60 * 60 * 1000),
      template: {
        name: 'vip_welcome',
        language: 'en',
        parameters: ['customer_name']
      },
      sampleText:
        'Welcome back, Aisha! As our VIP client, you get priority booking and 10% off all services. How can we pamper you today?'
    },
    {
      id: '5',
      name: 'Birthday Special',
      category: 'promotion',
      description: 'Birthday offers for clients',
      icon: <Heart className="w-5 h-5" />,
      usageCount: 8,
      template: {
        name: 'birthday_special',
        language: 'en',
        parameters: ['customer_name', 'discount']
      },
      sampleText:
        'Happy Birthday Sarah! 🎉 Treat yourself to 25% off any service this month. Book your birthday glow-up with us!'
    },
    {
      id: '6',
      name: 'New Service Launch',
      category: 'promotion',
      description: 'Announce new services',
      icon: <Sparkles className="w-5 h-5" />,
      usageCount: 15,
      template: {
        name: 'new_service_launch',
        language: 'en',
        parameters: ['service_name', 'special_price']
      },
      sampleText:
        'Introducing our new Keratin Treatment! Transform your hair with smooth, frizz-free results. Book now for special launch price: AED 299'
    }
  ]

  // Quick actions for salon staff
  const quickActions = [
    {
      id: 'confirm_appointment',
      label: 'Confirm Appointment',
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'bg-green-500 hover:bg-green-600',
      description: 'Send booking confirmation'
    },
    {
      id: 'send_reminder',
      label: 'Send Reminder',
      icon: <Clock className="w-4 h-4" />,
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Remind client of appointment'
    },
    {
      id: 'follow_up',
      label: 'Follow Up',
      icon: <Star className="w-4 h-4" />,
      color: 'bg-purple-500 hover:bg-purple-600',
      description: 'Get service feedback'
    },
    {
      id: 'reschedule',
      label: 'Reschedule',
      icon: <Calendar className="w-4 h-4" />,
      color: 'bg-orange-500 hover:bg-orange-600',
      description: 'Help client reschedule'
    }
  ]

  const setupSalonIntegration = async () => {
    if (!organization?.id) return

    setLoading(true)
    try {
      // Setup WhatsApp DNA for salon
      const setupResponse = await fetch('/api/v1/whatsapp/dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setup_integration',
          organizationId: organization.id
        })
      })

      if (!setupResponse.ok) throw new Error('Setup failed')

      // Create salon-specific templates
      await fetch('/api/v1/whatsapp/dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setup_salon_templates',
          organizationId: organization.id
        })
      })

      // Create automations
      const automations = [
        {
          name: 'Welcome New Clients',
          trigger: 'keyword',
          triggerValue: 'hi',
          action: 'send_message',
          actionValue: {
            message:
              'Welcome to Luxury Salon Dubai! 💇‍♀️✨\n\nHow can we help you today?\n• Book an appointment\n• View our services\n• Check our location\n• Speak to our team\n\nReply with the option that interests you!'
          }
        },
        {
          name: 'Business Hours',
          trigger: 'keyword',
          triggerValue: 'hours',
          action: 'send_message',
          actionValue: {
            message:
              '⏰ Our salon hours:\n\nMon-Thu: 9:00 AM - 9:00 PM\nFri: 9:00 AM - 1:00 PM\nSat-Sun: 10:00 AM - 9:00 PM\n\n📍 Location: Dubai Marina Walk\n☎️ Call us: +971 4 423 4567'
          }
        },
        {
          name: 'Service Menu',
          trigger: 'keyword',
          triggerValue: 'services',
          action: 'send_message',
          actionValue: {
            message:
              '💅 Our Premium Services:\n\n✨ Brazilian Blowout - AED 500\n💇‍♀️ Premium Cut & Style - AED 150\n🌈 Hair Color & Highlights - AED 280\n👰 Complete Bridal Package - AED 800\n🔥 Keratin Treatment - AED 350\n\nBook your appointment now! Reply BOOK to get started.'
          }
        }
      ]

      for (const automation of automations) {
        await fetch('/api/v1/whatsapp/dna', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create_automation',
            organizationId: organization.id,
            automation
          })
        })
      }

      console.log('Salon WhatsApp integration setup completed')
    } catch (error) {
      console.error('Setup failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendTemplateMessage = async (
    templateId: string,
    customerPhone: string,
    parameters: Record<string, string>
  ) => {
    if (!organization?.id) return

    const template = salonTemplates.find(t => t.id === templateId)
    if (!template) return

    try {
      const response = await fetch('/api/v1/whatsapp/dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_template',
          organizationId: organization.id,
          to: customerPhone,
          templateName: template.template.name,
          language: template.template.language,
          parameters
        })
      })

      if (response.ok) {
        console.log('Template message sent successfully')
        // Update usage stats
        setStats(prev => ({
          ...prev,
          totalMessages: prev.totalMessages + 1
        }))
      }
    } catch (error) {
      console.error('Failed to send template message:', error)
    }
  }

  useEffect(() => {
    if (organization?.id) {
      // Load salon WhatsApp stats
      console.log('Loading WhatsApp stats for salon:', organization.id)
    }
  }, [organization])

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-100 dark:text-foreground">
            <MessageCircle className="w-6 h-6 text-green-500" />
            WhatsApp Business
          </h2>
          <p className="text-muted-foreground dark:text-muted-foreground">
            Engage clients with automated messages and bookings
          </p>
        </div>
        <Button
          onClick={setupSalonIntegration}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 !text-foreground dark:!text-foreground"
        >
          <Settings className="w-4 h-4 mr-2" />
          {loading ? 'Setting up...' : 'Setup Integration'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  Total Messages
                </p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {stats.totalMessages}
                </p>
              </div>
              <MessageCircle className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Response Rate
                </p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {stats.responseRate}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Avg Response
                </p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {stats.avgResponseTime}m
                </p>
              </div>
              <Clock className="w-8 h-8 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Bookings</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {stats.appointmentBookings}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-900/20 dark:to-pink-800/10 border-pink-200 dark:border-pink-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-pink-700 dark:text-pink-300">Satisfaction</p>
                <p className="text-2xl font-bold text-pink-900 dark:text-pink-100">
                  {stats.customerSatisfaction}
                </p>
              </div>
              <Star className="w-8 h-8 text-pink-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Interface */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="automations">Automations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map(action => (
                  <Button
                    key={action.id}
                    variant="outline"
                    className={cn(
                      'h-auto p-4 flex-col gap-2 hover:scale-105 transition-transform',
                      action.color.replace('bg-', 'hover:bg-').replace('hover:hover:', 'hover:')
                    )}
                  >
                    <div className="w-8 h-8 rounded-full bg-muted dark:bg-muted flex items-center justify-center">
                      {action.icon}
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-sm text-gray-100 dark:text-foreground">
                        {action.label}
                      </p>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp Manager */}
          {organization?.id && (
            <Card>
              <CardContent className="p-0">
                <WhatsAppManager
                  organizationId={organization.id}
                  industryType="salon"
                  className="min-h-[600px]"
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Salon Message Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {salonTemplates.map(template => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-foreground">
                            {template.icon}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-100 dark:text-foreground">
                              {template.name}
                            </h3>
                            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                              {template.description}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">{template.category}</Badge>
                      </div>

                      <div className="space-y-3">
                        <div className="p-3 bg-muted dark:bg-muted rounded-lg">
                          <p className="text-sm font-mono text-gray-200 dark:text-gray-200">
                            {template.sampleText}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground dark:text-muted-foreground">
                          <span>Used {template.usageCount} times</span>
                          {template.lastUsed && (
                            <span>
                              Last used {new Date(template.lastUsed).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            // In production, show parameter form first
                            const sampleParams: Record<string, string> = {}
                            template.template.parameters.forEach((param, idx) => {
                              sampleParams[`${idx + 1}`] = `Sample ${param}`
                            })
                            sendTemplateMessage(template.id, '+971501234567', sampleParams)
                          }}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Send Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automations">
          <Card>
            <CardHeader>
              <CardTitle>Automated Responses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    name: 'Welcome New Clients',
                    trigger: 'When customer says "hi" or "hello"',
                    action: 'Send welcome message with service options',
                    status: 'active',
                    responses: 45
                  },
                  {
                    name: 'Business Hours Inquiry',
                    trigger: 'When customer asks about "hours"',
                    action: 'Send opening hours and location',
                    status: 'active',
                    responses: 23
                  },
                  {
                    name: 'Service Menu Request',
                    trigger: 'When customer says "services"',
                    action: 'Send complete service list with prices',
                    status: 'active',
                    responses: 31
                  },
                  {
                    name: 'Appointment Reminders',
                    trigger: '24 hours before appointment',
                    action: 'Send confirmation reminder',
                    status: 'active',
                    responses: 67
                  }
                ].map((automation, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-100 dark:text-foreground">
                        {automation.name}
                      </h3>
                      <Badge variant={automation.status === 'active' ? 'default' : 'secondary'}>
                        {automation.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-2">
                      <strong>Trigger:</strong> {automation.trigger}
                    </p>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-3">
                      <strong>Action:</strong> {automation.action}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-600 dark:text-green-400">
                        {automation.responses} responses sent
                      </span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          Disable
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground dark:text-muted-foreground">
                  Analytics dashboard coming soon...
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Track message performance, response rates, and customer engagement
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
