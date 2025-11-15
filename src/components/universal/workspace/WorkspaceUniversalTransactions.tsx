'use client'

/**
 * Workspace Universal Transactions Component
 * Smart Code: HERA.WORKSPACE.COMPONENT.TRANSACTIONS.v1
 * 
 * Workspace-aware transaction management that automatically configures
 * transaction types, fields, and workflows based on domain/section context.
 * 
 * Features:
 * - Automatic transaction type configuration per workspace
 * - Domain-specific field layouts and validation
 * - Workspace-themed UI and branding
 * - Context-aware quick actions and templates
 * - Integration with Universal Transaction CRUD system
 * - Mobile-first responsive design with workspace customization
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Settings,
  RefreshCw,
  Eye,
  Edit3,
  Trash2,
  Copy,
  FileText,
  DollarSign,
  ShoppingCart,
  Package,
  Calculator,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { UniversalTransactionPage } from '../UniversalTransactionPage'
import { UniversalTransactionLineManager } from '../UniversalTransactionLineManager'
import { TransactionAIPanel } from '../TransactionAIPanel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useWorkspaceContext, useWorkspacePermissions } from '@/lib/workspace/workspace-context'
import { TransactionTypeConfig, QuickAction } from '@/lib/workspace/transaction-types'
import { cn } from '@/lib/utils'

interface WorkspaceUniversalTransactionsProps {
  // Data
  initialTransactions?: any[]
  
  // Configuration
  showQuickActions?: boolean
  showAnalytics?: boolean
  defaultView?: 'list' | 'create' | 'edit'
  
  // Callbacks
  onTransactionSave?: (transaction: any) => Promise<void>
  onTransactionDelete?: (transactionId: string) => Promise<void>
  
  // UI
  className?: string
}

// Sample transaction data for demonstration
const sampleTransactions = [
  {
    id: 'txn_001',
    transaction_type: 'SALE',
    transaction_number: 'SALE-2024-001',
    date: '2024-01-15',
    customer_name: 'John Doe',
    total_amount: 1250.00,
    status: 'completed',
    payment_method: 'Card'
  },
  {
    id: 'txn_002', 
    transaction_type: 'QUOTE',
    transaction_number: 'QUOTE-2024-002',
    date: '2024-01-14',
    customer_name: 'ABC Corporation',
    total_amount: 5500.00,
    status: 'sent',
    valid_until: '2024-02-14'
  }
]

export function WorkspaceUniversalTransactions({
  initialTransactions = sampleTransactions,
  showQuickActions = true,
  showAnalytics = true,
  defaultView = 'list',
  onTransactionSave,
  onTransactionDelete,
  className = ''
}: WorkspaceUniversalTransactionsProps) {
  const router = useRouter()
  const workspace = useWorkspaceContext()
  const permissions = useWorkspacePermissions()
  
  // State
  const [transactions, setTransactions] = useState(initialTransactions)
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [currentView, setCurrentView] = useState(defaultView)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTransactionType, setSelectedTransactionType] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)

  // Get workspace-specific transaction types and quick actions
  const { availableTransactionTypes, defaultTransactionType } = workspace
  
  // Filter transactions based on search and type
  const filteredTransactions = useMemo(() => {
    let filtered = transactions
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(txn =>
        txn.transaction_number?.toLowerCase().includes(query) ||
        txn.customer_name?.toLowerCase().includes(query) ||
        txn.description?.toLowerCase().includes(query)
      )
    }
    
    if (selectedTransactionType !== 'all') {
      filtered = filtered.filter(txn => txn.transaction_type === selectedTransactionType)
    }
    
    return filtered
  }, [transactions, searchQuery, selectedTransactionType])

  // Handle transaction actions
  const handleCreateTransaction = useCallback((transactionType?: string) => {
    const typeId = transactionType || defaultTransactionType?.id
    if (!typeId) return
    
    setCurrentView('create')
    setSelectedTransaction({
      transaction_type: typeId,
      status: 'draft',
      organization_id: workspace.organization_id
    })
  }, [defaultTransactionType, workspace.organization_id])
  
  const handleEditTransaction = useCallback((transaction: any) => {
    setSelectedTransaction(transaction)
    setCurrentView('edit')
  }, [])
  
  const handleSaveTransaction = useCallback(async (transactionData: any) => {
    setIsLoading(true)
    try {
      if (onTransactionSave) {
        await onTransactionSave(transactionData)
      }
      
      // Update local state
      if (selectedTransaction?.id) {
        // Update existing
        setTransactions(prev => prev.map(txn => 
          txn.id === selectedTransaction.id ? transactionData : txn
        ))
      } else {
        // Add new
        setTransactions(prev => [...prev, { ...transactionData, id: `txn_${Date.now()}` }])
      }
      
      setCurrentView('list')
      setSelectedTransaction(null)
    } catch (error) {
      console.error('Failed to save transaction:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedTransaction, onTransactionSave])

  // Get workspace theme
  const workspaceTheme = workspace.getWorkspaceColor()
  const workspaceIcon = workspace.getWorkspaceIcon()

  // Get status appearance
  const getStatusAppearance = useCallback((status: string) => {
    const statusConfig = {
      draft: { color: 'text-slate-600 bg-slate-100', label: 'Draft' },
      sent: { color: 'text-blue-600 bg-blue-100', label: 'Sent' },
      confirmed: { color: 'text-green-600 bg-green-100', label: 'Confirmed' },
      completed: { color: 'text-emerald-600 bg-emerald-100', label: 'Completed' },
      cancelled: { color: 'text-red-600 bg-red-100', label: 'Cancelled' },
      expired: { color: 'text-amber-600 bg-amber-100', label: 'Expired' }
    }
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
  }, [])

  // Render workspace-specific quick actions
  const renderQuickActions = () => {
    if (!showQuickActions || !permissions.canCreateTransactions) return null
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableTransactionTypes.map((type) => {
              const Icon = getTransactionTypeIcon(type.id)
              return (
                <Button
                  key={type.id}
                  variant="outline"
                  className={cn(
                    "h-auto p-4 flex flex-col items-center gap-2 text-center",
                    "hover:shadow-md transition-all duration-200"
                  )}
                  onClick={() => handleCreateTransaction(type.id)}
                >
                  <Icon className="w-6 h-6" />
                  <div>
                    <div className="font-medium text-sm">{type.name}</div>
                    <div className="text-xs text-muted-foreground">{type.description}</div>
                  </div>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render transaction analytics
  const renderAnalytics = () => {
    if (!showAnalytics) return null
    
    const stats = useMemo(() => {
      const total = filteredTransactions.length
      const completed = filteredTransactions.filter(t => t.status === 'completed').length
      const totalAmount = filteredTransactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + (t.total_amount || 0), 0)
      
      return { total, completed, totalAmount }
    }, [filteredTransactions])

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">${stats.totalAmount.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render transactions list
  const renderTransactionsList = () => (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {workspace.displayName} Transactions ({filteredTransactions.length})
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            
            {/* Filter by transaction type */}
            <Select value={selectedTransactionType} onValueChange={setSelectedTransactionType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {availableTransactionTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Actions */}
            {permissions.canCreateTransactions && (
              <Button onClick={() => handleCreateTransaction()}>
                <Plus className="w-4 h-4 mr-2" />
                New Transaction
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {filteredTransactions.map((transaction) => {
            const statusConfig = getStatusAppearance(transaction.status)
            const Icon = getTransactionTypeIcon(transaction.transaction_type)
            
            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-muted">
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div>
                    <div className="font-medium">{transaction.transaction_number}</div>
                    <div className="text-sm text-muted-foreground">
                      {transaction.customer_name} • {transaction.date}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-medium">${transaction.total_amount?.toLocaleString()}</div>
                    <Badge variant="outline" className={statusConfig.color}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedTransaction(transaction)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      {permissions.canEditTransactions && (
                        <DropdownMenuItem onClick={() => handleEditTransaction(transaction)}>
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {permissions.canDeleteTransactions && (
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
          
          {filteredTransactions.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No transactions found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedTransactionType !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : `Create your first ${workspace.displayName.toLowerCase()} transaction to get started.`
                }
              </p>
              {permissions.canCreateTransactions && (
                <Button onClick={() => handleCreateTransaction()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Transaction
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  // Main render logic
  if (currentView === 'create' || currentView === 'edit') {
    return (
      <div className={className}>
        <UniversalTransactionPage
          initialTransaction={selectedTransaction}
          transactionTypes={availableTransactionTypes}
          onSave={handleSaveTransaction}
          onCancel={() => {
            setCurrentView('list')
            setSelectedTransaction(null)
          }}
          allowEdit={permissions.canEditTransactions}
          showAIAssistant={true}
          workspaceContext={workspace}
        />
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Quick Actions */}
      {renderQuickActions()}
      
      {/* Analytics */}
      {renderAnalytics()}
      
      {/* Transactions List */}
      {renderTransactionsList()}
    </div>
  )
}

// Helper function to get transaction type icons
function getTransactionTypeIcon(transactionType: string) {
  const iconMap: Record<string, any> = {
    SALE: DollarSign,
    QUOTE: FileText,
    PURCHASE_ORDER: ShoppingCart,
    STOCK_ADJUSTMENT: Package,
    JOURNAL_ENTRY: Calculator
  }
  return iconMap[transactionType] || FileText
}

export default WorkspaceUniversalTransactions