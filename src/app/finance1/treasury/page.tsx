'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { SapNavbar } from '@/components/sap/SapNavbar'
import { 
  Landmark, Plus, Search, Filter, Download, Upload, ArrowLeft,
  RefreshCw, Settings, Eye, Edit, MoreHorizontal, TrendingUp,
  TrendingDown, Target, AlertTriangle, CheckCircle, Calculator,
  BarChart3, PieChart, Clock, DollarSign, Calendar, 
  Star, Package, Factory, ArrowRight, FileText,
  ChevronDown, ChevronRight, Maximize2, CircleDollarSign,
  Percent, CalendarDays, UserCheck, ClipboardList, Banknote,
  Building2, Users, Activity, MapPin, Award, Database,
  Layers, Zap, Grid, Table, Monitor, Briefcase, Shield,
  Globe, CreditCard, Wallet, ArrowUpDown, TrendingUpDown
} from 'lucide-react'

interface TreasuryPosition {
  id: string
  position_type: 'cash' | 'fx' | 'investment' | 'derivative'
  currency: string
  position_amount: number
  market_value: number
  unrealized_pnl: number
  maturity_date?: string
  counterparty?: string
  risk_rating: 'low' | 'medium' | 'high' | 'critical'
  portfolio: string
  trader: string
  created_at: string
  updated_at: string
}

interface CashPosition {
  id: string
  currency: string
  account_number: string
  bank_name: string
  account_type: 'checking' | 'savings' | 'money_market' | 'time_deposit'
  balance: number
  available_balance: number
  interest_rate: number
  maturity_date?: string
  status: 'active' | 'closed' | 'restricted'
  last_updated: string
}

interface FXTransaction {
  id: string
  transaction_type: 'spot' | 'forward' | 'swap' | 'option'
  base_currency: string
  quote_currency: string
  base_amount: number
  quote_amount: number
  exchange_rate: number
  value_date: string
  settlement_date: string
  counterparty: string
  trader: string
  status: 'pending' | 'confirmed' | 'settled' | 'cancelled'
  pnl: number
  created_at: string
}

interface Investment {
  id: string
  investment_type: 'bond' | 'equity' | 'fund' | 'commodity' | 'derivative'
  security_name: string
  isin: string
  quantity: number
  unit_price: number
  market_value: number
  cost_basis: number
  unrealized_pnl: number
  yield_rate: number
  maturity_date?: string
  rating?: string
  portfolio: string
  custodian: string
  purchase_date: string
  status: 'active' | 'matured' | 'sold'
}

interface LiquidityForecast {
  id: string
  forecast_date: string
  currency: string
  opening_balance: number
  projected_inflows: number
  projected_outflows: number
  net_position: number
  minimum_balance: number
  excess_liquidity: number
  funding_requirement: number
  confidence_level: number
}

interface RiskMetrics {
  total_exposure: number
  var_1_day: number
  var_10_day: number
  credit_exposure: number
  fx_exposure: number
  interest_rate_risk: number
  liquidity_ratio: number
  concentration_risk: number
}

interface TreasuryMetrics {
  total_cash_position: number
  total_investments: number
  total_fx_exposure: number
  daily_pnl: number
  ytd_pnl: number
  active_positions: number
  maturity_next_30_days: number
  liquidity_buffer: number
}

// Treasury Management (FI-TR) Module
export default function TreasuryPage() {
  const { user, organization, isAuthenticated, contextLoading } = useHERAAuth()
  const [loading, setLoading] = useState(true)
  const [treasuryPositions, setTreasuryPositions] = useState<TreasuryPosition[]>([])
  const [cashPositions, setCashPositions] = useState<CashPosition[]>([])
  const [fxTransactions, setFxTransactions] = useState<FXTransaction[]>([])
  const [investments, setInvestments] = useState<Investment[]>([])
  const [liquidityForecast, setLiquidityForecast] = useState<LiquidityForecast[]>([])
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null)
  const [metrics, setMetrics] = useState<TreasuryMetrics | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'cash' | 'fx' | 'investments' | 'liquidity' | 'risk' | 'reports' | 'analytics'>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [currencyFilter, setCurrencyFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedPosition, setSelectedPosition] = useState<TreasuryPosition | null>(null)

  // Mock data for demonstration
  useEffect(() => {
    const loadTreasuryData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const mockMetrics: TreasuryMetrics = {
        total_cash_position: 125750000,
        total_investments: 78950000,
        total_fx_exposure: 45620000,
        daily_pnl: 185000,
        ytd_pnl: 12450000,
        active_positions: 247,
        maturity_next_30_days: 18750000,
        liquidity_buffer: 25680000
      }

      const mockRiskMetrics: RiskMetrics = {
        total_exposure: 250320000,
        var_1_day: 1250000,
        var_10_day: 3950000,
        credit_exposure: 45680000,
        fx_exposure: 38750000,
        interest_rate_risk: 2850000,
        liquidity_ratio: 1.45,
        concentration_risk: 15.8
      }

      const mockCashPositions: CashPosition[] = [
        {
          id: 'cash-001',
          currency: 'INR',
          account_number: 'ACC-INR-001',
          bank_name: 'State Bank of India',
          account_type: 'checking',
          balance: 45750000,
          available_balance: 42850000,
          interest_rate: 3.5,
          status: 'active',
          last_updated: '2024-10-24T08:30:00Z'
        },
        {
          id: 'cash-002',
          currency: 'USD',
          account_number: 'ACC-USD-001',
          bank_name: 'JPMorgan Chase',
          account_type: 'money_market',
          balance: 15750000,
          available_balance: 15750000,
          interest_rate: 4.25,
          status: 'active',
          last_updated: '2024-10-24T08:30:00Z'
        },
        {
          id: 'cash-003',
          currency: 'EUR',
          account_number: 'ACC-EUR-001',
          bank_name: 'Deutsche Bank',
          account_type: 'savings',
          balance: 8950000,
          available_balance: 8450000,
          interest_rate: 2.15,
          status: 'active',
          last_updated: '2024-10-24T08:30:00Z'
        },
        {
          id: 'cash-004',
          currency: 'INR',
          account_number: 'ACC-INR-TD-001',
          bank_name: 'HDFC Bank',
          account_type: 'time_deposit',
          balance: 25000000,
          available_balance: 0,
          interest_rate: 6.85,
          maturity_date: '2024-12-15',
          status: 'active',
          last_updated: '2024-10-24T08:30:00Z'
        }
      ]

      const mockFxTransactions: FXTransaction[] = [
        {
          id: 'fx-001',
          transaction_type: 'forward',
          base_currency: 'USD',
          quote_currency: 'INR',
          base_amount: 1000000,
          quote_amount: 83250000,
          exchange_rate: 83.25,
          value_date: '2024-11-15',
          settlement_date: '2024-11-17',
          counterparty: 'Goldman Sachs',
          trader: 'Rajesh Kumar',
          status: 'confirmed',
          pnl: 125000,
          created_at: '2024-10-20T10:15:00Z'
        },
        {
          id: 'fx-002',
          transaction_type: 'spot',
          base_currency: 'EUR',
          quote_currency: 'USD',
          base_amount: 500000,
          quote_amount: 540000,
          exchange_rate: 1.08,
          value_date: '2024-10-26',
          settlement_date: '2024-10-28',
          counterparty: 'Morgan Stanley',
          trader: 'Priya Sharma',
          status: 'pending',
          pnl: 0,
          created_at: '2024-10-24T14:30:00Z'
        },
        {
          id: 'fx-003',
          transaction_type: 'swap',
          base_currency: 'INR',
          quote_currency: 'USD',
          base_amount: 41625000,
          quote_amount: 500000,
          exchange_rate: 83.25,
          value_date: '2024-10-25',
          settlement_date: '2024-10-27',
          counterparty: 'Citibank',
          trader: 'Amit Singh',
          status: 'settled',
          pnl: -25000,
          created_at: '2024-10-23T09:45:00Z'
        }
      ]

      const mockInvestments: Investment[] = [
        {
          id: 'inv-001',
          investment_type: 'bond',
          security_name: 'Government of India 7.17% 2030',
          isin: 'IN0020230025',
          quantity: 1000,
          unit_price: 102.45,
          market_value: 10245000,
          cost_basis: 10000000,
          unrealized_pnl: 245000,
          yield_rate: 7.17,
          maturity_date: '2030-01-08',
          rating: 'AAA',
          portfolio: 'Government Securities',
          custodian: 'Clearing Corporation of India',
          purchase_date: '2024-01-15',
          status: 'active'
        },
        {
          id: 'inv-002',
          investment_type: 'equity',
          security_name: 'Reliance Industries Limited',
          isin: 'INE002A01018',
          quantity: 5000,
          unit_price: 2485.60,
          market_value: 12428000,
          cost_basis: 11750000,
          unrealized_pnl: 678000,
          yield_rate: 0.0,
          rating: 'AA+',
          portfolio: 'Equity Holdings',
          custodian: 'National Securities Depository',
          purchase_date: '2024-03-20',
          status: 'active'
        },
        {
          id: 'inv-003',
          investment_type: 'fund',
          security_name: 'HDFC Liquid Fund',
          isin: 'INF179K01XY7',
          quantity: 50000,
          unit_price: 4856.24,
          market_value: 24281200,
          cost_basis: 24000000,
          unrealized_pnl: 281200,
          yield_rate: 6.85,
          rating: 'AAA',
          portfolio: 'Liquid Funds',
          custodian: 'HDFC Asset Management',
          purchase_date: '2024-02-10',
          status: 'active'
        },
        {
          id: 'inv-004',
          investment_type: 'bond',
          security_name: 'HDFC Bank 8.25% 2026 Tier II',
          isin: 'INE040A08049',
          quantity: 500,
          unit_price: 103.85,
          market_value: 5192500,
          cost_basis: 5000000,
          unrealized_pnl: 192500,
          yield_rate: 8.25,
          maturity_date: '2026-03-25',
          rating: 'AA+',
          portfolio: 'Corporate Bonds',
          custodian: 'Clearing Corporation of India',
          purchase_date: '2024-04-18',
          status: 'active'
        }
      ]

      const mockTreasuryPositions: TreasuryPosition[] = [
        {
          id: 'pos-001',
          position_type: 'fx',
          currency: 'USD/INR',
          position_amount: 5000000,
          market_value: 416250000,
          unrealized_pnl: 125000,
          maturity_date: '2024-11-15',
          counterparty: 'Goldman Sachs',
          risk_rating: 'low',
          portfolio: 'FX Trading',
          trader: 'Rajesh Kumar',
          created_at: '2024-10-20T10:15:00Z',
          updated_at: '2024-10-24T08:30:00Z'
        },
        {
          id: 'pos-002',
          position_type: 'investment',
          currency: 'INR',
          position_amount: 10245000,
          market_value: 10245000,
          unrealized_pnl: 245000,
          maturity_date: '2030-01-08',
          counterparty: 'Government of India',
          risk_rating: 'low',
          portfolio: 'Government Securities',
          trader: 'Priya Sharma',
          created_at: '2024-01-15T12:00:00Z',
          updated_at: '2024-10-24T08:30:00Z'
        },
        {
          id: 'pos-003',
          position_type: 'derivative',
          currency: 'USD',
          position_amount: 2500000,
          market_value: 2685000,
          unrealized_pnl: -85000,
          maturity_date: '2024-12-20',
          counterparty: 'Morgan Stanley',
          risk_rating: 'medium',
          portfolio: 'Derivatives',
          trader: 'Amit Singh',
          created_at: '2024-09-10T15:30:00Z',
          updated_at: '2024-10-24T08:30:00Z'
        }
      ]

      const mockLiquidityForecast: LiquidityForecast[] = [
        {
          id: 'lf-001',
          forecast_date: '2024-10-25',
          currency: 'INR',
          opening_balance: 70750000,
          projected_inflows: 15750000,
          projected_outflows: 12850000,
          net_position: 2900000,
          minimum_balance: 5000000,
          excess_liquidity: 68650000,
          funding_requirement: 0,
          confidence_level: 95
        },
        {
          id: 'lf-002',
          forecast_date: '2024-10-26',
          currency: 'INR',
          opening_balance: 73650000,
          projected_inflows: 8950000,
          projected_outflows: 18750000,
          net_position: -9800000,
          minimum_balance: 5000000,
          excess_liquidity: 58850000,
          funding_requirement: 0,
          confidence_level: 92
        },
        {
          id: 'lf-003',
          forecast_date: '2024-10-27',
          currency: 'INR',
          opening_balance: 63850000,
          projected_inflows: 22150000,
          projected_outflows: 15680000,
          net_position: 6470000,
          minimum_balance: 5000000,
          excess_liquidity: 65320000,
          funding_requirement: 0,
          confidence_level: 88
        }
      ]

      setMetrics(mockMetrics)
      setRiskMetrics(mockRiskMetrics)
      setTreasuryPositions(mockTreasuryPositions)
      setCashPositions(mockCashPositions)
      setFxTransactions(mockFxTransactions)
      setInvestments(mockInvestments)
      setLiquidityForecast(mockLiquidityForecast)
      setLoading(false)
    }

    loadTreasuryData()
  }, [])

  // Filter functions
  const filteredPositions = treasuryPositions.filter(position => {
    const matchesSearch = position.currency.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          position.portfolio.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          position.trader.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCurrency = currencyFilter === 'all' || position.currency.includes(currencyFilter)
    const matchesType = typeFilter === 'all' || position.position_type === typeFilter
    return matchesSearch && matchesCurrency && matchesType
  })

  // Utility functions
  const getRiskRatingColor = (rating: string) => {
    switch (rating) {
      case 'low': return 'text-green-600 bg-green-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'critical': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getPositionTypeColor = (type: string) => {
    switch (type) {
      case 'cash': return 'text-blue-600 bg-blue-50'
      case 'fx': return 'text-green-600 bg-green-50'
      case 'investment': return 'text-purple-600 bg-purple-50'
      case 'derivative': return 'text-orange-600 bg-orange-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getTransactionStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-50'
      case 'pending': return 'text-yellow-600 bg-yellow-50'
      case 'settled': return 'text-blue-600 bg-blue-50'
      case 'cancelled': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatExchangeRate = (rate: number) => {
    return rate.toFixed(4)
  }

  // Auth guards
  if (!isAuthenticated) {
    return (
      <div className="sap-font min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access Treasury Management.</p>
        </div>
      </div>
    )
  }

  if (contextLoading) {
    return (
      <div className="sap-font min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading organization context...</p>
        </div>
      </div>
    )
  }

  if (!organization?.id) {
    return (
      <div className="sap-font min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <h2 className="text-xl font-semibold text-red-600 mb-4">No Organization Context</h2>
          <p className="text-gray-600">Unable to determine organization context.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="sap-font min-h-screen bg-gray-100">
      <SapNavbar 
        title="Finance" 
        breadcrumb="Treasury Management (FI-TR)"
        showBack={true}
        userInitials={user?.email?.charAt(0).toUpperCase() || 'F'}
        showSearch={true}
      />
      
      <main className="mt-12 min-h-[calc(100vh-48px)]">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
                  <Landmark className="w-8 h-8 text-blue-600" />
                  Treasury Management (FI-TR)
                </h1>
                <p className="text-gray-600 mt-1">
                  Liquidity management, FX operations, investments, and risk control
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4 mr-2" />
                  New Position
                </button>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-full bg-blue-50">
                    <Wallet className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Total Cash Position</h3>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics?.total_cash_position || 0)}</p>
                <p className="text-sm text-blue-600">Multi-currency liquidity</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-full bg-green-50">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Daily P&L</h3>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics?.daily_pnl || 0)}</p>
                <p className="text-sm text-green-600">+15.8% vs yesterday</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-full bg-purple-50">
                    <Globe className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">FX Exposure</h3>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics?.total_fx_exposure || 0)}</p>
                <p className="text-sm text-purple-600">Cross-currency risk</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-full bg-orange-50">
                    <Shield className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">VaR (1-Day)</h3>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(riskMetrics?.var_1_day || 0)}</p>
                <p className="text-sm text-orange-600">99% confidence</p>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {[
                  { id: 'overview', name: 'Overview', icon: Eye },
                  { id: 'cash', name: 'Cash Management', icon: Wallet },
                  { id: 'fx', name: 'FX Operations', icon: Globe },
                  { id: 'investments', name: 'Investments', icon: TrendingUp },
                  { id: 'liquidity', name: 'Liquidity', icon: ArrowUpDown },
                  { id: 'risk', name: 'Risk Management', icon: Shield },
                  { id: 'reports', name: 'Reports', icon: FileText },
                  { id: 'analytics', name: 'Analytics', icon: BarChart3 }
                ].map((tab) => {
                  const IconComponent = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <IconComponent className="w-4 h-4 mr-2" />
                      {tab.name}
                    </button>
                  )
                })}
              </nav>
            </div>

            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Position Distribution */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <PieChart className="w-5 h-5" />
                        Position Distribution
                      </h3>
                      <div className="space-y-4">
                        {['cash', 'fx', 'investment', 'derivative'].map((type) => {
                          const typePositions = treasuryPositions.filter(p => p.position_type === type)
                          const totalValue = typePositions.reduce((sum, p) => sum + p.market_value, 0)
                          const percentage = metrics ? (totalValue / (metrics.total_cash_position + metrics.total_investments + metrics.total_fx_exposure)) * 100 : 0
                          
                          return (
                            <div key={type} className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  type === 'cash' ? 'bg-blue-500' :
                                  type === 'fx' ? 'bg-green-500' :
                                  type === 'investment' ? 'bg-purple-500' :
                                  'bg-orange-500'
                                }`}></div>
                                <div>
                                  <p className="font-medium text-gray-900 capitalize">{type} Positions</p>
                                  <p className="text-sm text-gray-600">{typePositions.length} positions</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900">{formatCurrency(totalValue)}</p>
                                <p className="text-sm text-gray-600">{percentage.toFixed(1)}%</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* P&L Performance */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        P&L Performance
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <div>
                            <p className="font-medium text-gray-900">Daily P&L</p>
                            <p className="text-sm text-gray-600">Today's trading result</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">{formatCurrency(metrics?.daily_pnl || 0)}</p>
                            <p className="text-sm text-green-600">+15.8%</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <div>
                            <p className="font-medium text-gray-900">YTD P&L</p>
                            <p className="text-sm text-gray-600">Year to date performance</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">{formatCurrency(metrics?.ytd_pnl || 0)}</p>
                            <p className="text-sm text-green-600">+22.4%</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <div>
                            <p className="font-medium text-gray-900">Unrealized P&L</p>
                            <p className="text-sm text-gray-600">Mark-to-market positions</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-blue-600">
                              {formatCurrency(treasuryPositions.reduce((sum, p) => sum + p.unrealized_pnl, 0))}
                            </p>
                            <p className="text-sm text-blue-600">Unrealized</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Risk Metrics Summary */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Risk Metrics Summary
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                        <p className="text-sm text-gray-600">VaR (1-Day)</p>
                        <p className="text-lg font-bold text-orange-600">{formatCurrency(riskMetrics?.var_1_day || 0)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                        <p className="text-sm text-gray-600">Credit Exposure</p>
                        <p className="text-lg font-bold text-red-600">{formatCurrency(riskMetrics?.credit_exposure || 0)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                        <p className="text-sm text-gray-600">Liquidity Ratio</p>
                        <p className="text-lg font-bold text-green-600">{riskMetrics?.liquidity_ratio?.toFixed(2)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
                        <p className="text-sm text-gray-600">Concentration Risk</p>
                        <p className="text-lg font-bold text-yellow-600">{formatPercentage(riskMetrics?.concentration_risk || 0)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Active Positions */}
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Active Positions</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market Value</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unrealized P&L</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trader</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {treasuryPositions.slice(0, 5).map((position) => (
                            <tr key={position.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{position.currency}</div>
                                  <div className="text-sm text-gray-500">{position.portfolio}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPositionTypeColor(position.position_type)}`}>
                                  {position.position_type.charAt(0).toUpperCase() + position.position_type.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {formatCurrency(position.market_value)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`text-sm font-medium ${position.unrealized_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatCurrency(position.unrealized_pnl)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRiskRatingColor(position.risk_rating)}`}>
                                  {position.risk_rating.charAt(0).toUpperCase() + position.risk_rating.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {position.trader}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Cash Management Tab */}
              {activeTab === 'cash' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Cash Position Management</h3>
                    <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Account
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {cashPositions.map((position) => (
                      <div key={position.id} className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-3 rounded-lg bg-blue-50">
                              <Wallet className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{position.bank_name}</h4>
                              <p className="text-sm text-gray-600">{position.account_number}</p>
                            </div>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            position.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {position.status.charAt(0).toUpperCase() + position.status.slice(1)}
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Currency:</span>
                            <span className="font-semibold text-gray-900">{position.currency}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Balance:</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(position.balance, position.currency)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Available:</span>
                            <span className="font-semibold text-green-600">{formatCurrency(position.available_balance, position.currency)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Interest Rate:</span>
                            <span className="font-semibold text-blue-600">{formatPercentage(position.interest_rate)}</span>
                          </div>
                          {position.maturity_date && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Maturity:</span>
                              <span className="font-semibold text-purple-600">{formatDate(position.maturity_date)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Type:</span>
                            <span className="text-sm text-gray-900 capitalize">{position.account_type.replace('_', ' ')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FX Operations Tab */}
              {activeTab === 'fx' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Foreign Exchange Operations</h3>
                    <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      <Globe className="w-4 h-4 mr-2" />
                      New FX Deal
                    </button>
                  </div>

                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h4 className="text-lg font-medium text-gray-900">FX Transactions</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency Pair</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P&L</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trader</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {fxTransactions.map((transaction) => (
                            <tr key={transaction.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900 capitalize">{transaction.transaction_type}</div>
                                  <div className="text-sm text-gray-500">{transaction.counterparty}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {transaction.base_currency}/{transaction.quote_currency}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{formatCurrency(transaction.base_amount, transaction.base_currency)}</div>
                                <div className="text-sm text-gray-500">{formatCurrency(transaction.quote_amount, transaction.quote_currency)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {formatExchangeRate(transaction.exchange_rate)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(transaction.value_date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`text-sm font-medium ${transaction.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {transaction.pnl !== 0 ? formatCurrency(transaction.pnl) : '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTransactionStatusColor(transaction.status)}`}>
                                  {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {transaction.trader}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Investments Tab */}
              {activeTab === 'investments' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Investment Portfolio</h3>
                    <button className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      New Investment
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {investments.map((investment) => (
                      <div key={investment.id} className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-3 rounded-lg bg-purple-50">
                              <TrendingUp className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{investment.security_name}</h4>
                              <p className="text-sm text-gray-600">{investment.isin}</p>
                            </div>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            investment.status === 'active' ? 'bg-green-100 text-green-800' :
                            investment.status === 'matured' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {investment.status.charAt(0).toUpperCase() + investment.status.slice(1)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600">Type</p>
                            <p className="font-semibold text-gray-900 capitalize">{investment.investment_type}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Quantity</p>
                            <p className="font-semibold text-gray-900">{investment.quantity.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Unit Price</p>
                            <p className="font-semibold text-gray-900">{formatCurrency(investment.unit_price)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Yield</p>
                            <p className="font-semibold text-blue-600">{formatPercentage(investment.yield_rate)}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2 border-t border-gray-200 pt-4">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Market Value:</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(investment.market_value)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Cost Basis:</span>
                            <span className="text-sm text-gray-900">{formatCurrency(investment.cost_basis)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Unrealized P&L:</span>
                            <span className={`font-semibold ${investment.unrealized_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(investment.unrealized_pnl)}
                            </span>
                          </div>
                          {investment.rating && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Rating:</span>
                              <span className="font-semibold text-blue-600">{investment.rating}</span>
                            </div>
                          )}
                          {investment.maturity_date && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Maturity:</span>
                              <span className="text-sm text-gray-900">{formatDate(investment.maturity_date)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Liquidity Tab */}
              {activeTab === 'liquidity' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Liquidity Forecasting</h3>
                  
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h4 className="text-lg font-medium text-gray-900">7-Day Liquidity Forecast (INR)</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opening Balance</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inflows</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outflows</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Position</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Excess/Deficit</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {liquidityForecast.map((forecast) => (
                            <tr key={forecast.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {formatDate(forecast.forecast_date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatCurrency(forecast.opening_balance)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                +{formatCurrency(forecast.projected_inflows)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                -{formatCurrency(forecast.projected_outflows)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`text-sm font-medium ${forecast.net_position >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {forecast.net_position >= 0 ? '+' : ''}{formatCurrency(forecast.net_position)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`text-sm font-medium ${
                                  forecast.excess_liquidity > forecast.minimum_balance ? 'text-green-600' : 
                                  forecast.funding_requirement > 0 ? 'text-red-600' : 'text-orange-600'
                                }`}>
                                  {forecast.funding_requirement > 0 ? 
                                    `Deficit: ${formatCurrency(forecast.funding_requirement)}` :
                                    `Excess: ${formatCurrency(forecast.excess_liquidity)}`
                                  }
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`text-sm font-medium ${
                                  forecast.confidence_level >= 95 ? 'text-green-600' :
                                  forecast.confidence_level >= 90 ? 'text-blue-600' :
                                  'text-orange-600'
                                }`}>
                                  {forecast.confidence_level}%
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Risk Management Tab */}
              {activeTab === 'risk' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Risk Management Dashboard</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Value at Risk */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Value at Risk (VaR)</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                          <div>
                            <p className="font-medium text-orange-900">1-Day VaR (99%)</p>
                            <p className="text-sm text-orange-700">Maximum 1-day loss</p>
                          </div>
                          <p className="text-xl font-bold text-orange-600">{formatCurrency(riskMetrics?.var_1_day || 0)}</p>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <div>
                            <p className="font-medium text-red-900">10-Day VaR (99%)</p>
                            <p className="text-sm text-red-700">Maximum 10-day loss</p>
                          </div>
                          <p className="text-xl font-bold text-red-600">{formatCurrency(riskMetrics?.var_10_day || 0)}</p>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">Total Exposure</p>
                            <p className="text-sm text-gray-700">Gross exposure</p>
                          </div>
                          <p className="text-xl font-bold text-gray-600">{formatCurrency(riskMetrics?.total_exposure || 0)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Risk Breakdown */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Risk Breakdown</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div>
                            <p className="font-medium text-green-900">FX Risk</p>
                            <p className="text-sm text-green-700">Currency exposure</p>
                          </div>
                          <p className="text-lg font-bold text-green-600">{formatCurrency(riskMetrics?.fx_exposure || 0)}</p>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div>
                            <p className="font-medium text-blue-900">Interest Rate Risk</p>
                            <p className="text-sm text-blue-700">Rate sensitivity</p>
                          </div>
                          <p className="text-lg font-bold text-blue-600">{formatCurrency(riskMetrics?.interest_rate_risk || 0)}</p>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                          <div>
                            <p className="font-medium text-purple-900">Credit Risk</p>
                            <p className="text-sm text-purple-700">Counterparty exposure</p>
                          </div>
                          <p className="text-lg font-bold text-purple-600">{formatCurrency(riskMetrics?.credit_exposure || 0)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Risk Limits */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Risk Limits Monitoring</h4>
                    <div className="space-y-4">
                      {[
                        { name: 'VaR Limit', current: 1250000, limit: 2000000, percentage: 62.5 },
                        { name: 'FX Exposure Limit', current: 38750000, limit: 50000000, percentage: 77.5 },
                        { name: 'Credit Exposure Limit', current: 45680000, limit: 60000000, percentage: 76.1 },
                        { name: 'Concentration Limit', current: 15.8, limit: 25.0, percentage: 63.2 }
                      ].map((limit, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-900">{limit.name}</span>
                            <span className={`text-sm font-medium ${
                              limit.percentage > 90 ? 'text-red-600' :
                              limit.percentage > 75 ? 'text-orange-600' :
                              'text-green-600'
                            }`}>
                              {limit.percentage.toFixed(1)}% utilized
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              Current: {limit.name.includes('Concentration') ? `${limit.current}%` : formatCurrency(limit.current)}
                            </span>
                            <span className="text-gray-600">
                              Limit: {limit.name.includes('Concentration') ? `${limit.limit}%` : formatCurrency(limit.limit)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                limit.percentage > 90 ? 'bg-red-500' :
                                limit.percentage > 75 ? 'bg-orange-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${limit.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Reports Tab */}
              {activeTab === 'reports' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Treasury Reports</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { title: 'Cash Position Report', description: 'Daily cash balances and movements', icon: Wallet, color: 'bg-blue-600' },
                      { title: 'FX Risk Report', description: 'Foreign exchange exposure analysis', icon: Globe, color: 'bg-green-600' },
                      { title: 'Investment Valuation', description: 'Portfolio valuation and performance', icon: TrendingUp, color: 'bg-purple-600' },
                      { title: 'Liquidity Analysis', description: 'Liquidity forecasting and gap analysis', icon: ArrowUpDown, color: 'bg-orange-600' },
                      { title: 'Risk Dashboard', description: 'Comprehensive risk metrics', icon: Shield, color: 'bg-red-600' },
                      { title: 'P&L Analysis', description: 'Trading and investment P&L', icon: BarChart3, color: 'bg-cyan-600' },
                      { title: 'Compliance Report', description: 'Regulatory compliance status', icon: CheckCircle, color: 'bg-indigo-600' },
                      { title: 'Counterparty Report', description: 'Counterparty exposure analysis', icon: Users, color: 'bg-pink-600' },
                      { title: 'Maturity Profile', description: 'Asset-liability maturity analysis', icon: Calendar, color: 'bg-yellow-600' }
                    ].map((report) => {
                      const IconComponent = report.icon
                      return (
                        <div key={report.title} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
                          <div className="flex items-center mb-4">
                            <div className={`p-3 rounded-lg ${report.color} mr-4`}>
                              <IconComponent className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{report.title}</h4>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                          <div className="flex items-center justify-between">
                            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                              Generate Report
                            </button>
                            <Download className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Treasury Analytics</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Performance Analytics */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Performance Analytics</h4>
                      <div className="space-y-4">
                        {[
                          { metric: 'ROI (YTD)', value: '12.4%', trend: 'up', benchmark: '8.5%' },
                          { metric: 'Sharpe Ratio', value: '1.85', trend: 'up', benchmark: '1.2' },
                          { metric: 'Max Drawdown', value: '3.2%', trend: 'down', benchmark: '5.0%' },
                          { metric: 'Win Rate', value: '68%', trend: 'up', benchmark: '55%' }
                        ].map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center space-x-3">
                              {item.trend === 'up' ? 
                                <TrendingUp className="w-5 h-5 text-green-600" /> :
                                <TrendingDown className="w-5 h-5 text-red-600" />
                              }
                              <div>
                                <p className="font-medium text-gray-900">{item.metric}</p>
                                <p className="text-sm text-gray-600">vs benchmark: {item.benchmark}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-semibold ${item.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                {item.value}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Market Intelligence */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Market Intelligence</h4>
                      <div className="space-y-4">
                        {[
                          { item: 'USD/INR Forecast (30D)', value: '83.45 ± 0.75', confidence: '85%' },
                          { item: 'Fed Rate Probability', value: '+25bps (Dec)', confidence: '78%' },
                          { item: 'RBI Policy Stance', value: 'Neutral', confidence: '92%' },
                          { item: 'Credit Spread Trend', value: 'Tightening', confidence: '71%' }
                        ].map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{item.item}</p>
                              <p className="text-sm text-gray-600">Confidence: {item.confidence}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-blue-600">{item.value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Advanced Analytics Tools */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Advanced Analytics Tools</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { tool: 'Monte Carlo Simulation', icon: Calculator, color: 'bg-blue-600' },
                        { tool: 'Stress Testing', icon: AlertTriangle, color: 'bg-red-600' },
                        { tool: 'Scenario Analysis', icon: TrendingUpDown, color: 'bg-green-600' },
                        { tool: 'Correlation Analysis', icon: Grid, color: 'bg-purple-600' }
                      ].map((tool) => {
                        const IconComponent = tool.icon
                        return (
                          <button
                            key={tool.tool}
                            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
                          >
                            <div className={`p-3 rounded-lg ${tool.color} mb-3`}>
                              <IconComponent className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-900 text-center">{tool.tool}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}