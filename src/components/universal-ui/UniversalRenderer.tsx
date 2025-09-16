'use client'

import React, { useEffect, useState } from 'react'
import { ViewMetaService, ViewMetadata, Widget } from '@/src/lib/universal-ui/view-meta-service'
import { FormWidget } from './widgets/FormWidget'
import { GridWidget } from './widgets/GridWidget'
import { TimelineWidget } from './widgets/TimelineWidget'
import { StatsWidget } from './widgets/StatsWidget'
import { ChartWidget } from './widgets/ChartWidget'
import { KanbanWidget } from './widgets/KanbanWidget'
import { TreeWidget } from './widgets/TreeWidget'
import { RelatedWidget } from './widgets/RelatedWidget'
import { cn } from '@/src/lib/utils'
import { Card } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/src/components/ui/use-toast'

interface UniversalRendererProps {
  smartCode: string
  entityId?: string
  viewType?: 'detail' | 'list' | 'form' | 'dashboard' | 'workflow' | 'timeline'
  organizationId: string
  className?: string
  onAction?: (action: any) => void
}

export function UniversalRenderer({
  smartCode,
  entityId,
  viewType = 'detail',
  organizationId,
  className,
  onAction
}: UniversalRendererProps) {
  const [metadata, setMetadata] = useState<ViewMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadMetadata()
  }, [smartCode, viewType, organizationId])

  const loadMetadata = async () => {
    try {
      setLoading(true)
      setError(null)

      const metaService = new ViewMetaService(organizationId)
      const meta = await metaService.getViewMeta(smartCode, viewType)

      if (!meta) {
        setError('No metadata found for this view')
      } else {
        setMetadata(meta)
      }
    } catch (err) {
      console.error('Failed to load metadata:', err)
      setError('Failed to load view configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = (action: any) => {
    if (action.confirmation) {
      // Show confirmation dialog
      if (!confirm(`${action.confirmation.title}\n\n${action.confirmation.message}`)) {
        return
      }
    }

    // Handle navigation actions
    if (action.type === 'navigate' && action.navigation) {
      const url = action.navigation.target.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return entityId || ''
      })
      window.location.href = url
      return
    }

    // Pass to parent handler
    if (onAction) {
      onAction(action)
    }

    // Show success message if configured
    if (action.success_message) {
      toast({
        title: 'Success',
        description: action.success_message
      })
    }

    // Refresh if configured
    if (action.refresh_after) {
      loadMetadata()
    }
  }

  const renderWidget = (widget: Widget) => {
    const widgetProps = {
      key: widget.id,
      widget,
      entityId,
      organizationId,
      onAction: handleAction
    }

    switch (widget.type) {
      case 'form':
        return <FormWidget {...widgetProps} />
      case 'grid':
        return <GridWidget {...widgetProps} />
      case 'timeline':
        return <TimelineWidget {...widgetProps} />
      case 'stats':
        return <StatsWidget {...widgetProps} />
      case 'chart':
        return <ChartWidget {...widgetProps} />
      case 'kanban':
        return <KanbanWidget {...widgetProps} />
      case 'tree':
        return <TreeWidget {...widgetProps} />
      case 'related':
        return <RelatedWidget {...widgetProps} />
      default:
        return (
          <Card key={widget.id} className="p-4">
            <p className="text-muted-foreground">Unknown widget type: {widget.type}</p>
          </Card>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={loadMetadata}>Retry</Button>
        </div>
      </Card>
    )
  }

  if (!metadata) {
    return null
  }

  return (
    <div className={cn('universal-renderer', className)}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{metadata.title}</h1>
        {metadata.description && (
          <p className="text-muted-foreground mt-1">{metadata.description}</p>
        )}
      </div>

      {/* Actions Bar */}
      {metadata.actions && metadata.actions.length > 0 && (
        <div className="flex gap-2 mb-6">
          {metadata.actions.map(action => (
            <Button
              key={action.id}
              variant={action.type === 'delete' ? 'destructive' : 'default'}
              onClick={() => handleAction(action)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}

      {/* Widgets Grid */}
      <div className="grid grid-cols-12 gap-6">
        {metadata.widgets.map(widget => {
          const colSpan = widget.layout?.size?.width || 12
          const rowSpan = widget.layout?.size?.height || 1

          return (
            <div
              key={widget.id}
              className={cn(
                'transition-all duration-200',
                `col-span-${colSpan}`,
                rowSpan > 1 && `row-span-${rowSpan}`
              )}
            >
              {renderWidget(widget)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
