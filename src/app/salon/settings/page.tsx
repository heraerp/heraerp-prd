// TODO: Update this page to use production data from useSetting
// 1. Replace hardcoded data arrays with: const data = items.map(transformToUISetting)
// 2. Update create handlers to use: await createSetting(formData)
// 3. Update delete handlers to use: await deleteSetting(id)
// 4. Replace loading states with: loading ? <Skeleton /> : <YourComponent />

'use client'

import { useAuth } from '@/contexts/auth-context'
import { useUserContext } from '@/hooks/useUserContext'
import { useSetting } from '@/hooks/useSetting'

import React, { useState, useEffect } from 'react'
import '../salon-styles.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SalonTeamsSidebar } from '@/components/salon-progressive/SalonTeamsSidebar'
import { 
  Settings, 
  Save,
  TestTube,
  ArrowLeft,
  Store,
  Clock,
  Bell,
  Shield,
  Palette,
  Globe,
  DollarSign,
  Mail,
  Smartphone,
  Users,
  Calendar,
  CreditCard,
  Database,
  Key,
  Eye,
  EyeOff,
  Building,
  MapPin,
  Phone
} from 'lucide-react'
import Link from 'next/link'

// Progressive Demo Data
const initialSettings = {
  // Business Information
  businessName: 'HERA Salon & Spa',
  businessType: 'Salon & Beauty Spa',
  address: '123 Beauty Street, Style City, SC 12345',
  phone: '(555) 123-SALON',
  email: 'info@herasalon.com',
  website: 'https://herasalon.com',
  businessHours: {
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '20:00', closed: false },
    friday: { open: '09:00', close: '20:00', closed: false },
    saturday: { open: '08:00', close: '17:00', closed: false },
    sunday: { open: '10:00', close: '16:00', closed: false }
  },
  
  // Appointment Settings
  defaultAppointmentDuration: 60,
  bookingBufferTime: 15,
  maxAdvanceBooking: 90,
  allowOnlineBooking: true,
  requireDepositForBooking: false,
  depositAmount: 25,
  cancellationPolicy: '24 hours advance notice required',
  
  // Payment Settings
  acceptedPaymentMethods: {
    cash: true,
    creditCard: true,
    debitCard: true,
    digitalWallet: true,
    giftCard: true
  },
  automaticTipSuggestions: [15, 18, 20, 25],
  taxRate: 8.5,
  loyaltyProgramActive: true,
  
  // Notification Settings
  emailNotifications: {
    appointmentConfirmations: true,
    appointmentReminders: true,
    birthdayOffers: true,
    promotionalEmails: true,
    loyaltyUpdates: true
  },
  smsNotifications: {
    appointmentReminders: true,
    confirmationRequests: false,
    promotionalSms: false
  },
  reminderTiming: {
    email: 24, // hours before
    sms: 2 // hours before
  },
  
  // Staff Settings
  commissionStructure: 'percentage', // 'percentage' or 'fixed'
  defaultCommissionRate: 40,
  allowStaffScheduleManagement: true,
  requireStaffClockIn: false,
  
  // System Settings
  timezone: 'America/New_York',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  currency: 'USD',
  language: 'en-US',
  
  // Security Settings
  requirePasswordChange: false,
  sessionTimeout: 30,
  twoFactorAuth: false,
  dataBackupEnabled: true,
  
  // Theme Settings
  primaryColor: '#ec4899', // Pink
  secondaryColor: '#8b5cf6', // Purple
  theme: 'light',
  brandLogo: null
}

export default function SettingsProgressive() {
  const { isAuthenticated } = useAuth()
  const { organizationId, userContext, loading: contextLoading } = useUserContext()
  const { 
    items, 
    stats, 
    loading, 
    error, 
    refetch, 
    createSetting, 
    updateSetting, 
    deleteSetting 
  } = useSetting(organizationId)

  const [testMode, setTestMode] = useState(true)
  const [settings, setSettings] = useState(initialSettings)
  const [hasChanges, setHasChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showApiKeys, setShowApiKeys] = useState(false)

  const handleSaveProgress = () => {
    setLastSaved(new Date())
    setHasChanges(false)
    console.log('Settings saved:', settings)
  }

  const updateSettings = (section: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: typeof prev[section as keyof typeof prev] === 'object' 
        ? { ...prev[section as keyof typeof prev] as any, [field]: value }
        : value
    }))
    setHasChanges(true)
  }

  const updateNestedSettings = (section: string, subsection: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev] as any,
        [subsection]: {
          ...(prev[section as keyof typeof prev] as any)[subsection],
          [field]: value
        }
      }
    }))
    setHasChanges(true)
  }

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':')
    const hourNum = parseInt(hour)
    const period = hourNum >= 12 ? 'PM' : 'AM'
    const displayHour = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum
    return `${displayHour}:${minute} ${period}`
  }


  if (!isAuthenticated) {


    return (


      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-6">


        <Alert>


          <AlertCircle className="h-4 w-4" />


          <AlertDescription>


            Please log in to access settings management.


          </AlertDescription>


        </Alert>


      </div>


    )


  }



  if (contextLoading) {


    return (


      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">


        <div className="text-center">


          <Loader2 className="h-8 w-8 animate-spin text-pink-600 mx-auto mb-4" />


          <p className="text-gray-600">Loading your profile...</p>


        </div>


      </div>


    )


  }



  if (!organizationId) {


    return (


      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-6">


        <Alert variant="destructive">


          <AlertCircle className="h-4 w-4" />


          <AlertDescription>


            Organization not found. Please contact support.


          </AlertDescription>


        </Alert>


      </div>


    )


  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex">
      {/* Teams-Style Sidebar */}
      <SalonTeamsSidebar />
      
      <div className="flex-1 flex flex-col ml-16">
        {/* Progressive Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
            <div className="text-right">
              {userContext && (
                <>
                  <p className="text-sm font-medium">{userContext.user.name}</p>
                  <p className="text-xs text-gray-600">{userContext.organization.name}</p>
                </>
              )}
            </div>
              <div className="flex items-center gap-4">
                <Button variant="outline" asChild>
                  <Link href="/salon-progressive">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Link>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    Settings & Configuration
                  </h1>
                  <p className="text-sm text-gray-600">Customize your salon management system</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {testMode && hasChanges && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveProgress}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                )}

                {lastSaved && (
                  <div className="text-xs text-gray-500">
                    Saved: {lastSaved.toLocaleTimeString()}
                  </div>
                )}

                <Badge variant="secondary" className="flex items-center gap-1">
                  <TestTube className="h-3 w-3" />
                  Test Mode
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">
          <Tabs defaultValue="business" className="space-y-4">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="business">Business</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="staff">Staff</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>

            {/* Business Information Tab */}
            <TabsContent value="business">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="h-5 w-5 text-pink-500" />
                      Business Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input
                        id="businessName"
                        value={settings.businessName}
                        onChange={(e) => updateSettings('businessName', '', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="businessType">Business Type</Label>
                      <Input
                        id="businessType"
                        value={settings.businessType}
                        onChange={(e) => updateSettings('businessType', '', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={settings.address}
                        onChange={(e) => updateSettings('address', '', e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={settings.phone}
                        onChange={(e) => updateSettings('phone', '', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={settings.email}
                        onChange={(e) => updateSettings('email', '', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={settings.website}
                        onChange={(e) => updateSettings('website', '', e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-pink-500" />
                      Business Hours
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(settings.businessHours).map(([day, hours]) => (
                      <div key={day} className="flex items-center gap-4">
                        <div className="w-20 text-sm font-medium capitalize">{day}</div>
                        <Switch
                          checked={!hours.closed}
                          onCheckedChange={(checked) => 
                            updateNestedSettings('businessHours', day, 'closed', !checked)
                          }
                        />
                        {!hours.closed ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              type="time"
                              value={hours.open}
                              onChange={(e) => updateNestedSettings('businessHours', day, 'open', e.target.value)}
                              className="w-24"
                            />
                            <span className="text-sm text-gray-500">to</span>
                            <Input
                              type="time"
                              value={hours.close}
                              onChange={(e) => updateNestedSettings('businessHours', day, 'close', e.target.value)}
                              className="w-24"
                            />
                          </div>
                        ) : (
                          <div className="flex-1 text-sm text-gray-500">Closed</div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Appointments Tab */}
            <TabsContent value="appointments">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-pink-500" />
                    Appointment Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="defaultDuration">Default Duration (minutes)</Label>
                      <Input
                        id="defaultDuration"
                        type="number"
                        value={settings.defaultAppointmentDuration}
                        onChange={(e) => updateSettings('defaultAppointmentDuration', '', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bufferTime">Buffer Time (minutes)</Label>
                      <Input
                        id="bufferTime"
                        type="number"
                        value={settings.bookingBufferTime}
                        onChange={(e) => updateSettings('bookingBufferTime', '', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxAdvance">Max Advance Booking (days)</Label>
                      <Input
                        id="maxAdvance"
                        type="number"
                        value={settings.maxAdvanceBooking}
                        onChange={(e) => updateSettings('maxAdvanceBooking', '', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="depositAmount">Deposit Amount ($)</Label>
                      <Input
                        id="depositAmount"
                        type="number"
                        value={settings.depositAmount}
                        onChange={(e) => updateSettings('depositAmount', '', parseInt(e.target.value))}
                        disabled={!settings.requireDepositForBooking}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="onlineBooking">Allow Online Booking</Label>
                        <p className="text-sm text-gray-600">Enable clients to book appointments online</p>
                      </div>
                      <Switch
                        id="onlineBooking"
                        checked={settings.allowOnlineBooking}
                        onCheckedChange={(checked) => updateSettings('allowOnlineBooking', '', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="requireDeposit">Require Deposit for Booking</Label>
                        <p className="text-sm text-gray-600">Require upfront payment to confirm bookings</p>
                      </div>
                      <Switch
                        id="requireDeposit"
                        checked={settings.requireDepositForBooking}
                        onCheckedChange={(checked) => updateSettings('requireDepositForBooking', '', checked)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="cancellationPolicy">Cancellation Policy</Label>
                    <Textarea
                      id="cancellationPolicy"
                      value={settings.cancellationPolicy}
                      onChange={(e) => updateSettings('cancellationPolicy', '', e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-pink-500" />
                      Payment Methods
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(settings.acceptedPaymentMethods).map(([method, enabled]) => (
                      <div key={method} className="flex items-center justify-between">
                        <Label htmlFor={method} className="capitalize">
                          {method.replace(/([A-Z])/g, ' $1').trim()}
                        </Label>
                        <Switch
                          id={method}
                          checked={enabled}
                          onCheckedChange={(checked) => 
                            updateNestedSettings('acceptedPaymentMethods', method, '', checked)
                          }
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-pink-500" />
                      Financial Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="taxRate">Tax Rate (%)</Label>
                      <Input
                        id="taxRate"
                        type="number"
                        step="0.1"
                        value={settings.taxRate}
                        onChange={(e) => updateSettings('taxRate', '', parseFloat(e.target.value))}
                      />
                    </div>
                    
                    <div>
                      <Label>Automatic Tip Suggestions (%)</Label>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {settings.automaticTipSuggestions.map((tip, index) => (
                          <Input
                            key={index}
                            type="number"
                            value={tip}
                            onChange={(e) => {
                              const newTips = [...settings.automaticTipSuggestions]
                              newTips[index] = parseInt(e.target.value)
                              updateSettings('automaticTipSuggestions', '', newTips)
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="loyaltyProgram">Loyalty Program</Label>
                        <p className="text-sm text-gray-600">Enable points and rewards system</p>
                      </div>
                      <Switch
                        id="loyaltyProgram"
                        checked={settings.loyaltyProgramActive}
                        onCheckedChange={(checked) => updateSettings('loyaltyProgramActive', '', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-pink-500" />
                      Email Notifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(settings.emailNotifications).map(([type, enabled]) => (
                      <div key={type} className="flex items-center justify-between">
                        <Label htmlFor={`email-${type}`} className="capitalize">
                          {type.replace(/([A-Z])/g, ' $1').trim()}
                        </Label>
                        <Switch
                          id={`email-${type}`}
                          checked={enabled}
                          onCheckedChange={(checked) => 
                            updateNestedSettings('emailNotifications', type, '', checked)
                          }
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-pink-500" />
                      SMS Notifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(settings.smsNotifications).map(([type, enabled]) => (
                      <div key={type} className="flex items-center justify-between">
                        <Label htmlFor={`sms-${type}`} className="capitalize">
                          {type.replace(/([A-Z])/g, ' $1').trim()}
                        </Label>
                        <Switch
                          id={`sms-${type}`}
                          checked={enabled}
                          onCheckedChange={(checked) => 
                            updateNestedSettings('smsNotifications', type, '', checked)
                          }
                        />
                      </div>
                    ))}

                    <div className="pt-4 space-y-4">
                      <div>
                        <Label htmlFor="emailReminder">Email Reminder (hours before)</Label>
                        <Input
                          id="emailReminder"
                          type="number"
                          value={settings.reminderTiming.email}
                          onChange={(e) => updateNestedSettings('reminderTiming', 'email', '', parseInt(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="smsReminder">SMS Reminder (hours before)</Label>
                        <Input
                          id="smsReminder"
                          type="number"
                          value={settings.reminderTiming.sms}
                          onChange={(e) => updateNestedSettings('reminderTiming', 'sms', '', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Staff Tab */}
            <TabsContent value="staff">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-pink-500" />
                    Staff Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="commissionStructure">Commission Structure</Label>
                      <Select
                        value={settings.commissionStructure}
                        onValueChange={(value) => updateSettings('commissionStructure', '', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="hera-select-content">
                          <SelectItem value="percentage" className="hera-select-item">Percentage</SelectItem>
                          <SelectItem value="fixed" className="hera-select-item">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="defaultCommission">Default Commission Rate (%)</Label>
                      <Input
                        id="defaultCommission"
                        type="number"
                        value={settings.defaultCommissionRate}
                        onChange={(e) => updateSettings('defaultCommissionRate', '', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="staffSchedule">Allow Staff Schedule Management</Label>
                        <p className="text-sm text-gray-600">Let staff manage their own schedules</p>
                      </div>
                      <Switch
                        id="staffSchedule"
                        checked={settings.allowStaffScheduleManagement}
                        onCheckedChange={(checked) => updateSettings('allowStaffScheduleManagement', '', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="clockIn">Require Staff Clock-In</Label>
                        <p className="text-sm text-gray-600">Track staff working hours</p>
                      </div>
                      <Switch
                        id="clockIn"
                        checked={settings.requireStaffClockIn}
                        onCheckedChange={(checked) => updateSettings('requireStaffClockIn', '', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Tab */}
            <TabsContent value="system">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-pink-500" />
                      Localization
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={settings.timezone}
                        onValueChange={(value) => updateSettings('timezone', '', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="hera-select-content">
                          <SelectItem value="America/New_York" className="hera-select-item">Eastern Time</SelectItem>
                          <SelectItem value="America/Chicago" className="hera-select-item">Central Time</SelectItem>
                          <SelectItem value="America/Denver" className="hera-select-item">Mountain Time</SelectItem>
                          <SelectItem value="America/Los_Angeles" className="hera-select-item">Pacific Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="dateFormat">Date Format</Label>
                      <Select
                        value={settings.dateFormat}
                        onValueChange={(value) => updateSettings('dateFormat', '', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="hera-select-content">
                          <SelectItem value="MM/DD/YYYY" className="hera-select-item">MM/DD/YYYY</SelectItem>
                          <SelectItem value="DD/MM/YYYY" className="hera-select-item">DD/MM/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD" className="hera-select-item">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="timeFormat">Time Format</Label>
                      <Select
                        value={settings.timeFormat}
                        onValueChange={(value) => updateSettings('timeFormat', '', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="hera-select-content">
                          <SelectItem value="12h" className="hera-select-item">12 Hour</SelectItem>
                          <SelectItem value="24h" className="hera-select-item">24 Hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={settings.currency}
                        onValueChange={(value) => updateSettings('currency', '', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="hera-select-content">
                          <SelectItem value="USD" className="hera-select-item">USD ($)</SelectItem>
                          <SelectItem value="EUR" className="hera-select-item">EUR (€)</SelectItem>
                          <SelectItem value="GBP" className="hera-select-item">GBP (£)</SelectItem>
                          <SelectItem value="CAD" className="hera-select-item">CAD ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-pink-500" />
                      Security & Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        value={settings.sessionTimeout}
                        onChange={(e) => updateSettings('sessionTimeout', '', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="passwordChange">Require Periodic Password Change</Label>
                          <p className="text-sm text-gray-600">Force password updates every 90 days</p>
                        </div>
                        <Switch
                          id="passwordChange"
                          checked={settings.requirePasswordChange}
                          onCheckedChange={(checked) => updateSettings('requirePasswordChange', '', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="twoFactor">Two-Factor Authentication</Label>
                          <p className="text-sm text-gray-600">Additional security layer for login</p>
                        </div>
                        <Switch
                          id="twoFactor"
                          checked={settings.twoFactorAuth}
                          onCheckedChange={(checked) => updateSettings('twoFactorAuth', '', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="dataBackup">Automatic Data Backup</Label>
                          <p className="text-sm text-gray-600">Daily backup of all salon data</p>
                        </div>
                        <Switch
                          id="dataBackup"
                          checked={settings.dataBackupEnabled}
                          onCheckedChange={(checked) => updateSettings('dataBackupEnabled', '', checked)}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>API Keys & Integration</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowApiKeys(!showApiKeys)}
                        >
                          {showApiKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {showApiKeys && (
                        <div className="space-y-2 p-3 bg-gray-50 rounded">
                          <div className="text-xs">
                            <p className="font-medium">Stripe API Key:</p>
                            <p className="font-mono text-gray-600">sk_test_••••••••••••••••</p>
                          </div>
                          <div className="text-xs">
                            <p className="font-medium">SMS Provider Key:</p>
                            <p className="font-mono text-gray-600">tw_••••••••••••••••</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Progressive Features Notice */}
          {testMode && (
            <Card className="mt-6 bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TestTube className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Test Mode Active</p>
                    <p className="text-sm text-blue-700">
                      Configure your salon settings freely. Customize business hours, payment methods, notifications, and more. 
                      All changes are saved locally in test mode. Click "Save Changes" to persist your configuration.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}