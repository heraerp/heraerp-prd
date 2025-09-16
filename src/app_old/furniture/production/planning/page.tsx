'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Calendar,
  Clock,
  Package,
  Users,
  AlertCircle,
  Settings,
  Download,
  Plus
} from 'lucide-react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { useDemoOrganization } from '@/src/lib/dna/patterns/demo-org-pattern'
import FurniturePageHeader from '@/components/furniture/FurniturePageHeader'
import { cn } from '@/lib/utils'

export default function ProductionPlanningPage() {
  const { isAuthenticated, contextLoading } = useMultiOrgAuth()
  const { organizationId, organizationName, orgLoading } = useDemoOrganization()

  // Show loading state
  if (orgLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-body)] p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  // Authorization checks
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--color-body)] flex items-center justify-center p-6">
        <Alert className="max-w-md bg-[var(--color-body)]/50 border-[var(--color-border)]">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please log in to access production planning.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (contextLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-body)] p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  const planningMetrics = [
    {
      label: 'Scheduled Orders',
      value: '23',
      icon: Calendar,
      color: 'text-[var(--color-text-primary)]',
      description: 'Next 7 days',
      change: '+5'
    },
    {
      label: 'Available Hours',
      value: '320',
      icon: Clock,
      color: 'text-green-500',
      description: 'This week',
      change: '+40'
    },
    {
      label: 'Materials Ready',
      value: '18',
      icon: Package,
      color: 'text-[var(--color-text-primary)]',
      description: 'Orders ready',
      change: '+2'
    },
    {
      label: 'Workers Assigned',
      value: '35',
      icon: Users,
      color: 'text-[var(--color-text-primary)]',
      description: 'Active assignments',
      change: '+3'
    }
  ]

  return (
    <div className="min-h-screen bg-[var(--color-body)]">
      <div className="p-6 space-y-6">
        <FurniturePageHeader
          title="Production Planning"
          subtitle="Plan and schedule production operations"
          actions={
            <>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Plan
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button size="sm" className="bg-[var(--color-button-bg)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] gap-2">
                <Plus className="h-4 w-4" />
                New Schedule
              </Button>
            </>
          }
        />
        
        {/* Planning Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {planningMetrics.map((metric, index) => (
            <Card key={index} className="p-4 bg-[var(--color-body)]/50 border-[var(--color-border)] hover:bg-[var(--color-body)]/70 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[var(--color-text-secondary)]">{metric.label}</p>
                  <metric.icon className={cn(
            'h-4 w-4',
            metric.color
          )} />
                </div>
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">{metric.value}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{metric.description}</p>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[var(--color-text-secondary)]">Change: {metric.change}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center p-8">
          <p className="text-[var(--color-text-secondary)]">Production planning interface is being loaded...</p>
        </div>
      </div>
    </div>
  )
}