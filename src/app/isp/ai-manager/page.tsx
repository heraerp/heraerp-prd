'use client'

// Smart Code: HERA.ISP.AI.MANAGER.UI.v1
// ISP AI Manager – inspired by Furniture AI Manager, tailored for broadband ISPs

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Brain,
  Send,
  Loader2,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Wifi,
  Radio,
  DollarSign,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  BarChart3,
  Gauge,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type MsgType = 'user' | 'assistant' | 'system' | 'insight'

interface AIMessage {
  id: string
  type: MsgType
  content: string
  timestamp: Date
  category?: 'overview' | 'network' | 'subscribers' | 'billing' | 'revenue' | 'support'
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

const BUSINESS_METRICS: BusinessMetric[] = [
  { id: 'subs', label: 'Active Subscribers', value: 46210, change: 1.9, trend: 'up', icon: Users, color: 'text-cyan-500', category: 'subscribers' },
  { id: 'arpu', label: 'ARPU', value: '₹916', change: 1.4, trend: 'up', icon: DollarSign, color: 'text-emerald-500', category: 'revenue' },
  { id: 'uptime', label: 'Network Uptime', value: '99.8%', change: 0.0, trend: 'stable', icon: Wifi, color: 'text-blue-500', category: 'network' },
  { id: 'churn', label: 'Churn Rate', value: '2.3%', change: -0.2, trend: 'down', icon: Activity, color: 'text-pink-500', category: 'subscribers' },
  { id: 'revenue', label: 'Monthly Revenue', value: '₹4.6 Cr', change: 2.4, trend: 'up', icon: BarChart3, color: 'text-indigo-500', category: 'revenue' },
  { id: 'outages', label: 'Open Outages', value: 0, change: -50, trend: 'down', icon: Radio, color: 'text-amber-500', category: 'network' },
]

const QUICK_INSIGHTS = [
  { icon: BarChart3, label: 'Revenue Trend', query: 'Show revenue trend and ARPU changes', color: 'text-indigo-300', category: 'revenue' },
  { icon: Activity, label: 'Churn Watch', query: 'Analyze churn and at-risk cohorts', color: 'text-pink-300', category: 'subscribers' },
  { icon: Wifi, label: 'Uptime & Outages', query: 'Summarize uptime and recent outages', color: 'text-blue-300', category: 'network' },
  { icon: Users, label: 'Agent Performance', query: 'Which agents drove most connections?', color: 'text-cyan-300', category: 'subscribers' },
  { icon: DollarSign, label: 'Plans Upsell', query: 'Recommend plan upgrades by cohort', color: 'text-emerald-300', category: 'revenue' },
]

const MANAGEMENT_CATEGORIES = [
  { id: 'overview', label: 'Overview', icon: Gauge },
  { id: 'network', label: 'Network', icon: Wifi },
  { id: 'subscribers', label: 'Subscribers', icon: Users },
  { id: 'revenue', label: 'Revenue', icon: DollarSign },
  { id: 'support', label: 'Support', icon: Activity },
]

export default function ISPAIManagerPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome',
      type: 'assistant',
      content:
        'Welcome to the ISP AI Manager. Ask about uptime, outages, ARPU, churn, subscriber growth, or revenue. I’ll provide insights and actions.',
      timestamp: new Date(),
      category: 'overview',
      actionable: true,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState('overview')
  const [showMetrics, setShowMetrics] = useState(true)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null
        viewport?.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' })
      }
    }
    const t = setTimeout(() => requestAnimationFrame(scrollToBottom), 50)
    return () => clearTimeout(t)
  }, [messages])

  // Ensure input is focused and visible on initial load (no need to scroll to find it)
  useEffect(() => {
    const t = setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 0)
    return () => clearTimeout(t)
  }, [])

  const processAIQuery = async (text: string) => {
    setLoading(true)
    const userMessage: AIMessage = { id: Date.now().toString(), type: 'user', content: text, timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])

    try {
      const res = await fetch('/api/v1/isp/ai-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, context: { category: activeCategory, metrics: BUSINESS_METRICS } }),
      })
      if (!res.ok) throw new Error('Failed to process query')
      const data = await res.json()
      const aiMsg: AIMessage = {
        id: Date.now().toString(),
        type: data.type || 'assistant',
        content: data.message,
        timestamp: new Date(),
        category: data.category,
        priority: data.priority,
        actionable: data.actionable,
        metrics: data.metrics,
        recommendations: data.recommendations,
        visualData: data.visualData,
      }
      setMessages(prev => [...prev, aiMsg])
      if (Array.isArray(data.insights)) {
        data.insights.forEach((ins: any, i: number) => {
          setTimeout(() => {
            setMessages(prev => [
              ...prev,
              {
                id: `insight-${Date.now()}-${i}`,
                type: 'insight',
                content: ins.content,
                timestamp: new Date(),
                priority: ins.priority || 'medium',
                category: activeCategory as any,
              },
            ])
          }, 250 * (i + 1))
        })
      }
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), type: 'system', content: `Error: ${e?.message || 'Unknown error'}`, timestamp: new Date() },
      ])
    } finally {
      setLoading(false)
      setInput('')
    }
  }

  const renderMetricCard = (metric: BusinessMetric) => (
    <Card key={metric.id} className="bg-slate-900/70 border-white/15 hover:border-white/30 transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-white/80">{metric.label}</p>
            <p className="text-2xl font-bold text-white/95">{metric.value}</p>
            <div
              className={cn(
                'flex items-center gap-1 text-xs',
                metric.trend === 'up' ? 'text-emerald-300' : metric.trend === 'down' ? 'text-red-300' : 'text-white/70'
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
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', metric.color.replace('text', 'bg') + '/30')}>
            <metric.icon className={cn('h-5 w-5', metric.color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderMessage = (m: AIMessage) => {
    const isUser = m.type === 'user'
    const isInsight = m.type === 'insight'
    const isSystem = m.type === 'system'
    return (
      <div key={m.id} className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
        {!isUser && (
          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', isInsight ? 'bg-amber-500/20' : 'bg-cyan-500/20')}>
            <Brain className={cn('h-4 w-4', isInsight ? 'text-amber-400' : 'text-cyan-400')} />
          </div>
        )}
        <div
          className={cn(
            'max-w-[80%] rounded-lg p-4',
            isUser ? 'bg-[#0099CC] text-white' : isInsight ? 'bg-amber-500/10 border border-amber-500/40' : isSystem ? 'bg-pink-500/10 border border-pink-500/40' : 'bg-slate-900/70 border border-white/20'
          )}
        >
          {m.priority && !isUser && (
            <Badge
              variant="outline"
              className={cn(
                'mb-2',
                m.priority === 'high' ? 'border-red-400 text-red-400' : m.priority === 'medium' ? 'border-amber-400 text-amber-400' : 'border-emerald-400 text-emerald-400'
              )}
            >
              {m.priority.toUpperCase()} PRIORITY
            </Badge>
          )}
          <p className={cn('whitespace-pre-wrap text-white/95', isInsight && 'font-semibold')}>{m.content}</p>
          {m.metrics && m.metrics.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {m.metrics.map((met, i) => (
                <div key={i} className="bg-black/30 rounded p-3">
                  <p className="text-xs text-white/80">{met.label}</p>
                  <p className="text-lg font-bold text-white/95 flex items-center gap-2">
                    {met.value}
                    {met.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-emerald-300" />
                    ) : met.trend === 'down' ? (
                      <TrendingDown className="h-4 w-4 text-red-300" />
                    ) : null}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
        {isUser && (
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
            <Users className="h-4 w-4 text-white/80" />
          </div>
        )}
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    await processAIQuery(input.trim())
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0049B7] via-slate-950 to-[#001A3D] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">
            ISP AI Manager
          </h1>
          <p className="text-white/90 mt-1">Real-time insights and recommendations for broadband operations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMetrics(!showMetrics)}
            className="gap-2 text-foreground border-border hover:bg-accent hover:text-accent-foreground"
          >
            <Activity className="h-4 w-4" /> {showMetrics ? 'Hide' : 'Show'} Metrics
          </Button>
        </div>
      </div>

      {/* Metrics */}
      {showMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {BUSINESS_METRICS.map(m => renderMetricCard(m))}
        </div>
      )}

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col bg-card backdrop-blur-xl border-border">
            {/* Category chips */}
            <div className="p-4 border-b border-border/50">
              <div className="flex gap-2 overflow-x-auto">
                {MANAGEMENT_CATEGORIES.map(cat => (
                  <Button
                    key={cat.id}
                    variant={activeCategory === cat.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn('gap-2 whitespace-nowrap', activeCategory === cat.id ? 'text-white' : 'text-white')}
                  >
                    <cat.icon className="h-4 w-4" /> {cat.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map(m => renderMessage(m))}
                {loading && (
                  <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/30 flex items-center justify-center">
                      <Brain className="h-4 w-4 text-cyan-300" />
                  </div>
                    <div className="rounded-lg p-4 bg-slate-900/70 border border-white/20">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-white/95">Analyzing…</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-border/50">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask about uptime, ARPU, churn, revenue…"
                  className="bg-slate-900/70 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                />
                <Button type="submit" disabled={loading || !input.trim()}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Quick insights */}
          <Card className="bg-slate-900/80 backdrop-blur-xl border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-white">
                <Sparkles className="h-4 w-4" /> Quick Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {QUICK_INSIGHTS.map((ins, i) => (
                <Button
                  key={i}
                  variant="ghost"
                  size="sm"
                  onClick={() => processAIQuery(ins.query)}
                  className="w-full justify-start gap-2 bg-slate-900/70 hover:bg-slate-900/90 text-white border border-white/20"
                >
                  <ins.icon className={cn('h-4 w-4', ins.color)} />
                  <span className="text-sm text-white/95">{ins.label}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Active alerts */}
          <Card className="bg-slate-900/80 backdrop-blur-xl border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-white">
                <AlertTriangle className="h-4 w-4" /> Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-white">
              <div className="bg-red-600/30 border border-red-500/60 rounded p-3">
                High churn in Kozhikode segment M-200 (last 7 days)
              </div>
              <div className="bg-amber-500/30 border border-amber-500/60 rounded p-3">
                2 SLAs nearing breach in Thiruvananthapuram region
              </div>
              <div className="bg-blue-600/30 border border-blue-500/60 rounded p-3">
                Bandwidth utilization &gt; 80% in Kochi tech park ring
              </div>
            </CardContent>
          </Card>

          {/* Help */}
          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-white">
                <HelpCircle className="h-4 w-4" /> How to Use
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-white/95">
                <p>• Ask in natural language (uptime, outages, ARPU, churn)</p>
                <p>• Request trend analysis and recommendations</p>
                <p>• Get actionable insights for agents and NOC</p>
                <p>• Use categories for focused context</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
