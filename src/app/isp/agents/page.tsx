'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  UserCheck, 
  Users, 
  TrendingUp, 
  Award,
  Phone,
  Mail,
  MapPin,
  IndianRupee,
  Target,
  Calendar,
  Star,
  BarChart3,
  Search,
  Filter,
  ChevronDown,
  Download,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit2,
  Trash2
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { ISPModal } from '@/components/isp/ISPModal'
import { ISPTable } from '@/components/isp/ISPTable'
import { ISPInput, ISPSelect, ISPButton } from '@/components/isp/ISPForm'

// India Vision Organization ID
const INDIA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001'

interface AgentCardProps {
  agent: {
    name: string
    id: string
    region: string
    performance: number
    customers: number
    revenue: number
    commission: number
    status: 'active' | 'inactive' | 'on-leave'
    phone: string
    email: string
    joinDate: string
    rating: number
  }
}

function AgentCard({ agent }: AgentCardProps) {
  const statusColors = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    inactive: 'bg-red-500/10 text-red-400 border-red-500/20',
    'on-leave': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
  }

  const performanceColor = agent.performance >= 90 ? 'text-emerald-400' : agent.performance >= 75 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0099CC] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
    <div className="relative bg-slate-900/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6 hover:bg-accent/20 transition-all duration-300">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0099CC] to-[#0049B7] flex items-center justify-center text-white font-bold text-lg">
              {agent.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
              <p className="text-sm text-white/60">ID: {agent.id}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[agent.status]}`}>
            {agent.status.replace('-', ' ')}
          </span>
        </div>

        {/* Performance Score */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/60">Performance Score</span>
            <span className={`text-lg font-bold ${performanceColor}`}>{agent.performance}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                agent.performance >= 90 ? 'bg-gradient-to-r from-emerald-400 to-green-500' :
                agent.performance >= 75 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
                'bg-gradient-to-r from-red-400 to-rose-500'
              }`}
              style={{ width: `${agent.performance}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-white/60 mb-1">Active Customers</p>
            <p className="text-xl font-bold text-white">{agent.customers}</p>
          </div>
          <div>
            <p className="text-xs text-white/60 mb-1">Monthly Revenue</p>
            <p className="text-xl font-bold bg-gradient-to-r from-[#FFD700] to-[#0099CC] bg-clip-text text-transparent">
              ₹{(agent.revenue / 1000).toFixed(1)}K
            </p>
          </div>
          <div>
            <p className="text-xs text-white/60 mb-1">Commission</p>
            <p className="text-xl font-bold text-[#0099CC]">₹{agent.commission.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-white/60 mb-1">Rating</p>
            <div className="flex items-center space-x-1">
              <span className="text-xl font-bold text-[#FFD700]">{agent.rating}</span>
              <Star className="h-4 w-4 text-[#FFD700] fill-current" />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 pt-4 border-t border-border/50">
          <div className="flex items-center space-x-2 text-sm">
            <MapPin className="h-4 w-4 text-white/40" />
            <span className="text-white/80">{agent.region}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Phone className="h-4 w-4 text-white/40" />
            <span className="text-white/80">{agent.phone}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Mail className="h-4 w-4 text-white/40" />
            <span className="text-white/80">{agent.email}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

interface Agent {
  name: string
  id: string
  region: string
  performance: number
  customers: number
  revenue: number
  commission: number
  status: 'active' | 'inactive' | 'on-leave'
  phone: string
  email: string
  joinDate: string
  rating: number
}

export default function AgentsPage() {
  // Initial real data for instant loading
  const [agents, setAgents] = useState<Agent[]>([
    {
      name: 'Rajesh Kumar',
      id: 'AGT-001',
      region: 'Thiruvananthapuram',
      performance: 95,
      customers: 250,
      revenue: 212500,
      commission: 21250,
      status: 'active' as const,
      phone: '+91 98765 43210',
      email: 'rajesh.kumar@keralavision.com',
      joinDate: '2022-03-15',
      rating: 4.8
    },
    {
      name: 'Priya Nair',
      id: 'AGT-002',
      region: 'Kochi',
      performance: 92,
      customers: 180,
      revenue: 153000,
      commission: 15300,
      status: 'active' as const,
      phone: '+91 98765 43211',
      email: 'priya.nair@keralavision.com',
      joinDate: '2022-06-20',
      rating: 4.7
    },
    {
      name: 'Mohammed Ali',
      id: 'AGT-003',
      region: 'Kozhikode',
      performance: 88,
      customers: 150,
      revenue: 127500,
      commission: 12750,
      status: 'active' as const,
      phone: '+91 98765 43212',
      email: 'mohammed.ali@keralavision.com',
      joinDate: '2023-01-10',
      rating: 4.6
    },
    {
      name: 'Deepa Menon',
      id: 'AGT-004',
      region: 'Thiruvananthapuram',
      performance: 78,
      customers: 120,
      revenue: 102000,
      commission: 10200,
      status: 'active' as const,
      phone: '+91 98765 43213',
      email: 'deepa.menon@keralavision.com',
      joinDate: '2023-04-05',
      rating: 4.4
    },
    {
      name: 'Suresh Pillai',
      id: 'AGT-005',
      region: 'Kochi',
      performance: 85,
      customers: 165,
      revenue: 140250,
      commission: 14025,
      status: 'on-leave' as const,
      phone: '+91 98765 43214',
      email: 'suresh.pillai@keralavision.com',
      joinDate: '2022-08-12',
      rating: 4.5
    },
    {
      name: 'Anjali Varma',
      id: 'AGT-006',
      region: 'Kozhikode',
      performance: 91,
      customers: 195,
      revenue: 165750,
      commission: 16575,
      status: 'active' as const,
      phone: '+91 98765 43215',
      email: 'anjali.varma@keralavision.com',
      joinDate: '2022-11-25',
      rating: 4.7
    }
  ])

  const [performanceData] = useState([
    { month: 'Jan', agents: 2800, revenue: 2380000 },
    { month: 'Feb', agents: 2850, revenue: 2422500 },
    { month: 'Mar', agents: 2900, revenue: 2465000 },
    { month: 'Apr', agents: 2950, revenue: 2507500 },
    { month: 'May', agents: 3000, revenue: 2550000 },
    { month: 'Jun', agents: 3050, revenue: 2592500 }
  ])

  const [regionStats] = useState([
    { name: 'Thiruvananthapuram', value: 1200, color: '#0099CC' },
    { name: 'Kochi', value: 1000, color: '#FFD700' },
    { name: 'Kozhikode', value: 850, color: '#E91E63' }
  ])

  // Defensive normalization for chart inputs
  const toArray = (v: any): any[] => (Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v) : [])
  const safePerformanceData = toArray(performanceData)
  const safeRegionStats = toArray(regionStats)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    region: 'Thiruvananthapuram',
    phone: '',
    email: '',
    status: 'active' as const,
    performance: 85,
    customers: 0,
    rating: 4.5
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchAgentsData()
  }, [])

  const handleAdd = async () => {
    try {
      const agentCode = `AGT-${String((agents.length || 0) + 1).padStart(3, '0')}`
      
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: INDIA_VISION_ORG_ID,
          entity_type: 'field_agent',
          entity_name: formData.name,
          entity_code: agentCode,
          metadata: {
            region: formData.region,
            phone: formData.phone,
            email: formData.email,
            status: formData.status,
            performance_score: formData.performance,
            active_customers: formData.customers,
            monthly_collections: formData.customers * 850,
            commission_earned: formData.customers * 85,
            join_date: new Date().toISOString(),
            rating: formData.rating
          }
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        const newAgent: Agent = {
          id: data.entity_code || agentCode,
          name: data.entity_name,
          region: data.metadata.region,
          phone: data.metadata.phone,
          email: data.metadata.email,
          status: data.metadata.status,
          performance: data.metadata.performance_score,
          customers: data.metadata.active_customers,
          revenue: data.metadata.monthly_collections,
          commission: data.metadata.commission_earned,
          joinDate: new Date(data.metadata.join_date).toISOString().split('T')[0],
          rating: data.metadata.rating
        }
        setAgents([...agents, newAgent])
        setShowAddModal(false)
        resetForm()
      }
    } catch (error) {
      console.error('Error adding agent:', error)
      alert('Failed to add agent. Please try again.')
    }
  }

  const handleEdit = (agent: Agent) => {
    setSelectedAgent(agent)
    setFormData({
      name: agent.name,
      region: agent.region,
      phone: agent.phone,
      email: agent.email,
      status: agent.status,
      performance: agent.performance,
      customers: agent.customers,
      rating: agent.rating
    })
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    if (selectedAgent) {
      try {
        // First find the entity in database
        const { data: entities } = await supabase
          .from('core_entities')
          .select('id')
          .eq('organization_id', INDIA_VISION_ORG_ID)
          .eq('entity_type', 'field_agent')
          .eq('entity_code', selectedAgent.id)
          .single()

        if (!entities) {
          throw new Error('Agent not found')
        }

        const { error } = await supabase
          .from('core_entities')
          .update({
            entity_name: formData.name,
            metadata: {
              region: formData.region,
              phone: formData.phone,
              email: formData.email,
              status: formData.status,
              performance_score: formData.performance,
              active_customers: formData.customers,
              monthly_collections: formData.customers * 850,
              commission_earned: formData.customers * 85,
              join_date: selectedAgent.joinDate,
              rating: formData.rating
            }
          })
          .eq('id', entities.id)

        if (error) throw error

        setAgents(agents.map(a => 
          a.id === selectedAgent.id 
            ? { 
                ...a, 
                ...formData,
                revenue: formData.customers * 850,
                commission: formData.customers * 85
              }
            : a
        ))
        setShowEditModal(false)
        setSelectedAgent(null)
        resetForm()
      } catch (error) {
        console.error('Error updating agent:', error)
        alert('Failed to update agent. Please try again.')
      }
    }
  }

  const handleDelete = async (agent: Agent) => {
    if (confirm(`Are you sure you want to remove agent ${agent.name}?`)) {
      try {
        // First find the entity in database
        const { data: entities } = await supabase
          .from('core_entities')
          .select('id')
          .eq('organization_id', INDIA_VISION_ORG_ID)
          .eq('entity_type', 'field_agent')
          .eq('entity_code', agent.id)
          .single()

        if (!entities) {
          throw new Error('Agent not found')
        }

        const { error } = await supabase
          .from('core_entities')
          .delete()
          .eq('id', entities.id)

        if (error) throw error

        setAgents(agents.filter(a => a.id !== agent.id))
      } catch (error) {
        console.error('Error deleting agent:', error)
        alert('Failed to delete agent. Please try again.')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      region: 'Thiruvananthapuram',
      phone: '',
      email: '',
      status: 'active',
      performance: 85,
      customers: 0,
      rating: 4.5
    })
  }

  async function fetchAgentsData() {
    try {
      // Fetch agent entities from Supabase
      const { data: agentEntities } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', INDIA_VISION_ORG_ID)
        .eq('entity_type', 'field_agent')

      console.log('Fetched agent entities from Supabase:', agentEntities?.length || 0)
      
      if (agentEntities && agentEntities.length > 0) {
        const updatedAgents = agentEntities.map((entity: any, index: number) => ({
          name: entity.entity_name,
          id: entity.entity_code || `AGT-${String(index + 1).padStart(3, '0')}`,
          region: entity.metadata?.region || 'Thiruvananthapuram',
          performance: entity.metadata?.performance_score || 85,
          customers: entity.metadata?.active_customers || 150,
          revenue: entity.metadata?.monthly_collections || (entity.metadata?.active_customers || 200) * 850,
          commission: entity.metadata?.commission_earned || entity.metadata?.monthly_collections * 0.1 || 10000,
          status: entity.metadata?.status || 'active' as const,
          phone: `+91 98765 ${43210 + index}`,
          email: `${entity.entity_name.toLowerCase().replace(' ', '.')}@keralavision.com`,
          joinDate: entity.metadata?.join_date ? new Date(entity.metadata.join_date).toISOString().split('T')[0] : '2023-01-01',
          rating: 4.3 + (entity.metadata?.performance_score || 85) / 100 * 0.7
        }))
        setAgents(updatedAgents)
      }
    } catch (error) {
      console.error('Error fetching agents data:', error)
      // Keep showing initial data on error
    }
  }

  // Filter agents based on search and filters
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRegion = selectedRegion === 'all' || agent.region === selectedRegion
    const matchesStatus = selectedStatus === 'all' || agent.status === selectedStatus
    return matchesSearch && matchesRegion && matchesStatus
  })

  // Calculate summary stats
  const totalAgents = agents.length
  const activeAgents = agents.filter(a => a.status === 'active').length
  const totalCustomers = agents.reduce((sum, a) => sum + a.customers, 0)
  const totalRevenue = agents.reduce((sum, a) => sum + a.revenue, 0)
  const avgPerformance = agents.reduce((sum, a) => sum + a.performance, 0) / agents.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Field Agent Management
          </h1>
          <p className="text-white/60 mt-1">Monitor and manage your field agent network</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#0099CC] to-[#0049B7] rounded-lg text-white font-medium hover:shadow-lg hover:shadow-[#0099CC]/40 transition-all duration-300 mt-4 sm:mt-0"
        >
          <Plus className="h-5 w-5" />
          <span>Add Agent</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0099CC] to-[#0049B7] rounded-xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
          <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-[#0099CC]" />
              <span className="text-xs text-emerald-400 font-medium">+5.2%</span>
            </div>
            <p className="text-2xl font-bold text-white">{totalAgents}</p>
            <p className="text-xs text-white/60">Total Agents</p>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
          <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              <span className="text-xs text-white/60">{Math.round((activeAgents/totalAgents)*100)}%</span>
            </div>
            <p className="text-2xl font-bold text-white">{activeAgents}</p>
            <p className="text-xs text-white/60">Active Agents</p>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FFD700] to-[#0099CC] rounded-xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
          <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <UserCheck className="h-5 w-5 text-[#FFD700]" />
              <span className="text-xs text-emerald-400 font-medium">+12.3%</span>
            </div>
            <p className="text-2xl font-bold text-white">{totalCustomers.toLocaleString()}</p>
            <p className="text-xs text-white/60">Total Customers</p>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#E91E63] to-[#C2185B] rounded-xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
          <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <IndianRupee className="h-5 w-5 text-[#E91E63]" />
              <span className="text-xs text-emerald-400 font-medium">+8.7%</span>
            </div>
            <p className="text-2xl font-bold text-white">₹{(totalRevenue/100000).toFixed(1)}L</p>
            <p className="text-xs text-white/60">Total Revenue</p>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
          <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-purple-400" />
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white">{avgPerformance.toFixed(1)}%</p>
            <p className="text-xs text-white/60">Avg Performance</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
          <input
            type="text"
            placeholder="Search agents by name, ID, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[#0099CC] transition-colors"
          />
        </div>
        
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="px-4 py-3 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#0099CC] transition-colors"
        >
          <option value="all">All Regions</option>
          <option value="Thiruvananthapuram">Thiruvananthapuram</option>
          <option value="Kochi">Kochi</option>
          <option value="Kozhikode">Kozhikode</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-3 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#0099CC] transition-colors"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="on-leave">On Leave</option>
        </select>

        <button className="flex items-center space-x-2 px-4 py-3 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-lg text-white hover:bg-white/20 transition-colors">
          <Download className="h-5 w-5" />
          <span>Export</span>
        </button>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative group min-w-0">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0099CC] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
          <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Agent Network Growth</h2>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={safePerformanceData}>
                <defs>
                  <linearGradient id="agentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0099CC" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0099CC" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="agents" 
                  stroke="#0099CC" 
                  fillOpacity={1} 
                  fill="url(#agentGradient)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fff685] to-[#00DDFF] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Regional Distribution</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={safeRegionStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {safeRegionStats.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {safeRegionStats.map((region: any) => (
                <div key={region.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: region.color }} />
                    <span className="text-sm text-white/80">{region.name}</span>
                  </div>
                  <span className="text-sm font-medium text-white">{region.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Agents Table */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-6">Field Agents</h2>
        <ISPTable
          data={filteredAgents}
          columns={[
            {
              key: 'id',
              label: 'Agent ID',
              render: (item) => <span className="text-sm font-medium text-[#0099CC]">{item.id}</span>
            },
            {
              key: 'name',
              label: 'Agent Info',
              render: (item) => (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0099CC] to-[#0049B7] flex items-center justify-center text-white font-bold text-sm">
                    {item.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{item.name}</p>
                    <p className="text-xs text-white/60">{item.email}</p>
                  </div>
                </div>
              )
            },
            {
              key: 'region',
              label: 'Region',
              render: (item) => (
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4 text-white/40" />
                  <span className="text-sm text-white">{item.region}</span>
                </div>
              )
            },
            {
              key: 'performance',
              label: 'Performance',
              render: (item) => (
                <div className="space-y-1">
                  <p className={`text-sm font-medium ${
                    item.performance >= 90 ? 'text-emerald-400' : 
                    item.performance >= 75 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {item.performance}%
                  </p>
                  <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        item.performance >= 90 ? 'bg-gradient-to-r from-emerald-400 to-green-500' :
                        item.performance >= 75 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
                        'bg-gradient-to-r from-red-400 to-rose-500'
                      }`}
                      style={{ width: `${item.performance}%` }}
                    />
                  </div>
                </div>
              )
            },
            {
              key: 'customers',
              label: 'Metrics',
              render: (item) => (
                <div className="space-y-1">
                  <p className="text-sm text-white/80">
                    <span className="font-medium text-white">{item.customers}</span> customers
                  </p>
                  <p className="text-sm text-white/80">
                    ₹{(item.revenue / 1000).toFixed(1)}K revenue
                  </p>
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-[#FFD700] fill-current" />
                    <span className="text-xs text-[#FFD700]">{item.rating.toFixed(1)}</span>
                  </div>
                </div>
              )
            },
            {
              key: 'status',
              label: 'Status',
              render: (item) => {
                const statusColors = {
                  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                  inactive: 'bg-red-500/10 text-red-400 border-red-500/20',
                  'on-leave': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                }
                return (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[item.status]}`}>
                    {item.status.replace('-', ' ')}
                  </span>
                )
              }
            }
          ]}
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchPlaceholder="Search agents by name, ID, or email..."
        />
      </div>

      {/* Add Agent Modal */}
      <ISPModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          resetForm()
        }}
        title="Add New Agent"
        size="md"
      >
        <form onSubmit={(e) => {
          e.preventDefault()
          handleAdd()
        }} className="space-y-4">
          <ISPInput
            label="Agent Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter agent name"
            required
          />
          
          <ISPInput
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="agent@indivision.com"
            icon={<Mail className="h-4 w-4 text-white/40" />}
            required
          />
          
          <ISPInput
            label="Phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+91 98765 43210"
            icon={<Phone className="h-4 w-4 text-white/40" />}
            required
          />
          
          <ISPSelect
            label="Region"
            value={formData.region}
            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            options={[
              { value: 'Thiruvananthapuram', label: 'Thiruvananthapuram' },
              { value: 'Kochi', label: 'Kochi' },
              { value: 'Kozhikode', label: 'Kozhikode' }
            ]}
          />
          
          <ISPSelect
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'on-leave', label: 'On Leave' }
            ]}
          />
          
          <ISPInput
            label="Performance Score (%)"
            type="number"
            min="0"
            max="100"
            value={formData.performance}
            onChange={(e) => setFormData({ ...formData, performance: parseInt(e.target.value) })}
            placeholder="85"
            icon={<Target className="h-4 w-4 text-white/40" />}
            required
          />
          
          <ISPInput
            label="Active Customers"
            type="number"
            min="0"
            value={formData.customers}
            onChange={(e) => setFormData({ ...formData, customers: parseInt(e.target.value) })}
            placeholder="0"
            icon={<Users className="h-4 w-4 text-white/40" />}
            required
          />
          
          <ISPInput
            label="Rating"
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={formData.rating}
            onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
            placeholder="4.5"
            icon={<Star className="h-4 w-4 text-white/40" />}
            required
          />
          
          <div className="flex justify-end space-x-3 pt-4">
            <ISPButton
              type="button"
              variant="secondary"
              onClick={() => {
                setShowAddModal(false)
                resetForm()
              }}
            >
              Cancel
            </ISPButton>
            <ISPButton type="submit">
              Add Agent
            </ISPButton>
          </div>
        </form>
      </ISPModal>

      {/* Edit Agent Modal */}
      <ISPModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedAgent(null)
          resetForm()
        }}
        title="Edit Agent"
        size="md"
      >
        <form onSubmit={(e) => {
          e.preventDefault()
          handleUpdate()
        }} className="space-y-4">
          <ISPInput
            label="Agent Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter agent name"
            required
          />
          
          <ISPInput
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="agent@indivision.com"
            icon={<Mail className="h-4 w-4 text-white/40" />}
            required
          />
          
          <ISPInput
            label="Phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+91 98765 43210"
            icon={<Phone className="h-4 w-4 text-white/40" />}
            required
          />
          
          <ISPSelect
            label="Region"
            value={formData.region}
            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            options={[
              { value: 'Thiruvananthapuram', label: 'Thiruvananthapuram' },
              { value: 'Kochi', label: 'Kochi' },
              { value: 'Kozhikode', label: 'Kozhikode' }
            ]}
          />
          
          <ISPSelect
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'on-leave', label: 'On Leave' }
            ]}
          />
          
          <ISPInput
            label="Performance Score (%)"
            type="number"
            min="0"
            max="100"
            value={formData.performance}
            onChange={(e) => setFormData({ ...formData, performance: parseInt(e.target.value) })}
            placeholder="85"
            icon={<Target className="h-4 w-4 text-white/40" />}
            required
          />
          
          <ISPInput
            label="Active Customers"
            type="number"
            min="0"
            value={formData.customers}
            onChange={(e) => setFormData({ ...formData, customers: parseInt(e.target.value) })}
            placeholder="0"
            icon={<Users className="h-4 w-4 text-white/40" />}
            required
          />
          
          <ISPInput
            label="Rating"
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={formData.rating}
            onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
            placeholder="4.5"
            icon={<Star className="h-4 w-4 text-white/40" />}
            required
          />
          
          <div className="flex justify-end space-x-3 pt-4">
            <ISPButton
              type="button"
              variant="secondary"
              onClick={() => {
                setShowEditModal(false)
                setSelectedAgent(null)
                resetForm()
              }}
            >
              Cancel
            </ISPButton>
            <ISPButton type="submit">
              Update Agent
            </ISPButton>
          </div>
        </form>
      </ISPModal>
    </div>
  )
}
