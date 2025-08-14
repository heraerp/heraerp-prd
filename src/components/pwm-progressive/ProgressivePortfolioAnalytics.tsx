'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  PieChart,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  DollarSign,
  Percent,
  Globe,
  Building,
  Zap,
  Eye,
  Download,
  RefreshCw,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Star,
  Award
} from 'lucide-react'

interface ProgressivePortfolioAnalyticsProps {
  organizationId: string
}

// Advanced Portfolio Analytics Data
const portfolioAnalyticsData = {
  assetAllocation: [
    { category: 'Equities', allocation: 62.4, target: 65.0, performance: 14.2, color: 'bg-blue-500' },
    { category: 'Fixed Income', allocation: 24.1, target: 25.0, performance: 4.8, color: 'bg-emerald-500' },
    { category: 'Alternatives', allocation: 7.7, target: 5.0, performance: 18.9, color: 'bg-purple-500' },
    { category: 'Cash & Equivalents', allocation: 5.8, target: 5.0, performance: 2.1, color: 'bg-amber-500' }
  ],
  geographicAllocation: [
    { region: 'North America', allocation: 45.2, performance: 12.8, risk_score: 'Low' },
    { region: 'Europe', allocation: 28.4, performance: 9.1, risk_score: 'Medium' },
    { region: 'Asia Pacific', allocation: 18.9, performance: 15.7, risk_score: 'Medium-High' },
    { region: 'Emerging Markets', allocation: 7.5, performance: 22.3, risk_score: 'High' }
  ],
  sectorAllocation: [
    { sector: 'Technology', allocation: 18.5, performance: 28.4 },
    { sector: 'Healthcare', allocation: 12.3, performance: 11.2 },
    { sector: 'Financial Services', allocation: 11.8, performance: 8.7 },
    { sector: 'Consumer Discretionary', allocation: 9.4, performance: 15.6 },
    { sector: 'Real Estate', allocation: 8.2, performance: 5.9 },
    { sector: 'Energy', allocation: 6.7, performance: 31.2 },
    { sector: 'Other', allocation: 33.1, performance: 7.8 }
  ],
  riskMetrics: {
    var_95: -2.1,
    var_99: -3.8,
    sharpe_ratio: 1.73,
    sortino_ratio: 2.41,
    max_drawdown: -3.2,
    beta: 0.89,
    alpha: 1.4,
    tracking_error: 2.8,
    information_ratio: 0.5
  },
  topPositions: [
    { name: 'Microsoft Corporation', ticker: 'MSFT', allocation: 3.2, value: 122750000, performance: 24.6 },
    { name: 'Apple Inc.', ticker: 'AAPL', allocation: 2.8, value: 107380000, performance: 18.9 },
    { name: 'Amazon.com Inc.', ticker: 'AMZN', allocation: 2.5, value: 95875000, performance: 32.1 },
    { name: 'NVIDIA Corporation', ticker: 'NVDA', allocation: 2.3, value: 88205000, performance: 156.7 },
    { name: 'Alphabet Inc.', ticker: 'GOOGL', allocation: 2.1, value: 80535000, performance: 22.8 }
  ]
}

export function ProgressivePortfolioAnalytics({ organizationId }: ProgressivePortfolioAnalyticsProps) {
  const [activeView, setActiveView] = useState('allocation')
  
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    }
    return `$${amount.toLocaleString()}`
  }

  const getPerformanceColor = (performance: number) => {
    if (performance > 15) return 'text-emerald-600'
    if (performance > 10) return 'text-blue-600'
    if (performance > 0) return 'text-amber-600'
    return 'text-red-600'
  }

  const getRiskColor = (riskScore: string) => {
    switch (riskScore) {
      case 'Low': return 'text-emerald-600 bg-emerald-50'
      case 'Medium': return 'text-amber-600 bg-amber-50'
      case 'Medium-High': return 'text-orange-600 bg-orange-50'
      case 'High': return 'text-red-600 bg-red-50'
      default: return 'text-slate-600 bg-slate-50'
    }
  }

  const renderAssetAllocation = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hera-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 text-blue-500 mr-2" />
              Asset Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {portfolioAnalyticsData.assetAllocation.map((asset, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-900">{asset.category}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-600">{asset.allocation}%</span>
                      <Badge variant="outline" className="text-xs">
                        Target: {asset.target}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${asset.color}`}
                        style={{ width: `${(asset.allocation / 70) * 100}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm font-medium ${getPerformanceColor(asset.performance)}`}>
                      +{asset.performance}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="hera-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-5 w-5 text-purple-500 mr-2" />
              Geographic Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {portfolioAnalyticsData.geographicAllocation.map((region, index) => (
                <div key={index} className="p-3 border border-slate-200 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-slate-900">{region.region}</span>
                    <Badge className={getRiskColor(region.risk_score)}>
                      {region.risk_score}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">{region.allocation}% allocation</span>
                    <span className={`text-sm font-medium ${getPerformanceColor(region.performance)}`}>
                      +{region.performance}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="hera-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 text-emerald-500 mr-2" />
            Sector Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolioAnalyticsData.sectorAllocation.map((sector, index) => (
              <div key={index} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-slate-900">{sector.sector}</span>
                  <span className={`text-sm font-medium ${getPerformanceColor(sector.performance)}`}>
                    +{sector.performance}%
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="flex-1 bg-slate-200 rounded-full h-2 mr-3">
                    <div 
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${(sector.allocation / 35) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-slate-600">{sector.allocation}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderRiskMetrics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hera-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Sharpe Ratio</p>
                <p className="text-3xl font-bold text-blue-600">
                  {portfolioAnalyticsData.riskMetrics.sharpe_ratio}
                </p>
                <p className="text-sm text-slate-500">Risk-Adjusted Return</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hera-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Alpha Generation</p>
                <p className="text-3xl font-bold text-emerald-600">
                  +{portfolioAnalyticsData.riskMetrics.alpha}%
                </p>
                <p className="text-sm text-slate-500">vs Benchmark</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <Award className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hera-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Max Drawdown</p>
                <p className="text-3xl font-bold text-slate-600">
                  {portfolioAnalyticsData.riskMetrics.max_drawdown}%
                </p>
                <p className="text-sm text-slate-500">Risk Measure</p>
              </div>
              <div className="p-3 bg-slate-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="hera-card">
        <CardHeader>
          <CardTitle>Advanced Risk Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{portfolioAnalyticsData.riskMetrics.var_95}%</p>
              <p className="text-sm text-slate-600">VaR (95%)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{portfolioAnalyticsData.riskMetrics.beta}</p>
              <p className="text-sm text-slate-600">Beta</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{portfolioAnalyticsData.riskMetrics.tracking_error}%</p>
              <p className="text-sm text-slate-600">Tracking Error</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{portfolioAnalyticsData.riskMetrics.information_ratio}</p>
              <p className="text-sm text-slate-600">Information Ratio</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderTopPositions = () => (
    <Card className="hera-card">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Star className="h-5 w-5 text-amber-500 mr-2" />
          Top Holdings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {portfolioAnalyticsData.topPositions.map((position, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">{position.name}</h4>
                  <p className="text-sm text-slate-600">{position.ticker}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">{formatCurrency(position.value)}</p>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-600">{position.allocation}%</span>
                  <span className={`text-sm font-medium ${getPerformanceColor(position.performance)}`}>
                    +{position.performance}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* View Selector */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <Button 
            variant={activeView === 'allocation' ? 'default' : 'outline'}
            onClick={() => setActiveView('allocation')}
          >
            Asset Allocation
          </Button>
          <Button 
            variant={activeView === 'risk' ? 'default' : 'outline'}
            onClick={() => setActiveView('risk')}
          >
            Risk Analysis
          </Button>
          <Button 
            variant={activeView === 'positions' ? 'default' : 'outline'}
            onClick={() => setActiveView('positions')}
          >
            Top Positions
          </Button>
        </div>
        
        <div className="flex space-x-2">
          <Button size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button size="sm" variant="outline">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Content */}
      {activeView === 'allocation' && renderAssetAllocation()}
      {activeView === 'risk' && renderRiskMetrics()}
      {activeView === 'positions' && renderTopPositions()}
    </div>
  )
}