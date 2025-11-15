'use client'

/**
 * Universal Transaction List Page
 * Smart Code: HERA.UNIVERSAL.COMPONENT.TRANSACTION_LIST_PAGE.v1
 * 
 * Page wrapper for TransactionList component that works with dynamic resolution
 */

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, Filter } from 'lucide-react'
import { TransactionList, type TransactionListItem } from '@/components/universal/TransactionList'
import type { DynamicComponentProps } from '@/lib/hera/component-loader'

interface TransactionListPageProps extends DynamicComponentProps {
  transactionType: string
}

export function TransactionListPage({ 
  resolvedOperation, 
  orgId, 
  actorId, 
  transactionType, 
  searchParams 
}: TransactionListPageProps) {
  const [transactions, setTransactions] = useState<TransactionListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading transactions
    const loadTransactions = async () => {
      try {
        setLoading(true)
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Mock transaction data based on type
        const mockTransactions = generateMockTransactions(transactionType)
        setTransactions(mockTransactions)
      } catch (error) {
        console.error('Error loading transactions:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTransactions()
  }, [transactionType, orgId])

  const getTransactionConfig = (type: string) => {
    const configs: Record<string, any> = {
      GL_JOURNAL: {
        title: 'GL Journals',
        description: 'Manage general ledger journal entries',
        icon: '📊',
        createPath: resolvedOperation.canonical_path?.replace('/list', '/create') || '/create'
      },
      PURCHASE_ORDER: {
        title: 'Purchase Orders',
        description: 'Track purchase orders and deliveries',
        icon: '🛒',
        createPath: resolvedOperation.canonical_path?.replace('/list', '/create') || '/create'
      },
      SALES_ORDER: {
        title: 'Sales Orders',
        description: 'Manage customer sales orders',
        icon: '💰',
        createPath: resolvedOperation.canonical_path?.replace('/list', '/create') || '/create'
      },
      
      // Cashew Manufacturing Transactions
      MFG_ISSUE: {
        title: 'Material Issues',
        description: 'Track material issues to work-in-process',
        icon: '📤',
        createPath: resolvedOperation.canonical_path?.replace('/list', '/create') || '/create',
        statusColors: {
          'posted': 'bg-green-500',
          'pending': 'bg-amber-500',
          'draft': 'bg-gray-500',
          'cancelled': 'bg-red-500'
        }
      },
      
      MFG_LABOR: {
        title: 'Labor Bookings',
        description: 'Track labor hours booked to batches',
        icon: '👷',
        createPath: resolvedOperation.canonical_path?.replace('/list', '/create') || '/create',
        statusColors: {
          'posted': 'bg-green-500',
          'pending': 'bg-amber-500',
          'draft': 'bg-gray-500'
        }
      },
      
      MFG_OVERHEAD: {
        title: 'Overhead Absorptions',
        description: 'Track overhead costs absorbed to batches',
        icon: '⚡',
        createPath: resolvedOperation.canonical_path?.replace('/list', '/create') || '/create',
        statusColors: {
          'posted': 'bg-green-500',
          'pending': 'bg-amber-500',
          'draft': 'bg-gray-500'
        }
      },
      
      MFG_RECEIPT: {
        title: 'Finished Goods Receipts',
        description: 'Track finished cashew kernel receipts',
        icon: '🥜',
        createPath: resolvedOperation.canonical_path?.replace('/list', '/create') || '/create',
        statusColors: {
          'completed': 'bg-green-500',
          'pending': 'bg-amber-500',
          'in_progress': 'bg-blue-500'
        }
      },
      
      MFG_BATCHCOST: {
        title: 'Batch Cost Roll-Ups',
        description: 'Track batch costing calculations',
        icon: '🧮',
        createPath: resolvedOperation.canonical_path?.replace('/list', '/create') || '/create',
        statusColors: {
          'completed': 'bg-green-500',
          'pending': 'bg-amber-500',
          'calculating': 'bg-blue-500'
        }
      },
      
      MFG_QC: {
        title: 'Quality Inspections',
        description: 'Track quality control inspections',
        icon: '🔍',
        createPath: resolvedOperation.canonical_path?.replace('/list', '/create') || '/create',
        statusColors: {
          'completed': 'bg-green-500',
          'pending': 'bg-amber-500',
          'failed': 'bg-red-500',
          'pass': 'bg-green-500',
          'rework': 'bg-orange-500',
          'reject': 'bg-red-500'
        }
      }
    }
    
    return configs[type] || {
      title: `${type} Transactions`,
      description: `Manage ${type.toLowerCase().replace('_', ' ')} transactions`,
      icon: '📋',
      createPath: '/create'
    }
  }

  const config = getTransactionConfig(transactionType)

  return (
    <div className="container mx-auto p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <span className="text-2xl">{config.icon}</span>
            {config.title}
          </h1>
          <p className="text-muted-foreground mt-1">{config.description}</p>
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <span>HERA</span>
            <span>→</span>
            <span>{resolvedOperation.params?.module || 'Module'}</span>
            <span>→</span>
            <span>{resolvedOperation.params?.area || 'Area'}</span>
            <span>→</span>
            <Badge variant="outline">{resolvedOperation.scenario}</Badge>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button size="sm" asChild>
            <a href={config.createPath}>
              <Plus className="h-4 w-4 mr-2" />
              New {transactionType.replace('_', ' ')}
            </a>
          </Button>
        </div>
      </div>

      {/* Debug Info */}
      <Card className="mb-6 bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Dynamic Resolution Info</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <strong>Component:</strong><br />
              <code className="text-xs">{resolvedOperation.component_id}</code>
            </div>
            <div>
              <strong>Transaction Type:</strong><br />
              <code className="text-xs">{transactionType}</code>
            </div>
            <div>
              <strong>Smart Code:</strong><br />
              <code className="text-xs">{resolvedOperation.smart_code}</code>
            </div>
            <div>
              <strong>Alias Hit:</strong><br />
              <Badge variant={resolvedOperation.aliasHit ? "default" : "secondary"}>
                {resolvedOperation.aliasHit ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <TransactionList
        transactions={transactions}
        loading={loading}
        title={`Recent ${config.title}`}
        emptyMessage={`No ${config.title.toLowerCase()} found. Create your first ${transactionType.toLowerCase().replace('_', ' ')} to get started.`}
        showType={true}
        showStatus={true}
        showSmartCode={false}
        actions={[
          {
            label: 'View Details',
            onClick: (transaction) => {
              // Show transaction details modal or navigate to detail page
              alert(`View ${transaction.transaction_code} details:\n\nType: ${transaction.transaction_type}\nDate: ${new Date(transaction.transaction_date).toLocaleDateString()}\nAmount: ₹${transaction.total_amount?.toFixed(2)}\nStatus: ${transaction.status}`)
            }
          },
          {
            label: 'Edit',
            onClick: (transaction) => {
              // Navigate to edit page
              const editPath = config.createPath + `?edit=${transaction.id}`
              window.location.href = editPath
            }
          },
          {
            label: 'Workflow Action',
            onClick: (transaction) => {
              // Show workflow actions based on current status
              const actions = getAvailableWorkflowActions(transaction, transactionType)
              if (actions.length > 0) {
                const action = prompt(`Available actions for ${transaction.transaction_code}:\n\n${actions.join('\n')}\n\nEnter action number (1-${actions.length}):`, '1')
                if (action && parseInt(action) > 0 && parseInt(action) <= actions.length) {
                  const selectedAction = actions[parseInt(action) - 1]
                  alert(`Executing: ${selectedAction}\n\nThis would trigger the workflow transition.`)
                }
              } else {
                alert(`No workflow actions available for ${transaction.transaction_code} in current status: ${transaction.status}`)
              }
            }
          }
        ]}
        onItemClick={(transaction) => {
          console.log('Transaction clicked:', transaction)
        }}
      />
    </div>
  )
}

/**
 * Generate mock transactions for demo
 */
function generateMockTransactions(transactionType: string): TransactionListItem[] {
  const mockData: Record<string, TransactionListItem[]> = {
    GL_JOURNAL: [
      { 
        id: '1',
        transaction_code: 'JE-2024-001', 
        transaction_type: 'gl_journal',
        transaction_date: '2024-10-31T08:00:00Z',
        total_amount: 12500.00,
        status: 'posted',
        smart_code: 'HERA.FIN.GL.JOURNAL.MONTH_END.v1'
      },
      { 
        id: '2',
        transaction_code: 'JE-2024-002', 
        transaction_type: 'gl_journal',
        transaction_date: '2024-10-30T14:30:00Z',
        total_amount: 3200.00,
        status: 'posted',
        smart_code: 'HERA.FIN.GL.JOURNAL.DEPRECIATION.v1'
      },
      { 
        id: '3',
        transaction_code: 'JE-2024-003', 
        transaction_type: 'gl_journal',
        transaction_date: '2024-10-31T16:45:00Z',
        total_amount: 850.00,
        status: 'pending',
        smart_code: 'HERA.FIN.GL.JOURNAL.ACCRUAL.v1'
      }
    ],
    PURCHASE_ORDER: [
      { 
        id: '4',
        transaction_code: 'PO-2024-1001', 
        transaction_type: 'purchase_order',
        transaction_date: '2024-10-28T10:15:00Z',
        total_amount: 15750.00,
        status: 'completed',
        smart_code: 'HERA.PROC.PO.STANDARD.v1'
      },
      { 
        id: '5',
        transaction_code: 'PO-2024-1002', 
        transaction_type: 'purchase_order',
        transaction_date: '2024-10-30T11:22:00Z',
        total_amount: 8200.00,
        status: 'pending',
        smart_code: 'HERA.PROC.PO.URGENT.v1'
      },
      { 
        id: '6',
        transaction_code: 'PO-2024-1003', 
        transaction_type: 'purchase_order',
        transaction_date: '2024-10-31T09:30:00Z',
        total_amount: 2400.00,
        status: 'pending',
        smart_code: 'HERA.PROC.PO.STANDARD.v1'
      }
    ],
    SALES_ORDER: [
      { 
        id: '7',
        transaction_code: 'SO-2024-2001', 
        transaction_type: 'sales_order',
        transaction_date: '2024-10-29T13:45:00Z',
        total_amount: 25000.00,
        status: 'completed',
        smart_code: 'HERA.SALES.SO.STANDARD.v1'
      },
      { 
        id: '8',
        transaction_code: 'SO-2024-2002', 
        transaction_type: 'sales_order',
        transaction_date: '2024-10-30T15:20:00Z',
        total_amount: 18750.00,
        status: 'pending',
        smart_code: 'HERA.SALES.SO.PRIORITY.v1'
      },
      { 
        id: '9',
        transaction_code: 'SO-2024-2003', 
        transaction_type: 'sales_order',
        transaction_date: '2024-10-31T12:10:00Z',
        total_amount: 12300.00,
        status: 'pending',
        smart_code: 'HERA.SALES.SO.STANDARD.v1'
      }
    ],
    
    // Cashew Manufacturing Transaction Mock Data
    MFG_ISSUE: [
      { 
        id: '10',
        transaction_code: 'MI-2024-001', 
        transaction_type: 'mfg_issue',
        transaction_date: '2024-10-31T08:30:00Z',
        total_amount: 18750.00,
        status: 'posted',
        smart_code: 'HERA.CASHEW.MFG.ISSUE.v1'
      },
      { 
        id: '11',
        transaction_code: 'MI-2024-002', 
        transaction_type: 'mfg_issue',
        transaction_date: '2024-10-30T14:15:00Z',
        total_amount: 22100.00,
        status: 'posted',
        smart_code: 'HERA.CASHEW.MFG.ISSUE.v1'
      }
    ],
    
    MFG_LABOR: [
      { 
        id: '12',
        transaction_code: 'LB-2024-001', 
        transaction_type: 'mfg_labor',
        transaction_date: '2024-10-31T16:00:00Z',
        total_amount: 4800.00,
        status: 'posted',
        smart_code: 'HERA.CASHEW.MFG.LABOR.v1'
      },
      { 
        id: '13',
        transaction_code: 'LB-2024-002', 
        transaction_type: 'mfg_labor',
        transaction_date: '2024-10-30T15:30:00Z',
        total_amount: 5200.00,
        status: 'posted',
        smart_code: 'HERA.CASHEW.MFG.LABOR.v1'
      }
    ],
    
    MFG_OVERHEAD: [
      { 
        id: '14',
        transaction_code: 'OH-2024-001', 
        transaction_type: 'mfg_overhead',
        transaction_date: '2024-10-31T17:00:00Z',
        total_amount: 2400.00,
        status: 'posted',
        smart_code: 'HERA.CASHEW.MFG.OVERHEAD.v1'
      }
    ],
    
    MFG_RECEIPT: [
      { 
        id: '15',
        transaction_code: 'FGR-2024-001', 
        transaction_type: 'mfg_receipt',
        transaction_date: '2024-10-31T18:00:00Z',
        total_amount: 45250.00,
        status: 'completed',
        smart_code: 'HERA.CASHEW.MFG.RECEIPT.v1'
      },
      { 
        id: '16',
        transaction_code: 'FGR-2024-002', 
        transaction_type: 'mfg_receipt',
        transaction_date: '2024-10-30T16:45:00Z',
        total_amount: 38900.00,
        status: 'completed',
        smart_code: 'HERA.CASHEW.MFG.RECEIPT.v1'
      }
    ],
    
    MFG_BATCHCOST: [
      { 
        id: '17',
        transaction_code: 'BCR-2024-001', 
        transaction_type: 'mfg_batchcost',
        transaction_date: '2024-10-31T19:00:00Z',
        total_amount: 52350.00,
        status: 'completed',
        smart_code: 'HERA.CASHEW.MFG.BATCHCOST.v1'
      }
    ],
    
    MFG_QC: [
      { 
        id: '18',
        transaction_code: 'QC-2024-001', 
        transaction_type: 'mfg_qc',
        transaction_date: '2024-10-31T20:00:00Z',
        total_amount: 0.00,
        status: 'completed',
        smart_code: 'HERA.CASHEW.MFG.QC.v1'
      },
      { 
        id: '19',
        transaction_code: 'QC-2024-002', 
        transaction_type: 'mfg_qc',
        transaction_date: '2024-10-30T17:30:00Z',
        total_amount: 0.00,
        status: 'completed',
        smart_code: 'HERA.CASHEW.MFG.QC.v1'
      }
    ]
  }
  
  return mockData[transactionType] || []
}

/**
 * Get available workflow actions based on transaction type and current status
 */
function getAvailableWorkflowActions(transaction: any, transactionType: string): string[] {
  const status = transaction.status?.toLowerCase()
  
  switch (transactionType) {
    case 'MFG_ISSUE':
      if (status === 'draft') return ['1. Submit for Approval', '2. Cancel']
      if (status === 'pending') return ['1. Approve', '2. Reject', '3. Request Changes']
      if (status === 'posted') return ['1. Reverse', '2. Add Adjustment']
      break
      
    case 'MFG_LABOR':
      if (status === 'draft') return ['1. Submit for Approval', '2. Cancel']
      if (status === 'pending') return ['1. Approve', '2. Reject']
      if (status === 'posted') return ['1. Reverse']
      break
      
    case 'MFG_RECEIPT':
      if (status === 'pending') return ['1. Complete Receipt', '2. Hold for QC']
      if (status === 'completed') return ['1. Send to QC', '2. Ship to Customer']
      break
      
    case 'MFG_QC':
      if (status === 'pending') return ['1. Mark as Pass', '2. Mark as Rework', '3. Mark as Reject']
      if (status === 'completed') return ['1. Generate Certificate', '2. Release for Shipment']
      break
      
    case 'MFG_BATCHCOST':
      if (status === 'pending') return ['1. Calculate Costs', '2. Recalculate']
      if (status === 'completed') return ['1. Generate Cost Report', '2. Update Standards']
      break
  }
  
  return []
}