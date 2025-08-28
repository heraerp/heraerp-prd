'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calculator, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  FileText,
  DollarSign,
  Building2,
  CreditCard,
  Banknote,
  BarChart3,
  Lock,
  Unlock,
  Globe,
  RefreshCw
} from 'lucide-react'

export default function FIDemoPage() {
  const [activeDemo, setActiveDemo] = useState<string>('overview')
  const [closeProgress, setCloseProgress] = useState(0)
  const [balanceResults, setBalanceResults] = useState<any>(null)
  
  // S/4HANA FI Parity Score
  const parityModules = [
    { name: 'Universal Journal', score: 100, status: 'native', icon: FileText },
    { name: 'General Ledger', score: 95, status: 'native', icon: Calculator },
    { name: 'Accounts Payable', score: 90, status: 'native', icon: CreditCard },
    { name: 'Accounts Receivable', score: 90, status: 'native', icon: Banknote },
    { name: 'Asset Accounting', score: 85, status: 'rule-pack', icon: Building2 },
    { name: 'Bank & Cash', score: 95, status: 'native', icon: DollarSign },
    { name: 'Tax Engine', score: 80, status: 'rule-pack', icon: Globe },
    { name: 'Period Close', score: 95, status: 'native', icon: Lock },
    { name: 'Multi-Currency', score: 90, status: 'native', icon: RefreshCw },
  ]
  
  const overallParity = Math.round(
    parityModules.reduce((sum, m) => sum + m.score, 0) / parityModules.length
  )
  
  // Period close steps
  const closeSteps = [
    { id: 'soft-lock', name: 'Soft Lock Period', icon: Unlock, status: 'pending' },
    { id: 'depreciation', name: 'Run Depreciation', icon: TrendingUp, status: 'pending' },
    { id: 'fx-reval', name: 'FX Revaluation', icon: RefreshCw, status: 'pending' },
    { id: 'accruals', name: 'Post Accruals', icon: FileText, status: 'pending' },
    { id: 'reconcile', name: 'Reconciliations', icon: CheckCircle2, status: 'pending' },
    { id: 'validate', name: 'Validate Balances', icon: Calculator, status: 'pending' },
    { id: 'hard-lock', name: 'Hard Lock Period', icon: Lock, status: 'pending' },
    { id: 'reports', name: 'Generate Reports', icon: BarChart3, status: 'pending' },
  ]
  
  const simulatePeriodClose = () => {
    let progress = 0
    const interval = setInterval(() => {
      progress += 12.5
      setCloseProgress(progress)
      
      const stepIndex = Math.floor((progress - 1) / 12.5)
      if (stepIndex < closeSteps.length) {
        closeSteps[stepIndex].status = 'completed'
      }
      
      if (progress >= 100) {
        clearInterval(interval)
      }
    }, 500)
  }
  
  const validateGLBalance = () => {
    // Simulate GL validation
    setBalanceResults({
      currencies: [
        { currency: 'USD', debits: 1250000, credits: 1250000, balanced: true },
        { currency: 'EUR', debits: 450000, credits: 450000, balanced: true },
        { currency: 'GBP', debits: 180000, credits: 179999.50, balanced: false },
      ],
      period: '2024-01',
      allBalanced: false
    })
  }
  
  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">HERA Financial Accounting (FI)</h1>
        <p className="text-lg text-muted-foreground">
          S/4HANA FI capabilities on 6 universal tables
        </p>
      </div>
      
      {/* Overall Parity Score */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>S/4HANA FI Parity Score</span>
            <Badge variant="default" className="text-lg px-4 py-1">
              {overallParity}% Parity
            </Badge>
          </CardTitle>
          <CardDescription>
            HERA delivers enterprise-grade FI with 6x faster implementation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {parityModules.map((module) => {
              const Icon = module.icon
              return (
                <div key={module.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{module.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {module.status === 'native' ? 'Native' : 'Rule Pack'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{module.score}%</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
      
      <Tabs value={activeDemo} onValueChange={setActiveDemo}>
        <TabsList className="grid grid-cols-4 w-full mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="gl-balance">GL Balance</TabsTrigger>
          <TabsTrigger value="period-close">Period Close</TabsTrigger>
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>HERA vs S/4HANA Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="font-medium">Aspect</div>
                    <div className="font-medium text-center">S/4HANA</div>
                    <div className="font-medium text-center">HERA</div>
                  </div>
                  
                  {[
                    { aspect: 'Implementation Time', s4: '18-36 months', hera: '4-6 months' },
                    { aspect: 'Number of Tables', s4: '500+ tables', hera: '6 tables' },
                    { aspect: 'Customization', s4: 'ABAP development', hera: 'Smart codes' },
                    { aspect: 'Multi-tenant', s4: 'Complex setup', hera: 'Native' },
                    { aspect: 'Total Cost', s4: '$1M-10M', hera: '$100K-500K' },
                    { aspect: 'Audit Trail', s4: 'Add-on required', hera: 'Built-in' },
                  ].map((row, i) => (
                    <div key={i} className="grid grid-cols-3 gap-4 py-2 border-t">
                      <div>{row.aspect}</div>
                      <div className="text-center text-muted-foreground">{row.s4}</div>
                      <div className="text-center font-medium text-green-600">{row.hera}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Key Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Zero Schema Migration
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Add new features via smart codes without database changes
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Perfect Audit Trail
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Every transaction linked with complete history
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      AI-Native
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Auto-journal engine with 85% automation rate
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Multi-Tenant
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Organization isolation built into every query
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="gl-balance">
          <Card>
            <CardHeader>
              <CardTitle>GL Balance Validator</CardTitle>
              <CardDescription>
                Ensure debits equal credits per currency and period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={validateGLBalance} className="w-full md:w-auto">
                  <Calculator className="w-4 h-4 mr-2" />
                  Validate GL Balance for Period 2024-01
                </Button>
                
                {balanceResults && (
                  <div className="space-y-4">
                    <Alert variant={balanceResults.allBalanced ? 'default' : 'destructive'}>
                      <AlertDescription className="flex items-center gap-2">
                        {balanceResults.allBalanced ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            All currencies balanced for period {balanceResults.period}
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4" />
                            GL imbalance detected in one or more currencies
                          </>
                        )}
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-2">
                      {balanceResults.currencies.map((curr: any) => (
                        <div key={curr.currency} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{curr.currency}</h4>
                            {curr.balanced ? (
                              <Badge variant="default">Balanced</Badge>
                            ) : (
                              <Badge variant="destructive">Imbalanced</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Debits</p>
                              <p className="font-mono">{curr.debits.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Credits</p>
                              <p className="font-mono">{curr.credits.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Difference</p>
                              <p className="font-mono">{Math.abs(curr.debits - curr.credits).toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="period-close">
          <Card>
            <CardHeader>
              <CardTitle>Period Close Orchestrator</CardTitle>
              <CardDescription>
                Automated period close with complete checklist
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Button 
                    onClick={simulatePeriodClose} 
                    disabled={closeProgress > 0 && closeProgress < 100}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Execute Period Close for 2024-01
                  </Button>
                  {closeProgress > 0 && (
                    <span className="text-sm font-medium">{closeProgress}% Complete</span>
                  )}
                </div>
                
                {closeProgress > 0 && (
                  <>
                    <Progress value={closeProgress} className="w-full" />
                    
                    <div className="grid gap-2">
                      {closeSteps.map((step) => {
                        const Icon = step.icon
                        return (
                          <div 
                            key={step.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="w-5 h-5 text-muted-foreground" />
                              <span className="font-medium">{step.name}</span>
                            </div>
                            <div>
                              {step.status === 'completed' ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                              ) : step.status === 'failed' ? (
                                <XCircle className="w-5 h-5 text-red-500" />
                              ) : (
                                <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="architecture">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>6-Table FI Architecture</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Universal Journal Pattern</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      HERA's universal_transactions + universal_transaction_lines = S/4's ACDOCA
                    </p>
                    <pre className="text-xs bg-background p-3 rounded border overflow-x-auto">
{`-- Every financial posting
universal_transactions (header)
  ├── transaction_type: 'journal_entry'
  ├── smart_code: 'HERA.FIN.GL.JE.POST.v1'
  └── metadata: { fiscal_year, period, book }

universal_transaction_lines (details)
  ├── gl_account_id → core_entities
  ├── debit/credit amounts
  └── dimensions (profit center, cost center)`}</pre>
                  </div>
                  
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Smart Code Rule Packs</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Business logic without schema changes
                    </p>
                    <pre className="text-xs bg-background p-3 rounded border overflow-x-auto">
{`// Asset depreciation rule pack
'HERA.FIN.AA.DEPR.SL.v1': {
  calculate: (cost, salvage, life) => 
    (cost - salvage) / life,
  postingAccounts: {
    debit: '5100', // Depreciation expense
    credit: '1800' // Accumulated depreciation
  }
}`}</pre>
                  </div>
                  
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">MCP Agents for Automation</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Intelligent agents handle complex FI processes
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 bg-background rounded border">
                        GL Balance Validator
                      </div>
                      <div className="p-2 bg-background rounded border">
                        Period Close Orchestrator
                      </div>
                      <div className="p-2 bg-background rounded border">
                        AP Three-Way Matcher
                      </div>
                      <div className="p-2 bg-background rounded border">
                        Cash Reconciliation
                      </div>
                      <div className="p-2 bg-background rounded border">
                        FX Revaluation Runner
                      </div>
                      <div className="p-2 bg-background rounded border">
                        Tax Calculator
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}