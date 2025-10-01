'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Brain,
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Eye,
  EyeOff,
  Zap,
  Award,
  Crown,
  Gem,
  Diamond,
  Sparkles,
  Users,
  Package,
  ShoppingBag,
  DollarSign,
  Percent,
  Calendar,
  Clock,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Settings,
  Play,
  Pause,
  Search,
  Plus,
  Edit,
  Share2,
  ExternalLink,
  Bell,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Lightbulb,
  Database,
  Cloud,
  Monitor,
  Cpu,
  Globe,
  MapPin,
  Navigation,
  Compass,
  Layers,
  Grid,
  List,
  MoreVertical,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Wifi,
  Signal,
  Battery,
  Shield,
  Lock,
  Key,
  Tag,
  Hash,
  Star,
  Heart,
  Bookmark,
  Flag,
  Home,
  Store,
  Warehouse,
  Building,
  Factory
} from 'lucide-react'
import '@/styles/jewelry-glassmorphism.css'

interface ExecutiveDashboard {
  period: string
  kpis: {
    revenue: {
      current: number
      target: number
      growth: number
      trend: 'up' | 'down' | 'stable'
    }
    profitability: {
      margin: number
      target: number
      change: number
      trend: 'up' | 'down' | 'stable'
    }
    customerGrowth: {
      count: number
      growth: number
      acquisition: number
      retention: number
    }
    marketShare: {
      current: number
      change: number
      category: string
      competitors: { name: string; share: number }[]
    }
  }
  alerts: {
    id: string
    type: 'revenue' | 'inventory' | 'customer' | 'market' | 'operational'
    severity: 'low' | 'medium' | 'high' | 'critical'
    title: string
    description: string
    impact: number
    actionRequired: boolean
    timestamp: string
  }[]
  forecasts: {
    revenue: { period: string; predicted: number; confidence: number }[]
    inventory: { category: string; shortage: number; timeline: string }[]
    trends: { trend: string; probability: number; timeline: string }[]
  }
}

interface PredictiveAnalytics {
  demandForecasting: {
    productId: string
    productName: string
    category: string
    currentStock: number
    predictedDemand: number
    confidence: number
    timeline: string
    seasonality: number
    marketFactors: string[]
    recommendations: string[]
  }[]
  customerLifecycle: {
    segmentId: string
    segmentName: string
    size: number
    averageLifetime: number
    churnRisk: number
    valueGrowth: number
    nextBestAction: string
    predictedValue: number
  }[]
  marketPredictions: {
    trend: string
    category: string
    impact: 'positive' | 'negative' | 'neutral'
    probability: number
    timeframe: string
    preparationTime: string
    recommendations: string[]
    competitors: string[]
  }[]
  riskAssessment: {
    riskType: string
    description: string
    probability: number
    impact: number
    severity: 'low' | 'medium' | 'high' | 'critical'
    mitigation: string[]
    timeline: string
  }[]
}

interface CompetitiveIntelligence {
  competitors: {
    id: string
    name: string
    category: string
    marketShare: number
    positioning: string
    strengths: string[]
    weaknesses: string[]
    recentMoves: {
      action: string
      date: string
      impact: number
    }[]
    priceComparison: {
      category: string
      ourPrice: number
      theirPrice: number
      difference: number
    }[]
  }[]
  marketAnalysis: {
    totalMarketSize: number
    growthRate: number
    keyTrends: string[]
    opportunities: string[]
    threats: string[]
    marketDynamics: {
      factor: string
      impact: number
      trend: 'up' | 'down' | 'stable'
    }[]
  }
  benchmarking: {
    metric: string
    ourValue: number
    industryAverage: number
    topPerformer: number
    percentile: number
    gap: number
    improvement: string[]
  }[]
}

interface AdvancedReporting {
  executiveReports: {
    id: string
    title: string
    type: 'executive' | 'operational' | 'financial' | 'strategic'
    description: string
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
    recipients: string[]
    lastGenerated: string
    nextScheduled: string
    insights: number
    metrics: number
    status: 'active' | 'draft' | 'archived'
  }[]
  customDashboards: {
    id: string
    name: string
    description: string
    widgets: {
      type: 'chart' | 'metric' | 'table' | 'gauge' | 'heatmap'
      title: string
      dataSource: string
      refreshRate: string
    }[]
    audience: 'executive' | 'management' | 'operations' | 'sales' | 'marketing'
    lastModified: string
    views: number
  }[]
  dataVisualization: {
    chartType: string
    title: string
    description: string
    complexity: 'simple' | 'intermediate' | 'advanced'
    interactivity: boolean
    realTime: boolean
    exportFormats: string[]
  }[]
}

interface BusinessIntelligence {
  performanceMetrics: {
    category: string
    metrics: {
      name: string
      current: number
      target: number
      unit: string
      trend: 'up' | 'down' | 'stable'
      change: number
      benchmark: number
    }[]
  }[]
  crossAnalysis: {
    dimension1: string
    dimension2: string
    insights: {
      correlation: number
      significance: number
      description: string
      recommendation: string
    }[]
  }[]
  whatIfScenarios: {
    scenario: string
    variables: { name: string; change: number }[]
    impacts: { metric: string; change: number; confidence: number }[]
    recommendation: string
    riskLevel: 'low' | 'medium' | 'high'
  }[]
}

export default function JewelryIntelligencePage() {
  const [activeTab, setActiveTab] = useState('executive')
  const [selectedPeriod, setSelectedPeriod] = useState('this_quarter')
  const [dashboardMode, setDashboardMode] = useState<'overview' | 'detailed'>('overview')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedAlert, setSelectedAlert] = useState<any>(null)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Mock data for advanced business intelligence
  const executiveDashboard: ExecutiveDashboard = {
    period: 'Q1 2024',
    kpis: {
      revenue: {
        current: 18750000,
        target: 20000000,
        growth: 24.5,
        trend: 'up'
      },
      profitability: {
        margin: 31.2,
        target: 30.0,
        change: 3.8,
        trend: 'up'
      },
      customerGrowth: {
        count: 1847,
        growth: 18.5,
        acquisition: 234,
        retention: 89.2
      },
      marketShare: {
        current: 12.8,
        change: 2.1,
        category: 'Luxury Jewelry',
        competitors: [
          { name: 'Premium Jewels', share: 18.5 },
          { name: 'Royal Collections', share: 15.2 },
          { name: 'Diamond Palace', share: 13.9 }
        ]
      }
    },
    alerts: [
      {
        id: 'ALERT001',
        type: 'inventory',
        severity: 'critical',
        title: 'Diamond Ring Stock Critical',
        description:
          'Royal Diamond Engagement Rings will be out of stock in 3 days based on current demand patterns.',
        impact: 450000,
        actionRequired: true,
        timestamp: '2024-01-15T14:30:00Z'
      },
      {
        id: 'ALERT002',
        type: 'market',
        severity: 'high',
        title: 'Competitor Price Drop',
        description:
          'Premium Jewels reduced similar diamond ring prices by 15%. Consider pricing strategy review.',
        impact: 280000,
        actionRequired: true,
        timestamp: '2024-01-15T12:15:00Z'
      },
      {
        id: 'ALERT003',
        type: 'customer',
        severity: 'medium',
        title: 'VIP Customer Churn Risk',
        description:
          '12 Diamond-tier customers show high churn probability based on behavior analysis.',
        impact: 680000,
        actionRequired: false,
        timestamp: '2024-01-15T09:45:00Z'
      }
    ],
    forecasts: {
      revenue: [
        { period: 'Feb 2024', predicted: 22500000, confidence: 94.2 },
        { period: 'Mar 2024', predicted: 24800000, confidence: 87.5 },
        { period: 'Apr 2024', predicted: 21200000, confidence: 82.1 }
      ],
      inventory: [
        { category: 'Engagement Rings', shortage: 15, timeline: '2 weeks' },
        { category: 'Pearl Earrings', shortage: 8, timeline: '1 month' }
      ],
      trends: [
        { trend: 'Minimalist Jewelry Surge', probability: 89.3, timeline: '6 months' },
        { trend: 'Sustainable Materials Demand', probability: 76.8, timeline: '12 months' }
      ]
    }
  }

  const predictiveAnalytics: PredictiveAnalytics = {
    demandForecasting: [
      {
        productId: 'JR001',
        productName: 'Royal Diamond Engagement Ring',
        category: 'engagement_rings',
        currentStock: 5,
        predictedDemand: 18,
        confidence: 94.5,
        timeline: '30 days',
        seasonality: 85,
        marketFactors: [
          "Valentine's Day approaching",
          'Wedding season',
          'High social media engagement'
        ],
        recommendations: [
          'Immediate restock of 15 units',
          'Consider premium pricing',
          'Expand marketing campaign'
        ]
      },
      {
        productId: 'JE003',
        productName: 'Classic Pearl Earrings',
        category: 'earrings',
        currentStock: 25,
        predictedDemand: 45,
        confidence: 87.2,
        timeline: '45 days',
        seasonality: 65,
        marketFactors: [
          'Office return trends',
          'Professional attire demand',
          'Classic style preference'
        ],
        recommendations: [
          'Restock 25 units',
          'Bundle with matching necklaces',
          'Target professional women'
        ]
      },
      {
        productId: 'JN002',
        productName: 'Emerald Goddess Necklace',
        category: 'necklaces',
        currentStock: 2,
        predictedDemand: 3,
        confidence: 76.8,
        timeline: '90 days',
        seasonality: 45,
        marketFactors: [
          'Luxury market stability',
          'Statement piece trend',
          'Limited edition appeal'
        ],
        recommendations: [
          'Maintain current stock',
          'Position as exclusive',
          'Premium pricing strategy'
        ]
      }
    ],
    customerLifecycle: [
      {
        segmentId: 'SEG001',
        segmentName: 'Luxury Collectors',
        size: 89,
        averageLifetime: 4.2,
        churnRisk: 15.3,
        valueGrowth: 28.5,
        nextBestAction: 'Exclusive preview invitation',
        predictedValue: 2850000
      },
      {
        segmentId: 'SEG002',
        segmentName: 'Occasion Buyers',
        size: 234,
        averageLifetime: 2.8,
        churnRisk: 32.1,
        valueGrowth: 12.3,
        nextBestAction: 'Anniversary reminder campaign',
        predictedValue: 1680000
      },
      {
        segmentId: 'SEG003',
        segmentName: 'Young Professionals',
        size: 167,
        averageLifetime: 3.5,
        churnRisk: 22.7,
        valueGrowth: 45.2,
        nextBestAction: 'Modern collection showcase',
        predictedValue: 950000
      }
    ],
    marketPredictions: [
      {
        trend: 'Lab-Grown Diamond Acceptance',
        category: 'diamonds',
        impact: 'positive',
        probability: 82.4,
        timeframe: '18 months',
        preparationTime: '6 months',
        recommendations: [
          'Research lab-grown suppliers',
          'Educate customers on benefits',
          'Adjust inventory mix'
        ],
        competitors: ['Premium Jewels', 'Modern Diamonds Co']
      },
      {
        trend: 'Personalization Demand',
        category: 'customization',
        impact: 'positive',
        probability: 91.7,
        timeframe: '12 months',
        preparationTime: '3 months',
        recommendations: [
          'Expand engraving services',
          'Custom design consultations',
          'Online customization tools'
        ],
        competitors: ['Bespoke Jewelry Ltd', 'Custom Creations']
      }
    ],
    riskAssessment: [
      {
        riskType: 'Supply Chain Disruption',
        description: 'Potential delays in diamond imports due to regulatory changes',
        probability: 45.2,
        impact: 3200000,
        severity: 'high',
        mitigation: [
          'Diversify suppliers',
          'Increase safety stock',
          'Alternative sourcing regions'
        ],
        timeline: '6-12 months'
      },
      {
        riskType: 'Economic Downturn Impact',
        description: 'Luxury spending reduction during economic uncertainty',
        probability: 32.8,
        impact: 5600000,
        severity: 'critical',
        mitigation: ['Expand mid-range options', 'Flexible payment plans', 'Value positioning'],
        timeline: '3-6 months'
      }
    ]
  }

  const competitiveIntelligence: CompetitiveIntelligence = {
    competitors: [
      {
        id: 'COMP001',
        name: 'Premium Jewels',
        category: 'Direct Competitor',
        marketShare: 18.5,
        positioning: 'Luxury Heritage Brand',
        strengths: ['Brand recognition', 'International presence', 'Celebrity endorsements'],
        weaknesses: ['Higher prices', 'Limited customization', 'Slow digital adoption'],
        recentMoves: [
          { action: 'Launched online store', date: '2024-01-10', impact: 15 },
          { action: 'Reduced diamond ring prices', date: '2024-01-05', impact: 25 }
        ],
        priceComparison: [
          { category: 'Diamond Rings', ourPrice: 450000, theirPrice: 520000, difference: -13.5 },
          { category: 'Gold Necklaces', ourPrice: 185000, theirPrice: 165000, difference: 12.1 }
        ]
      },
      {
        id: 'COMP002',
        name: 'Royal Collections',
        category: 'Direct Competitor',
        marketShare: 15.2,
        positioning: 'Premium Traditional',
        strengths: ['Traditional designs', 'Craftsmanship reputation', 'Local market knowledge'],
        weaknesses: ['Limited modern appeal', 'Weak online presence', 'Higher operating costs'],
        recentMoves: [
          { action: 'Opened new showroom', date: '2024-01-08', impact: 8 },
          { action: 'Partnership with designer', date: '2023-12-20', impact: 12 }
        ],
        priceComparison: [
          { category: 'Traditional Sets', ourPrice: 285000, theirPrice: 310000, difference: -8.1 },
          { category: 'Pearl Jewelry', ourPrice: 95000, theirPrice: 105000, difference: -9.5 }
        ]
      }
    ],
    marketAnalysis: {
      totalMarketSize: 12500000000,
      growthRate: 8.5,
      keyTrends: [
        'Digital transformation',
        'Sustainable jewelry',
        'Personalization',
        'Lab-grown diamonds'
      ],
      opportunities: [
        'Online market expansion',
        'Young demographic targeting',
        'Sustainable product lines'
      ],
      threats: ['Economic uncertainty', 'Changing consumer preferences', 'New market entrants'],
      marketDynamics: [
        { factor: 'Digital Adoption', impact: 85, trend: 'up' },
        { factor: 'Price Sensitivity', impact: 65, trend: 'up' },
        { factor: 'Brand Loyalty', impact: 45, trend: 'down' },
        { factor: 'Quality Focus', impact: 90, trend: 'stable' }
      ]
    },
    benchmarking: [
      {
        metric: 'Average Order Value',
        ourValue: 18250,
        industryAverage: 15800,
        topPerformer: 22500,
        percentile: 75,
        gap: -18.9,
        improvement: ['Upselling training', 'Bundle offers', 'Premium positioning']
      },
      {
        metric: 'Customer Retention Rate',
        ourValue: 89.2,
        industryAverage: 76.5,
        topPerformer: 94.8,
        percentile: 85,
        gap: -5.9,
        improvement: ['Loyalty program enhancement', 'Personalized service', 'Regular engagement']
      },
      {
        metric: 'Conversion Rate',
        ourValue: 8.9,
        industryAverage: 6.2,
        topPerformer: 12.4,
        percentile: 78,
        gap: -28.2,
        improvement: ['Sales process optimization', 'Product recommendations', 'Follow-up systems']
      }
    ]
  }

  const tabs = [
    { key: 'executive', label: 'Executive Dashboard', icon: Crown },
    { key: 'predictive', label: 'Predictive Analytics', icon: Brain },
    { key: 'competitive', label: 'Competitive Intelligence', icon: Target },
    { key: 'reporting', label: 'Advanced Reporting', icon: BarChart3 },
    { key: 'bi', label: 'Business Intelligence', icon: Database },
    { key: 'scenarios', label: 'Scenario Planning', icon: Lightbulb }
  ]

  const formatCurrency = (amount: number) => {
    return `¹${amount.toLocaleString()}`
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
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

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={16} className="text-green-500" />
      case 'down':
        return <TrendingDown size={16} className="text-red-500" />
      case 'stable':
        return <Activity size={16} className="text-blue-500" />
    }
  }

  return (
    <div className="min-h-screen jewelry-gradient-premium">
      <div className="jewelry-glass-backdrop min-h-screen">
        <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="jewelry-heading text-4xl md:text-5xl mb-4">
              <Brain className="inline-block mr-3 mb-2 jewelry-icon-gold" size={48} />
              Advanced Business Intelligence
            </h1>
            <p className="jewelry-text-luxury text-lg md:text-xl">
              Executive dashboards, predictive analytics, and strategic business insights
            </p>
          </motion.div>

          {/* Navigation Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="jewelry-glass-panel"
          >
            <div className="flex flex-wrap gap-2 p-4">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.key ? 'jewelry-btn-primary' : 'jewelry-btn-secondary'
                  }`}
                >
                  <tab.icon size={16} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Executive Dashboard Tab */}
          {activeTab === 'executive' && (
            <div className="space-y-6">
              {/* Dashboard Controls */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="jewelry-glass-panel"
              >
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                  <div className="flex flex-wrap gap-4 items-center">
                    <select
                      value={selectedPeriod}
                      onChange={e => setSelectedPeriod(e.target.value)}
                      className="px-4 py-2 border border-jewelry-blue-200 rounded-lg jewelry-text-high-contrast text-sm"
                    >
                      <option value="this_quarter">This Quarter</option>
                      <option value="last_quarter">Last Quarter</option>
                      <option value="this_year">This Year</option>
                      <option value="last_year">Last Year</option>
                    </select>

                    <button
                      onClick={() =>
                        setDashboardMode(dashboardMode === 'overview' ? 'detailed' : 'overview')
                      }
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        dashboardMode === 'detailed'
                          ? 'jewelry-btn-primary'
                          : 'jewelry-btn-secondary'
                      }`}
                    >
                      <Eye size={16} />
                      <span>{dashboardMode === 'overview' ? 'Detailed View' : 'Overview'}</span>
                    </button>

                    <button
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        autoRefresh ? 'jewelry-btn-primary' : 'jewelry-btn-secondary'
                      }`}
                    >
                      <RefreshCw size={16} className={autoRefresh ? 'animate-spin' : ''} />
                      <span>Auto Refresh</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button className="jewelry-btn-secondary flex items-center space-x-2 px-4 py-2">
                      <Download className="jewelry-icon-gold" size={18} />
                      <span>Export</span>
                    </button>

                    <button className="jewelry-btn-primary flex items-center space-x-2 px-4 py-2">
                      <Share2 className="jewelry-icon-gold" size={18} />
                      <span>Share Dashboard</span>
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Key Performance Indicators */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                <div className="jewelry-glass-card jewelry-float p-6">
                  <div className="flex items-center justify-between mb-4">
                    <DollarSign className="jewelry-icon-gold" size={32} />
                    {getTrendIcon(executiveDashboard.kpis.revenue.trend)}
                  </div>
                  <h3 className="jewelry-text-high-contrast text-3xl font-bold mb-1">
                    {formatCurrency(executiveDashboard.kpis.revenue.current)}
                  </h3>
                  <p className="jewelry-text-muted text-sm mb-2">
                    Revenue ({executiveDashboard.period})
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="jewelry-text-muted">
                      Target: {formatCurrency(executiveDashboard.kpis.revenue.target)}
                    </span>
                    <span className="text-green-500 font-medium">
                      {formatPercentage(executiveDashboard.kpis.revenue.growth)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-jewelry-blue-400 to-jewelry-blue-600"
                      style={{
                        width: `${(executiveDashboard.kpis.revenue.current / executiveDashboard.kpis.revenue.target) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>

                <div
                  className="jewelry-glass-card jewelry-float p-6"
                  style={{ animationDelay: '0.1s' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <Percent className="jewelry-icon-gold" size={32} />
                    {getTrendIcon(executiveDashboard.kpis.profitability.trend)}
                  </div>
                  <h3 className="jewelry-text-high-contrast text-3xl font-bold mb-1">
                    {executiveDashboard.kpis.profitability.margin}%
                  </h3>
                  <p className="jewelry-text-muted text-sm mb-2">Profit Margin</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="jewelry-text-muted">
                      Target: {executiveDashboard.kpis.profitability.target}%
                    </span>
                    <span className="text-green-500 font-medium">
                      {formatPercentage(executiveDashboard.kpis.profitability.change)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-green-400 to-green-600"
                      style={{
                        width: `${(executiveDashboard.kpis.profitability.margin / 40) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>

                <div
                  className="jewelry-glass-card jewelry-float p-6"
                  style={{ animationDelay: '0.2s' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <Users className="jewelry-icon-gold" size={32} />
                    <TrendingUp size={16} className="text-green-500" />
                  </div>
                  <h3 className="jewelry-text-high-contrast text-3xl font-bold mb-1">
                    {executiveDashboard.kpis.customerGrowth.count.toLocaleString()}
                  </h3>
                  <p className="jewelry-text-muted text-sm mb-2">Total Customers</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="jewelry-text-muted block">Growth</span>
                      <span className="text-green-500 font-medium">
                        {formatPercentage(executiveDashboard.kpis.customerGrowth.growth)}
                      </span>
                    </div>
                    <div>
                      <span className="jewelry-text-muted block">Retention</span>
                      <span className="jewelry-text-high-contrast font-medium">
                        {executiveDashboard.kpis.customerGrowth.retention}%
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className="jewelry-glass-card jewelry-float p-6"
                  style={{ animationDelay: '0.3s' }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <Target className="jewelry-icon-gold" size={32} />
                    <TrendingUp size={16} className="text-green-500" />
                  </div>
                  <h3 className="jewelry-text-high-contrast text-3xl font-bold mb-1">
                    {executiveDashboard.kpis.marketShare.current}%
                  </h3>
                  <p className="jewelry-text-muted text-sm mb-2">Market Share</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="jewelry-text-muted">Luxury Segment</span>
                    <span className="text-green-500 font-medium">
                      {formatPercentage(executiveDashboard.kpis.marketShare.change)}
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="jewelry-text-muted text-xs mb-1">vs Top Competitor</p>
                    <div className="flex items-center text-xs">
                      <span className="jewelry-text-high-contrast">
                        Premium Jewels: {executiveDashboard.kpis.marketShare.competitors[0].share}%
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Critical Alerts */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="jewelry-glass-panel"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="jewelry-text-luxury text-xl font-semibold flex items-center gap-2">
                      <AlertTriangle className="jewelry-icon-gold" size={24} />
                      Critical Alerts
                    </h3>
                    <button className="jewelry-btn-secondary p-2">
                      <Bell className="jewelry-icon-gold" size={16} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {executiveDashboard.alerts.map(alert => (
                      <div key={alert.id} className="jewelry-glass-card p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getSeverityColor(alert.severity)} text-white`}
                              >
                                {alert.severity.toUpperCase()}
                              </span>
                              <span className="jewelry-text-muted text-xs">{alert.type}</span>
                            </div>
                            <h4 className="jewelry-text-high-contrast font-semibold text-sm">
                              {alert.title}
                            </h4>
                            <p className="jewelry-text-muted text-xs mt-1 line-clamp-2">
                              {alert.description}
                            </p>
                          </div>
                          {alert.actionRequired && (
                            <button className="jewelry-btn-primary px-3 py-1 text-xs">
                              Action Required
                            </button>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="jewelry-text-muted">
                            Impact: {formatCurrency(alert.impact)}
                          </span>
                          <span className="jewelry-text-muted">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Revenue Forecast */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.0 }}
                  className="jewelry-glass-panel"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="jewelry-text-luxury text-xl font-semibold flex items-center gap-2">
                      <LineChart className="jewelry-icon-gold" size={24} />
                      Revenue Forecast
                    </h3>
                    <button className="jewelry-btn-secondary flex items-center space-x-2 px-3 py-1">
                      <Eye className="jewelry-icon-gold" size={14} />
                      <span className="text-sm">Details</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {executiveDashboard.forecasts.revenue.map((forecast, index) => (
                      <div key={forecast.period} className="jewelry-glass-card p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="jewelry-text-high-contrast font-semibold">
                            {forecast.period}
                          </h4>
                          <span
                            className={`text-sm font-medium ${getConfidenceColor(forecast.confidence)}`}
                          >
                            {forecast.confidence}% confidence
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="jewelry-text-luxury font-bold text-lg">
                            {formatCurrency(forecast.predicted)}
                          </span>
                          <div className="text-right text-sm">
                            <p className="jewelry-text-muted">vs Current</p>
                            <p
                              className={`font-medium ${forecast.predicted > executiveDashboard.kpis.revenue.current ? 'text-green-500' : 'text-red-500'}`}
                            >
                              {formatPercentage(
                                ((forecast.predicted - executiveDashboard.kpis.revenue.current) /
                                  executiveDashboard.kpis.revenue.current) *
                                  100
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-jewelry-blue-400 to-jewelry-blue-600"
                            style={{ width: `${forecast.confidence}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* Predictive Analytics Tab */}
          {activeTab === 'predictive' && (
            <div className="space-y-6">
              {/* Demand Forecasting */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="jewelry-glass-panel"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="jewelry-text-luxury text-xl font-semibold flex items-center gap-2">
                    <TrendingUp className="jewelry-icon-gold" size={24} />
                    Demand Forecasting
                  </h3>
                  <button className="jewelry-btn-primary flex items-center space-x-2 px-4 py-2">
                    <Brain className="jewelry-icon-gold" size={18} />
                    <span>Update Forecast</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {predictiveAnalytics.demandForecasting.map(forecast => (
                    <motion.div
                      key={forecast.productId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="jewelry-glass-card p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="jewelry-text-luxury text-lg font-semibold">
                              {forecast.productName}
                            </h4>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(forecast.confidence)} bg-gray-100`}
                            >
                              {forecast.confidence}% confidence
                            </span>
                          </div>
                          <p className="jewelry-text-muted text-sm">
                            {forecast.category} " {forecast.timeline}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="jewelry-text-high-contrast font-bold text-2xl">
                            {forecast.predictedDemand}
                          </p>
                          <p className="jewelry-text-muted text-sm">Predicted Demand</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-6 mb-6">
                        <div className="text-center">
                          <Package className="mx-auto mb-2 jewelry-icon-gold" size={20} />
                          <p className="jewelry-text-high-contrast font-semibold">
                            {forecast.currentStock}
                          </p>
                          <p className="jewelry-text-muted text-xs">Current Stock</p>
                        </div>
                        <div className="text-center">
                          <TrendingUp className="mx-auto mb-2 jewelry-icon-gold" size={20} />
                          <p className="jewelry-text-high-contrast font-semibold">
                            {forecast.predictedDemand}
                          </p>
                          <p className="jewelry-text-muted text-xs">Predicted Demand</p>
                        </div>
                        <div className="text-center">
                          <Activity className="mx-auto mb-2 jewelry-icon-gold" size={20} />
                          <p className="jewelry-text-high-contrast font-semibold">
                            {forecast.seasonality}%
                          </p>
                          <p className="jewelry-text-muted text-xs">Seasonality Factor</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h5 className="jewelry-text-luxury font-semibold mb-2">Market Factors</h5>
                          <div className="flex flex-wrap gap-2">
                            {forecast.marketFactors.map((factor, index) => (
                              <span
                                key={index}
                                className="bg-jewelry-blue-100 text-jewelry-blue-900 text-xs px-2 py-1 rounded"
                              >
                                {factor}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h5 className="jewelry-text-luxury font-semibold mb-2">
                            AI Recommendations
                          </h5>
                          <div className="space-y-1">
                            {forecast.recommendations.map((rec, index) => (
                              <div key={index} className="flex items-start space-x-2">
                                <CheckCircle
                                  size={14}
                                  className="text-green-500 mt-0.5 flex-shrink-0"
                                />
                                <span className="jewelry-text-muted text-sm">{rec}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {/* Other tabs rendered as placeholders */}
          {['competitive', 'reporting', 'bi', 'scenarios'].includes(activeTab) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="jewelry-glass-panel"
            >
              <div className="p-12 text-center">
                <Brain className="mx-auto mb-4 jewelry-icon-gold" size={64} />
                <h3 className="jewelry-text-luxury text-xl font-semibold mb-2">
                  {activeTab === 'competitive' && 'Competitive Intelligence'}
                  {activeTab === 'reporting' && 'Advanced Reporting'}
                  {activeTab === 'bi' && 'Business Intelligence'}
                  {activeTab === 'scenarios' && 'Scenario Planning'}
                </h3>
                <p className="jewelry-text-muted">
                  {activeTab === 'competitive' &&
                    'Market analysis, competitor tracking, and strategic positioning insights for informed business decisions.'}
                  {activeTab === 'reporting' &&
                    'Executive reports, custom dashboards, and automated business intelligence reporting systems.'}
                  {activeTab === 'bi' &&
                    'Cross-dimensional analysis, performance metrics, and what-if scenario modeling for strategic planning.'}
                  {activeTab === 'scenarios' &&
                    'Advanced scenario modeling, risk assessment, and strategic planning tools for future-ready decisions.'}
                </p>
              </div>
            </motion.div>
          )}

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            className="text-center mt-12 mb-6"
          >
            <p className="jewelry-text-muted text-sm">
              Advanced intelligence powered by{' '}
              <span className="jewelry-text-luxury font-semibold">
                HERA Strategic Analytics Platform
              </span>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
