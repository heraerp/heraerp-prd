// ================================================================================
// FISCAL CLOSE CHECKLIST - FISCAL COMPONENT
// Smart Code: HERA.UI.FISCAL.CLOSE_CHECKLIST.v1
// Production-ready period close checklist with Sacred Six storage
// ================================================================================

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CheckSquare,
  Square,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  FileCheck,
  Info
} from 'lucide-react'
import { CloseChecklist, CloseChecklistItem } from '@/lib/schemas/fiscal'
import { ScrollArea } from '@/components/ui/scroll-area'

interface FiscalCloseChecklistProps {
  checklist: CloseChecklist
  isLoading: boolean
  error: Error | null
  onItemToggle: (key: string, completed: boolean) => Promise<void>
  isUpdating: boolean
}

export function FiscalCloseChecklist({
  checklist,
  isLoading,
  error,
  onItemToggle,
  isUpdating
}: FiscalCloseChecklistProps) {
  const [processingItem, setProcessingItem] = React.useState<string | null>(null)

  const handleToggle = async (item: CloseChecklistItem) => {
    setProcessingItem(item.key)
    try {
      await onItemToggle(item.key, !item.completed)
    } finally {
      setProcessingItem(null)
    }
  }

  const completedCount = checklist.filter(item => item.completed).length
  const totalCount = checklist.length
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0
  const isComplete = completedCount === totalCount && totalCount > 0

  const getCategoryIcon = (key: string) => {
    if (key.includes('pos') || key.includes('sale')) return '💰'
    if (key.includes('commission') || key.includes('staff')) return '👥'
    if (key.includes('vat') || key.includes('tax')) return '📊'
    if (key.includes('inventory')) return '📦'
    if (key.includes('bank') || key.includes('reconcil')) return '🏦'
    if (key.includes('receivable') || key.includes('payable')) return '📋'
    if (key.includes('depreciation') || key.includes('accru')) return '📈'
    if (key.includes('report')) return '📊'
    if (key.includes('backup')) return '💾'
    if (key.includes('approval')) return '✅'
    return '📌'
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Period Close Checklist
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-violet-600 mr-3" />
            <span className="dark:ink-muted">Loading checklist...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Period Close Checklist
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

  return (
    <Card className="sticky top-6">
      <CardHeader className="pb-3">
        <div className="space-y-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Period Close Checklist
            </span>
            <Badge
              className={
                isComplete
                  ? 'bg-green-100 text-green-800 border-green-300'
                  : 'bg-violet-100 text-violet-800 border-violet-300'
              }
            >
              {completedCount} / {totalCount}
            </Badge>
          </CardTitle>

          <Progress value={progressPercentage} className="h-2" />

          {isComplete && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-green-800 dark:text-green-200 font-medium">
                All checklist items completed! Ready to close period.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[600px] px-6 pb-6">
          <div className="space-y-1">
            {checklist.map((item, index) => {
              const isProcessing = processingItem === item.key
              const isDisabled = isProcessing || isUpdating

              return (
                <div
                  key={item.key}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${ item.completed ?'bg-green-50/50 dark:bg-green-950/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  } ${index % 2 === 0 ? 'bg-gray-50/30 dark:bg-gray-800/10' : ''}`}
                >
                  <div className="mt-0.5">
                    <Checkbox
                      id={`checklist-${item.key}`}
                      checked={item.completed}
                      onCheckedChange={() => handleToggle(item)}
                      disabled={isDisabled}
                      aria-label={`Toggle ${item.label}`}
                    />
                  </div>

                  <label
                    htmlFor={`checklist-${item.key}`}
                    className={`flex-1 cursor-pointer select-none ${ isDisabled ?'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg leading-none mt-0.5">
                        {getCategoryIcon(item.key)}
                      </span>
                      <div className="flex-1 space-y-1">
                        <div
                          className={`text-sm font-medium ${ item.completed ?'text-green-700 dark:text-green-300 line-through'
                              : 'text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          {item.label}
                        </div>

                        {item.description && (
                          <p className="text-xs dark:ink-muted">
                            {item.description}
                          </p>
                        )}

                        {item.completed && item.completed_at && (
                          <div className="flex items-center gap-2 text-xs ink-muted">
                            <CheckCircle className="h-3 w-3" />
                            <span>
                              Completed {new Date(item.completed_at).toLocaleDateString()}
                              {item.completed_by && ` by ${item.completed_by}`}
                            </span>
                          </div>
                        )}

                        {item.notes && (
                          <p className="text-xs dark:ink-muted italic">
                            Note: {item.notes}
                          </p>
                        )}
                      </div>

                      {isProcessing && <Clock className="h-4 w-4 animate-spin text-violet-600" />}
                    </div>
                  </label>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>

      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <div className="font-medium text-blue-800 dark:text-blue-200">Checklist Progress</div>
            <div className="text-blue-700 dark:text-blue-300 mt-1">
              Complete all items before closing the period. Changes are saved automatically.
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </Card>
  )
}
