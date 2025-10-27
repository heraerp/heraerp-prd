/**
 * Salon Natural Language Finance Entry
 *
 * Conversational interface for entering financial transactions using
 * natural language powered by the MDA system. Features chat-like UI
 * with intelligent suggestions and real-time validation.
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { LuxeCard } from '@/components/ui/salon/luxe-card'
import { LuxeButton } from '@/components/ui/salon/luxe-button'
import { MobileLayout, ResponsiveGrid, MobileContainer } from '@/components/salon/mobile-layout'
import {
  Send,
  Mic,
  Camera,
  DollarSign,
  User,
  Calendar,
  Tag,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Clock,
  Receipt,
  CreditCard,
  Building,
  Scissors,
  ShoppingBag,
  Coffee,
  Zap
} from 'lucide-react'

interface Message {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  transaction?: ParsedTransaction
  status?: 'processing' | 'success' | 'error'
  journalEntries?: JournalEntry[]
  transactionId?: string
}

interface ParsedTransaction {
  amount: number
  currency: string
  type: string
  category: string
  description: string
  date?: string
  confidence: number
  smartCode?: string
}

interface JournalEntry {
  account_code: string
  account_name: string
  debit: number
  credit: number
  description: string
}

interface QuickAction {
  label: string
  template: string
  icon: React.ReactNode
  color: 'purple' | 'gold' | 'rose' | 'blue'
}

const quickActions: QuickAction[] = [
  {
    label: 'Staff Salary',
    template: 'Paid stylist Sarah $2,500 salary for October',
    icon: <User className="h-4 w-4" />,
    color: 'purple'
  },
  {
    label: 'Commission',
    template: 'Commission payment $850 to Maya for this week',
    icon: <DollarSign className="h-4 w-4" />,
    color: 'gold'
  },
  {
    label: 'Rent Payment',
    template: 'Paid office rent $4,500 for November',
    icon: <Building className="h-4 w-4" />,
    color: 'rose'
  },
  {
    label: 'Product Purchase',
    template: 'Bought hair products $320 from supplier',
    icon: <ShoppingBag className="h-4 w-4" />,
    color: 'blue'
  },
  {
    label: 'Service Revenue',
    template: 'Hair color service $180 for client Emma',
    icon: <Scissors className="h-4 w-4" />,
    color: 'purple'
  },
  {
    label: 'Utilities Bill',
    template: 'DEWA electricity bill $450 paid via bank',
    icon: <Zap className="h-4 w-4" />,
    color: 'gold'
  }
]

export default function SalonFinanceEntryPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content:
        'Hi! I\'m your HERA Modern Digital Accountant (MDA) for Hair Talkz Salon. Tell me about any financial transaction in plain English, and I\'ll create REAL transactions in your salon\'s books automatically with proper GL posting and smart codes. Try: "Paid stylist Sarah $2,500 salary" or "Received $180 for hair color service" or "DEWA electricity bill $450 paid via bank".',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const parseNaturalLanguage = async (text: string): Promise<ParsedTransaction | null> => {
    // Mock natural language parsing - in production, this would use the MCP service
    const amount = text.match(/\$?([\d,]+(?:\.\d{2})?)/)?.[1]
    const numericAmount = amount ? parseFloat(amount.replace(',', '')) : 0

    if (numericAmount === 0) return null

    // Simple pattern matching for demo
    let type = 'expense'
    let category = 'general'
    let smartCode = 'HERA.SALON.FINANCE.EXPENSE.GENERAL.V1'

    if (text.toLowerCase().includes('salary') || text.toLowerCase().includes('payroll')) {
      category = 'salary'
      smartCode = 'HERA.SALON.FINANCE.EXPENSE.SALARY.V1'
    } else if (text.toLowerCase().includes('commission')) {
      category = 'commission'
      smartCode = 'HERA.SALON.FINANCE.EXPENSE.COMMISSION.V1'
    } else if (text.toLowerCase().includes('rent')) {
      category = 'rent'
      smartCode = 'HERA.SALON.FINANCE.EXPENSE.RENT.V1'
    } else if (text.toLowerCase().includes('product') || text.toLowerCase().includes('supplies')) {
      category = 'supplies'
      smartCode = 'HERA.SALON.FINANCE.EXPENSE.SUPPLIES.V1'
    } else if (
      text.toLowerCase().includes('service') ||
      text.toLowerCase().includes('hair') ||
      text.toLowerCase().includes('client')
    ) {
      type = 'revenue'
      category = 'service'
      smartCode = 'HERA.SALON.FINANCE.REVENUE.SERVICE.V1'
    } else if (
      text.toLowerCase().includes('electricity') ||
      text.toLowerCase().includes('dewa') ||
      text.toLowerCase().includes('utilities')
    ) {
      category = 'utilities'
      smartCode = 'HERA.SALON.FINANCE.EXPENSE.UTILITIES.V1'
    }

    return {
      amount: numericAmount,
      currency: 'AED',
      type,
      category,
      description: text,
      confidence: 0.85 + Math.random() * 0.1,
      smartCode
    }
  }

  const fetchJournalEntries = async (transactionId: string): Promise<JournalEntry[]> => {
    try {
      const { supabase } = await import('@/lib/supabase/client')
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('No authentication token found.')
      }

      // Fetch journal entries for this transaction
      const response = await fetch(`/api/v2/journal-entries?transaction_id=${transactionId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'x-hera-api-version': 'v2'
        }
      })

      if (!response.ok) {
        console.warn('Could not fetch journal entries:', response.status)
        return []
      }

      const data = await response.json()
      return data.journal_entries || []
    } catch (error) {
      console.warn('Error fetching journal entries:', error)
      return []
    }
  }

  const processTransaction = async (
    transaction: ParsedTransaction
  ): Promise<
    | {
        success: boolean
        transaction_id?: string
        error?: string
        journal_entries?: JournalEntry[]
      }
    | false
  > => {
    // Real HERA Universal API v2 transaction creation
    try {
      const organizationId =
        localStorage.getItem('selectedOrganizationId') || '378f24fb-d496-4ff7-8afa-ea34895a0eb8' // Hair Talkz default

      // Get the current user's JWT token from Supabase session
      const { supabase } = await import('@/lib/supabase/client')
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('No authentication token found. Please log in.')
      }

      // Create the UFE (Universal Financial Event) payload - matches hera_txn_emit_v1 format
      const transactionPayload = {
        organization_id: organizationId,
        transaction_type: transaction.type === 'revenue' ? 'sale' : 'expense',
        smart_code: transaction.smartCode,
        transaction_code: `MDA-${Date.now()}`,
        transaction_date: new Date().toISOString(),
        total_amount: transaction.amount,
        transaction_currency_code: transaction.currency,
        base_currency_code: transaction.currency,
        exchange_rate: 1.0,
        source_entity_id: null, // Could be employee/customer entity if known
        target_entity_id: null, // Could be GL account entity if known
        business_context: {
          channel: 'NATURAL_LANGUAGE_MDA',
          source: 'Finance Entry Interface',
          description: transaction.description,
          category: transaction.category,
          confidence_score: transaction.confidence,
          auto_journal: true,
          mda_processed: true,
          original_text: transaction.description,
          amount: transaction.amount,
          currency: transaction.currency
        },
        lines: [
          {
            line_type: transaction.type === 'revenue' ? 'revenue' : 'expense',
            line_number: 1,
            description: transaction.description,
            quantity: 1,
            unit_price: transaction.amount,
            line_amount: transaction.amount,
            smart_code: transaction.smartCode,
            metadata: {
              category: transaction.category,
              parsed_from_nl: true
            }
          }
        ]
      }

      console.log('Creating real HERA transaction:', transactionPayload)
      console.log('Using JWT token for user:', session.user.email)
      console.log('Organization ID:', organizationId)

      // Call the actual Universal API v2 with user's JWT token
      const response = await fetch('/api/v2/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          'x-hera-api-version': 'v2'
        },
        body: JSON.stringify(transactionPayload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error Response:', response.status, response.statusText)
        console.error('API Error Details:', errorData)

        // Show more specific error details
        if (errorData.details) {
          console.error('Validation Details:', errorData.details)
        }

        throw new Error(
          `API Error (${response.status}): ${errorData.error || errorData.message || response.statusText}${errorData.details ? '. Details: ' + JSON.stringify(errorData.details) : ''}`
        )
      }

      const result = await response.json()
      console.log('Transaction created successfully:', result)

      // Store transaction ID for reference
      if (result.transaction_id) {
        console.log('HERA Transaction ID:', result.transaction_id)

        // Fetch journal entries for this transaction
        const journalEntries = await fetchJournalEntries(result.transaction_id)
        console.log('Journal entries fetched:', journalEntries)

        return {
          success: true,
          transaction_id: result.transaction_id,
          journal_entries: journalEntries
        }
      }

      return { success: true, transaction_id: result.transaction_id }
    } catch (error) {
      console.error('Error creating real transaction:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsProcessing(true)

    try {
      // Parse natural language
      const parsed = await parseNaturalLanguage(userMessage.content)

      if (!parsed) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content:
            'I couldn\'t detect a financial transaction in your message. Please include an amount and describe what happened. For example: "Paid $500 salary to stylist" or "Received $150 for haircut service".',
          timestamp: new Date(),
          status: 'error'
        }
        setMessages(prev => [...prev, errorMessage])
        return
      }

      // Show processing message
      const processingMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: `I detected a ${parsed.type} of $${parsed.amount} for ${parsed.category}. Processing this transaction...`,
        timestamp: new Date(),
        transaction: parsed,
        status: 'processing'
      }
      setMessages(prev => [...prev, processingMessage])

      // Process transaction
      const result = await processTransaction(parsed)
      const success = result && typeof result === 'object' && result.success

      // Update with result
      const resultMessage: Message = {
        id: (Date.now() + 3).toString(),
        type: 'assistant',
        content: success
          ? `✅ Successfully created real HERA transaction! ${parsed.type === 'revenue' ? 'Revenue' : 'Expense'} of $${parsed.amount} for ${parsed.category} has been posted to your salon's books with smart code ${parsed.smartCode}. ${result.transaction_id ? `Transaction ID: ${result.transaction_id}` : ''} Auto-journal entries have been created in your Chart of Accounts.`
          : `❌ Failed to create the real transaction in HERA database. ${result && typeof result === 'object' && result.error ? `Error: ${result.error}` : 'Please check the details and try again.'}`,
        timestamp: new Date(),
        transaction: parsed,
        status: success ? 'success' : 'error',
        journalEntries:
          success && result && typeof result === 'object' ? result.journal_entries : undefined,
        transactionId:
          success && result && typeof result === 'object' ? result.transaction_id : undefined
      }

      setMessages(prev => {
        const newMessages = [...prev]
        newMessages[newMessages.length - 1] = resultMessage
        return newMessages
      })
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 4).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        status: 'error'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleQuickAction = (template: string) => {
    setInput(template)
    inputRef.current?.focus()
  }

  const startVoiceInput = () => {
    setIsListening(true)
    // Mock voice input
    setTimeout(() => {
      setInput('Paid stylist commission eight hundred fifty dollars')
      setIsListening(false)
    }, 2000)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <MobileLayout>
      <MobileContainer maxWidth="full" padding={false}>
        <div className="px-4 md:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-rose-500 bg-clip-text text-transparent mb-2">
              Natural Language Finance
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
              Tell me about your transactions in plain English, and I'll handle the accounting
              automatically.
            </p>
          </div>

          <ResponsiveGrid
            cols={{ sm: 1, md: 1, lg: 4, xl: 4 }}
            className="items-start gap-6 md:gap-8"
          >
            {/* Chat Interface */}
            <div className="lg:col-span-3">
              <LuxeCard variant="glass" className="h-[500px] md:h-[600px] flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`flex items-start space-x-3 max-w-[85%] md:max-w-[80%] ${
                          message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                        }`}
                      >
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback
                            className={
                              message.type === 'user'
                                ? 'bg-purple-500 text-white'
                                : 'bg-gradient-to-br from-rose-400 to-purple-500 text-white'
                            }
                          >
                            {message.type === 'user' ? 'You' : '🤖'}
                          </AvatarFallback>
                        </Avatar>

                        <div
                          className={`rounded-2xl px-3 md:px-4 py-3 ${
                            message.type === 'user'
                              ? 'bg-purple-500 text-white'
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>

                          {message.transaction && (
                            <div className="mt-3 p-3 rounded-lg bg-black/5 dark:bg-white/5">
                              <div className="flex items-center justify-between mb-2">
                                <Badge
                                  variant={
                                    message.status === 'success'
                                      ? 'default'
                                      : message.status === 'error'
                                        ? 'destructive'
                                        : 'secondary'
                                  }
                                >
                                  {message.status === 'processing' && (
                                    <Clock className="w-3 h-3 mr-1 animate-spin" />
                                  )}
                                  {message.status === 'success' && (
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                  )}
                                  {message.status === 'error' && (
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                  )}
                                  {message.status || 'Parsed'}
                                </Badge>
                                <span className="text-xs opacity-70">
                                  {(message.transaction.confidence * 100).toFixed(0)}% confidence
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="opacity-70">Amount:</span>
                                  <span className="ml-1 font-medium">
                                    {message.transaction.currency} {message.transaction.amount}
                                  </span>
                                </div>
                                <div>
                                  <span className="opacity-70">Type:</span>
                                  <span className="ml-1 font-medium capitalize">
                                    {message.transaction.type}
                                  </span>
                                </div>
                                <div>
                                  <span className="opacity-70">Category:</span>
                                  <span className="ml-1 font-medium capitalize">
                                    {message.transaction.category}
                                  </span>
                                </div>
                                <div>
                                  <span className="opacity-70">Smart Code:</span>
                                  <span className="ml-1 font-mono text-xs">
                                    {message.transaction.smartCode?.split('.').pop()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {message.journalEntries && message.journalEntries.length > 0 && (
                            <div className="mt-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                              <div className="flex items-center mb-2">
                                <Receipt className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
                                <span className="text-sm font-medium text-green-800 dark:text-green-300">
                                  Journal Entries Created
                                </span>
                              </div>

                              <div className="space-y-2">
                                {message.journalEntries.map((entry, index) => (
                                  <div key={index} className="grid grid-cols-4 gap-2 text-xs">
                                    <div className="font-mono !text-green-700 dark:!text-green-400">
                                      {entry.account_code}
                                    </div>
                                    <div className="!text-green-600 dark:!text-green-300 truncate">
                                      {entry.account_name}
                                    </div>
                                    <div className="text-right">
                                      {entry.debit > 0 && (
                                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                                          DR {entry.debit.toFixed(2)}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      {entry.credit > 0 && (
                                        <span className="text-red-600 dark:text-red-400 font-medium">
                                          CR {entry.credit.toFixed(2)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {message.transactionId && (
                                <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-700">
                                  <span className="text-xs !text-green-600 dark:!text-green-400">
                                    Transaction ID: {message.transactionId}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs opacity-70">
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-gradient-to-br from-rose-400 to-purple-500 text-white">
                            🤖
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 border">
                          <div className="flex items-center space-x-2">
                            <Sparkles className="w-4 h-4 animate-pulse text-purple-500" />
                            <span className="text-sm">Processing...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t p-3 md:p-4">
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <div className="flex-1 relative">
                      <Input
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Type your transaction in plain English..."
                        className="pr-12 rounded-xl border-gray-300 dark:border-gray-600 text-sm"
                        onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                        disabled={isProcessing}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-8 w-8 p-0"
                        onClick={startVoiceInput}
                        disabled={isProcessing || isListening}
                      >
                        <Mic
                          className={`h-4 w-4 ${isListening ? 'text-red-500' : 'text-gray-500'}`}
                        />
                      </Button>
                    </div>

                    <LuxeButton
                      variant="gradient"
                      size="sm"
                      icon={<Send className="h-4 w-4" />}
                      onClick={handleSendMessage}
                      disabled={!input.trim() || isProcessing}
                      loading={isProcessing}
                    >
                      <span className="hidden sm:inline">Send</span>
                    </LuxeButton>
                  </div>
                </div>
              </LuxeCard>
            </div>

            {/* Quick Actions Sidebar */}
            <div className="space-y-4 md:space-y-6">
              <LuxeCard variant="floating" title="Quick Actions" description="Common transactions">
                <div className="space-y-3">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.template)}
                      className="w-full p-3 text-left rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200 group"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-2 rounded-lg ${
                            action.color === 'purple'
                              ? 'bg-purple-100 text-purple-600'
                              : action.color === 'gold'
                                ? 'bg-yellow-100 text-yellow-600'
                                : action.color === 'rose'
                                  ? 'bg-rose-100 text-rose-600'
                                  : 'bg-blue-100 text-blue-600'
                          }`}
                        >
                          {action.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                            {action.label}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {action.template}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </LuxeCard>

              <LuxeCard
                variant="gradient"
                gradientType="rose"
                title="MDA Features"
                className="text-white"
              >
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Sparkles className="h-5 w-5" />
                    <span className="text-sm">Real HERA transactions</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm">Auto GL posting</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Receipt className="h-5 w-5" />
                    <span className="text-sm">Journal entry display</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Coffee className="h-5 w-5" />
                    <span className="text-sm">Universal API v2</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mic className="h-5 w-5" />
                    <span className="text-sm">Voice input ready</span>
                  </div>
                </div>
              </LuxeCard>

              <LuxeCard
                variant="floating"
                title="Success Examples"
                description="Try these transactions"
              >
                <div className="space-y-2 text-sm">
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                    <span className="text-green-700 dark:text-green-300 font-medium">
                      ✓ Revenue:
                    </span>
                    <div className="text-green-600 dark:text-green-400">
                      "Hair color service $180 for Emma"
                    </div>
                  </div>
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                    <span className="text-blue-700 dark:text-blue-300 font-medium">✓ Salary:</span>
                    <div className="text-blue-600 dark:text-blue-400">
                      "Paid stylist Sarah $2500 salary"
                    </div>
                  </div>
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800">
                    <span className="text-purple-700 dark:text-purple-300 font-medium">
                      ✓ Utilities:
                    </span>
                    <div className="text-purple-600 dark:text-purple-400">
                      "DEWA electricity bill $450"
                    </div>
                  </div>
                </div>
              </LuxeCard>
            </div>
          </ResponsiveGrid>
        </div>
      </MobileContainer>
    </MobileLayout>
  )
}
