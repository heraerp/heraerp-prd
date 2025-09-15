'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  Building2,
  Search,
  Filter,
  Download,
  Plus,
  ChevronRight,
  Calendar,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Eye,
  Edit,
  MoreVertical,
  Package,
  Truck,
  Monitor,
  Server,
  Wrench,
  MapPin,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts'

// India Vision Organization ID
const KERALA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001'

interface Asset {
  id: string
  assetCode: string
  assetName: string
  category: string
  purchaseDate: string
  purchaseValue: number
  currentValue: number
  depreciation: number
  location: string
  status: 'active' | 'maintenance' | 'disposed' | 'inactive'
  assignedTo?: string
  lastMaintenanceDate?: string
  nextMaintenanceDate?: string
  warrantyExpiry?: string
}

export default function FixedAssetsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'depreciation'>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fixed Assets Overview
  const [assetMetrics] = useState({
    totalAssets: 347,
    totalValue: 82000000,
    currentValue: 65000000,
    ytdDepreciation: 17000000,
    maintenanceDue: 23,
    newAcquisitions: 15
  })

  // Asset Categories
  const [categoryBreakdown] = useState([
    { name: 'Network Equipment', value: 45000000, count: 156, color: '#00DDFF' },
    { name: 'Buildings & Facilities', value: 17000000, count: 8, color: '#10b981' },
    { name: 'Vehicles', value: 8000000, count: 24, color: '#fff685' },
    { name: 'IT Equipment', value: 7000000, count: 142, color: '#f59e0b' },
    { name: 'Office Furniture', value: 5000000, count: 17, color: '#8b5cf6' }
  ])

  // Depreciation Trend
  const [depreciationTrend] = useState([
    { month: 'Jan', value: 80000000, depreciation: 1200000 },
    { month: 'Feb', value: 78800000, depreciation: 1200000 },
    { month: 'Mar', value: 77600000, depreciation: 1200000 },
    { month: 'Apr', value: 75200000, depreciation: 2400000 },
    { month: 'May', value: 73000000, depreciation: 2200000 },
    { month: 'Jun', value: 65000000, depreciation: 8000000 }
  ])

  // Asset List
  const [assets] = useState<Asset[]>([
    {
      id: '1',
      assetCode: 'NET-001',
      assetName: 'Core Router - Cisco ASR 9000',
      category: 'Network Equipment',
      purchaseDate: '2022-03-15',
      purchaseValue: 15000000,
      currentValue: 12000000,
      depreciation: 3000000,
      location: 'Data Center 1',
      status: 'active',
      assignedTo: 'Network Operations',
      lastMaintenanceDate: '2024-05-15',
      nextMaintenanceDate: '2024-08-15',
      warrantyExpiry: '2025-03-15'
    },
    {
      id: '2',
      assetCode: 'BLD-001',
      assetName: 'Head Office Building',
      category: 'Buildings & Facilities',
      purchaseDate: '2018-06-01',
      purchaseValue: 25000000,
      currentValue: 17000000,
      depreciation: 8000000,
      location: 'Thiruvananthapuram',
      status: 'active',
      assignedTo: 'Corporate Office'
    },
    {
      id: '3',
      assetCode: 'VEH-001',
      assetName: 'Service Van - Toyota Hiace',
      category: 'Vehicles',
      purchaseDate: '2023-01-10',
      purchaseValue: 3500000,
      currentValue: 2800000,
      depreciation: 700000,
      location: 'Field Operations',
      status: 'active',
      assignedTo: 'Field Team 1',
      lastMaintenanceDate: '2024-06-01',
      nextMaintenanceDate: '2024-09-01'
    },
    {
      id: '4',
      assetCode: 'IT-045',
      assetName: 'Dell PowerEdge R740 Server',
      category: 'IT Equipment',
      purchaseDate: '2023-08-20',
      purchaseValue: 1200000,
      currentValue: 960000,
      depreciation: 240000,
      location: 'Data Center 2',
      status: 'maintenance',
      assignedTo: 'IT Infrastructure',
      warrantyExpiry: '2026-08-20'
    }
  ])

  // Acquisition Timeline
  const [acquisitionData] = useState([
    { month: 'Jan', acquisitions: 2, value: 3500000 },
    { month: 'Feb', acquisitions: 1, value: 1200000 },
    { month: 'Mar', acquisitions: 3, value: 5600000 },
    { month: 'Apr', acquisitions: 2, value: 2800000 },
    { month: 'May', acquisitions: 4, value: 7200000 },
    { month: 'Jun', acquisitions: 3, value: 4500000 }
  ])

  const supabase = createClientComponentClient()

  const refreshData = async () => {
    setIsRefreshing(true)
    // Fetch asset data from Supabase
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/20 text-emerald-400'
      case 'maintenance':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'disposed':
        return 'bg-red-500/20 text-red-400'
      case 'inactive':
        return 'bg-gray-500/20 text-gray-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Network Equipment':
        return Server
      case 'Buildings & Facilities':
        return Building2
      case 'Vehicles':
        return Truck
      case 'IT Equipment':
        return Monitor
      case 'Office Furniture':
        return Package
      default:
        return Package
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Fixed Assets
          </h1>
          <p className="text-white/60 mt-1">Manage and track company assets and depreciation</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={refreshData}
            className={`flex items-center space-x-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white hover:bg-white/10 transition-all duration-300 ${isRefreshing ? 'animate-pulse' : ''}`}
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300">
            <Plus className="h-5 w-5" />
            <span>New Asset</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white/5 backdrop-blur-xl p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-md font-medium transition-all duration-300 ${
            activeTab === 'overview'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('assets')}
          className={`px-4 py-2 rounded-md font-medium transition-all duration-300 ${
            activeTab === 'assets'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Asset Register
        </button>
        <button
          onClick={() => setActiveTab('depreciation')}
          className={`px-4 py-2 rounded-md font-medium transition-all duration-300 ${
            activeTab === 'depreciation'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Depreciation
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xs text-purple-400 font-medium">
                    {assetMetrics.totalAssets} assets
                  </span>
                </div>
                <h3 className="text-white/60 text-sm font-medium mb-1">Total Asset Value</h3>
                <p className="text-2xl font-bold text-white">
                  ₹{(assetMetrics.totalValue / 10000000).toFixed(1)} Cr
                </p>
                <p className="text-xs text-white/40 mt-1">Purchase value</p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-[#00DDFF] to-[#0049B7]">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <TrendingDown className="h-4 w-4 text-red-400" />
                </div>
                <h3 className="text-white/60 text-sm font-medium mb-1">Current Value</h3>
                <p className="text-2xl font-bold text-white">
                  ₹{(assetMetrics.currentValue / 10000000).toFixed(1)} Cr
                </p>
                <p className="text-xs text-white/40 mt-1">After depreciation</p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600">
                    <Wrench className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xs text-yellow-400 font-medium">Due soon</span>
                </div>
                <h3 className="text-white/60 text-sm font-medium mb-1">Maintenance Due</h3>
                <p className="text-2xl font-bold text-white">{assetMetrics.maintenanceDue}</p>
                <p className="text-xs text-white/40 mt-1">Assets need service</p>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Asset Categories */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Asset Categories</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <RePieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px'
                      }}
                      formatter={(value: any) => `₹${(value / 10000000).toFixed(1)} Cr`}
                    />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {categoryBreakdown.map(item => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-white/80">{item.name}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-white/60">{item.count} items</span>
                        <span className="text-sm font-medium text-white">
                          ₹{(item.value / 10000000).toFixed(1)} Cr
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* New Acquisitions */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-white mb-6">
                  New Acquisitions (6 Months)
                </h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={acquisitionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" tickFormatter={value => `${value}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px'
                      }}
                      formatter={(value: any, name: string) => {
                        if (name === 'value') return `₹${(value / 100000).toFixed(1)} L`
                        return value
                      }}
                    />
                    <Bar dataKey="acquisitions" fill="#00DDFF" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'assets' && (
        <>
          {/* Assets Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="all">All Categories</option>
              <option value="network">Network Equipment</option>
              <option value="buildings">Buildings & Facilities</option>
              <option value="vehicles">Vehicles</option>
              <option value="it">IT Equipment</option>
              <option value="furniture">Office Furniture</option>
            </select>

            <button className="flex items-center space-x-2 px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors">
              <Download className="h-5 w-5" />
              <span>Export</span>
            </button>
          </div>

          {/* Assets List */}
          <div className="space-y-4">
            {assets.map(asset => {
              const Icon = getCategoryIcon(asset.category)
              return (
                <div key={asset.id} className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                  <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Icon className="h-5 w-5 text-purple-400" />
                          <h3 className="text-lg font-semibold text-white">{asset.assetName}</h3>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-white/10 text-white/60">
                            {asset.assetCode}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}
                          >
                            {asset.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-white/60 mb-1">Purchase Value</p>
                            <p className="text-lg font-semibold text-white">
                              ₹{(asset.purchaseValue / 100000).toFixed(2)} L
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-white/60 mb-1">Current Value</p>
                            <p className="text-lg font-semibold text-emerald-400">
                              ₹{(asset.currentValue / 100000).toFixed(2)} L
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-white/60 mb-1">Depreciation</p>
                            <p className="text-lg font-semibold text-red-400">
                              ₹{(asset.depreciation / 100000).toFixed(2)} L
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-white/60 mb-1">Location</p>
                            <p className="text-lg font-semibold text-white flex items-center">
                              <MapPin className="h-4 w-4 mr-1 text-white/40" />
                              {asset.location}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6 text-sm text-white/60">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Purchased: {new Date(asset.purchaseDate).toLocaleDateString()}
                            </span>
                          </div>
                          {asset.assignedTo && (
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4" />
                              <span>Assigned: {asset.assignedTo}</span>
                            </div>
                          )}
                          {asset.nextMaintenanceDate && (
                            <div className="flex items-center space-x-2">
                              <Wrench className="h-4 w-4" />
                              <span>
                                Next service:{' '}
                                {new Date(asset.nextMaintenanceDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button className="ml-4 text-white/40 hover:text-white transition-colors">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {activeTab === 'depreciation' && (
        <>
          {/* Depreciation Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrendingDown className="h-8 w-8 text-red-400" />
                  <span className="text-xs text-red-400 font-medium">YTD</span>
                </div>
                <h3 className="text-white/60 text-sm font-medium mb-1">Total Depreciation</h3>
                <p className="text-2xl font-bold text-white">
                  ₹{(assetMetrics.ytdDepreciation / 10000000).toFixed(1)} Cr
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <BarChart3 className="h-8 w-8 text-yellow-400" />
                  <span className="text-xs text-yellow-400 font-medium">Monthly</span>
                </div>
                <h3 className="text-white/60 text-sm font-medium mb-1">Avg Monthly Rate</h3>
                <p className="text-2xl font-bold text-white">₹{(2833333 / 100000).toFixed(1)} L</p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <PieChart className="h-8 w-8 text-purple-400" />
                  <span className="text-xs text-purple-400 font-medium">Rate</span>
                </div>
                <h3 className="text-white/60 text-sm font-medium mb-1">Depreciation %</h3>
                <p className="text-2xl font-bold text-white">20.7%</p>
              </div>
            </div>
          </div>

          {/* Depreciation Chart */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">
                Asset Value & Depreciation Trend
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={depreciationTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                  <YAxis
                    stroke="rgba(255,255,255,0.5)"
                    tickFormatter={value => `₹${(value / 10000000).toFixed(0)}Cr`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px'
                    }}
                    formatter={(value: any) => `₹${(value / 10000000).toFixed(1)} Cr`}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="depreciation"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
