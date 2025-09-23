'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  MessageCircle,
  Settings,
  BarChart3,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  Bot,
  Users,
  TrendingUp
} from 'lucide-react'
import { createWhatsAppClient } from '@/lib/whatsapp/whatsapp-client'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

export function WhatsAppSetup() {
  const { currentOrganization } = useHERAAuth()
  const [loading, setLoading] = useState(false)
  const [setupComplete, setSetupComplete] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [displayName, setDisplayName] = useState('')

  const handleSetup = async () => {
    if (!currentOrganization || !phoneNumber || !displayName) return

    setLoading(true)
    try {
      const client = createWhatsAppClient(currentOrganization.id)

      // Check if account already exists
      const existing = await client.getWhatsAppAccount()
      if (existing) {
        setSetupComplete(true)
        return
      }

      // Create new account
      const account = await client.createWhatsAppAccount({
        phone_number: phoneNumber,
        display_name: displayName
      })

      if (account) {
        // Create default booking flow
        await client.createBookingFlow({
          serviceTypes: ['haircut', 'color', 'highlights', 'treatment'],
          enableStylistSelection: true,
          requireDeposit: false
        })

        setSetupComplete(true)
      }
    } catch (error) {
      console.error('Setup error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!currentOrganization) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Please select an organization to set up WhatsApp.</AlertDescription>
      </Alert>
    )
  }

  if (setupComplete) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            WhatsApp Business Setup Complete
          </CardTitle>
          <CardDescription>Your WhatsApp Business account is ready to use</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <MessageCircle className="h-4 w-4" />
              <AlertDescription>
                Customers can now book appointments by sending a message to your WhatsApp number.
                The 60-second booking flow will guide them through the process.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Expected Booking Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">87%</div>
                  <p className="text-xs text-muted-foreground">vs 45% phone bookings</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Avg Booking Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">60s</div>
                  <p className="text-xs text-muted-foreground">vs 5+ min calls</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">70%</div>
                  <p className="text-xs text-muted-foreground">reduction in staff time</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs defaultValue="setup" className="space-y-4">
      <TabsList>
        <TabsTrigger value="setup">Setup</TabsTrigger>
        <TabsTrigger value="features">Features</TabsTrigger>
        <TabsTrigger value="flows">Flows</TabsTrigger>
      </TabsList>

      <TabsContent value="setup">
        <Card>
          <CardHeader>
            <CardTitle>WhatsApp Business Setup</CardTitle>
            <CardDescription>
              Connect your WhatsApp Business account to enable 60-second bookings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">WhatsApp Business Number</Label>
              <Input
                id="phone"
                placeholder="+971 50 123 4567"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Enter your WhatsApp Business phone number with country code
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Business Display Name</Label>
              <Input
                id="name"
                placeholder="Hair Talkz Karama"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                This name will appear in WhatsApp conversations
              </p>
            </div>

            <Button
              onClick={handleSetup}
              disabled={loading || !phoneNumber || !displayName}
              className="w-full"
            >
              {loading ? 'Setting up...' : 'Complete Setup'}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="features">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                60-Second Booking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Service selection with prices</li>
                <li>• Stylist preference</li>
                <li>• Real-time availability</li>
                <li>• Instant confirmation</li>
                <li>• Payment options</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Automated Lifecycle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Abandoned cart rescue (34% recovery)</li>
                <li>• Pre-visit upsells (28% success)</li>
                <li>• Post-visit rebooking (45% retention)</li>
                <li>• Winback campaigns (22% reactivation)</li>
                <li>• Smart reminders</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Message Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Booking confirmations</li>
                <li>• Appointment reminders</li>
                <li>• Birthday specials</li>
                <li>• Loyalty programs</li>
                <li>• Weather promotions</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics & Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Conversation metrics</li>
                <li>• Booking conversion rates</li>
                <li>• Customer journey tracking</li>
                <li>• Peak hour analysis</li>
                <li>• ROI measurement</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="flows">
        <Card>
          <CardHeader>
            <CardTitle>Customer Journey Flows</CardTitle>
            <CardDescription>
              Automated flows that engage customers at the right time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  name: 'Initial Booking',
                  trigger: 'New customer inquiry',
                  conversion: '87%',
                  icon: <Users className="h-4 w-4" />
                },
                {
                  name: 'Abandoned Cart Rescue',
                  trigger: 'Booking not completed',
                  conversion: '34%',
                  icon: <AlertCircle className="h-4 w-4" />
                },
                {
                  name: 'Pre-Visit Upsell',
                  trigger: '2-4 hours before appointment',
                  conversion: '28%',
                  icon: <TrendingUp className="h-4 w-4" />
                },
                {
                  name: 'Post-Visit Rebook',
                  trigger: '3-7 days after visit',
                  conversion: '45%',
                  icon: <Clock className="h-4 w-4" />
                }
              ].map(flow => (
                <div
                  key={flow.name}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">{flow.icon}</div>
                    <div>
                      <p className="font-medium">{flow.name}</p>
                      <p className="text-sm text-muted-foreground">{flow.trigger}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{flow.conversion} conversion</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
