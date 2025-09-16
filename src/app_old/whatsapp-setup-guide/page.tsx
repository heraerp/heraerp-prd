'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  MessageCircle,
  Settings,
  Globe,
  Link,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Loader2
} from 'lucide-react'

export default function WhatsAppSetupGuide() {
  const [apiStatus, setApiStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3002'}/api/v1/whatsapp/webhook`
  const verifyToken = 'hera-whatsapp-webhook-2024-secure-token'

  useEffect(() => {
    checkApiStatus()
  }, [])

  const checkApiStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/v1/whatsapp/fetch-real-messages')
      const data = await response.json()
      setApiStatus(data)
    } catch (error) {
      console.error('Failed to check API status:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="min-h-screen bg-muted dark:bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3 mb-4">
            <MessageCircle className="w-8 h-8 text-green-500" />
            WhatsApp Real Messages Setup
          </h1>
          <p className="text-muted-foreground dark:text-muted-foreground">
            Follow these steps to receive real WhatsApp messages in HERA
          </p>
        </div>

        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Current Status
              <Button variant="outline" size="sm" onClick={checkApiStatus} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {apiStatus?.data?.phoneInfo ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <span className="font-medium">Phone Number</span>
                  <span>{apiStatus.data.phoneInfo.display_phone_number}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="font-medium">Business Name</span>
                  <span>{apiStatus.data.phoneInfo.verified_name}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <span className="font-medium">Quality Rating</span>
                  <Badge variant="outline">
                    {apiStatus.data.phoneInfo.quality_rating || 'Not rated'}
                  </Badge>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  Unable to fetch WhatsApp status. Check your API credentials.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Important Note */}
        <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <AlertCircle className="w-4 h-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            <strong>Important:</strong> WhatsApp Business API does not provide message history. You
            can only receive new messages sent after webhook setup. The test messages you saw were
            populated for demonstration purposes.
          </AlertDescription>
        </Alert>

        {/* Setup Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1 */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Badge className="w-6 h-6 rounded-full">1</Badge>
                Expose Your Local Webhook (for testing)
              </h3>
              <p className="text-sm text-muted-foreground ml-8">
                Since WhatsApp needs a public URL, use ngrok to expose your local server:
              </p>
              <div className="ml-8 space-y-2">
                <code className="block p-3 bg-muted dark:bg-muted rounded">
                  ngrok http 3002
                </code>
                <p className="text-sm text-muted-foreground">
                  This will give you a URL like: https://abc123.ngrok.io
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Badge className="w-6 h-6 rounded-full">2</Badge>
                Configure Webhook in Meta Business Manager
              </h3>
              <div className="ml-8 space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() =>
                    window.open(
                      'https://business.facebook.com/settings/whatsapp-business-accounts',
                      '_blank'
                    )
                  }
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Meta Business Manager
                </Button>
                <p className="text-sm text-muted-foreground">
                  Navigate to: WhatsApp Business Account → Settings → Webhooks
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Badge className="w-6 h-6 rounded-full">3</Badge>
                Set Webhook URL
              </h3>
              <div className="ml-8 space-y-2">
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-muted dark:bg-muted rounded text-sm">
                    {webhookUrl}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(webhookUrl, 'webhook')}
                  >
                    {copied === 'webhook' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  For local testing, replace localhost:3002 with your ngrok URL
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Badge className="w-6 h-6 rounded-full">4</Badge>
                Set Verify Token
              </h3>
              <div className="ml-8 space-y-2">
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-muted dark:bg-muted rounded text-sm">
                    {verifyToken}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(verifyToken, 'token')}
                  >
                    {copied === 'token' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Badge className="w-6 h-6 rounded-full">5</Badge>
                Subscribe to Webhook Fields
              </h3>
              <div className="ml-8">
                <p className="text-sm text-muted-foreground mb-2">Enable these fields:</p>
                <div className="space-y-1">
                  <Badge variant="secondary">messages</Badge>
                  <Badge variant="secondary">message_status</Badge>
                  <Badge variant="secondary">message_template_status_update</Badge>
                </div>
              </div>
            </div>

            {/* Step 6 */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Badge className="w-6 h-6 rounded-full">6</Badge>
                Test the Integration
              </h3>
              <div className="ml-8 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Send a WhatsApp message to your business number:
                </p>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
                  <p className="font-mono">
                    {apiStatus?.data?.phoneInfo?.display_phone_number || '+91 99458 96033'}
                  </p>
                </div>
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => window.open('/whatsapp-messages', '_blank')}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  View Messages
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Production Setup */}
        <Card>
          <CardHeader>
            <CardTitle>Production Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">For production deployment:</p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Deploy your HERA app to a public server (Vercel, Railway, etc.)</li>
              <li>
                Use your production URL for the webhook:
                https://yourdomain.com/api/v1/whatsapp/webhook
              </li>
              <li>Update webhook URL in Meta Business Manager</li>
              <li>All incoming messages will be automatically stored in your database</li>
            </ol>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <p className="font-medium">Webhook not receiving messages?</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Check ngrok is running and URL is correct</li>
                <li>Verify webhook is "Verified" in Meta Business Manager</li>
                <li>Ensure you subscribed to "messages" field</li>
                <li>Check server logs for incoming POST requests</li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-medium">Messages not appearing in UI?</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Check database connection is working</li>
                <li>Verify organization ID matches in webhook handler</li>
                <li>Look for errors in browser console</li>
                <li>Try refreshing the messages page</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
