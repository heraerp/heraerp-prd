'use client'

import React, { useState, useEffect, useCallback } from 'react'

// Force dynamic rendering to avoid build issues
export const dynamic = 'force-dynamic'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  ChevronRight,
  ChevronDown,
  Search,
  Download,
  FileText,
  TrendingUp,
  AlertCircle,
  Filter,
  RefreshCw
} from 'lucide-react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { useFurnitureOrg, FurnitureOrgLoading } from '@/components/furniture/FurnitureOrgContext'
import FurniturePageHeader from '@/components/furniture/FurniturePageHeader'
import { UniversalReportEngine } from '@/lib/dna/urp/report-engine'
import type { GLAccountNode } from '@/lib/furniture/chart-of-accounts-service'
import { cn } from '@/lib/utils'

// Remove old GLAccount interface as we're using GLAccountNode from the service

export default function ChartOfAccounts() {
  const { isAuthenticated, contextLoading } = useMultiOrgAuth()
  const { organizationId, organizationName, orgLoading } = useFurnitureOrg()
  const [accounts, setAccounts] = useState<GLAccountNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['1000000', '2000000', '3000000', '4000000', '5000000']))
  const [reportEngine, setReportEngine] = useState<UniversalReportEngine | null>(null)
  
  // Debug: Log the organization details
  // Initialize report engine when organization changes
  useEffect(() => {
    if (organizationId) {
      const engine = new UniversalReportEngine({
        organizationId,
        smartCodePrefix: 'HERA.URP',
        enableCaching: true,
        cacheTTL: 300
      })
      setReportEngine(engine)
    }
  }, [organizationId])
  
  // Debug: Log the organization details
  useEffect(() => {
    console.log('Furniture Finance - Chart of Accounts:')
    console.log('Organization Name:', organizationName)
    console.log('Organization ID:', organizationId)
    console.log('Expected Furniture Org ID: f0af4ced-9d12-4a55-a649-b484368db249')
  }, [organizationId, organizationName])

  const loadChartOfAccounts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Loading Chart of Accounts...')
      console.log('Organization ID:', organizationId)
      console.log('Report Engine:', reportEngine ? 'initialized' : 'not initialized')
      
      // Use the existing report engine instance
      if (!reportEngine) {
        setError('Report engine not initialized')
        console.error('❌ Report engine not initialized')
        return
      }
      
      console.log('🚀 Executing URP Recipe: HERA.URP.RECIPE.FINANCE.COA.v1')
      
      // Execute Chart of Accounts recipe
      const result = await reportEngine.executeRecipe(
        'HERA.URP.RECIPE.FINANCE.COA.v1',
        {
          fiscalYear: new Date().getFullYear(),
          includeInactive: false,
          hierarchyDepth: 5
        }
      )
      
      console.log('📊 URP Recipe Result:')
      console.log('Type:', typeof result)
      console.log('Is Array:', Array.isArray(result))
      console.log('Length:', Array.isArray(result) ? result.length : 'N/A')
      console.log('Result:', result)
      
      if (Array.isArray(result) && result.length > 0) {
        console.log('✅ Got URP result, transforming accounts...')
        console.log('Sample account from URP:', result[0])
        
        // Transform URP result to GLAccountNode format recursively
        const transformAccount = (account: any): GLAccountNode => ({
          id: account.id,
          entity_code: account.accountCode || account.entity_code,
          entity_name: account.entity_name,
          entity_type: 'gl_account',
          metadata: {
            account_type: account.accountType || 'detail',
            account_level: account.indentLevel || account.level || 0
          },
          organization_id: organizationId,
          children: account.children ? account.children.map(transformAccount) : [],
          level: account.indentLevel || account.level || 0,
          debit_total: account.balance > 0 ? account.balance : 0,
          credit_total: account.balance < 0 ? Math.abs(account.balance) : 0,
          current_balance: Math.abs(account.totalBalance || account.balance || 0),
          balance_type: (account.normalBalance === 'credit' || account.balance < 0) ? 'Cr' : 'Dr'
        })
        
        const transformedAccounts = result.map(transformAccount)
        setAccounts(transformedAccounts)
        
        console.log('✅ Chart of Accounts loaded successfully via URP:')
        console.log(`- Total accounts: ${countAllAccounts(transformedAccounts)}`)
        console.log('- Sample transformed account:', transformedAccounts[0])
      } else {
        console.log('❌ No GL accounts in URP result')
        setError('No GL accounts found for this organization')
        setAccounts([])
      }
      
    } catch (error) {
      console.error('❌ Failed to load chart of accounts:', error)
      console.error('Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      })
      setError(error instanceof Error ? error.message : 'Unknown error occurred')
      setAccounts([])
    } finally {
      setLoading(false)
    }
  }, [reportEngine, organizationId])
  
  useEffect(() => {
    if (organizationId && !orgLoading && reportEngine) {
      console.log('🎯 Triggering loadChartOfAccounts - all conditions met')
      loadChartOfAccounts()
    } else {
      console.log('⏳ Waiting for conditions:', {
        organizationId: !!organizationId,
        orgLoading,
        reportEngine: !!reportEngine
      })
    }
  }, [organizationId, orgLoading, reportEngine, loadChartOfAccounts])

  const toggleExpand = (accountCode: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(accountCode)) {
        newSet.delete(accountCode)
      } else {
        newSet.add(accountCode)
      }
      return newSet
    })
  }
  
  const handleExport = async (format: 'csv' | 'excel' = 'csv') => {
    if (!reportEngine) {
      alert('Report engine not initialized')
      return
    }
    
    try {
      const result = await reportEngine.executeRecipe(
        'HERA.URP.RECIPE.FINANCE.COA.v1',
        {
          fiscalYear: new Date().getFullYear(),
          includeInactive: false,
          hierarchyDepth: 5
        },
        {
          format: format === 'csv' ? 'csv' : 'excel'
        }
      )
      
      // Create download
      const blob = new Blob([result], { type: format === 'csv' ? 'text/csv' : 'application/vnd.ms-excel' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chart-of-accounts-${organizationId}-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export Chart of Accounts')
    }
  }
  
  const renderAccount = (account: GLAccountNode, level: number = 0): React.ReactNode => {
    const hasChildren = account.children && account.children.length > 0
    const isExpanded = expandedNodes.has(account.entity_code)
    const isHeader = (account.metadata as any)?.account_type === 'header'
    
    // Filter by search term
    if (searchTerm) {
      const matchesSearch = 
        account.entity_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.entity_name.toLowerCase().includes(searchTerm.toLowerCase())
      
      if (!matchesSearch && !hasChildren) return null
    }
    
    // Handle cases where metadata might be null or undefined
    const accountType = (account.metadata as any)?.account_type || 'detail'
    const accountLevel = (account.metadata as any)?.account_level || 0
    
    return (
      <div key={account.entity_code}>
        <div
          className={cn(
            "grid grid-cols-12 gap-4 py-2 px-3 hover:bg-gray-800/50 transition-colors border-b border-gray-800",
            isHeader && "bg-gray-800/30",
            level === 0 && "font-semibold"
          )}
        >
          {/* Account Code & Name */}
          <div className="col-span-6 flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
            {hasChildren && (
              <button
                onClick={() => toggleExpand(account.entity_code)}
                className="p-0.5 hover:bg-gray-700 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-5" />}
            
            <div className="flex items-center gap-3 flex-1">
              <span className={cn(
                "font-mono text-sm",
                isHeader ? "text-blue-400" : "text-gray-300"
              )}>
                {account.entity_code}
              </span>
              <span className={cn(
                "flex-1",
                isHeader ? "text-blue-300 font-medium" : "text-gray-200",
                level > 1 && "text-sm"
              )}>
                {account.entity_name}
              </span>
            </div>
          </div>
          
          {/* Account Type */}
          <div className="col-span-1 flex items-center">
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs border-0",
                isHeader ? "bg-blue-500/20 text-blue-400" : "bg-gray-700/50 text-gray-400"
              )}
            >
              {isHeader ? 'Header' : 'Detail'}
            </Badge>
          </div>
          
          {/* Debit */}
          <div className="col-span-2 text-right font-mono text-sm">
            {account.debit_total ? (
              <span className="text-red-400">
                ₹{account.debit_total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            ) : (
              <span className="text-gray-600">-</span>
            )}
          </div>
          
          {/* Credit */}
          <div className="col-span-2 text-right font-mono text-sm">
            {account.credit_total ? (
              <span className="text-green-400">
                ₹{account.credit_total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            ) : (
              <span className="text-gray-600">-</span>
            )}
          </div>
          
          {/* Balance */}
          <div className="col-span-1 text-right font-mono text-sm">
            {account.current_balance ? (
              <span className={cn(
                "font-medium",
                account.balance_type === 'Dr' ? "text-red-400" : "text-green-400"
              )}>
                ₹{account.current_balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {account.balance_type}
              </span>
            ) : (
              <span className="text-gray-600">-</span>
            )}
          </div>
        </div>
        
        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div>
            {account.children!.map(child => renderAccount(child, level + 1))}
          </div>
        )}
      </div>
    )
  }
  
  // Calculate totals and count all accounts including children
  const countAllAccounts = (accs: GLAccountNode[]): number => {
    return accs.reduce((count, account) => {
      return count + 1 + (account.children ? countAllAccounts(account.children) : 0)
    }, 0)
  }
  
  const totalAccountCount = countAllAccounts(accounts)
  
  const totals = accounts.reduce((acc, account) => {
    acc.debit += account.debit_total || 0
    acc.credit += account.credit_total || 0
    return acc
  }, { debit: 0, credit: 0 })
  
  // Show loading state
  if (orgLoading) {
    return <FurnitureOrgLoading />
  }

  // Authorization checks
  if (isAuthenticated && contextLoading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="p-6 space-y-6">
        {/* Header */}
        <FurniturePageHeader
          title="Chart of Accounts"
          subtitle="Hierarchical view of general ledger accounts"
          actions={
            <>
              <Button variant="outline" size="sm" onClick={async () => {
                if (reportEngine) {
                  await reportEngine.clearCache('HERA.URP.RECIPE.FINANCE.COA.v1')
                }
                loadChartOfAccounts()
              }}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </>
          }
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4 bg-gray-800/50 border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Accounts</p>
                <p className="text-2xl font-bold">{totalAccountCount}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-600" />
            </div>
          </Card>
          
          <Card className="p-4 bg-gray-800/50 border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Debit</p>
                <p className="text-2xl font-bold text-red-400">
                  ₹{totals.debit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-600" />
            </div>
          </Card>
          
          <Card className="p-4 bg-gray-800/50 border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Credit</p>
                <p className="text-2xl font-bold text-green-400">
                  ₹{totals.credit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </Card>
          
          <Card className="p-4 bg-gray-800/50 border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Balance</p>
                <p className="text-2xl font-bold text-blue-400">
                  {Math.abs(totals.debit - totals.credit) < 0.01 ? 'Balanced' : 
                    `₹${Math.abs(totals.debit - totals.credit).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                  }
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
        </div>

        {/* Error or No Accounts Alert */}
        {!loading && (error || accounts.length === 0) && (
          <Alert className="bg-amber-900/20 border-amber-600/50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div className="text-amber-200">
                  {error ? (
                    <>
                      Error loading Chart of Accounts: {error}
                      <br />
                      Organization: {organizationName} (ID: {organizationId})
                    </>
                  ) : (
                    <>
                      No GL accounts found for organization: {organizationName} (ID: {organizationId}).
                      <br />
                      This might be because the Chart of Accounts hasn't been set up yet.
                    </>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="ml-4 border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white"
                  onClick={() => {
                    if (error) {
                      loadChartOfAccounts()
                    } else {
                      alert('Chart of Accounts setup would be triggered here. This typically involves running the COA setup for furniture manufacturing industry.')
                    }
                  }}
                >
                  {error ? 'Retry' : 'Setup Chart of Accounts'}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Search Bar */}
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by account code or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-400"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </Card>

        {/* Chart of Accounts Table */}
        <Card className="bg-gray-800/50 border-gray-700 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 py-3 px-3 bg-gray-900/50 border-b border-gray-700 font-semibold text-sm text-gray-300">
            <div className="col-span-6">Account Code & Description</div>
            <div className="col-span-1">Type</div>
            <div className="col-span-2 text-right">Debit (₹)</div>
            <div className="col-span-2 text-right">Credit (₹)</div>
            <div className="col-span-1 text-right">Balance</div>
          </div>
          
          {/* Table Body */}
          <div className="max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center gap-2">
                  <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-400">Loading chart of accounts...</span>
                </div>
              </div>
            ) : accounts.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No accounts found</p>
              </div>
            ) : (
              accounts.map(account => renderAccount(account))
            )}
          </div>
          
          {/* Table Footer */}
          {accounts.length > 0 && (
            <div className="grid grid-cols-12 gap-4 py-3 px-3 bg-gray-900/50 border-t border-gray-700 font-bold text-sm">
              <div className="col-span-7 text-gray-300">TOTAL</div>
              <div className="col-span-2 text-right text-red-400 font-mono">
                ₹{totals.debit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="col-span-2 text-right text-green-400 font-mono">
                ₹{totals.credit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="col-span-1"></div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}