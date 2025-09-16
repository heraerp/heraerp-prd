'use client'

import React from 'react'
import { Widget } from '@/src/lib/universal-ui/view-meta-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'

interface KanbanWidgetProps {
  widget: Widget
  entityId?: string
  organizationId: string
  onAction?: (action: any) => void
}

export function KanbanWidget({ widget }: KanbanWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{widget.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Kanban board widget coming soon...</p>
      </CardContent>
    </Card>
  )
}
