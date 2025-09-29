'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Smartphone,
  Mail,
  Lock,
  Eye,
  Download
} from 'lucide-react'
import { PWMPreferences } from '@/lib/pwm/types'

interface PWMSettingsProps {
  organizationId: string
}

export function PWMSettings({ organizationId }: PWMSettingsProps) {
  const [preferences, setPreferences] = useState<PWMPreferences>({
    defaultCurrency: 'USD',
    riskTolerance: 'moderate',
    investmentHorizon: 'long',
    notificationPreferences: {
      priceAlerts: true,
      aiInsights: true,
      transactions: false,
      performance: true
    },
    dashboardLayout: {
      widgets: ['wealth', 'performance', 'ai', 'portfolio'],
      theme: 'dark'
    }
  })

  const handlePreferenceChange = (key: keyof PWMPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleNotificationChange = (
    key: keyof PWMPreferences['notificationPreferences'],
    value: boolean
  ) => {
    setPreferences(prev => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [key]: value
      }
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
            <Settings className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Settings</h2>
            <p className="text-muted-foreground mt-1">
              Customize your wealth management experience
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl bg-muted/50 p-1">
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-slate-700 flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="data-[state=active]:bg-slate-700 flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
          <TabsTrigger
            value="preferences"
            className="data-[state=active]:bg-slate-700 flex items-center gap-2"
          >
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Display</span>
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-slate-700 flex items-center gap-2"
          >
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger
            value="data"
            className="data-[state=active]:bg-slate-700 flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Data</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="p-6 bg-background/50 backdrop-blur-sm border-slate-800">
            <h3 className="text-lg font-semibold text-foreground mb-4">Profile Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="firstName" className="text-slate-300">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  defaultValue="John"
                  className="mt-1 bg-muted/50 border-border"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-slate-300">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  defaultValue="Doe"
                  className="mt-1 bg-muted/50 border-border"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-slate-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue="john.doe@example.com"
                  className="mt-1 bg-muted/50 border-border"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-slate-300">
                  Phone
                </Label>
                <Input
                  id="phone"
                  defaultValue="+1 (555) 123-4567"
                  className="mt-1 bg-muted/50 border-border"
                />
              </div>
            </div>

            <div className="mt-6">
              <Label htmlFor="timezone" className="text-slate-300">
                Timezone
              </Label>
              <Select defaultValue="america/new_york">
                <SelectTrigger className="mt-1 bg-muted/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="america/new_york">Eastern Time</SelectItem>
                  <SelectItem value="america/chicago">Central Time</SelectItem>
                  <SelectItem value="america/denver">Mountain Time</SelectItem>
                  <SelectItem value="america/los_angeles">Pacific Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card className="p-6 bg-background/50 backdrop-blur-sm border-slate-800">
            <h3 className="text-lg font-semibold text-foreground mb-4">Investment Profile</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label className="text-slate-300">Risk Tolerance</Label>
                <Select
                  value={preferences.riskTolerance}
                  onValueChange={(value: any) => handlePreferenceChange('riskTolerance', value)}
                >
                  <SelectTrigger className="mt-1 bg-muted/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Investment Horizon</Label>
                <Select
                  value={preferences.investmentHorizon}
                  onValueChange={(value: any) => handlePreferenceChange('investmentHorizon', value)}
                >
                  <SelectTrigger className="mt-1 bg-muted/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short-term (&lt;2 years)</SelectItem>
                    <SelectItem value="medium">Medium-term (2-10 years)</SelectItem>
                    <SelectItem value="long">Long-term (&gt;10 years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Default Currency</Label>
                <Select
                  value={preferences.defaultCurrency}
                  onValueChange={value => handlePreferenceChange('defaultCurrency', value)}
                >
                  <SelectTrigger className="mt-1 bg-muted/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="p-6 bg-background/50 backdrop-blur-sm border-slate-800">
            <h3 className="text-lg font-semibold text-foreground mb-4">Notification Preferences</h3>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-foreground font-medium">Price Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified of significant price movements
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.notificationPreferences.priceAlerts}
                  onCheckedChange={checked => handleNotificationChange('priceAlerts', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-purple-400" />
                  <div>
                    <p className="text-foreground font-medium">AI Insights</p>
                    <p className="text-sm text-muted-foreground">
                      Receive AI-generated investment recommendations
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.notificationPreferences.aiInsights}
                  onCheckedChange={checked => handleNotificationChange('aiInsights', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-emerald-400" />
                  <div>
                    <p className="text-foreground font-medium">Transaction Confirmations</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified of all transactions
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.notificationPreferences.transactions}
                  onCheckedChange={checked => handleNotificationChange('transactions', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-yellow-400" />
                  <div>
                    <p className="text-foreground font-medium">Performance Reports</p>
                    <p className="text-sm text-muted-foreground">
                      Weekly and monthly performance summaries
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences.notificationPreferences.performance}
                  onCheckedChange={checked => handleNotificationChange('performance', checked)}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Display Preferences */}
        <TabsContent value="preferences" className="space-y-6">
          <Card className="p-6 bg-background/50 backdrop-blur-sm border-slate-800">
            <h3 className="text-lg font-semibold text-foreground mb-4">Display Preferences</h3>

            <div className="space-y-6">
              <div>
                <Label className="text-slate-300">Theme</Label>
                <Select value="dark" disabled>
                  <SelectTrigger className="mt-1 bg-muted/50 border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark (Premium)</SelectItem>
                    <SelectItem value="light" disabled>
                      Light (Coming Soon)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs ink-muted mt-1">
                  Premium dark theme optimized for wealth management
                </p>
              </div>

              <div>
                <Label className="text-slate-300">Dashboard Layout</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {['wealth', 'performance', 'ai', 'portfolio'].map(widget => (
                    <div
                      key={widget}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50"
                    >
                      <span className="text-sm text-slate-300 capitalize">{widget}</span>
                      <Switch defaultChecked />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-6">
          <Card className="p-6 bg-background/50 backdrop-blur-sm border-slate-800">
            <h3 className="text-lg font-semibold text-foreground mb-4">Security Settings</h3>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="text-foreground font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Enabled via Authenticator App</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="bg-green-500/20 text-green-300 border-green-500/30"
                >
                  Active
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-foreground font-medium">Biometric Login</p>
                    <p className="text-sm text-muted-foreground">Touch/Face ID for quick access</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <Button variant="outline" className="w-full bg-muted/50 border-border">
                Change Password
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Data Export */}
        <TabsContent value="data" className="space-y-6">
          <Card className="p-6 bg-background/50 backdrop-blur-sm border-slate-800">
            <h3 className="text-lg font-semibold text-foreground mb-4">Data Management</h3>

            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start bg-muted/50 border-border">
                <Download className="h-4 w-4 mr-2" />
                Export Portfolio Data (CSV)
              </Button>
              <Button variant="outline" className="w-full justify-start bg-muted/50 border-border">
                <Download className="h-4 w-4 mr-2" />
                Export Transaction History (PDF)
              </Button>
              <Button variant="outline" className="w-full justify-start bg-muted/50 border-border">
                <Download className="h-4 w-4 mr-2" />
                Export Tax Documents (ZIP)
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button className="px-8 bg-emerald-600 hover:bg-emerald-700">Save Changes</Button>
      </div>
    </div>
  )
}
