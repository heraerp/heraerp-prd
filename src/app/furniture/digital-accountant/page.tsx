'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calculator,
  Mic,
  FileText,
  Plus,
  TrendingUp,
  DollarSign,
  Receipt,
  Truck,
  TreePine,
  Hammer,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle,
  Send,
  Upload,
  Download,
  Globe,
  MapPin,
  Percent,
  Users,
  Package,
  Edit,
  Save,
  X
} from 'lucide-react'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  category: string
  description: string
  amount: number
  gstRate?: number
  gstAmount?: number
  date: string
  vendor?: string
  invoiceNumber?: string
  isExport?: boolean
}

interface QuickExpense {
  category: string
  icon: React.ElementType
  placeholder: string
  gstRate: number
  color: string
}

interface JournalEntry {
  id: string
  date: string
  description: string
  reference: string
  entries: {
    account: string
    debit: number
    credit: number
  }[]
  totalDebit: number
  totalCredit: number
}

export default function DigitalAccountant() {
  const [voiceInput, setVoiceInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedQuickExpense, setSelectedQuickExpense] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [processedJournalEntry, setProcessedJournalEntry] = useState<JournalEntry | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Kerala furniture business specific expense categories
  const quickExpenseCategories: QuickExpense[] = [
    {
      category: 'Raw Materials',
      icon: TreePine,
      placeholder: 'Teak wood from Thrissur - 500kg',
      gstRate: 5,
      color: 'from-green-500 to-emerald-500'
    },
    {
      category: 'Craftsman Wages',
      icon: Hammer,
      placeholder: 'Traditional carpenter - weekly payment',
      gstRate: 0,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      category: 'Export Expenses',
      icon: Globe,
      placeholder: 'Shipping to Dubai - container freight',
      gstRate: 18,
      color: 'from-purple-500 to-indigo-500'
    },
    {
      category: 'Factory Rent',
      icon: Building2,
      placeholder: 'Workshop rent - Kozhikode unit',
      gstRate: 18,
      color: 'from-amber-500 to-orange-500'
    },
    {
      category: 'Sales Revenue',
      icon: DollarSign,
      placeholder: 'Hotel order - ITC Grand Chola',
      gstRate: 12,
      color: 'from-rose-500 to-pink-500'
    },
    {
      category: 'Transportation',
      icon: Truck,
      placeholder: 'Delivery to Kochi port',
      gstRate: 5,
      color: 'from-teal-500 to-cyan-500'
    }
  ]

  // Sample transactions for Kerala furniture business
  const sampleTransactions: Transaction[] = [
    {
      id: '1',
      type: 'expense',
      category: 'Raw Materials',
      description: 'Premium teak wood purchase - Nilambur forest',
      amount: 125000,
      gstRate: 5,
      gstAmount: 6250,
      date: '2024-01-15',
      vendor: 'Kerala Forest Development Corporation',
      invoiceNumber: 'KFDC/2024/001'
    },
    {
      id: '2',
      type: 'income',
      category: 'Sales Revenue',
      description: 'Executive dining set - Marriott Kochi',
      amount: 850000,
      gstRate: 12,
      gstAmount: 102000,
      date: '2024-01-14',
      vendor: 'Marriott International',
      invoiceNumber: 'KFW/2024/0015',
      isExport: false
    },
    {
      id: '3',
      type: 'expense',
      category: 'Export Expenses',
      description: 'Container shipping to Middle East',
      amount: 45000,
      gstRate: 0,
      gstAmount: 0,
      date: '2024-01-13',
      vendor: 'Cochin Port Authority',
      invoiceNumber: 'CPA/EXP/2024/089',
      isExport: true
    },
    {
      id: '4',
      type: 'expense',
      category: 'Craftsman Wages',
      description: 'Traditional wood carver - monthly payment',
      amount: 35000,
      gstRate: 0,
      gstAmount: 0,
      date: '2024-01-12',
      vendor: 'Raman Master - Craftsman'
    }
  ]

  useEffect(() => {
    setTransactions(sampleTransactions)
  }, [])

  const handleVoiceInput = () => {
    setIsListening(!isListening)
    if (!isListening) {
      // Simulate voice recognition for demo
      setTimeout(() => {
        setVoiceInput("Add expense of 25000 rupees for rosewood purchase from Wayanad supplier with 5% GST")
        setIsListening(false)
      }, 2000)
    }
  }

  const processVoiceInput = () => {
    if (!voiceInput.trim()) return

    setIsProcessing(true)
    
    // Simulate AI processing delay
    setTimeout(() => {
      // Generate journal entry based on voice input
      const journalEntry = generateJournalEntry(voiceInput)
      setProcessedJournalEntry(journalEntry)
      
      // Parse voice input and create transaction
      if (voiceInput.toLowerCase().includes('expense') && voiceInput.includes('25000')) {
        const newTransaction: Transaction = {
          id: Date.now().toString(),
          type: 'expense',
          category: 'Raw Materials',
          description: 'Rosewood purchase from Wayanad supplier',
          amount: 25000,
          gstRate: 5,
          gstAmount: 1250,
          date: new Date().toISOString().split('T')[0],
          vendor: 'Wayanad Wood Suppliers'
        }
        setTransactions(prev => [newTransaction, ...prev])
      }
      
      setVoiceInput('')
      setIsProcessing(false)
    }, 2000)
  }

  const generateJournalEntry = (input: string): JournalEntry => {
    // AI simulation - analyze voice input and generate appropriate journal entry
    const amount = 50000 // Extract from voice input
    const gstAmount = amount * 0.05 // 5% GST
    
    if (input.toLowerCase().includes('expense') || input.toLowerCase().includes('teak')) {
      return {
        id: `JE-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        description: 'Teak wood purchase with GST',
        reference: `INV-${Date.now().toString().slice(-6)}`,
        entries: [
          { account: 'Raw Materials Inventory', debit: amount, credit: 0 },
          { account: 'GST Input Tax Credit', debit: gstAmount, credit: 0 },
          { account: 'Accounts Payable - Suppliers', debit: 0, credit: amount + gstAmount }
        ],
        totalDebit: amount + gstAmount,
        totalCredit: amount + gstAmount
      }
    } else if (input.toLowerCase().includes('income') || input.toLowerCase().includes('sale')) {
      return {
        id: `JE-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        description: 'Furniture sales with GST',
        reference: `INV-${Date.now().toString().slice(-6)}`,
        entries: [
          { account: 'Accounts Receivable - Customers', debit: amount + gstAmount, credit: 0 },
          { account: 'Sales Revenue', debit: 0, credit: amount },
          { account: 'GST Output Tax Payable', debit: 0, credit: gstAmount }
        ],
        totalDebit: amount + gstAmount,
        totalCredit: amount + gstAmount
      }
    }
    
    // Default expense entry
    return {
      id: `JE-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      description: 'General expense entry',
      reference: `INV-${Date.now().toString().slice(-6)}`,
      entries: [
        { account: 'General Expenses', debit: amount, credit: 0 },
        { account: 'Cash/Bank Account', debit: 0, credit: amount }
      ],
      totalDebit: amount,
      totalCredit: amount
    }
  }

  const handleQuickExpense = (category: QuickExpense) => {
    if (!amount || !description) return

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: category.category === 'Sales Revenue' ? 'income' : 'expense',
      category: category.category,
      description: description,
      amount: parseFloat(amount),
      gstRate: category.gstRate,
      gstAmount: (parseFloat(amount) * category.gstRate) / 100,
      date: new Date().toISOString().split('T')[0],
      vendor: description.split('-')[0]?.trim()
    }

    setTransactions(prev => [newTransaction, ...prev])
    setAmount('')
    setDescription('')
    setSelectedQuickExpense(null)
  }

  const getTotalsByCategory = () => {
    const totals = transactions.reduce((acc, transaction) => {
      if (!acc[transaction.category]) {
        acc[transaction.category] = { income: 0, expense: 0, gst: 0 }
      }
      if (transaction.type === 'income') {
        acc[transaction.category].income += transaction.amount
      } else {
        acc[transaction.category].expense += transaction.amount
      }
      acc[transaction.category].gst += transaction.gstAmount || 0
      return acc
    }, {} as Record<string, { income: number, expense: number, gst: number }>)

    return totals
  }

  const getGSTSummary = () => {
    const gstCollected = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.gstAmount || 0), 0)
    
    const gstPaid = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.gstAmount || 0), 0)

    return { gstCollected, gstPaid, netGst: gstCollected - gstPaid }
  }

  const categoryTotals = getTotalsByCategory()
  const gstSummary = getGSTSummary()

  return (
    <div className="min-h-screen">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="jewelry-glass-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="jewelry-crown-glow p-3 rounded-xl">
                  <Calculator className="h-8 w-8 jewelry-text-gold" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold jewelry-text-luxury">Digital Accountant</h1>
                  <p className="text-lg text-gray-300">Kerala Furniture Business Accounting & GST Compliance</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  GST Compliant
                </Badge>
                <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                  <MapPin className="h-3 w-3 mr-1" />
                  Kerala Rates
                </Badge>
              </div>
            </div>
          </div>

          {/* GST Dashboard */}
          <div className="jewelry-glass-card p-6">
            <h2 className="text-xl font-semibold jewelry-text-luxury mb-4 flex items-center gap-2">
              <Percent className="h-5 w-5 jewelry-text-gold" />
              GST Summary (Current Month)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">₹{gstSummary.gstCollected.toLocaleString()}</div>
                <div className="text-sm text-gray-300">GST Collected (Output)</div>
                <div className="text-xs text-gray-300 mt-1">From sales & services</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">₹{gstSummary.gstPaid.toLocaleString()}</div>
                <div className="text-sm text-gray-300">GST Paid (Input)</div>
                <div className="text-xs text-gray-300 mt-1">On purchases & expenses</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${gstSummary.netGst >= 0 ? 'text-amber-500' : 'text-green-500'}`}>
                  ₹{Math.abs(gstSummary.netGst).toLocaleString()}
                </div>
                <div className="text-sm text-gray-300">
                  {gstSummary.netGst >= 0 ? 'GST Payable' : 'GST Refund Due'}
                </div>
                <div className="text-xs text-gray-300 mt-1">Net position</div>
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              <Button className="jewelry-glass-btn gap-2 jewelry-text-luxury hover:jewelry-text-gold">
                <Download className="h-4 w-4" />
                Generate GST Return
              </Button>
            </div>
          </div>

          <Tabs defaultValue="voice" className="space-y-4">
            <TabsList className="jewelry-glass-panel">
              <TabsTrigger value="voice" className="jewelry-glass-btn jewelry-text-luxury">Voice Entry</TabsTrigger>
              <TabsTrigger value="quick" className="jewelry-glass-btn jewelry-text-luxury">Quick Entry</TabsTrigger>
              <TabsTrigger value="transactions" className="jewelry-glass-btn jewelry-text-luxury">Transactions</TabsTrigger>
              <TabsTrigger value="reports" className="jewelry-glass-btn jewelry-text-luxury">Reports</TabsTrigger>
            </TabsList>

            {/* Voice Entry Tab */}
            <TabsContent value="voice" className="space-y-6">
              <div className="jewelry-glass-card p-6">
                <h3 className="text-lg font-semibold jewelry-text-luxury mb-4 flex items-center gap-2">
                  <Mic className="h-5 w-5 jewelry-text-gold" />
                  Voice Transaction Entry
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={handleVoiceInput}
                      className={`jewelry-glass-btn gap-2 jewelry-text-luxury hover:jewelry-text-gold ${isListening ? 'bg-red-500/20 border-red-500' : ''}`}
                    >
                      <Mic className={`h-4 w-4 ${isListening ? 'text-red-500' : ''}`} />
                      {isListening ? 'Listening...' : 'Start Recording'}
                    </Button>
                    <span className="text-sm text-gray-300">
                      Say: "Add expense of 50000 rupees for teak wood with 5% GST from Thrissur supplier"
                    </span>
                  </div>

                  {voiceInput && (
                    <div className="space-y-3">
                      <Textarea
                        value={voiceInput}
                        onChange={(e) => setVoiceInput(e.target.value)}
                        placeholder="Voice input will appear here..."
                        className="jewelry-glass-input"
                        rows={3}
                      />
                      <Button 
                        onClick={processVoiceInput} 
                        className="jewelry-glass-btn gap-2 jewelry-text-luxury hover:jewelry-text-gold"
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <div className="jewelry-spinner w-4 h-4" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Process Transaction
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Journal Entry Processing Area */}
                {processedJournalEntry && (
                  <div className="mt-6 jewelry-glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold jewelry-text-luxury flex items-center gap-2">
                        <FileText className="h-5 w-5 jewelry-text-gold" />
                        Generated Journal Entry
                      </h4>
                      <div className="flex items-center gap-2">
                        <Badge className="jewelry-status-luxury">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Balanced
                        </Badge>
                        <Button 
                          size="sm" 
                          className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold"
                          onClick={() => setProcessedJournalEntry(null)}
                        >
                          <X className="h-3 w-3" />
                          Clear
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Journal Entry Header */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white/5 rounded-lg">
                        <div>
                          <span className="text-sm font-medium jewelry-text-luxury">Entry ID:</span>
                          <p className="text-sm text-gray-300">{processedJournalEntry.id}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium jewelry-text-luxury">Date:</span>
                          <p className="text-sm text-gray-300">{processedJournalEntry.date}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium jewelry-text-luxury">Reference:</span>
                          <p className="text-sm text-gray-300">{processedJournalEntry.reference}</p>
                        </div>
                      </div>

                      <div>
                        <span className="text-sm font-medium jewelry-text-luxury">Description:</span>
                        <p className="text-sm text-gray-300 mt-1">{processedJournalEntry.description}</p>
                      </div>

                      {/* Journal Entry Table */}
                      <div className="overflow-hidden rounded-lg border border-white/10">
                        <table className="w-full">
                          <thead className="bg-jewelry-royal">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-semibold jewelry-text-gold">Account</th>
                              <th className="px-4 py-3 text-right text-sm font-semibold jewelry-text-gold">Debit (₹)</th>
                              <th className="px-4 py-3 text-right text-sm font-semibold jewelry-text-gold">Credit (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white/5">
                            {processedJournalEntry.entries.map((entry, index) => (
                              <tr key={index} className="border-t border-white/10">
                                <td className="px-4 py-3 text-sm jewelry-text-luxury">{entry.account}</td>
                                <td className="px-4 py-3 text-right text-sm">
                                  {entry.debit > 0 ? (
                                    <span className="font-medium jewelry-text-luxury">
                                      {entry.debit.toLocaleString()}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right text-sm">
                                  {entry.credit > 0 ? (
                                    <span className="font-medium jewelry-text-luxury">
                                      {entry.credit.toLocaleString()}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-jewelry-blue-100 border-t-2 border-jewelry-gold-500">
                            <tr>
                              <td className="px-4 py-3 text-sm font-semibold jewelry-text-luxury">TOTALS</td>
                              <td className="px-4 py-3 text-right text-sm font-bold jewelry-text-gold">
                                ₹{processedJournalEntry.totalDebit.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-bold jewelry-text-gold">
                                ₹{processedJournalEntry.totalCredit.toLocaleString()}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold">
                          <Edit className="h-4 w-4 mr-2" />
                          Modify
                        </Button>
                        <Button className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold">
                          <Save className="h-4 w-4 mr-2" />
                          Post Entry
                        </Button>
                        <Button variant="outline" className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium jewelry-text-luxury">Voice Command Examples:</h4>
                    <div className="text-sm text-gray-300 space-y-1">
                      <p>• "Add income 200000 rupees from Marriott hotel order"</p>
                      <p>• "Record expense 75000 for rosewood with 5% GST"</p>
                      <p>• "Export sale 500000 to Dubai customer zero GST"</p>
                      <p>• "Craftsman payment 25000 no GST"</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium jewelry-text-luxury">Smart Features:</h4>
                    <div className="text-sm text-gray-300 space-y-1">
                      <p>• Automatic GST rate detection by category</p>
                      <p>• Kerala business context understanding</p>
                      <p>• Export vs domestic classification</p>
                      <p>• Traditional vs modern terminology</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Quick Entry Tab */}
            <TabsContent value="quick" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {quickExpenseCategories.map((category, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedQuickExpense(category.category)}
                    className={`jewelry-glass-card p-4 cursor-pointer jewelry-scale-hover ${
                      selectedQuickExpense === category.category ? 'ring-2 ring-jewelry-gold-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${category.color} flex items-center justify-center`}>
                        <category.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium jewelry-text-luxury">{category.category}</h3>
                        <p className="text-sm text-gray-300">GST: {category.gstRate}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedQuickExpense && (
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">
                    Add {selectedQuickExpense}
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium jewelry-text-luxury mb-2">Amount (₹)</label>
                        <Input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="50000"
                          className="jewelry-glass-input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium jewelry-text-luxury mb-2">Description</label>
                        <Input
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder={quickExpenseCategories.find(c => c.category === selectedQuickExpense)?.placeholder}
                          className="jewelry-glass-input"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleQuickExpense(quickExpenseCategories.find(c => c.category === selectedQuickExpense)!)}
                        className="jewelry-glass-btn gap-2 jewelry-text-luxury hover:jewelry-text-gold"
                        disabled={!amount || !description}
                      >
                        <Plus className="h-4 w-4" />
                        Add Transaction
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setSelectedQuickExpense(null)}
                        className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions" className="space-y-6">
              <div className="jewelry-glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold jewelry-text-luxury">Recent Transactions</h3>
                  <Button className="jewelry-glass-btn gap-2 jewelry-text-luxury hover:jewelry-text-gold">
                    <Upload className="h-4 w-4" />
                    Import Excel
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <div className="font-medium jewelry-text-luxury">{transaction.description}</div>
                          <div className="text-sm text-gray-300 flex items-center gap-2">
                            <span>{transaction.category}</span>
                            {transaction.isExport && (
                              <Badge className="text-xs bg-blue-500/10 text-blue-600">Export</Badge>
                            )}
                            <span>•</span>
                            <span>{transaction.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${
                          transaction.type === 'income' ? 'text-green-500' : 'jewelry-text-luxury'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                        </div>
                        {transaction.gstAmount && transaction.gstAmount > 0 && (
                          <div className="text-sm text-gray-300">
                            GST: ₹{transaction.gstAmount.toLocaleString()} ({transaction.gstRate}%)
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Summary */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Category Summary</h3>
                  <div className="space-y-3">
                    {Object.entries(categoryTotals).map(([category, totals]) => (
                      <div key={category} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <div className="font-medium jewelry-text-luxury">{category}</div>
                          <div className="text-sm text-gray-300">
                            GST: ₹{totals.gst.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          {totals.income > 0 && (
                            <div className="text-green-500">+₹{totals.income.toLocaleString()}</div>
                          )}
                          {totals.expense > 0 && (
                            <div className="jewelry-text-luxury">-₹{totals.expense.toLocaleString()}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Kerala Business Insights */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Kerala Business Insights</h3>
                  <div className="space-y-4">
                    <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                      <div className="flex items-center gap-2 text-green-600 font-medium">
                        <CheckCircle className="h-4 w-4" />
                        Export Advantage
                      </div>
                      <p className="text-sm text-gray-300 mt-1">
                        70% of revenue from export sales (0% GST) improving margins significantly.
                      </p>
                    </div>
                    
                    <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      <div className="flex items-center gap-2 text-amber-600 font-medium">
                        <AlertCircle className="h-4 w-4" />
                        Material Cost Alert
                      </div>
                      <p className="text-sm text-gray-300 mt-1">
                        Teak prices up 15% this quarter. Consider forward contracts with suppliers.
                      </p>
                    </div>

                    <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <div className="flex items-center gap-2 text-blue-600 font-medium">
                        <TrendingUp className="h-4 w-4" />
                        Seasonal Trend
                      </div>
                      <p className="text-sm text-gray-300 mt-1">
                        Q4 shows 40% revenue increase due to festival and wedding season demand.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}