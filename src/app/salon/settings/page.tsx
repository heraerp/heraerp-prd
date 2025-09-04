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
  const { currentOrganization, isLoading, isLoadingOrgs } = useMultiOrgAuth()
  const contextLoading = isLoading || isLoadingOrgs
  
  // For subdomain access, try to get organization directly from subdomain
  const [subdomainOrg, setSubdomainOrg] = useState<any>(null)
  const [loadingSubdomainOrg, setLoadingSubdomainOrg] = useState(false)
  
  const getSubdomain = () => {
    if (typeof window === 'undefined') return null
    const hostname = window.location.hostname
    if (hostname.endsWith('.lvh.me')) {
      return hostname.split('.')[0]
    }
    return null
  }
  
  // Load organization by subdomain if no auth context
  useEffect(() => {
    const subdomain = getSubdomain()
    if (subdomain && !currentOrganization && !contextLoading) {
      setLoadingSubdomainOrg(true)
      fetch(`/api/v1/organizations/by-subdomain?subdomain=${subdomain}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.organization) {
            setSubdomainOrg(data.organization)
          }
        })
        .catch(console.error)
        .finally(() => setLoadingSubdomainOrg(false))
    }
  }, [currentOrganization, contextLoading])
  
  const organization = currentOrganization || subdomainOrg
  const organizationId = organization?.id || DEFAULT_ORG_ID
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState('business')
  const [settings, setSettings] = useState<SalonSettings | null>(null)

  useEffect(() => {
    // For demo pages, we always have the default org ID, so fetch settings immediately
    if (organizationId) {
      fetchSettings()
    }
  }, [organizationId])

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

  if (loading || loadingSubdomainOrg) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex">
        <SalonProductionSidebar />
        <div className="flex-1 ml-16 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 !text-purple-600 dark:!text-purple-400" />
            <p className="!text-gray-600 dark:!text-gray-300">Loading settings...</p>
          </div>
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex">
      <SalonProductionSidebar />
      <div className="flex-1 ml-16">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/salon')}
              className="mb-4 !text-gray-900 dark:!text-gray-100"
            >
              <ChevronLeft className="w-4 h-4 mr-2 !text-gray-900 dark:!text-gray-100" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold !text-gray-900 dark:!text-gray-100 mb-2">
                  Settings & Configuration
                </h1>
                <p className="text-lg !text-gray-600 dark:!text-gray-300">
                  Manage your salon settings and preferences
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={fetchSettings}
                  disabled={loading}
                  className="!text-gray-900 dark:!text-gray-100 border-gray-300 dark:border-gray-600"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 !text-gray-900 dark:!text-gray-100 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                {hasChanges && (
                  <Button
                    onClick={saveSettings}
                    disabled={saving}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 !text-white"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin !text-white" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2 !text-white" />
                        Save Changes
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {hasChanges && (
            <Alert className="mb-6 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
              <AlertCircle className="w-4 h-4 !text-yellow-600 dark:!text-yellow-400" />
              <AlertDescription className="!text-yellow-800 dark:!text-yellow-200">
                You have unsaved changes. Click "Save Changes" to persist your configuration.
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 bg-gray-100 dark:bg-gray-800">
              <TabsTrigger value="business" className="!text-gray-700 dark:!text-gray-300 data-[state=active]:!text-gray-900 data-[state=active]:dark:!text-gray-100">Business</TabsTrigger>
              <TabsTrigger value="appointments" className="!text-gray-700 dark:!text-gray-300 data-[state=active]:!text-gray-900 data-[state=active]:dark:!text-gray-100">Appointments</TabsTrigger>
              <TabsTrigger value="payments" className="!text-gray-700 dark:!text-gray-300 data-[state=active]:!text-gray-900 data-[state=active]:dark:!text-gray-100">Payments</TabsTrigger>
              <TabsTrigger value="notifications" className="!text-gray-700 dark:!text-gray-300 data-[state=active]:!text-gray-900 data-[state=active]:dark:!text-gray-100">Notifications</TabsTrigger>
              <TabsTrigger value="staff" className="!text-gray-700 dark:!text-gray-300 data-[state=active]:!text-gray-900 data-[state=active]:dark:!text-gray-100">Staff</TabsTrigger>
              <TabsTrigger value="subdomain" className="!text-gray-700 dark:!text-gray-300 data-[state=active]:!text-gray-900 data-[state=active]:dark:!text-gray-100">Subdomain</TabsTrigger>
              <TabsTrigger value="system" className="!text-gray-700 dark:!text-gray-300 data-[state=active]:!text-gray-900 data-[state=active]:dark:!text-gray-100">System</TabsTrigger>
            </TabsList>

            {/* Business Information Tab */}
            <TabsContent value="business" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 !text-gray-900 dark:!text-gray-100">
                      <Store className="w-5 h-5 !text-purple-600 dark:!text-purple-400" />
                      Business Information
                    </CardTitle>
                    <CardDescription className="!text-gray-600 dark:!text-gray-400">
                      Basic information about your salon
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="businessName" className="!text-gray-700 dark:!text-gray-300">Business Name</Label>
                      <Input
                        id="businessName"
                        value={settings.business_info.name}
                        onChange={(e) => updateSettings('business_info', 'name', e.target.value)}
                        className="!text-gray-900 dark:!text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="businessType" className="!text-gray-700 dark:!text-gray-300">Business Type</Label>
                      <Input
                        id="businessType"
                        value={settings.business_info.type}
                        onChange={(e) => updateSettings('business_info', 'type', e.target.value)}
                        className="!text-gray-900 dark:!text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address" className="!text-gray-700 dark:!text-gray-300">Address</Label>
                      <Textarea
                        id="address"
                        value={settings.business_info.address}
                        onChange={(e) => updateSettings('business_info', 'address', e.target.value)}
                        rows={3}
                        className="!text-gray-900 dark:!text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone" className="!text-gray-700 dark:!text-gray-300">Phone</Label>
                        <Input
                          id="phone"
                          value={settings.business_info.phone}
                          onChange={(e) => updateSettings('business_info', 'phone', e.target.value)}
                          className="!text-gray-900 dark:!text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="!text-gray-700 dark:!text-gray-300">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={settings.business_info.email}
                          onChange={(e) => updateSettings('business_info', 'email', e.target.value)}
                          className="!text-gray-900 dark:!text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="website" className="!text-gray-700 dark:!text-gray-300">Website</Label>
                      <Input
                        id="website"
                        value={settings.business_info.website || ''}
                        onChange={(e) => updateSettings('business_info', 'website', e.target.value)}
                        className="!text-gray-900 dark:!text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="taxId" className="!text-gray-700 dark:!text-gray-300">Tax ID</Label>
                        <Input
                          id="taxId"
                          value={settings.business_info.tax_id || ''}
                          onChange={(e) => updateSettings('business_info', 'tax_id', e.target.value)}
                          className="!text-gray-900 dark:!text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="regNumber" className="!text-gray-700 dark:!text-gray-300">Registration Number</Label>
                        <Input
                          id="regNumber"
                          value={settings.business_info.registration_number || ''}
                          onChange={(e) => updateSettings('business_info', 'registration_number', e.target.value)}
                          className="!text-gray-900 dark:!text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 !text-gray-900 dark:!text-gray-100">
                      <Clock className="w-5 h-5 !text-purple-600 dark:!text-purple-400" />
                      Business Hours
                    </CardTitle>
                    <CardDescription className="!text-gray-600 dark:!text-gray-400">
                      Set your salon's operating hours
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(settings.business_hours).map(([day, hours]) => (
                      <div key={day} className="flex items-center gap-4">
                        <div className="w-24 text-sm font-medium capitalize !text-gray-700 dark:!text-gray-300">{day}</div>
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
                            <span className="text-sm !text-gray-500 dark:!text-gray-400">to</span>
                            <Input
                              type="time"
                              value={hours.close}
                              onChange={(e) => updateNestedSettings('business_hours', day, 'close', e.target.value)}
                              className="w-32"
                            />
                          </div>
                        ) : (
                          <div className="flex-1 text-sm !text-gray-500 dark:!text-gray-400">Closed</div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Appointments Tab */}
            <TabsContent value="appointments" className="space-y-6">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 !text-gray-900 dark:!text-gray-100">
                    <Calendar className="w-5 h-5 !text-purple-600 dark:!text-purple-400" />
                    Appointment Settings
                  </CardTitle>
                  <CardDescription className="!text-gray-600 dark:!text-gray-400">
                    Configure appointment booking and scheduling preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="defaultDuration" className="!text-gray-700 dark:!text-gray-300">Default Duration (minutes)</Label>
                      <Input
                        id="defaultDuration"
                        type="number"
                        value={settings.appointment_settings.default_duration}
                        onChange={(e) => updateSettings('appointment_settings', 'default_duration', parseInt(e.target.value))}
                        className="!text-gray-900 dark:!text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bufferTime" className="!text-gray-700 dark:!text-gray-300">Buffer Time (minutes)</Label>
                      <Input
                        id="bufferTime"
                        type="number"
                        value={settings.appointment_settings.buffer_time}
                        onChange={(e) => updateSettings('appointment_settings', 'buffer_time', parseInt(e.target.value))}
                        className="!text-gray-900 dark:!text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxAdvance" className="!text-gray-700 dark:!text-gray-300">Max Advance Booking (days)</Label>
                      <Input
                        id="maxAdvance"
                        type="number"
                        value={settings.appointment_settings.max_advance_booking}
                        onChange={(e) => updateSettings('appointment_settings', 'max_advance_booking', parseInt(e.target.value))}
                        className="!text-gray-900 dark:!text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="onlineBooking" className="!text-gray-700 dark:!text-gray-300">Allow Online Booking</Label>
                        <p className="text-sm !text-gray-600 dark:!text-gray-400">Enable clients to book appointments online</p>
                      </div>
                      <Switch
                        id="onlineBooking"
                        checked={settings.appointment_settings.allow_online_booking}
                        onCheckedChange={(checked) => updateSettings('appointment_settings', 'allow_online_booking', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="requireDeposit" className="!text-gray-700 dark:!text-gray-300">Require Deposit for Booking</Label>
                        <p className="text-sm !text-gray-600 dark:!text-gray-400">Require upfront payment to confirm bookings</p>
                      </div>
                      <Switch
                        id="requireDeposit"
                        checked={settings.appointment_settings.require_deposit}
                        onCheckedChange={(checked) => updateSettings('appointment_settings', 'require_deposit', checked)}
                      />
                    </div>

                    {settings.appointment_settings.require_deposit && (
                      <div>
                        <Label htmlFor="depositAmount" className="!text-gray-700 dark:!text-gray-300">Deposit Amount (AED)</Label>
                        <Input
                          id="depositAmount"
                          type="number"
                          value={settings.appointment_settings.deposit_amount}
                          onChange={(e) => updateSettings('appointment_settings', 'deposit_amount', parseInt(e.target.value))}
                          className="!text-gray-900 dark:!text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="cancellationPolicy" className="!text-gray-700 dark:!text-gray-300">Cancellation Policy</Label>
                    <Textarea
                      id="cancellationPolicy"
                      value={settings.appointment_settings.cancellation_policy}
                      onChange={(e) => updateSettings('appointment_settings', 'cancellation_policy', e.target.value)}
                      rows={3}
                      className="!text-gray-900 dark:!text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emailReminder" className="!text-gray-700 dark:!text-gray-300">Email Reminder (hours before)</Label>
                      <Input
                        id="emailReminder"
                        type="number"
                        value={settings.appointment_settings.reminder_timing.email}
                        onChange={(e) => updateNestedSettings('appointment_settings', 'reminder_timing', 'email', parseInt(e.target.value))}
                        className="!text-gray-900 dark:!text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <div>
                      <Label htmlFor="smsReminder" className="!text-gray-700 dark:!text-gray-300">SMS Reminder (hours before)</Label>
                      <Input
                        id="smsReminder"
                        type="number"
                        value={settings.appointment_settings.reminder_timing.sms}
                        onChange={(e) => updateNestedSettings('appointment_settings', 'reminder_timing', 'sms', parseInt(e.target.value))}
                        className="!text-gray-900 dark:!text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 !text-gray-900 dark:!text-gray-100">
                      <CreditCard className="w-5 h-5 !text-purple-600 dark:!text-purple-400" />
                      Payment Methods
                    </CardTitle>
                    <CardDescription className="!text-gray-600 dark:!text-gray-400">
                      Configure accepted payment methods
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(settings.payment_settings.accepted_methods).map(([method, enabled]) => (
                      <div key={method} className="flex items-center justify-between">
                        <Label htmlFor={method} className="capitalize !text-gray-700 dark:!text-gray-300">
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

                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 !text-gray-900 dark:!text-gray-100">
                      <DollarSign className="w-5 h-5 !text-purple-600 dark:!text-purple-400" />
                      Financial Settings
                    </CardTitle>
                    <CardDescription className="!text-gray-600 dark:!text-gray-400">
                      Tax rates, tips, and loyalty program
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="taxRate" className="!text-gray-700 dark:!text-gray-300">VAT/Tax Rate (%)</Label>
                      <Input
                        id="taxRate"
                        type="number"
                        step="0.1"
                        value={settings.payment_settings.tax_rate}
                        onChange={(e) => updateSettings('payment_settings', 'tax_rate', parseFloat(e.target.value))}
                        className="!text-gray-900 dark:!text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    
                    <div>
                      <Label className="!text-gray-700 dark:!text-gray-300">Tip Suggestions (%)</Label>
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
                      <Label htmlFor="currency" className="!text-gray-700 dark:!text-gray-300">Currency</Label>
                      <Select
                        value={settings.payment_settings.currency}
                        onValueChange={(value) => updateSettings('payment_settings', 'currency', value)}
                      >
                        <SelectTrigger className="!text-gray-900 dark:!text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                          <SelectValue className="!text-gray-900 dark:!text-gray-100" />
                        </SelectTrigger>
                        <SelectContent className="hera-select-content">
                          <SelectItem value="AED" className="hera-select-item">AED - UAE Dirham</SelectItem>
                          <SelectItem value="USD" className="hera-select-item">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR" className="hera-select-item">EUR - Euro</SelectItem>
                          <SelectItem value="GBP" className="hera-select-item">GBP - British Pound</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="loyaltyProgram" className="!text-gray-700 dark:!text-gray-300">Loyalty Program</Label>
                          <p className="text-sm !text-gray-600 dark:!text-gray-400">Enable points and rewards system</p>
                        </div>
                        <Switch
                          id="loyaltyProgram"
                          checked={settings.payment_settings.loyalty_program_active}
                          onCheckedChange={(checked) => updateSettings('payment_settings', 'loyalty_program_active', checked)}
                        />
                      </div>

                      {settings.payment_settings.loyalty_program_active && (
                        <div>
                          <Label htmlFor="pointsPerCurrency" className="!text-gray-700 dark:!text-gray-300">Points per {settings.payment_settings.currency}</Label>
                          <Input
                            id="pointsPerCurrency"
                            type="number"
                            value={settings.payment_settings.points_per_currency}
                            onChange={(e) => updateSettings('payment_settings', 'points_per_currency', parseInt(e.target.value))}
                            className="!text-gray-900 dark:!text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
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
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 !text-gray-900 dark:!text-gray-100">
                      <Mail className="w-5 h-5 !text-purple-600 dark:!text-purple-400" />
                      Email Notifications
                    </CardTitle>
                    <CardDescription className="!text-gray-600 dark:!text-gray-400">
                      Configure email notification preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(settings.notification_settings.email).map(([type, enabled]) => (
                      <div key={type} className="flex items-center justify-between">
                        <Label htmlFor={`email-${type}`} className="capitalize !text-gray-700 dark:!text-gray-300">
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

                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 !text-gray-900 dark:!text-gray-100">
                      <Smartphone className="w-5 h-5 !text-purple-600 dark:!text-purple-400" />
                      SMS Notifications
                    </CardTitle>
                    <CardDescription className="!text-gray-600 dark:!text-gray-400">
                      Configure SMS notification preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(settings.notification_settings.sms).map(([type, enabled]) => (
                      <div key={type} className="flex items-center justify-between">
                        <Label htmlFor={`sms-${type}`} className="capitalize !text-gray-700 dark:!text-gray-300">
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
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 !text-gray-900 dark:!text-gray-100">
                    <Users className="w-5 h-5 !text-purple-600 dark:!text-purple-400" />
                    Staff Management Settings
                  </CardTitle>
                  <CardDescription className="!text-gray-600 dark:!text-gray-400">
                    Configure staff commissions and management preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="commissionStructure" className="!text-gray-700 dark:!text-gray-300">Commission Structure</Label>
                      <Select
                        value={settings.staff_settings.commission_structure}
                        onValueChange={(value: 'percentage' | 'fixed') => updateSettings('staff_settings', 'commission_structure', value)}
                      >
                        <SelectTrigger className="!text-gray-900 dark:!text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                          <SelectValue className="!text-gray-900 dark:!text-gray-100" />
                        </SelectTrigger>
                        <SelectContent className="hera-select-content">
                          <SelectItem value="percentage" className="hera-select-item">Percentage</SelectItem>
                          <SelectItem value="fixed" className="hera-select-item">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="defaultCommission" className="!text-gray-700 dark:!text-gray-300">Default Commission Rate (%)</Label>
                      <Input
                        id="defaultCommission"
                        type="number"
                        value={settings.staff_settings.default_commission_rate}
                        onChange={(e) => updateSettings('staff_settings', 'default_commission_rate', parseInt(e.target.value))}
                        className="!text-gray-900 dark:!text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="overtimeRate" className="!text-gray-700 dark:!text-gray-300">Overtime Rate Multiplier</Label>
                    <Input
                      id="overtimeRate"
                      type="number"
                      step="0.1"
                      value={settings.staff_settings.overtime_rate}
                      onChange={(e) => updateSettings('staff_settings', 'overtime_rate', parseFloat(e.target.value))}
                      className="!text-gray-900 dark:!text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="staffSchedule" className="!text-gray-700 dark:!text-gray-300">Allow Staff Schedule Management</Label>
                        <p className="text-sm !text-gray-600 dark:!text-gray-400">Let staff manage their own schedules</p>
                      </div>
                      <Switch
                        id="staffSchedule"
                        checked={settings.staff_settings.allow_schedule_management}
                        onCheckedChange={(checked) => updateSettings('staff_settings', 'allow_schedule_management', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="clockIn" className="!text-gray-700 dark:!text-gray-300">Require Staff Clock-In</Label>
                        <p className="text-sm !text-gray-600 dark:!text-gray-400">Track staff working hours with clock-in/out</p>
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

            {/* Subdomain Tab */}
            <TabsContent value="subdomain" className="space-y-6">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 !text-gray-900 dark:!text-gray-100">
                    <Globe className="w-5 h-5 !text-purple-600 dark:!text-purple-400" />
                    Subdomain & Branding
                  </CardTitle>
                  <CardDescription className="!text-gray-600 dark:!text-gray-400">
                    Configure your salon's custom subdomain and professional URLs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Current Configuration */}
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <h3 className="font-medium !text-purple-900 dark:!text-purple-200 mb-2">
                      Current Configuration
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="!text-purple-700 dark:!text-purple-300">Current URL: </span>
                        <code className="px-2 py-1 bg-purple-100 dark:bg-purple-800 rounded text-xs !text-purple-900 dark:!text-purple-200">
                          localhost:3000/salon
                        </code>
                      </div>
                      <div>
                        <span className="!text-purple-700 dark:!text-purple-300">Organization: </span>
                        <span className="font-medium !text-purple-900 dark:!text-purple-200">
                          {organization?.organization_name || 'Hair Talkz Salon'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Professional Benefits */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="font-medium !text-blue-900 dark:!text-blue-200 mb-2">
                      Professional Salon Branding
                    </h3>
                    <p className="!text-blue-700 dark:!text-blue-300 text-sm mb-3">
                      Configure a custom subdomain to get professional URLs like 
                      <code className="mx-1 px-1 bg-blue-100 dark:bg-blue-800 rounded text-xs !text-blue-900 dark:!text-blue-200">
                        yoursalon.heraerp.com
                      </code>
                      for branded access to your salon management system.
                    </p>
                    <ul className="!text-blue-700 dark:!text-blue-300 text-sm space-y-1">
                      <li>• Professional URLs for client booking</li>
                      <li>• Branded staff access portals</li>
                      <li>• Custom domain support (coming soon)</li>
                      <li>• SSL security included</li>
                    </ul>
                  </div>

                  {/* Action Button */}
                  <div className="flex justify-center">
                    <Button 
                      onClick={() => router.push('/salon/settings/subdomain')}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 !text-white"
                    >
                      <Globe className="w-4 h-4 mr-2 !text-white" />
                      Configure Subdomain Settings
                    </Button>
                  </div>

                  {/* Quick Reference */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div>
                      <h4 className="font-medium !text-gray-900 dark:!text-white mb-2">Good Examples</h4>
                      <ul className="text-sm !text-gray-600 dark:!text-gray-400 space-y-1">
                        <li><code className="bg-gray-100 dark:bg-gray-700 px-1 rounded !text-gray-900 dark:!text-gray-200">hair-talkz-dubai</code></li>
                        <li><code className="bg-gray-100 dark:bg-gray-700 px-1 rounded !text-gray-900 dark:!text-gray-200">salon-elegance</code></li>
                        <li><code className="bg-gray-100 dark:bg-gray-700 px-1 rounded !text-gray-900 dark:!text-gray-200">beauty-lounge-marina</code></li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium !text-gray-900 dark:!text-white mb-2">Best Practices</h4>
                      <ul className="text-sm !text-gray-600 dark:!text-gray-400 space-y-1">
                        <li>• Use lowercase letters and hyphens</li>
                        <li>• Keep it short and memorable</li>
                        <li>• Include your salon name or location</li>
                        <li>• Avoid special characters</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Tab */}
            <TabsContent value="system" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 !text-gray-900 dark:!text-gray-100">
                      <Globe className="w-5 h-5 !text-purple-600 dark:!text-purple-400" />
                      Localization
                    </CardTitle>
                    <CardDescription className="!text-gray-600 dark:!text-gray-400">
                      Regional and language settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="timezone" className="!text-gray-700 dark:!text-gray-300">Timezone</Label>
                      <Select
                        value={settings.system_settings.timezone}
                        onValueChange={(value) => updateSettings('system_settings', 'timezone', value)}
                      >
                        <SelectTrigger className="!text-gray-900 dark:!text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                          <SelectValue className="!text-gray-900 dark:!text-gray-100" />
                        </SelectTrigger>
                        <SelectContent className="hera-select-content">
                          <SelectItem value="Asia/Dubai" className="hera-select-item">Dubai (GMT+4)</SelectItem>
                          <SelectItem value="Asia/Abu_Dhabi" className="hera-select-item">Abu Dhabi (GMT+4)</SelectItem>
                          <SelectItem value="Asia/Riyadh" className="hera-select-item">Riyadh (GMT+3)</SelectItem>
                          <SelectItem value="Asia/Kuwait" className="hera-select-item">Kuwait (GMT+3)</SelectItem>
                          <SelectItem value="Asia/Doha" className="hera-select-item">Doha (GMT+3)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="dateFormat" className="!text-gray-700 dark:!text-gray-300">Date Format</Label>
                      <Select
                        value={settings.system_settings.date_format}
                        onValueChange={(value) => updateSettings('system_settings', 'date_format', value)}
                      >
                        <SelectTrigger className="!text-gray-900 dark:!text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                          <SelectValue className="!text-gray-900 dark:!text-gray-100" />
                        </SelectTrigger>
                        <SelectContent className="hera-select-content">
                          <SelectItem value="DD/MM/YYYY" className="hera-select-item">DD/MM/YYYY</SelectItem>
                          <SelectItem value="MM/DD/YYYY" className="hera-select-item">MM/DD/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD" className="hera-select-item">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="timeFormat" className="!text-gray-700 dark:!text-gray-300">Time Format</Label>
                      <Select
                        value={settings.system_settings.time_format}
                        onValueChange={(value) => updateSettings('system_settings', 'time_format', value)}
                      >
                        <SelectTrigger className="!text-gray-900 dark:!text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                          <SelectValue className="!text-gray-900 dark:!text-gray-100" />
                        </SelectTrigger>
                        <SelectContent className="hera-select-content">
                          <SelectItem value="12h" className="hera-select-item">12 Hour (AM/PM)</SelectItem>
                          <SelectItem value="24h" className="hera-select-item">24 Hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="language" className="!text-gray-700 dark:!text-gray-300">Language</Label>
                      <Select
                        value={settings.system_settings.language}
                        onValueChange={(value) => updateSettings('system_settings', 'language', value)}
                      >
                        <SelectTrigger className="!text-gray-900 dark:!text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                          <SelectValue className="!text-gray-900 dark:!text-gray-100" />
                        </SelectTrigger>
                        <SelectContent className="hera-select-content">
                          <SelectItem value="en" className="hera-select-item">English</SelectItem>
                          <SelectItem value="ar" className="hera-select-item">Arabic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="theme" className="!text-gray-700 dark:!text-gray-300">Theme</Label>
                      <Select
                        value={settings.system_settings.theme}
                        onValueChange={(value: 'light' | 'dark') => updateSettings('system_settings', 'theme', value)}
                      >
                        <SelectTrigger className="!text-gray-900 dark:!text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                          <SelectValue className="!text-gray-900 dark:!text-gray-100" />
                        </SelectTrigger>
                        <SelectContent className="hera-select-content">
                          <SelectItem value="light" className="hera-select-item">Light</SelectItem>
                          <SelectItem value="dark" className="hera-select-item">Dark</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 !text-gray-900 dark:!text-gray-100">
                      <Shield className="w-5 h-5 !text-purple-600 dark:!text-purple-400" />
                      Security & Data
                    </CardTitle>
                    <CardDescription className="!text-gray-600 dark:!text-gray-400">
                      Security and data protection settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="sessionTimeout" className="!text-gray-700 dark:!text-gray-300">Session Timeout (minutes)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        value={settings.system_settings.session_timeout}
                        onChange={(e) => updateSettings('system_settings', 'session_timeout', parseInt(e.target.value))}
                        className="!text-gray-900 dark:!text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="passwordChange" className="!text-gray-700 dark:!text-gray-300">Require Periodic Password Change</Label>
                          <p className="text-sm !text-gray-600 dark:!text-gray-400">Force password updates every 90 days</p>
                        </div>
                        <Switch
                          id="passwordChange"
                          checked={settings.system_settings.require_password_change}
                          onCheckedChange={(checked) => updateSettings('system_settings', 'require_password_change', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="twoFactor" className="!text-gray-700 dark:!text-gray-300">Two-Factor Authentication</Label>
                          <p className="text-sm !text-gray-600 dark:!text-gray-400">Additional security layer for login</p>
                        </div>
                        <Switch
                          id="twoFactor"
                          checked={settings.system_settings.two_factor_auth}
                          onCheckedChange={(checked) => updateSettings('system_settings', 'two_factor_auth', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="dataBackup" className="!text-gray-700 dark:!text-gray-300">Automatic Data Backup</Label>
                          <p className="text-sm !text-gray-600 dark:!text-gray-400">Daily backup of all salon data</p>
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