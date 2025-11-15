// ================================================================================
// SEND MESSAGE DIALOG - WHATSAPP MESSAGE SENDER
// Smart Code: HERA.UI.WHATSAPP.SEND_MESSAGE.V1
// Production-ready message sending with consent checking and template validation
// ================================================================================

'use client'

import React, { useEffect, useMemo, useState } from 'react'
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
  Eye,
  Shield,
  UserCheck
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useWhatsappApi } from '@/lib/api/whatsapp'
import { WaTemplate, renderTemplate } from '@/lib/schemas/whatsapp'
import { useToast } from '@/components/ui/use-toast'

const SendMessageSchema = z.object({
  customer_code: z.string().min(1, 'Customer code is required'),
  customer_name: z.string().min(1, 'Customer name is required'),
  phone_number: z
    .string()
    .min(10, 'Valid phone number is required')
    .regex(/^\\+?[1-9]\\d{1,14}$/, 'Invalid phone number format'),
  template_name: z.string().min(1, 'Please select a template'),
  variables: z.record(z.string()).default({})
})

type SendMessageFormData = z.infer<typeof SendMessageSchema>

interface SendMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  templates: WaTemplate[]
}

export function SendMessageDialog({
  open,
  onOpenChange,
  organizationId,
  templates
}: SendMessageDialogProps) {
  const { toast } = useToast()
  const [previewVisible, setPreviewVisible] = React.useState(false)
  const [sendStatus, setSendStatus] = React.useState<
    'idle' | 'checking' | 'sending' | 'sent' | 'failed'
  >('idle')
  const [consentStatus, setConsentStatus] = React.useState<
    'unknown' | 'checking' | 'granted' | 'denied' | 'required'
  >('unknown')

  const { sendMessage, getCustomerPrefs, setCustomerPrefs } = useWhatsappApi(organizationId)

  const form = useForm<SendMessageFormData>({
    resolver: zodResolver(SendMessageSchema),
    defaultValues: {
      customer_code: '',
      customer_name: '',
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

  // Check consent when customer code changes
  React.useEffect(() => {
    const customerCode = form.watch('customer_code')
    if (customerCode && customerCode.trim()) {
      checkCustomerConsent(customerCode)
    } else {
      setConsentStatus('unknown')
    }
  }, [form.watch('customer_code')])

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

  const checkCustomerConsent = async (customerCode: string) => {
    try {
      setConsentStatus('checking')
      const prefs = await getCustomerPrefs(customerCode)

      if (prefs?.opted_in) {
        setConsentStatus('granted')
      } else {
        setConsentStatus('required')
      }
    } catch (error) {
      console.error('Error checking consent:', error)
      setConsentStatus('required')
    }
  }

  const handleGrantConsent = async () => {
    const customerCode = form.watch('customer_code')
    const phoneNumber = form.watch('phone_number')

    if (!customerCode || !phoneNumber) {
      toast({
        title: 'Missing Information',
        description: 'Customer code and phone number are required to grant consent.',
        variant: 'destructive'
      })
      return
    }

    try {
      await setCustomerPrefs.mutateAsync({
        customerCode,
        prefs: {
          opted_in: true,
          channel: 'whatsapp',
          consent_ts: new Date().toISOString(),
          phone_number: phoneNumber,
          consent_method: 'explicit'
        }
      })

      setConsentStatus('granted')
      toast({
        title: 'Consent Granted',
        description: 'Customer has been opted in for WhatsApp messages.',
        variant: 'default'
      })
    } catch (error) {
      toast({
        title: 'Consent Failed',
        description: error instanceof Error ? error.message : 'Failed to grant consent',
        variant: 'destructive'
      })
    }
  }

  const onSubmit = async (data: SendMessageFormData) => {
    if (!selectedTemplate) {
      toast({
        title: 'No Template Selected',
        description: 'Please select a template before sending.',
        variant: 'destructive'
      })
      return
    }

    if (consentStatus !== 'granted') {
      toast({
        title: 'Consent Required',
        description: 'Customer must provide consent before receiving WhatsApp messages.',
        variant: 'destructive'
      })
      return
    }

    setSendStatus('sending')

    try {
      await sendMessage.mutateAsync({
        organization_id: organizationId,
        entity_type: 'wa_message',
        entity_code: `MSG_${Date.now()}`,
        entity_name: `WhatsApp message to ${data.customer_name}`,
        to_customer_code: data.customer_code,
        to_phone: data.phone_number,
        template_name: data.template_name,
        payload: {
          customer_name: data.customer_name,
          ...data.variables
        },
        smart_code: 'HERA.MSP.WA.MESSAGE.SEND.V1'
      })

      setSendStatus('sent')
      toast({
        title: 'Message Queued',
        description: `WhatsApp message has been queued for delivery to ${data.customer_name}`,
        variant: 'default'
      })

      // Close dialog after success
      setTimeout(() => {
        onOpenChange(false)
        setSendStatus('idle')
        setConsentStatus('unknown')
        form.reset()
      }, 2000)
    } catch (error) {
      setSendStatus('failed')
      toast({
        title: 'Message Failed',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive'
      })
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setSendStatus('idle')
    setConsentStatus('unknown')
    form.reset()
  }

  const getConsentBadge = () => {
    switch (consentStatus) {
      case 'checking':
        return (
          <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
            <Clock className="h-3 w-3 mr-1 animate-spin" />
            Checking...
          </Badge>
        )
      case 'granted':
        return (
          <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
            <UserCheck className="h-3 w-3 mr-1" />
            Consent Granted
          </Badge>
        )
      case 'denied':
        return (
          <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
            <AlertCircle className="h-3 w-3 mr-1" />
            Opted Out
          </Badge>
        )
      case 'required':
        return (
          <Badge variant="outline" className="text-orange-700 border-orange-300 bg-orange-50">
            <Shield className="h-3 w-3 mr-1" />
            Consent Required
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="ink border-gray-300 bg-gray-50">
            <User className="h-3 w-3 mr-1" />
            Unknown
          </Badge>
        )
    }
  }

  const isReadyToSend =
    consentStatus === 'granted' &&
    selectedTemplate &&
    form.watch('phone_number') &&
    form.watch('template_name') &&
    sendStatus !== 'sending' &&
    sendStatus !== 'sent'

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Send WhatsApp Message
          </DialogTitle>
          <DialogDescription>
            Send a WhatsApp message through HERA MSP. Customer consent is required before sending.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Recipient Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Message Recipient
                </div>
                {getConsentBadge()}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_code">Customer Code *</Label>
                  <Input
                    id="customer_code"
                    {...form.register('customer_code')}
                    placeholder="CUST_001"
                  />
                  {form.formState.errors.customer_code && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.customer_code.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_name">Customer Name *</Label>
                  <Input
                    id="customer_name"
                    {...form.register('customer_name')}
                    placeholder="Sarah Johnson"
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
                  Phone Number (with country code) *
                </Label>
                <Input
                  id="phone_number"
                  {...form.register('phone_number')}
                  placeholder="+971501234567"
                />
                <p className="text-sm ink-muted">
                  Include country code (e.g., +971 for UAE, +1 for US)
                </p>
                {form.formState.errors.phone_number && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.phone_number.message}
                  </p>
                )}
              </div>

              {/* Consent Status */}
              {consentStatus === 'required' && (
                <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/30">
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>Customer consent is required before sending WhatsApp messages.</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGrantConsent}
                      >
                        Grant Consent
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {consentStatus === 'denied' && (
                <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-800 dark:text-red-200">
                    Customer has opted out of WhatsApp messages. Cannot send message.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Template Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Message Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template_name">Select Template *</Label>
                <Select
                  value={form.watch('template_name')}
                  onValueChange={value => form.setValue('template_name', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a message template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.length === 0 ? (
                      <SelectItem value="" disabled>
                        No templates available
                      </SelectItem>
                    ) : (
                      templates
                        .filter(t => t.status === 'approved') // Only show approved templates
                        .map(template => (
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
                      WhatsApp Message Preview
                    </span>
                  </div>
                  <div className="text-sm ink dark:text-gray-300 whitespace-pre-wrap">
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
              <AlertDescription>Sending message through HERA MSP API...</AlertDescription>
            </Alert>
          )}

          {sendStatus === 'sent' && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Message queued successfully! It will be delivered shortly.
              </AlertDescription>
            </Alert>
          )}

          {sendStatus === 'failed' && (
            <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                Failed to send message. Please check your configuration and try again.
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
          <Button onClick={form.handleSubmit(onSubmit)} disabled={!isReadyToSend}>
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
                Send Message
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
