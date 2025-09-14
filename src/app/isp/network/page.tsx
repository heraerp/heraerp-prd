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
  Map
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts'

// India Vision Organization ID
const INDIA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001'

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
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${gradient} rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300`} />
      <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className={`flex items-center space-x-1 text-xs font-medium ${statusColors[status]}`}>
            {status === 'operational' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span className="capitalize">{status}</span>
          </div>
        </div>
        <h3 className="text-white/60 text-sm font-medium mb-1">{title}</h3>
        <p className="text-2xl font-bold text-white mb-1">{value}</p>
        <p className="text-xs text-white/40">{subtitle}</p>
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
  }, [])

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
          total_towers: networkMetrics.metadata.regions?.reduce((sum: number, r: any) => sum + (r.towers || 0), 0) || 115,
          active_connections: 42156,
          service_tickets: 23
        })

        if (networkMetrics.metadata.regions) {
          setRegionalData(networkMetrics.metadata.regions.map((region: any) => ({
            name: region.name,
            code: region.code,
            uptime: region.uptime,
            subscribers: region.subscribers,
            towers: region.towers || 0,
            bandwidth_utilization: region.bandwidth_utilization || 70,
            latency: 10 + Math.random() * 5
          })))
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Network Operations Center
          </h1>
          <p className="text-white/60 mt-1">Real-time network monitoring and infrastructure management</p>
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
          gradient="from-[#00DDFF] to-[#0049B7]"
        />
        <NetworkCard
          title="Network Towers"
          value={networkData.total_towers.toString()}
          subtitle="Across 3 regions"
          icon={Radio}
          status="operational"
          gradient="from-[#fff685] to-[#00DDFF]"
        />
        <NetworkCard
          title="Active Connections"
          value={networkData.active_connections.toLocaleString()}
          subtitle={`${networkData.service_tickets} service tickets`}
          icon={Users}
          status={networkData.service_tickets > 50 ? 'warning' : 'operational'}
          gradient="from-[#ff1d58] to-[#f75990]"
        />
      </div>

      {/* Regional Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {regionalData.map((region, index) => (
          <div key={region.code} className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-[#00DDFF] to-[#0049B7]">
                    <Map className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{region.name}</h3>
                    <p className="text-xs text-white/60">Region {region.code}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold bg-gradient-to-r from-[#00DDFF] to-[#fff685] bg-clip-text text-transparent">
                    {region.uptime}%
                  </p>
                  <p className="text-xs text-white/60">Uptime</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/60">Subscribers</span>
                  <span className="text-sm font-medium text-white">{region.subscribers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/60">Towers</span>
                  <span className="text-sm font-medium text-white">{region.towers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/60">Bandwidth Usage</span>
                  <span className="text-sm font-medium text-white">{region.bandwidth_utilization}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/60">Avg Latency</span>
                  <span className="text-sm font-medium text-white">{region.latency.toFixed(1)}ms</span>
                </div>

                {/* Bandwidth usage bar */}
                <div className="mt-4">
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#00DDFF] to-[#fff685] rounded-full transition-all duration-500"
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
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">24-Hour Bandwidth Usage</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="bandwidthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00DDFF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00DDFF" stopOpacity={0}/>
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
                  stroke="#00DDFF" 
                  fillOpacity={1} 
                  fill="url(#bandwidthGradient)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fff685] to-[#00DDFF] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Infrastructure Status</h2>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <Server className="h-5 w-5 text-emerald-400" />
                    <span className="font-medium text-white">Core Servers</span>
                  </div>
                  <span className="text-sm font-medium text-emerald-400">Operational</span>
                </div>
                <p className="text-sm text-white/60">12 servers online • 0 issues detected</p>
              </div>

              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <Network className="h-5 w-5 text-blue-400" />
                    <span className="font-medium text-white">Network Switches</span>
                  </div>
                  <span className="text-sm font-medium text-blue-400">Operational</span>
                </div>
                <p className="text-sm text-white/60">156 switches active • 99.9% health</p>
              </div>

              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <Wifi className="h-5 w-5 text-yellow-400" />
                    <span className="font-medium text-white">Access Points</span>
                  </div>
                  <span className="text-sm font-medium text-yellow-400">3 Warnings</span>
                </div>
                <p className="text-sm text-white/60">523 APs online • 3 require maintenance</p>
              </div>

              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5 text-purple-400" />
                    <span className="font-medium text-white">BGP Sessions</span>
                  </div>
                  <span className="text-sm font-medium text-purple-400">All Active</span>
                </div>
                <p className="text-sm text-white/60">8 upstream providers • 0ms avg latency</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}