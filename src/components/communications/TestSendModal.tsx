'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Check } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { useTestSend } from '@/hooks/use-communications'
import { isDemoMode } from '@/lib/demo-guard'
import { useOrgStore } from '@/state/org'
import type { Template } from '@/types/communications'

interface TestSendModalProps {
  template: Template
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TestSendModal({ template, open, onOpenChange }: TestSendModalProps) {
  const { toast } = useToast()
  const { currentOrgId } = useOrgStore()
  const isDemo = isDemoMode(currentOrgId)

  const [recipient, setRecipient] = useState('')
  const [testVariables, setTestVariables] = useState<Record<string, string>>({})
  const [sendSuccess, setSendSuccess] = useState(false)

  const testSendMutation = useTestSend()

  const getRecipientPlaceholder = () => {
    switch (template.channel) {
      case 'email':
        return 'test@example.com'
      case 'sms':
        return '+1234567890'
      case 'webhook':
        return 'https://webhook.site/test-endpoint'
      default:
        return ''
    }
  }

  const getRecipientLabel = () => {
    switch (template.channel) {
      case 'email':
        return 'Email Address'
      case 'sms':
        return 'Phone Number'
      case 'webhook':
        return 'Webhook URL'
      default:
        return 'Recipient'
    }
  }

  const handleSend = async () => {
    if (!recipient) {
      toast({
        title: 'Recipient required',
        description: 'Please provide a recipient for the test send',
        variant: 'destructive'
      })
      return
    }

    try {
      await testSendMutation.mutateAsync({
        template_id: template.id,
        channel: template.channel,
        recipient,
        variables: testVariables
      })

      setSendSuccess(true)

      toast({
        title: isDemo ? 'Test simulated' : 'Test sent',
        description: isDemo
          ? `Test ${template.channel} simulated in demo mode`
          : `Test ${template.channel} sent successfully`
      })

      // Close modal after a delay
      setTimeout(() => {
        onOpenChange(false)
        setSendSuccess(false)
      }, 2000)
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setSendSuccess(false)
    setRecipient('')
    setTestVariables({})
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Test Send: {template.entity_name}</DialogTitle>
          <DialogDescription>
            Send a test message to verify your template renders correctly.
            {isDemo && ' (Demo mode - message will be simulated)'}
          </DialogDescription>
        </DialogHeader>

        {sendSuccess ? (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium">Test Sent!</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {isDemo
                ? 'Your test message was simulated in demo mode.'
                : `Your test ${template.channel} has been sent successfully.`}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="recipient" className="text-right">
                  {getRecipientLabel()}
                </Label>
                <Input
                  id="recipient"
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  className="col-span-3"
                  placeholder={getRecipientPlaceholder()}
                />
              </div>

              {template.variables && template.variables.length > 0 && (
                <>
                  <div className="col-span-full">
                    <Label className="mb-2 block">Test Variables</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Provide test values for the variables in your template:
                    </p>
                  </div>
                  {template.variables.map(variable => (
                    <div key={variable} className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor={variable} className="text-right">
                        {`{{${variable}}}`}
                      </Label>
                      <Input
                        id={variable}
                        value={testVariables[variable] || ''}
                        onChange={e =>
                          setTestVariables({
                            ...testVariables,
                            [variable]: e.target.value
                          })
                        }
                        className="col-span-3"
                        placeholder={`Enter ${variable}`}
                      />
                    </div>
                  ))}
                </>
              )}

              {isDemo && (
                <Alert className="col-span-full">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Demo Mode:</strong> Test sends are simulated and won't actually send
                    messages.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSend} disabled={testSendMutation.isPending}>
                {testSendMutation.isPending ? 'Sending...' : 'Send Test'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
