// ================================================================================
// NOTIFICATION FORM - SETTINGS COMPONENT
// Smart Code: HERA.UI.SETTINGS.NOTIFICATION_FORM.v1
// Production-ready notification policy configuration form with validation
// ================================================================================

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Bell,
  Save,
  Mail,
  MessageSquare,
  Smartphone,
  Volume2,
  Clock,
  AlertCircle,
  Info,
  Calendar,
  Users,
  Receipt,
  Shield
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { NotificationPolicy } from '@/lib/schemas/settings'

interface NotificationFormProps {
  policy?: NotificationPolicy | null
  onSubmit: (policy: NotificationPolicy) => Promise<void>
  isSubmitting: boolean
}

const NOTIFICATION_EVENTS = [
  {
    key: 'appointment_booked',
    label: 'Appointment Booked',
    description: 'New appointment scheduled',
    icon: Calendar,
    category: 'Appointments'
  },
  {
    key: 'appointment_cancelled',
    label: 'Appointment Cancelled',
    description: 'Appointment was cancelled',
    icon: Calendar,
    category: 'Appointments'
  },
  {
    key: 'appointment_reminder',
    label: 'Appointment Reminder',
    description: 'Reminder before appointment',
    icon: Clock,
    category: 'Appointments'
  },
  {
    key: 'payment_received',
    label: 'Payment Received',
    description: 'Payment confirmation',
    icon: Receipt,
    category: 'Payments'
  },
  {
    key: 'payment_failed',
    label: 'Payment Failed',
    description: 'Failed payment notification',
    icon: AlertCircle,
    category: 'Payments'
  },
  {
    key: 'staff_shift_reminder',
    label: 'Staff Shift Reminder',
    description: 'Upcoming shift notification',
    icon: Users,
    category: 'Staff'
  },
  {
    key: 'system_alert',
    label: 'System Alert',
    description: 'Important system notifications',
    icon: Shield,
    category: 'System'
  },
  {
    key: 'low_inventory',
    label: 'Low Inventory',
    description: 'Stock level alerts',
    icon: AlertCircle,
    category: 'System'
  }
]

const QUIET_HOURS_PRESETS = [
  { label: 'No Quiet Hours', start: '', end: '' },
  { label: 'Night Hours (22:00 - 08:00)', start: '22:00', end: '08:00' },
  { label: 'Sleep Hours (23:00 - 07:00)', start: '23:00', end: '07:00' },
  { label: 'Business Hours Only (09:00 - 18:00)', start: '18:00', end: '09:00' },
  { label: 'Custom', start: 'custom', end: 'custom' }
]

export function NotificationForm({ policy, onSubmit, isSubmitting }: NotificationFormProps) {
  const form = useForm<NotificationPolicy>({
    resolver: zodResolver(NotificationPolicy),
    defaultValues: policy || {
      email_enabled: true,
      sms_enabled: false,
      whatsapp_enabled: true,
      push_enabled: true,
      quiet_hours: {
        enabled: false,
        start_time: '22:00',
        end_time: '08:00',
        timezone: 'Asia/Dubai'
      },
      events: {
        appointment_booked: true,
        appointment_cancelled: true,
        appointment_reminder: true,
        payment_received: true,
        payment_failed: true,
        staff_shift_reminder: false,
        system_alert: true,
        low_inventory: true
      }
    }
  })

  // Reset form when policy changes
  React.useEffect(() => {
    if (policy) {
      form.reset(policy)
    }
  }, [policy, form])

  const handleSubmit = async (data: NotificationPolicy) => {
    try {
      await onSubmit({
        ...data,
        updated_at: new Date().toISOString(),
        updated_by: 'current_user' // TODO: Get from auth context
      })
    } catch (error) {
      // Error handled by parent component
    }
  }

  const watchedValues = {
    emailEnabled: form.watch('email_enabled'),
    smsEnabled: form.watch('sms_enabled'),
    whatsappEnabled: form.watch('whatsapp_enabled'),
    pushEnabled: form.watch('push_enabled'),
    quietHours: form.watch('quiet_hours'),
    events: form.watch('events')
  }

  const handleQuietHoursPreset = (preset: (typeof QUIET_HOURS_PRESETS)[0]) => {
    if (preset.start === '' && preset.end === '') {
      form.setValue('quiet_hours.enabled', false)
    } else if (preset.start === 'custom') {
      // Keep current values for custom
    } else {
      form.setValue('quiet_hours', {
        enabled: true,
        start_time: preset.start,
        end_time: preset.end,
        timezone: watchedValues.quietHours.timezone || 'Asia/Dubai'
      })
    }
  }

  const getEnabledChannelCount = () => {
    let count = 0
    if (watchedValues.emailEnabled) count++
    if (watchedValues.smsEnabled) count++
    if (watchedValues.whatsappEnabled) count++
    if (watchedValues.pushEnabled) count++
    return count
  }

  const getEnabledEventCount = () => {
    return Object.values(watchedValues.events || {}).filter(enabled => enabled).length
  }

  const eventsByCategory = React.useMemo(() => {
    const grouped: Record<string, typeof NOTIFICATION_EVENTS> = {}
    NOTIFICATION_EVENTS.forEach(event => {
      if (!grouped[event.category]) {
        grouped[event.category] = []
      }
      grouped[event.category].push(event)
    })
    return grouped
  }, [])

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Notification Channels */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Notification Channels
            <Badge variant="outline" className="ml-2">
              {getEnabledChannelCount()} enabled
            </Badge>
          </CardTitle>
          <p className="text-sm dark:ink-muted">Choose how you want to receive notifications</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email Notifications */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    watchedValues.emailEnabled
                      ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-600'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }`}
                >
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <Label className="font-medium">Email</Label>
                  <p className="text-sm ink-muted">Send notifications via email</p>
                </div>
              </div>
              <Switch
                checked={watchedValues.emailEnabled}
                onCheckedChange={checked => form.setValue('email_enabled', checked)}
              />
            </div>

            {/* SMS Notifications */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    watchedValues.smsEnabled
                      ? 'bg-green-100 dark:bg-green-950/30 text-green-600'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                </div>
                <div>
                  <Label className="font-medium">SMS</Label>
                  <p className="text-sm ink-muted">Send text messages</p>
                </div>
              </div>
              <Switch
                checked={watchedValues.smsEnabled}
                onCheckedChange={checked => form.setValue('sms_enabled', checked)}
              />
            </div>

            {/* WhatsApp Notifications */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    watchedValues.whatsappEnabled
                      ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <Label className="font-medium">WhatsApp</Label>
                  <p className="text-sm ink-muted">Send WhatsApp messages</p>
                </div>
              </div>
              <Switch
                checked={watchedValues.whatsappEnabled}
                onCheckedChange={checked => form.setValue('whatsapp_enabled', checked)}
              />
            </div>

            {/* Push Notifications */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    watchedValues.pushEnabled
                      ? 'bg-purple-100 dark:bg-purple-950/30 text-purple-600'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }`}
                >
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <Label className="font-medium">Push Notifications</Label>
                  <p className="text-sm ink-muted">Browser/app notifications</p>
                </div>
              </div>
              <Switch
                checked={watchedValues.pushEnabled}
                onCheckedChange={checked => form.setValue('push_enabled', checked)}
              />
            </div>
          </div>

          {getEnabledChannelCount() === 0 && (
            <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/30">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                At least one notification channel should be enabled to receive notifications.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Event Types */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Event Types
            <Badge variant="outline" className="ml-2">
              {getEnabledEventCount()} enabled
            </Badge>
          </CardTitle>
          <p className="text-sm dark:ink-muted">Choose which events trigger notifications</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(eventsByCategory).map(([category, events]) => (
            <div key={category}>
              <div className="font-medium ink dark:text-gray-100 mb-3">{category}</div>
              <div className="grid gap-3">
                {events.map(event => (
                  <div
                    key={event.key}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <event.icon className="h-4 w-4 ink-muted" />
                      <div>
                        <Label className="font-medium text-sm">{event.label}</Label>
                        <p className="text-xs ink-muted">{event.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={
                        watchedValues.events?.[event.key as keyof typeof watchedValues.events] ||
                        false
                      }
                      onCheckedChange={checked =>
                        form.setValue(`events.${event.key}` as any, checked)
                      }
                    />
                  </div>
                ))}
              </div>
              {category !== 'System' && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Quiet Hours
          </CardTitle>
          <p className="text-sm dark:ink-muted">
            Suppress non-urgent notifications during specified hours
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label>Enable Quiet Hours</Label>
              <p className="text-sm ink-muted">
                Automatically suppress notifications during quiet hours
              </p>
            </div>
            <Switch
              checked={watchedValues.quietHours.enabled}
              onCheckedChange={checked => form.setValue('quiet_hours.enabled', checked)}
            />
          </div>

          {watchedValues.quietHours.enabled && (
            <div className="space-y-4">
              {/* Quick Presets */}
              <div className="space-y-2">
                <Label>Quick Presets</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {QUIET_HOURS_PRESETS.map((preset, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuietHoursPreset(preset)}
                      className="justify-start text-xs"
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Time Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={watchedValues.quietHours.start_time || ''}
                    onChange={e => form.setValue('quiet_hours.start_time', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={watchedValues.quietHours.end_time || ''}
                    onChange={e => form.setValue('quiet_hours.end_time', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={watchedValues.quietHours.timezone || 'Asia/Dubai'}
                    onValueChange={value => form.setValue('quiet_hours.timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Dubai">Asia/Dubai (GMT+4)</SelectItem>
                      <SelectItem value="Asia/Riyadh">Asia/Riyadh (GMT+3)</SelectItem>
                      <SelectItem value="Asia/Kuwait">Asia/Kuwait (GMT+3)</SelectItem>
                      <SelectItem value="Asia/Qatar">Asia/Qatar (GMT+3)</SelectItem>
                      <SelectItem value="Asia/Bahrain">Asia/Bahrain (GMT+3)</SelectItem>
                      <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Smart Code Display (Audit Slot) */}
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span className="text-blue-800 dark:text-blue-200">
              Changes will be logged with Smart Code:
            </span>
            <Badge variant="outline" className="font-mono text-xs">
              HERA.ORG.SETTINGS.NOTIFICATION_POLICY.UPDATE.V1
            </Badge>
          </div>
        </AlertDescription>
      </Alert>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting || getEnabledChannelCount() === 0}
          className="min-w-32"
        >
          {isSubmitting ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
