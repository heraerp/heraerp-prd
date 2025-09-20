/**
 * Fiscal Close Operations Checklist Component
 * Smart Code: HERA.FIN.UI.CLOSE.CHECKLIST.V1
 *
 * 15-item checklist for year-end closing operations
 */

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  FileText,
  Calculator,
  Users,
  Building2,
  Coins,
  Receipt,
  TrendingUp,
  Lock,
  Shield,
  RefreshCw,
  Archive
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ChecklistItem {
  id: string
  title: string
  description: string
  category:
    | 'validation'
    | 'subledger'
    | 'reconciliation'
    | 'accruals'
    | 'closing'
    | 'reporting'
    | 'archive'
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  required: boolean
  icon: React.ElementType
  artifacts?: string[]
}

interface FiscalCloseChecklistProps {
  items?: ChecklistItem[]
  onItemUpdate?: (itemId: string, status: ChecklistItem['status']) => void
  className?: string
}

// Default 15-item operations checklist
const DEFAULT_CHECKLIST_ITEMS: ChecklistItem[] = [
  // Validation Phase
  {
    id: 'YEC-01',
    title: 'Verify fiscal year & open period',
    description: 'Confirm fiscal year configuration and all periods are properly opened',
    category: 'validation',
    status: 'pending',
    required: true,
    icon: Calendar,
    artifacts: ['Fiscal calendar report', 'Period status report']
  },
  {
    id: 'YEC-02',
    title: 'Confirm RE and CYE accounts',
    description: 'Verify Retained Earnings (3200000) and Current Year Earnings (3300000) accounts',
    category: 'validation',
    status: 'pending',
    required: true,
    icon: Shield,
    artifacts: ['COA validation report']
  },

  // Subledger Freeze
  {
    id: 'YEC-03',
    title: 'Freeze subledgers (AP/AR/FA)',
    description: 'Lock all subsidiary ledgers to prevent new transactions',
    category: 'subledger',
    status: 'pending',
    required: true,
    icon: Lock,
    artifacts: ['Subledger status report']
  },
  {
    id: 'YEC-04',
    title: 'Post outstanding journals',
    description: 'Review and post all draft journal entries',
    category: 'subledger',
    status: 'pending',
    required: true,
    icon: FileText,
    artifacts: ['Unposted journals report']
  },

  // Reconciliation
  {
    id: 'YEC-05',
    title: 'Revalue FX (if applicable)',
    description: 'Process foreign exchange revaluation for multi-currency balances',
    category: 'reconciliation',
    status: 'pending',
    required: false,
    icon: RefreshCw,
    artifacts: ['FX revaluation journal']
  },
  {
    id: 'YEC-06',
    title: 'Reconcile cash/bank',
    description: 'Complete all bank reconciliations and confirm cash positions',
    category: 'reconciliation',
    status: 'pending',
    required: true,
    icon: Building2,
    artifacts: ['Bank reconciliation reports']
  },
  {
    id: 'YEC-07',
    title: 'Reconcile intercompany',
    description: 'Balance all intercompany accounts between entities',
    category: 'reconciliation',
    status: 'pending',
    required: false,
    icon: Users,
    artifacts: ['Intercompany reconciliation']
  },
  {
    id: 'YEC-08',
    title: 'Reconcile inventory/COGS',
    description: 'Verify physical inventory matches book values',
    category: 'reconciliation',
    status: 'pending',
    required: true,
    icon: Package,
    artifacts: ['Inventory reconciliation', 'COGS analysis']
  },

  // Accruals & Deferrals
  {
    id: 'YEC-09',
    title: 'Lock accruals & deferrals',
    description: 'Post all accrued revenues/expenses and deferred items',
    category: 'accruals',
    status: 'pending',
    required: true,
    icon: Clock,
    artifacts: ['Accruals journal', 'Deferrals schedule']
  },

  // Closing Process
  {
    id: 'YEC-10',
    title: 'Run revenue close preview',
    description: 'Preview revenue account closing entries',
    category: 'closing',
    status: 'pending',
    required: true,
    icon: TrendingUp,
    artifacts: ['Revenue preview report']
  },
  {
    id: 'YEC-11',
    title: 'Run expense close preview',
    description: 'Preview expense account closing entries',
    category: 'closing',
    status: 'pending',
    required: true,
    icon: Receipt,
    artifacts: ['Expense preview report']
  },
  {
    id: 'YEC-12',
    title: 'Generate closing JE (draft)',
    description: 'Create draft year-end closing journal entry',
    category: 'closing',
    status: 'pending',
    required: true,
    icon: Calculator,
    artifacts: ['Draft closing journal']
  },
  {
    id: 'YEC-13',
    title: 'Review & approve (workflow)',
    description: 'Submit closing journal for CFO/Controller approval',
    category: 'closing',
    status: 'pending',
    required: true,
    icon: CheckCircle2,
    artifacts: ['Approval documentation']
  },

  // Final Steps
  {
    id: 'YEC-14',
    title: 'Post JE & archive artifacts',
    description: 'Post final closing journal and archive all supporting documents',
    category: 'archive',
    status: 'pending',
    required: true,
    icon: Archive,
    artifacts: ['Posted journal', 'Archive confirmation']
  },
  {
    id: 'YEC-15',
    title: 'Close period (lock) + schedule opening checks',
    description: 'Lock fiscal period and schedule new year opening balance verification',
    category: 'archive',
    status: 'pending',
    required: true,
    icon: Lock,
    artifacts: ['Period close confirmation', 'Opening checklist']
  }
]

export function FiscalCloseChecklist({
  items = DEFAULT_CHECKLIST_ITEMS,
  onItemUpdate,
  className
}: FiscalCloseChecklistProps) {
  const completedCount = items.filter(item => item.status === 'completed').length
  const requiredCount = items.filter(item => item.required).length
  const progressPercentage = (completedCount / items.length) * 100

  const getCategoryColor = (category: ChecklistItem['category']) => {
    const colors = {
      validation: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      subledger: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      reconciliation: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      accruals: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      closing: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      reporting: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      archive: 'bg-muted text-gray-200 dark:bg-background dark:text-gray-200'
    }
    return colors[category] || colors.validation
  }

  const getStatusIcon = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-600 animate-pulse" />
      case 'skipped':
        return <Circle className="h-5 w-5 text-muted-foreground" />
      default:
        return <Circle className="h-5 w-5 text-gray-300" />
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Fiscal Year-End Closing Checklist</CardTitle>
          <CardDescription>
            Complete all required items before posting the closing journal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>
                  {completedCount} of {items.length} completed
                </span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {requiredCount} items are required and must be completed before closing
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Checklist Items */}
      <div className="space-y-4">
        {items.map(item => {
          const Icon = item.icon
          return (
            <Card
              key={item.id}
              className={cn('transition-all', item.status === 'completed' && 'opacity-75')}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <div className="mt-1">{getStatusIcon(item.status)}</div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <h4 className="font-medium">{item.title}</h4>
                          {item.required && (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>

                      <Badge
                        variant="secondary"
                        className={cn('ml-4', getCategoryColor(item.category))}
                      >
                        {item.category}
                      </Badge>
                    </div>

                    {item.artifacts && item.artifacts.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Artifacts:</span> {item.artifacts.join(', ')}
                      </div>
                    )}

                    <div className="flex items-center gap-4 pt-2">
                      <Button
                        size="sm"
                        variant={item.status === 'completed' ? 'secondary' : 'outline'}
                        onClick={() => onItemUpdate?.(item.id, 'in_progress')}
                        disabled={item.status === 'completed'}
                      >
                        Start
                      </Button>

                      <Button
                        size="sm"
                        variant={item.status === 'completed' ? 'default' : 'outline'}
                        onClick={() => onItemUpdate?.(item.id, 'completed')}
                      >
                        {item.status === 'completed' ? 'Completed' : 'Mark Complete'}
                      </Button>

                      {!item.required && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onItemUpdate?.(item.id, 'skipped')}
                        >
                          Skip
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
