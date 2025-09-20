'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Package,
  Factory,
  Users,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle,
  BarChart3,
  Settings,
  Plus,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { useDemoOrganization } from '@/lib/dna/patterns/demo-org-pattern'
import FurniturePageHeader from '@/components/furniture/FurniturePageHeader'
import { cn } from '@/lib/utils'

export default function FurnitureProduction() {
  const { isAuthenticated, contextLoading } = useMultiOrgAuth()
  const { organizationId, organizationName, orgLoading } = useDemoOrganization()
  const [activeTab, setActiveTab] = useState('overview')

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
          <AlertDescription>Please log in to access production management.</AlertDescription>
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

  const productionMetrics = [
    {
      label: 'Active Orders',
      value: '15',
      icon: Package,
      color: 'text-[var(--color-text-primary)]',
      description: 'In production',
      change: '+3'
    },
    {
      label: 'Capacity Utilization',
      value: '78%',
      icon: Factory,
      color: 'text-green-500',
      description: 'Current usage',
      change: '+5%'
    },
    {
      label: 'Workers Present',
      value: '42',
      icon: Users,
      color: 'text-[var(--color-text-primary)]',
      description: 'Today shift',
      change: '+2'
    },
    {
      label: 'Efficiency',
      value: '92%',
      icon: TrendingUp,
      color: 'text-[var(--color-text-primary)]',
      description: 'vs target',
      change: '+3%'
    }
  ]

  return (
    <div className="min-h-screen bg-[var(--color-body)]">
      <div className="p-6 space-y-6">
        <FurniturePageHeader
          title="Production Management"
          subtitle="Monitor and manage furniture production operations"
          actions={
            <>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Link href="/furniture/production/orders/new">
                <Button size="sm" className="bg-[var(--color-button-bg)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] gap-2">
                  <Plus className="h-4 w-4" />
                  New Order
                </Button>
              </Link>
            </>
          }
        />
        
        {/* Production Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {productionMetrics.map((metric, index) => (
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

        {/* Production Modules */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Link href="/furniture/production/orders">
            <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-4 hover:scale-105 transition-transform cursor-pointer bg-[var(--color-body)]/50 border-[var(--color-border)] hover:bg-[var(--color-body)]/70">
              <div className="flex flex-col items-center text-center gap-2">
                <Package className="h-8 w-8 text-primary" />
                <span className="text-sm font-medium">Production Orders</span>
              </div>
            </Card>
          </Link>

          <Link href="/furniture/production/planning">
            <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-4 hover:scale-105 transition-transform cursor-pointer bg-[var(--color-body)]/50 border-[var(--color-border)] hover:bg-[var(--color-body)]/70">
              <div className="flex flex-col items-center text-center gap-2">
                <Calendar className="h-8 w-8 text-primary" />
                <span className="text-sm font-medium">Production Planning</span>
              </div>
            </Card>
          </Link>

          <Link href="/furniture/production/tracking">
            <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-4 hover:scale-105 transition-transform cursor-pointer bg-[var(--color-body)]/50 border-[var(--color-border)] hover:bg-[var(--color-body)]/70">
              <div className="flex flex-col items-center text-center gap-2">
                <BarChart3 className="h-8 w-8 text-primary" />
                <span className="text-sm font-medium">Production Tracking</span>
              </div>
            </Card>
          </Link>

          <Link href="/furniture/production/workcenters">
            <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-4 hover:scale-105 transition-transform cursor-pointer bg-[var(--color-body)]/50 border-[var(--color-border)] hover:bg-[var(--color-body)]/70">
              <div className="flex flex-col items-center text-center gap-2">
                <Factory className="h-8 w-8 text-primary" />
                <span className="text-sm font-medium">Work Centers</span>
              </div>
            </Card>
          </Link>
        </div>

        <div className="text-center p-8">
          <p className="text-[var(--color-text-secondary)]">Production management interface is being loaded...</p>
        </div>
      </div>
    </div>
  )
}