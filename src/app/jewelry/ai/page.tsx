'use client'

import React, { useState } from 'react'
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
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedPeriod, setSelectedPeriod] = useState('this_month')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedRecommendation, setSelectedRecommendation] = useState<AIRecommendation | null>(null)
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Mock AI data
  const aiRecommendations: AIRecommendation[] = [
    {
      id: 'REC001',
      type: 'pricing',
      title: 'Optimize Diamond Ring Pricing',
      description: 'Increase price by 8% for Royal Diamond Engagement Ring based on market demand and low inventory.',
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
      description: 'Focus marketing on Diamond tier customers who haven\'t purchased in 6+ months with personalized offers.',
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
    },
    {
      id: 'REC003',
      type: 'inventory',
      title: 'Restock Pearl Earrings',
      description: 'AI predicts 340% increase in pearl earring demand next month. Current stock will deplete in 8 days.',
      confidence: 91.8,
      priority: 'critical',
      impact: {
        revenue: 450000,
        customers: 120,
        efficiency: 25
      },
      category: 'Inventory Management',
      data: {
        productCategory: 'pearl_earrings',
        currentStock: 12,
        predictedDemand: 85,
        daysUntilDepletion: 8
      },
      actions: {
        primary: 'Place Order Now',
        secondary: 'Set Auto-Reorder'
      },
      timeline: 'Immediate',
      status: 'new',
      createdAt: '2024-01-15T11:15:00Z',
      updatedAt: '2024-01-15T11:15:00Z'
    },
    {
      id: 'REC004',
      type: 'marketing',
      title: 'Valentine\'s Day Campaign',
      description: 'Launch targeted valentine campaign for couple rings. AI identifies 156 high-probability customers.',
      confidence: 89.3,
      priority: 'high',
      impact: {
        revenue: 680000,
        customers: 78,
        efficiency: 15
      },
      category: 'Seasonal Marketing',
      data: {
        campaign: 'valentine_2024',
        targetCustomers: 156,
        predictedConversion: 23.5
      },
      actions: {
        primary: 'Start Campaign',
        secondary: 'Review Targets'
      },
      timeline: '3-4 weeks',
      status: 'reviewed',
      createdAt: '2024-01-14T14:20:00Z',
      updatedAt: '2024-01-15T09:45:00Z'
    }
  ]

  const aiInsights: AIInsight[] = [
    {
      id: 'INS001',
      category: 'sales',
      title: 'Evening Sales Peak Detected',
      summary: 'Sales consistently peak between 6-8 PM with 45% higher conversion rates',
      details: 'Analysis of transaction data shows significant sales spike during evening hours, particularly for engagement rings and luxury items. Customers during this time have 2.3x higher average order value.',
      metrics: [
        { label: 'Peak Hours', value: '6-8 PM', trend: 'stable' },
        { label: 'Conversion Rate', value: '8.9%', trend: 'up', change: 2.1 },
        { label: 'Avg Order Value', value: '¹18,750', trend: 'up', change: 12.5 }
      ],
      visualization: 'chart',
      confidence: 94.2,
      accuracy: 91.8,
      lastUpdated: '2024-01-15T12:00:00Z'
    },
    {
      id: 'INS002',
      category: 'customer',
      title: 'Emerging Customer Segment',
      summary: 'New segment of young professionals (25-32) showing high engagement with contemporary designs',
      details: 'AI has identified a growing customer segment of young professionals with specific preferences for minimalist, contemporary jewelry designs. This segment shows 67% higher repeat purchase rates.',
      metrics: [
        { label: 'Segment Size', value: '234 customers', trend: 'up', change: 45.2 },
        { label: 'Repeat Rate', value: '67%', trend: 'up', change: 23.1 },
        { label: 'Avg Lifetime Value', value: '¹125,000', trend: 'up', change: 18.7 }
      ],
      visualization: 'graph',
      confidence: 88.7,
      accuracy: 85.3,
      lastUpdated: '2024-01-15T11:30:00Z'
    },
    {
      id: 'INS003',
      category: 'inventory',
      title: 'Seasonal Demand Patterns',
      summary: 'Strong correlation between weather patterns and gemstone preferences detected',
      details: 'AI analysis reveals that warmer weather increases demand for lighter colored gemstones by 34%, while cooler weather drives preference for darker stones and gold jewelry.',
      metrics: [
        { label: 'Weather Correlation', value: '0.78', trend: 'stable' },
        { label: 'Light Stones (Warm)', value: '+34%', trend: 'up' },
        { label: 'Dark Stones (Cool)', value: '+28%', trend: 'stable' }
      ],
      visualization: 'heatmap',
      confidence: 82.4,
      accuracy: 79.6,
      lastUpdated: '2024-01-15T10:45:00Z'
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
    },
    {
      productId: 'JN002',
      productName: 'Emerald Goddess Necklace',
      currentPrice: 325000,
      suggestedPrice: 298000,
      priceChange: -8.3,
      reasoning: [
        'High inventory levels need clearance',
        'Seasonal demand declining for statement pieces',
        'Price reduction could trigger higher volume sales',
        'Margin still remains healthy at suggested price'
      ],
      marketFactors: {
        demand: 45,
        competition: 67,
        seasonality: 32,
        inventory: 95
      },
      expectedImpact: {
        salesVolume: 45,
        revenue: 18,
        margin: -15
      },
      confidence: 87.2,
      testDuration: '3-4 weeks',
      status: 'testing'
    }
  ]

  const customerPersonas: CustomerPersona[] = [
    {
      id: 'PERSONA001',
      name: 'Luxury Collector',
      description: 'High-net-worth individuals who collect fine jewelry as investments and status symbols',
      characteristics: [
        'Quality-focused decision making',
        'Brand conscious and prestige-driven',
        'Long research cycles before purchase',
        'Values certification and provenance'
      ],
      demographics: {
        ageRange: '35-55 years',
        income: '¹50L+ annually',
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
    },
    {
      id: 'PERSONA002',
      name: 'Occasion Buyer',
      description: 'Customers purchasing jewelry for special occasions like engagements, anniversaries, and festivals',
      characteristics: [
        'Emotionally-driven purchases',
        'Budget-conscious but flexible',
        'Seeks perfect piece for the moment',
        'Values personal service and guidance'
      ],
      demographics: {
        ageRange: '25-45 years',
        income: '¹8-25L annually',
        location: 'Tier 1 & 2 cities',
        lifestyle: 'Working professionals'
      },
      preferences: {
        metals: ['14K Gold', '18K Gold', 'Silver'],
        gemstones: ['Diamonds', 'Pearls', 'Traditional stones'],
        styles: ['Traditional', 'Contemporary', 'Romantic'],
        priceRange: [25000, 300000]
      },
      behavior: {
        visitFrequency: 'Occasional',
        averageSpend: 95000,
        preferredChannels: ['In-store', 'Online research'],
        decisionFactors: ['Emotional appeal', 'Value for money', 'Occasion appropriateness', 'Reviews']
      },
      size: 234,
      growth: 45.2,
      value: 2223000,
      recommendations: [
        'Create occasion-specific collections',
        'Offer flexible payment plans',
        'Provide styling consultation services',
        'Develop gift packaging and services'
      ]
    },
    {
      id: 'PERSONA003',
      name: 'Young Professional',
      description: 'Modern professionals building their jewelry collection with contemporary, versatile pieces',
      characteristics: [
        'Digital-first shopping behavior',
        'Sustainability-conscious',
        'Values versatility and modern design',
        'Active on social media'
      ],
      demographics: {
        ageRange: '22-32 years',
        income: '¹5-15L annually',
        location: 'Urban areas',
        lifestyle: 'Modern professionals'
      },
      preferences: {
        metals: ['14K Gold', 'Rose Gold', 'Silver'],
        gemstones: ['Diamonds', 'Colored gemstones', 'Pearls'],
        styles: ['Minimalist', 'Contemporary', 'Stackable'],
        priceRange: [15000, 150000]
      },
      behavior: {
        visitFrequency: 'Regular',
        averageSpend: 45000,
        preferredChannels: ['Online', 'Social media', 'Mobile app'],
        decisionFactors: ['Style', 'Versatility', 'Price', 'Brand ethics']
      },
      size: 167,
      growth: 67.8,
      value: 751500,
      recommendations: [
        'Develop strong online presence',
        'Create mix-and-match collections',
        'Offer sustainable jewelry options',
        'Leverage social media marketing'
      ]
    }
  ]

  const marketTrends: MarketTrend[] = [
    {
      id: 'TREND001',
      category: 'Design',
      trend: 'Minimalist Jewelry',
      description: 'Growing preference for clean, simple designs with focus on quality craftsmanship over ornate details',
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
    },
    {
      id: 'TREND002',
      category: 'Sustainability',
      trend: 'Ethical Jewelry',
      description: 'Increasing demand for sustainably sourced materials and ethical manufacturing practices',
      strength: 76,
      direction: 'rising',
      timeframe: '12-18 months',
      markets: ['Metro cities', 'Young demographics'],
      impact: 'medium',
      opportunities: [
        'Obtain sustainability certifications',
        'Develop recycled metal collections',
        'Partner with ethical suppliers',
        'Market transparency initiatives'
      ],
      threats: [
        'Higher costs for certified materials',
        'Complex supply chain verification',
        'Premium pricing may limit market'
      ],
      recommendations: [
        'Gradually introduce certified pieces',
        'Educate customers on ethical value',
        'Transparent sourcing communication',
        'Premium pricing strategy'
      ],
      confidence: 82.7,
      sources: ['Industry reports', 'Customer feedback', 'Competitor analysis', 'Regulatory trends']
    }
  ]

  const aiModels: AIModel[] = [
    {
      id: 'MODEL001',
      name: 'Customer Recommendation Engine',
      type: 'recommendation',
      description: 'Personalized product recommendations based on customer behavior, preferences, and purchase history',
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
    },
    {
      id: 'MODEL002',
      name: 'Dynamic Pricing Optimizer',
      type: 'pricing',
      description: 'Real-time price optimization based on demand, inventory, competition, and market conditions',
      accuracy: 87.8,
      lastTrained: '2024-01-12T14:30:00Z',
      trainingData: {
        records: 8940,
        timespan: '18 months',
        features: 45
      },
      performance: {
        precision: 0.86,
        recall: 0.84,
        f1Score: 0.85
      },
      status: 'active',
      version: 'v1.8.2'
    },
    {
      id: 'MODEL003',
      name: 'Demand Forecasting',
      type: 'demand',
      description: 'Predictive model for inventory planning and demand forecasting across product categories',
      accuracy: 91.5,
      lastTrained: '2024-01-08T10:15:00Z',
      trainingData: {
        records: 12680,
        timespan: '3 years',
        features: 38
      },
      performance: {
        precision: 0.90,
        recall: 0.88,
        f1Score: 0.89
      },
      status: 'training',
      version: 'v3.0.1'
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
    return `¹${amount.toLocaleString()}`
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'from-red-400 to-red-600'
      case 'high': return 'from-orange-400 to-orange-600'
      case 'medium': return 'from-yellow-400 to-yellow-600'
      case 'low': return 'from-green-400 to-green-600'
      default: return 'from-gray-400 to-gray-600'
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
      case 'active': return <CheckCircle size={16} className="text-green-500" />
      case 'training': return <RefreshCw size={16} className="text-blue-500 animate-spin" />
      case 'inactive': return <XCircle size={16} className="text-gray-500" />
      case 'error': return <AlertTriangle size={16} className="text-red-500" />
      default: return <Info size={16} className="text-gray-500" />
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
              AI-Powered Intelligence
            </h1>
            <p className="jewelry-text-luxury text-lg md:text-xl">
              Advanced artificial intelligence for smart business decisions and automated optimization
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
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.key
                      ? 'jewelry-btn-primary'
                      : 'jewelry-btn-secondary'
                  }`}
                >
                  <tab.icon size={16} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* AI Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* AI Performance Metrics */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                <div className="jewelry-glass-card jewelry-float p-6 text-center">
                  <Zap className="mx-auto mb-3 jewelry-icon-gold" size={32} />
                  <h3 className="jewelry-text-high-contrast text-3xl font-bold">94.2%</h3>
                  <p className="jewelry-text-muted text-sm font-medium">AI Accuracy</p>
                  <div className="flex items-center justify-center mt-2 text-green-500">
                    <TrendingUp size={16} />
                    <span className="text-xs ml-1">+3.1%</span>
                  </div>
                </div>
                
                <div className="jewelry-glass-card jewelry-float p-6 text-center" style={{ animationDelay: '0.1s' }}>
                  <Target className="mx-auto mb-3 jewelry-icon-gold" size={32} />
                  <h3 className="jewelry-text-high-contrast text-3xl font-bold">67</h3>
                  <p className="jewelry-text-muted text-sm font-medium">Active Recommendations</p>
                  <div className="flex items-center justify-center mt-2 text-green-500">
                    <TrendingUp size={16} />
                    <span className="text-xs ml-1">+12</span>
                  </div>
                </div>
                
                <div className="jewelry-glass-card jewelry-float p-6 text-center" style={{ animationDelay: '0.2s' }}>
                  <DollarSign className="mx-auto mb-3 jewelry-icon-gold" size={32} />
                  <h3 className="jewelry-text-high-contrast text-3xl font-bold">¹28.5L</h3>
                  <p className="jewelry-text-muted text-sm font-medium">AI-Generated Revenue</p>
                  <div className="flex items-center justify-center mt-2 text-green-500">
                    <TrendingUp size={16} />
                    <span className="text-xs ml-1">+24.8%</span>
                  </div>
                </div>
                
                <div className="jewelry-glass-card jewelry-float p-6 text-center" style={{ animationDelay: '0.3s' }}>
                  <Activity className="mx-auto mb-3 jewelry-icon-gold" size={32} />
                  <h3 className="jewelry-text-high-contrast text-3xl font-bold">89.7%</h3>
                  <p className="jewelry-text-muted text-sm font-medium">Automation Rate</p>
                  <div className="flex items-center justify-center mt-2 text-green-500">
                    <TrendingUp size={16} />
                    <span className="text-xs ml-1">+5.2%</span>
                  </div>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Recent AI Recommendations */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="jewelry-glass-panel"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="jewelry-text-luxury text-xl font-semibold flex items-center gap-2">
                      <Lightbulb className="jewelry-icon-gold" size={24} />
                      Recent Recommendations
                    </h3>
                    <button 
                      onClick={() => setActiveTab('recommendations')}
                      className="jewelry-btn-secondary flex items-center space-x-2 px-3 py-1"
                    >
                      <Eye className="jewelry-icon-gold" size={14} />
                      <span className="text-sm">View All</span>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {aiRecommendations.slice(0, 3).map((rec) => (
                      <div key={rec.id} className="jewelry-glass-card p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getPriorityColor(rec.priority)} text-white`}>
                                {rec.priority.toUpperCase()}
                              </span>
                              <span className={`text-sm font-medium ${getConfidenceColor(rec.confidence)}`}>
                                {rec.confidence}% confidence
                              </span>
                            </div>
                            <h4 className="jewelry-text-high-contrast font-semibold text-sm">{rec.title}</h4>
                            <p className="jewelry-text-muted text-xs mt-1 line-clamp-2">{rec.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <span className="jewelry-text-muted">{rec.category}</span>
                          <div className="flex items-center space-x-2">
                            <span className="jewelry-text-luxury font-medium">{formatCurrency(rec.impact.revenue)} impact</span>
                            <button className="jewelry-btn-primary px-2 py-1 text-xs">
                              Review
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* AI Model Status */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="jewelry-glass-panel"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="jewelry-text-luxury text-xl font-semibold flex items-center gap-2">
                      <Cpu className="jewelry-icon-gold" size={24} />
                      AI Model Status
                    </h3>
                    <button 
                      onClick={() => setActiveTab('models')}
                      className="jewelry-btn-secondary flex items-center space-x-2 px-3 py-1"
                    >
                      <Settings className="jewelry-icon-gold" size={14} />
                      <span className="text-sm">Manage</span>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {aiModels.map((model) => (
                      <div key={model.id} className="jewelry-glass-card p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(model.status)}
                            <div>
                              <h4 className="jewelry-text-high-contrast font-semibold text-sm">{model.name}</h4>
                              <p className="jewelry-text-muted text-xs">{model.type} " v{model.version}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${getConfidenceColor(model.accuracy)}`}>
                              {model.accuracy}%
                            </p>
                            <p className="jewelry-text-muted text-xs">accuracy</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-xs">
                          <div>
                            <span className="jewelry-text-muted block">Precision</span>
                            <span className="jewelry-text-high-contrast">{(model.performance.precision * 100).toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="jewelry-text-muted block">Recall</span>
                            <span className="jewelry-text-high-contrast">{(model.performance.recall * 100).toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="jewelry-text-muted block">F1 Score</span>
                            <span className="jewelry-text-high-contrast">{(model.performance.f1Score * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div className="space-y-6">
              
              {/* Recommendation Controls */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="jewelry-glass-panel"
              >
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                  <div className="flex flex-wrap gap-4 items-center">
                    <select className="px-4 py-2 border border-jewelry-blue-200 rounded-lg jewelry-text-high-contrast text-sm">
                      <option value="">All Types</option>
                      <option value="pricing">Pricing</option>
                      <option value="customer">Customer</option>
                      <option value="inventory">Inventory</option>
                      <option value="marketing">Marketing</option>
                    </select>

                    <select className="px-4 py-2 border border-jewelry-blue-200 rounded-lg jewelry-text-high-contrast text-sm">
                      <option value="">All Priorities</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>

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
                      <Brain className="jewelry-icon-gold" size={18} />
                      <span>Generate New</span>
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Recommendations List */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="space-y-4"
              >
                {aiRecommendations.map((rec) => (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="jewelry-glass-panel jewelry-scale-hover cursor-pointer"
                    onClick={() => setSelectedRecommendation(rec)}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${getPriorityColor(rec.priority)} text-white`}>
                              {rec.priority.toUpperCase()}
                            </span>
                            <span className="jewelry-text-muted text-sm">{rec.category}</span>
                            <span className={`text-sm font-medium ${getConfidenceColor(rec.confidence)}`}>
                              {rec.confidence}% confidence
                            </span>
                          </div>
                          <h3 className="jewelry-text-luxury text-lg font-semibold mb-2">{rec.title}</h3>
                          <p className="jewelry-text-muted text-sm mb-4">{rec.description}</p>
                        </div>
                        
                        <div className="text-right">
                          <p className="jewelry-text-luxury font-bold text-lg">{formatCurrency(rec.impact.revenue)}</p>
                          <p className="jewelry-text-muted text-xs">Expected Impact</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-6 mb-4">
                        <div className="text-center">
                          <DollarSign className="mx-auto mb-2 jewelry-icon-gold" size={20} />
                          <p className="jewelry-text-high-contrast font-semibold">{formatCurrency(rec.impact.revenue)}</p>
                          <p className="jewelry-text-muted text-xs">Revenue Impact</p>
                        </div>
                        <div className="text-center">
                          <Users className="mx-auto mb-2 jewelry-icon-gold" size={20} />
                          <p className="jewelry-text-high-contrast font-semibold">{rec.impact.customers > 0 ? '+' : ''}{rec.impact.customers}</p>
                          <p className="jewelry-text-muted text-xs">Customer Impact</p>
                        </div>
                        <div className="text-center">
                          <Zap className="mx-auto mb-2 jewelry-icon-gold" size={20} />
                          <p className="jewelry-text-high-contrast font-semibold">+{rec.impact.efficiency}%</p>
                          <p className="jewelry-text-muted text-xs">Efficiency Gain</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-sm jewelry-text-muted">
                          <Clock size={14} />
                          <span>{rec.timeline}</span>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button className="jewelry-btn-secondary px-4 py-2 text-sm">
                            {rec.actions.secondary || 'Dismiss'}
                          </button>
                          <button className="jewelry-btn-primary px-4 py-2 text-sm">
                            {rec.actions.primary}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}

          {/* Pricing AI Tab */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              
              {/* Pricing Controls */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="jewelry-glass-panel"
              >
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                  <div className="flex flex-wrap gap-4 items-center">
                    <select className="px-4 py-2 border border-jewelry-blue-200 rounded-lg jewelry-text-high-contrast text-sm">
                      <option value="">All Categories</option>
                      <option value="rings">Rings</option>
                      <option value="necklaces">Necklaces</option>
                      <option value="earrings">Earrings</option>
                      <option value="bracelets">Bracelets</option>
                    </select>

                    <select className="px-4 py-2 border border-jewelry-blue-200 rounded-lg jewelry-text-high-contrast text-sm">
                      <option value="">All Status</option>
                      <option value="suggested">Suggested</option>
                      <option value="testing">Testing</option>
                      <option value="implemented">Implemented</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <button className="jewelry-btn-secondary flex items-center space-x-2 px-4 py-2">
                      <Activity className="jewelry-icon-gold" size={18} />
                      <span>Run Analysis</span>
                    </button>
                    
                    <button className="jewelry-btn-primary flex items-center space-x-2 px-4 py-2">
                      <Target className="jewelry-icon-gold" size={18} />
                      <span>Optimize Prices</span>
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Pricing Optimizations */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="space-y-4"
              >
                {pricingOptimizations.map((optimization) => (
                  <motion.div
                    key={optimization.productId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="jewelry-glass-panel"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="jewelry-text-luxury text-lg font-semibold">{optimization.productName}</h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              optimization.status === 'suggested' ? 'bg-blue-100 text-blue-800' :
                              optimization.status === 'testing' ? 'bg-yellow-100 text-yellow-800' :
                              optimization.status === 'implemented' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {optimization.status.toUpperCase()}
                            </span>
                            <span className={`text-sm font-medium ${getConfidenceColor(optimization.confidence)}`}>
                              {optimization.confidence}% confidence
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-4">
                            <div>
                              <p className="jewelry-text-muted text-sm">Current Price</p>
                              <p className="jewelry-text-high-contrast font-bold text-lg">{formatCurrency(optimization.currentPrice)}</p>
                            </div>
                            <div>
                              <p className="jewelry-text-muted text-sm">Suggested Price</p>
                              <p className="jewelry-text-luxury font-bold text-lg">{formatCurrency(optimization.suggestedPrice)}</p>
                            </div>
                            <div>
                              <p className="jewelry-text-muted text-sm">Price Change</p>
                              <p className={`font-bold text-lg ${optimization.priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {formatPercentage(optimization.priceChange)}
                              </p>
                            </div>
                            <div>
                              <p className="jewelry-text-muted text-sm">Expected Revenue</p>
                              <p className="text-green-500 font-bold text-lg">{formatPercentage(optimization.expectedImpact.revenue)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <h4 className="jewelry-text-luxury font-semibold mb-3">Market Factors</h4>
                          <div className="space-y-3">
                            {Object.entries(optimization.marketFactors).map(([factor, value]) => (
                              <div key={factor} className="flex items-center justify-between">
                                <span className="jewelry-text-muted text-sm capitalize">{factor.replace(/([A-Z])/g, ' $1')}</span>
                                <div className="flex items-center space-x-2">
                                  <div className="w-20 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="h-2 rounded-full bg-gradient-to-r from-jewelry-blue-400 to-jewelry-blue-600"
                                      style={{ width: `${value}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm jewelry-text-high-contrast w-8">{value}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="jewelry-text-luxury font-semibold mb-3">AI Reasoning</h4>
                          <div className="space-y-2">
                            {optimization.reasoning.map((reason, index) => (
                              <div key={index} className="flex items-start space-x-2">
                                <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="jewelry-text-muted text-sm">{reason}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-jewelry-blue-200">
                        <div className="flex items-center space-x-2 text-sm jewelry-text-muted">
                          <Clock size={14} />
                          <span>Test Duration: {optimization.testDuration}</span>
                        </div>
                        
                        <div className="flex space-x-2">
                          {optimization.status === 'suggested' && (
                            <>
                              <button className="jewelry-btn-secondary px-4 py-2 text-sm">
                                Reject
                              </button>
                              <button className="jewelry-btn-primary px-4 py-2 text-sm">
                                Start A/B Test
                              </button>
                            </>
                          )}
                          {optimization.status === 'testing' && (
                            <>
                              <button className="jewelry-btn-secondary px-4 py-2 text-sm">
                                Stop Test
                              </button>
                              <button className="jewelry-btn-primary px-4 py-2 text-sm">
                                View Results
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}

          {/* Customer AI Tab */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              
              {/* Customer Personas */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="jewelry-glass-panel"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="jewelry-text-luxury text-xl font-semibold flex items-center gap-2">
                    <Users className="jewelry-icon-gold" size={24} />
                    AI-Generated Customer Personas
                  </h3>
                  <button className="jewelry-btn-primary flex items-center space-x-2 px-4 py-2">
                    <Brain className="jewelry-icon-gold" size={18} />
                    <span>Refresh Analysis</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {customerPersonas.map((persona) => (
                    <motion.div
                      key={persona.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="jewelry-glass-card jewelry-scale-hover"
                    >
                      <div className="p-6">
                        <div className="text-center mb-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-jewelry-blue-100 to-jewelry-blue-200 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Crown className="jewelry-icon-gold" size={32} />
                          </div>
                          <h4 className="jewelry-text-luxury text-lg font-semibold">{persona.name}</h4>
                          <p className="jewelry-text-muted text-sm">{persona.demographics.ageRange} " {persona.demographics.income}</p>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <h5 className="jewelry-text-high-contrast font-medium text-sm mb-2">Key Metrics</h5>
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div>
                                <p className="jewelry-text-luxury font-bold">{persona.size}</p>
                                <p className="jewelry-text-muted text-xs">Customers</p>
                              </div>
                              <div>
                                <p className="jewelry-text-luxury font-bold">{formatPercentage(persona.growth)}</p>
                                <p className="jewelry-text-muted text-xs">Growth</p>
                              </div>
                              <div>
                                <p className="jewelry-text-luxury font-bold">{formatCurrency(persona.value)}</p>
                                <p className="jewelry-text-muted text-xs">Value</p>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h5 className="jewelry-text-high-contrast font-medium text-sm mb-2">Preferences</h5>
                            <div className="flex flex-wrap gap-1">
                              {persona.preferences.styles.slice(0, 3).map((style, index) => (
                                <span key={index} className="bg-jewelry-blue-100 text-jewelry-blue-900 text-xs px-2 py-1 rounded">
                                  {style}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h5 className="jewelry-text-high-contrast font-medium text-sm mb-2">Behavior</h5>
                            <div className="space-y-1 text-xs jewelry-text-muted">
                              <p>Visits: {persona.behavior.visitFrequency}</p>
                              <p>Avg Spend: {formatCurrency(persona.behavior.averageSpend)}</p>
                              <p>Channel: {persona.behavior.preferredChannels[0]}</p>
                            </div>
                          </div>
                          
                          <button className="w-full jewelry-btn-primary py-2 text-sm">
                            View Details
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {/* Market Trends Tab */}
          {activeTab === 'trends' && (
            <div className="space-y-6">
              
              {/* Market Trends */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="space-y-4"
              >
                {marketTrends.map((trend) => (
                  <motion.div
                    key={trend.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="jewelry-glass-panel"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="jewelry-text-luxury text-lg font-semibold">{trend.trend}</h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              trend.direction === 'rising' ? 'bg-green-100 text-green-800' :
                              trend.direction === 'falling' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {trend.direction.toUpperCase()}
                            </span>
                            <span className="jewelry-text-muted text-sm">{trend.category}</span>
                          </div>
                          <p className="jewelry-text-muted text-sm mb-4">{trend.description}</p>
                        </div>
                        
                        <div className="text-right">
                          <p className="jewelry-text-luxury font-bold text-lg">{trend.strength}%</p>
                          <p className="jewelry-text-muted text-xs">Trend Strength</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <h4 className="jewelry-text-luxury font-semibold mb-3">Opportunities</h4>
                          <div className="space-y-2">
                            {trend.opportunities.map((opportunity, index) => (
                              <div key={index} className="flex items-start space-x-2">
                                <Sparkles size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="jewelry-text-muted text-sm">{opportunity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="jewelry-text-luxury font-semibold mb-3">Recommendations</h4>
                          <div className="space-y-2">
                            {trend.recommendations.slice(0, 3).map((rec, index) => (
                              <div key={index} className="flex items-start space-x-2">
                                <Lightbulb size={14} className="jewelry-icon-gold mt-0.5 flex-shrink-0" />
                                <span className="jewelry-text-muted text-sm">{rec}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-jewelry-blue-200">
                        <div className="flex items-center space-x-4 text-sm jewelry-text-muted">
                          <span>Timeframe: {trend.timeframe}</span>
                          <span>Confidence: {trend.confidence}%</span>
                          <span>Impact: {trend.impact}</span>
                        </div>
                        
                        <button className="jewelry-btn-primary px-4 py-2 text-sm">
                          Create Action Plan
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}

          {/* Other tabs (Insights, Models) rendered as placeholders */}
          {(activeTab === 'insights' || activeTab === 'models') && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="jewelry-glass-panel"
            >
              <div className="p-12 text-center">
                <Brain className="mx-auto mb-4 jewelry-icon-gold" size={64} />
                <h3 className="jewelry-text-luxury text-xl font-semibold mb-2">
                  {activeTab === 'insights' ? 'AI Insights & Analytics' : 'AI Model Management'}
                </h3>
                <p className="jewelry-text-muted">
                  {activeTab === 'insights' 
                    ? 'Deep business insights, pattern recognition, and predictive analytics powered by machine learning.'
                    : 'Advanced AI model training, performance monitoring, and optimization tools for jewelry business intelligence.'
                  }
                </p>
              </div>
            </motion.div>
          )}

          {/* Footer */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            className="text-center mt-12 mb-6"
          >
            <p className="jewelry-text-muted text-sm">
              AI-powered intelligence by <span className="jewelry-text-luxury font-semibold">HERA Advanced Analytics Engine</span>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}