'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Mail,
  Key,
  Shield,
  CheckCircle,
  AlertCircle,
  Settings,
  BarChart3,
  TestTube,
  Save,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface ResendConfig {
  configured: boolean
  setup_complete: boolean
  api_key_configured: boolean
  connector?: {
    id: string
    status: string
    from_email: string
    rate_limit: number
  }
}

interface EmailStats {
  totalSent: number
  totalFailed: number
  successRate: number
  rateLimitHits: number
}

interface ResendConfigurationProps {
  organizationId: string
  onConfigurationChange?: (configured: boolean) => void
}

export function ResendConfiguration({
  organizationId,
  onConfigurationChange
}: ResendConfigurationProps) {
  const [config, setConfig] = useState<ResendConfig | null>(null)
  const [stats, setStats] = useState<EmailStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [apiKey, setApiKey] = useState('')
  const [fromEmail, setFromEmail] = useState('')
  const [rateLimit, setRateLimit] = useState(100)
  const [showApiKey, setShowApiKey] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  const { toast } = useToast()

  useEffect(() => {
    loadConfiguration()
  }, [organizationId])

  const loadConfiguration = async () => {
    try {
      setLoading(true)

      // Load configuration
      const configResponse = await fetch('/api/integrations/resend/config', {
        headers: { 'x-organization-id': organizationId }
      })

      if (configResponse.ok) {
        const configData = await configResponse.json()
        setConfig(configData)

        if (configData.connector) {
          setFromEmail(configData.connector.from_email)
          setRateLimit(configData.connector.rate_limit)
        }

        // Load statistics if configured
        if (configData.configured) {
          const statsResponse = await fetch('/api/integrations/resend/multitenant', {
            headers: { 'x-organization-id': organizationId }
          })

          if (statsResponse.ok) {
            const statsData = await statsResponse.json()
            setStats(statsData.statistics)
          }
        }

        onConfigurationChange?.(configData.setup_complete)
      }
    } catch (error) {
      console.error('Failed to load configuration:', error)
      toast({
        title: 'Error',
        description: 'Failed to load Resend configuration',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    try {
      setTesting(true)
      setTestResult(null)

      const response = await fetch('/api/integrations/resend/multitenant', {
        method: 'PUT',
        headers: { 'x-organization-id': organizationId }
      })

      const result = await response.json()
      setTestResult(result)

      if (result.success) {
        toast({
          title: 'Connection Test Successful',
          description: 'Your Resend API key is working correctly'
        })
      } else {
        toast({
          title: 'Connection Test Failed',
          description: result.message,
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Connection test failed:', error)
      toast({
        title: 'Test Failed',
        description: 'Failed to test Resend connection',
        variant: 'destructive'
      })
    } finally {
      setTesting(false)
    }
  }

  const saveConfiguration = async () => {
    try {
      setSaving(true)

      // Validate inputs
      if (apiKey && !apiKey.startsWith('re_')) {
        toast({
          title: 'Invalid API Key',
          description: 'Resend API keys should start with "re_"',
          variant: 'destructive'
        })
        return
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (fromEmail && !emailRegex.test(fromEmail)) {
        toast({
          title: 'Invalid Email',
          description: 'Please enter a valid email address',
          variant: 'destructive'
        })
        return
      }

      const response = await fetch('/api/integrations/resend/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': organizationId
        },
        body: JSON.stringify({
          api_key: apiKey || undefined,
          from_email: fromEmail,
          rate_limit: rateLimit,
          activate: true
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Configuration Saved',
          description: 'Resend integration has been configured successfully'
        })

        setApiKey('') // Clear the API key field for security
        await loadConfiguration() // Reload configuration
      } else {
        toast({
          title: 'Configuration Failed',
          description: result.error,
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Failed to save configuration:', error)
      toast({
        title: 'Save Failed',
        description: 'Failed to save Resend configuration',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const deleteConfiguration = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this Resend configuration? This will disable email sending for your organization.'
      )
    ) {
      return
    }

    try {
      const response = await fetch('/api/integrations/resend/config', {
        method: 'DELETE',
        headers: { 'x-organization-id': organizationId }
      })

      if (response.ok) {
        toast({
          title: 'Configuration Deleted',
          description: 'Resend integration has been disabled'
        })

        await loadConfiguration()
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error: any) {
      console.error('Failed to delete configuration:', error)
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete Resend configuration',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const statusColor = config?.connector?.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
  const statusText = config?.connector?.status === 'active' ? 'Active' : 'Pending Configuration'

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <CardTitle>Resend Email Integration</CardTitle>
            </div>
            <Badge variant="outline" className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
              <span>{statusText}</span>
            </Badge>
          </div>
          <CardDescription>
            Configure Resend to send transactional emails for your organization
          </CardDescription>
        </CardHeader>

        {config?.configured && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">API Key</p>
                  <p className="text-xs text-muted-foreground">
                    {config.api_key_configured ? 'Configured' : 'Not Set'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">From Email</p>
                  <p className="text-xs text-muted-foreground">{config.connector?.from_email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Rate Limit</p>
                  <p className="text-xs text-muted-foreground">
                    {config.connector?.rate_limit}/hour
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-xs text-muted-foreground">{config.connector?.status}</p>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Statistics */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Email Statistics (Last 7 Days)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.totalSent}</p>
                <p className="text-sm text-muted-foreground">Emails Sent</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{stats.totalFailed}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.successRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{stats.rateLimitHits}</p>
                <p className="text-sm text-muted-foreground">Rate Limit Hits</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configuration</span>
          </CardTitle>
          <CardDescription>
            Configure your organization's Resend integration settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="apiKey" className="flex items-center space-x-2">
              <Key className="h-4 w-4" />
              <span>Resend API Key</span>
            </Label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder={
                    config?.api_key_configured
                      ? 'API key is configured (enter new key to update)'
                      : 're_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Get your API key from your Resend dashboard at{' '}
              <a
                href="https://resend.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                https://resend.com/api-keys
              </a>
            </p>
          </div>

          <Separator />

          {/* From Email */}
          <div className="space-y-2">
            <Label htmlFor="fromEmail">Default From Email</Label>
            <Input
              id="fromEmail"
              type="email"
              value={fromEmail}
              onChange={e => setFromEmail(e.target.value)}
              placeholder="noreply@yourdomain.com"
            />
            <p className="text-xs text-muted-foreground">
              This email address must be verified in your Resend domain settings
            </p>
          </div>

          {/* Rate Limit */}
          <div className="space-y-2">
            <Label htmlFor="rateLimit">Rate Limit (emails per hour)</Label>
            <Input
              id="rateLimit"
              type="number"
              min="1"
              max="1000"
              value={rateLimit}
              onChange={e => setRateLimit(parseInt(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Maximum number of emails your organization can send per hour
            </p>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={saveConfiguration}
              disabled={saving}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </Button>

            {config?.api_key_configured && (
              <Button
                variant="outline"
                onClick={testConnection}
                disabled={testing}
                className="flex items-center space-x-2"
              >
                <TestTube className="h-4 w-4" />
                <span>{testing ? 'Testing...' : 'Test Connection'}</span>
              </Button>
            )}

            {config?.configured && (
              <Button
                variant="destructive"
                onClick={deleteConfiguration}
                className="flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Configuration</span>
              </Button>
            )}
          </div>

          {/* Test Results */}
          {testResult && (
            <Alert
              className={
                testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }
            >
              {testResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                <strong>{testResult.success ? 'Success: ' : 'Error: '}</strong>
                {testResult.message}
                {testResult.details && (
                  <pre className="mt-2 text-xs bg-card p-2 rounded border border-border">
                    {JSON.stringify(testResult.details, null, 2)}
                  </pre>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Setup Instructions */}
          {!config?.setup_complete && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Setup Required:</strong>
                <ol className="mt-2 space-y-1 text-sm">
                  <li>1. Get your API key from Resend dashboard</li>
                  <li>2. Verify your domain in Resend</li>
                  <li>3. Enter your API key and from email above</li>
                  <li>4. Save and test the configuration</li>
                </ol>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ResendConfiguration
