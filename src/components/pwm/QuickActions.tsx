'use client'

import React from 'react'
import { Card } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import {
  ArrowUpDown,
  Plus,
  RefreshCcw,
  Download,
  Settings,
  TrendingUp,
  Wallet,
  FileText
} from 'lucide-react'
import { cn } from '@/src/lib/utils'

interface QuickAction {
  id: string
  label: string
  icon: React.ReactNode
  description: string
  variant: 'primary' | 'secondary' | 'danger'
}

interface QuickActionsProps {
  onActionClick: (actionId: string) => void
  disabledActions?: string[]
}

export function QuickActions({ onActionClick, disabledActions = [] }: QuickActionsProps) {
  const actions: QuickAction[] = [
    {
      id: 'add-funds',
      label: 'Add Funds',
      icon: <Plus className="h-5 w-5" />,
      description: 'Deposit or transfer funds',
      variant: 'primary'
    },
    {
      id: 'rebalance',
      label: 'Rebalance',
      icon: <RefreshCcw className="h-5 w-5" />,
      description: 'Optimize portfolio allocation',
      variant: 'secondary'
    },
    {
      id: 'trade',
      label: 'Trade',
      icon: <ArrowUpDown className="h-5 w-5" />,
      description: 'Buy or sell assets',
      variant: 'secondary'
    },
    {
      id: 'withdraw',
      label: 'Withdraw',
      icon: <Wallet className="h-5 w-5" />,
      description: 'Cash out funds',
      variant: 'secondary'
    },
    {
      id: 'report',
      label: 'Reports',
      icon: <FileText className="h-5 w-5" />,
      description: 'Generate statements',
      variant: 'secondary'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="h-5 w-5" />,
      description: 'Manage preferences',
      variant: 'secondary'
    }
  ]

  const getButtonStyles = (variant: QuickAction['variant'], disabled: boolean) => {
    if (disabled) {
      return 'bg-muted/30 border-border/50 text-slate-500 cursor-not-allowed'
    }

    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border-emerald-500/30 hover:border-emerald-400/50 text-emerald-400'
      case 'secondary':
        return 'bg-muted/50 border-border hover:border-input hover:bg-slate-700/50 text-slate-300'
      case 'danger':
        return 'bg-red-500/10 border-red-500/30 hover:border-red-400/50 text-red-400'
    }
  }

  return (
    <Card className="p-6 bg-background/50 backdrop-blur-sm border-slate-800">
      <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {actions.map(action => {
          const isDisabled = disabledActions.includes(action.id)

          return (
            <Button
              key={action.id}
              variant="outline"
              className={cn(
                'h-auto p-4 flex flex-col items-center gap-2 transition-all duration-200',
                getButtonStyles(action.variant, isDisabled)
              )}
              onClick={() => !isDisabled && onActionClick(action.id)}
              disabled={isDisabled}
            >
              <div
                className={cn(
                  'p-2 rounded-lg',
                  action.variant === 'primary' && !isDisabled
                    ? 'bg-emerald-500/20'
                    : 'bg-slate-700/50'
                )}
              >
                {action.icon}
              </div>
              <div className="text-center">
                <div className="font-medium">{action.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{action.description}</div>
              </div>
            </Button>
          )
        })}
      </div>

      {/* Recent Activity Indicator */}
      <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">AI Rebalancing Available</p>
              <p className="text-xs text-slate-500">Optimize for +2.3% annual returns</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-emerald-400 hover:text-emerald-300"
            onClick={() => onActionClick('rebalance')}
          >
            Review
          </Button>
        </div>
      </div>
    </Card>
  )
}
