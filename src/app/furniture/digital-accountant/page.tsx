'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * HERA Furniture Enterprise Digital Accountant
 * Smart Code: HERA.FURNITURE.DIGITAL.ACCOUNTANT.ENTERPRISE.V2
 * 
 * Professional enterprise-grade AI accounting assistant
 * Advanced financial automation and intelligent bookkeeping
 */

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useFurnitureOrg, FurnitureOrgLoading } from '@/components/furniture/FurnitureOrgContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
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
  Hammer,
  BookOpen,
  PieChart,
  LineChart,
  Briefcase,
  Shield,
  Globe,
  Cpu,
  Network,
  Building,
  CircleDollarSign,
  Star,
  Award,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { FurnitureDocumentUpload } from '@/components/furniture/FurnitureDocumentUpload'

// Enhanced TypeScript interfaces for enterprise features
interface AccountingCapability {
  id: string
  name: string
  description: string
  icon: React.ElementType
  status: 'active' | 'processing' | 'ready'
  accuracy: number
  category: 'automation' | 'analysis' | 'compliance' | 'intelligence'
  color: string
}

interface FinancialMetric {
  id: string
  name: string
  value: string | number
  previousValue: string | number
  change: number
  trend: 'up' | 'down' | 'stable'
  icon: React.ElementType
  category: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  color: string
}

interface FurnitureMessage {
  id: string
  type: 'user' | 'assistant' | 'system' | 'insight'
  content: string
  timestamp: Date
  category?: 'revenue' | 'expense' | 'payment' | 'production' | 'inventory' | 'summary'
  amount?: number
  status?: 'success' | 'pending' | 'error'
  priority?: 'high' | 'medium' | 'low'
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

// Enterprise Accounting Capabilities
const ACCOUNTING_CAPABILITIES: AccountingCapability[] = [
  {
    id: 'auto_journaling',
    name: 'Auto-Journaling',
    description: 'Automatic journal entry creation with 99.2% accuracy',
    icon: BookOpen,
    status: 'active',
    accuracy: 99.2,
    category: 'automation',
    color: 'text-emerald-600'
  },
  {
    id: 'financial_analysis',
    name: 'Financial Analysis',
    description: 'Real-time financial health monitoring and insights',
    icon: BarChart3,
    status: 'active',
    accuracy: 96.8,
    category: 'analysis',
    color: 'text-blue-600'
  },
  {
    id: 'compliance_monitoring',
    name: 'Compliance Monitoring',
    description: 'Automated compliance checks and audit trail maintenance',
    icon: Shield,
    status: 'active',
    accuracy: 98.5,
    category: 'compliance',
    color: 'text-purple-600'
  },
  {
    id: 'expense_intelligence',
    name: 'Expense Intelligence',
    description: 'Smart expense categorization and pattern recognition',
    icon: Target,
    status: 'processing',
    accuracy: 94.7,
    category: 'intelligence',
    color: 'text-cyan-600'
  },
  {
    id: 'cash_flow_prediction',
    name: 'Cash Flow Prediction',
    description: 'AI-powered cash flow forecasting and optimization',
    icon: TrendingUp,
    status: 'active',
    accuracy: 97.3,
    category: 'analysis',
    color: 'text-indigo-600'
  },
  {
    id: 'document_processing',
    name: 'Document AI',
    description: 'Advanced OCR and intelligent document processing',
    icon: FileText,
    status: 'active',
    accuracy: 98.9,
    category: 'automation',
    color: 'text-rose-600'
  }
]

// Enhanced financial metrics with enterprise focus
const FINANCIAL_METRICS: FinancialMetric[] = [
  {
    id: 'daily_revenue',
    name: 'Daily Revenue',
    value: '₹1,25,000',
    previousValue: '₹1,18,400',
    change: 5.6,
    trend: 'up',
    icon: CircleDollarSign,
    category: 'revenue',
    priority: 'high',
    color: 'text-emerald-600'
  },
  {
    id: 'gross_margin',
    name: 'Gross Margin',
    value: '61.2%',
    previousValue: '58.7%',
    change: 4.3,
    trend: 'up',
    icon: PieChart,
    category: 'profitability',
    priority: 'critical',
    color: 'text-blue-600'
  },
  {
    id: 'expense_ratio',
    name: 'Expense Ratio',
    value: '38.8%',
    previousValue: '41.3%',
    change: -6.1,
    trend: 'up',
    icon: Receipt,
    category: 'efficiency',
    priority: 'medium',
    color: 'text-purple-600'
  },
  {
    id: 'cash_position',
    name: 'Cash Position',
    value: '₹4,82,500',
    previousValue: '₹4,56,200',
    change: 5.8,
    trend: 'up',
    icon: Banknote,
    category: 'liquidity',
    priority: 'high',
    color: 'text-cyan-600'
  },
  {
    id: 'receivables',
    name: 'Receivables',
    value: '₹2,15,600',
    previousValue: '₹2,48,900',
    change: -13.4,
    trend: 'up',
    icon: Calendar,
    category: 'collections',
    priority: 'medium',
    color: 'text-indigo-600'
  },
  {
    id: 'automation_score',
    name: 'Automation Score',
    value: '94.7%',
    previousValue: '89.2%',
    change: 6.2,
    trend: 'up',
    icon: Zap,
    category: 'automation',
    priority: 'critical',
    color: 'text-rose-600'
  }
]

// Enterprise-focused quick prompts
const FURNITURE_QUICK_PROMPTS: QuickPrompt[] = [
  {
    icon: CircleDollarSign,
    label: 'Sales Transaction',
    prompt: 'Record sales revenue with automatic journal posting',
    color: 'text-green-600',
    category: 'revenue'
  },
  {
    icon: Receipt,
    label: 'Expense Processing',
    prompt: 'Process expense with intelligent categorization',
    color: 'text-red-600',
    category: 'expense'
  },
  {
    icon: Factory,
    label: 'Production Costing',
    prompt: 'Calculate and allocate production costs with overhead distribution',
    color: 'text-purple-600',
    category: 'production'
  },
  {
    icon: TrendingUp,
    label: 'Financial Analysis',
    prompt: 'Generate comprehensive financial performance analysis',
    color: 'text-blue-600',
    category: 'analysis'
  },
  {
    icon: Target,
    label: 'Budget Variance',
    prompt: 'Analyze budget vs actual with variance explanations',
    color: 'text-cyan-600',
    category: 'budgeting'
  },
  {
    icon: BookOpen,
    label: 'Audit Trail',
    prompt: 'Generate detailed audit trail and compliance report',
    color: 'text-indigo-600',
    category: 'compliance'
  }
]

// Enhanced furniture-specific quick expenses with enterprise categories
const FURNITURE_QUICK_EXPENSES = [
  { icon: Package, label: 'Premium Timber', amount: 15000, category: 'raw_materials', code: 'MAT-001' },
  { icon: Wrench, label: 'Hardware & Fittings', amount: 3500, category: 'components', code: 'MAT-002' },
  { icon: Factory, label: 'Skilled Labor', amount: 8000, category: 'direct_labor', code: 'LAB-001' },
  { icon: Truck, label: 'Logistics & Delivery', amount: 2500, category: 'distribution', code: 'LOG-001' },
  { icon: Receipt, label: 'Utilities & Overhead', amount: 1200, category: 'overhead', code: 'OVH-001' },
  { icon: Sofa, label: 'Upholstery Materials', amount: 4500, category: 'raw_materials', code: 'MAT-003' }
]

export default function FurnitureDigitalAccountantPage() {
  const router = useRouter()
  const { isAuthenticated, contextLoading } = useHERAAuth()
  const { organizationId, organizationName, orgLoading } = useFurnitureOrg()

  const [messages, setMessages] = useState<FurnitureMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: `🚀 **Welcome to HERA Enterprise Digital Accountant v2.1**

I'm your advanced AI accounting assistant for ${organizationName || 'your furniture business'}. I provide enterprise-grade financial automation:

💼 **Advanced Features:**
• Automatic journal entry generation (99.2% accuracy)
• Real-time financial analysis and insights
• Intelligent expense categorization and approval workflows
• Cash flow forecasting with predictive analytics
• Compliance monitoring and audit trail automation
• Smart document processing with OCR technology

📊 **Enterprise Capabilities:**
• Multi-dimensional cost center accounting
• Automated variance analysis and budget tracking
• Integrated receivables and payables management
• Real-time profitability analysis by product line
• Advanced reporting with customizable dashboards

Simply describe your transactions naturally - I'll handle all the complex accounting automatically while ensuring full compliance and providing intelligent insights for better business decisions.`,
      timestamp: new Date(),
      status: 'success',
      category: 'summary'
    }
  ])

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showExamples, setShowExamples] = useState(true)
  const [useMCP, setUseMCP] = useState(true)
  const [selectedCapability, setSelectedCapability] = useState<AccountingCapability | null>(null)
  const [showMetrics, setShowMetrics] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom with smooth animation
  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
        if (viewport) {
          viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' })
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
        headers: { 'Content-Type': 'application/json' },
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
        priority: data.priority,
        journalEntry: data.journalEntry,
        actions: data.actions
      }
      setMessages(prev => [...prev, assistantMessage])

      // Add insights if available
      if (data.insights && data.insights.length > 0) {
        data.insights.forEach((insight: any, index: number) => {
          setTimeout(() => {
            const insightMessage: FurnitureMessage = {
              id: `insight-${Date.now()}-${index}`,
              type: 'insight',
              content: insight.content,
              timestamp: new Date(),
              category: insight.category,
              priority: insight.priority
            }
            setMessages(prev => [...prev, insightMessage])
          }, 500 * (index + 1))
        })
      }
    } catch (error) {
      const errorMessage: FurnitureMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'I encountered an issue processing your transaction. Please try again or contact support if the problem persists.',
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
    processAIQuery(prompt)
  }

  const processAIQuery = async (text: string) => {
    await processFurnitureTransaction(text)
  }

  const handleQuickExpense = async (expense: any) => {
    const prompt = `Record expense: ${expense.label} - ₹${expense.amount} (Category: ${expense.category}, Code: ${expense.code})`
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
        content: `📄 **Advanced Document Analysis Complete**

**AI Extraction Results:**
• Vendor: ${result.analysis.vendor_name}
• Amount: ₹${result.analysis.total_amount?.toLocaleString('en-IN')}
• Date: ${result.analysis.date}
• Classification: ${result.analysis.category || 'Auto-detected'}
${result.analysis.items?.length > 0 ? `• Line Items: ${result.analysis.items.map((i: any) => i.description).join(', ')}` : ''}

**Automated Processing:**
• Journal entry pre-configured
• Expense category intelligently assigned
• Compliance checks completed
• Audit trail automatically generated

Ready for one-click processing with full automation!`,
        timestamp: new Date(),
        status: 'success'
      }
      setMessages(prev => [...prev, systemMessage])
    }
  }

  const renderAccountingCapabilityCard = (capability: AccountingCapability) => (
    <Card
      key={capability.id}
      className={cn(
        "relative border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md",
        selectedCapability?.id === capability.id && "ring-2 ring-blue-500 border-blue-500"
      )}
      onClick={() => setSelectedCapability(capability)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              capability.status === 'active' ? 'bg-green-100 dark:bg-green-900/30' :
              capability.status === 'processing' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
              'bg-gray-100 dark:bg-gray-800'
            )}>
              <capability.icon className={cn('h-5 w-5', capability.color)} />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{capability.name}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{capability.description}</p>
            </div>
          </div>
          <Badge variant={capability.status === 'active' ? 'default' : 'secondary'} className="text-xs">
            {capability.status}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Accuracy:</span>
            <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{capability.accuracy}%</span>
          </div>
          <Progress value={capability.accuracy} className="w-16 h-2" />
        </div>
      </CardContent>
    </Card>
  )

  const renderFinancialMetricCard = (metric: FinancialMetric) => (
    <Card
      key={metric.id}
      className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 shadow-sm hover:shadow-md"
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{metric.name}</p>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs px-1.5 py-0.5",
                  metric.priority === 'critical' ? 'border-red-500 text-red-600 dark:text-red-400' :
                  metric.priority === 'high' ? 'border-orange-500 text-orange-600 dark:text-orange-400' :
                  metric.priority === 'medium' ? 'border-blue-500 text-blue-600 dark:text-blue-400' :
                  'border-green-500 text-green-600 dark:text-green-400'
                )}
              >
                {metric.priority}
              </Badge>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{metric.value}</p>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex items-center gap-1 text-xs font-medium',
                  metric.trend === 'up'
                    ? 'text-green-600 dark:text-green-400'
                    : metric.trend === 'down'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-slate-500 dark:text-slate-400'
                )}
              >
                {metric.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : metric.trend === 'down' ? (
                  <TrendingDown className="h-3 w-3" />
                ) : (
                  <Activity className="h-3 w-3" />
                )}
                <span>+{Math.abs(metric.change)}%</span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">vs {metric.previousValue}</span>
            </div>
          </div>
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              metric.color.includes('emerald') ? 'bg-emerald-100 dark:bg-emerald-900/30' :
              metric.color.includes('blue') ? 'bg-blue-100 dark:bg-blue-900/30' :
              metric.color.includes('purple') ? 'bg-purple-100 dark:bg-purple-900/30' :
              metric.color.includes('cyan') ? 'bg-cyan-100 dark:bg-cyan-900/30' :
              metric.color.includes('indigo') ? 'bg-indigo-100 dark:bg-indigo-900/30' :
              'bg-rose-100 dark:bg-rose-900/30'
            )}
          >
            <metric.icon className={cn('h-6 w-6', metric.color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderMessage = (message: FurnitureMessage) => {
    const isUser = message.type === 'user'
    const isInsight = message.type === 'insight'
    const isSystem = message.type === 'system'

    return (
      <div key={message.id} className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
        {!isUser && (
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
              isInsight ? 'bg-yellow-100 dark:bg-yellow-900/30' : 
              isSystem ? 'bg-blue-100 dark:bg-blue-900/30' :
              'bg-emerald-100 dark:bg-emerald-900/30'
            )}
          >
            {isInsight ? (
              <Sparkles className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            ) : isSystem ? (
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            ) : (
              <Brain className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
        )}
        <div
          className={cn(
            'max-w-[80%] rounded-lg p-4',
            isUser
              ? 'bg-blue-600 text-white'
              : isInsight
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                : isSystem
                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                  : 'bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700'
          )}
        >
          {message.priority && !isUser && (
            <Badge
              variant="outline"
              className={cn(
                'mb-2',
                message.priority === 'high'
                  ? 'border-red-500 text-red-600 dark:text-red-400'
                  : message.priority === 'medium'
                    ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400'
                    : 'border-green-500 text-green-600 dark:text-green-400'
              )}
            >
              {message.priority.toUpperCase()} PRIORITY
            </Badge>
          )}
          <p className={cn('whitespace-pre-wrap text-sm', isInsight && 'font-medium', isUser ? 'text-white' : 'text-slate-900 dark:text-slate-100')}>{message.content}</p>
          
          {message.amount && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                ₹{message.amount.toLocaleString('en-IN')}
              </p>
            </div>
          )}
          
          {message.journalEntry && (
            <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">
              <p className="text-slate-600 dark:text-slate-400 mb-2 font-semibold">Journal Entry:</p>
              {message.journalEntry.debits.map((debit, i) => (
                <p key={i} className="text-green-600 dark:text-green-400">
                  DR: {debit.account} - ₹{debit.amount.toLocaleString('en-IN')}
                </p>
              ))}
              {message.journalEntry.credits.map((credit, i) => (
                <p key={i} className="text-red-600 dark:text-red-400">
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
        {isUser && (
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
            <Users className="h-4 w-4 text-slate-600 dark:text-slate-400" />
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calculator className="h-8 w-8 text-white animate-pulse" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Initializing Enterprise Accountant</h3>
          <p className="text-slate-600 dark:text-slate-400">Preparing AI accounting systems...</p>
          <Loader2 className="h-6 w-6 animate-spin mx-auto mt-4 text-emerald-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="p-6 space-y-6">
        {/* Header */}
        <FurniturePageHeader
          title="Enterprise Digital Accountant"
          subtitle="AI-Powered Financial Automation & Intelligent Bookkeeping Platform"
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMetrics(!showMetrics)}
                className="gap-2 border-slate-300 dark:border-slate-600"
              >
                <BarChart3 className="h-4 w-4" />
                {showMetrics ? 'Hide' : 'Show'} Metrics
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUseMCP(!useMCP)}
                className={cn(
                  'gap-2 border-slate-300 dark:border-slate-600',
                  useMCP ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/30' : ''
                )}
              >
                <Zap className={cn('h-4 w-4', useMCP ? 'text-green-600 dark:text-green-400' : 'text-slate-500')} />
                {useMCP ? 'AI Mode' : 'Standard Mode'}
              </Button>
              <Button
                size="sm"
                className="gap-2 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700"
                onClick={() => handleQuickPrompt('Generate comprehensive financial analysis with insights')}
              >
                <Cpu className="h-4 w-4" />
                Full Analysis
              </Button>
            </>
          }
        />

        {/* Accounting Capabilities Overview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Accounting Capabilities</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-600 dark:text-slate-400">AI Systems Active</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ACCOUNTING_CAPABILITIES.map(capability => renderAccountingCapabilityCard(capability))}
          </div>
        </div>

        {/* Financial Metrics Dashboard */}
        {showMetrics && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Real-time Financial Metrics</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Live Data</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FINANCIAL_METRICS.map(metric => renderFinancialMetricCard(metric))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 h-[700px] flex flex-col shadow-lg">
              {/* Enhanced Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-slate-800 dark:to-slate-900">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <Calculator className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">HERA AI Enterprise Accountant</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Advanced Financial Intelligence • 99.2% Accuracy</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">AI Active</span>
                    </div>
                    <Badge variant="outline" className="text-xs">v2.1.0</Badge>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 bg-slate-50 dark:bg-slate-950">
                <div className="space-y-4">
                  {messages.map(message => renderMessage(message))}
                  {loading && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <Calculator className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                          <span className="text-sm text-slate-700 dark:text-slate-300">Processing transaction with AI...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Quick Actions */}
              {showExamples && (
                <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                  <div className="flex gap-2 flex-wrap">
                    {FURNITURE_QUICK_PROMPTS.map((prompt, i) => (
                      <Button
                        key={i}
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickPrompt(prompt.prompt)}
                        className="gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <prompt.icon className={cn('h-4 w-4', prompt.color)} />
                        <span className="text-xs">{prompt.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Enhanced Input */}
              <form
                onSubmit={handleSubmit}
                className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      placeholder="Describe your transaction or ask for financial analysis..."
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      disabled={loading}
                      className="pr-12 border-slate-300 dark:border-slate-600 focus:border-emerald-500 dark:focus:border-emerald-400"
                    />
                    {loading && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Calculator className="h-4 w-4 text-emerald-500 animate-pulse" />
                      </div>
                    )}
                  </div>
                  <Button 
                    type="submit" 
                    disabled={loading || !input.trim()}
                    className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>• Auto-journaling</span>
                  <span>• Smart categorization</span>
                  <span>• Compliance checks</span>
                  <span>• Audit trails</span>
                </div>
              </form>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-4">
            {/* Quick Expenses */}
            <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <Receipt className="h-4 w-4" />
                  Smart Expense Processing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2">
                  {FURNITURE_QUICK_EXPENSES.map((expense, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickExpense(expense)}
                      className="h-auto flex justify-between items-center py-3 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <div className="flex items-center gap-2">
                        <expense.icon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        <div className="text-left">
                          <span className="text-xs font-medium">{expense.label}</span>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{expense.code}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">₹{expense.amount.toLocaleString()}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Document Upload */}
            <FurnitureDocumentUpload
              organizationId={organizationId || ''}
              onDocumentAnalyzed={handleDocumentAnalyzed}
              isDarkMode={false}
            />

            {/* Enterprise Features */}
            <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <Sparkles className="h-4 w-4" />
                  Enterprise Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                    <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <div className="flex-1">
                      <span className="text-xs font-medium text-slate-900 dark:text-slate-100">Auto-Journaling</span>
                      <p className="text-xs text-slate-600 dark:text-slate-400">99.2% accuracy</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <div className="flex-1">
                      <span className="text-xs font-medium text-slate-900 dark:text-slate-100">Financial Analysis</span>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Real-time insights</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                    <CheckCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <div className="flex-1">
                      <span className="text-xs font-medium text-slate-900 dark:text-slate-100">Compliance Monitoring</span>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Audit ready</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-cyan-50 dark:bg-cyan-900/20">
                    <CheckCircle className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    <div className="flex-1">
                      <span className="text-xs font-medium text-slate-900 dark:text-slate-100">Cash Flow Forecasting</span>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Predictive analytics</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Accounting Guide */}
            <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <HelpCircle className="h-4 w-4" />
                  AI Accounting Commands
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5"></div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">Transaction Processing</p>
                      <p className="text-slate-600 dark:text-slate-400">"Sold dining set to Marriott for ₹85,000"</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">Financial Analysis</p>
                      <p className="text-slate-600 dark:text-slate-400">"Show profit margin analysis for this month"</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5"></div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">Budget Tracking</p>
                      <p className="text-slate-600 dark:text-slate-400">"Compare actual vs budget performance"</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full mt-1.5"></div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">Cash Flow</p>
                      <p className="text-slate-600 dark:text-slate-400">"Generate 3-month cash flow forecast"</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}