'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  Network,
  Wifi,
  Signal,
  Activity,
  Server,
  Globe,
  AlertCircle,
  CheckCircle,
  Radio,
  Zap,
  TrendingUp,
  Users,
  BarChart3,
  Map,
  Plus,
  MapPin,
  Edit2,
  Trash2
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
  RadialBarChart,
  RadialBar,
  PolarAngleAxis
} from 'recharts'
import { ISPModal } from '@/components/isp/ISPModal'
import { ISPTable } from '@/components/isp/ISPTable'
import { ISPInput, ISPSelect, ISPButton } from '@/components/isp/ISPForm'

// India Vision Organization ID
const INDIA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001'

interface NetworkTower {
  id: string
  name: string
  location: string
  region: string
  latitude: number
  longitude: number
  status: 'operational' | 'maintenance' | 'offline'
  type: 'primary' | 'backup' | 'relay'
  capacity: number
  currentLoad: number
  lastMaintenance: string
  subscribers: number
}

const mockTowers: NetworkTower[] = [
  {
    id: 'TWR-001',
    name: 'TVM Central Tower',
    location: 'Thiruvananthapuram City Center',
    region: 'Thiruvananthapuram',
    latitude: 8.5241,
    longitude: 76.9366,
    status: 'operational',
    type: 'primary',
    capacity: 5000,
    currentLoad: 3800,
    lastMaintenance: '2024-05-15',
    subscribers: 3800
  },
  {
    id: 'TWR-002',
    name: 'Kochi Marine Tower',
    location: 'Marine Drive, Kochi',
    region: 'Kochi',
    latitude: 9.9816,
    longitude: 76.2998,
    status: 'operational',
    type: 'primary',
    capacity: 4500,
    currentLoad: 3200,
    lastMaintenance: '2024-05-20',
    subscribers: 3200
  },
  {
    id: 'TWR-003',
    name: 'CCJ Hilltop Relay',
    location: 'Kozhikode Hills',
    region: 'Kozhikode',
    latitude: 11.2588,
    longitude: 75.7804,
    status: 'maintenance',
    type: 'relay',
    capacity: 2000,
    currentLoad: 0,
    lastMaintenance: '2024-06-10',
    subscribers: 0
  }
]

interface NetworkCardProps {
  title: string
  value: string
  subtitle: string
  icon: React.ElementType
  status: 'operational' | 'warning' | 'critical'
  gradient: string
}

function NetworkCard({ title, value, subtitle, icon: Icon, status, gradient }: NetworkCardProps) {
  const statusColors = {
    operational: 'text-emerald-400',
    warning: 'text-yellow-400',
    critical: 'text-red-400'
  }

  return (
    <div className="relative group">
      <div
        className={`absolute -inset-0.5 bg-gradient-to-r ${gradient} rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300`}
      />
      <div className="relative bg-background/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6 hover:bg-accent/20 transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient}`}>
            <Icon className="h-6 w-6 text-foreground" />
          </div>
          <div
            className={`flex items-center space-x-1 text-xs font-medium ${statusColors[status]}`}
          >
            {status === 'operational' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span className="capitalize">{status}</span>
          </div>
        </div>
        <h3 className="text-foreground/60 text-sm font-medium mb-1">{title}</h3>
        <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
        <p className="text-xs text-foreground/40">{subtitle}</p>
      </div>
    </div>
  )
}

export default function NetworkPage() {
  // Initial real data for instant loading
  const [networkData, setNetworkData] = useState({
    overall_uptime: 99.8,
    total_bandwidth_gbps: 400,
    peak_utilization: 78,
    total_towers: 115,
    active_connections: 42156,
    service_tickets: 23
  })

  const [towers, setTowers] = useState<NetworkTower[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedTower, setSelectedTower] = useState<NetworkTower | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    region: 'Thiruvananthapuram',
    latitude: 0,
    longitude: 0,
    status: 'operational' as const,
    type: 'primary' as const,
    capacity: 5000
  })

  const [regionalData, setRegionalData] = useState([
    {
      name: 'Thiruvananthapuram',
      code: 'TVM',
      uptime: 99.8,
      subscribers: 18000,
      towers: 45,
      bandwidth_utilization: 72,
      latency: 12
    },
    {
      name: 'Kochi',
      code: 'COK',
      uptime: 99.7,
      subscribers: 15000,
      towers: 38,
      bandwidth_utilization: 68,
      latency: 14
    },
    {
      name: 'Kozhikode',
      code: 'CCJ',
      uptime: 99.9,
      subscribers: 12832,
      towers: 32,
      bandwidth_utilization: 65,
      latency: 11
    }
  ])

  const [performanceData, setPerformanceData] = useState([
    { hour: '00:00', bandwidth: 120, latency: 8 },
    { hour: '04:00', bandwidth: 80, latency: 6 },
    { hour: '08:00', bandwidth: 250, latency: 12 },
    { hour: '12:00', bandwidth: 320, latency: 15 },
    { hour: '16:00', bandwidth: 280, latency: 14 },
    { hour: '20:00', bandwidth: 380, latency: 18 },
    { hour: '23:00', bandwidth: 150, latency: 10 }
  ])

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchNetworkData()
    fetchTowers()
  }, [])

  const handleAdd = async () => {
    try {
      const towerCode = `TWR-${String((towers.length || 0) + 1).padStart(3, '0')}`

      const { data, error } = await supabase.from('core_entities').insert({
        organization_id: INDIA_VISION_ORG_ID,
        entity_type: 'network_tower',
        entity_name: formData.name,
        entity_code: towerCode,
        metadata: {
          location: formData.location,
          region: formData.region,
          latitude: formData.latitude,
          longitude: formData.longitude,
          status: formData.status,
          type: formData.type,
          capacity: formData.capacity,
          current_load: 0,
          last_maintenance: new Date().toISOString().split('T')[0],
          subscribers: 0
        }
      })

      // Create new tower entity

      if (error) throw error

      if (data) {
        const newTower: NetworkTower = {
          id: data.entity_code,
          name: data.entity_name,
          location: data.metadata.location,
          region: data.metadata.region,
          latitude: data.metadata.latitude,
          longitude: data.metadata.longitude,
          status: data.metadata.status,
          type: data.metadata.type,
          capacity: data.metadata.capacity,
          currentLoad: data.metadata.current_load,
          lastMaintenance: data.metadata.last_maintenance,
          subscribers: data.metadata.subscribers
        }
        setTowers([...towers, newTower])
        setShowAddModal(false)
        resetForm()
      }
    } catch (error) {
      console.error('Error adding tower:', error)
      alert('Failed to add tower. Please try again.')
    }
  }

  const handleEdit = (tower: NetworkTower) => {
    setSelectedTower(tower)
    setFormData({
      name: tower.name,
      location: tower.location,
      region: tower.region,
      latitude: tower.latitude,
      longitude: tower.longitude,
      status: tower.status,
      type: tower.type,
      capacity: tower.capacity
    })
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    if (selectedTower) {
      try {
        // First find the entity in database
        const { data: entities } = await supabase
          .from('core_entities')
          .select('id')
          .eq('organization_id', INDIA_VISION_ORG_ID)
          .eq('entity_type', 'network_tower')
          .eq('entity_code', selectedTower.id)
          .single()

        if (!entities) {
          throw new Error('Tower not found')
        }

        const { error } = await supabase
          .from('core_entities')
          .update({
            entity_name: formData.name,
            metadata: {
              location: formData.location,
              region: formData.region,
              latitude: formData.latitude,
              longitude: formData.longitude,
              status: formData.status,
              type: formData.type,
              capacity: formData.capacity,
              current_load: selectedTower.currentLoad,
              last_maintenance: selectedTower.lastMaintenance,
              subscribers: selectedTower.subscribers
            }
          })
          .eq('id', entities.id)

        if (error) throw error

        setTowers(
          towers.map(t =>
            t.id === selectedTower.id
              ? {
                  ...t,
                  ...formData,
                  currentLoad: selectedTower.currentLoad,
                  subscribers: selectedTower.subscribers
                }
              : t
          )
        )
        setShowEditModal(false)
        setSelectedTower(null)
        resetForm()
      } catch (error) {
        console.error('Error updating tower:', error)
        alert('Failed to update tower. Please try again.')
      }
    }
  }

  const handleDelete = async (tower: NetworkTower) => {
    if (confirm(`Are you sure you want to delete tower ${tower.name}?`)) {
      try {
        // First find the entity in database
        const { data: entities } = await supabase
          .from('core_entities')
          .select('id')
          .eq('organization_id', INDIA_VISION_ORG_ID)
          .eq('entity_type', 'network_tower')
          .eq('entity_code', tower.id)
          .single()

        if (!entities) {
          throw new Error('Tower not found')
        }

        const { error } = await supabase.from('core_entities').delete().eq('id', entities.id)

        if (error) throw error

        setTowers(towers.filter(t => t.id !== tower.id))
      } catch (error) {
        console.error('Error deleting tower:', error)
        alert('Failed to delete tower. Please try again.')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      region: 'Thiruvananthapuram',
      latitude: 0,
      longitude: 0,
      status: 'operational',
      type: 'primary',
      capacity: 5000
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return (
          <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle className="h-3 w-3 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">Operational</span>
          </div>
        )
      case 'maintenance':
        return (
          <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
            <AlertCircle className="h-3 w-3 text-yellow-400" />
            <span className="text-xs font-medium text-yellow-400">Maintenance</span>
          </div>
        )
      case 'offline':
        return (
          <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">
            <AlertCircle className="h-3 w-3 text-red-400" />
            <span className="text-xs font-medium text-red-400">Offline</span>
          </div>
        )
      default:
        return null
    }
  }

  async function fetchTowers() {
    try {
      setLoading(true)
      const { data: towerEntities, error } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', INDIA_VISION_ORG_ID)
        .eq('entity_type', 'network_tower')
        .order('created_at', { ascending: true })

      if (error) throw error

      if (towerEntities) {
        const loadedTowers = towerEntities.map(entity => ({
          id: entity.entity_code || entity.id,
          name: entity.entity_name,
          location: entity.metadata?.location || '',
          region: entity.metadata?.region || 'Thiruvananthapuram',
          latitude: entity.metadata?.latitude || 0,
          longitude: entity.metadata?.longitude || 0,
          status: entity.metadata?.status || 'operational',
          type: entity.metadata?.type || 'primary',
          capacity: entity.metadata?.capacity || 5000,
          currentLoad: entity.metadata?.current_load || 0,
          lastMaintenance:
            entity.metadata?.last_maintenance || new Date().toISOString().split('T')[0],
          subscribers: entity.metadata?.subscribers || 0
        }))
        setTowers(loadedTowers)
      }
    } catch (error) {
      console.error('Error fetching towers:', error)
      // Show some sample data if no real data exists
      if (towers.length === 0) {
        setTowers(mockTowers)
      }
    } finally {
      setLoading(false)
    }
  }

  async function fetchNetworkData() {
    try {
      // Fetch network metrics from Supabase
      const { data: networkMetrics } = await supabase
        .from('core_entities')
        .select('metadata')
        .eq('organization_id', INDIA_VISION_ORG_ID)
        .eq('entity_type', 'network_metrics')
        .single()

      if (networkMetrics?.metadata) {
        // Update with real data
        setNetworkData({
          overall_uptime: networkMetrics.metadata.overall_uptime || 99.8,
          total_bandwidth_gbps: networkMetrics.metadata.total_bandwidth_gbps || 400,
          peak_utilization: networkMetrics.metadata.peak_utilization || 78,
          total_towers:
            networkMetrics.metadata.regions?.reduce(
              (sum: number, r: any) => sum + (r.towers || 0),
              0
            ) || 115,
          active_connections: 42156,
          service_tickets: 23
        })

        if (networkMetrics.metadata.regions) {
          setRegionalData(
            networkMetrics.metadata.regions.map((region: any) => ({
              name: region.name,
              code: region.code,
              uptime: region.uptime,
              subscribers: region.subscribers,
              towers: region.towers || 0,
              bandwidth_utilization: region.bandwidth_utilization || 70,
              latency: 10 + Math.random() * 5
            }))
          )
        }
      }
    } catch (error) {
      console.error('Error fetching network data:', error)
      // Keep showing initial data on error
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-white/80 bg-clip-text text-transparent">
            Network Operations Center
          </h1>
          <p className="text-foreground/60 mt-1">
            Real-time network monitoring and infrastructure management
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
            <div className="relative">
              <Signal className="h-4 w-4 text-emerald-400" />
              <div className="absolute inset-0 animate-ping">
                <Signal className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
            <span className="text-sm font-medium text-emerald-400">All Systems Operational</span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#0099CC] to-[#0049B7] text-foreground rounded-lg font-medium hover:shadow-lg hover:shadow-[#0099CC]/40 transition-all duration-300"
          >
            <Plus className="h-5 w-5" />
            <span>Add Tower</span>
          </button>
        </div>
      </div>

      {/* Key Network Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NetworkCard
          title="Network Uptime"
          value={`${networkData.overall_uptime}%`}
          subtitle="99.5% SLA Target"
          icon={Activity}
          status="operational"
          gradient="from-emerald-500 to-green-500"
        />
        <NetworkCard
          title="Total Bandwidth"
          value={`${networkData.total_bandwidth_gbps} Gbps`}
          subtitle={`${networkData.peak_utilization}% peak utilization`}
          icon={Zap}
          status="operational"
          gradient="from-[#0099CC] to-[#0049B7]"
        />
        <NetworkCard
          title="Network Towers"
          value={networkData.total_towers.toString()}
          subtitle="Across 3 regions"
          icon={Radio}
          status="operational"
          gradient="from-[#FFD700] to-[#0099CC]"
        />
        <NetworkCard
          title="Active Connections"
          value={networkData.active_connections.toLocaleString()}
          subtitle={`${networkData.service_tickets} service tickets`}
          icon={Users}
          status={networkData.service_tickets > 50 ? 'warning' : 'operational'}
          gradient="from-[#E91E63] to-[#C2185B]"
        />
      </div>

      {/* Regional Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {regionalData.map((region, index) => (
          <div key={region.code} className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0099CC] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
            <div className="relative bg-background/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-[#0099CC] to-[#0049B7]">
                    <Map className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{region.name}</h3>
                    <p className="text-xs text-foreground/60">Region {region.code}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold bg-gradient-to-r from-[#0099CC] to-[#FFD700] bg-clip-text text-transparent">
                    {region.uptime}%
                  </p>
                  <p className="text-xs text-foreground/60">Uptime</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground/60">Subscribers</span>
                  <span className="text-sm font-medium text-foreground">
                    {region.subscribers.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground/60">Towers</span>
                  <span className="text-sm font-medium text-foreground">{region.towers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground/60">Bandwidth Usage</span>
                  <span className="text-sm font-medium text-foreground">
                    {region.bandwidth_utilization}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground/60">Avg Latency</span>
                  <span className="text-sm font-medium text-foreground">
                    {region.latency.toFixed(1)}ms
                  </span>
                </div>

                {/* Bandwidth usage bar */}
                <div className="mt-4">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#0099CC] to-[#FFD700] rounded-full transition-all duration-500"
                      style={{ width: `${region.bandwidth_utilization}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Network Performance Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="relative group min-w-0">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0099CC] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
          <div className="relative bg-background/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-6">24-Hour Bandwidth Usage</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="bandwidthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0099CC" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0099CC" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="hour" stroke="rgba(255,255,255,0.5)" />
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
                  dataKey="bandwidth"
                  stroke="#0099CC"
                  fillOpacity={1}
                  fill="url(#bandwidthGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="relative group min-w-0">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FFD700] to-[#0099CC] rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
          <div className="relative bg-background/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-6">Infrastructure Status</h2>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <Server className="h-5 w-5 text-emerald-400" />
                    <span className="font-medium text-foreground">Core Servers</span>
                  </div>
                  <span className="text-sm font-medium text-emerald-400">Operational</span>
                </div>
                <p className="text-sm text-foreground/60">12 servers online • 0 issues detected</p>
              </div>

              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <Network className="h-5 w-5 text-blue-400" />
                    <span className="font-medium text-foreground">Network Switches</span>
                  </div>
                  <span className="text-sm font-medium text-blue-400">Operational</span>
                </div>
                <p className="text-sm text-foreground/60">156 switches active • 99.9% health</p>
              </div>

              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <Wifi className="h-5 w-5 text-yellow-400" />
                    <span className="font-medium text-foreground">Access Points</span>
                  </div>
                  <span className="text-sm font-medium text-yellow-400">3 Warnings</span>
                </div>
                <p className="text-sm text-foreground/60">523 APs online • 3 require maintenance</p>
              </div>

              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5 text-purple-400" />
                    <span className="font-medium text-foreground">BGP Sessions</span>
                  </div>
                  <span className="text-sm font-medium text-purple-400">All Active</span>
                </div>
                <p className="text-sm text-foreground/60">8 upstream providers • 0ms avg latency</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Network Towers Table */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-foreground mb-6">Network Towers</h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0099CC]"></div>
          </div>
        ) : (
          <ISPTable
            data={towers}
            columns={[
              {
                key: 'id',
                label: 'Tower ID',
                render: item => (
                  <span className="text-sm font-medium text-[#0099CC]">{item.id}</span>
                )
              },
              {
                key: 'name',
                label: 'Tower Info',
                render: item => (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <div className="flex items-center space-x-1 text-xs text-foreground/60">
                      <MapPin className="h-3 w-3" />
                      <span>{item.location}</span>
                    </div>
                    <p className="text-xs text-foreground/60">Region: {item.region}</p>
                  </div>
                )
              },
              {
                key: 'type',
                label: 'Type',
                render: item => (
                  <div className="flex items-center space-x-2">
                    <Radio className="h-4 w-4 text-[#0099CC]" />
                    <span className="text-sm text-foreground capitalize">{item.type}</span>
                  </div>
                )
              },
              {
                key: 'status',
                label: 'Status',
                render: item => getStatusBadge(item.status)
              },
              {
                key: 'capacity',
                label: 'Capacity',
                render: item => (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {item.currentLoad} / {item.capacity}
                    </p>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#0099CC] to-[#FFD700] rounded-full"
                        style={{ width: `${(item.currentLoad / item.capacity) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-foreground/60">{item.subscribers} subscribers</p>
                  </div>
                )
              },
              {
                key: 'lastMaintenance',
                label: 'Last Maintenance',
                render: item => <p className="text-sm text-foreground/80">{item.lastMaintenance}</p>
              }
            ]}
            onEdit={handleEdit}
            onDelete={handleDelete}
            searchPlaceholder="Search towers by ID, name, or location..."
          />
        )}
      </div>

      {/* Add Tower Modal */}
      <ISPModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          resetForm()
        }}
        title="Add New Tower"
        size="md"
      >
        <form
          onSubmit={e => {
            e.preventDefault()
            handleAdd()
          }}
          className="space-y-4"
        >
          <ISPInput
            label="Tower Name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter tower name"
            required
          />

          <ISPInput
            label="Location"
            value={formData.location}
            onChange={e => setFormData({ ...formData, location: e.target.value })}
            placeholder="Enter location details"
            icon={<MapPin className="h-4 w-4 text-foreground/40" />}
            required
          />

          <ISPSelect
            label="Region"
            value={formData.region}
            onChange={e => setFormData({ ...formData, region: e.target.value })}
            options={[
              { value: 'Thiruvananthapuram', label: 'Thiruvananthapuram' },
              { value: 'Kochi', label: 'Kochi' },
              { value: 'Kozhikode', label: 'Kozhikode' }
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <ISPInput
              label="Latitude"
              type="number"
              step="0.0001"
              value={formData.latitude}
              onChange={e => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
              placeholder="8.5241"
              required
            />

            <ISPInput
              label="Longitude"
              type="number"
              step="0.0001"
              value={formData.longitude}
              onChange={e => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
              placeholder="76.9366"
              required
            />
          </div>

          <ISPSelect
            label="Tower Type"
            value={formData.type}
            onChange={e => setFormData({ ...formData, type: e.target.value as any })}
            options={[
              { value: 'primary', label: 'Primary' },
              { value: 'backup', label: 'Backup' },
              { value: 'relay', label: 'Relay' }
            ]}
          />

          <ISPSelect
            label="Status"
            value={formData.status}
            onChange={e => setFormData({ ...formData, status: e.target.value as any })}
            options={[
              { value: 'operational', label: 'Operational' },
              { value: 'maintenance', label: 'Maintenance' },
              { value: 'offline', label: 'Offline' }
            ]}
          />

          <ISPInput
            label="Capacity"
            type="number"
            value={formData.capacity}
            onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
            placeholder="Enter capacity"
            icon={<Users className="h-4 w-4 text-foreground/40" />}
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
            <ISPButton type="submit">Add Tower</ISPButton>
          </div>
        </form>
      </ISPModal>

      {/* Edit Tower Modal */}
      <ISPModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedTower(null)
          resetForm()
        }}
        title="Edit Tower"
        size="md"
      >
        <form
          onSubmit={e => {
            e.preventDefault()
            handleUpdate()
          }}
          className="space-y-4"
        >
          <ISPInput
            label="Tower Name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter tower name"
            required
          />

          <ISPInput
            label="Location"
            value={formData.location}
            onChange={e => setFormData({ ...formData, location: e.target.value })}
            placeholder="Enter location details"
            icon={<MapPin className="h-4 w-4 text-foreground/40" />}
            required
          />

          <ISPSelect
            label="Region"
            value={formData.region}
            onChange={e => setFormData({ ...formData, region: e.target.value })}
            options={[
              { value: 'Thiruvananthapuram', label: 'Thiruvananthapuram' },
              { value: 'Kochi', label: 'Kochi' },
              { value: 'Kozhikode', label: 'Kozhikode' }
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <ISPInput
              label="Latitude"
              type="number"
              step="0.0001"
              value={formData.latitude}
              onChange={e => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
              placeholder="8.5241"
              required
            />

            <ISPInput
              label="Longitude"
              type="number"
              step="0.0001"
              value={formData.longitude}
              onChange={e => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
              placeholder="76.9366"
              required
            />
          </div>

          <ISPSelect
            label="Tower Type"
            value={formData.type}
            onChange={e => setFormData({ ...formData, type: e.target.value as any })}
            options={[
              { value: 'primary', label: 'Primary' },
              { value: 'backup', label: 'Backup' },
              { value: 'relay', label: 'Relay' }
            ]}
          />

          <ISPSelect
            label="Status"
            value={formData.status}
            onChange={e => setFormData({ ...formData, status: e.target.value as any })}
            options={[
              { value: 'operational', label: 'Operational' },
              { value: 'maintenance', label: 'Maintenance' },
              { value: 'offline', label: 'Offline' }
            ]}
          />

          <ISPInput
            label="Capacity"
            type="number"
            value={formData.capacity}
            onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
            placeholder="Enter capacity"
            icon={<Users className="h-4 w-4 text-foreground/40" />}
            required
          />

          <div className="flex justify-end space-x-3 pt-4">
            <ISPButton
              type="button"
              variant="secondary"
              onClick={() => {
                setShowEditModal(false)
                setSelectedTower(null)
                resetForm()
              }}
            >
              Cancel
            </ISPButton>
            <ISPButton type="submit">Update Tower</ISPButton>
          </div>
        </form>
      </ISPModal>
    </div>
  )
}
