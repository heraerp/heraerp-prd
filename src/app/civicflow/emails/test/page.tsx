'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Send, CheckCircle, XCircle } from 'lucide-react'

// CivicFlow Demo Organization ID
const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

export default function EmailTestPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const [emailData, setEmailData] = useState({
    to: 'test@example.com',
    subject: 'Test Email from CivicFlow',
    text: 'This is a test email sent through the HERA-native Resend integration.',
    html: '<p>This is a <strong>test email</strong> sent through the HERA-native Resend integration.</p>'
  })

  const handleSendEmail = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/v1/communications/emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organizationId: CIVICFLOW_ORG_ID,
          from: 'onboarding@resend.dev', // Resend test domain
          to: [emailData.to],
          subject: emailData.subject,
          text: emailData.text,
          html: emailData.html,
          tags: ['test', 'civicflow']
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email')
      }

      setResult({
        success: true,
        data
      })

      toast({
        title: 'Email sent successfully!',
        description: `Transaction ID: ${data.transactionId}`
      })
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message
      })

      toast({
        title: 'Failed to send email',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Email Integration Test</h1>
        <p className="text-muted-foreground mt-2">Test the HERA-native Resend email integration</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send Test Email</CardTitle>
          <CardDescription>
            This will create a universal_transaction and send an email via Resend
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="to">To Email</Label>
            <Input
              id="to"
              type="email"
              value={emailData.to}
              onChange={e => setEmailData(prev => ({ ...prev, to: e.target.value }))}
              placeholder="recipient@example.com"
            />
          </div>

          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={emailData.subject}
              onChange={e => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Email subject"
            />
          </div>

          <div>
            <Label htmlFor="text">Plain Text Content</Label>
            <Textarea
              id="text"
              value={emailData.text}
              onChange={e => setEmailData(prev => ({ ...prev, text: e.target.value }))}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="html">HTML Content</Label>
            <Textarea
              id="html"
              value={emailData.html}
              onChange={e => setEmailData(prev => ({ ...prev, html: e.target.value }))}
              rows={3}
              className="font-mono text-sm"
            />
          </div>

          <Button
            onClick={handleSendEmail}
            disabled={isLoading || !emailData.to || !emailData.subject}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Test Email
              </>
            )}
          </Button>

          {result && (
            <Alert className={result.success ? 'border-green-500' : 'border-red-500'}>
              <AlertDescription className="space-y-2">
                {result.success ? (
                  <>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <strong>Email sent successfully!</strong>
                    </div>
                    <div className="text-sm space-y-1">
                      <p>
                        Transaction ID: <code className="text-xs">{result.data.transactionId}</code>
                      </p>
                      <p>
                        Resend Message ID:{' '}
                        <code className="text-xs">{result.data.resendMessageId}</code>
                      </p>
                      <p>Status: {result.data.status}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <strong>Failed to send email</strong>
                    </div>
                    <p className="text-sm">{result.error}</p>
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <ol className="space-y-2">
            <li>
              Email send request creates a <code>universal_transaction</code> with status='queued'
            </li>
            <li>
              Recipients are stored as <code>universal_transaction_lines</code> (TO/CC/BCC)
            </li>
            <li>
              Email content is stored in <code>core_dynamic_data</code>
            </li>
            <li>Resend API is called to actually send the email</li>
            <li>Transaction status is updated to 'sent' or 'failed'</li>
            <li>Webhook events update the status as email is delivered/opened/clicked</li>
          </ol>

          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="font-semibold mb-2">Smart Codes Used:</p>
            <ul className="text-xs space-y-1">
              <li>
                <code>HERA.COMMS.EMAIL.SEND.V1</code> - Email transaction
              </li>
              <li>
                <code>HERA.COMMS.EMAIL.RECIPIENT.TO.V1</code> - TO recipients
              </li>
              <li>
                <code>HERA.COMMS.EMAIL.CONTENT.V1</code> - Email content
              </li>
              <li>
                <code>HERA.COMMS.EMAIL.EVENT.V1</code> - Delivery events
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
