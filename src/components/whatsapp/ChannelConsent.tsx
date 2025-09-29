// ================================================================================
// CHANNEL CONSENT - WHATSAPP CONSENT MANAGEMENT
// Smart Code: HERA.UI.WHATSAPP.CONSENT.v1
// Production-ready consent dialog for customer channel preferences
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
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Shield,
  UserCheck,
  UserX,
  Phone,
  MessageCircle,
  AlertCircle,
  CheckCircle,
  Clock,
  Save
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useWhatsappApi } from '@/lib/api/whatsapp'
import { useToast } from '@/components/ui/use-toast'

const ConsentFormSchema = z.object({
  customer_code: z.string().min(1, 'Customer code is required'),
  phone_number: z
    .string()
    .min(10, 'Valid phone number is required')
    .regex(/^\\+?[1-9]\\d{1,14}$/, 'Invalid phone number format'),
  opted_in: z.boolean(),
  consent_method: z.enum(['explicit', 'implicit']),
  notes: z.string().optional()
})

type ConsentFormData = z.infer<typeof ConsentFormSchema>

interface ChannelConsentProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  customerCode?: string | null
  onClose: () => void
}

export function ChannelConsent({
  open,
  onOpenChange,
  organizationId,
  customerCode,
  onClose
}: ChannelConsentProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [existingPrefs, setExistingPrefs] = React.useState<any>(null)

  const { getCustomerPrefs, setCustomerPrefs } = useWhatsappApi(organizationId)

  const form = useForm<ConsentFormData>({
    resolver: zodResolver(ConsentFormSchema),
    defaultValues: {
      customer_code: customerCode || '',
      phone_number: '',
      opted_in: false,
      consent_method: 'explicit',
      notes: ''
    }
  })

  const isEditMode = Boolean(customerCode)

  // Load existing preferences if editing
  React.useEffect(() => {
    if (open && customerCode) {
      loadExistingPrefs()
    } else if (open && !customerCode) {
      // Reset form for new customer
      form.reset({
        customer_code: '',
        phone_number: '',
        opted_in: false,
        consent_method: 'explicit',
        notes: ''
      })
      setExistingPrefs(null)
    }
  }, [open, customerCode])

  const loadExistingPrefs = async () => {
    if (!customerCode) return

    try {
      const prefs = await getCustomerPrefs(customerCode)
      if (prefs) {
        setExistingPrefs(prefs)
        form.reset({
          customer_code: customerCode,
          phone_number: prefs.phone_number || '',
          opted_in: prefs.opted_in || false,
          consent_method: (prefs.consent_method as 'explicit' | 'implicit') || 'explicit',
          notes: prefs.notes || ''
        })
      } else {
        // Customer exists but no WhatsApp preferences yet
        form.reset({
          customer_code: customerCode,
          phone_number: '',
          opted_in: false,
          consent_method: 'explicit',
          notes: ''
        })
      }
    } catch (error) {
      console.error('Failed to load existing preferences:', error)
    }
  }

  const onSubmit = async (data: ConsentFormData) => {
    setIsSubmitting(true)

    try {
      await setCustomerPrefs.mutateAsync({
        customerCode: data.customer_code,
        prefs: {
          opted_in: data.opted_in,
          channel: 'whatsapp',
          consent_ts: new Date().toISOString(),
          phone_number: data.phone_number,
          consent_method: data.consent_method,
          notes: data.notes
        }
      })

      toast({
        title: isEditMode ? 'Preferences Updated' : 'Customer Added',
        description: `WhatsApp preferences for ${data.customer_code} have been ${isEditMode ? 'updated' : 'saved'} successfully.`,
        variant: 'default'
      })

      onClose()
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save customer preferences',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  const getConsentStatus = () => {
    const optedIn = form.watch('opted_in')
    if (optedIn) {
      return {
        icon: <UserCheck className="h-4 w-4" />,
        text: 'Consent Granted',
        color: 'text-green-700 border-green-300 bg-green-50'
      }
    } else {
      return {
        icon: <UserX className="h-4 w-4" />,
        text: 'No Consent',
        color: 'text-red-700 border-red-300 bg-red-50'
      }
    }
  }

  const consentStatus = getConsentStatus()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            {isEditMode ? 'Edit Customer Preferences' : 'Add Customer Preferences'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? `Manage WhatsApp consent and preferences for customer ${customerCode}`
              : 'Add a new customer and configure their WhatsApp communication preferences'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer_code">Customer Code *</Label>
                <Input
                  id="customer_code"
                  {...form.register('customer_code')}
                  placeholder="CUST_001"
                  disabled={isEditMode}
                  className={isEditMode ? 'bg-gray-50 dark:bg-gray-800' : ''}
                />
                {form.formState.errors.customer_code && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.customer_code.message}
                  </p>
                )}
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
            </CardContent>
          </Card>

          {/* WhatsApp Consent */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp Consent
                </div>
                <Badge variant="outline" className={consentStatus.color}>
                  {consentStatus.icon}
                  {consentStatus.text}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Consent Switch */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="opted_in" className="font-medium">
                    Allow WhatsApp Messages
                  </Label>
                  <p className="text-sm ink-muted">
                    Customer consents to receive WhatsApp messages from your business
                  </p>
                </div>
                <Switch
                  id="opted_in"
                  checked={form.watch('opted_in')}
                  onCheckedChange={checked => form.setValue('opted_in', checked)}
                />
              </div>

              {/* Consent Method */}
              <div className="space-y-2">
                <Label htmlFor="consent_method">Consent Method</Label>
                <Select
                  value={form.watch('consent_method')}
                  onValueChange={(value: 'explicit' | 'implicit') =>
                    form.setValue('consent_method', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="explicit">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Explicit Consent
                      </div>
                    </SelectItem>
                    <SelectItem value="implicit">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-orange-600" />
                        Implicit Consent
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm ink-muted">
                  {form.watch('consent_method') === 'explicit'
                    ? 'Customer actively opted in (recommended for compliance)'
                    : 'Customer implied consent through prior business relationship'}
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  {...form.register('notes')}
                  placeholder="Additional consent details or context..."
                />
                <p className="text-sm ink-muted">
                  Record any additional context about the consent process
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Existing Preferences Summary */}
          {existingPrefs && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Current Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="ink-muted">Current Status</Label>
                    <p className="font-medium">
                      {existingPrefs.opted_in ? 'Opted In' : 'Opted Out'}
                    </p>
                  </div>
                  <div>
                    <Label className="ink-muted">Last Updated</Label>
                    <p className="font-medium">
                      {existingPrefs.consent_ts
                        ? new Date(existingPrefs.consent_ts).toLocaleDateString('en-AE')
                        : 'Never'}
                    </p>
                  </div>
                  <div>
                    <Label className="ink-muted">Phone Number</Label>
                    <p className="font-medium font-mono">
                      {existingPrefs.phone_number || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <Label className="ink-muted">Consent Method</Label>
                    <p className="font-medium">
                      {existingPrefs.consent_method === 'explicit'
                        ? 'Explicit'
                        : existingPrefs.consent_method === 'implicit'
                          ? 'Implicit'
                          : 'Not specified'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Compliance Notice */}
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium text-blue-800 dark:text-blue-200">
                  Data Protection & Compliance
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  • Customer consent is recorded with timestamp and method • All data is stored
                  securely using HERA's Sacred Six architecture • Customers can opt-out at any time
                  by replying "STOP" to messages • WhatsApp Business API compliance maintained
                  automatically
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </form>

        <Separator />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting || !form.watch('customer_code') || !form.watch('phone_number')}
          >
            {isSubmitting ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditMode ? 'Update Preferences' : 'Save Preferences'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
