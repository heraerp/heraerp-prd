'use client'

import React, { useState, useEffect } from 'react'
import { 
  Plus, Minus, Calculator, Bot, Sparkles, 
  AlertCircle, CheckCircle, DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { universalApi } from '@/lib/universal-api'

interface JournalEntry {
  account_code: string
  account_name: string
  description: string
  debit_amount: number
  credit_amount: number
}

interface GLTransactionFormProps {
  onSuccess?: (transaction: any) => void
  onCancel?: () => void
}

export default function GLTransactionForm({ onSuccess, onCancel }: GLTransactionFormProps) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [success, setSuccess] = useState(false)
  
  // Transaction Header
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0])
  const [referenceNumber, setReferenceNumber] = useState('')
  const [description, setDescription] = useState('')
  
  // Journal Entries
  const [entries, setEntries] = useState<JournalEntry[]>([
    { account_code: '', account_name: '', description: '', debit_amount: 0, credit_amount: 0 },
    { account_code: '', account_name: '', description: '', debit_amount: 0, credit_amount: 0 }
  ])
  
  // AI Assistant
  const [aiPrompt, setAiPrompt] = useState('')
  const [showAIHelper, setShowAIHelper] = useState(false)

  // Mock GL Accounts for demonstration
  const mockGLAccounts = [
    { code: '1100', name: 'Cash in Bank', type: 'Asset', normal_balance: 'debit' },
    { code: '1200', name: 'Accounts Receivable', type: 'Asset', normal_balance: 'debit' },
    { code: '1300', name: 'Inventory', type: 'Asset', normal_balance: 'debit' },
    { code: '2000', name: 'Accounts Payable', type: 'Liability', normal_balance: 'credit' },
    { code: '3000', name: 'Owner\'s Equity', type: 'Equity', normal_balance: 'credit' },
    { code: '4000', name: 'Sales Revenue', type: 'Revenue', normal_balance: 'credit' },
    { code: '5000', name: 'Cost of Goods Sold', type: 'Expense', normal_balance: 'debit' },
    { code: '6000', name: 'Operating Expenses', type: 'Expense', normal_balance: 'debit' }
  ]

  // Calculate totals
  const totalDebits = entries.reduce((sum, entry) => sum + (entry.debit_amount || 0), 0)
  const totalCredits = entries.reduce((sum, entry) => sum + (entry.credit_amount || 0), 0)
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01
  const difference = totalDebits - totalCredits

  // Add new journal entry line
  const addEntry = () => {
    setEntries([...entries, { account_code: '', account_name: '', description: '', debit_amount: 0, credit_amount: 0 }])
  }

  // Remove journal entry line
  const removeEntry = (index: number) => {
    if (entries.length > 2) {
      setEntries(entries.filter((_, i) => i !== index))
    }
  }

  // Update journal entry
  const updateEntry = (index: number, field: keyof JournalEntry, value: any) => {
    const newEntries = [...entries]
    newEntries[index] = { ...newEntries[index], [field]: value }
    
    // If account_code changed, update account_name
    if (field === 'account_code') {
      const account = mockGLAccounts.find(acc => acc.code === value)
      if (account) {
        newEntries[index].account_name = account.name
      }
    }
    
    setEntries(newEntries)
  }

  // Auto-generate reference number
  useEffect(() => {
    if (!referenceNumber) {
      const today = new Date()
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '')
      const timeStr = today.getTime().toString().slice(-4)
      setReferenceNumber(`JE-${dateStr}-${timeStr}`)
    }
  }, [referenceNumber])

  // AI-powered journal entry generation
  const handleAIGenerate = () => {
    const prompt = aiPrompt.toLowerCase()
    
    if (prompt.includes('sale') || prompt.includes('revenue')) {
      // Sale transaction
      const amount = extractAmount(prompt) || 1000
      setEntries([
        { account_code: '1100', account_name: 'Cash in Bank', description: 'Cash received from sales', debit_amount: amount, credit_amount: 0 },
        { account_code: '4000', account_name: 'Sales Revenue', description: 'Revenue from sales', debit_amount: 0, credit_amount: amount }
      ])
      setDescription('Sales transaction - cash receipt')
    } else if (prompt.includes('expense') || prompt.includes('purchase')) {
      // Expense transaction
      const amount = extractAmount(prompt) || 500
      setEntries([
        { account_code: '6000', account_name: 'Operating Expenses', description: 'Business expense payment', debit_amount: amount, credit_amount: 0 },
        { account_code: '1100', account_name: 'Cash in Bank', description: 'Cash payment for expenses', debit_amount: 0, credit_amount: amount }
      ])
      setDescription('Expense transaction - cash payment')
    } else if (prompt.includes('inventory') || prompt.includes('goods')) {
      // Inventory purchase
      const amount = extractAmount(prompt) || 2000
      setEntries([
        { account_code: '1300', account_name: 'Inventory', description: 'Inventory purchase', debit_amount: amount, credit_amount: 0 },
        { account_code: '2000', account_name: 'Accounts Payable', description: 'Amount owed to supplier', debit_amount: 0, credit_amount: amount }
      ])
      setDescription('Inventory purchase on credit')
    }
    
    setAiPrompt('')
    setShowAIHelper(false)
  }

  // Extract amount from AI prompt
  const extractAmount = (prompt: string): number | null => {
    const match = prompt.match(/\$?([0-9,]+\.?[0-9]*)/);
    return match ? parseFloat(match[1].replace(/,/g, '')) : null;
  }

  // Submit journal entry
  const handleSubmit = async () => {
    setLoading(true)
    setErrors([])
    
    try {
      // Validation
      const validationErrors = []
      
      if (!transactionDate) validationErrors.push('Transaction date is required')
      if (!referenceNumber) validationErrors.push('Reference number is required')
      if (!isBalanced) validationErrors.push(`Journal entry must balance (difference: ${difference.toFixed(2)})`)
      
      entries.forEach((entry, index) => {
        if (!entry.account_code) validationErrors.push(`Account code required for line ${index + 1}`)
        if (entry.debit_amount === 0 && entry.credit_amount === 0) {
          validationErrors.push(`Amount required for line ${index + 1}`)
        }
        if (entry.debit_amount > 0 && entry.credit_amount > 0) {
          validationErrors.push(`Line ${index + 1} cannot have both debit and credit amounts`)
        }
      })
      
      if (validationErrors.length > 0) {
        setErrors(validationErrors)
        setLoading(false)
        return
      }

      // Create transaction using Universal API
      const transactionData = {
        organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945', // Demo org ID
        transaction_type: 'journal_entry',
        transaction_number: referenceNumber,
        transaction_date: transactionDate,
        reference_number: referenceNumber,
        description: description || 'Journal Entry',
        total_amount: totalDebits,
        currency: 'USD',
        status: 'posted',
        workflow_state: 'completed'
      }

      console.log('Creating transaction:', transactionData)

      // Create the transaction header
      const transactionResponse = await fetch('/api/v1/universal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          table: 'universal_transactions',
          data: transactionData,
          organization_id: transactionData.organization_id
        })
      })

      const transactionResult = await transactionResponse.json()
      
      if (!transactionResult.success) {
        throw new Error(transactionResult.error || 'Failed to create transaction')
      }

      const transactionId = transactionResult.data.id

      // Create transaction lines
      const linePromises = entries.map((entry, index) => {
        const lineData = {
          transaction_id: transactionId,
          organization_id: transactionData.organization_id,
          line_description: entry.description || entry.account_name,
          entity_id: null, // Could link to GL account entity if needed
          line_order: index + 1,
          quantity: 1,
          unit_price: entry.debit_amount || entry.credit_amount,
          line_amount: entry.debit_amount || entry.credit_amount,
          gl_account_code: entry.account_code,
          notes: `${entry.debit_amount > 0 ? 'Debit' : 'Credit'}: ${entry.account_name}`
        }

        return fetch('/api/v1/universal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'create',
            table: 'universal_transaction_lines',
            data: lineData,
            organization_id: transactionData.organization_id
          })
        })
      })

      const lineResults = await Promise.all(linePromises)
      const lineResponses = await Promise.all(lineResults.map(r => r.json()))

      // Check if all lines were created successfully
      const failedLines = lineResponses.filter(r => !r.success)
      if (failedLines.length > 0) {
        throw new Error(`Failed to create ${failedLines.length} transaction lines`)
      }

      setSuccess(true)
      if (onSuccess) {
        onSuccess({
          ...transactionResult.data,
          lines: lineResponses.map(r => r.data)
        })
      }

      // Reset form
      setTimeout(() => {
        setEntries([
          { account_code: '', account_name: '', description: '', debit_amount: 0, credit_amount: 0 },
          { account_code: '', account_name: '', description: '', debit_amount: 0, credit_amount: 0 }
        ])
        setDescription('')
        setReferenceNumber('')
        setSuccess(false)
      }, 2000)

    } catch (error) {
      console.error('Error creating journal entry:', error)
      setErrors([error instanceof Error ? error.message : 'Unknown error occurred'])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Create Journal Entry
            </CardTitle>
            <CardDescription>
              Record manual journal entries with automatic balancing validation
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowAIHelper(!showAIHelper)}
            className="border-purple-200 hover:bg-purple-50"
          >
            <Bot className="w-4 h-4 mr-2 text-purple-600" />
            AI Assistant
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* AI Helper */}
        {showAIHelper && (
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">AI Journal Entry Assistant</span>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Describe the transaction (e.g., 'Record sale of $1,500', 'Pay expense of $800')"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAIGenerate} size="sm" className="bg-purple-600 hover:bg-purple-700">
                  Generate
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Messages */}
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Journal entry created successfully! Transaction ID: {referenceNumber}
            </AlertDescription>
          </Alert>
        )}

        {/* Transaction Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="transaction_date">Transaction Date</Label>
            <Input
              id="transaction_date"
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="reference_number">Reference Number</Label>
            <Input
              id="reference_number"
              placeholder="JE-20240810-001"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              required
            />
          </div>
          <div className="md:col-span-1">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Journal entry description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Journal Entry Lines */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Label className="text-base font-semibold">Journal Entry Lines</Label>
            <Button onClick={addEntry} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Line
            </Button>
          </div>

          <div className="space-y-3">
            {entries.map((entry, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-7 gap-3">
                  {/* Account Selection */}
                  <div className="md:col-span-2">
                    <Select
                      value={entry.account_code}
                      onValueChange={(value) => updateEntry(index, 'account_code', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Account" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockGLAccounts.map((account) => (
                          <SelectItem key={account.code} value={account.code}>
                            {account.code} - {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <Input
                      placeholder="Line description"
                      value={entry.description}
                      onChange={(e) => updateEntry(index, 'description', e.target.value)}
                    />
                  </div>

                  {/* Debit Amount */}
                  <div>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Debit"
                      value={entry.debit_amount || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0
                        updateEntry(index, 'debit_amount', value)
                        if (value > 0) updateEntry(index, 'credit_amount', 0)
                      }}
                    />
                  </div>

                  {/* Credit Amount */}
                  <div>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Credit"
                      value={entry.credit_amount || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0
                        updateEntry(index, 'credit_amount', value)
                        if (value > 0) updateEntry(index, 'debit_amount', 0)
                      }}
                    />
                  </div>

                  {/* Remove Button */}
                  <div className="flex justify-end">
                    <Button
                      onClick={() => removeEntry(index)}
                      variant="ghost"
                      size="sm"
                      disabled={entries.length <= 2}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-4">
                <span>Total Debits: <strong>${totalDebits.toFixed(2)}</strong></span>
                <span>Total Credits: <strong>${totalCredits.toFixed(2)}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                {isBalanced ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Balanced
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Out of Balance: ${Math.abs(difference).toFixed(2)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <Button onClick={onCancel} variant="outline">
              Cancel
            </Button>
          )}
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !isBalanced}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4 mr-2" />
                Post Journal Entry
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}