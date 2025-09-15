/**
 * Module Pipeline View - Gantt-style visualization
 * Shows pipeline stages in a horizontal timeline per module
 */

import React from 'react'
import { motion } from 'framer-motion'
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ChevronRight,
  Info,
  MoreVertical
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'

interface ModulePipelineViewProps {
  moduleData: Map<string, any>
  moduleInfo: Record<string, any>
  stageOrder: string[]
  transactions: any[]
  transactionLines: Map<string, any[]>
  filters: any
  onSelectModule: (module: string) => void
  onOpenGuardrail: (data: any) => void
}

const stageIcons = {
  PLAN: Clock,
  BUILD: CheckCircle,
  TEST: CheckCircle,
  COMPLY: CheckCircle,
  RELEASE: CheckCircle
}

const getStageStatus = (stage: any[]): 'pending' | 'running' | 'passed' | 'failed' | 'partial' => {
  if (!stage || stage.length === 0) return 'pending'

  const statuses = stage.map(txn => txn.transaction_status)
  if (statuses.some(s => s === 'failed')) return 'failed'
  if (statuses.some(s => s === 'running')) return 'running'
  if (statuses.every(s => s === 'passed')) return 'passed'
  return 'partial'
}

const getStageColor = (status: string) => {
  switch (status) {
    case 'passed':
      return 'bg-green-500'
    case 'failed':
      return 'bg-red-500'
    case 'running':
      return 'bg-blue-500'
    case 'partial':
      return 'bg-orange-500'
    default:
      return 'bg-gray-300 dark:bg-muted-foreground/10'
  }
}

const getStageIcon = (status: string) => {
  switch (status) {
    case 'passed':
      return CheckCircle
    case 'failed':
      return XCircle
    case 'running':
      return Loader2
    case 'partial':
      return AlertTriangle
    default:
      return Clock
  }
}

export function ModulePipelineView({
  moduleData,
  moduleInfo,
  stageOrder,
  transactions,
  transactionLines,
  filters,
  onSelectModule,
  onOpenGuardrail
}: ModulePipelineViewProps) {
  const filteredModules = Array.from(moduleData.entries()).filter(
    ([code]) => filters.modules.length === 0 || filters.modules.includes(code)
  )

  return (
    <div className="space-y-4">
      {filteredModules.map(([moduleCode, data], idx) => {
        const info = moduleInfo[moduleCode] || { name: moduleCode, icon: Clock, color: 'gray' }
        const Icon = info.icon

        // Calculate module-level metrics
        let totalDuration = 0
        let totalCoverage = 0
        let coverageCount = 0
        let hasFailures = false

        data.stages.forEach((stageTxns: any[]) => {
          stageTxns.forEach(txn => {
            const lines = transactionLines.get(txn.id) || []
            lines.forEach(line => {
              if ((line.metadata as any)?.duration_ms) {
                totalDuration += line.metadata.duration_ms
              }
              if ((line.metadata as any)?.coverage) {
                totalCoverage += line.metadata.coverage
                coverageCount++
              }
            })
            if (txn.transaction_status === 'failed') {
              hasFailures = true
            }
          })
        })

        const avgCoverage = coverageCount > 0 ? (totalCoverage / coverageCount) * 100 : 0
        const formattedDuration =
          totalDuration > 60000
            ? `${Math.round(totalDuration / 60000)}m`
            : `${Math.round(totalDuration / 1000)}s`

        // Skip if show failed only and no failures
        if (filters.showFailedOnly && !hasFailures) {
          return null
        }

        return (
          <motion.div
            key={moduleCode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card
              className={cn('overflow-hidden', hasFailures && 'border-red-200 dark:border-red-800')}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        `bg-${info.color}-100 dark:bg-${info.color}-900/20`
                      )}
                    >
                      <Icon className={cn('w-5 h-5', `text-${info.color}-600`)} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-100 dark:text-foreground">{info.name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>Module: {moduleCode}</span>
                        <span>Duration: {formattedDuration}</span>
                        <span>Coverage: {avgCoverage.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              onOpenGuardrail({
                                open: true,
                                moduleCode,
                                transactions: Array.from(data.stages.values()).flat()
                              })
                            }
                          >
                            <Info className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View guardrail details</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onSelectModule(moduleCode)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>Download Report</DropdownMenuItem>
                        <DropdownMenuItem>View Artifacts</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pb-4">
                {/* Pipeline Timeline */}
                <div className="relative">
                  {/* Background line */}
                  <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-700 dark:bg-muted-foreground/10" />

                  {/* Stage nodes */}
                  <div className="relative grid grid-cols-5 gap-0">
                    {stageOrder.map((stage, stageIdx) => {
                      const stageTxns = data.stages.get(stage) || []
                      const status = getStageStatus(stageTxns)
                      const StageIcon = getStageIcon(status)
                      const isRunning = status === 'running'

                      return (
                        <div key={stage} className="relative">
                          {/* Connection line */}
                          {stageIdx > 0 && (
                            <div
                              className={cn(
                                'absolute top-6 -left-1/2 right-1/2 h-0.5',
                                status !== 'pending'
                                  ? getStageColor(status)
                                  : 'bg-gray-300 dark:bg-muted-foreground/10'
                              )}
                            />
                          )}

                          {/* Stage node */}
                          <div className="flex flex-col items-center">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <motion.div
                                    className={cn(
                                      'w-12 h-12 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-lg cursor-pointer',
                                      getStageColor(status)
                                    )}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <StageIcon
                                      className={cn(
                                        'w-6 h-6 text-foreground',
                                        isRunning && 'animate-spin'
                                      )}
                                    />
                                  </motion.div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="space-y-1">
                                    <p className="font-semibold">{stage}</p>
                                    <p className="text-xs">Status: {status}</p>
                                    {stageTxns.length > 0 && (
                                      <p className="text-xs">{stageTxns.length} transactions</p>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <p className="text-xs font-medium text-muted-foreground dark:text-muted-foreground mt-2">
                              {stage}
                            </p>

                            {/* Stage metadata */}
                            {stageTxns.length > 0 && (
                              <div className="mt-1 space-y-1">
                                {stageTxns[0].metadata?.duration_ms && (
                                  <p className="text-xs text-muted-foreground">
                                    {Math.round(stageTxns[0].metadata.duration_ms / 1000)}s
                                  </p>
                                )}
                                {stageTxns[0].metadata?.coverage && (
                                  <Badge variant="secondary" className="text-xs">
                                    {(stageTxns[0].metadata.coverage * 100).toFixed(0)}%
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Progress bar for running stages */}
                  {Array.from(data.stages.entries()).some(([_, txns]) =>
                    txns.some(t => t.transaction_status === 'running')
                  ) && (
                    <div className="mt-4">
                      <Progress
                        value={
                          (Array.from(data.stages.entries()).filter(([_, txns]) =>
                            txns.some(t => t.transaction_status === 'passed')
                          ).length /
                            stageOrder.length) *
                          100
                        }
                        className="h-2"
                      />
                    </div>
                  )}
                </div>

                {/* Coverage Trend Sparkline */}
                {data.coverage.length > 0 && (
                  <div className="mt-4 p-3 bg-muted dark:bg-background rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-muted-foreground dark:text-muted-foreground">
                        Coverage Trend
                      </p>
                      <Badge variant={avgCoverage >= 85 ? 'default' : 'destructive'}>
                        {avgCoverage.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="h-12">
                      {/* Sparkline chart would go here */}
                      <div className="flex items-end gap-1 h-full">
                        {data.coverage.slice(-10).map((cov, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              'flex-1 rounded-t',
                              cov >= 85
                                ? 'bg-green-500'
                                : cov >= 60
                                  ? 'bg-orange-500'
                                  : 'bg-red-500'
                            )}
                            style={{ height: `${cov}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )
      })}

      {filteredModules.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground">No modules match the current filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
