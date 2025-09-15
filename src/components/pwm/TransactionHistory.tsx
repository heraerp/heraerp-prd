'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Calendar,
  Filter,
  Download,
  Search,
  ArrowUpDown,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { WealthTransaction } from '@/lib/pwm/types'
import { cn } from '@/lib/utils'

interface TransactionHistoryProps {
  organizationId: string
}

export function TransactionHistory({ organizationId }: TransactionHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('date')

  // Mock transaction data
  const transactions: WealthTransaction[] = [
    {
      transaction_id: '1',
      organization_id: organizationId,
      transaction_type: 'buy',
      transaction_date: '2024-01-15T10:30:00Z',
      description: 'Purchase AAPL shares',
      total_amount: 50000,
      currency: 'USD',
      status: 'completed',
      created_at: '2024-01-15T10:30:00Z'
    },
    {
      transaction_id: '2',
      organization_id: organizationId,
      transaction_type: 'dividend',
      transaction_date: '2024-01-10T09:00:00Z',
      description: 'MSFT dividend payment',
      total_amount: 2500,
      currency: 'USD',
      status: 'completed',
      created_at: '2024-01-10T09:00:00Z'
    },
    {
      transaction_id: '3',
      organization_id: organizationId,
      transaction_type: 'sell',
      transaction_date: '2024-01-08T15:45:00Z',
      description: 'Sale of TSLA position',
      total_amount: 75000,
      currency: 'USD',
      status: 'completed',
      created_at: '2024-01-08T15:45:00Z'
    },
    {
      transaction_id: '4',
      organization_id: organizationId,
      transaction_type: 'rebalance',
      transaction_date: '2024-01-05T11:20:00Z',
      description: 'AI-recommended portfolio rebalancing',
      total_amount: 125000,
      currency: 'USD',
      status: 'completed',
      created_at: '2024-01-05T11:20:00Z'
    }
  ]

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'buy':
        return <TrendingUp className="h-4 w-4 text-emerald-400" />
      case 'sell':
        return <TrendingDown className="h-4 w-4 text-red-400" />
      case 'dividend':
        return <TrendingUp className="h-4 w-4 text-blue-400" />
      case 'rebalance':
        return <ArrowUpDown className="h-4 w-4 text-purple-400" />
      default:
        return <ArrowUpDown className="h-4 w-4 text-slate-400" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'buy':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      case 'sell':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'dividend':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'rebalance':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Transaction History</h2>
          <p className="text-slate-400 mt-1">Complete record of your portfolio activity</p>
        </div>
        <Button variant="outline" className="bg-slate-800/50 border-slate-700">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6 bg-slate-900/50 backdrop-blur-sm border-slate-800">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700"
            />
          </div>

          {/* Type Filter */}
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full md:w-48 bg-slate-800/50 border-slate-700">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="buy">Purchases</SelectItem>
              <SelectItem value="sell">Sales</SelectItem>
              <SelectItem value="dividend">Dividends</SelectItem>
              <SelectItem value="rebalance">Rebalancing</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-48 bg-slate-800/50 border-slate-700">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="amount">Amount</SelectItem>
              <SelectItem value="type">Type</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range */}
          <Button variant="outline" className="bg-slate-800/50 border-slate-700">
            <Calendar className="h-4 w-4 mr-2" />
            Date Range
          </Button>
        </div>
      </Card>

      {/* Transaction List */}
      <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800">
        <div className="divide-y divide-slate-800">
          {transactions.map(transaction => (
            <div
              key={transaction.transaction_id}
              className="p-6 hover:bg-slate-800/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    {getTransactionIcon(transaction.transaction_type)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium text-white">{transaction.description}</h3>
                      <Badge
                        variant="outline"
                        className={cn('text-xs', getTransactionColor(transaction.transaction_type))}
                      >
                        {transaction.transaction_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400">
                      {formatDate(transaction.transaction_date)} • Status:{' '}
                      <span className="text-emerald-400">{transaction.status}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={cn(
                      'text-xl font-bold',
                      transaction.transaction_type === 'buy' ||
                        transaction.transaction_type === 'dividend'
                        ? 'text-emerald-400'
                        : transaction.transaction_type === 'sell'
                          ? 'text-red-400'
                          : 'text-white'
                    )}
                  >
                    {transaction.transaction_type === 'sell'
                      ? '+'
                      : transaction.transaction_type === 'buy'
                        ? '-'
                        : '+'}
                    {formatCurrency(transaction.total_amount)}
                  </p>
                  <p className="text-sm text-slate-400">{transaction.currency}</p>
                </div>
              </div>

              {/* AI Impact Analysis */}
              {transaction.transaction_type === 'rebalance' && (
                <div className="mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <p className="text-sm text-purple-300">
                    📊 AI Analysis: This rebalancing is projected to improve portfolio efficiency by
                    2.3% annually
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="p-6 border-t border-slate-800">
          <Button
            variant="ghost"
            className="w-full text-slate-400 hover:text-white hover:bg-slate-800/50"
          >
            Load More Transactions
          </Button>
        </div>
      </Card>

      {/* Transaction Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-900/50 backdrop-blur-sm border-slate-800">
          <p className="text-sm text-slate-400 mb-1">Total Volume (30d)</p>
          <p className="text-2xl font-bold text-white">$2.4M</p>
        </Card>
        <Card className="p-4 bg-slate-900/50 backdrop-blur-sm border-slate-800">
          <p className="text-sm text-slate-400 mb-1">Transactions (30d)</p>
          <p className="text-2xl font-bold text-white">47</p>
        </Card>
        <Card className="p-4 bg-slate-900/50 backdrop-blur-sm border-slate-800">
          <p className="text-sm text-slate-400 mb-1">AI Optimizations</p>
          <p className="text-2xl font-bold text-emerald-400">12</p>
        </Card>
      </div>
    </div>
  )
}
