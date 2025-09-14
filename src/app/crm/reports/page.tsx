'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  FileText,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  ChevronRight,
  FileSpreadsheet,
  Mail,
  Phone,
  Building2,
  UserCheck,
  Briefcase,
  AlertCircle
} from 'lucide-react'

// Kerala Vision Organization ID
const KERALA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001'

interface Report {
  id: string
  name: string
  description: string
  category: 'sales' | 'pipeline' | 'activity' | 'forecast' | 'custom'
  icon: any
  lastRun?: string
  frequency?: 'daily' | 'weekly' | 'monthly' | 'on-demand'
  status?: 'ready' | 'generating' | 'scheduled'
}

export default function ReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [isGenerating, setIsGenerating] = useState(false)
  const [stats, setStats] = useState({
    totalRevenue: 0,
    opportunities: 0,
    accounts: 0,
    activities: 0
  })
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // Load opportunities
      const { data: opps, error: oppsError } = await supabase
        .from('core_entities')
        .select('metadata')
        .eq('organization_id', KERALA_VISION_ORG_ID)
        .eq('entity_type', 'opportunity')

      if (oppsError) throw oppsError

      // Calculate total revenue from opportunities
      const totalRevenue = opps?.reduce((sum, opp) => {
        return sum + (opp.metadata?.amount || 0)
      }, 0) || 0

      // Load accounts count
      const { count: accountCount } = await supabase
        .from('core_entities')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', KERALA_VISION_ORG_ID)
        .eq('entity_type', 'account')

      // Load activities count
      const { count: activityCount } = await supabase
        .from('universal_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', KERALA_VISION_ORG_ID)
        .eq('transaction_type', 'crm_activity')

      setStats({
        totalRevenue,
        opportunities: opps?.length || 0,
        accounts: accountCount || 0,
        activities: activityCount || 0
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const reports: Report[] = [
    // Sales Reports
    {
      id: '1',
      name: 'Sales Pipeline Analysis',
      description: 'Detailed analysis of opportunities by stage, value, and probability',
      category: 'sales',
      icon: Target,
      lastRun: '2024-06-15 09:30 AM',
      frequency: 'weekly',
      status: 'ready'
    },
    {
      id: '2',
      name: 'Revenue Forecast',
      description: 'Projected revenue based on pipeline and historical conversion rates',
      category: 'forecast',
      icon: TrendingUp,
      lastRun: '2024-06-14 04:00 PM',
      frequency: 'monthly',
      status: 'ready'
    },
    {
      id: '3',
      name: 'Sales Activity Report',
      description: 'Summary of calls, emails, meetings, and other activities by rep',
      category: 'activity',
      icon: Activity,
      lastRun: '2024-06-15 08:00 AM',
      frequency: 'daily',
      status: 'ready'
    },
    {
      id: '4',
      name: 'Win/Loss Analysis',
      description: 'Analysis of won and lost opportunities with reasons and trends',
      category: 'sales',
      icon: PieChart,
      lastRun: '2024-06-10 02:30 PM',
      frequency: 'monthly',
      status: 'ready'
    },
    {
      id: '5',
      name: 'Account Performance',
      description: 'Revenue and engagement metrics by account segment',
      category: 'sales',
      icon: Building2,
      lastRun: '2024-06-12 11:00 AM',
      frequency: 'weekly',
      status: 'ready'
    },
    {
      id: '6',
      name: 'Lead Conversion Funnel',
      description: 'Lead to opportunity conversion rates and bottleneck analysis',
      category: 'pipeline',
      icon: UserCheck,
      lastRun: '2024-06-13 03:45 PM',
      frequency: 'weekly',
      status: 'ready'
    },
    {
      id: '7',
      name: 'Campaign ROI Report',
      description: 'Return on investment analysis for marketing campaigns',
      category: 'sales',
      icon: DollarSign,
      lastRun: '2024-06-11 10:15 AM',
      frequency: 'monthly',
      status: 'ready'
    },
    {
      id: '8',
      name: 'Activity Trend Analysis',
      description: 'Trends in sales activities and their correlation with outcomes',
      category: 'activity',
      icon: BarChart3,
      frequency: 'on-demand',
      status: 'scheduled'
    }
  ]

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sales': return 'from-[#FF5A09] to-[#ec7f37]'
      case 'pipeline': return 'from-[#ec7f37] to-[#be4f0c]'
      case 'activity': return 'from-purple-500 to-purple-600'
      case 'forecast': return 'from-emerald-500 to-green-600'
      case 'custom': return 'from-blue-500 to-blue-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ready': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'generating': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'scheduled': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const filteredReports = reports.filter(report => {
    return selectedCategory === 'all' || report.category === selectedCategory
  })

  const quickStats = [
    { 
      label: 'Total Revenue', 
      value: `₹${(stats.totalRevenue / 10000000).toFixed(1)} Cr`, 
      icon: DollarSign, 
      color: 'from-[#FF5A09] to-[#ec7f37]',
      change: '+12.5%'
    },
    { 
      label: 'Active Opportunities', 
      value: stats.opportunities, 
      icon: Target, 
      color: 'from-[#ec7f37] to-[#be4f0c]',
      change: '+8%'
    },
    { 
      label: 'Total Accounts', 
      value: stats.accounts, 
      icon: Building2, 
      color: 'from-purple-500 to-purple-600',
      change: '+15%'
    },
    { 
      label: 'Activities This Month', 
      value: stats.activities, 
      icon: Activity, 
      color: 'from-[#be4f0c] to-[#FF5A09]',
      change: '+22%'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-white/60 mt-1">Generate insights from your CRM data</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button className="flex items-center space-x-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white hover:bg-white/10 transition-all duration-300">
            <Calendar className="h-5 w-5" />
            <span>Schedule Report</span>
          </button>
          <button 
            onClick={() => setIsGenerating(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#FF5A09] to-[#ec7f37] rounded-lg text-white font-medium hover:shadow-lg hover:shadow-[#FF5A09]/30 transition-all duration-300"
          >
            <FileText className="h-5 w-5" />
            <span>Custom Report</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF5A09]/50 to-[#ec7f37]/50 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs text-emerald-400 font-medium">{stat.change}</span>
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/60 mt-1">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF5A09] transition-colors"
        >
          <option value="all">All Categories</option>
          <option value="sales">Sales Reports</option>
          <option value="pipeline">Pipeline Reports</option>
          <option value="activity">Activity Reports</option>
          <option value="forecast">Forecast Reports</option>
          <option value="custom">Custom Reports</option>
        </select>

        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF5A09] transition-colors"
        >
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="quarter">Last Quarter</option>
          <option value="year">Last Year</option>
          <option value="custom">Custom Period</option>
        </select>

        <button className="flex items-center space-x-2 px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors">
          <Filter className="h-5 w-5" />
          <span>More Filters</span>
        </button>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredReports.map((report) => {
          const Icon = report.icon
          return (
            <div key={report.id} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF5A09]/30 to-[#ec7f37]/30 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${getCategoryColor(report.category)}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{report.name}</h3>
                      <p className="text-sm text-white/60 mt-1">{report.description}</p>
                    </div>
                  </div>
                  {report.status && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Report Metadata */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="space-y-1">
                      {report.lastRun && (
                        <div className="flex items-center space-x-2 text-white/60">
                          <Clock className="h-4 w-4" />
                          <span>Last run: {report.lastRun}</span>
                        </div>
                      )}
                      {report.frequency && (
                        <div className="flex items-center space-x-2 text-white/60">
                          <Calendar className="h-4 w-4" />
                          <span>Frequency: {report.frequency}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-white/40 hover:text-[#FF5A09] transition-colors">
                        <FileSpreadsheet className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-white/40 hover:text-[#FF5A09] transition-colors">
                        <Mail className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-white/40 hover:text-[#FF5A09] transition-colors">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                    <button className="flex items-center space-x-1 text-[#FF5A09] hover:text-[#ec7f37] transition-colors">
                      <span className="text-sm font-medium">View Report</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Insights */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF5A09]/30 to-[#ec7f37]/30 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
        <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Quick Insights</h3>
            <AlertCircle className="h-5 w-5 text-[#FF5A09]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-2xl font-bold text-[#FF5A09]">68%</p>
              <p className="text-sm text-white/60 mt-1">Pipeline coverage for Q3 target</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-2xl font-bold text-emerald-400">24 days</p>
              <p className="text-sm text-white/60 mt-1">Average sales cycle</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-2xl font-bold text-[#ec7f37]">₹42L</p>
              <p className="text-sm text-white/60 mt-1">Average deal size</p>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredReports.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No reports found</h3>
          <p className="text-white/60">Try adjusting your filters or create a custom report</p>
        </div>
      )}
    </div>
  )
}