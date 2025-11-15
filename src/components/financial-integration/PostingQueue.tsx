'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  FileText,
  Filter,
  Download,
  Play,
  Pause,
  MoreHorizontal,
  Eye,
  RotateCcw
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

interface Transaction {
  id: string
  transaction_code: string
  transaction_date: string
  transaction_type: string
  total_amount: number
  transaction_status: 'pending' | 'validated' | 'posting' | 'posted' | 'error'
  smart_code: string
  description?: string
  metadata?: {
    sap_document_number?: string
    sap_fiscal_year?: string
    error_message?: string
    retry_count?: number
  }
  created_at: string
}

interface PostingQueueProps {
  organizationId: string
  onTransactionSelect?: (transaction: Transaction) => void
}

export function PostingQueue({ organizationId, onTransactionSelect }: PostingQueueProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'error' | 'posted'>('all')
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    posted: 0,
    error: 0,
    processing: 0
  })

  useEffect(() => {
    loadTransactions()
    const interval = setInterval(loadTransactions, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [organizationId, filter])

  const loadTransactions = async () => {
    try {
      const response = await fetch(
        `/api/v1/financial-integration/queue?organization_id=${organizationId}&filter=${filter}`
      )
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
        setStats(data.stats || stats)
      }
    } catch (error) {
      console.error('Failed to load posting queue:', error)
      toast.error('Failed to load posting queue')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePostSelected = async () => {
    if (selectedTransactions.size === 0) {
      toast.error('Please select transactions to post')
      return
    }

    setIsProcessing(true)
    const transactionIds = Array.from(selectedTransactions)

    try {
      const response = await fetch('/api/v1/financial-integration/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'post_batch',
          transaction_ids: transactionIds
        })
      })

      const results = await response.json()
      const successCount = results.filter((r: any) => r.success).length

      toast.success(`Posted ${successCount} of ${transactionIds.length} transactions`)
      setSelectedTransactions(new Set())
      await loadTransactions()
    } catch (error) {
      toast.error('Failed to post transactions')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRetryFailed = async () => {
    const failedTransactions = transactions
      .filter(t => t.transaction_status === 'error')
      .map(t => t.id)

    if (failedTransactions.length === 0) {
      toast.info('No failed transactions to retry')
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch('/api/v1/financial-integration/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_ids: failedTransactions
        })
      })

      if (response.ok) {
        toast.success(`Retrying ${failedTransactions.length} failed transactions`)
        await loadTransactions()
      }
    } catch (error) {
      toast.error('Failed to retry transactions')
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: 'secondary', icon: Clock, label: 'Pending' },
      validated: { variant: 'default', icon: CheckCircle2, label: 'Validated' },
      posting: { variant: 'default', icon: Send, label: 'Posting...' },
      posted: { variant: 'success', icon: CheckCircle2, label: 'Posted' },
      error: { variant: 'destructive', icon: XCircle, label: 'Error' }
    }

    const config = variants[status] || variants.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      journal_entry: 'Journal Entry',
      purchase_invoice: 'AP Invoice',
      sales_invoice: 'AR Invoice',
      payment: 'Payment',
      receipt: 'Receipt'
    }
    return labels[type] || type
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Queue</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold text-primary">{stats.processing}</p>
              </div>
              <Send className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Posted</p>
                <p className="text-2xl font-bold text-green-600">{stats.posted}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Errors</p>
                <p className="text-2xl font-bold text-red-600">{stats.error}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Financial Posting Queue</CardTitle>
              <CardDescription>
                Manage transactions pending posting to your financial system
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadTransactions} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetryFailed}
                disabled={isProcessing || stats.error === 0}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Retry Failed
              </Button>
              <Button
                size="sm"
                onClick={handlePostSelected}
                disabled={isProcessing || selectedTransactions.size === 0}
              >
                <Send className="h-4 w-4 mr-2" />
                Post Selected ({selectedTransactions.size})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={(value: any) => setFilter(value)}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="error">Errors</TabsTrigger>
                <TabsTrigger value="posted">Posted</TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <Select defaultValue="date-desc">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Date (Newest)</SelectItem>
                    <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                    <SelectItem value="amount-desc">Amount (High to Low)</SelectItem>
                    <SelectItem value="amount-asc">Amount (Low to High)</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <input
                        type="checkbox"
                        className="rounded border-border"
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedTransactions(new Set(transactions.map(t => t.id)))
                          } else {
                            setSelectedTransactions(new Set())
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map(transaction => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          className="rounded border-border"
                          checked={selectedTransactions.has(transaction.id)}
                          onChange={e => {
                            const newSelected = new Set(selectedTransactions)
                            if (e.target.checked) {
                              newSelected.add(transaction.id)
                            } else {
                              newSelected.delete(transaction.id)
                            }
                            setSelectedTransactions(newSelected)
                          }}
                          disabled={transaction.transaction_status === 'posted'}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{transaction.transaction_code}</p>
                          {transaction.description && (
                            <p className="text-sm text-muted-foreground">
                              {transaction.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getTransactionTypeLabel(transaction.transaction_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(transaction.transaction_date)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatAmount(transaction.total_amount)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(transaction.transaction_status)}
                          {transaction.transaction_status === 'error' &&
                            (transaction.metadata as any)?.error_message && (
                              <p className="text-xs text-red-600">
                                {transaction.metadata.error_message}
                              </p>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {(transaction.metadata as any)?.sap_document_number ? (
                          <div className="text-sm">
                            <p className="font-medium">
                              {transaction.metadata.sap_document_number}
                            </p>
                            <p className="text-muted-foreground">
                              FY {transaction.metadata.sap_fiscal_year}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onTransactionSelect?.(transaction)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {transaction.transaction_status === 'pending' && (
                              <DropdownMenuItem>
                                <Send className="mr-2 h-4 w-4" />
                                Post Now
                              </DropdownMenuItem>
                            )}
                            {transaction.transaction_status === 'error' && (
                              <DropdownMenuItem>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Retry
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <FileText className="mr-2 h-4 w-4" />
                              View Audit Trail
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {transactions.length === 0 && (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No transactions in the posting queue
                </p>
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Processing Progress */}
      {isProcessing && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">Processing Transactions...</p>
                <Badge variant="secondary">
                  <Send className="mr-1 h-3 w-3 animate-pulse" />
                  In Progress
                </Badge>
              </div>
              <Progress value={65} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Processing batch posting. This may take a few moments...
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
