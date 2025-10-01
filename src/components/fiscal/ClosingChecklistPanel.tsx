// ================================================================================
// CLOSING CHECKLIST PANEL - FISCAL COMPONENT
// Smart Code: HERA.UI.FISCAL.CLOSING_CHECKLIST_PANEL.v1
// Production-ready checklist panel with inline toggles and progress tracking
// ================================================================================

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  Clipboard,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { CloseChecklistItem } from '@/lib/schemas/fiscal'
import { cn } from '@/lib/utils'

interface ClosingChecklistPanelProps {
  checklist: CloseChecklistItem[]
  isLoading: boolean
  error: Error | null
  onItemToggle?: (key: string, completed: boolean) => void
  isUpdating?: boolean
  isCompact?: boolean
}

export function ClosingChecklistPanel({
  checklist,
  isLoading,
  error,
  onItemToggle,
  isUpdating = false,
  isCompact = false
}: ClosingChecklistPanelProps) {
  const [isExpanded, setIsExpanded] = React.useState(!isCompact)
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null)

  // Calculate completion percentage
  const completionStats = React.useMemo(() => {
    if (!checklist || checklist.length === 0) {
      return { completed: 0, total: 0, percentage: 0 }
    }

    const completed = checklist.filter(item => item.completed).length
    const total = checklist.length
    const percentage = Math.round((completed / total) * 100)

    return { completed, total, percentage }
  }, [checklist])

  // Group checklist items by category (based on key prefix)
  const groupedItems = React.useMemo(() => {
    const groups: Record<string, CloseChecklistItem[]> = {
      operations: [],
      financial: [],
      compliance: [],
      other: []
    }

    checklist.forEach(item => {
      if (item.key.startsWith('pos_') || item.key.startsWith('sales_')) {
        groups.operations.push(item)
      } else if (
        item.key.startsWith('ap_') ||
        item.key.startsWith('ar_') ||
        item.key.includes('accrual')
      ) {
        groups.financial.push(item)
      } else if (item.key.includes('compliance') || item.key.includes('audit')) {
        groups.compliance.push(item)
      } else {
        groups.other.push(item)
      }
    })

    return Object.entries(groups).filter(([_, items]) => items.length > 0)
  }, [checklist])

  if (isLoading) {
    return (
      <Card className={cn(isCompact && 'shadow-sm')}>
        <CardHeader className={cn(isCompact && 'py-4')}>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clipboard className="h-4 w-4" />
            Closing Checklist
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-violet-600 mr-2" />
            <span className="dark:ink-muted">Loading checklist...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn(isCompact && 'shadow-sm')}>
        <CardHeader className={cn(isCompact && 'py-4')}>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clipboard className="h-4 w-4" />
            Closing Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              Failed to load checklist: {error.message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const formatDate = (date?: string) => {
    if (!date) return null
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card className={cn(isCompact && 'shadow-sm')}>
      <CardHeader className={cn(isCompact && 'py-4')}>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clipboard className="h-4 w-4" />
            Closing Checklist
          </CardTitle>
          {isCompact && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
              aria-label={isExpanded ? 'Collapse checklist' : 'Expand checklist'}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {/* Progress Summary */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="dark:ink-muted">Completion</span>
            <span className="font-medium ink dark:text-gray-100">
              {completionStats.completed} of {completionStats.total}
            </span>
          </div>
          <Progress value={completionStats.percentage} className="h-2" />
          <div className="flex items-center justify-between">
            <Badge
              variant={completionStats.percentage === 100 ? 'default' : 'outline'}
              className={cn(
                completionStats.percentage === 100
                  ? 'bg-green-100 text-green-800 border-green-300'
                  : 'text-violet-700 border-violet-300'
              )}
            >
              {completionStats.percentage}% Complete
            </Badge>
            {completionStats.percentage === 100 && (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
          </div>
        </div>
      </CardHeader>

      {(!isCompact || isExpanded) && (
        <CardContent className="space-y-4">
          {checklist.length === 0 ? (
            <div className="text-center py-8">
              <Info className="h-8 w-8 ink-muted mx-auto mb-2" />
              <p className="text-sm dark:ink-muted">No checklist items configured</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groupedItems.map(([group, items]) => (
                <div key={group} className="space-y-2">
                  <div className="text-xs font-medium dark:ink-muted uppercase tracking-wider">
                    {group.charAt(0).toUpperCase() + group.slice(1)}
                  </div>
                  {items.map(item => (
                    <div
                      key={item.key}
                      className={cn(
                        'relative p-3 rounded-lg border transition-all',
                        item.completed
                          ? 'bg-green-50 dark:bg-green-950/30 border-green-200'
                          : 'bg-gray-50 dark:bg-gray-800/30 border-gray-200',
                        hoveredItem === item.key && 'shadow-sm'
                      )}
                      onMouseEnter={() => setHoveredItem(item.key)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={`checklist-${item.key}`}
                          checked={item.completed}
                          onCheckedChange={checked => {
                            if (onItemToggle && !isUpdating) {
                              onItemToggle(item.key, checked as boolean)
                            }
                          }}
                          disabled={isUpdating || !onItemToggle}
                          className={cn(
                            'mt-0.5',
                            item.completed &&
                              'data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600'
                          )}
                          aria-label={`Toggle ${item.label}`}
                        />

                        <div className="flex-1 space-y-1">
                          <label
                            htmlFor={`checklist-${item.key}`}
                            className={cn(
                              'text-sm font-medium cursor-pointer select-none',
                              item.completed
                                ? 'text-green-800 dark:text-green-200 line-through'
                                : 'text-gray-900 dark:text-gray-100'
                            )}
                          >
                            {item.label}
                          </label>

                          {item.description && (
                            <p className="text-xs dark:ink-muted">{item.description}</p>
                          )}

                          {item.completed && item.completed_at && (
                            <div className="flex items-center gap-2 text-xs ink-muted">
                              <CheckCircle className="h-3 w-3" />
                              <span>Completed {formatDate(item.completed_at)}</span>
                              {item.completed_by && (
                                <span className="ink-muted">by {item.completed_by}</span>
                              )}
                            </div>
                          )}

                          {item.notes && hoveredItem === item.key && (
                            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded text-xs text-blue-700 dark:text-blue-300">
                              {item.notes}
                            </div>
                          )}
                        </div>

                        {isUpdating && hoveredItem === item.key && (
                          <RefreshCw className="h-3 w-3 animate-spin text-violet-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Smart Code Reference */}
          {!isCompact && (
            <Alert className="mt-4 border-blue-200 bg-blue-50 dark:bg-blue-950/30">
              <Info className="h-3 w-3" />
              <AlertDescription className="text-xs">
                <div className="font-medium text-blue-800 dark:text-blue-200">
                  Smart Code: HERA.FIN.FISCAL.CLOSE.CHECKLIST.V1
                </div>
                <div className="text-blue-700 dark:text-blue-300 mt-1">
                  Checklist items are stored in core_dynamic_data and tracked via
                  universal_transactions
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      )}
    </Card>
  )
}
