'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { SalonProductionSidebar } from '@/components/salon/SalonProductionSidebar'
import { useToast } from '@/components/ui/use-toast'
import { 
  Settings, 
  Save,
  ChevronLeft,
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
  Building,
  MapPin,
  Phone,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

// Default organization ID for development
const DEFAULT_ORG_ID = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'

interface SalonSettings {
  business_info: {
    name: string
    type: string
    address: string
    phone: string
    email: string
    website?: string
    tax_id?: string
    registration_number?: string
  }
  business_hours: {
    [key: string]: {
      open: string
      close: string
      closed: boolean
    }
  }
  appointment_settings: {
    default_duration: number
    buffer_time: number
    max_advance_booking: number
    allow_online_booking: boolean
    require_deposit: boolean
    deposit_amount: number
    cancellation_policy: string
    reminder_timing: {
      email: number
      sms: number
    }
  }
  payment_settings: {
    accepted_methods: {
      cash: boolean
      credit_card: boolean
      debit_card: boolean
      digital_wallet: boolean
      gift_card: boolean
      bank_transfer: boolean
    }
    tip_suggestions: number[]
    tax_rate: number
    loyalty_program_active: boolean
    points_per_currency: number
    currency: string
  }
  notification_settings: {
    email: {
      appointment_confirmations: boolean
      appointment_reminders: boolean
      birthday_offers: boolean
      promotional_emails: boolean
      loyalty_updates: boolean
    }
    sms: {
      appointment_reminders: boolean
      confirmation_requests: boolean
      promotional_sms: boolean
    }
  }
  staff_settings: {
    commission_structure: 'percentage' | 'fixed'
    default_commission_rate: number
    allow_schedule_management: boolean
    require_clock_in: boolean
    overtime_rate: number
  }
  system_settings: {
    timezone: string
    date_format: string
    time_format: string
    language: string
    theme: 'light' | 'dark'
    session_timeout: number
    require_password_change: boolean
    two_factor_auth: boolean
    data_backup_enabled: boolean
  }
}

export default function SettingsPage() {
  const router = useRouter()
  const { currentOrganization, contextLoading } = useMultiOrgAuth()
  const organizationId = currentOrganization?.id || DEFAULT_ORG_ID
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState('business')
  const [settings, setSettings] = useState<SalonSettings | null>(null)

  useEffect(() => {
    if (organizationId && !contextLoading) {
      fetchSettings()
    }
  }, [organizationId, contextLoading])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/v1/salon/settings?organization_id=${organizationId}`)
      const data = await response.json()
      
      if (data.success) {
        setSettings(data.settings)
      } else {
        throw new Error(data.error || 'Failed to fetch settings')
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!settings) return

    try {
      setSaving(true)
      const response = await fetch('/api/v1/salon/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          settings
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings')
      }

      setHasChanges(false)
      toast({
        title: 'Success',
        description: 'Settings saved successfully'
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const updateSettings = (section: keyof SalonSettings, field: string, value: any) => {
    if (!settings) return
    
    setSettings(prev => {
      if (!prev) return prev
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }
    })
    setHasChanges(true)
  }

  const updateNestedSettings = (section: keyof SalonSettings, subsection: string, field: string, value: any) => {
    if (!settings) return
    
    setSettings(prev => {
      if (!prev) return prev
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [subsection]: {
            ...(prev[section] as any)[subsection],
            [field]: value
          }
        }
      }
    })
    setHasChanges(true)
  }

  if (contextLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Failed to load settings. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white flex">
      <SalonProductionSidebar />
      <div className="flex-1 ml-16">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/salon')}
              className="mb-4"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Settings & Configuration
                </h1>
                <p className="text-gray-600 text-lg">
                  Manage your salon settings and preferences
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={fetchSettings}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                {hasChanges && (
                  <Button
                    onClick={saveSettings}
                    disabled={saving}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {hasChanges && (
            <Alert className="mb-6 border-yellow-200 bg-yellow-50">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                You have unsaved changes. Click "Save Changes" to persist your configuration.
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="business">Business</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="staff">Staff</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>

            {/* Business Information Tab */}
            <TabsContent value="business" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="w-5 h-5 text-purple-600" />
                      Business Information
                    </CardTitle>
                    <CardDescription>
                      Basic information about your salon
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input
                        id="businessName"
                        value={settings.business_info.name}
                        onChange={(e) => updateSettings('business_info', 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="businessType">Business Type</Label>
                      <Input
                        id="businessType"
                        value={settings.business_info.type}
                        onChange={(e) => updateSettings('business_info', 'type', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={settings.business_info.address}
                        onChange={(e) => updateSettings('business_info', 'address', e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={settings.business_info.phone}
                          onChange={(e) => updateSettings('business_info', 'phone', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={settings.business_info.email}
                          onChange={(e) => updateSettings('business_info', 'email', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={settings.business_info.website || ''}
                        onChange={(e) => updateSettings('business_info', 'website', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="taxId">Tax ID</Label>
                        <Input
                          id="taxId"
                          value={settings.business_info.tax_id || ''}
                          onChange={(e) => updateSettings('business_info', 'tax_id', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="regNumber">Registration Number</Label>
                        <Input
                          id="regNumber"
                          value={settings.business_info.registration_number || ''}
                          onChange={(e) => updateSettings('business_info', 'registration_number', e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-purple-600" />
                      Business Hours
                    </CardTitle>
                    <CardDescription>
                      Set your salon's operating hours
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(settings.business_hours).map(([day, hours]) => (
                      <div key={day} className="flex items-center gap-4">
                        <div className="w-24 text-sm font-medium capitalize">{day}</div>
                        <Switch
                          checked={!hours.closed}
                          onCheckedChange={(checked) => 
                            updateNestedSettings('business_hours', day, 'closed', !checked)
                          }
                        />
                        {!hours.closed ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              type="time"
                              value={hours.open}
                              onChange={(e) => updateNestedSettings('business_hours', day, 'open', e.target.value)}
                              className="w-32"
                            />
                            <span className="text-sm text-gray-500">to</span>
                            <Input
                              type="time"
                              value={hours.close}
                              onChange={(e) => updateNestedSettings('business_hours', day, 'close', e.target.value)}
                              className="w-32"
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
            <TabsContent value="appointments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    Appointment Settings
                  </CardTitle>
                  <CardDescription>
                    Configure appointment booking and scheduling preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="defaultDuration">Default Duration (minutes)</Label>
                      <Input
                        id="defaultDuration"
                        type="number"
                        value={settings.appointment_settings.default_duration}
                        onChange={(e) => updateSettings('appointment_settings', 'default_duration', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bufferTime">Buffer Time (minutes)</Label>
                      <Input
                        id="bufferTime"
                        type="number"
                        value={settings.appointment_settings.buffer_time}
                        onChange={(e) => updateSettings('appointment_settings', 'buffer_time', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxAdvance">Max Advance Booking (days)</Label>
                      <Input
                        id="maxAdvance"
                        type="number"
                        value={settings.appointment_settings.max_advance_booking}
                        onChange={(e) => updateSettings('appointment_settings', 'max_advance_booking', parseInt(e.target.value))}
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
                        checked={settings.appointment_settings.allow_online_booking}
                        onCheckedChange={(checked) => updateSettings('appointment_settings', 'allow_online_booking', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="requireDeposit">Require Deposit for Booking</Label>
                        <p className="text-sm text-gray-600">Require upfront payment to confirm bookings</p>
                      </div>
                      <Switch
                        id="requireDeposit"
                        checked={settings.appointment_settings.require_deposit}
                        onCheckedChange={(checked) => updateSettings('appointment_settings', 'require_deposit', checked)}
                      />
                    </div>

                    {settings.appointment_settings.require_deposit && (
                      <div>
                        <Label htmlFor="depositAmount">Deposit Amount (AED)</Label>
                        <Input
                          id="depositAmount"
                          type="number"
                          value={settings.appointment_settings.deposit_amount}
                          onChange={(e) => updateSettings('appointment_settings', 'deposit_amount', parseInt(e.target.value))}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="cancellationPolicy">Cancellation Policy</Label>
                    <Textarea
                      id="cancellationPolicy"
                      value={settings.appointment_settings.cancellation_policy}
                      onChange={(e) => updateSettings('appointment_settings', 'cancellation_policy', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emailReminder">Email Reminder (hours before)</Label>
                      <Input
                        id="emailReminder"
                        type="number"
                        value={settings.appointment_settings.reminder_timing.email}
                        onChange={(e) => updateNestedSettings('appointment_settings', 'reminder_timing', 'email', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="smsReminder">SMS Reminder (hours before)</Label>
                      <Input
                        id="smsReminder"
                        type="number"
                        value={settings.appointment_settings.reminder_timing.sms}
                        onChange={(e) => updateNestedSettings('appointment_settings', 'reminder_timing', 'sms', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-purple-600" />
                      Payment Methods
                    </CardTitle>
                    <CardDescription>
                      Configure accepted payment methods
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(settings.payment_settings.accepted_methods).map(([method, enabled]) => (
                      <div key={method} className="flex items-center justify-between">
                        <Label htmlFor={method} className="capitalize">
                          {method.replace(/_/g, ' ')}
                        </Label>
                        <Switch
                          id={method}
                          checked={enabled}
                          onCheckedChange={(checked) => 
                            updateNestedSettings('payment_settings', 'accepted_methods', method, checked)
                          }
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-purple-600" />
                      Financial Settings
                    </CardTitle>
                    <CardDescription>
                      Tax rates, tips, and loyalty program
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="taxRate">VAT/Tax Rate (%)</Label>
                      <Input
                        id="taxRate"
                        type="number"
                        step="0.1"
                        value={settings.payment_settings.tax_rate}
                        onChange={(e) => updateSettings('payment_settings', 'tax_rate', parseFloat(e.target.value))}
                      />
                    </div>
                    
                    <div>
                      <Label>Tip Suggestions (%)</Label>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {settings.payment_settings.tip_suggestions.map((tip, index) => (
                          <Input
                            key={index}
                            type="number"
                            value={tip}
                            onChange={(e) => {
                              const newTips = [...settings.payment_settings.tip_suggestions]
                              newTips[index] = parseInt(e.target.value)
                              updateSettings('payment_settings', 'tip_suggestions', newTips)
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={settings.payment_settings.currency}
                        onValueChange={(value) => updateSettings('payment_settings', 'currency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="loyaltyProgram">Loyalty Program</Label>
                          <p className="text-sm text-gray-600">Enable points and rewards system</p>
                        </div>
                        <Switch
                          id="loyaltyProgram"
                          checked={settings.payment_settings.loyalty_program_active}
                          onCheckedChange={(checked) => updateSettings('payment_settings', 'loyalty_program_active', checked)}
                        />
                      </div>

                      {settings.payment_settings.loyalty_program_active && (
                        <div>
                          <Label htmlFor="pointsPerCurrency">Points per {settings.payment_settings.currency}</Label>
                          <Input
                            id="pointsPerCurrency"
                            type="number"
                            value={settings.payment_settings.points_per_currency}
                            onChange={(e) => updateSettings('payment_settings', 'points_per_currency', parseInt(e.target.value))}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-purple-600" />
                      Email Notifications
                    </CardTitle>
                    <CardDescription>
                      Configure email notification preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(settings.notification_settings.email).map(([type, enabled]) => (
                      <div key={type} className="flex items-center justify-between">
                        <Label htmlFor={`email-${type}`} className="capitalize">
                          {type.replace(/_/g, ' ')}
                        </Label>
                        <Switch
                          id={`email-${type}`}
                          checked={enabled}
                          onCheckedChange={(checked) => 
                            updateNestedSettings('notification_settings', 'email', type, checked)
                          }
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-purple-600" />
                      SMS Notifications
                    </CardTitle>
                    <CardDescription>
                      Configure SMS notification preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(settings.notification_settings.sms).map(([type, enabled]) => (
                      <div key={type} className="flex items-center justify-between">
                        <Label htmlFor={`sms-${type}`} className="capitalize">
                          {type.replace(/_/g, ' ')}
                        </Label>
                        <Switch
                          id={`sms-${type}`}
                          checked={enabled}
                          onCheckedChange={(checked) => 
                            updateNestedSettings('notification_settings', 'sms', type, checked)
                          }
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Staff Tab */}
            <TabsContent value="staff" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    Staff Management Settings
                  </CardTitle>
                  <CardDescription>
                    Configure staff commissions and management preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="commissionStructure">Commission Structure</Label>
                      <Select
                        value={settings.staff_settings.commission_structure}
                        onValueChange={(value: 'percentage' | 'fixed') => updateSettings('staff_settings', 'commission_structure', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="defaultCommission">Default Commission Rate (%)</Label>
                      <Input
                        id="defaultCommission"
                        type="number"
                        value={settings.staff_settings.default_commission_rate}
                        onChange={(e) => updateSettings('staff_settings', 'default_commission_rate', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="overtimeRate">Overtime Rate Multiplier</Label>
                    <Input
                      id="overtimeRate"
                      type="number"
                      step="0.1"
                      value={settings.staff_settings.overtime_rate}
                      onChange={(e) => updateSettings('staff_settings', 'overtime_rate', parseFloat(e.target.value))}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="staffSchedule">Allow Staff Schedule Management</Label>
                        <p className="text-sm text-gray-600">Let staff manage their own schedules</p>
                      </div>
                      <Switch
                        id="staffSchedule"
                        checked={settings.staff_settings.allow_schedule_management}
                        onCheckedChange={(checked) => updateSettings('staff_settings', 'allow_schedule_management', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="clockIn">Require Staff Clock-In</Label>
                        <p className="text-sm text-gray-600">Track staff working hours with clock-in/out</p>
                      </div>
                      <Switch
                        id="clockIn"
                        checked={settings.staff_settings.require_clock_in}
                        onCheckedChange={(checked) => updateSettings('staff_settings', 'require_clock_in', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Tab */}
            <TabsContent value="system" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-purple-600" />
                      Localization
                    </CardTitle>
                    <CardDescription>
                      Regional and language settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={settings.system_settings.timezone}
                        onValueChange={(value) => updateSettings('system_settings', 'timezone', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asia/Dubai">Dubai (GMT+4)</SelectItem>
                          <SelectItem value="Asia/Abu_Dhabi">Abu Dhabi (GMT+4)</SelectItem>
                          <SelectItem value="Asia/Riyadh">Riyadh (GMT+3)</SelectItem>
                          <SelectItem value="Asia/Kuwait">Kuwait (GMT+3)</SelectItem>
                          <SelectItem value="Asia/Doha">Doha (GMT+3)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="dateFormat">Date Format</Label>
                      <Select
                        value={settings.system_settings.date_format}
                        onValueChange={(value) => updateSettings('system_settings', 'date_format', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="timeFormat">Time Format</Label>
                      <Select
                        value={settings.system_settings.time_format}
                        onValueChange={(value) => updateSettings('system_settings', 'time_format', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12h">12 Hour (AM/PM)</SelectItem>
                          <SelectItem value="24h">24 Hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="language">Language</Label>
                      <Select
                        value={settings.system_settings.language}
                        onValueChange={(value) => updateSettings('system_settings', 'language', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="ar">Arabic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="theme">Theme</Label>
                      <Select
                        value={settings.system_settings.theme}
                        onValueChange={(value: 'light' | 'dark') => updateSettings('system_settings', 'theme', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-purple-600" />
                      Security & Data
                    </CardTitle>
                    <CardDescription>
                      Security and data protection settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        value={settings.system_settings.session_timeout}
                        onChange={(e) => updateSettings('system_settings', 'session_timeout', parseInt(e.target.value))}
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
                          checked={settings.system_settings.require_password_change}
                          onCheckedChange={(checked) => updateSettings('system_settings', 'require_password_change', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="twoFactor">Two-Factor Authentication</Label>
                          <p className="text-sm text-gray-600">Additional security layer for login</p>
                        </div>
                        <Switch
                          id="twoFactor"
                          checked={settings.system_settings.two_factor_auth}
                          onCheckedChange={(checked) => updateSettings('system_settings', 'two_factor_auth', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="dataBackup">Automatic Data Backup</Label>
                          <p className="text-sm text-gray-600">Daily backup of all salon data</p>
                        </div>
                        <Switch
                          id="dataBackup"
                          checked={settings.system_settings.data_backup_enabled}
                          onCheckedChange={(checked) => updateSettings('system_settings', 'data_backup_enabled', checked)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}