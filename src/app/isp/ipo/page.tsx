'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  TrendingUp,
  TrendingDown,
  FileCheck,
  Shield,
  Users,
  DollarSign,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Target,
  Zap,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Building2,
  UserCheck,
  Briefcase,
  Award,
  ChevronRight,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Calendar,
  Lock,
  Unlock
} from 'lucide-react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart
} from 'recharts'

// India Vision Organization ID
const INDIA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001'

interface ComplianceItem {
  category: string
  item: string
  status: 'completed' | 'in-progress' | 'pending'
  priority: 'critical' | 'high' | 'medium'
  dueDate?: string
  progress?: number
}

interface MilestoneItem {
  title: string
  date: string
  status: 'achieved' | 'upcoming'
  description: string
  impact: 'high' | 'medium' | 'low'
}

export default function IPOPage() {
  // State for dynamic IPO data from Supabase
  const [ipoReadiness, setIpoReadiness] = useState(73)
  const [targetValuation, setTargetValuation] = useState(2500) // In Crores
  const [currentValuation, setCurrentValuation] = useState(1850) // In Crores
  
  const [financialMetrics, setFinancialMetrics] = useState({
    revenue: { current: 540, target: 720, unit: 'Cr' },
    ebitda: { current: 162, target: 216, unit: 'Cr' },
    ebitdaMargin: { current: 30, target: 30, unit: '%' },
    netProfit: { current: 108, target: 144, unit: 'Cr' },
    debtEquityRatio: { current: 0.8, target: 0.5, unit: '' },
    roce: { current: 22, target: 25, unit: '%' }
  })

  const [growthMetrics, setGrowthMetrics] = useState([
    { year: '2020', revenue: 320, profit: 48, subscribers: 25000 },
    { year: '2021', revenue: 380, profit: 68, subscribers: 32000 },
    { year: '2022', revenue: 450, profit: 81, subscribers: 38000 },
    { year: '2023', revenue: 540, profit: 108, subscribers: 45832 },
    { year: '2024E', revenue: 650, profit: 143, subscribers: 55000 },
    { year: '2025E', revenue: 780, profit: 195, subscribers: 65000 }
  ])

  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([
    { category: 'Financial', item: 'Audited financials for 3 years', status: 'completed', priority: 'critical' },
    { category: 'Financial', item: 'Quarterly results for last 8 quarters', status: 'completed', priority: 'critical' },
    { category: 'Legal', item: 'SEBI compliance documentation', status: 'in-progress', priority: 'critical', progress: 85 },
    { category: 'Legal', item: 'Board resolution for IPO', status: 'completed', priority: 'high' },
    { category: 'Corporate', item: 'Independent directors appointment', status: 'in-progress', priority: 'high', progress: 60 },
    { category: 'Corporate', item: 'Audit committee formation', status: 'completed', priority: 'high' },
    { category: 'Operations', item: 'ERP system implementation', status: 'completed', priority: 'medium' },
    { category: 'Operations', item: 'Risk management framework', status: 'in-progress', priority: 'high', progress: 70 },
    { category: 'Financial', item: 'GST compliance certificate', status: 'completed', priority: 'high' },
    { category: 'Legal', item: 'IP rights documentation', status: 'pending', priority: 'medium', dueDate: '2024-08-15' }
  ])

  const [milestones, setMilestones] = useState<MilestoneItem[]>([
    { 
      title: 'Series B Funding Closed',
      date: '2023-03-15',
      status: 'achieved',
      description: 'Raised ₹150 Cr at ₹1200 Cr valuation',
      impact: 'high'
    },
    {
      title: 'Crossed 45K Subscribers',
      date: '2023-12-20',
      status: 'achieved',
      description: 'Achieved critical mass for IPO eligibility',
      impact: 'high'
    },
    {
      title: 'EBITDA Positive',
      date: '2022-06-30',
      status: 'achieved',
      description: 'Turned EBITDA positive with 25% margin',
      impact: 'high'
    },
    {
      title: 'Appoint Lead Managers',
      date: '2024-07-01',
      status: 'upcoming',
      description: 'Select investment banks for IPO process',
      impact: 'high'
    },
    {
      title: 'File DRHP with SEBI',
      date: '2024-09-15',
      status: 'upcoming',
      description: 'Submit Draft Red Herring Prospectus',
      impact: 'high'
    },
    {
      title: 'IPO Launch',
      date: '2024-12-01',
      status: 'upcoming',
      description: 'Target IPO launch date',
      impact: 'high'
    }
  ])

  const [investorMetrics, setInvestorMetrics] = useState([
    { metric: 'Market Share', value: 18, benchmark: 15, unit: '%' },
    { metric: 'Customer Retention', value: 92, benchmark: 85, unit: '%' },
    { metric: 'ARPU Growth', value: 15, benchmark: 10, unit: '%' },
    { metric: 'Network Coverage', value: 85, benchmark: 80, unit: '%' },
    { metric: 'Digital Adoption', value: 78, benchmark: 70, unit: '%' },
    { metric: 'Brand Value', value: 82, benchmark: 75, unit: 'score' }
  ])

  const [peerComparison, setPeerComparison] = useState([
    { company: 'India Vision', pe: 18, evEbitda: 12, pbv: 3.2, color: '#00DDFF' },
    { company: 'Peer A', pe: 22, evEbitda: 15, pbv: 4.1, color: '#fff685' },
    { company: 'Peer B', pe: 20, evEbitda: 13, pbv: 3.8, color: '#ff1d58' },
    { company: 'Industry Avg', pe: 21, evEbitda: 14, pbv: 3.9, color: '#f75990' }
  ])

  const supabase = createClientComponentClient()
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    fetchIPOData()
  }, [])

  async function fetchIPOData() {
    try {
      // Fetch IPO-related data from Supabase - run queries in parallel
      const [ipoEntityResult, financialResult, complianceResult, milestonesResult] = await Promise.all([
        supabase
          .from('core_entities')
          .select('metadata')
          .eq('organization_id', INDIA_VISION_ORG_ID)
          .eq('entity_type', 'ipo_preparation')
          .single(),

        supabase
          .from('core_entities')
          .select('metadata')
          .eq('organization_id', INDIA_VISION_ORG_ID)
          .eq('entity_type', 'financial_metrics')
          .single(),

        supabase
          .from('core_entities')
          .select('metadata')
          .eq('organization_id', INDIA_VISION_ORG_ID)
          .eq('entity_type', 'compliance_tracker'),

        supabase
          .from('universal_transactions')
          .select('*')
          .eq('organization_id', INDIA_VISION_ORG_ID)
          .eq('transaction_type', 'milestone')
          .order('transaction_date', { ascending: true })
      ])

      // Process IPO preparation data
      if (ipoEntityResult.data?.metadata) {
        const ipoData = ipoEntityResult.data.metadata
        
        if (ipoData.readiness_score) {
          setIpoReadiness(ipoData.readiness_score)
        }
        
        if (ipoData.target_valuation) {
          setTargetValuation(ipoData.target_valuation)
        }
        
        if (ipoData.current_valuation) {
          setCurrentValuation(ipoData.current_valuation)
        }
        
        if (ipoData.growth_metrics) {
          setGrowthMetrics(ipoData.growth_metrics)
        }
        
        if (ipoData.investor_metrics) {
          setInvestorMetrics(ipoData.investor_metrics)
        }
        
        if (ipoData.peer_comparison) {
          setPeerComparison(ipoData.peer_comparison)
        }
      }

      // Process financial metrics
      if (financialResult.data?.metadata) {
        const metrics = financialResult.data.metadata
        if (metrics.financial_metrics) {
          setFinancialMetrics(metrics.financial_metrics)
        }
      }

      // Process compliance items
      if (complianceResult.data && complianceResult.data.length > 0) {
        const compliance = complianceResult.data.map((item: any) => ({
          category: item.metadata?.category || 'General',
          item: item.metadata?.compliance_item || item.entity_name,
          status: item.metadata?.status || 'pending',
          priority: item.metadata?.priority || 'medium',
          progress: item.metadata?.progress || 0,
          dueDate: item.metadata?.due_date
        }))
        
        setComplianceItems(compliance)
      }

      // Process milestones from transactions
      if (milestonesResult.data && milestonesResult.data.length > 0) {
        const milestoneData = milestonesResult.data.map((txn: any) => ({
          title: txn.metadata?.milestone_title || 'Milestone',
          date: txn.transaction_date,
          status: txn.metadata?.status || 'upcoming',
          description: txn.metadata?.description || '',
          impact: txn.metadata?.impact || 'medium'
        }))
        
        setMilestones(milestoneData)
      }

    } catch (error) {
      console.error('Error fetching IPO data:', error)
      // Keep fallback data on error
    }
  }

  const refreshData = async () => {
    setIsRefreshing(true)
    await fetchIPOData()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  // Defensive normalization for charts: ensure arrays for Recharts components
  const toArray = (v: any): any[] => (Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v) : [])
  const safeInvestorMetrics = toArray(investorMetrics)
  const safeGrowthMetrics = toArray(growthMetrics)

  // Calculate compliance progress
  const totalCompliance = complianceItems.length
  const completedCompliance = complianceItems.filter(item => item.status === 'completed').length
  const complianceProgress = Math.round((completedCompliance / totalCompliance) * 100)

  // Group compliance by category
  const complianceByCategory = complianceItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = { total: 0, completed: 0 }
    }
    acc[item.category].total++
    if (item.status === 'completed') {
      acc[item.category].completed++
    }
    return acc
  }, {} as Record<string, { total: number; completed: number }>)

  const complianceCategoryData = Object.entries(complianceByCategory).map(([category, data]) => ({
    category,
    progress: Math.round((data.completed / data.total) * 100),
    completed: data.completed,
    total: data.total
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            IPO Preparation Dashboard
          </h1>
          <p className="text-white/60 mt-1">Track India Vision's journey to Initial Public Offering</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button 
            onClick={refreshData}
            className={`flex items-center space-x-2 px-4 py-2 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-lg text-white hover:bg-white/20 transition-all duration-300 ${isRefreshing ? 'animate-pulse' : ''}`}
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-lg text-white font-medium hover:shadow-lg hover:shadow-[#00DDFF]/30 transition-all duration-300">
            <Download className="h-5 w-5" />
            <span>IPO Report</span>
          </button>
        </div>
      </div>

      {/* IPO Readiness Score */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
        <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-white">IPO Readiness Score</h2>
              <p className="text-white/60 mt-1">Overall preparedness for public listing</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold bg-gradient-to-r from-[#00DDFF] to-[#fff685] bg-clip-text text-transparent">
                {ipoReadiness}%
              </div>
              <p className="text-sm text-white/60 mt-1">Ready for IPO</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Readiness Progress */}
            <div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/80">Financial Compliance</span>
                    <span className="text-sm font-medium text-[#00DDFF]">90%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-full" style={{ width: '90%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/80">Corporate Governance</span>
                    <span className="text-sm font-medium text-[#fff685]">75%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#fff685] to-[#00DDFF] rounded-full" style={{ width: '75%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/80">Market Position</span>
                    <span className="text-sm font-medium text-emerald-400">85%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full" style={{ width: '85%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/80">Technology Infrastructure</span>
                    <span className="text-sm font-medium text-purple-400">70%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-400 to-pink-500 rounded-full" style={{ width: '70%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Valuation Target */}
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="relative w-48 h-48 mx-auto">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="16"
                      fill="none"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="url(#valuationGradient)"
                      strokeWidth="16"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 88 * (currentValuation / targetValuation)} ${2 * Math.PI * 88}`}
                    />
                    <defs>
                      <linearGradient id="valuationGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00DDFF" />
                        <stop offset="100%" stopColor="#fff685" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-sm text-white/60">Current</p>
                    <p className="text-2xl font-bold text-white">₹{currentValuation} Cr</p>
                    <p className="text-xs text-[#fff685] mt-1">Target: ₹{targetValuation} Cr</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(financialMetrics).map(([key, metric]) => {
          const progress = (metric.current / metric.target) * 100
          const isOnTrack = progress >= 80
          
          return (
            <div key={key} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white/60 text-sm font-medium mb-1">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </h3>
                    <p className="text-2xl font-bold text-white">
                      {metric.current}{metric.unit}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${isOnTrack ? 'bg-emerald-500/20' : 'bg-yellow-500/20'}`}>
                    {isOnTrack ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40">Target</span>
                    <span className="text-white/60">{metric.target}{metric.unit}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOnTrack ? 'bg-gradient-to-r from-emerald-400 to-green-500' : 'bg-gradient-to-r from-yellow-400 to-amber-500'
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Growth Trajectory & Peer Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Growth Trajectory</h2>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={safeGrowthMetrics}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00DDFF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00DDFF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="year" stroke="rgba(255,255,255,0.5)" />
                <YAxis yAxisId="left" stroke="rgba(255,255,255,0.5)" />
                <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.5)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#00DDFF" 
                  fillOpacity={1} 
                  fill="url(#revenueGradient)" 
                  strokeWidth={2}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#fff685" 
                  strokeWidth={2}
                />
                <Bar 
                  yAxisId="right"
                  dataKey="subscribers" 
                  fill="#ff1d58" 
                  opacity={0.5}
                  radius={[8, 8, 0, 0]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fff685] to-[#00DDFF] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Peer Valuation</h2>
            <div className="space-y-4">
              {peerComparison.map((peer) => (
                <div key={peer.company} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{peer.company}</span>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: peer.color }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 rounded bg-slate-900/50">
                      <p className="text-white/60">P/E</p>
                      <p className="text-white font-medium">{peer.pe}x</p>
                    </div>
                    <div className="text-center p-2 rounded bg-slate-900/50">
                      <p className="text-white/60">EV/EBITDA</p>
                      <p className="text-white font-medium">{peer.evEbitda}x</p>
                    </div>
                    <div className="text-center p-2 rounded bg-slate-900/50">
                      <p className="text-white/60">P/BV</p>
                      <p className="text-white font-medium">{peer.pbv}x</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Tracker */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
        <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Compliance Tracker</h2>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{complianceProgress}%</p>
                <p className="text-xs text-white/60">Complete</p>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-white/60">{completedCompliance}/{totalCompliance}</span>
              </div>
            </div>
          </div>

          {/* Category Progress */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {complianceCategoryData.map((cat) => (
              <div key={cat.category} className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-2">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="#00DDFF"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 36 * cat.progress / 100} ${2 * Math.PI * 36}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">{cat.progress}%</span>
                  </div>
                </div>
                <p className="text-xs text-white/60">{cat.category}</p>
                <p className="text-xs text-white/40">{cat.completed}/{cat.total}</p>
              </div>
            ))}
          </div>

          {/* Compliance Items */}
          <div className="space-y-3">
            {complianceItems.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 hover:bg-white/20 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    item.status === 'completed' ? 'bg-emerald-500/20' :
                    item.status === 'in-progress' ? 'bg-yellow-500/20' : 'bg-red-500/20'
                  }`}>
                    {item.status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : item.status === 'in-progress' ? (
                      <Clock className="h-4 w-4 text-yellow-400" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{item.item}</p>
                    <p className="text-xs text-white/40">{item.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  {item.progress && (
                    <p className="text-sm font-medium text-[#00DDFF]">{item.progress}%</p>
                  )}
                  {item.dueDate && (
                    <p className="text-xs text-white/40">Due: {new Date(item.dueDate).toLocaleDateString()}</p>
                  )}
                  <span className={`text-xs px-2 py-1 rounded ${
                    item.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                    item.priority === 'high' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {item.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Investor Metrics & Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Investor Metrics Radar */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fff685] to-[#00DDFF] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Investor Appeal Metrics</h2>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={safeInvestorMetrics}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="metric" stroke="rgba(255,255,255,0.5)" />
                <PolarRadiusAxis stroke="rgba(255,255,255,0.3)" />
                <Radar 
                  name="India Vision" 
                  dataKey="value" 
                  stroke="#00DDFF" 
                  fill="#00DDFF" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Radar 
                  name="Industry Benchmark" 
                  dataKey="benchmark" 
                  stroke="#fff685" 
                  fill="#fff685" 
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Milestones */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#ff1d58] to-[#f75990] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">IPO Journey Milestones</h2>
            <div className="space-y-4 relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/10" />
              {milestones.map((milestone, index) => (
                <div key={index} className="relative flex items-start space-x-4">
                  <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center ${
                    milestone.status === 'achieved' 
                      ? 'bg-emerald-500/20 border-2 border-emerald-500' 
                      : 'bg-white/10 border-2 border-white/20'
                  }`}>
                    {milestone.status === 'achieved' ? (
                      <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                    ) : (
                      <Clock className="h-6 w-6 text-white/40" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className={`font-medium ${
                          milestone.status === 'achieved' ? 'text-white' : 'text-white/60'
                        }`}>
                          {milestone.title}
                        </h3>
                        <p className="text-xs text-white/40 mt-1">{milestone.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-white/60">
                          {new Date(milestone.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded inline-block mt-1 ${
                          milestone.impact === 'high' ? 'bg-red-500/20 text-red-400' :
                          milestone.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {milestone.impact} impact
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
        <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Next Steps for IPO Readiness</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <span className="font-medium text-red-400">Critical Actions</span>
              </div>
              <ul className="space-y-2 text-sm text-white/80">
                <li className="flex items-start space-x-2">
                  <ChevronRight className="h-4 w-4 text-white/40 mt-0.5" />
                  <span>Complete SEBI compliance documentation</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ChevronRight className="h-4 w-4 text-white/40 mt-0.5" />
                  <span>Appoint remaining independent directors</span>
                </li>
              </ul>
            </div>
            
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-5 w-5 text-yellow-400" />
                <span className="font-medium text-yellow-400">In Progress</span>
              </div>
              <ul className="space-y-2 text-sm text-white/80">
                <li className="flex items-start space-x-2">
                  <ChevronRight className="h-4 w-4 text-white/40 mt-0.5" />
                  <span>Risk management framework implementation</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ChevronRight className="h-4 w-4 text-white/40 mt-0.5" />
                  <span>Investment banker selection process</span>
                </li>
              </ul>
            </div>
            
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="h-5 w-5 text-emerald-400" />
                <span className="font-medium text-emerald-400">Upcoming</span>
              </div>
              <ul className="space-y-2 text-sm text-white/80">
                <li className="flex items-start space-x-2">
                  <ChevronRight className="h-4 w-4 text-white/40 mt-0.5" />
                  <span>Roadshow preparation and investor deck</span>
                </li>
                <li className="flex items-start space-x-2">
                  <ChevronRight className="h-4 w-4 text-white/40 mt-0.5" />
                  <span>Price band determination with bankers</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
