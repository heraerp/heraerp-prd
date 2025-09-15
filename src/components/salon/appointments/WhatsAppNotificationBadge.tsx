'use client'

import React from 'react'
import { MessageCircle, Check, Clock, X, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface WhatsAppNotification {
  id: string
  type: 'confirmation' | 'reminder' | 'cancellation' | 'rescheduled'
  status: 'sent' | 'delivered' | 'failed' | 'pending'
  sentAt: Date
  phoneNumber: string
  messageId?: string
}

interface WhatsAppNotificationBadgeProps {
  notifications: WhatsAppNotification[]
  onResendNotification?: (notificationId: string) => void
  onViewHistory?: () => void
}

export function WhatsAppNotificationBadge({
  notifications,
  onResendNotification,
  onViewHistory
}: WhatsAppNotificationBadgeProps) {
  if (!notifications.length) return null

  const lastNotification = notifications[notifications.length - 1]
  const hasFailedNotifications = notifications.some(n => n.status === 'failed')
  const hasSuccessfulNotifications = notifications.some(
    n => n.status === 'sent' || n.status === 'delivered'
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <Check className="h-3 w-3 text-green-400" />
      case 'failed':
        return <X className="h-3 w-3 text-red-400" />
      case 'pending':
        return <Clock className="h-3 w-3 text-yellow-400" />
      default:
        return <AlertCircle className="h-3 w-3 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
      case 'failed':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
      default:
        return 'bg-muted text-gray-700 dark:bg-background/30 dark:text-muted-foreground border-border dark:border-gray-800'
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* WhatsApp notification badge */}
      <div className="flex items-center gap-1">
        <MessageCircle className="h-4 w-4 text-green-500" />
        <Badge variant="outline" className={cn('text-xs', getStatusColor(lastNotification.status))}>
          <span className="flex items-center gap-1">
            {getStatusIcon(lastNotification.status)}
            WhatsApp {lastNotification.type}
          </span>
        </Badge>
      </div>

      {/* Notification count if multiple */}
      {notifications.length > 1 && (
        <Badge variant="secondary" className="text-xs">
          {notifications.length} notifications
        </Badge>
      )}

      {/* Status indicators */}
      {hasSuccessfulNotifications && (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
          <span className="text-xs !text-muted-foreground dark:!text-muted-foreground">Sent</span>
        </div>
      )}

      {hasFailedNotifications && (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-400"></div>
          <span className="text-xs !text-muted-foreground dark:!text-muted-foreground">Failed</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-1">
        {hasFailedNotifications && onResendNotification && (
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
            onClick={() => onResendNotification(lastNotification.id)}
          >
            Retry
          </Button>
        )}

        {onViewHistory && (
          <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={onViewHistory}>
            History
          </Button>
        )}
      </div>
    </div>
  )
}

// WhatsApp notification history modal component
interface WhatsAppNotificationHistoryProps {
  isOpen: boolean
  onClose: () => void
  notifications: WhatsAppNotification[]
  appointmentId: string
}

export function WhatsAppNotificationHistory({
  isOpen,
  onClose,
  notifications,
  appointmentId
}: WhatsAppNotificationHistoryProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-xl shadow-2xl"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(31, 41, 55, 0.95) 0%, 
              rgba(17, 24, 39, 0.98) 100%
            )
          `,
          backdropFilter: 'blur(40px) saturate(150%)',
          WebkitBackdropFilter: 'blur(40px) saturate(150%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: `
            0 24px 48px rgba(0, 0, 0, 0.8),
            0 12px 24px rgba(147, 51, 234, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `
        }}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-6 h-6 text-green-500" />
              <h2 className="text-xl font-semibold !text-gray-900 dark:!text-foreground">
                WhatsApp Notifications
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-sm !text-muted-foreground dark:!text-muted-foreground mt-1">
            Appointment ID: {appointmentId}
          </p>
        </div>

        {/* Notifications list */}
        <div className="p-6">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="!text-muted-foreground dark:!text-muted-foreground">
                No WhatsApp notifications sent yet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className="p-4 rounded-lg bg-muted/30 border border-border/50"
                  style={{
                    backdropFilter: 'blur(10px) saturate(120%)',
                    WebkitBackdropFilter: 'blur(10px) saturate(120%)'
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(notification.status)}
                        <span className="font-medium !text-gray-900 dark:!text-foreground capitalize">
                          {notification.type} Notification
                        </span>
                        <Badge
                          variant="outline"
                          className={cn('text-xs', getStatusColor(notification.status))}
                        >
                          {notification.status}
                        </Badge>
                      </div>

                      <div className="text-sm !text-muted-foreground dark:!text-muted-foreground space-y-1">
                        <p>📱 To: {notification.phoneNumber}</p>
                        <p>📅 Sent: {format(notification.sentAt, 'MMM d, yyyy HH:mm')}</p>
                        {notification.messageId && <p>🆔 Message ID: {notification.messageId}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
