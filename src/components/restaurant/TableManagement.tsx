'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { universalApi } from '@/lib/universal-api'
import {
  extractData,
  ensureDefaultEntities,
  formatCurrency,
  generateSmartCode
} from '@/lib/universal-helpers'
import { StatCardGrid, StatCardData } from '@/components/universal/StatCardGrid'
import {
  TableProperties,
  Users,
  Clock,
  DollarSign,
  Calendar,
  User,
  UserPlus,
  PhoneCall,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Timer,
  Loader2,
  RefreshCw,
  Grid3x3,
  Home,
  ChevronRight,
  MapPin,
  Layers,
  CircleDot,
  Check,
  X,
  Plus,
  Settings,
  Activity,
  Pencil
} from 'lucide-react'
import { formatDate, addMinutesSafe } from '@/lib/date-utils'

interface TableManagementProps {
  organizationId: string
  smartCodes: Record<string, string>
  isDemoMode?: boolean
}

interface RestaurantTable {
  id: string
  entity_name: string
  entity_code: string
  metadata?: {
    table_number?: number
    section?: string
    capacity?: number
    status?: 'available' | 'occupied' | 'reserved' | 'cleaning' | 'maintenance'
    position?: { x: number; y: number }
    shape?: 'square' | 'round' | 'rectangle'
    server_id?: string
    server_name?: string
    current_order_id?: string
    occupied_since?: string
    estimated_clear_time?: string
    notes?: string
  }
}

interface Reservation {
  id: string
  entity_name: string
  entity_code: string
  metadata?: {
    table_id?: string
    table_number?: number
    customer_name?: string
    phone?: string
    party_size?: number
    reservation_date?: string
    reservation_time?: string
    duration_minutes?: number
    special_requests?: string
    status?: 'confirmed' | 'pending' | 'cancelled' | 'completed'
    confirmation_code?: string
  }
}

// Default sections for floor plan
const DEFAULT_SECTIONS = ['Main Dining', 'Private Dining', 'Patio', 'Bar']

// Table status colors
const STATUS_COLORS = {
  available: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  occupied: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  reserved: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  cleaning: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  maintenance: 'bg-muted text-gray-800 dark:bg-background/30 dark:text-gray-300'
}

// Status icons
const STATUS_ICONS = {
  available: CheckCircle,
  occupied: Users,
  reserved: Clock,
  cleaning: RefreshCw,
  maintenance: Settings
}

export function TableManagement({
  organizationId,
  smartCodes,
  isDemoMode = false
}: TableManagementProps) {
  const [activeTab, setActiveTab] = useState('floor-plan')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [selectedSection, setSelectedSection] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null)
  const [showTableDialog, setShowTableDialog] = useState(false)
  const [showReservationDialog, setShowReservationDialog] = useState(false)
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null)

  // Form states
  const [tableForm, setTableForm] = useState({
    table_number: '',
    section: 'Main Dining',
    capacity: '4',
    shape: 'square',
    notes: ''
  })

  const [reservationForm, setReservationForm] = useState({
    table_id: '',
    customer_name: '',
    phone: '',
    party_size: '',
    reservation_date: formatDate(new Date(), 'yyyy-MM-dd'),
    reservation_time: '',
    duration_minutes: '90',
    special_requests: ''
  })

  useEffect(() => {
    if (!isDemoMode) {
      universalApi.setOrganizationId(organizationId)
      loadData()
    } else {
      createDemoData()
    }

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (!isDemoMode) {
        refreshData()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [isDemoMode, organizationId])

  const createDemoData = async () => {
    setLoading(true)
    try {
      // Create demo tables
      const demoTables: RestaurantTable[] = []
      const sections = ['Main Dining', 'Private Dining', 'Patio', 'Bar']
      const shapes = ['square', 'round', 'rectangle'] as const
      const statuses = ['available', 'occupied', 'reserved', 'cleaning'] as const

      // Create 24 tables across different sections
      for (let i = 1; i <= 24; i++) {
        const section = sections[Math.floor((i - 1) / 6)]
        const status =
          i <= 8 ? 'occupied' : i <= 12 ? 'reserved' : i <= 20 ? 'available' : 'cleaning'

        demoTables.push({
          id: `table-${i}`,
          entity_name: `Table ${i}`,
          entity_code: `TBL-${i.toString().padStart(3, '0')}`,
          metadata: {
            table_number: i,
            section,
            capacity: [2, 4, 6, 8][i % 4],
            status: status as any,
            shape: shapes[i % 3],
            position: {
              x: ((i - 1) % 6) * 150 + 50,
              y: Math.floor((i - 1) / 6) * 150 + 50
            },
            server_name:
              status === 'occupied' ? ['Sarah', 'John', 'Maria', 'Mike'][i % 4] : undefined,
            occupied_since:
              status === 'occupied'
                ? new Date(Date.now() - Math.random() * 3600000).toISOString()
                : undefined,
            estimated_clear_time:
              status === 'occupied'
                ? addMinutesSafe(new Date(), Math.floor(Math.random() * 60) + 15).toISOString()
                : undefined
          }
        })
      }

      // Create demo reservations
      const demoReservations: Reservation[] = [
        {
          id: 'res-1',
          entity_name: 'Smith Party',
          entity_code: 'RES-2024-001',
          metadata: {
            table_id: 'table-9',
            table_number: 9,
            customer_name: 'John Smith',
            phone: '+1-555-0123',
            party_size: 4,
            reservation_date: formatDate(new Date(), 'yyyy-MM-dd'),
            reservation_time: '19:00',
            duration_minutes: 120,
            special_requests: 'Anniversary dinner, window seat preferred',
            status: 'confirmed',
            confirmation_code: 'RES123'
          }
        },
        {
          id: 'res-2',
          entity_name: 'Johnson Party',
          entity_code: 'RES-2024-002',
          metadata: {
            table_id: 'table-10',
            table_number: 10,
            customer_name: 'Emily Johnson',
            phone: '+1-555-0124',
            party_size: 6,
            reservation_date: formatDate(new Date(), 'yyyy-MM-dd'),
            reservation_time: '20:00',
            duration_minutes: 90,
            special_requests: 'Birthday celebration',
            status: 'confirmed',
            confirmation_code: 'RES124'
          }
        }
      ]

      setTables(demoTables)
      setReservations(demoReservations)
    } catch (err) {
      setError('Failed to create demo data')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      // Load tables
      const tablesResponse = await universalApi.getEntities({
        entity_type: 'table',
        smart_code: smartCodes.TABLE || 'HERA.RESTAURANT.TABLE.ENTITY.v1'
      })
      const tablesData = extractData(tablesResponse) as RestaurantTable[]

      // Create default tables if none exist
      if (!tablesData || tablesData.length === 0) {
        await createDefaultTables()
      } else {
        setTables(tablesData)
      }

      // Load reservations
      const reservationsResponse = await universalApi.getEntities({
        entity_type: 'reservation',
        smart_code: smartCodes.RESERVATION || 'HERA.RESTAURANT.TABLE.RESERVATION.v1'
      })
      setReservations(extractData(reservationsResponse) as Reservation[])
    } catch (err) {
      setError('Failed to load table data')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const createDefaultTables = async () => {
    const defaultTables = [
      { number: 1, section: 'Main Dining', capacity: 4 },
      { number: 2, section: 'Main Dining', capacity: 2 },
      { number: 3, section: 'Main Dining', capacity: 6 },
      { number: 4, section: 'Main Dining', capacity: 4 },
      { number: 5, section: 'Private Dining', capacity: 8 },
      { number: 6, section: 'Private Dining', capacity: 10 },
      { number: 7, section: 'Patio', capacity: 4 },
      { number: 8, section: 'Patio', capacity: 4 },
      { number: 9, section: 'Bar', capacity: 2 },
      { number: 10, section: 'Bar', capacity: 2 }
    ]

    const createdTables: RestaurantTable[] = []

    for (const table of defaultTables) {
      const result = await universalApi.createEntity({
        entity_type: 'table',
        entity_name: `Table ${table.number}`,
        entity_code: `TBL-${table.number.toString().padStart(3, '0')}`,
        smart_code: smartCodes.TABLE || 'HERA.RESTAURANT.TABLE.ENTITY.v1',
        metadata: {
          table_number: table.number,
          section: table.section,
          capacity: table.capacity,
          status: 'available',
          shape: table.capacity > 4 ? 'rectangle' : 'square',
          position: {
            x: ((table.number - 1) % 5) * 150 + 50,
            y: Math.floor((table.number - 1) / 5) * 150 + 50
          }
        }
      })

      if (result.success && result.data) {
        createdTables.push(result.data as RestaurantTable)
      }
    }

    setTables(createdTables)
  }

  const refreshData = async () => {
    if (refreshing) return
    setRefreshing(true)
    try {
      await loadData()
    } finally {
      setRefreshing(false)
    }
  }

  const updateTableStatus = async (tableId: string, newStatus: string) => {
    const table = tables.find(t => t.id === tableId)
    if (!table) return

    const updatedMetadata = {
      ...table.metadata,
      status: newStatus,
      occupied_since: newStatus === 'occupied' ? new Date().toISOString() : undefined,
      estimated_clear_time:
        newStatus === 'occupied' ? addMinutesSafe(new Date(), 90).toISOString() : undefined,
      server_name: newStatus === 'occupied' ? 'Current Server' : undefined
    }

    try {
      await universalApi.updateEntity(tableId, {
        metadata: updatedMetadata
      })

      // Update local state
      setTables(prev => prev.map(t => (t.id === tableId ? { ...t, metadata: updatedMetadata } : t)))
    } catch (err) {
      console.error('Error updating table status:', err)
      setError('Failed to update table status')
    }
  }

  const handleAddTable = async () => {
    try {
      const result = await universalApi.createEntity({
        entity_type: 'table',
        entity_name: `Table ${tableForm.table_number}`,
        entity_code: `TBL-${tableForm.table_number.padStart(3, '0')}`,
        smart_code: smartCodes.TABLE || 'HERA.RESTAURANT.TABLE.ENTITY.v1',
        metadata: {
          table_number: parseInt(tableForm.table_number),
          section: tableForm.section,
          capacity: parseInt(tableForm.capacity),
          status: 'available',
          shape: tableForm.shape as any,
          notes: tableForm.notes
        }
      })

      if (result.success && result.data) {
        setTables(prev => [...prev, result.data as RestaurantTable])
        setShowTableDialog(false)
        setTableForm({
          table_number: '',
          section: 'Main Dining',
          capacity: '4',
          shape: 'square',
          notes: ''
        })
      }
    } catch (err) {
      console.error('Error adding table:', err)
      setError('Failed to add table')
    }
  }

  const handleAddReservation = async () => {
    try {
      const selectedTable = tables.find(t => t.id === reservationForm.table_id)
      if (!selectedTable) return

      const confirmationCode = `RES${Date.now().toString().slice(-6)}`

      const result = await universalApi.createEntity({
        entity_type: 'reservation',
        entity_name: `${reservationForm.customer_name} Party`,
        entity_code: `RES-${formatDate(new Date(), 'yyyy-MM-dd')}-${Date.now().toString().slice(-4)}`,
        smart_code: smartCodes.RESERVATION || 'HERA.RESTAURANT.TABLE.RESERVATION.v1',
        metadata: {
          table_id: reservationForm.table_id,
          table_number: (selectedTable.metadata as any)?.table_number,
          customer_name: reservationForm.customer_name,
          phone: reservationForm.phone,
          party_size: parseInt(reservationForm.party_size),
          reservation_date: reservationForm.reservation_date,
          reservation_time: reservationForm.reservation_time,
          duration_minutes: parseInt(reservationForm.duration_minutes),
          special_requests: reservationForm.special_requests,
          status: 'confirmed',
          confirmation_code: confirmationCode
        }
      })

      if (result.success && result.data) {
        setReservations(prev => [...prev, result.data as Reservation])

        // Update table status to reserved if reservation is today
        if (reservationForm.reservation_date === formatDate(new Date(), 'yyyy-MM-dd')) {
          await updateTableStatus(reservationForm.table_id, 'reserved')
        }

        setShowReservationDialog(false)
        setReservationForm({
          table_id: '',
          customer_name: '',
          phone: '',
          party_size: '',
          reservation_date: formatDate(new Date(), 'yyyy-MM-dd'),
          reservation_time: '',
          duration_minutes: '90',
          special_requests: ''
        })
      }
    } catch (err) {
      console.error('Error adding reservation:', err)
      setError('Failed to add reservation')
    }
  }

  // Statistics calculation
  const stats: StatCardData[] = [
    {
      title: 'Total Tables',
      value: tables.length.toString(),
      icon: TableProperties,
      trend: '+2',
      trendLabel: 'from last week'
    },
    {
      title: 'Available',
      value: tables.filter(t => (t.metadata as any)?.status === 'available').length.toString(),
      icon: CheckCircle,
      className: 'text-emerald-600'
    },
    {
      title: 'Occupied',
      value: tables.filter(t => (t.metadata as any)?.status === 'occupied').length.toString(),
      icon: Users,
      className: 'text-rose-600'
    },
    {
      title: 'Reserved',
      value: tables.filter(t => (t.metadata as any)?.status === 'reserved').length.toString(),
      icon: Clock,
      className: 'text-amber-600'
    },
    {
      title: 'Total Seats',
      value: tables.reduce((sum, t) => sum + ((t.metadata as any)?.capacity || 0), 0).toString(),
      icon: User
    },
    {
      title: 'Reservations Today',
      value: reservations
        .filter(
          r =>
            (r.metadata as any)?.reservation_date === formatDate(new Date(), 'yyyy-MM-dd') &&
            (r.metadata as any)?.status === 'confirmed'
        )
        .length.toString(),
      icon: Calendar
    }
  ]

  // Filter tables
  const filteredTables = tables.filter(table => {
    const matchesSection =
      selectedSection === 'all' || (table.metadata as any)?.section === selectedSection
    const matchesSearch =
      searchTerm === '' ||
      table.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      table.entity_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (table.metadata as any)?.server_name?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSection && matchesSearch
  })

  // Get unique sections
  const sections = Array.from(
    new Set(tables.map(t => (t.metadata as any)?.section).filter(Boolean))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TableProperties className="h-6 w-6" />
            Table Management
          </h2>
          <p className="text-muted-foreground">Manage floor plan, table status, and reservations</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refreshData()} variant="outline" size="sm" disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={showTableDialog} onOpenChange={setShowTableDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Table
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Table</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="table_number">Table Number</Label>
                    <Input
                      id="table_number"
                      value={tableForm.table_number}
                      onChange={e => setTableForm({ ...tableForm, table_number: e.target.value })}
                      placeholder="e.g. 25"
                    />
                  </div>
                  <div>
                    <Label htmlFor="capacity">Capacity</Label>
                    <Select
                      value={tableForm.capacity}
                      onValueChange={value => setTableForm({ ...tableForm, capacity: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 seats</SelectItem>
                        <SelectItem value="4">4 seats</SelectItem>
                        <SelectItem value="6">6 seats</SelectItem>
                        <SelectItem value="8">8 seats</SelectItem>
                        <SelectItem value="10">10 seats</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="section">Section</Label>
                    <Select
                      value={tableForm.section}
                      onValueChange={value => setTableForm({ ...tableForm, section: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_SECTIONS.map(section => (
                          <SelectItem key={section} value={section}>
                            {section}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="shape">Shape</Label>
                    <Select
                      value={tableForm.shape}
                      onValueChange={value => setTableForm({ ...tableForm, shape: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="square">Square</SelectItem>
                        <SelectItem value="round">Round</SelectItem>
                        <SelectItem value="rectangle">Rectangle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={tableForm.notes}
                    onChange={e => setTableForm({ ...tableForm, notes: e.target.value })}
                    placeholder="Any special notes"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowTableDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddTable}>Add Table</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics */}
      <StatCardGrid stats={stats} />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="floor-plan">Floor Plan</TabsTrigger>
          <TabsTrigger value="tables">Tables List</TabsTrigger>
          <TabsTrigger value="reservations">Reservations</TabsTrigger>
        </TabsList>

        <TabsContent value="floor-plan">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Restaurant Floor Plan</CardTitle>
                <div className="flex gap-2">
                  <Select value={selectedSection} onValueChange={setSelectedSection}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sections</SelectItem>
                      {sections.map(section => (
                        <SelectItem key={section} value={section!}>
                          {section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative bg-muted dark:bg-background/20 rounded-lg p-6 min-h-[500px]">
                {/* Section labels */}
                {selectedSection === 'all' && (
                  <div className="absolute top-2 left-2 space-y-2">
                    {DEFAULT_SECTIONS.map((section, index) => (
                      <div key={section} className="text-sm font-medium text-muted-foreground">
                        {section}
                      </div>
                    ))}
                  </div>
                )}

                {/* Tables visualization */}
                <div className="relative">
                  {filteredTables.map(table => {
                    const status = (table.metadata as any)?.status || 'available'
                    const Icon = STATUS_ICONS[status]
                    const position = (table.metadata as any)?.position || { x: 50, y: 50 }
                    const shape = (table.metadata as any)?.shape || 'square'

                    return (
                      <div
                        key={table.id}
                        className={`absolute cursor-pointer transition-all hover:scale-105 ${STATUS_COLORS[status]}`}
                        style={{
                          left: `${position.x}px`,
                          top: `${position.y}px`,
                          width: shape === 'rectangle' ? '120px' : '80px',
                          height: '80px',
                          borderRadius: shape === 'round' ? '50%' : '8px'
                        }}
                        onClick={() => setSelectedTable(table)}
                      >
                        <div className="flex flex-col items-center justify-center h-full p-2">
                          <Icon className="h-5 w-5 mb-1" />
                          <div className="font-semibold text-sm">{table.entity_name}</div>
                          <div className="text-xs">{(table.metadata as any)?.capacity} seats</div>
                          {(table.metadata as any)?.server_name && (
                            <div className="text-xs mt-1">{table.metadata.server_name}</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Table details popup */}
                {selectedTable && (
                  <div className="absolute bottom-4 right-4 bg-background dark:bg-muted p-4 rounded-lg shadow-lg max-w-[300px]">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{selectedTable.entity_name}</h3>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedTable(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge
                          variant="secondary"
                          className={
                            STATUS_COLORS[(selectedTable.metadata as any)?.status || 'available']
                          }
                        >
                          {(selectedTable.metadata as any)?.status || 'available'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Section:</span>
                        <span>{(selectedTable.metadata as any)?.section}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Capacity:</span>
                        <span>{(selectedTable.metadata as any)?.capacity} seats</span>
                      </div>
                      {(selectedTable.metadata as any)?.server_name && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Server:</span>
                          <span>{selectedTable.metadata.server_name}</span>
                        </div>
                      )}
                      {(selectedTable.metadata as any)?.occupied_since && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Since:</span>
                          <span>
                            {formatDate(new Date(selectedTable.metadata.occupied_since), 'HH:mm')}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateTableStatus(
                            selectedTable.id,
                            (selectedTable.metadata as any)?.status === 'occupied'
                              ? 'cleaning'
                              : 'occupied'
                          )
                        }
                      >
                        {(selectedTable.metadata as any)?.status === 'occupied'
                          ? 'Clear'
                          : 'Assign'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setReservationForm({ ...reservationForm, table_id: selectedTable.id })
                          setShowReservationDialog(true)
                        }}
                      >
                        Reserve
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 text-sm">
                {Object.entries(STATUS_COLORS).map(([status, color]) => {
                  const Icon = STATUS_ICONS[status as keyof typeof STATUS_ICONS]
                  return (
                    <div key={status} className="flex items-center gap-1">
                      <div className={`w-4 h-4 rounded ${color}`} />
                      <Icon className="h-3 w-3" />
                      <span className="capitalize">{status}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tables">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tables List</CardTitle>
                <Input
                  placeholder="Search tables..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="max-w-xs"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Server</TableHead>
                    <TableHead>Occupied Since</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTables.map(table => (
                    <TableRow key={table.id}>
                      <TableCell className="font-medium">{table.entity_name}</TableCell>
                      <TableCell>{(table.metadata as any)?.section}</TableCell>
                      <TableCell>{(table.metadata as any)?.capacity} seats</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={STATUS_COLORS[(table.metadata as any)?.status || 'available']}
                        >
                          {(table.metadata as any)?.status || 'available'}
                        </Badge>
                      </TableCell>
                      <TableCell>{(table.metadata as any)?.server_name || '-'}</TableCell>
                      <TableCell>
                        {(table.metadata as any)?.occupied_since
                          ? formatDate(new Date(table.metadata.occupied_since), 'HH:mm')
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              updateTableStatus(
                                table.id,
                                (table.metadata as any)?.status === 'occupied'
                                  ? 'available'
                                  : 'occupied'
                              )
                            }
                          >
                            {(table.metadata as any)?.status === 'occupied' ? 'Clear' : 'Assign'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateTableStatus(table.id, 'cleaning')}
                          >
                            Clean
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reservations">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Reservations</CardTitle>
                <Dialog open={showReservationDialog} onOpenChange={setShowReservationDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      New Reservation
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>New Reservation</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="customer_name">Customer Name</Label>
                          <Input
                            id="customer_name"
                            value={reservationForm.customer_name}
                            onChange={e =>
                              setReservationForm({
                                ...reservationForm,
                                customer_name: e.target.value
                              })
                            }
                            placeholder="John Smith"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={reservationForm.phone}
                            onChange={e =>
                              setReservationForm({ ...reservationForm, phone: e.target.value })
                            }
                            placeholder="+1-555-0123"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="party_size">Party Size</Label>
                          <Input
                            id="party_size"
                            type="number"
                            value={reservationForm.party_size}
                            onChange={e =>
                              setReservationForm({ ...reservationForm, party_size: e.target.value })
                            }
                            placeholder="4"
                          />
                        </div>
                        <div>
                          <Label htmlFor="table_id">Table</Label>
                          <Select
                            value={reservationForm.table_id}
                            onValueChange={value =>
                              setReservationForm({ ...reservationForm, table_id: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select table" />
                            </SelectTrigger>
                            <SelectContent>
                              {tables
                                .filter(t => (t.metadata as any)?.status !== 'maintenance')
                                .map(table => (
                                  <SelectItem key={table.id} value={table.id}>
                                    {table.entity_name} ({(table.metadata as any)?.section},{' '}
                                    {(table.metadata as any)?.capacity} seats)
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="reservation_date">Date</Label>
                          <Input
                            id="reservation_date"
                            type="date"
                            value={reservationForm.reservation_date}
                            onChange={e =>
                              setReservationForm({
                                ...reservationForm,
                                reservation_date: e.target.value
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="reservation_time">Time</Label>
                          <Input
                            id="reservation_time"
                            type="time"
                            value={reservationForm.reservation_time}
                            onChange={e =>
                              setReservationForm({
                                ...reservationForm,
                                reservation_time: e.target.value
                              })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="special_requests">Special Requests</Label>
                        <Input
                          id="special_requests"
                          value={reservationForm.special_requests}
                          onChange={e =>
                            setReservationForm({
                              ...reservationForm,
                              special_requests: e.target.value
                            })
                          }
                          placeholder="Window seat, birthday celebration, etc."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowReservationDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddReservation}>Create Reservation</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Party Size</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Confirmation</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations.map(reservation => (
                    <TableRow key={reservation.id}>
                      <TableCell className="font-medium">
                        {(reservation.metadata as any)?.customer_name}
                      </TableCell>
                      <TableCell>Table {(reservation.metadata as any)?.table_number}</TableCell>
                      <TableCell>
                        {(reservation.metadata as any)?.reservation_date
                          ? formatDate(new Date(reservation.metadata.reservation_date), 'MMM dd')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {(reservation.metadata as any)?.reservation_time || '-'}
                      </TableCell>
                      <TableCell>{(reservation.metadata as any)?.party_size} guests</TableCell>
                      <TableCell>{(reservation.metadata as any)?.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            (reservation.metadata as any)?.status === 'confirmed'
                              ? 'default'
                              : (reservation.metadata as any)?.status === 'cancelled'
                                ? 'destructive'
                                : 'secondary'
                          }
                        >
                          {(reservation.metadata as any)?.status || 'pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">
                          {(reservation.metadata as any)?.confirmation_code}
                        </code>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => console.log('Pencil reservation', reservation.id)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => console.log('Cancel reservation', reservation.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
