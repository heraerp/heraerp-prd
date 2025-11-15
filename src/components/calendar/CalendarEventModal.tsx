'use client'

import React from 'react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CalendarItem } from '@/types/calendar'
import { Calendar, Clock, MapPin, Users, FileText, ExternalLink, Edit, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CalendarEventModalProps {
  item: CalendarItem | null
  isOpen: boolean
  onClose: () => void
}

const SOURCE_CONFIGS = {
  grants: {
    color: 'bg-blue-500',
    lightColor: 'bg-blue-100 text-blue-700',
    viewPath: '/civicflow/grants',
    editPath: '/civicflow/grants'
  },
  cases: {
    color: 'bg-green-500',
    lightColor: 'bg-green-100 text-green-700',
    viewPath: '/civicflow/cases',
    editPath: '/civicflow/cases'
  },
  playbooks: {
    color: 'bg-purple-500',
    lightColor: 'bg-purple-100 text-purple-700',
    viewPath: '/civicflow/playbooks',
    editPath: '/civicflow/playbooks'
  },
  payments: {
    color: 'bg-yellow-500',
    lightColor: 'bg-yellow-100 text-yellow-700',
    viewPath: '/civicflow/payments',
    editPath: '/civicflow/payments'
  },
  consultations: {
    color: 'bg-pink-500',
    lightColor: 'bg-pink-100 text-pink-700',
    viewPath: '/civicflow/consultations',
    editPath: '/civicflow/consultations'
  }
}

export function CalendarEventModal({ item, isOpen, onClose }: CalendarEventModalProps) {
  const router = useRouter()

  if (!item) return null

  const config = SOURCE_CONFIGS[item.source as keyof typeof SOURCE_CONFIGS]

  const handleViewInSource = () => {
    router.push(`${config.viewPath}/${item.source_id}`)
    onClose()
  }

  const handleEdit = () => {
    router.push(`${config.editPath}/${item.source_id}/edit`)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl">{item.title}</DialogTitle>
              <DialogDescription className="mt-2">{item.description}</DialogDescription>
            </div>
            <Badge className={`${config.color} text-white`}>{item.source}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date & Time */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{format(new Date(item.date), 'EEEE, MMMM d, yyyy')}</span>
            {!item.all_day && (
              <>
                <Clock className="h-4 w-4 text-muted-foreground ml-4" />
                <span>
                  {format(new Date(item.date), 'h:mm a')}
                  {item.duration && ` (${item.duration} minutes)`}
                </span>
              </>
            )}
          </div>

          {/* Location */}
          {item.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{item.location}</span>
            </div>
          )}

          {/* Category & Status */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={config.lightColor}>
              {item.category}
            </Badge>
            {item.status && <Badge variant="outline">{item.status}</Badge>}
          </div>

          <Separator />

          {/* Participants */}
          {item.participants && item.participants.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Participants ({item.participants.length})
                </span>
              </div>
              <div className="space-y-2">
                {item.participants.map(participant => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted"
                  >
                    <div>
                      <div className="font-medium">{participant.name}</div>
                      {participant.email && (
                        <div className="text-sm text-muted-foreground">{participant.email}</div>
                      )}
                    </div>
                    <Badge variant="secondary">{participant.role}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          {item.attachments && item.attachments.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Attachments ({item.attachments.length})</span>
              </div>
              <div className="space-y-2">
                {item.attachments.map(attachment => (
                  <a
                    key={attachment.id}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-muted hover:bg-accent transition-colors"
                  >
                    <span className="text-sm">{attachment.name}</span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Custom Fields */}
          {item.custom_fields && Object.keys(item.custom_fields).length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">Additional Details</h4>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(item.custom_fields).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</dt>
                    <dd className="font-medium">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="outline" onClick={handleViewInSource}>
            <ExternalLink className="h-4 w-4 mr-2" />
            View in {item.source}
          </Button>
          <Button onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
