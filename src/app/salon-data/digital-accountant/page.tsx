'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
/**
 * HERA Salon Digital Accountant Integration
 * Smart Code: HERA.SALON.DIGITAL.ACCOUNTANT.v1
 * 
 * Simplified accounting interface for salon owners
 * Natural language processing for non-accountants
 */

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { QuickExpenseGrid } from '@/components/salon/digital-accountant/QuickExpenseGrid'
import { TransactionHistory } from '@/components/salon/digital-accountant/TransactionHistory'
import { DailyInsights } from '@/components/salon/digital-accountant/DailyInsights'
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
  Scissors,
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
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SalonMessage {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  category?: 'revenue' | 'expense' | 'payment' | 'commission' | 'summary'
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

// Salon-specific quick prompts
const SALON_QUICK_PROMPTS: QuickPrompt[] = [
  {
    icon: DollarSign,
    label: 'Cash Sale',
    prompt: 'Client paid cash',
    color: 'text-green-600',
    category: 'revenue'
  },
  {
    icon: CreditCard,
    label: 'Card Sale',
    prompt: 'Client paid by card',
    color: 'text-blue-600',
    category: 'revenue'
  },
  {
    icon: ShoppingBag,
    label: 'Buy Supplies',
    prompt: 'Bought supplies',
    color: 'text-orange-600',
    category: 'expense'
  },
  {
    icon: Coins,
    label: 'Pay Staff',
    prompt: 'Pay staff commission',
    color: 'text-purple-600',
    category: 'commission'
  },
  {
    icon: Receipt,
    label: 'Bills',
    prompt: 'Paid bill',
    color: 'text-red-600',
    category: 'expense'
  },
  {
    icon: Calculator,
    label: "Today's Total",
    prompt: "Show today's summary",
    color: 'text-indigo-600',
    category: 'summary'
  }
]

export default function SalonDigitalAccountantPage() {
  const router = useRouter()
  const { currentOrganization, contextLoading } = useMultiOrgAuth()
  const [messages, setMessages] = useState<SalonMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: `Hi! I'm your salon accounting assistant. I'll help you record all your daily transactions without any accounting knowledge needed! 

Just tell me in simple words:
• "Sarah paid 350 for coloring" 
• "Bought hair color for 250"
• "Pay Maya her commission"
• "Show today's total"

I'll handle all the technical accounting for you! 💅`,
      timestamp: new Date(),
      status: 'success'
    }
  ])
  
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showExamples, setShowExamples] = useState(true)
  const [activeView, setActiveView] = useState<'chat' | 'expense' | 'history' | 'insights'>('chat')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [useMCP, setUseMCP] = useState(true) // Default to MCP mode
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const organizationId = currentOrganization?.id || 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'
  
  // Auto-scroll to bottom with smooth animation
  useEffect(() => {
    // Use requestAnimationFrame for smoother scrolling
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
        if (viewport) {
          // Smooth scroll to bottom
          viewport.scrollTo({
            top: viewport.scrollHeight,
            behavior: 'smooth'
          })
        }
      }
    }
    
    // Delay to ensure DOM is updated
    const timer = setTimeout(() => {
      requestAnimationFrame(scrollToBottom)
    }, 50)
    
    return () => clearTimeout(timer)
  }, [messages])
  
  // Detect scroll position
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
    if (!viewport) return
    
    const handleScroll = () => {
      const isNearBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 100
      setShowScrollButton(!isNearBottom)
    }
    
    viewport.addEventListener('scroll', handleScroll)
    return () => viewport.removeEventListener('scroll', handleScroll)
  }, [])
  
  // Manual scroll to bottom
  const scrollToBottomManual = () => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
    if (viewport) {
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: 'smooth'
      })
    }
  }
  
  // Handle message submission
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmedInput = input.trim()
    if (!trimmedInput || loading) return
    
    // Add user message
    const userMessage: SalonMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: trimmedInput,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setShowExamples(false)
    
    try {
      // Use MCP or pattern-based API based on toggle
      const apiEndpoint = useMCP 
        ? '/api/v1/digital-accountant/mcp'  // Claude-powered intelligent responses
        : '/api/v1/digital-accountant/chat' // Pattern-based responses
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmedInput,
          organizationId,
          sessionId: sessionStorage.getItem('chatSessionId') || undefined,
          context: {
            mode: 'salon',
            businessType: 'salon',
            simplifiedMode: true
          }
        })
      })
      
      const data = await response.json()
      
      // Store session ID for conversation continuity
      if (data.sessionId) {
        sessionStorage.setItem('chatSessionId', data.sessionId)
      }
      
      // Create assistant response
      const assistantMessage: SalonMessage = {
        id: Date.now().toString() + '-assistant',
        type: 'assistant',
        content: formatSalonResponse(data),
        timestamp: new Date(),
        category: detectCategory(trimmedInput),
        amount: extractAmount(data),
        status: data.error ? 'error' : 'success',
        journalEntry: data.journalEntry,
        actions: generateActions(data)
      }
      
      setMessages(prev => [...prev, assistantMessage])
      
    } catch (error) {
      const errorMessage: SalonMessage = {
        id: Date.now().toString() + '-error',
        type: 'system',
        content: "Sorry, I couldn't process that. Please try again or contact support.",
        timestamp: new Date(),
        status: 'error'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }
  
  // Format response for salon owners
  const formatSalonResponse = (data: any): string => {
    if (data.error) return data.error
    
    // Convert technical accounting response to friendly language
    if (data.type === 'journal' && data.result) {
      const amount = data.result.total_amount || extractAmountFromMessage(data.message)
      const isRevenue = data.message.toLowerCase().includes('revenue') || 
                       data.message.toLowerCase().includes('sale')
      
      if (isRevenue) {
        return `✅ Great! I've recorded the payment of AED ${amount}.
        
💰 Money received and added to your daily sales.
${data.vat_amount ? `📊 VAT included: AED ${data.vat_amount}` : ''}

Your books are updated automatically!`
      } else {
        return `✅ Expense recorded: AED ${amount}
        
📂 Category: ${data.category || 'Operating Expense'}
${data.vat_amount ? `📊 VAT included: AED ${data.vat_amount}` : ''}
${data.vendor ? `🏪 Vendor: ${data.vendor}` : ''}

All set! Your expenses are tracked.`
      }
    }
    
    // Summary response
    if (data.type === 'summary' || data.message.includes('summary')) {
      return data.message.replace(/technical accounting terms/gi, '')
    }
    
    return data.message || 'Transaction processed successfully!'
  }
  
  // Detect transaction category
  const detectCategory = (message: string): SalonMessage['category'] => {
    const lower = message.toLowerCase()
    if (lower.includes('paid') && (lower.includes('client') || lower.includes('customer'))) {
      return 'revenue'
    }
    if (lower.includes('commission') || lower.includes('staff')) {
      return 'commission'
    }
    if (lower.includes('bought') || lower.includes('paid') || lower.includes('expense')) {
      return 'expense'
    }
    if (lower.includes('summary') || lower.includes('total')) {
      return 'summary'
    }
    return 'revenue'
  }
  
  // Extract amount from response
  const extractAmount = (data: any): number | undefined => {
    if (data.result?.total_amount) return data.result.total_amount
    if (data.amount) return data.amount
    
    // Try to extract from message
    const match = data.message?.match(/\d+(?:,\d{3})*(?:\.\d{2})?/)
    return match ? parseFloat(match[0].replace(',', '')) : undefined
  }
  
  // Extract amount from message
  const extractAmountFromMessage = (message: string): string => {
    const match = message.match(/\d+(?:,\d{3})*(?:\.\d{2})?/)
    return match ? match[0] : '0'
  }
  
  // Generate quick actions based on response
  const generateActions = (data: any): QuickAction[] => {
    const actions: QuickAction[] = []
    
    if (data.type === 'journal' || data.transactionId) {
      // Add journal entry review and posting actions
      actions.push({
        icon: FileText,
        label: 'Review Journal',
        action: 'review_journal',
        variant: 'outline',
        data: {
          transactionId: data.transactionId,
          journalEntry: data.journalEntry,
          amount: data.result?.total_amount || extractAmount(data)
        }
      })
      
      actions.push({
        icon: CheckCircle,
        label: 'Post Journal',
        action: 'post_journal',
        variant: 'default',
        data: {
          transactionId: data.transactionId,
          journalEntry: data.journalEntry,
          amount: data.result?.total_amount || extractAmount(data)
        }
      })
      
      actions.push({
        icon: Camera,
        label: 'Add Receipt',
        action: 'attach_receipt',
        variant: 'outline'
      })
    }
    
    if (data.type === 'revenue') {
      actions.push({
        icon: MessageSquare,
        label: 'Send Receipt',
        action: 'send_receipt',
        variant: 'outline'
      })
    }
    
    return actions
  }
  
  // Handle quick prompt click
  const handleQuickPrompt = (prompt: QuickPrompt) => {
    setInput(prompt.prompt)
    inputRef.current?.focus()
  }
  
  // Handle expense selection
  const handleExpenseSelect = (expense: any, amount?: number) => {
    const message = amount 
      ? `Bought ${expense.name.toLowerCase()} for ${amount}`
      : `Bought ${expense.name.toLowerCase()}`
    setInput(message)
    inputRef.current?.focus()
    setActiveView('chat')
  }
  
  // Handle voice input (placeholder)
  const handleVoiceInput = () => {
    // In production, this would integrate with speech-to-text
    alert('Voice input will be available soon! For now, please type your message.')
  }
  
  // Handle file attachment for receipts/evidence
  const handleFileAttachment = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/heic']
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF or image file (JPEG, PNG, HEIC)')
      return
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      alert('File size must be less than 5MB')
      return
    }
    
    // Show loading state
    setLoading(true)
    
    try {
      // Create FormData
      const formData = new FormData()
      formData.append('file', file)
      formData.append('organizationId', organizationId)
      formData.append('fileType', file.type)
      formData.append('fileName', file.name)
      
      // Upload file
      const uploadResponse = await fetch('/api/v1/documents/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file')
      }
      
      const uploadResult = await uploadResponse.json()
      const { documentId, publicUrl } = uploadResult.data
      
      // Add message showing the attachment
      const attachmentMessage: SalonMessage = {
        id: Date.now().toString() + '-attachment',
        type: 'assistant',
        content: `✅ Receipt attached successfully!\n\n📎 **${file.name}**\nSize: ${(file.size / 1024).toFixed(1)}KB\nType: ${file.type.includes('pdf') ? 'PDF Document' : 'Image'}\n\nThis document has been linked to your transaction and stored securely.`,
        timestamp: new Date(),
        status: 'success',
        actions: [
          {
            icon: FileText,
            label: 'View Document',
            action: 'view_document',
            variant: 'outline',
            data: { documentId, url: publicUrl, fileName: file.name }
          }
        ]
      }
      
      setMessages(prev => [...prev, attachmentMessage])
      
      // Store document reference in session for later use
      sessionStorage.setItem('lastAttachedDocument', JSON.stringify({
        documentId,
        fileName: file.name,
        fileType: file.type,
        uploadedAt: new Date().toISOString()
      }))
      
    } catch (error) {
      console.error('Error uploading file:', error)
      const errorMessage: SalonMessage = {
        id: Date.now().toString() + '-upload-error',
        type: 'system',
        content: "❌ Failed to upload the file. Please try again or contact support.",
        timestamp: new Date(),
        status: 'error'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
      // Reset file input
      event.target.value = ''
    }
  }
  
  // Handle camera input for receipts
  const handleCameraInput = () => {
    // Trigger file input click
    const fileInput = document.getElementById('receipt-file-input') as HTMLInputElement
    if (fileInput) {
      fileInput.click()
    }
  }
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  // Handle journal entry review
  const handleReviewJournal = (actionData: any) => {
    const { transactionId, journalEntry, amount } = actionData
    
    // Create a detailed review message
    const reviewMessage: SalonMessage = {
      id: Date.now().toString() + '-review',
      type: 'system',
      content: `📋 **Journal Entry Review**
      
**Transaction ID:** ${transactionId}
**Amount:** AED ${amount}
**Status:** Draft (Ready for Posting)

**Journal Entry Details:**
${journalEntry?.debits?.map((d: any) => `• DR ${d.account}: AED ${d.amount}`).join('\n') || ''}
${journalEntry?.credits?.map((c: any) => `• CR ${c.account}: AED ${c.amount}`).join('\n') || ''}

**Actions Available:**
✅ Post to General Ledger
📝 Pencil Entry
❌ Cancel Entry

Would you like to post this journal entry to the GL?`,
      timestamp: new Date(),
      status: 'pending',
      journalEntry,
      actions: [
        {
          icon: CheckCircle,
          label: 'Post to GL',
          action: 'confirm_post',
          variant: 'default',
          data: { transactionId, journalEntry, amount }
        },
        {
          icon: AlertCircle,
          label: 'Cancel',
          action: 'cancel_post',
          variant: 'outline'
        }
      ]
    }
    
    setMessages(prev => [...prev, reviewMessage])
  }

  // Handle journal entry posting
  const handlePostJournal = async (actionData: any) => {
    const { transactionId, journalEntry, amount } = actionData
    setLoading(true)
    
    try {
      // Call the posting API
      const response = await fetch('/api/v1/finance/post-journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          transactionId,
          journalEntry,
          amount,
          postingDate: new Date().toISOString(),
          reference: `Salon Transaction ${transactionId}`,
          smartCode: 'HERA.SALON.MANUAL.POST.v1'
        })
      })
      
      const result = await response.json()
      
      const postMessage: SalonMessage = {
        id: Date.now().toString() + '-posted',
        type: 'assistant',
        content: result.success 
          ? `✅ **Journal Entry Posted Successfully!**
          
**GL Entry ID:** ${result.glEntryId || 'AUTO-' + Date.now()}
**Posting Date:** ${new Date().toLocaleDateString()}
**Status:** Posted to General Ledger

Your salon's books have been updated with this transaction.
All account balances are now current! 📚✨`
          : `❌ **Posting Failed**
          
${result.error || 'Unable to post journal entry. Please contact support.'}`,
        timestamp: new Date(),
        status: result.success ? 'success' : 'error'
      }
      
      setMessages(prev => [...prev, postMessage])
      
    } catch (error) {
      const errorMessage: SalonMessage = {
        id: Date.now().toString() + '-post-error',
        type: 'system',
        content: "❌ Failed to post journal entry. Please check your connection and try again.",
        timestamp: new Date(),
        status: 'error'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }
  
  // Render journal entry in simple format
  const renderJournalEntry = (entry: any) => {
    if (!entry) return null
    
    return (
      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
        <p className="font-medium mb-2 text-gray-700 dark:text-gray-300">
          📚 Accounting Entry (Auto-generated):
        </p>
        <div className="space-y-1 font-mono text-xs">
          {entry.debits.map((debit: any, idx: number) => (
            <div key={idx} className="text-green-600 dark:text-green-400">
              + {debit.account}: {debit.amount}
            </div>
          ))}
          {entry.credits.map((credit: any, idx: number) => (
            <div key={idx} className="text-red-600 dark:text-red-400 ml-4">
              - {credit.account}: {credit.amount}
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  if (contextLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Scissors className="w-12 h-12 text-purple-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading your salon accounts...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <div className="max-w-7xl mx-auto p-4 flex-1 flex flex-col w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/salon-data')}
            >
              <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
              Back to Salon
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => alert('Export coming soon!')}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleDarkMode}
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Salon Smart Accountant
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Just tell me what happened - I'll handle the accounting!
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge 
                variant={useMCP ? "default" : "secondary"} 
                className="gap-1 cursor-pointer"
                onClick={() => setUseMCP(!useMCP)}
                title={useMCP ? "Using Claude AI (Click to switch to pattern mode)" : "Using pattern matching (Click to switch to Claude AI)"}
              >
                <Brain className="w-3 h-3" />
                {useMCP ? "Claude AI" : "Pattern Mode"}
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="w-3 h-3" />
                AI Powered
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Today's Sales</p>
                  <p className="text-xl font-bold text-green-600">AED 3,850</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Expenses</p>
                  <p className="text-xl font-bold text-red-600">AED 450</p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Clients Today</p>
                  <p className="text-xl font-bold text-blue-600">12</p>
                </div>
                <Users className="w-8 h-8 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Net Cash</p>
                  <p className="text-xl font-bold text-purple-600">AED 3,400</p>
                </div>
                <Banknote className="w-8 h-8 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Interface with Tabs */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex-1 flex flex-col">
          <CardHeader className="flex-shrink-0">
            <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
              <TabsList className="grid grid-cols-4 w-full max-w-lg">
                <TabsTrigger value="chat" className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="expense" className="gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Expenses
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <History className="w-4 h-4" />
                  History
                </TabsTrigger>
                <TabsTrigger value="insights" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Insights
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-hidden">
            <Tabs value={activeView} className="w-full h-full">
              {/* Chat Tab */}
              <TabsContent value="chat" className="mt-0 h-full">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                  {/* Chat Area */}
                  <div className="lg:col-span-2 h-full">
                    <Card className="h-full flex flex-col border-0 shadow-none" style={{ minHeight: '600px', maxHeight: '80vh' }}>
                      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                        {/* Messages - Fixed height with proper overflow */}
                        <div className="flex-1 overflow-hidden relative">
                          <ScrollArea ref={scrollAreaRef} className="h-full pr-2" style={{ height: '100%' }}>
                            <style jsx global>{`
                              [data-radix-scroll-area-viewport] {
                                scrollbar-width: thin;
                                scrollbar-color: rgba(147, 51, 234, 0.3) transparent;
                              }
                              [data-radix-scroll-area-viewport]::-webkit-scrollbar {
                                width: 8px;
                              }
                              [data-radix-scroll-area-viewport]::-webkit-scrollbar-track {
                                background: transparent;
                              }
                              [data-radix-scroll-area-viewport]::-webkit-scrollbar-thumb {
                                background-color: rgba(147, 51, 234, 0.3);
                                border-radius: 4px;
                              }
                              [data-radix-scroll-area-viewport]::-webkit-scrollbar-thumb:hover {
                                background-color: rgba(147, 51, 234, 0.5);
                              }
                            `}</style>
                            <div className="p-6 pb-2">
                              <div className="space-y-4 max-w-4xl mx-auto w-full">
                                {messages.map((message) => (
                                <div
                                  key={message.id}
                                  className={cn(
                                    "flex",
                                    message.type === 'user' ? "justify-end" : "justify-start"
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "max-w-[80%] rounded-lg p-4",
                                      message.type === 'user' 
                                        ? "bg-purple-600 text-white" 
                                        : message.type === 'system'
                                        ? "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    )}
                                  >
                                    <p className="whitespace-pre-wrap">{message.content}</p>
                                    
                                    {message.journalEntry && renderJournalEntry(message.journalEntry)}
                                    
                                    {message.actions && message.actions.length > 0 && (
                                      <div className="flex gap-2 mt-3">
                                        {message.actions.map((action, idx) => (
                                          <Button
                                            key={idx}
                                            variant={action.variant || 'secondary'}
                                            size="sm"
                                            className="gap-1"
                                            onClick={() => {
                                              if (action.action === 'attach_receipt') {
                                                handleCameraInput()
                                              } else if (action.action === 'send_receipt') {
                                                alert('WhatsApp receipt sending coming soon!')
                                              } else if (action.action === 'review_journal') {
                                                handleReviewJournal(action.data)
                                              } else if (action.action === 'post_journal') {
                                                handlePostJournal(action.data)
                                              } else if (action.action === 'confirm_post') {
                                                handlePostJournal(action.data)
                                              } else if (action.action === 'cancel_post') {
                                                // Just add a cancellation message
                                                const cancelMessage: SalonMessage = {
                                                  id: Date.now().toString() + '-cancel',
                                                  type: 'system',
                                                  content: "❌ Journal entry posting cancelled. The transaction remains in draft status.",
                                                  timestamp: new Date(),
                                                  status: 'error'
                                                }
                                                setMessages(prev => [...prev, cancelMessage])
                                              } else if (action.action === 'view_document') {
                                                // Open document in new tab
                                                if (action.data?.url) {
                                                  window.open(action.data.url, '_blank')
                                                } else if (action.data?.documentId) {
                                                  // Fetch document URL if not provided
                                                  fetch(`/api/v1/documents/upload?documentId=${action.data.documentId}&organizationId=${organizationId}`)
                                                    .then(res => res.json())
                                                    .then(data => {
                                                      if (data.success && data.data?.publicUrl) {
                                                        window.open(data.data.publicUrl, '_blank')
                                                      }
                                                    })
                                                    .catch(err => {
                                                      console.error('Error fetching document:', err)
                                                      alert('Failed to open document. Please try again.')
                                                    })
                                                }
                                              }
                                            }}
                                          >
                                            <action.icon className="w-3 h-3" />
                                            {action.label}
                                          </Button>
                                        ))}
                                      </div>
                                    )}
                                    
                                    <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                                      <Clock className="w-3 h-3" />
                                      {message.timestamp.toLocaleTimeString()}
                                      {message.status && (
                                        <>
                                          {message.status === 'success' && <CheckCircle className="w-3 h-3 text-green-500" />}
                                          {message.status === 'error' && <AlertCircle className="w-3 h-3 text-red-500" />}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                                <div ref={messagesEndRef} />
                              </div>
                            </div>
                          </ScrollArea>
                          
                          {/* Scroll to bottom button */}
                          {showScrollButton && (
                            <Button
                              onClick={scrollToBottomManual}
                              size="sm"
                              className="absolute bottom-4 right-4 rounded-full shadow-lg bg-purple-600 hover:bg-purple-700 text-white"
                              style={{ zIndex: 10 }}
                            >
                              <ArrowDown className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        
                        {/* Input Area - Fixed at bottom */}
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                          {/* Hidden file input */}
                          <input
                            id="receipt-file-input"
                            type="file"
                            accept="application/pdf,image/jpeg,image/jpg,image/png,image/heic"
                            onChange={handleFileAttachment}
                            className="hidden"
                          />
                          
                          <form onSubmit={handleSubmit} className="flex gap-2">
                            <div className="flex-1 relative">
                              <Input
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Tell me what happened... (e.g., 'Sarah paid 350 for hair color')"
                                disabled={loading}
                                className="pr-20 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                              />
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  onClick={handleVoiceInput}
                                  className="h-7 w-7"
                                  title="Voice input (coming soon)"
                                >
                                  <Mic className="w-4 h-4" />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  onClick={handleCameraInput}
                                  className="h-7 w-7"
                                  title="Attach receipt or document"
                                >
                                  <Camera className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <Button 
                              type="submit" 
                              disabled={loading || !input.trim()}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                            </Button>
                          </form>
                          
                          {/* Quick Actions */}
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
                            {SALON_QUICK_PROMPTS.map((prompt, idx) => (
                              <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuickPrompt(prompt)}
                                className="flex flex-col h-auto py-2 px-1"
                              >
                                <prompt.icon className={cn("w-5 h-5 mb-1", prompt.color)} />
                                <span className="text-xs">{prompt.label}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Side Panel */}
                  <div className="space-y-4">
                    {/* Help & Examples */}
                    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <HelpCircle className="w-5 h-5 text-blue-600" />
                          Example Phrases
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                               onClick={() => setInput("Maya paid 450 for coloring and treatment")}>
                            "Maya paid 450 for coloring and treatment"
                          </div>
                          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                               onClick={() => setInput("Bought hair color from Beauty Depot for 320")}>
                            "Bought hair color from Beauty Depot for 320"
                          </div>
                          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                               onClick={() => setInput("Pay Sarah 40% commission on 2000")}>
                            "Pay Sarah 40% commission on 2000"
                          </div>
                          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                               onClick={() => setInput("Paid electricity bill 850")}>
                            "Paid electricity bill 850"
                          </div>
                          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                               onClick={() => setInput("Show me today's total sales")}>
                            "Show me today's total sales"
                          </div>
                        </div>
                        
                        <Alert className="mt-4">
                          <Sparkles className="w-4 h-4" />
                          <AlertDescription>
                            <strong>Pro tip:</strong> I automatically calculate VAT and categorize expenses for you!
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              {/* Expense Tab */}
              <TabsContent value="expense" className="mt-0">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Quick Expense Entry</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Click an expense type, then select or enter the amount
                    </p>
                    <QuickExpenseGrid onExpenseSelect={handleExpenseSelect} />
                  </div>
                </div>
              </TabsContent>
              
              {/* History Tab */}
              <TabsContent value="history" className="mt-0">
                <TransactionHistory />
              </TabsContent>
              
              {/* Insights Tab */}
              <TabsContent value="insights" className="mt-0">
                <DailyInsights />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}