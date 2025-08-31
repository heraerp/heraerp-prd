'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Plus, 
  Trash2, 
  Calculator, 
  Save, 
  Send,
  AlertCircle,
  CheckCircle2,
  FileText,
  Calendar,
  Search,
  ChevronDown,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { format } from 'date-fns'

interface JournalLine {
  id: string
  accountCode: string
  accountName: string
  description: string
  debit: number
  credit: number
  costCenter?: string
  project?: string
}

interface GLAccount {
  id: string
  accountCode: string
  accountName: string
  accountType: string
  normalBalance: 'debit' | 'credit'
}

interface JournalEntryFormProps {
  organizationId: string
  onSuccess?: (journalId: string) => void
  isDarkMode?: boolean
}

// Mock GL accounts for demo - replace with actual API call
const MOCK_GL_ACCOUNTS: GLAccount[] = [
  { id: '1', accountCode: '1000', accountName: 'Cash and Cash Equivalents', accountType: 'Asset', normalBalance: 'debit' },
  { id: '2', accountCode: '1100', accountName: 'Accounts Receivable', accountType: 'Asset', normalBalance: 'debit' },
  { id: '3', accountCode: '1200', accountName: 'Inventory', accountType: 'Asset', normalBalance: 'debit' },
  { id: '4', accountCode: '2000', accountName: 'Accounts Payable', accountType: 'Liability', normalBalance: 'credit' },
  { id: '5', accountCode: '3000', accountName: 'Share Capital', accountType: 'Equity', normalBalance: 'credit' },
  { id: '6', accountCode: '4000', accountName: 'Sales Revenue', accountType: 'Revenue', normalBalance: 'credit' },
  { id: '7', accountCode: '5000', accountName: 'Cost of Goods Sold', accountType: 'Expense', normalBalance: 'debit' },
  { id: '8', accountCode: '6100', accountName: 'Marketing Expenses', accountType: 'Expense', normalBalance: 'debit' },
  { id: '9', accountCode: '6200', accountName: 'Administrative Expenses', accountType: 'Expense', normalBalance: 'debit' },
  { id: '10', accountCode: '6300', accountName: 'Depreciation Expense', accountType: 'Expense', normalBalance: 'debit' },
]

export function JournalEntryForm({ organizationId, onSuccess, isDarkMode }: JournalEntryFormProps) {
  const [journalDate, setJournalDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [reference, setReference] = useState('')
  const [description, setDescription] = useState('')
  const [journalType, setJournalType] = useState<'standard' | 'adjusting' | 'closing' | 'reversing'>('standard')
  const [lines, setLines] = useState<JournalLine[]>([
    { id: '1', accountCode: '', accountName: '', description: '', debit: 0, credit: 0 },
    { id: '2', accountCode: '', accountName: '', description: '', debit: 0, credit: 0 }
  ])
  const [loading, setLoading] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [glAccounts, setGlAccounts] = useState<GLAccount[]>(MOCK_GL_ACCOUNTS)
  const [accountSearchOpen, setAccountSearchOpen] = useState<{ [key: string]: boolean }>({})

  // Calculate totals
  const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0)
  const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01

  // Load GL accounts
  useEffect(() => {
    const fetchGLAccounts = async () => {
      try {
        const response = await fetch(`/api/v1/entities?type=gl_account&organizationId=${organizationId}`)
        const data = await response.json()
        
        if (data.entities) {
          const accounts: GLAccount[] = data.entities.map((entity: any) => ({
            id: entity.id,
            accountCode: entity.entity_code,
            accountName: entity.entity_name,
            accountType: entity.metadata?.account_type || 'Asset',
            normalBalance: entity.metadata?.normal_balance || 'debit'
          }))
          setGlAccounts(accounts.sort((a, b) => a.accountCode.localeCompare(b.accountCode)))
        }
      } catch (error) {
        console.error('Failed to fetch GL accounts:', error)
        // Keep using mock accounts as fallback
      }
    }
    
    if (organizationId) {
      fetchGLAccounts()
    }
  }, [organizationId])

  // Add new line
  const addLine = () => {
    const newLine: JournalLine = {
      id: Date.now().toString(),
      accountCode: '',
      accountName: '',
      description: '',
      debit: 0,
      credit: 0
    }
    setLines([...lines, newLine])
  }

  // Remove line
  const removeLine = (id: string) => {
    if (lines.length > 2) {
      setLines(lines.filter(line => line.id !== id))
    }
  }

  // Update line
  const updateLine = (id: string, field: keyof JournalLine, value: any) => {
    setLines(lines.map(line => {
      if (line.id === id) {
        const updated = { ...line, [field]: value }
        
        // Auto-fill account name when code is selected
        if (field === 'accountCode') {
          const account = glAccounts.find(acc => acc.accountCode === value)
          if (account) {
            updated.accountName = account.accountName
          }
        }
        
        // Clear opposite amount when entering debit/credit
        if (field === 'debit' && value > 0) {
          updated.credit = 0
        } else if (field === 'credit' && value > 0) {
          updated.debit = 0
        }
        
        return updated
      }
      return line
    }))
  }

  // Validate journal entry
  const validateJournal = (): boolean => {
    if (!journalDate) {
      setValidationError('Journal date is required')
      return false
    }
    
    if (!description) {
      setValidationError('Journal description is required')
      return false
    }
    
    const validLines = lines.filter(line => line.accountCode && (line.debit > 0 || line.credit > 0))
    if (validLines.length < 2) {
      setValidationError('At least 2 valid journal lines are required')
      return false
    }
    
    if (!isBalanced) {
      setValidationError('Journal entry must be balanced (Total Debit = Total Credit)')
      return false
    }
    
    setValidationError('')
    return true
  }

  // Save as draft
  const handleSaveDraft = async () => {
    if (!validateJournal()) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/v1/digital-accountant/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          status: 'draft',
          journalDate,
          reference,
          description,
          journalType,
          lines: lines.filter(line => line.accountCode && (line.debit > 0 || line.credit > 0))
        })
      })
      
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      
      onSuccess?.(data.journalId)
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Failed to save journal entry')
    } finally {
      setLoading(false)
    }
  }

  // Post journal
  const handlePost = async () => {
    if (!validateJournal()) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/v1/digital-accountant/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          status: 'posted',
          journalDate,
          reference,
          description,
          journalType,
          lines: lines.filter(line => line.accountCode && (line.debit > 0 || line.credit > 0))
        })
      })
      
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      
      onSuccess?.(data.journalId)
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Failed to post journal entry')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Information */}
      <Card>
        <CardHeader>
          <CardTitle>Journal Entry Information</CardTitle>
          <CardDescription>Create manual journal entries for adjustments and corrections</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="journal-date">Journal Date *</Label>
              <Input
                id="journal-date"
                type="date"
                value={journalDate}
                onChange={(e) => setJournalDate(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reference">Reference Number</Label>
              <Input
                id="reference"
                placeholder="JE-2025-001"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="journal-type">Journal Type</Label>
              <Select value={journalType} onValueChange={(value: any) => setJournalType(value)}>
                <SelectTrigger id="journal-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="adjusting">Adjusting</SelectItem>
                  <SelectItem value="closing">Closing</SelectItem>
                  <SelectItem value="reversing">Reversing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex items-center h-10">
                <Badge variant="outline" className="gap-1">
                  <FileText className="h-3 w-3" />
                  DRAFT
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Enter journal entry description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              required
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Journal Lines */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Journal Lines</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={addLine}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Line
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 text-sm font-medium">Account</th>
                  <th className="text-left py-2 px-2 text-sm font-medium">Description</th>
                  <th className="text-right py-2 px-2 text-sm font-medium">Debit</th>
                  <th className="text-right py-2 px-2 text-sm font-medium">Credit</th>
                  <th className="py-2 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => (
                  <tr key={line.id} className="border-b">
                    <td className="py-2 px-2">
                      <Popover
                        open={accountSearchOpen[line.id] || false}
                        onOpenChange={(open) => setAccountSearchOpen({ ...accountSearchOpen, [line.id]: open })}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={accountSearchOpen[line.id] || false}
                            className="w-full justify-between text-left font-normal"
                          >
                            {line.accountCode ? `${line.accountCode} - ${line.accountName}` : 'Select account...'}
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0">
                          <Command>
                            <CommandInput placeholder="Search accounts..." />
                            <CommandList>
                              <CommandEmpty>No account found.</CommandEmpty>
                              <CommandGroup>
                                {glAccounts.map((account) => (
                                  <CommandItem
                                    key={account.id}
                                    value={account.accountCode}
                                    onSelect={(value) => {
                                      updateLine(line.id, 'accountCode', value)
                                      setAccountSearchOpen({ ...accountSearchOpen, [line.id]: false })
                                    }}
                                  >
                                    <div className="flex-1">
                                      <div className="font-medium">{account.accountCode} - {account.accountName}</div>
                                      <div className="text-xs text-muted-foreground">{account.accountType}</div>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </td>
                    <td className="py-2 px-2">
                      <Input
                        placeholder="Line description"
                        value={line.description}
                        onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                      />
                    </td>
                    <td className="py-2 px-2">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={line.debit || ''}
                        onChange={(e) => updateLine(line.id, 'debit', parseFloat(e.target.value) || 0)}
                        className="text-right"
                        step="0.01"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={line.credit || ''}
                        onChange={(e) => updateLine(line.id, 'credit', parseFloat(e.target.value) || 0)}
                        className="text-right"
                        step="0.01"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLine(line.id)}
                        disabled={lines.length <= 2}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2">
                  <td colSpan={2} className="py-2 px-2 text-right font-medium">
                    Total
                  </td>
                  <td className="py-2 px-2 text-right font-medium">
                    {totalDebit.toFixed(2)}
                  </td>
                  <td className="py-2 px-2 text-right font-medium">
                    {totalCredit.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          {/* Balance Status */}
          <div className="mt-4">
            {isBalanced ? (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Journal entry is balanced
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Journal entry is not balanced. Difference: {Math.abs(totalDebit - totalCredit).toFixed(2)}
                </AlertDescription>
              </Alert>
            )}
            
            {validationError && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={handleSaveDraft}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save as Draft
        </Button>
        <Button
          onClick={handlePost}
          disabled={loading || !isBalanced}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Post Journal Entry
        </Button>
      </div>
    </div>
  )
}