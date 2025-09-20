'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, Send } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Template {
  id: string
  name: string
  category: string
  language: string
  components: Array<{
    type: 'HEADER' | 'BODY' | 'FOOTER'
    text: string
    variables?: string[]
  }>
  smart_code: string
}

// Predefined templates following HERA smart codes
const templates: Template[] = [
  {
    id: 'appointment_confirm',
    name: 'Appointment Confirmation',
    category: 'TRANSACTIONAL',
    language: 'en',
    smart_code: 'HERA.SALON.APPT.CONFIRM.V1',
    components: [
      {
        type: 'HEADER',
        text: 'Appointment Confirmed ✅'
      },
      {
        type: 'BODY',
        text: 'Hi {{1}}, your {{2}} appointment is confirmed for {{3}} at {{4}} with {{5}}.',
        variables: ['name', 'service', 'date', 'time', 'stylist']
      },
      {
        type: 'FOOTER',
        text: 'Reply STOP to unsubscribe'
      }
    ]
  },
  {
    id: 'appointment_reminder',
    name: 'Appointment Reminder',
    category: 'TRANSACTIONAL',
    language: 'en',
    smart_code: 'HERA.SALON.APPT.REMINDER.V1',
    components: [
      {
        type: 'HEADER',
        text: 'Appointment Reminder 📅'
      },
      {
        type: 'BODY',
        text: 'Hi {{1}}, this is a reminder about your {{2}} appointment tomorrow at {{3}}.',
        variables: ['name', 'service', 'time']
      }
    ]
  },
  {
    id: 'service_reopen',
    name: 'Service Message',
    category: 'UTILITY',
    language: 'en',
    smart_code: 'HERA.SALON.SERVICE.REOPEN.V1',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, thank you for your message. How can we help you today?',
        variables: ['name']
      }
    ]
  },
  {
    id: 'feedback_request',
    name: 'Feedback Request',
    category: 'MARKETING',
    language: 'en',
    smart_code: 'HERA.SALON.FEEDBACK.V1',
    components: [
      {
        type: 'HEADER',
        text: 'We Value Your Feedback 💭'
      },
      {
        type: 'BODY',
        text: 'Hi {{1}}, how was your recent {{2}} experience on {{3}}? We would love to hear your feedback.',
        variables: ['name', 'service', 'date']
      }
    ]
  },
  {
    id: 'promotional_offer',
    name: 'Special Offer',
    category: 'MARKETING',
    language: 'en',
    smart_code: 'HERA.SALON.OFFER.REENGAGE.V1',
    components: [
      {
        type: 'HEADER',
        text: 'Exclusive Offer Just for You! 🎁'
      },
      {
        type: 'BODY',
        text: 'Hi {{1}}, enjoy 20% off on {{2}} this week! Book now to claim your discount.',
        variables: ['name', 'recommended_service']
      },
      {
        type: 'FOOTER',
        text: 'Valid until end of week. T&C apply.'
      }
    ]
  }
]

interface TemplateMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversationId: string
  customerName: string
  phoneNumber: string
  onSend: (template: any) => Promise<void>
}

export function TemplateMessageDialog({
  open,
  onOpenChange,
  conversationId,
  customerName,
  phoneNumber,
  onSend
}: TemplateMessageDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    setSelectedTemplate(template || null)

    // Initialize variables
    if (template) {
      const vars: Record<string, string> = {}
      template.components.forEach(component => {
        if (component.variables) {
          component.variables.forEach((v, index) => {
            if (v === 'name') {
              vars[`${component.type}_${index}`] = customerName
            } else {
              vars[`${component.type}_${index}`] = ''
            }
          })
        }
      })
      setVariables(vars)
    }
  }

  const handleSend = async () => {
    if (!selectedTemplate) return

    try {
      setSending(true)

      // Build template payload
      const templatePayload = {
        name: selectedTemplate.name,
        language: {
          code: selectedTemplate.language
        },
        components: selectedTemplate.components
          .filter(c => c.variables && c.variables.length > 0)
          .map(component => ({
            type: component.type,
            parameters: component.variables!.map((_, index) => ({
              type: 'text',
              text: variables[`${component.type}_${index}`] || ''
            }))
          }))
      }

      await onSend({
        template: templatePayload,
        smart_code: selectedTemplate.smart_code,
        category: selectedTemplate.category
      })

      onOpenChange(false)
      setSelectedTemplate(null)
      setVariables({})
    } catch (error) {
      console.error('Error sending template:', error)
    } finally {
      setSending(false)
    }
  }

  const renderPreview = () => {
    if (!selectedTemplate) return null

    return (
      <div className="bg-muted dark:bg-muted rounded-lg p-4 space-y-2">
        {selectedTemplate.components.map((component, idx) => {
          let text = component.text

          // Replace variables with actual values
          if (component.variables) {
            component.variables.forEach((_, index) => {
              const value = variables[`${component.type}_${index}`] || `{{${index + 1}}}`
              text = text.replace(`{{${index + 1}}}`, value)
            })
          }

          return (
            <div key={idx}>
              {component.type === 'HEADER' && <p className="font-semibold">{text}</p>}
              {component.type === 'BODY' && <p className="text-sm">{text}</p>}
              {component.type === 'FOOTER' && <p className="text-xs text-muted-foreground">{text}</p>}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Template Message</DialogTitle>
          <DialogDescription>
            Send a pre-approved template message to {customerName} ({phoneNumber})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Select Template</Label>
            <Select value={selectedTemplate?.id} onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a template..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="appointment_confirm">
                  Appointment Confirmation (Transactional)
                </SelectItem>
                <SelectItem value="appointment_reminder">
                  Appointment Reminder (Transactional)
                </SelectItem>
                <SelectItem value="service_reopen">Service Message (Utility)</SelectItem>
                <SelectItem value="feedback_request">Feedback Request (Marketing)</SelectItem>
                <SelectItem value="promotional_offer">Special Offer (Marketing)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Variables Input */}
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Template Variables</Label>
                {selectedTemplate.components.map(component =>
                  component.variables?.map((variable, index) => (
                    <div key={`${component.type}_${index}`} className="space-y-1">
                      <Label className="text-sm text-muted-foreground">
                        {variable.charAt(0).toUpperCase() + variable.slice(1)}
                      </Label>
                      {variable === 'name' ? (
                        <Input
                          value={variables[`${component.type}_${index}`] || ''}
                          onChange={e =>
                            setVariables({
                              ...variables,
                              [`${component.type}_${index}`]: e.target.value
                            })
                          }
                          placeholder={`Enter ${variable}`}
                          disabled
                        />
                      ) : variable.includes('service') || variable === 'stylist' ? (
                        <Select
                          value={variables[`${component.type}_${index}`] || ''}
                          onValueChange={value =>
                            setVariables({
                              ...variables,
                              [`${component.type}_${index}`]: value
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${variable}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {variable.includes('service') ? (
                              <>
                                <SelectItem value="Haircut">Haircut</SelectItem>
                                <SelectItem value="Hair Color">Hair Color</SelectItem>
                                <SelectItem value="Styling">Styling</SelectItem>
                                <SelectItem value="Treatment">Treatment</SelectItem>
                              </>
                            ) : (
                              <>
                                <SelectItem value="Sarah">Sarah</SelectItem>
                                <SelectItem value="Jessica">Jessica</SelectItem>
                                <SelectItem value="Maria">Maria</SelectItem>
                                <SelectItem value="Any Stylist">Any Stylist</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={variables[`${component.type}_${index}`] || ''}
                          onChange={e =>
                            setVariables({
                              ...variables,
                              [`${component.type}_${index}`]: e.target.value
                            })
                          }
                          placeholder={`Enter ${variable}`}
                          type={
                            variable.includes('date')
                              ? 'date'
                              : variable.includes('time')
                                ? 'time'
                                : 'text'
                          }
                        />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Message Preview</Label>
                {renderPreview()}
              </div>

              {/* Category Info */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This is a <strong>{selectedTemplate.category}</strong> template.
                  {selectedTemplate.category === 'MARKETING' &&
                    ' Customer must have opted-in to receive marketing messages.'}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={!selectedTemplate || sending}>
            <Send className="w-4 h-4 mr-2" />
            Send Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
