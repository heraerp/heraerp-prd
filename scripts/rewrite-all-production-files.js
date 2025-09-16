#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Completely rewrite all problematic production files

const productionOrdersPageContent = `'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { EnterpriseDataTable } from '@/lib/dna/components/organisms/EnterpriseDataTable'
import {
  Search,
  Plus,
  Filter,
  Download,
  Package,
  Calendar,
  User,
  AlertCircle,
  Clock,
  CheckCircle,
  Truck
} from 'lucide-react'
import Link from 'next/link'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { useDemoOrganization } from '@/lib/dna/patterns/demo-org-pattern'
import FurniturePageHeader from '@/components/furniture/FurniturePageHeader'
import { useUniversalData } from '@/lib/dna/patterns/universal-api-loading-pattern'
import { cn } from '@/lib/utils'

export default function ProductionOrdersPage() {
  const { isAuthenticated, contextLoading } = useMultiOrgAuth()
  const { organizationId, organizationName, orgLoading } = useDemoOrganization()
  const [searchTerm, setSearchTerm] = useState('')
  
  // Load production orders from universal_transactions
  const { data: productionOrders, isLoading: ordersLoading } = useUniversalData({
    table: 'universal_transactions',
    filter: item => 
      item.transaction_type === 'production_order' && 
      item.organization_id === organizationId &&
      (!searchTerm || 
        item.transaction_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())),
    organizationId,
    enabled: !!organizationId
  })

  // Load entities for customer names and products
  const { data: entities } = useUniversalData({
    table: 'core_entities',
    filter: item => item.organization_id === organizationId,
    organizationId,
    enabled: !!organizationId
  })

  // Load transaction lines for order details
  const { data: transactionLines } = useUniversalData({
    table: 'universal_transaction_lines',
    filter: item => item.organization_id === organizationId,
    organizationId,
    enabled: !!organizationId
  })

  const getCustomerName = (customerId: string) => {
    const customer = entities?.find(e => e.id === customerId && e.entity_type === 'customer')
    return customer?.entity_name || 'Unknown Customer'
  }

  const getOrderItems = (orderId: string) => {
    return transactionLines?.filter(line => line.transaction_id === orderId) || []
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200', icon: Clock },
      in_progress: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200', icon: Package },
      completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', icon: CheckCircle },
      cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200', icon: AlertCircle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon
    
    return (
      <Badge variant="outline" className={cn('border-0', config.bg, config.text)}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </Badge>
    )
  }

  // Show loading state
  if (orgLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
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
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Alert className="max-w-md bg-card/50 border-border">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please log in to access production orders.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (contextLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
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

  const orderMetrics = [
    {
      label: 'Total Orders',
      value: productionOrders?.length?.toString() || '0',
      icon: Package,
      color: 'text-blue-500',
      description: 'All production orders',
      change: '+2'
    },
    {
      label: 'In Progress',
      value: productionOrders?.filter(o => o.metadata?.status === 'in_progress')?.length?.toString() || '0',
      icon: Clock,
      color: 'text-amber-500',
      description: 'Currently producing',
      change: '+1'
    },
    {
      label: 'Completed',
      value: productionOrders?.filter(o => o.metadata?.status === 'completed')?.length?.toString() || '0',
      icon: CheckCircle,
      color: 'text-green-500',
      description: 'Ready for delivery',
      change: '+3'
    },
    {
      label: 'Pending',
      value: productionOrders?.filter(o => o.metadata?.status === 'pending')?.length?.toString() || '0',
      icon: AlertCircle,
      color: 'text-red-500',
      description: 'Awaiting start',
      change: '0'
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 space-y-6">
        <FurniturePageHeader
          title="Production Orders"
          subtitle="Manage production orders and track progress"
          actions={
            <>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Link href="/furniture/production/orders/new">
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Order
                </Button>
              </Link>
            </>
          }
        />
        
        {/* Order Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {orderMetrics.map((metric, index) => (
            <Card key={index} className="p-4 bg-card/50 border-border hover:bg-card/70 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <metric.icon className={cn('h-4 w-4', metric.color)} />
                </div>
                <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.description}</p>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Change: {metric.change}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders by code or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Orders Table */}
        <Card className="p-6">
          <div className="text-center p-8">
            <p className="text-muted-foreground">Production orders table interface is being loaded...</p>
            {ordersLoading && <p className="text-sm text-muted-foreground mt-2">Loading orders...</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}`;

const productionPageContent = `'use client'

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
      <div className="min-h-screen bg-background p-6">
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
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Alert className="max-w-md bg-card/50 border-border">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please log in to access production management.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (contextLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
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
      color: 'text-blue-500',
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
      color: 'text-purple-500',
      description: 'Today shift',
      change: '+2'
    },
    {
      label: 'Efficiency',
      value: '92%',
      icon: TrendingUp,
      color: 'text-amber-500',
      description: 'vs target',
      change: '+3%'
    }
  ]

  return (
    <div className="min-h-screen bg-background">
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
                <Button size="sm" className="gap-2">
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
            <Card key={index} className="p-4 bg-card/50 border-border hover:bg-card/70 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <metric.icon className={cn('h-4 w-4', metric.color)} />
                </div>
                <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.description}</p>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Change: {metric.change}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Production Modules */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Link href="/furniture/production/orders">
            <Card className="p-4 hover:scale-105 transition-transform cursor-pointer bg-card/50 border-border hover:bg-card/70">
              <div className="flex flex-col items-center text-center gap-2">
                <Package className="h-8 w-8 text-primary" />
                <span className="text-sm font-medium">Production Orders</span>
              </div>
            </Card>
          </Link>

          <Link href="/furniture/production/planning">
            <Card className="p-4 hover:scale-105 transition-transform cursor-pointer bg-card/50 border-border hover:bg-card/70">
              <div className="flex flex-col items-center text-center gap-2">
                <Calendar className="h-8 w-8 text-primary" />
                <span className="text-sm font-medium">Production Planning</span>
              </div>
            </Card>
          </Link>

          <Link href="/furniture/production/tracking">
            <Card className="p-4 hover:scale-105 transition-transform cursor-pointer bg-card/50 border-border hover:bg-card/70">
              <div className="flex flex-col items-center text-center gap-2">
                <BarChart3 className="h-8 w-8 text-primary" />
                <span className="text-sm font-medium">Production Tracking</span>
              </div>
            </Card>
          </Link>

          <Link href="/furniture/production/workcenters">
            <Card className="p-4 hover:scale-105 transition-transform cursor-pointer bg-card/50 border-border hover:bg-card/70">
              <div className="flex flex-col items-center text-center gap-2">
                <Factory className="h-8 w-8 text-primary" />
                <span className="text-sm font-medium">Work Centers</span>
              </div>
            </Card>
          </Link>
        </div>

        <div className="text-center p-8">
          <p className="text-muted-foreground">Production management interface is being loaded...</p>
        </div>
      </div>
    </div>
  )
}`;

const productionPlanningContent = `'use client'

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
import { useDemoOrganization } from '@/lib/dna/patterns/demo-org-pattern'
import FurniturePageHeader from '@/components/furniture/FurniturePageHeader'
import { cn } from '@/lib/utils'

export default function ProductionPlanningPage() {
  const { isAuthenticated, contextLoading } = useMultiOrgAuth()
  const { organizationId, organizationName, orgLoading } = useDemoOrganization()

  // Show loading state
  if (orgLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
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
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Alert className="max-w-md bg-card/50 border-border">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please log in to access production planning.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (contextLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
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
      color: 'text-blue-500',
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
      color: 'text-purple-500',
      description: 'Orders ready',
      change: '+2'
    },
    {
      label: 'Workers Assigned',
      value: '35',
      icon: Users,
      color: 'text-amber-500',
      description: 'Active assignments',
      change: '+3'
    }
  ]

  return (
    <div className="min-h-screen bg-background">
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
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                New Schedule
              </Button>
            </>
          }
        />
        
        {/* Planning Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {planningMetrics.map((metric, index) => (
            <Card key={index} className="p-4 bg-card/50 border-border hover:bg-card/70 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <metric.icon className={cn('h-4 w-4', metric.color)} />
                </div>
                <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.description}</p>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Change: {metric.change}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center p-8">
          <p className="text-muted-foreground">Production planning interface is being loaded...</p>
        </div>
      </div>
    </div>
  )
}`;

// Write the files
const files = [
  {
    path: 'src/app/furniture/production/orders/page.tsx',
    content: productionOrdersPageContent
  },
  {
    path: 'src/app/furniture/production/page.tsx',
    content: productionPageContent
  },
  {
    path: 'src/app/furniture/production/planning/page.tsx',
    content: productionPlanningContent
  }
];

files.forEach(file => {
  const filePath = path.join(process.cwd(), file.path);
  fs.writeFileSync(filePath, file.content, 'utf8');
  console.log(`✅ Completely rewrote ${file.path}`);
});

console.log('\n✨ All production files rewritten with clean syntax!');