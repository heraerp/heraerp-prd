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
  AlertCircle
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

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
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
      <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00DDFF] to-[#0049B7] flex items-center justify-center text-white font-bold text-lg">
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
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
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
            <p className="text-xl font-bold bg-gradient-to-r from-[#fff685] to-[#00DDFF] bg-clip-text text-transparent">
              ₹{(agent.revenue / 1000).toFixed(1)}K
            </p>
          </div>
          <div>
            <p className="text-xs text-white/60 mb-1">Commission</p>
            <p className="text-xl font-bold text-[#00DDFF]">₹{agent.commission.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-white/60 mb-1">Rating</p>
            <div className="flex items-center space-x-1">
              <span className="text-xl font-bold text-[#fff685]">{agent.rating}</span>
              <Star className="h-4 w-4 text-[#fff685] fill-current" />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 pt-4 border-t border-white/10">
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

export default function AgentsPage() {
  // Initial real data for instant loading
  const [agents, setAgents] = useState([
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
    { name: 'Thiruvananthapuram', value: 1200, color: '#00DDFF' },
    { name: 'Kochi', value: 1000, color: '#fff685' },
    { name: 'Kozhikode', value: 850, color: '#ff1d58' }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchAgentsData()
  }, [])

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
        <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-lg text-white font-medium hover:shadow-lg hover:shadow-[#00DDFF]/30 transition-all duration-300 mt-4 sm:mt-0">
          <Plus className="h-5 w-5" />
          <span>Add Agent</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
          <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-[#00DDFF]" />
              <span className="text-xs text-emerald-400 font-medium">+5.2%</span>
            </div>
            <p className="text-2xl font-bold text-white">{totalAgents}</p>
            <p className="text-xs text-white/60">Total Agents</p>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
          <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              <span className="text-xs text-white/60">{Math.round((activeAgents/totalAgents)*100)}%</span>
            </div>
            <p className="text-2xl font-bold text-white">{activeAgents}</p>
            <p className="text-xs text-white/60">Active Agents</p>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fff685] to-[#00DDFF] rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
          <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <UserCheck className="h-5 w-5 text-[#fff685]" />
              <span className="text-xs text-emerald-400 font-medium">+12.3%</span>
            </div>
            <p className="text-2xl font-bold text-white">{totalCustomers.toLocaleString()}</p>
            <p className="text-xs text-white/60">Total Customers</p>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#ff1d58] to-[#f75990] rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
          <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <IndianRupee className="h-5 w-5 text-[#ff1d58]" />
              <span className="text-xs text-emerald-400 font-medium">+8.7%</span>
            </div>
            <p className="text-2xl font-bold text-white">₹{(totalRevenue/100000).toFixed(1)}L</p>
            <p className="text-xs text-white/60">Total Revenue</p>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
          <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
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
            className="w-full pl-10 pr-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[#00DDFF] transition-colors"
          />
        </div>
        
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00DDFF] transition-colors"
        >
          <option value="all">All Regions</option>
          <option value="Thiruvananthapuram">Thiruvananthapuram</option>
          <option value="Kochi">Kochi</option>
          <option value="Kozhikode">Kozhikode</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00DDFF] transition-colors"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="on-leave">On Leave</option>
        </select>

        <button className="flex items-center space-x-2 px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors">
          <Download className="h-5 w-5" />
          <span>Export</span>
        </button>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Agent Network Growth</h2>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="agentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00DDFF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00DDFF" stopOpacity={0}/>
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
                  stroke="#00DDFF" 
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
          <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Regional Distribution</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={regionStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {regionStats.map((entry, index) => (
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
              {regionStats.map((region) => (
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

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <UserCheck className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/60">No agents found matching your criteria</p>
        </div>
      )}
    </div>
  )
}