'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Zap,
  TrendingUp,
  FileText,
  Download,
  Calendar,
  Filter,
  Target,
  BarChart2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickAction {
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  onClick: () => void
  color: string
}

interface QuickActionsProps {
  className?: string
}

export function QuickActions({ className }: QuickActionsProps) {
  const quickActions: QuickAction[] = [
    {
      icon: TrendingUp,
      label: 'Revenue Trend',
      description: 'Analyze revenue patterns',
      onClick: () => console.log('Revenue trend'),
      color: 'from-green-600 to-emerald-600'
    },
    {
      icon: Target,
      label: 'Sales Forecast',
      description: 'Predict future sales',
      onClick: () => console.log('Sales forecast'),
      color: 'from-blue-600 to-cyan-600'
    },
    {
      icon: BarChart2,
      label: 'Comparison',
      description: 'Compare periods',
      onClick: () => console.log('Comparison'),
      color: 'from-purple-600 to-pink-600'
    },
    {
      icon: FileText,
      label: 'Reports',
      description: 'Generate reports',
      onClick: () => console.log('Reports'),
      color: 'from-orange-600 to-red-600'
    }
  ]

  return (
    <Card className={cn('border-purple-200 dark:border-purple-800 shadow-sm', className)}>
      <CardHeader className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 grid grid-cols-2 gap-2">
        {quickActions.map((action, idx) => {
          const Icon = action.icon
          return (
            <Button
              key={idx}
              variant="outline"
              className="h-auto flex flex-col items-center justify-center py-3 px-3 hover:scale-105 transition-all hover:shadow-md border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600"
              onClick={action.onClick}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center mb-2',
                  action.color
                )}
              >
                <Icon className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium">{action.label}</span>
              <span className="text-xs text-muted-foreground mt-0.5">{action.description}</span>
            </Button>
          )
        })}
      </CardContent>
    </Card>
  )
}
