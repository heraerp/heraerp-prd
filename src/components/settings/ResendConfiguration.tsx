import { useState, useEffect } from 'react'
import { useOrgStore } from '@/state/org'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Mail, Key, Globe, Save, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ResendConfig {
  apiKey?: string
  fromEmail?: string
  webhookSecret?: string
  isConfigured: boolean
}

export default function ResendConfiguration() {
  const { currentOrgId } = useOrgStore()
  const [config, setConfig] = useState<ResendConfig>({
    isConfigured: false
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [showWebhookSecret, setShowWebhookSecret] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [isTesting, setIsTesting] = useState(false)

  const orgId = currentOrgId || '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

  useEffect(() => {
    loadConfiguration()
  }, [orgId])

  const loadConfiguration = async () => {
    setIsLoading(true)
    try {
      // Load existing configuration
      const { data } = await supabase
        .from('core_dynamic_data')
        .select('field_name, field_value_text')
        .eq('entity_id', orgId)
        .in('field_name', ['resend_api_key', 'resend_from_email', 'resend_webhook_secret'])

      const configData: ResendConfig = {
        isConfigured: false
      }

      data?.forEach(item => {
        switch (item.field_name) {
          case 'resend_api_key':
            configData.apiKey = item.field_value_text
            configData.isConfigured = true
            break
          case 'resend_from_email':
            configData.fromEmail = item.field_value_text
            break
          case 'resend_webhook_secret':
            configData.webhookSecret = item.field_value_text
            break
        }
      })

      setConfig(configData)
    } catch (error) {
      console.error('Error loading configuration:', error)
      toast.error('Failed to load email configuration')
    } finally {
      setIsLoading(false)
    }
  }

  const saveConfiguration = async () => {
    setIsSaving(true)
    try {
      const updates = []

      // Save API key if provided
      if (config.apiKey) {
        updates.push({
          organization_id: orgId,
          entity_id: orgId,
          field_name: 'resend_api_key',
          field_value_text: config.apiKey,
          smart_code: 'HERA.PUBLICSECTOR.CONFIG.EMAIL.API_KEY.V1'
        })
      }

      // Save from email
      if (config.fromEmail) {
        updates.push({
          organization_id: orgId,
          entity_id: orgId,
          field_name: 'resend_from_email',
          field_value_text: config.fromEmail,
          smart_code: 'HERA.PUBLICSECTOR.CONFIG.EMAIL.FROM.V1'
        })
      }

      // Save webhook secret
      if (config.webhookSecret) {
        updates.push({
          organization_id: orgId,
          entity_id: orgId,
          field_name: 'resend_webhook_secret',
          field_value_text: config.webhookSecret,
          smart_code: 'HERA.PUBLICSECTOR.CONFIG.EMAIL.WEBHOOK.V1'
        })
      }

      // Upsert all configuration fields
      for (const update of updates) {
        await supabase.from('core_dynamic_data').upsert(update, {
          onConflict: 'entity_id,field_name,organization_id'
        })
      }

      toast.success('Email configuration saved successfully')
      setConfig({ ...config, isConfigured: true })
    } catch (error) {
      console.error('Error saving configuration:', error)
      toast.error('Failed to save email configuration')
    } finally {
      setIsSaving(false)
    }
  }

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter a test email address')
      return
    }

    setIsTesting(true)
    try {
      const response = await fetch('/api/civicflow/communications/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': orgId
        },
        body: JSON.stringify({
          action: 'send',
          recipients: testEmail,
          subject: 'Test Email from CivicFlow',
          content: `This is a test email from your CivicFlow organization.

Your Resend integration is working correctly!

Organization ID: ${orgId}
Sent at: ${new Date().toLocaleString()}`,
          contentType: 'text'
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send test email')
      }

      toast.success('Test email sent successfully')
    } catch (error) {
      console.error('Error sending test email:', error)
      toast.error(error.message || 'Failed to send test email')
    } finally {
      setIsTesting(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Configuration</CardTitle>
          <CardDescription>Configure Resend for sending emails</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/webhooks/resend`

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Configuration
              </CardTitle>
              <CardDescription>
                Configure your organization's Resend integration for sending emails
              </CardDescription>
            </div>
            {config.isConfigured && (
              <Badge className="gap-1" variant="default">
                <CheckCircle className="h-3 w-3" />
                Configured
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="apiKey">Resend API Key</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? 'text' : 'password'}
                value={config.apiKey || ''}
                onChange={e => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="re_1234567890abcdef"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Get your API key from{' '}
              <a
                href="https://resend.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Resend Dashboard
              </a>
            </p>
          </div>

          {/* From Email */}
          <div className="space-y-2">
            <Label htmlFor="fromEmail">Default From Email</Label>
            <Input
              id="fromEmail"
              type="email"
              value={config.fromEmail || ''}
              onChange={e => setConfig({ ...config, fromEmail: e.target.value })}
              placeholder="noreply@yourdomain.com"
            />
            <p className="text-sm text-muted-foreground">
              Must be a verified domain in your Resend account
            </p>
          </div>

          {/* Webhook Configuration */}
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <div className="flex gap-2">
              <Input value={webhookUrl} readOnly />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(webhookUrl)
                  toast.success('Webhook URL copied to clipboard')
                }}
              >
                <Globe className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Add this URL to your Resend webhook settings
            </p>
          </div>

          {/* Webhook Secret */}
          <div className="space-y-2">
            <Label htmlFor="webhookSecret">Webhook Signing Secret (Optional)</Label>
            <div className="relative">
              <Input
                id="webhookSecret"
                type={showWebhookSecret ? 'text' : 'password'}
                value={config.webhookSecret || ''}
                onChange={e => setConfig({ ...config, webhookSecret: e.target.value })}
                placeholder="whsec_1234567890abcdef"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowWebhookSecret(!showWebhookSecret)}
              >
                {showWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              For enhanced security, get this from your Resend webhook settings
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={saveConfiguration} disabled={isSaving}>
              {isSaving ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Configuration
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Email */}
      {config.isConfigured && (
        <Card>
          <CardHeader>
            <CardTitle>Test Email Integration</CardTitle>
            <CardDescription>Send a test email to verify your configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="email"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                className="flex-1"
              />
              <Button onClick={sendTestEmail} disabled={isTesting}>
                {isTesting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Test
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Sign up for a free Resend account at resend.com</li>
            <li>Add and verify your domain in the Resend dashboard</li>
            <li>Create an API key and add it above</li>
            <li>Configure the webhook URL in Resend to track email events</li>
            <li>Optionally add the webhook signing secret for enhanced security</li>
            <li>Save your configuration and send a test email</li>
          </ol>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Each organization can have its own Resend configuration. This allows complete email
              isolation and separate billing per organization.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
