'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  LineChart,
  Target,
  Zap,
  Award,
  Crown,
  Gem,
  Star,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Calculator,
  Percent,
  Layers,
  Eye,
  Download,
  Share2,
  Settings,
  RefreshCw,
  Filter,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  Lightbulb,
  Rocket,
  Package,
  Users,
  Factory,
  ShoppingCart,
  Globe,
  Building2,
  Scissors,
  Wrench,
  Truck,
  Phone,
  Mail,
  MapPin
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface ProfitMetric {
  id: string
  label: string
  value: number
  formatted: string
  change: number
  changeType: 'increase' | 'decrease' | 'neutral'
  period: string
  target?: number
  benchmark?: number
}

interface ProfitCenter {
  id: string
  name: string
  revenue: number
  costs: number
  grossProfit: number
  grossMargin: number
  netProfit: number
  netMargin: number
  roi: number
  trend: 'up' | 'down' | 'stable'
  performance: 'excellent' | 'good' | 'average' | 'poor'
}

interface CostBreakdown {
  category: string
  amount: number
  percentage: number
  change: number
  controllable: boolean
  optimization: string[]
}

interface ProfitOptimization {
  id: string
  type: 'cost_reduction' | 'revenue_increase' | 'efficiency' | 'pricing'
  title: string
  description: string
  potentialSaving: number
  implementation: 'immediate' | 'short_term' | 'long_term'
  impact: 'high' | 'medium' | 'low'
  effort: 'low' | 'medium' | 'high'
  priority: number
}

function ProfitAnalysisPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('ytd')
  const [viewMode, setViewMode] = useState('detailed')
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Key Profit Metrics
  const profitMetrics: ProfitMetric[] = [
    {
      id: 'gross-profit',
      label: 'Gross Profit',
      value: 18500000,
      formatted: '₹1.85Cr',
      change: 22.5,
      changeType: 'increase',
      period: 'YTD',
      target: 20000000,
      benchmark: 17500000
    },
    {
      id: 'net-profit',
      label: 'Net Profit',
      value: 6940000,
      formatted: '₹69.4L',
      change: 18.7,
      changeType: 'increase',
      period: 'YTD',
      target: 7200000,
      benchmark: 6200000
    },
    {
      id: 'gross-margin',
      label: 'Gross Margin',
      value: 64.2,
      formatted: '64.2%',
      change: 3.2,
      changeType: 'increase',
      period: 'YTD',
      target: 65.0,
      benchmark: 62.0
    },
    {
      id: 'net-margin',
      label: 'Net Margin',
      value: 24.8,
      formatted: '24.8%',
      change: 2.1,
      changeType: 'increase',
      period: 'YTD',
      target: 26.0,
      benchmark: 23.5
    },
    {
      id: 'ebitda',
      label: 'EBITDA',
      value: 8650000,
      formatted: '₹86.5L',
      change: 16.8,
      changeType: 'increase',
      period: 'YTD',
      target: 9000000,
      benchmark: 8100000
    },
    {
      id: 'roi',
      label: 'Return on Investment',
      value: 32.4,
      formatted: '32.4%',
      change: 4.6,
      changeType: 'increase',
      period: 'YTD',
      target: 35.0,
      benchmark: 28.0
    }
  ]

  // Profit Centers Analysis
  const profitCenters: ProfitCenter[] = [
    {
      id: 'luxury-furniture',
      name: 'Luxury Furniture',
      revenue: 12000000,
      costs: 7200000,
      grossProfit: 4800000,
      grossMargin: 40.0,
      netProfit: 3600000,
      netMargin: 30.0,
      roi: 45.2,
      trend: 'up',
      performance: 'excellent'
    },
    {
      id: 'hotel-furniture',
      name: 'Hotel Furniture',
      revenue: 8900000,
      costs: 4900000,
      grossProfit: 4000000,
      grossMargin: 44.9,
      netProfit: 2670000,
      netMargin: 30.0,
      roi: 38.7,
      trend: 'up',
      performance: 'excellent'
    },
    {
      id: 'office-furniture',
      name: 'Office Furniture',
      revenue: 5400000,
      costs: 3510000,
      grossProfit: 1890000,
      grossMargin: 35.0,
      netProfit: 1080000,
      netMargin: 20.0,
      roi: 28.3,
      trend: 'stable',
      performance: 'good'
    },
    {
      id: 'export-business',
      name: 'Export Business',
      revenue: 7800000,
      costs: 4680000,
      grossProfit: 3120000,
      grossMargin: 40.0,
      netProfit: 1560000,
      netMargin: 20.0,
      roi: 35.8,
      trend: 'up',
      performance: 'good'
    }
  ]

  // Cost Breakdown Analysis
  const costBreakdown: CostBreakdown[] = [
    {
      category: 'Raw Materials',
      amount: 8500000,
      percentage: 42.5,
      change: -2.3,
      controllable: true,
      optimization: ['Bulk purchasing', 'Supplier negotiations', 'Alternative materials']
    },
    {
      category: 'Labor Costs',
      amount: 4200000,
      percentage: 21.0,
      change: 3.8,
      controllable: true,
      optimization: ['Productivity training', 'Automation', 'Skill development']
    },
    {
      category: 'Manufacturing Overhead',
      amount: 2800000,
      percentage: 14.0,
      change: 1.2,
      controllable: true,
      optimization: ['Energy efficiency', 'Process optimization', 'Equipment maintenance']
    },
    {
      category: 'Sales & Marketing',
      amount: 1600000,
      percentage: 8.0,
      change: 5.2,
      controllable: true,
      optimization: ['Digital marketing', 'Customer retention', 'Sales automation']
    },
    {
      category: 'Administrative',
      amount: 1200000,
      percentage: 6.0,
      change: -1.8,
      controllable: true,
      optimization: ['Process automation', 'Paperless systems', 'Remote work']
    },
    {
      category: 'Finance & Legal',
      amount: 900000,
      percentage: 4.5,
      change: 0.5,
      controllable: false,
      optimization: ['Compliance automation', 'Legal tech', 'Financial planning']
    },
    {
      category: 'Utilities & Rent',
      amount: 800000,
      percentage: 4.0,
      change: 2.1,
      controllable: false,
      optimization: ['Energy conservation', 'Space optimization', 'Renewable energy']
    }
  ]

  // Profit Optimization Opportunities
  const profitOptimizations: ProfitOptimization[] = [
    {
      id: 'opt-1',
      type: 'cost_reduction',
      title: 'Implement AI-Driven Inventory Management',
      description: 'Reduce inventory holding costs and minimize waste through predictive analytics and automated reordering.',
      potentialSaving: 850000,
      implementation: 'short_term',
      impact: 'high',
      effort: 'medium',
      priority: 1
    },
    {
      id: 'opt-2',
      type: 'revenue_increase',
      title: 'Premium Product Line Expansion',
      description: 'Launch luxury heritage collection targeting high-net-worth customers with 40% higher margins.',
      potentialSaving: 1200000,
      implementation: 'long_term',
      impact: 'high',
      effort: 'high',
      priority: 2
    },
    {
      id: 'opt-3',
      type: 'efficiency',
      title: 'Production Line Automation',
      description: 'Automate cutting and assembly processes to reduce labor costs and increase throughput by 25%.',
      potentialSaving: 680000,
      implementation: 'long_term',
      impact: 'high',
      effort: 'high',
      priority: 3
    },
    {
      id: 'opt-4',
      type: 'pricing',
      title: 'Dynamic Pricing Strategy',
      description: 'Implement data-driven pricing based on demand, seasonality, and competitor analysis.',
      potentialSaving: 420000,
      implementation: 'short_term',
      impact: 'medium',
      effort: 'low',
      priority: 4
    },
    {
      id: 'opt-5',
      type: 'cost_reduction',
      title: 'Supplier Consolidation Program',
      description: 'Reduce supplier base from 45 to 20 vendors to achieve better pricing and payment terms.',
      potentialSaving: 340000,
      implementation: 'immediate',
      impact: 'medium',
      effort: 'medium',
      priority: 5
    }
  ]

  // Monthly Profit Trend Data
  const monthlyTrends = [
    { month: 'Jan', revenue: 2400000, costs: 1800000, profit: 600000, margin: 25.0 },
    { month: 'Feb', revenue: 2200000, costs: 1650000, profit: 550000, margin: 25.0 },
    { month: 'Mar', revenue: 2800000, costs: 2000000, profit: 800000, margin: 28.6 },
    { month: 'Apr', revenue: 2600000, costs: 1870000, profit: 730000, margin: 28.1 },
    { month: 'May', revenue: 2900000, costs: 2030000, profit: 870000, margin: 30.0 },
    { month: 'Jun', revenue: 3100000, costs: 2170000, profit: 930000, margin: 30.0 },
    { month: 'Jul', revenue: 2750000, costs: 1925000, profit: 825000, margin: 30.0 },
    { month: 'Aug', revenue: 2950000, costs: 2065000, profit: 885000, margin: 30.0 },
    { month: 'Sep', revenue: 3200000, costs: 2240000, profit: 960000, margin: 30.0 },
    { month: 'Oct', revenue: 3050000, costs: 2135000, profit: 915000, margin: 30.0 }
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`
    return `₹${num}`
  }

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent': return 'text-[var(--jewelry-success)]'
      case 'good': return 'text-[var(--jewelry-info)]'
      case 'average': return 'text-[var(--jewelry-warning)]'
      case 'poor': return 'text-[var(--jewelry-error)]'
      default: return 'text-gray-400'
    }
  }

  const getOptimizationIcon = (type: ProfitOptimization['type']) => {
    switch (type) {
      case 'cost_reduction': return Scissors
      case 'revenue_increase': return TrendingUp
      case 'efficiency': return Zap
      case 'pricing': return Calculator
      default: return Lightbulb
    }
  }

  const getOptimizationColor = (type: ProfitOptimization['type']) => {
    switch (type) {
      case 'cost_reduction': return 'text-[var(--jewelry-error)]'
      case 'revenue_increase': return 'text-[var(--jewelry-success)]'
      case 'efficiency': return 'text-[var(--jewelry-gold-500)]'
      case 'pricing': return 'text-[var(--jewelry-info)]'
      default: return 'text-gray-400'
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

  return (
    <div className="min-h-screen relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--jewelry-blue-500)] to-[var(--jewelry-blue-700)] flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-[var(--jewelry-gold-400)]" />
              </div>
              Profit Analysis
            </h1>
            <p className="text-gray-300 mt-2">
              Comprehensive profitability insights and optimization strategies
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 rounded-md border bg-black/20 border-gray-600 text-white focus:border-[var(--jewelry-gold-500)]"
              >
                <option value="mtd">Month to Date</option>
                <option value="qtd">Quarter to Date</option>
                <option value="ytd">Year to Date</option>
                <option value="ly">Last Year</option>
              </select>
            </div>
            <Button 
              variant="outline" 
              className="gap-2 text-white border-gray-400 hover:border-white hover:text-white"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              <span className="text-white">Refresh</span>
            </Button>
            <Button variant="outline" className="gap-2 text-white border-gray-400 hover:border-white hover:text-white">
              <Download className="h-4 w-4" />
              <span className="text-white">Export Report</span>
            </Button>
            <Button className="gap-2 bg-[var(--jewelry-gold-500)] text-black hover:bg-[var(--jewelry-gold-600)] border-0">
              <Target className="h-4 w-4" />
              <span className="text-black font-medium">Profit Goals</span>
            </Button>
          </div>
        </div>

        {/* Profit Status Bar */}
        <div className="jewelry-glass-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[var(--jewelry-gold-500)]" />
              <span className="text-white font-medium">Profit Performance Dashboard</span>
              <div className="w-2 h-2 bg-[var(--jewelry-success)] rounded-full animate-pulse"></div>
              <span className="text-gray-400 text-sm">Status: Profitable</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-400">Profit Target Progress</p>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-700 rounded-full">
                    <div className="w-16 h-2 bg-[var(--jewelry-gold-500)] rounded-full"></div>
                  </div>
                  <span className="text-white font-semibold">80%</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Margin Health</p>
                <p className="font-semibold text-[var(--jewelry-success)]">Excellent</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">ROI Performance</p>
                <p className="font-semibold text-[var(--jewelry-gold-500)]">Above Benchmark</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Last Updated</p>
              <p className="text-sm text-white">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>

        {/* Key Profit Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profitMetrics.map((metric) => (
            <div key={metric.id} className="jewelry-glass-card p-6 hover:scale-105 transition-transform">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-400">{metric.label}</p>
                  <p className="text-2xl font-bold text-white">{metric.formatted}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg bg-black/20 flex items-center justify-center`}>
                  <DollarSign className="h-6 w-6 text-[var(--jewelry-gold-500)]" />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {metric.changeType === 'increase' ? (
                    <ArrowUp className="h-4 w-4 text-[var(--jewelry-success)]" />
                  ) : metric.changeType === 'decrease' ? (
                    <ArrowDown className="h-4 w-4 text-[var(--jewelry-error)]" />
                  ) : (
                    <div className="h-4 w-4" />
                  )}
                  <span className={`text-sm font-medium ${
                    metric.changeType === 'increase' ? 'text-[var(--jewelry-success)]' : 
                    metric.changeType === 'decrease' ? 'text-[var(--jewelry-error)]' : 
                    'text-gray-400'
                  }`}>
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </span>
                  <span className="text-xs text-gray-400">vs last {metric.period.toLowerCase()}</span>
                </div>
                
                {metric.target && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Target Progress</span>
                      <span className="text-white">{((metric.value / metric.target) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-[var(--jewelry-gold-500)] h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Profit Analysis Tabs */}
        <Tabs defaultValue="centers" className="space-y-6">
          <TabsList className="bg-black/20 border border-gray-600">
            <TabsTrigger value="centers" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Profit Centers
            </TabsTrigger>
            <TabsTrigger value="costs" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Cost Analysis
            </TabsTrigger>
            <TabsTrigger value="trends" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Profit Trends
            </TabsTrigger>
            <TabsTrigger value="optimization" className="text-white data-[state=active]:bg-[var(--jewelry-gold-500)] data-[state=active]:text-black">
              Optimization
            </TabsTrigger>
          </TabsList>

          <TabsContent value="centers" className="space-y-6">
            {/* Profit Centers Analysis */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Building2 className="h-6 w-6 text-[var(--jewelry-blue-500)]" />
                  <h3 className="text-xl font-semibold text-white">Profit Center Performance</h3>
                </div>
                <Button variant="outline" className="gap-2 text-white border-gray-400 hover:border-white hover:text-white">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-white">Detailed View</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {profitCenters.map((center) => (
                  <div key={center.id} className="bg-black/20 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-white">{center.name}</h4>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs border ${
                          center.performance === 'excellent' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                          center.performance === 'good' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                          center.performance === 'average' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                          'bg-red-500/20 text-red-300 border-red-500/30'
                        }`}>
                          {center.performance}
                        </Badge>
                        {center.trend === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-[var(--jewelry-success)]" />
                        ) : center.trend === 'down' ? (
                          <TrendingDown className="h-4 w-4 text-[var(--jewelry-error)]" />
                        ) : (
                          <div className="h-4 w-4" />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-sm">Revenue</p>
                        <p className="text-white font-semibold">{formatNumber(center.revenue)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Net Profit</p>
                        <p className="text-[var(--jewelry-gold-500)] font-semibold">{formatNumber(center.netProfit)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Gross Margin</p>
                        <p className="text-white font-semibold">{center.grossMargin}%</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">ROI</p>
                        <p className="text-[var(--jewelry-success)] font-semibold">{center.roi}%</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-400 text-sm">Profit Margin</span>
                          <span className="text-white text-sm">{center.netMargin}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-[var(--jewelry-gold-500)] h-2 rounded-full transition-all"
                            style={{ width: `${center.netMargin}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="costs" className="space-y-6">
            {/* Cost Breakdown Analysis */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <PieChart className="h-6 w-6 text-[var(--jewelry-gold-500)]" />
                  <h3 className="text-xl font-semibold text-white">Cost Structure Analysis</h3>
                </div>
                <Button variant="outline" className="gap-2 text-white border-gray-400 hover:border-white hover:text-white">
                  <Scissors className="h-4 w-4" />
                  <span className="text-white">Cost Optimization</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {costBreakdown.map((cost, index) => (
                    <div key={index} className="bg-black/20 rounded-lg p-4 border border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-white">{cost.category}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--jewelry-gold-500)] font-semibold">{cost.percentage}%</span>
                          <Badge className={`text-xs ${cost.controllable ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>
                            {cost.controllable ? 'Controllable' : 'Fixed'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white font-medium">{formatNumber(cost.amount)}</span>
                        <span className={`text-sm font-medium ${
                          cost.change > 0 ? 'text-[var(--jewelry-error)]' : 
                          cost.change < 0 ? 'text-[var(--jewelry-success)]' : 
                          'text-gray-400'
                        }`}>
                          {cost.change > 0 ? '+' : ''}{cost.change}%
                        </span>
                      </div>

                      <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                        <div
                          className="bg-[var(--jewelry-gold-500)] h-2 rounded-full transition-all"
                          style={{ width: `${cost.percentage}%` }}
                        ></div>
                      </div>

                      <div>
                        <p className="text-gray-400 text-sm mb-1">Optimization Ideas</p>
                        <div className="space-y-1">
                          {cost.optimization.slice(0, 2).map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <Lightbulb className="h-3 w-3 text-[var(--jewelry-gold-500)]" />
                              <span className="text-gray-300 text-xs">{opt}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-black/20 rounded-lg p-4 border border-gray-600">
                  <h4 className="font-semibold text-white mb-4">Cost Distribution</h4>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="w-48 h-48 mx-auto mb-4 relative">
                        {/* Simplified pie chart representation */}
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-[var(--jewelry-gold-500)] via-[var(--jewelry-blue-500)] to-[var(--jewelry-gold-500)]"></div>
                        <div className="absolute inset-4 bg-black/90 rounded-full flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-white">₹2.0Cr</p>
                            <p className="text-gray-400 text-sm">Total Costs</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Controllable Costs</span>
                        <span className="text-[var(--jewelry-success)] font-semibold">82.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Fixed Costs</span>
                        <span className="text-[var(--jewelry-warning)] font-semibold">17.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Cost Reduction Potential</span>
                        <span className="text-[var(--jewelry-gold-500)] font-semibold">₹24L</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            {/* Profit Trends */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <LineChart className="h-6 w-6 text-[var(--jewelry-blue-500)]" />
                  <h3 className="text-xl font-semibold text-white">Profit Trend Analysis</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="text-white border-gray-400 hover:border-white hover:text-white">
                    <Calendar className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-white border-gray-400 hover:border-white hover:text-white">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-black/20 rounded-lg p-4 border border-gray-600">
                  <h4 className="font-semibold text-white mb-4">Monthly Profit Performance</h4>
                  <div className="h-64 flex items-end justify-between gap-2">
                    {monthlyTrends.map((month, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div className="relative w-full">
                          <div 
                            className="w-full bg-[var(--jewelry-gold-500)] rounded-t transition-all hover:bg-[var(--jewelry-gold-400)]"
                            style={{ height: `${(month.profit / 1000000) * 40}px` }}
                          ></div>
                        </div>
                        <div className="mt-2 text-center">
                          <p className="text-xs text-gray-400">{month.month}</p>
                          <p className="text-xs text-white font-medium">{formatNumber(month.profit)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-black/20 rounded-lg p-4 border border-gray-600">
                    <h5 className="font-semibold text-white mb-3">Trend Insights</h5>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-[var(--jewelry-success)]" />
                        <div>
                          <p className="text-sm text-white">Consistent Growth</p>
                          <p className="text-xs text-gray-400">22% YoY increase</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-[var(--jewelry-gold-500)]" />
                        <div>
                          <p className="text-sm text-white">Target Achievement</p>
                          <p className="text-xs text-gray-400">96% of annual goal</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-[var(--jewelry-blue-500)]" />
                        <div>
                          <p className="text-sm text-white">Best Month</p>
                          <p className="text-xs text-gray-400">September - ₹96L</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-black/20 rounded-lg p-4 border border-gray-600">
                    <h5 className="font-semibold text-white mb-3">Forecasted Trend</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Q4 Projection</span>
                        <span className="text-[var(--jewelry-success)] font-semibold">₹2.8Cr</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Growth Rate</span>
                        <span className="text-[var(--jewelry-gold-500)] font-semibold">+15%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Confidence</span>
                        <span className="text-white font-semibold">87%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="optimization" className="space-y-6">
            {/* Profit Optimization */}
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Rocket className="h-6 w-6 text-[var(--jewelry-gold-500)]" />
                  <h3 className="text-xl font-semibold text-white">Profit Optimization Opportunities</h3>
                </div>
                <Button className="gap-2 bg-[var(--jewelry-gold-500)] text-black hover:bg-[var(--jewelry-gold-600)] border-0">
                  <Zap className="h-4 w-4" />
                  <span className="text-black font-medium">Implement All</span>
                </Button>
              </div>

              <div className="space-y-4">
                {profitOptimizations.map((optimization) => {
                  const OptIcon = getOptimizationIcon(optimization.type)
                  return (
                    <div key={optimization.id} className="bg-black/20 rounded-lg p-6 border border-gray-600 hover:border-[var(--jewelry-gold-500)]/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-lg bg-black/30 flex items-center justify-center`}>
                          <OptIcon className={`h-6 w-6 ${getOptimizationColor(optimization.type)}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-white text-lg">{optimization.title}</h4>
                            <div className="flex items-center gap-2">
                              <Badge className={`text-xs border ${getImpactColor(optimization.impact)}`}>
                                {optimization.impact} impact
                              </Badge>
                              <span className="text-lg font-bold text-[var(--jewelry-gold-500)]">
                                +{formatNumber(optimization.potentialSaving)}
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-300 mb-4">{optimization.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                              <div className="text-center">
                                <p className="text-xs text-gray-400">Implementation</p>
                                <Badge variant="secondary" className="bg-gray-700 text-gray-200">
                                  {optimization.implementation.replace('_', ' ')}
                                </Badge>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-400">Effort Required</p>
                                <Badge variant="secondary" className="bg-gray-700 text-gray-200">
                                  {optimization.effort}
                                </Badge>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-400">Priority</p>
                                <span className="text-[var(--jewelry-gold-500)] font-bold">#{optimization.priority}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="text-white border-gray-400 hover:border-white hover:text-white">
                                <Eye className="h-3 w-3 mr-1" />
                                <span className="text-white">Analyze</span>
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

        {/* Profit Summary Footer */}
        <div className="jewelry-glass-card p-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Crown className="h-8 w-8 text-[var(--jewelry-gold-500)]" />
              <h3 className="text-2xl font-bold text-white">Profit Performance Summary</h3>
            </div>
            <p className="text-gray-400">Enterprise-grade profitability analysis and strategic insights</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--jewelry-gold-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-8 w-8 text-[var(--jewelry-gold-500)]" />
              </div>
              <p className="text-2xl font-bold text-white">₹69.4L</p>
              <p className="text-gray-400">Net Profit YTD</p>
              <p className="text-[var(--jewelry-success)] text-sm">+18.7% growth</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--jewelry-blue-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Percent className="h-8 w-8 text-[var(--jewelry-blue-500)]" />
              </div>
              <p className="text-2xl font-bold text-white">24.8%</p>
              <p className="text-gray-400">Net Margin</p>
              <p className="text-[var(--jewelry-success)] text-sm">Above industry</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--jewelry-gold-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="h-8 w-8 text-[var(--jewelry-gold-500)]" />
              </div>
              <p className="text-2xl font-bold text-white">32.4%</p>
              <p className="text-gray-400">ROI</p>
              <p className="text-[var(--jewelry-success)] text-sm">Excellent returns</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--jewelry-blue-500)]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Rocket className="h-8 w-8 text-[var(--jewelry-blue-500)]" />
              </div>
              <p className="text-2xl font-bold text-white">₹34L</p>
              <p className="text-gray-400">Optimization Potential</p>
              <p className="text-[var(--jewelry-gold-500)] text-sm">5 opportunities</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(ProfitAnalysisPage)