'use client'

import React, { useState, useRef, useEffect } from 'react'
import './digital-accountant.css'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Brain, 
  Send, 
  Loader2, 
  Calculator,
  FileText,
  TrendingUp, 
  AlertCircle, 
  ChevronDown, 
  ArrowUp, 
  History, 
  Moon,
  Sun,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Receipt,
  BookOpen,
  FileCheck,
  AlertTriangle,
  Sparkles,
  Shield,
  Database,
  MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { JournalEntryForm } from '@/components/digital-accountant/JournalEntryForm'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'error' | 'system'
  content: string
  data?: any
  timestamp: Date
  transactionId?: string
  status?: 'draft' | 'posted' | 'approved' | 'reversed'
  confidence?: number
  actions?: ActionButton[]
}

interface ActionButton {
  label: string
  action: string
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  data?: any
}

interface QuickAction {
  icon: React.ElementType
  label: string
  description: string
  prompt: string
  category: 'journal' | 'invoice' | 'payment' | 'reconcile' | 'report'
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: BookOpen,
    label: 'Post Journal',
    description: 'Create general journal entry',
    prompt: 'Post a journal entry',
    category: 'journal'
  },
  {
    icon: FileText,
    label: 'Create Invoice',
    description: 'Generate customer invoice',
    prompt: 'Create an invoice',
    category: 'invoice'
  },
  {
    icon: Receipt,
    label: 'Record Payment',
    description: 'Apply customer payment',
    prompt: 'Record a payment received',
    category: 'payment'
  },
  {
    icon: FileCheck,
    label: 'Bank Reconciliation',
    description: 'Match bank transactions',
    prompt: 'Reconcile bank account',
    category: 'reconcile'
  },
  {
    icon: TrendingUp,
    label: 'Financial Report',
    description: 'Generate P&L or Balance Sheet',
    prompt: 'Show me the financial statements',
    category: 'report'
  }
]

const EXAMPLE_PROMPTS = [
  "Post a journal to accrue $12,000 for August marketing expenses",
  "Create a recurring invoice for $5,000 + VAT to Dubai Salon",
  "Apply a $5,250 bank receipt to open invoices for Mario's Restaurant",
  "Show me the P&L for August 2025",
  "Reconcile credit card transactions for this month",
  "Calculate VAT for the current period"
]

export default function DigitalAccountantPage() {
  const { currentOrganization, isAuthenticated, contextLoading } = useMultiOrgAuth()
  const organizationId = currentOrganization?.id || '550e8400-e29b-41d4-a716-446655440000' // Fallback for testing
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Welcome to HERA Digital Accountant! I'm your AI-powered accounting assistant.

I can help you with:

📝 **Journal Entries** - Post adjustments, accruals, depreciation
💰 **Invoicing** - Create and manage customer invoices  
🏦 **Payments** - Record receipts and apply to invoices
📊 **Reconciliation** - Match bank and card transactions
📈 **Reporting** - Generate financial statements and analytics
🔒 **Compliance** - VAT calculations and period closing

All transactions follow enterprise accounting standards with multi-level approvals when needed. I understand natural language, so just tell me what you need!`,
      timestamp: new Date()
    }
  ])
  
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'journal' | 'reports'>('chat')
  const [confidence, setConfidence] = useState<number>(0)
  
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    if (!isDarkMode) {
      document.documentElement.classList.add('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
      document.body.style.backgroundColor = '#1a1a1a'
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.setAttribute('data-theme', 'light')
      document.body.style.backgroundColor = '#ffffff'
    }
  }

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedInput = input.trim()
    if (!trimmedInput || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedInput,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setConfidence(0)

    try {
      // Simulate confidence building
      const confidenceInterval = setInterval(() => {
        setConfidence(prev => Math.min(prev + 10, 85))
      }, 100)

      const response = await fetch('/api/v1/digital-accountant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmedInput,
          organizationId,
          context: {
            mode: activeTab,
            previousTransactionId: messages[messages.length - 1]?.transactionId
          }
        }),
      })

      clearInterval(confidenceInterval)
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      // Create assistant response with actions
      const assistantMessage: Message = {
        id: Date.now().toString() + '-response',
        role: 'assistant',
        content: data.message || data.response || 'Transaction processed.',
        data: data.result,
        transactionId: data.transactionId,
        status: data.status,
        confidence: data.confidence || 90,
        timestamp: new Date(),
        actions: data.actions
      }

      setMessages(prev => [...prev, assistantMessage])
      setConfidence(data.confidence || 90)
      
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString() + '-error',
        role: 'error',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to process request'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
      setConfidence(0)
    }
  }

  // Handle action button clicks
  const handleAction = async (action: ActionButton) => {
    if (action.action === 'post') {
      const postMessage = `Post transaction ${action.data?.transactionId}`
      setInput(postMessage)
      // Use setTimeout to ensure state update before submit
      setTimeout(() => {
        const form = formRef.current
        if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
        }
      }, 100)
    } else if (action.action === 'reverse') {
      const reverseMessage = `Reverse transaction ${action.data?.transactionId}`
      setInput(reverseMessage)
      setTimeout(() => {
        const form = formRef.current
        if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
        }
      }, 100)
    } else if (action.action === 'approve') {
      const approveMessage = `Approve transaction ${action.data?.transactionId}`
      setInput(approveMessage)
      setTimeout(() => {
        const form = formRef.current
        if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
        }
      }, 100)
    }
  }

  // Handle quick action clicks
  const handleQuickAction = (quickAction: QuickAction) => {
    setInput(quickAction.prompt)
    inputRef.current?.focus()
  }

  // Render transaction status badge
  const renderStatusBadge = (status?: string) => {
    if (!status) return null
    
    const statusConfig = {
      draft: { variant: 'outline' as const, icon: Clock },
      posted: { variant: 'default' as const, icon: CheckCircle2 },
      approved: { variant: 'default' as const, icon: FileCheck },
      reversed: { variant: 'destructive' as const, icon: XCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.toUpperCase()}
      </Badge>
    )
  }

  return (
    <div className={cn("min-h-screen", isDarkMode && "dark")} style={{ backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }}>
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center">
              <Calculator className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">HERA Digital Accountant</h1>
              <p className="text-sm text-muted-foreground">AI-Powered Enterprise Accounting</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Shield className="h-3 w-3" />
              Enterprise Security
            </Badge>
            <Button variant="outline" size="icon" onClick={toggleDarkMode}>
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Quick Actions Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-2">
                  {QUICK_ACTIONS.map((action, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-3"
                      onClick={() => handleQuickAction(action)}
                    >
                      <action.icon className="h-4 w-4 mr-3 text-primary" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{action.label}</div>
                        <div className="text-xs text-muted-foreground">{action.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Compliance Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Compliance Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Period Status</span>
                  <Badge variant="outline" className="text-xs">AUG 2025 OPEN</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">VAT Filing</span>
                  <Badge variant="outline" className="text-xs">DUE SEP 15</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pending Approvals</span>
                  <Badge variant="secondary">3</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Chat Interface */}
          <Card className="lg:col-span-3 flex flex-col h-[80vh]">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
              <CardHeader className="border-b pb-3">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="chat" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="journal" className="gap-2">
                    <BookOpen className="h-4 w-4" />
                    Journal Entry
                  </TabsTrigger>
                  <TabsTrigger value="reports" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Reports
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              
              <TabsContent value="chat" className="flex-1 flex flex-col">
                <ScrollArea className="flex-1 px-6 py-4" ref={scrollAreaRef}>
                  <div className="space-y-6">
                    {messages.map((message, index) => (
                      <div
                        key={message.id}
                        className={cn(
                          'flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300',
                          message.role === 'user' && 'justify-end'
                        )}
                      >
                        {message.role !== 'user' && (
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                            message.role === 'error' 
                              ? "bg-destructive/20" 
                              : "bg-gradient-to-br from-emerald-600/20 to-emerald-400/20"
                          )}>
                            {message.role === 'error' ? (
                              <AlertCircle className="h-5 w-5 text-destructive" />
                            ) : (
                              <Calculator className="h-5 w-5 text-emerald-600" />
                            )}
                          </div>
                        )}
                        
                        <div className={cn(
                          'flex-1 space-y-3',
                          message.role === 'user' && 'max-w-[80%]'
                        )}>
                          <div
                            className={cn(
                              'rounded-lg px-4 py-3',
                              message.role === 'user' 
                                ? 'bg-primary text-primary-foreground' 
                                : message.role === 'error'
                                ? 'bg-destructive/10 text-destructive'
                                : 'bg-muted'
                            )}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            
                            {/* Transaction Status */}
                            {message.transactionId && (
                              <div className="mt-3 flex items-center gap-2 text-xs">
                                <span className="opacity-70">Transaction:</span>
                                <code className="bg-background px-1.5 py-0.5 rounded">
                                  {message.transactionId}
                                </code>
                                {renderStatusBadge(message.status)}
                              </div>
                            )}
                            
                            {/* Confidence Score */}
                            {message.confidence && message.confidence > 0 && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="opacity-70">Confidence</span>
                                  <span>{message.confidence}%</span>
                                </div>
                                <Progress value={message.confidence} className="h-1.5" />
                              </div>
                            )}
                          </div>
                          
                          {/* Action Buttons */}
                          {message.actions && message.actions.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                              {message.actions.map((action, idx) => (
                                <Button
                                  key={idx}
                                  variant={action.variant || 'secondary'}
                                  size="sm"
                                  onClick={() => handleAction(action)}
                                >
                                  {action.label}
                                </Button>
                              ))}
                            </div>
                          )}
                          
                          {/* Transaction Details */}
                          {message.data && message.data.lines && (
                            <div className="bg-muted/50 rounded-lg p-3">
                              <h4 className="font-medium text-sm mb-2">Journal Lines</h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="border-b">
                                      <th className="text-left py-1">Account</th>
                                      <th className="text-right py-1">Debit</th>
                                      <th className="text-right py-1">Credit</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {message.data.lines.map((line: any, idx: number) => (
                                      <tr key={idx} className="border-b last:border-0">
                                        <td className="py-1">{line.account_code} - {line.account_name}</td>
                                        <td className="text-right py-1">
                                          {line.debit > 0 ? line.debit.toFixed(2) : '—'}
                                        </td>
                                        <td className="text-right py-1">
                                          {line.credit > 0 ? line.credit.toFixed(2) : '—'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                          
                          <div className="text-xs text-muted-foreground">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {loading && (
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600/20 to-emerald-400/20 flex items-center justify-center animate-pulse">
                          <Calculator className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="bg-muted rounded-lg px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <p className="text-sm">Processing accounting request...</p>
                          </div>
                          {confidence > 0 && (
                            <div className="mt-2">
                              <Progress value={confidence} className="h-1.5" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                
                {/* Example Prompts */}
                {messages.length === 1 && (
                  <div className="px-6 pb-4">
                    <p className="text-xs text-muted-foreground mb-2">Try these examples:</p>
                    <div className="flex flex-wrap gap-2">
                      {EXAMPLE_PROMPTS.slice(0, 3).map((prompt, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            setInput(prompt)
                            inputRef.current?.focus()
                          }}
                        >
                          {prompt}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                
                <form ref={formRef} onSubmit={handleSubmit} className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask me to post journals, create invoices, reconcile accounts..."
                      className="flex-1"
                      disabled={loading}
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
              </TabsContent>
              
              <TabsContent value="journal" className="flex-1 p-6 overflow-y-auto">
                <JournalEntryForm 
                  organizationId={organizationId} 
                  isDarkMode={isDarkMode}
                  onSuccess={(journalId) => {
                    // Create a success message
                    const successMessage: Message = {
                      id: Date.now().toString(),
                      role: 'system',
                      content: `Journal entry ${journalId} has been successfully posted.`,
                      timestamp: new Date()
                    }
                    setMessages(prev => [...prev, successMessage])
                    // Switch back to chat tab
                    setActiveTab('chat')
                  }}
                />
              </TabsContent>
              
              <TabsContent value="reports" className="flex-1 p-6">
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    Financial reports interface coming soon. Use the chat to generate reports.
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
        
        {/* Bottom Info Bar */}
        <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Multi-Level Approvals</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span>Universal Architecture</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span>Powered by HERA Intelligence</span>
          </div>
        </div>
      </div>
    </div>
  )
}