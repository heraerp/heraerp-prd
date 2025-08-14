'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Search,
  Filter,
  Download,
  Upload,
  Copy,
  MoreVertical,
  Users,
  MapPin,
  DollarSign,
  Square,
  Circle,
  Wifi,
  Accessibility,
  Eye,
  Volume2,
  Cigarette,
  Baby,
  Star,
  QrCode,
  Calendar
} from 'lucide-react'

interface TableData {
  id: string
  table_number: string
  capacity: number
  min_capacity?: number
  location: 'indoor' | 'outdoor' | 'patio' | 'bar' | 'private'
  status: 'available' | 'occupied' | 'reserved' | 'cleaning' | 'maintenance'
  shape: 'square' | 'rectangle' | 'round' | 'oval'
  features: string[]
  pricing_tier: 'standard' | 'premium' | 'vip'
  notes?: string
  qr_code?: string
  advance_booking_days?: number
  max_booking_duration?: number
  requires_deposit?: boolean
  deposit_amount?: number
  is_combinable?: boolean
  combined_with?: string[]
}

interface TableCRUDProps {
  tables: TableData[]
  onTablesUpdate: () => void
}

const FEATURES = [
  { id: 'wifi', label: 'WiFi Access', icon: Wifi },
  { id: 'wheelchair', label: 'Wheelchair Accessible', icon: Accessibility },
  { id: 'window', label: 'Window View', icon: Eye },
  { id: 'quiet', label: 'Quiet Zone', icon: Volume2 },
  { id: 'non_smoking', label: 'Non-Smoking', icon: Cigarette },
  { id: 'high_chair', label: 'High Chair Available', icon: Baby },
  { id: 'vip', label: 'VIP Section', icon: Star },
  { id: 'private', label: 'Private Area', icon: Eye }
]

export function TableCRUD({ tables, onTablesUpdate }: TableCRUDProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterLocation, setFilterLocation] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null)
  const [bulkSelection, setBulkSelection] = useState<string[]>([])
  
  // Form state
  const [formData, setFormData] = useState<Partial<TableData>>({
    table_number: '',
    capacity: 4,
    min_capacity: 1,
    location: 'indoor',
    status: 'available',
    shape: 'square',
    features: [],
    pricing_tier: 'standard',
    notes: '',
    advance_booking_days: 30,
    max_booking_duration: 120,
    requires_deposit: false,
    deposit_amount: 0,
    is_combinable: true
  })

  // Filter tables
  const filteredTables = tables.filter(table => {
    const matchesSearch = table.table_number.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLocation = filterLocation === 'all' || table.location === filterLocation
    const matchesStatus = filterStatus === 'all' || table.status === filterStatus
    return matchesSearch && matchesLocation && matchesStatus
  })

  // CRUD Operations
  const createTable = async () => {
    try {
      const response = await fetch('/api/v1/restaurant/table-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const result = await response.json()
      if (result.success) {
        toast.success('Table created successfully')
        setIsAddDialogOpen(false)
        resetForm()
        onTablesUpdate()
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      toast.error('Failed to create table')
    }
  }

  const updateTable = async () => {
    if (!selectedTable) return
    
    try {
      const response = await fetch(`/api/v1/restaurant/table-management/${selectedTable.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const result = await response.json()
      if (result.success) {
        toast.success('Table updated successfully')
        setIsEditDialogOpen(false)
        resetForm()
        onTablesUpdate()
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      toast.error('Failed to update table')
    }
  }

  const deleteTable = async (tableId: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return
    
    try {
      const response = await fetch(`/api/v1/restaurant/table-management/${tableId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      if (result.success) {
        toast.success('Table deleted successfully')
        onTablesUpdate()
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      toast.error('Failed to delete table')
    }
  }

  const bulkDelete = async () => {
    if (bulkSelection.length === 0) return
    if (!confirm(`Are you sure you want to delete ${bulkSelection.length} tables?`)) return
    
    try {
      const promises = bulkSelection.map(tableId =>
        fetch(`/api/v1/restaurant/table-management/${tableId}`, { method: 'DELETE' })
      )
      
      await Promise.all(promises)
      toast.success(`${bulkSelection.length} tables deleted successfully`)
      setBulkSelection([])
      onTablesUpdate()
    } catch (error) {
      toast.error('Failed to delete tables')
    }
  }

  const duplicateTable = async (table: TableData) => {
    const newTableData = {
      ...table,
      table_number: `${table.table_number}_copy`,
      status: 'available'
    }
    
    try {
      const response = await fetch('/api/v1/restaurant/table-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTableData)
      })
      
      const result = await response.json()
      if (result.success) {
        toast.success('Table duplicated successfully')
        onTablesUpdate()
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      toast.error('Failed to duplicate table')
    }
  }

  // Helper functions
  const resetForm = () => {
    setFormData({
      table_number: '',
      capacity: 4,
      min_capacity: 1,
      location: 'indoor',
      status: 'available',
      shape: 'square',
      features: [],
      pricing_tier: 'standard',
      notes: '',
      advance_booking_days: 30,
      max_booking_duration: 120,
      requires_deposit: false,
      deposit_amount: 0,
      is_combinable: true
    })
    setSelectedTable(null)
  }

  const handleEdit = (table: TableData) => {
    setSelectedTable(table)
    setFormData(table)
    setIsEditDialogOpen(true)
  }

  const toggleFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features?.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...(prev.features || []), feature]
    }))
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      occupied: 'bg-red-100 text-red-800',
      reserved: 'bg-yellow-100 text-yellow-800',
      cleaning: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const exportTables = () => {
    const dataStr = JSON.stringify(tables, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `tables_${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Table Management</h3>
            <p className="text-sm text-gray-600 mt-1">Manage your restaurant tables and their configurations</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={exportTables}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Table
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Table</DialogTitle>
                  <DialogDescription>
                    Create a new table with custom configuration
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="table_number">Table Number</Label>
                      <Input
                        id="table_number"
                        value={formData.table_number}
                        onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
                        placeholder="e.g., T1, A1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="capacity">Capacity</Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                        min="1"
                        max="20"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <select
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="indoor">Indoor</option>
                        <option value="outdoor">Outdoor</option>
                        <option value="patio">Patio</option>
                        <option value="bar">Bar</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="shape">Shape</Label>
                      <select
                        id="shape"
                        value={formData.shape}
                        onChange={(e) => setFormData({ ...formData, shape: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="square">Square</option>
                        <option value="rectangle">Rectangle</option>
                        <option value="round">Round</option>
                        <option value="oval">Oval</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pricing_tier">Pricing Tier</Label>
                      <select
                        id="pricing_tier"
                        value={formData.pricing_tier}
                        onChange={(e) => setFormData({ ...formData, pricing_tier: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="standard">Standard</option>
                        <option value="premium">Premium</option>
                        <option value="vip">VIP</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="status">Initial Status</Label>
                      <select
                        id="status"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="available">Available</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Features</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {FEATURES.map(feature => (
                        <div key={feature.id} className="flex items-center space-x-2">
                          <Switch
                            checked={formData.features?.includes(feature.id) || false}
                            onCheckedChange={() => toggleFeature(feature.id)}
                          />
                          <Label className="flex items-center space-x-2 cursor-pointer">
                            <feature.icon className="w-4 h-4" />
                            <span>{feature.label}</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Reservation Settings</Label>
                    <div className="space-y-3 mt-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="advance_booking_days" className="text-sm">Advance Booking (days)</Label>
                          <Input
                            id="advance_booking_days"
                            type="number"
                            value={formData.advance_booking_days}
                            onChange={(e) => setFormData({ ...formData, advance_booking_days: parseInt(e.target.value) })}
                            min="0"
                            max="365"
                          />
                        </div>
                        <div>
                          <Label htmlFor="max_booking_duration" className="text-sm">Max Duration (minutes)</Label>
                          <Input
                            id="max_booking_duration"
                            type="number"
                            value={formData.max_booking_duration}
                            onChange={(e) => setFormData({ ...formData, max_booking_duration: parseInt(e.target.value) })}
                            min="30"
                            max="480"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Switch
                          checked={formData.requires_deposit || false}
                          onCheckedChange={(checked) => setFormData({ ...formData, requires_deposit: checked })}
                        />
                        <Label className="cursor-pointer">Requires Deposit</Label>
                        {formData.requires_deposit && (
                          <Input
                            type="number"
                            value={formData.deposit_amount}
                            onChange={(e) => setFormData({ ...formData, deposit_amount: parseFloat(e.target.value) })}
                            placeholder="Amount"
                            className="w-24"
                            min="0"
                            step="0.01"
                          />
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Switch
                          checked={formData.is_combinable || false}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_combinable: checked })}
                        />
                        <Label className="cursor-pointer">Can be combined with other tables</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Any special notes about this table..."
                      rows={3}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createTable}>
                    <Save className="w-4 h-4 mr-2" />
                    Create Table
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mt-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search tables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      </Card>
      
      {/* Table List */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={bulkSelection.length === filteredTables.length && filteredTables.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setBulkSelection(filteredTables.map(t => t.id))
                      } else {
                        setBulkSelection([])
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Table Number</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Shape</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Pricing</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTables.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No tables found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTables.map((table) => (
                  <TableRow key={table.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={bulkSelection.includes(table.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBulkSelection([...bulkSelection, table.id])
                          } else {
                            setBulkSelection(bulkSelection.filter(id => id !== table.id))
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{table.table_number}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>{table.capacity}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="capitalize">{table.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {table.shape === 'square' || table.shape === 'rectangle' ? (
                          <Square className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="capitalize">{table.shape}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(table.status)}>
                        {table.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {table.features.slice(0, 3).map(feature => {
                          const featureData = FEATURES.find(f => f.id === feature)
                          return featureData ? (
                            <span key={feature} title={featureData.label}>
                              <featureData.icon className="w-4 h-4 text-gray-500" />
                            </span>
                          ) : null
                        })}
                        {table.features.length > 3 && (
                          <span className="text-xs text-gray-500">+{table.features.length - 3}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        table.pricing_tier === 'vip' ? 'bg-purple-100 text-purple-800' :
                        table.pricing_tier === 'premium' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {table.pricing_tier}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(table)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => duplicateTable(table)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTable(table.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Bulk Actions */}
        {bulkSelection.length > 0 && (
          <div className="p-4 bg-gray-50 border-t flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {bulkSelection.length} table{bulkSelection.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={() => setBulkSelection([])}>
                Clear Selection
              </Button>
              <Button variant="destructive" size="sm" onClick={bulkDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          </div>
        )}
      </Card>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Table</DialogTitle>
            <DialogDescription>
              Update table configuration
            </DialogDescription>
          </DialogHeader>
          
          {/* Same form as Add Dialog */}
          <div className="grid gap-4 py-4">
            {/* ... same form fields as in Add Dialog ... */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_table_number">Table Number</Label>
                <Input
                  id="edit_table_number"
                  value={formData.table_number}
                  onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
                  placeholder="e.g., T1, A1"
                />
              </div>
              <div>
                <Label htmlFor="edit_capacity">Capacity</Label>
                <Input
                  id="edit_capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  min="1"
                  max="20"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_location">Location</Label>
                <select
                  id="edit_location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="indoor">Indoor</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="patio">Patio</option>
                  <option value="bar">Bar</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div>
                <Label htmlFor="edit_status">Status</Label>
                <select
                  id="edit_status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="reserved">Reserved</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateTable}>
              <Save className="w-4 h-4 mr-2" />
              Update Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}