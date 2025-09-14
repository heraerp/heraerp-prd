'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  UserPlus,
  Plus,
  Search,
  Filter,
  Building2,
  Mail,
  Phone,
  Calendar,
  MoreVertical,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  User,
  Globe,
  DollarSign,
  Tag,
  FileText,
  Download,
  Star
} from 'lucide-react'

// India Vision Organization ID
const KERALA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001'

interface Lead {
  id: string
  entity_name: string
  entity_code: string
  metadata?: {
    source?: string
    status?: string
    company?: string
    title?: string
    budget?: number
    timeline?: string
  }
  created_at: string
  updated_at: string
}

interface DynamicData {
  field_name: string
  field_value_text?: string
  field_value_number?: number
}

export default function LeadsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedSource, setSelectedSource] = useState('all')
  const [isCreating, setIsCreating] = useState(false)
  const [leads, setLeads] = useState<Lead[]>([])
  const [leadDynamicData, setLeadDynamicData] = useState<Record<string, DynamicData[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadLeads()
  }, [])

  const loadLeads = async () => {
    try {
      // Load leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', KERALA_VISION_ORG_ID)
        .eq('entity_type', 'lead')
        .order('created_at', { ascending: false })

      if (leadsError) throw leadsError

      // Load dynamic data for leads
      const leadIds = leadsData?.map(lead => lead.id) || []
      const { data: dynamicData, error: dynamicError } = await supabase
        .from('core_dynamic_data')
        .select('*')
        .in('entity_id', leadIds)

      if (dynamicError) throw dynamicError

      // Group dynamic data by entity
      const dynamicDataByEntity: Record<string, DynamicData[]> = {}
      dynamicData?.forEach(item => {
        if (!dynamicDataByEntity[item.entity_id]) {
          dynamicDataByEntity[item.entity_id] = []
        }
        dynamicDataByEntity[item.entity_id].push(item)
      })

      setLeads(leadsData || [])
      setLeadDynamicData(dynamicDataByEntity)
    } catch (error) {
      console.error('Error loading leads:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getDynamicValue = (leadId: string, fieldName: string) => {
    const fields = leadDynamicData[leadId] || []
    const field = fields.find(f => f.field_name === fieldName)
    return field?.field_value_text || field?.field_value_number || ''
  }

  const getRatingColor = (status: string) => {
    const rating = status === 'qualified' ? 'hot' : status === 'new' ? 'warm' : 'cold'
    switch (rating) {
      case 'hot': return 'from-red-500 to-orange-600'
      case 'warm': return 'from-[#FF5A09] to-[#ec7f37]'
      case 'cold': return 'from-blue-500 to-cyan-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getRatingBadgeColor = (status: string) => {
    const rating = status === 'qualified' ? 'hot' : status === 'new' ? 'warm' : 'cold'
    switch (rating) {
      case 'hot': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'warm': return 'bg-[#FF5A09]/20 text-[#FF5A09] border-[#FF5A09]/30'
      case 'cold': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'contacted': return 'bg-[#ec7f37]/20 text-[#ec7f37] border-[#ec7f37]/30'
      case 'qualified': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'unqualified': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'converted': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.metadata?.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.metadata?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || lead.metadata?.status === selectedStatus
    const matchesSource = selectedSource === 'all' || lead.metadata?.source === selectedSource
    return matchesSearch && matchesStatus && matchesSource
  })

  const sources = [...new Set(leads.map(l => l.metadata?.source).filter(Boolean))]

  const stats = [
    { label: 'Total Leads', value: leads.length, icon: UserPlus, color: 'from-[#FF5A09] to-[#ec7f37]' },
    { label: 'Qualified Leads', value: leads.filter(l => l.metadata?.status === 'qualified').length, icon: CheckCircle, color: 'from-emerald-500 to-green-600' },
    { label: 'Hot Leads', value: leads.filter(l => l.metadata?.status === 'qualified').length, icon: TrendingUp, color: 'from-red-500 to-orange-600' },
    { label: 'Conversion Rate', value: '32%', icon: ArrowRight, color: 'from-[#be4f0c] to-[#FF5A09]' }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading leads...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Leads</h1>
          <p className="text-white/60 mt-1">Track and manage your sales leads</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button className="flex items-center space-x-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white hover:bg-white/10 transition-all duration-300">
            <Download className="h-5 w-5" />
            <span>Export</span>
          </button>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#FF5A09] to-[#ec7f37] rounded-lg text-white font-medium hover:shadow-lg hover:shadow-[#FF5A09]/30 transition-all duration-300"
          >
            <Plus className="h-5 w-5" />
            <span>New Lead</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF5A09]/50 to-[#ec7f37]/50 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs text-emerald-400 font-medium">+15%</span>
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
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[#FF5A09] transition-colors"
          />
        </div>
        
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF5A09] transition-colors"
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="unqualified">Unqualified</option>
          <option value="converted">Converted</option>
        </select>

        <select
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
          className="px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF5A09] transition-colors"
        >
          <option value="all">All Sources</option>
          {sources.map(source => (
            <option key={source} value={source}>{source}</option>
          ))}
        </select>
      </div>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredLeads.map((lead) => {
          const status = lead.metadata?.status || 'new'
          const rating = status === 'qualified' ? 'hot' : status === 'new' ? 'warm' : 'cold'
          
          return (
            <div key={lead.id} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF5A09]/30 to-[#ec7f37]/30 rounded-xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{lead.entity_name}</h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center space-x-1 text-sm text-white/60">
                            <Building2 className="h-4 w-4" />
                            <span>{lead.metadata?.company || 'N/A'}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-sm text-white/60">
                            <Tag className="h-4 w-4" />
                            <span>{lead.metadata?.source || 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRatingBadgeColor(status)}`}>
                          {rating}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
                          {status}
                        </span>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-white/60 mb-1">Title</p>
                        <p className="text-sm text-white">{lead.metadata?.title || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/60 mb-1">Budget</p>
                        <p className="text-sm font-semibold text-[#FF5A09]">
                          {lead.metadata?.budget ? `₹${(lead.metadata.budget/100000).toFixed(1)}L` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-white/60 mb-1">Timeline</p>
                        <p className="text-sm text-white">{lead.metadata?.timeline || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="flex items-center space-x-6 mb-4 text-sm">
                      <div className="flex items-center space-x-2 text-white/60">
                        <Mail className="h-4 w-4" />
                        <span>{getDynamicValue(lead.id, 'email') || 'No email'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-white/60">
                        <Phone className="h-4 w-4" />
                        <span>{getDynamicValue(lead.id, 'phone') || 'No phone'}</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="flex items-center space-x-4 text-xs text-white/60">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Created: {new Date(lead.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Updated: {new Date(lead.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="px-3 py-1 text-sm text-white/60 hover:text-white transition-colors">
                          View Details
                        </button>
                        <button className="px-3 py-1 text-sm bg-gradient-to-r from-[#FF5A09] to-[#ec7f37] text-white rounded-lg hover:shadow-lg hover:shadow-[#FF5A09]/30 transition-all duration-300">
                          Convert to Opportunity
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredLeads.length === 0 && (
        <div className="text-center py-12">
          <UserPlus className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No leads found</h3>
          <p className="text-white/60">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}