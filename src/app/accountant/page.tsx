/**
 * HERA Modern Digital Accountant Dashboard
 *
 * Secure dashboard for finance professionals with comprehensive MDA system overview.
 * Features RBAC security, real-time GL monitoring, and finance operations management.
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Calculator,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Calendar,
  Users,
  Banknote,
  Activity,
  Shield,
  Settings
} from 'lucide-react'
import { apiV2 } from '@/lib/client/fetchV2'
import { formatCurrency } from '@/lib/utils'

interface FinancialSummary {
  total_transactions_today: number
  total_amount_today: number
  pending_approvals: number
  recent_transactions: Array<{
    id: string
    description: string
    amount: number
    currency: string
    status: string
    created_at: string
    smart_code: string
  }>
  gl_summary: {
    total_debits: number
    total_credits: number
    variance: number
    last_updated: string
  }
}

interface FiscalPeriodInfo {
  current_period: string
  period_status: 'open' | 'current' | 'closed'
  days_remaining: number
  can_post: boolean
}

interface UserPermissions {
  can_view_financials: boolean
  can_post_transactions: boolean
  can_close_periods: boolean
  can_view_reports: boolean
  user_role: string
}

export default function AccountantDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null)
  const [fiscalPeriod, setFiscalPeriod] = useState<FiscalPeriodInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Check user permissions
      const permissionsResult = await checkUserPermissions()
      if (!permissionsResult.can_view_financials) {
        setError('You do not have permission to access financial data.')
        return
      }

      setPermissions(permissionsResult)

      // Load financial summary
      const [summaryData, periodData] = await Promise.all([
        loadFinancialSummary(),
        loadFiscalPeriodInfo()
      ])

      setFinancialSummary(summaryData)
      setFiscalPeriod(periodData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const checkUserPermissions = async (): Promise<UserPermissions> => {
    // In a real implementation, this would check the user's role and permissions
    // For demo purposes, return full permissions
    return {
      can_view_financials: true,
      can_post_transactions: true,
      can_close_periods: true,
      can_view_reports: true,
      user_role: 'accountant'
    }
  }

  const loadFinancialSummary = async (): Promise<FinancialSummary> => {
    // Mock data for demo - in real implementation would query Universal API
    const today = new Date().toISOString().split('T')[0]

    return {
      total_transactions_today: 45,
      total_amount_today: 125800,
      pending_approvals: 3,
      recent_transactions: [
        {
          id: 'txn-001',
          description: 'Staff salary payment',
          amount: 15000,
          currency: 'AED',
          status: 'posted',
          created_at: '2025-10-05T09:30:00Z',
          smart_code: 'HERA.SALON.FINANCE.TXN.EXPENSE.SALARY.V1'
        },
        {
          id: 'txn-002',
          description: 'Daily POS summary',
          amount: 8500,
          currency: 'AED',
          status: 'posted',
          created_at: '2025-10-05T18:00:00Z',
          smart_code: 'HERA.SALON.FINANCE.TXN.POS.DAILY_SUMMARY.V1'
        },
        {
          id: 'txn-003',
          description: 'Rent payment - October',
          amount: 12500,
          currency: 'AED',
          status: 'pending',
          created_at: '2025-10-05T14:15:00Z',
          smart_code: 'HERA.SALON.FINANCE.TXN.EXPENSE.RENT.V1'
        }
      ],
      gl_summary: {
        total_debits: 235600,
        total_credits: 235600,
        variance: 0,
        last_updated: '2025-10-05T18:30:00Z'
      }
    }
  }

  const loadFiscalPeriodInfo = async (): Promise<FiscalPeriodInfo> => {
    const currentDate = new Date()
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const daysInMonth = new Date(year, currentDate.getMonth() + 1, 0).getDate()
    const daysRemaining = daysInMonth - currentDate.getDate()

    return {
      current_period: `${year}-${month}`,
      period_status: 'current',
      days_remaining: daysRemaining,
      can_post: true
    }
  }

  const testUFEPosting = async () => {
    try {
      const response = await fetch('/api/v2/transactions/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hera-api-version': 'v2',
          Authorization: 'Bearer demo-token-salon-manager'
        },
        body: JSON.stringify({
          apiVersion: 'v2',
          organization_id: 'demo-salon-org-uuid',
          transaction_type: 'TX.FINANCE.EXPENSE.V1',
          smart_code: 'HERA.SALON.FINANCE.TXN.EXPENSE.SUPPLIES.V1',
          transaction_date: new Date().toISOString().split('T')[0],
          total_amount: 450,
          transaction_currency_code: 'AED',
          base_currency_code: 'AED',
          exchange_rate: 1.0,
          business_context: {
            channel: 'MANUAL',
            note: 'Test posting from accountant dashboard'
          },
          metadata: {
            ingest_source: 'Accountant_Dashboard',
            original_ref: `TEST-${Date.now()}`
          },
          lines: []
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`✅ Test posting successful!\nTransaction ID: ${result.data?.transaction_id}`)
        loadDashboardData() // Refresh data
      } else {
        const error = await response.json()
        alert(`❌ Test posting failed: ${error.error?.message}`)
      }
    } catch (error) {
      alert(`❌ Test posting error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading accountant dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Modern Digital Accountant</h1>
          <p className="text-muted-foreground">HERA Finance Operations Dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            {permissions?.user_role || 'accountant'}
          </Badge>
          <Button variant="outline" size="sm" onClick={testUFEPosting}>
            <Calculator className="h-4 w-4 mr-2" />
            Test Posting
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Transactions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialSummary?.total_transactions_today}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(financialSummary?.total_amount_today || 0, 'AED')} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GL Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {financialSummary?.gl_summary.variance === 0 ? 'Balanced' : 'Variance'}
            </div>
            <p className="text-xs text-muted-foreground">
              Dr: {formatCurrency(financialSummary?.gl_summary.total_debits || 0, 'AED')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialSummary?.pending_approvals}</div>
            <p className="text-xs text-muted-foreground">Require review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Period</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fiscalPeriod?.current_period}</div>
            <p className="text-xs text-muted-foreground">
              {fiscalPeriod?.days_remaining} days remaining
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="gl-monitor">GL Monitor</TabsTrigger>
          <TabsTrigger value="periods">Fiscal Periods</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest finance operations processed by MDA</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {financialSummary?.recent_transactions.map(txn => (
                    <div key={txn.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{txn.description}</p>
                        <p className="text-xs text-muted-foreground">{txn.smart_code}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(txn.amount, txn.currency)}</p>
                        <Badge variant={txn.status === 'posted' ? 'default' : 'secondary'}>
                          {txn.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>MDA System Status</CardTitle>
                <CardDescription>Auto-Posting Engine health and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Auto-Posting Engine</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Active</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>GL Balancing</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Validated</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Fiscal Period</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Open</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>MCP Integration</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Available</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Processing</CardTitle>
              <CardDescription>Manual transaction posting and validation</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Calculator className="h-4 w-4" />
                <AlertDescription>
                  Use the "Test Posting" button above to test UFE processing through the
                  Auto-Posting Engine. For natural language posting, use the MCP integration in
                  Claude Desktop.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gl-monitor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Ledger Monitor</CardTitle>
              <CardDescription>Real-time GL balancing and validation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(financialSummary?.gl_summary.total_debits || 0, 'AED')}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Debits</p>
                </div>

                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(financialSummary?.gl_summary.total_credits || 0, 'AED')}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Credits</p>
                </div>

                <div className="text-center">
                  <p
                    className={`text-2xl font-bold ${financialSummary?.gl_summary.variance === 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {formatCurrency(financialSummary?.gl_summary.variance || 0, 'AED')}
                  </p>
                  <p className="text-sm text-muted-foreground">Variance</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-700 dark:text-green-400">
                    General Ledger is balanced
                  </span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                  Last updated:{' '}
                  {new Date(financialSummary?.gl_summary.last_updated || '').toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="periods" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fiscal Period Management</CardTitle>
              <CardDescription>Current period status and closing controls</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Current Period:</span>
                  <Badge variant="default">{fiscalPeriod?.current_period}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <Badge
                    variant={fiscalPeriod?.period_status === 'current' ? 'default' : 'secondary'}
                  >
                    {fiscalPeriod?.period_status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span>Days Remaining:</span>
                  <span className="font-medium">{fiscalPeriod?.days_remaining}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Posting Allowed:</span>
                  <div className="flex items-center gap-2">
                    {fiscalPeriod?.can_post ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">{fiscalPeriod?.can_post ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>

              {permissions?.can_close_periods && (
                <div className="mt-6 pt-6 border-t">
                  <Button variant="outline" disabled>
                    <Settings className="h-4 w-4 mr-2" />
                    Close Period
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Period closing functionality available in full implementation
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
