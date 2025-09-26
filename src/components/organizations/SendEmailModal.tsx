import { useState, useEffect } from 'react'
import { useOrgStore } from '@/state/org'
import { useOrgContacts } from '@/hooks/use-organizations'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Mail, Send, Paperclip, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { OrgProfile, OrgContact } from '@/types/organizations'

interface SendEmailModalProps {
  organization: OrgProfile
  onClose: () => void
}

const EMAIL_TEMPLATES = [
  { value: 'custom', label: 'Custom Email' },
  { value: 'ORGANIZATION_WELCOME', label: 'Welcome Email' },
  { value: 'EVENT_INVITATION', label: 'Event Invitation' },
  { value: 'GRANT_UPDATE', label: 'Grant Update' }
]

export default function SendEmailModal({ organization, onClose }: SendEmailModalProps) {
  const { currentOrgId } = useOrgStore()
  const { data: contactsData, isLoading: contactsLoading } = useOrgContacts(organization.id)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('custom')
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [emailForm, setEmailForm] = useState({
    subject: '',
    content: '',
    replyTo: '',
    cc: '',
    bcc: ''
  })
  const [templateData, setTemplateData] = useState<Record<string, string>>({
    organization_name: organization.entity_name,
    contact_name: ''
  })

  const contacts = contactsData?.data || []

  // Get email addresses for selected contacts
  const getRecipientEmails = () => {
    if (selectedContacts.includes('all')) {
      return contacts.filter(c => c.email).map(c => c.email)
    }
    return contacts.filter(c => selectedContacts.includes(c.id) && c.email).map(c => c.email)
  }

  const handleSendEmail = async () => {
    const recipients = getRecipientEmails()

    if (recipients.length === 0) {
      toast.error('Please select at least one contact with an email address')
      return
    }

    if (selectedTemplate === 'custom' && (!emailForm.subject || !emailForm.content)) {
      toast.error('Please enter a subject and message')
      return
    }

    setIsLoading(true)

    try {
      const payload: any = {
        recipients: recipients.length === 1 ? recipients[0] : recipients
      }

      if (selectedTemplate === 'custom') {
        payload.action = recipients.length > 1 ? 'sendBatch' : 'send'
        payload.subject = emailForm.subject
        payload.content = emailForm.content
        payload.contentType = 'text'
      } else {
        payload.action = 'sendTemplate'
        payload.template = selectedTemplate
        payload.templateData = templateData
      }

      if (emailForm.replyTo) payload.replyTo = emailForm.replyTo
      if (emailForm.cc) payload.cc = emailForm.cc.split(',').map(e => e.trim())
      if (emailForm.bcc) payload.bcc = emailForm.bcc.split(',').map(e => e.trim())

      // If sending to individual contacts, include their IDs
      if (
        recipients.length === 1 &&
        selectedContacts.length === 1 &&
        selectedContacts[0] !== 'all'
      ) {
        payload.constituentId = selectedContacts[0]
      }

      const response = await fetch('/api/civicflow/communications/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': currentOrgId || '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email')
      }

      toast.success(`Email sent successfully to ${recipients.length} recipient(s)`)
      onClose()
    } catch (error) {
      console.error('Error sending email:', error)
      toast.error((error as Error).message || 'Failed to send email')
    } finally {
      setIsLoading(false)
    }
  }

  const handleContactToggle = (contactId: string) => {
    if (contactId === 'all') {
      setSelectedContacts(selectedContacts.includes('all') ? [] : ['all'])
    } else {
      setSelectedContacts(prev => {
        const filtered = prev.filter(id => id !== 'all')
        if (filtered.includes(contactId)) {
          return filtered.filter(id => id !== contactId)
        }
        return [...filtered, contactId]
      })
    }
  }

  const emailContacts = contacts.filter(c => c.email)

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Email to {organization.entity_name}
          </DialogTitle>
          <DialogDescription>Compose and send an email to organization contacts.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Contact Selection */}
          <div className="space-y-2">
            <Label>Recipients</Label>
            {contactsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : emailContacts.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No contacts with email addresses found for this organization.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                <label className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedContacts.includes('all')}
                    onChange={() => handleContactToggle('all')}
                    className="rounded border-gray-300"
                  />
                  <span className="font-medium">Select All ({emailContacts.length})</span>
                </label>
                {emailContacts.map(contact => (
                  <label
                    key={contact.id}
                    className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={
                        selectedContacts.includes('all') || selectedContacts.includes(contact.id)
                      }
                      onChange={() => handleContactToggle(contact.id)}
                      disabled={selectedContacts.includes('all')}
                      className="rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <p className="font-medium">
                        {contact.constituent_name}
                        {contact.is_primary && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Primary
                          </Badge>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {contact.role} • {contact.email}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <Label htmlFor="template">Email Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger id="template">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EMAIL_TEMPLATES.map(template => (
                  <SelectItem key={template.value} value={template.value}>
                    {template.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Email Fields */}
          {selectedTemplate === 'custom' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject*</Label>
                <Input
                  id="subject"
                  value={emailForm.subject}
                  onChange={e => setEmailForm({ ...emailForm, subject: e.target.value })}
                  placeholder="Enter email subject"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Message*</Label>
                <Textarea
                  id="content"
                  value={emailForm.content}
                  onChange={e => setEmailForm({ ...emailForm, content: e.target.value })}
                  placeholder="Enter your message"
                  rows={6}
                />
              </div>
            </>
          ) : (
            <Alert>
              <AlertDescription>
                This template will be personalized with organization details.
              </AlertDescription>
            </Alert>
          )}

          {/* Additional Fields */}
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium">Additional Options</summary>
            <div className="mt-3 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="replyTo">Reply To</Label>
                <Input
                  id="replyTo"
                  type="email"
                  value={emailForm.replyTo}
                  onChange={e => setEmailForm({ ...emailForm, replyTo: e.target.value })}
                  placeholder="reply@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cc">CC (comma separated)</Label>
                <Input
                  id="cc"
                  value={emailForm.cc}
                  onChange={e => setEmailForm({ ...emailForm, cc: e.target.value })}
                  placeholder="cc1@example.com, cc2@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bcc">BCC (comma separated)</Label>
                <Input
                  id="bcc"
                  value={emailForm.bcc}
                  onChange={e => setEmailForm({ ...emailForm, bcc: e.target.value })}
                  placeholder="bcc1@example.com, bcc2@example.com"
                />
              </div>
            </div>
          </details>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSendEmail}
            disabled={isLoading || emailContacts.length === 0 || selectedContacts.length === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
