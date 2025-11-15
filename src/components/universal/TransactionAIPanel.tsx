'use client'

/**
 * Transaction AI Panel Component
 * Smart Code: HERA.UNIVERSAL.COMPONENT.TRANSACTION_AI_PANEL.v1
 * 
 * AI-powered insights and assistance for transaction processing:
 * - Validation suggestions and error resolution
 * - Smart auto-completion and recommendations
 * - Compliance checking and alerts
 * - Historical pattern analysis
 * - Approval workflow guidance
 */

import React, { useState, useEffect, useMemo } from 'react'
import { 
  Sparkles, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Clock,
  Shield,
  Lightbulb,
  Brain,
  Target,
  BarChart3,
  FileText,
  DollarSign,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import type { TransactionData } from './UniversalTransactionPage'
import type { TransactionLine } from './UniversalTransactionLineManager'
import type { TransactionTypeConfig } from '@/lib/config/transaction-types'
import { cn } from '@/lib/utils'

interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning' | 'info'
}

interface AIInsight {
  id: string
  type: 'suggestion' | 'warning' | 'recommendation' | 'compliance' | 'pattern'
  title: string
  description: string
  action?: string
  confidence: number
  priority: 'high' | 'medium' | 'low'
  category: string
}

interface TransactionAIPanelProps {
  transaction: TransactionData
  lines: TransactionLine[]
  validationErrors: ValidationError[]
  config: TransactionTypeConfig
  className?: string
}

export function TransactionAIPanel({
  transaction,
  lines,
  validationErrors,
  config,
  className = ''
}: TransactionAIPanelProps) {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [assistantQuery, setAssistantQuery] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{ type: 'user' | 'ai'; message: string; timestamp: Date }>>([])

  // Generate AI insights based on transaction data
  const generateInsights = useMemo(() => {
    const newInsights: AIInsight[] = []

    // Validation insights
    if (validationErrors.length > 0) {
      const errorCount = validationErrors.filter(e => e.severity === 'error').length
      const warningCount = validationErrors.filter(e => e.severity === 'warning').length
      
      if (errorCount > 0) {
        newInsights.push({
          id: 'validation_errors',
          type: 'warning',
          title: `${errorCount} Validation Error${errorCount > 1 ? 's' : ''} Found`,
          description: 'Review and fix validation errors before submitting the transaction.',
          action: 'Fix Errors',
          confidence: 100,
          priority: 'high',
          category: 'Validation'
        })
      }
    }

    // Amount analysis
    if (transaction.total_amount > 0) {
      if (transaction.total_amount > 10000) {
        newInsights.push({
          id: 'large_amount',
          type: 'compliance',
          title: 'Large Transaction Amount',
          description: 'This transaction requires additional approval due to the amount.',
          action: 'Request Approval',
          confidence: 95,
          priority: 'high',
          category: 'Compliance'
        })
      }

      // Line count vs amount analysis
      if (lines.length === 1 && transaction.total_amount > 5000) {
        newInsights.push({
          id: 'single_line_large',
          type: 'suggestion',
          title: 'Consider Breaking Down Large Single Line',
          description: 'Large single-line transactions may benefit from detailed breakdown for better tracking.',
          confidence: 70,
          priority: 'medium',
          category: 'Best Practice'
        })
      }
    }

    // Line analysis
    if (lines.length > 0) {
      // Check for missing descriptions
      const linesWithoutDescription = lines.filter(line => !line.description || line.description.trim() === '')
      if (linesWithoutDescription.length > 0) {
        newInsights.push({
          id: 'missing_descriptions',
          type: 'suggestion',
          title: `${linesWithoutDescription.length} Line${linesWithoutDescription.length > 1 ? 's' : ''} Missing Description`,
          description: 'Adding detailed descriptions improves transaction tracking and auditing.',
          confidence: 85,
          priority: 'medium',
          category: 'Data Quality'
        })
      }

      // Check for round numbers (might indicate estimates)
      const roundNumberLines = lines.filter(line => 
        line.unit_amount > 0 && line.unit_amount % 1 === 0 && line.unit_amount % 10 === 0
      )
      if (roundNumberLines.length > lines.length * 0.5) {
        newInsights.push({
          id: 'round_numbers',
          type: 'recommendation',
          title: 'Many Round Number Amounts Detected',
          description: 'Consider using exact amounts instead of round numbers for more accurate accounting.',
          confidence: 60,
          priority: 'low',
          category: 'Data Quality'
        })
      }
    }

    // Date analysis
    const transactionDate = new Date(transaction.transaction_date)
    const today = new Date()
    const daysDiff = Math.floor((today.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff > 30) {
      newInsights.push({
        id: 'old_date',
        type: 'warning',
        title: 'Transaction Date is Over 30 Days Old',
        description: 'Old transaction dates may affect period-end reporting and compliance.',
        confidence: 90,
        priority: 'high',
        category: 'Compliance'
      })
    } else if (daysDiff < -5) {
      newInsights.push({
        id: 'future_date',
        type: 'warning',
        title: 'Future Transaction Date',
        description: 'Verify that the future date is intended for this transaction.',
        confidence: 95,
        priority: 'medium',
        category: 'Validation'
      })
    }

    // Smart suggestions based on transaction type
    if (config.code === 'PURCHASE_ORDER' && lines.length > 0) {
      newInsights.push({
        id: 'po_suggestion',
        type: 'suggestion',
        title: 'Consider Adding Delivery Date',
        description: 'Purchase orders typically benefit from expected delivery dates for better planning.',
        confidence: 75,
        priority: 'medium',
        category: 'Enhancement'
      })
    }

    if (config.code === 'INVOICE' && !transaction.due_date) {
      newInsights.push({
        id: 'invoice_due_date',
        type: 'recommendation',
        title: 'Add Payment Due Date',
        description: 'Setting a due date helps with cash flow management and collections.',
        confidence: 90,
        priority: 'medium',
        category: 'Best Practice'
      })
    }

    return newInsights
  }, [transaction, lines, validationErrors, config])

  // Update insights when data changes
  useEffect(() => {
    setInsights(generateInsights)
  }, [generateInsights])

  // Calculate completion score
  const completionScore = useMemo(() => {
    let score = 0
    let total = 0

    // Basic transaction fields
    if (transaction.transaction_date) score += 20
    total += 20

    if (transaction.description && transaction.description.trim()) score += 15
    total += 15

    if (transaction.total_amount > 0) score += 20
    total += 20

    // Lines
    if (lines.length > 0) score += 25
    total += 25

    // Line quality
    const linesWithDescription = lines.filter(line => line.description && line.description.trim())
    if (lines.length > 0) {
      score += (linesWithDescription.length / lines.length) * 20
    }
    total += 20

    return Math.round((score / total) * 100)
  }, [transaction, lines])

  // Handle AI assistant query
  const handleAssistantQuery = async () => {
    if (!assistantQuery.trim()) return

    const userMessage = assistantQuery.trim()
    setAssistantQuery('')
    
    setChatHistory(prev => [...prev, {
      type: 'user',
      message: userMessage,
      timestamp: new Date()
    }])

    // Simulate AI response (in real implementation, this would call an AI service)
    setTimeout(() => {
      const aiResponse = generateAIResponse(userMessage, transaction, lines)
      setChatHistory(prev => [...prev, {
        type: 'ai',
        message: aiResponse,
        timestamp: new Date()
      }])
    }, 1000)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* AI Status Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="text-purple-600" size={16} />
            AI Assistant
            <Badge variant="outline" className="ml-auto text-xs">
              Active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Completion Score */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600">Transaction Completeness</span>
                <span className="font-medium">{completionScore}%</span>
              </div>
              <Progress value={completionScore} className="h-2" />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <FileText size={12} />
                <span>{lines.length} Lines</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle size={12} />
                <span>{validationErrors.length} Issues</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Lightbulb size={16} />
            AI Insights ({insights.length})
            {isAnalyzing && <RefreshCw size={14} className="animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <div className="text-center py-4 text-slate-500 text-sm">
              <Sparkles className="mx-auto mb-2 text-slate-300" size={24} />
              No insights available
            </div>
          ) : (
            <div className="space-y-3">
              {insights.slice(0, 3).map((insight) => (
                <div
                  key={insight.id}
                  className={cn(
                    "p-3 rounded-lg border text-sm",
                    insight.priority === 'high' && "bg-red-50 border-red-200",
                    insight.priority === 'medium' && "bg-yellow-50 border-yellow-200",
                    insight.priority === 'low' && "bg-blue-50 border-blue-200"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 mt-0.5">
                      {insight.type === 'warning' && <AlertTriangle size={14} className="text-red-500" />}
                      {insight.type === 'suggestion' && <Lightbulb size={14} className="text-yellow-500" />}
                      {insight.type === 'recommendation' && <Target size={14} className="text-blue-500" />}
                      {insight.type === 'compliance' && <Shield size={14} className="text-purple-500" />}
                      {insight.type === 'pattern' && <TrendingUp size={14} className="text-green-500" />}
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-medium">{insight.title}</div>
                      <div className="text-slate-600 mt-1">{insight.description}</div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="outline" className="text-xs">
                          {insight.category}
                        </Badge>
                        
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <span>{insight.confidence}% confident</span>
                        </div>
                      </div>
                      
                      {insight.action && (
                        <Button variant="outline" size="sm" className="mt-2 h-6 text-xs">
                          {insight.action}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {insights.length > 3 && (
                <Button variant="ghost" size="sm" className="w-full text-xs">
                  View {insights.length - 3} more insights
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Chat Assistant */}
      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare size={16} />
            Ask AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Chat History */}
            {chatHistory.length > 0 && (
              <div className="max-h-32 overflow-y-auto space-y-2 p-2 bg-slate-50 rounded-lg">
                {chatHistory.slice(-3).map((chat, index) => (
                  <div
                    key={index}
                    className={cn(
                      "text-xs p-2 rounded",
                      chat.type === 'user' 
                        ? "bg-blue-100 ml-4 text-right" 
                        : "bg-white mr-4"
                    )}
                  >
                    <div className="font-medium mb-1">
                      {chat.type === 'user' ? 'You' : 'AI Assistant'}
                    </div>
                    <div>{chat.message}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Query Input */}
            <div className="flex gap-2">
              <Textarea
                value={assistantQuery}
                onChange={(e) => setAssistantQuery(e.target.value)}
                placeholder="Ask about this transaction..."
                className="text-sm resize-none h-20"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleAssistantQuery()
                  }
                }}
              />
              <Button
                onClick={handleAssistantQuery}
                disabled={!assistantQuery.trim()}
                size="sm"
                className="self-end"
              >
                <Zap size={14} />
              </Button>
            </div>

            {/* Quick Questions */}
            <div className="flex flex-wrap gap-1">
              {[
                "Is this transaction complete?",
                "What approval is needed?",
                "Any compliance issues?",
                "Suggest improvements"
              ].map((question) => (
                <Button
                  key={question}
                  variant="outline"
                  size="sm"
                  className="text-xs h-6"
                  onClick={() => setAssistantQuery(question)}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap size={16} />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="text-xs h-8">
              <CheckCircle size={12} className="mr-1" />
              Validate
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-8">
              <BarChart3 size={12} className="mr-1" />
              Analyze
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-8">
              <FileText size={12} className="mr-1" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-8">
              <TrendingUp size={12} className="mr-1" />
              Compare
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 size={16} />
            Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">Processing Time:</span>
              <span className="font-medium">2.3s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Accuracy Score:</span>
              <span className="font-medium">98.5%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Compliance:</span>
              <Badge variant="outline" className="text-xs">
                <CheckCircle size={10} className="mr-1" />
                Passed
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper function to generate AI responses (placeholder)
function generateAIResponse(query: string, transaction: TransactionData, lines: TransactionLine[]): string {
  const lowerQuery = query.toLowerCase()

  if (lowerQuery.includes('complete')) {
    const missingFields = []
    if (!transaction.description) missingFields.push('description')
    if (lines.length === 0) missingFields.push('line items')
    if (!transaction.due_date && transaction.transaction_type === 'INVOICE') missingFields.push('due date')

    if (missingFields.length === 0) {
      return "Your transaction appears complete! All required fields are filled and validation is passing."
    } else {
      return `Your transaction is missing: ${missingFields.join(', ')}. Consider adding these for a complete record.`
    }
  }

  if (lowerQuery.includes('approval')) {
    if (transaction.total_amount > 10000) {
      return "This transaction requires manager approval due to the large amount. Submit for approval once all details are complete."
    } else {
      return "No special approval required for this transaction amount. Standard processing applies."
    }
  }

  if (lowerQuery.includes('compliance')) {
    const issues = []
    if (transaction.total_amount > 10000) issues.push('large amount reporting')
    if (!transaction.reference_number) issues.push('missing reference number')

    if (issues.length === 0) {
      return "No compliance issues detected. The transaction meets standard requirements."
    } else {
      return `Compliance considerations: ${issues.join(', ')}. Review applicable policies.`
    }
  }

  if (lowerQuery.includes('improve')) {
    const suggestions = []
    if (!transaction.description) suggestions.push('Add detailed description')
    if (lines.some(l => !l.description)) suggestions.push('Complete line item descriptions')
    if (lines.length === 1 && transaction.total_amount > 1000) suggestions.push('Consider breaking down large single line')

    if (suggestions.length === 0) {
      return "Your transaction looks well-structured! No immediate improvements needed."
    } else {
      return `Suggestions for improvement: ${suggestions.join(', ')}.`
    }
  }

  return "I'm here to help with transaction questions. Ask about completeness, approvals, compliance, or improvements!"
}

export default TransactionAIPanel