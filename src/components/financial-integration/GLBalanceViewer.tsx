'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { toast } from 'sonner'
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Search,
  Download,
  RefreshCw,
  Calendar,
  FileText,
  PieChart as PieChartIcon,
  BarChart3,
  Activity
} from 'lucide-react'

interface GLAccount {
  account_code: string
  account_name: string
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  current_balance: number
  ytd_balance: number
  mtd_balance: number
  budget_amount?: number
  variance?: number
  variance_percent?: number
}

interface GLTransaction {
  date: string
  document_number: string
  description: string
  debit_amount: number
  credit_amount: number
  running_balance: number
}

interface GLBalanceViewerProps {
  organizationId: string
  onAccountSelect?: (accountCode: string) => void
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function GLBalanceViewer({ organizationId, onAccountSelect }: GLBalanceViewerProps) {
  const [accounts, setAccounts] = useState<GLAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<GLAccount | null>(null)
  const [transactions, setTransactions] = useState<GLTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [period, setPeriod] = useState('current_month')
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear().toString())
  const [view, setView] = useState<'summary' | 'details' | 'analytics'>('summary')

  useEffect(() => {
    loadGLBalances()
  }, [organizationId, period, fiscalYear])

  const loadGLBalances = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/v1/financial-integration/gl-balances?` +
        `organization_id=${organizationId}&period=${period}&year=${fiscalYear}`
      )
      if (response.ok) {
        const data = await response.json()
        setAccounts(data.accounts || [])
      }
    } catch (error) {
      console.error('Failed to load GL balances:', error)
      toast.error('Failed to load GL balances')
    } finally {
      setIsLoading(false)
    }
  }

  const loadAccountDetails = async (accountCode: string) => {
    try {
      const response = await fetch(
        `/api/v1/financial-integration/gl-transactions?` +
        `organization_id=${organizationId}&account=${accountCode}&period=${period}&year=${fiscalYear}`
      )
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
        const account = accounts.find(a => a.account_code === accountCode)
        if (account) {
          setSelectedAccount(account)
          setView('details')
        }
      }
    } catch (error) {
      console.error('Failed to load account details:', error)
      toast.error('Failed to load account details')
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch(
        `/api/v1/financial-integration/export-gl?` +
        `organization_id=${organizationId}&period=${period}&year=${fiscalYear}`,
        { method: 'POST' }
      )
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `GL_Balance_${fiscalYear}_${period}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('GL balance report exported')
      }
    } catch (error) {
      toast.error('Failed to export GL balances')
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const getAccountTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      asset: 'bg-blue-100 text-blue-800',
      liability: 'bg-red-100 text-red-800',
      equity: 'bg-purple-100 text-purple-800',
      revenue: 'bg-green-100 text-green-800',
      expense: 'bg-orange-100 text-orange-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const filteredAccounts = accounts.filter(account =>
    account.account_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.account_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const accountTypeSummary = accounts.reduce((summary, account) => {
    if (!summary[account.account_type]) {
      summary[account.account_type] = {
        count: 0,
        balance: 0,
        budget: 0
      }
    }
    summary[account.account_type].count++
    summary[account.account_type].balance += account.current_balance
    summary[account.account_type].budget += account.budget_amount || 0
    return summary
  }, {} as Record<string, { count: number; balance: number; budget: number }>)

  const chartData = Object.entries(accountTypeSummary).map(([type, data]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    balance: Math.abs(data.balance),
    budget: Math.abs(data.budget)
  }))

  const pieData = chartData.map(item => ({
    name: item.name,
    value: item.balance
  }))

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>General Ledger Balances</CardTitle>
              <CardDescription>
                Real-time account balances synchronized with your financial system
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadGLBalances}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Accounts</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Account code or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="period">Period</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger id="period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">Current Month</SelectItem>
                  <SelectItem value="current_quarter">Current Quarter</SelectItem>
                  <SelectItem value="ytd">Year to Date</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="last_quarter">Last Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="year">Fiscal Year</Label>
              <Select value={fiscalYear} onValueChange={setFiscalYear}>
                <SelectTrigger id="year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={(new Date().getFullYear()).toString()}>
                    {new Date().getFullYear()}
                  </SelectItem>
                  <SelectItem value={(new Date().getFullYear() - 1).toString()}>
                    {new Date().getFullYear() - 1}
                  </SelectItem>
                  <SelectItem value={(new Date().getFullYear() - 2).toString()}>
                    {new Date().getFullYear() - 2}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="view-type">View Type</Label>
              <Select value={view} onValueChange={(v: any) => setView(v)}>
                <SelectTrigger id="view-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary</SelectItem>
                  <SelectItem value="details">Details</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={view} onValueChange={(v: any) => setView(v)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">
            <FileText className="h-4 w-4 mr-2" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="details">
            <Activity className="h-4 w-4 mr-2" />
            Details
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          {/* Account Type Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Object.entries(accountTypeSummary).map(([type, data]) => (
              <Card key={type}>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <Badge className={getAccountTypeColor(type)}>
                      {type.toUpperCase()}
                    </Badge>
                    <p className="text-2xl font-bold">
                      {formatAmount(data.balance)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {data.count} accounts
                    </p>
                    {data.budget > 0 && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Budget: </span>
                        <span className="font-medium">{formatAmount(data.budget)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Account List */}
          <Card>
            <CardContent className="p-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Code</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Current Balance</TableHead>
                      <TableHead className="text-right">YTD Balance</TableHead>
                      <TableHead className="text-right">Budget</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAccounts.map((account) => (
                      <TableRow 
                        key={account.account_code}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          loadAccountDetails(account.account_code)
                          onAccountSelect?.(account.account_code)
                        }}
                      >
                        <TableCell className="font-medium">
                          {account.account_code}
                        </TableCell>
                        <TableCell>{account.account_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getAccountTypeColor(account.account_type)}>
                            {account.account_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatAmount(account.current_balance)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatAmount(account.ytd_balance)}
                        </TableCell>
                        <TableCell className="text-right">
                          {account.budget_amount ? formatAmount(account.budget_amount) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {account.variance !== undefined && (
                            <div className="flex items-center justify-end gap-1">
                              {account.variance > 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                              )}
                              <span className={account.variance > 0 ? 'text-green-600' : 'text-red-600'}>
                                {account.variance_percent?.toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {selectedAccount ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedAccount.account_code} - {selectedAccount.account_name}
                  </CardTitle>
                  <CardDescription>
                    Transaction details for the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Opening Balance</p>
                      <p className="text-xl font-bold">{formatAmount(0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Debits</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatAmount(transactions.reduce((sum, t) => sum + t.debit_amount, 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Credits</p>
                      <p className="text-xl font-bold text-red-600">
                        {formatAmount(transactions.reduce((sum, t) => sum + t.credit_amount, 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Closing Balance</p>
                      <p className="text-xl font-bold">{formatAmount(selectedAccount.current_balance)}</p>
                    </div>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Document</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Debit</TableHead>
                          <TableHead className="text-right">Credit</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((transaction, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {new Date(transaction.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-medium">
                              {transaction.document_number}
                            </TableCell>
                            <TableCell>{transaction.description}</TableCell>
                            <TableCell className="text-right">
                              {transaction.debit_amount > 0 
                                ? formatAmount(transaction.debit_amount)
                                : '-'
                              }
                            </TableCell>
                            <TableCell className="text-right">
                              {transaction.credit_amount > 0 
                                ? formatAmount(transaction.credit_amount)
                                : '-'
                              }
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatAmount(transaction.running_balance)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Button
                variant="outline"
                onClick={() => {
                  setSelectedAccount(null)
                  setView('summary')
                }}
              >
                Back to Summary
              </Button>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">
                  Select an account from the summary view to see transaction details
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Balance by Account Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatAmount(value)} />
                    <Legend />
                    <Bar dataKey="balance" fill="#8884d8" name="Actual Balance" />
                    <Bar dataKey="budget" fill="#82ca9d" name="Budget" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Balance Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatAmount(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top 10 Accounts by Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accounts
                  .sort((a, b) => Math.abs(b.current_balance) - Math.abs(a.current_balance))
                  .slice(0, 10)
                  .map((account) => (
                    <div key={account.account_code} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{account.account_name}</p>
                          <p className="text-sm text-muted-foreground">{account.account_code}</p>
                        </div>
                        <p className="font-bold">{formatAmount(account.current_balance)}</p>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${(Math.abs(account.current_balance) / 
                              Math.abs(accounts[0].current_balance)) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}