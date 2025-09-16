'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  BookOpen,
  FileText,
  Calculator,
  TrendingUp,
  Calendar,
  Shield,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  FileCheck,
  Settings,
  Download,
  Upload,
  Search,
  Filter,
  RefreshCw,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { universalApi } from '@/lib/universal-api'

// Types
export interface GLModuleProps {
  organizationId: string
  isDarkMode?: boolean
  features?: {
    multiCurrency?: boolean
    autoJournal?: boolean
    periodManagement?: boolean
    consolidation?: boolean
    auditTrail?: boolean
    batchPosting?: boolean
  }
  industrySpecific?: {
    coldChainAccounts?: boolean
    batchLevelPosting?: boolean
    temperatureVarianceJournals?: boolean
    seasonalAnalysis?: boolean
  }
  onJournalPosted?: (journalId: string) => void
  onPeriodClosed?: (period: string) => void
}

interface JournalEntry {
  id: string
  journalNumber: string
  date: Date
  description: string
  status: 'draft' | 'posted' | 'approved' | 'reversed'
  totalDebit: number
  totalCredit: number
  lines: JournalLine[]
  metadata?: {
    batchId?: string
    temperature?: number
    productBatch?: string
    season?: string
  }
}

interface JournalLine {
  id: string
  accountCode: string
  accountName: string
  description: string
  debit: number
  credit: number
  costCenter?: string
  project?: string
}

interface GLAccount {
  id: string
  accountCode: string
  accountName: string
  accountType: string
  normalBalance: 'debit' | 'credit'
  balance: number
  parentAccount?: string
  isActive: boolean
}

// GL Module DNA Component
export function GLModule({
  organizationId,
  isDarkMode = false,
  features = {
    multiCurrency: true,
    autoJournal: true,
    periodManagement: true,
    consolidation: false,
    auditTrail: true,
    batchPosting: true
  },
  industrySpecific = {},
  onJournalPosted,
  onPeriodClosed
}: GLModuleProps) {
  const [activeTab, setActiveTab] = useState<'journal' | 'coa' | 'reports' | 'period' | 'auto'>(
    'journal'
  )
  const [accounts, setAccounts] = useState<GLAccount[]>([])
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [currentPeriod, setCurrentPeriod] = useState<string>('2024-01')
  const [loading, setLoading] = useState(false)

  // Journal Entry Form State
  const [journalForm, setJournalForm] = useState<Partial<JournalEntry>>({
    date: new Date(),
    description: '',
    status: 'draft',
    lines: []
  })

  // Load Chart of Accounts
  useEffect(() => {
    loadAccounts()
  }, [organizationId])

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const response = await universalApi.query('core_entities', {
        filters: {
          organization_id: organizationId,
          entity_type: 'gl_account'
        }
      })

      if (response.data) {
        setAccounts(
          response.data.map((acc: any) => ({
            id: acc.id,
            accountCode: acc.entity_code,
            accountName: acc.entity_name,
            accountType: (acc.metadata as any)?.account_type || 'asset',
            normalBalance: (acc.metadata as any)?.normal_balance || 'debit',
            balance: (acc.metadata as any)?.current_balance || 0,
            parentAccount: (acc.metadata as any)?.parent_account,
            isActive: acc.status !== 'inactive'
          }))
        )
      }
    } catch (error) {
      console.error('Failed to load accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  // Add Journal Line
  const addJournalLine = () => {
    setJournalForm(prev => ({
      ...prev,
      lines: [
        ...(prev.lines || []),
        {
          id: Date.now().toString(),
          accountCode: '',
          accountName: '',
          description: '',
          debit: 0,
          credit: 0
        }
      ]
    }))
  }

  // Update Journal Line
  const updateJournalLine = (index: number, field: string, value: any) => {
    setJournalForm(prev => {
      const newLines = [...(prev.lines || [])]
      newLines[index] = { ...newLines[index], [field]: value }

      // Auto-populate account name when code is selected
      if (field === 'accountCode') {
        const account = accounts.find(acc => acc.accountCode === value)
        if (account) {
          newLines[index].accountName = account.accountName
        }
      }

      return { ...prev, lines: newLines }
    })
  }

  // Calculate Totals
  const calculateTotals = () => {
    const totals = (journalForm.lines || []).reduce(
      (acc, line) => ({
        debit: acc.debit + (line.debit || 0),
        credit: acc.credit + (line.credit || 0)
      }),
      { debit: 0, credit: 0 }
    )
    return totals
  }

  // Post Journal Entry
  const postJournal = async () => {
    const totals = calculateTotals()
    if (totals.debit !== totals.credit) {
      alert('Journal entry must balance!')
      return
    }

    try {
      setLoading(true)

      // Create journal transaction
      const journal = await universalApi.createTransaction({
        transaction_type: 'journal_entry',
        transaction_date: journalForm.date || new Date(),
        organization_id: organizationId,
        description: journalForm.description,
        total_amount: totals.debit,
        smart_code: 'HERA.FIN.GL.TXN.JE.v1',
        metadata: {
          ...journalForm.metadata,
          period: currentPeriod,
          status: 'posted'
        }
      })

      // Create journal lines
      for (const line of journalForm.lines || []) {
        await universalApi.createTransactionLine({
          transaction_id: journal.id,
          line_entity_id: accounts.find(acc => acc.accountCode === line.accountCode)?.id,
          line_number: journalForm.lines?.indexOf(line) || 0,
          quantity: 1,
          unit_price: line.debit || line.credit,
          line_amount: line.debit || line.credit,
          metadata: {
            account_code: line.accountCode,
            account_name: line.accountName,
            debit: line.debit,
            credit: line.credit,
            description: line.description
          }
        })
      }

      // Clear form
      setJournalForm({
        date: new Date(),
        description: '',
        status: 'draft',
        lines: []
      })

      // Notify parent
      if (onJournalPosted) {
        onJournalPosted(journal.id)
      }

      // Reload data
      loadAccounts()
    } catch (error) {
      console.error('Failed to post journal:', error)
      alert('Failed to post journal entry')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn('min-h-screen', isDarkMode && 'dark')}>
      <Card
        className={cn(
          'shadow-lg',
          isDarkMode ? 'bg-[#1f1f1f] border-[#3a3a3a]' : 'bg-background border-border'
        )}
      >
        <CardHeader className={cn('border-b', isDarkMode ? 'border-[#3a3a3a]' : 'border-border')}>
          <div className="flex items-center justify-between">
            <CardTitle
              className={cn(
                'text-xl flex items-center gap-2',
                isDarkMode ? 'text-foreground' : 'text-gray-900'
              )}
            >
              <BookOpen className="h-5 w-5" />
              General Ledger Module
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Calendar className="h-3 w-3" />
                Period: {currentPeriod}
              </Badge>
              {features.auditTrail && (
                <Badge variant="outline" className="gap-1">
                  <Shield className="h-3 w-3" />
                  Audit Trail
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
            <TabsList
              className={cn('grid w-full grid-cols-5', isDarkMode ? 'bg-[#292929]' : 'bg-muted')}
            >
              <TabsTrigger value="journal" className="gap-1">
                <FileText className="h-4 w-4" />
                Journal Entry
              </TabsTrigger>
              <TabsTrigger value="coa" className="gap-1">
                <Calculator className="h-4 w-4" />
                Chart of Accounts
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-1">
                <TrendingUp className="h-4 w-4" />
                Reports
              </TabsTrigger>
              <TabsTrigger value="period" className="gap-1">
                <Calendar className="h-4 w-4" />
                Period
              </TabsTrigger>
              {features.autoJournal && (
                <TabsTrigger value="auto" className="gap-1">
                  <RefreshCw className="h-4 w-4" />
                  Auto-Journal
                </TabsTrigger>
              )}
            </TabsList>

            {/* Journal Entry Tab */}
            <TabsContent value="journal" className="space-y-4 mt-4">
              <Card
                className={cn(
                  isDarkMode ? 'bg-[#292929] border-[#3a3a3a]' : 'bg-muted border-border'
                )}
              >
                <CardHeader>
                  <CardTitle className="text-lg">New Journal Entry</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={journalForm.date?.toISOString().split('T')[0]}
                        onChange={e =>
                          setJournalForm(prev => ({ ...prev, date: new Date(e.target.value) }))
                        }
                        className={isDarkMode ? 'bg-[#1f1f1f] border-[#3a3a3a]' : ''}
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        placeholder="Journal entry description"
                        value={journalForm.description}
                        onChange={e =>
                          setJournalForm(prev => ({ ...prev, description: e.target.value }))
                        }
                        className={isDarkMode ? 'bg-[#1f1f1f] border-[#3a3a3a]' : ''}
                      />
                    </div>
                  </div>

                  {/* Ice Cream Specific Fields */}
                  {industrySpecific.coldChainAccounts && (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Temperature (°C)</Label>
                        <Input
                          type="number"
                          placeholder="-18"
                          onChange={e =>
                            setJournalForm(prev => ({
                              ...prev,
                              metadata: {
                                ...prev.metadata,
                                temperature: parseFloat(e.target.value)
                              }
                            }))
                          }
                          className={isDarkMode ? 'bg-[#1f1f1f] border-[#3a3a3a]' : ''}
                        />
                      </div>
                      <div>
                        <Label>Product Batch</Label>
                        <Input
                          placeholder="BATCH-2024-001"
                          onChange={e =>
                            setJournalForm(prev => ({
                              ...prev,
                              metadata: { ...prev.metadata, productBatch: e.target.value }
                            }))
                          }
                          className={isDarkMode ? 'bg-[#1f1f1f] border-[#3a3a3a]' : ''}
                        />
                      </div>
                      <div>
                        <Label>Season</Label>
                        <Select
                          onValueChange={value =>
                            setJournalForm(prev => ({
                              ...prev,
                              metadata: { ...prev.metadata, season: value }
                            }))
                          }
                        >
                          <SelectTrigger
                            className={isDarkMode ? 'bg-[#1f1f1f] border-[#3a3a3a]' : ''}
                          >
                            <SelectValue placeholder="Select season" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="summer">Summer (Peak)</SelectItem>
                            <SelectItem value="monsoon">Monsoon</SelectItem>
                            <SelectItem value="winter">Winter (Low)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Journal Lines */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>Journal Lines</Label>
                      <Button
                        size="sm"
                        onClick={addJournalLine}
                        className={isDarkMode ? 'bg-[#0078d4] hover:bg-[#106ebe]' : ''}
                      >
                        Add Line
                      </Button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr
                            className={cn(
                              'border-b',
                              isDarkMode ? 'border-[#3a3a3a]' : 'border-border'
                            )}
                          >
                            <th className="text-left py-2">Account</th>
                            <th className="text-left py-2">Description</th>
                            <th className="text-right py-2">Debit</th>
                            <th className="text-right py-2">Credit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(journalForm.lines || []).map((line, index) => (
                            <tr
                              key={line.id}
                              className={cn(
                                'border-b',
                                isDarkMode ? 'border-[#3a3a3a]' : 'border-border'
                              )}
                            >
                              <td className="py-2 pr-2">
                                <Select
                                  value={line.accountCode}
                                  onValueChange={value =>
                                    updateJournalLine(index, 'accountCode', value)
                                  }
                                >
                                  <SelectTrigger
                                    className={cn(
                                      'w-[200px]',
                                      isDarkMode ? 'bg-[#1f1f1f] border-[#3a3a3a]' : ''
                                    )}
                                  >
                                    <SelectValue placeholder="Select account" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {accounts.map(acc => (
                                      <SelectItem key={acc.id} value={acc.accountCode}>
                                        {acc.accountCode} - {acc.accountName}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="py-2 px-2">
                                <Input
                                  placeholder="Line description"
                                  value={line.description}
                                  onChange={e =>
                                    updateJournalLine(index, 'description', e.target.value)
                                  }
                                  className={cn(
                                    'h-8',
                                    isDarkMode ? 'bg-[#1f1f1f] border-[#3a3a3a]' : ''
                                  )}
                                />
                              </td>
                              <td className="py-2 px-2">
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  value={line.debit || ''}
                                  onChange={e =>
                                    updateJournalLine(
                                      index,
                                      'debit',
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className={cn(
                                    'h-8 text-right',
                                    isDarkMode ? 'bg-[#1f1f1f] border-[#3a3a3a]' : ''
                                  )}
                                />
                              </td>
                              <td className="py-2 pl-2">
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  value={line.credit || ''}
                                  onChange={e =>
                                    updateJournalLine(
                                      index,
                                      'credit',
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className={cn(
                                    'h-8 text-right',
                                    isDarkMode ? 'bg-[#1f1f1f] border-[#3a3a3a]' : ''
                                  )}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="font-semibold">
                            <td colSpan={2} className="py-2 text-right">
                              Totals:
                            </td>
                            <td className="py-2 px-2 text-right">
                              {calculateTotals().debit.toFixed(2)}
                            </td>
                            <td className="py-2 pl-2 text-right">
                              {calculateTotals().credit.toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Balance Check */}
                    <div className="mt-4">
                      {calculateTotals().debit === calculateTotals().credit ? (
                        <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-700 dark:text-green-400">
                            Journal entry is balanced
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-700 dark:text-red-400">
                            Journal entry is not balanced. Difference:{' '}
                            {Math.abs(calculateTotals().debit - calculateTotals().credit).toFixed(
                              2
                            )}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 mt-4">
                      <Button
                        variant="outline"
                        onClick={() =>
                          setJournalForm({
                            date: new Date(),
                            description: '',
                            status: 'draft',
                            lines: []
                          })
                        }
                      >
                        Clear
                      </Button>
                      <Button
                        onClick={postJournal}
                        disabled={loading || calculateTotals().debit !== calculateTotals().credit}
                        className={isDarkMode ? 'bg-[#0078d4] hover:bg-[#106ebe]' : ''}
                      >
                        Post Journal
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Chart of Accounts Tab */}
            <TabsContent value="coa" className="mt-4">
              <Card
                className={cn(
                  isDarkMode ? 'bg-[#292929] border-[#3a3a3a]' : 'bg-muted border-border'
                )}
              >
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Chart of Accounts</CardTitle>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Upload className="h-4 w-4 mr-1" />
                        Import
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-1">
                      {accounts.map(account => (
                        <div
                          key={account.id}
                          className={cn(
                            'flex items-center justify-between p-3 rounded-lg hover:bg-muted dark:hover:bg-muted',
                            isDarkMode ? 'bg-[#1f1f1f]' : 'bg-background'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{account.accountCode}</div>
                              <div className="text-sm text-muted-foreground">{account.accountName}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={account.normalBalance === 'debit' ? 'default' : 'secondary'}
                            >
                              {account.normalBalance}
                            </Badge>
                            <span className="font-mono text-sm">{account.balance.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                <Card
                  className={cn(
                    'cursor-pointer hover:shadow-md transition-shadow',
                    isDarkMode ? 'bg-[#292929] border-[#3a3a3a]' : ''
                  )}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <FileCheck className="h-8 w-8 text-blue-500" />
                      <div>
                        <h3 className="font-semibold">Trial Balance</h3>
                        <p className="text-sm text-muted-foreground">Account balances summary</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className={cn(
                    'cursor-pointer hover:shadow-md transition-shadow',
                    isDarkMode ? 'bg-[#292929] border-[#3a3a3a]' : ''
                  )}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-8 w-8 text-green-500" />
                      <div>
                        <h3 className="font-semibold">General Ledger</h3>
                        <p className="text-sm text-muted-foreground">Detailed transactions</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {industrySpecific.coldChainAccounts && (
                  <Card
                    className={cn(
                      'cursor-pointer hover:shadow-md transition-shadow',
                      isDarkMode ? 'bg-[#292929] border-[#3a3a3a]' : ''
                    )}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <Calculator className="h-8 w-8 text-purple-500" />
                        <div>
                          <h3 className="font-semibold">Cold Chain Analysis</h3>
                          <p className="text-sm text-muted-foreground">Temperature impact on costs</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {industrySpecific.seasonalAnalysis && (
                  <Card
                    className={cn(
                      'cursor-pointer hover:shadow-md transition-shadow',
                      isDarkMode ? 'bg-[#292929] border-[#3a3a3a]' : ''
                    )}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-8 w-8 text-orange-500" />
                        <div>
                          <h3 className="font-semibold">Seasonal Variance</h3>
                          <p className="text-sm text-muted-foreground">Seasonal performance analysis</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Period Management Tab */}
            <TabsContent value="period" className="mt-4">
              <Card
                className={cn(
                  isDarkMode ? 'bg-[#292929] border-[#3a3a3a]' : 'bg-muted border-border'
                )}
              >
                <CardHeader>
                  <CardTitle className="text-lg">Period Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert>
                      <Calendar className="h-4 w-4" />
                      <AlertDescription>
                        Current Period: <strong>{currentPeriod}</strong>
                      </AlertDescription>
                    </Alert>

                    <div className="flex gap-2">
                      <Button variant="outline">
                        <Clock className="h-4 w-4 mr-1" />
                        Open Next Period
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          if (onPeriodClosed) {
                            onPeriodClosed(currentPeriod)
                          }
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Close Current Period
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Auto-Journal Tab */}
            {features.autoJournal && (
              <TabsContent value="auto" className="mt-4">
                <Card
                  className={cn(
                    isDarkMode ? 'bg-[#292929] border-[#3a3a3a]' : 'bg-muted border-border'
                  )}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">Auto-Journal Rules</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {industrySpecific.temperatureVarianceJournals && (
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Temperature Excursion</h4>
                              <p className="text-sm text-muted-foreground">
                                Auto-post wastage when temperature exceeds -15°C
                              </p>
                            </div>
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          </div>
                        </div>
                      )}

                      {industrySpecific.batchLevelPosting && (
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Batch Production Completion</h4>
                              <p className="text-sm text-muted-foreground">
                                Auto-post production costs to finished goods
                              </p>
                            </div>
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          </div>
                        </div>
                      )}

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Sales Transaction</h4>
                            <p className="text-sm text-muted-foreground">
                              Auto-post revenue and COGS entries
                            </p>
                          </div>
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// Export as HERA DNA Component
export const GL_MODULE_DNA = {
  id: 'HERA.FIN.GL.MODULE.v1',
  name: 'General Ledger Module',
  description: 'Complete GL management with journal entries, COA, reporting, and period management',
  component: GLModule,
  category: 'financial',
  subcategory: 'general_ledger',
  tags: ['gl', 'journal', 'accounting', 'financial', 'ledger'],
  version: '1.0.0',
  author: 'HERA Team',
  features: [
    'Journal entry creation and posting',
    'Chart of Accounts management',
    'Period management and closing',
    'Auto-journal rules engine',
    'Multi-currency support',
    'Batch posting capabilities',
    'Audit trail tracking',
    'Financial reporting',
    'Industry-specific features'
  ],
  industryAdaptations: {
    iceCream: {
      coldChainAccounts: true,
      batchLevelPosting: true,
      temperatureVarianceJournals: true,
      seasonalAnalysis: true,
      features: [
        'Temperature-based variance posting',
        'Batch production costing',
        'Seasonal trend analysis',
        'Cold chain cost allocation',
        'Multi-channel revenue tracking'
      ]
    },
    restaurant: {
      features: [
        'Daily closing procedures',
        'Multi-location consolidation',
        'Recipe costing integration',
        'Tip allocation posting'
      ]
    },
    healthcare: {
      features: [
        'Patient billing integration',
        'Insurance claim posting',
        'Department cost allocation',
        'Regulatory compliance tracking'
      ]
    }
  },
  dependencies: ['universalApi', 'Chart of Accounts setup', 'Organization context'],
  smartCodes: [
    'HERA.FIN.GL.TXN.JE.v1',
    'HERA.FIN.GL.ACC.*',
    'HERA.FIN.GL.RPT.*',
    'HERA.FIN.GL.VAL.*'
  ]
}
