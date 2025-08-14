'use client'

import React, { useState, useEffect } from 'react'
// import { useAuth } from '@/components/auth/HERAAuthProvider' // Auth removed
import { PWMProgressiveSidebar } from '@/components/pwm-progressive/PWMProgressiveSidebar'
import { ProgressivePortfolioAnalytics } from '@/components/pwm-progressive/ProgressivePortfolioAnalytics'
import { ProgressiveClientManagement } from '@/components/pwm-progressive/ProgressiveClientManagement'
import { UniversalTourProvider, TourElement } from '@/components/tours/SimpleTourProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  // Shield, // Removed - was only used for auth
  Crown, 
  Target,
  PieChart,
  BarChart3,
  Activity,
  Users,
  Globe,
  Briefcase,
  Wallet,
  CreditCard,
  Building,
  Award,
  Sparkles,
  Brain,
  Zap,
  Lock,
  Eye,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Settings,
  Plus,
  Filter,
  Search,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react'

// Progressive PWM Sample Data - Ultra-High Net Worth Focus
const samplePWMData = {
  clients: [
    {
      id: 'CLIENT001',
      name: 'Harrison Technology Fund',
      type: 'Family Office',
      status: 'ultra_high_net_worth',
      aum: 1250000000, // $1.25B
      tier: 'Private Wealth',
      relationship_manager: 'Alexandra Sterling',
      inception_date: '2019-03-15',
      risk_profile: 'Moderate Aggressive',
      performance_ytd: 12.8,
      performance_3yr: 18.4,
      last_review: '2024-07-22',
      next_review: '2024-10-22',
      satisfaction_score: 9.6
    },
    {
      id: 'CLIENT002', 
      name: 'The Morrison Family Trust',
      type: 'Multi-Generation Trust',
      status: 'high_net_worth',
      aum: 485000000, // $485M
      tier: 'Premier',
      relationship_manager: 'Michael Chen',
      inception_date: '2016-11-08',
      risk_profile: 'Conservative Growth',
      performance_ytd: 8.9,
      performance_3yr: 14.2,
      last_review: '2024-08-01',
      next_review: '2024-11-01',
      satisfaction_score: 9.1
    },
    {
      id: 'CLIENT003',
      name: 'Steinberg Holdings LLC',
      type: 'Corporate Treasury',
      status: 'institutional',
      aum: 2100000000, // $2.1B
      tier: 'Institutional',
      relationship_manager: 'Sarah Williams',
      inception_date: '2018-01-22',
      risk_profile: 'Balanced',
      performance_ytd: 10.4,
      performance_3yr: 16.7,
      last_review: '2024-07-30',
      next_review: '2024-10-30',
      satisfaction_score: 9.8
    }
  ],
  portfolioSummary: {
    total_aum: 3835000000, // $3.835B
    client_count: 3,
    avg_account_size: 1278333333,
    ytd_performance: 11.2,
    ytd_benchmark: 9.8,
    alpha_generation: 1.4,
    sharpe_ratio: 1.73,
    max_drawdown: -3.2,
    active_positions: 287,
    cash_allocation: 5.8,
    equity_allocation: 62.4,
    fixed_income: 24.1,
    alternatives: 7.7
  },
  marketIntelligence: [
    {
      type: 'opportunity',
      title: 'Emerging Markets Recovery Play',
      description: 'Technical indicators suggest EM equities bottomed, potential 15-20% upside',
      confidence: 78,
      time_horizon: '6-12 months',
      risk_level: 'medium',
      estimated_return: '18.5%',
      category: 'Geographic Allocation'
    },
    {
      type: 'risk',
      title: 'Duration Risk in Fixed Income',
      description: 'Rising rate environment poses challenges to long-duration bonds',
      confidence: 85,
      time_horizon: '3-6 months',
      risk_level: 'high',
      estimated_impact: '-8.2%',
      category: 'Interest Rate Risk'
    },
    {
      type: 'opportunity',
      title: 'AI Technology Secular Growth',
      description: 'Cloud infrastructure and AI chips showing sustained momentum',
      confidence: 92,
      time_horizon: '12-24 months',
      risk_level: 'medium_high',
      estimated_return: '35.2%',
      category: 'Thematic Investment'
    }
  ],
  recentTransactions: [
    {
      date: '2024-08-08',
      client: 'Harrison Technology Fund',
      type: 'Purchase',
      security: 'NVIDIA Corporation',
      quantity: 25000,
      price: 108.75,
      value: 2718750,
      status: 'Settled'
    },
    {
      date: '2024-08-07',
      client: 'Steinberg Holdings LLC',
      type: 'Sale',
      security: 'US Treasury 10yr Bond',
      quantity: 50000000,
      price: 98.25,
      value: 49125000,
      status: 'Settled'
    },
    {
      date: '2024-08-06',
      client: 'The Morrison Family Trust',
      type: 'Dividend',
      security: 'Microsoft Corporation',
      quantity: 0,
      price: 0,
      value: 1250000,
      status: 'Credited'
    }
  ]
}

export default function PWMProgressivePage() {
  // Authentication removed - Progressive auth allows anonymous access
  // const { user, isAuthenticated, isLoading } = useAuth()
  const [activeView, setActiveView] = useState('dashboard')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState<string | null>(null)

  // No loading check needed without auth
  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen bg-slate-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
  //         <p className="text-slate-600">Loading PWM Progressive...</p>
  //       </div>
  //     </div>
  //   )
  // }

  // Authentication check removed - open access
  // if (!isAuthenticated) {
  //   return (
  //     <div className="min-h-screen bg-slate-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <Shield className="h-12 w-12 text-slate-400 mx-auto mb-4" />
  //         <p className="text-slate-600">Please authenticate to access Private Wealth Management</p>
  //       </div>
  //     </div>
  //   )
  // }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) {
      return `$${(amount / 1000000000).toFixed(2)}B`
    } else if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`
    }
    return `$${amount.toFixed(2)}`
  }

  const getPerformanceColor = (performance: number) => {
    if (performance > 10) return 'text-emerald-600'
    if (performance > 5) return 'text-blue-600'
    if (performance > 0) return 'text-amber-600'
    return 'text-red-600'
  }

  const getPerformanceIcon = (performance: number) => {
    return performance > 0 ? TrendingUp : TrendingDown
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <TourElement step={1} title="Total Assets Under Management" description="View total AUM across all clients">
          <Card className="hera-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total AUM</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {formatCurrency(samplePWMData.portfolioSummary.total_aum)}
                  </p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="h-4 w-4 text-emerald-600 mr-1" />
                    <span className="text-sm text-emerald-600">+{samplePWMData.portfolioSummary.ytd_performance}% YTD</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TourElement>

        <TourElement step={2} title="Alpha Generation" description="Track performance vs benchmark">
          <Card className="hera-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Alpha Generation</p>
                  <p className="text-3xl font-bold text-emerald-600">
                    +{samplePWMData.portfolioSummary.alpha_generation}%
                  </p>
                  <p className="text-sm text-slate-500">vs Benchmark</p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-full">
                  <Target className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TourElement>

        <TourElement step={3} title="Risk Metrics" description="Monitor portfolio risk with Sharpe ratio">
          <Card className="hera-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Sharpe Ratio</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {samplePWMData.portfolioSummary.sharpe_ratio}
                  </p>
                  <p className="text-sm text-slate-500">Risk-Adjusted Return</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TourElement>

        <TourElement step={4} title="Client Portfolio" description="Manage your high-net-worth clients">
          <Card className="hera-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Clients</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {samplePWMData.portfolioSummary.client_count}
                  </p>
                  <p className="text-sm text-slate-500">
                    Avg: {formatCurrency(samplePWMData.portfolioSummary.avg_account_size)}
                  </p>
                </div>
                <div className="p-3 bg-amber-100 rounded-full">
                  <Users className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TourElement>
      </div>

      {/* Client Portfolio */}
      <TourElement step={5} title="Client Management" description="Detailed view of your private wealth clients">
        <Card className="hera-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Crown className="h-5 w-5 text-amber-500 mr-2" />
                Private Wealth Clients
              </CardTitle>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Client
                </Button>
                <Button size="sm" variant="outline">
                  <Filter className="h-4 w-4 mr-1" />
                  Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {samplePWMData.clients.map((client) => {
                const PerformanceIcon = getPerformanceIcon(client.performance_ytd)
                return (
                  <div key={client.id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="font-semibold text-slate-900">{client.name}</h3>
                          <Badge variant="outline" className="ml-2">
                            {client.tier}
                          </Badge>
                          {client.status === 'ultra_high_net_worth' && (
                            <Crown className="h-4 w-4 text-amber-500 ml-2" />
                          )}
                        </div>
                        <div className="flex items-center mt-1 space-x-4 text-sm text-slate-600">
                          <span>AUM: {formatCurrency(client.aum)}</span>
                          <span>RM: {client.relationship_manager}</span>
                          <span>Next Review: {client.next_review}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`flex items-center ${getPerformanceColor(client.performance_ytd)}`}>
                          <PerformanceIcon className="h-4 w-4 mr-1" />
                          <span className="font-semibold">+{client.performance_ytd}%</span>
                        </div>
                        <p className="text-xs text-slate-500">YTD Performance</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </TourElement>

      {/* Market Intelligence Feed */}
      <TourElement step={6} title="AI Market Intelligence" description="Real-time market insights and opportunities">
        <Card className="hera-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="h-5 w-5 text-blue-500 mr-2" />
              AI Market Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {samplePWMData.marketIntelligence.map((insight, index) => (
                <div key={index} className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <Badge variant={insight.type === 'opportunity' ? 'default' : 'destructive'}>
                          {insight.type === 'opportunity' ? 'Opportunity' : 'Risk Alert'}
                        </Badge>
                        <span className="ml-2 text-sm text-slate-600">Confidence: {insight.confidence}%</span>
                      </div>
                      <h4 className="font-semibold text-slate-900 mt-2">{insight.title}</h4>
                      <p className="text-sm text-slate-600 mt-1">{insight.description}</p>
                      <div className="flex items-center mt-2 space-x-4 text-sm">
                        <span className="text-slate-500">Horizon: {insight.time_horizon}</span>
                        <span className="text-slate-500">Category: {insight.category}</span>
                        {insight.estimated_return && (
                          <span className="text-emerald-600 font-medium">
                            Est. Return: {insight.estimated_return}
                          </span>
                        )}
                      </div>
                    </div>
                    <Sparkles className="h-5 w-5 text-blue-500 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TourElement>
    </div>
  )

  return (
    <UniversalTourProvider>
      <div className="flex h-screen bg-slate-50">
        {/* Progressive Sidebar */}
        <PWMProgressiveSidebar 
          activeModule={activeView}
          onModuleChange={setActiveView}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-slate-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                  <Crown className="h-6 w-6 text-blue-600 mr-2" />
                  Private Wealth Management Progressive
                </h1>
                <p className="text-slate-600 mt-1">
                  Ultra-High Net Worth Client Management Platform
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search clients, positions..."
                    className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-1" />
                  New Position
                </Button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-6">
            {activeView === 'dashboard' && renderDashboard()}
            {activeView === 'clients' && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Crown className="h-5 w-5 text-amber-500 mr-2" />
                  Client Management
                </h2>
                <ProgressiveClientManagement organizationId={user?.organization_id || 'demo-org'} />
              </div>
            )}
            {activeView === 'portfolio' && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <PieChart className="h-5 w-5 text-blue-500 mr-2" />
                  Portfolio Analytics
                </h2>
                <ProgressivePortfolioAnalytics organizationId={user?.organization_id || 'demo-org'} />
              </div>
            )}
            {activeView === 'performance' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Performance Reports</h2>
                <p className="text-slate-600">Performance reporting suite coming soon...</p>
              </div>
            )}
            {activeView === 'compliance' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Compliance & Risk</h2>
                <p className="text-slate-600">Compliance monitoring tools coming soon...</p>
              </div>
            )}
            {activeView === 'analytics' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Advanced Analytics</h2>
                <p className="text-slate-600">AI-powered analytics suite coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </UniversalTourProvider>
  )
}