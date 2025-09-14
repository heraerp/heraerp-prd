'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  Headphones,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Building2,
  Calendar,
  Tag,
  MessageSquare,
  Paperclip,
  MoreVertical,
  TrendingUp,
  Timer,
  AlertCircle,
  ChevronRight,
  Phone,
  Mail,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'

// India Vision Organization ID
const KERALA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001'

interface Case {
  id: string
  entity_name: string
  entity_code: string
  metadata?: {
    type?: string
    priority?: string
    status?: string
    description?: string
    sla?: string
    opened_date?: string
    resolved_date?: string
    resolution?: string
  }
  created_at: string
  updated_at: string
}

interface CaseRelation {
  account?: string
  contact?: string
  assignee?: string
}

export default function CasesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [isCreating, setIsCreating] = useState(false)
  const [cases, setCases] = useState<Case[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Sample case relations (in real app, would come from relationships table)
  const [caseRelations] = useState<Record<string, CaseRelation>>({
    'CASE-INF-001': {
      account: 'Infosys Ltd',
      contact: 'Rajesh Kumar',
      assignee: 'Support Team A'
    },
    'CASE-TCS-001': {
      account: 'Tata Consultancy Services',
      contact: 'Priya Sharma',
      assignee: 'Billing Team'
    },
    'CASE-WIP-001': {
      account: 'Wipro Limited',
      contact: 'Vikram Singh',
      assignee: 'Network Team'
    }
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    loadCases()
  }, [])

  const loadCases = async () => {
    try {
      const { data: casesData, error } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', KERALA_VISION_ORG_ID)
        .eq('entity_type', 'case')
        .order('created_at', { ascending: false })

      if (error) throw error

      setCases(casesData || [])
    } catch (error) {
      console.error('Error loading cases:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'technical': return AlertTriangle
      case 'billing': return Tag
      case 'service request': return Headphones
      case 'complaint': return AlertCircle
      default: return MessageSquare
    }
  }

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'technical': return 'from-red-500 to-orange-600'
      case 'billing': return 'from-[#FF5A09] to-[#ec7f37]'
      case 'service request': return 'from-[#ec7f37] to-[#be4f0c]'
      case 'complaint': return 'from-purple-500 to-purple-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'medium': return 'bg-[#FF5A09]/20 text-[#FF5A09] border-[#FF5A09]/30'
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return ArrowUp
      case 'medium': return Minus
      case 'low': return ArrowDown
      default: return Minus
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'in progress': return 'bg-[#ec7f37]/20 text-[#ec7f37] border-[#ec7f37]/30'
      case 'resolved': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'closed': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      case 'escalated': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const calculateSLAStatus = (kase: Case) => {
    if (kase.metadata?.resolved_date) return 'resolved'
    
    const slaHours = parseInt(kase.metadata?.sla || '24')
    const openedDate = new Date(kase.metadata?.opened_date || kase.created_at)
    const now = new Date()
    const hoursElapsed = (now.getTime() - openedDate.getTime()) / (1000 * 60 * 60)
    
    if (hoursElapsed > slaHours) return 'breached'
    if (hoursElapsed > slaHours * 0.8) return 'at-risk'
    return 'on-track'
  }

  const getSLAStatusColor = (status: string) => {
    switch (status) {
      case 'breached': return 'text-red-400'
      case 'at-risk': return 'text-yellow-400'
      case 'on-track': return 'text-emerald-400'
      case 'resolved': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }

  const filteredCases = cases.filter(kase => {
    const matchesSearch = kase.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         kase.metadata?.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || kase.metadata?.type === selectedType
    const matchesPriority = selectedPriority === 'all' || kase.metadata?.priority === selectedPriority
    const matchesStatus = selectedStatus === 'all' || kase.metadata?.status === selectedStatus
    return matchesSearch && matchesType && matchesPriority && matchesStatus
  })

  const stats = [
    { 
      label: 'Open Cases', 
      value: cases.filter(c => c.metadata?.status === 'Open').length, 
      icon: AlertCircle, 
      color: 'from-yellow-500 to-orange-600' 
    },
    { 
      label: 'In Progress', 
      value: cases.filter(c => c.metadata?.status === 'In Progress').length, 
      icon: Clock, 
      color: 'from-[#FF5A09] to-[#ec7f37]' 
    },
    { 
      label: 'Resolved Today', 
      value: cases.filter(c => {
        const resolvedDate = c.metadata?.resolved_date
        return resolvedDate && new Date(resolvedDate).toDateString() === new Date().toDateString()
      }).length, 
      icon: CheckCircle, 
      color: 'from-emerald-500 to-green-600' 
    },
    { 
      label: 'Avg Resolution', 
      value: '6.2h', 
      icon: Timer, 
      color: 'from-[#be4f0c] to-[#FF5A09]' 
    }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading cases...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Support Cases</h1>
          <p className="text-white/60 mt-1">Manage customer support tickets and service requests</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="mt-4 sm:mt-0 flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#FF5A09] to-[#ec7f37] rounded-lg text-white font-medium hover:shadow-lg hover:shadow-[#FF5A09]/30 transition-all duration-300"
        >
          <Plus className="h-5 w-5" />
          <span>New Case</span>
        </button>
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
                  <span className="text-xs text-emerald-400 font-medium">
                    {index === 0 ? '+3' : index === 2 ? '+2' : ''}
                  </span>
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
            placeholder="Search cases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[#FF5A09] transition-colors"
          />
        </div>
        
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF5A09] transition-colors"
        >
          <option value="all">All Types</option>
          <option value="Technical">Technical</option>
          <option value="Billing">Billing</option>
          <option value="Service Request">Service Request</option>
          <option value="Complaint">Complaint</option>
        </select>

        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF5A09] transition-colors"
        >
          <option value="all">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF5A09] transition-colors"
        >
          <option value="all">All Status</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
          <option value="Escalated">Escalated</option>
        </select>
      </div>

      {/* Cases List */}
      <div className="space-y-4">
        {filteredCases.map((kase) => {
          const TypeIcon = getTypeIcon(kase.metadata?.type || '')
          const PriorityIcon = getPriorityIcon(kase.metadata?.priority || '')
          const slaStatus = calculateSLAStatus(kase)
          const relation = caseRelations[kase.entity_code] || {}
          
          return (
            <div key={kase.id} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF5A09]/30 to-[#ec7f37]/30 rounded-xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                <div className="flex items-start justify-between">
                  {/* Left Side */}
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${getTypeColor(kase.metadata?.type || '')}`}>
                          <TypeIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{kase.entity_name}</h3>
                          <p className="text-sm text-white/60 mt-1">{kase.entity_code}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center space-x-1 ${getPriorityColor(kase.metadata?.priority || '')}`}>
                          <PriorityIcon className="h-3 w-3" />
                          <span>{kase.metadata?.priority}</span>
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(kase.metadata?.status || '')}`}>
                          {kase.metadata?.status}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    {kase.metadata?.description && (
                      <p className="text-sm text-white/80 mb-4">{kase.metadata.description}</p>
                    )}

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-white/60 mb-1">Account</p>
                        <div className="flex items-center space-x-1 text-sm text-white">
                          <Building2 className="h-3 w-3" />
                          <span>{relation.account || 'N/A'}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-white/60 mb-1">Contact</p>
                        <div className="flex items-center space-x-1 text-sm text-white">
                          <User className="h-3 w-3" />
                          <span>{relation.contact || 'N/A'}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-white/60 mb-1">SLA</p>
                        <div className={`flex items-center space-x-1 text-sm font-medium ${getSLAStatusColor(slaStatus)}`}>
                          <Timer className="h-3 w-3" />
                          <span>{kase.metadata?.sla || '24 hours'}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-white/60 mb-1">Assigned To</p>
                        <p className="text-sm text-white">{relation.assignee || 'Unassigned'}</p>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="flex items-center space-x-4 text-xs text-white/60">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Opened: {kase.metadata?.opened_date ? new Date(kase.metadata.opened_date).toLocaleString() : 'N/A'}</span>
                        </div>
                        {kase.metadata?.resolved_date && (
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="h-3 w-3 text-emerald-400" />
                            <span>Resolved: {new Date(kase.metadata.resolved_date).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-1 text-white/40 hover:text-[#FF5A09] transition-colors">
                          <Mail className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-white/40 hover:text-[#FF5A09] transition-colors">
                          <Phone className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-white/40 hover:text-[#FF5A09] transition-colors">
                          <Paperclip className="h-4 w-4" />
                        </button>
                        <button className="flex items-center space-x-1 text-[#FF5A09] hover:text-[#ec7f37] transition-colors ml-2">
                          <span className="text-sm">View Details</span>
                          <ChevronRight className="h-4 w-4" />
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
      {filteredCases.length === 0 && (
        <div className="text-center py-12">
          <Headphones className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No cases found</h3>
          <p className="text-white/60">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}