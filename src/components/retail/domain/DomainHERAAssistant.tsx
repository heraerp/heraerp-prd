/**
 * Domain HERA Assistant Component
 * Smart Code: HERA.RETAIL.DOMAIN.HERA_ASSISTANT.v1
 * 
 * Domain-aware AI assistant with contextual knowledge and recommendations
 * Provides intelligent insights and automated assistance for domain operations
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare,
  Send,
  Bot,
  User,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Sparkles,
  Settings,
  Minimize2,
  Maximize2,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Copy,
  ExternalLink
} from 'lucide-react'

interface AIMessage {
  id: string
  type: 'ai' | 'user' | 'system'
  message: string
  timestamp: string
  context?: {
    domain: string
    action?: string
    data?: any
  }
  suggestions?: string[]
  insights?: Array<{
    type: 'insight' | 'recommendation' | 'alert' | 'tip'
    title: string
    content: string
    icon: any
    priority: 'high' | 'medium' | 'low'
    action?: {
      label: string
      handler: () => void
    }
  }>
  interactive?: {
    type: 'quick_actions' | 'data_visualization' | 'form'
    data: any
  }
}

interface DomainHERAAssistantProps {
  domain: string
  className?: string
}

export default function DomainHERAAssistant({ domain, className }: DomainHERAAssistantProps) {
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  const [chatMode, setChatMode] = useState<'assistant' | 'insights' | 'actions'>('assistant')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    initializeDomainAssistant()
  }, [domain])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const initializeDomainAssistant = () => {
    const welcomeMessage: AIMessage = {
      id: `welcome-${Date.now()}`,
      type: 'ai',
      message: `Hello! I'm your HERA AI assistant for ${domain.charAt(0).toUpperCase() + domain.slice(1)} operations. I'm here to help you with insights, recommendations, and quick actions.`,
      timestamp: 'Just now',
      context: { domain },
      insights: [
        {
          type: 'tip',
          title: 'Getting Started',
          content: `Ask me about ${domain} performance, trends, or operations. I can provide real-time insights and help you make data-driven decisions.`,
          icon: Lightbulb,
          priority: 'medium'
        }
      ],
      suggestions: [
        `Show me ${domain} performance`,
        `What are the key trends?`,
        `Any alerts I should know about?`,
        `Quick actions available`
      ]
    }

    const systemMessage = getDomainSpecificWelcome(domain)
    setMessages([welcomeMessage, systemMessage])
  }

  const getDomainSpecificWelcome = (domain: string): AIMessage => {
    const domainSpecificContent = getDomainSpecificContent(domain)
    
    return {
      id: `domain-welcome-${Date.now()}`,
      type: 'ai',
      message: domainSpecificContent.welcomeMessage,
      timestamp: 'Just now',
      context: { domain },
      insights: domainSpecificContent.insights,
      suggestions: domainSpecificContent.suggestions
    }
  }

  const getDomainSpecificContent = (domain: string) => {
    switch (domain) {
      case 'inventory':
        return {
          welcomeMessage: "I've analyzed your inventory data. Here's what I found:",
          insights: [
            {
              type: 'insight',
              title: 'Stock Accuracy',
              content: 'Your inventory accuracy is at 99.1% - excellent performance! This is 2.1% above industry average.',
              icon: CheckCircle,
              priority: 'medium',
              action: {
                label: 'View Details',
                handler: () => alert('Navigate to inventory accuracy report')
              }
            },
            {
              type: 'alert',
              title: 'Low Stock Alert',
              content: '12 SKUs are below safety stock levels. Consider expediting replenishment orders.',
              icon: AlertTriangle,
              priority: 'high',
              action: {
                label: 'Review Items',
                handler: () => alert('Navigate to low stock report')
              }
            },
            {
              type: 'recommendation',
              title: 'Turnover Optimization',
              content: 'Category Electronics shows 15% slower turnover. Consider promotional activities or reallocation.',
              icon: TrendingUp,
              priority: 'medium',
              action: {
                label: 'Analyze Category',
                handler: () => alert('Navigate to category analysis')
              }
            }
          ],
          suggestions: [
            'Show inventory turnover trends',
            'Which items need replenishment?',
            'Dead stock analysis',
            'Generate cycle count plan'
          ]
        }

      case 'merchandising':
        return {
          welcomeMessage: "I've reviewed your merchandising metrics. Here are key insights:",
          insights: [
            {
              type: 'insight',
              title: 'Sales Performance',
              content: 'Sales are up 18.5% this month with strong performance in Fashion and Electronics categories.',
              icon: TrendingUp,
              priority: 'high',
              action: {
                label: 'View Trends',
                handler: () => alert('Navigate to sales analytics')
              }
            },
            {
              type: 'recommendation',
              title: 'Pricing Opportunity',
              content: 'Competitor analysis suggests 3-5% price increase opportunity on 47 SKUs without demand impact.',
              icon: Zap,
              priority: 'medium',
              action: {
                label: 'Review Pricing',
                handler: () => alert('Navigate to pricing recommendations')
              }
            },
            {
              type: 'alert',
              title: 'Promotion Alert',
              content: 'Current promotion ROI is 3.2x - consider extending successful campaigns.',
              icon: Sparkles,
              priority: 'medium'
            }
          ],
          suggestions: [
            'Analyze promotion effectiveness',
            'Show margin analysis',
            'Competitor price changes',
            'Plan next campaign'
          ]
        }

      case 'planning':
        return {
          welcomeMessage: "Planning analytics ready. Here's your planning intelligence:",
          insights: [
            {
              type: 'insight',
              title: 'Forecast Accuracy',
              content: 'Demand forecasting accuracy improved to 87.6% - a 3.2% improvement over last period.',
              icon: CheckCircle,
              priority: 'high'
            },
            {
              type: 'recommendation',
              title: 'Seasonal Adjustment',
              content: 'Seasonal index indicates 24% increase expected. Recommend increasing safety stock by 15%.',
              icon: TrendingUp,
              priority: 'high',
              action: {
                label: 'Adjust Plans',
                handler: () => alert('Navigate to planning adjustments')
              }
            },
            {
              type: 'alert',
              title: 'Planning Exceptions',
              content: '7 items require manual review due to unusual demand patterns.',
              icon: AlertTriangle,
              priority: 'medium'
            }
          ],
          suggestions: [
            'Show forecast accuracy trends',
            'Review planning exceptions',
            'Seasonal trend analysis',
            'Optimize safety stock'
          ]
        }

      default:
        return {
          welcomeMessage: `Ready to assist with ${domain} operations.`,
          insights: [],
          suggestions: ['Ask me anything!']
        }
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      message: inputMessage,
      timestamp: 'Just now',
      context: { domain }
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputMessage, domain)
      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 1500)
  }

  const generateAIResponse = (userInput: string, domain: string): AIMessage => {
    const input = userInput.toLowerCase()
    
    // Pattern matching for responses
    if (input.includes('performance') || input.includes('metrics')) {
      return {
        id: `ai-${Date.now()}`,
        type: 'ai',
        message: `Based on your ${domain} performance data, here's what I found:`,
        timestamp: 'Just now',
        context: { domain, action: 'performance_query' },
        insights: [
          {
            type: 'insight',
            title: 'Key Metrics',
            content: `${domain.charAt(0).toUpperCase() + domain.slice(1)} performance is tracking above target by 8.5%. Key drivers include improved efficiency and reduced costs.`,
            icon: TrendingUp,
            priority: 'high'
          }
        ],
        suggestions: ['Show detailed breakdown', 'Compare with last period', 'Export performance report']
      }
    }

    if (input.includes('alert') || input.includes('issue') || input.includes('problem')) {
      return {
        id: `ai-${Date.now()}`,
        type: 'ai',
        message: `I've identified the following alerts and issues for ${domain}:`,
        timestamp: 'Just now',
        context: { domain, action: 'alerts_query' },
        insights: [
          {
            type: 'alert',
            title: 'Attention Required',
            content: `Found 3 high-priority items requiring immediate attention in ${domain} operations.`,
            icon: AlertTriangle,
            priority: 'high',
            action: {
              label: 'Review Issues',
              handler: () => alert('Navigate to issues dashboard')
            }
          }
        ]
      }
    }

    if (input.includes('trend') || input.includes('forecast')) {
      return {
        id: `ai-${Date.now()}`,
        type: 'ai',
        message: `Here are the latest trends and forecasts for ${domain}:`,
        timestamp: 'Just now',
        context: { domain, action: 'trends_query' },
        insights: [
          {
            type: 'insight',
            title: 'Trend Analysis',
            content: `Positive trends detected in ${domain} with 12% growth trajectory. Seasonal patterns suggest continued improvement.`,
            icon: TrendingUp,
            priority: 'medium'
          }
        ],
        suggestions: ['Show seasonal patterns', 'Forecast next quarter', 'Compare with benchmarks']
      }
    }

    // Default response
    return {
      id: `ai-${Date.now()}`,
      type: 'ai',
      message: `I understand you're asking about ${domain} operations. Let me provide some relevant insights and recommendations.`,
      timestamp: 'Just now',
      context: { domain },
      suggestions: [
        `Show ${domain} dashboard`,
        'Get performance summary',
        'Review recent alerts',
        'Export data'
      ]
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion)
    handleSendMessage()
  }

  const handleQuickAction = (action: string) => {
    console.log(`Quick action: ${action}`)
    alert(`Quick action: ${action}\n\nThis would perform the requested action in the ${domain} system.`)
  }

  const renderMessageContent = (message: AIMessage) => {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-700 leading-relaxed">{message.message}</p>
        
        {message.insights && message.insights.length > 0 && (
          <div className="space-y-2">
            {message.insights.map((insight, index) => {
              const Icon = insight.icon
              return (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border ${
                    insight.type === 'alert' ? 'bg-red-50 border-red-200' :
                    insight.type === 'recommendation' ? 'bg-blue-50 border-blue-200' :
                    'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Icon className={`w-4 h-4 mt-0.5 ${
                      insight.type === 'alert' ? 'text-red-600' :
                      insight.type === 'recommendation' ? 'text-blue-600' :
                      'text-gray-600'
                    }`} />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
                      <p className="text-xs text-gray-600 mb-2">{insight.content}</p>
                      {insight.action && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs h-6"
                          onClick={insight.action.handler}
                        >
                          {insight.action.label}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        
        {message.suggestions && message.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.suggestions.map((suggestion, index) => (
              <Button
                key={index}
                size="sm"
                variant="outline"
                className="text-xs h-7"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={className}>
      <Card className="border border-gray-200 bg-gradient-to-br from-white to-blue-50/30 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  HERA Assistant
                </CardTitle>
                <p className="text-sm text-blue-500 capitalize">{domain} Expert</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="p-1"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </CardHeader>
        
        {!isMinimized && (
          <CardContent>
            <div className="space-y-4">
              {/* Chat Mode Tabs */}
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  className={`flex-1 px-3 py-1 text-xs rounded-md transition-all ${
                    chatMode === 'assistant' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setChatMode('assistant')}
                >
                  💬 Chat
                </button>
                <button
                  className={`flex-1 px-3 py-1 text-xs rounded-md transition-all ${
                    chatMode === 'insights' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setChatMode('insights')}
                >
                  💡 Insights
                </button>
                <button
                  className={`flex-1 px-3 py-1 text-xs rounded-md transition-all ${
                    chatMode === 'actions' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setChatMode('actions')}
                >
                  ⚡ Actions
                </button>
              </div>

              {chatMode === 'assistant' && (
                <>
                  {/* Messages */}
                  <div className="h-64 overflow-y-auto bg-gray-50 rounded-lg p-3">
                    <div className="space-y-3">
                      {messages.map((message) => (
                        <div key={message.id} className="flex gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.type === 'ai' ? 'bg-blue-500' : 'bg-gray-500'
                          }`}>
                            <span className="text-white text-xs">
                              {message.type === 'ai' ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                            </span>
                          </div>
                          <div className={`rounded-lg px-3 py-2 shadow-sm flex-1 ${
                            message.type === 'ai' ? 'bg-white' : 'bg-blue-100'
                          }`}>
                            {renderMessageContent(message)}
                            <div className="text-xs text-gray-400 mt-2">{message.timestamp}</div>
                          </div>
                        </div>
                      ))}
                      
                      {isTyping && (
                        <div className="flex gap-2">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <Bot className="w-3 h-3 text-white" />
                          </div>
                          <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {/* Input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder={`Ask about ${domain} operations...`}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="text-sm border-blue-200 focus:border-blue-400 focus:ring-blue-200"
                    />
                    <Button 
                      size="sm" 
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isTyping}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}

              {chatMode === 'insights' && (
                <div className="space-y-3">
                  <h3 className="font-medium text-sm text-gray-900">Key Insights</h3>
                  <div className="space-y-2">
                    {getDomainSpecificContent(domain).insights.map((insight, index) => {
                      const Icon = insight.icon
                      return (
                        <div key={index} className="p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-start gap-2">
                            <Icon className="w-4 h-4 mt-0.5 text-blue-600" />
                            <div>
                              <h4 className="font-medium text-sm">{insight.title}</h4>
                              <p className="text-xs text-gray-600 mt-1">{insight.content}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {chatMode === 'actions' && (
                <div className="space-y-3">
                  <h3 className="font-medium text-sm text-gray-900">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => handleQuickAction('Generate Report')}
                    >
                      📊 Generate Report
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => handleQuickAction('Export Data')}
                    >
                      📤 Export Data
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => handleQuickAction('Schedule Alert')}
                    >
                      🔔 Set Alert
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => handleQuickAction('Open Dashboard')}
                    >
                      📈 Dashboard
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}