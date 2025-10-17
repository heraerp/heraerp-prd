'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  LineChart,
  BarChart3,
  PieChart,
  Target,
  Zap,
  Eye,
  Brain,
  Compass,
  Globe,
  Star,
  Award,
  Crown,
  Gem,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Calendar,
  Clock,
  Filter,
  Search,
  Download,
  Share2,
  Settings,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Lightbulb,
  Rocket,
  Package,
  Users,
  DollarSign,
  ShoppingCart,
  Building2,
  Factory,
  Home,
  Sofa,
  Palette,
  Leaf,
  Smartphone,
  Wifi,
  Shield,
  Truck,
  Plane,
  Ship,
  MapPin,
  Phone,
  Mail,
  Heart,
  ThumbsUp,
  Sparkles,
  Layers,
  Database,
  Network,
  Cpu
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface MarketTrend {
  id: string
  category: string
  trendName: string
  growth: number
  momentum: 'accelerating' | 'steady' | 'slowing' | 'declining'
  confidence: number
  timeframe: string
  impact: 'high' | 'medium' | 'low'
  opportunity: number
  description: string
  keyDrivers: string[]
  regions: string[]
}

interface TrendForecast {
  period: string
  market: string
  currentValue: number
  predictedValue: number
  growth: number
  confidence: number
  factors: string[]
}

interface ConsumerInsight {
  id: string
  insight: string
  category: 'preference' | 'behavior' | 'demographic' | 'technology'
  impact: number
  trend: 'increasing' | 'decreasing' | 'stable'
  relevance: 'immediate' | 'short_term' | 'long_term'
  actionable: boolean
}

interface CompetitiveTrend {
  competitor: string
  strategy: string
  impact: 'disruptive' | 'incremental' | 'defensive'
  marketResponse: number
  threat: 'high' | 'medium' | 'low'
  countermeasures: string[]
}

function MarketTrendsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTimeframe, setSelectedTimeframe] = useState('6m')
  const [trendAnalysisRunning, setTrendAnalysisRunning] = useState(false)

  // Current Market Trends
  const marketTrends: MarketTrend[] = [
    {
      id: 'trend-1',
      category: 'Sustainability',
      trendName: 'Eco-Friendly Materials & Manufacturing',
      growth: 45.2,
      momentum: 'accelerating',
      confidence: 94,
      timeframe: 'Long-term',
      impact: 'high',
      opportunity: 85,
      description: 'Growing demand for sustainable furniture made from recycled materials, FSC-certified wood, and carbon-neutral manufacturing processes.',
      keyDrivers: ['Environmental awareness', 'Government regulations', 'Corporate ESG goals', 'Consumer preferences'],
      regions: ['Europe', 'North America', 'Urban India']
    },
    {
      id: 'trend-2',
      category: 'Technology',
      trendName: 'Smart Furniture & IoT Integration',
      growth: 67.8,
      momentum: 'accelerating',
      confidence: 89,
      timeframe: 'Medium-term',
      impact: 'high',
      opportunity: 92,
      description: 'Integration of smart technology in furniture including wireless charging, app-controlled features, and health monitoring capabilities.',
      keyDrivers: ['Digital transformation', 'Remote work trends', 'Health consciousness', 'Tech adoption'],
      regions: ['Asia Pacific', 'North America', 'Middle East']
    },
    {
      id: 'trend-3',
      category: 'Design',
      trendName: 'Minimalist & Multi-functional Design',
      growth: 32.4,
      momentum: 'steady',
      confidence: 91,
      timeframe: 'Medium-term',
      impact: 'medium',
      opportunity: 78,
      description: 'Preference for clean, minimalist designs with multiple functions to maximize space utilization in urban living.',
      keyDrivers: ['Urbanization', 'Space constraints', 'Lifestyle changes', 'Cost consciousness'],
      regions: ['Asia', 'Europe', 'Urban centers globally']
    },
    {
      id: 'trend-4',
      category: 'Hospitality',
      trendName: 'Boutique Hotel Experience Design',
      growth: 28.7,
      momentum: 'steady',
      confidence: 87,
      timeframe: 'Short-term',
      impact: 'medium',
      opportunity: 73,
      description: 'Hotels focusing on unique, locally-inspired furniture and design to create memorable guest experiences.',
      keyDrivers: ['Experience economy', 'Social media influence', 'Local culture appreciation', 'Brand differentiation'],
      regions: ['Tourist destinations', 'Major cities', 'Cultural centers']
    },
    {
      id: 'trend-5',
      category: 'Workspace',
      trendName: 'Hybrid Work Environment Furniture',
      growth: 52.1,
      momentum: 'accelerating',
      confidence: 93,
      timeframe: 'Immediate',
      impact: 'high',
      opportunity: 88,
      description: 'Furniture designed for flexible work arrangements including home offices, co-working spaces, and hybrid meeting rooms.',
      keyDrivers: ['Remote work adoption', 'Work-life balance', 'Productivity focus', 'Space flexibility'],
      regions: ['Global', 'Tech hubs', 'Urban areas']
    },
    {
      id: 'trend-6',
      category: 'Luxury',
      trendName: 'Artisanal & Heritage Craftsmanship',
      growth: 23.6,
      momentum: 'steady',
      confidence: 85,
      timeframe: 'Long-term',
      impact: 'medium',
      opportunity: 65,
      description: 'Premium market appreciation for hand-crafted furniture with traditional techniques and cultural heritage.',
      keyDrivers: ['Authenticity seeking', 'Cultural pride', 'Exclusivity desire', 'Investment mindset'],
      regions: ['India', 'Europe', 'High-income markets']
    }
  ]

  // Trend Forecasts
  const trendForecasts: TrendForecast[] = [
    {
      period: 'Q2 2025',
      market: 'Smart Furniture',
      currentValue: 180000000,
      predictedValue: 245000000,
      growth: 36.1,
      confidence: 89,
      factors: ['IoT adoption', 'Health tech integration', 'Remote work trends']
    },
    {
      period: 'Q3 2025',
      market: 'Sustainable Furniture',
      currentValue: 320000000,
      predictedValue: 425000000,
      growth: 32.8,
      confidence: 94,
      factors: ['Environmental regulations', 'Consumer awareness', 'Corporate ESG']
    },
    {
      period: 'Q4 2025',
      market: 'Hotel Furniture',
      currentValue: 450000000,
      predictedValue: 567000000,
      growth: 26.0,
      confidence: 87,
      factors: ['Tourism recovery', 'Boutique hotel growth', 'Experience economy']
    },
    {
      period: '2026',
      market: 'Export Furniture',
      currentValue: 780000000,
      predictedValue: 1120000000,
      growth: 43.6,
      confidence: 91,
      factors: ['Global demand', 'Trade agreements', 'Quality recognition']
    }
  ]

  // Consumer Insights
  const consumerInsights: ConsumerInsight[] = [
    {
      id: 'insight-1',
      insight: '73% of millennials prioritize sustainable furniture over price',
      category: 'preference',
      impact: 85,
      trend: 'increasing',
      relevance: 'immediate',
      actionable: true
    },
    {
      id: 'insight-2',
      insight: 'Home office furniture demand increased 340% post-pandemic',
      category: 'behavior',
      impact: 92,
      trend: 'stable',
      relevance: 'immediate',
      actionable: true
    },
    {
      id: 'insight-3',
      insight: 'Gen Z prefers rental/subscription models for furniture',
      category: 'demographic',
      impact: 67,
      trend: 'increasing',
      relevance: 'short_term',
      actionable: true
    },
    {
      id: 'insight-4',
      insight: 'AI-powered furniture configuration tools drive 45% higher conversion',
      category: 'technology',
      impact: 78,
      trend: 'increasing',
      relevance: 'immediate',
      actionable: true
    },
    {
      id: 'insight-5',
      insight: 'Wellness-focused furniture (ergonomic, air-purifying) gaining traction',
      category: 'preference',
      impact: 71,
      trend: 'increasing',
      relevance: 'short_term',
      actionable: true
    }
  ]

  // Competitive Trends
  const competitiveTrends: CompetitiveTrend[] = [
    {
      competitor: 'IKEA India',
      strategy: 'Aggressive local sourcing and pricing strategy',
      impact: 'disruptive',
      marketResponse: 78,
      threat: 'high',
      countermeasures: ['Premium positioning', 'Quality differentiation', 'Service excellence']
    },
    {
      competitor: 'Urban Ladder',
      strategy: 'Direct-to-consumer digital-first approach',
      impact: 'incremental',
      marketResponse: 65,
      threat: 'medium',
      countermeasures: ['Omnichannel strategy', 'Digital transformation', 'Customer experience']
    },
    {
      competitor: 'Godrej Interio',
      strategy: 'Corporate and institutional focus with scale advantages',
      impact: 'defensive',
      marketResponse: 52,
      threat: 'medium',
      countermeasures: ['Niche specialization', 'Relationship building', 'Innovation focus']
    }
  ]

  // Trend Categories for filtering
  const trendCategories = ['all', 'Sustainability', 'Technology', 'Design', 'Hospitality', 'Workspace', 'Luxury']

  const filteredTrends = selectedCategory === 'all' 
    ? marketTrends 
    : marketTrends.filter(trend => trend.category === selectedCategory)

  const getMomentumColor = (momentum: MarketTrend['momentum']) => {
    switch (momentum) {
      case 'accelerating': return 'text-[var(--jewelry-success)]'
      case 'steady': return 'text-[var(--jewelry-info)]'
      case 'slowing': return 'text-[var(--jewelry-warning)]'
      case 'declining': return 'text-[var(--jewelry-error)]'
      default: return 'text-gray-400'
    }
  }

  const getMomentumIcon = (momentum: MarketTrend['momentum']) => {
    switch (momentum) {
      case 'accelerating': return <ArrowUp className="h-4 w-4" />
      case 'steady': return <ArrowRight className="h-4 w-4" />
      case 'slowing': return <ArrowDown className="h-4 w-4" />
      case 'declining': return <TrendingDown className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'low': return 'bg-green-500/20 text-green-300 border-green-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Sustainability': return Leaf
      case 'Technology': return Smartphone
      case 'Design': return Palette
      case 'Hospitality': return Building2
      case 'Workspace': return Factory
      case 'Luxury': return Crown
      default: return Activity
    }
  }

  const getInsightIcon = (category: ConsumerInsight['category']) => {
    switch (category) {
      case 'preference': return Heart
      case 'behavior': return Activity
      case 'demographic': return Users
      case 'technology': return Smartphone
      default: return Lightbulb
    }
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) return `₹${(amount / 1000000000).toFixed(1)}B`
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
    return `₹${amount}`
  }

  return (
    <div className="min-h-screen relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--jewelry-blue-500)] to-[var(--jewelry-blue-700)] flex items-center justify-center">
                <Activity className="h-6 w-6 text-[var(--jewelry-gold-400)]" />
              </div>
              Market Trends
            </h1>
            <p className="text-gray-300 mt-2">
              Advanced market intelligence and trend analysis for strategic decision making
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-3 py-2 rounded-md border bg-black/20 border-gray-600 text-white focus:border-[var(--jewelry-gold-500)]"
              >
                <option value="3m">Last 3 months</option>
                <option value="6m">Last 6 months</option>
                <option value="1y">Last year</option>
                <option value="2y">Last 2 years</option>
              </select>
            </div>
            <Button 
              variant="outline" 
              className="gap-2 text-white border-gray-400 hover:border-white hover:text-white"
              onClick={() => setTrendAnalysisRunning(!trendAnalysisRunning)}
            >
              <Brain className={`h-4 w-4 ${trendAnalysisRunning ? 'animate-pulse' : ''}`} />
              <span className="text-white">{trendAnalysisRunning ? 'Analyzing...' : 'AI Analysis'}</span>
            </Button>
            <Button variant="outline" className="gap-2 text-white border-gray-400 hover:border-white hover:text-white">
              <Download className="h-4 w-4" />
              <span className="text-white">Export Report</span>
            </Button>
            <Button className="gap-2 bg-[var(--jewelry-gold-500)] text-black hover:bg-[var(--jewelry-gold-600)] border-0">
              <Compass className="h-4 w-4" />
              <span className="text-black font-medium">Trend Dashboard</span>
            </Button>
          </div>
        </div>

        {/* Trend Intelligence Status */}
        <div className="jewelry-glass-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[var(--jewelry-gold-500)]" />
              <span className="text-white font-medium">Market Intelligence Engine</span>
              <div className="w-2 h-2 bg-[var(--jewelry-success)] rounded-full animate-pulse"></div>
              <span className="text-gray-400 text-sm">Status: Active Monitoring</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-400">Trends Monitored</p>
                <p className="font-semibold text-white">{marketTrends.length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Data Sources</p>
                <p className="font-semibold text-white">24</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Analysis Confidence</p>
                <p className="font-semibold text-[var(--jewelry-gold-500)]">89.4%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Market Coverage</p>
                <p className="font-semibold text-[var(--jewelry-success)]">Global</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Last Update</p>
              <p className="text-sm text-white">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>

        {/* Trend Category Filter */}
        <div className="jewelry-glass-card p-4">
          <div className="flex items-center gap-4 overflow-x-auto">
            <span className="text-white font-medium whitespace-nowrap">Filter by Category:</span>
            <div className="flex gap-2">
              {trendCategories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={`whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-[var(--jewelry-gold-500)] text-black hover:bg-[var(--jewelry-gold-600)]'
                      : 'text-white border-gray-400 hover:border-white hover:text-white'
                  }`}
                >
                  <span className={selectedCategory === category ? 'text-black' : 'text-white'}>
                    {category === 'all' ? 'All Trends' : category}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Market Trends Analysis */}
        <Tabs defaultValue="current" className="space-y-6">
          <TabsList className="bg-black/20 border border-gray-600">
            <TabsTrigger value="current" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Current Trends
            </TabsTrigger>
            <TabsTrigger value="forecasts" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Forecasts
            </TabsTrigger>
            <TabsTrigger value="consumer" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Consumer Insights
            </TabsTrigger>
            <TabsTrigger value="competitive" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Competitive Intelligence
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-6">
            {/* Current Market Trends */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-[var(--jewelry-gold-500)]" />
                  <h3 className="text-xl font-semibold text-white">Active Market Trends</h3>
                  <Badge className="bg-[var(--jewelry-gold-500)]/20 text-[var(--jewelry-gold-500)] border-[var(--jewelry-gold-500)]/30">
                    {filteredTrends.length} Trends
                  </Badge>
                </div>
                <Button variant="outline" className="gap-2 text-white border-gray-400 hover:border-white hover:text-white">
                  <Eye className="h-4 w-4" />
                  <span className="text-white">Detailed Analysis</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredTrends.map((trend) => {
                  const CategoryIcon = getCategoryIcon(trend.category)
                  return (
                    <div key={trend.id} className="bg-black/20 rounded-lg p-6 border border-gray-600 hover:border-[var(--jewelry-gold-500)]/50 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-black/30 flex items-center justify-center">
                            <CategoryIcon className="h-6 w-6 text-[var(--jewelry-gold-500)]" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-white text-lg">{trend.trendName}</h4>
                            <p className="text-gray-400 text-sm">{trend.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 mb-1">
                            {getMomentumIcon(trend.momentum)}
                            <span className={`text-lg font-bold ${getMomentumColor(trend.momentum)}`}>
                              +{trend.growth}%
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">{trend.momentum}</p>
                        </div>
                      </div>

                      <p className="text-gray-300 text-sm mb-4">{trend.description}</p>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-gray-400 text-sm">Confidence</p>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-700 rounded-full">
                              <div
                                className="h-2 bg-[var(--jewelry-gold-500)] rounded-full"
                                style={{ width: `${trend.confidence}%` }}
                              ></div>
                            </div>
                            <span className="text-white font-semibold text-sm">{trend.confidence}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Opportunity</p>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-700 rounded-full">
                              <div
                                className="h-2 bg-[var(--jewelry-success)] rounded-full"
                                style={{ width: `${trend.opportunity}%` }}
                              ></div>
                            </div>
                            <span className="text-white font-semibold text-sm">{trend.opportunity}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Key Drivers</p>
                          <div className="flex flex-wrap gap-1">
                            {trend.keyDrivers.slice(0, 3).map((driver, index) => (
                              <Badge key={index} variant="secondary" className="text-xs bg-gray-700 text-gray-200">
                                {driver}
                              </Badge>
                            ))}
                            {trend.keyDrivers.length > 3 && (
                              <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-200">
                                +{trend.keyDrivers.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-gray-400 text-sm mb-1">Key Regions</p>
                          <div className="flex flex-wrap gap-1">
                            {trend.regions.map((region, index) => (
                              <Badge key={index} variant="secondary" className="text-xs bg-[var(--jewelry-blue-500)]/20 text-[var(--jewelry-blue-300)]">
                                {region}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-600">
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs border ${getImpactColor(trend.impact)}`}>
                            {trend.impact} impact
                          </Badge>
                          <span className="text-xs text-gray-400">{trend.timeframe}</span>
                        </div>
                        <Button size="sm" variant="outline" className="text-[var(--jewelry-gold-500)] border-[var(--jewelry-gold-500)]/50 hover:bg-[var(--jewelry-gold-500)]/10">
                          <span className="text-[var(--jewelry-gold-500)]">Explore</span>
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="forecasts" className="space-y-6">
            {/* Trend Forecasts */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Target className="h-6 w-6 text-[var(--jewelry-blue-500)]" />
                  <h3 className="text-xl font-semibold text-white">Market Forecasts</h3>
                </div>
                <Button variant="outline" className="gap-2 text-white border-gray-400 hover:border-white hover:text-white">
                  <Settings className="h-4 w-4" />
                  <span className="text-white">Configure Models</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {trendForecasts.map((forecast, index) => (
                  <div key={index} className="bg-black/20 rounded-lg p-6 border border-gray-600">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-white text-lg">{forecast.market}</h4>
                        <p className="text-gray-400 text-sm">{forecast.period}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[var(--jewelry-gold-500)]">+{forecast.growth}%</p>
                        <p className="text-xs text-gray-400">{forecast.confidence}% confidence</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-400 text-sm">Current Value</p>
                          <p className="text-white font-semibold">{formatCurrency(forecast.currentValue)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Predicted Value</p>
                          <p className="text-[var(--jewelry-success)] font-semibold">{formatCurrency(forecast.predictedValue)}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-gray-400 text-sm mb-2">Growth Factors</p>
                        <div className="space-y-1">
                          {forecast.factors.map((factor, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-[var(--jewelry-success)]" />
                              <span className="text-gray-300 text-sm">{factor}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-gray-400 text-sm mb-1">Forecast Accuracy</p>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-[var(--jewelry-gold-500)] h-2 rounded-full transition-all"
                            style={{ width: `${forecast.confidence}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="consumer" className="space-y-6">
            {/* Consumer Insights */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-[var(--jewelry-gold-500)]" />
                  <h3 className="text-xl font-semibold text-white">Consumer Behavior Insights</h3>
                </div>
                <Button variant="outline" className="gap-2 text-white border-gray-400 hover:border-white hover:text-white">
                  <Brain className="h-4 w-4" />
                  <span className="text-white">AI Insights</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {consumerInsights.map((insight) => {
                  const InsightIcon = getInsightIcon(insight.category)
                  return (
                    <div key={insight.id} className="bg-black/20 rounded-lg p-4 border border-gray-600">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-black/30 flex items-center justify-center">
                          <InsightIcon className="h-5 w-5 text-[var(--jewelry-gold-500)]" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-200">
                              {insight.category}
                            </Badge>
                            <div className="flex items-center gap-1">
                              {insight.trend === 'increasing' ? (
                                <TrendingUp className="h-3 w-3 text-[var(--jewelry-success)]" />
                              ) : insight.trend === 'decreasing' ? (
                                <TrendingDown className="h-3 w-3 text-[var(--jewelry-error)]" />
                              ) : (
                                <ArrowRight className="h-3 w-3 text-gray-400" />
                              )}
                              <span className="text-xs text-gray-400">{insight.trend}</span>
                            </div>
                          </div>
                          <p className="text-white font-medium mb-2">{insight.insight}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">Impact:</span>
                              <div className="w-12 h-1.5 bg-gray-700 rounded-full">
                                <div
                                  className="h-1.5 bg-[var(--jewelry-gold-500)] rounded-full"
                                  style={{ width: `${insight.impact}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-white">{insight.impact}%</span>
                            </div>
                            <Badge className={`text-xs ${
                              insight.relevance === 'immediate' ? 'bg-red-500/20 text-red-300' :
                              insight.relevance === 'short_term' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-green-500/20 text-green-300'
                            }`}>
                              {insight.relevance.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="competitive" className="space-y-6">
            {/* Competitive Intelligence */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-[var(--jewelry-blue-500)]" />
                  <h3 className="text-xl font-semibold text-white">Competitive Trend Analysis</h3>
                </div>
                <Button variant="outline" className="gap-2 text-white border-gray-400 hover:border-white hover:text-white">
                  <Search className="h-4 w-4" />
                  <span className="text-white">Monitor Competitors</span>
                </Button>
              </div>

              <div className="space-y-4">
                {competitiveTrends.map((trend, index) => (
                  <div key={index} className="bg-black/20 rounded-lg p-6 border border-gray-600">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-gray-300" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white text-lg">{trend.competitor}</h4>
                          <p className="text-gray-400 text-sm">{trend.strategy}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`text-xs mb-2 ${
                          trend.threat === 'high' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                          trend.threat === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                          'bg-green-500/20 text-green-300 border-green-500/30'
                        }`}>
                          {trend.threat} threat
                        </Badge>
                        <p className="text-lg font-bold text-[var(--jewelry-gold-500)]">{trend.marketResponse}%</p>
                        <p className="text-xs text-gray-400">market response</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-gray-400 text-sm mb-2">Strategic Impact</p>
                        <Badge className={`text-sm ${
                          trend.impact === 'disruptive' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                          trend.impact === 'incremental' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                          'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        }`}>
                          {trend.impact}
                        </Badge>
                      </div>

                      <div>
                        <p className="text-gray-400 text-sm mb-2">Recommended Countermeasures</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {trend.countermeasures.map((measure, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <Target className="h-3 w-3 text-[var(--jewelry-gold-500)]" />
                              <span className="text-gray-300 text-sm">{measure}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Trend Intelligence Summary */}
        <div className="jewelry-glass-card p-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Compass className="h-8 w-8 text-[var(--jewelry-gold-500)]" />
              <h3 className="text-2xl font-bold text-white">Market Intelligence Summary</h3>
            </div>
            <p className="text-gray-400">Strategic insights from comprehensive market trend analysis</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--jewelry-gold-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-8 w-8 text-[var(--jewelry-gold-500)]" />
              </div>
              <p className="text-2xl font-bold text-white">{marketTrends.length}</p>
              <p className="text-gray-400">Active Trends</p>
              <p className="text-[var(--jewelry-success)] text-sm">All accelerating</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--jewelry-blue-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="h-8 w-8 text-[var(--jewelry-blue-500)]" />
              </div>
              <p className="text-2xl font-bold text-white">89.4%</p>
              <p className="text-gray-400">Forecast Accuracy</p>
              <p className="text-[var(--jewelry-success)] text-sm">High confidence</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--jewelry-gold-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Globe className="h-8 w-8 text-[var(--jewelry-gold-500)]" />
              </div>
              <p className="text-2xl font-bold text-white">24</p>
              <p className="text-gray-400">Data Sources</p>
              <p className="text-[var(--jewelry-success)] text-sm">Global coverage</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--jewelry-blue-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Brain className="h-8 w-8 text-[var(--jewelry-blue-500)]" />
              </div>
              <p className="text-2xl font-bold text-white">Real-time</p>
              <p className="text-gray-400">AI Analysis</p>
              <p className="text-[var(--jewelry-gold-500)] text-sm">Continuous monitoring</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(MarketTrendsPage)