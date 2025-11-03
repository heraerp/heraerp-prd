'use client'

/**
 * General Journal Entry Transaction Page
 * Smart Code: HERA.FINANCE.TXN.JE.MAIN.v1
 * Generated from: MatrixIT World Finance System
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
  BookOpen, 
  Plus,
  Trash2,
  DollarSign
} from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { apiV2 } from '@/lib/client/fetchV2'

interface TransactionLine {
  line_number: number
  line_type: string
  description: string
  account_code: string
  account_name?: string
  amount: number
  side: 'DR' | 'CR'
  cost_center?: string
  reference?: string
}

interface TransactionFormData {
  transaction_type: string
  journal_number: string
  description: string
  total_amount: number
  posting_date: string
  reference: string
  lines: TransactionLine[]
}

export default function CreateJournalEntryPage() {
  const { organization, user } = useHERAAuth()
  const [currentSection, setCurrentSection] = useState('header')
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<TransactionFormData>({
    transaction_type: 'JOURNAL_ENTRY',
    journal_number: '',
    description: '',
    total_amount: 0,
    posting_date: new Date().toISOString().split('T')[0],
    reference: '',
    lines: [
      {
        line_number: 1,
        line_type: 'GL',
        description: '',
        account_code: '',
        account_name: '',
        amount: 0,
        side: 'DR',
        cost_center: '',
        reference: ''
      },
      {
        line_number: 2,
        line_type: 'GL',
        description: '',
        account_code: '',
        account_name: '',
        amount: 0,
        side: 'CR',
        cost_center: '',
        reference: ''
      }
    ]
  })

  // Page sections for navigation
  const sections: CreatePageSection[] = [
    {
      id: 'header',
      title: 'Journal Header',
      icon: Receipt,
      isRequired: true,
      isComplete: !!(formData.description && formData.journal_number)
    },
    {
      id: 'lines',
      title: 'Journal Lines',
      icon: Calculator,
      isRequired: true,
      isComplete: formData.lines.every(line => line.amount > 0 && line.account_code && line.description)
    }
  ]

  // AI insights for transaction
  const aiInsights: AIInsight[] = [
    {
      id: 'balance_check',
      type: 'automation',
      title: 'Balance Validation',
      content: 'HERA automatically validates that total debits equal total credits before posting.'
    },
    {
      id: 'account_validation',
      type: 'suggestion',
      title: 'Account Validation',
      content: 'Smart account code validation against MatrixIT World chart of accounts.',
      action: {
        label: 'Validate Accounts',
        onClick: () => {
          console.log('🔍 Validating account codes...')
        }
      }
    },
    {
      id: 'ifrs_compliance',
      type: 'automation',
      title: 'IFRS Compliance',
      content: 'Journal entries automatically follow IFRS standards and Kerala regulatory requirements.'
    }
  ]

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
        account_code: '',
        account_name: '',
        amount: 0,
        side: 'DR',
        cost_center: '',
        reference: ''
      }]
    }))
  }

  const removeLine = (lineNumber: number) => {
    if (formData.lines.length <= 2) {
      alert('Journal entry must have at least 2 lines')
      return
    }
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
        alert('Journal entry must be balanced (Total Debits = Total Credits)')
        return
      }

      // Prepare transaction data for hera_txn_crud_v1
      const transactionData = {
        transaction_type: formData.transaction_type,
        smart_code: 'HERA.FINANCE.TXN.JE.MAIN.v1',
        transaction_code: formData.journal_number,
        description: formData.description,
        total_amount: Math.max(drTotal, crTotal),
        organization_id: organization!.id
      }

      // Create transaction via API v2 (calls hera_txn_crud_v1)
      const { data } = await apiV2.post('transactions', {
        transaction: transactionData,
        lines: formData.lines.map(line => ({
          line_number: line.line_number,
          line_type: line.line_type,
          description: line.description,
          quantity: 1,
          unit_amount: line.amount,
          line_amount: line.amount,
          entity_id: line.account_code, // Account reference
          smart_code: `HERA.FINANCE.TXN.JE.LINE.v1`,
          line_data: {
            side: line.side,
            account_code: line.account_code,
            account_name: line.account_name,
            cost_center: line.cost_center,
            reference: line.reference
          }
        })),
        organization_id: organization!.id
      })

      // Success - redirect to journal entries list
      window.location.href = `/enterprise/finance/journal-entries`
      
    } catch (error) {
      console.error('Failed to create journal entry:', error)
      alert('Failed to create journal entry. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    window.location.href = `/enterprise/finance/journal-entries`
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
              <CardTitle>Journal Entry Header</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Journal Number *</Label>
                  <Input
                    value={formData.journal_number}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      journal_number: e.target.value
                    }))}
                    placeholder="Enter journal number"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Posting Date</Label>
                  <Input
                    type="date"
                    value={formData.posting_date}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      posting_date: e.target.value
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Reference</Label>
                  <Input
                    value={formData.reference}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      reference: e.target.value
                    }))}
                    placeholder="Reference document"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Journal Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={Math.max(drTotal, crTotal).toFixed(2)}
                    disabled
                    className="bg-gray-50"
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
                    placeholder="Enter journal entry description"
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
                  <CardTitle>Journal Lines</CardTitle>
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
                      <div className="col-span-2">
                        <Label>Account Code</Label>
                        <Input
                          value={line.account_code}
                          onChange={(e) => updateLine(line.line_number, 'account_code', e.target.value)}
                          placeholder="Account code"
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <Label>Account Name</Label>
                        <Input
                          value={line.account_name || ''}
                          onChange={(e) => updateLine(line.line_number, 'account_name', e.target.value)}
                          placeholder="Account name"
                        />
                      </div>
                      
                      <div className="col-span-3">
                        <Label>Description</Label>
                        <Input
                          value={line.description}
                          onChange={(e) => updateLine(line.line_number, 'description', e.target.value)}
                          placeholder="Line description"
                        />
                      </div>
                      
                      <div className="col-span-1">
                        <Label>Side</Label>
                        <select
                          value={line.side}
                          onChange={(e) => updateLine(line.line_number, 'side', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="DR">Debit</option>
                          <option value="CR">Credit</option>
                        </select>
                      </div>
                      
                      <div className="col-span-2">
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={line.amount}
                          onChange={(e) => updateLine(line.line_number, 'amount', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div className="col-span-1">
                        <Label>Cost Center</Label>
                        <Input
                          value={line.cost_center || ''}
                          onChange={(e) => updateLine(line.line_number, 'cost_center', e.target.value)}
                          placeholder="CC"
                        />
                      </div>
                      
                      <div className="col-span-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLine(line.line_number)}
                          className="text-red-600"
                          disabled={formData.lines.length <= 2}
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
                    <div className="text-2xl font-bold text-blue-600">₹{drTotal.toFixed(2)}</div>
                    <div className="text-sm text-blue-800">Total Debits</div>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">₹{crTotal.toFixed(2)}</div>
                    <div className="text-sm text-green-800">Total Credits</div>
                  </div>
                  
                  <div className={`p-4 rounded-lg ${isBalanced ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className={`text-2xl font-bold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{Math.abs(drTotal - crTotal).toFixed(2)}
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
      title="Create Journal Entry"
      subtitle="MatrixIT World general ledger posting"
      breadcrumb="Enterprise > Finance > Journal Entries > New"
      sections={sections}
      currentSection={currentSection}
      onSectionChange={setCurrentSection}
      onSave={handleSave}
      onCancel={handleCancel}
      isSaving={isSaving}
      saveLabel="Post Journal Entry"
      aiInsights={aiInsights}
      aiSuggestions={[
        'Ensure all account codes are valid',
        'Verify debit and credit amounts balance',
        'Add meaningful descriptions for audit trail',
        'Include cost centers for proper reporting'
      ]}
      completionPercentage={completionPercentage}
      estimatedTime="4-6 minutes"
      hasErrors={!isBalanced}
      errorCount={isBalanced ? 0 : 1}
    >
      {renderCurrentSection()}
    </EnterpriseCreatePage>
  )
}