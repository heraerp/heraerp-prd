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
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  FileText,
  Calculator,
  PiggyBank,
  CreditCard,
  Search,
  Filter,
  ChevronRight,
  Building,
  Receipt,
  BarChart3,
  Download,
  Plus
} from 'lucide-react'
import { useMultiOrgAuth } from '@/src/components/auth/MultiOrgAuthProvider'
import { useFurnitureOrg, FurnitureOrgLoading } from '@/src/components/furniture/FurnitureOrgContext'
import FurniturePageHeader from '@/src/components/furniture/FurniturePageHeader'
import { useFinanceData } from '@/src/lib/furniture/use-finance-data'
import { cn } from '@/src/lib/utils'

// GL Account columns
  const glAccountColumns = [
  {
    key: 'entity_code',
    label: 'Account Code', 
    sortable: true,
    width: '120px',
    render: (value: string) => (
      <span className="font-mono text-sm">{value}</span>
    )
  },
  {
    key: 'entity_name',
    label: 'Account Name',
    sortable: true,
    render: (value: string, row: any) => {
      const depth = row.depth || 0
      const indent = depth * 24
      const isHeader = (row.metadata as any)?.account_type === 'header'
      
      return (
        <div style={{ paddingLeft: `${indent}px` }
    } className="flex items-start gap-1">
          {depth > 0 && <span className="text-[var(--color-text-secondary)] text-xs mt-1">└─</span>}
          <div>
            <p className={cn(
              'font-medium',
              isHeader && 'text-primary dark:text-[var(--color-text-secondary)]',
              !isHeader && depth > 0 && 'text-sm'
            )}>
              {value}
            </p>
            {(row.metadata as any)?.ifrs_classification && (
              <p className="text-xs text-[var(--color-text-secondary)]">
                IFRS: {row.metadata.ifrs_classification}
              </p>
            )}
          </div>
        </div>
      )
    }
  },
  {
    key: 'account_type',
    label: 'Type',
    sortable: true,
    render: (_: any, row: any) => {
      const type = (row.metadata as any)?.account_type || 'detail'
      const colors = {
        header: 'bg-[var(--color-body)]/20 text-primary',
        detail: 'bg-gray-900/20 text-[var(--color-text-secondary)]'
      }
      
      
    return (
        <Badge variant="outline" className={cn(
            'border-0',
            colors[type]
          )}>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Badge>
      )
    }
  }
]

export default function FurnitureFinance() {
  const { isAuthenticated, contextLoading } = useMultiOrgAuth()
  const { organizationId, organizationName, orgLoading } = useFurnitureOrg()
  const { glAccounts, metrics, loading, refresh } = useFinanceData(organizationId)
  const [activeTab, setActiveTab] = useState('chart-of-accounts')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedLevel, setSelectedLevel] = useState('all')

  // Build hierarchical structure
  const buildHierarchy = () => {
    const hierarchy: any[] = []
    const accountMap: Record<string, any> = {}

// Create a map for easy lookup
    glAccounts.forEach(account => {
      accountMap[account.entity_code] = { ...account, children: [] }
    })
    
    // Build the tree
    glAccounts.forEach(account => {
      const parentCode = (account.metadata as any)?.parent_account
      if (parentCode && accountMap[parentCode]) {
        accountMap[parentCode].children.push(accountMap[account.entity_code])
      } else if ((account.metadata as any)?.account_level === 1) {
        // Top level accounts
        hierarchy.push(accountMap[account.entity_code])
      }
    })
    
    // Flatten the hierarchy for table display with proper ordering
  const flattenHierarchy = (nodes: any[], depth = 0): any[] => {
      const result: any[] = []
      nodes.forEach(node => {
        result.push({ ...node, depth })
        if (node.children && node.children.length > 0) {
          // Sort children by code
          node.children.sort((a: any, b: any) => a.entity_code.localeCompare(b.entity_code))
          result.push(...flattenHierarchy(node.children, depth + 1))
        }
      })
      return result
    }

// Sort top level by code
    hierarchy.sort((a, b) => a.entity_code.localeCompare(b.entity_code))
    return flattenHierarchy(hierarchy)
  }

  const hierarchicalAccounts = buildHierarchy()
  
  // Filter hierarchical accounts
  const filteredAccounts = hierarchicalAccounts.filter(account => {
    const matchesSearch = !searchTerm || 
      account.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.entity_code.includes(searchTerm)

    const matchesType = selectedType === 'all' || (account.metadata as any)?.account_type === selectedType
    const matchesLevel = selectedLevel === 'all' || (account.metadata as any)?.account_level?.toString() === selectedLevel
    return matchesSearch && matchesType && matchesLevel
  })

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
          <AlertDescription>Please log in to access finance management.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (contextLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-body)] p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Assets',
      value: `₹${(metrics.totalAssets / 100000).toFixed(2)}L`,
      icon: Building,
      color: 'text-[var(--color-text-primary)]',
      description: 'Current + Non-current',
      change: '+12%'
    },
    {
      label: 'Total Liabilities',
      value: `₹${(metrics.totalLiabilities / 100000).toFixed(2)}L`,
      icon: CreditCard,
      color: 'text-red-500',
      description: 'Payables + Loans',
      change: '-5%'
    },
    {
      label: 'Total Equity',
      value: `₹${(metrics.totalEquity / 100000).toFixed(2)}L`,
      icon: PiggyBank,
      color: 'text-green-500',
      description: 'Assets - Liabilities',
      change: '+18%'
    }
  ]

  
    return (
    <div className="min-h-screen bg-[var(--color-body)]">
      <div className="p-6 space-y-6">
        <FurniturePageHeader
          title="Finance Management"
          subtitle="Chart of Accounts and Financial Overview"
          actions={
            <>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export COA
              </Button>
              <Button size="sm" className="bg-[var(--color-button-bg)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] gap-2">
                <Plus className="h-4 w-4" />
                Journal Entry
              </Button>
            </>
          }
        />
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statCards.map((stat, index) => (
            <Card key={index} className="p-4 bg-[var(--color-body)]/50 border-[var(--color-border)] hover:bg-[var(--color-body)]/70 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[var(--color-text-secondary)]">{stat.label}</p>
                  <stat.icon className={cn(
            'h-4 w-4',
            stat.color
          )} />
                </div>
                <p className="text-xl font-bold text-[var(--color-text-primary)]">{stat.value}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{stat.description}</p>
                <div className="flex items-center gap-1">
                  {stat.change.startsWith('+') ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={cn(
                    'text-xs',
                    stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'
                  )}>
                    {stat.change}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center p-8">
          <p className="text-[var(--color-text-secondary)]">Finance management interface is being loaded...</p>
        </div>
      </div>
    </div>
  )
}