'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  DollarSign,
  Users,
  Building2,
  TrendingUp,
  BookOpen,
  Receipt,
  Coins,
  FileCheck,
  AlertCircle,
  CheckCircle,
  Clock,
  Link,
  Database,
  Cloud,
  Server
} from 'lucide-react'

interface SAPFIModuleProps {
  organizationId: string
  isDarkMode?: boolean
  features?: {
    autoPosting?: boolean
    aiValidation?: boolean
    realTimeSync?: boolean
    batchProcessing?: boolean
    multiCompanyCode?: boolean
    intercompanyClearing?: boolean
  }
  sapConfig?: {
    systemType: 'S4HANA_CLOUD' | 'S4HANA_ONPREM' | 'ECC' | 'B1'
    companyCode: string
    chartOfAccounts: string
    fiscalYearVariant: string
    postingPeriodVariant: string
  }
  onDocumentPosted?: (docNumber: string) => void
  onSyncComplete?: (status: any) => void
  onError?: (error: any) => void
}

export function SAPFIModule({
  organizationId,
  isDarkMode = true,
  features = {},
  sapConfig,
  onDocumentPosted,
  onSyncComplete,
  onError
}: SAPFIModuleProps) {
  const [activeTab, setActiveTab] = React.useState('overview')
  const [syncStatus, setSyncStatus] = React.useState<'idle' | 'syncing' | 'completed' | 'error'>(
    'idle'
  )
  const [postingQueue, setPostingQueue] = React.useState<any[]>([])

  // Mock data for demonstration
  const pendingDocuments = [
    { id: '1', type: 'AP Invoice', amount: 25000, status: 'pending', vendor: 'SAP AG' },
    {
      id: '2',
      type: 'GL Journal',
      amount: 15000,
      status: 'validated',
      description: 'Month-end accrual'
    },
    { id: '3', type: 'AR Invoice', amount: 50000, status: 'posting', customer: 'Tech Corp' }
  ]

  const getSystemIcon = () => {
    switch (sapConfig?.systemType) {
      case 'S4HANA_CLOUD':
        return <Cloud className="h-5 w-5" />
      case 'S4HANA_ONPREM':
        return <Server className="h-5 w-5" />
      case 'ECC':
        return <Database className="h-5 w-5" />
      default:
        return <Link className="h-5 w-5" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        )
      case 'validated':
        return (
          <Badge className="bg-blue-500 text-foreground gap-1">
            <FileCheck className="h-3 w-3" /> Validated
          </Badge>
        )
      case 'posting':
        return (
          <Badge className="bg-yellow-500 text-foreground gap-1">
            <Clock className="h-3 w-3 animate-spin" /> Posting
          </Badge>
        )
      case 'posted':
        return (
          <Badge className="bg-green-500 text-foreground gap-1">
            <CheckCircle className="h-3 w-3" /> Posted
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" /> Error
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className={`space-y-6 ${isDarkMode ? 'dark' : ''}`}>
      {/* Connection Status */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getSystemIcon()}
              <div>
                <h3 className="font-semibold">SAP {sapConfig?.systemType || 'Not Connected'}</h3>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Company: {sapConfig?.companyCode || 'N/A'} | CoA:{' '}
                  {sapConfig?.chartOfAccounts || 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {syncStatus === 'syncing' ? (
                <Badge className="bg-blue-500 text-foreground">
                  <Clock className="h-3 w-3 animate-spin mr-1" />
                  Syncing...
                </Badge>
              ) : (
                <Badge className="bg-green-500 text-foreground">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="posting">Document Posting</TabsTrigger>
          <TabsTrigger value="master">Master Data</TabsTrigger>
          <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Documents Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">23</div>
                <p className="text-xs text-muted-foreground">₹2.5M total value</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Posted Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">147</div>
                <p className="text-xs text-green-600">+12% vs yesterday</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Sync Errors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">3</div>
                <p className="text-xs text-muted-foreground">Requires attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Last Sync
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold">2 min ago</div>
                <p className="text-xs text-muted-foreground">Next in 3 min</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Document Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingDocuments.map(doc => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted dark:bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        {doc.type === 'AP Invoice' ? (
                          <Receipt className="h-5 w-5 text-primary" />
                        ) : doc.type === 'GL Journal' ? (
                          <BookOpen className="h-5 w-5 text-primary" />
                        ) : (
                          <Users className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{doc.type}</p>
                        <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                          {doc.vendor || doc.customer || doc.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold">₹{doc.amount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Amount</p>
                      </div>
                      {getStatusBadge(doc.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Document Posting Tab */}
        <TabsContent value="posting">
          <Card>
            <CardHeader>
              <CardTitle>Document Posting Queue</CardTitle>
              <div className="flex gap-2 mt-2">
                {features.autoPosting && (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    Auto-Posting Enabled
                  </Badge>
                )}
                {features.aiValidation && (
                  <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                    AI Validation Active
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Create Journal Entry
                </Button>
                <Button className="w-full" variant="outline">
                  <Receipt className="h-4 w-4 mr-2" />
                  Create AP Invoice
                </Button>
                <Button className="w-full" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Create AR Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Master Data Tab */}
        <TabsContent value="master">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">GL Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Accounts</span>
                    <span className="font-medium">1,247</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Last Sync</span>
                    <span className="text-sm text-muted-foreground">10 min ago</span>
                  </div>
                  <Button size="sm" className="w-full mt-2" variant="outline">
                    Sync GL Accounts
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cost Centers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Active Centers</span>
                    <span className="font-medium">89</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Hierarchies</span>
                    <span className="font-medium">12</span>
                  </div>
                  <Button size="sm" className="w-full mt-2" variant="outline">
                    Sync Cost Centers
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reconciliation Tab */}
        <TabsContent value="reconciliation">
          <Card>
            <CardHeader>
              <CardTitle>Bank Reconciliation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">₹12.5M</p>
                    <p className="text-sm text-muted-foreground">Bank Balance</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">₹12.3M</p>
                    <p className="text-sm text-muted-foreground">SAP Balance</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">₹200K</p>
                    <p className="text-sm text-muted-foreground">Difference</p>
                  </div>
                </div>
                <Button className="w-full">Start Reconciliation</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <BookOpen className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold">Trial Balance</h3>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Real-time from SAP
                </p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
                <h3 className="font-semibold">Financial Statements</h3>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  P&L, Balance Sheet, Cash Flow
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
