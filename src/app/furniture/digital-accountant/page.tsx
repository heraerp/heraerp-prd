'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
/**
 * HERA Furniture Digital Accountant Integration
 * Smart Code: HERA.FURNITURE.DIGITAL.ACCOUNTANT.v1
 *
 * Simplified accounting interface for furniture manufacturers
 * Natural language processing for non-accountants
 */

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { useFurnitureOrg, FurnitureOrgLoading } from '@/components/furniture/FurnitureOrgContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import FurniturePageHeader from '@/components/furniture/FurniturePageHeader'
import {
  Brain,
  Send,
  Loader2,
  DollarSign,
  ShoppingBag,
  Users,
  Receipt,
  CreditCard,
  Banknote,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Camera,
  Mic,
  HelpCircle,
  Sparkles,
  Calculator,
  FileText,
  ChevronRight,
  Package,
  Home,
  Zap,
  Coins,
  BarChart3,
  Target,
  History,
  Settings,
  Download,
  Moon,
  Sun,
  ArrowDown,
  ChevronDown,
  Truck,
  Wrench,
  Factory,
  Sofa,
  Hammer
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { FurnitureDocumentUpload } from '@/components/furniture/FurnitureDocumentUpload'

interface FurnitureMessage {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  category?: 'revenue' | 'expense' | 'payment' | 'production' | 'inventory' | 'summary'
  amount?: number
  status?: 'success' | 'pending' | 'error'
  actions?: QuickAction[]
  journalEntry?: {
    debits: Array<{ account: string; amount: number }>
    credits: Array<{ account: string; amount: number }>
  }
}

interface QuickAction {
  icon: React.ElementType
  label: string
  action: string
  variant?: 'default' | 'secondary' | 'outline'
  data?: any
}

interface QuickPrompt {
  icon: React.ElementType
  label: string
  prompt: string
  color: string
  category: string
}

// Furniture-specific quick prompts
const FURNITURE_QUICK_PROMPTS: QuickPrompt[] = [
  {
    icon: DollarSign,
    label: 'Cash Sale',
    prompt: 'Customer paid cash',
    color: 'text-green-600',
    category: 'revenue'
  },
  {
    icon: CreditCard,
    label: 'Card Sale',
    prompt: 'Customer paid by card',
    color: 'text-blue-600',
    category: 'revenue'
  },
  {
    icon: Hammer,
    label: 'Buy Materials',
    prompt: 'Bought wood/materials',
    color: 'text-orange-600',
    category: 'expense'
  },
  {
    icon: Factory,
    label: 'Production Cost',
    prompt: 'Record production cost',
    color: 'text-purple-600',
    category: 'production'
  },
  {
    icon: Truck,
    label: 'Delivery',
    prompt: 'Delivered furniture',
    color: 'text-indigo-600',
    category: 'revenue'
  },
  {
    icon: Calculator,
    label: "Today's Summary",
    prompt: "Show today's summary",
    color: 'text-cyan-600',
    category: 'summary'
  }
]

// Furniture-specific quick expenses
const FURNITURE_QUICK_EXPENSES = [
  { icon: Package, label: 'Wood/Timber', amount: 5000, category: 'materials' },
  { icon: Wrench, label: 'Hardware', amount: 1000, category: 'materials' },
  { icon: Factory, label: 'Labor', amount: 2000, category: 'production' },
  { icon: Truck, label: 'Transport', amount: 1500, category: 'delivery' },
  { icon: Receipt, label: 'Utilities', amount: 800, category: 'overhead' },
  { icon: Sofa, label: 'Fabric/Cushion', amount: 2500, category: 'materials' }
]

export default function FurnitureDigitalAccountantPage() {
  const router = useRouter()
  const { isAuthenticated, contextLoading } = useMultiOrgAuth()
  const { organizationId, organizationName, orgLoading } = useFurnitureOrg()

  const [messages, setMessages] = useState<FurnitureMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: `Hi! I'm your furniture business accounting assistant. I'll help you record all your transactions without any accounting knowledge needed! 
      
Just tell me in simple words:
• "Sold dining table to Marriott for 55,000" 
• "Bought teak wood for 35,000"
• "Paid workers 8,000 for assembly"
• "Delivered furniture to ITC Hotels"
• "Show today's total"

I'll handle all the technical accounting for you! 🪑`,
      timestamp: new Date(),
      status: 'success'
    }
  ])

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showExamples, setShowExamples] = useState(true)
  const [activeView, setActiveView] = useState<'chat' | 'expense' | 'history' | 'insights'>('chat')
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [useMCP, setUseMCP] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom with smooth animation
  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
        if (viewport) {
          viewport.scrollTo({
            top: viewport.scrollHeight,
            behavior: 'smooth'
          })
        }
      }
    }

    const timer = setTimeout(() => {
      requestAnimationFrame(scrollToBottom)
    }, 50)

    return () => clearTimeout(timer)
  }, [messages])

  const processFurnitureTransaction = async (text: string) => {
    setLoading(true)

    const userMessage: FurnitureMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])

    try {
      // Call the furniture digital accountant API
      const response = await fetch('/api/v1/furniture/digital-accountant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text,
          organizationId: organizationId,
          useMCP: useMCP
        })
      })

      if (!response.ok) {
        throw new Error('Failed to process transaction')
      }

      const data = await response.json()

      const assistantMessage: FurnitureMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: data.message,
        timestamp: new Date(),
        category: data.category,
        amount: data.amount,
        status: data.status || 'success',
        journalEntry: data.journalEntry,
        actions: data.actions
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: FurnitureMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Sorry, I had trouble processing that. Please try again.',
        timestamp: new Date(),
        status: 'error'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
      setInput('')
      inputRef.current?.focus()
    }
  }

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt)
    inputRef.current?.focus()
  }

  const handleQuickExpense = async (expense: any) => {
    const prompt = `Paid ${expense.amount} for ${expense.label}`
    await processFurnitureTransaction(prompt)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    await processFurnitureTransaction(input.trim())
  }

  const handleDocumentAnalyzed = (result: any) => {
    // Auto-populate input with suggested message
    if (result.suggestedMessage) {
      setInput(result.suggestedMessage)
      inputRef.current?.focus()

      // Add system message about document analysis
      const systemMessage: FurnitureMessage = {
        id: Date.now().toString(),
        type: 'system',
        content: `📄 Document analyzed! I've extracted the following information:
        
• Vendor: ${result.analysis.vendor_name}
• Amount: ₹${result.analysis.total_amount?.toLocaleString('en-IN')}
• Date: ${result.analysis.date}
${result.analysis.items?.length > 0 ? `• Items: ${result.analysis.items.map((i: any) => i.description).join(', ')}` : ''}

I've prepared a transaction entry for you. Just click send or modify as needed!`,
        timestamp: new Date(),
        status: 'success'
      }

      setMessages(prev => [...prev, systemMessage])
    }
  }

  // Show loading state
  if (orgLoading) {
    return <FurnitureOrgLoading />
  }

  // Authorization checks
  if (isAuthenticated && contextLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading digital accountant...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('min-h-screen', isDarkMode ? 'bg-gray-900' : 'bg-gray-50')}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <FurniturePageHeader
          title="Digital Accountant"
          subtitle="AI-powered accounting assistant for your furniture business"
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUseMCP(!useMCP)}
                className={cn('gap-2', useMCP ? 'bg-green-500/10 hover:bg-green-500/20' : '')}
              >
                <Zap className={cn('h-4 w-4', useMCP && 'text-green-500')} />
                {useMCP ? 'MCP Mode' : 'API Mode'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsDarkMode(!isDarkMode)}>
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </>
          }
        />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card
              className={cn(
                'h-[600px] flex flex-col',
                isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white'
              )}
            >
              {/* Chat Messages */}
              <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={cn(
                        'flex gap-3',
                        message.type === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.type === 'assistant' && (
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center',
                            isDarkMode ? 'bg-blue-500/20' : 'bg-blue-500/10'
                          )}
                        >
                          <Brain className="h-4 w-4 text-blue-500" />
                        </div>
                      )}

                      <div
                        className={cn(
                          'max-w-[80%] rounded-lg p-3',
                          message.type === 'user'
                            ? isDarkMode
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-500 text-white'
                            : message.type === 'system'
                              ? isDarkMode
                                ? 'bg-yellow-600/20 border border-yellow-600/40'
                                : 'bg-yellow-100 border border-yellow-400'
                              : isDarkMode
                                ? 'bg-gray-700'
                                : 'bg-gray-100'
                        )}
                      >
                        <p
                          className={cn(
                            'whitespace-pre-wrap',
                            message.type === 'system' && 'text-yellow-200'
                          )}
                        >
                          {message.content}
                        </p>

                        {message.amount && (
                          <div className="mt-2 pt-2 border-t border-gray-600">
                            <p className="text-2xl font-bold">
                              ₹{message.amount.toLocaleString('en-IN')}
                            </p>
                          </div>
                        )}

                        {message.journalEntry && (
                          <div className="mt-3 p-2 bg-black/20 rounded text-xs font-mono">
                            <p className="text-gray-400 mb-1">Journal Entry:</p>
                            {message.journalEntry.debits.map((debit, i) => (
                              <p key={i} className="text-green-400">
                                DR: {debit.account} - ₹{debit.amount.toLocaleString('en-IN')}
                              </p>
                            ))}
                            {message.journalEntry.credits.map((credit, i) => (
                              <p key={i} className="text-red-400">
                                CR: {credit.account} - ₹{credit.amount.toLocaleString('en-IN')}
                              </p>
                            ))}
                          </div>
                        )}

                        {message.actions && message.actions.length > 0 && (
                          <div className="mt-3 flex gap-2 flex-wrap">
                            {message.actions.map((action, i) => (
                              <Button
                                key={i}
                                size="sm"
                                variant={action.variant || 'secondary'}
                                className="gap-1"
                              >
                                <action.icon className="h-3 w-3" />
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>

                      {message.type === 'user' && (
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center',
                            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                          )}
                        >
                          <Users className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))}

                  {loading && (
                    <div className="flex gap-3 justify-start">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center',
                          isDarkMode ? 'bg-blue-500/20' : 'bg-blue-500/10'
                        )}
                      >
                        <Brain className="h-4 w-4 text-blue-500" />
                      </div>
                      <div
                        className={cn('rounded-lg p-3', isDarkMode ? 'bg-gray-700' : 'bg-gray-100')}
                      >
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Processing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Quick Actions */}
              {showExamples && (
                <div className="p-3 border-t border-gray-700">
                  <div className="flex gap-2 flex-wrap">
                    {FURNITURE_QUICK_PROMPTS.map((prompt, i) => (
                      <Button
                        key={i}
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickPrompt(prompt.prompt)}
                        className={cn(
                          'gap-2',
                          isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        )}
                      >
                        <prompt.icon className={cn('h-4 w-4', prompt.color)} />
                        {prompt.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    placeholder="Tell me about your transaction..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    disabled={loading}
                    className={cn(
                      'flex-1',
                      isDarkMode ? 'bg-gray-900/50 border-gray-600' : 'bg-white border-gray-300'
                    )}
                  />
                  <Button type="submit" disabled={loading || !input.trim()}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-4">
            {/* Quick Expenses */}
            <Card className={cn(isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white')}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Quick Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {FURNITURE_QUICK_EXPENSES.map((expense, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickExpense(expense)}
                      className={cn(
                        'h-auto flex-col py-3 gap-1',
                        isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      )}
                    >
                      <expense.icon className="h-4 w-4 text-orange-500" />
                      <span className="text-xs">{expense.label}</span>
                      <span className="text-xs font-bold">₹{expense.amount}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Today's Summary */}
            <Card className={cn(isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white')}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Today's Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Revenue</span>
                    <span className="text-sm font-bold text-green-500">₹1,25,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Expenses</span>
                    <span className="text-sm font-bold text-red-500">₹48,500</span>
                  </div>
                  <div className="pt-2 border-t border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Net Profit</span>
                      <span className="text-lg font-bold text-blue-500">₹76,500</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Upload */}
            <FurnitureDocumentUpload
              organizationId={organizationId || ''}
              onDocumentAnalyzed={handleDocumentAnalyzed}
              isDarkMode={isDarkMode}
            />

            {/* Help Tips */}
            <Card className={cn(isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white')}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs text-gray-400">
                  <p>• Just describe transactions naturally</p>
                  <p>• Include amounts and customer names</p>
                  <p>• Ask for summaries anytime</p>
                  <p>• Upload invoices for AI analysis</p>
                  <p>• All entries are auto-journalized</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
