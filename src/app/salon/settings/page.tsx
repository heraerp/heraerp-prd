'use client'

import React, { useEffect, useState } from 'react'
import { useSalonContext } from '../SalonProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Settings,
  Users,
  Shield,
  Database,
  Bell,
  Palette,
  Globe,
  Key,
  Loader2,
  Save,
  RefreshCw
} from 'lucide-react'
import { LUXE_COLORS } from '@/lib/constants/salon'

export default function SalonSettingsPage() {
  const { organizationId, role, user, isLoading: authLoading, isAuthenticated } = useSalonContext()
  const [activeTab, setActiveTab] = useState('general')

  // Check if user has admin role
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const userRole = role?.toLowerCase()
      if (userRole !== 'admin' && userRole !== 'owner') {
        // Redirect non-admins/owners
        window.location.href = '/salon/auth'
      }
    }
  }, [authLoading, isAuthenticated, role])

  if (authLoading) {
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: LUXE_COLORS.charcoal }}>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 
            className="text-3xl font-light mb-2"
            style={{ color: LUXE_COLORS.gold }}
          >
            System Settings
          </h1>
          <p 
            className="text-sm"
            style={{ color: LUXE_COLORS.bronze }}
          >
            Configure system settings and manage users for {user?.user_metadata?.full_name || 'Administrator'}
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList 
            className="bg-transparent border"
            style={{ borderColor: `${LUXE_COLORS.bronze}30` }}
          >
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <div className="grid gap-6">
              {/* Salon Information */}
              <Card 
                className="border-0"
                style={{
                  backgroundColor: LUXE_COLORS.charcoalLight,
                  border: `1px solid ${LUXE_COLORS.bronze}30`
                }}
              >
                <CardHeader>
                  <CardTitle style={{ color: LUXE_COLORS.gold }}>Salon Information</CardTitle>
                  <CardDescription style={{ color: LUXE_COLORS.bronze }}>
                    Basic information about your salon
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label style={{ color: LUXE_COLORS.bronze }}>Salon Name</Label>
                      <Input 
                        value="HairTalkz"
                        style={{
                          backgroundColor: LUXE_COLORS.charcoal,
                          border: `1px solid ${LUXE_COLORS.bronze}30`,
                          color: LUXE_COLORS.champagne
                        }}
                      />
                    </div>
                    <div>
                      <Label style={{ color: LUXE_COLORS.bronze }}>Phone Number</Label>
                      <Input 
                        value="+971 4 123 4567"
                        style={{
                          backgroundColor: LUXE_COLORS.charcoal,
                          border: `1px solid ${LUXE_COLORS.bronze}30`,
                          color: LUXE_COLORS.champagne
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <Label style={{ color: LUXE_COLORS.bronze }}>Address</Label>
                    <Input 
                      value="123 Sheikh Zayed Road, Dubai, UAE"
                      style={{
                        backgroundColor: LUXE_COLORS.charcoal,
                        border: `1px solid ${LUXE_COLORS.bronze}30`,
                        color: LUXE_COLORS.champagne
                      }}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button style={{ backgroundColor: LUXE_COLORS.gold, color: LUXE_COLORS.black }}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Business Hours */}
              <Card 
                className="border-0"
                style={{
                  backgroundColor: LUXE_COLORS.charcoalLight,
                  border: `1px solid ${LUXE_COLORS.bronze}30`
                }}
              >
                <CardHeader>
                  <CardTitle style={{ color: LUXE_COLORS.gold }}>Business Hours</CardTitle>
                  <CardDescription style={{ color: LUXE_COLORS.bronze }}>
                    Set your salon's operating hours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <div key={day} className="flex items-center justify-between">
                        <span style={{ color: LUXE_COLORS.champagne }}>{day}</span>
                        <div className="flex items-center gap-4">
                          <span style={{ color: LUXE_COLORS.bronze }}>9:00 AM - 8:00 PM</span>
                          <Switch />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card 
              className="border-0"
              style={{
                backgroundColor: LUXE_COLORS.charcoalLight,
                border: `1px solid ${LUXE_COLORS.bronze}30`
              }}
            >
              <CardHeader>
                <CardTitle style={{ color: LUXE_COLORS.gold }}>User Management</CardTitle>
                <CardDescription style={{ color: LUXE_COLORS.bronze }}>
                  Manage staff accounts and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* User List */}
                  <div className="space-y-2">
                    {[
                      { name: 'Michele Rodriguez', email: 'owner@hairtalkz.ae', role: 'Owner', status: 'Active' },
                      { name: 'Sarah Johnson', email: 'receptionist@hairtalkz.ae', role: 'Receptionist', status: 'Active' },
                      { name: 'Michael Chen', email: 'accountant@hairtalkz.ae', role: 'Accountant', status: 'Active' },
                      { name: 'David Thompson', email: 'admin@hairtalkz.ae', role: 'Admin', status: 'Active' }
                    ].map(user => (
                      <div 
                        key={user.email} 
                        className="flex items-center justify-between p-4 rounded-lg"
                        style={{ backgroundColor: LUXE_COLORS.charcoal }}
                      >
                        <div>
                          <div style={{ color: LUXE_COLORS.champagne }}>{user.name}</div>
                          <div className="text-sm" style={{ color: LUXE_COLORS.bronze }}>{user.email}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span 
                            className="text-sm px-2 py-1 rounded"
                            style={{ 
                              backgroundColor: LUXE_COLORS.emerald + '20',
                              color: LUXE_COLORS.emerald
                            }}
                          >
                            {user.status}
                          </span>
                          <span className="text-sm" style={{ color: LUXE_COLORS.gold }}>{user.role}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-end">
                    <Button style={{ backgroundColor: LUXE_COLORS.gold, color: LUXE_COLORS.black }}>
                      <Users className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <div className="grid gap-6">
              {/* Password Policy */}
              <Card 
                className="border-0"
                style={{
                  backgroundColor: LUXE_COLORS.charcoalLight,
                  border: `1px solid ${LUXE_COLORS.bronze}30`
                }}
              >
                <CardHeader>
                  <CardTitle style={{ color: LUXE_COLORS.gold }}>Password Policy</CardTitle>
                  <CardDescription style={{ color: LUXE_COLORS.bronze }}>
                    Configure password requirements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label style={{ color: LUXE_COLORS.champagne }}>Minimum password length</Label>
                    <Input 
                      type="number" 
                      value="8" 
                      className="w-20"
                      style={{
                        backgroundColor: LUXE_COLORS.charcoal,
                        border: `1px solid ${LUXE_COLORS.bronze}30`,
                        color: LUXE_COLORS.champagne
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label style={{ color: LUXE_COLORS.champagne }}>Require uppercase letters</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label style={{ color: LUXE_COLORS.champagne }}>Require special characters</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label style={{ color: LUXE_COLORS.champagne }}>Require numbers</Label>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              {/* Session Management */}
              <Card 
                className="border-0"
                style={{
                  backgroundColor: LUXE_COLORS.charcoalLight,
                  border: `1px solid ${LUXE_COLORS.bronze}30`
                }}
              >
                <CardHeader>
                  <CardTitle style={{ color: LUXE_COLORS.gold }}>Session Management</CardTitle>
                  <CardDescription style={{ color: LUXE_COLORS.bronze }}>
                    Configure session timeout and security settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label style={{ color: LUXE_COLORS.champagne }}>Session timeout (minutes)</Label>
                    <Input 
                      type="number" 
                      value="30" 
                      className="w-20"
                      style={{
                        backgroundColor: LUXE_COLORS.charcoal,
                        border: `1px solid ${LUXE_COLORS.bronze}30`,
                        color: LUXE_COLORS.champagne
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label style={{ color: LUXE_COLORS.champagne }}>Enable two-factor authentication</Label>
                    <Switch />
                  </div>
                  <div className="flex justify-end">
                    <Button style={{ backgroundColor: LUXE_COLORS.gold, color: LUXE_COLORS.black }}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Security Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="integrations">
            <Card 
              className="border-0"
              style={{
                backgroundColor: LUXE_COLORS.charcoalLight,
                border: `1px solid ${LUXE_COLORS.bronze}30`
              }}
            >
              <CardHeader>
                <CardTitle style={{ color: LUXE_COLORS.gold }}>API & Integrations</CardTitle>
                <CardDescription style={{ color: LUXE_COLORS.bronze }}>
                  Manage third-party integrations and API keys
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label style={{ color: LUXE_COLORS.bronze }}>API Key</Label>
                  <div className="flex gap-2 mt-2">
                    <Input 
                      value="sk_live_****************************"
                      readOnly
                      style={{
                        backgroundColor: LUXE_COLORS.charcoal,
                        border: `1px solid ${LUXE_COLORS.bronze}30`,
                        color: LUXE_COLORS.champagne
                      }}
                    />
                    <Button variant="outline" style={{ borderColor: LUXE_COLORS.bronze }}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-medium" style={{ color: LUXE_COLORS.champagne }}>
                    Active Integrations
                  </h3>
                  <div className="space-y-2">
                    {[
                      { name: 'WhatsApp Business API', status: 'Connected', icon: '💬' },
                      { name: 'Payment Gateway', status: 'Connected', icon: '💳' },
                      { name: 'SMS Provider', status: 'Not Connected', icon: '📱' },
                      { name: 'Email Service', status: 'Connected', icon: '✉️' }
                    ].map(integration => (
                      <div 
                        key={integration.name}
                        className="flex items-center justify-between p-3 rounded"
                        style={{ backgroundColor: LUXE_COLORS.charcoal }}
                      >
                        <div className="flex items-center gap-3">
                          <span>{integration.icon}</span>
                          <span style={{ color: LUXE_COLORS.champagne }}>{integration.name}</span>
                        </div>
                        <span 
                          className="text-sm"
                          style={{ 
                            color: integration.status === 'Connected' ? LUXE_COLORS.emerald : LUXE_COLORS.bronze
                          }}
                        >
                          {integration.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Role and Permissions Info */}
        <div className="mt-8 text-sm text-center" style={{ color: LUXE_COLORS.bronze }}>
          Logged in as: {role?.toUpperCase()} • Organization: {organizationId}
          <br />
          Access: User Management, System Settings, Security Configuration, API Management
        </div>
      </div>
    </div>
  )
}