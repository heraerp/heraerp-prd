'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Brain,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Target,
  Lightbulb,
  Zap,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Package,
  Globe,
  Factory,
  ShoppingCart,
  Award,
  Crown,
  Gem,
  Star,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Eye,
  Download,
  Share2,
  Settings,
  RefreshCw,
  Filter,
  Search,
  Calendar,
  Database,
  Cpu,
  Network,
  Shield,
  Rocket,
  Compass,
  MapPin,
  Building2
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface AIInsight {
  id: string
  type: 'opportunity' | 'warning' | 'recommendation' | 'trend'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  confidence: number
  actionable: boolean
  category: string
  priority: number
}

interface PredictiveModel {
  id: string
  name: string
  accuracy: number
  lastUpdated: string
  status: 'active' | 'training' | 'idle'
  predictions: {
    metric: string
    current: number
    predicted: number
    change: number
    timeframe: string
  }[]
}

interface MarketIntelligence {
  segment: string
  marketSize: number
  growth: number
  competition: number
  opportunity: number
  threats: string[]
  recommendations: string[]
}

function BusinessIntelligencePage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('3m')
  const [activeModel, setActiveModel] = useState('revenue-forecast')
  const [aiProcessing, setAiProcessing] = useState(false)

  // AI-Generated Insights
  const aiInsights: AIInsight[] = [
    {
      id: 'insight-1',
      type: 'opportunity',
      title: 'Export Market Expansion Opportunity',
      description: 'UAE and Singapore markets show 45% growth potential based on current demand patterns and competitor analysis.',
      impact: 'high',
      confidence: 89,
      actionable: true,
      category: 'Market Expansion',
      priority: 1
    },
    {
      id: 'insight-2',
      type: 'warning',
      title: 'Inventory Optimization Alert',
      description: 'Luxury furniture segment has 23% excess inventory while hotel furniture shows 18% shortage.',
      impact: 'medium',
      confidence: 94,
      actionable: true,
      category: 'Inventory Management',
      priority: 2
    },
    {
      id: 'insight-3',
      type: 'trend',
      title: 'Seasonal Demand Pattern Detected',
      description: 'Office furniture orders increase by 67% during Q1 and Q3, suggesting budget cycle correlation.',
      impact: 'medium',
      confidence: 92,
      actionable: true,
      category: 'Demand Forecasting',
      priority: 3
    },
    {
      id: 'insight-4',
      type: 'recommendation',
      title: 'Production Efficiency Enhancement',
      description: 'Implementing AI-guided scheduling could improve production efficiency by 15% and reduce costs by ₹12L annually.',
      impact: 'high',
      confidence: 87,
      actionable: true,
      category: 'Operations',
      priority: 1
    },
    {
      id: 'insight-5',
      type: 'opportunity',
      title: 'Customer Lifetime Value Optimization',
      description: 'Premium customers with 3+ years relationship show 340% higher CLV. Focus retention strategies on this segment.',
      impact: 'high',
      confidence: 91,
      actionable: true,
      category: 'Customer Analytics',
      priority: 2
    }
  ]

  // Predictive Models
  const predictiveModels: PredictiveModel[] = [
    {
      id: 'revenue-forecast',
      name: 'Revenue Forecasting Model',
      accuracy: 94.5,
      lastUpdated: '2025-01-16T08:30:00Z',
      status: 'active',
      predictions: [
        { metric: 'Monthly Revenue', current: 2400000, predicted: 2760000, change: 15, timeframe: 'Next Month' },
        { metric: 'Quarterly Revenue', current: 7200000, predicted: 8640000, change: 20, timeframe: 'Next Quarter' },
        { metric: 'Annual Revenue', current: 28800000, predicted: 34560000, change: 20, timeframe: 'Next Year' }
      ]
    },
    {
      id: 'demand-forecast',
      name: 'Demand Prediction Engine',
      accuracy: 91.2,
      lastUpdated: '2025-01-16T06:15:00Z',
      status: 'active',
      predictions: [
        { metric: 'Luxury Furniture Demand', current: 145, predicted: 189, change: 30, timeframe: 'Next 30 Days' },
        { metric: 'Hotel Furniture Orders', current: 67, predicted: 78, change: 16, timeframe: 'Next 30 Days' },
        { metric: 'Export Orders', current: 34, predicted: 47, change: 38, timeframe: 'Next 30 Days' }
      ]
    },
    {
      id: 'churn-prediction',
      name: 'Customer Churn Predictor',
      accuracy: 88.7,
      lastUpdated: '2025-01-16T04:45:00Z',
      status: 'training',
      predictions: [
        { metric: 'At-Risk Customers', current: 23, predicted: 18, change: -22, timeframe: 'Next 60 Days' },
        { metric: 'High-Value Retention', current: 89, predicted: 92, change: 3, timeframe: 'Next Quarter' }
      ]
    }
  ]

  // Market Intelligence Data
  const marketIntelligence: MarketIntelligence[] = [
    {
      segment: 'Luxury Furniture',
      marketSize: 450000000,
      growth: 18.5,
      competition: 67,
      opportunity: 89,
      threats: ['Economic downturn sensitivity', 'Import competition'],
      recommendations: ['Premium positioning', 'Exclusive designs', 'VIP customer programs']
    },
    {
      segment: 'Hotel & Hospitality',
      marketSize: 320000000,
      growth: 24.2,
      competition: 45,
      opportunity: 92,
      threats: ['Tourism fluctuations', 'Chain procurement policies'],
      recommendations: ['Long-term contracts', 'Customization services', 'Maintenance packages']
    },
    {
      segment: 'Export Markets',
      marketSize: 180000000,
      growth: 35.8,
      competition: 78,
      opportunity: 85,
      threats: ['Currency fluctuations', 'Trade regulations'],
      recommendations: ['Diversify markets', 'Local partnerships', 'Compliance automation']
    }
  ]

  // Competitive Intelligence
  const competitorAnalysis = [
    {
      competitor: 'Premium Interiors Ltd',
      marketShare: 15.2,
      strength: 'Brand recognition',
      weakness: 'Limited export presence',
      threat: 'Medium'
    },
    {
      competitor: 'Kerala Crafts Co',
      marketShare: 12.8,
      strength: 'Traditional designs',
      weakness: 'Outdated technology',
      threat: 'Low'
    },
    {
      competitor: 'Global Furniture Group',
      marketShare: 8.5,
      strength: 'International reach',
      weakness: 'Higher pricing',
      threat: 'High'
    }
  ]

  // Real-time Intelligence Metrics
  const intelligenceMetrics = [
    { label: 'AI Models Active', value: '12', status: 'operational', icon: Brain },
    { label: 'Data Points Analyzed', value: '2.4M', status: 'processing', icon: Database },
    { label: 'Predictions Generated', value: '156', status: 'updated', icon: Target },
    { label: 'Insights Accuracy', value: '91.2%', status: 'high', icon: Award }
  ]

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'opportunity': return Lightbulb
      case 'warning': return AlertTriangle
      case 'recommendation': return Target
      case 'trend': return TrendingUp
      default: return Sparkles
    }
  }

  const getInsightColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'opportunity': return 'text-[var(--jewelry-gold-500)]'
      case 'warning': return 'text-[var(--jewelry-warning)]'
      case 'recommendation': return 'text-[var(--jewelry-info)]'
      case 'trend': return 'text-[var(--jewelry-success)]'
      default: return 'text-gray-400'
    }
  }

  const getImpactColor = (impact: AIInsight['impact']) => {
    switch (impact) {
      case 'high': return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'low': return 'bg-green-500/20 text-green-300 border-green-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className="min-h-screen relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--jewelry-blue-500)] to-[var(--jewelry-blue-700)] flex items-center justify-center">
                <Brain className="h-6 w-6 text-[var(--jewelry-gold-400)]" />
              </div>
              Business Intelligence
            </h1>
            <p className="text-gray-300 mt-2">
              AI-powered insights and predictive analytics for strategic decision making
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="gap-2 text-white border-gray-400 hover:border-white hover:text-white"
              onClick={() => setAiProcessing(!aiProcessing)}
            >
              <Cpu className={`h-4 w-4 ${aiProcessing ? 'animate-spin' : ''}`} />
              <span className="text-white">{aiProcessing ? 'Processing...' : 'Run Analysis'}</span>
            </Button>
            <Button variant="outline" className="gap-2 text-white border-gray-400 hover:border-white hover:text-white">
              <Download className="h-4 w-4" />
              <span className="text-white">Export Intelligence</span>
            </Button>
            <Button className="gap-2 bg-[var(--jewelry-gold-500)] text-black hover:bg-[var(--jewelry-gold-600)] border-0">
              <Sparkles className="h-4 w-4" />
              <span className="text-black font-medium">AI Dashboard</span>
            </Button>
          </div>
        </div>

        {/* AI Status Bar */}
        <div className="jewelry-glass-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-[var(--jewelry-gold-500)]" />
              <span className="text-white font-medium">Artificial Intelligence Engine</span>
              <div className="w-2 h-2 bg-[var(--jewelry-success)] rounded-full animate-pulse"></div>
              <span className="text-gray-400 text-sm">Status: Active</span>
            </div>
            <div className="flex items-center gap-6">
              {intelligenceMetrics.map((metric, index) => (
                <div key={index} className="flex items-center gap-2">
                  <metric.icon className="h-4 w-4 text-[var(--jewelry-gold-500)]" />
                  <div>
                    <p className="text-sm text-gray-400">{metric.label}</p>
                    <p className="font-semibold text-white">{metric.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Last AI Analysis</p>
              <p className="text-sm text-white">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>

        {/* AI Insights Section */}
        <div className="jewelry-glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-[var(--jewelry-gold-500)]" />
              <h2 className="text-xl font-semibold text-white">AI-Powered Insights</h2>
              <Badge className="bg-[var(--jewelry-gold-500)]/20 text-[var(--jewelry-gold-500)] border-[var(--jewelry-gold-500)]/30">
                Live Analysis
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-3 py-2 rounded-md border bg-black/20 border-gray-600 text-white focus:border-[var(--jewelry-gold-500)]"
              >
                <option value="1m">Last Month</option>
                <option value="3m">Last 3 Months</option>
                <option value="6m">Last 6 Months</option>
                <option value="1y">Last Year</option>
              </select>
              <Button variant="outline" size="sm" className="text-white border-gray-400 hover:border-white hover:text-white">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {aiInsights.slice(0, 4).map((insight) => {
              const InsightIcon = getInsightIcon(insight.type)
              return (
                <div key={insight.id} className="bg-black/20 rounded-lg p-4 border border-gray-600 hover:border-[var(--jewelry-gold-500)]/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <InsightIcon className={`h-5 w-5 ${getInsightColor(insight.type)}`} />
                      <span className="text-sm text-gray-400 uppercase tracking-wide">{insight.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs border ${getImpactColor(insight.impact)}`}>
                        {insight.impact} impact
                      </Badge>
                      <span className="text-xs text-gray-400">{insight.confidence}% confidence</span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-white mb-2">{insight.title}</h3>
                  <p className="text-gray-300 text-sm mb-3">{insight.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Category: {insight.category}</span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-[var(--jewelry-gold-500)] border-[var(--jewelry-gold-500)]/50 hover:bg-[var(--jewelry-gold-500)]/10"
                    >
                      <span className="text-[var(--jewelry-gold-500)]">Take Action</span>
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Intelligence Tabs */}
        <Tabs defaultValue="predictive" className="space-y-6">
          <TabsList className="bg-black/20 border border-gray-600">
            <TabsTrigger value="predictive" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Predictive Models
            </TabsTrigger>
            <TabsTrigger value="market" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Market Intelligence
            </TabsTrigger>
            <TabsTrigger value="competitive" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Competitive Analysis
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              AI Recommendations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="predictive" className="space-y-6">
            {/* Predictive Models */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Target className="h-6 w-6 text-[var(--jewelry-blue-500)]" />
                  <h3 className="text-xl font-semibold text-white">Predictive Analytics Models</h3>
                </div>
                <Button variant="outline" className="gap-2 text-white border-gray-400 hover:border-white hover:text-white">
                  <Settings className="h-4 w-4" />
                  <span className="text-white">Configure Models</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {predictiveModels.map((model) => (
                  <div key={model.id} className="bg-black/20 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-white">{model.name}</h4>
                      <Badge className={`text-xs ${
                        model.status === 'active' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                        model.status === 'training' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                        'bg-gray-500/20 text-gray-300 border-gray-500/30'
                      }`}>
                        {model.status}
                      </Badge>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400 text-sm">Accuracy</span>
                        <span className="text-[var(--jewelry-gold-500)] font-medium">{model.accuracy}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-[var(--jewelry-gold-500)] h-2 rounded-full"
                          style={{ width: `${model.accuracy}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {model.predictions.map((prediction, index) => (
                        <div key={index} className="bg-black/30 rounded p-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-400 text-sm">{prediction.metric}</span>
                            <span className={`text-sm font-medium ${
                              prediction.change > 0 ? 'text-[var(--jewelry-success)]' : 'text-[var(--jewelry-error)]'
                            }`}>
                              {prediction.change > 0 ? '+' : ''}{prediction.change}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white font-medium">
                              {typeof prediction.predicted === 'number' && prediction.predicted > 1000 ? 
                                formatCurrency(prediction.predicted) : 
                                prediction.predicted
                              }
                            </span>
                            <span className="text-gray-400 text-xs">{prediction.timeframe}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="market" className="space-y-6">
            {/* Market Intelligence */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Globe className="h-6 w-6 text-[var(--jewelry-gold-500)]" />
                  <h3 className="text-xl font-semibold text-white">Market Intelligence Analysis</h3>
                </div>
                <Button variant="outline" className="gap-2 text-white border-gray-400 hover:border-white hover:text-white">
                  <Compass className="h-4 w-4" />
                  <span className="text-white">Market Research</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {marketIntelligence.map((market, index) => (
                  <div key={index} className="bg-black/20 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-white">{market.segment}</h4>
                      <div className="text-right">
                        <p className="text-[var(--jewelry-gold-500)] font-bold text-lg">
                          {formatNumber(market.marketSize)}
                        </p>
                        <p className="text-gray-400 text-xs">Market Size</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-sm">Growth Rate</p>
                        <p className="text-[var(--jewelry-success)] font-semibold">+{market.growth}%</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Competition</p>
                        <p className="text-[var(--jewelry-warning)] font-semibold">{market.competition}%</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Opportunity</p>
                        <p className="text-[var(--jewelry-info)] font-semibold">{market.opportunity}%</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Threats</p>
                        <p className="text-[var(--jewelry-error)] font-semibold">{market.threats.length}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-400 text-sm mb-2">Key Recommendations</p>
                      <div className="space-y-1">
                        {market.recommendations.slice(0, 2).map((rec, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-[var(--jewelry-success)]" />
                            <span className="text-gray-300 text-xs">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full text-white border-gray-400 hover:border-white hover:text-white"
                    >
                      <span className="text-white">Detailed Analysis</span>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="competitive" className="space-y-6">
            {/* Competitive Analysis */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-[var(--jewelry-blue-500)]" />
                  <h3 className="text-xl font-semibold text-white">Competitive Intelligence</h3>
                </div>
                <Button variant="outline" className="gap-2 text-white border-gray-400 hover:border-white hover:text-white">
                  <Search className="h-4 w-4" />
                  <span className="text-white">Monitor Competitors</span>
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Competitor</th>
                      <th className="text-center py-3 px-4 text-gray-400 font-medium">Market Share</th>
                      <th className="text-center py-3 px-4 text-gray-400 font-medium">Strength</th>
                      <th className="text-center py-3 px-4 text-gray-400 font-medium">Weakness</th>
                      <th className="text-center py-3 px-4 text-gray-400 font-medium">Threat Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competitorAnalysis.map((competitor, index) => (
                      <tr key={index} className="border-b border-gray-700/50 hover:bg-black/20">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-gray-300" />
                            </div>
                            <span className="text-white font-medium">{competitor.competitor}</span>
                          </div>
                        </td>
                        <td className="text-center py-4 px-4">
                          <span className="text-[var(--jewelry-gold-500)] font-semibold">{competitor.marketShare}%</span>
                        </td>
                        <td className="text-center py-4 px-4">
                          <span className="text-[var(--jewelry-success)] text-sm">{competitor.strength}</span>
                        </td>
                        <td className="text-center py-4 px-4">
                          <span className="text-[var(--jewelry-error)] text-sm">{competitor.weakness}</span>
                        </td>
                        <td className="text-center py-4 px-4">
                          <Badge className={`${
                            competitor.threat === 'High' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                            competitor.threat === 'Medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                            'bg-green-500/20 text-green-300 border-green-500/30'
                          }`}>
                            {competitor.threat}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            {/* AI Recommendations */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Rocket className="h-6 w-6 text-[var(--jewelry-gold-500)]" />
                  <h3 className="text-xl font-semibold text-white">Strategic AI Recommendations</h3>
                </div>
                <Button className="gap-2 bg-[var(--jewelry-gold-500)] text-black hover:bg-[var(--jewelry-gold-600)] border-0">
                  <Zap className="h-4 w-4" />
                  <span className="text-black font-medium">Generate New Insights</span>
                </Button>
              </div>

              <div className="space-y-4">
                {aiInsights
                  .filter(insight => insight.type === 'recommendation')
                  .concat(aiInsights.filter(insight => insight.type === 'opportunity'))
                  .map((insight, index) => {
                    const InsightIcon = getInsightIcon(insight.type)
                    return (
                      <div key={`rec-${insight.id}-${index}`} className="bg-black/20 rounded-lg p-6 border border-gray-600">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-lg bg-black/30 flex items-center justify-center`}>
                            <InsightIcon className={`h-6 w-6 ${getInsightColor(insight.type)}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-white text-lg">{insight.title}</h4>
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs border ${getImpactColor(insight.impact)}`}>
                                  {insight.impact} impact
                                </Badge>
                                <span className="text-xs text-gray-400">{insight.confidence}% confidence</span>
                              </div>
                            </div>
                            <p className="text-gray-300 mb-4">{insight.description}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-400">Category: <span className="text-[var(--jewelry-gold-500)]">{insight.category}</span></span>
                                <span className="text-sm text-gray-400">Priority: <span className="text-white">#{insight.priority}</span></span>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="text-white border-gray-400 hover:border-white hover:text-white">
                                  <Eye className="h-3 w-3 mr-1" />
                                  <span className="text-white">Review</span>
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="bg-[var(--jewelry-gold-500)] text-black hover:bg-[var(--jewelry-gold-600)]"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  <span className="text-black">Implement</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Intelligence Summary Footer */}
        <div className="jewelry-glass-card p-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Crown className="h-8 w-8 text-[var(--jewelry-gold-500)]" />
              <h3 className="text-2xl font-bold text-white">Intelligence Summary</h3>
            </div>
            <p className="text-gray-400">AI-driven insights powering strategic business decisions</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--jewelry-gold-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Brain className="h-8 w-8 text-[var(--jewelry-gold-500)]" />
              </div>
              <p className="text-2xl font-bold text-white">{aiInsights.length}</p>
              <p className="text-gray-400">Active Insights</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--jewelry-blue-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="h-8 w-8 text-[var(--jewelry-blue-500)]" />
              </div>
              <p className="text-2xl font-bold text-white">91.2%</p>
              <p className="text-gray-400">Prediction Accuracy</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--jewelry-gold-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="h-8 w-8 text-[var(--jewelry-gold-500)]" />
              </div>
              <p className="text-2xl font-bold text-white">24/7</p>
              <p className="text-gray-400">Real-time Analysis</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--jewelry-blue-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="h-8 w-8 text-[var(--jewelry-blue-500)]" />
              </div>
              <p className="text-2xl font-bold text-white">12</p>
              <p className="text-gray-400">AI Models Active</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(BusinessIntelligencePage)