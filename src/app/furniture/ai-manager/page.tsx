'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Brain,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Send,
  Mic,
  FileText,
  BarChart3,
  Users,
  Package,
  DollarSign,
  Target,
  Globe,
  TreePine,
  Hammer,
  Star,
  Calendar,
  MapPin,
  Ship,
  Zap
} from 'lucide-react'

interface Insight {
  id: string
  type: 'opportunity' | 'risk' | 'trend' | 'recommendation'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  category: string
  timestamp: string
  actionable: boolean
}

interface MetricCard {
  label: string
  value: string
  change: string
  trend: 'up' | 'down' | 'neutral'
  icon: React.ElementType
  color: string
}

export default function AIBusinessManager() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('overview')
  const [insights, setInsights] = useState<Insight[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'ai', content: string, timestamp: string}>>([])

  // Kerala furniture industry specific metrics
  const metrics: MetricCard[] = [
    {
      label: 'Export Revenue',
      value: '₹45.2L',
      change: '+18% from last quarter',
      trend: 'up',
      icon: Ship,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      label: 'Hotel Orders',
      value: '23 Active',
      change: '5 new this month',
      trend: 'up',
      icon: Target,
      color: 'from-green-500 to-emerald-500'
    },
    {
      label: 'Teak Inventory',
      value: '2.5 Tons',
      change: '15 days remaining',
      trend: 'neutral',
      icon: TreePine,
      color: 'from-amber-500 to-orange-500'
    },
    {
      label: 'Craftsman Efficiency',
      value: '87%',
      change: '+5% this month',
      trend: 'up',
      icon: Hammer,
      color: 'from-purple-500 to-indigo-500'
    }
  ]

  const quickInsightButtons = [
    { label: 'Monsoon Impact Analysis', icon: Calendar, query: 'How will the upcoming monsoon affect our production and material costs?' },
    { label: 'Export Opportunities', icon: Globe, query: 'What are the current international furniture market trends and opportunities?' },
    { label: 'Material Price Forecast', icon: TrendingUp, query: 'Predict teak and rosewood price trends for the next quarter' },
    { label: 'Hotel Industry Analysis', icon: Users, query: 'Analyze our performance in the Kerala hospitality sector' },
    { label: 'Craftsman Productivity', icon: Hammer, query: 'How can we improve traditional craftwork efficiency?' },
    { label: 'Festival Season Planning', icon: Star, query: 'Prepare strategy for upcoming festival season demand' }
  ]

  const keralaCulturalInsights = [
    {
      id: '1',
      type: 'opportunity' as const,
      title: 'Onam Festival Demand Surge',
      description: 'Historical data shows 40% increase in premium furniture demand during Onam season. Prepare inventory of traditional designs.',
      impact: 'high' as const,
      category: 'Seasonal Planning',
      timestamp: '2 hours ago',
      actionable: true
    },
    {
      id: '2',
      type: 'trend' as const,
      title: 'International Teak Prices Rising',
      description: 'Global teak prices up 15% due to sustainable sourcing regulations. Consider increasing our eco-friendly positioning.',
      impact: 'medium' as const,
      category: 'Material Costs',
      timestamp: '4 hours ago',
      actionable: true
    },
    {
      id: '3',
      type: 'recommendation' as const,
      title: 'Focus on Boutique Hotel Segment',
      description: 'Kerala\'s boutique hotel industry growing 25% annually. Our traditional craftsmanship aligns perfectly with this luxury segment.',
      impact: 'high' as const,
      category: 'Market Strategy',
      timestamp: '1 day ago',
      actionable: true
    },
    {
      id: '4',
      type: 'risk' as const,
      title: 'Export Documentation Delays',
      description: 'Recent customs clearance times increased by 30%. Consider partnering with specialized export consultants.',
      impact: 'medium' as const,
      category: 'Export Operations',
      timestamp: '2 days ago',
      actionable: true
    }
  ]

  useEffect(() => {
    setInsights(keralaCulturalInsights)
  }, [])

  const handleQuickInsight = (insightQuery: string) => {
    setQuery(insightQuery)
    handleSubmitQuery(insightQuery)
  }

  const handleSubmitQuery = async (queryText: string = query) => {
    if (!queryText.trim()) return
    
    setIsLoading(true)
    
    // Add user message to chat
    const userMessage = {
      role: 'user' as const,
      content: queryText,
      timestamp: new Date().toLocaleTimeString()
    }
    
    setChatHistory(prev => [...prev, userMessage])
    
    // Simulate AI response with Kerala furniture context
    setTimeout(() => {
      const responses = {
        'monsoon': 'Based on historical patterns, the monsoon season typically reduces outdoor work by 30-40%. I recommend: 1) Increase indoor finishing work capacity, 2) Stock up on seasoned wood before July, 3) Plan maintenance during heavy rain periods. Expected material cost increase: 8-12%.',
        'export': 'Current international trends favor sustainable, handcrafted furniture. Key opportunities: 1) European market shows 25% growth in tropical wood furniture, 2) Middle East hospitality sector expanding, 3) US market values Kerala craftsmanship stories. Recommend targeting luxury resorts and eco-conscious buyers.',
        'hotel': 'Kerala hospitality analysis: 1) 15 new boutique hotels opening in 2024, 2) Average order value ₹8.5L per property, 3) Peak demand: Oct-Mar tourist season, 4) Preferred styles: Contemporary with traditional accents. Success rate with existing hotel clients: 85%.',
        'default': `Analyzing your Kerala furniture business query. Based on our data, I recommend focusing on three key areas: 1) Leveraging Kerala's traditional craftsmanship for premium positioning, 2) Optimizing for seasonal demand patterns, 3) Building stronger relationships with the growing hospitality sector. Would you like me to dive deeper into any specific aspect?`
      }
      
      let response = responses.default
      const lowerQuery = queryText.toLowerCase()
      
      if (lowerQuery.includes('monsoon') || lowerQuery.includes('weather')) response = responses.monsoon
      else if (lowerQuery.includes('export') || lowerQuery.includes('international')) response = responses.export
      else if (lowerQuery.includes('hotel') || lowerQuery.includes('hospitality')) response = responses.hotel
      
      const aiMessage = {
        role: 'ai' as const,
        content: response,
        timestamp: new Date().toLocaleTimeString()
      }
      
      setChatHistory(prev => [...prev, aiMessage])
      setIsLoading(false)
      setQuery('')
    }, 1500)
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'risk': return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case 'trend': return <BarChart3 className="h-4 w-4 text-blue-500" />
      case 'recommendation': return <CheckCircle className="h-4 w-4 text-purple-500" />
      default: return <Sparkles className="h-4 w-4 text-gray-300" />
    }
  }

  const getImpactBadge = (impact: string) => {
    const colors = {
      high: 'bg-red-500/10 text-red-600 border-red-500/20',
      medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      low: 'bg-green-500/10 text-green-600 border-green-500/20'
    }
    return colors[impact as keyof typeof colors] || colors.medium
  }

  return (
    <div className="min-h-screen">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="jewelry-glass-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="jewelry-crown-glow p-3 rounded-xl">
                  <Brain className="h-8 w-8 jewelry-text-gold" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold jewelry-text-luxury flex items-center gap-2">
                    AI Business Manager
                    <Sparkles className="h-6 w-6 jewelry-text-gold" />
                  </h1>
                  <p className="text-lg text-gray-300">Kerala Furniture Industry Intelligence & Insights</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  <Zap className="h-3 w-3 mr-1" />
                  AI Active
                </Badge>
                <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                  <MapPin className="h-3 w-3 mr-1" />
                  Kerala Context
                </Badge>
              </div>
            </div>
          </div>

          {/* Key Metrics Dashboard */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold jewelry-text-luxury">Real-Time Business Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {metrics.map((metric, index) => (
                <div key={index} className="jewelry-glass-card p-6 jewelry-scale-hover">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${metric.color} flex items-center justify-center`}>
                      <metric.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${
                      metric.trend === 'up' ? 'text-green-500' : 
                      metric.trend === 'down' ? 'text-red-500' : 'text-gray-300'
                    }`}>
                      {metric.trend === 'up' ? <TrendingUp className="h-4 w-4" /> : 
                       metric.trend === 'down' ? <TrendingDown className="h-4 w-4" /> : null}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">{metric.label}</p>
                    <p className="text-2xl font-bold jewelry-text-luxury">{metric.value}</p>
                    <p className="text-sm text-gray-300 mt-1">{metric.change}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Insights */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold jewelry-text-luxury">Quick Business Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickInsightButtons.map((button, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="jewelry-glass-btn h-auto p-4 flex flex-col items-start gap-2 jewelry-text-luxury hover:jewelry-text-gold"
                  onClick={() => handleQuickInsight(button.query)}
                >
                  <div className="flex items-center gap-2">
                    <button.icon className="h-5 w-5" />
                    <span className="font-medium">{button.label}</span>
                  </div>
                  <span className="text-xs text-gray-300 text-left">{button.query}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* AI Chat Interface */}
          <div className="jewelry-glass-card p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold jewelry-text-luxury flex items-center gap-2">
                <Brain className="h-5 w-5 jewelry-text-gold" />
                Ask Your AI Business Advisor
              </h3>
              
              {/* Chat History */}
              <div className="max-h-96 overflow-y-auto space-y-3 bg-black/10 rounded-lg p-4">
                {chatHistory.length === 0 ? (
                  <div className="text-center text-gray-300 py-8">
                    <Brain className="h-12 w-12 mx-auto mb-4 jewelry-text-gold opacity-50" />
                    <p>Ask me anything about your Kerala furniture business!</p>
                    <p className="text-sm mt-2">Try: "How can we improve our export sales?" or use the quick insights above.</p>
                  </div>
                ) : (
                  chatHistory.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user' 
                          ? 'bg-blue-500/20 jewelry-text-luxury' 
                          : 'bg-white/5 text-gray-300'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-300">
                        <div className="animate-spin h-4 w-4 border-2 border-jewelry-gold-500 border-t-transparent rounded-full"></div>
                        Analyzing your Kerala furniture business data...
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Query Input */}
              <div className="flex gap-2">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask about your business: revenue trends, market opportunities, operational insights..."
                  className="flex-1 jewelry-glass-input"
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmitQuery()}
                />
                <Button
                  onClick={() => handleSubmitQuery()}
                  disabled={!query.trim() || isLoading}
                  className="jewelry-glass-btn"
                >
                  <Send className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="jewelry-glass-btn">
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* AI-Generated Insights */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold jewelry-text-luxury">Kerala Furniture Industry Insights</h2>
            <div className="grid gap-4">
              {insights.map((insight) => (
                <div key={insight.id} className="jewelry-glass-card p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold jewelry-text-luxury">{insight.title}</h3>
                          <Badge className={getImpactBadge(insight.impact)}>
                            {insight.impact} impact
                          </Badge>
                        </div>
                        <p className="text-gray-300 mb-3">{insight.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-300">
                          <span>{insight.category}</span>
                          <span>•</span>
                          <span>{insight.timestamp}</span>
                        </div>
                      </div>
                    </div>
                    {insight.actionable && (
                      <Button size="sm" variant="outline" className="jewelry-glass-btn">
                        Take Action
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Industry Benchmarks */}
          <div className="jewelry-glass-card p-6">
            <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Kerala Furniture Industry Benchmarks</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold jewelry-text-gold">85%</div>
                <div className="text-sm text-gray-300">Export Quality Rating</div>
                <div className="text-xs text-gray-300 mt-1">vs. 78% industry avg</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold jewelry-text-gold">₹2.5L</div>
                <div className="text-sm text-gray-300">Avg Order Value</div>
                <div className="text-xs text-gray-300 mt-1">vs. ₹1.8L industry avg</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold jewelry-text-gold">22 days</div>
                <div className="text-sm text-gray-300">Production Cycle</div>
                <div className="text-xs text-gray-300 mt-1">vs. 28 days industry avg</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}