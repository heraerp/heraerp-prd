'use client'

import React from 'react'
import { Widget } from '@/lib/universal-ui/view-meta-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TreeWidgetProps {
  widget: Widget
  entityId?: string
  organizationId: string
  onAction?: (action: any) => void
}

export function TreeWidget({ widget }: TreeWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{widget.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Tree view widget coming soon...</p>
      </CardContent>
    </Card>
  )
}