'use client'
/**
 * Transaction History Component
 * Smart Code: HERA.SALON.DIGITAL.ACCOUNTANT.HISTORY.v1
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Receipt,
  Eye,
  Edit,
  Trash2,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Transaction {
  id: string
  type: 'revenue' | 'expense' | 'payment' | 'commission'
  description: string
  amount: number
  date: Date
  status: 'posted' | 'pending' | 'draft' | 'cancelled'
  category?: string
  vendor?: string
  client?: string
  vatAmount?: number
  reference?: string
}

interface TransactionHistoryProps {
  transactions?: Transaction[]
  onViewTransaction?: (transaction: Transaction) => void
  onEditTransaction?: (transaction: Transaction) => void
  onDeleteTransaction?: (transaction: Transaction) => void
}

// Mock data for demo
const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'revenue',
    description: 'Hair Color & Treatment - Sarah M.',
    amount: 450,
    date: new Date('2025-09-08T10:30:00'),
    status: 'posted',
    category: 'Services',
    client: 'Sarah M.',
    vatAmount: 21.43
  },
  {
    id: '2',
    type: 'expense',
    description: 'Hair Color Products - Beauty Depot',
    amount: 320,
    date: new Date('2025-09-08T09:15:00'),
    status: 'posted',
    category: 'Salon Supplies',
    vendor: 'Beauty Depot',
    vatAmount: 15.24
  },
  {
    id: '3',
    type: 'revenue',
    description: 'Haircut & Styling - Maya K.',
    amount: 180,
    date: new Date('2025-09-08T11:45:00'),
    status: 'posted',
    category: 'Services',
    client: 'Maya K.',
    vatAmount: 8.57
  },
  {
    id: '4',
    type: 'commission',
    description: 'Commission - Sarah (40% on AED 2,000)',
    amount: 800,
    date: new Date('2025-09-08T17:00:00'),
    status: 'pending',
    category: 'Payroll'
  },
  {
    id: '5',
    type: 'expense',
    description: 'Electricity Bill - DEWA',
    amount: 850,
    date: new Date('2025-09-08T14:00:00'),
    status: 'draft',
    category: 'Utilities',
    vendor: 'DEWA'
  }
]

export function TransactionHistory({ 
  transactions = mockTransactions,
  onViewTransaction,
  onEditTransaction,
  onDeleteTransaction 
}: TransactionHistoryProps) {
  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'revenue':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'expense':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      case 'payment':
        return <DollarSign className="w-4 h-4 text-blue-600" />
      case 'commission':
        return <DollarSign className="w-4 h-4 text-purple-600" />
    }
  }

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'posted':
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle className="w-3 h-3" />
            Posted
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="w-3 h-3" />
            Pending
          </Badge>
        )
      case 'draft':
        return (
          <Badge variant="outline" className="gap-1">
            <AlertCircle className="w-3 h-3" />
            Draft
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="w-3 h-3" />
            Cancelled
          </Badge>
        )
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-AE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date)
  }

  // Group transactions by date
  const groupedTransactions = transactions.reduce((acc, transaction) => {
    const dateKey = transaction.date.toDateString()
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(transaction)
    return acc
  }, {} as Record<string, Transaction[]>)

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          Today's Transactions
        </CardTitle>
        <Button variant="ghost" size="sm">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[500px]">
          <div className="p-4 space-y-4">
            {Object.entries(groupedTransactions).map(([date, dayTransactions]) => (
              <div key={date} className="space-y-2">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 sticky top-0 bg-white dark:bg-gray-800 py-1">
                  {date === new Date().toDateString() ? 'Today' : date}
                </p>
                <div className="space-y-2">
                  {dayTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className={cn(
                        "p-3 rounded-lg border transition-colors",
                        "hover:bg-gray-50 dark:hover:bg-gray-800",
                        transaction.status === 'cancelled' && "opacity-60"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-0.5">
                            {getTypeIcon(transaction.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {transaction.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">
                                {formatTime(transaction.date)}
                              </span>
                              {transaction.category && (
                                <>
                                  <span className="text-xs text-gray-400">•</span>
                                  <span className="text-xs text-gray-500">
                                    {transaction.category}
                                  </span>
                                </>
                              )}
                              {transaction.vatAmount && (
                                <>
                                  <span className="text-xs text-gray-400">•</span>
                                  <span className="text-xs text-gray-500">
                                    VAT: {formatCurrency(transaction.vatAmount)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <div className="text-right">
                            <p className={cn(
                              "font-semibold",
                              transaction.type === 'revenue' ? 'text-green-600' : 'text-red-600'
                            )}>
                              {transaction.type === 'revenue' ? '+' : '-'}{formatCurrency(transaction.amount)}
                            </p>
                            <div className="mt-1">
                              {getStatusBadge(transaction.status)}
                            </div>
                          </div>
                          
                          {/* Action buttons */}
                          <div className="flex flex-col gap-1 opacity-0 hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => onViewTransaction?.(transaction)}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            {transaction.status === 'draft' && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => onEditTransaction?.(transaction)}
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                            )}
                            {(transaction.status === 'draft' || transaction.status === 'pending') && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-red-600"
                                onClick={() => onDeleteTransaction?.(transaction)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        {/* Summary footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {transactions.length} transactions today
            </span>
            <div className="flex items-center gap-4">
              <span className="text-green-600 font-medium">
                +{formatCurrency(
                  transactions
                    .filter(t => t.type === 'revenue' && t.status !== 'cancelled')
                    .reduce((sum, t) => sum + t.amount, 0)
                )}
              </span>
              <span className="text-red-600 font-medium">
                -{formatCurrency(
                  transactions
                    .filter(t => (t.type === 'expense' || t.type === 'commission') && t.status !== 'cancelled')
                    .reduce((sum, t) => sum + t.amount, 0)
                )}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}