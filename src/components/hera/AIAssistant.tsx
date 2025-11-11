'use client'

import React, { useState, useCallback, useEffect } from 'react'
import {
  Bot,
  Lightbulb,
  Shield,
  Tag,
  TrendingUp,
  Clock,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle,
  Brain,
  Sparkles
} from 'lucide-react'

interface AIInsight {
  type: 'risk_assessment' | 'smart_code' | 'recommendation' | 'compliance' | 'validation'
  title: string
  content: string
  severity: 'low' | 'medium' | 'high'
  action?: string
}

interface AIAssistantProps {
  entityType: string
  formData: Record<string, any>
  onInsightUpdate?: (insights: AIInsight[]) => void
  className?: string
}

export function AIAssistant({ entityType, formData, onInsightUpdate, className = '' }: AIAssistantProps) {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [userMessage, setUserMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])
  const [isLoading, setIsLoading] = useState(false)

  // Initialize AI Assistant with entity context
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      analyzeFormData()
    }
  }, [formData, entityType])

  const analyzeFormData = useCallback(async () => {
    setIsAnalyzing(true)
    
    try {
      // Call Claude API for form analysis
      const response = await fetch('/api/ai/analyze-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          formData,
          context: 'master_data_creation'
        })
      })

      if (response.ok) {
        const analysis = await response.json()
        const newInsights = generateInsightsFromAnalysis(analysis)
        setInsights(newInsights)
        onInsightUpdate?.(newInsights)
      }
    } catch (error) {
      console.error('AI analysis error:', error)
      // Fallback to static insights
      setInsights(generateFallbackInsights())
    } finally {
      setIsAnalyzing(false)
    }
  }, [entityType, formData, onInsightUpdate])

  const generateInsightsFromAnalysis = (analysis: any): AIInsight[] => {
    const insights: AIInsight[] = []

    // Risk Assessment
    if (analysis.riskScore) {
      insights.push({
        type: 'risk_assessment',
        title: 'Risk Assessment',
        content: `Risk Level: ${analysis.riskScore}. ${analysis.riskReason || 'Based on provided information.'}`,
        severity: analysis.riskScore?.toLowerCase() || 'low'
      })
    }

    // Smart Code Generation
    if (formData.entity_name || formData.vendor_name) {
      const entityName = formData.entity_name || formData.vendor_name
      const category = formData.category || formData.vendor_type || 'STANDARD'
      const code = formData.entity_code || formData.vendor_code || entityName?.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10)
      
      insights.push({
        type: 'smart_code',
        title: 'HERA Smart Code',
        content: `HERA.${entityType.toUpperCase()}.${category.toUpperCase()}.${code}.v1`,
        severity: 'low'
      })
    }

    // Recommendations
    if (analysis.recommendations) {
      analysis.recommendations.forEach((rec: string) => {
        insights.push({
          type: 'recommendation',
          title: 'AI Recommendation',
          content: rec,
          severity: 'medium'
        })
      })
    }

    // Compliance Checks
    if (analysis.compliance) {
      insights.push({
        type: 'compliance',
        title: 'Compliance Status',
        content: analysis.compliance.status,
        severity: analysis.compliance.level || 'low'
      })
    }

    return insights
  }

  const generateFallbackInsights = (): AIInsight[] => {
    const insights: AIInsight[] = []

    // Static risk assessment
    insights.push({
      type: 'risk_assessment',
      title: 'Risk Assessment',
      content: 'LOW RISK - Standard entity creation with complete information.',
      severity: 'low'
    })

    // Smart code if data available
    if (formData.vendor_name || formData.entity_name) {
      const entityName = formData.vendor_name || formData.entity_name
      const category = formData.category || formData.vendor_type || 'STANDARD'
      const code = entityName?.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10) || 'CODE'
      
      insights.push({
        type: 'smart_code',
        title: 'HERA Smart Code',
        content: `HERA.${entityType.toUpperCase()}.${category.toUpperCase()}.${code}.v1`,
        severity: 'low'
      })
    }

    // Default recommendations
    insights.push({
      type: 'recommendation',
      title: 'Best Practice',
      content: 'Ensure all required fields are completed for optimal data quality.',
      severity: 'medium'
    })

    return insights
  }

  const sendMessage = useCallback(async () => {
    if (!userMessage.trim() || isLoading) return

    const userMsg = userMessage.trim()
    setUserMessage('')
    setIsLoading(true)

    // Add user message to chat
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }])

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          context: {
            entityType,
            formData,
            chatHistory
          }
        })
      })

      if (response.ok) {
        const { reply } = await response.json()
        setChatHistory(prev => [...prev, { role: 'assistant', content: reply }])
      } else {
        throw new Error('AI service unavailable')
      }
    } catch (error) {
      console.error('Chat error:', error)
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: 'I apologize, but I\'m currently unavailable. Please try again later or contact support for assistance.' 
      }])
    } finally {
      setIsLoading(false)
    }
  }, [userMessage, isLoading, entityType, formData, chatHistory])

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'risk_assessment': return <Shield className="w-4 h-4" />
      case 'smart_code': return <Tag className="w-4 h-4" />
      case 'recommendation': return <Lightbulb className="w-4 h-4" />
      case 'compliance': return <CheckCircle className="w-4 h-4" />
      case 'validation': return <AlertCircle className="w-4 h-4" />
      default: return <Brain className="w-4 h-4" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  return (
    <div className={`bg-white backdrop-blur-xl bg-white/80 rounded-2xl p-6 border border-gray-200/50 shadow-xl ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Bot className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-gray-900">AI Assistant</h3>
        <div className="ml-auto">
          {isAnalyzing && <Loader2 className="w-4 h-4 animate-spin text-purple-600" />}
        </div>
      </div>

      {/* AI Insights */}
      <div className="space-y-4 mb-6">
        {insights.map((insight, index) => (
          <div key={index} className={`rounded-lg border p-3 ${getSeverityColor(insight.severity)}`}>
            <div className="flex items-start gap-2">
              {getInsightIcon(insight.type)}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm mb-1">{insight.title}</div>
                <div className="text-xs leading-relaxed">{insight.content}</div>
                {insight.action && (
                  <button className="text-xs underline mt-1 hover:no-underline">
                    {insight.action}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {insights.length === 0 && !isAnalyzing && (
          <div className="text-center py-4 text-gray-500">
            <Brain className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">AI analysis will appear as you fill out the form</p>
          </div>
        )}
      </div>

      {/* Chat Interface */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-gray-700">Ask AI Assistant</span>
        </div>

        {/* Chat History */}
        {chatHistory.length > 0 && (
          <div className="max-h-32 overflow-y-auto mb-3 space-y-2">
            {chatHistory.slice(-4).map((msg, index) => (
              <div key={index} className={`text-xs p-2 rounded ${
                msg.role === 'user' 
                  ? 'bg-blue-50 text-blue-800 ml-4' 
                  : 'bg-gray-50 text-gray-700 mr-4'
              }`}>
                <div className="font-medium mb-1">{msg.role === 'user' ? 'You' : 'AI'}</div>
                <div>{msg.content}</div>
              </div>
            ))}
          </div>
        )}

        {/* Message Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about validation, best practices..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!userMessage.trim() || isLoading}
            className="min-w-[40px] h-10 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AIAssistant