'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Brain,
  Zap,
  Target,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  Users,
  Package,
  ShoppingBag,
  Star,
  Heart,
  Eye,
  EyeOff,
  Settings,
  Play,
  Pause,
  RefreshCw,
  Save,
  Download,
  Upload,
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  Bell,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Lightbulb,
  Sparkles,
  Award,
  Crown,
  Gem,
  Diamond,
  Scale,
  Tag,
  DollarSign,
  Percent,
  Hash,
  Plus,
  Minus,
  Edit,
  Trash2,
  Copy,
  Share2,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Grid,
  List,
  Layers,
  Activity,
  Navigation,
  Compass,
  Database,
  Cloud,
  Cpu,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Wifi,
  Signal,
  Battery,
  Shield,
  Lock,
  Key,
  User,
  CreditCard,
  Camera,
  Image,
  Video,
  FileText,
  Folder,
  Archive,
  Bookmark,
  Flag,
  Home,
  Store,
  Warehouse,
  Factory,
  Building,
  MapPin as Location
} from 'lucide-react'
import '@/styles/jewelry-glassmorphism.css'

interface AIRecommendation {
  id: string
  type: 'product' | 'pricing' | 'customer' | 'inventory' | 'marketing' | 'trend'
  title: string
  description: string
  confidence: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  impact: {
    revenue: number
    customers: number
    efficiency: number
  }
  category: string
  data: any
  actions: {
    primary: string
    secondary?: string
  }
  timeline: string
  status: 'new' | 'reviewed' | 'implemented' | 'dismissed'
  createdAt: string
  updatedAt: string
}

interface AIInsight {
  id: string
  category: 'sales' | 'customer' | 'inventory' | 'market' | 'operational'
  title: string
  summary: string
  details: string
  metrics: {
    label: string
    value: string | number
    trend?: 'up' | 'down' | 'stable'
    change?: number
  }[]
  visualization: 'chart' | 'graph' | 'heatmap' | 'trend'
  confidence: number
  accuracy: number
  lastUpdated: string
}

interface PricingOptimization {
  productId: string
  productName: string
  currentPrice: number
  suggestedPrice: number
  priceChange: number
  reasoning: string[]
  marketFactors: {
    demand: number
    competition: number
    seasonality: number
    inventory: number
  }
  expectedImpact: {
    salesVolume: number
    revenue: number
    margin: number
  }
  confidence: number
  testDuration: string
  status: 'suggested' | 'testing' | 'implemented' | 'rejected'
}

interface CustomerPersona {
  id: string
  name: string
  description: string
  characteristics: string[]
  demographics: {
    ageRange: string
    income: string
    location: string
    lifestyle: string
  }
  preferences: {
    metals: string[]
    gemstones: string[]
    styles: string[]
    priceRange: [number, number]
  }
  behavior: {
    visitFrequency: string
    averageSpend: number
    preferredChannels: string[]
    decisionFactors: string[]
  }
  size: number
  growth: number
  value: number
  recommendations: string[]
}

interface MarketTrend {
  id: string
  category: string
  trend: string
  description: string
  strength: number
  direction: 'rising' | 'falling' | 'stable'
  timeframe: string
  markets: string[]
  impact: 'low' | 'medium' | 'high'
  opportunities: string[]
  threats: string[]
  recommendations: string[]
  confidence: number
  sources: string[]
}

interface AIModel {
  id: string
  name: string
  type: 'recommendation' | 'pricing' | 'demand' | 'customer' | 'fraud' | 'trend'
  description: string
  accuracy: number
  lastTrained: string
  trainingData: {
    records: number
    timespan: string
    features: number
  }
  performance: {
    precision: number
    recall: number
    f1Score: number
  }
  status: 'active' | 'training' | 'inactive' | 'error'
  version: string
}

export default function JewelryAIPage() {
  // ✅ All hooks before conditional returns (Enterprise Pattern)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedPeriod, setSelectedPeriod] = useState('this_month')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedRecommendation, setSelectedRecommendation] = useState<AIRecommendation | null>(
    null
  )
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [jewelryRole, setJewelryRole] = useState<string | null>(null)
  const [orgLoading, setOrgLoading] = useState(true)

  // ✅ Check organization context (Enterprise Auth Pattern)
  useEffect(() => {
    const timer = setTimeout(() => {
      const orgId = localStorage.getItem('organizationId')
      const role = localStorage.getItem('jewelryRole')

      if (!orgId || !role) {
        // Set demo data for production showcase
        const DEMO_ORG_ID = 'f8d2c5e7-9a4b-6c8d-0e1f-2a3b4c5d6e7f'
        localStorage.setItem('organizationId', DEMO_ORG_ID)
        localStorage.setItem('jewelryRole', 'owner')
        
        setOrganizationId(DEMO_ORG_ID)
        setJewelryRole('owner')
        setOrgLoading(false)
        return
      }

      setOrganizationId(orgId)
      setJewelryRole(role)
      setOrgLoading(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Mock AI data
  const aiRecommendations: AIRecommendation[] = [
    {
      id: 'REC001',
      type: 'pricing',
      title: 'Optimize Diamond Ring Pricing',
      description:
        'Increase price by 8% for Royal Diamond Engagement Ring based on market demand and low inventory.',
      confidence: 94.5,
      priority: 'high',
      impact: {
        revenue: 125000,
        customers: -15,
        efficiency: 12
      },
      category: 'Revenue Optimization',
      data: {
        productId: 'JR001',
        currentPrice: 450000,
        suggestedPrice: 486000
      },
      actions: {
        primary: 'Implement Price Change',
        secondary: 'A/B Test First'
      },
      timeline: '2-3 weeks',
      status: 'new',
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-15T09:00:00Z'
    },
    {
      id: 'REC002',
      type: 'customer',
      title: 'Target High-Value Customers',
      description:
        "Focus marketing on Diamond tier customers who haven't purchased in 6+ months with personalized offers.",
      confidence: 87.2,
      priority: 'medium',
      impact: {
        revenue: 280000,
        customers: 45,
        efficiency: 8
      },
      category: 'Customer Retention',
      data: {
        targetSegment: 'diamond_inactive',
        customerCount: 89,
        averageSpend: 185000
      },
      actions: {
        primary: 'Launch Campaign',
        secondary: 'Create Personas'
      },
      timeline: '1-2 weeks',
      status: 'new',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z'
    }
  ]

  const aiInsights: AIInsight[] = [
    {
      id: 'INS001',
      category: 'sales',
      title: 'Evening Sales Peak Detected',
      summary: 'Sales consistently peak between 6-8 PM with 45% higher conversion rates',
      details:
        'Analysis of transaction data shows significant sales spike during evening hours, particularly for engagement rings and luxury items. Customers during this time have 2.3x higher average order value.',
      metrics: [
        { label: 'Peak Hours', value: '6-8 PM', trend: 'stable' },
        { label: 'Conversion Rate', value: '8.9%', trend: 'up', change: 2.1 },
        { label: 'Avg Order Value', value: '18,750', trend: 'up', change: 12.5 }
      ],
      visualization: 'chart',
      confidence: 94.2,
      accuracy: 91.8,
      lastUpdated: '2024-01-15T12:00:00Z'
    }
  ]

  const pricingOptimizations: PricingOptimization[] = [
    {
      productId: 'JR001',
      productName: 'Royal Diamond Engagement Ring',
      currentPrice: 450000,
      suggestedPrice: 486000,
      priceChange: 8.0,
      reasoning: [
        'Low inventory (5 units) creates scarcity value',
        'Competitor pricing 12% higher for similar products',
        'High customer demand with low price sensitivity',
        'Premium positioning supports price increase'
      ],
      marketFactors: {
        demand: 89,
        competition: 76,
        seasonality: 94,
        inventory: 15
      },
      expectedImpact: {
        salesVolume: -12,
        revenue: 23,
        margin: 31
      },
      confidence: 94.5,
      testDuration: '2-3 weeks',
      status: 'suggested'
    }
  ]

  const customerPersonas: CustomerPersona[] = [
    {
      id: 'PERSONA001',
      name: 'Luxury Collector',
      description:
        'High-net-worth individuals who collect fine jewelry as investments and status symbols',
      characteristics: [
        'Quality-focused decision making',
        'Brand conscious and prestige-driven',
        'Long research cycles before purchase',
        'Values certification and provenance'
      ],
      demographics: {
        ageRange: '35-55 years',
        income: '50L+ annually',
        location: 'Metro cities',
        lifestyle: 'Affluent professionals'
      },
      preferences: {
        metals: ['Platinum', '18K Gold'],
        gemstones: ['Diamonds', 'Emeralds', 'Rubies'],
        styles: ['Classic', 'Luxury', 'Statement'],
        priceRange: [200000, 2000000]
      },
      behavior: {
        visitFrequency: 'Monthly',
        averageSpend: 485000,
        preferredChannels: ['In-store', 'Private appointments'],
        decisionFactors: ['Quality', 'Brand reputation', 'Investment value', 'Exclusivity']
      },
      size: 89,
      growth: 23.5,
      value: 4320000,
      recommendations: [
        'Offer private viewing sessions',
        'Provide detailed certification documentation',
        'Create exclusive limited edition pieces',
        'Develop VIP customer service program'
      ]
    }
  ]

  const marketTrends: MarketTrend[] = [
    {
      id: 'TREND001',
      category: 'Design',
      trend: 'Minimalist Jewelry',
      description:
        'Growing preference for clean, simple designs with focus on quality craftsmanship over ornate details',
      strength: 87,
      direction: 'rising',
      timeframe: '6-12 months',
      markets: ['Urban India', 'International'],
      impact: 'high',
      opportunities: [
        'Develop minimalist collections',
        'Focus on clean geometric designs',
        'Emphasize craftsmanship quality',
        'Target young professional segment'
      ],
      threats: [
        'May cannibalize traditional ornate jewelry sales',
        'Higher competition from fashion jewelry brands'
      ],
      recommendations: [
        'Launch contemporary minimalist line',
        'Partner with modern designers',
        'Invest in social media marketing',
        'Create stackable and layerable pieces'
      ],
      confidence: 89.3,
      sources: ['Social media analytics', 'Sales data', 'Fashion week trends', 'Customer surveys']
    }
  ]

  const aiModels: AIModel[] = [
    {
      id: 'MODEL001',
      name: 'Customer Recommendation Engine',
      type: 'recommendation',
      description:
        'Personalized product recommendations based on customer behavior, preferences, and purchase history',
      accuracy: 94.2,
      lastTrained: '2024-01-10T08:00:00Z',
      trainingData: {
        records: 15420,
        timespan: '2 years',
        features: 67
      },
      performance: {
        precision: 0.92,
        recall: 0.89,
        f1Score: 0.91
      },
      status: 'active',
      version: 'v2.1.3'
    }
  ]

  const tabs = [
    { key: 'dashboard', label: 'AI Dashboard', icon: Brain },
    { key: 'recommendations', label: 'Recommendations', icon: Lightbulb },
    { key: 'insights', label: 'Insights', icon: Eye },
    { key: 'pricing', label: 'Pricing AI', icon: DollarSign },
    { key: 'customers', label: 'Customer AI', icon: Users },
    { key: 'trends', label: 'Market Trends', icon: TrendingUp },
    { key: 'models', label: 'AI Models', icon: Cpu }
  ]

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'from-red-400 to-red-600'
      case 'high':
        return 'from-orange-400 to-orange-600'
      case 'medium':
        return 'from-yellow-400 to-yellow-600'
      case 'low':
        return 'from-green-400 to-green-600'
      default:
        return 'from-gray-400 to-gray-600'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-500'
    if (confidence >= 80) return 'text-yellow-500'
    if (confidence >= 70) return 'text-orange-500'
    return 'text-red-500'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={16} className="text-green-500" />
      case 'training':
        return <RefreshCw size={16} className="text-blue-500 animate-spin" />
      case 'inactive':
        return <XCircle size={16} className="text-gray-500" />
      case 'error':
        return <AlertTriangle size={16} className="text-red-500" />
      default:
        return <Info size={16} className="text-gray-500" />
    }
  }

  // ✅ Loading state (Enterprise Pattern)
  if (orgLoading) {
    return (
      <div className="min-h-screen jewelry-gradient-primary flex items-center justify-center">
        <div className="jewelry-glass-card p-6">
          <Brain className="h-12 w-12 jewelry-text-gold animate-pulse mx-auto mb-4" />
          <p className="!text-gray-100 dark:!text-gray-100 text-center">
            Loading AI Intelligence...
          </p>
        </div>
      </div>
    )
  }

  // ✅ Organization check (Enterprise Pattern)
  if (!organizationId || !jewelryRole) {
    return (
      <div className="min-h-screen jewelry-gradient-primary flex items-center justify-center">
        <div className="jewelry-glass-card p-8 text-center">
          <Brain className="h-16 w-16 jewelry-text-gold mx-auto mb-4" />
          <h2 className="!text-gray-100 dark:!text-gray-100 text-xl font-semibold mb-2">
            Access Required
          </h2>
          <p className="!text-gray-400 dark:!text-gray-400 mb-4">
            Please select an organization to access AI features
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900">
      {/* ✅ Enterprise background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-yellow-400/20 to-amber-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse animation-delay-2000" />
      </div>

      <div className="relative z-10">
        <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
          {/* ✅ Demo Notice */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500/10 border border-gold-500/30 rounded-full">
              <Brain className="h-4 w-4 text-gold-400" />
              <span className="text-gold-400 text-sm font-medium">Live Demo - HERA Jewelry AI Intelligence</span>
            </div>
          </motion.div>

          {/* ✅ Enterprise Header with proper contrast */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 p-6"
          >
            <h1 className="!text-gray-100 dark:!text-gray-100 text-4xl md:text-5xl mb-4 font-bold">
              <Brain className="inline-block mr-3 mb-2 jewelry-icon-gold" size={48} />
              AI-Powered Intelligence
            </h1>
            <p className="!text-gray-400 dark:!text-gray-400 text-lg md:text-xl max-w-3xl mx-auto">
              Advanced artificial intelligence for smart business decisions and automated
              optimization
            </p>
          </motion.div>

          {/* ✅ Enterprise Navigation Tabs with proper spacing and contrast */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="jewelry-glass-panel p-6"
          >
            <div className="flex flex-wrap gap-3">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    activeTab === tab.key
                      ? 'bg-gold-500/20 border border-gold-500/30 !text-gray-100 dark:!text-gray-100 shadow-lg'
                      : 'bg-white/5 border border-white/10 !text-gray-400 dark:!text-gray-400 hover:bg-white/10 hover:!text-gray-100 dark:hover:!text-gray-100'
                  }`}
                >
                  <tab.icon size={16} className={activeTab === tab.key ? 'text-gold-400' : ''} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* AI Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* ✅ Enterprise AI Performance Metrics with proper spacing */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                <div className="jewelry-glass-card jewelry-float p-6 text-center">
                  <Zap className="mx-auto mb-3 jewelry-icon-gold" size={32} />
                  <h3 className="!text-gray-100 dark:!text-gray-100 text-3xl font-bold">94.2%</h3>
                  <p className="!text-gray-400 dark:!text-gray-400 text-sm font-medium">
                    AI Accuracy
                  </p>
                  <div className="flex items-center justify-center mt-2 text-green-500">
                    <TrendingUp size={16} />
                    <span className="text-xs ml-1">+3.1%</span>
                  </div>
                </div>

                <div
                  className="jewelry-glass-card jewelry-float p-6 text-center"
                  style={{ animationDelay: '0.1s' }}
                >
                  <Target className="mx-auto mb-3 jewelry-icon-gold" size={32} />
                  <h3 className="!text-gray-100 dark:!text-gray-100 text-3xl font-bold">67</h3>
                  <p className="!text-gray-400 dark:!text-gray-400 text-sm font-medium">
                    Active Recommendations
                  </p>
                  <div className="flex items-center justify-center mt-2 text-green-500">
                    <TrendingUp size={16} />
                    <span className="text-xs ml-1">+12</span>
                  </div>
                </div>

                <div
                  className="jewelry-glass-card jewelry-float p-6 text-center"
                  style={{ animationDelay: '0.2s' }}
                >
                  <DollarSign className="mx-auto mb-3 jewelry-icon-gold" size={32} />
                  <h3 className="!text-gray-100 dark:!text-gray-100 text-3xl font-bold">
                    {['owner', 'manager'].includes(jewelryRole || '') ? '28.5L' : '***'}
                  </h3>
                  <p className="!text-gray-400 dark:!text-gray-400 text-sm font-medium">
                    AI-Generated Revenue
                  </p>
                  <div className="flex items-center justify-center mt-2 text-green-500">
                    <TrendingUp size={16} />
                    <span className="text-xs ml-1">+24.8%</span>
                  </div>
                </div>

                <div
                  className="jewelry-glass-card jewelry-float p-6 text-center"
                  style={{ animationDelay: '0.3s' }}
                >
                  <Activity className="mx-auto mb-3 jewelry-icon-gold" size={32} />
                  <h3 className="!text-gray-100 dark:!text-gray-100 text-3xl font-bold">89.7%</h3>
                  <p className="!text-gray-400 dark:!text-gray-400 text-sm font-medium">
                    Automation Rate
                  </p>
                  <div className="flex items-center justify-center mt-2 text-green-500">
                    <TrendingUp size={16} />
                    <span className="text-xs ml-1">+5.2%</span>
                  </div>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ✅ Enterprise Recent AI Recommendations with proper spacing */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="jewelry-glass-panel p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="!text-gray-100 dark:!text-gray-100 text-xl font-semibold flex items-center gap-2">
                      <Lightbulb className="jewelry-icon-gold" size={24} />
                      Recent Recommendations
                    </h3>
                    <button
                      onClick={() => setActiveTab('recommendations')}
                      className="bg-muted/50 border border-border !text-muted-foreground hover:bg-muted hover:!text-foreground flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200"
                    >
                      <Eye className="text-gold-400" size={14} />
                      <span className="text-sm">View All</span>
                    </button>
                  </div>

                  <div className="space-y-6">
                    {aiRecommendations.slice(0, 3).map(rec => (
                      <div key={rec.id} className="jewelry-glass-card p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${getPriorityColor(rec.priority)} text-white`}
                              >
                                {rec.priority.toUpperCase()}
                              </span>
                              <span
                                className={`text-sm font-semibold ${getConfidenceColor(rec.confidence)}`}
                              >
                                {rec.confidence}% confidence
                              </span>
                            </div>
                            <h4 className="!text-gray-100 dark:!text-gray-100 font-semibold text-base mb-2">
                              {rec.title}
                            </h4>
                            <p className="!text-gray-400 dark:!text-gray-400 text-sm leading-relaxed">
                              {rec.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                          <span className="!text-gray-400 dark:!text-gray-400 text-sm">
                            {rec.category}
                          </span>
                          <div className="flex items-center space-x-3">
                            {['owner', 'manager'].includes(jewelryRole || '') && (
                              <span className="text-gold-400 font-semibold text-sm">
                                {formatCurrency(rec.impact.revenue)} impact
                              </span>
                            )}
                            <button className="bg-gold-500/20 border border-gold-500/30 !text-gray-100 dark:!text-gray-100 hover:bg-gold-500/30 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200">
                              Review
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* ✅ Enterprise AI Model Status with proper spacing */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="jewelry-glass-panel p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="!text-gray-100 dark:!text-gray-100 text-xl font-semibold flex items-center gap-2">
                      <Cpu className="jewelry-icon-gold" size={24} />
                      AI Model Status
                    </h3>
                    {['owner', 'manager'].includes(jewelryRole || '') && (
                      <button
                        onClick={() => setActiveTab('models')}
                        className="bg-muted/50 border border-border !text-muted-foreground hover:bg-muted hover:!text-foreground flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200"
                      >
                        <Settings className="text-gold-400" size={14} />
                        <span className="text-sm">Manage</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-6">
                    {aiModels.map(model => (
                      <div key={model.id} className="jewelry-glass-card p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(model.status)}
                            <div>
                              <h4 className="!text-gray-100 dark:!text-gray-100 font-semibold text-base">
                                {model.name}
                              </h4>
                              <p className="!text-gray-400 dark:!text-gray-400 text-sm">
                                {model.type} - v{model.version}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-lg font-bold ${getConfidenceColor(model.accuracy)}`}
                            >
                              {model.accuracy}%
                            </p>
                            <p className="!text-gray-400 dark:!text-gray-400 text-sm">accuracy</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6 pt-4 border-t border-white/10">
                          <div className="text-center">
                            <span className="!text-gray-400 dark:!text-gray-400 block text-sm">
                              Precision
                            </span>
                            <span className="!text-gray-100 dark:!text-gray-100 text-lg font-semibold">
                              {(model.performance.precision * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="text-center">
                            <span className="!text-gray-400 dark:!text-gray-400 block text-sm">
                              Recall
                            </span>
                            <span className="!text-gray-100 dark:!text-gray-100 text-lg font-semibold">
                              {(model.performance.recall * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="text-center">
                            <span className="!text-gray-400 dark:!text-gray-400 block text-sm">
                              F1 Score
                            </span>
                            <span className="!text-gray-100 dark:!text-gray-100 text-lg font-semibold">
                              {(model.performance.f1Score * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* ✅ Enterprise "Coming Soon" section */}
          {activeTab !== 'dashboard' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="jewelry-glass-panel p-12 text-center"
            >
              <Brain className="mx-auto mb-6 jewelry-icon-gold" size={64} />
              <h3 className="!text-gray-100 dark:!text-gray-100 text-2xl font-semibold mb-3">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Coming Soon
              </h3>
              <p className="!text-gray-400 dark:!text-gray-400 text-lg max-w-md mx-auto">
                Advanced AI capabilities for jewelry business intelligence and automation.
              </p>
            </motion.div>
          )}

          {/* ✅ Enterprise Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            className="text-center mt-12 mb-6 p-6"
          >
            <p className="!text-gray-400 dark:!text-gray-400 text-sm">
              AI-powered intelligence by{' '}
              <span className="!text-gray-100 dark:!text-gray-100 font-semibold">
                HERA Advanced Analytics Engine
              </span>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
