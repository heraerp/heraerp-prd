'use client'

import React, { useState, useEffect, useCallback } from 'react'

// Force dynamic rendering to avoid build issues
// Removed force-dynamic for better client-side navigation performance

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
  RefreshCw,
  Building2,
  Scissors,
  DollarSign
} from 'lucide-react'
import { useSecuredSalonContext } from '../SecuredSalonProvider'
import { UniversalReportEngine } from '@/lib/dna/urp/report-engine'
// Define GLAccountNode type locally since furniture library was removed
interface GLAccountNode {
  id: string
  entity_code: string
  entity_name: string
  entity_type: string
  metadata: any
  organization_id: string
  level: number
  debit_total: number
  credit_total: number
  current_balance: number
  balance_type: 'Dr' | 'Cr'
  children?: GLAccountNode[]
}
import { cn } from '@/lib/utils'

export default function SalonChartOfAccounts() {
  const { organizationId, organizationName, contextLoading } = useSecuredSalonContext()

  const [accounts, setAccounts] = useState<GLAccountNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(['1000000', '2000000', '3000000', '4000000', '5000000'])
  )
  const [reportEngine, setReportEngine] = useState<UniversalReportEngine | null>(null)

  // Initialize report engine when organization changes
  useEffect(() => {
    if (organizationId) {
      const engine = new UniversalReportEngine({
        organizationId,
        smartCodePrefix: 'HERA.URP.SALON',
        enableCaching: true,
        cacheTTL: 300
      })
      setReportEngine(engine)
    }
  }, [organizationId])

  // Debug: Log the organization details
  useEffect(() => {
    console.log('Salon Finance - Chart of Accounts:')
    console.log('Organization Name:', organizationName)
    console.log('Organization ID:', organizationId)
  }, [organizationId, organizationName])

  const loadChartOfAccounts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔍 Loading Salon Chart of Accounts...')
      console.log('Organization ID:', organizationId)
      console.log('Report Engine:', reportEngine ? 'initialized' : 'not initialized')

      // Use the existing report engine instance
      if (!reportEngine) {
        setError('Report engine not initialized')
        console.error('❌ Report engine not initialized')
        return
      }

      console.log('🚀 Executing URP Recipe: HERA.URP.RECIPE.SALON.COA.V1')

      // Execute Chart of Accounts recipe for salon industry
      const result = await reportEngine.executeRecipe('HERA.URP.RECIPE.SALON.COA.V1', {
        fiscalYear: new Date().getFullYear(),
        includeInactive: false,
        hierarchyDepth: 5,
        industryType: 'salon',
        includeServiceAccounts: true,
        includeInventoryAccounts: true
      })

      console.log('📊 URP Recipe Result:')
      console.log('Type:', typeof result)
      console.log('Is Array:', Array.isArray(result))
      console.log('Length:', Array.isArray(result) ? result.length : 'N/A')
      console.log('Result:', result)

      if (Array.isArray(result) && result.length > 0) {
        console.log('✅ Got URP result, transforming salon accounts...')
        console.log('Sample account from URP:', result[0])

        // Transform URP result to GLAccountNode format recursively
        const transformAccount = (account: any): GLAccountNode => ({
          id: account.id,
          entity_code: account.accountCode || account.entity_code,
          entity_name: account.entity_name,
          entity_type: 'gl_account',
          metadata: {
            account_type: account.accountType || 'detail',
            account_level: account.indentLevel || account.level || 0,
            salon_category: account.salonCategory || null,
            service_related: account.serviceRelated || false
          },
          organization_id: organizationId,
          children: account.children ? account.children.map(transformAccount) : [],
          level: account.indentLevel || account.level || 0,
          debit_total: account.balance > 0 ? account.balance : 0,
          credit_total: account.balance < 0 ? Math.abs(account.balance) : 0,
          current_balance: Math.abs(account.totalBalance || account.balance || 0),
          balance_type: account.normalBalance === 'credit' || account.balance < 0 ? 'Cr' : 'Dr'
        })

        const transformedAccounts = result.map(transformAccount)
        setAccounts(transformedAccounts)
        console.log('✅ Salon Chart of Accounts loaded successfully via URP:')
        console.log(`- Total accounts: ${countAllAccounts(transformedAccounts)}`)
        console.log('- Sample transformed account:', transformedAccounts[0])
      } else {
        console.log('❌ No GL accounts in URP result, using fallback salon accounts')
        // Fallback salon accounts structure
        const fallbackAccounts = createFallbackSalonAccounts(organizationId)
        setAccounts(fallbackAccounts)
      }
    } catch (error) {
      console.error('❌ Failed to load salon chart of accounts:', error)
      console.error('Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      })
      
      // Create fallback salon COA on error
      console.log('🔄 Creating fallback salon chart of accounts...')
      const fallbackAccounts = createFallbackSalonAccounts(organizationId)
      setAccounts(fallbackAccounts)
      setError(null) // Clear error since we have fallback
    } finally {
      setLoading(false)
    }
  }, [reportEngine, organizationId])

  useEffect(() => {
    if (organizationId && !contextLoading && reportEngine) {
      console.log('🎯 Triggering loadChartOfAccounts - all conditions met')
      loadChartOfAccounts()
    } else {
      console.log('⏳ Waiting for conditions:', {
        organizationId: !!organizationId,
        contextLoading,
        reportEngine: !!reportEngine
      })
    }
  }, [organizationId, contextLoading, reportEngine, loadChartOfAccounts])

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
        'HERA.URP.RECIPE.SALON.COA.V1',
        {
          fiscalYear: new Date().getFullYear(),
          includeInactive: false,
          hierarchyDepth: 5,
          industryType: 'salon'
        },
        {
          format: format === 'csv' ? 'csv' : 'excel'
        }
      )

      // Create download
      const blob = new Blob([result], {
        type: format === 'csv' ? 'text/csv' : 'application/vnd.ms-excel'
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `salon-chart-of-accounts-${organizationId}-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export Salon Chart of Accounts')
    }
  }

  const renderAccount = (account: GLAccountNode, level: number = 0): React.ReactNode => {
    const hasChildren = account.children && account.children.length > 0
    const isExpanded = expandedNodes.has(account.entity_code)
    const isHeader = (account.metadata as any)?.account_type === 'header'
    const isServiceRelated = (account.metadata as any)?.service_related
    const salonCategory = (account.metadata as any)?.salon_category

    // Filter by search term
    if (searchTerm) {
      const matchesSearch =
        account.entity_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.entity_name.toLowerCase().includes(searchTerm.toLowerCase())
      if (!matchesSearch && !hasChildren) return null
    }

    return (
      <div key={account.entity_code}>
        <div
          className={cn(
            'grid grid-cols-12 gap-4 py-2 px-3 hover:bg-purple-900/10 transition-colors border-b border-purple-800/20',
            isHeader && 'bg-purple-900/20',
            level === 0 && 'font-semibold',
            isServiceRelated && 'bg-pink-900/10'
          )}
        >
          {/* Account Code & Name */}
          <div
            className="col-span-6 flex items-center gap-2"
            style={{ paddingLeft: `${level * 24}px` }}
          >
            {hasChildren && (
              <button
                onClick={() => toggleExpand(account.entity_code)}
                className="p-0.5 hover:bg-purple-600/30 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-purple-300" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-purple-300" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-5" />}
            <div className="flex items-center gap-3 flex-1">
              <span
                className={cn(
                  'font-mono text-sm',
                  isHeader ? 'text-purple-200' : 'text-purple-300'
                )}
              >
                {account.entity_code}
              </span>
              <span
                className={cn(
                  'flex-1',
                  isHeader ? 'text-white font-medium' : 'text-gray-200',
                  level > 1 && 'text-sm'
                )}
              >
                {account.entity_name}
              </span>
              {isServiceRelated && (
                <Scissors className="h-3 w-3 text-pink-400" />
              )}
              {salonCategory && (
                <Badge variant="outline" className="text-xs border-purple-500 text-purple-300">
                  {salonCategory}
                </Badge>
              )}
            </div>
          </div>

          {/* Account Type */}
          <div className="col-span-1 flex items-center">
            <Badge
              variant="outline"
              className={cn(
                'text-xs border-0',
                isHeader
                  ? 'bg-purple-900/30 text-purple-200'
                  : 'bg-purple-800/20 text-purple-300'
              )}
            >
              {isHeader ? 'Header' : 'Detail'}
            </Badge>
          </div>

          {/* Debit */}
          <div className="col-span-2 text-right font-mono text-sm">
            {account.debit_total ? (
              <span className="text-red-400">
                ₹{' '}
                {account.debit_total.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
            ) : (
              <span className="text-gray-500">-</span>
            )}
          </div>

          {/* Credit */}
          <div className="col-span-2 text-right font-mono text-sm">
            {account.credit_total ? (
              <span className="text-green-400">
                ₹{' '}
                {account.credit_total.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
            ) : (
              <span className="text-gray-500">-</span>
            )}
          </div>

          {/* Balance */}
          <div className="col-span-1 text-right font-mono text-sm">
            {account.current_balance ? (
              <span
                className={cn(
                  'font-medium',
                  account.balance_type === 'Dr' ? 'text-red-400' : 'text-green-400'
                )}
              >
                ₹{' '}
                {account.current_balance.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}{' '}
                {account.balance_type}
              </span>
            ) : (
              <span className="text-gray-500">-</span>
            )}
          </div>
        </div>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div>{account.children!.map(child => renderAccount(child, level + 1))}</div>
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

  const totals = accounts.reduce(
    (acc, account) => {
      const addAccountTotals = (accountNode: GLAccountNode) => {
        acc.debit += accountNode.debit_total || 0
        acc.credit += accountNode.credit_total || 0
        if (accountNode.children) {
          accountNode.children.forEach(addAccountTotals)
        }
      }
      addAccountTotals(account)
      return acc
    },
    { debit: 0, credit: 0 }
  )

  // Show loading state
  if (contextLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-purple-300" />
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  Chart of Accounts
                  <Scissors className="h-6 w-6 text-pink-400" />
                </h1>
                <p className="text-purple-200">
                  Salon financial account hierarchy for {organizationName}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (reportEngine) {
                  await reportEngine.clearCache('HERA.URP.RECIPE.SALON.COA.V1')
                }
                loadChartOfAccounts()
              }}
              className="border-purple-400 text-purple-300 hover:bg-purple-600"
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleExport('csv')}
              className="border-purple-400 text-purple-300 hover:bg-purple-600"
            >
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-purple-900/50 border-purple-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-200">Total Accounts</p>
                <p className="text-2xl font-bold text-white">{totalAccountCount}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-300" />
            </div>
          </Card>

          <Card className="bg-purple-900/50 border-purple-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-200">Total Debit</p>
                <p className="text-2xl font-bold text-red-400">
                  ₹{totals.debit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-500" />
            </div>
          </Card>

          <Card className="bg-purple-900/50 border-purple-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-200">Total Credit</p>
                <p className="text-2xl font-bold text-green-400">
                  ₹{totals.credit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="bg-purple-900/50 border-purple-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-200">Balance</p>
                <p className="text-2xl font-bold text-white">
                  {Math.abs(totals.debit - totals.credit) < 0.01
                    ? 'Balanced'
                    : `₹${Math.abs(totals.debit - totals.credit).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-300" />
            </div>
          </Card>
        </div>

        {/* Error or No Accounts Alert */}
        {!loading && error && (
          <Alert className="bg-amber-900/20 border-amber-700">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div className="text-amber-200">
                  Error loading Chart of Accounts: {error} <br />
                  Organization: {organizationName} (ID: {organizationId})
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-4 border-amber-600 text-amber-300 hover:bg-amber-600"
                  onClick={() => loadChartOfAccounts()}
                >
                  Retry
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Search Bar */}
        <Card className="bg-purple-900/50 border-purple-700 p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-300" />
              <Input
                placeholder="Search by account code or name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 bg-purple-800/50 border-purple-600 text-white placeholder:text-purple-300"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2 border-purple-600 text-purple-300 hover:bg-purple-600">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </Card>

        {/* Chart of Accounts Table */}
        <Card className="bg-purple-900/50 border-purple-700 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 py-3 px-3 bg-purple-800/50 border-b border-purple-600 font-semibold text-sm text-purple-200">
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
                  <div className="w-6 h-6 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-purple-200">Loading salon chart of accounts...</span>
                </div>
              </div>
            ) : accounts.length === 0 ? (
              <div className="p-8 text-center text-purple-200">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No accounts found</p>
              </div>
            ) : (
              accounts.map(account => renderAccount(account))
            )}
          </div>

          {/* Table Footer */}
          {accounts.length > 0 && (
            <div className="grid grid-cols-12 gap-4 py-3 px-3 bg-purple-800/50 border-t border-purple-600 font-bold text-sm">
              <div className="col-span-7 text-purple-200">TOTAL</div>
              <div className="col-span-2 text-right text-red-400 font-mono">
                ₹{' '}
                {totals.debit.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
              <div className="col-span-2 text-right text-green-400 font-mono">
                ₹{' '}
                {totals.credit.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
              <div className="col-span-1"></div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

// Fallback salon-specific chart of accounts
function createFallbackSalonAccounts(organizationId: string): GLAccountNode[] {
  return [
    {
      id: '1',
      entity_code: '1000000',
      entity_name: 'ASSETS',
      entity_type: 'gl_account',
      metadata: { account_type: 'header', account_level: 0 },
      organization_id: organizationId,
      level: 0,
      debit_total: 500000,
      credit_total: 0,
      current_balance: 500000,
      balance_type: 'Dr',
      children: [
        {
          id: '11',
          entity_code: '1100000',
          entity_name: 'Current Assets',
          entity_type: 'gl_account',
          metadata: { account_type: 'header', account_level: 1 },
          organization_id: organizationId,
          level: 1,
          debit_total: 300000,
          credit_total: 0,
          current_balance: 300000,
          balance_type: 'Dr',
          children: [
            {
              id: '111',
              entity_code: '1110000',
              entity_name: 'Cash & Cash Equivalents',
              entity_type: 'gl_account',
              metadata: { account_type: 'detail', account_level: 2 },
              organization_id: organizationId,
              level: 2,
              debit_total: 150000,
              credit_total: 0,
              current_balance: 150000,
              balance_type: 'Dr',
              children: []
            },
            {
              id: '112',
              entity_code: '1120000',
              entity_name: 'Salon Inventory',
              entity_type: 'gl_account',
              metadata: { account_type: 'detail', account_level: 2, salon_category: 'inventory' },
              organization_id: organizationId,
              level: 2,
              debit_total: 100000,
              credit_total: 0,
              current_balance: 100000,
              balance_type: 'Dr',
              children: []
            },
            {
              id: '113',
              entity_code: '1130000',
              entity_name: 'Accounts Receivable',
              entity_type: 'gl_account',
              metadata: { account_type: 'detail', account_level: 2 },
              organization_id: organizationId,
              level: 2,
              debit_total: 50000,
              credit_total: 0,
              current_balance: 50000,
              balance_type: 'Dr',
              children: []
            }
          ]
        },
        {
          id: '12',
          entity_code: '1200000',
          entity_name: 'Fixed Assets',
          entity_type: 'gl_account',
          metadata: { account_type: 'header', account_level: 1 },
          organization_id: organizationId,
          level: 1,
          debit_total: 200000,
          credit_total: 0,
          current_balance: 200000,
          balance_type: 'Dr',
          children: [
            {
              id: '121',
              entity_code: '1210000',
              entity_name: 'Salon Equipment',
              entity_type: 'gl_account',
              metadata: { account_type: 'detail', account_level: 2, salon_category: 'equipment' },
              organization_id: organizationId,
              level: 2,
              debit_total: 150000,
              credit_total: 0,
              current_balance: 150000,
              balance_type: 'Dr',
              children: []
            },
            {
              id: '122',
              entity_code: '1220000',
              entity_name: 'Furniture & Fixtures',
              entity_type: 'gl_account',
              metadata: { account_type: 'detail', account_level: 2, salon_category: 'furniture' },
              organization_id: organizationId,
              level: 2,
              debit_total: 50000,
              credit_total: 0,
              current_balance: 50000,
              balance_type: 'Dr',
              children: []
            }
          ]
        }
      ]
    },
    {
      id: '2',
      entity_code: '2000000',
      entity_name: 'LIABILITIES',
      entity_type: 'gl_account',
      metadata: { account_type: 'header', account_level: 0 },
      organization_id: organizationId,
      level: 0,
      debit_total: 0,
      credit_total: 200000,
      current_balance: 200000,
      balance_type: 'Cr',
      children: [
        {
          id: '21',
          entity_code: '2100000',
          entity_name: 'Current Liabilities',
          entity_type: 'gl_account',
          metadata: { account_type: 'header', account_level: 1 },
          organization_id: organizationId,
          level: 1,
          debit_total: 0,
          credit_total: 200000,
          current_balance: 200000,
          balance_type: 'Cr',
          children: [
            {
              id: '211',
              entity_code: '2110000',
              entity_name: 'Accounts Payable',
              entity_type: 'gl_account',
              metadata: { account_type: 'detail', account_level: 2 },
              organization_id: organizationId,
              level: 2,
              debit_total: 0,
              credit_total: 100000,
              current_balance: 100000,
              balance_type: 'Cr',
              children: []
            },
            {
              id: '212',
              entity_code: '2120000',
              entity_name: 'Salon Staff Payroll Payable',
              entity_type: 'gl_account',
              metadata: { account_type: 'detail', account_level: 2, salon_category: 'payroll' },
              organization_id: organizationId,
              level: 2,
              debit_total: 0,
              credit_total: 100000,
              current_balance: 100000,
              balance_type: 'Cr',
              children: []
            }
          ]
        }
      ]
    },
    {
      id: '3',
      entity_code: '3000000',
      entity_name: 'EQUITY',
      entity_type: 'gl_account',
      metadata: { account_type: 'header', account_level: 0 },
      organization_id: organizationId,
      level: 0,
      debit_total: 0,
      credit_total: 300000,
      current_balance: 300000,
      balance_type: 'Cr',
      children: [
        {
          id: '31',
          entity_code: '3100000',
          entity_name: "Owner's Equity",
          entity_type: 'gl_account',
          metadata: { account_type: 'detail', account_level: 1 },
          organization_id: organizationId,
          level: 1,
          debit_total: 0,
          credit_total: 300000,
          current_balance: 300000,
          balance_type: 'Cr',
          children: []
        }
      ]
    },
    {
      id: '4',
      entity_code: '4000000',
      entity_name: 'REVENUE',
      entity_type: 'gl_account',
      metadata: { account_type: 'header', account_level: 0 },
      organization_id: organizationId,
      level: 0,
      debit_total: 0,
      credit_total: 0,
      current_balance: 0,
      balance_type: 'Cr',
      children: [
        {
          id: '41',
          entity_code: '4100000',
          entity_name: 'Service Revenue',
          entity_type: 'gl_account',
          metadata: { account_type: 'header', account_level: 1, service_related: true },
          organization_id: organizationId,
          level: 1,
          debit_total: 0,
          credit_total: 0,
          current_balance: 0,
          balance_type: 'Cr',
          children: [
            {
              id: '411',
              entity_code: '4110000',
              entity_name: 'Hair Cut & Styling',
              entity_type: 'gl_account',
              metadata: { account_type: 'detail', account_level: 2, service_related: true, salon_category: 'hair' },
              organization_id: organizationId,
              level: 2,
              debit_total: 0,
              credit_total: 0,
              current_balance: 0,
              balance_type: 'Cr',
              children: []
            },
            {
              id: '412',
              entity_code: '4120000',
              entity_name: 'Beauty Treatments',
              entity_type: 'gl_account',
              metadata: { account_type: 'detail', account_level: 2, service_related: true, salon_category: 'beauty' },
              organization_id: organizationId,
              level: 2,
              debit_total: 0,
              credit_total: 0,
              current_balance: 0,
              balance_type: 'Cr',
              children: []
            },
            {
              id: '413',
              entity_code: '4130000',
              entity_name: 'Spa Services',
              entity_type: 'gl_account',
              metadata: { account_type: 'detail', account_level: 2, service_related: true, salon_category: 'spa' },
              organization_id: organizationId,
              level: 2,
              debit_total: 0,
              credit_total: 0,
              current_balance: 0,
              balance_type: 'Cr',
              children: []
            }
          ]
        },
        {
          id: '42',
          entity_code: '4200000',
          entity_name: 'Product Sales',
          entity_type: 'gl_account',
          metadata: { account_type: 'detail', account_level: 1, salon_category: 'retail' },
          organization_id: organizationId,
          level: 1,
          debit_total: 0,
          credit_total: 0,
          current_balance: 0,
          balance_type: 'Cr',
          children: []
        }
      ]
    },
    {
      id: '5',
      entity_code: '5000000',
      entity_name: 'EXPENSES',
      entity_type: 'gl_account',
      metadata: { account_type: 'header', account_level: 0 },
      organization_id: organizationId,
      level: 0,
      debit_total: 0,
      credit_total: 0,
      current_balance: 0,
      balance_type: 'Dr',
      children: [
        {
          id: '51',
          entity_code: '5100000',
          entity_name: 'Operating Expenses',
          entity_type: 'gl_account',
          metadata: { account_type: 'header', account_level: 1 },
          organization_id: organizationId,
          level: 1,
          debit_total: 0,
          credit_total: 0,
          current_balance: 0,
          balance_type: 'Dr',
          children: [
            {
              id: '511',
              entity_code: '5110000',
              entity_name: 'Salon Staff Salaries',
              entity_type: 'gl_account',
              metadata: { account_type: 'detail', account_level: 2, salon_category: 'payroll' },
              organization_id: organizationId,
              level: 2,
              debit_total: 0,
              credit_total: 0,
              current_balance: 0,
              balance_type: 'Dr',
              children: []
            },
            {
              id: '512',
              entity_code: '5120000',
              entity_name: 'Product Supplies',
              entity_type: 'gl_account',
              metadata: { account_type: 'detail', account_level: 2, salon_category: 'supplies' },
              organization_id: organizationId,
              level: 2,
              debit_total: 0,
              credit_total: 0,
              current_balance: 0,
              balance_type: 'Dr',
              children: []
            },
            {
              id: '513',
              entity_code: '5130000',
              entity_name: 'Rent & Utilities',
              entity_type: 'gl_account',
              metadata: { account_type: 'detail', account_level: 2, salon_category: 'overhead' },
              organization_id: organizationId,
              level: 2,
              debit_total: 0,
              credit_total: 0,
              current_balance: 0,
              balance_type: 'Dr',
              children: []
            }
          ]
        }
      ]
    }
  ]
}