'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { SalonProductionSidebar } from '@/components/salon/SalonProductionSidebar'
import { universalApi } from '@/lib/universal-api'
import { useAuth } from '@/components/auth/DualAuthProvider'
import { 
  User, 
  Search, 
  Plus, 
  Edit3,
  Trash2,
  Heart,
  Star,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Save,
  UserPlus,
  ArrowLeft,
  Crown,
  Users,
  Loader2,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

interface Client {
  id: string
  entity_name: string
  entity_type: string
  entity_code?: string
  organization_id: string
  smart_code?: string
  created_at?: string
  updated_at?: string
  // Dynamic fields stored in core_dynamic_data
  email?: string
  phone?: string
  address?: string
  date_of_birth?: string
  preferences?: string
  notes?: string
  total_spent?: number
  visits?: number
  last_visit?: string
  favorite_services?: string[]
  loyalty_tier?: string
  status?: 'active' | 'inactive' | 'vip'
}

export default function ClientsProduction() {
  const { organization } = useAuth()
  const organizationId = organization?.id
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  // New client form state
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    preferences: '',
    notes: ''
  })

  // Set organization ID for API
  useEffect(() => {
    if (organizationId) {
      universalApi.setOrganizationId(organizationId)
    }
  }, [organizationId])

  // Load clients from Supabase
  const loadClients = async () => {
    if (!organizationId) return
    
    setLoading(true)
    try {
      // Get all customer entities
      const response = await universalApi.read('core_entities', {
        entity_type: 'customer',
        organization_id: organizationId
      })

      if (response.success && response.data) {
        // For each client, load dynamic data
        const clientsWithData = await Promise.all(
          response.data.map(async (entity: any) => {
            const dynamicData = await universalApi.getDynamicFields(entity.id)
            
            return {
              id: entity.id,
              entity_name: entity.entity_name,
              entity_type: entity.entity_type,
              entity_code: entity.entity_code,
              organization_id: entity.organization_id,
              smart_code: entity.smart_code,
              created_at: entity.created_at,
              updated_at: entity.updated_at,
              // Map dynamic fields
              email: dynamicData.email || '',
              phone: dynamicData.phone || '',
              address: dynamicData.address || '',
              date_of_birth: dynamicData.date_of_birth || '',
              preferences: dynamicData.preferences || '',
              notes: dynamicData.notes || '',
              total_spent: parseFloat(dynamicData.total_spent || '0'),
              visits: parseInt(dynamicData.visits || '0'),
              last_visit: dynamicData.last_visit || 'Never',
              favorite_services: dynamicData.favorite_services ? JSON.parse(dynamicData.favorite_services) : [],
              loyalty_tier: dynamicData.loyalty_tier || 'Bronze',
              status: dynamicData.status || 'active'
            }
          })
        )

        setClients(clientsWithData)
      }
    } catch (error) {
      console.error('Error loading clients:', error)
      toast({
        title: 'Error',
        description: 'Failed to load clients. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Load clients on mount
  useEffect(() => {
    loadClients()
  }, [organizationId])

  // Filter clients based on search and status
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (client.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                         (client.phone?.includes(searchTerm) || false)
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleAddClient = async () => {
    if (!newClient.name || !newClient.email || !organizationId) {
      if (!organizationId) {
        toast({
          title: 'Error',
          description: 'Organization not found. Please refresh the page and try again.',
          variant: 'destructive'
        })
      }
      return
    }

    setSaving(true)
    try {
      // Create customer entity
      const entityResponse = await universalApi.createEntity({
        entity_type: 'customer',
        entity_name: newClient.name,
        entity_code: `CUST-${Date.now()}`,
        organization_id: organizationId,
        smart_code: 'HERA.SALON.CUSTOMER.v1'
      })

      if (entityResponse.success && entityResponse.data) {
        const entityId = entityResponse.data.id

        // Set dynamic fields
        const dynamicFields = {
          email: newClient.email,
          phone: newClient.phone,
          address: newClient.address,
          date_of_birth: newClient.dateOfBirth,
          preferences: newClient.preferences,
          notes: newClient.notes,
          total_spent: '0',
          visits: '0',
          last_visit: 'Never',
          loyalty_tier: 'Bronze',
          status: 'active'
        }

        // Save each dynamic field
        for (const [field, value] of Object.entries(dynamicFields)) {
          if (value) {
            await universalApi.setDynamicField(entityId, field, value)
          }
        }

        // Show success notification
        toast({
          title: 'Success',
          description: 'Client added successfully!',
          duration: 3000
        })

        // Reset form
        setNewClient({
          name: '',
          email: '',
          phone: '',
          address: '',
          dateOfBirth: '',
          preferences: '',
          notes: ''
        })
        setShowAddForm(false)

        // Reload clients
        await loadClients()
      }
    } catch (error) {
      console.error('Error adding client:', error)
      toast({
        title: 'Error',
        description: 'Failed to add client. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClient = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return

    try {
      const response = await universalApi.delete('core_entities', id)
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Client deleted successfully!',
          duration: 3000
        })
        setSelectedClient(null)
        await loadClients()
      }
    } catch (error) {
      console.error('Error deleting client:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete client. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleStatusChange = async (id: string, status: Client['status']) => {
    try {
      await universalApi.setDynamicField(id, 'status', status)
      
      toast({
        title: 'Success',
        description: 'Client status updated!',
        duration: 2000
      })
      
      await loadClients()
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update status. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Gold': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Silver': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-orange-100 text-orange-800 border-orange-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'vip': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getClientStats = () => {
    return {
      total: clients.length,
      active: clients.filter(c => c.status === 'active').length,
      vip: clients.filter(c => c.status === 'vip').length,
      totalRevenue: clients.reduce((sum, c) => sum + (c.total_spent || 0), 0),
      avgSpend: clients.length > 0 ? Math.round(clients.reduce((sum, c) => sum + (c.total_spent || 0), 0) / clients.length) : 0
    }
  }

  const stats = getClientStats()

  if (loading && clients.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-pink-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading clients...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex">
      {/* Teams-Style Sidebar */}
      <SalonProductionSidebar />
      
      <div className="flex-1 flex flex-col ml-16">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" asChild>
                  <Link href="/salon">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Link>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    Client Management
                  </h1>
                  <p className="text-sm text-gray-600">Manage your clients and build lasting relationships</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  Live Mode
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">
          {/* Client Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                  <p className="text-xs text-gray-600">Total Clients</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <Heart className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                  <p className="text-xs text-gray-600">Active</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <Crown className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-2xl font-bold text-purple-600">{stats.vip}</p>
                  <p className="text-xs text-gray-600">VIP Clients</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold text-green-600">${stats.totalRevenue}</p>
                  <p className="text-xs text-gray-600">Total Revenue</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <p className="text-2xl font-bold text-yellow-600">${stats.avgSpend}</p>
                  <p className="text-xs text-gray-600">Avg Spend</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search clients by name, email, or phone..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="hera-select-content">
                <SelectItem value="all" className="hera-select-item">All Status</SelectItem>
                <SelectItem value="active" className="hera-select-item">Active</SelectItem>
                <SelectItem value="vip" className="hera-select-item">VIP</SelectItem>
                <SelectItem value="inactive" className="hera-select-item">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="bg-pink-600 hover:bg-pink-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Client List */}
            <div className="lg:col-span-2">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-pink-500" />
                    Clients ({filteredClients.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredClients.map((client) => (
                      <div 
                        key={client.id} 
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedClient?.id === client.id 
                            ? 'border-pink-300 bg-pink-50' 
                            : 'border-gray-200 hover:border-pink-200 hover:bg-pink-25'
                        }`}
                        onClick={() => setSelectedClient(client)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              client.status === 'vip' 
                                ? 'bg-gradient-to-br from-purple-500 to-pink-600' 
                                : 'bg-gradient-to-br from-pink-500 to-purple-600'
                            }`}>
                              {client.status === 'vip' ? (
                                <Crown className="h-5 w-5 text-white" />
                              ) : (
                                <User className="h-5 w-5 text-white" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{client.entity_name}</p>
                              <p className="text-sm text-gray-600">{client.email}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(client.status || 'active')}>
                                {(client.status || 'active').toUpperCase()}
                              </Badge>
                              <Badge className={getTierColor(client.loyalty_tier || 'Bronze')}>
                                {client.loyalty_tier || 'Bronze'}
                              </Badge>
                            </div>
                            <div className="text-right text-sm">
                              <p className="font-medium text-green-600">${client.total_spent || 0}</p>
                              <p className="text-gray-500">{client.visits || 0} visits</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Client Details / Add Form */}
            <div>
              {showAddForm ? (
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5 text-pink-500" />
                      Add New Client
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={newClient.name}
                        onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter client name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newClient.email}
                        onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="client@email.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={newClient.phone}
                        onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={newClient.address}
                        onChange={(e) => setNewClient(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="123 Main St, City, ST"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={newClient.dateOfBirth}
                        onChange={(e) => setNewClient(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="preferences">Preferences</Label>
                      <Textarea
                        id="preferences"
                        value={newClient.preferences}
                        onChange={(e) => setNewClient(prev => ({ ...prev, preferences: e.target.value }))}
                        placeholder="Allergies, preferred stylist, etc."
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={newClient.notes}
                        onChange={(e) => setNewClient(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Additional notes about the client"
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleAddClient}
                        className="flex-1 bg-pink-600 hover:bg-pink-700"
                        disabled={!newClient.name || !newClient.email || saving}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Client
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowAddForm(false)}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : selectedClient ? (
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-pink-500" />
                        Client Details
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Select
                          value={selectedClient.status}
                          onValueChange={(status) => handleStatusChange(selectedClient.id, status as Client['status'])}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="hera-select-content">
                            <SelectItem value="active" className="hera-select-item">Active</SelectItem>
                            <SelectItem value="vip" className="hera-select-item">VIP</SelectItem>
                            <SelectItem value="inactive" className="hera-select-item">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteClient(selectedClient.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center pb-4 border-b">
                      <div className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
                        selectedClient.status === 'vip' 
                          ? 'bg-gradient-to-br from-purple-500 to-pink-600' 
                          : 'bg-gradient-to-br from-pink-500 to-purple-600'
                      }`}>
                        {selectedClient.status === 'vip' ? (
                          <Crown className="h-8 w-8 text-white" />
                        ) : (
                          <User className="h-8 w-8 text-white" />
                        )}
                      </div>
                      <h3 className="font-semibold text-lg">{selectedClient.entity_name}</h3>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <Badge className={getStatusColor(selectedClient.status || 'active')}>
                          {(selectedClient.status || 'active').toUpperCase()}
                        </Badge>
                        <Badge className={getTierColor(selectedClient.loyalty_tier || 'Bronze')}>
                          {selectedClient.loyalty_tier || 'Bronze'} Member
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{selectedClient.email}</span>
                      </div>
                      {selectedClient.phone && (
                        <div className="flex items-center gap-3 text-sm">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{selectedClient.phone}</span>
                        </div>
                      )}
                      {selectedClient.address && (
                        <div className="flex items-center gap-3 text-sm">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{selectedClient.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>Last visit: {selectedClient.last_visit || 'Never'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-1" />
                        <p className="font-semibold text-green-600">${selectedClient.total_spent || 0}</p>
                        <p className="text-xs text-gray-600">Total Spent</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <Star className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                        <p className="font-semibold text-blue-600">{selectedClient.visits || 0}</p>
                        <p className="text-xs text-gray-600">Visits</p>
                      </div>
                    </div>

                    {selectedClient.favorite_services && selectedClient.favorite_services.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Favorite Services</Label>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selectedClient.favorite_services.map((service, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedClient.preferences && (
                      <div>
                        <Label className="text-sm font-medium">Preferences</Label>
                        <p className="text-sm text-gray-600 mt-1">{selectedClient.preferences}</p>
                      </div>
                    )}

                    {selectedClient.notes && (
                      <div>
                        <Label className="text-sm font-medium">Notes</Label>
                        <p className="text-sm text-gray-600 mt-1">{selectedClient.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-4">Select a client to view details</p>
                    <Button 
                      onClick={() => setShowAddForm(true)}
                      className="bg-pink-600 hover:bg-pink-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Client
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}