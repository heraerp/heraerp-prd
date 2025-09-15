'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
  Send,
  Loader2,
  Moon,
  Sun,
  Shield,
  History,
  Plus,
  MessageSquare,
  Search,
  Trash2,
  Menu,
  ArrowDown,
  TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'

// HERA DNA Component Types
export interface HeraChatMessage {
  id: string
  role: 'user' | 'assistant' | 'error' | 'system'
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

export interface ActionButton {
  label: string
  action: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  data?: any
}

export interface QuickAction {
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  prompt: string
  color: string
}

export interface QuickMetric {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  trend?: number
  color: string
}

export interface HeraChatInterfaceProps {
  // Required props
  title: string
  subtitle: string
  apiEndpoint: string
  organizationId: string

  // Optional customization
  icon?: React.ComponentType<{ className?: string }>
  iconGradient?: string
  quickActions?: QuickAction[]
  quickMetrics?: QuickMetric[]
  examplePrompts?: string[]
  welcomeMessage?: string
  placeholder?: string

  // Feature flags
  enableHistory?: boolean
  enableAnalytics?: boolean
  enableProduction?: boolean
  enableDarkMode?: boolean
  defaultDarkMode?: boolean

  // Colors
  userMessageColorDark?: string
  userMessageColorLight?: string

  // Callbacks
  onMessageSent?: (message: string) => void
  onActionClicked?: (action: ActionButton) => void
}

// HERA DNA Chat Interface Component
export function HeraChatInterface({
  title,
  subtitle,
  apiEndpoint,
  organizationId,
  icon: Icon,
  iconGradient = 'from-blue-600 to-cyan-400',
  quickActions = [],
  quickMetrics = [],
  examplePrompts = [],
  welcomeMessage,
  placeholder = 'Type your message...',
  enableHistory = true,
  enableAnalytics = false,
  enableProduction = false,
  enableDarkMode = true,
  defaultDarkMode = true,
  userMessageColorDark = 'from-[#0EA5E9] to-[#2563EB]',
  userMessageColorLight = 'from-[#3B82F6] to-[#1E40AF]',
  onMessageSent,
  onActionClicked
}: HeraChatInterfaceProps) {
  const [isDarkMode, setIsDarkMode] = useState(defaultDarkMode)
  const [messages, setMessages] = useState<HeraChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: welcomeMessage || `Welcome to ${title}! How can I help you today?`,
      timestamp: new Date()
    }
  ])

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('chat')
  const [confidence, setConfidence] = useState<number>(0)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [isUserScrolling, setIsUserScrolling] = useState(false)

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

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

      if (!checkIfAtBottom()) {
        setIsUserScrolling(true)
        clearTimeout(scrollTimeout)
        scrollTimeout = setTimeout(() => {
          setIsUserScrolling(false)
        }, 1500)
      } else {
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
    if (enableDarkMode) {
      setIsDarkMode(!isDarkMode)
    }
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      const shouldAutoScroll =
        messages.length === 1 ||
        lastMessage?.role === 'user' ||
        (!isUserScrolling && checkIfAtBottom())

      if (shouldAutoScroll) {
        setTimeout(scrollToBottom, 100)
      }
    }
  }, [messages, scrollToBottom, isUserScrolling, checkIfAtBottom])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedInput = input.trim()
    if (!trimmedInput || loading) return

    const userMessage: HeraChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedInput,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setConfidence(0)

    if (onMessageSent) {
      onMessageSent(trimmedInput)
    }

    try {
      // Simulate confidence building
      const confidenceInterval = setInterval(() => {
        setConfidence(prev => Math.min(prev + 15, 90))
      }, 100)

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmedInput,
          organizationId,
          context: {
            mode: activeTab
          }
        })
      })

      clearInterval(confidenceInterval)
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      const assistantMessage: HeraChatMessage = {
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
    } catch (error) {
      const errorMessage: HeraChatMessage = {
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
    if (onActionClicked) {
      onActionClicked(action)
    }
  }

  // Handle quick action clicks
  const handleQuickAction = (quickAction: QuickAction) => {
    setInput(quickAction.prompt)
    inputRef.current?.focus()
  }

  // Helper function to get light gradient colors
  const getLightGradient = (darkColor: string) => {
    if (darkColor.includes('blue-600 to-cyan-400')) return 'from-blue-100 to-cyan-100'
    if (darkColor.includes('purple-600 to-pink-400')) return 'from-purple-100 to-pink-100'
    if (darkColor.includes('green-600 to-emerald-400')) return 'from-green-100 to-emerald-100'
    if (darkColor.includes('orange-600 to-amber-400')) return 'from-orange-100 to-amber-100'
    if (darkColor.includes('indigo-600 to-purple-400')) return 'from-indigo-100 to-purple-100'
    return darkColor
  }

  return (
    <div
      className={cn('min-h-screen', isDarkMode && 'dark')}
      style={{ backgroundColor: isDarkMode ? '#1a1a1a' : '#f3f4f6' }}
    >
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div
          className={cn(
            'flex items-center justify-between p-4 border-b',
            isDarkMode ? 'bg-[#1f1f1f] border-[#3a3a3a]' : 'bg-white border-gray-200'
          )}
        >
          <div className="flex items-center gap-3">
            {Icon && (
              <div
                className={cn(
                  'w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center',
                  iconGradient
                )}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
            )}
            <div>
              <h1
                className={cn('text-xl font-semibold', isDarkMode ? 'text-white' : 'text-gray-900')}
              >
                {title}
              </h1>
              <p className={cn('text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>
                {subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Shield className="h-3 w-3" />
              Enterprise
            </Badge>
            {enableDarkMode && (
              <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div
            className="w-[280px] border-r flex flex-col"
            style={{ backgroundColor: isDarkMode ? '#1f1f1f' : '#ffffff' }}
          >
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {/* Quick Actions */}
              {quickActions.length > 0 && (
                <Card
                  className={cn(
                    'shadow-sm',
                    isDarkMode ? 'bg-[#292929] border-[#3a3a3a]' : 'bg-white border-gray-200'
                  )}
                >
                  <CardHeader
                    className={cn(
                      'p-2 border-b',
                      isDarkMode ? 'border-[#3a3a3a]' : 'border-gray-200'
                    )}
                  >
                    <CardTitle
                      className={cn(
                        'text-xs flex items-center gap-1.5',
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      )}
                    >
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    <div className="space-y-1">
                      {quickActions.map((action, idx) => (
                        <Button
                          key={idx}
                          variant="ghost"
                          className={cn(
                            'w-full justify-start gap-2 h-auto py-1.5 px-2 group transition-all',
                            isDarkMode
                              ? 'hover:bg-[#3a3a3a] text-gray-300'
                              : 'hover:bg-gray-100 text-gray-700'
                          )}
                          onClick={() => handleQuickAction(action)}
                        >
                          <div
                            className={cn(
                              'w-6 h-6 rounded bg-gradient-to-br flex items-center justify-center shadow-sm',
                              isDarkMode ? action.color : getLightGradient(action.color)
                            )}
                          >
                            <action.icon
                              className={cn('h-3 w-3', isDarkMode ? 'text-white' : 'text-gray-700')}
                            />
                          </div>
                          <div className="text-left">
                            <div
                              className={cn(
                                'font-medium text-xs',
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              )}
                            >
                              {action.label}
                            </div>
                            <div className="text-[10px] text-gray-400">{action.description}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Today's Metrics */}
              {quickMetrics.length > 0 && (
                <Card
                  className={cn(
                    'shadow-sm',
                    isDarkMode ? 'bg-[#292929] border-[#3a3a3a]' : 'bg-white border-gray-200'
                  )}
                >
                  <CardHeader
                    className={cn(
                      'p-2 border-b',
                      isDarkMode ? 'border-[#3a3a3a]' : 'border-gray-200'
                    )}
                  >
                    <CardTitle
                      className={cn(
                        'text-xs flex items-center gap-1.5',
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      )}
                    >
                      <TrendingUp className="h-3 w-3 text-gray-400" />
                      Today's Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    <div className="grid grid-cols-2 gap-1.5">
                      {quickMetrics.map((metric, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            'p-2 rounded border',
                            isDarkMode
                              ? 'bg-[#323232] border-[#3a3a3a]'
                              : 'bg-gray-50 border-gray-200'
                          )}
                        >
                          <div className="flex items-center gap-1.5">
                            <div
                              className={cn(
                                'w-5 h-5 rounded bg-gradient-to-br flex items-center justify-center shadow-sm',
                                isDarkMode ? metric.color : getLightGradient(metric.color)
                              )}
                            >
                              <metric.icon
                                className={cn(
                                  'h-2.5 w-2.5',
                                  isDarkMode ? 'text-white' : 'text-gray-700'
                                )}
                              />
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400">{metric.label}</p>
                              <p
                                className={cn(
                                  'font-semibold text-xs',
                                  isDarkMode ? 'text-white' : 'text-gray-900'
                                )}
                              >
                                {metric.value}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Chat Interface */}
          <Card
            className={cn(
              'flex-1 flex flex-col border-0 rounded-none',
              isDarkMode ? 'bg-[#292929]' : 'bg-white'
            )}
          >
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col h-full"
            >
              <CardHeader
                className={cn('border-b p-3', isDarkMode ? 'border-[#3a3a3a]' : 'border-gray-200')}
              >
                <TabsList
                  className={cn(
                    'grid w-full max-w-[400px] grid-cols-3 p-1',
                    isDarkMode ? 'bg-[#1f1f1f]' : 'bg-gray-100'
                  )}
                >
                  <TabsTrigger
                    value="chat"
                    className={cn(
                      'gap-1 sm:gap-2 data-[state=active]:bg-[#0078d4] data-[state=active]:text-white text-xs sm:text-sm',
                      isDarkMode
                        ? 'text-gray-300 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    Chat
                  </TabsTrigger>
                  {enableProduction && (
                    <TabsTrigger
                      value="production"
                      className={cn(
                        'gap-1 sm:gap-2 data-[state=active]:bg-[#0078d4] data-[state=active]:text-white text-xs sm:text-sm',
                        isDarkMode
                          ? 'text-gray-300 hover:text-white'
                          : 'text-gray-600 hover:text-gray-900'
                      )}
                    >
                      Production
                    </TabsTrigger>
                  )}
                  {enableAnalytics && (
                    <TabsTrigger
                      value="analytics"
                      className={cn(
                        'gap-1 sm:gap-2 data-[state=active]:bg-[#0078d4] data-[state=active]:text-white text-xs sm:text-sm',
                        isDarkMode
                          ? 'text-gray-300 hover:text-white'
                          : 'text-gray-600 hover:text-gray-900'
                      )}
                    >
                      Analytics
                    </TabsTrigger>
                  )}
                </TabsList>
              </CardHeader>

              <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden">
                {/* Current Question Header */}
                {loading &&
                  messages.length > 0 &&
                  messages[messages.length - 1]?.role === 'user' && (
                    <div
                      className={cn(
                        'flex-shrink-0 px-4 py-3 border-b',
                        isDarkMode ? 'bg-[#292929] border-[#3a3a3a]' : 'bg-gray-100 border-gray-200'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className="animate-pulse">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                        <p
                          className={cn(
                            'text-sm font-medium',
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          )}
                        >
                          {messages[messages.length - 1].content}
                        </p>
                      </div>
                    </div>
                  )}

                {/* Messages Area */}
                <ScrollArea className="flex-1" ref={scrollAreaRef}>
                  <div className="px-4 py-4 space-y-4">
                    {messages.map(message => (
                      <div
                        key={message.id}
                        className={cn(
                          'flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300',
                          message.role === 'user' && 'justify-end'
                        )}
                      >
                        {message.role !== 'user' && (
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                              message.role === 'error'
                                ? 'bg-red-500/20'
                                : isDarkMode
                                  ? 'bg-[#323232]'
                                  : 'bg-gray-100'
                            )}
                          >
                            {Icon ? (
                              <Icon
                                className={cn(
                                  'h-4 w-4',
                                  message.role === 'error'
                                    ? 'text-red-500'
                                    : isDarkMode
                                      ? 'text-gray-400'
                                      : 'text-gray-600'
                                )}
                              />
                            ) : (
                              <div className="w-4 h-4 bg-gray-400 rounded" />
                            )}
                          </div>
                        )}

                        <div className={cn('flex-1', message.role === 'user' && 'max-w-[80%]')}>
                          <div
                            className={cn(
                              'rounded-lg px-4 py-3 relative overflow-hidden',
                              message.role === 'user'
                                ? '' // No background class, will use gradient
                                : message.role === 'error'
                                  ? isDarkMode
                                    ? 'bg-red-900/20 text-red-400'
                                    : 'bg-red-50 text-red-600'
                                  : isDarkMode
                                    ? 'bg-[#323232] text-gray-100'
                                    : 'bg-gray-100 text-gray-900'
                            )}
                            style={
                              message.role === 'user'
                                ? {
                                    background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))`,
                                    backgroundImage: `linear-gradient(135deg, ${isDarkMode ? userMessageColorDark : userMessageColorLight})`
                                  }
                                : {}
                            }
                          >
                            <p
                              className={cn(
                                'text-sm whitespace-pre-wrap relative z-10',
                                message.role === 'user' && 'text-white'
                              )}
                            >
                              {message.content}
                            </p>

                            {/* Actions */}
                            {message.actions && message.actions.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {message.actions.map((action, actionIdx) => (
                                  <Button
                                    key={actionIdx}
                                    variant={action.variant || 'outline'}
                                    size="sm"
                                    onClick={() => handleAction(action)}
                                    className="h-7 text-xs"
                                  >
                                    {action.label}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>

                          <div
                            className={cn(
                              'text-xs mt-1',
                              isDarkMode ? 'text-gray-500' : 'text-gray-400'
                            )}
                          >
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}

                    {loading && (
                      <div className="flex gap-3">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center animate-pulse',
                            isDarkMode ? 'bg-[#323232]' : 'bg-gray-100'
                          )}
                        >
                          {Icon && (
                            <Icon
                              className={cn(
                                'h-4 w-4',
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                              )}
                            />
                          )}
                        </div>
                        <div
                          className={cn(
                            'rounded-lg px-4 py-3',
                            isDarkMode ? 'bg-[#323232]' : 'bg-gray-100'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                            <p
                              className={cn(
                                'text-sm',
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              )}
                            >
                              Processing...
                            </p>
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
                {messages.length === 1 && examplePrompts.length > 0 && (
                  <div
                    className={cn(
                      'flex-shrink-0 px-4 pb-4',
                      isDarkMode ? 'bg-[#292929]' : 'bg-white'
                    )}
                  >
                    <p
                      className={cn('text-xs mb-2', isDarkMode ? 'text-gray-500' : 'text-gray-400')}
                    >
                      Try these examples:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {examplePrompts.slice(0, 3).map((prompt, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setInput(prompt)
                            inputRef.current?.focus()
                          }}
                          className={cn(
                            'text-xs',
                            isDarkMode
                              ? 'border-[#484848] hover:bg-[#3a3a3a] text-gray-300'
                              : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                          )}
                        >
                          {prompt}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Form */}
                <form
                  ref={formRef}
                  onSubmit={handleSubmit}
                  className={cn(
                    'flex-shrink-0 p-4 border-t',
                    isDarkMode ? 'bg-[#292929] border-[#3a3a3a]' : 'bg-white border-gray-200'
                  )}
                >
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      placeholder={placeholder}
                      className={cn(
                        'flex-1',
                        isDarkMode
                          ? 'bg-[#1f1f1f] border-[#3a3a3a] text-white placeholder:text-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
                      )}
                      disabled={loading}
                    />
                    <Button
                      type="submit"
                      disabled={loading || !input.trim()}
                      className="min-w-[60px] bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </form>

                {/* Scroll to Bottom Button */}
                {showScrollButton && (
                  <Button
                    size="icon"
                    onClick={scrollToBottom}
                    className={cn(
                      'absolute bottom-20 right-6 rounded-full shadow-lg',
                      isDarkMode
                        ? 'bg-[#0078d4] hover:bg-[#106ebe] text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    )}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                )}
              </TabsContent>

              {enableProduction && (
                <TabsContent value="production" className="flex-1 p-6">
                  <Alert>
                    <AlertDescription>Production interface coming soon.</AlertDescription>
                  </Alert>
                </TabsContent>
              )}

              {enableAnalytics && (
                <TabsContent value="analytics" className="flex-1 p-6">
                  <Alert>
                    <AlertDescription>Analytics dashboard coming soon.</AlertDescription>
                  </Alert>
                </TabsContent>
              )}
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Export as HERA DNA Component
export const HERA_CHAT_INTERFACE_DNA = {
  id: 'HERA.UI.CHAT.INTERFACE.v1',
  name: 'HERA Chat Interface',
  description:
    'Enterprise-grade chat interface with dark/light themes, auto-scroll, metrics, and quick actions',
  component: HeraChatInterface,
  category: 'ui',
  tags: ['chat', 'ai', 'interface', 'dark-mode', 'auto-scroll', 'enterprise'],
  version: '1.0.0',
  author: 'HERA Team',
  features: [
    'Dark/Light theme support with smooth transitions',
    'Auto-scroll with intelligent user detection',
    'Scroll-to-bottom button when not at bottom',
    'Current question header during AI processing',
    'WhatsApp-style fixed input with scrollable messages',
    'Quick actions sidebar with gradient icons',
    "Today's metrics dashboard with conditional styling",
    'Chat history management (optional)',
    'Multi-tab support (chat, production, analytics)',
    'Responsive design with mobile support',
    'Example prompts for easy onboarding',
    'Action buttons on messages',
    'Confidence indicators',
    'Error handling',
    'Deep Blue gradient for user messages',
    'Proper contrast in both themes'
  ]
}
