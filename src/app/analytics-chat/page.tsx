'use client'

import React, { useState, useRef, useEffect } from 'react'
import './analytics.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Brain, Send, Loader2, BarChart2, TrendingUp, AlertCircle, ChevronDown, ArrowUp, History, Trash2, Search, Calendar, MessageSquare, X, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
// import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider' // Disabled for testing

interface Message {
  id: string
  role: 'user' | 'assistant' | 'error'
  content: string
  data?: any
  timestamp: Date
}

interface ChatSession {
  id: string
  start_time: string
  end_time?: string
  message_count: number
  last_message?: string
}

interface SavedMessage {
  id?: string
  session_id: string
  message_type: 'user' | 'assistant'
  content: string
  timestamp: string
  metadata?: any
}

export default function AnalyticsChatPage() {
  // const { currentOrganization, isAuthenticated, isLoading: contextLoading, organizationId } = useMultiOrgAuth()
  // For testing - using default organization ID
  const organizationId = '550e8400-e29b-41d4-a716-446655440000'
  const isAuthenticated = true
  const contextLoading = false
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [savedMessages, setSavedMessages] = useState<SavedMessage[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [searchHistory, setSearchHistory] = useState('')
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'message' | 'session' | 'all', id?: string } | null>(null)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `🧠 HERA Analytics Brain activated. I can help you with:

📊 **Analytics Queries**
• "Why did refunds spike in August?"
• "Show top customers by margin last 90 days"
• "Compare revenue by region this vs last month"

📈 **Performance Metrics**  
• "What's our conversion rate trend?"
• "Show inventory turnover by category"
• "Calculate customer lifetime value"

💰 **Financial Analysis**
• "Post inventory write-off for batch B-923"
• "Show GL balance by account"
• "Analyze expense variances"

⚡ **Predictive Insights**
• "Forecast next quarter revenue"
• "Identify churn risk customers"
• "Predict inventory stockouts"

I provide intelligent insights with enterprise-grade security and smart code validation.`,
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastMessageRef = useRef<HTMLDivElement>(null)

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

  // Initialize session on mount
  useEffect(() => {
    if (organizationId) {
      initializeSession()
      loadChatSessions()
    }
  }, [organizationId])

  const initializeSession = async () => {
    try {
      const response = await fetch('/api/v1/analytics/chat/sessions', {
        method: 'POST'
      })
      const data = await response.json()
      if (data.sessionId) {
        setCurrentSessionId(data.sessionId)
      }
    } catch (error) {
      console.error('Failed to initialize session:', error)
    }
  }

  const loadChatSessions = async () => {
    setLoadingSessions(true)
    try {
      const response = await fetch('/api/v1/analytics/chat/sessions')
      const data = await response.json()
      if (data.sessions) {
        setSessions(data.sessions)
      }
    } catch (error) {
      console.error('Failed to load sessions:', error)
    } finally {
      setLoadingSessions(false)
    }
  }

  const loadSessionHistory = async (sessionId: string) => {
    setLoadingHistory(true)
    try {
      const response = await fetch(`/api/v1/analytics/chat/history?session_id=${sessionId}`)
      const data = await response.json()
      if (data.messages) {
        setSavedMessages(data.messages)
        // Convert saved messages to display messages
        const displayMessages: Message[] = data.messages.map((msg: SavedMessage) => ({
          id: msg.id || Date.now().toString(),
          role: msg.message_type === 'user' ? 'user' : 'assistant',
          content: msg.content,
          data: msg.metadata?.response_data,
          timestamp: new Date(msg.timestamp)
        }))
        setMessages([
          {
            id: '1',
            role: 'assistant',
            content: '📜 Loaded conversation from ' + new Date(sessionId).toLocaleDateString(),
            timestamp: new Date()
          },
          ...displayMessages
        ])
      }
    } catch (error) {
      console.error('Failed to load session history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const searchChatHistory = async () => {
    if (!searchHistory.trim()) {
      loadChatSessions()
      return
    }
    setLoadingHistory(true)
    try {
      const response = await fetch(`/api/v1/analytics/chat/history?search=${encodeURIComponent(searchHistory)}`)
      const data = await response.json()
      if (data.messages) {
        // Group messages by session for display
        const sessionMap = new Map<string, SavedMessage[]>()
        data.messages.forEach((msg: SavedMessage) => {
          const existing = sessionMap.get(msg.session_id) || []
          existing.push(msg)
          sessionMap.set(msg.session_id, existing)
        })
        // Convert to sessions format
        const searchSessions: ChatSession[] = Array.from(sessionMap.entries()).map(([sessionId, msgs]) => ({
          id: sessionId,
          start_time: msgs[0].timestamp,
          end_time: msgs[msgs.length - 1].timestamp,
          message_count: msgs.length,
          last_message: msgs[msgs.length - 1].content.substring(0, 100) + (msgs[msgs.length - 1].content.length > 100 ? '...' : '')
        }))
        setSessions(searchSessions)
      }
    } catch (error) {
      console.error('Failed to search history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const saveMessage = async (message: Message, messageType: 'user' | 'assistant', metadata?: any) => {
    if (!currentSessionId) return
    
    try {
      await fetch('/api/v1/analytics/chat/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: currentSessionId,
          message_type: messageType,
          content: message.content,
          metadata: metadata || message.data
        })
      })
    } catch (error) {
      console.error('Failed to save message:', error)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    
    try {
      if (deleteTarget.type === 'all') {
        await fetch('/api/v1/analytics/chat/all?type=all', {
          method: 'DELETE'
        })
        setSessions([])
        setMessages([messages[0]]) // Keep welcome message
      } else if (deleteTarget.type === 'session' && deleteTarget.id) {
        await fetch(`/api/v1/analytics/chat/${deleteTarget.id}?type=session`, {
          method: 'DELETE'
        })
        setSessions(sessions.filter(s => s.id !== deleteTarget.id))
        if (currentSessionId === deleteTarget.id) {
          setMessages([messages[0]])
          initializeSession()
        }
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    } finally {
      setDeleteConfirmOpen(false)
      setDeleteTarget(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    // Save user message
    await saveMessage(userMessage, 'user')

    try {
      const response = await fetch('/api/v1/analytics/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          organizationId: organizationId || '', // Use current org
          useAnalyticsBrain: true
        }),
      })

      const data = await response.json()
      
      // Build comprehensive response
      let responseContent = ''
      
      if (data.message) {
        responseContent += data.message + '\n'
      }
      
      if (data.narrative) {
        responseContent += '\n' + data.narrative + '\n'
      }
      
      if (data.insights && data.insights.length > 0) {
        responseContent += '\n📊 **Key Insights:**\n'
        data.insights.forEach((insight: string) => {
          responseContent += `• ${insight}\n`
        })
      }
      
      if (data.nextActions && data.nextActions.length > 0) {
        responseContent += '\n💡 **Recommended Actions:**\n'
        data.nextActions.forEach((action: string) => {
          responseContent += `• ${action}\n`
        })
      }
      
      const assistantMessage: Message = {
        id: Date.now().toString() + '-response',
        role: data.error ? 'error' : 'assistant',
        content: responseContent || data.response || 'Analysis complete.',
        data: data.result,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
      
      // Save assistant response
      await saveMessage(assistantMessage, 'assistant', data.result)
      
      // Auto-scroll to the new message after a brief delay
      setTimeout(() => {
        if (lastMessageRef.current && autoScrollEnabled) {
          lastMessageRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          })
          
          // Show a visual indicator that new content arrived
          if (lastMessageRef.current) {
            lastMessageRef.current.classList.add('animate-highlight')
            setTimeout(() => {
              lastMessageRef.current?.classList.remove('animate-highlight')
            }, 2000)
          }
        }
      }, 100)
      
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString() + '-error',
        role: 'error',
        content: `Error: ${error instanceof Error ? error.message : 'Connection failed'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }
  
  // Monitor scroll position for showing scroll-to-top button
  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
    if (!scrollContainer) return
    
    const handleScroll = () => {
      const scrollTop = scrollContainer.scrollTop
      setShowScrollTop(scrollTop > 500)
      
      // Disable auto-scroll if user scrolls up manually
      const scrollHeight = scrollContainer.scrollHeight
      const clientHeight = scrollContainer.clientHeight
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 100
      
      if (!isAtBottom && scrollTop < scrollHeight - clientHeight - 200) {
        setAutoScrollEnabled(false)
      } else if (isAtBottom) {
        setAutoScrollEnabled(true)
      }
    }
    
    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [])
  
  const scrollToTop = () => {
    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setAutoScrollEnabled(true)
  }

  const formatData = (data: any) => {
    if (!data) return null
    
    // Handle revenue analysis results
    if (data.type === 'revenue_analysis') {
      return (
        <div className="mt-3 space-y-3">
          <div className="bg-muted rounded-lg p-3">
            <h4 className="font-medium text-sm mb-2">📊 Revenue Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Total Revenue</p>
                <p className="font-semibold">${data.total_revenue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Transactions</p>
                <p className="font-semibold">{data.transaction_count}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Average</p>
                <p className="font-semibold">${Math.round(data.average_transaction).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Period</p>
                <p className="font-semibold">{data.period.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
          
          {data.breakdown && data.breakdown.length > 0 && (
            <div className="bg-muted rounded-lg p-3">
              <h4 className="font-medium text-sm mb-2">💰 Revenue by Service</h4>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">Service</th>
                    <th className="text-right py-1">Transactions</th>
                    <th className="text-right py-1">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.breakdown.map((service: any, idx: number) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="py-1">{service.service}</td>
                      <td className="text-right py-1">{service.count}</td>
                      <td className="text-right py-1">${service.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )
    }
    
    // Handle customer analysis results
    if (data.type === 'customer_analysis') {
      return (
        <div className="mt-3 space-y-3">
          <div className="bg-muted rounded-lg p-3">
            <h4 className="font-medium text-sm mb-2">👥 Customer Overview</h4>
            <p className="text-sm">Total Customers: <span className="font-semibold">{data.count}</span></p>
          </div>
          
          {data.data && data.data.length > 0 && (
            <div className="bg-muted rounded-lg p-3">
              <h4 className="font-medium text-sm mb-2">Recent Customers</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1">Name</th>
                      <th className="text-left py-1">Email</th>
                      <th className="text-left py-1">Phone</th>
                      <th className="text-left py-1">VIP Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.slice(0, 5).map((customer: any) => (
                      <tr key={customer.id} className="border-b last:border-0">
                        <td className="py-1">{customer.entity_name || customer.name}</td>
                        <td className="py-1 text-muted-foreground">{customer.email || '—'}</td>
                        <td className="py-1 text-muted-foreground">{customer.phone || '—'}</td>
                        <td className="py-1">
                          {customer.vip_status ? (
                            <span className="text-xs bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded">
                              {customer.loyalty_tier || 'VIP'}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.count > 5 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Showing 5 of {data.count} customers
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )
    }
    
    // Handle raw transaction/entity arrays
    if (Array.isArray(data)) {
      return (
        <div className="mt-3 space-y-3">
          {data.map((result, idx) => (
            <div key={idx} className="bg-muted rounded-lg p-3">
              {result.type === 'transactions' && (
                <>
                  <h4 className="font-medium text-sm mb-2">📈 Transaction Summary</h4>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-semibold">${result.total.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Count</p>
                      <p className="font-semibold">{result.count}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Average</p>
                      <p className="font-semibold">${Math.round(result.total / result.count).toLocaleString()}</p>
                    </div>
                  </div>
                </>
              )}
              {result.type === 'entities' && (
                <>
                  <h4 className="font-medium text-sm mb-2">📋 Entity Summary</h4>
                  <p className="text-sm">Found {result.count} records</p>
                </>
              )}
              {result.type === 'forecast' && (
                <>
                  <h4 className="font-medium text-sm mb-2">🔮 Revenue Forecast</h4>
                  {result.error ? (
                    <div>
                      <p className="text-sm text-destructive">{result.error}</p>
                      <p className="text-xs text-muted-foreground mt-1">{result.suggestion}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Forecast Summary Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="bg-background rounded p-2">
                          <p className="text-muted-foreground text-xs">Forecast Amount</p>
                          <p className="font-bold text-lg">${Math.round(result.forecast_amount).toLocaleString()}</p>
                        </div>
                        <div className="bg-background rounded p-2">
                          <p className="text-muted-foreground text-xs">Confidence</p>
                          <p className="font-bold text-lg">{result.confidence}%</p>
                        </div>
                        <div className="bg-background rounded p-2">
                          <p className="text-muted-foreground text-xs">Growth Rate</p>
                          <p className="font-bold text-lg">
                            {result.growth_rate >= 0 ? '+' : ''}{result.growth_rate.toFixed(1)}%
                          </p>
                        </div>
                        <div className="bg-background rounded p-2">
                          <p className="text-muted-foreground text-xs">Trend</p>
                          <p className="font-bold text-lg capitalize">
                            {result.based_on?.trend === 'growing' ? '📈' : 
                             result.based_on?.trend === 'declining' ? '📉' : '➡️'} {result.based_on?.trend}
                          </p>
                        </div>
                      </div>
                      
                      {/* Monthly Breakdown if available */}
                      {result.monthly_breakdown && result.monthly_breakdown.length > 0 && (
                        <div className="bg-background rounded p-2">
                          <p className="text-xs text-muted-foreground mb-2">Monthly Breakdown</p>
                          <div className="space-y-1">
                            {result.monthly_breakdown.map((month: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span>{month.month}</span>
                                <span className="font-medium">${Math.round(month.amount).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Historical Context */}
                      <div className="text-xs text-muted-foreground">
                        Based on {result.based_on?.months_analyzed} months of data • 
                        Historical avg: ${Math.round(result.historical_avg).toLocaleString()}/month
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )
    }
    
    // Handle data with array property
    if (data.data && Array.isArray(data.data)) {
      return (
        <div className="mt-3 bg-muted rounded-lg p-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                {Object.keys(data.data[0] || {}).filter(key => !['metadata'].includes(key)).map(key => (
                  <th key={key} className="px-3 py-2 text-left font-medium">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.data.slice(0, 10).map((row: any, idx: number) => (
                <tr key={idx}>
                  {Object.entries(row).filter(([key]) => !['metadata'].includes(key)).map(([key, val]: [string, any], i) => (
                    <td key={i} className="px-3 py-2 whitespace-nowrap">
                      {val === null || val === undefined ? '—' : 
                       typeof val === 'number' ? val.toLocaleString() : 
                       typeof val === 'boolean' ? (val ? '✓' : '✗') :
                       String(val)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {data.data.length > 10 && (
            <p className="text-xs text-muted-foreground mt-2">
              Showing first 10 of {data.data.length} results
            </p>
          )}
        </div>
      )
    }
    
    // Fallback for other data types
    return null
  }

  // Auth checks removed for testing - uncomment when adding authentication back
  /*
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <Card className="p-8 text-center">
          <CardContent>
            <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Authentication Required</p>
            <p className="text-muted-foreground">Please log in to access the Analytics Brain.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (contextLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <Card className="p-8 text-center">
          <CardContent>
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-lg font-medium">Loading Analytics Brain...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!organizationId) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <Card className="p-8 text-center">
          <CardContent>
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-warning" />
            <p className="text-lg font-medium mb-2">No Organization Selected</p>
            <p className="text-muted-foreground">Please select an organization to continue.</p>
          </CardContent>
        </Card>
      </div>
    )
  }
  */

  return (
    <div className={cn("min-h-screen", isDarkMode && "dark")} style={{ backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }}>
      <div className="container mx-auto p-6 max-w-6xl analytics-container">
        <Card className="h-[85vh] flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-primary" />
              <CardTitle>HERA Analytics Brain</CardTitle>
              <span className="ml-auto text-sm text-muted-foreground">
                Powered by HERA Intelligence
              </span>
              <Button variant="outline" size="icon" onClick={toggleDarkMode}>
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <History className="h-4 w-4 mr-2" />
                  History
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                  <SheetTitle>Chat History</SheetTitle>
                  <SheetDescription>
                    View and search your past analytics conversations
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search conversations..."
                        value={searchHistory}
                        onChange={(e) => setSearchHistory(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchChatHistory()}
                        className="pl-9"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setDeleteTarget({ type: 'all' })
                        setDeleteConfirmOpen(true)
                      }}
                      title="Clear all history"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-[calc(100vh-220px)]">
                    {loadingSessions ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : sessions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No conversations yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {sessions.map((session) => {
                          const startDate = new Date(session.start_time)
                          const isToday = startDate.toDateString() === new Date().toDateString()
                          const timeStr = isToday ? startDate.toLocaleTimeString() : startDate.toLocaleDateString()
                          
                          return (
                            <Card
                              key={session.id}
                              className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => {
                                loadSessionHistory(session.id)
                                setHistoryOpen(false)
                              }}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">{timeStr}</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {session.message_count} messages
                                    </Badge>
                                  </div>
                                  <p className="text-sm truncate">{session.last_message}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 flex-shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setDeleteTarget({ type: 'session', id: session.id })
                                    setDeleteConfirmOpen(true)
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </Card>
                          )
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-0 overflow-hidden flex flex-col relative">
          {/* New Response Indicator */}
          {loading && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
              <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm flex items-center gap-2 shadow-lg animate-in slide-in-from-top-2 duration-300">
                <Loader2 className="h-3 w-3 animate-spin" />
                Analyzing your query...
              </div>
            </div>
          )}
          
          {/* Auto-scroll Status */}
          {!autoScrollEnabled && messages.length > 3 && (
            <div className="absolute bottom-20 right-4 z-20">
              <Button
                onClick={scrollToBottom}
                size="sm"
                className="rounded-full shadow-lg bg-primary/90 hover:bg-primary animate-in slide-in-from-bottom-2"
              >
                <ChevronDown className="h-4 w-4 mr-1" />
                New messages
              </Button>
            </div>
          )}
          
          {/* Scroll to Top Button */}
          {showScrollTop && (
            <div className="absolute top-4 right-4 z-20">
              <Button
                onClick={scrollToTop}
                size="icon"
                variant="secondary"
                className="rounded-full shadow-lg w-10 h-10 animate-in fade-in slide-in-from-right-2"
                title="Scroll to top"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <ScrollArea className="flex-1 p-4 analytics-scrollbar" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  ref={index === messages.length - 1 ? lastMessageRef : null}
                  className={cn(
                    'flex gap-3 transition-all duration-300 message-animate',
                    message.role === 'user' && 'justify-end'
                  )}
                >
                  {message.role !== 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {message.role === 'error' ? (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      ) : (
                        <BarChart2 className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  )}
                  <div
                    className={cn(
                      'rounded-lg px-4 py-2 max-w-[85%]',
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : message.role === 'error'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-muted'
                    )}
                  >
                    <pre className="whitespace-pre-wrap font-sans text-sm">
                      {message.content}
                    </pre>
                    {message.data && formatData(message.data)}
                    <div className="text-xs opacity-60 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-2 animate-pulse">
                    <p className="text-sm">Analyzing with guardrails...</p>
                    <div className="flex gap-2 mt-1">
                      <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask: 'Why did refunds spike?' or 'Show top customers by margin'"
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
        </CardContent>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Smart Code Examples
          </h3>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div>• HERA.RETAIL.REFUND.ISSUED.v2</div>
            <div>• HERA.MFG.INVENTORY.WRITE_OFF.v1</div>
            <div>• HERA.ACCOUNTING.GL.JOURNAL.v3</div>
            <div>• HERA.SALES.ORDER.COMPLETED.v1</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Guardrails Active
          </h3>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div>✓ Organization ID required</div>
            <div>✓ Smart code validation</div>
            <div>✓ GL balance enforcement</div>
            <div>✓ Enterprise security</div>
          </div>
        </Card>
      </div>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === 'all' && 'Are you sure you want to delete all chat history? This action cannot be undone.'}
              {deleteTarget?.type === 'session' && 'Are you sure you want to delete this conversation? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </div>
  )
}