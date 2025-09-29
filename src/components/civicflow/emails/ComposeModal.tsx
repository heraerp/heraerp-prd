'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useSaveDraft, useSendEmail } from '@/hooks/civicflow/useEmails'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import {
  X,
  Send,
  Save,
  Paperclip,
  Type,
  Bold,
  Italic,
  Underline,
  Link,
  Image,
  Smile,
  Minimize2,
  Maximize2,
  Clock,
  Users,
  Tag,
  Sparkles
} from 'lucide-react'

interface ComposeModalProps {
  organizationId: string
  onClose: () => void
  onSent: () => void
  replyToId?: string
  forwardId?: string
  draftId?: string
}

interface EmailDraft {
  to: string[]
  cc: string[]
  bcc: string[]
  subject: string
  body_html: string
  body_text: string
  priority: 'urgent' | 'normal' | 'low'
  tags: string[]
  attachments: File[]
}

const AUTOSAVE_INTERVAL = 30000 // 30 seconds

export function ComposeModal({
  organizationId,
  onClose,
  onSent,
  replyToId,
  forwardId,
  draftId
}: ComposeModalProps) {
  const { toast } = useToast()
  const autosaveTimeoutRef = useRef<NodeJS.Timeout>()
  const [isMinimized, setIsMinimized] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const [draft, setDraft] = useState<EmailDraft>({
    to: [],
    cc: [],
    bcc: [],
    subject: '',
    body_html: '',
    body_text: '',
    priority: 'normal',
    tags: [],
    attachments: []
  })

  const [inputValues, setInputValues] = useState({
    to: '',
    cc: '',
    bcc: ''
  })

  const [showCc, setShowCc] = useState(false)
  const [showBcc, setShowBcc] = useState(false)

  const { mutateAsync: saveDraft, isPending: isSavingDraft } = useSaveDraft()
  const { mutateAsync: sendEmail, isPending: isSendingEmail } = useSendEmail()

  // Initialize draft from existing email for reply/forward
  useEffect(() => {
    if (replyToId || forwardId || draftId) {
      // Load existing email data
      // This would typically fetch the email data and populate the draft
    }
  }, [replyToId, forwardId, draftId])

  // Autosave functionality
  const performAutosave = useCallback(async () => {
    if (!draft.subject && !draft.body_text && draft.to.length === 0) {
      return // Don't save empty drafts
    }

    try {
      await saveDraft({
        organizationId,
        draft,
        draftId
      })
      setLastSaved(new Date())
    } catch (error) {
      console.error('Autosave failed:', error)
    }
  }, [draft, organizationId, saveDraft, draftId])

  // Setup autosave
  useEffect(() => {
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current)
    }

    autosaveTimeoutRef.current = setTimeout(performAutosave, AUTOSAVE_INTERVAL)

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current)
      }
    }
  }, [draft, performAutosave])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'enter':
            e.preventDefault()
            handleSend()
            break
          case 's':
            e.preventDefault()
            handleSaveDraft()
            break
          case 'escape':
            e.preventDefault()
            onClose()
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [draft])

  const parseEmailAddresses = (input: string): string[] => {
    return input
      .split(/[,;\s]+/)
      .map(email => email.trim())
      .filter(email => email.length > 0 && email.includes('@'))
  }

  const handleInputChange = (field: keyof typeof inputValues, value: string) => {
    setInputValues(prev => ({ ...prev, [field]: value }))

    // Parse email addresses on change
    const emails = parseEmailAddresses(value)
    setDraft(prev => ({ ...prev, [field]: emails }))
  }

  const handleDraftChange = (field: keyof EmailDraft, value: any) => {
    setDraft(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveDraft = async () => {
    try {
      await performAutosave()
      toast({
        title: 'Draft saved',
        description: 'Your email has been saved as a draft.'
      })
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Failed to save draft. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleSend = async () => {
    if (draft.to.length === 0) {
      toast({
        title: 'Missing recipients',
        description: 'Please add at least one recipient.',
        variant: 'destructive'
      })
      return
    }

    if (!draft.subject.trim()) {
      const confirmed = window.confirm('Send email without a subject?')
      if (!confirmed) return
    }

    setIsSending(true)

    try {
      // Convert File objects to base64
      const attachmentPromises = draft.attachments.map(async (file) => ({
        filename: file.name,
        content: await fileToBase64(file),
        type: file.type
      }))
      
      const attachments = await Promise.all(attachmentPromises)

      await sendEmail({
        organizationId,
        to: draft.to,
        cc: draft.cc,
        bcc: draft.bcc,
        subject: draft.subject,
        body_html: draft.body_html,
        body_text: draft.body_text,
        priority: draft.priority,
        tags: draft.tags,
        attachments
      })

      toast({
        title: 'Email sent',
        description: 'Your email has been sent successfully.'
      })

      onSent()
    } catch (error: any) {
      toast({
        title: 'Send failed',
        description: error.message || 'Failed to send email. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSending(false)
    }
  }

  // Helper function to convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        // Remove data URL prefix to get pure base64
        const base64 = (reader.result as string).split(',')[1]
        resolve(base64)
      }
      reader.onerror = error => reject(error)
    })
  }

  const handleAttachmentUpload = (files: FileList) => {
    const newFiles = Array.from(files)
    setDraft(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newFiles]
    }))
  }

  const removeAttachment = (index: number) => {
    setDraft(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-80 shadow-lg bg-panel border-border">
          <CardHeader className="p-3 bg-panel-alt">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm truncate text-text-100">
                {draft.subject || 'New Message'}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-text-300 hover:text-text-100 hover:bg-[rgb(0,166,166)]/10"
                  onClick={() => setIsMinimized(false)}
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-text-300 hover:text-text-100 hover:bg-[rgb(0,166,166)]/10"
                  onClick={onClose}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        isFullscreen ? 'p-0' : 'p-6'
      )}
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <Card
        className={cn(
          'relative bg-panel border-border shadow-2xl flex flex-col overflow-hidden',
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-4xl h-[85vh] rounded-lg'
        )}
      >
        {/* Header */}
        <CardHeader className="border-b border-border p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {replyToId ? 'Reply' : forwardId ? 'Forward' : 'New Message'}
            </CardTitle>

            <div className="flex items-center gap-2">
              {/* Autosave Status */}
              {lastSaved && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Saved {lastSaved.toLocaleTimeString()}
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setIsMinimized(true)}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>

              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex flex-col flex-1 overflow-hidden">
          {/* Recipients */}
          <div className="p-4 space-y-3 border-b border-border flex-shrink-0">
            {/* To Field */}
            <div className="flex items-center gap-3">
              <Label htmlFor="to" className="w-12 text-sm font-medium shrink-0">
                To:
              </Label>
              <Input
                id="to"
                value={inputValues.to}
                onChange={e => handleInputChange('to', e.target.value)}
                placeholder="Enter email addresses..."
                className="flex-1"
              />
              <div className="flex items-center gap-1">
                {!showCc && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCc(true)}
                    className="text-xs"
                  >
                    Cc
                  </Button>
                )}
                {!showBcc && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBcc(true)}
                    className="text-xs"
                  >
                    Bcc
                  </Button>
                )}
              </div>
            </div>

            {/* CC Field */}
            {showCc && (
              <div className="flex items-center gap-3">
                <Label htmlFor="cc" className="w-12 text-sm font-medium shrink-0">
                  Cc:
                </Label>
                <Input
                  id="cc"
                  value={inputValues.cc}
                  onChange={e => handleInputChange('cc', e.target.value)}
                  placeholder="Enter email addresses..."
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCc(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* BCC Field */}
            {showBcc && (
              <div className="flex items-center gap-3">
                <Label htmlFor="bcc" className="w-12 text-sm font-medium shrink-0">
                  Bcc:
                </Label>
                <Input
                  id="bcc"
                  value={inputValues.bcc}
                  onChange={e => handleInputChange('bcc', e.target.value)}
                  placeholder="Enter email addresses..."
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBcc(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Subject & Priority */}
            <div className="flex items-center gap-3">
              <Label htmlFor="subject" className="w-12 text-sm font-medium shrink-0">
                Subject:
              </Label>
              <Input
                id="subject"
                value={draft.subject}
                onChange={e => handleDraftChange('subject', e.target.value)}
                placeholder="Enter subject..."
                className="flex-1"
              />
              <Select
                value={draft.priority}
                onValueChange={value => handleDraftChange('priority', value)}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">🔴 Urgent</SelectItem>
                  <SelectItem value="normal">⚪ Normal</SelectItem>
                  <SelectItem value="low">🔵 Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Toolbar */}
          <div className="p-2 border-b border-border flex items-center gap-1 flex-shrink-0">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Bold className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Italic className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Underline className="h-4 w-4" />
              </Button>
              <div className="w-px h-4 bg-border mx-1" />
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Link className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Image className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Smile className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <input
                type="file"
                multiple
                onChange={e => e.target.files && handleAttachmentUpload(e.target.files)}
                className="hidden"
                id="attachment-upload"
              />
              <Label htmlFor="attachment-upload">
                <Button variant="ghost" size="sm" className="h-8 cursor-pointer" asChild>
                  <span>
                    <Paperclip className="h-4 w-4 mr-1" />
                    Attach
                  </span>
                </Button>
              </Label>

              <Button variant="ghost" size="sm" className="h-8">
                <Sparkles className="h-4 w-4 mr-1" />
                AI Assist
              </Button>
            </div>
          </div>

          {/* Attachments */}
          {draft.attachments.length > 0 && (
            <div className="p-3 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                {draft.attachments.map((file, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    <Paperclip className="h-3 w-3" />
                    {file.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Email Body */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            <Textarea
              value={draft.body_text}
              onChange={e => {
                handleDraftChange('body_text', e.target.value)
                handleDraftChange('body_html', e.target.value) // Simple text to HTML for now
              }}
              placeholder="Write your message..."
              className="w-full min-h-[200px] resize-none border-none focus-visible:ring-0 bg-transparent"
              style={{ height: 'auto' }}
            />
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border flex items-center justify-between flex-shrink-0 bg-panel">
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSend}
                disabled={isSending || draft.to.length === 0}
                className="bg-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/90 text-white flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {isSending ? 'Sending...' : 'Send'}
              </Button>

              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSavingDraft}
                className="border-[rgb(0,166,166)] text-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/10"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSavingDraft ? 'Saving...' : 'Save Draft'}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">Press ⌘+Enter to send • ⌘+S to save</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
