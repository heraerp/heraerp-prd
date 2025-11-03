# HERA Transaction Generator Template

Generate production-ready transaction pages with GL balance validation, line item management, and real-time posting to HERA API v2.

## Task Description

Create complete transaction management pages with header/lines structure, real-time GL validation, and idempotent posting.

## Input Parameters

- `TRANSACTION_TYPE`: Transaction type (e.g., 'SALE', 'PURCHASE', 'PAYMENT')
- `MODULE`: Business module (e.g., 'FINANCE', 'SALES', 'PURCHASING')
- `INDUSTRY`: Industry context (e.g., 'SALON', 'RESTAURANT', 'RETAIL')
- `PAGE_PATH`: Next.js page path (e.g., '/app/finance/sales/page.tsx')

## Mandatory Template Structure

```typescript
'use client'

import { useState, useEffect, useMemo, FormEvent, useCallback } from 'react'
import { Plus, Trash2, Calculator, DollarSign, FileText, Save, Send } from 'lucide-react'

// HERA Core Imports (MANDATORY)
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useTransactions, usePostTransaction, useGLBalance, useEntities } from '@/lib/hera-react-provider'
import { brandingEngine } from '@/lib/platform/branding-engine'

// UI Components (MANDATORY)
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'

// Constants
const TRANSACTION_TYPE = '{{TRANSACTION_TYPE}}'
const SMART_CODE_BASE = 'HERA.{{INDUSTRY}}.{{MODULE}}.TXN.{{TRANSACTION_TYPE}}'
const DEFAULT_CURRENCY = 'AED'

interface TransactionLine {
  line_number: number
  line_type: string
  description: string
  quantity: number
  unit_amount: number
  line_amount: number
  entity_id?: string
  smart_code: string
  line_data: {
    side: 'DR' | 'CR'
    account_code: string
    cost_center?: string
    project_code?: string
    currency: string
  }
}

interface TransactionHeader {
  transaction_type: string
  smart_code: string
  transaction_date: string
  transaction_currency: string
  total_amount: number
  source_entity_id?: string
  target_entity_id?: string
  transaction_status: string
  metadata?: Record<string, any>
  description?: string
}

export default function {{TRANSACTION_TYPE}}Page() {
  // Authentication (MANDATORY - Three-layer check)
  const { user, organization, isAuthenticated, contextLoading } = useHERAAuth()
  
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Please log in to continue</p>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading organization context...</p>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (!organization?.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md border-destructive">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">No organization context available</p>
            <Button onClick={() => window.location.href = '/auth/organizations'} className="mt-4">
              Select Organization
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Branding initialization (MANDATORY)
  useEffect(() => {
    brandingEngine.initializeBranding(organization.id)
  }, [organization.id])

  // State management
  const [header, setHeader] = useState<TransactionHeader>({
    transaction_type: TRANSACTION_TYPE,
    smart_code: `${SMART_CODE_BASE}.v1`,
    transaction_date: new Date().toISOString().split('T')[0],
    transaction_currency: DEFAULT_CURRENCY,
    total_amount: 0,
    transaction_status: 'DRAFT',
    description: ''
  })

  const [lines, setLines] = useState<TransactionLine[]>([
    {
      line_number: 1,
      line_type: 'GL',
      description: '',
      quantity: 1,
      unit_amount: 0,
      line_amount: 0,
      smart_code: `${SMART_CODE_BASE}.LINE.v1`,
      line_data: {
        side: 'DR',
        account_code: '',
        currency: DEFAULT_CURRENCY
      }
    }
  ])

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Real data fetching (MANDATORY - Never mock)
  const { data: transactionsResponse, isLoading: transactionsLoading } = useTransactions({
    transaction_type: TRANSACTION_TYPE,
    limit: 10,
    sort: 'transaction_date',
    order: 'desc'
  })

  const { data: entitiesResponse } = useEntities({
    entity_type: 'CUSTOMER',
    limit: 100
  })

  const { data: accountsResponse } = useEntities({
    entity_type: 'GL_ACCOUNT',
    limit: 200
  })

  // Real transaction posting (MANDATORY - Never mock)
  const postTransaction = usePostTransaction({
    onSuccess: (response) => {
      toast({ 
        title: "✅ Transaction posted successfully",
        description: `Transaction ID: ${response.data.transaction_id}`
      })
      resetForm()
    },
    onError: (error) => {
      toast({
        title: "❌ Failed to post transaction",
        description: error.message,
        variant: "destructive"
      })
      setIsSubmitting(false)
    }
  })

  // GL Balance validation (MANDATORY - Real-time)
  const glBalance = useGLBalance(lines)

  // Data processing
  const recentTransactions = useMemo(() => {
    return transactionsResponse?.data || []
  }, [transactionsResponse?.data])

  const entities = useMemo(() => {
    return entitiesResponse?.data || []
  }, [entitiesResponse?.data])

  const accounts = useMemo(() => {
    return accountsResponse?.data || []
  }, [accountsResponse?.data])

  // Form handlers
  const resetForm = () => {
    setHeader({
      transaction_type: TRANSACTION_TYPE,
      smart_code: `${SMART_CODE_BASE}.v1`,
      transaction_date: new Date().toISOString().split('T')[0],
      transaction_currency: DEFAULT_CURRENCY,
      total_amount: 0,
      transaction_status: 'DRAFT',
      description: ''
    })
    
    setLines([
      {
        line_number: 1,
        line_type: 'GL',
        description: '',
        quantity: 1,
        unit_amount: 0,
        line_amount: 0,
        smart_code: `${SMART_CODE_BASE}.LINE.v1`,
        line_data: {
          side: 'DR',
          account_code: '',
          currency: DEFAULT_CURRENCY
        }
      }
    ])
    
    setIsSubmitting(false)
  }

  const addLine = () => {
    const newLine: TransactionLine = {
      line_number: lines.length + 1,
      line_type: 'GL',
      description: '',
      quantity: 1,
      unit_amount: 0,
      line_amount: 0,
      smart_code: `${SMART_CODE_BASE}.LINE.v1`,
      line_data: {
        side: 'DR',
        account_code: '',
        currency: DEFAULT_CURRENCY
      }
    }
    setLines([...lines, newLine])
  }

  const removeLine = (lineNumber: number) => {
    if (lines.length > 1) {
      const updatedLines = lines
        .filter(line => line.line_number !== lineNumber)
        .map((line, index) => ({ ...line, line_number: index + 1 }))
      setLines(updatedLines)
    }
  }

  const updateLine = (lineNumber: number, updates: Partial<TransactionLine>) => {
    setLines(lines.map(line => 
      line.line_number === lineNumber 
        ? { ...line, ...updates }
        : line
    ))
  }

  const updateLineData = (lineNumber: number, updates: Partial<TransactionLine['line_data']>) => {
    setLines(lines.map(line => 
      line.line_number === lineNumber 
        ? { ...line, line_data: { ...line.line_data, ...updates } }
        : line
    ))
  }

  // Calculate totals
  const totalAmount = useMemo(() => {
    return lines.reduce((sum, line) => sum + line.line_amount, 0)
  }, [lines])

  // Update header total when lines change
  useEffect(() => {
    setHeader(prev => ({ ...prev, total_amount: totalAmount }))
  }, [totalAmount])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!glBalance.isBalanced) {
      toast({
        title: "❌ Transaction not balanced",
        description: `DR: ${glBalance.drTotal} ≠ CR: ${glBalance.crTotal}`,
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    const transactionData = {
      ...header,
      organization_id: organization.id,
      lines: lines.map(line => ({
        ...line,
        line_data: {
          ...line.line_data,
          organization_id: organization.id
        }
      }))
    }

    const idempotencyKey = `${organization.id}-${TRANSACTION_TYPE}-${Date.now()}`
    
    await postTransaction.mutateAsync({
      payload: transactionData,
      idempotencyKey
    })
  }

  // Loading state (MANDATORY)
  if (transactionsLoading) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Main UI (MANDATORY - Mobile-first responsive)
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Mobile Status Bar Spacer */}
      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden -mx-4 -mt-4 mb-4"></div>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{{TRANSACTION_TYPE}} Entry</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage {{TRANSACTION_TYPE}} transactions with GL validation
          </p>
        </div>
        
        <div className="flex gap-2">
          <Badge variant={glBalance.isBalanced ? 'default' : 'destructive'} className="min-h-[32px]">
            {glBalance.isBalanced ? '✅ Balanced' : '❌ Unbalanced'}
          </Badge>
          <Badge variant="outline" className="min-h-[32px]">
            {header.transaction_currency} {totalAmount.toFixed(2)}
          </Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Transaction Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Transaction Header
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="transaction_date">Transaction Date *</Label>
                <Input
                  id="transaction_date"
                  type="date"
                  value={header.transaction_date}
                  onChange={(e) => setHeader(prev => ({ ...prev, transaction_date: e.target.value }))}
                  required
                  className="min-h-[44px]"
                />
              </div>
              
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select 
                  value={header.transaction_currency} 
                  onValueChange={(value) => setHeader(prev => ({ ...prev, transaction_currency: value }))}
                >
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AED">AED</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="source_entity">Customer/Vendor</Label>
                <Select 
                  value={header.source_entity_id || ''} 
                  onValueChange={(value) => setHeader(prev => ({ ...prev, source_entity_id: value }))}
                >
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue placeholder="Select entity" />
                  </SelectTrigger>
                  <SelectContent>
                    {entities.map(entity => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.entity_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={header.description || ''}
                onChange={(e) => setHeader(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter transaction description"
                className="min-h-[44px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Transaction Lines */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Transaction Lines
              </CardTitle>
              <Button
                type="button"
                onClick={addLine}
                variant="outline"
                size="sm"
                className="min-h-[32px] active:scale-95 transition-transform"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Line
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-20">Side</TableHead>
                    <TableHead className="w-32">Amount</TableHead>
                    <TableHead className="w-16">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line) => (
                    <TableRow key={line.line_number}>
                      <TableCell className="font-medium">
                        {line.line_number}
                      </TableCell>
                      
                      <TableCell>
                        <Select
                          value={line.line_data.account_code}
                          onValueChange={(value) => updateLineData(line.line_number, { account_code: value })}
                        >
                          <SelectTrigger className="min-h-[36px]">
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map(account => (
                              <SelectItem key={account.id} value={account.entity_code || account.id}>
                                {account.entity_code} - {account.entity_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      
                      <TableCell>
                        <Input
                          value={line.description}
                          onChange={(e) => updateLine(line.line_number, { description: e.target.value })}
                          placeholder="Line description"
                          className="min-h-[36px]"
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Select
                          value={line.line_data.side}
                          onValueChange={(value: 'DR' | 'CR') => updateLineData(line.line_number, { side: value })}
                        >
                          <SelectTrigger className="min-h-[36px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DR">DR</SelectItem>
                            <SelectItem value="CR">CR</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.line_amount}
                          onChange={(e) => updateLine(line.line_number, { 
                            line_amount: parseFloat(e.target.value) || 0,
                            unit_amount: parseFloat(e.target.value) || 0
                          })}
                          placeholder="0.00"
                          className="min-h-[36px] text-right"
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Button
                          type="button"
                          onClick={() => removeLine(line.line_number)}
                          variant="ghost"
                          size="sm"
                          disabled={lines.length === 1}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 active:scale-95 transition-transform"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* GL Balance Summary */}
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Debit Total</p>
                  <p className="font-semibold text-lg">{header.transaction_currency} {glBalance.drTotal.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Credit Total</p>
                  <p className="font-semibold text-lg">{header.transaction_currency} {glBalance.crTotal.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Difference</p>
                  <p className={`font-semibold text-lg ${glBalance.isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                    {header.transaction_currency} {glBalance.difference.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={isSubmitting}
                className="flex-1 min-h-[44px] active:scale-95 transition-transform"
              >
                Clear Form
              </Button>
              
              <Button
                type="submit"
                disabled={!glBalance.isBalanced || isSubmitting || lines.some(line => !line.line_data.account_code)}
                className="flex-1 min-h-[44px] active:scale-95 transition-transform"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Post Transaction
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent {{TRANSACTION_TYPE}} Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.slice(0, 5).map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell>{new Date(txn.transaction_date).toLocaleDateString()}</TableCell>
                      <TableCell>{txn.description || txn.transaction_type}</TableCell>
                      <TableCell>{txn.transaction_currency} {txn.total_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={txn.transaction_status === 'POSTED' ? 'default' : 'secondary'}>
                          {txn.transaction_status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bottom spacing for mobile */}
      <div className="h-24 md:h-0"></div>
    </div>
  )
}
```

## Validation Rules

1. **GL Balance**: Must validate DR = CR before posting
2. **Required Fields**: Account codes and amounts required
3. **Real-time Validation**: Must use HERA GL validation hooks
4. **Idempotency**: Must include unique idempotency keys
5. **Currency Consistency**: All lines must use same currency
6. **Organization Boundary**: All operations must include organization_id
7. **Smart Codes**: Must include proper HERA DNA patterns
8. **Audit Trail**: Must include actor stamping

## Success Criteria

- ✅ Connects to real HERA transaction API
- ✅ Validates GL balance in real-time
- ✅ Handles transaction lines dynamically
- ✅ Posts transactions with idempotency
- ✅ Shows recent transactions from backend
- ✅ Mobile-first responsive design
- ✅ Proper loading and error states
- ✅ Never stubs or mocks any functionality

## Customization Points

Replace these placeholders:
- `{{TRANSACTION_TYPE}}`: Target transaction type (e.g., 'SALE')
- `{{MODULE}}`: Business module (e.g., 'FINANCE')
- `{{INDUSTRY}}`: Industry context (e.g., 'SALON')

Add transaction-specific features:
- Line types (GL, PRODUCT, SERVICE)
- Business validation rules
- Approval workflows
- Integration points