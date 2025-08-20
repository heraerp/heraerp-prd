'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
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
  UserPlus,
  ArrowLeft,
  AlertCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/DualAuthProvider'
import { useCustomers } from '@/hooks/useCustomers'
import { useUserContext } from '@/hooks/useUserContext'
import { 
  transformToUICustomer, 
  filterCustomers, 
  getTierDisplayProps,
  formatPhoneNumber 
} from '@/lib/transformers/customer-transformer'

interface NewCustomerForm {
  name: string
  email: string
  phone: string
  address: string
  dateOfBirth: string
  preferences: string
  notes: string
}

export default function CustomersProduction() {
  const { isAuthenticated } = useAuth()
  const { organizationId, userContext, loading: contextLoading } = useUserContext()

  const { 
    customers, 
    stats, 
    loading, 
    error, 
    refetch, 
    createCustomer, 
    updateCustomer, 
    deleteCustomer 
  } = useCustomers(organizationId)

  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // New customer form state
  const [newCustomer, setNewCustomer] = useState<NewCustomerForm>({
    name: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    preferences: '',
    notes: ''
  })

  // Transform customers to UI format
  const uiCustomers = useMemo(() => 
    customers.map(transformToUICustomer),
    [customers]
  )

  // Filter customers based on search
  const filteredCustomers = useMemo(() => 
    filterCustomers(uiCustomers, searchTerm),
    [uiCustomers, searchTerm]
  )

  // Get selected customer details
  const selectedCustomerData = useMemo(() => 
    uiCustomers.find(c => c.id === selectedCustomer),
    [uiCustomers, selectedCustomer]
  )

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.email) {
      setFormError('Name and email are required')
      return
    }

    setIsCreating(true)
    setFormError(null)

    try {
      await createCustomer({
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone,
        address: newCustomer.address,
        dateOfBirth: newCustomer.dateOfBirth,
        preferences: newCustomer.preferences,
        notes: newCustomer.notes
      })

      // Reset form
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
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create customer')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteCustomer(customerId)
      setSelectedCustomer(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete customer')
    } finally {
      setIsDeleting(false)
    }
  }

  const getTierColor = (tier: string) => {
    const props = getTierDisplayProps(tier)
    return `${props.bgClass} ${props.textClass} ${props.borderClass}`
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access customer management.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (contextLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-pink-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (!organizationId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Organization not found. Please contact support.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
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
                  Customer Management
                </h1>
                <p className="text-sm text-gray-600">Manage your clients and their preferences</p>
              </div>
            </div>
            <div className="text-right">
              {userContext && (
                <>
                  <p className="text-sm font-medium">{userContext.user.name}</p>
                  <p className="text-xs text-gray-600">{userContext.organization.name}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>

        {/* Customer Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {loading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <Skeleton className="h-12 w-full" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{stats.totalCustomers}</p>
                    <p className="text-xs text-gray-600">Total Customers</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      ${stats.totalRevenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600">Total Revenue</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      ${stats.avgSpend}
                    </p>
                    <p className="text-xs text-gray-600">Avg Spend</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-pink-600">
                      {stats.vipCount}
                    </p>
                    <p className="text-xs text-gray-600">VIP Clients</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
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
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <Skeleton className="h-20 w-full" />
                      </div>
                    ))}
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'No customers found matching your search.' : 'No customers yet.'}
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredCustomers.map((customer) => (
                      <div 
                        key={customer.id} 
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedCustomer === customer.id 
                            ? 'border-pink-300 bg-pink-50' 
                            : 'border-gray-200 hover:border-pink-200 hover:bg-pink-25'
                        }`}
                        onClick={() => setSelectedCustomer(customer.id)}
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
                )}
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
                  {formError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{formError}</AlertDescription>
                    </Alert>
                  )}
                  
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
                      disabled={!newCustomer.name || !newCustomer.email || isCreating}
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Customer
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowAddForm(false)
                        setFormError(null)
                      }}
                      disabled={isCreating}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : selectedCustomerData ? (
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
                      onClick={() => handleDeleteCustomer(selectedCustomerData.id)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center pb-4 border-b">
                    <div className="h-16 w-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg">{selectedCustomerData.name}</h3>
                    <Badge className={getTierColor(selectedCustomerData.loyaltyTier)}>
                      {selectedCustomerData.loyaltyTier} Member
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{selectedCustomerData.email}</span>
                    </div>
                    {selectedCustomerData.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{formatPhoneNumber(selectedCustomerData.phone)}</span>
                      </div>
                    )}
                    {selectedCustomerData.address && (
                      <div className="flex items-center gap-3 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{selectedCustomerData.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Last visit: {selectedCustomerData.lastVisit}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-1" />
                      <p className="font-semibold text-green-600">${selectedCustomerData.totalSpent}</p>
                      <p className="text-xs text-gray-600">Total Spent</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <Star className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                      <p className="font-semibold text-blue-600">{selectedCustomerData.visits}</p>
                      <p className="text-xs text-gray-600">Visits</p>
                    </div>
                  </div>

                  {selectedCustomerData.favoriteServices.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Favorite Services</Label>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedCustomerData.favoriteServices.map((service, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedCustomerData.preferences && (
                    <div>
                      <Label className="text-sm font-medium">Preferences</Label>
                      <p className="text-sm text-gray-600 mt-1">{selectedCustomerData.preferences}</p>
                    </div>
                  )}

                  {selectedCustomerData.notes && (
                    <div>
                      <Label className="text-sm font-medium">Notes</Label>
                      <p className="text-sm text-gray-600 mt-1">{selectedCustomerData.notes}</p>
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
      </div>
    </div>
  )
}