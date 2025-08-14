'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  Zap, DollarSign, TrendingUp, CheckCircle, ArrowRight, Sparkles,
  ShoppingCart, CreditCard, Receipt, Building2, Users, Package
} from 'lucide-react'

/**
 * Universal GL Demo - Dave Patel's Business-First Accounting
 * 
 * Shows how business transactions automatically generate journal entries
 * "Record business events, accounting happens automatically"
 */

export default function UniversalGLPage() {
  const [selectedTransaction, setSelectedTransaction] = useState('sale')
  const [isRecording, setIsRecording] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [trialBalance, setTrialBalance] = useState(null)

  // Demo organization (Mario's Restaurant)
  const organizationId = '550e8400-e29b-41d4-a716-446655440000'

  // Business transaction examples
  const transactionExamples = {
    sale: {
      type: 'sale',
      icon: ShoppingCart,
      title: '🍕 Restaurant Sale',
      description: 'Customer orders pizza - cash payment',
      color: 'emerald',
      amount: 25.00,
      details: {
        customerId: 'cust_001',
        items: [{ itemId: 'pizza_margherita', quantity: 1, unitPrice: 25.00 }],
        paymentMethod: 'cash',
        taxAmount: 2.25
      },
      expectedAccounts: [
        { account: '1100 - Cash', amount: 27.25, type: 'Debit' },
        { account: '4000 - Sales Revenue', amount: 25.00, type: 'Credit' },
        { account: '2150 - Sales Tax Payable', amount: 2.25, type: 'Credit' }
      ]
    },
    purchase: {
      type: 'purchase', 
      icon: Package,
      title: '📦 Vendor Purchase',
      description: 'Buy ingredients from supplier',
      color: 'blue',
      amount: 150.00,
      details: {
        vendorId: 'vendor_001',
        invoiceNumber: 'INV-789',
        paymentMethod: 'credit'
      },
      expectedAccounts: [
        { account: '5000 - Purchases', amount: 150.00, type: 'Debit' },
        { account: '2100 - Accounts Payable', amount: 150.00, type: 'Credit' }
      ]
    },
    payment: {
      type: 'payment',
      icon: CreditCard,
      title: '💳 Vendor Payment', 
      description: 'Pay outstanding vendor bill',
      color: 'orange',
      amount: 150.00,
      details: {
        vendorId: 'vendor_001',
        paymentMethod: 'bank_transfer'
      },
      expectedAccounts: [
        { account: '2100 - Accounts Payable', amount: 150.00, type: 'Debit' },
        { account: '1100 - Cash', amount: 150.00, type: 'Credit' }
      ]
    },
    receipt: {
      type: 'receipt',
      icon: Receipt,
      title: '🧾 Customer Payment',
      description: 'Customer pays outstanding invoice',
      color: 'purple',
      amount: 50.00,
      details: {
        customerId: 'cust_002',
        paymentMethod: 'check'
      },
      expectedAccounts: [
        { account: '1100 - Cash', amount: 50.00, type: 'Debit' },
        { account: '1200 - Accounts Receivable', amount: 50.00, type: 'Credit' }
      ]
    }
  }

  const currentExample = transactionExamples[selectedTransaction]

  // Load trial balance on component mount
  useEffect(() => {
    loadTrialBalance()
  }, [])

  const loadTrialBalance = async () => {
    try {
      const response = await fetch(`/api/v1/financial/universal-gl?action=trial_balance&organization_id=${organizationId}`)
      const result = await response.json()
      if (result.success) {
        setTrialBalance(result.data)
      }
    } catch (error) {
      console.error('Error loading trial balance:', error)
    }
  }

  // Record business transaction and see automatic GL posting
  const recordBusinessTransaction = async () => {
    setIsRecording(true)
    
    try {
      const transactionData = {
        organizationId,
        transactionType: currentExample.type,
        amount: currentExample.amount,
        description: currentExample.description,
        details: currentExample.details,
        transactionDate: new Date().toISOString()
      }

      console.log('🏗️ Recording business transaction:', transactionData)

      const response = await fetch('/api/v1/financial/universal-gl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData)
      })

      const result = await response.json()
      
      if (result.success) {
        setLastResult(result.data)
        // Reload trial balance to show updated balances
        await loadTrialBalance()
      } else {
        alert(`Error: ${result.message}`)
      }

    } catch (error) {
      console.error('Error recording transaction:', error)
      alert('Failed to record transaction')
    } finally {
      setIsRecording(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-blue-600 bg-clip-text text-transparent">
                🧬 Universal GL System
              </h1>
              <p className="text-gray-600 mt-1">
                Dave Patel's Revolutionary Approach: "Record business events, accounting happens automatically"
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>No manual journal entries required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Automatic account mapping</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Real-time financial statements</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Business Transaction Input */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transaction Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  1. Select Business Event
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(transactionExamples).map(([key, example]) => {
                    const IconComponent = example.icon
                    const isSelected = selectedTransaction === key
                    
                    return (
                      <Card 
                        key={key}
                        className={`cursor-pointer transition-all hover:scale-105 ${
                          isSelected ? `ring-2 ring-${example.color}-500 shadow-lg` : 'hover:shadow-md'
                        }`}
                        onClick={() => setSelectedTransaction(key)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 bg-gradient-to-r from-${example.color}-400 to-${example.color}-600 rounded-xl flex items-center justify-center`}>
                              <IconComponent className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="font-semibold text-sm">{example.title}</div>
                              <div className="text-xs text-gray-500">{example.description}</div>
                              <div className="text-sm font-bold text-green-600 mt-1">
                                ${example.amount.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Expected GL Impact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  2. Automatic GL Posting Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-4">
                    When you record this business event, HERA will automatically generate these journal entries:
                  </p>
                  
                  {currentExample.expectedAccounts.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          entry.type === 'Debit' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                        }`}>
                          {entry.type === 'Debit' ? 'DR' : 'CR'}
                        </div>
                        <div className="text-sm font-medium">{entry.account}</div>
                      </div>
                      <div className="text-sm font-bold text-gray-900">
                        ${entry.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>Entry will automatically balance</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Record Transaction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  3. Record Business Event
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <Button
                    onClick={recordBusinessTransaction}
                    disabled={isRecording}
                    className={`bg-gradient-to-r from-${currentExample.color}-500 to-${currentExample.color}-600 hover:from-${currentExample.color}-600 hover:to-${currentExample.color}-700 text-white px-8 py-3 text-lg`}
                  >
                    {isRecording ? (
                      <>
                        <div className="w-5 h-5 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                        Recording...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Record {currentExample.title}
                      </>
                    )}
                  </Button>
                  <p className="text-sm text-gray-500 mt-3">
                    Business event will be recorded and GL entries generated automatically
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results & Trial Balance */}
          <div className="space-y-6">
            {/* Last Transaction Result */}
            {lastResult && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    ✅ Transaction Recorded
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-600">Transaction ID:</span>
                      <span className="font-mono text-xs">{lastResult.transactionId.slice(-8)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">Journal Entry:</span>
                      <span className="font-mono text-xs">{lastResult.journalEntry.referenceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">Debits:</span>
                      <span className="font-bold">${lastResult.journalEntry.totalDebits.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">Credits:</span>
                      <span className="font-bold">${lastResult.journalEntry.totalCredits.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">Balanced:</span>
                      <Badge className="bg-green-100 text-green-800">
                        {lastResult.journalEntry.isBalanced ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="pt-3 border-t border-green-200">
                      <div className="text-xs text-green-600 italic">
                        "{lastResult.davePatelPrinciple}"
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dave Patel Principles */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Users className="w-5 h-5" />
                  Dave Patel Principles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-white rounded border">
                    <strong className="text-blue-600">Business-First:</strong><br/>
                    Record what happened in the business, not accounting codes
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <strong className="text-purple-600">Zero Configuration:</strong><br/>
                    System learns account mapping from business patterns
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <strong className="text-green-600">Real-time Accuracy:</strong><br/>
                    Financial statements update instantly with each transaction
                  </div>
                  <div className="p-3 bg-white rounded border">
                    <strong className="text-orange-600">Universal Architecture:</strong><br/>
                    One system handles GL, AP, AR, FA - no separate modules
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Real-time Trial Balance */}
            {trialBalance && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Real-time Trial Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {trialBalance.accounts.slice(0, 4).map((account, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{account.accountCode}</div>
                          <div className="text-xs text-gray-500">{account.accountName}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">${Math.abs(account.netBalance).toFixed(2)}</div>
                          <div className="text-xs text-gray-500">
                            {account.netBalance >= 0 ? 'DR' : 'CR'}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-gray-200 text-xs text-gray-500">
                      Updated in real-time from business transactions
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}