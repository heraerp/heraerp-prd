'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Check, CheckCheck, Clock, AlertCircle, Send, Smartphone } from 'lucide-react'
import { formatDate } from '@/lib/date-utils'

interface StatusHistoryItem {
  status: string
  timestamp: string
  error?: any
}

interface MessageStatusHistoryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  messageId: string
  statusHistory?: StatusHistoryItem[]
  currentStatus?: string
}

export function MessageStatusHistory({
  open,
  onOpenChange,
  messageId,
  statusHistory = [],
  currentStatus
}: MessageStatusHistoryProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued':
        return <Clock className="w-5 h-5 text-muted-foreground" />
      case 'sent':
        return <Send className="w-5 h-5 text-blue-400" />
      case 'delivered':
        return <Smartphone className="w-5 h-5 text-green-400" />
      case 'read':
        return <CheckCheck className="w-5 h-5 text-blue-500" />
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'read':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-muted text-gray-200 dark:bg-background/20 dark:text-muted-foreground'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDate(new Date(timestamp), 'dd MMM yyyy HH:mm:ss')
    } catch {
      return timestamp
    }
  }

  // Add a default status if no history
  const displayHistory =
    statusHistory.length > 0
      ? statusHistory
      : [{ status: currentStatus || 'pending', timestamp: new Date().toISOString() }]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Message Delivery Status</DialogTitle>
          <DialogDescription>
            Track the delivery progress of your WhatsApp message
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Status */}
          <div className="bg-muted dark:bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Status</span>
              <Badge className={getStatusColor(currentStatus || 'pending')}>
                {currentStatus || 'pending'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Message ID: {messageId.slice(0, 20)}...</p>
          </div>

          {/* Status Timeline */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Status Timeline</h4>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-2.5 top-5 bottom-0 w-0.5 bg-gray-700 dark:bg-muted-foreground/10" />

              {/* Status items */}
              <div className="space-y-4">
                {displayHistory.map((item, index) => (
                  <div key={index} className="relative flex items-start gap-4">
                    {/* Status icon with background */}
                    <div className="relative z-10 bg-background dark:bg-background p-0.5">
                      {getStatusIcon(item.status)}
                    </div>

                    {/* Status details */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">{item.status}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(item.timestamp)}
                        </span>
                      </div>

                      {/* Error details if failed */}
                      {item.error && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-600 dark:text-red-400">
                          <p className="font-medium">Error Details:</p>
                          <p className="mt-1">{JSON.stringify(item.error, null, 2)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Status explanations */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <p className="text-xs text-blue-800 dark:text-blue-300 font-medium mb-2">
              Status Definitions:
            </p>
            <div className="space-y-1 text-xs text-blue-700 dark:text-blue-400">
              <p>
                • <strong>Sent:</strong> Message sent to WhatsApp servers
              </p>
              <p>
                • <strong>Delivered:</strong> Message delivered to recipient's device
              </p>
              <p>
                • <strong>Read:</strong> Recipient has read the message
              </p>
              <p>
                • <strong>Failed:</strong> Message delivery failed
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
