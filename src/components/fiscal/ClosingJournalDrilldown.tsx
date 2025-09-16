// ================================================================================
// CLOSING JOURNAL DRILLDOWN - FISCAL COMPONENT
// Smart Code: HERA.UI.FISCAL.CLOSING_JOURNAL_DRILLDOWN.v1
// Production-ready journal entries viewer with transaction line details
// ================================================================================

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Alert, AlertDescription } from '@/src/components/ui/alert'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/src/components/ui/dialog'
import {
  FileText,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Download,
  ChevronRight,
  Calculator,
  Calendar,
  Info,
  Eye,
  DollarSign
} from 'lucide-react'
import { JournalEntrySummary } from '@/src/lib/api/closing'
import { universalApi } from '@/src/lib/universal-api'
import { useQuery } from '@tanstack/react-query'
import { useOrganization } from '@/src/components/organization/OrganizationProvider'
import { cn } from '@/src/lib/utils'

interface ClosingJournalDrilldownProps {
  journals: JournalEntrySummary[]
  isLoading: boolean
  error: Error | null
}

interface JournalLineItem {
  line_number: number
  account_code: string
  account_name: string
  debit_amount: number
  credit_amount: number
  description?: string
  cost_center?: string
  profit_center?: string
}

export function ClosingJournalDrilldown({
  journals,
  isLoading,
  error
}: ClosingJournalDrilldownProps) {
  const { currentOrganization } = useOrganization()
  const [searchTerm, setSearchTerm] = React.useState('')
  const [filterType, setFilterType] = React.useState<'all' | 'revenue' | 'expense' | 'closing' | 'consolidation'>('all')
  const [selectedJournal, setSelectedJournal] = React.useState<JournalEntrySummary | null>(null)

  // Get journal lines for selected journal
  const { data: journalLines, isLoading: linesLoading } = useQuery({
    queryKey: ['journal-lines', selectedJournal?.id],
    queryFn: async (): Promise<JournalLineItem[]> => {
      if (!selectedJournal || !currentOrganization) return []
      
      try {
        const lines = await universalApi.getTransactionLines({
          transaction_id: selectedJournal.id
        })

        return lines.map((line, index) => ({
          line_number: line.line_number || index + 1,
          account_code: line.metadata?.account_code || '',
          account_name: line.metadata?.account_name || '',
          debit_amount: line.metadata?.debit_amount || 0,
          credit_amount: line.metadata?.credit_amount || 0,
          description: line.metadata?.description,
          cost_center: line.metadata?.cost_center,
          profit_center: line.metadata?.profit_center
        }))
      } catch (error) {
        console.error('Failed to get journal lines:', error)
        return []
      }
    },
    enabled: !!selectedJournal && !!currentOrganization,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  // Filter journals based on search and filter
  const filteredJournals = React.useMemo(() => {
    return journals.filter(journal => {
      const matchesSearch = searchTerm === '' || 
        journal.transaction_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        journal.description.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesFilter = filterType === 'all' ||
        (filterType === 'revenue' && journal.smart_code.includes('REVENUE')) ||
        (filterType === 'expense' && journal.smart_code.includes('EXPENSE')) ||
        (filterType === 'closing' && journal.smart_code.includes('CLOSE')) ||
        (filterType === 'consolidation' && journal.smart_code.includes('CONSOLIDATE'))

      return matchesSearch && matchesFilter
    })
  }, [journals, searchTerm, filterType])

  // Calculate totals
  const totals = React.useMemo(() => {
    return filteredJournals.reduce((acc, journal) => ({
      count: acc.count + 1,
      debit: acc.debit + journal.total_debit,
      credit: acc.credit + journal.total_credit
    }), { count: 0, debit: 0, credit: 0 })
  }, [filteredJournals])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Closing Journal Entries
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-violet-600 mr-3" />
            <span className="text-gray-600 dark:text-gray-400">Loading journal entries...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Closing Journal Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              Failed to load journal entries: {error.message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStepName = (smartCode: string) => {
    if (smartCode.includes('REVENUE.CALC')) return 'Revenue Calculation'
    if (smartCode.includes('EXPENSE.CALC')) return 'Expense Calculation'
    if (smartCode.includes('NET.INCOME')) return 'Net Income Determination'
    if (smartCode.includes('CLOSE.JE')) return 'Closing Journal Entry'
    if (smartCode.includes('RE.TRANSFER')) return 'Retained Earnings Transfer'
    if (smartCode.includes('PL.ZERO')) return 'P&L Zero Out'
    if (smartCode.includes('BRANCH.ELIM')) return 'Branch Eliminations'
    if (smartCode.includes('CONSOLIDATE')) return 'Consolidation'
    return 'Other'
  }

  const exportToCSV = () => {
    const headers = ['JE Number', 'Date', 'Description', 'Step', 'Debit', 'Credit', 'Lines', 'Status']
    const rows = filteredJournals.map(je => [
      je.transaction_code,
      formatDate(je.transaction_date),
      je.description,
      getStepName(je.smart_code),
      je.total_debit.toFixed(2),
      je.total_credit.toFixed(2),
      je.line_count.toString(),
      je.status
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `closing-journal-entries-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Closing Journal Entries
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={exportToCSV}
              disabled={filteredJournals.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by JE number or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="closing">Closing</SelectItem>
                <SelectItem value="consolidation">Consolidation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="bg-violet-50 dark:bg-violet-950/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total JEs</div>
                    <div className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                      {totals.count}
                    </div>
                  </div>
                  <FileText className="h-8 w-8 text-violet-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-950/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Debits</div>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {formatCurrency(totals.debit)}
                    </div>
                  </div>
                  <Calculator className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 dark:bg-blue-950/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Credits</div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {formatCurrency(totals.credit)}
                    </div>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Journal Entries Table */}
          {filteredJournals.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                No journal entries found
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredJournals.map((journal) => (
                <div
                  key={journal.id}
                  className="p-4 border rounded-lg hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => setSelectedJournal(journal)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedJournal(journal)
                    }
                  }}
                  aria-label={`View details for journal entry ${journal.transaction_code}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                          {journal.transaction_code}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {getStepName(journal.smart_code)}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          <Calendar className="inline h-3 w-3 mr-1" />
                          {formatDate(journal.transaction_date)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {journal.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-green-700 dark:text-green-300">
                          DR: {formatCurrency(journal.total_debit)}
                        </span>
                        <span className="text-blue-700 dark:text-blue-300">
                          CR: {formatCurrency(journal.total_credit)}
                        </span>
                        <span className="text-gray-500">
                          {journal.line_count} lines
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={journal.status === 'posted' ? 'default' : 'outline'}
                        className={cn(
                          journal.status === 'posted'
                            ? 'bg-green-100 text-green-800 border-green-300'
                            : ''
                        )}
                      >
                        {journal.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Smart Code Reference */}
          <Alert className="mt-6 border-blue-200 bg-blue-50 dark:bg-blue-950/30">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                Journal Entry Smart Codes
              </div>
              <div className="grid grid-cols-2 gap-2 text-blue-700 dark:text-blue-300">
                <div>• HERA.FIN.FISCAL.CLOSING.*.CALC.v1</div>
                <div>• HERA.FIN.FISCAL.CLOSE.JE.v1</div>
                <div>• HERA.FIN.FISCAL.CLOSING.RE.TRANSFER.v1</div>
                <div>• HERA.FIN.FISCAL.CLOSING.CONSOLIDATE.v1</div>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Journal Lines Dialog */}
      <Dialog open={!!selectedJournal} onOpenChange={() => setSelectedJournal(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Journal Entry Details</DialogTitle>
            <DialogDescription>
              {selectedJournal?.transaction_code} - {selectedJournal?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Journal Header Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Date</div>
                <div className="font-medium">
                  {selectedJournal && formatDate(selectedJournal.transaction_date)}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</div>
                <Badge variant="outline">{selectedJournal?.status}</Badge>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Debit</div>
                <div className="font-medium text-green-700 dark:text-green-300">
                  {selectedJournal && formatCurrency(selectedJournal.total_debit)}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Credit</div>
                <div className="font-medium text-blue-700 dark:text-blue-300">
                  {selectedJournal && formatCurrency(selectedJournal.total_credit)}
                </div>
              </div>
            </div>

            {/* Journal Lines */}
            {linesLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-5 w-5 animate-spin text-violet-600 mr-2" />
                <span>Loading lines...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Line
                      </th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Account
                      </th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Description
                      </th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Debit
                      </th>
                      <th className="text-right py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Credit
                      </th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Cost Center
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {journalLines?.map((line) => (
                      <tr key={line.line_number} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                        <td className="py-2 px-3 text-sm">{line.line_number}</td>
                        <td className="py-2 px-3">
                          <div className="text-sm">
                            <div className="font-mono">{line.account_code}</div>
                            <div className="text-gray-600 dark:text-gray-400">{line.account_name}</div>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-sm text-gray-600 dark:text-gray-400">
                          {line.description || '-'}
                        </td>
                        <td className="py-2 px-3 text-sm text-right font-medium text-green-700 dark:text-green-300">
                          {line.debit_amount > 0 ? formatCurrency(line.debit_amount) : '-'}
                        </td>
                        <td className="py-2 px-3 text-sm text-right font-medium text-blue-700 dark:text-blue-300">
                          {line.credit_amount > 0 ? formatCurrency(line.credit_amount) : '-'}
                        </td>
                        <td className="py-2 px-3 text-sm text-gray-600 dark:text-gray-400">
                          {line.cost_center || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t">
                    <tr className="font-medium">
                      <td colSpan={3} className="py-2 px-3 text-sm text-right">
                        Totals
                      </td>
                      <td className="py-2 px-3 text-sm text-right text-green-700 dark:text-green-300">
                        {selectedJournal && formatCurrency(selectedJournal.total_debit)}
                      </td>
                      <td className="py-2 px-3 text-sm text-right text-blue-700 dark:text-blue-300">
                        {selectedJournal && formatCurrency(selectedJournal.total_credit)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Smart Code */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded text-sm">
              <span className="font-medium text-blue-800 dark:text-blue-200">Smart Code: </span>
              <span className="font-mono text-blue-700 dark:text-blue-300">
                {selectedJournal?.smart_code}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}