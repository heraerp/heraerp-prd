'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { formatDistanceToNow, format } from 'date-fns'
import {
  Star,
  Paperclip,
  Reply,
  Forward,
  MoreHorizontal,
  Flag,
  Archive,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'

export type EmailFolder = 'inbox' | 'outbox' | 'drafts' | 'sent' | 'trash'

export interface Email {
  id: string
  subject: string
  from: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  body_html?: string
  body_text: string
  direction: 'in' | 'out'
  status: 'draft' | 'queued' | 'sent' | 'delivered' | 'failed' | 'read' | 'unread'
  priority: 'urgent' | 'normal' | 'low'
  thread_id?: string
  tags: string[]
  has_attachments: boolean
  is_starred: boolean
  created_at: string
  updated_at: string
}

interface EmailListProps {
  emails: Email[]
  selectedEmailId: string | null
  onEmailSelect: (emailId: string) => void
  folder: EmailFolder
}

export function EmailList({ emails, selectedEmailId, onEmailSelect, folder }: EmailListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedIds(new Set(emails.map(email => email.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectEmail = (emailId: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(emailId)
    } else {
      newSelected.delete(emailId)
    }
    setSelectedIds(newSelected)
    setSelectAll(newSelected.size === emails.length)
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="h-3 w-3 text-red-500" />
      case 'low':
        return <Info className="h-3 w-3 text-blue-500" />
      default:
        return null
    }
  }

  const getStatusIcon = (status: string, direction: string) => {
    if (direction === 'out') {
      switch (status) {
        case 'queued':
          return <Clock className="h-3 w-3 text-orange-500" />
        case 'sent':
        case 'delivered':
          return <CheckCircle className="h-3 w-3 text-green-500" />
        case 'failed':
          return <AlertCircle className="h-3 w-3 text-red-500" />
        default:
          return null
      }
    }
    return null
  }

  const formatSender = (email: Email): string => {
    if (email.direction === 'out') {
      return email.to.length > 0 ? email.to[0] : 'Unknown'
    }
    return email.from
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return format(date, 'h:mm a')
    } else if (diffInHours < 168) {
      // 7 days
      return format(date, 'EEE')
    } else {
      return format(date, 'MMM d')
    }
  }

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-4xl mb-4">📭</div>
        <h3 className="text-lg font-medium mb-2">No emails</h3>
        <p className="text-muted-foreground text-sm">
          {folder === 'inbox' && 'No messages in your inbox'}
          {folder === 'outbox' && 'No messages queued to send'}
          {folder === 'drafts' && 'No draft messages'}
          {folder === 'sent' && 'No sent messages'}
          {folder === 'trash' && 'Trash is empty'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Bulk Actions Header */}
      {selectedIds.size > 0 && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-b">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-900 dark:text-blue-100">
              {selectedIds.size} selected
            </span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm">
                <Archive className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Flag className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Select All Header */}
      <div className="p-3 border-b border-border bg-muted">
        <div className="flex items-center gap-3">
          <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} />
          <span className="text-sm text-muted-foreground">{emails.length} emails</span>
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto">
        {emails.map(email => {
          const isSelected = selectedIds.has(email.id)
          const isActive = selectedEmailId === email.id
          const isUnread = email.status === 'unread'

          return (
            <div
              key={email.id}
              className={cn(
                'border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer',
                isActive && 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700',
                isUnread && 'bg-white dark:bg-gray-900'
              )}
              onClick={() => onEmailSelect(email.id)}
            >
              <div className="p-3">
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={checked => handleSelectEmail(email.id, !!checked)}
                    onClick={e => e.stopPropagation()}
                  />

                  {/* Star */}
                  <button
                    className="mt-0.5"
                    onClick={e => {
                      e.stopPropagation()
                      // Handle star toggle
                    }}
                  >
                    <Star
                      className={cn(
                        'h-4 w-4',
                        email.is_starred
                          ? 'text-yellow-500 fill-current'
                          : 'text-gray-300 hover:text-gray-400'
                      )}
                    />
                  </button>

                  {/* Email Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'text-sm truncate max-w-32',
                            isUnread
                              ? 'font-semibold text-gray-900 dark:text-gray-100'
                              : 'font-normal text-gray-600 dark:text-gray-400'
                          )}
                        >
                          {formatSender(email)}
                        </span>

                        {/* Priority & Status Icons */}
                        <div className="flex items-center gap-1">
                          {getPriorityIcon(email.priority)}
                          {getStatusIcon(email.status, email.direction)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {email.has_attachments && <Paperclip className="h-3 w-3 ink-muted" />}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(email.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="mb-1">
                      <span
                        className={cn(
                          'text-sm',
                          isUnread
                            ? 'font-medium text-gray-900 dark:text-gray-100'
                            : 'font-normal text-gray-600 dark:text-gray-400'
                        )}
                      >
                        {truncateText(email.subject || '(no subject)', 40)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground truncate max-w-48">
                        {truncateText(email.body_text, 60)}
                      </p>

                      {/* Tags */}
                      {email.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          {email.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5">
                              {tag}
                            </Badge>
                          ))}
                          {email.tags.length > 2 && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                              +{email.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={e => {
                        e.stopPropagation()
                        // Handle reply
                      }}
                    >
                      <Reply className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={e => {
                        e.stopPropagation()
                        // Handle more actions
                      }}
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
