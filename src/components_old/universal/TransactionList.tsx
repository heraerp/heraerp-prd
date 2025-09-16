/**
 * HERA Universal Transaction List
 * Reusable component for displaying transactions
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/universal-helpers'
import { formatDate } from '@/lib/date-utils'
import { Clock, DollarSign, RefreshCw, ChevronRight, Loader2 } from 'lucide-react'

export interface TransactionListItem {
  id: string
  transaction_code: string
  transaction_type: string
  transaction_date: string
  total_amount: number
  status?: string
  metadata?: any
  smart_code?: string
}

interface TransactionListProps {
  transactions: TransactionListItem[]
  loading?: boolean
  title?: string
  emptyMessage?: string
  showType?: boolean
  showStatus?: boolean
  showSmartCode?: boolean
  actions?: Array<{
    label: string
    icon?: React.ElementType
    onClick: (transaction: TransactionListItem) => void
    variant?: 'default' | 'outline' | 'ghost' | 'destructive'
    condition?: (transaction: TransactionListItem) => boolean
  }>
  onItemClick?: (transaction: TransactionListItem) => void
  maxItems?: number
}

export function TransactionList({
  transactions,
  loading = false,
  title = 'Recent Transactions',
  emptyMessage = 'No transactions found',
  showType = true,
  showStatus = true,
  showSmartCode = false,
  actions = [],
  onItemClick,
  maxItems
}: TransactionListProps) {
  const displayTransactions = maxItems ? transactions.slice(0, maxItems) : transactions

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sale':
        return 'default'
      case 'payment':
        return 'success'
      case 'refund':
        return 'destructive'
      case 'purchase':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'pending':
        return 'warning'
      case 'failed':
        return 'destructive'
      case 'cancelled':
        return 'secondary'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-700 dark:bg-muted-foreground/10 rounded" />
                    <div className="h-3 w-24 bg-gray-700 dark:bg-muted-foreground/10 rounded" />
                  </div>
                  <div className="h-6 w-20 bg-gray-700 dark:bg-muted-foreground/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {displayTransactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{emptyMessage}</p>
        ) : (
          <div className="space-y-3">
            {displayTransactions.map(transaction => (
              <div
                key={transaction.id}
                className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                  onItemClick ? 'hover:bg-muted dark:hover:bg-muted cursor-pointer' : ''
                }`}
                onClick={() => onItemClick?.(transaction)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {transaction.transaction_code}
                        {showType && (
                          <Badge variant={getTypeColor(transaction.transaction_type)}>
                            {transaction.transaction_type}
                          </Badge>
                        )}
                        {showStatus && transaction.status && (
                          <Badge variant={getStatusColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        )}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(new Date(transaction.transaction_date), 'MMM d, h:mm a')}
                        </span>
                        {showSmartCode && transaction.smart_code && (
                          <span className="text-xs font-mono">{transaction.smart_code}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="font-bold flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {formatCurrency(transaction.total_amount)}
                    </p>
                    {(transaction.metadata as any)?.tip_amount &&
                      transaction.metadata.tip_amount > 0 && (
                        <p className="text-sm text-green-600 dark:text-green-400">
                          +{formatCurrency(transaction.metadata.tip_amount)} tip
                        </p>
                      )}
                  </div>

                  {actions.length > 0 && (
                    <div className="flex gap-1 ml-2">
                      {actions.map((action, index) => {
                        const Icon = action.icon
                        const shouldShow = !action.condition || action.condition(transaction)

                        if (!shouldShow) return null

                        return (
                          <Button
                            key={index}
                            variant={action.variant || 'ghost'}
                            size="sm"
                            onClick={e => {
                              e.stopPropagation()
                              action.onClick(transaction)
                            }}
                          >
                            {Icon && <Icon className="h-4 w-4" />}
                            {!Icon && action.label}
                          </Button>
                        )
                      })}
                    </div>
                  )}

                  {onItemClick && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>
            ))}
          </div>
        )}

        {maxItems && transactions.length > maxItems && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              View all {transactions.length} transactions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
