'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Clock,
  Target,
  Award,
  AlertTriangle,
  Calendar,
  BarChart3,
  ExternalLink,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Zap,
  Building,
  Globe,
  BookOpen,
  UserPlus,
  Home
} from 'lucide-react'

/**
 * HERA Partner Dashboard
 * 
 * Meta Breakthrough: Partner dashboard powered by HERA's universal architecture
 * All metrics sourced from the same 6-table system that manages everything else
 */

interface PartnerDashboardData {
  partner_info: {
    id: string
    name: string
    code: string
    tier: string
    status: string
    join_date: string
    specializations: string[]
    geographic_coverage: string[]
    certification_status: string
  }
  revenue_metrics: {
    current_mrr: number
    ytd_earnings: number
    last_month_earnings: number
    commission_rate: number
    next_payout_date: string
    next_payout_amount: number
    lifetime_earnings: number
    average_customer_value: number
    revenue_growth_rate: number
  }
  customer_metrics: {
    total_customers: number
    active_customers: number
    new_customers_this_month: number
    at_risk_customers: number
    customer_retention_rate: number
    average_customer_lifetime: number
    customer_satisfaction_score: number
  }
  performance_metrics: {
    overall_score: number
    revenue_score: number
    customer_score: number
    activity_score: number
    certification_score: number
    ranking_this_month: number
    ranking_ytd: number
  }
  goals_and_targets: {
    monthly_target: number
    quarterly_target: number
    annual_target: number
    customer_acquisition_goal: number
    progress_to_monthly: number
    progress_to_quarterly: number
    progress_to_annual: number
  }
  recent_activity: Array<{
    date: string
    type: string
    description: string
    amount?: number
    status: string
  }>
  onboarding_status: {
    completion_percentage: number
    checklist: Array<{ task: string; status: string }>
    certification_progress: number
    training_modules_completed: number
    next_milestone: string
  }
  customers?: Array<{
    id: string
    name: string
    status: string
    monthly_value: number
    health_score: number
    last_payment: string
    signup_date: string
    risk_level: string
  }>
}

export default function PartnerDashboard() {
  const [dashboardData, setDashboardData] = useState<PartnerDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCustomers, setShowCustomers] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Mock data for demo (in real app, would call API)
      setDashboardData({
        partner_info: {
          id: 'demo-partner-123',
          name: 'TechSolutions Pro',
          code: 'PARTNER-DEMO-123',
          tier: 'gold',
          status: 'active',
          join_date: '2024-01-15',
          specializations: ['Manufacturing', 'Healthcare'],
          geographic_coverage: ['United States', 'Canada'],
          certification_status: 'certified'
        },
        revenue_metrics: {
          current_mrr: 12450,
          ytd_earnings: 89640,
          last_month_earnings: 11200,
          commission_rate: 50,
          next_payout_date: '2024-04-01',
          next_payout_amount: 12450,
          lifetime_earnings: 156780,
          average_customer_value: 265,
          revenue_growth_rate: 11.2
        },
        customer_metrics: {
          total_customers: 47,
          active_customers: 44,
          new_customers_this_month: 5,
          at_risk_customers: 3,
          customer_retention_rate: 94,
          average_customer_lifetime: 14,
          customer_satisfaction_score: 4.2
        },
        performance_metrics: {
          overall_score: 87,
          revenue_score: 92,
          customer_score: 85,
          activity_score: 88,
          certification_score: 95,
          ranking_this_month: 12,
          ranking_ytd: 8
        },
        goals_and_targets: {
          monthly_target: 15000,
          quarterly_target: 45000,
          annual_target: 180000,
          customer_acquisition_goal: 10,
          progress_to_monthly: 83,
          progress_to_quarterly: 75,
          progress_to_annual: 49.8
        },
        recent_activity: [
          { date: '2024-03-25', type: 'partner_commission', description: 'Commission earned: $465', amount: 465, status: 'completed' },
          { date: '2024-03-24', type: 'customer_signup', description: 'New customer onboarded: ACME Manufacturing', status: 'completed' },
          { date: '2024-03-22', type: 'training_completed', description: 'Training module completed: Advanced Features', status: 'completed' }
        ],
        onboarding_status: {
          completion_percentage: 100,
          checklist: [
            { task: 'Complete Partner Agreement', status: 'completed' },
            { task: 'Business Verification', status: 'completed' },
            { task: 'Training Enrollment', status: 'completed' },
            { task: 'Demo Environment Setup', status: 'completed' },
            { task: 'First Customer Onboarding', status: 'completed' },
            { task: 'Certification Achievement', status: 'completed' }
          ],
          certification_progress: 100,
          training_modules_completed: 8,
          next_milestone: 'All milestones complete!'
        }
      })
      
    } catch (err) {
      console.error('Dashboard load error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'bg-purple-100 text-purple-800'
      case 'gold': return 'bg-amber-100 text-amber-800'
      case 'silver': return 'bg-slate-100 text-slate-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading partner dashboard...</p>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600">Failed to load dashboard data</p>
          <Button onClick={loadDashboardData} className="mt-4">Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{dashboardData.partner_info.name}</h1>
              <div className="flex items-center gap-4 mt-2">
                <Badge className={getTierColor(dashboardData.partner_info.tier)}>
                  {dashboardData.partner_info.tier.toUpperCase()} PARTNER
                </Badge>
                <span className="text-slate-600">
                  Partner since {new Date(dashboardData.partner_info.join_date).toLocaleDateString()}
                </span>
                <Badge variant="outline">
                  {dashboardData.partner_info.code}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(dashboardData.revenue_metrics.current_mrr)}
                </div>
                <div className="text-sm text-slate-600">Monthly Recurring Revenue</div>
              </div>
              <div className="flex items-center gap-2 text-emerald-600">
                <ArrowUp className="h-4 w-4" />
                <span className="font-semibold">+{dashboardData.revenue_metrics.revenue_growth_rate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Partner Navigation */}
      <div className="bg-slate-100 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-1 py-3">
            <Link href="/partner">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                <Home className="h-4 w-4 mr-2" />
                Partner Hub
              </Button>
            </Link>
            <Link href="/partners">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                <Target className="h-4 w-4 mr-2" />
                Opportunities
              </Button>
            </Link>
            <Link href="/partner-system/register">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                <UserPlus className="h-4 w-4 mr-2" />
                Registration
              </Button>
            </Link>
            <Link href="/partner-system/training">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                <BookOpen className="h-4 w-4 mr-2" />
                Training
              </Button>
            </Link>
            <div className="px-3 py-2 bg-emerald-100 text-emerald-800 rounded-md text-sm font-medium">
              <BarChart3 className="h-4 w-4 mr-2 inline" />
              Dashboard
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm">YTD Earnings</p>
                  <p className="text-2xl font-bold">{formatCurrency(dashboardData.revenue_metrics.ytd_earnings)}</p>
                  <p className="text-sm text-emerald-600">50% commission rate</p>
                </div>
                <DollarSign className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm">Active Customers</p>
                  <p className="text-2xl font-bold">{dashboardData.customer_metrics.active_customers}</p>
                  <p className="text-sm text-blue-600">
                    +{dashboardData.customer_metrics.new_customers_this_month} this month
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm">Performance Score</p>
                  <p className="text-2xl font-bold">{dashboardData.performance_metrics.overall_score}/100</p>
                  <p className="text-sm text-purple-600">
                    Rank #{dashboardData.performance_metrics.ranking_this_month} this month
                  </p>
                </div>
                <Award className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm">Next Payout</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(dashboardData.revenue_metrics.next_payout_amount)}
                  </p>
                  <p className="text-sm text-amber-600">
                    {new Date(dashboardData.revenue_metrics.next_payout_date).toLocaleDateString()}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goals Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Goals & Targets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Monthly Target</span>
                  <span className="text-sm text-slate-600">
                    {dashboardData.goals_and_targets.progress_to_monthly.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className="bg-emerald-500 h-3 rounded-full" 
                    style={{ width: `${Math.min(100, dashboardData.goals_and_targets.progress_to_monthly)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-slate-600 mt-1">
                  <span>{formatCurrency(dashboardData.revenue_metrics.current_mrr)}</span>
                  <span>{formatCurrency(dashboardData.goals_and_targets.monthly_target)}</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Quarterly Target</span>
                  <span className="text-sm text-slate-600">
                    {dashboardData.goals_and_targets.progress_to_quarterly.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className="bg-blue-500 h-3 rounded-full" 
                    style={{ width: `${Math.min(100, dashboardData.goals_and_targets.progress_to_quarterly)}%` }}
                  ></div>
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  Target: {formatCurrency(dashboardData.goals_and_targets.quarterly_target)}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Annual Target</span>
                  <span className="text-sm text-slate-600">
                    {dashboardData.goals_and_targets.progress_to_annual.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className="bg-purple-500 h-3 rounded-full" 
                    style={{ width: `${Math.min(100, dashboardData.goals_and_targets.progress_to_annual)}%` }}
                  ></div>
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  Target: {formatCurrency(dashboardData.goals_and_targets.annual_target)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Customer Health Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Health Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Retention Rate</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{dashboardData.customer_metrics.customer_retention_rate}%</span>
                    <Badge className="bg-emerald-100 text-emerald-800">Excellent</Badge>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>At-Risk Customers</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{dashboardData.customer_metrics.at_risk_customers}</span>
                    {dashboardData.customer_metrics.at_risk_customers > 0 && (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Avg Customer Lifetime</span>
                  <span className="font-semibold">{dashboardData.customer_metrics.average_customer_lifetime} months</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Satisfaction Score</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{dashboardData.customer_metrics.customer_satisfaction_score}/5.0</span>
                    <div className="flex">
                      {[1,2,3,4,5].map(star => (
                        <span key={star} className={`text-sm ${star <= dashboardData.customer_metrics.customer_satisfaction_score ? 'text-amber-400' : 'text-slate-300'}`}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full mt-6" 
                variant="outline"
                onClick={() => setShowCustomers(!showCustomers)}
              >
                {showCustomers ? 'Hide' : 'View'} Customer Details
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.recent_activity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-slate-600">
                        {new Date(activity.date).toLocaleDateString()}
                      </p>
                    </div>
                    {activity.amount && (
                      <span className="text-sm font-semibold text-emerald-600">
                        {formatCurrency(activity.amount)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              
              <Button variant="outline" className="w-full mt-6">
                View All Activity
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Performance Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600 mb-2">
                  {dashboardData.performance_metrics.revenue_score}
                </div>
                <div className="text-sm text-slate-600">Revenue Score</div>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full" 
                    style={{ width: `${dashboardData.performance_metrics.revenue_score}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {dashboardData.performance_metrics.customer_score}
                </div>
                <div className="text-sm text-slate-600">Customer Score</div>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${dashboardData.performance_metrics.customer_score}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {dashboardData.performance_metrics.activity_score}
                </div>
                <div className="text-sm text-slate-600">Activity Score</div>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full" 
                    style={{ width: `${dashboardData.performance_metrics.activity_score}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-amber-600 mb-2">
                  {dashboardData.performance_metrics.certification_score}
                </div>
                <div className="text-sm text-slate-600">Certification Score</div>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-amber-500 h-2 rounded-full" 
                    style={{ width: `${dashboardData.performance_metrics.certification_score}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Button className="h-16 flex flex-col items-center gap-2">
                <Users className="h-5 w-5" />
                <span>Add New Customer</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col items-center gap-2">
                <Building className="h-5 w-5" />
                <span>Partner Portal</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col items-center gap-2">
                <Globe className="h-5 w-5" />
                <span>Marketing Assets</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Meta Breakthrough Badge */}
        <div className="mt-8 text-center">
          <Badge className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-4 py-2">
            🚀 Meta Breakthrough: Partner dashboard powered by HERA's universal 6-table architecture
          </Badge>
        </div>
      </div>
    </div>
  )
}