// ================================================================================
// CLOSING WORKFLOW STEPS - FISCAL COMPONENT
// Smart Code: HERA.UI.FISCAL.CLOSING_WORKFLOW_STEPS.V1
// Production-ready workflow visualization with step tracking
// ================================================================================

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CheckCircle,
  Clock,
  AlertCircle,
  PlayCircle,
  ChevronRight,
  FileText,
  RefreshCw,
  TrendingUp,
  Calculator,
  DollarSign,
  Archive,
  Building,
  FileSpreadsheet
} from 'lucide-react'
import { ClosingWorkflow, WorkflowStep } from '@/lib/api/closing'

interface ClosingWorkflowStepsProps {
  workflow?: ClosingWorkflow | null
  isLoading: boolean
  error: Error | null
  onStepClick?: (step: WorkflowStep) => void
}

const STEP_ICONS: Record<string, React.ElementType> = {
  revenue_calc: TrendingUp,
  expense_calc: Calculator,
  net_income: DollarSign,
  closing_je: FileText,
  re_transfer: Archive,
  pl_zeroout: FileSpreadsheet,
  branch_elim: Building,
  consolidation: FileText
}

export function ClosingWorkflowSteps({
  workflow,
  isLoading,
  error,
  onStepClick
}: ClosingWorkflowStepsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PlayCircle className="h-4 w-4" />
            Closing Workflow Steps
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-violet-600 mr-3" />
            <span className="dark:ink-muted">Loading workflow...</span>
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
            <PlayCircle className="h-4 w-4" />
            Closing Workflow Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              Failed to load workflow: {error.message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const steps = workflow?.steps || []

  const getStepIcon = (stepId: string) => {
    const Icon = STEP_ICONS[stepId] || FileText
    return Icon
  }

  const getStepStatusIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'done':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-600 animate-pulse" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
    }
  }

  const getStepColor = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'done':
        return 'bg-green-50 dark:bg-green-950/30 border-green-200'
      case 'in_progress':
        return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 animate-pulse'
      case 'error':
        return 'bg-red-50 dark:bg-red-950/30 border-red-200'
      default:
        return 'bg-gray-50 dark:bg-gray-800/30 border-gray-200'
    }
  }

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return null
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <PlayCircle className="h-4 w-4" />
            Closing Workflow Steps
          </CardTitle>
          {workflow?.started_at && (
            <div className="text-sm dark:ink-muted">
              Started: {formatTimestamp(workflow.started_at)}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = getStepIcon(step.id)
            const isClickable = step.journal_entry_id && onStepClick

            return (
              <div key={step.id}>
                <div
                  className={`relative p-4 border rounded-lg transition-all ${getStepColor(step.status)} ${
                    isClickable ? 'cursor-pointer hover:shadow-md' : ''
                  }`}
                  onClick={() => isClickable && onStepClick(step)}
                  role={isClickable ? 'button' : undefined}
                  tabIndex={isClickable ? 0 : undefined}
                  onKeyPress={e => {
                    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                      onStepClick(step)
                    }
                  }}
                  aria-label={`Step ${index + 1}: ${step.name} - Status: ${step.status}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Step Number and Status */}
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-lg ${
                            step.status === 'done'
                              ? 'bg-green-600 text-white'
                              : step.status === 'in_progress'
                                ? 'bg-blue-600 text-white'
                                : step.status === 'error'
                                  ? 'bg-red-600 text-white'
                                  : 'bg-gray-300 text-gray-600'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div className="absolute -bottom-1 -right-1">
                          {getStepStatusIcon(step.status)}
                        </div>
                      </div>
                    </div>

                    {/* Step Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 ink-muted" />
                            <h3 className="font-semibold ink dark:text-gray-100">{step.name}</h3>
                          </div>
                          <p className="text-sm dark:ink-muted">{step.description}</p>

                          {/* Timestamps */}
                          <div className="flex items-center gap-4 text-xs ink-muted">
                            {step.started_at && (
                              <span>Started: {formatTimestamp(step.started_at)}</span>
                            )}
                            {step.completed_at && (
                              <span>Completed: {formatTimestamp(step.completed_at)}</span>
                            )}
                          </div>

                          {/* Error Message */}
                          {step.error_message && (
                            <Alert className="mt-2 border-red-200 bg-red-50 dark:bg-red-950/30">
                              <AlertCircle className="h-3 w-3" />
                              <AlertDescription className="text-xs text-red-800 dark:text-red-200">
                                {step.error_message}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Smart Code Badge */}
                          <Badge variant="outline" className="text-xs font-mono">
                            {step.smart_code.split('.').slice(-2).join('.')}
                          </Badge>

                          {/* Journal Entry Link */}
                          {step.journal_entry_id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={e => {
                                e.stopPropagation()
                                onStepClick?.(step)
                              }}
                              className="text-violet-600 hover:text-violet-700"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              View JE
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Connection Line */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-[52px] top-[60px] w-0.5 h-8 bg-gray-300" />
                  )}
                </div>

                {/* Progress Indicator */}
                {step.status === 'in_progress' && (
                  <div className="mt-2 ml-16">
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Workflow Complete Message */}
        {workflow?.status === 'done' && (
          <Alert className="mt-6 border-green-200 bg-green-50 dark:bg-green-950/30">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium text-green-800 dark:text-green-200">
                Year-End Closing Complete
              </div>
              <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                All steps have been successfully processed. Journal entries have been posted and the
                fiscal year is closed.
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Workflow Error Message */}
        {workflow?.status === 'error' && (
          <Alert className="mt-6 border-red-200 bg-red-50 dark:bg-red-950/30">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium text-red-800 dark:text-red-200">
                Closing Process Failed
              </div>
              <div className="text-sm text-red-700 dark:text-red-300 mt-1">
                An error occurred during the closing process. Please review the failed step and
                contact support if needed.
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
