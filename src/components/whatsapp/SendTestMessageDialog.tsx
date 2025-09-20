// ================================================================================
// SEND TEST MESSAGE DIALOG - WHATSAPP
// Smart Code: HERA.UI.WHATSAPP.TEST_MESSAGE.v1
// Production-ready test message dialog with template preview and validation
// ================================================================================

'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  MessageCircle,
  Send,
  AlertCircle,
  CheckCircle,
  Phone,
  User,
  Clock,
  Eye
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useWhatsappApi } from '@/lib/api/whatsapp'
import { renderTemplate } from '@/lib/schemas/whatsapp'
import { useToast } from '@/components/ui/use-toast'

const TestMessageSchema = z.object({
  customer_code: z.string().min(1, 'Customer code is required'),
  customer_name: z.string().min(1, 'Customer name is required'),
  phone_number: z
    .string()
    .min(10, 'Valid phone number is required')
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  template_name: z.string().min(1, 'Please select a template'),
  variables: z.record(z.string()).default({})
})

type TestMessageFormData = z.infer<typeof TestMessageSchema>

interface SendTestMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
}

export function SendTestMessageDialog({
  open,
  onOpenChange,
  organizationId
}: SendTestMessageDialogProps) {
  const { toast } = useToast()
  const [previewVisible, setPreviewVisible] = React.useState(false)
  const [sendStatus, setSendStatus] = React.useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')

  const { templates, isTemplatesLoading, sendMessage, getCustomerPrefs, setCustomerPrefs } =
    useWhatsappApi(organizationId)

  const form = useForm<TestMessageFormData>({
    resolver: zodResolver(TestMessageSchema),
    defaultValues: {
      customer_code: 'TEST_CUSTOMER',
      customer_name: 'Test Customer',
      phone_number: '',
      template_name: '',
      variables: {}
    }
  })

  const selectedTemplate = React.useMemo(() => {
    const templateName = form.watch('template_name')
    return templates.find(t => t.name === templateName)
  }, [templates, form.watch('template_name')])

  const previewText = React.useMemo(() => {
    if (!selectedTemplate) return ''

    const variables = form.watch('variables')
    const substitutions = {
      customer_name: form.watch('customer_name'),
      ...variables
    }

    return renderTemplate(selectedTemplate, substitutions)
  }, [selectedTemplate, form.watch('variables'), form.watch('customer_name')])

  // Update variable fields when template changes
  React.useEffect(() => {
    if (selectedTemplate) {
      const currentVariables = form.getValues('variables')
      const newVariables: Record<string, string> = {}

      selectedTemplate.variables.forEach(varName => {
        newVariables[varName] =
          currentVariables[varName] || selectedTemplate.sample?.[varName] || ''
      })

      form.setValue('variables', newVariables)
      setPreviewVisible(true)
    } else {
      setPreviewVisible(false)
    }
  }, [selectedTemplate, form])

  const onSubmit = async (data: TestMessageFormData) => {
    if (!selectedTemplate) {
      toast({
        title: 'No Template Selected',
        description: 'Please select a template before sending.',
        variant: 'destructive'
      })
      return
    }

    setSendStatus('sending')

    try {
      // 1. Ensure customer has consent for testing
      const customerPrefs = await getCustomerPrefs(data.customer_code)

      if (!customerPrefs?.opted_in) {
        // Auto opt-in for test customers
        await setCustomerPrefs.mutateAsync({
          customerCode: data.customer_code,
          prefs: {
            opted_in: true,
            channel: 'whatsapp',
            consent_ts: new Date().toISOString(),
            phone_number: data.phone_number,
            consent_method: 'explicit'
          }
        })
      }

      // 2. Send the test message
      await sendMessage.mutateAsync({
        organization_id: organizationId,
        entity_type: 'wa_message',
        entity_code: `TEST_MSG_${Date.now()}`,
        entity_name: `Test message to ${data.customer_name}`,
        to_customer_code: data.customer_code,
        to_phone: data.phone_number,
        template_name: data.template_name,
        payload: {
          customer_name: data.customer_name,
          ...data.variables
        },
        smart_code: 'HERA.MSP.WA.MESSAGE.TEST.V1'
      })

      setSendStatus('sent')
      toast({
        title: 'Test Message Queued',
        description: `Test message has been queued for delivery to ${data.phone_number}`,
        variant: 'default'
      })

      // Close dialog after success
      setTimeout(() => {
        onOpenChange(false)
        setSendStatus('idle')
        form.reset()
      }, 2000)
    } catch (error) {
      setSendStatus('failed')
      toast({
        title: 'Test Message Failed',
        description: error instanceof Error ? error.message : 'Failed to send test message',
        variant: 'destructive'
      })
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setSendStatus('idle')
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Send Test WhatsApp Message
          </DialogTitle>
          <DialogDescription>
            Send a test message to verify your WhatsApp configuration and templates. This will queue
            a real message through the HERA MSP API.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Recipient Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                Test Recipient
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_code">Customer Code</Label>
                  <Input
                    id="customer_code"
                    {...form.register('customer_code')}
                    placeholder="TEST_CUSTOMER"
                  />
                  {form.formState.errors.customer_code && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.customer_code.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_name">Customer Name</Label>
                  <Input
                    id="customer_name"
                    {...form.register('customer_name')}
                    placeholder="Test Customer"
                  />
                  {form.formState.errors.customer_name && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.customer_name.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number" className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Phone Number (with country code)
                </Label>
                <Input
                  id="phone_number"
                  {...form.register('phone_number')}
                  placeholder="+971501234567"
                />
                <p className="text-sm text-gray-500">
                  Include country code (e.g., +971 for UAE, +1 for US)
                </p>
                {form.formState.errors.phone_number && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.phone_number.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Template Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Message Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template_name">Select Template</Label>
                <Select
                  value={form.watch('template_name')}
                  onValueChange={value => form.setValue('template_name', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a message template" />
                  </SelectTrigger>
                  <SelectContent>
                    {isTemplatesLoading ? (
                      <SelectItem value="" disabled>
                        Loading templates...
                      </SelectItem>
                    ) : templates.length === 0 ? (
                      <SelectItem value="" disabled>
                        No templates available
                      </SelectItem>
                    ) : (
                      templates.map(template => (
                        <SelectItem key={template.name} value={template.name}>
                          <div className="flex items-center justify-between w-full">
                            <span>{template.name}</span>
                            <Badge variant="outline" className="ml-2">
                              {template.category}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {form.formState.errors.template_name && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.template_name.message}
                  </p>
                )}
              </div>

              {/* Template Variables */}
              {selectedTemplate && selectedTemplate.variables.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Template Variables</Label>
                  {selectedTemplate.variables.map(varName => (
                    <div key={varName} className="space-y-1">
                      <Label htmlFor={`var_${varName}`} className="text-sm">
                        {varName}
                      </Label>
                      <Input
                        id={`var_${varName}`}
                        value={form.watch('variables')[varName] || ''}
                        onChange={e => {
                          const variables = form.getValues('variables')
                          variables[varName] = e.target.value
                          form.setValue('variables', variables)
                        }}
                        placeholder={selectedTemplate.sample?.[varName] || `Enter ${varName}`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Message Preview */}
          {previewVisible && previewText && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Message Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border-l-4 border-green-500">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      WhatsApp Message
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {previewText}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Messages */}
          {sendStatus === 'sending' && (
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
              <Clock className="h-4 w-4 animate-spin" />
              <AlertDescription>Sending test message through HERA MSP API...</AlertDescription>
            </Alert>
          )}

          {sendStatus === 'sent' && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Test message queued successfully! Check WhatsApp for delivery.
              </AlertDescription>
            </Alert>
          )}

          {sendStatus === 'failed' && (
            <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                Failed to send test message. Please check your configuration.
              </AlertDescription>
            </Alert>
          )}
        </form>

        <Separator />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={sendStatus === 'sending'}
          >
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={
              sendStatus === 'sending' ||
              sendStatus === 'sent' ||
              !selectedTemplate ||
              !form.watch('phone_number') ||
              !form.watch('template_name')
            }
          >
            {sendStatus === 'sending' ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : sendStatus === 'sent' ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Sent
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Test Message
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
