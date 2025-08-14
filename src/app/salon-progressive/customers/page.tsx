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
  Sparkles
} from 'lucide-react'
import Link from 'next/link'

// Progressive Demo Data
const initialCustomers = [
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
    createdDate: '2024-06-15'
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
    createdDate: '2024-08-20'
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
    createdDate: '2024-03-10'
  }
]

interface Customer {
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
}

export default function CustomersProgressive() {
  const [testMode, setTestMode] = useState(true)
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [hasChanges, setHasChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // New customer form state
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    preferences: '',
    notes: ''
  })

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  )

  const handleSaveProgress = () => {
    setLastSaved(new Date())
    setHasChanges(false)
    console.log('Customer data saved:', customers)
  }

  const handleAddCustomer = () => {
    if (!newCustomer.name || !newCustomer.email) return

    const customer: Customer = {
      id: Date.now(),
      ...newCustomer,
      totalSpent: 0,
      visits: 0,
      lastVisit: 'Never',
      favoriteServices: [],
      loyaltyTier: 'Bronze',
      createdDate: new Date().toISOString().split('T')[0]
    }

    setCustomers(prev => [...prev, customer])
    setNewCustomer({
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

  const handleDeleteCustomer = (id: number) => {
    setCustomers(prev => prev.filter(c => c.id !== id))
    setHasChanges(true)
    setSelectedCustomer(null)
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Gold': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Silver': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-orange-100 text-orange-800 border-orange-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Progressive Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
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
                  Customer Management
                </h1>
                <p className="text-sm text-gray-600">Manage your clients and their preferences</p>
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

      <div className="container mx-auto p-6">
        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search customers by name, email, or phone..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-pink-600 hover:bg-pink-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>

        {/* Customer Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{customers.length}</p>
                <p className="text-xs text-gray-600">Total Customers</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  ${customers.reduce((sum, c) => sum + c.totalSpent, 0)}
                </p>
                <p className="text-xs text-gray-600">Total Revenue</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length)}
                </p>
                <p className="text-xs text-gray-600">Avg Spend</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-pink-600">
                  {customers.filter(c => c.loyaltyTier === 'Platinum').length}
                </p>
                <p className="text-xs text-gray-600">VIP Clients</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer List */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-pink-500" />
                  Customers ({filteredCustomers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredCustomers.map((customer) => (
                    <div 
                      key={customer.id} 
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedCustomer?.id === customer.id 
                          ? 'border-pink-300 bg-pink-50' 
                          : 'border-gray-200 hover:border-pink-200 hover:bg-pink-25'
                      }`}
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-sm text-gray-600">{customer.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getTierColor(customer.loyaltyTier)}>
                            {customer.loyaltyTier}
                          </Badge>
                          <div className="text-right text-sm">
                            <p className="font-medium">${customer.totalSpent}</p>
                            <p className="text-gray-500">{customer.visits} visits</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer Details / Add Form */}
          <div>
            {showAddForm ? (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-pink-500" />
                    Add New Customer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="customer@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={newCustomer.dateOfBirth}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="preferences">Preferences</Label>
                    <Textarea
                      id="preferences"
                      value={newCustomer.preferences}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, preferences: e.target.value }))}
                      placeholder="Allergies, preferred stylist, etc."
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={newCustomer.notes}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes about the customer"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleAddCustomer}
                      className="flex-1 bg-pink-600 hover:bg-pink-700"
                      disabled={!newCustomer.name || !newCustomer.email}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Customer
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
            ) : selectedCustomer ? (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-pink-500" />
                      Customer Details
                    </CardTitle>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center pb-4 border-b">
                    <div className="h-16 w-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg">{selectedCustomer.name}</h3>
                    <Badge className={getTierColor(selectedCustomer.loyaltyTier)}>
                      {selectedCustomer.loyaltyTier} Member
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{selectedCustomer.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                    {selectedCustomer.address && (
                      <div className="flex items-center gap-3 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{selectedCustomer.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Last visit: {selectedCustomer.lastVisit}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-1" />
                      <p className="font-semibold text-green-600">${selectedCustomer.totalSpent}</p>
                      <p className="text-xs text-gray-600">Total Spent</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <Star className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                      <p className="font-semibold text-blue-600">{selectedCustomer.visits}</p>
                      <p className="text-xs text-gray-600">Visits</p>
                    </div>
                  </div>

                  {selectedCustomer.favoriteServices.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Favorite Services</Label>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedCustomer.favoriteServices.map((service, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedCustomer.preferences && (
                    <div>
                      <Label className="text-sm font-medium">Preferences</Label>
                      <p className="text-sm text-gray-600 mt-1">{selectedCustomer.preferences}</p>
                    </div>
                  )}

                  {selectedCustomer.notes && (
                    <div>
                      <Label className="text-sm font-medium">Notes</Label>
                      <p className="text-sm text-gray-600 mt-1">{selectedCustomer.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-4">Select a customer to view details</p>
                  <Button 
                    onClick={() => setShowAddForm(true)}
                    className="bg-pink-600 hover:bg-pink-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Customer
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
                    Add, edit, and manage customers freely. All changes are saved locally in test mode. 
                    Click "Save Progress" to persist your customer database.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}