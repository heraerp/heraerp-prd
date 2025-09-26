'use client'

import { useState } from 'react'
import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { format, formatDistanceToNow } from 'date-fns'
import { Email } from './EmailList'
import {
  Reply,
  ReplyAll,
  Forward,
  Star,
  Archive,
  Trash2,
  Flag,
  MoreHorizontal,
  Paperclip,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  Tag,
  Eye,
  EyeOff,
  Download,
  Print
} from 'lucide-react'

interface EmailViewProps {
  email: Email
  onReply: () => void
  onReplyAll?: () => void
  onForward: () => void
  onDelete: () => void
  onMove: (folder: string) => void
  onToggleStar?: () => void
  onToggleFlag?: () => void
}

interface EmailThread {
  id: string
  emails: Email[]
  subject: string
  participants: string[]
}

export function EmailView({
  email,
  onReply,
  onReplyAll,
  onForward,
  onDelete,
  onMove,
  onToggleStar,
  onToggleFlag
}: EmailViewProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showRawEmail, setShowRawEmail] = useState(false)

  const getInitials = (name: string): string => {
    if (name.includes('@')) {
      return name.split('@')[0].slice(0, 2).toUpperCase()
    }
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatEmailAddress = (address: string): { name: string; email: string } => {
    if (address.includes('<') && address.includes('>')) {
      const matches = address.match(/^(.+)<(.+)>$/)
      if (matches) {
        return { name: matches[1].trim(), email: matches[2].trim() }
      }
    }
    return { name: address, email: address }
  }

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-900/30'
      case 'low':
        return 'text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30'
      default:
        return 'text-text-200 bg-gray-100 dark:text-text-200 dark:bg-gray-800'
    }
  }

  const getStatusDisplay = (status: string, direction: string) => {
    if (direction === 'out') {
      switch (status) {
        case 'queued':
          return { icon: Clock, text: 'Queued', color: 'text-orange-500' }
        case 'sent':
          return { icon: CheckCircle, text: 'Sent', color: 'text-green-500' }
        case 'delivered':
          return { icon: CheckCircle, text: 'Delivered', color: 'text-green-600' }
        case 'failed':
          return { icon: AlertCircle, text: 'Failed', color: 'text-red-500' }
        default:
          return null
      }
    }
    return null
  }

  const statusDisplay = getStatusDisplay(email.status, email.direction)
  const sender = formatEmailAddress(email.from)
  const recipients = email.to.map(formatEmailAddress)

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header Actions */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onReply}>
              <Reply className="h-4 w-4 mr-2" />
              Reply
            </Button>
            {email.to.length > 1 && (
              <Button variant="ghost" size="sm" onClick={onReplyAll}>
                <ReplyAll className="h-4 w-4 mr-2" />
                Reply All
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onForward}>
              <Forward className="h-4 w-4 mr-2" />
              Forward
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onToggleStar}>
              <Star
                className={cn(
                  'h-4 w-4',
                  email.is_starred ? 'text-yellow-500 fill-current' : 'text-gray-400'
                )}
              />
            </Button>

            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onToggleFlag}>
              <Flag className="h-4 w-4 text-gray-400" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onMove('archive')}
            >
              <Archive className="h-4 w-4 text-gray-400" />
            </Button>

            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-gray-400" />
            </Button>

            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Print className="h-4 w-4 text-gray-400" />
            </Button>

            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        </div>

        {/* Email Metadata */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(email.created_at), "MMM d, yyyy 'at' h:mm a")}
          </div>

          {statusDisplay && (
            <div className={cn('flex items-center gap-1', statusDisplay.color)}>
              {React.createElement(statusDisplay.icon, { className: 'h-3 w-3' })}
              {statusDisplay.text}
            </div>
          )}

          {email.priority !== 'normal' && (
            <Badge className={getPriorityColor(email.priority)}>
              {email.priority.charAt(0).toUpperCase() + email.priority.slice(1)}
            </Badge>
          )}

          {email.tags.length > 0 && (
            <div className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              <div className="flex gap-1">
                {email.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {email.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{email.tags.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Email Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Email Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-2xl font-semibold text-text-100">
                {email.subject || '(no subject)'}
              </h1>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-xs text-text-300"
              >
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                {isExpanded ? 'Collapse' : 'Expand'}
              </Button>
            </div>

            {/* Participants */}
            <div className="space-y-3">
              {/* From */}
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">{getInitials(sender.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-100">
                      {sender.name}
                    </span>
                    {sender.email !== sender.name && (
                      <span className="text-sm text-text-300">&lt;{sender.email}&gt;</span>
                    )}
                  </div>
                  <div className="text-xs text-text-300">
                    {formatDistanceToNow(new Date(email.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>

              {/* Recipients (when expanded) */}
              {isExpanded && (
                <>
                  <div className="text-sm text-text-300">
                    <span className="font-medium">To: </span>
                    {recipients.map((recipient, index) => (
                      <span key={index}>
                        {recipient.name}
                        {recipient.email !== recipient.name && ` <${recipient.email}>`}
                        {index < recipients.length - 1 && ', '}
                      </span>
                    ))}
                  </div>

                  {email.cc && email.cc.length > 0 && (
                    <div className="text-sm text-text-300">
                      <span className="font-medium">Cc: </span>
                      {email.cc.join(', ')}
                    </div>
                  )}

                  {email.bcc && email.bcc.length > 0 && (
                    <div className="text-sm text-text-300">
                      <span className="font-medium">Bcc: </span>
                      {email.bcc.join(', ')}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <Separator className="mb-6" />

          {/* Attachments */}
          {email.has_attachments && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Paperclip className="h-4 w-4 text-text-300" />
                <span className="text-sm font-medium">Attachments</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {/* Mock attachments - in real app, this would come from API */}
                <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-300">
                      PDF
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">document.pdf</div>
                    <div className="text-xs text-text-300">2.3 MB</div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Email Body */}
          <div className="prose dark:prose-invert max-w-none">
            {email.body_html ? (
              <div
                dangerouslySetInnerHTML={{ __html: email.body_html }}
                className="text-text-100"
              />
            ) : (
              <div className="whitespace-pre-wrap text-text-100">
                {email.body_text}
              </div>
            )}
          </div>

          {/* Raw Email Toggle */}
          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRawEmail(!showRawEmail)}
              className="text-xs text-text-300"
            >
              {showRawEmail ? (
                <EyeOff className="h-3 w-3 mr-1" />
              ) : (
                <Eye className="h-3 w-3 mr-1" />
              )}
              {showRawEmail ? 'Hide' : 'Show'} raw email
            </Button>

            {showRawEmail && (
              <Card className="mt-3">
                <CardContent className="p-4">
                  <pre className="text-xs text-text-300 whitespace-pre-wrap">
                    {JSON.stringify(email, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Footer */}
      <div className="p-4 border-t border-border bg-muted">
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" onClick={onReply}>
            <Reply className="h-4 w-4 mr-2" />
            Reply
          </Button>
          <Button variant="outline" size="sm" onClick={onForward}>
            <Forward className="h-4 w-4 mr-2" />
            Forward
          </Button>
        </div>
      </div>
    </div>
  )
}
