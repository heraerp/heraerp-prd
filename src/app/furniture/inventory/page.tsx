'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { Card } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Badge } from '@/src/components/ui/badge'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { Skeleton } from '@/src/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import {
  Package,
  Package2,
  PackageOpen,
  Truck,
  Building,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Download,
  Eye,
  Edit,
  BarChart3,
  Minus,
  AlertCircle
} from 'lucide-react'
import { useMultiOrgAuth } from '@/src/components/auth/MultiOrgAuthProvider'
import { useFurnitureOrg, FurnitureOrgLoading } from '@/src/components/furniture/FurnitureOrgContext'
import FurniturePageHeader from '@/src/components/furniture/FurniturePageHeader'
import { useInventoryData } from '@/src/lib/furniture/use-inventory-data'
import { cn } from '@/src/lib/utils'

// Stock level thresholds
const STOCK_LEVELS = {
  CRITICAL: 10,
  LOW: 25,
  NORMAL: 50
}

// Movement types configuration
const movementTypes = {
  purchase_receipt: {
    label: 'Purchase Receipt',
    icon: Truck,
    color: 'text-green-500',
    bgColor: 'bg-green-500/20'
  },
  sales_delivery: {
    label: 'Sales Delivery',
    icon: PackageOpen,
    color: 'text-[var(--color-text-primary)]',
    bgColor: 'bg-[var(--color-body)]/20'
  },
  stock_adjustment: {
    label: 'Adjustment',
    icon: RefreshCw,
    color: 'text-[var(--color-text-primary)]',
    bgColor: 'bg-[var(--color-body)]/20'
  },
  production_output: {
    label: 'Production Output',
    icon: Package,
    color: 'text-[var(--color-text-primary)]',
    bgColor: 'bg-[var(--color-body)]/20'
  },
  production_consumption: {
    label: 'Material Consumption',
    icon: Minus,
    color: 'text-red-500',
    bgColor: 'bg-red-500/20'
  }
}

// Stock overview columns
const stockColumns = [
  {
    key: 'entity_code',
    label: 'SKU',
    sortable: true,
    width: '120px',
    render: (value: string) => (
      <span className="font-mono text-sm">{value}</span>
    )
  },
  {
    key: 'entity_name',
    label: 'Product Name',
    sortable: true,
    render: (value: string, row: any) => (
      <div>
        <p className="font-medium text-[var(--color-text-primary)]">{value}</p>
        <p className="text-sm text-[var(--color-text-secondary)]">{row.category || 'Uncategorized'}</p>
      </div>
    )
  },
  {
    key: 'location',
    label: 'Location',
    sortable: true,
    render: (value: string) => (
      <div className="flex items-center gap-2">
        <Building className="h-4 w-4 text-[#37353E]" />
        <span>{value || 'Main Warehouse'}</span>
      </div>
    )
  },
  {
    key: 'on_hand',
    label: 'On Hand',
    sortable: true,
    align: 'right' as const,
    render: (value: number) => {
      const qty = value || 0
      const level = qty <= STOCK_LEVELS.CRITICAL ? 'critical' : qty <= STOCK_LEVELS.LOW ? 'low' : 'normal'
      const colors = {
        critical: 'text-red-600 dark:text-red-400',
        low: 'text-[var(--color-accent-indigo)] dark:text-[var(--color-text-secondary)]',
        normal: 'text-green-600 dark:text-green-400'
      }
      return <span className={cn(
            'font-mono font-medium',
            colors[level]
          )}>{qty}</span>
    }
  }
]

export default function FurnitureInventory() {
  const { isAuthenticated, contextLoading } = useMultiOrgAuth()
  const { organizationId, organizationName, orgLoading } = useFurnitureOrg()
  const { stockData, movements, metrics, loading, refresh } = useInventoryData(organizationId)
  
  const [activeTab, setActiveTab] = useState('stock-overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')

  // Show loading state
  if (orgLoading) {
    return <FurnitureOrgLoading />
  }

  // Authorization checks
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--color-body)] flex items-center justify-center p-6">
        <Alert className="max-w-md bg-[var(--color-body)]/50 border-[var(--color-border)]">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please log in to access inventory management.</AlertDescription>
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

  const inventoryMetrics = [
    {
      label: 'Total Items',
      value: metrics.totalItems?.toString() || '0',
      icon: Package,
      color: 'text-[var(--color-text-primary)]',
      description: 'SKUs in system',
      change: '+5'
    },
    {
      label: 'Low Stock',
      value: metrics.lowStockCount?.toString() || '0',
      icon: AlertTriangle,
      color: 'text-[var(--color-text-primary)]',
      description: 'Below threshold',
      change: '-2'
    },
    {
      label: 'Out of Stock',
      value: metrics.outOfStockCount?.toString() || '0',
      icon: Package2,
      color: 'text-red-500',
      description: 'Zero quantity',
      change: '0'
    },
    {
      label: 'Inventory Value',
      value: `₹${((metrics.totalValue || 0) / 100000).toFixed(2)}L`,
      icon: BarChart3,
      color: 'text-green-500',
      description: 'Total stock value',
      change: '+8%'
    }
  ]

  return (
    <div className="min-h-screen bg-[var(--color-body)]">
      <div className="p-6 space-y-6">
        <FurniturePageHeader
          title="Inventory Management"
          subtitle="Stock overview and movement tracking"
          actions={
            <>
              <Button variant="outline" size="sm" onClick={refresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm" className="bg-[var(--color-button-bg)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] gap-2">
                <Plus className="h-4 w-4" />
                New Item
              </Button>
            </>
          }
        />
        
        {/* Inventory Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {inventoryMetrics.map((metric, index) => (
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
          <p className="text-[var(--color-text-secondary)]">Inventory management interface is being loaded...</p>
        </div>
      </div>
    </div>
  )
}