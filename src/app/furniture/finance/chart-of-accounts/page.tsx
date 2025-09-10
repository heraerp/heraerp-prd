'use client'

import React, { useState, useEffect } from 'react'
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
import { universalApi } from '@/lib/universal-api'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { useFurnitureOrg, FurnitureOrgLoading } from '@/components/furniture/FurnitureOrgContext'
import FurniturePageHeader from '@/components/furniture/FurniturePageHeader'
import { cn } from '@/lib/utils'

interface GLAccount {
  id: string
  entity_code: string
  entity_name: string
  metadata: {
    account_type: 'header' | 'detail'
    account_level: number
    parent_account?: string
    normal_balance?: 'debit' | 'credit'
    ifrs_classification?: string
  }
  current_balance?: number
  balance_type?: 'Dr' | 'Cr'
  debit_total?: number
  credit_total?: number
  children?: GLAccount[]
  isExpanded?: boolean
}

export default function ChartOfAccounts() {
  const { isAuthenticated, contextLoading } = useMultiOrgAuth()
  const { organizationId, organizationName, orgLoading } = useFurnitureOrg()
  const [accounts, setAccounts] = useState<GLAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['1000000', '2000000', '3000000', '4000000', '5000000']))
  
  useEffect(() => {
    if (organizationId && !orgLoading) {
      loadChartOfAccounts()
    }
  }, [organizationId, orgLoading])

  const loadChartOfAccounts = async () => {
    try {
      setLoading(true)
      universalApi.setOrganizationId(organizationId)
      
      // Load GL accounts
      const { data: allEntities } = await universalApi.read('core_entities')
      
      // Filter for GL accounts
      const glAccounts = allEntities?.filter((e: any) => 
        e.entity_type === 'gl_account'
      ) || []
      
      // Load transaction lines for balances
      const { data: transactionLines } = await universalApi.read('universal_transaction_lines')
      
      // Calculate balances
      const balancesByAccount: Record<string, { debit: number, credit: number }> = {}
      
      if (transactionLines) {
        transactionLines.forEach((line: any) => {
          if (line.entity_id && line.line_data) {
            if (!balancesByAccount[line.entity_id]) {
              balancesByAccount[line.entity_id] = { debit: 0, credit: 0 }
            }
            balancesByAccount[line.entity_id].debit += line.line_data?.debit_amount || 0
            balancesByAccount[line.entity_id].credit += line.line_data?.credit_amount || 0
          }
        })
      }
      
      // Build hierarchical structure
      const accountMap: Record<string, GLAccount> = {}
      const rootAccounts: GLAccount[] = []
      
      // First pass: create all accounts with balance info
      glAccounts.forEach((account: any) => {
        const balance = balancesByAccount[account.id] || { debit: 0, credit: 0 }
        const netBalance = balance.debit - balance.credit
        
        accountMap[account.entity_code] = {
          ...account,
          current_balance: Math.abs(netBalance),
          balance_type: netBalance >= 0 ? 'Dr' : 'Cr',
          debit_total: balance.debit,
          credit_total: balance.credit,
          children: []
        }
      })
      
      // Second pass: build hierarchy
      Object.values(accountMap).forEach(account => {
        const parentCode = account.metadata?.parent_account
        if (parentCode && accountMap[parentCode]) {
          accountMap[parentCode].children!.push(account)
        } else if (account.metadata?.account_level === 1) {
          rootAccounts.push(account)
        }
      })
      
      // Sort children at each level
      const sortAccounts = (accounts: GLAccount[]) => {
        accounts.sort((a, b) => a.entity_code.localeCompare(b.entity_code))
        accounts.forEach(account => {
          if (account.children && account.children.length > 0) {
            sortAccounts(account.children)
          }
        })
      }
      
      sortAccounts(rootAccounts)
      
      // Calculate rollup balances for header accounts
      const calculateRollupBalances = (account: GLAccount): { debit: number, credit: number } => {
        if (account.metadata?.account_type === 'detail' || !account.children || account.children.length === 0) {
          return {
            debit: account.debit_total || 0,
            credit: account.credit_total || 0
          }
        }
        
        let totalDebit = 0
        let totalCredit = 0
        
        account.children.forEach(child => {
          const childBalances = calculateRollupBalances(child)
          totalDebit += childBalances.debit
          totalCredit += childBalances.credit
        })
        
        account.debit_total = totalDebit
        account.credit_total = totalCredit
        const netBalance = totalDebit - totalCredit
        account.current_balance = Math.abs(netBalance)
        account.balance_type = netBalance >= 0 ? 'Dr' : 'Cr'
        
        return { debit: totalDebit, credit: totalCredit }
      }
      
      rootAccounts.forEach(calculateRollupBalances)
      
      setAccounts(rootAccounts)
      
    } catch (error) {
      console.error('Failed to load chart of accounts:', error)
    } finally {
      setLoading(false)
    }
  }
  
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
  
  const renderAccount = (account: GLAccount, level: number = 0): React.ReactNode => {
    const hasChildren = account.children && account.children.length > 0
    const isExpanded = expandedNodes.has(account.entity_code)
    const isHeader = account.metadata?.account_type === 'header'
    
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
  
  // Calculate totals
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
              <Button variant="outline" size="sm" onClick={loadChartOfAccounts}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
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
                <p className="text-2xl font-bold">160</p>
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