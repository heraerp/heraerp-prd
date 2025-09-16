'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Calendar } from '@/src/components/ui/calendar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/src/components/ui/table'
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
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts'
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Shield,
  Globe,
  Calculator,
  Brain,
  AlertCircle,
  Download,
  Upload
} from 'lucide-react'

interface TaxComplianceDashboardProps {
  organizationId: string
}

// Demo data
const complianceScore = 85

const upcomingFilings = [
  {
    id: '1',
    tax_type: 'GST',
    return_type: 'GSTR3B',
    period: 'January 2024',
    due_date: '2024-02-20',
    days_remaining: 5,
    status: 'pending'
  },
  {
    id: '2',
    tax_type: 'VAT',
    return_type: 'VAT100',
    period: 'Q4 2023',
    due_date: '2024-01-31',
    days_remaining: -15,
    status: 'overdue'
  },
  {
    id: '3',
    tax_type: 'WHT',
    return_type: 'TDS',
    period: 'Q3 2023',
    due_date: '2024-01-15',
    days_remaining: 0,
    status: 'filed'
  }
]

const taxLiabilityTrend = [
  { month: 'Jan', GST: 15000, VAT: 8000, WHT: 3000 },
  { month: 'Feb', GST: 18000, VAT: 9000, WHT: 3500 },
  { month: 'Mar', GST: 16000, VAT: 8500, WHT: 3200 },
  { month: 'Apr', GST: 20000, VAT: 10000, WHT: 4000 },
  { month: 'May', GST: 22000, VAT: 11000, WHT: 4500 },
  { month: 'Jun', GST: 19000, VAT: 9500, WHT: 3800 }
]

const jurisdictionBreakdown = [
  { name: 'India (GST)', value: 45000, percentage: 45 },
  { name: 'EU (VAT)', value: 30000, percentage: 30 },
  { name: 'US (Sales Tax)', value: 15000, percentage: 15 },
  { name: 'Others', value: 10000, percentage: 10 }
]

const anomalies = [
  {
    id: '1',
    type: 'Unusual Credit',
    transaction: 'INV-2024-0145',
    expected: 5000,
    actual: 15000,
    variance: 200,
    confidence: 0.92,
    status: 'review'
  },
  {
    id: '2',
    type: 'Rate Mismatch',
    transaction: 'INV-2024-0189',
    expected: 18,
    actual: 12,
    variance: -33,
    confidence: 0.88,
    status: 'resolved'
  }
]

const registrations = [
  {
    id: '1',
    type: 'GST',
    number: '29AABCU9603R1ZM',
    jurisdiction: 'Karnataka, India',
    status: 'active',
    valid_until: '2025-12-31'
  },
  {
    id: '2',
    type: 'VAT',
    number: 'GB123456789',
    jurisdiction: 'United Kingdom',
    status: 'active',
    valid_until: '2024-12-31'
  },
  {
    id: '3',
    type: 'EIN',
    number: '12-3456789',
    jurisdiction: 'United States',
    status: 'active',
    valid_until: null
  }
]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export function TaxComplianceDashboard({ organizationId }: TaxComplianceDashboardProps) {
  const [selectedTab, setSelectedTab] = useState('overview')

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; className?: string }> = {
      pending: { variant: 'secondary', icon: Clock },
      overdue: { variant: 'destructive', icon: AlertCircle, className: 'animate-pulse' },
      filed: { variant: 'success', icon: CheckCircle2 },
      active: { variant: 'default', icon: CheckCircle2 },
      review: { variant: 'warning', icon: AlertTriangle },
      resolved: { variant: 'success', icon: CheckCircle2 }
    }

    const config = variants[status] || variants.pending
    const Icon = config.icon

    return (
      <Badge
        variant={config.variant}
        className={`flex items-center gap-1 ${config.className || ''}`}
      >
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HERA Tax & Compliance</h1>
          <p className="text-muted-foreground">Global tax compliance on 6 universal tables</p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Globe className="h-4 w-4 mr-2" />
          Multi-Jurisdiction
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compliance Score</p>
                <p className={`text-2xl font-bold ${getComplianceColor(complianceScore)}`}>
                  {complianceScore}%
                </p>
              </div>
              <Shield className={`h-8 w-8 ${getComplianceColor(complianceScore)}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Filings</p>
                <p className="text-2xl font-bold">7</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tax Liability MTD</p>
                <p className="text-2xl font-bold">{formatCurrency(32500)}</p>
              </div>
              <Calculator className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">AI Anomalies</p>
                <p className="text-2xl font-bold text-orange-600">2</p>
              </div>
              <Brain className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="filings">Filings</TabsTrigger>
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="anomalies">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Compliance Gauge */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance Health</CardTitle>
                <CardDescription>Overall tax compliance status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="90%"
                    data={[{ value: complianceScore, fill: '#00C49F' }]}
                  >
                    <RadialBar dataKey="value" cornerRadius={10} fill="#00C49F" />
                    <text
                      x="50%"
                      y="50%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-3xl font-bold"
                    >
                      {complianceScore}%
                    </text>
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Filed on time
                    </span>
                    <span className="font-medium">12/15</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      Overdue
                    </span>
                    <span className="font-medium">2/15</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      Upcoming
                    </span>
                    <span className="font-medium">1/15</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Jurisdiction Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Tax by Jurisdiction</CardTitle>
                <CardDescription>Distribution across tax jurisdictions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={jurisdictionBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {jurisdictionBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Tax Liability Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Tax Liability Trend</CardTitle>
              <CardDescription>Monthly tax liabilities by type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={taxLiabilityTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="GST" stroke="#0088FE" strokeWidth={2} />
                  <Line type="monotone" dataKey="VAT" stroke="#00C49F" strokeWidth={2} />
                  <Line type="monotone" dataKey="WHT" stroke="#FFBB28" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filings" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tax Return Filings</CardTitle>
                  <CardDescription>Upcoming and recent tax returns</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                  <Button size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    New Filing
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tax Type</TableHead>
                      <TableHead>Return Type</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Days Remaining</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingFilings.map(filing => (
                      <TableRow key={filing.id}>
                        <TableCell>
                          <Badge variant="outline">{filing.tax_type}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{filing.return_type}</TableCell>
                        <TableCell>{filing.period}</TableCell>
                        <TableCell>{filing.due_date}</TableCell>
                        <TableCell>
                          <span
                            className={
                              filing.days_remaining < 0
                                ? 'text-red-600 font-bold'
                                : filing.days_remaining <= 7
                                  ? 'text-yellow-600'
                                  : ''
                            }
                          >
                            {filing.days_remaining < 0
                              ? `${Math.abs(filing.days_remaining)} days overdue`
                              : filing.days_remaining === 0
                                ? 'Due today'
                                : `${filing.days_remaining} days`}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(filing.status)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            {filing.status === 'filed' ? 'View' : 'File Now'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="registrations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tax Registrations</CardTitle>
                  <CardDescription>Active tax registrations across jurisdictions</CardDescription>
                </div>
                <Button size="sm">
                  <Globe className="h-4 w-4 mr-2" />
                  Add Registration
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Registration Number</TableHead>
                      <TableHead>Jurisdiction</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valid Until</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations.map(reg => (
                      <TableRow key={reg.id}>
                        <TableCell>
                          <Badge variant="outline">{reg.type}</Badge>
                        </TableCell>
                        <TableCell className="font-mono font-medium">{reg.number}</TableCell>
                        <TableCell>{reg.jurisdiction}</TableCell>
                        <TableCell>{getStatusBadge(reg.status)}</TableCell>
                        <TableCell>{reg.valid_until || 'Perpetual'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Effective Tax Rate */}
            <Card>
              <CardHeader>
                <CardTitle>Effective Tax Rates</CardTitle>
                <CardDescription>Average rates by jurisdiction</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">India (GST)</span>
                      <span className="text-sm font-bold">18%</span>
                    </div>
                    <div className="w-full bg-gray-700 dark:bg-muted-foreground/10 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '72%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">EU (VAT)</span>
                      <span className="text-sm font-bold">21%</span>
                    </div>
                    <div className="w-full bg-gray-700 dark:bg-muted-foreground/10 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '84%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">US (Sales Tax)</span>
                      <span className="text-sm font-bold">8.5%</span>
                    </div>
                    <div className="w-full bg-gray-700 dark:bg-muted-foreground/10 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: '34%' }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tax Savings */}
            <Card>
              <CardHeader>
                <CardTitle>Tax Optimization</CardTitle>
                <CardDescription>Potential savings identified by AI</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Input Tax Credits</span>
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(12500)}</p>
                    <p className="text-sm text-muted-foreground">Available to claim</p>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Exemptions</span>
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(8000)}</p>
                    <p className="text-sm text-muted-foreground">Potential savings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Calendar */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Calendar</CardTitle>
              <CardDescription>Tax filing deadlines and important dates</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar mode="single" className="rounded-md border" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>AI-Detected Anomalies</CardTitle>
                  <CardDescription>
                    Unusual patterns and potential compliance issues
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Brain className="h-4 w-4 mr-2" />
                  Run Analysis
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Transaction</TableHead>
                      <TableHead className="text-right">Expected</TableHead>
                      <TableHead className="text-right">Actual</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {anomalies.map(anomaly => (
                      <TableRow key={anomaly.id}>
                        <TableCell>
                          <Badge variant="outline">{anomaly.type}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{anomaly.transaction}</TableCell>
                        <TableCell className="text-right">
                          {anomaly.type === 'Rate Mismatch'
                            ? `${anomaly.expected}%`
                            : formatCurrency(anomaly.expected)}
                        </TableCell>
                        <TableCell className="text-right">
                          {anomaly.type === 'Rate Mismatch'
                            ? `${anomaly.actual}%`
                            : formatCurrency(anomaly.actual)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={anomaly.variance > 0 ? 'text-red-600' : 'text-green-600'}
                          >
                            {anomaly.variance > 0 ? '+' : ''}
                            {anomaly.variance}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-700 dark:bg-muted-foreground/10 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${anomaly.confidence * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm">
                              {(anomaly.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(anomaly.status)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* AI Insights */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Brain className="h-5 w-5 text-primary mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-medium">AI Recommendations</p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Review tax credit claims exceeding 200% of historical average</li>
                      <li>• Update tax rate configuration for recently changed jurisdictions</li>
                      <li>• Consider implementing automated invoice validation to reduce errors</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
