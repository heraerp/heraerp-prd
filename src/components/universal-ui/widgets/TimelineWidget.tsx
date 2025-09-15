'use client'

import React, { useEffect, useState } from 'react'
import { Widget } from '@/lib/universal-ui/view-meta-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { universalApi } from '@/lib/universal-api'
import { format } from 'date-fns'
import { Clock, User, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimelineWidgetProps {
  widget: Widget
  entityId?: string
  organizationId: string
  onAction?: (action: any) => void
}

interface TimelineEvent {
  id: string
  timestamp: string
  user_name: string
  action: string
  description: string
  type: string
  metadata?: any
}

export function TimelineWidget({ widget, entityId, organizationId }: TimelineWidgetProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTimelineData()
  }, [entityId, organizationId])

  const loadTimelineData = async () => {
    try {
      setLoading(true)

      const source = widget.data_source

      if (source?.type === 'transactions') {
        // Load transaction history
        const result = await universalApi.query('universal_transactions', {
          organization_id: organizationId,
          reference_entity_id: entityId,
          ...buildFilters(source.filters)
        })

        if (result.data) {
          const timelineEvents = result.data.map((txn: any) => ({
            id: txn.id,
            timestamp: txn.created_at,
            user_name: txn.created_by_name || 'System',
            action: getActionFromType(txn.transaction_type),
            description: txn.description || formatTransactionDescription(txn),
            type: txn.transaction_type,
            metadata: txn.metadata
          }))

          // Sort by timestamp descending
          timelineEvents.sort(
            (a: TimelineEvent, b: TimelineEvent) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )

          setEvents(timelineEvents)
        }
      } else {
        // Use sample data
        setEvents(generateSampleEvents())
      }
    } catch (error) {
      console.error('Failed to load timeline data:', error)
      setEvents(generateSampleEvents())
    } finally {
      setLoading(false)
    }
  }

  const buildFilters = (filters: any[] = []) => {
    const filterObj: any = {}
    filters.forEach(filter => {
      filterObj[filter.field] = filter.value
    })
    return filterObj
  }

  const getActionFromType = (type: string): string => {
    const actionMap: any = {
      bom_revision: 'updated revision',
      bom_release: 'released BOM',
      bom_archive: 'archived BOM',
      component_add: 'added component',
      component_remove: 'removed component',
      component_update: 'updated component',
      status_change: 'changed status',
      approval_request: 'requested approval',
      approval_granted: 'approved',
      approval_rejected: 'rejected'
    }

    return actionMap[type] || type.replace(/_/g, ' ')
  }

  const formatTransactionDescription = (txn: any): string => {
    if (txn.metadata?.component_name) {
      return `${txn.metadata.component_name} (${txn.metadata.quantity} units)`
    }

    if (txn.metadata?.old_value && txn.metadata?.new_value) {
      return `Changed from ${txn.metadata.old_value} to ${txn.metadata.new_value}`
    }

    return txn.transaction_code || ''
  }

  const generateSampleEvents = (): TimelineEvent[] => {
    return [
      {
        id: '1',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        user_name: 'John Smith',
        action: 'released BOM',
        description: 'Released for production use',
        type: 'bom_release'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        user_name: 'Jane Doe',
        action: 'updated component',
        description: 'Oak Wood Panel (quantity changed from 2 to 3)',
        type: 'component_update'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        user_name: 'Mike Johnson',
        action: 'added component',
        description: 'Metal Bracket (4 units)',
        type: 'component_add'
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
        user_name: 'Sarah Wilson',
        action: 'created revision',
        description: 'Initial draft created',
        type: 'bom_revision'
      }
    ]
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'bom_release':
        return <CheckCircle className="h-4 w-4" />
      case 'bom_archive':
        return <XCircle className="h-4 w-4" />
      case 'approval_granted':
        return <CheckCircle className="h-4 w-4" />
      case 'approval_rejected':
        return <XCircle className="h-4 w-4" />
      case 'approval_request':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'bom_release':
      case 'approval_granted':
        return 'text-green-600 dark:text-green-400'
      case 'bom_archive':
      case 'approval_rejected':
        return 'text-red-600 dark:text-red-400'
      case 'approval_request':
        return 'text-amber-600 dark:text-amber-400'
      default:
        return 'text-primary dark:text-blue-400'
    }
  }

  const renderEvent = (event: TimelineEvent, isLast: boolean) => {
    const template = widget.config.event_template || '{{user_name}} {{action}} - {{description}}'

    const eventText = template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return event[key as keyof TimelineEvent] || ''
    })

    return (
      <div key={event.id} className="relative">
        <div className="flex items-start gap-4">
          {/* Timeline line and dot */}
          <div className="relative flex flex-col items-center">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background',
                getEventColor(event.type),
                'border-current'
              )}
            >
              {getEventIcon(event.type)}
            </div>
            {!isLast && <div className="absolute top-8 h-full w-0.5 bg-border" />}
          </div>

          {/* Event content */}
          <div className="flex-1 pb-8">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm font-medium">{event.user_name}</span>
              <span className="text-sm text-muted-foreground">•</span>
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {format(new Date(event.timestamp), 'PPp')}
              </span>
            </div>

            <p className="text-sm">{eventText}</p>

            {event.metadata && Object.keys(event.metadata).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(event.metadata).map(([key, value]) => (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {key}: {String(value)}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4">
                <div className="h-8 w-8 bg-gray-700 dark:bg-muted-foreground/10 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-700 dark:bg-muted-foreground/10 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-700 dark:bg-muted-foreground/10 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{widget.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No events to display</p>
        ) : (
          <div className="relative">
            {events.map((event, index) => renderEvent(event, index === events.length - 1))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
