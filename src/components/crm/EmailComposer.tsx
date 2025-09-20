/**
 * HERA CRM Email Composer Component
 * Professional email composition with templates and contact integration
 *
 * Project Manager Task: Email Integration UI
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Mail,
  Send,
  Save,
  X,
  User,
  Building,
  Paperclip,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye
} from 'lucide-react'
import { createEmailService, EmailMessage, EmailTemplate } from '@/lib/crm/email-service'
import { CRMContact } from '@/lib/crm/production-api'

interface EmailComposerProps {
  contact?: CRMContact
  isOpen: boolean
  onClose: () => void
  organizationId: string
  onEmailSent?: (emailId: string) => void
}

export function EmailComposer({
  contact,
  isOpen,
  onClose,
  organizationId,
  onEmailSent
}: EmailComposerProps) {
  const [emailService] = useState(() => createEmailService(organizationId))
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [sendResult, setSendResult] = useState<{
    success: boolean
    messageId?: string
    error?: string
  } | null>(null)

  // Email form state
  const [emailData, setEmailData] = useState<Partial<EmailMessage>>({
    to: contact ? [contact.email] : [],
    cc: [],
    bcc: [],
    subject: '',
    body: '',
    isHTML: false,
    contactId: contact?.id
  })

  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({})

  // Load email templates on mount
  useEffect(() => {
    if (isOpen) {
      loadEmailTemplates()
      // Pre-fill contact info if provided
      if (contact) {
        setEmailData(prev => ({
          ...prev,
          to: [contact.email],
          contactId: contact.id
        }))
        // Set default template variables
        setTemplateVariables({
          contact_name: contact.name,
          company_name: contact.company,
          sender_name: 'Your Name' // TODO: Get from user profile
        })
      }
    }
  }, [isOpen, contact])

  // Load email templates
  const loadEmailTemplates = async () => {
    setIsLoadingTemplates(true)
    try {
      const templateList = await emailService.getEmailTemplates()
      setTemplates(templateList)
    } catch (error) {
      console.error('Error loading email templates:', error)
    } finally {
      setIsLoadingTemplates(false)
    }
  }

  // Apply email template
  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (!template) return

    const processed = emailService.processTemplate(template, templateVariables)
    setEmailData(prev => ({
      ...prev,
      subject: processed.subject,
      body: processed.body
    }))
  }

  // Send email
  const handleSendEmail = async () => {
    if (!emailData.to?.length || !emailData.subject || !emailData.body) {
      setSendResult({ success: false, error: 'Please fill in all required fields' })
      return
    }

    setIsSending(true)
    setSendResult(null)

    try {
      const result = await emailService.sendEmail({
        ...emailData,
        organizationId,
        to: emailData.to || [],
        subject: emailData.subject || '',
        body: emailData.body || ''
      } as EmailMessage)

      setSendResult(result)

      if (result.success) {
        onEmailSent?.(result.messageId || '')
        // Auto-close after 2 seconds on success
        setTimeout(() => {
          onClose()
          // Reset form
          setEmailData({
            to: [],
            cc: [],
            bcc: [],
            subject: '',
            body: '',
            isHTML: false
          })
        }, 2000)
      }
    } catch (error) {
      setSendResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email'
      })
    } finally {
      setIsSending(false)
    }
  }

  // Save as draft (TODO: Implement draft functionality)
  const handleSaveDraft = async () => {
    console.log('Save draft functionality to be implemented')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-background bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Compose Email
              {contact && (
                <Badge variant="outline" className="ml-2">
                  To: {contact.name}
                </Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Contact Information */}
          {contact && (
            <Card className="bg-muted border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {contact.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {contact.name}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      {contact.company}
                    </p>
                    <p className="text-sm text-muted-foreground">{contact.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Email Templates */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-medium">Email Templates</Label>
              {isLoadingTemplates && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            <Select
              value={selectedTemplate}
              onValueChange={value => {
                setSelectedTemplate(value)
                applyTemplate(value)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{template.name}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {template.category}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Email Form */}
          <div className="space-y-4">
            {/* Recipients */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="to">To *</Label>
                <Input
                  id="to"
                  value={emailData.to?.join(', ') || ''}
                  onChange={e =>
                    setEmailData(prev => ({
                      ...prev,
                      to: e.target.value
                        .split(',')
                        .map(email => email.trim())
                        .filter(Boolean)
                    }))
                  }
                  placeholder="recipient@example.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="cc">CC</Label>
                <Input
                  id="cc"
                  value={emailData.cc?.join(', ') || ''}
                  onChange={e =>
                    setEmailData(prev => ({
                      ...prev,
                      cc: e.target.value
                        .split(',')
                        .map(email => email.trim())
                        .filter(Boolean)
                    }))
                  }
                  placeholder="cc@example.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="bcc">BCC</Label>
                <Input
                  id="bcc"
                  value={emailData.bcc?.join(', ') || ''}
                  onChange={e =>
                    setEmailData(prev => ({
                      ...prev,
                      bcc: e.target.value
                        .split(',')
                        .map(email => email.trim())
                        .filter(Boolean)
                    }))
                  }
                  placeholder="bcc@example.com"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={emailData.subject || ''}
                onChange={e => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter email subject"
                className="mt-1"
              />
            </div>

            {/* Message Body */}
            <div>
              <Label htmlFor="body">Message *</Label>
              <Textarea
                id="body"
                value={emailData.body || ''}
                onChange={e => setEmailData(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Write your message here..."
                rows={12}
                className="mt-1 font-mono text-sm"
              />
            </div>

            {/* Attachments (Future Feature) */}
            <div>
              <Label className="text-muted-foreground">Attachments (Coming Soon)</Label>
              <div className="mt-1 p-4 border-2 border-dashed border-border rounded-lg text-center text-muted-foreground">
                <Paperclip className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">File attachments will be available in the next release</p>
              </div>
            </div>
          </div>

          {/* Send Result */}
          {sendResult && (
            <Card
              className={`border ${sendResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  {sendResult.success ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800">Email sent successfully!</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <span className="font-medium text-red-800">Failed to send email</span>
                    </>
                  )}
                </div>
                {sendResult.messageId && (
                  <p className="text-sm text-green-600 mt-1">Message ID: {sendResult.messageId}</p>
                )}
                {sendResult.error && (
                  <p className="text-sm text-red-600 mt-1">{sendResult.error}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleSaveDraft}>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={
                  isSending || !emailData.to?.length || !emailData.subject || !emailData.body
                }
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Email History Preview */}
          {contact && (
            <Card className="bg-muted">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Previous Emails with {contact.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Email history will be displayed here in the next update
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
