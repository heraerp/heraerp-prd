'use client'

/**
 * Rebate Settlement Transaction Page
 * Smart Code: HERA.FINANCE.TXN.REBATE.SETTLEMENT.MAIN.v1
 * Generated from: Purchasing Rebate Processing v1.0.0
 */

import React, { useState } from 'react'
import { EnterpriseCreatePage, CreatePageSection, AIInsight } from '@/components/enterprise/EnterpriseCreatePage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { 
  Calculator, 
  Receipt, 
  DollarSign, 
  Plus,
  Trash2
} from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { apiV2 } from '@/lib/client/fetchV2'

interface TransactionLine {
  line_number: number
  line_type: string
  description: string
  amount: number
  side?: 'DR' | 'CR'
  account_code?: string
}

interface TransactionFormData {
  transaction_type: string
  description: string
  total_amount: number
  lines: TransactionLine[]
}

export default function CreateRebate SettlementPage() {
  const { organization, user } = useHERAAuth()
  const [currentSection, setCurrentSection] = useState('header')
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<TransactionFormData>({
    transaction_type: 'REBATE_SETTLEMENT',
    description: '',
    total_amount: 0,
    lines: [
      {
        line_number: 1,
        line_type: 'GL',
        description: 'Clear accrued rebate liability',
        amount: 0,
        side: 'DR',
        account_code: ''
      },
      {
        line_number: 2,
        line_type: 'GL',
        description: 'Credit to vendor accounts payable',
        amount: 0,
        side: 'CR',
        account_code: ''
      }
    ]
  })

  // Page sections for navigation
  const sections: CreatePageSection[] = [
    {
      id: 'header',
      title: 'Transaction Header',
      icon: Receipt,
      isRequired: true,
      isComplete: !!(formData.description && formData.total_amount > 0)
    },
    {
      id: 'lines',
      title: 'Transaction Lines',
      icon: Calculator,
      isRequired: true,
      isComplete: formData.lines.every(line => line.amount > 0)
    }
  ]

  // AI insights for transaction
  const aiInsights: AIInsight[] = [
    {
      id: 'balance',
      type: 'automation',
      title: 'GL Balance Check',
      content: 'HERA automatically validates that debits equal credits for GL transactions.'
    },
    {
      id: 'accounts',
      type: 'suggestion',
      title: 'Account Mapping',
      content: 'Use standard account codes for consistent reporting and analysis.',
      action: {
        label: 'Auto-map Accounts',
        onClick: () => {
          // Auto-populate account codes based on line types
          setFormData(prev => ({
            ...prev,
            lines: prev.lines.map(line => ({
              ...line,
              account_code: getDefaultAccountCode(line.line_type, line.side)
            }))
          }))
        }
      }
    }
  ]

  const getDefaultAccountCode = (lineType: string, side?: string): string => {
    // Default account mapping logic
    if (lineType === 'GL') {
      return side === 'DR' ? '500000' : '200000' // Expense vs Liability
    }
    return ''
  }

  const updateLine = (lineNumber: number, field: keyof TransactionLine, value: any) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map(line => 
        line.line_number === lineNumber 
          ? { ...line, [field]: value }
          : line
      )
    }))
  }

  const addLine = () => {
    const newLineNumber = Math.max(...formData.lines.map(l => l.line_number)) + 1
    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, {
        line_number: newLineNumber,
        line_type: 'GL',
        description: '',
        amount: 0,
        side: 'DR',
        account_code: ''
      }]
    }))
  }

  const removeLine = (lineNumber: number) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.filter(line => line.line_number !== lineNumber)
    }))
  }

  const calculateTotals = () => {
    const drTotal = formData.lines
      .filter(line => line.side === 'DR')
      .reduce((sum, line) => sum + line.amount, 0)
    
    const crTotal = formData.lines
      .filter(line => line.side === 'CR')
      .reduce((sum, line) => sum + line.amount, 0)
    
    return { drTotal, crTotal, isBalanced: Math.abs(drTotal - crTotal) < 0.01 }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      const { drTotal, crTotal, isBalanced } = calculateTotals()
      
      if (!isBalanced) {
        alert('Transaction must be balanced (DR = CR)')
        return
      }

      // Prepare transaction data
      const transactionData = {
        transaction_type: formData.transaction_type,
        smart_code: 'HERA.FINANCE.TXN.REBATE.SETTLEMENT.MAIN.v1',
        description: formData.description,
        total_amount: formData.total_amount,
        organization_id: organization!.id
      }

      // Create transaction via API
      const { data } = await apiV2.post('transactions', {
        transaction: transactionData,
        lines: formData.lines,
        organization_id: organization!.id
      })

      // Success - redirect
      window.location.href = `/transactions`
      
    } catch (error) {
      console.error('Failed to create transaction:', error)
      alert('Failed to create transaction. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    window.location.href = `/transactions`
  }

  const completionPercentage = Math.round(
    (sections.filter(s => s.isComplete).length / sections.length) * 100
  )

  const { drTotal, crTotal, isBalanced } = calculateTotals()

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'header':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Transaction Header</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Transaction Type</Label>
                  <Input
                    value={formData.transaction_type}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Total Amount *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.total_amount}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      total_amount: parseFloat(e.target.value) || 0
                    }))}
                    placeholder="Enter total amount"
                    required
                  />
                </div>
                
                <div className="md:col-span-2 space-y-2">
                  <Label>Description *</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      description: e.target.value
                    }))}
                    placeholder="Enter transaction description"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 'lines':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Transaction Lines</CardTitle>
                  <Button onClick={addLine} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Line
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formData.lines.map((line) => (
                    <div key={line.line_number} className="grid grid-cols-12 gap-4 items-end p-4 border rounded-lg">
                      <div className="col-span-3">
                        <Label>Description</Label>
                        <Input
                          value={line.description}
                          onChange={(e) => updateLine(line.line_number, 'description', e.target.value)}
                          placeholder="Line description"
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <Label>Account Code</Label>
                        <Input
                          value={line.account_code || ''}
                          onChange={(e) => updateLine(line.line_number, 'account_code', e.target.value)}
                          placeholder="Account"
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <Label>Side</Label>
                        <select
                          value={line.side || 'DR'}
                          onChange={(e) => updateLine(line.line_number, 'side', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="DR">Debit</option>
                          <option value="CR">Credit</option>
                        </select>
                      </div>
                      
                      <div className="col-span-3">
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={line.amount}
                          onChange={(e) => updateLine(line.line_number, 'amount', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLine(line.line_number)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Balance Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Balance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{drTotal.toFixed(2)}</div>
                    <div className="text-sm text-blue-800">Total Debits</div>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{crTotal.toFixed(2)}</div>
                    <div className="text-sm text-green-800">Total Credits</div>
                  </div>
                  
                  <div className={`p-4 rounded-lg ${isBalanced ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className={`text-2xl font-bold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(drTotal - crTotal).toFixed(2)}
                    </div>
                    <div className={`text-sm ${isBalanced ? 'text-green-800' : 'text-red-800'}`}>
                      {isBalanced ? 'Balanced ✓' : 'Out of Balance'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <EnterpriseCreatePage
      title={`Create ${Rebate Settlement}`}
      subtitle="Final rebate settlement with vendor credit"
      breadcrumb="Enterprise > Transactions > Rebate Settlement"
      sections={sections}
      currentSection={currentSection}
      onSectionChange={setCurrentSection}
      onSave={handleSave}
      onCancel={handleCancel}
      isSaving={isSaving}
      saveLabel="Post Transaction"
      aiInsights={aiInsights}
      aiSuggestions={[
        'Ensure all line amounts are accurate',
        'Verify account codes match your chart of accounts',
        'Add descriptive line descriptions for audit trail',
        'Check that debits equal credits before posting'
      ]}
      completionPercentage={completionPercentage}
      estimatedTime="3-5 minutes"
      hasErrors={!isBalanced}
      errorCount={isBalanced ? 0 : 1}
    >
      {renderCurrentSection()}
    </EnterpriseCreatePage>
  )
}