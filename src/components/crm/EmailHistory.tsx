/**
 * HERA CRM Email History Component
 * Shows email communication history with contacts
 *
 * Project Manager Task: Email Integration UI
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Mail,
  Clock,
  ChevronDown,
  ChevronUp,
  Send,
  Inbox,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  Reply,
  Forward,
  Archive
} from 'lucide-react'
import { createEmailService, EmailMessage } from '@/lib/crm/email-service'
import { CRMContact } from '@/lib/crm/production-api'

interface EmailHistoryProps {
  contact: CRMContact
  organizationId: string
  onComposeReply?: (contact: CRMContact, originalEmail?: EmailMessage) => void
}

export function EmailHistory({ contact, organizationId, onComposeReply }: EmailHistoryProps) {
  const [emailService] = useState(() => createEmailService(organizationId))
  const [emails, setEmails] = useState<EmailMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(new Set())

  // Load email history on mount
  useEffect(() => {
    loadEmailHistory()
  }, [contact.id])

  const loadEmailHistory = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const emailHistory = await emailService.getEmailHistory(contact.id)
      setEmails(emailHistory)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load email history')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleEmailExpansion = (emailId: string) => {
    setExpandedEmails(prev => {
      const newSet = new Set(prev)
      if (newSet.has(emailId)) {
        newSet.delete(emailId)
      } else {
        newSet.add(emailId)
      }
      return newSet
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Sent
          </Badge>
        )
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        )
      case 'sending':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Sending
          </Badge>
        )
      default:
        return <Badge variant="outline">Draft</Badge>
    }
  }

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-gray-400" />
          <p className="text-gray-600">Loading email history...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-8 text-center">
          <XCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadEmailHistory} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email History with {contact.name}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{emails.length} emails</Badge>
            <Button
              size="sm"
              onClick={() => onComposeReply?.(contact)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {emails.length === 0 ? (
          <div className="text-center py-12">
            <Inbox className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No email history</h3>
            <p className="text-gray-600 mb-4">
              Start a conversation with {contact.name} by sending your first email.
            </p>
            <Button onClick={() => onComposeReply?.(contact)}>
              <Send className="h-4 w-4 mr-2" />
              Send First Email
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {emails.map(email => {
              const isExpanded = expandedEmails.has(email.id || '')

              return (
                <Card key={email.id} className="border border-gray-200">
                  <CardContent className="p-0">
                    {/* Email Header */}
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleEmailExpansion(email.id || '')}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm">{email.subject}</span>
                              {getStatusBadge(email.status || 'draft')}
                            </div>

                            <div className="flex items-center gap-4 text-xs text-gray-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(email.sentAt || '')}
                              </span>
                              <span>To: {email.to.join(', ')}</span>
                              {email.cc && email.cc.length > 0 && (
                                <span>CC: {email.cc.join(', ')}</span>
                              )}
                            </div>

                            {!isExpanded && (
                              <p className="text-sm text-gray-600 mt-2">
                                {truncateText(email.body)}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Email Content */}
                    {isExpanded && (
                      <div className="border-t bg-gray-50">
                        <div className="p-4">
                          {/* Email Metadata */}
                          <div className="bg-white p-3 rounded-lg border mb-4 text-xs text-gray-600">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <strong>From:</strong> Your Organization
                              </div>
                              <div>
                                <strong>To:</strong> {email.to.join(', ')}
                              </div>
                              {email.cc && email.cc.length > 0 && (
                                <>
                                  <div>
                                    <strong>CC:</strong> {email.cc.join(', ')}
                                  </div>
                                  <div></div>
                                </>
                              )}
                              <div>
                                <strong>Date:</strong>{' '}
                                {new Date(email.sentAt || '').toLocaleString()}
                              </div>
                              <div>
                                <strong>Status:</strong> {email.status}
                              </div>
                            </div>
                          </div>

                          {/* Email Body */}
                          <div className="bg-white p-4 rounded-lg border">
                            <div className="whitespace-pre-wrap text-sm">{email.body}</div>
                          </div>

                          {/* Email Actions */}
                          <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onComposeReply?.(contact, email)}
                            >
                              <Reply className="h-3 w-3 mr-2" />
                              Reply
                            </Button>
                            <Button size="sm" variant="outline">
                              <Forward className="h-3 w-3 mr-2" />
                              Forward
                            </Button>
                            <Button size="sm" variant="outline">
                              <Archive className="h-3 w-3 mr-2" />
                              Archive
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
