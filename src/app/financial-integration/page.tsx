'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ConfigurationPanel,
  PostingQueue,
  GLBalanceViewer,
  DuplicateAlert
} from '@/components/financial-integration'
import { Settings, Send, BarChart3, Shield, Zap, Globe, Brain, CheckCircle2 } from 'lucide-react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'

export default function FinancialIntegrationPage() {
  const { currentOrganization } = useMultiOrgAuth()
  const [selectedTab, setSelectedTab] = useState('overview')
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false)

  // Demo duplicate check result
  const demoCheckResult = {
    is_duplicate: true,
    confidence: 0.85,
    matches: [
      {
        transaction_id: '123',
        invoice_number: 'INV-2024-001',
        amount: 5000,
        date: '2024-01-10',
        vendor_name: 'ABC Supplies Inc',
        confidence_factors: {
          amount_match: true,
          date_proximity: true,
          invoice_number_match: true,
          vendor_match: true
        }
      }
    ],
    recommendation: 'DO NOT POST - High probability duplicate invoice detected',
    ai_analysis: {
      risk_level: 'high' as const,
      explanation:
        'This invoice appears to be a duplicate based on matching invoice number, amount, and vendor within a 7-day period.',
      suggested_action: 'Review the original posting before proceeding'
    }
  }

  if (!currentOrganization) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>
            Please select an organization to access financial integration features.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">HERA DNA Financial Integration</h1>
            <p className="text-muted-foreground">
              Enterprise-grade financial system integration with zero schema changes
            </p>
          </div>
          <Badge variant="outline" className="px-3 py-1">
            <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
            Production Ready
          </Badge>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Real-time Sync</p>
                  <p className="text-sm text-muted-foreground">Instant posting to ERP</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Brain className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">AI Validation</p>
                  <p className="text-sm text-muted-foreground">Smart duplicate detection</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Multi-tenant</p>
                  <p className="text-sm text-muted-foreground">Perfect isolation</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Globe className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium">Global Ready</p>
                  <p className="text-sm text-muted-foreground">Multi-region support</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="configuration">
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="posting">
            <Send className="h-4 w-4 mr-2" />
            Posting Queue
          </TabsTrigger>
          <TabsTrigger value="balances">
            <BarChart3 className="h-4 w-4 mr-2" />
            GL Balances
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to HERA DNA Financial Integration</CardTitle>
              <CardDescription>
                Revolutionary enterprise financial system integration using only 6 sacred tables
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">🚀 Key Features</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Zero Schema Changes</p>
                        <p className="text-sm text-muted-foreground">
                          Complete integration using existing 6 tables
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Multi-System Support</p>
                        <p className="text-sm text-muted-foreground">
                          S/4HANA, ECC, Business One, and custom systems
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium">AI-Powered Intelligence</p>
                        <p className="text-sm text-muted-foreground">
                          Duplicate detection, validation, smart posting
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Global Compliance</p>
                        <p className="text-sm text-muted-foreground">
                          India GST, EU VAT, US Tax built-in
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">📊 System Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">Connection Status</span>
                      <Badge variant="outline" className="bg-green-50">
                        <div className="h-2 w-2 bg-green-600 rounded-full mr-2" />
                        Connected
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">Auto-Posting</span>
                      <Badge variant="outline" className="bg-blue-50">
                        <div className="h-2 w-2 bg-blue-600 rounded-full mr-2 animate-pulse" />
                        Active
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">Last Sync</span>
                      <span className="text-sm text-muted-foreground">2 minutes ago</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">Pending Posts</span>
                      <Badge>12</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold mb-4">🎯 Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setSelectedTab('configuration')}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <Settings className="h-5 w-5 mb-2 text-muted-foreground" />
                    <p className="font-medium">Configure System</p>
                    <p className="text-sm text-muted-foreground">
                      Set up your financial system connection
                    </p>
                  </button>

                  <button
                    onClick={() => setSelectedTab('posting')}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <Send className="h-5 w-5 mb-2 text-muted-foreground" />
                    <p className="font-medium">View Posting Queue</p>
                    <p className="text-sm text-muted-foreground">Manage pending transactions</p>
                  </button>

                  <button
                    onClick={() => setShowDuplicateAlert(true)}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <Brain className="h-5 w-5 mb-2 text-muted-foreground" />
                    <p className="font-medium">Test AI Detection</p>
                    <p className="text-sm text-muted-foreground">
                      See duplicate detection in action
                    </p>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration">
          <ConfigurationPanel
            organizationId={currentOrganization.id}
            onConfigSave={() => {
              // Handle configuration save
              console.log('Configuration saved')
            }}
          />
        </TabsContent>

        <TabsContent value="posting">
          <PostingQueue
            organizationId={currentOrganization.id}
            onTransactionSelect={transaction => {
              // Handle transaction selection
              console.log('Transaction selected:', transaction)
            }}
          />
        </TabsContent>

        <TabsContent value="balances">
          <GLBalanceViewer
            organizationId={currentOrganization.id}
            onAccountSelect={accountCode => {
              // Handle account selection
              console.log('Account selected:', accountCode)
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Duplicate Alert Demo */}
      <DuplicateAlert
        open={showDuplicateAlert}
        onClose={() => setShowDuplicateAlert(false)}
        onProceed={() => console.log('User proceeded despite duplicate')}
        onCancel={() => console.log('User cancelled due to duplicate')}
        checkResult={demoCheckResult}
        transactionDetails={{
          amount: 5000,
          vendor_name: 'ABC Supplies Inc',
          invoice_number: 'INV-2024-001',
          date: '2024-01-15',
          description: 'Office supplies purchase'
        }}
      />
    </div>
  )
}
