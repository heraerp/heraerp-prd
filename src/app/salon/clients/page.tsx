'use client'

import React, { useState, useEffect } from 'react'
import '../salon-styles.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SalonTeamsSidebar } from '@/components/salon-progressive/SalonTeamsSidebar'
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
  TestTube,
  UserPlus,
  ArrowLeft,
  Sparkles,
  Crown,
  Users
} from 'lucide-react'
import Link from 'next/link'

// Progressive Demo Data
const initialClients = [
  {
    id: 1,
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '(555) 123-4567',
    address: '123 Main St, City, ST 12345',
    dateOfBirth: '1992-05-15',
    preferences: 'Prefers Emma as stylist, allergic to sulfates',
    notes: 'Regular customer, always books monthly appointments',
    totalSpent: 1240,
    visits: 12,
    lastVisit: '2025-01-05',
    favoriteServices: ['Haircut & Style', 'Hair Color'],
    loyaltyTier: 'Gold',
    createdDate: '2024-06-15',
    status: 'active'
  },
  {
    id: 2,
    name: 'Mike Chen',
    email: 'mike.chen@email.com',
    phone: '(555) 987-6543',
    address: '456 Oak Ave, City, ST 12345',
    dateOfBirth: '1988-09-22',
    preferences: 'Quick service, prefers David',
    notes: 'Busy schedule, likes early morning appointments',
    totalSpent: 380,
    visits: 8,
    lastVisit: '2025-01-02',
    favoriteServices: ['Beard Trim', 'Quick Cut'],
    loyaltyTier: 'Silver',
    createdDate: '2024-08-20',
    status: 'active'
  },
  {
    id: 3,
    name: 'Lisa Wang',
    email: 'lisa.wang@email.com',
    phone: '(555) 456-7890',
    address: '789 Pine St, City, ST 12345',
    dateOfBirth: '1995-12-08',
    preferences: 'Loves trying new colors, experimental styles',
    notes: 'Social media influencer, takes lots of photos',
    totalSpent: 2150,
    visits: 18,
    lastVisit: '2025-01-08',
    favoriteServices: ['Hair Color', 'Styling', 'Treatment'],
    loyaltyTier: 'Platinum',
    createdDate: '2024-03-10',
    status: 'vip'
  },
  {
    id: 4,
    name: 'Emma Rodriguez',
    email: 'emma.rodriguez@email.com',
    phone: '(555) 321-9876',
    address: '321 Elm St, City, ST 12345',
    dateOfBirth: '1990-08-14',
    preferences: 'Natural products only, eco-conscious',
    notes: 'Wedding coming up next month, wants special treatment',
    totalSpent: 650,
    visits: 6,
    lastVisit: '2025-01-07',
    favoriteServices: ['Organic Treatments', 'Bridal Style'],
    loyaltyTier: 'Gold',
    createdDate: '2024-09-12',
    status: 'active'
  }
]

interface Client {
  id: number
  name: string
  email: string
  phone: string
  address: string
  dateOfBirth: string
  preferences: string
  notes: string
  totalSpent: number
  visits: number
  lastVisit: string
  favoriteServices: string[]
  loyaltyTier: string
  createdDate: string
  status: 'active' | 'inactive' | 'vip'
}

export default function ClientsProgressive() {
  const [testMode, setTestMode] = useState(true)
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [hasChanges, setHasChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
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

  // Filter clients based on search and status
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.phone.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleSaveProgress = () => {
    setLastSaved(new Date())
    setHasChanges(false)
    console.log('Client data saved:', clients)
  }

  const handleAddClient = () => {
    if (!newClient.name || !newClient.email) return

    const client: Client = {
      id: Date.now(),
      ...newClient,
      totalSpent: 0,
      visits: 0,
      lastVisit: 'Never',
      favoriteServices: [],
      loyaltyTier: 'Bronze',
      status: 'active',
      createdDate: new Date().toISOString().split('T')[0]
    }

    setClients(prev => [...prev, client])
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
    setHasChanges(true)
  }

  const handleDeleteClient = (id: number) => {
    setClients(prev => prev.filter(c => c.id !== id))
    setHasChanges(true)
    setSelectedClient(null)
  }

  const handleStatusChange = (id: number, status: Client['status']) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, status } : c))
    setHasChanges(true)
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
      totalRevenue: clients.reduce((sum, c) => sum + c.totalSpent, 0),
      avgSpend: Math.round(clients.reduce((sum, c) => sum + c.totalSpent, 0) / clients.length)
    }
  }

  const stats = getClientStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex">
      {/* Teams-Style Sidebar */}
      <SalonTeamsSidebar />
      
      <div className="flex-1 flex flex-col ml-16">
        {/* Progressive Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" asChild>
                  <Link href="/salon-progressive">
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
                {testMode && hasChanges && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveProgress}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Save className="h-4 w-4" />
                    Save Progress
                  </Button>
                )}

                {lastSaved && (
                  <div className="text-xs text-gray-500">
                    Saved: {lastSaved.toLocaleTimeString()}
                  </div>
                )}

                <Badge variant="secondary" className="flex items-center gap-1">
                  <TestTube className="h-3 w-3" />
                  Test Mode
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
                              <p className="font-medium">{client.name}</p>
                              <p className="text-sm text-gray-600">{client.email}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(client.status)}>
                                {client.status.toUpperCase()}
                              </Badge>
                              <Badge className={getTierColor(client.loyaltyTier)}>
                                {client.loyaltyTier}
                              </Badge>
                            </div>
                            <div className="text-right text-sm">
                              <p className="font-medium text-green-600">${client.totalSpent}</p>
                              <p className="text-gray-500">{client.visits} visits</p>
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
                        disabled={!newClient.name || !newClient.email}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Client
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowAddForm(false)}
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
                      <h3 className="font-semibold text-lg">{selectedClient.name}</h3>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <Badge className={getStatusColor(selectedClient.status)}>
                          {selectedClient.status.toUpperCase()}
                        </Badge>
                        <Badge className={getTierColor(selectedClient.loyaltyTier)}>
                          {selectedClient.loyaltyTier} Member
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{selectedClient.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{selectedClient.phone}</span>
                      </div>
                      {selectedClient.address && (
                        <div className="flex items-center gap-3 text-sm">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{selectedClient.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>Last visit: {selectedClient.lastVisit}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-1" />
                        <p className="font-semibold text-green-600">${selectedClient.totalSpent}</p>
                        <p className="text-xs text-gray-600">Total Spent</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <Star className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                        <p className="font-semibold text-blue-600">{selectedClient.visits}</p>
                        <p className="text-xs text-gray-600">Visits</p>
                      </div>
                    </div>

                    {selectedClient.favoriteServices.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Favorite Services</Label>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selectedClient.favoriteServices.map((service, index) => (
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

          {/* Progressive Features Notice */}
          {testMode && (
            <Card className="mt-6 bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TestTube className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Test Mode Active</p>
                    <p className="text-sm text-blue-700">
                      Add, edit, and manage clients freely. Track VIP status, preferences, and visit history. 
                      All changes are saved locally in test mode. Click "Save Progress" to persist your client database.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}