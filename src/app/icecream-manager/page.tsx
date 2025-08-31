'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Sparkles,
  Send,
  Loader2,
  TruckIcon,
  Package,
  DollarSign,
  Users,
  Thermometer,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Moon,
  Sun,
  Shield,
  IceCream,
  BarChart3,
  Store,
  ShoppingCart,
  Activity,
  Calendar,
  History,
  Trash2,
  Search,
  MessageSquare,
  X,
  LineChart,
  PieChart,
  Download,
  Filter,
  Target,
  ShoppingBag,
  FileText,
  Settings,
  Zap,
  Info,
  Database,
  MoreVertical,
  Star,
  Edit2,
  Plus,
  ChevronRight,
  ChevronDown,
  ArrowDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { IceCreamChatStorage, createIceCreamChatStorage, IceCreamChatMessage, IceCreamChatSession } from '@/lib/icecream-chat-storage'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'error'
  content: string
  timestamp: Date
  data?: any
  status?: string
  confidence?: number
  actions?: ActionButton[]
  analyticalFramework?: {
    stage: 'analyze' | 'investigate' | 'clarify' | 'target' | 'iterate' | 'initial'
    [key: string]: any
  }
}

interface ActionButton {
  label: string
  action: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  data?: any
}

interface QuickAction {
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  prompt: string
  color: string
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: Thermometer,
    label: 'Check Cold Chain',
    description: 'Monitor temperature logs',
    prompt: 'Check cold chain status and temperature logs',
    color: 'from-blue-600 to-cyan-400'
  },
  {
    icon: Package,
    label: 'Production Plan',
    description: 'Plan today\'s production',
    prompt: 'Plan ice cream production for today based on demand',
    color: 'from-purple-600 to-pink-400'
  },
  {
    icon: TruckIcon,
    label: 'Distribution Routes',
    description: 'Optimize delivery routes',
    prompt: 'Show distribution routes and delivery status',
    color: 'from-green-600 to-emerald-400'
  },
  {
    icon: ShoppingCart,
    label: 'POS Analytics',
    description: 'Sales by outlet',
    prompt: 'Show POS sales analysis by outlet and product',
    color: 'from-orange-600 to-amber-400'
  },
  {
    icon: Activity,
    label: 'Inventory Status',
    description: 'Stock levels & expiry',
    prompt: 'Check inventory levels and products expiring soon',
    color: 'from-red-600 to-pink-400'
  },
  {
    icon: BarChart3,
    label: 'Sales Forecast',
    description: 'Predict demand',
    prompt: 'Forecast next week sales based on weather and trends',
    color: 'from-indigo-600 to-purple-400'
  }
]

const EXAMPLE_PROMPTS = [
  'Which flavors are selling best this week?',
  'Plan production for Mango Kulfi based on demand',
  'Check temperature compliance for all freezers',
  'Optimize today\'s delivery routes',
  'Show products expiring in next 7 days',
  'Analyze sales correlation with temperature'
]

// Quick metrics for ice cream business
interface QuickMetric {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  trend?: number
  color: string
}

const QUICK_METRICS: QuickMetric[] = [
  {
    icon: Thermometer,
    label: 'Cold Chain',
    value: '✓ Compliant',
    trend: 100,
    color: 'from-blue-600 to-cyan-400'
  },
  {
    icon: Package,
    label: 'Production',
    value: '850 units',
    trend: 12,
    color: 'from-purple-600 to-pink-400'
  },
  {
    icon: TruckIcon,
    label: 'Deliveries',
    value: '47/52',
    trend: 90,
    color: 'from-green-600 to-emerald-400'
  },
  {
    icon: DollarSign,
    label: 'Revenue',
    value: '₹68,450',
    trend: 15,
    color: 'from-orange-600 to-amber-400'
  }
]

export default function IceCreamManagerPage() {
  const router = useRouter()
  const { currentOrganization, isAuthenticated } = useMultiOrgAuth()
  const [isDarkMode, setIsDarkMode] = useState(true)
  
  // Ice cream organization ID - automatically set by middleware for /icecream routes
  const organizationId = currentOrganization?.id || '1471e87b-b27e-42ef-8192-343cc5e0d656'
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'production' | 'analytics'>('chat')
  const [confidence, setConfidence] = useState<number>(0)
  
  // Session management
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<IceCreamChatSession[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)
  const [showClearAllDialog, setShowClearAllDialog] = useState(false)
  
  // Model settings
  const [selectedModel, setSelectedModel] = useState<'gpt-4' | 'gpt-3.5' | 'claude'>('gpt-4')
  const [temperature, setTemperature] = useState(0.7)
  
  // Scroll state
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  
  // Refs
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  
  // Initialize chat storage
  const chatStorage = useRef<IceCreamChatStorage | null>(null)
  
  useEffect(() => {
    if (organizationId) {
      chatStorage.current = createIceCreamChatStorage(organizationId)
      loadSessions()
      startNewSession()
    }
  }, [organizationId])

  // Check if user is at bottom of scroll
  const checkIfAtBottom = useCallback(() => {
    if (!scrollAreaRef.current) return false
    
    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
    
    setShowScrollButton(!isAtBottom)
    return isAtBottom
  }, [])

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [])
  
  // Attach scroll listener
  useEffect(() => {
    const scrollElement = scrollAreaRef.current
    if (!scrollElement) return
    
    let scrollTimeout: NodeJS.Timeout
    
    const handleScroll = () => {
      checkIfAtBottom()
      
      // Only set user scrolling if they're not at the bottom
      if (!checkIfAtBottom()) {
        setIsUserScrolling(true)
        
        // Clear existing timeout
        clearTimeout(scrollTimeout)
        
        // Reset user scrolling flag after user stops scrolling
        scrollTimeout = setTimeout(() => {
          setIsUserScrolling(false)
        }, 1500)
      } else {
        // If at bottom, immediately clear user scrolling flag
        setIsUserScrolling(false)
      }
    }
    
    scrollElement.addEventListener('scroll', handleScroll)
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeout)
    }
  }, [checkIfAtBottom])

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    // Only auto-scroll if:
    // 1. It's the first message (welcome message)
    // 2. User sent a message (last message is from user)
    // 3. User was already at bottom when AI responds
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      const shouldAutoScroll = 
        messages.length === 1 || // First message
        lastMessage?.role === 'user' || // User just sent a message
        (!isUserScrolling && checkIfAtBottom()) // Was already at bottom
      
      if (shouldAutoScroll) {
        setTimeout(() => {
          scrollToBottom()
        }, 100)
      }
    }
  }, [messages, isUserScrolling, scrollToBottom, checkIfAtBottom])

  // Load chat sessions
  const loadSessions = async () => {
    if (!chatStorage.current) return
    
    try {
      const loadedSessions = await chatStorage.current.getChatSessions({
        limit: 50,
        searchTerm: searchTerm || undefined
      })
      setSessions(loadedSessions)
    } catch (error) {
      console.error('Failed to load sessions:', error)
    }
  }

  // Start new session
  const startNewSession = async () => {
    if (!chatStorage.current) return
    
    try {
      const sessionId = await chatStorage.current.startSession()
      setCurrentSessionId(sessionId)
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `🍦 Welcome to HERA Ice Cream Manager!

I'm your AI assistant for complete ice cream business operations with **analytical thinking**!

• 🏭 **Production** - Plan production based on demand forecasting
• 📦 **Inventory** - Track stock levels and expiry dates
• 🚚 **Distribution** - Optimize delivery routes and schedules
• 🌡️ **Cold Chain** - Monitor temperature compliance 24/7
• 💰 **Sales Analytics** - Real-time POS data and insights
• 📊 **Forecasting** - Weather-based demand prediction

**🤖 My Analytical Process:**
• 🤔 **Analyze** - I understand your request
• 🔍 **Investigate** - I explore production, sales, and inventory data
• ❓ **Clarify** - I ask questions if needed
• 🎯 **Target** - I provide optimized solutions
• 🔄 **Iterate** - I refine based on your feedback

I can help you optimize operations, reduce waste, and increase profitability!

How can I help you today?`,
        timestamp: new Date()
      }])
      await loadSessions()
    } catch (error) {
      console.error('Failed to start session:', error)
    }
  }

  // Load session messages
  const loadSession = async (sessionId: string) => {
    if (!chatStorage.current) return
    
    try {
      const sessionMessages = await chatStorage.current.getChatHistory({
        session_id: sessionId
      })
      
      const convertedMessages: Message[] = sessionMessages.map(msg => ({
        id: msg.id || Date.now().toString(),
        role: msg.message_type as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        data: msg.metadata?.response_data,
        confidence: msg.metadata?.confidence,
        actions: msg.metadata?.actions,
        analyticalFramework: msg.metadata?.analyticalFramework
      }))
      
      setMessages(convertedMessages)
      setCurrentSessionId(sessionId)
      setShowHistory(false)
    } catch (error) {
      console.error('Failed to load session:', error)
    }
  }

  // Delete session
  const deleteSession = async (sessionId: string) => {
    if (!chatStorage.current) return
    
    try {
      await chatStorage.current.deleteSession(sessionId)
      await loadSessions()
      
      if (sessionId === currentSessionId) {
        startNewSession()
      }
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
  }

  // Clear all history
  const clearAllHistory = async () => {
    if (!chatStorage.current) return
    
    try {
      await chatStorage.current.clearAllHistory()
      setSessions([])
      startNewSession()
    } catch (error) {
      console.error('Failed to clear history:', error)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted!', { input, loading })
    
    const trimmedInput = input.trim()
    if (!trimmedInput || loading) {
      console.log('Submit blocked:', { trimmedInput, loading })
      return
    }
    
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

    // Save user message
    if (chatStorage.current && currentSessionId) {
      await chatStorage.current.saveMessage({
        session_id: currentSessionId,
        message_type: 'user',
        content: trimmedInput,
        timestamp: new Date().toISOString()
      })
    }

    try {
      // Simulate confidence building
      const confidenceInterval = setInterval(() => {
        setConfidence(prev => Math.min(prev + 15, 90))
      }, 100)

      const response = await fetch('/api/v1/icecream-manager/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmedInput,
          organizationId,
          context: {
            mode: activeTab,
            userId: 'user-123', // In production, get from auth
            model: selectedModel,
            temperature
          }
        }),
      })

      clearInterval(confidenceInterval)
      const data = await response.json()
      
      console.log('Ice Cream API Response:', data)
      
      if (data.error) {
        throw new Error(data.error)
      }

      // Create assistant response with actions
      const assistantMessage: Message = {
        id: Date.now().toString() + '-response',
        role: 'assistant',
        content: data.message || data.response || 'Operation completed.',
        data: data.result || data.data,
        status: data.status,
        confidence: data.confidence || 90,
        timestamp: new Date(),
        actions: data.actions,
        analyticalFramework: data.analyticalFramework
      }

      setMessages(prev => [...prev, assistantMessage])
      setConfidence(data.confidence || 90)
      
      // Save assistant message
      if (chatStorage.current && currentSessionId) {
        await chatStorage.current.saveMessage({
          session_id: currentSessionId,
          message_type: 'assistant',
          content: assistantMessage.content,
          timestamp: new Date().toISOString(),
          metadata: {
            response_data: data.result || data.data,
            confidence: data.confidence,
            actions: data.actions,
            analyticalFramework: data.analyticalFramework,
            model: selectedModel,
            temperature
          }
        })
      }
      
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString() + '-error',
        role: 'error',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to process request'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      setConfidence(0)
    } finally {
      setLoading(false)
      setConfidence(0)
      await loadSessions() // Refresh session list
    }
  }

  // Handle action button clicks
  const handleAction = async (action: ActionButton) => {
    if (action.action === 'optimize') {
      setInput('Optimize production schedule')
      inputRef.current?.focus()
    } else if (action.action === 'check') {
      setInput(`Check temperature logs for ${action.data?.location}`)
      setTimeout(() => {
        const form = formRef.current
        if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
        }
      }, 100)
    } else if (action.action === 'forecast') {
      setInput('Generate demand forecast for next week')
      inputRef.current?.focus()
    }
  }

  // Handle quick action clicks
  const handleQuickAction = (quickAction: QuickAction) => {
    setInput(quickAction.prompt)
    inputRef.current?.focus()
  }

  // Render status badge
  const renderStatusBadge = (status?: string) => {
    if (!status) return null
    
    const statusConfig = {
      optimal: { 
        variant: 'default' as const, 
        icon: CheckCircle2, 
        classNameDark: 'bg-green-900/30 text-green-400 border-green-900/50',
        classNameLight: 'bg-green-100 text-green-700 border-green-300' 
      },
      warning: { 
        variant: 'outline' as const, 
        icon: AlertCircle, 
        classNameDark: 'bg-yellow-900/30 text-yellow-400 border-yellow-900/50',
        classNameLight: 'bg-yellow-100 text-yellow-700 border-yellow-300' 
      },
      critical: { 
        variant: 'destructive' as const, 
        icon: AlertCircle, 
        classNameDark: 'bg-red-900/30 text-red-400 border-red-900/50',
        classNameLight: 'bg-red-100 text-red-700 border-red-300' 
      },
      processing: { 
        variant: 'secondary' as const, 
        icon: Clock, 
        classNameDark: 'bg-blue-900/30 text-blue-400 border-blue-900/50',
        classNameLight: 'bg-blue-100 text-blue-700 border-blue-300' 
      }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.processing
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className={cn(
        "gap-1", 
        isDarkMode ? config.classNameDark : config.classNameLight
      )}>
        <Icon className="h-3 w-3" />
        {status.toUpperCase()}
      </Badge>
    )
  }

  // Format date for session display
  const formatSessionDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60))
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60))
        return minutes === 0 ? 'Just now' : `${minutes}m ago`
      }
      return `${hours}h ago`
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return `${days} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div className={cn("min-h-screen", isDarkMode && "dark")}>
      <div className={cn(
        "min-h-screen transition-colors duration-200",
        isDarkMode ? "bg-[#1f1f1f] text-white" : "bg-gray-50 text-gray-900"
      )}>
      <div className="w-full px-2 sm:px-3">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center flex-shrink-0">
              <IceCream className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div>
              <h1 className={cn("text-lg sm:text-xl font-bold", isDarkMode ? "text-white" : "text-gray-900")}>HERA Ice Cream Manager</h1>
              <p className={cn("text-xs hidden sm:block", isDarkMode ? "text-gray-400" : "text-gray-600")}>AI-Powered Cold Chain Operations</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn(
              "gap-1",
              isDarkMode 
                ? "bg-[#323232] text-gray-300 border-[#484848] hover:bg-[#3a3a3a]"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
            )}>
              <Shield className="h-3 w-3" />
              {currentOrganization?.name || 'Kochi Ice Cream Factory'}
            </Badge>
            <Badge className={cn(
              "gap-1",
              isDarkMode 
                ? "bg-[#323232] text-gray-300 border-[#484848] hover:bg-[#3a3a3a]"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
            )}>
              <Sparkles className="h-3 w-3" />
              Demo
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className={cn(
                "ml-2",
                isDarkMode 
                  ? "hover:bg-[#323232] text-gray-300"
                  : "hover:bg-gray-200 text-gray-700"
              )}
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex gap-3 h-[calc(100vh-90px)]">
          {/* Left Sidebar - Hidden on mobile, with its own scroll */}
          <div className="hidden lg:flex flex-col h-full overflow-hidden w-[280px] flex-shrink-0">
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {/* Chat History */}
              <Card className={cn(
                "shadow-lg",
                isDarkMode ? "bg-[#292929] border-[#3a3a3a]" : "bg-white border-gray-200"
              )}>
                <CardHeader className={cn(
                  "p-3 border-b",
                  isDarkMode ? "border-[#3a3a3a]" : "border-gray-200"
                )}>
                  <div className="flex items-center justify-between">
                    <CardTitle className={cn(
                      "text-sm flex items-center gap-2",
                      isDarkMode ? "text-white" : "text-gray-900"
                    )}>
                      <History className={cn("h-4 w-4", isDarkMode ? "text-gray-400" : "text-gray-600")} />
                      Chat History
                  </CardTitle>
                  <div className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={startNewSession}
                      className={cn(
                        "h-5 w-5",
                        isDarkMode ? "hover:bg-[#3a3a3a] text-gray-300" : "hover:bg-gray-100 text-gray-700"
                      )}
                      title="New Chat"
                    >
                      <Plus className="h-2.5 w-2.5" />
                    </Button>
                    <Sheet open={showHistory} onOpenChange={setShowHistory}>
                      <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className={cn(
                          "h-5 w-5",
                          isDarkMode ? "hover:bg-[#3a3a3a] text-gray-300" : "hover:bg-gray-100 text-gray-700"
                        )}>
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-[400px] sm:w-[540px] bg-[#292929] text-white border-l border-[#3a3a3a]">
                        <SheetHeader>
                          <SheetTitle className="text-white">All Conversations</SheetTitle>
                          <SheetDescription className="text-gray-400">
                            Search and manage your chat history
                          </SheetDescription>
                        </SheetHeader>
                        <div className="mt-6 space-y-4">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                              placeholder="Search conversations..."
                              value={searchTerm}
                              onChange={(e) => {
                                setSearchTerm(e.target.value)
                                loadSessions()
                              }}
                              className="pl-10 bg-[#1f1f1f] border-[#3a3a3a] text-white placeholder:text-gray-500 focus:border-[#0078d4]"
                            />
                          </div>
                          <ScrollArea className="h-[500px]">
                            <div className="space-y-2">
                              {sessions.map((session) => (
                                <Card
                                  key={session.id}
                                  className={cn(
                                    "cursor-pointer transition-colors",
                                    isDarkMode 
                                      ? "hover:bg-[#3a3a3a] bg-[#323232] border-[#484848]" 
                                      : "hover:bg-gray-100 bg-white border-gray-200"
                                  )}
                                  onClick={() => loadSession(session.id)}
                                >
                                  <CardContent className="p-3">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <h4 className={cn(
                                          "font-medium text-sm",
                                          isDarkMode ? "text-white" : "text-gray-900"
                                        )}>{session.title}</h4>
                                        <p className="text-xs text-gray-400 mt-1">
                                          {session.preview}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                          <Badge className="text-xs bg-[#1f1f1f] text-gray-300 border-[#3a3a3a]">
                                            {session.message_count} messages
                                          </Badge>
                                          <span className="text-xs text-gray-500">
                                            {formatSessionDate(session.end_time || session.start_time)}
                                          </span>
                                        </div>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-[#484848] text-gray-400"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setSessionToDelete(session.id)
                                          setShowDeleteDialog(true)
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </ScrollArea>
                          <div className="pt-4 border-t border-[#3a3a3a]">
                            <Button
                              variant="destructive"
                              onClick={() => setShowClearAllDialog(true)}
                              className="w-full bg-red-900/20 text-red-400 hover:bg-red-900/30 border-red-900/50"
                            >
                              Clear All History
                            </Button>
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-2">
                <ScrollArea className="h-[120px]">
                  <div className="space-y-1">
                    {sessions.slice(0, 5).map((session) => (
                      <div
                        key={session.id}
                        className={cn(
                          "p-1.5 rounded cursor-pointer hover:bg-[#3a3a3a] text-xs transition-colors",
                          session.id === currentSessionId && "bg-[#0078d4] hover:bg-[#0078d4]/80"
                        )}
                        onClick={() => loadSession(session.id)}
                      >
                        <div className="font-medium truncate text-white text-xs">{session.title}</div>
                        <div className="text-[10px] text-gray-400">
                          {formatSessionDate(session.end_time || session.start_time)}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className={cn(
              "shadow-lg",
              isDarkMode ? "bg-[#292929] border-[#3a3a3a]" : "bg-white border-gray-200"
            )}>
              <CardHeader className={cn(
                "p-2 border-b",
                isDarkMode ? "border-[#3a3a3a]" : "border-gray-200"
              )}>
                <CardTitle className={cn(
                  "text-xs flex items-center gap-1.5",
                  isDarkMode ? "text-white" : "text-gray-900"
                )}>
                  <Sparkles className="h-3 w-3 text-gray-400" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="space-y-1">
                  {QUICK_ACTIONS.map((action, idx) => (
                    <Button
                      key={idx}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-2 h-auto py-1.5 px-2 group transition-all",
                        isDarkMode 
                          ? "hover:bg-[#3a3a3a] text-gray-300" 
                          : "hover:bg-gray-100 text-gray-700"
                      )}
                      onClick={() => handleQuickAction(action)}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded bg-gradient-to-br flex items-center justify-center shadow-sm",
                        action.color
                      )}>
                        <action.icon className="h-3 w-3 text-white" />
                      </div>
                      <div className="text-left">
                        <div className={cn(
                          "font-medium text-xs",
                          isDarkMode ? "text-white" : "text-gray-900"
                        )}>{action.label}</div>
                        <div className="text-[10px] text-gray-400">{action.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Stats Overview */}
            <Card className={cn(
              "shadow-lg",
              isDarkMode ? "bg-[#292929] border-[#3a3a3a]" : "bg-white border-gray-200"
            )}>
              <CardHeader className={cn(
                "p-2 border-b",
                isDarkMode ? "border-[#3a3a3a]" : "border-gray-200"
              )}>
                <CardTitle className={cn(
                  "text-xs flex items-center gap-1.5",
                  isDarkMode ? "text-white" : "text-gray-900"
                )}>
                  <TrendingUp className="h-3 w-3 text-gray-400" />
                  Today's Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="grid grid-cols-2 gap-1.5">
                  {QUICK_METRICS.map((metric, idx) => {
                    // Define light mode gradient colors based on dark mode colors
                    const getLightGradient = (darkColor: string) => {
                      if (darkColor.includes('blue-600 to-cyan-400')) return 'from-blue-100 to-cyan-100'
                      if (darkColor.includes('purple-600 to-pink-400')) return 'from-purple-100 to-pink-100'
                      if (darkColor.includes('green-600 to-emerald-400')) return 'from-green-100 to-emerald-100'
                      if (darkColor.includes('orange-600 to-amber-400')) return 'from-orange-100 to-amber-100'
                      return darkColor // fallback
                    }

                    return (
                      <div key={idx} className={cn(
                        "p-2 rounded border",
                        isDarkMode 
                          ? "bg-[#323232] border-[#3a3a3a]" 
                          : "bg-gray-50 border-gray-200"
                      )}>
                        <div className="flex items-center gap-1.5">
                          <div className={cn(
                            "w-5 h-5 rounded bg-gradient-to-br flex items-center justify-center shadow-sm",
                            isDarkMode ? metric.color : getLightGradient(metric.color)
                          )}>
                            <metric.icon className={cn(
                              "h-2.5 w-2.5",
                              isDarkMode ? "text-white" : "text-gray-700"
                            )} />
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400">{metric.label}</p>
                            <p className={cn(
                              "font-semibold text-xs",
                              isDarkMode ? "text-white" : "text-gray-900"
                            )}>{metric.value}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
            </div>
          </div>
          
          {/* Chat Interface */}
          <Card className={cn(
            "flex-1 flex flex-col h-full shadow-lg",
            isDarkMode 
              ? "bg-[#292929] border-[#3a3a3a]"
              : "bg-white border-gray-200"
          )}>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col h-full">
              <CardHeader className={cn(
                "border-b p-3",
                isDarkMode ? "border-[#3a3a3a]" : "border-gray-200"
              )}>
                <div className="flex items-center justify-between">
                  {/* Mobile Menu Button */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="lg:hidden hover:bg-[#3a3a3a] text-gray-300"
                      >
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="bg-[#292929] border-[#3a3a3a] w-[280px] sm:w-[350px]">
                      <SheetHeader>
                        <SheetTitle className="text-white">Menu</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6 space-y-4">
                        {/* Chat History */}
                        <div>
                          <h3 className="text-sm font-medium text-gray-400 mb-3">Chat History</h3>
                          <ScrollArea className="h-[200px]">
                            <div className="space-y-2">
                              {sessions.map(session => (
                                <div
                                  key={session.id}
                                  className={cn(
                                    "p-3 rounded-lg cursor-pointer hover:bg-[#3a3a3a] text-sm transition-colors",
                                    session.id === currentSessionId && "bg-[#0078d4] hover:bg-[#0078d4]/80"
                                  )}
                                  onClick={() => {
                                    loadSession(session.id)
                                    // Close sheet after selecting
                                    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
                                  }}
                                >
                                  <div className="font-medium truncate text-white">{session.title}</div>
                                  <div className="text-xs text-gray-400">
                                    {formatSessionDate(session.end_time || session.start_time)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                        {/* Quick Actions */}
                        <div>
                          <h3 className="text-sm font-medium text-gray-400 mb-3">Quick Actions</h3>
                          <div className="space-y-2">
                            {QUICK_ACTIONS.map((action, idx) => (
                              <Button
                                key={idx}
                                variant="ghost"
                                className="w-full justify-start text-left hover:bg-[#3a3a3a] text-gray-300"
                                onClick={() => {
                                  setInput(action.prompt)
                                  inputRef.current?.focus()
                                  // Close sheet
                                  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
                                }}
                              >
                                <action.icon className={cn("h-4 w-4 mr-3", action.color)} />
                                <div className="text-sm">
                                  <p className="font-medium text-white">{action.label}</p>
                                  <p className="text-xs text-gray-400">{action.description}</p>
                                </div>
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                  
                  <TabsList className={cn(
                    "grid w-full max-w-[400px] grid-cols-3 p-1",
                    isDarkMode ? "bg-[#1f1f1f]" : "bg-gray-100"
                  )}>
                    <TabsTrigger value="chat" className={cn(
                      "gap-1 sm:gap-2 data-[state=active]:bg-[#0078d4] data-[state=active]:text-white text-xs sm:text-sm",
                      isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"
                    )}>
                      <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Chat</span>
                    </TabsTrigger>
                    <TabsTrigger value="production" className={cn(
                      "gap-1 sm:gap-2 data-[state=active]:bg-[#0078d4] data-[state=active]:text-white text-xs sm:text-sm",
                      isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"
                    )}>
                      <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Production</span>
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className={cn(
                      "gap-1 sm:gap-2 data-[state=active]:bg-[#0078d4] data-[state=active]:text-white text-xs sm:text-sm",
                      isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"
                    )}>
                      <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Analytics</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Model Settings */}
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2">
                            <Select value={selectedModel} onValueChange={(v: any) => setSelectedModel(v)}>
                              <SelectTrigger className="w-[120px] h-8 bg-[#1f1f1f] border-[#3a3a3a] text-white hover:bg-[#323232]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[#323232] border-[#484848]">
                                <SelectItem value="gpt-4" className="text-white hover:bg-[#3a3a3a]">GPT-4</SelectItem>
                                <SelectItem value="gpt-3.5" className="text-white hover:bg-[#3a3a3a]">GPT-3.5</SelectItem>
                                <SelectItem value="claude" className="text-white hover:bg-[#3a3a3a]">Claude</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-[#323232] text-white border-[#484848]">
                          <p>AI Model Selection</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#3a3a3a] text-gray-300">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-[#323232] text-white border-[#484848]">
                          <p>Advanced Settings</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </CardHeader>
              
              <TabsContent value="chat" className={cn(
                "flex-1 flex flex-col h-full overflow-hidden",
                isDarkMode ? "bg-[#1f1f1f]" : "bg-gray-50"
              )}>
                {/* Current Question Header - shows when getting response */}
                {loading && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
                  <div className={cn(
                    "flex-shrink-0 px-4 py-3 border-b",
                    isDarkMode ? "bg-[#292929] border-[#3a3a3a]" : "bg-gray-100 border-gray-200"
                  )}>
                    <p className="text-xs text-gray-500 mb-1">Current question:</p>
                    <p className={cn(
                      "text-sm font-medium line-clamp-2",
                      isDarkMode ? "text-gray-100" : "text-gray-800"
                    )}>
                      {messages[messages.length - 1].content}
                    </p>
                  </div>
                )}
                
                {/* Messages container - takes remaining space */}
                <div 
                  className={cn(
                    "flex-1 overflow-y-auto scroll-smooth",
                    isDarkMode ? "" : "bg-white"
                  )} 
                  ref={scrollAreaRef}
                  style={{ scrollBehavior: 'smooth' }}
                >
                  <div className="flex flex-col justify-end min-h-full px-4 sm:px-6 py-4">
                    <div className="space-y-4 sm:space-y-6">
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
                            "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0",
                            message.role === 'error' 
                              ? isDarkMode 
                                ? "bg-red-900/30 border border-red-900/50" 
                                : "bg-red-100 border border-red-300"
                              : isDarkMode
                                ? "bg-gradient-to-br from-blue-600/30 to-cyan-400/30 border border-blue-600/50"
                                : "bg-gradient-to-br from-blue-100 to-cyan-100 border border-blue-300"
                          )}>
                            {message.role === 'error' ? (
                              <AlertCircle className={cn(
                                "h-4 w-4 sm:h-5 sm:w-5",
                                isDarkMode ? "text-red-400" : "text-red-600"
                              )} />
                            ) : (
                              <IceCream className={cn(
                                "h-4 w-4 sm:h-5 sm:w-5",
                                isDarkMode ? "text-blue-400" : "text-blue-600"
                              )} />
                            )}
                          </div>
                        )}
                        
                        <div className={cn(
                          'flex-1 space-y-3',
                          message.role === 'user' && 'max-w-[85%] sm:max-w-[80%]'
                        )}>
                          <div className={cn(
                            'rounded-lg px-3 sm:px-4 py-2 sm:py-3',
                            message.role === 'user' 
                              ? isDarkMode
                                ? 'bg-[#1565C0] hover:bg-[#0D47A1] text-white ml-auto shadow-md transition-colors'
                                : 'bg-[#1976D2] hover:bg-[#1565C0] text-white ml-auto shadow-md transition-colors' 
                              : message.role === 'error'
                              ? isDarkMode
                                ? 'bg-red-900/20 text-red-400 border border-red-900/50'
                                : 'bg-red-50 text-red-700 border border-red-200'
                              : isDarkMode
                                ? 'bg-[#323232] text-gray-100 border border-[#3a3a3a]'
                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                          )}>
                            <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          </div>
                          
                          {/* Analytical Framework Stage */}
                          {message.analyticalFramework && (
                            <div className="flex items-center gap-2 text-xs mb-2">
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "gap-1",
                                  isDarkMode ? "bg-[#323232]" : "bg-white",
                                  message.analyticalFramework.stage === 'analyze' && (isDarkMode ? "border-blue-500 text-blue-400" : "border-blue-500 text-blue-600"),
                                  message.analyticalFramework.stage === 'investigate' && (isDarkMode ? "border-orange-500 text-orange-400" : "border-orange-500 text-orange-600"),
                                  message.analyticalFramework.stage === 'clarify' && (isDarkMode ? "border-yellow-500 text-yellow-400" : "border-yellow-500 text-yellow-600"),
                                  message.analyticalFramework.stage === 'target' && (isDarkMode ? "border-green-500 text-green-400" : "border-green-500 text-green-600"),
                                  message.analyticalFramework.stage === 'iterate' && (isDarkMode ? "border-purple-500 text-purple-400" : "border-purple-500 text-purple-600")
                                )}
                              >
                                {message.analyticalFramework.stage === 'analyze' && '🤔'}
                                {message.analyticalFramework.stage === 'investigate' && '🔍'}
                                {message.analyticalFramework.stage === 'clarify' && '❓'}
                                {message.analyticalFramework.stage === 'target' && '🎯'}
                                {message.analyticalFramework.stage === 'iterate' && '🔄'}
                                {message.analyticalFramework.stage.toUpperCase()}
                              </Badge>
                            </div>
                          )}
                          
                          {/* Status and Confidence */}
                          {(message.status || message.confidence) && (
                            <div className="flex items-center gap-2 text-xs">
                              {message.status && renderStatusBadge(message.status)}
                              {message.confidence !== undefined && (
                                <Badge variant="secondary" className={cn(
                                  "gap-1",
                                  isDarkMode 
                                    ? "bg-[#323232] text-gray-300 border-[#484848]"
                                    : "bg-gray-100 text-gray-700 border-gray-300"
                                )}>
                                  Confidence
                                  <span className="font-mono">{message.confidence}%</span>
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          {/* Action Buttons */}
                          {message.actions && message.actions.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {message.actions.map((action, actionIdx) => (
                                <Button
                                  key={actionIdx}
                                  variant={action.variant || 'outline'}
                                  size="sm"
                                  onClick={() => handleAction(action)}
                                  className={cn(
                                    "h-8",
                                    action.variant === 'outline' && (isDarkMode 
                                      ? "border-[#484848] text-gray-300 hover:bg-[#3a3a3a]" 
                                      : "border-gray-300 text-gray-700 hover:bg-gray-100"),
                                    action.variant === 'destructive' && (isDarkMode
                                      ? "bg-red-900/20 text-red-400 hover:bg-red-900/30 border-red-900/50"
                                      : "bg-red-50 text-red-600 hover:bg-red-100 border-red-300")
                                  )}
                                >
                                  {action.label}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {loading && (
                      <div className="flex gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center animate-pulse",
                          isDarkMode
                            ? "bg-gradient-to-br from-blue-600/30 to-cyan-400/30 border border-blue-600/50"
                            : "bg-gradient-to-br from-blue-100 to-cyan-100 border border-blue-300"
                        )}>
                          <IceCream className={cn(
                            "h-5 w-5",
                            isDarkMode ? "text-blue-400" : "text-blue-600"
                          )} />
                        </div>
                        <div className={cn(
                          "rounded-lg px-4 py-3",
                          isDarkMode
                            ? "bg-[#323232] text-gray-300 border border-[#3a3a3a]"
                            : "bg-gray-100 text-gray-800 border border-gray-200"
                        )}>
                          <div className="flex items-center gap-2">
                            <Loader2 className={cn(
                              "h-4 w-4 animate-spin",
                              isDarkMode ? "text-blue-400" : "text-blue-600"
                            )} />
                            <p className="text-sm">Analyzing ice cream operations...</p>
                          </div>
                          {confidence > 0 && (
                            <div className="mt-2">
                              <Progress value={confidence} className={cn(
                                "h-1.5",
                                isDarkMode ? "bg-[#1f1f1f]" : "bg-gray-200"
                              )} />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Example Prompts - inside messages area */}
                    {messages.length === 1 && (
                      <div className="mt-4 mb-2">
                        <p className="text-xs text-gray-400 mb-2 px-2">Try these:</p>
                        <div className="flex flex-wrap gap-2 px-2">
                          {EXAMPLE_PROMPTS.slice(0, 2).map((prompt, idx) => (
                            <Button
                              key={idx}
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setInput(prompt)
                                inputRef.current?.focus()
                              }}
                              className={cn(
                                "text-xs px-2 py-1",
                                isDarkMode 
                                  ? "border-[#484848] text-gray-300 hover:bg-[#3a3a3a] bg-[#292929]"
                                  : "border-gray-300 text-gray-700 hover:bg-gray-100 bg-white"
                              )}
                            >
                              <span className="truncate max-w-[200px] sm:max-w-none">{prompt}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Invisible element to scroll to */}
                    <div ref={messagesEndRef} />
                    </div>
                  </div>
                </div>
                
                {/* Scroll to bottom button */}
                {showScrollButton && (
                  <div className="absolute bottom-20 right-4 sm:bottom-24 sm:right-8 z-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={scrollToBottom}
                            size="default"
                            className="rounded-full shadow-lg bg-[#0078d4] hover:bg-[#0078d4]/90 transition-all hover:scale-105 pl-3 pr-4 text-white"
                          >
                            <ArrowDown className="h-4 w-4 mr-2" />
                            <span className="text-sm">New messages</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className={cn(
                          isDarkMode 
                            ? "bg-[#323232] text-white border-[#484848]"
                            : "bg-white text-gray-800 border-gray-200"
                        )}>
                          <p>Scroll to see latest messages</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
                
                
                {/* Input form - absolutely fixed at bottom */}
                <form ref={formRef} onSubmit={handleSubmit} className={cn(
                  "flex-shrink-0 p-4 border-t",
                  isDarkMode 
                    ? "border-[#3a3a3a] bg-[#292929]"
                    : "border-gray-200 bg-white"
                )}>
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value)
                        console.log('Input changed:', e.target.value)
                      }}
                      placeholder="Ask about production, inventory, cold chain, sales..."
                      className={cn(
                        "flex-1 focus:border-[#0078d4]",
                        isDarkMode 
                          ? "bg-[#1f1f1f] border-[#3a3a3a] text-white placeholder:text-gray-500"
                          : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                      )}
                      disabled={loading}
                    />
                    <Button 
                      type="submit" 
                      disabled={loading || !input.trim()}
                      className="min-w-[60px] bg-[#0078d4] hover:bg-[#0078d4]/90 text-white"
                      title={loading ? "Processing..." : !input.trim() ? "Enter a message" : "Send message"}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="production" className={cn(
                "flex-1 p-6",
                isDarkMode ? "bg-[#1f1f1f]" : "bg-gray-50"
              )}>
                <Alert className={cn(
                  isDarkMode 
                    ? "bg-[#323232] border-[#484848]"
                    : "bg-white border-gray-200"
                )}>
                  <Package className={cn(
                    "h-4 w-4",
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  )} />
                  <AlertDescription className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                    Production planning dashboard coming soon. Use the chat interface to plan production based on demand.
                  </AlertDescription>
                </Alert>
              </TabsContent>
              
              <TabsContent value="analytics" className={cn(
                "flex-1 p-6",
                isDarkMode ? "bg-[#1f1f1f]" : "bg-gray-50"
              )}>
                <Alert className={cn(
                  isDarkMode 
                    ? "bg-[#323232] border-[#484848]"
                    : "bg-white border-gray-200"
                )}>
                  <BarChart3 className={cn(
                    "h-4 w-4",
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  )} />
                  <AlertDescription className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                    Analytics dashboard coming soon. Use the chat interface for sales analysis and demand forecasting.
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

      </div>

      {/* Delete Session Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className={cn(
          isDarkMode 
            ? "bg-[#292929] border-[#3a3a3a]"
            : "bg-white border-gray-200"
        )}>
          <AlertDialogHeader>
            <AlertDialogTitle className={isDarkMode ? "text-white" : "text-gray-900"}>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
              Are you sure you want to delete this conversation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={cn(
              isDarkMode 
                ? "bg-[#323232] text-gray-300 border-[#484848] hover:bg-[#3a3a3a]"
                : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
            )}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (sessionToDelete) {
                  deleteSession(sessionToDelete)
                  setSessionToDelete(null)
                }
                setShowDeleteDialog(false)
              }}
              className={cn(
                isDarkMode 
                  ? "bg-red-900/20 text-red-400 hover:bg-red-900/30 border-red-900/50"
                  : "bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
              )}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All History Dialog */}
      <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
        <AlertDialogContent className={cn(
          isDarkMode 
            ? "bg-[#292929] border-[#3a3a3a]"
            : "bg-white border-gray-200"
        )}>
          <AlertDialogHeader>
            <AlertDialogTitle className={isDarkMode ? "text-white" : "text-gray-900"}>Clear All History</AlertDialogTitle>
            <AlertDialogDescription className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
              Are you sure you want to clear all chat history? This will delete all conversations permanently and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={cn(
              isDarkMode 
                ? "bg-[#323232] text-gray-300 border-[#484848] hover:bg-[#3a3a3a]"
                : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
            )}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clearAllHistory()
                setShowClearAllDialog(false)
              }}
              className={cn(
                isDarkMode 
                  ? "bg-red-900/20 text-red-400 hover:bg-red-900/30 border-red-900/50"
                  : "bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
              )}
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      </div>
    </div>
  )
}