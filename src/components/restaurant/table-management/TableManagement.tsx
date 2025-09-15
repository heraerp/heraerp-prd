'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  LayoutGrid,
  Plus,
  Settings,
  Users,
  Clock,
  MapPin,
  TrendingUp,
  RefreshCw,
  Calendar,
  Filter,
  Search,
  Edit,
  Trash2,
  Save,
  X,
  ChevronDown,
  Activity,
  DollarSign,
  Timer,
  Utensils,
  Palette,
  Move,
  Split,
  Merge,
  QrCode,
  Wifi,
  Accessibility,
  Eye,
  Volume2,
  Cigarette,
  Baby,
  Star
} from 'lucide-react'
import { TableFloorPlan } from './TableFloorPlan'
import { TableCRUD } from './TableCRUD'
import { TableReservations } from './TableReservations'
import { TableAnalytics } from './TableAnalytics'
import { TableSettings } from './TableSettings'
import { TableCombination } from './TableCombination'
import { RealTimeStatus } from './RealTimeStatus'
// import { useRealTimeTableUpdates, useConnectionStatus } from '@/hooks/useRealTimeTableUpdates'

interface Table {
  id: string
  table_number: string
  capacity: number
  min_capacity?: number
  location: 'indoor' | 'outdoor' | 'patio' | 'bar' | 'private'
  status: 'available' | 'occupied' | 'reserved' | 'cleaning' | 'maintenance'
  shape: 'square' | 'rectangle' | 'round' | 'oval'
  x_position: number
  y_position: number
  width: number
  height: number
  rotation: number
  features: string[]
  pricing_tier: 'standard' | 'premium' | 'vip'
  notes?: string
  current_order_id?: string
  current_party_size?: number
  seated_at?: string
  server_id?: string
  server_name?: string
  reservation_id?: string
  next_reservation_time?: string
  average_turnover_time?: number
  total_revenue_today?: number
  orders_today?: number
}

interface TableStats {
  total_tables: number
  available_tables: number
  occupied_tables: number
  reserved_tables: number
  cleaning_tables: number
  table_occupancy_rate: number
  average_party_size: number
  average_turnover_time: number
  revenue_per_table: number
  busiest_hours: { hour: number; occupancy: number }[]
}

export function TableManagement() {
  const [tables, setTables] = useState<Table[]>([])
  const [stats, setStats] = useState<TableStats | null>(null)
  const [selectedTab, setSelectedTab] = useState('floor-plan')
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterLocation, setFilterLocation] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [showRealtimeUpdates, setShowRealtimeUpdates] = useState(true)
  const [enableNotifications, setEnableNotifications] = useState(true)
  const [enableSoundAlerts, setEnableSoundAlerts] = useState(false)

  // Real-time updates (disabled for now to prevent 404 errors)
  const handleConnectionChange = () => {}
  const isConnected = false
  const connectionState = 'Closed'
  const lastUpdate = null
  const connectRealTime = () => {}
  const disconnectRealTime = () => {}
  const updateTableStatus = () => {}
  const isFallback = false

  // Load tables data
  const loadTables = async () => {
    try {
      setIsLoading(true)

      const response = await fetch('/api/v1/restaurant/table-management')
      const result = await response.json()

      if (result.success) {
        setTables(result.data.tables || [])
        setStats(result.data.stats || null)
        toast.success('Tables loaded successfully')
      } else {
        throw new Error(result.message || 'Failed to load tables')
      }
    } catch (error) {
      console.error('Error loading tables:', error)
      toast.error('Failed to load tables')
    } finally {
      setIsLoading(false)
    }
  }

  // Real-time updates
  useEffect(() => {
    loadTables()

    // Only use polling if real-time is not connected
    if (!isConnected) {
      const interval = setInterval(loadTables, 30000) // Update every 30 seconds
      return () => clearInterval(interval)
    }
  }, [isConnected])

  // Filter tables
  const filteredTables = tables.filter(table => {
    const matchesSearch =
      table.table_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.server_name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLocation = filterLocation === 'all' || table.location === filterLocation
    const matchesStatus = filterStatus === 'all' || table.status === filterStatus

    return matchesSearch && matchesLocation && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800'
      case 'occupied':
        return 'bg-red-100 text-red-800'
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800'
      case 'cleaning':
        return 'bg-blue-100 text-blue-800'
      case 'maintenance':
        return 'bg-muted text-gray-800'
      default:
        return 'bg-muted text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-muted p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Table Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage your restaurant floor plan and table assignments
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                if (isConnected) {
                  disconnectRealTime()
                  setShowRealtimeUpdates(false)
                } else {
                  connectRealTime()
                  setShowRealtimeUpdates(true)
                }
              }}
              className={isConnected ? 'text-green-600' : 'text-muted-foreground'}
            >
              <Activity className="w-4 h-4 mr-2" />
              {isConnected ? 'Live Updates On' : 'Live Updates Off'}
            </Button>
            <Button onClick={loadTables} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-primary font-medium">Total Tables</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.total_tables}</p>
                </div>
                <LayoutGrid className="w-8 h-8 text-blue-500" />
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Available</p>
                  <p className="text-2xl font-bold text-green-900">{stats.available_tables}</p>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Occupied</p>
                  <p className="text-2xl font-bold text-red-900">{stats.occupied_tables}</p>
                </div>
                <Utensils className="w-8 h-8 text-red-500" />
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Reserved</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.reserved_tables}</p>
                </div>
                <Calendar className="w-8 h-8 text-yellow-500" />
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Occupancy</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {stats.table_occupancy_rate}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-indigo-600 font-medium">Avg Turnover</p>
                  <p className="text-2xl font-bold text-indigo-900">
                    {stats.average_turnover_time}m
                  </p>
                </div>
                <Timer className="w-8 h-8 text-indigo-500" />
              </div>
            </Card>
          </div>
        )}

        {/* Real-time Status */}
        <RealTimeStatus
          isConnected={isConnected}
          connectionState={connectionState}
          lastUpdate={lastUpdate}
          onConnect={connectRealTime}
          onDisconnect={disconnectRealTime}
          onReconnect={() => {
            disconnectRealTime()
            setTimeout(connectRealTime, 1000)
          }}
          enableNotifications={enableNotifications}
          enableSoundAlerts={enableSoundAlerts}
          onToggleNotifications={setEnableNotifications}
          onToggleSoundAlerts={setEnableSoundAlerts}
          isFallback={isFallback}
        />

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search tables, servers..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={filterLocation}
              onChange={e => setFilterLocation(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Locations</option>
              <option value="indoor">Indoor</option>
              <option value="outdoor">Outdoor</option>
              <option value="patio">Patio</option>
              <option value="bar">Bar</option>
              <option value="private">Private</option>
            </select>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
              <option value="cleaning">Cleaning</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full max-w-3xl mx-auto">
          <TabsTrigger value="floor-plan" className="flex items-center space-x-2">
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden md:inline">Floor Plan</span>
          </TabsTrigger>
          <TabsTrigger value="tables" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span className="hidden md:inline">Tables</span>
          </TabsTrigger>
          <TabsTrigger value="combination" className="flex items-center space-x-2">
            <Merge className="w-4 h-4" />
            <span className="hidden md:inline">Combine</span>
          </TabsTrigger>
          <TabsTrigger value="reservations" className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden md:inline">Reservations</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden md:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span className="hidden md:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="floor-plan">
          <TableFloorPlan
            tables={filteredTables}
            onTableSelect={(table: any) => setSelectedTable(table)}
            onTablesUpdate={loadTables}
          />
        </TabsContent>

        <TabsContent value="tables">
          <TableCRUD tables={filteredTables} onTablesUpdate={loadTables} />
        </TabsContent>

        <TabsContent value="combination">
          <TableCombination tables={tables} onTablesUpdate={loadTables} />
        </TabsContent>

        <TabsContent value="reservations">
          <TableReservations tables={tables} onReservationUpdate={loadTables} />
        </TabsContent>

        <TabsContent value="analytics">
          <TableAnalytics tables={tables} stats={stats} />
        </TabsContent>

        <TabsContent value="settings">
          <TableSettings onSettingsUpdate={loadTables} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
