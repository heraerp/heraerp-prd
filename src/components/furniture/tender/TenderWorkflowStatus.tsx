'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  FileText,
  Search,
  Target,
  DollarSign,
  Trophy,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkflowStage {
  id: string
  name: string
  icon: React.ElementType
  status: 'completed' | 'active' | 'pending' | 'failed'
  date?: string
  details?: string
}

interface TenderWorkflowStatusProps {
  tenderCode: string
  currentStage: string
  stages?: WorkflowStage[]
}

const defaultStages: WorkflowStage[] = [
  {
    id: 'discovery',
    name: 'Discovery',
    icon: Search,
    status: 'completed',
    date: '2025-01-10',
    details: 'Tender identified and added to watchlist'
  },
  {
    id: 'evaluation',
    name: 'Evaluation',
    icon: FileText,
    status: 'completed',
    date: '2025-01-12',
    details: 'Documents analyzed, bid strategy determined'
  },
  {
    id: 'bidding',
    name: 'Bidding',
    icon: Target,
    status: 'active',
    date: '2025-01-20',
    details: 'Preparing bid documents and pricing'
  },
  {
    id: 'emd_payment',
    name: 'EMD Payment',
    icon: DollarSign,
    status: 'pending',
    details: 'EMD of ₹90,000 to be paid'
  },
  {
    id: 'award',
    name: 'Award Decision',
    icon: Trophy,
    status: 'pending',
    details: 'Awaiting tender opening'
  },
  {
    id: 'logistics',
    name: 'Transit & Logistics',
    icon: Truck,
    status: 'pending',
    details: 'Wood transportation planning'
  },
  {
    id: 'completion',
    name: 'Completion',
    icon: CheckCircle,
    status: 'pending',
    details: 'Final settlement and closure'
  }
]

export default function TenderWorkflowStatus({
  tenderCode,
  currentStage,
  stages = defaultStages
}: TenderWorkflowStatusProps) {
  // Calculate progress
  const completedStages = stages.filter(s => s.status === 'completed').length
  const progressPercentage = (completedStages / stages.length) * 100

  return (
    <Card className="p-6 bg-muted/70 backdrop-blur-sm border-border/50">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Tender Workflow Status</h3>
            <p className="text-sm text-muted-foreground mt-1">Tender {tenderCode}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Overall Progress</p>
            <p className="text-2xl font-bold text-foreground">{Math.round(progressPercentage)}%</p>
          </div>
        </div>

        <Progress value={progressPercentage} className="h-2" />

        <div className="relative">
          {/* Vertical line connecting stages */}
          <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-muted-foreground/10"></div>

          {/* Workflow stages */}
          <div className="space-y-4">
            {stages.map((stage, index) => {
              const Icon = stage.icon
              const isActive = stage.status === 'active'
              const isCompleted = stage.status === 'completed'
              const isFailed = stage.status === 'failed'

              return (
                <div key={stage.id} className="relative flex items-start gap-4">
                  {/* Stage icon */}
                  <div
                    className={cn(
                      'relative z-10 w-16 h-16 rounded-xl flex items-center justify-center transition-all',
                      isCompleted && 'bg-green-600/20 border-2 border-green-600',
                      isActive && 'bg-amber-600/20 border-2 border-amber-600 animate-pulse',
                      isFailed && 'bg-red-600/20 border-2 border-red-600',
                      stage.status === 'pending' && 'bg-muted-foreground/10/50 border-2 border-border'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-6 w-6',
                        isCompleted && 'text-green-400',
                        isActive && 'text-amber-400',
                        isFailed && 'text-red-400',
                        stage.status === 'pending' && 'text-muted-foreground'
                      )}
                    />
                  </div>

                  {/* Stage content */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4
                          className={cn(
                            'font-semibold text-lg',
                            stage.status === 'pending' ? 'text-muted-foreground' : 'text-foreground'
                          )}
                        >
                          {stage.name}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">{stage.details}</p>
                        {stage.date && (
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {stage.date}
                          </p>
                        )}
                      </div>

                      {/* Status badge */}
                      <Badge
                        variant={
                          isCompleted
                            ? 'default'
                            : isActive
                              ? 'secondary'
                              : isFailed
                                ? 'destructive'
                                : 'outline'
                        }
                      >
                        {stage.status}
                      </Badge>
                    </div>

                    {/* Special alerts for active stage */}
                    {isActive && (
                      <div className="mt-3 p-3 rounded-lg bg-amber-900/20 border border-amber-700/50">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5" />
                          <div className="text-sm">
                            <p className="text-amber-400 font-medium">Action Required</p>
                            <p className="text-gray-300 mt-1">
                              Submit technical and price bid documents by 25th January
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Card>
  )
}
