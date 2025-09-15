'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  Calculator,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  AlertCircle,
  ChevronRight,
  Download,
  Upload,
  Plus,
  RefreshCw,
  Building2,
  Globe,
  Zap
} from 'lucide-react'
import { formatDate } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface FinancialSummary {
  cash_position: number
  total_revenue: number
  total_expenses: number
  net_income: number
  revenue_change: number
  expense_change: number
  income_change: number
  current_ratio: number
  debt_to_equity: number
  return_on_assets: number
}

interface AccountBalance {
  account_code: string
  account_name: string
  account_type: string
  balance: number
  normal_balance: 'debit' | 'credit'
}

interface JournalEntry {
  id: string
  transaction_code: string
  transaction_date: string
  description: string
  total_amount: number
  posting_status: string
  created_at: string
}

interface Period {
  id: string
  entity_code: string
  entity_name: string
  status: 'open' | 'closed'
  start_date: string
  end_date: string
}

export default function FINDashboard() {
  const { currentOrganization, isAuthenticated, isLoading: authLoading } = useMultiOrgAuth()
  const [loading, setLoading] = useState(true)
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null)
  const [accountBalances, setAccountBalances] = useState<AccountBalance[]>([])
  const [recentJournals, setRecentJournals] = useState<JournalEntry[]>([])
  const [currentPeriod, setCurrentPeriod] = useState<Period | null>(null)
  const [selectedReportType, setSelectedReportType] = useState('balance_sheet')
  const [showJournalDialog, setShowJournalDialog] = useState(false)
  const [journalForm, setJournalForm] = useState({
    description: '',
    lines: [
      { accountCode: '', debit: 0, credit: 0, description: '' },
      { accountCode: '', debit: 0, credit: 0, description: '' }
    ]
  })

  // Check authentication layers
  if (!isAuthenticated) {
    return (
      <Alert className="m-8">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Please log in to access the financial dashboard.</AlertDescription>
      </Alert>
    )
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!currentOrganization?.id) {
    return (
      <Alert className="m-8">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No organization context found. Please select an organization.
        </AlertDescription>
      </Alert>
    )
  }

  useEffect(() => {
    if (currentOrganization?.id) {
      loadFinancialData()
    }
  }, [currentOrganization])

  const loadFinancialData = async () => {
    setLoading(true)
    try {
      // Get financial summary
      const summaryRes = await fetch(
        `/api/v1/fin?action=cash_position&organizationId=${currentOrganization.id}`
      )
      const summaryData = await summaryRes.json()

      // Get account balances
      const balancesRes = await fetch(
        `/api/v1/fin?action=list_accounts&includeBalances=true&organizationId=${currentOrganization.id}`
      )
      const balancesData = await balancesRes.json()

      // Get current period
      const periodRes = await fetch(
        `/api/v1/fin?action=period_status&organizationId=${currentOrganization.id}`
      )
      const periodData = await periodRes.json()

      // Calculate summary metrics
      const summary: FinancialSummary = {
        cash_position: summaryData.data?.current_cash || 0,
        total_revenue: calculateTotalByType(balancesData.data?.accounts || [], 'revenue'),
        total_expenses: calculateTotalByType(balancesData.data?.accounts || [], 'expense'),
        net_income: 0,
        revenue_change: 12.5, // Mock data
        expense_change: 8.3, // Mock data
        income_change: 15.7, // Mock data
        current_ratio: 1.8, // Mock data
        debt_to_equity: 0.45, // Mock data
        return_on_assets: 12.3 // Mock data
      }
      summary.net_income = summary.total_revenue - summary.total_expenses

      setFinancialSummary(summary)
      setAccountBalances(balancesData.data?.accounts || [])
      setCurrentPeriod(periodData.data?.current_period)

      // Get recent journals
      await loadRecentJournals()
    } catch (error) {
      console.error('Error loading financial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRecentJournals = async () => {
    // In production, this would fetch from the API
    // For now, using mock data
    setRecentJournals([
      {
        id: '1',
        transaction_code: 'JE-202401-001',
        transaction_date: new Date().toISOString(),
        description: 'Monthly rent payment',
        total_amount: 5000,
        posting_status: 'posted',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        transaction_code: 'JE-202401-002',
        transaction_date: new Date().toISOString(),
        description: 'Payroll journal',
        total_amount: 45000,
        posting_status: 'posted',
        created_at: new Date().toISOString()
      }
    ])
  }

  const calculateTotalByType = (accounts: AccountBalance[], type: string) => {
    return accounts
      .filter(acc => acc.account_type === type)
      .reduce((sum, acc) => sum + Math.abs(acc.balance || 0), 0)
  }

  const handleCreateJournal = async () => {
    try {
      const response = await fetch('/api/v1/fin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_journal_entry',
          organizationId: currentOrganization.id,
          data: journalForm
        })
      })

      if (response.ok) {
        setShowJournalDialog(false)
        loadFinancialData()
        // Reset form
        setJournalForm({
          description: '',
          lines: [
            { accountCode: '', debit: 0, credit: 0, description: '' },
            { accountCode: '', debit: 0, credit: 0, description: '' }
          ]
        })
      }
    } catch (error) {
      console.error('Error creating journal:', error)
    }
  }

  const generateReport = async (reportType: string) => {
    try {
      const response = await fetch('/api/v1/fin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_report',
          organizationId: currentOrganization.id,
          data: {
            reportType,
            asOfDate: new Date().toISOString(),
            format: 'detailed'
          }
        })
      })

      if (response.ok) {
        const report = await response.json()
        // In production, would display or download the report
        console.log('Report generated:', report)
      }
    } catch (error) {
      console.error('Error generating report:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Financial Management</h1>
          <p className="text-muted-foreground mt-1">Real-time financial insights and reporting</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <Calendar className="h-3 w-3 mr-1" />
            {currentPeriod?.entity_name || 'No Period'}
          </Badge>
          <Button variant="outline" size="sm" onClick={loadFinancialData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hera-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Position</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${financialSummary?.cash_position.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Current cash and equivalents</p>
          </CardContent>
        </Card>

        <Card className="hera-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${financialSummary?.total_revenue.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-green-600 mt-1">
              +{financialSummary?.revenue_change || 0}% from last period
            </p>
          </CardContent>
        </Card>

        <Card className="hera-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${financialSummary?.total_expenses.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-red-600 mt-1">
              +{financialSummary?.expense_change || 0}% from last period
            </p>
          </CardContent>
        </Card>

        <Card className="hera-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${financialSummary?.net_income.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-primary mt-1">
              +{financialSummary?.income_change || 0}% from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6 lg:w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="gl">GL Accounts</TabsTrigger>
          <TabsTrigger value="journals">Journals</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="consolidation">Consolidation</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Financial Ratios */}
            <Card>
              <CardHeader>
                <CardTitle>Key Financial Ratios</CardTitle>
                <CardDescription>Real-time financial health indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Current Ratio</span>
                  <Badge
                    variant={financialSummary?.current_ratio! > 1.5 ? 'default' : 'destructive'}
                  >
                    {financialSummary?.current_ratio.toFixed(2)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Debt to Equity</span>
                  <Badge variant={financialSummary?.debt_to_equity! < 1 ? 'default' : 'secondary'}>
                    {financialSummary?.debt_to_equity.toFixed(2)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Return on Assets</span>
                  <Badge variant="outline">{financialSummary?.return_on_assets.toFixed(1)}%</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest financial transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentJournals.slice(0, 3).map(journal => (
                    <div key={journal.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{journal.transaction_code}</p>
                          <p className="text-xs text-muted-foreground">{journal.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          ${journal.total_amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(new Date(journal.transaction_date), 'MMM d')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Summary by Type */}
          <Card>
            <CardHeader>
              <CardTitle>Account Summary</CardTitle>
              <CardDescription>Balances by account type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {['asset', 'liability', 'equity', 'revenue', 'expense'].map(type => {
                  const total = calculateTotalByType(accountBalances, type)
                  return (
                    <div key={type} className="text-center">
                      <p className="text-sm font-medium capitalize">{type}s</p>
                      <p className="text-lg font-bold mt-1">${total.toLocaleString()}</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GL Accounts Tab */}
        <TabsContent value="gl" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>General Ledger Accounts</CardTitle>
                  <CardDescription>Chart of accounts with current balances</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  New Account
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left text-sm font-medium">Code</th>
                      <th className="p-3 text-left text-sm font-medium">Account Name</th>
                      <th className="p-3 text-left text-sm font-medium">Type</th>
                      <th className="p-3 text-right text-sm font-medium">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountBalances.map((account, idx) => (
                      <tr
                        key={account.account_code}
                        className={cn('border-b', idx % 2 === 0 ? 'bg-muted/20' : '')}
                      >
                        <td className="p-3 text-sm">{account.account_code}</td>
                        <td className="p-3 text-sm font-medium">{account.account_name}</td>
                        <td className="p-3 text-sm">
                          <Badge variant="outline" className="capitalize">
                            {account.account_type}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-right font-medium">
                          ${Math.abs(account.balance || 0).toLocaleString()}
                          {account.balance < 0 && ' CR'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Journals Tab */}
        <TabsContent value="journals" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Journal Entries</CardTitle>
                  <CardDescription>Manual and automated journal entries</CardDescription>
                </div>
                <Dialog open={showJournalDialog} onOpenChange={setShowJournalDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      New Journal
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Create Journal Entry</DialogTitle>
                      <DialogDescription>
                        Enter journal details. Debits must equal credits.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={journalForm.description}
                          onChange={e =>
                            setJournalForm({
                              ...journalForm,
                              description: e.target.value
                            })
                          }
                          placeholder="Journal entry description"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Journal Lines</Label>
                        {journalForm.lines.map((line, idx) => (
                          <div key={idx} className="grid grid-cols-4 gap-2">
                            <Input
                              placeholder="Account Code"
                              value={line.accountCode}
                              onChange={e => {
                                const lines = [...journalForm.lines]
                                lines[idx].accountCode = e.target.value
                                setJournalForm({ ...journalForm, lines })
                              }}
                            />
                            <Input
                              type="number"
                              placeholder="Debit"
                              value={line.debit || ''}
                              onChange={e => {
                                const lines = [...journalForm.lines]
                                lines[idx].debit = parseFloat(e.target.value) || 0
                                setJournalForm({ ...journalForm, lines })
                              }}
                            />
                            <Input
                              type="number"
                              placeholder="Credit"
                              value={line.credit || ''}
                              onChange={e => {
                                const lines = [...journalForm.lines]
                                lines[idx].credit = parseFloat(e.target.value) || 0
                                setJournalForm({ ...journalForm, lines })
                              }}
                            />
                            <Input
                              placeholder="Line Description"
                              value={line.description}
                              onChange={e => {
                                const lines = [...journalForm.lines]
                                lines[idx].description = e.target.value
                                setJournalForm({ ...journalForm, lines })
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setJournalForm({
                              ...journalForm,
                              lines: [
                                ...journalForm.lines,
                                {
                                  accountCode: '',
                                  debit: 0,
                                  credit: 0,
                                  description: ''
                                }
                              ]
                            })
                          }
                        >
                          Add Line
                        </Button>
                        <Button onClick={handleCreateJournal}>Create Journal</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left text-sm font-medium">Journal #</th>
                      <th className="p-3 text-left text-sm font-medium">Date</th>
                      <th className="p-3 text-left text-sm font-medium">Description</th>
                      <th className="p-3 text-right text-sm font-medium">Amount</th>
                      <th className="p-3 text-center text-sm font-medium">Status</th>
                      <th className="p-3 text-center text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentJournals.map((journal, idx) => (
                      <tr
                        key={journal.id}
                        className={cn('border-b', idx % 2 === 0 ? 'bg-muted/20' : '')}
                      >
                        <td className="p-3 text-sm font-medium">{journal.transaction_code}</td>
                        <td className="p-3 text-sm">
                          {formatDate(new Date(journal.transaction_date), 'MMM d, yyyy')}
                        </td>
                        <td className="p-3 text-sm">{journal.description}</td>
                        <td className="p-3 text-sm text-right font-medium">
                          ${journal.total_amount.toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <Badge
                            variant={journal.posting_status === 'posted' ? 'default' : 'secondary'}
                          >
                            {journal.posting_status}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription>Generate standard financial statements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => generateReport('balance_sheet')}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-8 w-8 text-primary" />
                      <div>
                        <CardTitle className="text-base">Balance Sheet</CardTitle>
                        <CardDescription>Assets, liabilities & equity</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" className="w-full">
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => generateReport('income_statement')}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-8 w-8 text-green-600" />
                      <div>
                        <CardTitle className="text-base">Income Statement</CardTitle>
                        <CardDescription>Revenue & expenses</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" className="w-full">
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => generateReport('cash_flow')}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Activity className="h-8 w-8 text-purple-600" />
                      <div>
                        <CardTitle className="text-base">Cash Flow</CardTitle>
                        <CardDescription>Operating, investing & financing</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" className="w-full">
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => generateReport('trial_balance')}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Calculator className="h-8 w-8 text-orange-600" />
                      <div>
                        <CardTitle className="text-base">Trial Balance</CardTitle>
                        <CardDescription>Account balances report</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" className="w-full">
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <PieChart className="h-8 w-8 text-pink-600" />
                      <div>
                        <CardTitle className="text-base">Financial Ratios</CardTitle>
                        <CardDescription>Key performance metrics</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" className="w-full">
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-indigo-600" />
                      <div>
                        <CardTitle className="text-base">Custom Report</CardTitle>
                        <CardDescription>Build your own report</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" className="w-full">
                      Create Custom
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Budget Tab */}
        <TabsContent value="budget" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Budget Management</CardTitle>
                  <CardDescription>Budget vs actual analysis</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Create Budget
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Select defaultValue="2024">
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024 Budget</SelectItem>
                      <SelectItem value="2023">2023 Budget</SelectItem>
                    </SelectContent>
                  </Select>
                  <Badge variant="outline">YTD Variance: -5.2%</Badge>
                </div>

                {/* Budget vs Actual Chart Placeholder */}
                <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Budget vs Actual Chart</p>
                </div>

                {/* Variance Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Revenue Variance</p>
                    <p className="text-2xl font-bold text-green-600">+8.5%</p>
                    <p className="text-xs text-muted-foreground mt-1">Above budget</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Expense Variance</p>
                    <p className="text-2xl font-bold text-red-600">+12.3%</p>
                    <p className="text-xs text-muted-foreground mt-1">Over budget</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Net Income Variance</p>
                    <p className="text-2xl font-bold text-orange-600">-5.2%</p>
                    <p className="text-xs text-muted-foreground mt-1">Below target</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consolidation Tab */}
        <TabsContent value="consolidation" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Multi-Company Consolidation</CardTitle>
                  <CardDescription>Consolidated financial reporting</CardDescription>
                </div>
                <Button size="sm">
                  <Building2 className="h-4 w-4 mr-1" />
                  Run Consolidation
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Company Structure */}
                <div>
                  <h3 className="font-medium mb-3">Company Structure</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Building2 className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium">Parent Company</p>
                        <p className="text-sm text-muted-foreground">100% ownership</p>
                      </div>
                      <Badge>USD</Badge>
                    </div>
                    <div className="ml-8 space-y-2">
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">European Subsidiary</p>
                          <p className="text-xs text-muted-foreground">80% ownership</p>
                        </div>
                        <Badge variant="outline">EUR</Badge>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Asian Subsidiary</p>
                          <p className="text-xs text-muted-foreground">60% ownership</p>
                        </div>
                        <Badge variant="outline">JPY</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Consolidation Options */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="eliminate" defaultChecked />
                    <Label htmlFor="eliminate" className="text-sm">
                      Eliminate intercompany transactions
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="currency" defaultChecked />
                    <Label htmlFor="currency" className="text-sm">
                      Apply currency translation
                    </Label>
                  </div>
                </div>

                {/* Last Consolidation */}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Last consolidation: December 31, 2023.
                    <Button variant="link" size="sm" className="px-2">
                      View Report
                    </Button>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AI Insights Card */}
      <Card className="hera-card border-gradient">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            <CardTitle>AI-Powered Financial Insights</CardTitle>
          </div>
          <CardDescription>Intelligent analysis and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                <strong>Revenue Opportunity:</strong> Sales trend analysis shows potential for 15%
                growth in Q2 based on seasonal patterns. Consider increasing inventory levels.
              </AlertDescription>
            </Alert>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Cost Optimization:</strong> Operating expenses are 12% above industry
                average. Review vendor contracts for potential savings of $45,000 annually.
              </AlertDescription>
            </Alert>
            <Alert>
              <Activity className="h-4 w-4" />
              <AlertDescription>
                <strong>Cash Flow Alert:</strong> Projected cash shortage in 45 days. Accelerate
                receivables collection or arrange short-term financing.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
