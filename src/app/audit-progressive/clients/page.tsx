'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
// No authentication required for public audit demo
import { toast } from 'sonner'
import { 
  Building2, 
  Search,
  Filter,
  Plus,
  MapPin,
  Phone,
  Mail,
  Globe,
  DollarSign,
  Calendar,
  Users,
  Shield,
  Edit,
  Eye,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  X
} from 'lucide-react'

interface ClientAddress {
  street: string
  city: string
  state: string
  country: string
  postal_code: string
}

interface AuditClient {
  id: string
  entity_name: string
  entity_code: string
  entity_type: string
  status: 'active' | 'inactive' | 'prospective'
  organization_id: string
  metadata: {
    client_type: 'public' | 'private' | 'non_profit' | 'government'
    risk_rating: 'low' | 'moderate' | 'high'
    industry_code: string
    annual_revenue: number
    total_assets: number
    public_interest_entity: boolean
    incorporation_date: string
    tax_id: string
    registration_number: string
    address: ClientAddress
    contact: {
      primary_contact: string
      phone: string
      email: string
      website: string
    }
    audit_history: Array<{
      year: string
      auditor: string
      opinion: string
    }>
  }
  created_at?: string
  updated_at?: string
}

export default function AuditClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<AuditClient[]>([])
  const [filteredClients, setFilteredClients] = useState<AuditClient[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newClient, setNewClient] = useState<Partial<AuditClient>>({
    entity_name: '',
    entity_code: '',
    entity_type: 'audit_client',
    status: 'prospective',
    metadata: {
      client_type: 'private',
      risk_rating: 'moderate',
      industry_code: '',
      annual_revenue: 0,
      total_assets: 0,
      public_interest_entity: false,
      incorporation_date: '',
      tax_id: '',
      registration_number: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: 'Cyprus',
        postal_code: ''
      },
      contact: {
        primary_contact: '',
        phone: '',
        email: '',
        website: ''
      },
      audit_history: []
    }
  })

  // Load clients
  useEffect(() => {
    loadClients()
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = clients

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(client => 
        client.entity_name.toLowerCase().includes(search) ||
        client.entity_code.toLowerCase().includes(search) ||
        client.metadata.industry_code.toLowerCase().includes(search) ||
        client.metadata.address.city.toLowerCase().includes(search) ||
        client.metadata.contact.email.toLowerCase().includes(search)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => client.status === statusFilter)
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(client => client.metadata.client_type === typeFilter)
    }

    setFilteredClients(filtered)
  }, [clients, searchTerm, statusFilter, typeFilter])

  const loadClients = async () => {
    try {
      const response = await fetch('/api/v1/audit/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data.data?.clients || [])
      }
    } catch (error) {
      console.error('Failed to load clients:', error)
      toast.error('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClient = async () => {
    if (!newClient.entity_name || !newClient.entity_code) {
      toast.error('Please fill in required fields')
      return
    }

    try {
      const response = await fetch('/api/v1/audit/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_client',
          data: {
            ...newClient,
            organization_id: `gspu_client_${newClient.entity_code?.toLowerCase().replace(/[^a-z0-9]/g, '_')}_org`
          }
        })
      })

      if (response.ok) {
        toast.success('Client created successfully')
        setShowAddModal(false)
        loadClients()
        resetNewClient()
      } else {
        toast.error('Failed to create client')
      }
    } catch (error) {
      toast.error('Connection error')
    }
  }

  const resetNewClient = () => {
    setNewClient({
      entity_name: '',
      entity_code: '',
      entity_type: 'audit_client',
      status: 'prospective',
      metadata: {
        client_type: 'private',
        risk_rating: 'moderate',
        industry_code: '',
        annual_revenue: 0,
        total_assets: 0,
        public_interest_entity: false,
        incorporation_date: '',
        tax_id: '',
        registration_number: '',
        address: {
          street: '',
          city: '',
          state: '',
          country: 'Cyprus',
          postal_code: ''
        },
        contact: {
          primary_contact: '',
          phone: '',
          email: '',
          website: ''
        },
        audit_history: []
      }
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'prospective': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'moderate': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'public': return 'bg-purple-100 text-purple-800'
      case 'private': return 'bg-blue-100 text-blue-800'
      case 'non_profit': return 'bg-green-100 text-green-800'
      case 'government': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Calculate statistics
  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    highRisk: clients.filter(c => c.metadata.risk_rating === 'high').length,
    totalRevenue: clients.reduce((sum, c) => sum + (c.metadata.annual_revenue || 0), 0)
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="container mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Audit Clients</h1>
                <p className="text-gray-600">Manage your audit client portfolio and compliance</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Client
            </Button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Clients</p>
                    <p className="text-3xl font-bold">{stats.total}</p>
                  </div>
                  <Building2 className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Active Engagements</p>
                    <p className="text-3xl font-bold text-green-600">{stats.active}</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">High Risk Clients</p>
                    <p className="text-3xl font-bold text-red-600">{stats.highRisk}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold">${(stats.totalRevenue / 1000000).toFixed(1)}M</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-emerald-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-600" />
                  <Input
                    placeholder="Search by name, code, industry, city, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-600" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="prospective">Prospective</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="non_profit">Non-Profit</SelectItem>
                      <SelectItem value="government">Government</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Results Info */}
          {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold">{filteredClients.length}</span> of {clients.length} clients
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setTypeFilter('all')
                }}
              >
                Clear filters
              </Button>
            </div>
          )}

          {/* Clients Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading clients...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map((client) => (
                <Card 
                  key={client.id} 
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                  onClick={() => router.push(`/audit-progressive/clients/${client.id}?org=${encodeURIComponent(client.organization_id)}&gspu_id=${encodeURIComponent(client.entity_code)}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-bold text-gray-900 mb-1">
                          {client.entity_name}
                        </CardTitle>
                        <p className="text-sm text-gray-600 font-mono">{client.entity_code}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getStatusColor(client.status)}>
                        {client.status}
                      </Badge>
                      <Badge className={getTypeColor(client.metadata.client_type)}>
                        {client.metadata.client_type.replace('_', ' ')}
                      </Badge>
                      <Badge className={getRiskColor(client.metadata.risk_rating)}>
                        {client.metadata.risk_rating} risk
                      </Badge>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">
                          {client.metadata.address.city}, {client.metadata.address.country}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{client.metadata.contact.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{client.metadata.contact.phone}</span>
                      </div>
                    </div>

                    {/* Financial Info */}
                    <div className="pt-3 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Annual Revenue</span>
                        <span className="font-semibold">
                          ${(client.metadata.annual_revenue / 1000000).toFixed(1)}M
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-gray-600">Industry</span>
                        <span className="font-medium">{client.metadata.industry_code}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredClients.length === 0 && !loading && (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Start by adding your first client'}
              </p>
              {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Client
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Add Client Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="entity_name">Client Name *</Label>
                    <Input
                      id="entity_name"
                      value={newClient.entity_name}
                      onChange={(e) => setNewClient({ 
                        ...newClient, 
                        entity_name: e.target.value 
                      })}
                      placeholder="Cyprus Trading Ltd"
                    />
                  </div>
                  <div>
                    <Label htmlFor="entity_code">Client Code *</Label>
                    <Input
                      id="entity_code"
                      value={newClient.entity_code}
                      onChange={(e) => setNewClient({ 
                        ...newClient, 
                        entity_code: e.target.value 
                      })}
                      placeholder="CLI-2025-001"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={newClient.status} 
                      onValueChange={(value: any) => setNewClient({ 
                        ...newClient, 
                        status: value 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prospective">Prospective</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="client_type">Client Type</Label>
                    <Select 
                      value={newClient.metadata?.client_type} 
                      onValueChange={(value: any) => setNewClient({ 
                        ...newClient, 
                        metadata: { ...newClient.metadata!, client_type: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="non_profit">Non-Profit</SelectItem>
                        <SelectItem value="government">Government</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="risk_rating">Risk Rating</Label>
                    <Select 
                      value={newClient.metadata?.risk_rating} 
                      onValueChange={(value: any) => setNewClient({ 
                        ...newClient, 
                        metadata: { ...newClient.metadata!, risk_rating: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Company Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Company Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="industry_code">Industry</Label>
                    <Input
                      id="industry_code"
                      value={newClient.metadata?.industry_code}
                      onChange={(e) => setNewClient({ 
                        ...newClient, 
                        metadata: { ...newClient.metadata!, industry_code: e.target.value }
                      })}
                      placeholder="Manufacturing"
                    />
                  </div>
                  <div>
                    <Label htmlFor="incorporation_date">Incorporation Date</Label>
                    <Input
                      id="incorporation_date"
                      type="date"
                      value={newClient.metadata?.incorporation_date}
                      onChange={(e) => setNewClient({ 
                        ...newClient, 
                        metadata: { ...newClient.metadata!, incorporation_date: e.target.value }
                      })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tax_id">Tax ID</Label>
                    <Input
                      id="tax_id"
                      value={newClient.metadata?.tax_id}
                      onChange={(e) => setNewClient({ 
                        ...newClient, 
                        metadata: { ...newClient.metadata!, tax_id: e.target.value }
                      })}
                      placeholder="12345678"
                    />
                  </div>
                  <div>
                    <Label htmlFor="registration_number">Registration Number</Label>
                    <Input
                      id="registration_number"
                      value={newClient.metadata?.registration_number}
                      onChange={(e) => setNewClient({ 
                        ...newClient, 
                        metadata: { ...newClient.metadata!, registration_number: e.target.value }
                      })}
                      placeholder="HE123456"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Address</h3>
                <div>
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={newClient.metadata?.address.street}
                    onChange={(e) => setNewClient({ 
                      ...newClient, 
                      metadata: { 
                        ...newClient.metadata!, 
                        address: { ...newClient.metadata!.address, street: e.target.value }
                      }
                    })}
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={newClient.metadata?.address.city}
                      onChange={(e) => setNewClient({ 
                        ...newClient, 
                        metadata: { 
                          ...newClient.metadata!, 
                          address: { ...newClient.metadata!.address, city: e.target.value }
                        }
                      })}
                      placeholder="Nicosia"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={newClient.metadata?.address.state}
                      onChange={(e) => setNewClient({ 
                        ...newClient, 
                        metadata: { 
                          ...newClient.metadata!, 
                          address: { ...newClient.metadata!.address, state: e.target.value }
                        }
                      })}
                      placeholder="Nicosia"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      value={newClient.metadata?.address.postal_code}
                      onChange={(e) => setNewClient({ 
                        ...newClient, 
                        metadata: { 
                          ...newClient.metadata!, 
                          address: { ...newClient.metadata!.address, postal_code: e.target.value }
                        }
                      })}
                      placeholder="1000"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primary_contact">Primary Contact</Label>
                    <Input
                      id="primary_contact"
                      value={newClient.metadata?.contact.primary_contact}
                      onChange={(e) => setNewClient({ 
                        ...newClient, 
                        metadata: { 
                          ...newClient.metadata!, 
                          contact: { ...newClient.metadata!.contact, primary_contact: e.target.value }
                        }
                      })}
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newClient.metadata?.contact.phone}
                      onChange={(e) => setNewClient({ 
                        ...newClient, 
                        metadata: { 
                          ...newClient.metadata!, 
                          contact: { ...newClient.metadata!.contact, phone: e.target.value }
                        }
                      })}
                      placeholder="+357 12345678"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newClient.metadata?.contact.email}
                      onChange={(e) => setNewClient({ 
                        ...newClient, 
                        metadata: { 
                          ...newClient.metadata!, 
                          contact: { ...newClient.metadata!.contact, email: e.target.value }
                        }
                      })}
                      placeholder="contact@company.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={newClient.metadata?.contact.website}
                      onChange={(e) => setNewClient({ 
                        ...newClient, 
                        metadata: { 
                          ...newClient.metadata!, 
                          contact: { ...newClient.metadata!.contact, website: e.target.value }
                        }
                      })}
                      placeholder="https://company.com"
                    />
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Financial Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="annual_revenue">Annual Revenue</Label>
                    <Input
                      id="annual_revenue"
                      type="number"
                      value={newClient.metadata?.annual_revenue}
                      onChange={(e) => setNewClient({ 
                        ...newClient, 
                        metadata: { ...newClient.metadata!, annual_revenue: parseFloat(e.target.value) || 0 }
                      })}
                      placeholder="1000000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="total_assets">Total Assets</Label>
                    <Input
                      id="total_assets"
                      type="number"
                      value={newClient.metadata?.total_assets}
                      onChange={(e) => setNewClient({ 
                        ...newClient, 
                        metadata: { ...newClient.metadata!, total_assets: parseFloat(e.target.value) || 0 }
                      })}
                      placeholder="5000000"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateClient}>
                Create Client
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}