// ================================================================================
// WHATSAPP CONFIG PAGE - HERA MSP INTEGRATION
// Smart Code: HERA.UI.WHATSAPP.CONFIG.v1
// Production-ready WhatsApp configuration for HERA MSP customers
// ================================================================================

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  MessageCircle,
  Settings,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Zap,
  Shield,
  Globe,
  Clock
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useOrganization } from '@/components/organization/OrganizationProvider'
import { useWhatsappApi } from '@/lib/api/whatsapp'
import { WaConfig, HERA_MSP_CONFIG } from '@/lib/schemas/whatsapp'
import { SendTestMessageDialog } from '@/components/whatsapp/SendTestMessageDialog'

export default function WhatsAppConfigPage() {
  const { currentOrganization } = useOrganization()
  const [showToken, setShowToken] = React.useState(false)
  const [testDialogOpen, setTestDialogOpen] = React.useState(false)
  const [connectionStatus, setConnectionStatus] = React.useState<
    'unknown' | 'testing' | 'connected' | 'failed'
  >('unknown')

  const { config, isConfigLoading, saveConfig, testConnection } = useWhatsappApi(
    currentOrganization?.id || ''
  )

  const form = useForm<WaConfig>({
    resolver: zodResolver(WaConfig),
    defaultValues: config || {
      hera_api_endpoint: HERA_MSP_CONFIG.API_BASE_URL,
      organization_token: '',
      sender_name: currentOrganization?.name || '',
      enabled: false,
      daily_limit: 1000,
      rate_limit_per_minute: 20,
      sandbox: true,
      features: {
        templates: true,
        media: true,
        interactive: false,
        webhooks: true
      }
    }
  })

  React.useEffect(() => {
    if (config) {
      form.reset(config)
      setConnectionStatus(config.enabled ? 'connected' : 'unknown')
    }
  }, [config, form])

  const onSubmit = async (data: WaConfig) => {
    try {
      await saveConfig.mutateAsync(data)

      // Test connection if enabled
      if (data.enabled && data.organization_token) {
        setConnectionStatus('testing')
        try {
          await testConnection.mutateAsync()
          setConnectionStatus('connected')
        } catch (error) {
          setConnectionStatus('failed')
        }
      }
    } catch (error) {
      console.error('Failed to save WhatsApp configuration:', error)
    }
  }

  const handleTestConnection = async () => {
    setConnectionStatus('testing')
    try {
      await testConnection.mutateAsync()
      setConnectionStatus('connected')
    } catch (error) {
      setConnectionStatus('failed')
    }
  }

  if (!currentOrganization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Please select an organization to configure WhatsApp settings.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'testing':
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />
      default:
        return <Globe className="h-4 w-4 text-gray-400" />
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected to HERA MSP'
      case 'failed':
        return 'Connection failed'
      case 'testing':
        return 'Testing connection...'
      default:
        return 'Not configured'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <MessageCircle className="h-7 w-7 text-green-600" />
            WhatsApp Configuration
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure WhatsApp messaging via HERA MSP for {currentOrganization.name}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-violet-700 border-violet-300">
              {currentOrganization.name}
            </Badge>
            <Badge
              variant="outline"
              className={
                connectionStatus === 'connected'
                  ? 'text-green-700 border-green-300 bg-green-50'
                  : connectionStatus === 'failed'
                    ? 'text-red-700 border-red-300 bg-red-50'
                    : 'text-gray-700 border-gray-300'
              }
            >
              {getConnectionStatusIcon()}
              <span className="ml-1">{getConnectionStatusText()}</span>
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={!config?.enabled || !config?.organization_token || testConnection.isPending}
          >
            <Zap className="h-4 w-4 mr-2" />
            Test Connection
          </Button>

          <Button
            onClick={() => setTestDialogOpen(true)}
            disabled={!config?.enabled || connectionStatus !== 'connected'}
          >
            Send Test Message
          </Button>
        </div>
      </div>

      {/* HERA MSP Information */}
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>HERA Managed Service Provider (MSP)</strong>
          <br />
          Your WhatsApp messaging is powered by HERA's managed WhatsApp API. This provides
          enterprise-grade reliability, compliance, and scaling without the complexity of managing
          your own WhatsApp Business API.
        </AlertDescription>
      </Alert>

      {/* Configuration Form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="connection" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="connection">Connection</TabsTrigger>
            <TabsTrigger value="limits">Limits & Quotas</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          </TabsList>

          <TabsContent value="connection" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  HERA MSP Connection Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* API Endpoint */}
                <div className="space-y-2">
                  <Label htmlFor="hera_api_endpoint">HERA MSP API Endpoint</Label>
                  <Input
                    id="hera_api_endpoint"
                    {...form.register('hera_api_endpoint')}
                    placeholder="https://wa-api.heraerp.com"
                    readOnly
                    className="bg-gray-50 dark:bg-gray-800"
                  />
                  <p className="text-sm text-gray-500">
                    Managed by HERA - no configuration required
                  </p>
                </div>

                {/* Organization Token */}
                <div className="space-y-2">
                  <Label htmlFor="organization_token">Organization Token *</Label>
                  <div className="relative">
                    <Input
                      id="organization_token"
                      type={showToken ? 'text' : 'password'}
                      {...form.register('organization_token')}
                      placeholder="Your HERA MSP organization token"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Provided by HERA support team during onboarding
                  </p>
                  {form.formState.errors.organization_token && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.organization_token.message}
                    </p>
                  )}
                </div>

                {/* Sender Name */}
                <div className="space-y-2">
                  <Label htmlFor="sender_name">Sender Name *</Label>
                  <Input
                    id="sender_name"
                    {...form.register('sender_name')}
                    placeholder="Your business name"
                  />
                  <p className="text-sm text-gray-500">
                    This will appear as the sender in WhatsApp messages
                  </p>
                  {form.formState.errors.sender_name && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.sender_name.message}
                    </p>
                  )}
                </div>

                {/* Environment Toggle */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label>Environment</Label>
                    <p className="text-sm text-gray-500">
                      {form.watch('sandbox')
                        ? 'Sandbox mode - for testing and development'
                        : 'Production mode - live messages to customers'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="sandbox" className="text-sm">
                      {form.watch('sandbox') ? 'Sandbox' : 'Production'}
                    </Label>
                    <Switch
                      id="sandbox"
                      checked={form.watch('sandbox')}
                      onCheckedChange={checked => form.setValue('sandbox', checked)}
                    />
                  </div>
                </div>

                {/* Enable Toggle */}
                <div className="flex items-center justify-between p-4 border rounded-lg border-green-200 bg-green-50 dark:bg-green-950/30">
                  <div className="space-y-1">
                    <Label>WhatsApp Integration</Label>
                    <p className="text-sm text-gray-500">
                      Enable WhatsApp messaging for this organization
                    </p>
                  </div>
                  <Switch
                    id="enabled"
                    checked={form.watch('enabled')}
                    onCheckedChange={checked => form.setValue('enabled', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="limits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Usage Limits & Quotas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="daily_limit">Daily Message Limit</Label>
                  <Input
                    id="daily_limit"
                    type="number"
                    {...form.register('daily_limit', { valueAsNumber: true })}
                    min={1}
                    max={10000}
                  />
                  <p className="text-sm text-gray-500">Maximum messages per day (1-10,000)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rate_limit_per_minute">Rate Limit (per minute)</Label>
                  <Input
                    id="rate_limit_per_minute"
                    type="number"
                    {...form.register('rate_limit_per_minute', { valueAsNumber: true })}
                    min={1}
                    max={100}
                  />
                  <p className="text-sm text-gray-500">Maximum messages per minute (1-100)</p>
                </div>

                <Alert>
                  <AlertDescription>
                    These limits help prevent spam and ensure reliable delivery. Contact HERA
                    support to increase limits if needed.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Available Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Templates */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label>Message Templates</Label>
                    <p className="text-sm text-gray-500">
                      Create and manage approved message templates
                    </p>
                  </div>
                  <Switch
                    checked={form.watch('features.templates')}
                    onCheckedChange={checked => form.setValue('features.templates', checked)}
                  />
                </div>

                {/* Media */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label>Media Messages</Label>
                    <p className="text-sm text-gray-500">Send images, documents, and other media</p>
                  </div>
                  <Switch
                    checked={form.watch('features.media')}
                    onCheckedChange={checked => form.setValue('features.media', checked)}
                  />
                </div>

                {/* Interactive */}
                <div className="flex items-center justify-between p-4 border rounded-lg opacity-50">
                  <div className="space-y-1">
                    <Label>Interactive Messages</Label>
                    <p className="text-sm text-gray-500">
                      Buttons, lists, and quick replies (Coming Soon)
                    </p>
                  </div>
                  <Switch
                    checked={form.watch('features.interactive')}
                    onCheckedChange={checked => form.setValue('features.interactive', checked)}
                    disabled
                  />
                </div>

                {/* Webhooks */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label>Delivery Webhooks</Label>
                    <p className="text-sm text-gray-500">
                      Receive delivery status and read receipts
                    </p>
                  </div>
                  <Switch
                    checked={form.watch('features.webhooks')}
                    onCheckedChange={checked => form.setValue('features.webhooks', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Webhook Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook_secret">Webhook Secret</Label>
                  <div className="relative">
                    <Input
                      id="webhook_secret"
                      type={showToken ? 'text' : 'password'}
                      {...form.register('webhook_secret')}
                      placeholder="Optional webhook verification secret"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Used to verify webhook authenticity (optional)
                  </p>
                </div>

                <Alert>
                  <AlertDescription>
                    <strong>Webhook URL:</strong> https://your-domain.com/api/webhooks/whatsapp
                    <br />
                    This will be configured automatically by HERA MSP when you enable webhooks.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={saveConfig.isPending}
          >
            Reset
          </Button>
          <Button type="submit" disabled={saveConfig.isPending || isConfigLoading}>
            {saveConfig.isPending ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>

        {/* Form Errors */}
        {saveConfig.error && (
          <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              Failed to save configuration: {saveConfig.error.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {saveConfig.isSuccess && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              WhatsApp configuration saved successfully!
            </AlertDescription>
          </Alert>
        )}
      </form>

      {/* Test Message Dialog */}
      <SendTestMessageDialog
        open={testDialogOpen}
        onOpenChange={setTestDialogOpen}
        organizationId={currentOrganization.id}
      />
    </div>
  )
}
