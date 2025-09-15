'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  Mail,
  Globe,
  Target,
  TrendingUp,
  Clock,
  DollarSign,
  BarChart3,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  MoreVertical,
  Send,
  Eye,
  MessageSquare,
  MousePointer,
  ChevronRight
} from 'lucide-react'

// India Vision Organization ID
const KERALA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001'

interface Campaign {
  id: string
  entity_name: string
  entity_code: string
  metadata?: {
    type?: string
    status?: string
    start_date?: string
    end_date?: string
    budget?: number
    expected_revenue?: number
    target_audience?: string
    description?: string
  }
  created_at: string
  updated_at: string
}

interface CampaignMetrics {
  sent?: number
  delivered?: number
  opened?: number
  clicked?: number
  converted?: number
  revenue?: number
}

export default function CampaignsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [isCreating, setIsCreating] = useState(false)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Sample metrics data (in real app, would come from database)
  const [campaignMetrics] = useState<Record<string, CampaignMetrics>>({
    'CAMP-SUMMER-2024': {
      sent: 12500,
      delivered: 12200,
      opened: 4880,
      clicked: 1220,
      converted: 183,
      revenue: 2196000
    },
    'CAMP-WEBINAR-2024': {
      sent: 8500,
      delivered: 8350,
      opened: 3340,
      clicked: 668,
      converted: 134,
      revenue: 1608000
    }
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    loadCampaigns()
  }, [])

  const loadCampaigns = async () => {
    try {
      const { data: campaignsData, error } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', KERALA_VISION_ORG_ID)
        .eq('entity_type', 'campaign')
        .order('created_at', { ascending: false })

      if (error) throw error

      setCampaigns(campaignsData || [])
    } catch (error) {
      console.error('Error loading campaigns:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'email':
        return Mail
      case 'webinar':
        return Globe
      case 'social':
        return MessageSquare
      case 'event':
        return Calendar
      default:
        return Megaphone
    }
  }

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'email':
        return 'from-[#FF5A09] to-[#ec7f37]'
      case 'webinar':
        return 'from-[#ec7f37] to-[#be4f0c]'
      case 'social':
        return 'from-blue-500 to-blue-600'
      case 'event':
        return 'from-purple-500 to-purple-600'
      default:
        return 'from-gray-9000 to-gray-600'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'paused':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'completed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'draft':
        return 'bg-gray-9000/20 text-muted-foreground border-gray-500/30'
      case 'scheduled':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      default:
        return 'bg-gray-9000/20 text-muted-foreground border-gray-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return Play
      case 'paused':
        return Pause
      case 'completed':
        return CheckCircle
      case 'failed':
        return XCircle
      default:
        return Clock
    }
  }

  const calculateROI = (campaign: Campaign) => {
    const metrics = campaignMetrics[campaign.entity_code]
    if (!metrics?.revenue || !campaign.metadata?.budget) return 0
    return ((metrics.revenue - campaign.metadata.budget) / campaign.metadata.budget) * 100
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch =
      campaign.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.metadata?.target_audience?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || campaign.metadata?.type === selectedType
    const matchesStatus = selectedStatus === 'all' || campaign.metadata?.status === selectedStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const stats = [
    {
      label: 'Active Campaigns',
      value: campaigns.filter(c => c.metadata?.status === 'Active').length,
      icon: Play,
      color: 'from-emerald-500 to-green-600'
    },
    {
      label: 'Total Reach',
      value: '21K',
      icon: Users,
      color: 'from-[#FF5A09] to-[#ec7f37]'
    },
    {
      label: 'Conversion Rate',
      value: '2.7%',
      icon: TrendingUp,
      color: 'from-[#ec7f37] to-[#be4f0c]'
    },
    {
      label: 'Total Revenue',
      value: '₹38L',
      icon: DollarSign,
      color: 'from-[#be4f0c] to-[#FF5A09]'
    }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-foreground">Loading campaigns...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campaigns</h1>
          <p className="text-foreground/60 mt-1">
            Manage your marketing campaigns and track performance
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="mt-4 sm:mt-0 flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#FF5A09] to-[#ec7f37] rounded-lg text-foreground font-medium hover:shadow-lg hover:shadow-[#FF5A09]/30 transition-all duration-300"
        >
          <Plus className="h-5 w-5" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF5A09]/50 to-[#ec7f37]/50 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>
                  <span className="text-xs text-emerald-400 font-medium">+12%</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-foreground/60 mt-1">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-foreground/40" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-background/5 backdrop-blur-xl border border-border/10 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-[#FF5A09] transition-colors"
          />
        </div>

        <select
          value={selectedType}
          onChange={e => setSelectedType(e.target.value)}
          className="px-4 py-3 bg-background/5 backdrop-blur-xl border border-border/10 rounded-lg text-foreground focus:outline-none focus:border-[#FF5A09] transition-colors"
        >
          <option value="all">All Types</option>
          <option value="Email">Email</option>
          <option value="Webinar">Webinar</option>
          <option value="Social">Social Media</option>
          <option value="Event">Event</option>
        </select>

        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="px-4 py-3 bg-background/5 backdrop-blur-xl border border-border/10 rounded-lg text-foreground focus:outline-none focus:border-[#FF5A09] transition-colors"
        >
          <option value="all">All Status</option>
          <option value="Active">Active</option>
          <option value="Paused">Paused</option>
          <option value="Completed">Completed</option>
          <option value="Draft">Draft</option>
          <option value="Scheduled">Scheduled</option>
        </select>

        <button className="flex items-center space-x-2 px-4 py-3 bg-background/5 backdrop-blur-xl border border-border/10 rounded-lg text-foreground hover:bg-background/10 transition-colors">
          <Filter className="h-5 w-5" />
          <span>More Filters</span>
        </button>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCampaigns.map(campaign => {
          const TypeIcon = getTypeIcon(campaign.metadata?.type || '')
          const StatusIcon = getStatusIcon(campaign.metadata?.status || '')
          const metrics = campaignMetrics[campaign.entity_code] || {}
          const roi = calculateROI(campaign)

          return (
            <div key={campaign.id} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF5A09]/30 to-[#ec7f37]/30 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
              <div className="relative bg-background/5 backdrop-blur-xl border border-border/10 rounded-2xl p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div
                      className={`p-3 rounded-xl bg-gradient-to-br ${getTypeColor(campaign.metadata?.type || '')}`}
                    >
                      <TypeIcon className="h-6 w-6 text-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{campaign.entity_name}</h3>
                      <p className="text-sm text-foreground/60 mt-1">
                        {campaign.metadata?.type} Campaign
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${getStatusColor(campaign.metadata?.status || '')}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      <span>{campaign.metadata?.status}</span>
                    </span>
                    <button className="text-foreground/40 hover:text-foreground transition-colors">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Campaign Info */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-foreground/60 mb-1">Target Audience</p>
                    <p className="text-sm text-foreground">
                      {campaign.metadata?.target_audience || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground/60 mb-1">Budget</p>
                    <p className="text-sm font-semibold text-[#FF5A09]">
                      {campaign.metadata?.budget
                        ? `₹${(campaign.metadata.budget / 100000).toFixed(1)}L`
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground/60 mb-1">Duration</p>
                    <div className="flex items-center space-x-1 text-sm text-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {campaign.metadata?.start_date
                          ? new Date(campaign.metadata.start_date).toLocaleDateString()
                          : 'N/A'}
                        {' - '}
                        {campaign.metadata?.end_date
                          ? new Date(campaign.metadata.end_date).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-foreground/60 mb-1">Expected Revenue</p>
                    <p className="text-sm text-foreground">
                      {campaign.metadata?.expected_revenue
                        ? `₹${(campaign.metadata.expected_revenue / 100000).toFixed(1)}L`
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Metrics */}
                {metrics.sent && (
                  <div className="space-y-3 mb-4 pt-4 border-t border-border/10">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="flex items-center justify-center space-x-1 text-foreground/60 mb-1">
                          <Send className="h-4 w-4" />
                          <span className="text-xs">Sent</span>
                        </div>
                        <p className="text-lg font-semibold text-foreground">
                          {(metrics.sent / 1000).toFixed(1)}K
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center space-x-1 text-foreground/60 mb-1">
                          <Eye className="h-4 w-4" />
                          <span className="text-xs">Opened</span>
                        </div>
                        <p className="text-lg font-semibold text-foreground">
                          {(((metrics.opened || 0) / metrics.sent) * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center space-x-1 text-foreground/60 mb-1">
                          <MousePointer className="h-4 w-4" />
                          <span className="text-xs">Clicked</span>
                        </div>
                        <p className="text-lg font-semibold text-foreground">
                          {(((metrics.clicked || 0) / metrics.sent) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {/* Conversion Funnel */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground/60">Conversion</span>
                        <span className="text-[#FF5A09] font-medium">
                          {metrics.converted} (
                          {(((metrics.converted || 0) / metrics.sent) * 100).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-background/10 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-[#FF5A09] to-[#ec7f37] h-2 rounded-full transition-all duration-500"
                          style={{ width: `${((metrics.converted || 0) / metrics.sent) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* ROI */}
                    {roi > 0 && (
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-foreground/60">ROI</span>
                        <span
                          className={`text-sm font-semibold ${roi > 0 ? 'text-emerald-400' : 'text-red-400'}`}
                        >
                          {roi > 0 ? '+' : ''}
                          {roi.toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-foreground/40 hover:text-[#FF5A09] transition-colors">
                      <BarChart3 className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-foreground/40 hover:text-[#FF5A09] transition-colors">
                      <Target className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-foreground/40 hover:text-[#FF5A09] transition-colors">
                      <Users className="h-4 w-4" />
                    </button>
                  </div>
                  <button className="flex items-center space-x-1 text-[#FF5A09] hover:text-[#ec7f37] transition-colors">
                    <span className="text-sm">View Details</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredCampaigns.length === 0 && (
        <div className="text-center py-12">
          <Megaphone className="h-12 w-12 text-foreground/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No campaigns found</h3>
          <p className="text-foreground/60">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}
