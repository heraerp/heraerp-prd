'use client'

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
      in_progress: { bg: 'bg-[var(--color-body)] dark:bg-[var(--color-body)]/30', text: 'text-[var(--color-text-primary)] dark:text-[var(--color-text-primary)]', icon: Package },
      completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', icon: CheckCircle },
      cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200', icon: AlertCircle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon
    
    
    return (
      <Badge variant="outline" className={cn(
            'border-0',
            config.bg, config.text
          )}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </Badge>
    )
  }

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
          <AlertDescription>Please log in to access production orders.</AlertDescription>
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

  const orderMetrics = [
    {
      label: 'Total Orders',
      value: productionOrders?.length?.toString() || '0',
      icon: Package,
      color: 'text-[var(--color-text-primary)]',
      description: 'All production orders',
      change: '+2'
    },
    {
      label: 'In Progress',
      value: productionOrders?.filter(o => o.metadata?.status === 'in_progress')?.length?.toString() || '0',
      icon: Clock,
      color: 'text-[var(--color-text-primary)]',
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
    <div className="min-h-screen bg-[var(--color-body)]">
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
                <Button size="sm" className="bg-[var(--color-button-bg)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] gap-2">
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

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--color-text-secondary)]" />
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
        <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6">
          <div className="text-center p-8">
            <p className="text-[var(--color-text-secondary)]">Production orders table interface is being loaded...</p>
            {ordersLoading && <p className="text-sm text-[var(--color-text-secondary)] mt-2">Loading orders...</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}