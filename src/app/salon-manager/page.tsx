'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Sparkles,
  Send,
  Loader2,
  Calendar,
  Package,
  DollarSign,
  Users,
  Gift,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Moon,
  Sun,
  Shield,
  Scissors,
  UserCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'error'
  content: string
  timestamp: Date
  data?: any
  appointmentId?: string
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
    icon: Calendar,
    label: 'Book Appointment',
    description: 'Schedule client services',
    prompt: 'Book appointment for ',
    color: 'from-blue-600 to-blue-400'
  },
  {
    icon: Package,
    label: 'Check Inventory',
    description: 'View product stock levels',
    prompt: 'Check inventory levels',
    color: 'from-purple-600 to-purple-400'
  },
  {
    icon: DollarSign,
    label: 'Today\'s Revenue',
    description: 'View sales performance',
    prompt: 'Show today\'s revenue',
    color: 'from-green-600 to-green-400'
  },
  {
    icon: Users,
    label: 'Staff Performance',
    description: 'Calculate commissions',
    prompt: 'Show staff performance this week',
    color: 'from-orange-600 to-orange-400'
  },
  {
    icon: Gift,
    label: 'Birthday Clients',
    description: 'Monthly birthday list',
    prompt: 'Show birthday clients this month',
    color: 'from-pink-600 to-pink-400'
  },
  {
    icon: Clock,
    label: 'Available Slots',
    description: 'Check open appointments',
    prompt: 'Show available slots today',
    color: 'from-cyan-600 to-cyan-400'
  }
]

const EXAMPLE_PROMPTS = [
  'Book Sarah Johnson for highlights tomorrow at 2pm',
  'Who\'s available for a haircut today?',
  'Check blonde toner stock',
  'Calculate Emily\'s commission this week',
  'Show revenue for last month',
  'Find quiet times for promotions'
]

export default function SalonManagerPage() {
  const router = useRouter()
  const { currentOrganization, isAuthenticated } = useMultiOrgAuth()
  const [isDarkMode, setIsDarkMode] = useState(false)
  
  const organizationId = currentOrganization?.id || '550e8400-e29b-41d4-a716-446655440000' // Default salon org
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `✨ Welcome to HERA Salon Manager!

I'm your AI assistant for all salon operations with **analytical thinking**!

📅 **Appointments** - Book and manage client appointments
📦 **Inventory** - Track product stock levels
💰 **Revenue** - Analyze sales and performance
👥 **Staff** - Calculate commissions and track performance
🎂 **Clients** - Birthday lists and customer management
📊 **Analytics** - Business insights and recommendations

**🤖 My Analytical Process:**
🤔 **Analyze** - I understand your request
🔍 **Investigate** - I explore the data
❓ **Clarify** - I ask questions if needed
🎯 **Target** - I provide focused solutions
🔄 **Iterate** - I refine based on your feedback

Just tell me what you need in natural language. I'll ask for clarification if needed!

How can I help you today?`,
      timestamp: new Date()
    }
  ])
  
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'appointments' | 'analytics'>('chat')
  const [confidence, setConfidence] = useState<number>(0)
  
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

    try {
      // Simulate confidence building
      const confidenceInterval = setInterval(() => {
        setConfidence(prev => Math.min(prev + 15, 90))
      }, 100)

      const response = await fetch('/api/v1/salon-manager/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmedInput,
          organizationId,
          context: {
            mode: activeTab,
            userId: 'user-123' // In production, get from auth
          }
        }),
      })

      clearInterval(confidenceInterval)
      const data = await response.json()
      
      console.log('Salon API Response:', data)
      
      if (data.error) {
        throw new Error(data.error)
      }

      // Create assistant response with actions
      const assistantMessage: Message = {
        id: Date.now().toString() + '-response',
        role: 'assistant',
        content: data.message || data.response || 'Operation completed.',
        data: data.result || data.data,
        appointmentId: data.appointmentId,
        status: data.status,
        confidence: data.confidence || 90,
        timestamp: new Date(),
        actions: data.actions,
        analyticalFramework: data.analyticalFramework
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
      setConfidence(0)
    } finally {
      setLoading(false)
      setConfidence(0)
    }
  }

  // Handle action button clicks
  const handleAction = async (action: ActionButton) => {
    if (action.action === 'book') {
      setInput('Book appointment')
      inputRef.current?.focus()
    } else if (action.action === 'view') {
      setInput(`View appointment ${action.data?.appointmentId}`)
      setTimeout(() => {
        const form = formRef.current
        if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
        }
      }, 100)
    } else if (action.action === 'order') {
      setInput('Order low stock items')
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
      scheduled: { variant: 'outline' as const, icon: Clock },
      confirmed: { variant: 'default' as const, icon: UserCheck },
      completed: { variant: 'default' as const, icon: CheckCircle2 },
      cancelled: { variant: 'destructive' as const, icon: AlertCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled
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
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-400 flex items-center justify-center">
              <Scissors className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">HERA Salon Manager</h1>
              <p className="text-sm text-muted-foreground">AI-Powered Salon Operations</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Shield className="h-3 w-3" />
              {currentOrganization?.name || 'Dubai Luxury Salon'}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="ml-2"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-2">
                  {QUICK_ACTIONS.map((action, idx) => (
                    <Button
                      key={idx}
                      variant="ghost"
                      className="w-full justify-start gap-3 h-auto py-3 px-3 hover:bg-gradient-to-r hover:text-white group"
                      onClick={() => handleQuickAction(action)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = `linear-gradient(to right, var(--tw-gradient-stops))`
                        e.currentTarget.classList.add(action.color.split(' ')[0], action.color.split(' ')[2])
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = ''
                        e.currentTarget.classList.remove(action.color.split(' ')[0], action.color.split(' ')[2])
                      }}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
                        action.color
                      )}>
                        <action.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{action.label}</div>
                        <div className="text-xs opacity-80">{action.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Stats Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Today's Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Appointments</span>
                      <span className="font-medium">12</span>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Revenue</span>
                      <span className="font-medium">$2,450</span>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Products Sold</span>
                      <span className="font-medium">8</span>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Walk-ins</span>
                      <span className="font-medium">3</span>
                    </div>
                  </div>
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
                    <Sparkles className="h-4 w-4" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="appointments" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    Appointments
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Analytics
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
                              : "bg-gradient-to-br from-purple-600/20 to-pink-400/20"
                          )}>
                            {message.role === 'error' ? (
                              <AlertCircle className="h-5 w-5 text-destructive" />
                            ) : (
                              <Scissors className="h-5 w-5 text-purple-600" />
                            )}
                          </div>
                        )}
                        
                        <div className={cn(
                          'flex-1 space-y-3',
                          message.role === 'user' && 'max-w-[80%]'
                        )}>
                          <div className={cn(
                            'rounded-lg px-4 py-3',
                            message.role === 'user' 
                              ? 'bg-primary text-primary-foreground ml-auto' 
                              : message.role === 'error'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-muted'
                          )}>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                          
                          {/* Analytical Framework Stage */}
                          {message.analyticalFramework && (
                            <div className="flex items-center gap-2 text-xs mb-2">
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "gap-1",
                                  message.analyticalFramework.stage === 'analyze' && "border-blue-500 text-blue-600",
                                  message.analyticalFramework.stage === 'investigate' && "border-orange-500 text-orange-600",
                                  message.analyticalFramework.stage === 'clarify' && "border-yellow-500 text-yellow-600",
                                  message.analyticalFramework.stage === 'target' && "border-green-500 text-green-600",
                                  message.analyticalFramework.stage === 'iterate' && "border-purple-500 text-purple-600"
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
                              {message.appointmentId && (
                                <span className="text-muted-foreground">
                                  Appointment: {message.appointmentId}
                                </span>
                              )}
                              {message.status && renderStatusBadge(message.status)}
                              {message.confidence !== undefined && (
                                <Badge variant="secondary" className="gap-1">
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
                                  className="h-8"
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
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-400/20 flex items-center justify-center animate-pulse">
                          <Scissors className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="bg-muted rounded-lg px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <p className="text-sm">Processing salon request...</p>
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
                          onClick={() => {
                            setInput(prompt)
                            inputRef.current?.focus()
                          }}
                          className="text-xs"
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
                      onChange={(e) => {
                        setInput(e.target.value)
                        console.log('Input changed:', e.target.value)
                      }}
                      placeholder="Book appointments, check inventory, view revenue..."
                      className="flex-1"
                      disabled={loading}
                    />
                    <Button 
                      type="submit" 
                      disabled={loading || !input.trim()}
                      className="min-w-[60px]"
                      title={loading ? "Processing..." : !input.trim() ? "Enter a message" : "Send message"}
                      onClick={(e) => {
                        console.log('Button clicked!', {
                          loading,
                          input,
                          trimmedInput: input.trim(),
                          isDisabled: loading || !input.trim()
                        })
                      }}
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
              
              <TabsContent value="appointments" className="flex-1 p-6">
                <Alert>
                  <Calendar className="h-4 w-4" />
                  <AlertDescription>
                    Appointment calendar coming soon. Use the chat interface to book and manage appointments.
                  </AlertDescription>
                </Alert>
              </TabsContent>
              
              <TabsContent value="analytics" className="flex-1 p-6">
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    Analytics dashboard coming soon. Use the chat interface for revenue and performance reports.
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Powered By */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Powered by HERA Universal Architecture
        </div>
      </div>
    </div>
  )
}