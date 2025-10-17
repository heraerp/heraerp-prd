'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Award,
  Crown,
  Star,
  Eye,
  Brain,
  Compass,
  Globe,
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
  Palmtree,
  Waves,
  Ship,
  Plane,
  Truck,
  Phone,
  Mail,
  Heart,
  ThumbsUp,
  Sparkles,
  Layers,
  Database,
  Network,
  Cpu,
  Anchor,
  Coffee,
  TreePine,
  Mountain,
  Sun,
  Umbrella,
  Leaf,
  Fish,
  Coconut,
  Flower,
  Gem,
  Zap
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface KeralaMarketData {
  region: string
  population: number
  economicGrowth: number
  furnitureMarketSize: number
  marketGrowth: number
  averageIncome: number
  keyIndustries: string[]
  opportunities: string[]
  challenges: string[]
}

interface KeralaCustomerSegment {
  segment: string
  size: number
  growthRate: number
  avgSpending: number
  preferences: string[]
  channels: string[]
  seasonality: string
  priority: 'high' | 'medium' | 'low'
}

interface KeralaCulturalInsight {
  id: string
  insight: string
  category: 'tradition' | 'festival' | 'lifestyle' | 'architecture' | 'craft'
  businessImpact: number
  actionable: boolean
  timeRelevance: string
  examples: string[]
}

interface KeralaOpportunity {
  id: string
  title: string
  description: string
  marketSize: number
  growthPotential: number
  investmentRequired: number
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term'
  riskLevel: 'low' | 'medium' | 'high'
  expectedROI: number
  keySuccessFactors: string[]
}

function KeralaInsightsPage() {
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [selectedTimeframe, setSelectedTimeframe] = useState('1y')
  const [insightAnalysisRunning, setInsightAnalysisRunning] = useState(false)

  // Kerala Regional Market Data
  const keralaRegions: KeralaMarketData[] = [
    {
      region: 'Kochi Metropolitan',
      population: 2200000,
      economicGrowth: 8.5,
      furnitureMarketSize: 450000000,
      marketGrowth: 15.2,
      averageIncome: 65000,
      keyIndustries: ['IT & Software', 'Tourism', 'Marine Products', 'Spices'],
      opportunities: ['Tech office furniture', 'Hotel partnerships', 'Luxury homes'],
      challenges: ['High competition', 'Import pressure', 'Space constraints']
    },
    {
      region: 'Thiruvananthapuram',
      population: 1700000,
      economicGrowth: 7.2,
      furnitureMarketSize: 280000000,
      marketGrowth: 12.8,
      averageIncome: 58000,
      keyIndustries: ['Government', 'IT Services', 'Tourism', 'Education'],
      opportunities: ['Government contracts', 'Educational institutions', 'Tech parks'],
      challenges: ['Bureaucratic processes', 'Budget constraints', 'Seasonal demand']
    },
    {
      region: 'Kozhikode',
      population: 1100000,
      economicGrowth: 6.8,
      furnitureMarketSize: 180000000,
      marketGrowth: 10.5,
      averageIncome: 52000,
      keyIndustries: ['Timber & Wood', 'Textiles', 'Agriculture', 'Trading'],
      opportunities: ['Raw material sourcing', 'Traditional crafts', 'Export hub'],
      challenges: ['Traditional mindset', 'Price sensitivity', 'Logistics']
    },
    {
      region: 'Thrissur',
      population: 950000,
      economicGrowth: 6.2,
      furnitureMarketSize: 145000000,
      marketGrowth: 9.8,
      averageIncome: 48000,
      keyIndustries: ['Gold & Jewelry', 'Agriculture', 'Textiles', 'Handicrafts'],
      opportunities: ['Luxury furniture', 'Festival decorations', 'Cultural themes'],
      challenges: ['Conservative market', 'Seasonal fluctuations', 'Local competition']
    },
    {
      region: 'Malappuram',
      population: 1250000,
      economicGrowth: 5.8,
      furnitureMarketSize: 125000000,
      marketGrowth: 8.5,
      averageIncome: 42000,
      keyIndustries: ['Remittances', 'Agriculture', 'Small Scale Industries', 'Education'],
      opportunities: ['Gulf remittance market', 'Islamic designs', 'Educational furniture'],
      challenges: ['Price sensitivity', 'Traditional preferences', 'Limited industrialization']
    }
  ]

  // Kerala Customer Segments
  const keralaCustomerSegments: KeralaCustomerSegment[] = [
    {
      segment: 'Tech Professionals',
      size: 145000,
      growthRate: 18.5,
      avgSpending: 85000,
      preferences: ['Modern design', 'Smart furniture', 'Ergonomic', 'Space-saving'],
      channels: ['Online', 'Showrooms', 'Design consultants'],
      seasonality: 'Year-round with Diwali peak',
      priority: 'high'
    },
    {
      segment: 'Traditional Families',
      size: 380000,
      growthRate: 6.2,
      avgSpending: 45000,
      preferences: ['Teak wood', 'Classic designs', 'Durability', 'Kerala style'],
      channels: ['Local dealers', 'Carpentry shops', 'Word of mouth'],
      seasonality: 'Onam and Vishu festivals',
      priority: 'high'
    },
    {
      segment: 'Gulf Returnees',
      size: 95000,
      growthRate: 12.3,
      avgSpending: 120000,
      preferences: ['Luxury finishes', 'Modern Arabic fusion', 'Premium materials', 'Custom designs'],
      channels: ['Premium showrooms', 'Interior designers', 'Referrals'],
      seasonality: 'Return periods and festivals',
      priority: 'high'
    },
    {
      segment: 'Hotel & Tourism',
      size: 25000,
      growthRate: 22.8,
      avgSpending: 350000,
      preferences: ['Bulk orders', 'Standardized designs', 'Maintenance-free', 'Cost-effective'],
      channels: ['B2B sales', 'Tenders', 'Industry networks'],
      seasonality: 'Tourism season planning',
      priority: 'medium'
    },
    {
      segment: 'Young Professionals',
      size: 125000,
      growthRate: 25.4,
      avgSpending: 32000,
      preferences: ['Affordable', 'Trendy', 'Multi-functional', 'Easy assembly'],
      channels: ['Online platforms', 'Retail stores', 'Social media'],
      seasonality: 'New job/marriage season',
      priority: 'medium'
    }
  ]

  // Kerala Cultural Insights
  const keralaCulturalInsights: KeralaCulturalInsight[] = [
    {
      id: 'cultural-1',
      insight: 'Teak wood furniture is considered an investment and status symbol in Kerala families',
      category: 'tradition',
      businessImpact: 92,
      actionable: true,
      timeRelevance: 'Permanent cultural preference',
      examples: ['Teak dining sets', 'Bedroom furniture', 'Traditional carved pieces']
    },
    {
      id: 'cultural-2',
      insight: 'Onam festival drives 35% of annual furniture purchases in Kerala',
      category: 'festival',
      businessImpact: 85,
      actionable: true,
      timeRelevance: 'August-September annually',
      examples: ['Onam special collections', 'Festival discounts', 'Home renovation packages']
    },
    {
      id: 'cultural-3',
      insight: 'Traditional Kerala architecture influences furniture preferences with low-height, floor-sitting designs',
      category: 'architecture',
      businessImpact: 78,
      actionable: true,
      timeRelevance: 'Ongoing architectural trend',
      examples: ['Low-height coffee tables', 'Floor cushions', 'Traditional study desks']
    },
    {
      id: 'cultural-4',
      insight: 'Kerala\'s monsoon season requires furniture with moisture resistance and proper ventilation',
      category: 'lifestyle',
      businessImpact: 88,
      actionable: true,
      timeRelevance: 'June-September monsoon period',
      examples: ['Treated wood furniture', 'Bamboo alternatives', 'Anti-fungal finishes']
    },
    {
      id: 'cultural-5',
      insight: 'Traditional craftsmanship (Channapatna, Nettur) creates demand for handcrafted furniture',
      category: 'craft',
      businessImpact: 65,
      actionable: true,
      timeRelevance: 'Heritage appreciation trend',
      examples: ['Hand-carved details', 'Traditional joinery', 'Artisan collaborations']
    }
  ]

  // Kerala Market Opportunities
  const keralaOpportunities: KeralaOpportunity[] = [
    {
      id: 'opp-1',
      title: 'Eco-Tourism Furniture Partnership',
      description: 'Partner with Kerala\'s growing eco-tourism resorts to provide sustainable, locally-inspired furniture that enhances guest experience.',
      marketSize: 180000000,
      growthPotential: 28.5,
      investmentRequired: 12000000,
      timeframe: 'medium_term',
      riskLevel: 'medium',
      expectedROI: 35.2,
      keySuccessFactors: ['Sustainable materials', 'Local design elements', 'Resort partnerships', 'Seasonal adaptability']
    },
    {
      id: 'opp-2',
      title: 'Tech Park Office Furniture Solutions',
      description: 'Capture the growing demand from IT companies and tech parks in Kochi and Thiruvananthapuram for modern, ergonomic office furniture.',
      marketSize: 320000000,
      growthPotential: 42.8,
      investmentRequired: 25000000,
      timeframe: 'short_term',
      riskLevel: 'low',
      expectedROI: 48.5,
      keySuccessFactors: ['Ergonomic design', 'Flexible configurations', 'Quick delivery', 'Corporate relationships']
    },
    {
      id: 'opp-3',
      title: 'Premium Gulf-Returnee Market',
      description: 'Target affluent Gulf returnees with luxury furniture collections that blend modern aesthetics with traditional Kerala elements.',
      marketSize: 150000000,
      growthPotential: 22.3,
      investmentRequired: 18000000,
      timeframe: 'immediate',
      riskLevel: 'medium',
      expectedROI: 38.7,
      keySuccessFactors: ['Luxury positioning', 'Custom designs', 'Arabic fusion styles', 'Premium materials']
    },
    {
      id: 'opp-4',
      title: 'Traditional Craft Revival Program',
      description: 'Revive and modernize traditional Kerala furniture crafts to create unique, heritage-inspired collections for premium markets.',
      marketSize: 95000000,
      growthPotential: 18.5,
      investmentRequired: 8000000,
      timeframe: 'long_term',
      riskLevel: 'high',
      expectedROI: 28.3,
      keySuccessFactors: ['Artisan partnerships', 'Heritage authenticity', 'Modern functionality', 'Cultural storytelling']
    },
    {
      id: 'opp-5',
      title: 'Monsoon-Resistant Furniture Line',
      description: 'Develop a specialized furniture line designed for Kerala\'s humid climate with moisture resistance and durability features.',
      marketSize: 220000000,
      growthPotential: 32.1,
      investmentRequired: 15000000,
      timeframe: 'short_term',
      riskLevel: 'low',
      expectedROI: 41.6,
      keySuccessFactors: ['Climate adaptation', 'Material innovation', 'Local testing', 'Warranty programs']
    }
  ]

  // Kerala Economic Indicators
  const keralaEconomicData = {
    totalMarketSize: 1180000000,
    annualGrowth: 12.8,
    perCapitaIncome: 55000,
    furniturePenetration: 68,
    onlinePenetration: 23,
    exportContribution: 15,
    employmentInSector: 125000,
    numberOfManufacturers: 2500
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
    return `₹${amount}`
  }

  const getSegmentPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'low': return 'bg-green-500/20 text-green-300 border-green-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const getCulturalCategoryIcon = (category: KeralaCulturalInsight['category']) => {
    switch (category) {
      case 'tradition': return Crown
      case 'festival': return Star
      case 'lifestyle': return Home
      case 'architecture': return Building2
      case 'craft': return Award
      default: return Lightbulb
    }
  }

  const getRiskLevelColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-[var(--jewelry-success)]'
      case 'medium': return 'text-[var(--jewelry-warning)]'
      case 'high': return 'text-[var(--jewelry-error)]'
      default: return 'text-gray-400'
    }
  }

  const getTimeframeColor = (timeframe: string) => {
    switch (timeframe) {
      case 'immediate': return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'short_term': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'medium_term': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'long_term': return 'bg-green-500/20 text-green-300 border-green-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  return (
    <div className="min-h-screen relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--jewelry-blue-500)] to-[var(--jewelry-blue-700)] flex items-center justify-center">
                <MapPin className="h-6 w-6 text-[var(--jewelry-gold-400)]" />
              </div>
              Kerala Market Insights
            </h1>
            <p className="text-gray-300 mt-2">
              Comprehensive analysis of Kerala's furniture market opportunities and cultural dynamics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-3 py-2 rounded-md border bg-black/20 border-gray-600 text-white focus:border-[var(--jewelry-gold-500)]"
              >
                <option value="6m">Last 6 months</option>
                <option value="1y">Last year</option>
                <option value="2y">Last 2 years</option>
                <option value="5y">5-year trend</option>
              </select>
            </div>
            <Button 
              variant="outline" 
              className="gap-2 text-white border-gray-400 hover:border-white hover:text-white"
              onClick={() => setInsightAnalysisRunning(!insightAnalysisRunning)}
            >
              <Palmtree className={`h-4 w-4 ${insightAnalysisRunning ? 'animate-pulse' : ''}`} />
              <span className="text-white">{insightAnalysisRunning ? 'Analyzing...' : 'Kerala AI'}</span>
            </Button>
            <Button variant="outline" className="gap-2 text-white border-gray-400 hover:border-white hover:text-white">
              <Download className="h-4 w-4" />
              <span className="text-white">Export Report</span>
            </Button>
            <Button className="gap-2 bg-[var(--jewelry-gold-500)] text-black hover:bg-[var(--jewelry-gold-600)] border-0">
              <Compass className="h-4 w-4" />
              <span className="text-black font-medium">Kerala Dashboard</span>
            </Button>
          </div>
        </div>

        {/* Kerala Market Overview */}
        <div className="jewelry-glass-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palmtree className="h-5 w-5 text-[var(--jewelry-gold-500)]" />
              <span className="text-white font-medium">Kerala Market Intelligence</span>
              <div className="w-2 h-2 bg-[var(--jewelry-success)] rounded-full animate-pulse"></div>
              <span className="text-gray-400 text-sm">Status: God's Own Country Analytics</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-400">Market Size</p>
                <p className="font-semibold text-white">{formatCurrency(keralaEconomicData.totalMarketSize)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Annual Growth</p>
                <p className="font-semibold text-[var(--jewelry-success)]">{keralaEconomicData.annualGrowth}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Market Penetration</p>
                <p className="font-semibold text-[var(--jewelry-gold-500)]">{keralaEconomicData.furniturePenetration}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Online Adoption</p>
                <p className="font-semibold text-[var(--jewelry-info)]">{keralaEconomicData.onlinePenetration}%</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Last Analysis</p>
              <p className="text-sm text-white">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>

        {/* Kerala Insights Tabs */}
        <Tabs defaultValue="regions" className="space-y-6">
          <TabsList className="bg-black/20 border border-gray-600">
            <TabsTrigger value="regions" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Regional Analysis
            </TabsTrigger>
            <TabsTrigger value="segments" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Customer Segments
            </TabsTrigger>
            <TabsTrigger value="cultural" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Cultural Insights
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Market Opportunities
            </TabsTrigger>
          </TabsList>

          <TabsContent value="regions" className="space-y-6">
            {/* Regional Market Analysis */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <MapPin className="h-6 w-6 text-[var(--jewelry-gold-500)]" />
                  <h3 className="text-xl font-semibold text-white">Kerala Regional Market Analysis</h3>
                  <Badge className="bg-[var(--jewelry-gold-500)]/20 text-[var(--jewelry-gold-500)] border-[var(--jewelry-gold-500)]/30">
                    5 Key Regions
                  </Badge>
                </div>
                <Button variant="outline" className="gap-2 text-white border-gray-400 hover:border-white hover:text-white">
                  <Eye className="h-4 w-4" />
                  <span className="text-white">Detailed Map</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {keralaRegions.map((region, index) => (
                  <div key={index} className="bg-black/20 rounded-lg p-6 border border-gray-600 hover:border-[var(--jewelry-gold-500)]/50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-white text-lg">{region.region}</h4>
                        <p className="text-gray-400 text-sm">{(region.population / 1000000).toFixed(1)}M Population</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[var(--jewelry-gold-500)]">{formatCurrency(region.furnitureMarketSize)}</p>
                        <p className="text-xs text-gray-400">Market Size</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-sm">Economic Growth</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--jewelry-success)] font-semibold">{region.economicGrowth}%</span>
                          <ArrowUp className="h-3 w-3 text-[var(--jewelry-success)]" />
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Market Growth</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--jewelry-gold-500)] font-semibold">{region.marketGrowth}%</span>
                          <TrendingUp className="h-3 w-3 text-[var(--jewelry-gold-500)]" />
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Avg Income</p>
                        <span className="text-white font-semibold">₹{region.averageIncome.toLocaleString()}</span>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Industries</p>
                        <span className="text-white font-semibold">{region.keyIndustries.length}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Key Industries</p>
                        <div className="flex flex-wrap gap-1">
                          {region.keyIndustries.slice(0, 3).map((industry, i) => (
                            <Badge key={i} variant="secondary" className="text-xs bg-[var(--jewelry-blue-500)]/20 text-[var(--jewelry-blue-300)]">
                              {industry}
                            </Badge>
                          ))}
                          {region.keyIndustries.length > 3 && (
                            <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-200">
                              +{region.keyIndustries.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-gray-400 text-sm mb-1">Market Opportunities</p>
                        <div className="space-y-1">
                          {region.opportunities.slice(0, 2).map((opp, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-[var(--jewelry-success)]" />
                              <span className="text-gray-300 text-sm">{opp}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-gray-400 text-sm mb-1">Key Challenges</p>
                        <div className="space-y-1">
                          {region.challenges.slice(0, 2).map((challenge, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <AlertTriangle className="h-3 w-3 text-[var(--jewelry-warning)]" />
                              <span className="text-gray-300 text-sm">{challenge}</span>
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

          <TabsContent value="segments" className="space-y-6">
            {/* Customer Segments */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-[var(--jewelry-blue-500)]" />
                  <h3 className="text-xl font-semibold text-white">Kerala Customer Segments</h3>
                </div>
                <Button variant="outline" className="gap-2 text-white border-gray-400 hover:border-white hover:text-white">
                  <Target className="h-4 w-4" />
                  <span className="text-white">Targeting Strategy</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {keralaCustomerSegments.map((segment, index) => (
                  <div key={index} className="bg-black/20 rounded-lg p-6 border border-gray-600">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-white text-lg">{segment.segment}</h4>
                        <p className="text-gray-400 text-sm">{segment.size.toLocaleString()} customers</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs border ${getSegmentPriorityColor(segment.priority)}`}>
                          {segment.priority} priority
                        </Badge>
                        <div className="text-right">
                          <p className="text-lg font-bold text-[var(--jewelry-gold-500)]">+{segment.growthRate}%</p>
                          <p className="text-xs text-gray-400">growth</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Average Spending</p>
                        <p className="text-2xl font-bold text-white">{formatCurrency(segment.avgSpending)}</p>
                      </div>

                      <div>
                        <p className="text-gray-400 text-sm mb-2">Key Preferences</p>
                        <div className="flex flex-wrap gap-1">
                          {segment.preferences.slice(0, 3).map((pref, i) => (
                            <Badge key={i} variant="secondary" className="text-xs bg-gray-700 text-gray-200">
                              {pref}
                            </Badge>
                          ))}
                          {segment.preferences.length > 3 && (
                            <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-200">
                              +{segment.preferences.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-gray-400 text-sm mb-2">Preferred Channels</p>
                        <div className="flex flex-wrap gap-1">
                          {segment.channels.map((channel, i) => (
                            <Badge key={i} variant="secondary" className="text-xs bg-[var(--jewelry-blue-500)]/20 text-[var(--jewelry-blue-300)]">
                              {channel}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-gray-400 text-sm">Seasonality Pattern</p>
                        <p className="text-white font-medium">{segment.seasonality}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cultural" className="space-y-6">
            {/* Cultural Insights */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Palmtree className="h-6 w-6 text-[var(--jewelry-gold-500)]" />
                  <h3 className="text-xl font-semibold text-white">Kerala Cultural Market Insights</h3>
                </div>
                <Button variant="outline" className="gap-2 text-white border-gray-400 hover:border-white hover:text-white">
                  <Heart className="h-4 w-4" />
                  <span className="text-white">Cultural Strategy</span>
                </Button>
              </div>

              <div className="space-y-4">
                {keralaCulturalInsights.map((insight) => {
                  const CategoryIcon = getCulturalCategoryIcon(insight.category)
                  return (
                    <div key={insight.id} className="bg-black/20 rounded-lg p-6 border border-gray-600 hover:border-[var(--jewelry-gold-500)]/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-black/30 flex items-center justify-center">
                          <CategoryIcon className="h-6 w-6 text-[var(--jewelry-gold-500)]" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="secondary" className="text-xs bg-[var(--jewelry-gold-500)]/20 text-[var(--jewelry-gold-500)]">
                              {insight.category}
                            </Badge>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-400">Impact:</span>
                              <div className="w-16 h-2 bg-gray-700 rounded-full">
                                <div
                                  className="h-2 bg-[var(--jewelry-gold-500)] rounded-full"
                                  style={{ width: `${insight.businessImpact}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-white font-semibold">{insight.businessImpact}%</span>
                            </div>
                          </div>
                          <h4 className="font-semibold text-white text-lg mb-2">{insight.insight}</h4>
                          <p className="text-gray-400 text-sm mb-3">{insight.timeRelevance}</p>
                          
                          <div>
                            <p className="text-gray-400 text-sm mb-2">Business Applications</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              {insight.examples.map((example, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <Lightbulb className="h-3 w-3 text-[var(--jewelry-gold-500)]" />
                                  <span className="text-gray-300 text-sm">{example}</span>
                                </div>
                              ))}
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

          <TabsContent value="opportunities" className="space-y-6">
            {/* Market Opportunities */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Rocket className="h-6 w-6 text-[var(--jewelry-gold-500)]" />
                  <h3 className="text-xl font-semibold text-white">Kerala Market Opportunities</h3>
                </div>
                <Button className="gap-2 bg-[var(--jewelry-gold-500)] text-black hover:bg-[var(--jewelry-gold-600)] border-0">
                  <Target className="h-4 w-4" />
                  <span className="text-black font-medium">Investment Plan</span>
                </Button>
              </div>

              <div className="space-y-6">
                {keralaOpportunities.map((opportunity) => (
                  <div key={opportunity.id} className="bg-black/20 rounded-lg p-6 border border-gray-600 hover:border-[var(--jewelry-gold-500)]/50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white text-xl mb-2">{opportunity.title}</h4>
                        <p className="text-gray-300 mb-4">{opportunity.description}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-2xl font-bold text-[var(--jewelry-gold-500)]">{formatCurrency(opportunity.marketSize)}</p>
                        <p className="text-xs text-gray-400">Market Size</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-sm">Growth Potential</p>
                        <div className="flex items-center gap-1">
                          <span className="text-[var(--jewelry-success)] font-semibold">+{opportunity.growthPotential}%</span>
                          <TrendingUp className="h-3 w-3 text-[var(--jewelry-success)]" />
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Investment Required</p>
                        <span className="text-white font-semibold">{formatCurrency(opportunity.investmentRequired)}</span>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Expected ROI</p>
                        <span className="text-[var(--jewelry-gold-500)] font-semibold">{opportunity.expectedROI}%</span>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Risk Level</p>
                        <span className={`font-semibold ${getRiskLevelColor(opportunity.riskLevel)}`}>
                          {opportunity.riskLevel}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className={`text-sm border ${getTimeframeColor(opportunity.timeframe)}`}>
                          {opportunity.timeframe.replace('_', ' ')} implementation
                        </Badge>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-sm">ROI Timeline:</span>
                          <span className="text-white font-medium">
                            {opportunity.timeframe === 'immediate' ? '6-12 months' :
                             opportunity.timeframe === 'short_term' ? '1-2 years' :
                             opportunity.timeframe === 'medium_term' ? '2-3 years' : '3-5 years'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-gray-400 text-sm mb-2">Key Success Factors</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {opportunity.keySuccessFactors.map((factor, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-[var(--jewelry-success)]" />
                              <span className="text-gray-300 text-sm">{factor}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end mt-4 pt-4 border-t border-gray-600">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-white border-gray-400 hover:border-white hover:text-white">
                          <Eye className="h-3 w-3 mr-1" />
                          <span className="text-white">Detailed Analysis</span>
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-[var(--jewelry-gold-500)] text-black hover:bg-[var(--jewelry-gold-600)]"
                        >
                          <Rocket className="h-3 w-3 mr-1" />
                          <span className="text-black">Pursue Opportunity</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Kerala Market Summary */}
        <div className="jewelry-glass-card p-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Palmtree className="h-8 w-8 text-[var(--jewelry-gold-500)]" />
              <h3 className="text-2xl font-bold text-white">Kerala Market Intelligence Summary</h3>
            </div>
            <p className="text-gray-400">Strategic insights from God's Own Country furniture market</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--jewelry-gold-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <MapPin className="h-8 w-8 text-[var(--jewelry-gold-500)]" />
              </div>
              <p className="text-2xl font-bold text-white">{formatCurrency(keralaEconomicData.totalMarketSize)}</p>
              <p className="text-gray-400">Total Market Size</p>
              <p className="text-[var(--jewelry-success)] text-sm">+{keralaEconomicData.annualGrowth}% annually</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--jewelry-blue-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-8 w-8 text-[var(--jewelry-blue-500)]" />
              </div>
              <p className="text-2xl font-bold text-white">{keralaCustomerSegments.length}</p>
              <p className="text-gray-400">Customer Segments</p>
              <p className="text-[var(--jewelry-success)] text-sm">High-value targets</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--jewelry-gold-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Heart className="h-8 w-8 text-[var(--jewelry-gold-500)]" />
              </div>
              <p className="text-2xl font-bold text-white">{keralaCulturalInsights.length}</p>
              <p className="text-gray-400">Cultural Insights</p>
              <p className="text-[var(--jewelry-gold-500)] text-sm">Heritage-driven</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--jewelry-blue-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Rocket className="h-8 w-8 text-[var(--jewelry-blue-500)]" />
              </div>
              <p className="text-2xl font-bold text-white">{keralaOpportunities.length}</p>
              <p className="text-gray-400">Market Opportunities</p>
              <p className="text-[var(--jewelry-success)] text-sm">Ready to pursue</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(KeralaInsightsPage)