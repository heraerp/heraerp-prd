'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
/**
 * HERA Furniture AI Manager
 * Smart Code: HERA.FURNITURE.AI.MANAGER.v1
 *
 * AI-powered business intelligence and management system
 * Natural language business operations for furniture manufacturers
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
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  Factory,
  DollarSign,
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  BarChart3,
  LineChart,
  Target,
  Lightbulb,
  Zap,
  Shield,
  FileText,
  Settings,
  ArrowRight,
  Bot,
  Sparkles,
  Building,
  Clock,
  Calendar,
  AlertTriangle,
  Activity,
  Layers,
  UserCheck,
  Truck,
  Wrench,
  PieChart,
  Database,
  Briefcase,
  ChevronRight,
  Star,
  Award,
  TrendingUp as TrendUp,
  MessageSquare,
  HelpCircle,
  Eye,
  Calculator,
  ListChecks,
  Gauge,
  ChartBar,
  Workflow
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AIMessage {
  id: string
  type: 'user' | 'assistant' | 'system' | 'insight'
  content: string
  timestamp: Date
  category?: 'operations' | 'sales' | 'inventory' | 'finance' | 'hr' | 'strategy'
  priority?: 'high' | 'medium' | 'low'
  actionable?: boolean
  metrics?: {
    label: string
    value: string | number
    trend?: 'up' | 'down' | 'stable'
    change?: number
  }[]
  recommendations?: {
    title: string
    description: string
    impact: 'high' | 'medium' | 'low'
    action?: () => void
  }[]
  visualData?: {
    type: 'chart' | 'metric' | 'list'
    data: any
  }
}

interface BusinessMetric {
  id: string
  label: string
  value: string | number
  change: number
  trend: 'up' | 'down' | 'stable'
  icon: React.ElementType
  color: string
  category: string
}

interface QuickInsight {
  icon: React.ElementType
  label: string
  query: string
  color: string
  category: string
}

// Real-time business metrics
const BUSINESS_METRICS: BusinessMetric[] = [
  {
    id: 'revenue',
    label: 'Monthly Revenue',
    value: '₹52.4L',
    change: 12.5,
    trend: 'up',
    icon: DollarSign,
    color: 'text-green-500',
    category: 'finance'
  },
  {
    id: 'orders',
    label: 'Active Orders',
    value: 47,
    change: 8.2,
    trend: 'up',
    icon: ShoppingCart,
    color: 'text-blue-500',
    category: 'sales'
  },
  {
    id: 'production',
    label: 'Production Capacity',
    value: '78%',
    change: -5.1,
    trend: 'down',
    icon: Factory,
    color: 'text-orange-500',
    category: 'operations'
  },
  {
    id: 'inventory',
    label: 'Inventory Health',
    value: 'Good',
    change: 15.3,
    trend: 'up',
    icon: Package,
    color: 'text-purple-500',
    category: 'inventory'
  },
  {
    id: 'staff',
    label: 'Team Efficiency',
    value: '92%',
    change: 3.2,
    trend: 'up',
    icon: Users,
    color: 'text-cyan-500',
    category: 'hr'
  },
  {
    id: 'cashflow',
    label: 'Cash Position',
    value: '₹18.7L',
    change: -2.8,
    trend: 'down',
    icon: Briefcase,
    color: 'text-indigo-500',
    category: 'finance'
  }
]

// AI-powered quick insights
const QUICK_INSIGHTS: QuickInsight[] = [
  {
    icon: TrendUp,
    label: 'Revenue Analysis',
    query: 'Analyze revenue trends and give recommendations',
    color: 'text-green-600',
    category: 'finance'
  },
  {
    icon: AlertTriangle,
    label: 'Risk Assessment',
    query: 'What are the current business risks?',
    color: 'text-red-600',
    category: 'strategy'
  },
  {
    icon: Target,
    label: 'Goal Progress',
    query: 'How are we performing against monthly targets?',
    color: 'text-primary',
    category: 'operations'
  },
  {
    icon: Package,
    label: 'Inventory Insights',
    query: 'Which items need restocking?',
    color: 'text-purple-600',
    category: 'inventory'
  },
  {
    icon: Users,
    label: 'Team Performance',
    query: 'Show team productivity analysis',
    color: 'text-cyan-600',
    category: 'hr'
  },
  {
    icon: Lightbulb,
    label: 'Growth Ideas',
    query: 'Suggest growth opportunities',
    color: 'text-yellow-600',
    category: 'strategy'
  }
]

// Management categories
const MANAGEMENT_CATEGORIES = [
  { id: 'overview', label: 'Overview', icon: Gauge },
  { id: 'operations', label: 'Operations', icon: Factory },
  { id: 'sales', label: 'Sales', icon: ShoppingCart },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'team', label: 'Team', icon: Users }
]

export default function FurnitureAIManagerPage() {
  const router = useRouter()
  const { isAuthenticated, contextLoading } = useMultiOrgAuth()
  const { organizationId, organizationName, orgLoading } = useFurnitureOrg()

  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: `Hello! I'm your AI Business Manager for ${organizationName || 'your furniture business'}. I provide real-time insights and help you make data-driven decisions.

I can help you with:
• 📊 Business performance analysis
• 🎯 Goal tracking and recommendations
• ⚠️ Risk identification and mitigation
• 💡 Growth opportunity suggestions
• 👥 Team performance optimization
• 📦 Inventory management insights

What would you like to know about your business today?`,
      timestamp: new Date(),
      category: 'strategy',
      actionable: true
    }
  ])

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState('overview')
  const [useMCP, setUseMCP] = useState(true)
  const [showMetrics, setShowMetrics] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom
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

  // Simulate real-time metric updates
  useEffect(() => {
    const interval = setInterval(() => {
      // In production, this would fetch real data
      // For now, we'll just slightly modify the metrics
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const processAIQuery = async (text: string) => {
    setLoading(true)

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])

    try {
      // Call the AI manager API
      const response = await fetch('/api/v1/furniture/ai-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: text,
          organizationId: organizationId,
          context: {
            category: activeCategory,
            metrics: BUSINESS_METRICS,
            organizationName
          },
          useMCP: useMCP
        })
      })

      if (!response.ok) {
        throw new Error('Failed to process query')
      }

      const data = await response.json()

      const assistantMessage: AIMessage = {
        id: Date.now().toString(),
        type: data.type || 'assistant',
        content: data.message,
        timestamp: new Date(),
        category: data.category,
        priority: data.priority,
        actionable: data.actionable,
        metrics: data.metrics,
        recommendations: data.recommendations,
        visualData: data.visualData
      }

      setMessages(prev => [...prev, assistantMessage])

      // If there are critical insights, add them as separate messages
      if (data.insights && data.insights.length > 0) {
        data.insights.forEach((insight: any, index: number) => {
          setTimeout(
            () => {
              const insightMessage: AIMessage = {
                id: `insight-${Date.now()}-${index}`,
                type: 'insight',
                content: insight.content,
                timestamp: new Date(),
                category: insight.category,
                priority: insight.priority,
                actionable: true
              }
              setMessages(prev => [...prev, insightMessage])
            },
            500 * (index + 1)
          )
        })
      }
    } catch (error) {
      const errorMessage: AIMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'I had trouble analyzing that. Please try rephrasing your question.',
        timestamp: new Date(),
        priority: 'low'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
      setInput('')
      inputRef.current?.focus()
    }
  }

  const handleQuickInsight = (query: string) => {
    processAIQuery(query)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    await processAIQuery(input.trim())
  }

  const renderMetricCard = (metric: BusinessMetric) => (
    <Card
      key={metric.id}
      className="bg-muted/50 border-border hover:border-border transition-all"
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{metric.label}</p>
            <p className="text-2xl font-bold">{metric.value}</p>
            <div
              className={cn(
                'flex items-center gap-1 text-xs',
                metric.trend === 'up'
                  ? 'text-green-500'
                  : metric.trend === 'down'
                    ? 'text-red-500'
                    : 'text-muted-foreground'
              )}
            >
              {metric.trend === 'up' ? (
                <TrendingUp className="h-3 w-3" />
              ) : metric.trend === 'down' ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <Activity className="h-3 w-3" />
              )}
              <span>{Math.abs(metric.change)}%</span>
            </div>
          </div>
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              metric.color.replace('text', 'bg').replace('500', '500/20')
            )}
          >
            <metric.icon className={cn('h-5 w-5', metric.color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderMessage = (message: AIMessage) => {
    const isUser = message.type === 'user'
    const isInsight = message.type === 'insight'
    const isSystem = message.type === 'system'

    return (
      <div key={message.id} className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
        {!isUser && (
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
              isInsight ? 'bg-yellow-500/20' : 'bg-blue-500/20'
            )}
          >
            {isInsight ? (
              <Lightbulb className="h-4 w-4 text-yellow-500" />
            ) : (
              <Brain className="h-4 w-4 text-blue-500" />
            )}
          </div>
        )}

        <div
          className={cn(
            'max-w-[80%] rounded-lg p-4',
            isUser
              ? 'bg-blue-600 text-foreground'
              : isInsight
                ? 'bg-yellow-500/10 border border-yellow-500/30'
                : isSystem
                  ? 'bg-purple-500/10 border border-purple-500/30'
                  : 'bg-muted-foreground/10'
          )}
        >
          {message.priority && !isUser && (
            <Badge
              variant="outline"
              className={cn(
                'mb-2',
                message.priority === 'high'
                  ? 'border-red-500 text-red-500'
                  : message.priority === 'medium'
                    ? 'border-yellow-500 text-yellow-500'
                    : 'border-green-500 text-green-500'
              )}
            >
              {message.priority.toUpperCase()} PRIORITY
            </Badge>
          )}

          <p className={cn('whitespace-pre-wrap', isInsight && 'font-medium')}>{message.content}</p>

          {message.metrics && message.metrics.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {message.metrics.map((metric, i) => (
                <div key={i} className="bg-background/20 rounded p-3">
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <p className="text-lg font-bold flex items-center gap-2">
                    {metric.value}
                    {metric.trend &&
                      (metric.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ))}
                  </p>
                </div>
              ))}
            </div>
          )}

          {message.recommendations && message.recommendations.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-gray-300">Recommendations:</p>
              {message.recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="bg-background/20 rounded p-3 hover:bg-background/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{rec.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        rec.impact === 'high'
                          ? 'border-green-500 text-green-500'
                          : rec.impact === 'medium'
                            ? 'border-yellow-500 text-yellow-500'
                            : 'border-gray-500 text-muted-foreground'
                      )}
                    >
                      {rec.impact} impact
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {message.visualData && (
            <div className="mt-4 bg-background/20 rounded p-3">
              <p className="text-xs text-muted-foreground mb-2">Data Visualization</p>
              {/* Here you would render actual charts/visualizations */}
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                <BarChart3 className="h-8 w-8" />
              </div>
            </div>
          )}
        </div>

        {isUser && (
          <div className="w-8 h-8 rounded-full bg-muted-foreground/10 flex items-center justify-center flex-shrink-0">
            <Users className="h-4 w-4" />
          </div>
        )}
      </div>
    )
  }

  // Show loading state
  if (orgLoading) {
    return <FurnitureOrgLoading />
  }

  // Authorization checks
  if (isAuthenticated && contextLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading AI Manager...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 space-y-6">
        {/* Header */}
        <FurniturePageHeader
          title="AI Business Manager"
          subtitle="Intelligent insights and recommendations for your furniture business"
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMetrics(!showMetrics)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                {showMetrics ? 'Hide' : 'Show'} Metrics
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUseMCP(!useMCP)}
                className={cn('gap-2', useMCP ? 'bg-green-500/10 hover:bg-green-500/20' : '')}
              >
                <Zap className={cn('h-4 w-4', useMCP && 'text-green-500')} />
                {useMCP ? 'MCP Mode' : 'API Mode'}
              </Button>
            </>
          }
        />

        {/* Business Metrics Dashboard */}
        {showMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {BUSINESS_METRICS.map(metric => renderMetricCard(metric))}
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col bg-muted/50 border-border">
              {/* Category Tabs */}
              <div className="p-4 border-b border-border">
                <div className="flex gap-2 overflow-x-auto">
                  {MANAGEMENT_CATEGORIES.map(cat => (
                    <Button
                      key={cat.id}
                      variant={activeCategory === cat.id ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveCategory(cat.id)}
                      className="gap-2 whitespace-nowrap"
                    >
                      <cat.icon className="h-4 w-4" />
                      {cat.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map(message => renderMessage(message))}

                  {loading && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Brain className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="rounded-lg p-4 bg-muted-foreground/10">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Analyzing your business data...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <form onSubmit={handleSubmit} className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    placeholder="Ask me anything about your business..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    disabled={loading}
                    className="flex-1 bg-background/50 border-border"
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
            {/* Quick Insights */}
            <Card className="bg-muted/50 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Quick Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {QUICK_INSIGHTS.map((insight, i) => (
                  <Button
                    key={i}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuickInsight(insight.query)}
                    className="w-full justify-start gap-2 hover:bg-muted-foreground/10"
                  >
                    <insight.icon className={cn('h-4 w-4', insight.color)} />
                    <span className="text-xs">{insight.label}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* AI Capabilities */}
            <Card className="bg-muted/50 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  AI Capabilities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Real-time performance analysis</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Predictive inventory alerts</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Team productivity insights</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Financial trend forecasting</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Growth opportunity detection</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Alerts */}
            <Card className="bg-muted/50 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Active Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Alert className="bg-red-500/10 border-red-500/30">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Low stock alert: Teak wood inventory below threshold
                  </AlertDescription>
                </Alert>
                <Alert className="bg-yellow-500/10 border-yellow-500/30">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    3 orders pending delivery beyond deadline
                  </AlertDescription>
                </Alert>
                <Alert className="bg-blue-500/10 border-blue-500/30">
                  <Activity className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Production capacity reaching 85% utilization
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Help */}
            <Card className="bg-muted/50 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  How to Use
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>• Ask questions in natural language</p>
                  <p>• Request specific analysis or reports</p>
                  <p>• Get predictions and forecasts</p>
                  <p>• Receive actionable recommendations</p>
                  <p>• Monitor real-time business health</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
