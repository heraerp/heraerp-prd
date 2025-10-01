// ================================================================================
// NOTIFICATIONS SETTINGS PAGE - SETTINGS
// Smart Code: HERA.UI.SETTINGS.NOTIFICATIONS.V1
// Production-ready notifications configuration using Sacred Six storage
// ================================================================================

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
  Volume2,
  VolumeX
} from 'lucide-react'
import { useOrganization } from '@/components/organization/OrganizationProvider'
import { useOrgSettings } from '@/lib/api/orgSettings'
import { NotificationForm } from '@/components/settings/NotificationForm'
import { NotificationPolicy } from '@/lib/schemas/settings'
import { useToast } from '@/components/ui/use-toast'

export default function NotificationsSettingsPage() {
  const { currentOrganization } = useOrganization()
  const { toast } = useToast()

  const {
    notificationPolicy,
    isNotificationPolicyLoading,
    notificationPolicyError,
    saveNotificationPolicy
  } = useOrgSettings(currentOrganization?.id || '')

  const handleSaveNotificationPolicy = async (policy: NotificationPolicy) => {
    try {
      await saveNotificationPolicy.mutateAsync(policy)
      toast({
        title: 'Notifications Updated',
        description:
          'Your notification preferences have been saved successfully. Changes will apply to all future notifications.',
        variant: 'default'
      })
    } catch (error) {
      toast({
        title: 'Save Failed',
        description:
          error instanceof Error ? error.message : 'Failed to save notification settings',
        variant: 'destructive'
      })
    }
  }

  // Calculate notification stats
  const notificationStats = React.useMemo(() => {
    if (!notificationPolicy) return null

    const enabledChannels = []
    if (notificationPolicy.email_enabled) enabledChannels.push('Email')
    if (notificationPolicy.sms_enabled) enabledChannels.push('SMS')
    if (notificationPolicy.whatsapp_enabled) enabledChannels.push('WhatsApp')
    if (notificationPolicy.push_enabled) enabledChannels.push('Push')

    const enabledEvents = Object.entries(notificationPolicy.events || {})
      .filter(([_, enabled]) => enabled)
      .map(([event, _]) => event)

    return {
      enabledChannels,
      enabledEvents,
      totalChannels: 4,
      totalEvents: Object.keys(notificationPolicy.events || {}).length
    }
  }, [notificationPolicy])

  if (!currentOrganization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Please select an organization to configure notification settings.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Bell className="h-7 w-7 text-blue-600" />
            Notification Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure how and when you receive notifications for {currentOrganization.name}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-blue-700 border-blue-300">
              {currentOrganization.name}
            </Badge>
            {notificationPolicy && (
              <Badge variant="outline" className="text-green-700 border-green-300">
                Policy Active
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Notification Stats Summary */}
      {notificationStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Active Channels
                  </div>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    {notificationStats.enabledChannels.length}
                    <span className="text-base font-normal text-gray-500">
                      / {notificationStats.totalChannels}
                    </span>
                  </div>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Event Types
                  </div>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    {notificationStats.enabledEvents.length}
                    <span className="text-base font-normal text-gray-500">
                      / {notificationStats.totalEvents}
                    </span>
                  </div>
                </div>
                <Bell className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</div>
                  <div className="text-2xl font-bold">
                    {notificationPolicy?.email_enabled ? 'On' : 'Off'}
                  </div>
                </div>
                {notificationPolicy?.email_enabled ? (
                  <Mail className="h-8 w-8 text-green-500" />
                ) : (
                  <VolumeX className="h-8 w-8 text-gray-400" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    WhatsApp
                  </div>
                  <div className="text-2xl font-bold">
                    {notificationPolicy?.whatsapp_enabled ? 'On' : 'Off'}
                  </div>
                </div>
                {notificationPolicy?.whatsapp_enabled ? (
                  <MessageSquare className="h-8 w-8 text-green-500" />
                ) : (
                  <VolumeX className="h-8 w-8 text-gray-400" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enabled Channels Overview */}
      {notificationStats && notificationStats.enabledChannels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Active Notification Channels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {notificationStats.enabledChannels.map(channel => (
                <Badge
                  key={channel}
                  variant="outline"
                  className="text-green-700 border-green-300 bg-green-50 dark:bg-green-950/30"
                >
                  {channel === 'Email' && <Mail className="h-3 w-3 mr-1" />}
                  {channel === 'SMS' && <Smartphone className="h-3 w-3 mr-1" />}
                  {channel === 'WhatsApp' && <MessageSquare className="h-3 w-3 mr-1" />}
                  {channel === 'Push' && <Bell className="h-3 w-3 mr-1" />}
                  {channel}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isNotificationPolicyLoading && (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-3" />
              <span className="text-gray-600 dark:text-gray-400">
                Loading notification settings...
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {notificationPolicyError && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            Failed to load notification settings: {notificationPolicyError.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Notification Policy Form */}
      {!isNotificationPolicyLoading && !notificationPolicyError && (
        <NotificationForm
          policy={notificationPolicy}
          onSubmit={handleSaveNotificationPolicy}
          isSubmitting={saveNotificationPolicy.isPending}
        />
      )}

      {/* Settings Impact Notice */}
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-1">
            <div className="font-medium text-blue-800 dark:text-blue-200">
              Notification Delivery
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              • Changes apply immediately to all new events • Existing scheduled notifications are
              not affected • Quiet hours will suppress all non-urgent notifications • Emergency
              alerts will always be delivered regardless of settings • All notification preferences
              are logged for audit purposes
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
